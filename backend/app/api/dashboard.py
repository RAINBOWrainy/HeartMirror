"""
Dashboard API Routes
数据可视化看板接口
"""
from datetime import datetime, timedelta, timezone
from typing import Annotated, Dict, List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.dependencies import get_db
from app.models.emotion import EmotionRecord, EmotionType
from app.models.intervention import InterventionPlan, InterventionSession
from app.models.questionnaire import QuestionnaireSession
from app.models.session import ChatSession
from app.models.user import User

router = APIRouter()


class DashboardOverview(BaseModel):
    """看板概览"""
    total_sessions: int
    total_diaries: int
    total_chat_emotions: int
    total_interventions: int
    current_streak: int
    risk_level: str


class EmotionTrendPoint(BaseModel):
    """情绪趋势数据点"""
    date: str
    average_intensity: float
    dominant_emotion: str


class InterventionStats(BaseModel):
    """干预统计"""
    total: int
    completed: int
    completion_rate: float
    by_type: Dict[str, int]


class QuestionnaireStats(BaseModel):
    """问卷评估统计"""
    total_sessions: int
    completed_sessions: int
    latest_phq9_score: Optional[int]
    latest_gad7_score: Optional[int]
    by_type: Dict[str, int]


class DashboardResponse(BaseModel):
    """看板完整响应"""
    overview: DashboardOverview
    emotion_trend: List[EmotionTrendPoint]
    emotion_distribution: Dict[str, int]
    intervention_stats: InterventionStats
    questionnaire_stats: QuestionnaireStats
    recent_activities: List[Dict]


@router.get("", response_model=DashboardResponse)
async def get_dashboard(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    days: int = Query(30, ge=7, le=90),
):
    """
    获取用户数据看板

    包含情绪趋势、干预统计、活动记录等
    """
    start_date = datetime.now(timezone.utc) - timedelta(days=days)

    # 1. 概览统计
    # 对话会话数
    sessions_result = await db.execute(
        select(func.count(ChatSession.id))
        .where(ChatSession.user_id == current_user.id)
    )
    total_sessions = sessions_result.scalar() or 0

    # 日记数（保持原有逻辑）
    diaries_result = await db.execute(
        select(func.count(EmotionRecord.id))
        .where(EmotionRecord.user_id == current_user.id)
        .where(EmotionRecord.is_diary == True)
    )
    total_diaries = diaries_result.scalar() or 0

    # 聊天情绪记录数（新增）
    chat_emotions_result = await db.execute(
        select(func.count(EmotionRecord.id))
        .where(EmotionRecord.user_id == current_user.id)
        .where(EmotionRecord.source_type == "chat")
    )
    total_chat_emotions = chat_emotions_result.scalar() or 0

    # 干预次数
    interventions_result = await db.execute(
        select(func.count(InterventionSession.id))
        .where(InterventionSession.plan_id.in_(
            select(InterventionPlan.id).where(
                InterventionPlan.user_id == current_user.id
            )
        ))
    )
    total_interventions = interventions_result.scalar() or 0

    # 计算连续打卡天数
    streak = await _calculate_streak(current_user.id, db)

    overview = DashboardOverview(
        total_sessions=total_sessions,
        total_diaries=total_diaries,
        total_chat_emotions=total_chat_emotions,
        total_interventions=total_interventions,
        current_streak=streak,
        risk_level=current_user.risk_level,
    )

    # 2. 情绪趋势
    emotion_trend = await _get_emotion_trend(current_user.id, db, days)

    # 3. 情绪分布
    emotion_distribution = await _get_emotion_distribution(current_user.id, db, days)

    # 4. 干预统计
    intervention_stats = await _get_intervention_stats(current_user.id, db)

    # 5. 问卷评估统计
    questionnaire_stats = await _get_questionnaire_stats(current_user.id, db)

    # 6. 最近活动
    recent_activities = await _get_recent_activities(current_user.id, db)

    return DashboardResponse(
        overview=overview,
        emotion_trend=emotion_trend,
        emotion_distribution=emotion_distribution,
        intervention_stats=intervention_stats,
        questionnaire_stats=questionnaire_stats,
        recent_activities=recent_activities,
    )


