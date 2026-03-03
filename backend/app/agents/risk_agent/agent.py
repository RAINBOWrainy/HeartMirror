"""
Risk Assessment Agent
风险量化与分层Agent
"""
from typing import Any, Dict, Optional
from enum import Enum

from app.agents.base_agent import BaseAgent, AgentResponse


class RiskLevel(str, Enum):
    """风险等级"""
    GREEN = "green"      # 低风险
    YELLOW = "yellow"    # 中等风险
    ORANGE = "orange"    # 较高风险
    RED = "red"          # 高风险


class RiskAgent(BaseAgent):
    """
    风险量化Agent

    基于多维度评估用户心理健康风险
    """

    def __init__(self, **kwargs):
        super().__init__(name="risk_agent", **kwargs)
        self.risk_factors: Dict[str, float] = {}

    @property
    def default_system_prompt(self) -> str:
        return """你是一个专业的心理健康风险评估助手。
你的任务是综合多维度信息评估用户的心理健康风险等级。
你需要考虑：情绪状态、行为表现、认知功能、社交状况等因素。
请谨慎评估，对高风险情况给予特别关注。"""

    async def process(
        self,
        input_text: str,
        context: Optional[Dict[str, Any]] = None
    ) -> AgentResponse:
        """处理用户输入，评估风险"""
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

        # 生成评估结果
        content = self._generate_assessment(risk_level, context)

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
        """计算风险等级"""
        score = 0.0

        # 情绪因素
        negative_emotions = {"sadness", "anger", "fear", "anxiety"}
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

        # 确定风险等级
        if score >= 0.7:
            return RiskLevel.RED
        elif score >= 0.5:
            return RiskLevel.ORANGE
        elif score >= 0.3:
            return RiskLevel.YELLOW
        else:
            return RiskLevel.GREEN

    def _generate_assessment(
        self,
        risk_level: RiskLevel,
        context: Dict
    ) -> str:
        """生成评估结果"""
        level_desc = {
            RiskLevel.GREEN: "当前风险较低",
            RiskLevel.YELLOW: "存在一定风险，建议关注",
            RiskLevel.ORANGE: "存在较高风险，建议寻求专业帮助",
            RiskLevel.RED: "存在高风险，强烈建议立即寻求专业帮助"
        }

        return f"风险评估结果：{level_desc.get(risk_level, '未知')}"