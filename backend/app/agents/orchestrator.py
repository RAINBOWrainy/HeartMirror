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
# 延迟导入所有Agent，避免启动时加载重型依赖
# from app.agents.emotion_agent import EmotionAgent
# from app.agents.questionnaire_agent import QuestionnaireAgent
# from app.agents.risk_agent import RiskAgent
# from app.agents.intervention_agent import InterventionAgent
# 延迟导入LLM服务，避免启动时加载重型依赖
# from app.services.llm_service import get_llm_service
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
        self._llm = llm  # 可能为None，延迟加载
        self.agents: Dict[str, BaseAgent] = {}
        self.current_stage = ConversationStage.GREETING
        self.context: Dict[str, Any] = {}
        self.conversation_history: List[Dict[str, str]] = []

        # 新增：对话记忆管理
        self._max_history = 20  # 增加上下文窗口，保留更多对话历史

        # 新增：用户信息缓存
        self._user_info: Dict[str, Any] = {}

        # 新增：对话模式（默认日常聊天）
        self.mode = ConversationMode.CASUAL

        # 初始化所有Agent
        self._initialize_agents()

    @property
    def llm(self):
        """延迟加载LLM服务"""
        if self._llm is None:
            from app.services.llm_service import get_llm_service
            self._llm = get_llm_service()
        return self._llm

    def _initialize_agents(self):
        """初始化所有Agent（延迟加载）"""
        # Agents will be loaded on first use
        pass

    def _get_agent(self, agent_name: str) -> BaseAgent:
        """获取或创建Agent实例（延迟加载）"""
        if agent_name not in self.agents or self.agents[agent_name] is None:
            if agent_name == "emotion":
                from app.agents.emotion_agent.agent import EmotionAgent
                self.agents[agent_name] = EmotionAgent()
            elif agent_name == "questionnaire":
                from app.agents.questionnaire_agent import QuestionnaireAgent
                self.agents[agent_name] = QuestionnaireAgent()
            elif agent_name == "risk":
                from app.agents.risk_agent import RiskAgent
                self.agents[agent_name] = RiskAgent()
            elif agent_name == "intervention":
                from app.agents.intervention_agent import InterventionAgent
                self.agents[agent_name] = InterventionAgent()
        return self.agents[agent_name]

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

    def _get_mode_transition(
        self,
        from_mode: ConversationMode,
        to_mode: ConversationMode,
        user_input: str = None
    ) -> Optional[str]:
        """
        获取模式切换过渡语

        确保对话自然流畅，不突兀。

        Args:
            from_mode: 当前模式
            to_mode: 目标模式
            user_input: 用户输入（可选，用于上下文选择）

        Returns:
            过渡语文本，如果不需要过渡则返回None
        """
        # 使用统一人格系统的过渡语
        return HeartMirrorPersona.get_mode_transition(
            from_mode.value,
            to_mode.value,
            user_input
        )

    async def _handle_casual_mode(self, user_input: str) -> Dict[str, Any]:
        """
        处理日常聊天模式 - 增强版：包含情绪检测

        改进：即使日常聊天也进行情绪检测，让AI能够理解用户情绪并作出共情回应

        Args:
            user_input: 用户输入

        Returns:
            响应结果
        """
        # 新增：先进行情绪检测
        emotion_agent = self._get_agent("emotion")
        emotion_result = await emotion_agent.process(user_input, self.context)

        emotion_detected = emotion_result.emotion_detected
        emotion_intensity = emotion_result.metadata.get("intensity", 0.5)
        emotion_confidence = emotion_result.metadata.get("confidence", 0.5)

        # 更新上下文中的情绪信息
        self.context["emotion"] = {
            "emotion": emotion_detected,
            "intensity": emotion_intensity,
            "confidence": emotion_confidence
        }

        # 更新用户信息缓存
        self._user_info["primary_emotion"] = emotion_detected

        # 构建包含情绪上下文的系统提示
        emotion_context = ""
        if emotion_detected and emotion_detected != "neutral":
            emotion_cn = {
                "joy": "开心", "sadness": "难过", "anger": "生气",
                "fear": "害怕", "anxiety": "焦虑", "frustration": "疲惫/累",
                "loneliness": "孤独", "calm": "平静", "shame": "尴尬",
                "guilt": "内疚", "pride": "自豪", "hope": "充满希望",
                "surprise": "惊讶", "confusion": "困惑"
            }
            emotion_name = emotion_cn.get(emotion_detected, emotion_detected)
            emotion_context = f"\n\n[用户当前情绪: {emotion_name}，强度: {emotion_intensity:.1f}/1.0]"
            emotion_context += "\n请在回复中自然地表达对这个情绪的理解和关心，用简短温暖的话语。"
            emotion_context += "\n不要机械化地说明你检测到了情绪，而是通过共情式回应来表达理解。"

        # 添加用户记忆上下文
        memory_context = ""
        if self._user_info.get("has_memory") and self._user_info.get("memory_summary"):
            memory_context = f"\n\n{self._user_info['memory_summary']}"
            memory_context += "\n请根据用户背景提供更个性化的回应，但不要直接提及这些背景信息。"

        system_prompt = f"""{HeartMirrorPersona.BASE_PERSONA}
{emotion_context}
{memory_context}

你现在是在和朋友轻松聊天。保持自然、轻松的语气。
- 不要主动问评估类问题
- 可以分享一些有趣的想法
- 如果用户提到负面情绪，先表示理解和关心
- 回复简洁温暖，不要过长"""

        try:
            response = await self.llm.generate(
                prompt=user_input,
                system_prompt=system_prompt,
                temperature=0.8,
                max_tokens=300
            )
        except Exception:
            # 降级响应：使用情绪确认模板
            if emotion_detected and emotion_detected != "neutral":
                response = HeartMirrorPersona.get_emotion_acknowledge(emotion_detected)
            else:
                import random
                responses = HeartMirrorPersona.CASUAL_RESPONSES.get("small_talk", ["嗯，我懂"])
                response = random.choice(responses) if isinstance(responses, list) else "嗯，我懂"

        return {
            "response": response,
            "stage": self.current_stage.value,
            "mode": self.mode.value,
            "emotion_detected": emotion_detected,  # 现在返回实际检测到的情绪
            "emotion_intensity": emotion_intensity,
            "risk_level": emotion_result.risk_level
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

        # 加载用户记忆上下文
        if session_context and "user_memory" in session_context:
            user_memory = session_context["user_memory"]
            self.context["user_memory"] = user_memory

            # 生成用户背景摘要用于LLM提示
            if user_memory.get("emotion_patterns", {}).get("dominant_emotions"):
                self._user_info["has_memory"] = True
                self._user_info["memory_summary"] = self._generate_memory_summary(user_memory)

        # 添加对话历史到上下文
        self.context["conversation_history"] = self.conversation_history

        # 记录用户消息
        self._add_to_history("user", user_input)

        # 判断对话模式
        new_mode = self._determine_mode(user_input)

        # 生成模式切换过渡语
        mode_transition = None
        if new_mode != self.mode:
            mode_transition = self._get_mode_transition(self.mode, new_mode, user_input)
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

    def _generate_memory_summary(self, user_memory: Dict) -> str:
        """
        根据用户记忆生成摘要文本

        Args:
            user_memory: 用户记忆数据

        Returns:
            摘要文本，用于LLM提示
        """
        parts = []

        # 添加昵称
        if user_memory.get("nickname"):
            parts.append(f"用户昵称: {user_memory['nickname']}")

        # 添加情绪模式
        emotion_patterns = user_memory.get("emotion_patterns", {})
        if emotion_patterns.get("dominant_emotions"):
            top_emotions = emotion_patterns["dominant_emotions"][:3]
            emotion_names = {
                "joy": "开心", "sadness": "难过", "anger": "生气",
                "fear": "害怕", "anxiety": "焦虑", "frustration": "疲惫",
                "loneliness": "孤独", "calm": "平静", "neutral": "平静"
            }
            emotion_list = [
                f"{emotion_names.get(e['emotion'], e['emotion'])}({e['count']}次)"
                for e in top_emotions
            ]
            parts.append(f"最近常见情绪: {', '.join(emotion_list)}")

        # 添加情绪趋势
        trend = emotion_patterns.get("trend")
        if trend == "increasing":
            parts.append("情绪强度有上升趋势")
        elif trend == "decreasing":
            parts.append("情绪强度有下降趋势")

        # 添加上下文关键词
        keywords = user_memory.get("context_keywords", [])[:5]
        if keywords:
            keyword_list = [k["keyword"] for k in keywords]
            parts.append(f"常聊话题: {', '.join(keyword_list)}")

        # 添加有效干预
        effective = user_memory.get("effective_interventions", [])
        if effective:
            intervention_names = {
                "cbt": "认知行为练习", "mindfulness": "正念冥想",
                "breathing": "呼吸练习", "exercise": "运动",
                "social": "社交活动", "self_care": "自我关怀"
            }
            types = list(set([
                intervention_names.get(e["type"], e["type"])
                for e in effective[:3]
                if e.get("type")
            ]))
            if types:
                parts.append(f"有效的干预: {', '.join(types)}")

        if parts:
            return "[用户背景] " + " | ".join(parts)
        else:
            return ""

    def _generate_memory_summary(self, user_memory: Dict) -> str:
        """
        根据用户记忆生成摘要文本

        Args:
            user_memory: 用户记忆数据

        Returns:
            摘要文本，用于LLM提示
        """
        parts = []

        # 添加昵称
        if user_memory.get("nickname"):
            parts.append(f"用户昵称: {user_memory['nickname']}")

        # 添加情绪模式
        emotion_patterns = user_memory.get("emotion_patterns", {})
        if emotion_patterns.get("dominant_emotions"):
            top_emotions = emotion_patterns["dominant_emotions"][:3]
            emotion_names = {
                "joy": "开心", "sadness": "难过", "anger": "生气",
                "fear": "害怕", "anxiety": "焦虑", "frustration": "疲惫",
                "loneliness": "孤独", "calm": "平静", "neutral": "平静"
            }
            emotion_list = [
                f"{emotion_names.get(e['emotion'], e['emotion'])}({e['count']}次)"
                for e in top_emotions
            ]
            parts.append(f"最近常见情绪: {', '.join(emotion_list)}")

        # 添加情绪趋势
        trend = emotion_patterns.get("trend")
        if trend == "increasing":
            parts.append("情绪强度有上升趋势")
        elif trend == "decreasing":
            parts.append("情绪强度有下降趋势")

        # 添加上下文关键词
        keywords = user_memory.get("context_keywords", [])[:5]
        if keywords:
            keyword_list = [k["keyword"] for k in keywords]
            parts.append(f"常聊话题: {', '.join(keyword_list)}")

        # 添加有效干预
        effective = user_memory.get("effective_interventions", [])
        if effective:
            intervention_names = {
                "cbt": "认知行为练习", "mindfulness": "正念冥想",
                "breathing": "呼吸练习", "exercise": "运动",
                "social": "社交活动", "self_care": "自我关怀"
            }
            types = list(set([
                intervention_names.get(e["type"], e["type"])
                for e in effective[:3]
                if e.get("type")
            ]))
            if types:
                parts.append(f"有效的干预: {', '.join(types)}")

        if parts:
            return "[用户背景] " + " | ".join(parts)
        else:
            return ""

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
        emotion_agent = self._get_agent("emotion")

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
        questionnaire_agent = self._get_agent("questionnaire")

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
        risk_agent = self._get_agent("risk")

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
        intervention_agent = self._get_agent("intervention")

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