async def _calculate_streak(user_id, db) -> int:
    """计算连续打卡天数"""
    today = datetime.now(timezone.utc).date()
    streak = 0

    for i in range(365):  # 最多计算一年
        check_date = today - timedelta(days=i)

        result = await db.execute(
            select(EmotionRecord.id)
            .where(EmotionRecord.user_id == user_id)
            .where(func.date(EmotionRecord.recorded_at) == check_date)
            .limit(1)
        )
        if result.scalar_one_or_none():
            streak += 1
        else:
            break

    return streak


async def _get_emotion_trend(user_id, db, days) -> List[EmotionTrendPoint]:
    """获取情绪趋势"""
    start_date = datetime.now(timezone.utc) - timedelta(days=days)

    result = await db.execute(
        select(EmotionRecord)
        .where(EmotionRecord.user_id == user_id)
        .where(EmotionRecord.recorded_at >= start_date)
        .order_by(EmotionRecord.recorded_at)
    )
    records = result.scalars().all()

    # 按日期分组
    daily_data = {}
    for record in records:
        date_str = record.recorded_at.strftime("%Y-%m-%d")
        if date_str not in daily_data:
            daily_data[date_str] = {
                "intensities": [],
                "emotions": [],
            }
        daily_data[date_str]["intensities"].append(record.intensity)
        daily_data[date_str]["emotions"].append(record.primary_emotion.value)

    # 计算每日数据
    trend = []
    for date_str, data in daily_data.items():
        avg_intensity = sum(data["intensities"]) / len(data["intensities"])
        # 找主导情绪
        emotion_counts = {}
        for e in data["emotions"]:
            emotion_counts[e] = emotion_counts.get(e, 0) + 1
        dominant = max(emotion_counts, key=emotion_counts.get) if emotion_counts else "neutral"

        trend.append(EmotionTrendPoint(
            date=date_str,
            average_intensity=avg_intensity,
            dominant_emotion=dominant,
        ))

    return trend


async def _get_emotion_distribution(user_id, db, days) -> Dict[str, int]:
    """获取情绪分布"""
    start_date = datetime.now(timezone.utc) - timedelta(days=days)

    result = await db.execute(
        select(EmotionRecord.primary_emotion, func.count(EmotionRecord.id))
        .where(EmotionRecord.user_id == user_id)
        .where(EmotionRecord.recorded_at >= start_date)
        .group_by(EmotionRecord.primary_emotion)
    )
    distribution = {}
    for row in result:
        distribution[row[0].value] = row[1]

    return distribution


async def _get_intervention_stats(user_id, db) -> InterventionStats:
    """获取干预统计"""
    # 获取用户的干预方案
    plans_result = await db.execute(
        select(InterventionPlan.id)
        .where(InterventionPlan.user_id == user_id)
    )
    plan_ids = [p[0] for p in plans_result.fetchall()]

    if not plan_ids:
        return InterventionStats(
            total=0,
            completed=0,
            completion_rate=0.0,
            by_type={},
        )

    # 统计会话
    sessions_result = await db.execute(
        select(InterventionSession)
        .where(InterventionSession.plan_id.in_(plan_ids))
    )
    sessions = sessions_result.scalars().all()

    total = len(sessions)
    completed = sum(1 for s in sessions if s.is_completed)
    completion_rate = completed / total if total > 0 else 0.0

    # 按类型统计
    plans_result = await db.execute(
        select(InterventionPlan.intervention_type, func.count(InterventionPlan.id))
        .where(InterventionPlan.user_id == user_id)
        .group_by(InterventionPlan.intervention_type)
    )
    by_type = {row[0].value: row[1] for row in plans_result}

    return InterventionStats(
        total=total,
        completed=completed,
        completion_rate=completion_rate,
        by_type=by_type,
    )


