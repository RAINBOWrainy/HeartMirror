"""
Questionnaire Agent
对话式问卷评估Agent - "以聊代问"的自然评估体验

使用对话式评估引擎将PHQ-9/GAD-7标准化问题融入自然对话
"""
from typing import Any, Dict, List, Optional
from datetime import datetime

from app.agents.base_agent import BaseAgent, AgentResponse
from app.agents.questionnaire_agent.conversational_assessment import (
    ConversationalAssessmentEngine,
    get_conversational_engine
)
from app.core.persona import HeartMirrorPersona


class QuestionnaireAgent(BaseAgent):
    """
    对话式问卷Agent

    通过自然对话进行心理健康评估，
    将标准化量表问题融入轻松的聊天中
    """

    def __init__(
        self,
        vector_store=None,
        embedder=None,
        rag_engine=None,
        **kwargs
    ):
        super().__init__(name="questionnaire_agent", **kwargs)

        # 使用对话式评估引擎
        self._conversational_engine: Optional[ConversationalAssessmentEngine] = None

        # 兼容性：保留原有的状态管理
        self.current_question_index = 0
        self.responses: List[Dict] = []
        self.detected_symptoms: List[str] = []
        self.assessed_areas: List[str] = []
        self.risk_level = "low"
        self.assessment_complete = False

        # 评估上下文
        self._assessment_context: Dict[str, Any] = {
            "assessed_areas": [],
            "detected_symptoms": [],
            "risk_level": "low",
            "scores": {}
        }

    @property
    def conversational_engine(self) -> ConversationalAssessmentEngine:
        """懒加载对话式评估引擎"""
        if self._conversational_engine is None:
            self._conversational_engine = get_conversational_engine()
        return self._conversational_engine

    @property
    def default_system_prompt(self) -> str:
        return HeartMirrorPersona.BASE_PERSONA

    async def process(
        self,
        input_text: str,
        context: Optional[Dict[str, Any]] = None
    ) -> AgentResponse:
        """
        处理用户输入，进行对话式评估

        Args:
            input_text: 用户输入文本
            context: 额外上下文信息

        Returns:
            Agent响应
        """
        context = context or {}

        # 1. 首先检查危机指标
        if self._check_crisis_indicators(input_text):
            return self._handle_crisis_response()

        # 2. 使用对话式评估引擎获取下一个问题
        result = self.conversational_engine.get_next_question(
            user_response=input_text,
            context=context
        )

        # 3. 更新内部状态
        self._update_internal_state(result)

        # 4. 生成响应
        if result.get("assessment_complete"):
            self.assessment_complete = True
            return self._generate_warm_summary(result)

        # 5. 生成自然对话式问题
        content = self._craft_natural_response(input_text, result)

        return AgentResponse(
            content=content,
            metadata={
                "question_index": self.current_question_index,
                "area": result.get("area"),
                "detected_symptoms": self.detected_symptoms,
                "assessed_areas": self.assessed_areas,
                "risk_level": self.risk_level,
                "assessment_progress": result.get("assessment_progress", {})
            }
        )

    def _check_crisis_indicators(self, text: str) -> bool:
        """
        检查危机指标

        Args:
            text: 用户输入

        Returns:
            是否存在危机指标
        """
        crisis_keywords = [
            "自杀", "想死", "不想活", "活着没意思",
            "结束生命", "伤害自己", "没意义活着"
        ]

        text_lower = text.lower()
        for keyword in crisis_keywords:
            if keyword in text_lower:
                self.risk_level = "high"
                return True

        return False

    def _handle_crisis_response(self) -> AgentResponse:
        """处理危机响应"""
        return AgentResponse(
            content=HeartMirrorPersona.CRISIS_RESPONSE,
            metadata={
                "risk_level": "high",
                "crisis_mode": True
            },
            risk_level="red"
        )

    def _update_internal_state(self, result: Dict[str, Any]):
        """
        更新内部状态

        Args:
            result: 评估引擎返回的结果
        """
        self.current_question_index += 1

        # 同步评估状态
        engine_state = self.conversational_engine.assessed_items
        for symptom_id, data in engine_state.items():
            if symptom_id not in self.detected_symptoms:
                self.detected_symptoms.append(symptom_id)

            if data.get("assessed"):
                if symptom_id not in self.assessed_areas:
                    self.assessed_areas.append(symptom_id)

        self._assessment_context["assessed_areas"] = self.assessed_areas
        self._assessment_context["detected_symptoms"] = self.detected_symptoms

    def _craft_natural_response(
        self,
        user_input: str,
        result: Dict[str, Any]
    ) -> str:
        """
        生成自然对话式响应

        不是直接问问题，而是融入对话中

        Args:
            user_input: 用户输入
            result: 评估结果

        Returns:
            自然对话式响应
        """
        next_question = result.get("content", "")

        # 根据用户输入添加过渡
        transitions = [
            "嗯，我了解了。",
            "谢谢你和我说这些。",
            "我明白了。",
            "嗯嗯，我在听。"
        ]

        import random
        transition = random.choice(transitions)

        # 组合成自然对话
        return f"{transition} {next_question}"

    def _generate_warm_summary(self, result: Dict[str, Any]) -> AgentResponse:
        """
        生成温暖的评估摘要

        不使用机械化的列表形式，
        而是用温暖的语调总结

        Args:
            result: 评估结果

        Returns:
            包含摘要的AgentResponse
        """
        # 使用对话引擎的摘要
        summary = result.get("content", "谢谢你和我聊这么多。")

        # 添加温暖的收尾
        closing = "\n\n有什么想继续聊的，随时告诉我。我会一直在这里。"

        return AgentResponse(
            content=summary + closing,
            metadata={
                "assessment_complete": True,
                "detected_symptoms": self.detected_symptoms,
                "risk_level": self.risk_level,
                "assessed_areas": self.assessed_areas
            }
        )

    def _extract_symptoms(self, text: str) -> List[str]:
        """
        从文本中提取症状关键词

        Args:
            text: 用户输入文本

        Returns:
            提取的症状列表
        """
        symptoms = []

        # 扩展的症状关键词映射
        symptom_keywords = {
            "情绪低落": ["心情不好", "沮丧", "难过", "情绪低落", "不开心", "郁闷", "悲伤", "低落"],
            "兴趣减退": ["没兴趣", "不想做", "提不起劲", "无趣", "什么都不想做"],
            "精力下降": ["累", "乏力", "没精神", "疲劳", "无力", "疲惫", "好累", "心累"],
            "睡眠障碍": ["失眠", "睡不着", "早醒", "睡眠差", "梦多", "睡不好"],
            "食欲改变": ["不想吃", "食欲差", "吃不下", "暴饮暴食"],
            "焦虑": ["担心", "紧张", "不安", "焦虑", "害怕", "焦虑感"],
            "注意力下降": ["分心", "集中不了", "注意力差", "无法专注", "走神"],
            "自我评价低": ["没用", "失败", "自卑", "看不起自己", "一无是处"],
            "孤独": ["孤独", "寂寞", "没人理解", "一个人", "孤单"]
        }

        text_lower = text.lower()
        for symptom, keywords in symptom_keywords.items():
            for keyword in keywords:
                if keyword in text_lower and symptom not in symptoms:
                    symptoms.append(symptom)
                    break

        return symptoms

    def calculate_score(self) -> Dict:
        """
        计算问卷得分

        Returns:
            评分结果
        """
        scores = {
            "total_questions": self.current_question_index,
            "symptoms_detected": len(self.detected_symptoms),
            "risk_level": self.risk_level,
            "areas_assessed": len(self.assessed_areas)
        }

        # 根据症状数量估算严重程度
        if len(self.detected_symptoms) >= 5:
            scores["severity"] = "moderate"
        elif len(self.detected_symptoms) >= 3:
            scores["severity"] = "mild"
        else:
            scores["severity"] = "minimal"

        self._assessment_context["scores"] = scores
        return scores

    def get_assessment_context(self) -> Dict[str, Any]:
        """获取当前评估上下文"""
        return self._assessment_context.copy()

    def reset(self):
        """重置问卷状态"""
        self.current_question_index = 0
        self.responses = []
        self.detected_symptoms = []
        self.assessed_areas = []
        self.risk_level = "low"
        self.assessment_complete = False
        self._assessment_context = {
            "assessed_areas": [],
            "detected_symptoms": [],
            "risk_level": "low",
            "scores": {}
        }

        # 重置对话引擎
        if self._conversational_engine:
            self._conversational_engine.reset()

    def _get_timestamp(self) -> str:
        """获取当前时间戳"""
        return datetime.now().isoformat()