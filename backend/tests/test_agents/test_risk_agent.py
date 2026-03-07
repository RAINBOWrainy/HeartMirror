"""
Risk Agent Tests
测试风险评估Agent的核心功能
"""
import pytest
from unittest.mock import MagicMock, patch

from app.agents.risk_agent.agent import RiskAgent, RiskLevel


class TestRiskAgentInitialization:
    """测试RiskAgent初始化"""

    def test_agent_creation(self):
        """测试Agent创建"""
        agent = RiskAgent()
        assert agent is not None
        assert agent.name == "risk_agent"
        assert agent.risk_factors == {}

    def test_default_system_prompt(self):
        """测试默认系统提示"""
        agent = RiskAgent()
        prompt = agent.default_system_prompt
        assert prompt is not None
        assert len(prompt) > 0


class TestRiskLevelCalculation:
    """测试风险等级计算"""

    def setup_method(self):
        self.agent = RiskAgent()

    def test_green_level_for_neutral_emotion(self):
        """测试中性情绪的绿色等级"""
        risk_level = self.agent._calculate_risk_level(
            emotion_type="neutral",
            intensity=0.2,
            context={}
        )
        assert risk_level == RiskLevel.GREEN

    def test_green_level_for_low_intensity_negative(self):
        """测试低强度负面情绪的绿色等级"""
        risk_level = self.agent._calculate_risk_level(
            emotion_type="sadness",
            intensity=0.1,
            context={}
        )
        assert risk_level == RiskLevel.GREEN

    def test_yellow_level_threshold(self):
        """测试黄色等级阈值"""
        # 中等强度负面情绪
        risk_level = self.agent._calculate_risk_level(
            emotion_type="sadness",
            intensity=0.6,
            context={}
        )
        assert risk_level in [RiskLevel.YELLOW, RiskLevel.ORANGE]

    def test_orange_level_for_high_intensity(self):
        """测试高强度情绪的橙色等级"""
        risk_level = self.agent._calculate_risk_level(
            emotion_type="anger",
            intensity=0.8,
            context={}
        )
        assert risk_level in [RiskLevel.ORANGE, RiskLevel.RED]

    def test_red_level_for_crisis_keywords(self):
        """测试危机关键词触发红色等级"""
        risk_level = self.agent._calculate_risk_level(
            emotion_type="sadness",
            intensity=0.5,
            context={"input_text": "我想自杀"}
        )
        assert risk_level == RiskLevel.RED

    def test_red_level_for_self_harm_thoughts(self):
        """测试自伤想法触发红色等级"""
        risk_level = self.agent._calculate_risk_level(
            emotion_type="sadness",
            intensity=0.5,
            context={"self_harm_thoughts": True}
        )
        assert risk_level == RiskLevel.RED


class TestDurationFactor:
    """测试持续时间因素"""

    def setup_method(self):
        self.agent = RiskAgent()

    def test_no_duration_factor(self):
        """测试无持续时间因素"""
        risk_level = self.agent._calculate_risk_level(
            emotion_type="sadness",
            intensity=0.5,
            context={"duration_days": 0}
        )
        # 无持续时间加成
        assert risk_level in [RiskLevel.GREEN, RiskLevel.YELLOW]

    def test_moderate_duration_factor(self):
        """测试中等持续时间因素"""
        risk_level = self.agent._calculate_risk_level(
            emotion_type="sadness",
            intensity=0.5,
            context={"duration_days": 10}
        )
        # 10天会增加风险分数

    def test_long_duration_factor(self):
        """测试长期持续时间因素"""
        risk_level = self.agent._calculate_risk_level(
            emotion_type="sadness",
            intensity=0.5,
            context={"duration_days": 20}
        )
        # 20天会显著增加风险分数


class TestFunctionalImpact:
    """测试功能影响因素"""

    def setup_method(self):
        self.agent = RiskAgent()

    def test_no_functional_impact(self):
        """测试无功能影响"""
        risk_level = self.agent._calculate_risk_level(
            emotion_type="anxiety",
            intensity=0.5,
            context={"functional_impact": 0}
        )
        assert risk_level in [RiskLevel.GREEN, RiskLevel.YELLOW]

    def test_high_functional_impact(self):
        """测试高功能影响"""
        risk_level = self.agent._calculate_risk_level(
            emotion_type="anxiety",
            intensity=0.5,
            context={"functional_impact": 0.8}
        )
        # 高功能影响会提高风险等级