async def _get_questionnaire_stats(user_id, db) -> QuestionnaireStats:
    """获取问卷评估统计"""
    # 按类型统计
    type_result = await db.execute(
        select(QuestionnaireSession.questionnaire_type, func.count(QuestionnaireSession.id))
        .where(QuestionnaireSession.user_id == user_id)
        .group_by(QuestionnaireSession.questionnaire_type)
    )
    by_type = {row[0].value: row[1] for row in type_result}

    # 总会话数和完成数
    total_result = await db.execute(
        select(func.count(QuestionnaireSession.id))
        .where(QuestionnaireSession.user_id == user_id)
    )
    total_sessions = total_result.scalar() or 0

    completed_result = await db.execute(
        select(func.count(QuestionnaireSession.id))
        .where(QuestionnaireSession.user_id == user_id)
        .where(QuestionnaireSession.is_completed == True)
    )
    completed_sessions = completed_result.scalar() or 0

    # 获取最近的PHQ-9分数
    phq9_result = await db.execute(
        select(QuestionnaireSession.total_score)
        .where(QuestionnaireSession.user_id == user_id)
        .where(QuestionnaireSession.questionnaire_type == "phq9")
        .where(QuestionnaireSession.is_completed == True)
        .order_by(QuestionnaireSession.completed_at.desc())
        .limit(1)
    )
    latest_phq9_score = phq9_result.scalar_one_or_none()

    # 获取最近的GAD-7分数
    gad7_result = await db.execute(
        select(QuestionnaireSession.total_score)
        .where(QuestionnaireSession.user_id == user_id)
        .where(QuestionnaireSession.questionnaire_type == "gad7")
        .where(QuestionnaireSession.is_completed == True)
        .order_by(QuestionnaireSession.completed_at.desc())
        .limit(1)
    )
    latest_gad7_score = gad7_result.scalar_one_or_none()

    return QuestionnaireStats(
        total_sessions=total_sessions,
        completed_sessions=completed_sessions,
        latest_phq9_score=latest_phq9_score,
        latest_gad7_score=latest_gad7_score,
        by_type=by_type,
    )


async def _get_recent_activities(user_id, db, limit: int = 10) -> List[Dict]:
    """获取最近活动"""
    activities = []
    start_date = datetime.now(timezone.utc) - timedelta(days=7)

    # 获取最近的对话
    sessions_result = await db.execute(
        select(ChatSession)
        .where(ChatSession.user_id == user_id)
        .where(ChatSession.started_at >= start_date)
        .order_by(ChatSession.started_at.desc())
        .limit(5)
    )
    for session in sessions_result.scalars().all():
        activities.append({
            "type": "chat",
            "title": session.title or "对话",
            "timestamp": session.started_at.isoformat(),
        })

    # 获取最近的日记
    diaries_result = await db.execute(
        select(EmotionRecord)
        .where(EmotionRecord.user_id == user_id)
        .where(EmotionRecord.is_diary == True)
        .where(EmotionRecord.recorded_at >= start_date)
        .order_by(EmotionRecord.recorded_at.desc())
        .limit(5)
    )
    for diary in diaries_result.scalars().all():
        activities.append({
            "type": "diary",
            "title": f"情绪日记 - {diary.primary_emotion.value}",
            "timestamp": diary.recorded_at.isoformat(),
        })

    # 获取最近的聊天情绪记录
    chat_emotions_result = await db.execute(
        select(EmotionRecord)
        .where(EmotionRecord.user_id == user_id)
        .where(EmotionRecord.source_type == "chat")
        .where(EmotionRecord.recorded_at >= start_date)
        .order_by(EmotionRecord.recorded_at.desc())
        .limit(5)
    )
    for record in chat_emotions_result.scalars().all():
        activities.append({
            "type": "chat_emotion",
            "title": f"聊天情绪 - {record.primary_emotion.value}",
            "timestamp": record.recorded_at.isoformat(),
            "intensity": record.intensity,
        })

    # 按时间排序
    activities.sort(key=lambda x: x["timestamp"], reverse=True)

    return activities[:limit]