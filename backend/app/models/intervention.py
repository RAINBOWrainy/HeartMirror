"""
Intervention Model
干预方案数据模型
"""
import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List, Optional
import enum

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
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


class InterventionType(enum.Enum):
    """干预类型"""
    CBT = "cbt"                 # 认知行为疗法
    MINDFULNESS = "mindfulness" # 正念冥想
    BREATHING = "breathing"     # 呼吸训练
    EXERCISE = "exercise"       # 运动建议
    SOCIAL = "social"           # 社交活动
    SELF_CARE = "self_care"     # 自我关怀
    EDUCATION = "education"     # 心理教育
    BEHAVIORAL = "behavioral"   # 行为激活


class InterventionPlan(Base):
    """
    干预方案模型

    存储个性化的心理健康干预方案
    """

    __tablename__ = "intervention_plans"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # 方案名称
    name: Mapped[str] = mapped_column(
        String(200),
        nullable=False
    )

    # 干预类型
    intervention_type: Mapped[InterventionType] = mapped_column(
        Enum(InterventionType),
        nullable=False
    )

    # 方案内容（JSON格式）
    content: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
        comment="干预方案详细内容"
    )

    # 触发条件
    trigger_conditions: Mapped[Optional[dict]] = mapped_column(
        JSONB,
        nullable=True,
        comment="触发该方案的情境条件"
    )

    # 难度等级 (1-5)
    difficulty_level: Mapped[int] = mapped_column(
        Integer,
        default=1,
        comment="方案难度等级"
    )

    # 预计时长（分钟）
    estimated_duration: Mapped[int] = mapped_column(
        Integer,
        default=15,
        comment="预计完成时长"
    )

    # 有效期
    valid_from: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    valid_until: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    # 效果评估
    effectiveness_score: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        comment="干预效果评分 (0-1)"
    )

    # 状态
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True
    )

    is_recommended: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        comment="是否为系统推荐方案"
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

    # 关系
    user: Mapped["User"] = relationship(
        "User",
        back_populates="intervention_plans"
    )

    sessions: Mapped[List["InterventionSession"]] = relationship(
        "InterventionSession",
        back_populates="plan",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<InterventionPlan {self.name} type={self.intervention_type.value}>"


class InterventionSession(Base):
    """
    干预会话模型

    记录用户完成干预方案的过程
    """

    __tablename__ = "intervention_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    plan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("intervention_plans.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # 状态
    is_completed: Mapped[bool] = mapped_column(
        Boolean,
        default=False
    )

    # 实际耗时（分钟）
    actual_duration: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True
    )

    # 用户反馈
    user_rating: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        comment="用户评分 1-5"
    )

    encrypted_feedback: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="加密的用户反馈"
    )

    # 情绪变化
    emotion_before: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        comment="干预前主要情绪"
    )

    emotion_after: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        comment="干预后主要情绪"
    )

    intensity_before: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        comment="干预前情绪强度"
    )

    intensity_after: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        comment="干预后情绪强度"
    )

    # 时间戳
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    # 关系
    plan: Mapped["InterventionPlan"] = relationship(
        "InterventionPlan",
        back_populates="sessions"
    )

    def __repr__(self) -> str:
        return f"<InterventionSession completed={self.is_completed}>"

    @property
    def effectiveness(self) -> Optional[float]:
        """计算干预效果（情绪强度变化）"""
        if (
            self.intensity_before is not None
            and self.intensity_after is not None
        ):
            return self.intensity_before - self.intensity_after
        return None