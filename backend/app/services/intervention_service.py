"""
Intervention Service
干预计划服务 - 持久化和管理干预方案
"""
import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.models.intervention import InterventionPlan, InterventionSession, InterventionType
from app.models.emotion import EmotionType


# 干预类型字符串到枚举的映射
INTERVENTION_TYPE_MAP = {
    "cbt": InterventionType.CBT,
    "mindfulness": InterventionType.MINDFULNESS,
    "breathing": InterventionType.BREATHING,
    "exercise": InterventionType.EXERCISE,
    "social": InterventionType.SOCIAL,
    "self_care": InterventionType.SELF_CARE,
    "education": InterventionType.EDUCATION,
    "behavioral": InterventionType.BEHAVIORAL,
}


class InterventionService:
    """
    干预计划服务

    负责将动态生成的干预方案持久化到数据库，
    支持用户查看、执行和反馈干预计划。
    """

    def __init__(self, db: AsyncSession):
        """
        初始化干预服务

        Args:
            db: 数据库会话
        """
        self.db = db

    def _parse_intervention_type(self, type_str: str) -> InterventionType:
        """
        将干预类型字符串转换为枚举

        Args:
            type_str: 类型字符串

        Returns:
            InterventionType 枚举值
        """
        type_lower = type_str.lower().strip()
        return INTERVENTION_TYPE_MAP.get(type_lower, InterventionType.SELF_CARE)

    async def save_intervention_plan(
        self,
        user_id: uuid.UUID,
        interventions: List[Dict],
        emotion_context: Optional[Dict] = None,
        session_id: Optional[uuid.UUID] = None,
    ) -> List[InterventionPlan]:
        """
        保存生成的干预方案到数据库

        将 InterventionAgent 生成的干预建议持久化，
        使用户可以后续查看和执行。

        Args:
            user_id: 用户ID
            interventions: 干预方案列表（来自 InterventionAgent）
            emotion_context: 情绪上下文（触发情绪、强度等）
            session_id: 关联的会话ID

        Returns:
            保存的干预方案列表
        """
        saved_plans = []

        # 提取情绪上下文信息
        trigger_emotion = None
        trigger_intensity = 0.5
        if emotion_context:
            trigger_emotion = emotion_context.get("emotion")
            trigger_intensity = emotion_context.get("intensity", 0.5)

        # 构建触发条件
        trigger_conditions = {}
        if trigger_emotion:
            trigger_conditions["emotion"] = trigger_emotion
            trigger_conditions["intensity_threshold"] = trigger_intensity
        if session_id:
            trigger_conditions["session_id"] = str(session_id)

        for intervention in interventions:
            # 解析干预类型
            intervention_type = self._parse_intervention_type(
                intervention.get("type", "self_care")
            )

            # 构建方案内容
            content = {
                "name": intervention.get("name", "干预练习"),
                "description": intervention.get("description", ""),
                "steps": intervention.get("steps", []),
                "duration": intervention.get("duration", 10),
            }

            # 创建干预计划
            plan = InterventionPlan(
                user_id=user_id,
                name=intervention.get("name", "干预练习"),
                intervention_type=intervention_type,
                content=content,
                trigger_conditions=trigger_conditions if trigger_conditions else None,
                difficulty_level=self._estimate_difficulty(intervention, trigger_intensity),
                estimated_duration=intervention.get("duration", 10),
                is_recommended=True,  # 系统生成的标记为推荐
                is_active=True,
            )

            self.db.add(plan)
            saved_plans.append(plan)

        await self.db.commit()

        # 刷新获取ID
        for plan in saved_plans:
            await self.db.refresh(plan)

        return saved_plans

    def _estimate_difficulty(self, intervention: Dict, intensity: float) -> int:
        """
        估计干预方案难度

        Args:
            intervention: 干预方案数据
            intensity: 情绪强度

        Returns:
            难度等级 1-5
        """
        # 基于类型和情绪强度估计难度
        type_difficulty = {
            "breathing": 1,
            "self_care": 2,
            "exercise": 2,
            "mindfulness": 3,
            "social": 3,
            "cbt": 4,
            "education": 2,
            "behavioral": 3,
        }

        base_difficulty = type_difficulty.get(
            intervention.get("type", "self_care"), 2
        )

        # 根据情绪强度调整
        if intensity >= 0.8:
            base_difficulty += 1
        elif intensity <= 0.3:
            base_difficulty = max(1, base_difficulty - 1)

        return min(5, max(1, base_difficulty))

    async def get_user_plans(
        self,
        user_id: uuid.UUID,
        active_only: bool = True,
        limit: int = 20,
    ) -> List[InterventionPlan]:
        """
        获取用户的干预计划列表

        Args:
            user_id: 用户ID
            active_only: 是否只返回活跃的方案
            limit: 返回数量限制

        Returns:
            干预计划列表
        """
        query = (
            select(InterventionPlan)
            .where(InterventionPlan.user_id == user_id)
            .order_by(InterventionPlan.created_at.desc())
        )

        if active_only:
            query = query.where(InterventionPlan.is_active == True)

        query = query.limit(limit)

        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_plan_by_id(
        self,
        plan_id: uuid.UUID,
        user_id: Optional[uuid.UUID] = None,
    ) -> Optional[InterventionPlan]:
        """
        获取特定的干预计划

        Args:
            plan_id: 计划ID
            user_id: 用户ID（可选，用于权限验证）

        Returns:
            干预计划，如果不存在返回None
        """
        query = select(InterventionPlan).where(InterventionPlan.id == plan_id)

        if user_id:
            query = query.where(InterventionPlan.user_id == user_id)

        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def start_session(
        self,
        plan_id: uuid.UUID,
        emotion_before: Optional[str] = None,
        intensity_before: Optional[float] = None,
    ) -> InterventionSession:
        """
        开始一个干预会话

        记录用户开始执行干预方案。

        Args:
            plan_id: 干预计划ID
            emotion_before: 干预前的情绪
            intensity_before: 干预前的情绪强度

        Returns:
            干预会话记录
        """
        session = InterventionSession(
            plan_id=plan_id,
            emotion_before=emotion_before,
            intensity_before=intensity_before,
            is_completed=False,
        )

        self.db.add(session)
        await self.db.commit()
        await self.db.refresh(session)

        return session

    async def complete_session(
        self,
        session_id: uuid.UUID,
        user_rating: Optional[int] = None,
        emotion_after: Optional[str] = None,
        intensity_after: Optional[float] = None,
        actual_duration: Optional[int] = None,
        feedback: Optional[str] = None,
    ) -> Optional[InterventionSession]:
        """
        标记干预会话完成

        记录用户的完成情况和反馈。

        Args:
            session_id: 会话ID
            user_rating: 用户评分 1-5
            emotion_after: 干预后的情绪
            intensity_after: 干预后的情绪强度
            actual_duration: 实际耗时（分钟）
            feedback: 用户反馈

        Returns:
            更新后的会话记录
        """
        result = await self.db.execute(
            select(InterventionSession).where(InterventionSession.id == session_id)
        )
        session = result.scalar_one_or_none()

        if not session:
            return None

        session.is_completed = True
        session.completed_at = datetime.now(timezone.utc)
        session.user_rating = user_rating
        session.emotion_after = emotion_after
        session.intensity_after = intensity_after
        session.actual_duration = actual_duration

        if feedback:
            from app.core.security import encrypt_data
            session.encrypted_feedback = encrypt_data(feedback)

        await self.db.commit()
        await self.db.refresh(session)

        # 更新计划的效果评分
        await self._update_plan_effectiveness(session.plan_id)

        return session

    async def _update_plan_effectiveness(self, plan_id: uuid.UUID):
        """
        更新干预计划的效果评分

        基于所有完成的会话计算平均效果。

        Args:
            plan_id: 计划ID
        """
        # 查询该计划所有完成的会话
        result = await self.db.execute(
            select(InterventionSession)
            .where(InterventionSession.plan_id == plan_id)
            .where(InterventionSession.is_completed == True)
            .where(InterventionSession.intensity_before.isnot(None))
            .where(InterventionSession.intensity_after.isnot(None))
        )
        sessions = result.scalars().all()

        if not sessions:
            return

        # 计算平均效果
        effectivenesses = [s.effectiveness for s in sessions if s.effectiveness is not None]
        if effectivenesses:
            avg_effectiveness = sum(effectivenesses) / len(effectivenesses)
            # 转换为0-1范围（假设效果值在-1到1之间）
            normalized = (avg_effectiveness + 1) / 2

            # 更新计划
            plan_result = await self.db.execute(
                select(InterventionPlan).where(InterventionPlan.id == plan_id)
            )
            plan = plan_result.scalar_one_or_none()
            if plan:
                plan.effectiveness_score = max(0, min(1, normalized))
                await self.db.commit()

    async def get_recommended_plans(
        self,
        user_id: uuid.UUID,
        emotion: Optional[str] = None,
        intensity: float = 0.5,
        limit: int = 3,
    ) -> List[InterventionPlan]:
        """
        获取推荐的干预计划

        基于用户当前情绪推荐适合的干预方案。

        Args:
            user_id: 用户ID
            emotion: 当前情绪
            intensity: 情绪强度
            limit: 返回数量

        Returns:
            推荐的干预计划列表
        """
        # 首先查找匹配情绪的历史方案
        if emotion:
            result = await self.db.execute(
                select(InterventionPlan)
                .where(InterventionPlan.user_id == user_id)
                .where(InterventionPlan.is_active == True)
                .where(InterventionPlan.trigger_conditions["emotion"].astext == emotion)
                .order_by(InterventionPlan.effectiveness_score.desc().nulls_last())
                .limit(limit)
            )
            matching_plans = list(result.scalars().all())

            if matching_plans:
                return matching_plans

        # 如果没有匹配的，返回通用的推荐方案
        result = await self.db.execute(
            select(InterventionPlan)
            .where(InterventionPlan.user_id == user_id)
            .where(InterventionPlan.is_active == True)
            .where(InterventionPlan.is_recommended == True)
            .order_by(InterventionPlan.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def deactivate_plan(
        self,
        plan_id: uuid.UUID,
        user_id: Optional[uuid.UUID] = None,
    ) -> bool:
        """
        停用一个干预计划

        Args:
            plan_id: 计划ID
            user_id: 用户ID（用于权限验证）

        Returns:
            是否成功停用
        """
        query = select(InterventionPlan).where(InterventionPlan.id == plan_id)
        if user_id:
            query = query.where(InterventionPlan.user_id == user_id)

        result = await self.db.execute(query)
        plan = result.scalar_one_or_none()

        if not plan:
            return False

        plan.is_active = False
        await self.db.commit()

        return True

    async def get_user_statistics(
        self,
        user_id: uuid.UUID,
    ) -> Dict[str, Any]:
        """
        获取用户的干预统计数据

        Args:
            user_id: 用户ID

        Returns:
            统计数据
        """
        # 总计划数
        total_plans_result = await self.db.execute(
            select(func.count(InterventionPlan.id))
            .where(InterventionPlan.user_id == user_id)
        )
        total_plans = total_plans_result.scalar() or 0

        # 活跃计划数
        active_plans_result = await self.db.execute(
            select(func.count(InterventionPlan.id))
            .where(InterventionPlan.user_id == user_id)
            .where(InterventionPlan.is_active == True)
        )
        active_plans = active_plans_result.scalar() or 0

        # 完成的会话数
        completed_sessions_result = await self.db.execute(
            select(func.count(InterventionSession.id))
            .select_from(InterventionSession)
            .join(InterventionPlan)
            .where(InterventionPlan.user_id == user_id)
            .where(InterventionSession.is_completed == True)
        )
        completed_sessions = completed_sessions_result.scalar() or 0

        # 计算完成率
        total_sessions_result = await self.db.execute(
            select(func.count(InterventionSession.id))
            .select_from(InterventionSession)
            .join(InterventionPlan)
            .where(InterventionPlan.user_id == user_id)
        )
        total_sessions = total_sessions_result.scalar() or 0

        completion_rate = completed_sessions / total_sessions if total_sessions > 0 else 0

        # 按类型统计
        type_stats_result = await self.db.execute(
            select(
                InterventionPlan.intervention_type,
                func.count(InterventionPlan.id)
            )
            .where(InterventionPlan.user_id == user_id)
            .group_by(InterventionPlan.intervention_type)
        )
        type_stats = {
            row[0].value: row[1]
            for row in type_stats_result.all()
        }

        return {
            "total_plans": total_plans,
            "active_plans": active_plans,
            "completed_sessions": completed_sessions,
            "total_sessions": total_sessions,
            "completion_rate": completion_rate,
            "by_type": type_stats,
        }