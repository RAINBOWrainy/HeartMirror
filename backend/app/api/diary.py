"""
Diary API Routes
情绪日记接口
"""
import uuid
from datetime import datetime, timezone
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.core.security import decrypt_data, encrypt_data
from app.dependencies import get_db
from app.models.emotion import EmotionRecord, EmotionType
from app.models.user import User

router = APIRouter()


class DiaryCreate(BaseModel):
    """创建日记请求"""
    content: str
    mood: Optional[str] = None
    tags: Optional[List[str]] = None


class DiaryResponse(BaseModel):
    """日记响应"""
    id: uuid.UUID
    mood: Optional[str]
    tags: Optional[List[str]]
    emotion: Optional[str]
    emotion_intensity: Optional[float]
    created_at: datetime

    # 注意：内容不直接返回，需要通过解密接口获取


class DiaryDetailResponse(DiaryResponse):
    """日记详情响应（包含内容）"""
    content: str


@router.post("", response_model=DiaryResponse, status_code=status.HTTP_201_CREATED)
async def create_diary(
    data: DiaryCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    创建情绪日记

    - 加密存储日记内容
    - 自动分析情绪
    """
    # 加密日记内容
    encrypted_content = encrypt_data(data.content)

    # TODO: 调用情绪识别Agent分析情绪
    detected_emotion = EmotionType.NEUTRAL
    emotion_intensity = 0.5

    # 如果用户指定了心情，使用用户的
    if data.mood:
        try:
            detected_emotion = EmotionType(data.mood)
        except ValueError:
            pass

    # 创建情绪记录
    record = EmotionRecord(
        user_id=current_user.id,
        primary_emotion=detected_emotion,
        intensity=emotion_intensity,
        source_type="diary",
        encrypted_text=encrypted_content,
        context_tags=data.tags,
        is_diary=True,
    )

    db.add(record)
    await db.commit()
    await db.refresh(record)

    return DiaryResponse(
        id=record.id,
        mood=data.mood,
        tags=data.tags,
        emotion=record.primary_emotion.value,
        emotion_intensity=record.intensity,
        created_at=record.recorded_at,
    )


@router.get("", response_model=List[DiaryResponse])
async def list_diaries(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    limit: int = 20,
    offset: int = 0,
):
    """获取日记列表"""
    result = await db.execute(
        select(EmotionRecord)
        .where(EmotionRecord.user_id == current_user.id)
        .where(EmotionRecord.is_diary == True)
        .order_by(EmotionRecord.recorded_at.desc())
        .offset(offset)
        .limit(limit)
    )
    records = result.scalars().all()

    return [
        DiaryResponse(
            id=r.id,
            mood=r.primary_emotion.value,
            tags=r.context_tags,
            emotion=r.primary_emotion.value,
            emotion_intensity=r.intensity,
            created_at=r.recorded_at,
        )
        for r in records
    ]


@router.get("/{diary_id}", response_model=DiaryDetailResponse)
async def get_diary(
    diary_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    获取日记详情

    解密并返回日记内容
    """
    result = await db.execute(
        select(EmotionRecord)
        .where(EmotionRecord.id == diary_id)
        .where(EmotionRecord.user_id == current_user.id)
        .where(EmotionRecord.is_diary == True)
    )
    record = result.scalar_one_or_none()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="日记不存在",
        )

    # 解密内容
    content = ""
    if record.encrypted_text:
        try:
            content = decrypt_data(record.encrypted_text)
        except Exception:
            content = "[内容解密失败]"

    return DiaryDetailResponse(
        id=record.id,
        mood=record.primary_emotion.value,
        tags=record.context_tags,
        emotion=record.primary_emotion.value,
        emotion_intensity=record.intensity,
        created_at=record.recorded_at,
        content=content,
    )


@router.delete("/{diary_id}")
async def delete_diary(
    diary_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """删除日记"""
    result = await db.execute(
        select(EmotionRecord)
        .where(EmotionRecord.id == diary_id)
        .where(EmotionRecord.user_id == current_user.id)
        .where(EmotionRecord.is_diary == True)
    )
    record = result.scalar_one_or_none()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="日记不存在",
        )

    await db.delete(record)
    await db.commit()

    return {"message": "日记已删除"}