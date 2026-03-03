"""
User Schemas
"""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class UserBase(BaseModel):
    """用户基础Schema"""
    anonymous_id: str = Field(..., min_length=3, max_length=50)


class UserCreate(UserBase):
    """用户创建Schema"""
    password: str = Field(..., min_length=6, max_length=100)
    consent_given: bool = Field(default=False)
    disclaimer_accepted: bool = Field(default=False)


class UserLogin(BaseModel):
    """用户登录Schema"""
    anonymous_id: str
    password: str


class UserResponse(UserBase):
    """用户响应Schema"""
    id: UUID
    risk_level: str
    consent_given: bool
    disclaimer_accepted: bool
    created_at: datetime
    last_active_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """令牌响应Schema"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse