"""
Test Chat API
对话API测试
"""
import pytest
from httpx import AsyncClient
from unittest.mock import patch, AsyncMock


class TestChatAPI:
    """对话API测试类"""

    @pytest.mark.asyncio
    async def test_create_session_unauthorized(self, client: AsyncClient):
        """测试未授权创建会话"""
        response = await client.post(
            "/api/chat/sessions",
            json={"title": "测试会话"}
        )
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_list_sessions_unauthorized(self, client: AsyncClient):
        """测试未授权获取会话列表"""
        response = await client.get("/api/chat/sessions")
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_send_message_unauthorized(self, client: AsyncClient):
        """测试未授权发送消息"""
        response = await client.post(
            "/api/chat/send",
            json={"message": "你好"}
        )
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_delete_session_unauthorized(self, client: AsyncClient):
        """测试未授权删除会话"""
        response = await client.delete("/api/chat/sessions/1")
        assert response.status_code in [403, 404]


class TestChatService:
    """对话服务测试类"""

    def test_chat_request_schema(self):
        """测试对话请求schema"""
        from app.api.chat import ChatRequest
        request = ChatRequest(message="你好")
        assert request.message == "你好"
        assert request.session_id is None

    def test_chat_response_schema(self):
        """测试对话响应schema"""
        from app.api.chat import ChatResponse
        import uuid
        session_id = uuid.uuid4()
        response = ChatResponse(
            session_id=session_id,
            reply="您好！我是HeartMirror助手。"
        )
        assert response.session_id == session_id
        assert response.reply == "您好！我是HeartMirror助手。"

    @pytest.mark.asyncio
    async def test_orchestrator_initialization(self):
        """测试协调器初始化"""
        from app.agents.orchestrator import AgentOrchestrator
        orchestrator = AgentOrchestrator()
        assert orchestrator.llm is not None
        assert "emotion" in orchestrator.agents
        assert "questionnaire" in orchestrator.agents
        assert "risk" in orchestrator.agents
        assert "intervention" in orchestrator.agents


class TestWebSocketManager:
    """WebSocket管理器测试"""

    def test_connection_manager_init(self):
        """测试连接管理器初始化"""
        from app.api.chat import ConnectionManager
        manager = ConnectionManager()
        assert manager.active_connections == {}

    def test_disconnect_nonexistent(self):
        """测试断开不存在的连接"""
        from app.api.chat import ConnectionManager
        from unittest.mock import MagicMock
        manager = ConnectionManager()
        # 不应该抛出异常
        manager.disconnect(MagicMock(), "nonexistent_session")