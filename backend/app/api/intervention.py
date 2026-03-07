"""
Intervention API Routes
干预方案接口
"""
import uuid
from datetime import datetime, timezone
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.dependencies import get_db
from app.models.user import User
from app.services.intervention_service import InterventionService


router = APIRouter()


class InterventionPlanResponse(BaseModel):
    """干预方案响应"""
    id: uuid.UUID
    name: str
    intervention_type: str
    content: dict
    difficulty_level: int
    estimated_duration: int
    is_active: bool
    effectiveness_score: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True


class InterventionPlanDetail(InterventionPlanResponse):
    """干预方案详情"""
    trigger_conditions: Optional[dict]


class StartSessionRequest(BaseModel):
    """开始干预会话请求"""
    emotion_before: Optional[str] = None
    intensity_before: Optional[float] = None


class CompleteSessionRequest(BaseModel):
    """完成干预会话请求"""
    user_rating: Optional[int] = None
    emotion_after: Optional[str] = None
    intensity_after: Optional[float] = None
    actual_duration: Optional[int] = None
    feedback: Optional[str] = None


class SessionResponse(BaseModel):
    """干预会话响应"""
    id: uuid.UUID
    plan_id: uuid.UUID
    is_completed: bool
    emotion_before: Optional[str]
    emotion_after: Optional[str]
    intensity_before: Optional[float]
    intensity_after: Optional[float]
    user_rating: Optional[int]
    started_at: datetime
    completed_at: Optional[datetime]


class InterventionStatsResponse(BaseModel):
    """干预统计响应"""
    total_plans: int
    active_plans: int
    completed_sessions: int
    total_sessions: int
    completion_rate: float
    by_type: dict


@router.get("/plans", response_model=List[InterventionPlanResponse])
async def list_intervention_plans(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    active_only: bool = True,
    limit: int = 20,
):
    """
    获取用户的干预计划列表

    - **active_only**: 是否只返回活跃的方案
    - **limit**: 返回数量限制
    """
    service = InterventionService(db)
    plans = await service.get_user_plans(
        user_id=current_user.id,
        active_only=active_only,
        limit=limit,
    )

    return [
        InterventionPlanResponse(
            id=plan.id,
            name=plan.name,
            intervention_type=plan.intervention_type.value,
            content=plan.content,
            difficulty_level=plan.difficulty_level,
            estimated_duration=plan.estimated_duration,
            is_active=plan.is_active,
            effectiveness_score=plan.effectiveness_score,
            created_at=plan.created_at,
        )
        for plan in plans
    ]


@router.get("/plans/{plan_id}", response_model=InterventionPlanDetail)
async def get_intervention_plan(
    plan_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    获取特定的干预计划详情
    """
    service = InterventionService(db)
    plan = await service.get_plan_by_id(plan_id, user_id=current_user.id)

    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="干预计划不存在",
        )

    return InterventionPlanDetail(
        id=plan.id,
        name=plan.name,
        intervention_type=plan.intervention_type.value,
        content=plan.content,
        difficulty_level=plan.difficulty_level,
        estimated_duration=plan.estimated_duration,
        is_active=plan.is_active,
        effectiveness_score=plan.effectiveness_score,
        created_at=plan.created_at,
        trigger_conditions=plan.trigger_conditions,
    )


@router.post("/plans/{plan_id}/start", response_model=SessionResponse)
async def start_intervention_session(
    plan_id: uuid.UUID,
    request: StartSessionRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    开始一个干预会话

    记录用户开始执行干预方案，记录干预前的情绪状态。
    """
    service = InterventionService(db)

    # 验证计划存在且属于当前用户
    plan = await service.get_plan_by_id(plan_id, user_id=current_user.id)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="干预计划不存在",
        )

    session = await service.start_session(
        plan_id=plan_id,
        emotion_before=request.emotion_before,
        intensity_before=request.intensity_before,
    )

    return SessionResponse(
        id=session.id,
        plan_id=session.plan_id,
        is_completed=session.is_completed,
        emotion_before=session.emotion_before,
        emotion_after=session.emotion_after,
        intensity_before=session.intensity_before,
        intensity_after=session.intensity_after,
        user_rating=session.user_rating,
        started_at=session.started_at,
        completed_at=session.completed_at,
    )


@router.post("/sessions/{session_id}/complete", response_model=SessionResponse)
async def complete_intervention_session(
    session_id: uuid.UUID,
    request: CompleteSessionRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    标记干预会话完成

    记录用户的完成情况和反馈，以及干预后的情绪状态。
    """
    service = InterventionService(db)

    session = await service.complete_session(
        session_id=session_id,
        user_rating=request.user_rating,
        emotion_after=request.emotion_after,
        intensity_after=request.intensity_after,
        actual_duration=request.actual_duration,
        feedback=request.feedback,
    )

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="干预会话不存在",
        )

    return SessionResponse(
        id=session.id,
        plan_id=session.plan_id,
        is_completed=session.is_completed,
        emotion_before=session.emotion_before,
        emotion_after=session.emotion_after,
        intensity_before=session.intensity_before,
        intensity_after=session.intensity_after,
        user_rating=session.user_rating,
        started_at=session.started_at,
        completed_at=session.completed_at,
    )


@router.get("/recommendations", response_model=List[InterventionPlanResponse])
async def get_intervention_recommendations(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    emotion: Optional[str] = None,
    intensity: float = 0.5,
    limit: int = 3,
):
    """
    获取个性化的干预推荐

    基于用户当前情绪推荐适合的干预方案。
    """
    service = InterventionService(db)
    plans = await service.get_recommended_plans(
        user_id=current_user.id,
        emotion=emotion,
        intensity=intensity,
        limit=limit,
    )

    return [
        InterventionPlanResponse(
            id=plan.id,
            name=plan.name,
            intervention_type=plan.intervention_type.value,
            content=plan.content,
            difficulty_level=plan.difficulty_level,
            estimated_duration=plan.estimated_duration,
            is_active=plan.is_active,
            effectiveness_score=plan.effectiveness_score,
            created_at=plan.created_at,
        )
        for plan in plans
    ]


@router.delete("/plans/{plan_id}")
async def deactivate_intervention_plan(
    plan_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    停用一个干预计划
    """
    service = InterventionService(db)
    success = await service.deactivate_plan(plan_id, user_id=current_user.id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="干预计划不存在",
        )

    return {"message": "干预计划已停用"}


@router.get("/stats", response_model=InterventionStatsResponse)
async def get_intervention_statistics(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    获取用户的干预统计数据
    """
    service = InterventionService(db)
    stats = await service.get_user_statistics(user_id=current_user.id)

    return InterventionStatsResponse(**stats)