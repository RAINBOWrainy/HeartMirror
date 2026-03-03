"""
Tracking Service
干预效果跟踪服务
"""
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.emotion import EmotionRecord
from app.models.intervention import InterventionPlan, InterventionSession


class TrackingService:
    """效果跟踪服务"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def record_emotion(
        self,
        user_id: str,
        emotion: str,
        intensity: float,
        source_type: str = "manual",
        context_tags: Optional[List[str]] = None
    ) -> EmotionRecord:
        """记录情绪数据"""
        from app.models.emotion import EmotionType

        try:
            emotion_type = EmotionType(emotion)
        except ValueError:
            emotion_type = EmotionType.NEUTRAL

        record = EmotionRecord(
            user_id=user_id,
            primary_emotion=emotion_type,
            intensity=intensity,
            source_type=source_type,
            context_tags=context_tags or []
        )

        self.db.add(record)
        await self.db.commit()
        await self.db.refresh(record)

        return record

    async def get_emotion_trend(
        self,
        user_id: str,
        days: int = 7
    ) -> List[Dict]:
        """获取情绪趋势数据"""
        start_date = datetime.now(timezone.utc) - timedelta(days=days)

        result = await self.db.execute(
            select(EmotionRecord)
            .where(EmotionRecord.user_id == user_id)
            .where(EmotionRecord.recorded_at >= start_date)
            .order_by(EmotionRecord.recorded_at)
        )
        records = result.scalars().all()

        return [
            {
                "date": r.recorded_at.strftime("%Y-%m-%d"),
                "emotion": r.primary_emotion.value,
                "intensity": r.intensity
            }
            for r in records
        ]

    async def calculate_intervention_effectiveness(
        self,
        plan_id: str
    ) -> Dict:
        """计算干预效果"""
        result = await self.db.execute(
            select(InterventionSession)
            .where(InterventionSession.plan_id == plan_id)
        )
        sessions = result.scalars().all()

        if not sessions:
            return {"effectiveness": 0, "completed": 0, "total": 0}

        completed = sum(1 for s in sessions if s.is_completed)
        total = len(sessions)

        # 计算情绪改善
        improvements = []
        for s in sessions:
            if s.effectiveness is not None:
                improvements.append(s.effectiveness)

        avg_improvement = sum(improvements) / len(improvements) if improvements else 0

        return {
            "effectiveness": avg_improvement,
            "completed": completed,
            "total": total,
            "completion_rate": completed / total if total > 0 else 0
        }

    async def get_user_statistics(self, user_id: str) -> Dict:
        """获取用户统计数据"""
        # 情绪记录数
        emotion_count = await self.db.execute(
            select(func.count(EmotionRecord.id))
            .where(EmotionRecord.user_id == user_id)
        )
        total_emotions = emotion_count.scalar() or 0

        # 最近7天平均情绪强度
        start_date = datetime.now(timezone.utc) - timedelta(days=7)
        avg_result = await self.db.execute(
            select(func.avg(EmotionRecord.intensity))
            .where(EmotionRecord.user_id == user_id)
            .where(EmotionRecord.recorded_at >= start_date)
        )
        avg_intensity = avg_result.scalar() or 0

        return {
            "total_emotion_records": total_emotions,
            "average_intensity_7d": float(avg_intensity)
        }