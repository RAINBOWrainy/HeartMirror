"""
Intervention Agent
循证个性化干预方案生成Agent - 使用温暖友好的表达方式
"""
from typing import Any, Dict, List, Optional
from enum import Enum

from app.agents.base_agent import BaseAgent, AgentResponse
from app.core.persona import HeartMirrorPersona


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

    基于循证实践生成个性化干预方案，
    使用温暖友好的语调推荐干预方法
    """

    def __init__(self, knowledge_base=None, **kwargs):
        super().__init__(name="intervention_agent", **kwargs)
        self.knowledge_base = knowledge_base

    @property
    def default_system_prompt(self) -> str:
        return HeartMirrorPersona.BASE_PERSONA

    async def process(
        self,
        input_text: str,
        context: Optional[Dict[str, Any]] = None
    ) -> AgentResponse:
        """
        处理用户输入，生成干预方案

        Args:
            input_text: 用户输入
            context: 上下文信息

        Returns:
            包含干预建议的AgentResponse
        """
        context = context or {}

        # 获取用户情绪和风险信息
        emotion = context.get("emotion", {})
        risk_level = context.get("risk_level", "green")
        emotion_type = emotion.get("emotion", "neutral")

        # 推荐干预类型
        interventions = self._recommend_interventions(
            emotion=emotion,
            risk_level=risk_level,
            user_preferences=context.get("preferences", {})
        )

        # 生成温暖友好的干预建议
        content = self._generate_warm_intervention(interventions, emotion_type)

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
        """
        推荐干预类型

        Args:
            emotion: 情绪信息
            risk_level: 风险等级
            user_preferences: 用户偏好

        Returns:
            干预方案列表
        """
        interventions = []

        # 基于情绪推荐
        emotion_type = emotion.get("emotion", "neutral")
        intensity = emotion.get("intensity", 0.5)

        if emotion_type == "anxiety":
            interventions.append({
                "type": InterventionType.BREATHING.value,
                "name": "4-7-8呼吸法",
                "duration": 5,
                "description": "这是个很有效的放松方法，能帮你快速平静下来",
                "steps": [
                    "找个舒服的姿势坐下",
                    "用鼻子慢慢吸气，心里数4秒",
                    "屏住呼吸，数7秒",
                    "用嘴慢慢呼气，数8秒",
                    "这样重复3-4次就好"
                ]
            })
            if intensity > 0.5:
                interventions.append({
                    "type": InterventionType.MINDFULNESS.value,
                    "name": "正念身体扫描",
                    "duration": 10,
                    "description": "帮助你感受身体每一部分，把紧绷的地方放松下来",
                    "steps": [
                        "躺下来或舒服地坐着",
                        "闭上眼睛，先感受你的呼吸",
                        "然后从头顶开始，慢慢向下感受每个部位",
                        "哪里紧绷就多停留一会儿，让它放松"
                    ]
                })

        elif emotion_type == "sadness":
            interventions.append({
                "type": InterventionType.CBT.value,
                "name": "写下你的想法",
                "duration": 15,
                "description": "有时候把心里的想法写出来，会让它们不那么沉重",
                "steps": [
                    "找一张纸或打开手机备忘录",
                    "写下现在困扰你的想法",
                    "看看这些想法，问问自己：这是真的吗？",
                    "试着换个角度看这件事"
                ]
            })
            interventions.append({
                "type": InterventionType.SOCIAL.value,
                "name": "给信任的人发个消息",
                "duration": 5,
                "description": "有时候一个简单的聊天就能让心情好一点",
                "steps": [
                    "想想谁是你愿意聊聊天的人",
                    "不用说什么大事，就问问对方最近怎么样",
                    "简单的联结有时候比想象中更有力量"
                ]
            })

        elif emotion_type == "anger":
            interventions.append({
                "type": InterventionType.BREATHING.value,
                "name": "深呼吸冷静一下",
                "duration": 5,
                "description": "生气的时候，先让身体冷静下来，脑子才能清醒",
                "steps": [
                    "用鼻子深深吸一口气",
                    "慢慢呼出来，想象把火气也呼出去",
                    "重复几次，直到感觉没那么冲动了"
                ]
            })
            interventions.append({
                "type": InterventionType.EXERCISE.value,
                "name": "出去走走或做点运动",
                "duration": 15,
                "description": "动一动，把身体里的能量释放出来",
                "steps": [
                    "出门散步或者在家做几个俯卧撑",
                    "让身体动起来",
                    "你会发现运动完心情会好很多"
                ]
            })

        elif emotion_type == "frustration":
            interventions.append({
                "type": InterventionType.SELF_CARE.value,
                "name": "给自己一点温柔",
                "duration": 10,
                "description": "累了就休息一下，这不是偷懒，是照顾自己",
                "steps": [
                    "找个舒服的地方坐或躺下",
                    "对自己说：今天辛苦了",
                    "泡杯热茶，或者洗个热水澡",
                    "允许自己什么都不做，就这样休息一会儿"
                ]
            })
            interventions.append({
                "type": InterventionType.BREATHING.value,
                "name": "放松呼吸",
                "duration": 5,
                "description": "简单的呼吸练习，帮身体卸下疲惫",
                "steps": [
                    "闭上眼睛",
                    "用鼻子慢慢吸气，感受空气进入身体",
                    "用嘴慢慢呼气，感受紧张离开身体",
                    "重复5-10次"
                ]
            })

        elif emotion_type == "loneliness":
            interventions.append({
                "type": InterventionType.SOCIAL.value,
                "name": "主动联系一个人",
                "duration": 10,
                "description": "孤独的时候，一点点联结就能带来温暖",
                "steps": [
                    "想想有没有想聊天的朋友或家人",
                    "发个消息，哪怕就是问候一句",
                    "或者加入一个你感兴趣的社群"
                ]
            })
            interventions.append({
                "type": InterventionType.SELF_CARE.value,
                "name": "和自己做朋友",
                "duration": 10,
                "description": "学会享受独处的时光，也是一种能力",
                "steps": [
                    "做一件你真正喜欢的事",
                    "看一部喜欢的电影，听喜欢的歌",
                    "对自己说：陪伴自己也是陪伴"
                ]
            })

        else:
            interventions.append({
                "type": InterventionType.SELF_CARE.value,
                "name": "自我关怀小练习",
                "duration": 10,
                "description": "照顾好自己的小方法",
                "steps": [
                    "做几次深呼吸",
                    "想想今天有什么值得感谢的事",
                    "对自己说一句鼓励的话"
                ]
            })

        return interventions

    def _generate_warm_intervention(
        self,
        interventions: List[Dict],
        emotion_type: str
    ) -> str:
        """
        生成温暖友好的干预建议

        不再使用"为您推荐以下方案"这种机械表述，
        而是用朋友般的语气介绍方法

        Args:
            interventions: 干预方案列表
            emotion_type: 情绪类型

        Returns:
            温暖友好的干预建议文本
        """
        if not interventions:
            return "你现在状态还不错，继续保持就好。有什么想聊的随时找我。"

        # 使用统一人格系统获取开场白
        opening = HeartMirrorPersona.get_intervention_opening(emotion_type)

        # 构建建议内容
        parts = [opening, ""]

        for i, intervention in enumerate(interventions[:2], 1):
            name = intervention.get("name", "练习")
            description = intervention.get("description", "")
            duration = intervention.get("duration", 10)
            steps = intervention.get("steps", [])

            parts.append(f"**{name}**（大概{duration}分钟）")
            parts.append(f"{description}")

            if steps:
                parts.append("具体这样做：")
                for step in steps:
                    parts.append(f"- {step}")
            parts.append("")

        # 使用统一人格系统获取收尾语
        closing = HeartMirrorPersona.get_intervention_closing()
        parts.append(closing)

        return "\n".join(parts)