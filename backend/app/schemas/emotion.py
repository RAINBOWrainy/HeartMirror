"""
Emotion Schemas
"""
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class EmotionRecordCreate(BaseModel):
    """创建情绪记录Schema"""
    primary_emotion: str
    intensity: float = Field(..., ge=0.0, le=1.0)
    source_type: str = "manual"
    context_tags: Optional[List[str]] = None
    encrypted_text: Optional[str] = None
    is_diary: bool = False


class EmotionRecordResponse(BaseModel):
    """情绪记录响应Schema"""
    id: UUID
    primary_emotion: str
    intensity: float
    confidence: float
    source_type: str
    context_tags: Optional[List[str]] = None
    recorded_at: datetime

    class Config:
        from_attributes = True


class EmotionAnalysisRequest(BaseModel):
    """情绪分析请求Schema"""
    text: str


class EmotionAnalysisResponse(BaseModel):
    """情绪分析响应Schema"""
    primary_emotion: str
    intensity: float
    confidence: float
    emotion_scores: dict