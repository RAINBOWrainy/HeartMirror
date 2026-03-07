"""
Emotion Record Service
情绪记录服务 - 自动将聊天情绪保存到数据库
"""
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.emotion import EmotionRecord, EmotionType
from app.core.security import encrypt_data


# 情绪字符串到枚举的映射
EMOTION_STRING_TO_TYPE = {
    "joy": EmotionType.JOY,
    "sadness": EmotionType.SADNESS,
    "anger": EmotionType.ANGER,
    "fear": EmotionType.FEAR,
    "disgust": EmotionType.DISGUST,
    "surprise": EmotionType.SURPRISE,
    "anxiety": EmotionType.ANXIETY,
    "shame": EmotionType.SHAME,
    "guilt": EmotionType.GUILT,
    "pride": EmotionType.PRIDE,
    "hope": EmotionType.HOPE,
    "frustration": EmotionType.FRUSTRATION,
    "loneliness": EmotionType.LONELINESS,
    "confusion": EmotionType.CONFUSION,
    "calm": EmotionType.CALM,
    "neutral": EmotionType.NEUTRAL,
}

# 上下文标签关键词映射
CONTEXT_TAG_KEYWORDS = {
    "工作": ["工作", "加班", "同事", "老板", "项目", "任务", "deadline", "开会", "上班"],
    "学习": ["学习", "考试", "作业", "论文", "课程", "学校", "考研", "保研"],
    "人际关系": ["朋友", "同事", "同学", "人际", "社交", "矛盾", "吵架", "误会"],
    "感情": ["恋爱", "分手", "对象", "男朋友", "女朋友", "喜欢", "表白", "暗恋"],
    "家庭": ["家里", "父母", "爸妈", "家人", "回家", "亲戚", "孩子"],
    "健康": ["生病", "医院", "身体", "健康", "头疼", "胃疼", "感冒"],
    "睡眠": ["失眠", "睡不着", "熬夜", "做梦", "睡眠", "睡觉"],
    "压力": ["压力", "焦虑", "紧张", "烦躁", "崩溃"],
}


