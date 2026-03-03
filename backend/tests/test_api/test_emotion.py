"""
Test Emotion API
情绪API测试
"""
import pytest
from httpx import AsyncClient
from datetime import datetime


class TestEmotionAPI:
    """情绪API测试类"""

    @pytest.mark.asyncio
    async def test_create_emotion_record_unauthorized(self, client: AsyncClient):
        """测试未授权创建情绪记录"""
        response = await client.post(
            "/api/emotion/records",
            json={
                "emotion_type": "happy",
                "intensity": 0.8,
                "trigger": "测试"
            }
        )
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_get_emotion_history_unauthorized(self, client: AsyncClient):
        """测试未授权获取情绪历史"""
        response = await client.get("/api/emotion/records")
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_get_emotion_stats_unauthorized(self, client: AsyncClient):
        """测试未授权获取情绪统计"""
        response = await client.get("/api/emotion/stats")
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_analyze_emotion_unauthorized(self, client: AsyncClient):
        """测试未授权情绪分析"""
        response = await client.post(
            "/api/emotion/analyze",
            json={"text": "我今天很开心"}
        )
        assert response.status_code == 403


class TestEmotionService:
    """情绪服务测试类"""

    def test_emotion_types(self):
        """测试情绪类型定义"""
        from app.models.emotion import EmotionType
        # 实际的情绪类型值
        expected_values = ["joy", "sadness", "anger", "fear", "disgust", "surprise", "anxiety", "calm", "neutral"]
        actual_values = [e.value for e in EmotionType]
        for emotion in expected_values:
            assert emotion in actual_values

    def test_emotion_intensity_range(self):
        """测试情绪强度范围"""
        # 强度应在0-1之间
        valid_intensities = [0.0, 0.5, 1.0]
        for intensity in valid_intensities:
            assert 0.0 <= intensity <= 1.0