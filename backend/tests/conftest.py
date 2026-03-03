"""
Pytest Configuration
测试配置文件
"""
import asyncio
import pytest
from typing import AsyncGenerator
from httpx import AsyncClient


@pytest.fixture(scope="session")
def event_loop():
    """创建事件循环"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    """创建测试客户端"""
    from app.main import app
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client


@pytest.fixture
def mock_user():
    """模拟用户数据"""
    return {
        "anonymous_id": "test_user_001",
        "password": "test_password_123",
        "consent_given": True,
        "disclaimer_accepted": True
    }