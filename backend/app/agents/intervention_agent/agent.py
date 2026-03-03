"""
Intervention Agent
循证个性化干预方案生成Agent
"""
from typing import Any, Dict, List, Optional
from enum import Enum

from app.agents.base_agent import BaseAgent, AgentResponse


class InterventionType(str, Enum):
    """干预类型"""
    CBT = "cbt"                 # 认知行为疗法
    MINDFULNESS = "mindfulness" # 正念冥想
    BREATHING = "breathing"     # 呼吸训练
    EXERCISE = "exercise"       # 运动建议
    SOCIAL = "social"           # 社交活动
    SELF_CARE = "self_care"     # 自我关怀


class InterventionAgent(BaseAgent):
    """
    干预方案Agent

    基于循证实践生成个性化干预方案
    """

    def __init__(self, knowledge_base=None, **kwargs):
        super().__init__(name="intervention_agent", **kwargs)
        self.knowledge_base = knowledge_base

    @property
    def default_system_prompt(self) -> str:
        return """你是一个专业的心理健康干预助手。
你的任务是根据用户的具体情况，推荐适合的循证干预方案。
可用的干预类型包括：
- 认知行为疗法(CBT)：帮助识别和改变消极思维
- 正念冥想：培养当下觉察和接纳能力
- 呼吸训练：快速缓解焦虑和紧张
- 运动建议：通过身体活动改善情绪
- 社交活动：建立和维护社会支持

请根据用户的需求和偏好推荐最合适的干预方案。"""

    async def process(
        self,
        input_text: str,
        context: Optional[Dict[str, Any]] = None
    ) -> AgentResponse:
        """处理用户输入，生成干预方案"""
        context = context or {}

        # 获取用户情绪和风险信息
        emotion = context.get("emotion", {})
        risk_level = context.get("risk_level", "green")

        # 推荐干预类型
        interventions = self._recommend_interventions(
            emotion=emotion,
            risk_level=risk_level,
            user_preferences=context.get("preferences", {})
        )

        # 生成干预方案
        content = self._generate_intervention_plan(interventions)

        return AgentResponse(
            content=content,
            metadata={
                "interventions": interventions,
                "duration": 15  # 推荐时长（分钟）
            }
        )

    def _recommend_interventions(
        self,
        emotion: Dict,
        risk_level: str,
        user_preferences: Dict
    ) -> List[Dict]:
        """推荐干预类型"""
        interventions = []

        # 基于情绪推荐
        emotion_type = emotion.get("emotion", "neutral")

        if emotion_type == "anxiety":
            interventions.append({
                "type": InterventionType.BREATHING.value,
                "name": "4-7-8呼吸法",
                "duration": 5,
                "description": "快速缓解焦虑的呼吸练习"
            })
            interventions.append({
                "type": InterventionType.MINDFULNESS.value,
                "name": "正念身体扫描",
                "duration": 10,
                "description": "帮助放松身体和稳定情绪"
            })

        elif emotion_type == "sadness":
            interventions.append({
                "type": InterventionType.CBT.value,
                "name": "认知重构练习",
                "duration": 15,
                "description": "识别和挑战消极思维"
            })
            interventions.append({
                "type": InterventionType.SOCIAL.value,
                "name": "社交活动建议",
                "duration": 30,
                "description": "与朋友或家人联系"
            })

        elif emotion_type == "anger":
            interventions.append({
                "type": InterventionType.BREATHING.value,
                "name": "深呼吸放松",
                "duration": 5,
                "description": "帮助平静情绪"
            })
            interventions.append({
                "type": InterventionType.EXERCISE.value,
                "name": "运动释放",
                "duration": 20,
                "description": "通过运动释放压力"
            })

        else:
            interventions.append({
                "type": InterventionType.SELF_CARE.value,
                "name": "自我关怀练习",
                "duration": 10,
                "description": "关爱自己的简单方法"
            })

        return interventions

    def _generate_intervention_plan(self, interventions: List[Dict]) -> str:
        """生成干预方案文本"""
        if not interventions:
            return "根据您当前的状态，建议保持良好的自我关照习惯。"

        lines = ["为您推荐以下干预方案：\n"]
        for i, intervention in enumerate(interventions, 1):
            lines.append(f"{i}. {intervention['name']}（约{intervention['duration']}分钟）")
            lines.append(f"   {intervention['description']}\n")

        return "\n".join(lines)