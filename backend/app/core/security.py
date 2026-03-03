"""
Security Module
密码哈希、JWT令牌、数据加密
"""
import base64
import os
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings

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
    """
    创建JWT访问令牌

    Args:
        subject: 令牌主体（通常是用户ID）
        expires_delta: 过期时间增量
        extra_data: 额外数据

    Returns:
        JWT令牌字符串
    """
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
    """
    验证JWT令牌

    Args:
        token: JWT令牌字符串

    Returns:
        解码后的载荷，验证失败返回None
    """
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
    """
    数据加密服务
    使用Fernet对称加密（AES-128）实现端到端加密
    """

    def __init__(self, encryption_key: Optional[str] = None):
        """
        初始化加密服务

        Args:
            encryption_key: 32字节加密密钥的base64编码
        """
        if encryption_key:
            self.key = base64.urlsafe_b64decode(encryption_key)
        else:
            # 从环境变量获取或生成新密钥
            key_str = settings.ENCRYPTION_KEY
            if key_str:
                self.key = base64.urlsafe_b64decode(key_str)
            else:
                # 开发环境生成临时密钥
                self.key = Fernet.generate_key()

        self.fernet = Fernet(
            base64.urlsafe_b64encode(self.key)
        )

    def encrypt(self, data: str) -> str:
        """
        加密字符串数据

        Args:
            data: 待加密的明文

        Returns:
            加密后的base64编码字符串
        """
        encrypted = self.fernet.encrypt(data.encode("utf-8"))
        return encrypted.decode("utf-8")

    def decrypt(self, encrypted_data: str) -> str:
        """
        解密数据

        Args:
            encrypted_data: 加密后的数据

        Returns:
            解密后的明文
        """
        decrypted = self.fernet.decrypt(encrypted_data.encode("utf-8"))
        return decrypted.decode("utf-8")


# 全局加密服务实例
_encryption_service: Optional[EncryptionService] = None


def get_encryption_service() -> EncryptionService:
    """获取加密服务实例"""
    global _encryption_service
    if _encryption_service is None:
        _encryption_service = EncryptionService()
    return _encryption_service


def encrypt_data(data: str) -> str:
    """加密数据便捷函数"""
    return get_encryption_service().encrypt(data)


def decrypt_data(encrypted_data: str) -> str:
    """解密数据便捷函数"""
    return get_encryption_service().decrypt(encrypted_data)