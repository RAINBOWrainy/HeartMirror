"""
Agent Orchestrator
多Agent协调器 - 增强版

改进点：
1. 使用统一人格系统
2. 更灵活的阶段转换
3. 增强上下文传递
4. 更自然的对话流程
"""
from typing import Any, Dict, List, Optional
from enum import Enum
import random

from app.agents.base_agent import BaseAgent, AgentResponse
from app.agents.emotion_agent import EmotionAgent
from app.agents.questionnaire_agent import QuestionnaireAgent
from app.agents.risk_agent import RiskAgent
from app.agents.intervention_agent import InterventionAgent
from app.services.llm_service import get_llm_service
from app.core.persona import HeartMirrorPersona


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
    Agent协调器 - 增强版

    协调多个Agent的工作流程，
    使用统一人格系统确保一致的交互风格
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

        # 新增：对话记忆管理
        self._max_history = 10

        # 新增：用户信息缓存
        self._user_info: Dict[str, Any] = {}

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
        # 更新上下文
        self.context.update(session_context or {})

        # 添加对话历史到上下文
        self.context["conversation_history"] = self.conversation_history

        # 记录用户消息
        self._add_to_history("user", user_input)

        # 根据当前阶段选择处理流程
        if self.current_stage == ConversationStage.GREETING:
            result = await self._handle_greeting(user_input)

        elif self.current_stage == ConversationStage.EMOTION_ASSESSMENT:
            result = await self._handle_emotion_assessment(user_input)

        elif self.current_stage == ConversationStage.QUESTIONNAIRE:
            result = await self._handle_questionnaire(user_input)

        elif self.current_stage == ConversationStage.RISK_ASSESSMENT:
            result = await self._handle_risk_assessment(user_input)

        elif self.current_stage == ConversationStage.INTERVENTION:
            result = await self._handle_intervention(user_input)

        else:
            result = await self._handle_closing(user_input)

        # 记录助手回复
        self._add_to_history("assistant", result.get("response", ""))

        return result

    def _add_to_history(self, role: str, content: str):
        """
        添加消息到对话历史

        Args:
            role: 角色 (user/assistant)
            content: 消息内容
        """
        self.conversation_history.append({
            "role": role,
            "content": content
        })

        # 保持历史记录在限制内
        if len(self.conversation_history) > self._max_history * 2:
            self.conversation_history = self.conversation_history[-self._max_history * 2:]

    async def _handle_greeting(self, user_input: str) -> Dict:
        """
        处理问候阶段

        使用温暖自然的问候语
        """
        self.current_stage = ConversationStage.EMOTION_ASSESSMENT

        # 使用统一人格系统的问候
        greetings = [
            "你好呀！我是心语，一个愿意倾听的朋友。今天感觉怎么样？",
            "嗨！很高兴见到你。最近过得好吗？有什么想聊聊的吗？",
            "你好！我是心语，随时准备听你说话。今天心情如何？"
        ]

        response = random.choice(greetings)

        return {
            "response": response,
            "stage": self.current_stage.value,
            "emotion_detected": None,
            "risk_level": "green"
        }

    async def _handle_emotion_assessment(self, user_input: str) -> Dict:
        """
        处理情绪评估阶段

        使用混合情绪识别引擎
        """
        emotion_agent = self.agents["emotion"]

        # 情绪识别
        emotion_result = await emotion_agent.process(user_input, self.context)

        # 更新上下文
        self.context["emotion"] = {
            "emotion": emotion_result.emotion_detected,
            "intensity": emotion_result.metadata.get("intensity", 0.5),
            "confidence": emotion_result.metadata.get("confidence", 0.0),
            "reasoning": emotion_result.metadata.get("reasoning", "")
        }

        # 更新用户信息
        self._user_info["primary_emotion"] = emotion_result.emotion_detected

        # 智能阶段转换
        if emotion_result.metadata.get("is_crisis_indicator"):
            # 高风险情绪，直接进入风险评估
            self.current_stage = ConversationStage.RISK_ASSESSMENT
        elif emotion_result.risk_level in ["orange", "red"]:
            # 较高风险
            self.current_stage = ConversationStage.RISK_ASSESSMENT
        else:
            # 正常流程
            self.current_stage = ConversationStage.QUESTIONNAIRE

        return {
            "response": emotion_result.content,
            "stage": self.current_stage.value,
            "emotion_detected": emotion_result.emotion_detected,
            "risk_level": emotion_result.risk_level
        }

    async def _handle_questionnaire(self, user_input: str) -> Dict:
        """
        处理问卷阶段

        使用对话式评估
        """
        questionnaire_agent = self.agents["questionnaire"]

        # 传递完整上下文
        result = await questionnaire_agent.process(user_input, self.context)

        # 更新检测到的症状
        if result.metadata.get("detected_symptoms"):
            self.context["detected_symptoms"] = result.metadata.get("detected_symptoms")

        # 检查评估是否完成
        if result.metadata.get("assessment_complete"):
            self.current_stage = ConversationStage.RISK_ASSESSMENT
        elif result.metadata.get("crisis_mode"):
            self.current_stage = ConversationStage.CLOSING

        return {
            "response": result.content,
            "stage": self.current_stage.value,
            "emotion_detected": self.context.get("emotion", {}).get("emotion"),
            "risk_level": result.metadata.get("risk_level", "green")
        }

    async def _handle_risk_assessment(self, user_input: str) -> Dict:
        """
        处理风险评估阶段

        使用关切的表达方式
        """
        risk_agent = self.agents["risk"]

        # 构建完整上下文
        risk_context = {
            **self.context,
            "input_text": user_input
        }

        result = await risk_agent.process(user_input, risk_context)

        # 更新上下文
        self.context["risk_level"] = result.risk_level

        # 根据风险等级决定下一步
        if result.risk_level in ["orange", "red"]:
            # 高风险，提供危机支持后结束
            self.current_stage = ConversationStage.CLOSING
        else:
            # 正常流程，进入干预阶段
            self.current_stage = ConversationStage.INTERVENTION

        return {
            "response": result.content,
            "stage": self.current_stage.value,
            "emotion_detected": self.context.get("emotion", {}).get("emotion"),
            "risk_level": result.risk_level
        }

    async def _handle_intervention(self, user_input: str) -> Dict:
        """
        处理干预阶段

        使用温暖友好的推荐方式
        """
        intervention_agent = self.agents["intervention"]

        result = await intervention_agent.process(user_input, self.context)

        self.current_stage = ConversationStage.CLOSING

        return {
            "response": result.content,
            "stage": self.current_stage.value,
            "emotion_detected": self.context.get("emotion", {}).get("emotion"),
            "risk_level": self.context.get("risk_level", "green")
        }

    async def _handle_closing(self, user_input: str) -> Dict:
        """
        处理结束阶段

        使用温暖的结束语
        """
        # 使用统一人格系统的结束语
        closing = HeartMirrorPersona.get_stage_transition("to_closing")

        # 根据风险等级添加额外信息
        risk_level = self.context.get("risk_level", "green")
        if risk_level in ["orange", "red"]:
            closing += "\n\n记住，如果觉得难受，随时可以拨打心理援助热线：400-161-9995"

        return {
            "response": closing,
            "stage": ConversationStage.CLOSING.value,
            "emotion_detected": None,
            "risk_level": risk_level
        }

    def reset(self):
        """重置协调器状态"""
        self.current_stage = ConversationStage.GREETING
        self.context = {}
        self.conversation_history = []
        self._user_info = {}

        # 重置所有Agent
        for agent in self.agents.values():
            if hasattr(agent, "reset"):
                agent.reset()

    def get_context(self) -> Dict[str, Any]:
        """获取当前完整上下文"""
        return {
            "stage": self.current_stage.value,
            "emotion": self.context.get("emotion"),
            "detected_symptoms": self.context.get("detected_symptoms", []),
            "risk_level": self.context.get("risk_level", "green"),
            "conversation_history": self.conversation_history[-5:]  # 最近5轮
        }

    def get_user_summary(self) -> Dict[str, Any]:
        """获取用户状态摘要"""
        return {
            "primary_emotion": self._user_info.get("primary_emotion"),
            "symptoms_detected": len(self.context.get("detected_symptoms", [])),
            "risk_level": self.context.get("risk_level", "green"),
            "messages_exchanged": len(self.conversation_history) // 2
        }