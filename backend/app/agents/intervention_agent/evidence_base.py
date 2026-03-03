"""Evidence-based Intervention Knowledge Base"""

# 循证干预数据库
INTERVENTION_DATABASE = {
    "cbt": {
        "name": "认知行为疗法",
        "description": "通过识别和改变消极思维模式来改善情绪",
        "techniques": [
            {
                "name": "认知重构",
                "description": "识别消极自动思维，挑战不合理信念",
                "steps": [
                    "识别触发事件",
                    "记录自动思维",
                    "评估证据支持/反对",
                    "形成替代性思维"
                ]
            },
            {
                "name": "行为激活",
                "description": "通过增加积极活动改善情绪",
                "steps": [
                    "列出愉悦活动",
                    "制定活动计划",
                    "逐步实施",
                    "记录感受变化"
                ]
            }
        ],
        "evidence_level": "high",
        "suitable_for": ["depression", "anxiety", "stress"]
    },
    "mindfulness": {
        "name": "正念冥想",
        "description": "培养对当下经验的觉察和接纳",
        "techniques": [
            {
                "name": "呼吸冥想",
                "description": "专注于呼吸的冥想练习",
                "duration": "5-20分钟",
                "steps": [
                    "找到安静的地方坐下",
                    "闭上眼睛，关注呼吸",
                    "当注意力分散时，温和地回到呼吸",
                    "逐渐扩展觉察范围"
                ]
            },
            {
                "name": "身体扫描",
                "description": "逐步关注身体各部位的感觉",
                "duration": "10-30分钟",
                "steps": [
                    "躺下或舒适坐着",
                    "从头顶开始，逐步向下",
                    "观察每个部位的感觉",
                    "不做判断，只是观察"
                ]
            }
        ],
        "evidence_level": "high",
        "suitable_for": ["anxiety", "stress", "chronic_pain"]
    },
    "breathing": {
        "name": "呼吸训练",
        "description": "通过控制呼吸来调节自主神经系统",
        "techniques": [
            {
                "name": "4-7-8呼吸法",
                "description": "快速缓解焦虑的呼吸技巧",
                "steps": [
                    "用鼻子吸气，数4秒",
                    "屏住呼吸，数7秒",
                    "用嘴呼气，数8秒",
                    "重复3-4次"
                ]
            },
            {
                "name": "腹式呼吸",
                "description": "深度放松的呼吸方式",
                "steps": [
                    "一手放胸口，一手放腹部",
                    "用鼻子慢吸气，腹部隆起",
                    "用嘴慢呼气，腹部下沉",
                    "练习5-10分钟"
                ]
            }
        ],
        "evidence_level": "medium",
        "suitable_for": ["anxiety", "panic", "stress"]
    }
}