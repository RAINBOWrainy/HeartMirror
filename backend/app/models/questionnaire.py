"""
Questionnaire Model
动态问卷数据模型
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


class QuestionnaireType(enum.Enum):
    """问卷类型"""
    PHQ9 = "phq9"           # 抑郁症筛查量表
    GAD7 = "gad7"           # 焦虑症筛查量表
    DASS21 = "dass21"       # 抑郁焦虑压力量表
    DYNAMIC = "dynamic"     # RAG动态生成问卷
    INITIAL = "initial"     # 初始评估问卷
    FOLLOW_UP = "follow_up" # 随访问卷


class QuestionnaireSession(Base):
    """
    问卷会话模型

    记录用户的问卷填写过程和结果
    """

    __tablename__ = "questionnaire_sessions"

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

    # 问卷类型
    questionnaire_type: Mapped[QuestionnaireType] = mapped_column(
        Enum(QuestionnaireType),
        nullable=False
    )

    # 问卷内容（JSON格式存储问题和选项）
    questions: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
        comment="问卷问题列表"
    )

    # 评估结果
    total_score: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        comment="问卷总分"
    )

    # 分维度得分
    dimension_scores: Mapped[Optional[dict]] = mapped_column(
        JSONB,
        nullable=True,
        comment="各维度得分详情"
    )

    # AI生成的评估解读（加密）
    encrypted_interpretation: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="加密的AI评估解读"
    )

    # 风险等级
    risk_level: Mapped[str] = mapped_column(
        String(20),
        default="green"
    )

    # 状态
    is_completed: Mapped[bool] = mapped_column(
        Boolean,
        default=False
    )

    current_question_index: Mapped[int] = mapped_column(
        Integer,
        default=0
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

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    # 关系
    user: Mapped["User"] = relationship(
        "User",
        back_populates="questionnaire_sessions"
    )

    answers: Mapped[List["QuestionnaireAnswer"]] = relationship(
        "QuestionnaireAnswer",
        back_populates="session",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<QuestionnaireSession {self.questionnaire_type.value} completed={self.is_completed}>"


class QuestionnaireAnswer(Base):
    """
    问卷答案模型
    """

    __tablename__ = "questionnaire_answers"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("questionnaire_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # 问题索引
    question_index: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    # 问题文本（加密）
    encrypted_question: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    # 用户答案
    answer_value: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        comment="答案数值"
    )

    # 答案文本（如果是开放式问题）
    encrypted_answer_text: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="加密的答案文本"
    )

    # 时间戳
    answered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    # 关系
    session: Mapped["QuestionnaireSession"] = relationship(
        "QuestionnaireSession",
        back_populates="answers"
    )

    def __repr__(self) -> str:
        return f"<QuestionnaireAnswer q={self.question_index} a={self.answer_value}>"