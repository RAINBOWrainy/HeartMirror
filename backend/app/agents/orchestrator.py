"""
Agent Orchestrator
多Agent协调器
"""
from typing import Any, Dict, List, Optional
from enum import Enum

from app.agents.base_agent import BaseAgent, AgentResponse
from app.agents.emotion_agent import EmotionAgent
from app.agents.questionnaire_agent import QuestionnaireAgent
from app.agents.risk_agent import RiskAgent
from app.agents.intervention_agent import InterventionAgent
from app.services.llm_service import get_llm_service


class ConversationStage(str, Enum):
    """对话阶段"""
    GREETING = "greeting"
    EMOTION_ASSESSMENT = "emotion_assessment"
    QUESTIONNAIRE = "questionnaire"
    RISK_ASSESSMENT = "risk_assessment"
    INTERVENTION = "intervention"
    CLOSING = "closing"


class AgentOrchestrator:
    """
    Agent协调器

    协调多个Agent的工作流程
    """

    def __init__(self, llm=None):
        """
        初始化协调器

        Args:
            llm: 语言模型实例
        """
        self.llm = llm or get_llm_service()
        self.agents: Dict[str, BaseAgent] = {}
        self.current_stage = ConversationStage.GREETING
        self.context: Dict[str, Any] = {}
        self.conversation_history: List[Dict[str, str]] = []

        # 初始化所有Agent
        self._initialize_agents()

    def _initialize_agents(self):
        """初始化所有Agent"""
        self.agents["emotion"] = EmotionAgent()
        self.agents["questionnaire"] = QuestionnaireAgent()
        self.agents["risk"] = RiskAgent()
        self.agents["intervention"] = InterventionAgent()

    async def process_message(
        self,
        user_input: str,
        session_context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        处理用户消息

        Args:
            user_input: 用户输入
            session_context: 会话上下文

        Returns:
            处理结果字典
        """
        self.context.update(session_context or {})

        # 根据当前阶段选择处理流程
        if self.current_stage == ConversationStage.GREETING:
            return await self._handle_greeting(user_input)

        elif self.current_stage == ConversationStage.EMOTION_ASSESSMENT:
            return await self._handle_emotion_assessment(user_input)

        elif self.current_stage == ConversationStage.QUESTIONNAIRE:
            return await self._handle_questionnaire(user_input)

        elif self.current_stage == ConversationStage.RISK_ASSESSMENT:
            return await self._handle_risk_assessment(user_input)

        elif self.current_stage == ConversationStage.INTERVENTION:
            return await self._handle_intervention(user_input)

        else:
            return await self._handle_closing(user_input)

    async def _handle_greeting(self, user_input: str) -> Dict:
        """处理问候阶段"""
        self.current_stage = ConversationStage.EMOTION_ASSESSMENT

        # 使用LLM生成个性化问候
        try:
            response = await self.llm.generate(
                prompt="用户刚刚开始对话，请生成一个温暖的问候语，询问用户今天的心情如何。",
                system_prompt="你是HeartMirror心理健康助手。请用简洁温暖的方式问候用户，并询问他们今天的心情。",
                temperature=0.7,
                max_tokens=100
            )
        except Exception:
            response = "您好！我是HeartMirror心理健康助手。今天您感觉如何？可以和我聊聊您的心情吗？"

        return {
            "response": response,
            "stage": self.current_stage.value,
            "emotion_detected": None,
            "risk_level": "green"
        }

    async def _handle_emotion_assessment(self, user_input: str) -> Dict:
        """处理情绪评估阶段"""
        emotion_agent = self.agents["emotion"]

        # 情绪识别
        emotion_result = await emotion_agent.process(user_input, self.context)

        # 更新上下文
        self.context["emotion"] = {
            "emotion": emotion_result.emotion_detected,
            "intensity": emotion_result.metadata.get("intensity", 0.5),
            "confidence": emotion_result.metadata.get("confidence", 0.0)
        }

        # 如果检测到高情绪强度，转入风险评估
        if emotion_result.metadata.get("is_crisis_indicator"):
            self.current_stage = ConversationStage.RISK_ASSESSMENT
        else:
            self.current_stage = ConversationStage.QUESTIONNAIRE

        return {
            "response": emotion_result.content,
            "stage": self.current_stage.value,
            "emotion_detected": emotion_result.emotion_detected,
            "risk_level": emotion_result.risk_level
        }

    async def _handle_questionnaire(self, user_input: str) -> Dict:
        """处理问卷阶段"""
        questionnaire_agent = self.agents["questionnaire"]

        result = await questionnaire_agent.process(user_input, self.context)

        # 使用LLM生成更智能的响应
        try:
            llm_response = await self.llm.generate_chat_response(
                user_input=user_input,
                conversation_history=self.conversation_history,
                emotion_detected=self.context.get("emotion", {}).get("emotion"),
                risk_level=self.context.get("risk_level", "green")
            )
            response = llm_response
        except Exception:
            response = result.content

        # 记录对话历史
        self.conversation_history.append({"role": "user", "content": user_input})
        self.conversation_history.append({"role": "assistant", "content": response})

        # 更新阶段
        self.current_stage = ConversationStage.RISK_ASSESSMENT

        return {
            "response": response,
            "stage": self.current_stage.value,
            "emotion_detected": self.context.get("emotion", {}).get("emotion"),
            "risk_level": self.context.get("risk_level", "green")
        }

    async def _handle_risk_assessment(self, user_input: str) -> Dict:
        """处理风险评估阶段"""
        risk_agent = self.agents["risk"]

        result = await risk_agent.process(user_input, self.context)

        # 更新上下文
        self.context["risk_level"] = result.risk_level

        # 根据风险等级决定下一步
        if result.risk_level in ["orange", "red"]:
            # 高风险，提供危机支持
            self.current_stage = ConversationStage.CLOSING
        else:
            self.current_stage = ConversationStage.INTERVENTION

        return {
            "response": result.content,
            "stage": self.current_stage.value,
            "emotion_detected": self.context.get("emotion", {}).get("emotion"),
            "risk_level": result.risk_level
        }

    async def _handle_intervention(self, user_input: str) -> Dict:
        """处理干预阶段"""
        intervention_agent = self.agents["intervention"]

        result = await intervention_agent.process(user_input, self.context)

        # 使用LLM生成个性化干预建议
        try:
            llm_response = await self.llm.generate_intervention_suggestion(
                user_context={
                    "symptoms": self.context.get("detected_symptoms", []),
                    "risk_level": self.context.get("risk_level", "green")
                },
                emotion_state=self.context.get("emotion")
            )
            response = llm_response
        except Exception:
            response = result.content

        self.current_stage = ConversationStage.CLOSING

        return {
            "response": response,
            "stage": self.current_stage.value,
            "emotion_detected": self.context.get("emotion", {}).get("emotion"),
            "risk_level": self.context.get("risk_level", "green")
        }

    async def _handle_closing(self, user_input: str) -> Dict:
        """处理结束阶段"""
        # 使用LLM生成个性化结束语
        try:
            response = await self.llm.generate(
                prompt="对话即将结束，请生成一个温暖的结束语，鼓励用户关注心理健康。",
                system_prompt="你是HeartMirror心理健康助手。请用温暖的方式结束对话，鼓励用户。",
                temperature=0.7,
                max_tokens=150
            )
        except Exception:
            response = "感谢您今天的分享。请记住，关注心理健康是非常重要的。如果您需要更多帮助，随时可以回来。保重！"

        return {
            "response": response,
            "stage": ConversationStage.CLOSING.value,
            "emotion_detected": None,
            "risk_level": self.context.get("risk_level", "green")
        }

    def reset(self):
        """重置协调器状态"""
        self.current_stage = ConversationStage.GREETING
        self.context = {}
        self.conversation_history = []