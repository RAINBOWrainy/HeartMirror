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
        assert len(agent.emotion_labels) == 16
        assert 0 in agent.emotion_labels
        assert agent.emotion_labels[0] == "joy"
        # 验证新增的情绪类型
        assert "shame" in agent.emotion_labels.values()
        assert "guilt" in agent.emotion_labels.values()
        assert "hope" in agent.emotion_labels.values()
        assert "loneliness" in agent.emotion_labels.values()

    @pytest.mark.asyncio
    async def test_crisis_indicator_check(self):
        """测试危机指标检查"""
        from app.agents.emotion_agent.agent import EmotionAgent

        agent = EmotionAgent()

        # 高强度负面情绪应为危机指标
        assert agent._check_crisis_indicator("fear", 0.9) == True
        assert agent._check_crisis_indicator("anxiety", 0.85) == True
        # 新增的危机情绪类型
        assert agent._check_crisis_indicator("shame", 0.9) == True
        assert agent._check_crisis_indicator("guilt", 0.85) == True
        assert agent._check_crisis_indicator("loneliness", 0.9) == True

        # 低强度或正面情绪不应为危机指标
        assert agent._check_crisis_indicator("joy", 0.9) == False
        assert agent._check_crisis_indicator("fear", 0.5) == False
        assert agent._check_crisis_indicator("hope", 0.9) == False

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
        # 测试新增负面情绪的风险等级
        assert agent._get_risk_level("loneliness", 0.8) == "red"
        assert agent._get_risk_level("frustration", 0.6) == "orange"
        assert agent._get_risk_level("guilt", 0.5) == "yellow"
        # 正面情绪应为绿色
        assert agent._get_risk_level("hope", 0.9) == "green"
        assert agent._get_risk_level("pride", 0.8) == "green"
        assert agent._get_risk_level("calm", 0.7) == "green"