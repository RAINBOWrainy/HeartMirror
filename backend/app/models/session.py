"""
Chat Session Model
对话会话数据模型
"""
import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List, Optional
import enum

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class MessageRole(enum.Enum):
    """消息角色"""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class ChatSession(Base):
    """
    对话会话模型

    管理用户的对话上下文
    """

    __tablename__ = "chat_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True
    )

    # 会话标题
    title: Mapped[Optional[str]] = mapped_column(
        String(200),
        nullable=True
    )

    # 会话摘要
    summary: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="AI生成的会话摘要"
    )

    # 当前状态
    status: Mapped[str] = mapped_column(
        String(20),
        default="active",
        comment="会话状态: active/archived/deleted"
    )

    # 当前阶段
    current_stage: Mapped[str] = mapped_column(
        String(30),
        default="greeting",
        comment="当前对话阶段: greeting/emotion_assessment/questionnaire/intervention/closing"
    )

    # 会话上下文（JSON格式）
    context: Mapped[Optional[dict]] = mapped_column(
        JSONB,
        nullable=True,
        comment="会话上下文信息，包含情绪历史、评估结果等"
    )

    # 活跃Agent
    active_agents: Mapped[Optional[List[str]]] = mapped_column(
        JSONB,
        nullable=True,
        comment="当前活跃的Agent列表"
    )

    # 消息计数
    message_count: Mapped[int] = mapped_column(
        Integer,
        default=0
    )

    # 时间戳
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    last_message_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    ended_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    # 关系
    user: Mapped["User"] = relationship(
        "User",
        back_populates="chat_sessions"
    )

    messages: Mapped[List["ChatMessage"]] = relationship(
        "ChatMessage",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="ChatMessage.created_at"
    )

    def __repr__(self) -> str:
        return f"<ChatSession {self.id} stage={self.current_stage}>"


class ChatMessage(Base):
    """
    对话消息模型
    """

    __tablename__ = "chat_messages"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True
    )

    # 消息角色
    role: Mapped[MessageRole] = mapped_column(
        Enum(MessageRole),
        nullable=False
    )

    # 消息内容（加密存储用户消息）
    encrypted_content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="加密的消息内容"
    )

    # 情绪标签
    emotion_detected: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        comment="检测到的情绪"
    )

    emotion_intensity: Mapped[Optional[float]] = mapped_column(
        nullable=True,
        comment="情绪强度"
    )

    # Agent信息
    agent_name: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        comment="生成此消息的Agent名称"
    )

    # 元数据
    message_metadata: Mapped[Optional[dict]] = mapped_column(
        "metadata",
        JSONB,
        nullable=True,
        comment="额外元数据"
    )

    # 时间戳
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        index=True
    )

    # 关系
    session: Mapped["ChatSession"] = relationship(
        "ChatSession",
        back_populates="messages"
    )

    def __repr__(self) -> str:
        return f"<ChatMessage role={self.role.value}>"