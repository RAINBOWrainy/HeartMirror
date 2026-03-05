"""Risk Assessment Model"""
from dataclasses import dataclass
from typing import Dict, List, Optional
from enum import Enum


class RiskFactor(str, Enum):
    """风险因素类型"""
    EMOTIONAL = "emotional"       # 情绪因素
    BEHAVIORAL = "behavioral"     # 行为因素
    COGNITIVE = "cognitive"       # 认知因素
    SOCIAL = "social"             # 社交因素
    PHYSICAL = "physical"         # 躯体因素


@dataclass
class RiskAssessment:
    """风险评估结果"""
    level: str
    score: float
    factors: Dict[str, float]
    recommendations: List[str]
    requires_immediate_attention: bool


class RiskLevel(str, Enum):
    """风险等级"""
    GREEN = "green"      # 低风险
    YELLOW = "yellow"    # 中等风险
    ORANGE = "orange"    # 较高风险
    RED = "red"          # 高风险


class RiskModel:
    """风险评估模型"""

    def __init__(self):
        self.weights = {
            RiskFactor.EMOTIONAL: 0.3,
            RiskFactor.BEHAVIORAL: 0.25,
            RiskFactor.COGNITIVE: 0.2,
            RiskFactor.SOCIAL: 0.15,
            RiskFactor.PHYSICAL: 0.1
        }

        # 风险等级阈值
        self.thresholds = {
            RiskLevel.GREEN: 0.0,    # 0-0.25
            RiskLevel.YELLOW: 0.25,  # 0.25-0.45
            RiskLevel.ORANGE: 0.45,  # 0.45-0.65
            RiskLevel.RED: 0.65,     # 0.65+
        }

        # 风险等级对应的推荐建议
        self.recommendations_by_level = {
            RiskLevel.GREEN: [
                "继续保持良好的心理状态",
                "可以尝试记录情绪日记来追踪心情变化",
                "保持规律的作息和运动习惯"
            ],
            RiskLevel.YELLOW: [
                "建议进行情绪记录和自我观察",
                "尝试正念冥想或呼吸练习",
                "与信任的朋友或家人交流感受"
            ],
            RiskLevel.ORANGE: [
                "强烈建议寻求专业心理咨询",
                "尝试认知行为疗法(CBT)技巧",
                "建立规律的自我关怀习惯",
                "联系心理援助热线获取支持"
            ],
            RiskLevel.RED: [
                "请立即寻求专业帮助",
                "拨打心理援助热线：400-161-9995",
                "前往最近的精神卫生中心",
                "告知信任的人您的状况"
            ]
        }

    def assess(self, factors: Dict[RiskFactor, float]) -> RiskAssessment:
        """
        进行风险评估

        Args:
            factors: 各风险因素的评分字典，值为0-1之间的浮点数
                    0表示无风险，1表示极高风险

        Returns:
            RiskAssessment: 风险评估结果
        """
        # 验证输入
        validated_factors = {}
        for factor in RiskFactor:
            if factor in factors:
                # 确保值在0-1范围内
                value = max(0.0, min(1.0, factors[factor]))
                validated_factors[factor.value] = value
            else:
                # 缺失因素默认为0（无风险）
                validated_factors[factor.value] = 0.0

        # 计算加权风险分数
        weighted_score = 0.0
        for factor, weight in self.weights.items():
            factor_score = validated_factors.get(factor.value, 0.0)
            weighted_score += factor_score * weight

        # 确保分数在0-1范围内
        weighted_score = max(0.0, min(1.0, weighted_score))

        # 确定风险等级
        level = self._determine_level(weighted_score)

        # 检查是否需要立即关注
        requires_immediate = (
            level == RiskLevel.RED or
            validated_factors.get(RiskFactor.BEHAVIORAL.value, 0) >= 0.8 or
            validated_factors.get(RiskFactor.EMOTIONAL.value, 0) >= 0.9
        )

        # 生成推荐建议
        recommendations = self._generate_recommendations(
            level,
            validated_factors,
            requires_immediate
        )

        return RiskAssessment(
            level=level.value,
            score=weighted_score,
            factors=validated_factors,
            recommendations=recommendations,
            requires_immediate_attention=requires_immediate
        )

    def _determine_level(self, score: float) -> RiskLevel:
        """根据分数确定风险等级"""
        if score >= self.thresholds[RiskLevel.RED]:
            return RiskLevel.RED
        elif score >= self.thresholds[RiskLevel.ORANGE]:
            return RiskLevel.ORANGE
        elif score >= self.thresholds[RiskLevel.YELLOW]:
            return RiskLevel.YELLOW
        else:
            return RiskLevel.GREEN

    def _generate_recommendations(
        self,
        level: RiskLevel,
        factors: Dict[str, float],
        requires_immediate: bool
    ) -> List[str]:
        """生成个性化推荐建议"""
        recommendations = list(self.recommendations_by_level.get(level, []))

        # 根据具体风险因素添加针对性建议
        if factors.get(RiskFactor.EMOTIONAL.value, 0) >= 0.6:
            recommendations.append("关注情绪波动，尝试情绪调节技巧")

        if factors.get(RiskFactor.BEHAVIORAL.value, 0) >= 0.5:
            recommendations.append("注意行为变化，保持日常活动规律")

        if factors.get(RiskFactor.COGNITIVE.value, 0) >= 0.5:
            recommendations.append("尝试认知重构练习，识别负面思维模式")

        if factors.get(RiskFactor.SOCIAL.value, 0) >= 0.5:
            recommendations.append("尝试增加社交互动，哪怕是小步骤")

        if factors.get(RiskFactor.PHYSICAL.value, 0) >= 0.5:
            recommendations.append("关注睡眠和饮食，保持基本生理需求")

        # 去重并保持顺序
        seen = set()
        unique_recommendations = []
        for rec in recommendations:
            if rec not in seen:
                seen.add(rec)
                unique_recommendations.append(rec)

        return unique_recommendations[:5]  # 最多返回5条建议

    def assess_from_emotion(
        self,
        emotion: str,
        intensity: float,
        context: Optional[Dict] = None
    ) -> RiskAssessment:
        """
        从情绪数据快速评估风险

        Args:
            emotion: 识别到的情绪类型
            intensity: 情绪强度 (0-1)
            context: 额外上下文信息

        Returns:
            RiskAssessment: 风险评估结果
        """
        context = context or {}

        # 根据情绪类型映射风险因素
        negative_emotions = {
            "sadness", "anger", "fear", "anxiety",
            "shame", "guilt", "loneliness", "frustration"
        }

        high_risk_emotions = {"fear", "anger", "anxiety"}

        # 计算各维度风险
        factors = {}

        # 情绪因素：基于情绪类型和强度
        if emotion in negative_emotions:
            factors[RiskFactor.EMOTIONAL] = intensity
            if emotion in high_risk_emotions and intensity >= 0.8:
                factors[RiskFactor.EMOTIONAL] = min(1.0, intensity + 0.1)
        else:
            factors[RiskFactor.EMOTIONAL] = max(0, intensity - 0.3)

        # 行为因素：从上下文推断
        behavioral_indicators = context.get("behavioral_indicators", [])
        if behavioral_indicators:
            factors[RiskFactor.BEHAVIORAL] = min(1.0, len(behavioral_indicators) * 0.2)
        else:
            factors[RiskFactor.BEHAVIORAL] = intensity * 0.5 if emotion in negative_emotions else 0.1

        # 认知因素：从上下文推断
        cognitive_distortion = context.get("cognitive_distortion", False)
        factors[RiskFactor.COGNITIVE] = 0.7 if cognitive_distortion else intensity * 0.3

        # 社交因素：从上下文推断
        social_withdrawal = context.get("social_withdrawal", False)
        factors[RiskFactor.SOCIAL] = 0.6 if social_withdrawal else 0.1

        # 躯体因素：从上下文推断
        physical_symptoms = context.get("physical_symptoms", [])
        factors[RiskFactor.PHYSICAL] = min(1.0, len(physical_symptoms) * 0.15)

        return self.assess(factors)