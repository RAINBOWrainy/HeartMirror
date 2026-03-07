"""
User Memory Service
用户记忆服务 - 实现个性化对话

存储和管理用户情绪模式、有效干预历史、重要事件关键词，
实现跨会话的个性化对话体验。

隐私保护：不存储完整对话内容，只存储摘要和模式信息。
"""
import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any
from collections import Counter

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.emotion import EmotionRecord, EmotionType
from app.models.intervention import InterventionPlan, InterventionSession
from app.models.user import User


class UserMemoryService:
    """
    用户记忆服务

    提供以下记忆能力：
    1. 情绪模式记忆：用户最常见的情绪、情绪趋势
    2. 有效干预记忆：哪些干预对用户有帮助
    3. 重要事件关键词：工作、学习、人际关系等
    4. 用户偏好设置：昵称、沟通风格偏好

    不存储：
    - 完整对话内容（隐私保护）
    - 敏感个人信息
    """

    def __init__(self, db: AsyncSession):
        """
        初始化用户记忆服务

        Args:
            db: 数据库会话
        """
        self.db = db

    async def get_user_context(self, user_id: uuid.UUID) -> Dict[str, Any]:
        """
        获取用户完整上下文

        用于在对话开始时加载用户记忆，实现个性化对话。

        Args:
            user_id: 用户ID

        Returns:
            用户上下文字典，包含：
            - emotion_patterns: 情绪模式
            - effective_interventions: 有效干预
            - context_keywords: 上下文关键词
            - preferences: 用户偏好
        """
        # 获取用户记忆字段
        user_result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        user = user_result.scalar_one_or_none()

        if not user:
            return self._get_empty_context()

        # 从用户字段获取存储的记忆
        memory_context = user.memory_context or {}
        preferences = user.preferences or {}

        # 获取实时情绪模式
        emotion_patterns = await self._get_emotion_patterns(user_id)

        # 获取有效干预历史
        effective_interventions = await self._get_effective_interventions(user_id)

        return {
            "emotion_patterns": emotion_patterns,
            "effective_interventions": effective_interventions,
            "context_keywords": memory_context.get("context_keywords", []),
            "important_events": memory_context.get("important_events", []),
            "preferences": preferences,
            "nickname": user.nickname,
        }

    async def _get_emotion_patterns(
        self,
        user_id: uuid.UUID,
        days: int = 30
    ) -> Dict[str, Any]:
        """
        获取用户情绪模式

        分析用户最近一段时间的情绪记录，提取模式。

        Args:
            user_id: 用户ID
            days: 分析天数

        Returns:
            情绪模式数据
        """
        start_date = datetime.now(timezone.utc) - timedelta(days=days)

        # 查询情绪记录
        result = await self.db.execute(
            select(EmotionRecord)
            .where(EmotionRecord.user_id == user_id)
            .where(EmotionRecord.recorded_at >= start_date)
            .order_by(EmotionRecord.recorded_at.desc())
        )
        records = result.scalars().all()

        if not records:
            return {
                "total_records": 0,
                "dominant_emotions": [],
                "average_intensity": 0.5,
                "trend": "stable",
            }

        # 统计情绪分布
        emotion_counter = Counter()
        total_intensity = 0

        for record in records:
            emotion_counter[record.primary_emotion.value] += 1
            total_intensity += record.intensity

        # 获取主要情绪（前3个）
        dominant_emotions = [
            {"emotion": emo, "count": count}
            for emo, count in emotion_counter.most_common(3)
        ]

        # 计算平均强度
        average_intensity = total_intensity / len(records)

        # 分析趋势（最近7天 vs 之前7天）
        recent_records = [r for r in records if r.recorded_at >= datetime.now(timezone.utc) - timedelta(days=7)]
        earlier_records = [r for r in records if r.recorded_at < datetime.now(timezone.utc) - timedelta(days=7)]

        trend = "stable"
        if recent_records and earlier_records:
            recent_avg = sum(r.intensity for r in recent_records) / len(recent_records)
            earlier_avg = sum(r.intensity for r in earlier_records) / len(earlier_records)

            if recent_avg > earlier_avg + 0.1:
                trend = "increasing"
            elif recent_avg < earlier_avg - 0.1:
                trend = "decreasing"

        return {
            "total_records": len(records),
            "dominant_emotions": dominant_emotions,
            "average_intensity": average_intensity,
            "trend": trend,
            "last_emotion": records[0].primary_emotion.value if records else None,
        }

    async def _get_effective_interventions(
        self,
        user_id: uuid.UUID
    ) -> List[Dict[str, Any]]:
        """
        获取对用户有效的干预方案

        基于历史干预记录，找出对用户效果好的干预。

        Args:
            user_id: 用户ID

        Returns:
            有效干预列表
        """
        # 查询完成的干预会话，按效果排序
        result = await self.db.execute(
            select(InterventionSession)
            .join(InterventionPlan)
            .where(InterventionPlan.user_id == user_id)
            .where(InterventionSession.is_completed == True)
            .where(InterventionSession.user_rating.isnot(None))
            .order_by(InterventionSession.user_rating.desc())
            .limit(5)
        )
        sessions = result.scalars().all()

        effective = []
        for session in sessions:
            # 计算效果
            effectiveness = session.effectiveness or 0
            if session.user_rating and session.user_rating >= 4:
                effective.append({
                    "plan_id": str(session.plan_id),
                    "type": session.plan.intervention_type.value if session.plan else None,
                    "rating": session.user_rating,
                    "effectiveness": effectiveness,
                })

        return effective

    async def update_preferences(
        self,
        user_id: uuid.UUID,
        preferences: Dict[str, Any]
    ) -> bool:
        """
        更新用户偏好设置

        Args:
            user_id: 用户ID
            preferences: 偏好设置字典

        Returns:
            是否更新成功
        """
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()

        if not user:
            return False

        # 合并现有偏好和新偏好
        current_preferences = user.preferences or {}
        current_preferences.update(preferences)
        user.preferences = current_preferences

        await self.db.commit()
        return True

    async def record_effective_intervention(
        self,
        user_id: uuid.UUID,
        plan_id: uuid.UUID,
        effectiveness: float,
        rating: Optional[int] = None
    ) -> bool:
        """
        记录有效的干预方案

        当用户完成干预并反馈效果好时，记录到用户记忆。

        Args:
            user_id: 用户ID
            plan_id: 干预计划ID
            effectiveness: 效果值 (-1 到 1)
            rating: 用户评分 (1-5)

        Returns:
            是否记录成功
        """
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()

        if not user:
            return False

        # 更新记忆上下文
        memory_context = user.memory_context or {}

        # 获取或创建有效干预列表
        effective_interventions = memory_context.get("effective_interventions", [])

        # 添加新的有效干预
        if rating and rating >= 4:
            plan_result = await self.db.execute(
                select(InterventionPlan).where(InterventionPlan.id == plan_id)
            )
            plan = plan_result.scalar_one_or_none()

            if plan:
                effective_interventions.append({
                    "type": plan.intervention_type.value,
                    "effectiveness": effectiveness,
                    "rating": rating,
                    "recorded_at": datetime.now(timezone.utc).isoformat(),
                })

                # 保留最近10个
                effective_interventions = effective_interventions[-10:]

        memory_context["effective_interventions"] = effective_interventions
        user.memory_context = memory_context

        await self.db.commit()
        return True

    async def add_context_keyword(
        self,
        user_id: uuid.UUID,
        keyword: str,
        category: Optional[str] = None
    ) -> bool:
        """
        添加上下文关键词

        记录用户提到的重要话题关键词。

        Args:
            user_id: 用户ID
            keyword: 关键词
            category: 类别（工作、学习、人际关系等）

        Returns:
            是否添加成功
        """
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()

        if not user:
            return False

        memory_context = user.memory_context or {}
        context_keywords = memory_context.get("context_keywords", [])

        # 检查是否已存在
        existing = [k for k in context_keywords if k.get("keyword") == keyword]
        if existing:
            # 更新计数
            existing[0]["count"] = existing[0].get("count", 1) + 1
            existing[0]["last_mentioned"] = datetime.now(timezone.utc).isoformat()
        else:
            # 添加新关键词
            context_keywords.append({
                "keyword": keyword,
                "category": category,
                "count": 1,
                "first_mentioned": datetime.now(timezone.utc).isoformat(),
                "last_mentioned": datetime.now(timezone.utc).isoformat(),
            })

        # 保留最近50个关键词
        context_keywords = sorted(
            context_keywords,
            key=lambda x: x.get("count", 0),
            reverse=True
        )[:50]

        memory_context["context_keywords"] = context_keywords
        user.memory_context = memory_context

        await self.db.commit()
        return True

    async def add_important_event(
        self,
        user_id: uuid.UUID,
        event: str,
        event_type: Optional[str] = None
    ) -> bool:
        """
        添加重要事件

        记录用户提到的重要生活事件。

        Args:
            user_id: 用户ID
            event: 事件描述
            event_type: 事件类型

        Returns:
            是否添加成功
        """
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()

        if not user:
            return False

        memory_context = user.memory_context or {}
        important_events = memory_context.get("important_events", [])

        important_events.append({
            "event": event,
            "type": event_type,
            "recorded_at": datetime.now(timezone.utc).isoformat(),
        })

        # 保留最近20个事件
        important_events = important_events[-20:]

        memory_context["important_events"] = important_events
        user.memory_context = memory_context

        await self.db.commit()
        return True

    async def get_conversation_context_summary(
        self,
        user_id: uuid.UUID
    ) -> str:
        """
        获取对话上下文摘要

        生成用于LLM的用户背景摘要。

        Args:
            user_id: 用户ID

        Returns:
            用户背景摘要文本
        """
        context = await self.get_user_context(user_id)

        parts = []

        # 添加昵称
        if context.get("nickname"):
            parts.append(f"用户昵称: {context['nickname']}")

        # 添加情绪模式
        emotion_patterns = context.get("emotion_patterns", {})
        if emotion_patterns.get("dominant_emotions"):
            top_emotions = emotion_patterns["dominant_emotions"][:3]
            emotion_names = {
                "joy": "开心", "sadness": "难过", "anger": "生气",
                "fear": "害怕", "anxiety": "焦虑", "frustration": "疲惫",
                "loneliness": "孤独", "calm": "平静", "neutral": "平静"
            }
            emotion_list = [
                f"{emotion_names.get(e['emotion'], e['emotion'])}({e['count']}次)"
                for e in top_emotions
            ]
            parts.append(f"最近常见情绪: {', '.join(emotion_list)}")

        # 添加上下文关键词
        keywords = context.get("context_keywords", [])[:5]
        if keywords:
            keyword_list = [k["keyword"] for k in keywords]
            parts.append(f"常聊话题: {', '.join(keyword_list)}")

        # 添加有效干预
        effective = context.get("effective_interventions", [])
        if effective:
            intervention_names = {
                "cbt": "认知行为练习", "mindfulness": "正念冥想",
                "breathing": "呼吸练习", "exercise": "运动",
                "social": "社交活动", "self_care": "自我关怀"
            }
            types = list(set([
                intervention_names.get(e["type"], e["type"])
                for e in effective[:3]
            ]))
            parts.append(f"有效的干预: {', '.join(types)}")

        if parts:
            return "[用户背景] " + " | ".join(parts)
        else:
            return ""

    def _get_empty_context(self) -> Dict[str, Any]:
        """返回空的上下文"""
        return {
            "emotion_patterns": {
                "total_records": 0,
                "dominant_emotions": [],
                "average_intensity": 0.5,
                "trend": "stable",
            },
            "effective_interventions": [],
            "context_keywords": [],
            "important_events": [],
            "preferences": {},
            "nickname": None,
        }