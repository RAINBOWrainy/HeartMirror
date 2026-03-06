"""
Risk Assessment Agent
风险量化与分层Agent - 使用温暖关切的表达方式
"""
from typing import Any, Dict, Optional
from enum import Enum

from app.agents.base_agent import BaseAgent, AgentResponse
from app.core.persona import HeartMirrorPersona


class RiskLevel(str, Enum):
    """风险等级"""
    GREEN = "green"      # 低风险
    YELLOW = "yellow"    # 中等风险
    ORANGE = "orange"    # 较高风险
    RED = "red"          # 高风险


class RiskAgent(BaseAgent):
    """
    风险量化Agent

    基于多维度评估用户心理健康风险，
    使用关切温暖的语调与用户交流
    """

    def __init__(self, **kwargs):
        super().__init__(name="risk_agent", **kwargs)
        self.risk_factors: Dict[str, float] = {}

    @property
    def default_system_prompt(self) -> str:
        return HeartMirrorPersona.BASE_PERSONA

    async def process(
        self,
        input_text: str,
        context: Optional[Dict[str, Any]] = None
    ) -> AgentResponse:
        """
        处理用户输入，评估风险

        Args:
            input_text: 用户输入
            context: 上下文信息

        Returns:
            包含风险评估结果和关切响应的AgentResponse
        """
        context = context or {}

        # 收集风险因素
        emotion = context.get("emotion", {})
        intensity = emotion.get("intensity", 0.5)
        emotion_type = emotion.get("emotion", "neutral")

        # 计算风险等级
        risk_level = self._calculate_risk_level(
            emotion_type=emotion_type,
            intensity=intensity,
            context=context
        )

        # 生成关切式响应（而非机械化输出）
        content = self._generate_caring_response(risk_level, context)

        return AgentResponse(
            content=content,
            metadata={
                "risk_level": risk_level.value,
                "risk_factors": self.risk_factors
            },
            risk_level=risk_level.value
        )

    def _calculate_risk_level(
        self,
        emotion_type: str,
        intensity: float,
        context: Dict
    ) -> RiskLevel:
        """
        计算风险等级

        Args:
            emotion_type: 情绪类型
            intensity: 情绪强度
            context: 上下文信息

        Returns:
            风险等级
        """
        score = 0.0

        # 情绪因素
        negative_emotions = {"sadness", "anger", "fear", "anxiety", "frustration", "loneliness"}
        if emotion_type in negative_emotions:
            score += intensity * 0.4

        # 持续时间因素
        duration = context.get("duration_days", 0)
        if duration > 14:
            score += 0.2
        elif duration > 7:
            score += 0.1

        # 功能影响
        functional_impact = context.get("functional_impact", 0)
        score += functional_impact * 0.2

        # 自伤想法
        self_harm = context.get("self_harm_thoughts", False)
        if self_harm:
            score += 0.3

        # 危机指标检测
        crisis_keywords = ["死", "不想活", "活着没意思", "结束生命", "自杀"]
        input_lower = context.get("input_text", "").lower()
        for keyword in crisis_keywords:
            if keyword in input_lower:
                score += 0.3
                break

        # 确定风险等级
        if score >= 0.7:
            return RiskLevel.RED
        elif score >= 0.5:
            return RiskLevel.ORANGE
        elif score >= 0.3:
            return RiskLevel.YELLOW
        else:
            return RiskLevel.GREEN

    def _generate_caring_response(
        self,
        risk_level: RiskLevel,
        context: Dict
    ) -> str:
        """
        生成关切式响应

        不再输出机械化风险评估结果，而是用温暖的语调表达关心

        Args:
            risk_level: 风险等级
            context: 上下文信息

        Returns:
            关切式响应文本
        """
        emotion = context.get("emotion", {})
        emotion_type = emotion.get("emotion", "")

        # 高风险情况：提供危机资源
        if risk_level == RiskLevel.RED:
            return self._generate_crisis_response(emotion_type)

        # 使用统一人格系统获取关切响应
        return HeartMirrorPersona.get_risk_concern(risk_level.value)

    def _generate_crisis_response(self, emotion_type: str) -> str:
        """
        生成危机响应

        当检测到高风险时，提供温暖的支持和危机资源

        Args:
            emotion_type: 情绪类型

        Returns:
            危机响应文本
        """
        return HeartMirrorPersona.CRISIS_RESPONSE