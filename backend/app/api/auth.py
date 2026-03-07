"""
Authentication API Routes
用户认证接口
"""
import uuid
from datetime import datetime, timezone, timedelta
from typing import Annotated, Optional
import logging
import traceback

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_access_token,
    get_password_hash,
    verify_password,
    verify_token,
)
from app.dependencies import get_db
from app.models.user import User
from app.schemas.user import (
    UserCreate,
    UserLogin,
    UserResponse,
    TokenResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter()
security = HTTPBearer()


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """获取当前用户依赖"""
    token = credentials.credentials
    payload = verify_token(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的认证令牌",
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的令牌载荷",
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户不存在",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户已被禁用",
        )

    # 检查游客会话是否过期
    if user.is_guest and user.guest_expires_at:
        if datetime.now(timezone.utc) > user.guest_expires_at:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="游客会话已过期",
            )

    # 更新最后活跃时间
    user.last_active_at = datetime.now(timezone.utc)
    await db.commit()

    return user


async def get_current_user_optional(
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(security)] = None,
    db: Annotated[AsyncSession, Depends(get_db)] = None,
) -> Optional[User]:
    """获取当前用户（可选）- 用于游客模式"""
    if credentials is None:
        return None

    try:
        token = credentials.credentials
        payload = verify_token(token)

        if not payload:
            return None

        user_id = payload.get("sub")
        if not user_id:
            return None

        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if not user or not user.is_active:
            return None

        # 检查游客会话是否过期
        if user.is_guest and user.guest_expires_at:
            if datetime.now(timezone.utc) > user.guest_expires_at:
                return None

        # 更新最后活跃时间
        user.last_active_at = datetime.now(timezone.utc)
        await db.commit()

        return user
    except Exception as e:
        logger.warning(f"Optional auth check failed: {e}")
        return None


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    用户注册

    - 创建匿名账号
    - 自动生成匿名ID
    """
    try:
        logger.info(f"Registration attempt for anonymous_id: {user_data.anonymous_id}")

        # 检查匿名ID是否已存在
        result = await db.execute(
            select(User).where(User.anonymous_id == user_data.anonymous_id)
        )
        if result.scalar_one_or_none():
            logger.warning(f"Anonymous ID already exists: {user_data.anonymous_id}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="该匿名ID已被使用",
            )

        # 创建用户
        logger.info("Creating new user...")
        password_hash = get_password_hash(user_data.password)
        logger.info("Password hash generated")

        user = User(
            anonymous_id=user_data.anonymous_id,
            password_hash=password_hash,
            consent_given=user_data.consent_given,
            disclaimer_accepted=user_data.disclaimer_accepted,
        )

        db.add(user)
        logger.info("User added to session, committing...")
        await db.commit()
        logger.info("Commit successful, refreshing user...")
        await db.refresh(user)
        logger.info(f"User created successfully: {user.id}")

        return user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration failed: {type(e).__name__}: {e}\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"注册失败: {type(e).__name__}: {str(e)}",
        )


@router.post("/login", response_model=TokenResponse)
async def login(
    credentials: UserLogin,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    用户登录

    返回JWT访问令牌
    """
    # 查找用户
    result = await db.execute(
        select(User).where(User.anonymous_id == credentials.anonymous_id)
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="匿名ID或密码错误",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="账号已被禁用",
        )

    # 检查是否同意条款
    if not user.consent_given or not user.disclaimer_accepted:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="请先同意服务条款和免责声明",
        )

    # 创建令牌
    access_token = create_access_token(subject=str(user.id))

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post("/guest", response_model=TokenResponse)
async def create_guest_session(
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    创建游客会话

    - 自动生成游客ID
    - 24小时有效期
    - 可体验所有核心功能
    """
    try:
        # 生成唯一的游客ID
        guest_id = f"guest_{uuid.uuid4().hex[:8]}"

        # 确保ID唯一
        while True:
            result = await db.execute(
                select(User).where(User.anonymous_id == guest_id)
            )
            if not result.scalar_one_or_none():
                break
            guest_id = f"guest_{uuid.uuid4().hex[:8]}"

        # 生成随机密码
        random_password = uuid.uuid4().hex

        # 设置游客会话过期时间（24小时）
        expires_at = datetime.now(timezone.utc) + timedelta(hours=24)

        # 创建游客用户
        user = User(
            anonymous_id=guest_id,
            password_hash=get_password_hash(random_password),
            consent_given=True,  # 游客自动同意
            disclaimer_accepted=True,  # 游客自动接受
            is_guest=True,
            guest_expires_at=expires_at,
        )

        db.add(user)
        await db.commit()
        await db.refresh(user)

        logger.info(f"Guest session created: {guest_id}")

        # 创建访问令牌
        access_token = create_access_token(
            subject=str(user.id),
            expires_delta=timedelta(hours=24)
        )

        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse.model_validate(user),
        )

    except Exception as e:
        logger.error(f"Guest session creation failed: {e}\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"创建游客会话失败: {str(e)}",
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: Annotated[User, Depends(get_current_user)],
):
    """获取当前用户信息"""
    return current_user


@router.post("/logout")
async def logout(
    current_user: Annotated[User, Depends(get_current_user)],
):
    """用户登出（客户端清除令牌即可）"""
    return {"message": "登出成功"}