"""
Authentication Service
用户认证服务
"""
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.user import User


class AuthService:
    """用户认证服务"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def register_user(
        self,
        anonymous_id: str,
        password: str,
        consent_given: bool = False,
        disclaimer_accepted: bool = False
    ) -> User:
        """
        注册新用户

        Args:
            anonymous_id: 匿名ID
            password: 密码
            consent_given: 是否同意隐私政策
            disclaimer_accepted: 是否接受免责声明

        Returns:
            创建的用户实例
        """
        # 检查用户是否存在
        existing = await self.get_user_by_anonymous_id(anonymous_id)
        if existing:
            raise ValueError("该匿名ID已被使用")

        # 创建用户
        user = User(
            anonymous_id=anonymous_id,
            password_hash=get_password_hash(password),
            consent_given=consent_given,
            disclaimer_accepted=disclaimer_accepted
        )

        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)

        return user

    async def authenticate_user(
        self,
        anonymous_id: str,
        password: str
    ) -> Optional[User]:
        """
        验证用户

        Args:
            anonymous_id: 匿名ID
            password: 密码

        Returns:
            验证成功返回用户实例，失败返回None
        """
        user = await self.get_user_by_anonymous_id(anonymous_id)

        if not user:
            return None

        if not verify_password(password, user.password_hash):
            return None

        # 更新最后活跃时间
        user.last_active_at = datetime.now(timezone.utc)
        await self.db.commit()

        return user

    async def get_user_by_anonymous_id(self, anonymous_id: str) -> Optional[User]:
        """根据匿名ID获取用户"""
        result = await self.db.execute(
            select(User).where(User.anonymous_id == anonymous_id)
        )
        return result.scalar_one_or_none()

    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        """根据ID获取用户"""
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    def create_token(self, user: User) -> str:
        """为用户创建访问令牌"""
        return create_access_token(subject=str(user.id))

    async def update_risk_level(self, user_id: str, risk_level: str) -> None:
        """更新用户风险等级"""
        user = await self.get_user_by_id(user_id)
        if user:
            user.risk_level = risk_level
            await self.db.commit()