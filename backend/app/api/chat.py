"""
Chat API Routes
对话接口
"""
import uuid
import json
from typing import Annotated, List, Optional, Dict

from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.auth import get_current_user
from app.dependencies import get_db
from app.models.session import ChatMessage, ChatSession, MessageRole
from app.models.user import User
from app.schemas.chat import (
    ChatSessionCreate,
    ChatSessionResponse,
    ChatMessageCreate,
    ChatMessageResponse,
    ChatMessageStream,
)
from app.agents.orchestrator import AgentOrchestrator

router = APIRouter()

# 全局Orchestrator实例缓存
_orchestrators: Dict[str, AgentOrchestrator] = {}

# WebSocket连接管理器
class ConnectionManager:
    """WebSocket连接管理器"""

    def __init__(self):
        # session_id -> list of websocket connections
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, session_id: str):
        """接受WebSocket连接"""
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = []
        self.active_connections[session_id].append(websocket)

    def disconnect(self, websocket: WebSocket, session_id: str):
        """断开WebSocket连接"""
        if session_id in self.active_connections:
            if websocket in self.active_connections[session_id]:
                self.active_connections[session_id].remove(websocket)
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]

    async def send_message(self, session_id: str, message: dict):
        """向指定会话的所有连接发送消息"""
        if session_id in self.active_connections:
            for connection in self.active_connections[session_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

    async def broadcast(self, message: dict):
        """向所有连接广播消息"""
        for session_id in self.active_connections:
            await self.send_message(session_id, message)


# 全局连接管理器实例
manager = ConnectionManager()


class ChatRequest(BaseModel):
    """聊天请求"""
    session_id: Optional[uuid.UUID] = None
    message: str


class ChatResponse(BaseModel):
    """聊天响应"""
    session_id: uuid.UUID
    reply: str
    emotion_detected: Optional[str] = None
    emotion_intensity: Optional[float] = None
    intervention_suggested: Optional[bool] = False


@router.post("/sessions", response_model=ChatSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    session_data: ChatSessionCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """创建新的对话会话"""
    session = ChatSession(
        user_id=current_user.id,
        title=session_data.title,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    return session


@router.get("/sessions", response_model=List[ChatSessionResponse])
async def list_sessions(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    limit: int = 20,
    offset: int = 0,
):
    """获取用户的对话会话列表"""
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.user_id == current_user.id)
        .where(ChatSession.status != "deleted")
        .order_by(ChatSession.last_message_at.desc().nulls_first())
        .offset(offset)
        .limit(limit)
    )
    sessions = result.scalars().all()
    return sessions


@router.get("/sessions/{session_id}", response_model=ChatSessionResponse)
async def get_session(
    session_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """获取对话会话详情"""
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.id == session_id)
        .where(ChatSession.user_id == current_user.id)
        .options(selectinload(ChatSession.messages))
    )
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="会话不存在",
        )

    return session


@router.post("/send", response_model=ChatResponse)
async def send_message(
    request: ChatRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    发送消息并获取AI回复

    流程：
    1. 获取或创建会话
    2. 情绪识别Agent分析用户消息
    3. 根据情绪触发相应Agent
    4. 生成AI回复
    """
    from app.core.security import encrypt_data
    from datetime import datetime, timezone

    # 获取或创建会话
    if request.session_id:
        result = await db.execute(
            select(ChatSession)
            .where(ChatSession.id == request.session_id)
            .where(ChatSession.user_id == current_user.id)
        )
        session = result.scalar_one_or_none()
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="会话不存在",
            )
    else:
        session = ChatSession(user_id=current_user.id)
        db.add(session)
        await db.flush()

    # 保存用户消息
    user_message = ChatMessage(
        session_id=session.id,
        role=MessageRole.USER,
        encrypted_content=encrypt_data(request.message),
    )
    db.add(user_message)

    # 获取或创建Orchestrator实例
    session_key = str(session.id)
    if session_key not in _orchestrators:
        _orchestrators[session_key] = AgentOrchestrator()
    orchestrator = _orchestrators[session_key]

    # 构建会话上下文
    session_context = {
        "session_id": str(session.id),
        "user_id": str(current_user.id),
        "message_count": session.message_count,
    }

    # 调用Agent协调器处理消息
    try:
        result = await orchestrator.process_message(
            user_input=request.message,
            session_context=session_context
        )
        ai_reply = result.get("response", "感谢您的分享。")
        emotion_detected = result.get("emotion_detected")
        risk_level = result.get("risk_level", "green")

        # 从上下文获取情绪强度
        emotion_data = orchestrator.context.get("emotion", {})
        emotion_intensity = emotion_data.get("intensity")

    except Exception as e:
        # 降级处理：如果Agent系统出错，返回默认回复
        ai_reply = "感谢您的分享。我正在分析您的消息，请稍等..."
        emotion_detected = None
        emotion_intensity = None
        risk_level = "green"

    # 保存AI回复
    assistant_message = ChatMessage(
        session_id=session.id,
        role=MessageRole.ASSISTANT,
        encrypted_content=encrypt_data(ai_reply),
        emotion_detected=emotion_detected,
        emotion_intensity=emotion_intensity,
        agent_name="orchestrator",
    )
    db.add(assistant_message)

    # 更新会话
    session.message_count += 2
    session.last_message_at = datetime.now(timezone.utc)

    await db.commit()

    return ChatResponse(
        session_id=session.id,
        reply=ai_reply,
        emotion_detected=emotion_detected,
        emotion_intensity=emotion_intensity,
    )


@router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """删除对话会话（软删除）"""
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.id == session_id)
        .where(ChatSession.user_id == current_user.id)
    )
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="会话不存在",
        )

    session.status = "deleted"
    await db.commit()

    return {"message": "会话已删除"}


@router.websocket("/ws/{session_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    session_id: str,
):
    """
    WebSocket实时对话端点

    提供实时双向通信，支持流式消息传输
    """
    await manager.connect(websocket, session_id)

    try:
        # 获取或创建Orchestrator实例
        if session_id not in _orchestrators:
            _orchestrators[session_id] = AgentOrchestrator()
        orchestrator = _orchestrators[session_id]

        while True:
            # 接收消息
            data = await websocket.receive_text()

            try:
                message = json.loads(data)
                user_input = message.get("content", "")
                user_id = message.get("user_id")

                if not user_input:
                    await websocket.send_json({
                        "type": "error",
                        "content": "消息内容不能为空"
                    })
                    continue

                # 发送"正在输入"状态
                await websocket.send_json({
                    "type": "typing",
                    "content": ""
                })

                # 构建会话上下文
                session_context = {
                    "session_id": session_id,
                    "user_id": user_id,
                }

                # 调用Agent协调器处理消息
                result = await orchestrator.process_message(
                    user_input=user_input,
                    session_context=session_context
                )

                # 发送AI回复
                response = {
                    "type": "message",
                    "content": result.get("response", "感谢您的分享。"),
                    "emotion_detected": result.get("emotion_detected"),
                    "risk_level": result.get("risk_level", "green"),
                    "stage": result.get("stage"),
                }
                await websocket.send_json(response)

            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "error",
                    "content": "无效的消息格式"
                })
            except Exception as e:
                await websocket.send_json({
                    "type": "error",
                    "content": f"处理消息时出错: {str(e)}"
                })

    except WebSocketDisconnect:
        manager.disconnect(websocket, session_id)
    except Exception as e:
        manager.disconnect(websocket, session_id)
        try:
            await websocket.close()
        except Exception:
            pass