class EmotionRecordService:
    """
    情绪记录服务

    负责将聊天会话中检测到的情绪自动保存到数据库，
    使其能够在数据看板中显示。
    """

    def __init__(self, db: AsyncSession):
        """
        初始化情绪记录服务

        Args:
            db: 数据库会话
        """
        self.db = db

    def _parse_emotion_type(self, emotion: str) -> EmotionType:
        """
        将情绪字符串转换为枚举类型

        Args:
            emotion: 情绪字符串

        Returns:
            EmotionType 枚举值
        """
        emotion_lower = emotion.lower().strip()
        return EMOTION_STRING_TO_TYPE.get(emotion_lower, EmotionType.NEUTRAL)

    def _extract_context_tags(self, text: str, context: Optional[Dict] = None) -> List[str]:
        """
        从文本中提取上下文标签

        Args:
            text: 用户输入文本
            context: 额外上下文信息

        Returns:
            上下文标签列表
        """
        tags = []
        text_lower = text.lower()

        for tag, keywords in CONTEXT_TAG_KEYWORDS.items():
            for keyword in keywords:
                if keyword in text_lower:
                    tags.append(tag)
                    break  # 每个类别只添加一次

        # 如果有额外上下文，也处理
        if context:
            if context.get("work_related"):
                tags.append("工作")
            if context.get("study_related"):
                tags.append("学习")
            if context.get("relationship_issues"):
                tags.append("人际关系")

        return list(set(tags))  # 去重

    async def create_from_chat(
        self,
        user_id: uuid.UUID,
        session_id: uuid.UUID,
        emotion: str,
        intensity: float,
        confidence: float = 0.5,
        context_tags: Optional[List[str]] = None,
        encrypted_text: Optional[str] = None,
        user_input: Optional[str] = None,
        emotion_scores: Optional[Dict[str, float]] = None,
    ) -> EmotionRecord:
        """
        从聊天会话创建情绪记录

        这是核心方法，在聊天过程中自动调用，
        将检测到的情绪保存到数据库。

        Args:
            user_id: 用户ID
            session_id: 会话ID
            emotion: 检测到的主要情绪
            intensity: 情绪强度 (0-1)
            confidence: 检测置信度 (0-1)
            context_tags: 上下文标签（可选，会自动从文本提取）
            encrypted_text: 加密的用户输入文本（可选）
            user_input: 原始用户输入（可选，用于自动提取标签）
            emotion_scores: 多情绪得分（可选）

        Returns:
            创建的情绪记录
        """
        # 解析情绪类型
        emotion_type = self._parse_emotion_type(emotion)

        # 如果没有提供上下文标签，自动从文本提取
        if context_tags is None and user_input:
            context_tags = self._extract_context_tags(user_input)

        # 如果提供了原始输入但没有加密文本，进行加密
        if user_input and not encrypted_text:
            encrypted_text = encrypt_data(user_input)

        # 确保强度在有效范围内
        intensity = max(0.0, min(1.0, intensity))
        confidence = max(0.0, min(1.0, confidence))

        # 创建情绪记录
        record = EmotionRecord(
            user_id=user_id,
            primary_emotion=emotion_type,
            intensity=intensity,
            confidence=confidence,
            source_type="chat",
            source_id=session_id,
            encrypted_text=encrypted_text,
            context_tags=context_tags or [],
            is_diary=False,
            emotion_scores=emotion_scores,
        )

        self.db.add(record)
        await self.db.commit()
        await self.db.refresh(record)

        return record

    async def get_user_records(
        self,
        user_id: uuid.UUID,
        source_type: Optional[str] = None,
        days: int = 30,
        limit: int = 100,
    ) -> List[EmotionRecord]:
        """
        获取用户的情绪记录

        Args:
            user_id: 用户ID
            source_type: 来源类型过滤（可选）
            days: 查询天数范围
            limit: 返回记录数量限制

        Returns:
            情绪记录列表
        """
        from datetime import timedelta

        start_date = datetime.now(timezone.utc) - timedelta(days=days)

        query = (
            select(EmotionRecord)
            .where(EmotionRecord.user_id == user_id)
            .where(EmotionRecord.recorded_at >= start_date)
            .order_by(EmotionRecord.recorded_at.desc())
        )

        if source_type:
            query = query.where(EmotionRecord.source_type == source_type)

        query = query.limit(limit)

        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_daily_summary(
        self,
        user_id: uuid.UUID,
        date: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        """
        获取指定日期的情绪摘要

        Args:
            user_id: 用户ID
            date: 指定日期（默认今天）

        Returns:
            情绪摘要统计
        """
        if date is None:
            date = datetime.now(timezone.utc)

        start_of_day = date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = start_of_day.replace(hour=23, minute=59, second=59)

        result = await self.db.execute(
            select(EmotionRecord)
            .where(EmotionRecord.user_id == user_id)
            .where(EmotionRecord.recorded_at >= start_of_day)
            .where(EmotionRecord.recorded_at <= end_of_day)
        )
        records = result.scalars().all()

        if not records:
            return {
                "date": date.strftime("%Y-%m-%d"),
                "total_records": 0,
                "dominant_emotion": None,
                "average_intensity": 0,
                "sources": {},
            }

        # 统计情绪分布
        emotion_counts: Dict[str, int] = {}
        total_intensity = 0.0
        sources: Dict[str, int] = {}

        for record in records:
            emotion = record.primary_emotion.value
            emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
            total_intensity += record.intensity
            sources[record.source_type] = sources.get(record.source_type, 0) + 1

        # 找到主要情绪
        dominant_emotion = max(emotion_counts, key=emotion_counts.get)

        return {
            "date": date.strftime("%Y-%m-%d"),
            "total_records": len(records),
            "dominant_emotion": dominant_emotion,
            "average_intensity": total_intensity / len(records),
            "emotion_distribution": emotion_counts,
            "sources": sources,
        }

    async def check_and_record(
        self,
        user_id: uuid.UUID,
        session_id: uuid.UUID,
        emotion_data: Optional[Dict[str, Any]],
        user_input: Optional[str] = None,
    ) -> Optional[EmotionRecord]:
        """
        检查情绪数据并创建记录（便捷方法）

        如果情绪数据有效，自动创建记录。
        用于在聊天流程中快速调用。

        Args:
            user_id: 用户ID
            session_id: 会话ID
            emotion_data: 情绪检测数据（包含emotion, intensity, confidence等）
            user_input: 用户输入文本

        Returns:
            创建的情绪记录，如果数据无效则返回None
        """
        if not emotion_data:
            return None

        emotion = emotion_data.get("emotion") or emotion_data.get("emotion_detected")
        if not emotion:
            return None

        intensity = emotion_data.get("intensity", 0.5)
        confidence = emotion_data.get("confidence", 0.5)
        emotion_scores = emotion_data.get("all_scores") or emotion_data.get("emotion_scores")

        return await self.create_from_chat(
            user_id=user_id,
            session_id=session_id,
            emotion=emotion,
            intensity=intensity,
            confidence=confidence,
            user_input=user_input,
            emotion_scores=emotion_scores,
        )