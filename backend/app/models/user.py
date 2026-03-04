"""
User Model
匿名用户体系 - 不存储真实身份信息
"""
import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Boolean, DateTime, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.emotion import EmotionRecord
    from app.models.session import ChatSession
    from app.models.intervention import InterventionPlan
    from app.models.questionnaire import QuestionnaireSession


class User(Base):
    """
    用户模型 - 匿名化设计

    设计原则：
    - 不存储真实姓名、身份证号等敏感信息
    - 使用匿名标识符作为唯一标识
    - 支持端到端加密的敏感数据存储
    """

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    # 匿名标识符（用户自定义昵称或系统生成）
    anonymous_id: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False
    )

    # 加密的登录凭证（邮箱或手机号的加密形式）
    encrypted_credential: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )

    # 密码哈希
    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    # 用户画像（加密存储）
    encrypted_profile: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="加密存储的用户画像信息"
    )

    # 风险等级
    risk_level: Mapped[str] = mapped_column(
        String(20),
        default="green",
        comment="风险等级: green/yellow/orange/red"
    )

    # 状态
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True
    )

    # 同意条款
    consent_given: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        comment="用户是否同意服务条款和隐私政策"
    )

    # 免责声明确认
    disclaimer_accepted: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        comment="用户是否确认免责声明"
    )

    # 游客用户标记
    is_guest: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        comment="是否为游客用户"
    )

    # 游客会话过期时间
    guest_expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="游客会话过期时间"
    )

    # 时间戳
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    last_active_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    # 关系
    emotion_records: Mapped[List["EmotionRecord"]] = relationship(
        "EmotionRecord",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    chat_sessions: Mapped[List["ChatSession"]] = relationship(
        "ChatSession",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    intervention_plans: Mapped[List["InterventionPlan"]] = relationship(
        "InterventionPlan",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    questionnaire_sessions: Mapped[List["QuestionnaireSession"]] = relationship(
        "QuestionnaireSession",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<User {self.anonymous_id}>"

    @property
    def is_high_risk(self) -> bool:
        """是否高风险用户"""
        return self.risk_level in ("orange", "red")