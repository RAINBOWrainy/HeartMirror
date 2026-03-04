"""
Emotion Record Model
情绪记录数据模型
"""
import uuid
from datetime import datetime
from decimal import Decimal
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
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class EmotionType(enum.Enum):
    """情绪类型枚举 - 基于心理学情绪分类"""

    # 基础情绪（Ekman's Basic Emotions）
    JOY = "joy"                    # 喜悦
    SADNESS = "sadness"            # 悲伤
    ANGER = "anger"                # 愤怒
    FEAR = "fear"                  # 恐惧
    DISGUST = "disgust"            # 厌恶
    SURPRISE = "surprise"          # 惊讶

    # 扩展情绪
    ANXIETY = "anxiety"            # 焦虑
    SHAME = "shame"                # 羞耻
    GUILT = "guilt"                # 内疚
    PRIDE = "pride"                # 自豪
    HOPE = "hope"                  # 希望
    FRUSTRATION = "frustration"    # 挫败
    LONELINESS = "loneliness"      # 孤独
    CONFUSION = "confusion"        # 困惑
    CALM = "calm"                  # 平静
    NEUTRAL = "neutral"            # 中性


class EmotionRecord(Base):
    """
    情绪记录模型

    存储用户的情绪数据，支持多维度情绪分析
    """

    __tablename__ = "emotion_records"

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

    # 主要情绪
    primary_emotion: Mapped[EmotionType] = mapped_column(
        Enum(EmotionType),
        nullable=False
    )

    # 情绪强度 (0-1)
    intensity: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        comment="情绪强度值，范围0-1"
    )

    # 情绪置信度 (BERT模型输出)
    confidence: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        comment="情绪分类置信度"
    )

    # 多情绪标签（复合情绪）
    emotion_scores: Mapped[Optional[dict]] = mapped_column(
        JSONB,
        nullable=True,
        comment="多情绪分类得分"
    )

    # 触发来源
    source_type: Mapped[str] = mapped_column(
        String(20),
        default="chat",
        comment="触发类型: chat/diary/questionnaire"
    )

    source_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
        comment="来源记录ID"
    )

    # 原始文本（加密存储）
    encrypted_text: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="加密的用户输入文本"
    )

    # 情境标签
    context_tags: Mapped[Optional[List[str]]] = mapped_column(
        ARRAY(String),
        nullable=True,
        comment="情境标签：工作、学习、人际关系等"
    )

    # 是否标记为日记
    is_diary: Mapped[bool] = mapped_column(
        Boolean,
        default=False
    )

    # 时间戳
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        index=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    # 关系
    user: Mapped["User"] = relationship(
        "User",
        back_populates="emotion_records"
    )

    def __repr__(self) -> str:
        return f"<EmotionRecord {self.primary_emotion.value} intensity={self.intensity}>"

    @property
    def is_negative(self) -> bool:
        """是否为负面情绪"""
        negative_emotions = {
            EmotionType.SADNESS,
            EmotionType.ANGER,
            EmotionType.FEAR,
            EmotionType.DISGUST,
            EmotionType.ANXIETY,
            EmotionType.SHAME,
            EmotionType.GUILT,
            EmotionType.FRUSTRATION,
            EmotionType.LONELINESS,
        }
        return self.primary_emotion in negative_emotions

    @property
    def is_crisis_indicator(self) -> bool:
        """是否为危机指标情绪"""
        crisis_emotions = {
            EmotionType.FEAR,
            EmotionType.ANGER,
            EmotionType.ANXIETY,
        }
        return (
            self.primary_emotion in crisis_emotions
            and self.intensity >= 0.8
        )