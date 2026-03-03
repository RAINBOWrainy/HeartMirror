"""
Chat Schemas
"""
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel


class ChatSessionCreate(BaseModel):
    """创建对话会话Schema"""
    title: Optional[str] = None


class ChatMessageCreate(BaseModel):
    """创建对话消息Schema"""
    content: str


class ChatMessageResponse(BaseModel):
    """对话消息响应Schema"""
    id: UUID
    role: str
    emotion_detected: Optional[str] = None
    emotion_intensity: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ChatSessionResponse(BaseModel):
    """对话会话响应Schema"""
    id: UUID
    title: Optional[str] = None
    status: str
    current_stage: str
    message_count: int
    started_at: datetime
    last_message_at: Optional[datetime] = None
    messages: List[ChatMessageResponse] = []

    class Config:
        from_attributes = True


class ChatMessageStream(BaseModel):
    """对话消息流Schema"""
    session_id: UUID
    content: str
    is_final: bool = False