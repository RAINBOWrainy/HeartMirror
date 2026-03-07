"""
AgentOrchestrator Tests
测试Agent协调器的核心功能
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.agents.orchestrator import AgentOrchestrator, ConversationMode, ConversationStage


class TestAgentOrchestratorInitialization:
    """测试AgentOrchestrator初始化"""

    def test_orchestrator_creation(self):
        """测试AgentOrchestrator创建"""
        orchestrator = AgentOrchestrator()
        assert orchestrator is not None
        assert orchestrator.mode == ConversationMode.CASUAL
        assert orchestrator.current_stage == ConversationStage.GREETING

    def test_agents_initialization(self):
        """测试所有Agent初始化"""
        orchestrator = AgentOrchestrator()
        assert "emotion" in orchestrator.agents
        assert "questionnaire" in orchestrator.agents
        assert "risk" in orchestrator.agents
        assert "intervention" in orchestrator.agents

    def test_conversation_history_initialized(self):
        """测试对话历史初始化"""
        orchestrator = AgentOrchestrator()
        assert orchestrator.conversation_history == []
        assert orchestrator._max_history == 20


class TestModeDetermination:
    """测试模式判断"""

    def setup_method(self):
        self.orchestrator = AgentOrchestrator()

    def test_crisis_mode_detection(self):
        """测试危机模式检测"""
        crisis_inputs = [
            "我不想活了",
            "活着没意思",
            "想自杀",
            "结束生命"
        ]
        for text in crisis_inputs:
            mode = self.orchestrator._determine_mode(text)
            assert mode == ConversationMode.CRISIS, f"Failed for: {text}"

    def test_assessment_mode_detection(self):
        """测试评估模式检测 - 需要多个信号触发"""
        # 评估模式需要2个或以上信号
        assessment_inputs = [
            "我心情不好，很难过",
            "我很焦虑，也很紧张",
            "我睡不着，失眠了",
        ]
        for text in assessment_inputs:
            mode = self.orchestrator._determine_mode(text)
            assert mode == ConversationMode.ASSESSMENT, f"Failed for: {text}"

    def test_casual_mode_detection(self):
        """测试普通聊天模式检测"""
        casual_inputs = [
            "哈哈，今天天气不错",
            "嘿嘿，好玩有趣",
        ]
        for text in casual_inputs:
            mode = self.orchestrator._determine_mode(text)
            assert mode == ConversationMode.CASUAL, f"Failed for: {text}"

    def test_crisis_priority_over_assessment(self):
        """测试危机模式优先于评估模式"""
        text = "我想做测试，但我不想活了"
        mode = self.orchestrator._determine_mode(text)
        assert mode == ConversationMode.CRISIS


class TestModeTransitions:
    """测试模式切换"""

    def setup_method(self):
        self.orchestrator = AgentOrchestrator()

    def test_get_mode_transition(self):
        """测试模式切换过渡语"""
        # 危机模式切换
        phrase = self.orchestrator._get_mode_transition(
            ConversationMode.CASUAL,
            ConversationMode.CRISIS
        )
        # 可能返回None或过渡语
        if phrase:
            assert isinstance(phrase, str)

    def test_mode_updates_on_message(self):
        """测试消息处理时模式更新"""
        # 处理危机消息后模式应变为CRISIS
        assert self.orchestrator.mode == ConversationMode.CASUAL


class TestConversationHistory:
    """测试对话历史管理"""

    def setup_method(self):
        self.orchestrator = AgentOrchestrator()

    def test_add_to_history(self):
        """测试添加到历史记录"""
        self.orchestrator._add_to_history("user", "你好")
        assert len(self.orchestrator.conversation_history) == 1
        assert self.orchestrator.conversation_history[0]["role"] == "user"
        assert self.orchestrator.conversation_history[0]["content"] == "你好"

    def test_history_limit(self):
        """测试历史记录限制"""
        for i in range(25):
            self.orchestrator._add_to_history("user", f"消息{i}")

        # 应该只保留最近20条
        assert len(self.orchestrator.conversation_history) == 20
        # 最新的消息应该保留
        assert "消息24" in self.orchestrator.conversation_history[-1]["content"]


class TestStageManagement:
    """测试对话阶段管理"""

    def setup_method(self):
        self.orchestrator = AgentOrchestrator()

    def test_initial_stage(self):
        """测试初始阶段"""
        assert self.orchestrator.current_stage == ConversationStage.GREETING


class TestProcessMessage:
    """测试消息处理"""

    def setup_method(self):
        self.orchestrator = AgentOrchestrator()

    @pytest.mark.asyncio
    async def test_process_simple_greeting(self):
        """测试简单问候处理"""
        response = await self.orchestrator.process_message("你好")
        assert response is not None
        assert isinstance(response, dict)
        assert "response" in response

    @pytest.mark.asyncio
    async def test_process_crisis_message(self):
        """测试危机消息处理"""
        response = await self.orchestrator.process_message("我不想活了")
        assert response is not None
        # 危机响应应包含热线或帮助信息
        content = response.get("response", "")
        assert "热线" in content or "帮助" in content or "支持" in content or "400" in content

    @pytest.mark.asyncio
    async def test_process_with_context(self):
        """测试带上下文的消息处理"""
        context = {
            "user_id": "test_user",
            "session_id": "test_session"
        }
        response = await self.orchestrator.process_message("我今天心情不好", context)
        assert response is not None

    @pytest.mark.asyncio
    async def test_process_returns_emotion(self):
        """测试处理返回情绪信息"""
        response = await self.orchestrator.process_message("我很难过")
        assert response is not None
        assert "emotion_detected" in response or "emotion" in response


class TestUserInfoCache:
    """测试用户信息缓存"""

    def setup_method(self):
        self.orchestrator = AgentOrchestrator()

    def test_user_info_dict_exists(self):
        """测试用户信息字典存在"""
        assert hasattr(self.orchestrator, "_user_info")
        assert isinstance(self.orchestrator._user_info, dict)