"""
Conversational Assessment Engine
对话式评估引擎 - 将PHQ-9/GAD-7标准化问题融入自然对话

核心理念："以聊代问" - 让用户在自然对话中完成心理评估
"""
from typing import Dict, List, Optional, Any
import random


class ConversationalAssessmentEngine:
    """
    对话式评估引擎

    将传统问卷评估转化为自然对话流程，
    使用户在轻松的聊天中完成心理健康评估
    """

    # PHQ-9问题到自然对话的映射
    # 原始问题 → 自然对话引导语 → 追问语
    PHQ9_CONVERSATIONAL = {
        "anhedonia": {
            # 原问题：做事时提不起劲或没有兴趣
            "name": "兴趣减退",
            "area": "mood",
            "lead_in": [
                "最近有什么让你感兴趣的事情吗？",
                "平时喜欢做的事情，最近还有在做吗？",
                "有没有什么爱好是你以前很喜欢，最近却不太想做的？"
            ],
            "follow_up": [
                "听起来最近有点提不起劲...",
                "是感觉没什么意思，还是太累了不想动？",
                "这种感觉持续多久了？"
            ],
            "severity_indicators": {
                "mild": ["有点提不起劲", "偶尔不想做"],
                "moderate": ["什么都不想做", "以前喜欢的事也不想做了"],
                "severe": ["完全没兴趣", "什么都觉得没意思"]
            }
        },
        "depressed_mood": {
            # 原问题：感到心情低落、沮丧或绝望
            "name": "情绪低落",
            "area": "mood",
            "lead_in": [
                "最近心情怎么样？",
                "这几天情绪还好吗？",
                "有没有什么时候感觉心里不太舒服？"
            ],
            "follow_up": [
                "这种感觉多久了？",
                "是那种说不清楚的难受吗？",
                "有什么事情让你这样感觉吗？"
            ],
            "severity_indicators": {
                "mild": ["有点低落", "偶尔不开心"],
                "moderate": ["很沮丧", "心情很不好"],
                "severe": ["绝望", "看不到希望", "特别难受"]
            }
        },
        "sleep_issues": {
            # 原问题：入睡困难、易醒或睡眠过多
            "name": "睡眠问题",
            "area": "sleep",
            "lead_in": [
                "最近睡眠怎么样？能睡好吗？",
                "晚上能睡踏实吗？",
                "有没有睡不着或者睡不好的情况？"
            ],
            "follow_up": [
                "是睡不着，还是睡不醒？",
                "大概几点能睡着？",
                "半夜会醒吗？醒了还能睡着吗？"
            ],
            "severity_indicators": {
                "mild": ["偶尔睡不好", "入睡有点慢", "睡不好"],
                "moderate": ["经常失眠", "半夜经常醒", "失眠", "睡不着", "睡不醒"],
                "severe": ["整晚睡不着", "凌晨就醒了再也睡不着", "严重失眠", "彻夜难眠"]
            }
        },
        "fatigue": {
            # 原问题：感觉疲倦或没有活力
            "name": "疲劳感",
            "area": "energy",
            "lead_in": [
                "最近精力怎么样？",
                "白天会感觉很累吗？",
                "有没有觉得没什么力气？"
            ],
            "follow_up": [
                "是身体累还是心里累？",
                "休息能缓过来吗？",
                "做事情的时候有动力吗？"
            ],
            "severity_indicators": {
                "mild": ["有点累", "精力一般"],
                "moderate": ["很疲惫", "没精神"],
                "severe": ["一点力气都没有", "动一下都费劲"]
            }
        },
        "appetite": {
            # 原问题：食欲不振或吃得太多
            "name": "食欲变化",
            "area": "appetite",
            "lead_in": [
                "最近胃口怎么样？",
                "吃饭还香吗？",
                "有没有不想吃饭或者特别想吃东西的时候？"
            ],
            "follow_up": [
                "是吃不下还是吃得比以前多了？",
                "体重有变化吗？",
                "这种感觉有多久了？"
            ],
            "severity_indicators": {
                "mild": ["胃口不太好", "偶尔不想吃"],
                "moderate": ["吃不下饭", "或者暴饮暴食"],
                "severe": ["完全没食欲", "或者控制不住地吃"]
            }
        },
        "worthlessness": {
            # 原问题：觉得自己很糟糕，或觉得自己很失败
            "name": "自我评价低",
            "area": "self_worth",
            "lead_in": [
                "最近对自己感觉怎么样？",
                "会不会觉得自己做得不够好？",
                "有没有觉得自己没什么价值？"
            ],
            "follow_up": [
                "这种感觉从哪来的？",
                "以前会有这样的想法吗？",
                "你觉得这样的想法准确吗？"
            ],
            "severity_indicators": {
                "mild": ["有点不满意自己"],
                "moderate": ["觉得自己很失败", "没什么用"],
                "severe": ["一无是处", "完全没用"]
            }
        },
        "concentration": {
            # 原问题：对事物专注有困难
            "name": "注意力问题",
            "area": "cognitive",
            "lead_in": [
                "最近做事情能集中注意力吗？",
                "看书或做事的时候会不会容易分心？",
                "做决定有困难吗？"
            ],
            "follow_up": [
                "是很容易走神吗？",
                "看电视剧能看进去吗？",
                "这种情况严重吗？"
            ],
            "severity_indicators": {
                "mild": ["偶尔分心"],
                "moderate": ["经常走神", "很难集中"],
                "severe": ["完全无法集中", "什么都看不进去"]
            }
        },
        "psychomotor": {
            # 原问题：动作或说话速度缓慢，或相反
            "name": "行动变化",
            "area": "behavior",
            "lead_in": [
                "最近说话和动作怎么样？",
                "有没有觉得自己变得特别慢，或者特别烦躁坐不住？",
                "别人有说过你最近不太一样吗？"
            ],
            "follow_up": [
                "是感觉变慢了还是变快了？",
                "这种情况明显吗？",
                "什么时候开始的？"
            ],
            "severity_indicators": {
                "mild": ["有点变化"],
                "moderate": ["别人也注意到了", "很明显的变化"],
                "severe": ["完全不想动", "或者完全静不下来"]
            }
        },
        "suicidal_ideation": {
            # 原问题：有不如死掉或伤害自己的念头
            "name": "消极想法",
            "area": "crisis",
            "lead_in": [
                "有时候生活真的挺难的...你有没有觉得特别绝望的时候？",
                "有没有觉得活着特别累？",
                "最近有没有一些让你担心的想法？"
            ],
            "follow_up": [
                "你能和我说说这种感觉吗？",
                "这种想法有多久了？",
                "你有想过具体怎么做吗？"
            ],
            "severity_indicators": {
                "mild": ["活着没意思"],
                "moderate": ["想解脱", "不如死了算了"],
                "severe": ["有具体计划", "想结束生命"]
            },
            "crisis": True  # 标记为危机指标
        }
    }

    # GAD-7问题映射
    GAD7_CONVERSATIONAL = {
        "nervousness": {
            # 原问题：感到紧张、焦虑或急切
            "name": "紧张焦虑",
            "area": "anxiety",
            "lead_in": [
                "最近会感觉紧张或不安吗？",
                "有没有莫名其妙地焦虑？",
                "心里会不会经常揪着？"
            ],
            "follow_up": [
                "这种感觉有多久了？",
                "什么情况下会这样？",
                "程度严重吗？"
            ]
        },
        "worry_control": {
            # 原问题：不能停止或控制担忧
            "name": "无法控制担忧",
            "area": "anxiety",
            "lead_in": [
                "会不会有些事情一直在大脑里转，停不下来？",
                "担心的事情能放下吗？",
                "有没有觉得脑子里一直在想事情？"
            ],
            "follow_up": [
                "能控制这些想法吗？",
                "尝试过什么方法？",
                "这样有多久了？"
            ]
        },
        "excessive_worry": {
            # 原问题：对各种事情过分担忧
            "name": "过度担忧",
            "area": "anxiety",
            "lead_in": [
                "会不会担心很多不同的事情？",
                "有没有什么事情让你特别担心？",
                "你是不是那种容易操心的人？"
            ],
            "follow_up": [
                "都在担心什么？",
                "这些担心有必要吗？",
                "担心会让你做不了别的事吗？"
            ]
        },
        "relaxation": {
            # 原问题：很难放松
            "name": "难以放松",
            "area": "anxiety",
            "lead_in": [
                "休息的时候能真正放松下来吗？",
                "有没有觉得一直紧绷着？",
                "周末或假期的时候能放松吗？"
            ],
            "follow_up": [
                "是身体紧绷还是心里紧绷？",
                "试过什么放松方法吗？",
                "这种情况有多久了？"
            ]
        },
        "restlessness": {
            # 原问题：由于不安而无法静坐
            "name": "坐立不安",
            "area": "anxiety",
            "lead_in": [
                "有没有觉得坐不住？",
                "会不会经常动来动去的？",
                "身体会不会觉得哪里不舒服？"
            ],
            "follow_up": [
                "是心里急还是身体不舒服？",
                "这样有多久了？",
                "影响你做事情吗？"
            ]
        },
        "irritability": {
            # 原问题：变得容易烦恼或急躁
            "name": "易烦躁",
            "area": "mood",
            "lead_in": [
                "最近脾气怎么样？",
                "会不会很容易烦躁或生气？",
                "有什么事情让你特别烦吗？"
            ],
            "follow_up": [
                "是对人还是对事？",
                "发完脾气会后悔吗？",
                "这种情况频繁吗？"
            ]
        },
        "fear": {
            # 原问题：感到似乎将有可怕的事情发生
            "name": "恐惧预感",
            "area": "anxiety",
            "lead_in": [
                "会不会担心会有不好的事情发生？",
                "有没有预感要出什么事？",
                "心里会不会有一种害怕的感觉？"
            ],
            "follow_up": [
                "你担心会发生什么？",
                "这种预感强烈吗？",
                "有原因吗？"
            ]
        }
    }

    def __init__(self):
        """初始化对话式评估引擎"""
        self.assessed_items: Dict[str, Dict] = {}
        self.current_area: Optional[str] = None
        self.assessment_scores: Dict[str, int] = {}
        self.conversation_flow: List[str] = []

    def get_next_question(
        self,
        user_response: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        获取下一个自然对话问题

        Args:
            user_response: 用户的回复
            context: 上下文信息

        Returns:
            包含问题和元数据的字典
        """
        context = context or {}

        # 分析用户回复，检测症状信号
        if user_response:
            detected = self._detect_symptom_signals(user_response)
            for symptom, severity in detected.items():
                if symptom not in self.assessed_items:
                    self.assessed_items[symptom] = {
                        "severity": severity,
                        "assessed": True
                    }

        # 确定下一个评估领域
        next_area = self._select_next_area()

        if next_area is None:
            # 评估完成
            return {
                "type": "summary",
                "content": self._generate_summary(),
                "assessment_complete": True
            }

        # 获取该领域的问题
        question_data = self._get_question_for_area(next_area)

        return {
            "type": "question",
            "content": question_data["question"],
            "area": next_area,
            "assessment_progress": self._get_progress(),
            "assessment_complete": False
        }

    def _detect_symptom_signals(self, text: str) -> Dict[str, str]:
        """
        从用户回复中检测症状信号（增强版：支持否定词检测）

        Args:
            text: 用户回复文本

        Returns:
            检测到的症状及其严重程度
        """
        detected = {}

        # 否定词列表
        negation_words = ["不", "没", "无", "不会", "没有", "不是", "不再", "别"]

        def has_negation(text: str, keyword: str) -> bool:
            """检查关键词前是否有否定词"""
            idx = text.find(keyword)
            if idx == -1:
                return False
            # 检查关键词前5个字符内是否有否定词
            prefix = text[max(0, idx-5):idx]
            return any(neg in prefix for neg in negation_words)

        # 检测PHQ-9相关症状
        for symptom_id, symptom_data in self.PHQ9_CONVERSATIONAL.items():
            indicators = symptom_data.get("severity_indicators", {})

            # 检查严重程度（从严重到轻微）
            for severity in ["severe", "moderate", "mild"]:
                if severity in indicators:
                    for indicator in indicators[severity]:
                        if indicator in text:
                            # 检查是否有否定词
                            if has_negation(text, indicator):
                                continue  # 跳过被否定的情况
                            detected[symptom_id] = severity
                            break
                    if symptom_id in detected:
                        break

        # 检测GAD-7相关症状（增强版）
        gad7_keywords = {
            "nervousness": ["紧张", "不安", "焦虑", "揪心"],
            "worry_control": ["停不下来", "控制不住", "一直想"],
            "excessive_worry": ["担心很多", "各种担心", "操心"],
            "relaxation": ["放松不下来", "紧绷", "休息不好"],
            "restlessness": ["坐不住", "动来动去", "不安定"],
            "irritability": ["烦躁", "易怒", "脾气大"],
            "fear": ["害怕", "恐惧", "预感"]
        }

        for symptom_id, keywords in gad7_keywords.items():
            for keyword in keywords:
                if keyword in text:
                    # 检查是否有否定词
                    if has_negation(text, keyword):
                        continue
                    detected[symptom_id] = "moderate"
                    break

        return detected

    def _select_next_area(self) -> Optional[str]:
        """
        选择下一个评估领域

        Returns:
            下一个领域的ID，如果评估完成则返回None
        """
        # 优先评估危机指标
        if "suicidal_ideation" not in self.assessed_items:
            return "suicidal_ideation"

        # 然后评估情绪相关
        priority_order = [
            "depressed_mood",
            "anhedonia",
            "nervousness",
            "sleep_issues",
            "fatigue",
            "worthlessness",
            "concentration",
            "relaxation"
        ]

        for area in priority_order:
            if area not in self.assessed_items:
                return area

        return None

    def _get_question_for_area(self, area: str) -> Dict[str, Any]:
        """
        获取特定领域的问题

        Args:
            area: 领域ID

        Returns:
            问题数据
        """
        # 检查PHQ-9
        if area in self.PHQ9_CONVERSATIONAL:
            data = self.PHQ9_CONVERSATIONAL[area]
            question = random.choice(data["lead_in"])
            self.current_area = area
            return {
                "question": question,
                "area_name": data["name"],
                "crisis": data.get("crisis", False)
            }

        # 检查GAD-7
        if area in self.GAD7_CONVERSATIONAL:
            data = self.GAD7_CONVERSATIONAL[area]
            question = random.choice(data["lead_in"])
            self.current_area = area
            return {
                "question": question,
                "area_name": data["name"],
                "crisis": False
            }

        # 默认问题
        return {
            "question": "最近还有什么想和我说的吗？",
            "area_name": "其他",
            "crisis": False
        }

    def _get_progress(self) -> Dict[str, Any]:
        """获取评估进度"""
        total_items = len(self.PHQ9_CONVERSATIONAL) + len(self.GAD7_CONVERSATIONAL)
        assessed_count = len(self.assessed_items)

        return {
            "total": total_items,
            "assessed": assessed_count,
            "percentage": assessed_count / total_items * 100 if total_items > 0 else 0
        }

    def _generate_summary(self) -> str:
        """生成评估摘要"""
        symptoms = []

        for symptom_id, data in self.assessed_items.items():
            if data.get("assessed") and data.get("severity") != "mild":
                # 获取症状名称
                if symptom_id in self.PHQ9_CONVERSATIONAL:
                    name = self.PHQ9_CONVERSATIONAL[symptom_id]["name"]
                elif symptom_id in self.GAD7_CONVERSATIONAL:
                    name = self.GAD7_CONVERSATIONAL[symptom_id]["name"]
                else:
                    name = symptom_id

                symptoms.append({
                    "name": name,
                    "severity": data.get("severity", "mild")
                })

        if not symptoms:
            return "通过我们的聊天，我感觉你最近状态还不错。有什么想继续聊的吗？"

        # 生成自然的摘要
        summary_parts = ["谢谢你和我聊这么多。"]
        summary_parts.append("我感觉到你最近在一些方面可能有点压力。")

        severe_symptoms = [s for s in symptoms if s["severity"] == "severe"]
        if severe_symptoms:
            summary_parts.append("有些情况让我有点担心你。")

        summary_parts.append("如果你觉得需要，可以考虑和专业的心理咨询师聊聊。")
        summary_parts.append("我会一直在这里，有什么想说的随时找我。")

        return " ".join(summary_parts)

    def reset(self):
        """重置评估状态"""
        self.assessed_items = {}
        self.current_area = None
        self.assessment_scores = {}
        self.conversation_flow = []


# 全局单例
_conversational_engine: Optional[ConversationalAssessmentEngine] = None


def get_conversational_engine() -> ConversationalAssessmentEngine:
    """获取对话式评估引擎单例"""
    global _conversational_engine
    if _conversational_engine is None:
        _conversational_engine = ConversationalAssessmentEngine()
    return _conversational_engine