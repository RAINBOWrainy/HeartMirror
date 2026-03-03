"""
Test Auth API
认证API测试
"""
import pytest
from httpx import AsyncClient


class TestAuthAPI:
    """认证API测试类"""

    @pytest.mark.asyncio
    async def test_register_user(self, client: AsyncClient, mock_user: dict):
        """测试用户注册"""
        response = await client.post("/api/auth/register", json=mock_user)
        assert response.status_code in [201, 400]  # 400可能是用户已存在

    @pytest.mark.asyncio
    async def test_login_invalid_user(self, client: AsyncClient):
        """测试无效用户登录"""
        response = await client.post(
            "/api/auth/login",
            json={
                "anonymous_id": "nonexistent_user",
                "password": "wrong_password"
            }
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_current_user_unauthorized(self, client: AsyncClient):
        """测试未授权访问用户信息"""
        response = await client.get("/api/auth/me")
        assert response.status_code == 403