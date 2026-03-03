"""
Test Emotion Agent
情绪识别Agent测试
"""
import pytest
from unittest.mock import Mock, patch


class TestEmotionAgent:
    """情绪识别Agent测试类"""

    @pytest.mark.asyncio
    async def test_agent_initialization(self):
        """测试Agent初始化"""
        from app.agents.emotion_agent.agent import EmotionAgent

        agent = EmotionAgent()
        assert agent.name == "emotion_agent"
        assert agent.device == "cpu"

    @pytest.mark.asyncio
    async def test_emotion_labels(self):
        """测试情绪标签映射"""
        from app.agents.emotion_agent.agent import EmotionAgent

        agent = EmotionAgent()
        assert len(agent.emotion_labels) == 7
        assert 0 in agent.emotion_labels
        assert agent.emotion_labels[0] == "joy"

    @pytest.mark.asyncio
    async def test_crisis_indicator_check(self):
        """测试危机指标检查"""
        from app.agents.emotion_agent.agent import EmotionAgent

        agent = EmotionAgent()

        # 高强度负面情绪应为危机指标
        assert agent._check_crisis_indicator("fear", 0.9) == True
        assert agent._check_crisis_indicator("anxiety", 0.85) == True

        # 低强度或正面情绪不应为危机指标
        assert agent._check_crisis_indicator("joy", 0.9) == False
        assert agent._check_crisis_indicator("fear", 0.5) == False

    @pytest.mark.asyncio
    async def test_risk_level_determination(self):
        """测试风险等级判定"""
        from app.agents.emotion_agent.agent import EmotionAgent

        agent = EmotionAgent()

        # 测试不同情绪强度的风险等级
        assert agent._get_risk_level("joy", 0.5) == "green"
        assert agent._get_risk_level("sadness", 0.3) == "green"
        assert agent._get_risk_level("sadness", 0.5) == "yellow"
        assert agent._get_risk_level("fear", 0.7) == "orange"
        assert agent._get_risk_level("anxiety", 0.9) == "red"