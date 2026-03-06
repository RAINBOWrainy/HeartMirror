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


class ConversationMode(str, Enum):
    """对话模式"""
    CASUAL = "casual"              # 日常聊天模式
    ASSESSMENT = "assessment"      # 评估模式
    INTERVENTION = "intervention"  # 干预模式
    CRISIS = "crisis"             # 危机模式


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

        # 新增：对话模式（默认日常聊天）
        self.mode = ConversationMode.CASUAL

        # 初始化所有Agent
        self._initialize_agents()

    def _initialize_agents(self):
        """初始化所有Agent"""
        self.agents["emotion"] = EmotionAgent()
        self.agents["questionnaire"] = QuestionnaireAgent()
        self.agents["risk"] = RiskAgent()
        self.agents["intervention"] = InterventionAgent()

    def _determine_mode(self, user_input: str) -> ConversationMode:
        """
        智能判断对话模式

        判断依据：
        1. 危机信号（最高优先级）
        2. 评估触发信号
        3. 日常聊天信号

        Args:
            user_input: 用户输入

        Returns:
            对话模式
        """
        # 危机信号（最高优先级）
        crisis_keywords = ["自杀", "不想活", "活着没意思", "结束生命", "伤害自己"]
        if any(kw in user_input for kw in crisis_keywords):
            return ConversationMode.CRISIS

        # 评估触发信号
        assessment_signals = [
            "心情不好", "难过", "伤心", "郁闷", "不开心",
            "焦虑", "紧张", "害怕", "睡不着", "失眠",
            "累", "疲惫", "孤独", "寂寞", "没意思",
            "压力", "帮帮我", "不知道该怎么办"
        ]
        assessment_score = sum(1 for sig in assessment_signals if sig in user_input)

        # 日常聊天信号
        casual_signals = ["哈哈", "嘿嘿", "好玩", "有趣", "推荐", "好看", "吃", "玩", "周末", "天气"]
        casual_score = sum(1 for sig in casual_signals if sig in user_input)

        # 判断逻辑
        if assessment_score >= 2:
            return ConversationMode.ASSESSMENT
        elif casual_score >= 2 and assessment_score == 0:
            return ConversationMode.CASUAL
        elif self.mode == ConversationMode.ASSESSMENT:
            # 如果已经在评估模式，保持评估模式
            return ConversationMode.ASSESSMENT
        else:
            return ConversationMode.CASUAL

    async def _handle_casual_mode(self, user_input: str) -> Dict[str, Any]:
        """
        处理日常聊天模式

        Args:
            user_input: 用户输入

        Returns:
            响应结果
        """
        system_prompt = f"""{HeartMirrorPersona.BASE_PERSONA}

你现在是在和朋友轻松聊天。保持自然、轻松的语气。
- 不要主动问评估类问题
- 可以分享一些有趣的想法
- 如果用户提到负面情绪，先表示理解
- 回复简洁温暖，不要过长"""

        try:
            response = await self.llm.generate(
                prompt=user_input,
                system_prompt=system_prompt,
                temperature=0.8,
                max_tokens=300
            )
        except Exception:
            # 降级响应
            import random
            responses = HeartMirrorPersona.CASUAL_RESPONSES.get("small_talk", ["嗯，我懂"])
            response = random.choice(responses) if isinstance(responses, list) else "嗯，我懂"

        return {
            "response": response,
            "stage": self.current_stage.value,
            "mode": self.mode.value,
            "emotion_detected": None,
            "risk_level": "green"
        }

    async def process_message(
        self,
        user_input: str,
        session_context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        处理用户消息（支持模式切换）

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

        # 判断对话模式
        new_mode = self._determine_mode(user_input)
        if new_mode != self.mode:
            self.mode = new_mode

        # 根据模式分发处理
        if self.mode == ConversationMode.CRISIS:
            result = await self._handle_crisis_mode(user_input)
        elif self.mode == ConversationMode.CASUAL:
            result = await self._handle_casual_mode(user_input)
        elif self.mode == ConversationMode.ASSESSMENT:
            # 评估模式使用原有阶段流程
            result = await self._handle_assessment_flow(user_input)
        else:
            result = await self._handle_casual_mode(user_input)

        # 记录助手回复
        self._add_to_history("assistant", result.get("response", ""))

        return result

    async def _handle_crisis_mode(self, user_input: str) -> Dict[str, Any]:
        """处理危机模式"""
        return {
            "response": HeartMirrorPersona.CRISIS_RESPONSE,
            "stage": ConversationStage.CLOSING.value,
            "mode": self.mode.value,
            "emotion_detected": None,
            "risk_level": "red"
        }

    async def _handle_assessment_flow(self, user_input: str) -> Dict[str, Any]:
        """处理评估模式流程"""
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

        # 使用统一人格系统的问候（自然、无身份声明）
        greetings = [
            "嗨！今天怎么样？",
            "来啦～最近有什么新鲜事吗？",
            "嘿，刚好有空，聊两句？",
            "你好呀，今天心情如何？"
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