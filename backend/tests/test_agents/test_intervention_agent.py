"""
Intervention Agent Tests
测试干预推荐Agent的核心功能
"""
import pytest
from unittest.mock import MagicMock, patch

from app.agents.intervention_agent.agent import InterventionAgent


class TestInterventionAgentInitialization:
    """测试InterventionAgent初始化"""

    def test_agent_creation(self):
        """测试Agent创建"""
        agent = InterventionAgent()
        assert agent is not None
        assert agent.name == "intervention_agent"

    def test_default_system_prompt(self):
        """测试默认系统提示"""
        agent = InterventionAgent()
        prompt = agent.default_system_prompt
        assert prompt is not None
        assert len(prompt) > 0


class TestInterventionByEmotionType:
    """测试基于情绪类型的干预推荐"""

    def setup_method(self):
        self.agent = InterventionAgent()

    @pytest.mark.asyncio
    async def test_anxiety_intervention(self):
        """测试焦虑情绪干预"""
        response = await self.agent.process(
            "我很焦虑",
            {"emotion": {"emotion": "anxiety", "intensity": 0.6}}
        )
        assert response is not None
        assert response.content is not None
        # 焦虑干预通常包含呼吸练习或正念
        content_lower = response.content.lower()
        assert any(kw in content_lower for kw in ["呼吸", "正念", "放松", "冥想", "平静"])

    @pytest.mark.asyncio
    async def test_sadness_intervention(self):
        """测试悲伤情绪干预"""
        response = await self.agent.process(
            "我很伤心",
            {"emotion": {"emotion": "sadness", "intensity": 0.6}}
        )
        assert response is not None
        # 悲伤干预通常包含认知重构或社交支持
        content_lower = response.content.lower()
        assert len(response.content) > 0

    @pytest.mark.asyncio
    async def test_anger_intervention(self):
        """测试愤怒情绪干预"""
        response = await self.agent.process(
            "我很生气",
            {"emotion": {"emotion": "anger", "intensity": 0.7}}
        )
        assert response is not None
        # 愤怒干预通常包含冷静技巧或运动

    @pytest.mark.asyncio
    async def test_frustration_intervention(self):
        """测试挫败感干预"""
        response = await self.agent.process(
            "我很沮丧",
            {"emotion": {"emotion": "frustration", "intensity": 0.5}}
        )
        assert response is not None

    @pytest.mark.asyncio
    async def test_loneliness_intervention(self):
        """测试孤独感干预"""
        response = await self.agent.process(
            "我很孤独",
            {"emotion": {"emotion": "loneliness", "intensity": 0.6}}
        )
        assert response is not None
        # 孤独干预通常包含社交建议

    @pytest.mark.asyncio
    async def test_fear_intervention(self):
        """测试恐惧情绪干预"""
        response = await self.agent.process(
            "我很害怕",
            {"emotion": {"emotion": "fear", "intensity": 0.6}}
        )
        assert response is not None


class TestInterventionFormatting:
    """测试干预响应格式"""

    def setup_method(self):
        self.agent = InterventionAgent()

    @pytest.mark.asyncio
    async def test_warm_tone(self):
        """测试温暖语调"""
        response = await self.agent.process(
            "我需要帮助",
            {"emotion": {"emotion": "sadness", "intensity": 0.5}}
        )
        assert response is not None
        # 响应应该是温暖关怀的，而非机械的
        # 不应包含机械化表达如"根据分析..."
        content = response.content
        assert "根据分析结果" not in content
        assert "您的风险等级" not in content

    @pytest.mark.asyncio
    async def test_non_mechanical_response(self):
        """测试非机械化响应"""
        response = await self.agent.process(
            "我想改善我的情绪",
            {"emotion": {"emotion": "anxiety", "intensity": 0.4}}
        )
        assert response is not None
        # 响应应该像朋友一样自然
        assert len(response.content) > 20  # 不应该太短

    @pytest.mark.asyncio
    async def test_intervention_metadata(self):
        """测试干预元数据"""
        response = await self.agent.process(
            "我需要一些建议",
            {"emotion": {"emotion": "anxiety", "intensity": 0.5}}
        )
        assert response is not None
        assert response.metadata is not None


