"""
Crisis Service
危机支持服务
"""
from typing import Dict, List


class CrisisService:
    """危机支持服务"""

    # 心理援助热线资源
    CRISIS_RESOURCES = [
        {
            "name": "全国心理援助热线",
            "phone": "400-161-9995",
            "description": "24小时心理危机干预热线",
            "available_hours": "24小时",
            "region": "全国"
        },
        {
            "name": "北京心理危机研究与干预中心",
            "phone": "010-82951332",
            "description": "北京市心理危机干预服务",
            "available_hours": "24小时",
            "region": "北京"
        },
        {
            "name": "上海心理援助热线",
            "phone": "021-34289888",
            "description": "上海市心理援助服务",
            "available_hours": "24小时",
            "region": "上海"
        },
        {
            "name": "广州市心理援助热线",
            "phone": "020-81899120",
            "description": "广州市心理危机干预服务",
            "available_hours": "24小时",
            "region": "广州"
        },
        {
            "name": "深圳市心理危机干预热线",
            "phone": "0755-25629459",
            "description": "深圳市心理援助服务",
            "available_hours": "24小时",
            "region": "深圳"
        }
    ]

    # 立即行动建议
    IMMEDIATE_ACTIONS = [
        "深呼吸：慢慢吸气4秒，屏住呼吸4秒，慢慢呼气4秒",
        "找一个安全、安静的地方坐下",
        "联系您信任的朋友或家人",
        "拨打心理援助热线寻求专业帮助",
        "如果您感到有自伤或伤人的风险，请立即拨打120或110"
    ]

    # 安全计划模板
    SAFETY_PLAN_TEMPLATE = {
        "step1": "识别警示信号：列出可能触发危机的情况",
        "step2": "内部应对策略：列出可以自我安抚的活动",
        "step3": "社交支持：列出可以联系的人",
        "step4": "专业帮助：列出可以联系的专业机构",
        "step5": "安全环境：确保环境安全，移除危险物品"
    }

    # 接地练习
    GROUNDING_EXERCISES = [
        {
            "name": "5-4-3-2-1 接地技术",
            "description": "使用五感来关注当下",
            "steps": [
                "说出5件你能看到的东西",
                "说出4件你能触摸的东西",
                "说出3件你能听到的声音",
                "说出2件你能闻到的气味",
                "说出1件你能尝到的味道"
            ],
            "duration": "5分钟"
        },
        {
            "name": "深呼吸练习",
            "description": "4-7-8呼吸法",
            "steps": [
                "用鼻子慢慢吸气，数4秒",
                "屏住呼吸，数7秒",
                "用嘴巴慢慢呼气，数8秒",
                "重复3-4次"
            ],
            "duration": "2分钟"
        }
    ]

    @classmethod
    def get_crisis_resources(cls) -> List[Dict]:
        """获取危机资源列表"""
        return cls.CRISIS_RESOURCES

    @classmethod
    def get_immediate_actions(cls) -> List[str]:
        """获取立即行动建议"""
        return cls.IMMEDIATE_ACTIONS

    @classmethod
    def get_safety_plan_template(cls) -> Dict:
        """获取安全计划模板"""
        return cls.SAFETY_PLAN_TEMPLATE

    @classmethod
    def get_grounding_exercises(cls) -> List[Dict]:
        """获取接地练习"""
        return cls.GROUNDING_EXERCISES

    @classmethod
    def is_high_risk(cls, risk_level: str) -> bool:
        """判断是否高风险"""
        return risk_level in ["orange", "red"]

    @classmethod
    def get_crisis_response(cls, risk_level: str) -> Dict:
        """获取危机响应"""
        if risk_level == "red":
            return {
                "message": "我们检测到您可能正处于困难时刻。请知道，您并不孤单，帮助就在身边。",
                "show_resources": True,
                "show_immediate_actions": True,
                "resources": cls.CRISIS_RESOURCES[:3],
                "actions": cls.IMMEDIATE_ACTIONS
            }
        elif risk_level == "orange":
            return {
                "message": "我们关注到您的状态。如果您感到困扰，请随时联系专业机构。",
                "show_resources": True,
                "show_immediate_actions": False,
                "resources": cls.CRISIS_RESOURCES[:2],
                "actions": []
            }
        else:
            return {
                "message": "继续保持对自己心理健康的关注。",
                "show_resources": False,
                "show_immediate_actions": False,
                "resources": [],
                "actions": []
            }