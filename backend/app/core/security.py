"""
Security Module
密码哈希、JWT令牌、数据加密
"""
import base64
import os
import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from cryptography.fernet import Fernet
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings

logger = logging.getLogger(__name__)

# 密码哈希上下文
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str) -> str:
    """生成密码哈希值"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证密码"""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(
    subject: str,
    expires_delta: Optional[timedelta] = None,
    extra_data: Optional[dict] = None
) -> str:
    """创建JWT访问令牌"""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode = {"sub": str(subject), "exp": expire}
    if extra_data:
        to_encode.update(extra_data)

    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


def verify_token(token: str) -> Optional[dict]:
    """验证JWT令牌"""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError:
        return None


class EncryptionService:
    """数据加密服务 - 使用Fernet对称加密"""

    def __init__(self, encryption_key: Optional[str] = None):
        """初始化加密服务"""
        self.fernet = None

        try:
            key_str = encryption_key or settings.ENCRYPTION_KEY

            if key_str:
                # 检查是否是 Fernet 格式的密钥（44字符，以=结尾）
                if len(key_str) == 44 and key_str.endswith('='):
                    try:
                        self.fernet = Fernet(key_str.encode())
                        logger.info("Using provided Fernet key")
                        return
                    except Exception as e:
                        logger.warning(f"Failed to use key as Fernet format: {e}")

                # 尝试 base64 解码
                try:
                    decoded = base64.urlsafe_b64decode(key_str)
                    if len(decoded) == 32:
                        self.fernet = Fernet(base64.urlsafe_b64encode(decoded))
                        logger.info("Using decoded base64 key")
                        return
                except Exception as e:
                    logger.warning(f"Failed to decode base64 key: {e}")

            # 生成临时密钥
            logger.warning("No valid encryption key, generating temporary key")
            self.fernet = Fernet(Fernet.generate_key())

        except Exception as e:
            logger.error(f"Encryption init error: {e}")
            self.fernet = Fernet(Fernet.generate_key())

    def encrypt(self, data: str) -> str:
        """加密数据"""
        if not self.fernet:
            raise RuntimeError("Encryption not initialized")
        return self.fernet.encrypt(data.encode("utf-8")).decode("utf-8")

    def decrypt(self, encrypted_data: str) -> str:
        """解密数据"""
        if not self.fernet:
            raise RuntimeError("Encryption not initialized")
        return self.fernet.decrypt(encrypted_data.encode("utf-8")).decode("utf-8")


# 全局实例
_encryption_service: Optional[EncryptionService] = None


def get_encryption_service() -> EncryptionService:
    """获取加密服务实例"""
    global _encryption_service
    if _encryption_service is None:
        _encryption_service = EncryptionService()
    return _encryption_service


def encrypt_data(data: str) -> str:
    """加密数据"""
    return get_encryption_service().encrypt(data)


def decrypt_data(encrypted_data: str) -> str:
    """解密数据"""
    return get_encryption_service().decrypt(encrypted_data)