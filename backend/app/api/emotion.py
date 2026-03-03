"""
Emotion API Routes
情绪接口
"""
import uuid
from datetime import datetime, timedelta, timezone
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.dependencies import get_db
from app.models.emotion import EmotionRecord, EmotionType
from app.models.user import User

router = APIRouter()


class EmotionRecordCreate(BaseModel):
    """创建情绪记录请求"""
    primary_emotion: str
    intensity: float
    source_type: str = "manual"
    context_tags: Optional[List[str]] = None
    encrypted_text: Optional[str] = None
    is_diary: bool = False


class EmotionRecordResponse(BaseModel):
    """情绪记录响应"""
    id: uuid.UUID
    primary_emotion: str
    intensity: float
    confidence: float
    source_type: str
    context_tags: Optional[List[str]]
    recorded_at: datetime

    class Config:
        from_attributes = True


class EmotionStatsResponse(BaseModel):
    """情绪统计响应"""
    total_records: int
    dominant_emotion: Optional[str]
    average_intensity: float
    emotion_distribution: dict
    trend: Optional[dict]


@router.post("/record", response_model=EmotionRecordResponse, status_code=201)
async def create_emotion_record(
    data: EmotionRecordCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    创建情绪记录

    可以手动记录或由系统自动分析生成
    """
    # 转换情绪类型
    try:
        emotion_type = EmotionType(data.primary_emotion)
    except ValueError:
        emotion_type = EmotionType.NEUTRAL

    record = EmotionRecord(
        user_id=current_user.id,
        primary_emotion=emotion_type,
        intensity=data.intensity,
        source_type=data.source_type,
        context_tags=data.context_tags,
        encrypted_text=data.encrypted_text,
        is_diary=data.is_diary,
    )

    db.add(record)
    await db.commit()
    await db.refresh(record)

    return EmotionRecordResponse(
        id=record.id,
        primary_emotion=record.primary_emotion.value,
        intensity=record.intensity,
        confidence=record.confidence,
        source_type=record.source_type,
        context_tags=record.context_tags,
        recorded_at=record.recorded_at,
    )


@router.get("/records", response_model=List[EmotionRecordResponse])
async def list_emotion_records(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    days: int = Query(7, ge=1, le=90),
    limit: int = Query(50, ge=1, le=200),
):
    """
    获取情绪记录列表

    按时间倒序返回最近N天的记录
    """
    start_date = datetime.now(timezone.utc) - timedelta(days=days)

    result = await db.execute(
        select(EmotionRecord)
        .where(EmotionRecord.user_id == current_user.id)
        .where(EmotionRecord.recorded_at >= start_date)
        .order_by(EmotionRecord.recorded_at.desc())
        .limit(limit)
    )
    records = result.scalars().all()

    return [
        EmotionRecordResponse(
            id=r.id,
            primary_emotion=r.primary_emotion.value,
            intensity=r.intensity,
            confidence=r.confidence,
            source_type=r.source_type,
            context_tags=r.context_tags,
            recorded_at=r.recorded_at,
        )
        for r in records
    ]


@router.get("/stats", response_model=EmotionStatsResponse)
async def get_emotion_stats(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    days: int = Query(7, ge=1, le=30),
):
    """
    获取情绪统计数据

    用于数据可视化看板
    """
    start_date = datetime.now(timezone.utc) - timedelta(days=days)

    # 获取时间范围内的记录
    result = await db.execute(
        select(EmotionRecord)
        .where(EmotionRecord.user_id == current_user.id)
        .where(EmotionRecord.recorded_at >= start_date)
    )
    records = result.scalars().all()

    if not records:
        return EmotionStatsResponse(
            total_records=0,
            dominant_emotion=None,
            average_intensity=0.0,
            emotion_distribution={},
            trend=None,
        )

    # 计算情绪分布
    emotion_counts = {}
    total_intensity = 0.0

    for record in records:
        emotion = record.primary_emotion.value
        emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
        total_intensity += record.intensity

    # 主导情绪
    dominant_emotion = max(emotion_counts, key=emotion_counts.get) if emotion_counts else None

    # 平均强度
    average_intensity = total_intensity / len(records) if records else 0.0

    # TODO: 计算趋势（使用LSTM模型）

    return EmotionStatsResponse(
        total_records=len(records),
        dominant_emotion=dominant_emotion,
        average_intensity=average_intensity,
        emotion_distribution=emotion_counts,
        trend=None,
    )


@router.get("/analyze")
async def analyze_text_emotion(
    text: str,
    current_user: Annotated[User, Depends(get_current_user)],
):
    """
    分析文本情绪

    调用情绪识别Agent分析文本中的情绪
    """
    # TODO: 调用情绪识别Agent
    # 这里返回模拟结果
    return {
        "primary_emotion": "neutral",
        "intensity": 0.5,
        "confidence": 0.85,
        "emotion_scores": {
            "joy": 0.1,
            "sadness": 0.15,
            "anger": 0.05,
            "fear": 0.1,
            "neutral": 0.6,
        },
    }