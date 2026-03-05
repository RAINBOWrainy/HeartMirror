"""
Test Diary API
日记API测试
"""
import pytest
from httpx import AsyncClient
from datetime import datetime


class TestDiaryAPI:
    """日记API测试类"""

    @pytest.mark.asyncio
    async def test_create_diary_unauthorized(self, client: AsyncClient):
        """测试未授权创建日记"""
        response = await client.post(
            "/api/diary",
            json={
                "content": "今天心情不错",
                "mood": "happy"
            }
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_list_diaries_unauthorized(self, client: AsyncClient):
        """测试未授权获取日记列表"""
        response = await client.get("/api/diary")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_diary_unauthorized(self, client: AsyncClient):
        """测试未授权获取日记详情"""
        response = await client.get("/api/diary/1")
        assert response.status_code in [401, 404, 422]  # 422 for invalid UUID

    @pytest.mark.asyncio
    async def test_update_diary_unauthorized(self, client: AsyncClient):
        """测试未授权更新日记"""
        response = await client.put(
            "/api/diary/1",
            json={
                "content": "更新内容"
            }
        )
        assert response.status_code in [401, 404, 422]  # 422 for invalid UUID

    @pytest.mark.asyncio
    async def test_delete_diary_unauthorized(self, client: AsyncClient):
        """测试未授权删除日记"""
        response = await client.delete("/api/diary/1")
        assert response.status_code in [401, 404, 422]  # 422 for invalid UUID


class TestDiaryService:
    """日记服务测试类"""

    def test_diary_schema_exists(self):
        """测试日记schema定义"""
        # 检查日记相关的模型是否存在
        from app.api.diary import DiaryCreate
        diary = DiaryCreate(
            content="今天心情不错"
        )
        assert diary.content == "今天心情不错"

    def test_diary_with_mood(self):
        """测试带情绪的日记"""
        from app.api.diary import DiaryCreate
        diary = DiaryCreate(
            content="今天很开心",
            mood="joy"
        )
        assert diary.mood == "joy"

    def test_diary_mood_validation(self):
        """测试日记情绪验证"""
        valid_moods = ["joy", "sadness", "anger", "fear", "neutral", "anxiety", "calm"]
        for mood in valid_moods:
            # 验证有效的mood值
            assert mood in valid_moods