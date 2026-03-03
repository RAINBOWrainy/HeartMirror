"""
Questionnaire Agent
RAG驱动的对话式动态问卷生成Agent
"""
from typing import Any, Dict, List, Optional
import json

from app.agents.base_agent import BaseAgent, AgentResponse
from app.agents.questionnaire_agent.rag_engine import RAGEngine
from app.agents.questionnaire_agent.prompts import (
    QUESTIONNAIRE_SYSTEM_PROMPT,
    QUESTION_GENERATION_PROMPT
)


class QuestionnaireAgent(BaseAgent):
    """
    动态问卷Agent

    使用RAG技术生成个性化问卷，根据用户回答动态调整问题
    """

    def __init__(
        self,
        vector_store=None,
        embedder=None,
        rag_engine: Optional[RAGEngine] = None,
        **kwargs
    ):
        super().__init__(name="questionnaire_agent", **kwargs)

        # 初始化RAG引擎
        if rag_engine:
            self.rag_engine = rag_engine
        else:
            self.rag_engine = RAGEngine(
                vector_store=vector_store,
                embedder=embedder
            )

        # 问卷状态
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
    def default_system_prompt(self) -> str:
        return QUESTIONNAIRE_SYSTEM_PROMPT

    async def initialize(self):
        """初始化Agent，准备知识库"""
        await self.rag_engine.initialize_knowledge_base()

    async def process(
        self,
        input_text: str,
        context: Optional[Dict[str, Any]] = None
    ) -> AgentResponse:
        """
        处理用户输入

        Args:
            input_text: 用户输入文本
            context: 额外上下文信息

        Returns:
            Agent响应
        """
        context = context or {}

        # 1. 检查风险指标
        risk_indicators = self.rag_engine.check_risk_indicators(input_text)
        if risk_indicators:
            self.risk_level = "high"
            self._assessment_context["risk_level"] = "high"
            return self._handle_risk_response(risk_indicators)

        # 2. 提取症状信息
        new_symptoms = self._extract_symptoms(input_text)
        self.detected_symptoms.extend(new_symptoms)
        self._assessment_context["detected_symptoms"] = self.detected_symptoms

        # 3. 记录用户回答
        self.responses.append({
            "question_index": self.current_question_index,
            "user_input": input_text,
            "detected_symptoms": new_symptoms,
            "timestamp": self._get_timestamp()
        })

        # 4. 生成RAG上下文
        conversation_history = context.get("conversation_history", [])
        rag_context = await self.rag_engine.generate_context(
            query=input_text,
            conversation_history=conversation_history,
            detected_symptoms=self.detected_symptoms
        )

        # 5. 获取下一个问题指导
        guidance = await self.rag_engine.get_next_question_guidance(
            self._assessment_context
        )

        # 6. 更新评估状态
        if guidance["suggested_area"] and guidance["suggested_area"] not in self.assessed_areas:
            self.assessed_areas.append(guidance["suggested_area"])
            self._assessment_context["assessed_areas"] = self.assessed_areas

        # 7. 生成响应
        if guidance["suggested_area"] == "summary":
            self.assessment_complete = True
            return self._generate_summary_response()

        self.current_question_index += 1

        # 8. 选择下一个问题
        next_question = self._select_next_question(guidance, rag_context)

        return AgentResponse(
            content=next_question,
            metadata={
                "question_index": self.current_question_index,
                "suggested_area": guidance["suggested_area"],
                "detected_symptoms": self.detected_symptoms,
                "assessed_areas": self.assessed_areas,
                "risk_level": self.risk_level,
                "rag_context": rag_context[:500] if rag_context else None
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

        # 症状关键词映射
        symptom_keywords = {
            "情绪低落": ["心情不好", "沮丧", "难过", "情绪低落", "不开心", "郁闷"],
            "兴趣减退": ["没兴趣", "不想做", "提不起劲", "无趣"],
            "精力下降": ["累", "乏力", "没精神", "疲劳", "无力"],
            "睡眠障碍": ["失眠", "睡不着", "早醒", "睡眠差", "梦多"],
            "食欲改变": ["不想吃", "食欲差", "吃不下", "暴饮暴食"],
            "焦虑": ["担心", "紧张", "不安", "焦虑", "害怕"],
            "注意力下降": ["分心", "集中不了", "注意力差", "无法专注"],
            "自我评价低": ["没用", "失败", "自卑", "看不起自己"],
            "消极想法": ["想死", "活着没意思", "不如死掉", "消极"]
        }

        text_lower = text.lower()
        for symptom, keywords in symptom_keywords.items():
            for keyword in keywords:
                if keyword in text_lower and symptom not in symptoms:
                    symptoms.append(symptom)
                    break

        return symptoms

    def _handle_risk_response(self, risk_indicators: List[str]) -> AgentResponse:
        """处理高风险响应"""
        return AgentResponse(
            content="我注意到您提到了一些令我担心的想法。您的安全对我非常重要。"
                    "如果您正在经历困难时刻，请知道有人愿意帮助您。\n\n"
                    "您可以拨打以下热线获得即时支持：\n"
                    "- 全国心理援助热线：400-161-9995\n"
                    "- 北京心理危机干预中心：010-82951332\n\n"
                    "这些热线24小时有人接听，您可以随时拨打。您愿意和我聊聊吗？",
            metadata={
                "risk_level": "high",
                "risk_indicators": risk_indicators,
                "crisis_mode": True
            }
        )

    def _select_next_question(
        self,
        guidance: Dict[str, Any],
        rag_context: str
    ) -> str:
        """
        选择下一个问题

        Args:
            guidance: 问题指导信息
            rag_context: RAG上下文

        Returns:
            下一个问题
        """
        sample_questions = guidance.get("sample_questions", [])
        reason = guidance.get("reason", "")

        # 如果有示例问题，选择第一个
        if sample_questions:
            # 根据上下文调整问题
            question = sample_questions[0]

            # 添加过渡语
            if reason and self.current_question_index > 0:
                return f"{reason}。{question}"

            return question

        # 默认问题
        return "能再详细说说您的感受吗？"

    def _generate_summary_response(self) -> AgentResponse:
        """生成评估摘要响应"""
        # 计算得分
        scores = self.calculate_score()

        summary = f"感谢您的分享。我已经完成了初步评估。\n\n"
        summary += f"**评估摘要**：\n"
        summary += f"- 已评估领域：{', '.join(self.assessed_areas)}\n"
        summary += f"- 检测到的症状：{', '.join(self.detected_symptoms) if self.detected_symptoms else '无'}\n"
        summary += f"- 风险等级：{self.risk_level}\n\n"

        if self.detected_symptoms:
            summary += "建议您寻求专业心理健康服务进行进一步评估。\n"
            summary += "我可以为您推荐一些自助练习和资源。"

        return AgentResponse(
            content=summary,
            metadata={
                "assessment_complete": True,
                "scores": scores,
                "detected_symptoms": self.detected_symptoms,
                "risk_level": self.risk_level,
                "assessed_areas": self.assessed_areas
            }
        )

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

    async def generate_next_question(self, context: Dict) -> str:
        """
        生成下一个问题

        Args:
            context: 当前上下文

        Returns:
            下一个问题
        """
        guidance = await self.rag_engine.get_next_question_guidance(context)

        if guidance["sample_questions"]:
            return guidance["sample_questions"][0]

        return "您还有什么想分享的吗？"

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

    def _get_timestamp(self) -> str:
        """获取当前时间戳"""
        from datetime import datetime
        return datetime.now().isoformat()