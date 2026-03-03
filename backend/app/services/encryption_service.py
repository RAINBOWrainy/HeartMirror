"""
Encryption Service
端到端加密服务
"""
from typing import Optional
from cryptography.fernet import Fernet
import base64

from app.config import settings


class EncryptionService:
    """
    加密服务

    使用Fernet对称加密实现端到端加密
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
            key_str = settings.ENCRYPTION_KEY
            if key_str:
                self.key = base64.urlsafe_b64decode(key_str)
            else:
                # 开发环境生成临时密钥
                self.key = Fernet.generate_key()

        self.fernet = Fernet(base64.urlsafe_b64encode(self.key))

    def encrypt(self, data: str) -> str:
        """
        加密字符串数据

        Args:
            data: 待加密的明文

        Returns:
            加密后的base64编码字符串
        """
        if not data:
            return ""
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
        if not encrypted_data:
            return ""
        try:
            decrypted = self.fernet.decrypt(encrypted_data.encode("utf-8"))
            return decrypted.decode("utf-8")
        except Exception:
            return "[解密失败]"

    def encrypt_dict(self, data: dict) -> str:
        """加密字典数据"""
        import json
        return self.encrypt(json.dumps(data, ensure_ascii=False))

    def decrypt_dict(self, encrypted_data: str) -> dict:
        """解密字典数据"""
        import json
        try:
            decrypted = self.decrypt(encrypted_data)
            return json.loads(decrypted)
        except Exception:
            return {}


# 全局实例
_encryption_service: Optional[EncryptionService] = None


def get_encryption_service() -> EncryptionService:
    """获取加密服务实例"""
    global _encryption_service
    if _encryption_service is None:
        _encryption_service = EncryptionService()
    return _encryption_service