class TestEvidenceBasedInterventions:
    """测试循证干预"""

    def setup_method(self):
        self.agent = InterventionAgent()

    @pytest.mark.asyncio
    async def test_cbt_intervention(self):
        """测试CBT干预"""
        response = await self.agent.process(
            "我总是想负面的事情",
            {
                "emotion": {"emotion": "sadness", "intensity": 0.6},
                "preferred_type": "cbt"
            }
        )
        assert response is not None

    @pytest.mark.asyncio
    async def test_mindfulness_intervention(self):
        """测试正念干预"""
        response = await self.agent.process(
            "我需要放松",
            {
                "emotion": {"emotion": "anxiety", "intensity": 0.5},
                "preferred_type": "mindfulness"
            }
        )
        assert response is not None

    @pytest.mark.asyncio
    async def test_breathing_exercise(self):
        """测试呼吸练习"""
        response = await self.agent.process(
            "我需要快速平静下来",
            {
                "emotion": {"emotion": "anxiety", "intensity": 0.7},
                "preferred_type": "breathing"
            }
        )
        assert response is not None
        # 呼吸练习响应应包含具体步骤
        content_lower = response.content.lower()
        assert any(kw in content_lower for kw in ["吸气", "呼气", "呼吸", "分钟", "数"])


class TestPersonalization:
    """测试个性化干预"""

    def setup_method(self):
        self.agent = InterventionAgent()

    @pytest.mark.asyncio
    async def test_with_user_history(self):
        """测试带用户历史的个性化"""
        response = await self.agent.process(
            "我又感到焦虑了",
            {
                "emotion": {"emotion": "anxiety", "intensity": 0.5},
                "user_history": {
                    "effective_interventions": ["breathing", "mindfulness"],
                    "preferred_time": "evening"
                }
            }
        )
        assert response is not None

    @pytest.mark.asyncio
    async def test_with_risk_level(self):
        """测试带风险等级的个性化"""
        response = await self.agent.process(
            "我需要帮助",
            {
                "emotion": {"emotion": "sadness", "intensity": 0.8},
                "risk_level": "orange"
            }
        )
        assert response is not None
        # 高风险时响应应更加关切

    @pytest.mark.asyncio
    async def test_with_time_context(self):
        """测试带时间上下文的个性化"""
        response = await self.agent.process(
            "我现在需要帮助",
            {
                "emotion": {"emotion": "anxiety", "intensity": 0.4},
                "time_of_day": "night"
            }
        )
        assert response is not None


class TestIntensityAdaptation:
    """测试强度适应性"""

    def setup_method(self):
        self.agent = InterventionAgent()

    @pytest.mark.asyncio
    async def test_low_intensity_intervention(self):
        """测试低强度干预"""
        response = await self.agent.process(
            "有点不舒服",
            {"emotion": {"emotion": "anxiety", "intensity": 0.2}}
        )
        assert response is not None
        # 低强度干预应该轻松简单

    @pytest.mark.asyncio
    async def test_high_intensity_intervention(self):
        """测试高强度干预"""
        response = await self.agent.process(
            "非常难受",
            {"emotion": {"emotion": "anxiety", "intensity": 0.9}}
        )
        assert response is not None
        # 高强度干预应该更加详细和关切


class TestProcessMethod:
    """测试process方法"""

    def setup_method(self):
        self.agent = InterventionAgent()

    @pytest.mark.asyncio
    async def test_process_basic(self):
        """测试基本处理"""
        response = await self.agent.process(
            "我需要一些建议",
            {"emotion": {"emotion": "sadness", "intensity": 0.5}}
        )
        assert response is not None
        assert response.content is not None

    @pytest.mark.asyncio
    async def test_process_with_empty_context(self):
        """测试空上下文处理"""
        response = await self.agent.process(
            "我需要帮助",
            {}
        )
        assert response is not None

    @pytest.mark.asyncio
    async def test_process_with_none_context(self):
        """测试None上下文处理"""
        response = await self.agent.process(
            "我需要帮助",
            None
        )
        assert response is not None


class TestEdgeCases:
    """测试边界情况"""

    def setup_method(self):
        self.agent = InterventionAgent()

    @pytest.mark.asyncio
    async def test_unknown_emotion(self):
        """测试未知情绪类型"""
        response = await self.agent.process(
            "我感到奇怪",
            {"emotion": {"emotion": "unknown_emotion", "intensity": 0.5}}
        )
        assert response is not None

    @pytest.mark.asyncio
    async def test_joy_emotion(self):
        """测试积极情绪"""
        response = await self.agent.process(
            "我很开心",
            {"emotion": {"emotion": "joy", "intensity": 0.8}}
        )
        assert response is not None
        # 积极情绪也应该得到正向回应

    @pytest.mark.asyncio
    async def test_neutral_emotion(self):
        """测试中性情绪"""
        response = await self.agent.process(
            "没什么特别的感觉",
            {"emotion": {"emotion": "neutral", "intensity": 0.3}}
        )
        assert response is not None