class TestCrisisKeywordDetection:
    """测试危机关键词检测"""

    def setup_method(self):
        self.agent = RiskAgent()

    def test_suicide_keyword(self):
        """测试自杀关键词"""
        risk_level = self.agent._calculate_risk_level(
            emotion_type="sadness",
            intensity=0.3,
            context={"input_text": "我想自杀"}
        )
        assert risk_level == RiskLevel.RED

    def test_death_keyword(self):
        """测试死亡关键词"""
        risk_level = self.agent._calculate_risk_level(
            emotion_type="sadness",
            intensity=0.3,
            context={"input_text": "我想死"}
        )
        assert risk_level == RiskLevel.RED

    def test_not_worth_living_keyword(self):
        """测试活着没意思关键词"""
        risk_level = self.agent._calculate_risk_level(
            emotion_type="sadness",
            intensity=0.3,
            context={"input_text": "活着没意思"}
        )
        assert risk_level == RiskLevel.RED

    def test_multiple_crisis_keywords(self):
        """测试多个危机关键词"""
        risk_level = self.agent._calculate_risk_level(
            emotion_type="sadness",
            intensity=0.5,
            context={"input_text": "我不想活了，想结束生命"}
        )
        assert risk_level == RiskLevel.RED


class TestCaringResponse:
    """测试关切式响应生成"""

    def setup_method(self):
        self.agent = RiskAgent()

    def test_green_level_response(self):
        """测试绿色等级响应"""
        response = self.agent._generate_caring_response(
            RiskLevel.GREEN,
            {"emotion": {"emotion": "joy"}}
        )
        assert response is not None
        assert len(response) > 0

    def test_red_level_crisis_response(self):
        """测试红色等级危机响应"""
        response = self.agent._generate_caring_response(
            RiskLevel.RED,
            {"emotion": {"emotion": "sadness"}}
        )
        assert response is not None
        # 危机响应应包含帮助资源
        assert "热线" in response or "400" in response or "帮助" in response

    def test_yellow_level_response(self):
        """测试黄色等级响应"""
        response = self.agent._generate_caring_response(
            RiskLevel.YELLOW,
            {"emotion": {"emotion": "anxiety"}}
        )
        assert response is not None

    def test_orange_level_response(self):
        """测试橙色等级响应"""
        response = self.agent._generate_caring_response(
            RiskLevel.ORANGE,
            {"emotion": {"emotion": "sadness"}}
        )
        assert response is not None


class TestProcessMethod:
    """测试process方法"""

    def setup_method(self):
        self.agent = RiskAgent()

    @pytest.mark.asyncio
    async def test_process_basic(self):
        """测试基本处理"""
        response = await self.agent.process(
            "我今天心情不太好",
            {"emotion": {"emotion": "sadness", "intensity": 0.5}}
        )
        assert response is not None
        assert response.content is not None
        assert response.risk_level is not None

    @pytest.mark.asyncio
    async def test_process_with_crisis_context(self):
        """测试危机上下文处理"""
        response = await self.agent.process(
            "我不想活了",
            {
                "emotion": {"emotion": "sadness", "intensity": 0.8},
                "input_text": "我不想活了"
            }
        )
        assert response is not None
        assert response.risk_level == "red"

    @pytest.mark.asyncio
    async def test_process_with_duration(self):
        """测试带持续时间的处理"""
        response = await self.agent.process(
            "这种感觉持续很久了",
            {
                "emotion": {"emotion": "anxiety", "intensity": 0.6},
                "duration_days": 14
            }
        )
        assert response is not None
        assert "risk_factors" in response.metadata


class TestBoundaryConditions:
    """测试边界条件"""

    def setup_method(self):
        self.agent = RiskAgent()

    def test_zero_intensity(self):
        """测试零强度"""
        risk_level = self.agent._calculate_risk_level(
            emotion_type="sadness",
            intensity=0.0,
            context={}
        )
        assert risk_level == RiskLevel.GREEN

    def test_max_intensity(self):
        """测试最大强度"""
        risk_level = self.agent._calculate_risk_level(
            emotion_type="anger",
            intensity=1.0,
            context={}
        )
        assert risk_level in [RiskLevel.ORANGE, RiskLevel.RED]

    def test_unknown_emotion_type(self):
        """测试未知情绪类型"""
        risk_level = self.agent._calculate_risk_level(
            emotion_type="unknown_emotion",
            intensity=0.5,
            context={}
        )
        # 未知情绪应该有默认处理
        assert risk_level in [RiskLevel.GREEN, RiskLevel.YELLOW]

    def test_empty_context(self):
        """测试空上下文"""
        risk_level = self.agent._calculate_risk_level(
            emotion_type="neutral",
            intensity=0.3,
            context={}
        )
        assert risk_level == RiskLevel.GREEN