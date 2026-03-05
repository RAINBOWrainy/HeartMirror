"""
Test LLM Service
LLM服务测试
"""
import pytest
from unittest.mock import Mock, patch, AsyncMock
from app.services.llm_service import LLMService, get_llm_service


class TestLLMService:
    """LLM服务测试类"""

    def test_init_with_defaults(self):
        """测试使用默认配置初始化"""
        service = LLMService()
        # API key 可以为空（在 CI 环境中）
        assert service.base_url == "https://openrouter.ai/api/v1"
        assert service.model == "z-ai/glm-4.5-air:free"

    def test_init_with_custom_params(self):
        """测试使用自定义参数初始化"""
        service = LLMService(
            api_key="test-key",
            base_url="https://custom.url",
            model="custom-model"
        )
        assert service.api_key == "test-key"
        assert service.base_url == "https://custom.url"
        assert service.model == "custom-model"

    def test_client_lazy_loading(self):
        """测试客户端懒加载"""
        service = LLMService()
        assert service._client is None
        client = service.client
        assert client is not None
        assert service._client is not None

    @pytest.mark.asyncio
    async def test_generate_success(self):
        """测试生成文本成功"""
        service = LLMService()

        # Mock the API call
        mock_response = Mock()
        mock_response.choices = [Mock(message=Mock(content="测试响应"))]

        with patch.object(service, '_call_api', return_value="测试响应"):
            result = await service.generate("你好")
            assert result == "测试响应"

    @pytest.mark.asyncio
    async def test_generate_with_system_prompt(self):
        """测试带系统提示词的生成"""
        service = LLMService()

        with patch.object(service, '_call_api', return_value="响应内容"):
            result = await service.generate(
                prompt="用户输入",
                system_prompt="你是一个助手"
            )
            assert result == "响应内容"

    @pytest.mark.asyncio
    async def test_generate_with_history(self):
        """测试带对话历史的生成"""
        service = LLMService()
        history = [
            {"role": "user", "content": "你好"},
            {"role": "assistant", "content": "您好！"}
        ]

        with patch.object(service, '_call_api', return_value="继续对话"):
            result = await service.generate_with_history(
                prompt="今天心情不好",
                history=history
            )
            assert result == "继续对话"

    @pytest.mark.asyncio
    async def test_analyze_emotion_success(self):
        """测试情绪分析成功"""
        service = LLMService()

        mock_result = """{
            "primary_emotion": "悲伤",
            "intensity": 0.7,
            "secondary_emotions": ["焦虑"],
            "reasoning": "用户表达了负面情绪"
        }"""

        with patch.object(service, 'generate', AsyncMock(return_value=mock_result)):
            result = await service.analyze_emotion("我今天很伤心")
            assert result["primary_emotion"] == "悲伤"
            assert result["intensity"] == 0.7

    @pytest.mark.asyncio
    async def test_analyze_emotion_fallback(self):
        """测试情绪分析失败降级"""
        service = LLMService()

        with patch.object(service, 'generate', AsyncMock(side_effect=Exception("API错误"))):
            result = await service.analyze_emotion("测试文本")
            assert result["primary_emotion"] == "平静"
            assert "LLM分析失败" in result["reasoning"]

    @pytest.mark.asyncio
    async def test_generate_questionnaire_question(self):
        """测试生成问卷问题"""
        service = LLMService()
        context = {
            "assessed_areas": ["mood"],
            "detected_symptoms": ["情绪低落"],
            "risk_level": "green",
            "last_response": "最近心情不太好"
        }

        with patch.object(service, 'generate', AsyncMock(return_value="您最近睡眠如何？")):
            result = await service.generate_questionnaire_question(context)
            assert "睡眠" in result

    @pytest.mark.asyncio
    async def test_generate_intervention_suggestion(self):
        """测试生成干预建议"""
        service = LLMService()
        user_context = {
            "symptoms": ["焦虑", "失眠"],
            "risk_level": "yellow"
        }
        emotion_state = {
            "emotion": "焦虑",
            "intensity": 0.6
        }

        with patch.object(service, 'generate', AsyncMock(return_value="建议进行深呼吸练习")):
            result = await service.generate_intervention_suggestion(
                user_context=user_context,
                emotion_state=emotion_state
            )
            assert "深呼吸" in result

    @pytest.mark.asyncio
    async def test_generate_chat_response(self):
        """测试生成对话响应"""
        service = LLMService()
        history = [
            {"role": "user", "content": "你好"},
            {"role": "assistant", "content": "您好！"}
        ]

        with patch.object(service, '_call_api', return_value="我能理解您的感受"):
            result = await service.generate_chat_response(
                user_input="最近压力很大",
                conversation_history=history,
                emotion_detected="焦虑",
                risk_level="yellow"
            )
            assert "理解" in result

    def test_get_llm_service_singleton(self):
        """测试获取单例"""
        import app.services.llm_service as module

        # 重置单例
        module._llm_service = None

        service1 = get_llm_service()
        service2 = get_llm_service()

        assert service1 is service2


class TestLLMServiceRetry:
    """LLM服务重试机制测试"""

    def test_retry_on_failure(self):
        """测试失败重试机制"""
        service = LLMService()

        # 直接mock内部客户端
        mock_client = Mock()
        mock_client.chat.completions.create.side_effect = [
            Exception("错误1"),
            Exception("错误2"),
            Mock(choices=[Mock(message=Mock(content="成功响应"))])
        ]

        # 设置内部客户端
        service._client = mock_client

        result = service._call_api([{"role": "user", "content": "test"}])
        assert result == "成功响应"
        assert mock_client.chat.completions.create.call_count == 3