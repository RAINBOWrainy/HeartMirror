"""
HeartMirror Application Configuration
"""
from functools import lru_cache
from typing import List, Union
import json
import os
import secrets
import warnings

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def parse_cors_origins(value: str) -> List[str]:
    """解析 CORS 源列表"""
    if not value:
        return ["*"]
    try:
        # 尝试解析 JSON 字符串
        parsed = json.loads(value)
        if isinstance(parsed, list):
            return parsed
        return [parsed]
    except json.JSONDecodeError:
        # 如果不是 JSON，按逗号分割
        return [origin.strip() for origin in value.split(",")]


# 不安全的默认密钥列表
INSECURE_KEYS = {
    "your-secret-key-change-in-production",
    "your-jwt-secret-key-change-in-production",
    "heartmirror-jwt-secret-key-2024-production",
    "",
}


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    APP_NAME: str = "HeartMirror"
    APP_ENV: str = "development"
    DEBUG: bool = True
    SECRET_KEY: str = "your-secret-key-change-in-production"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Database - PostgreSQL
    DATABASE_URL: str = "sqlite+aiosqlite:///./heartmirror.db"
    DATABASE_SYNC_URL: str = "sqlite:///./heartmirror.db"

    # Redis
    REDIS_URL: str = ""

    # Neo4j
    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str = "password"

    # OpenRouter LLM API
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    LLM_MODEL: str = "z-ai/glm-4.5-air:free"

    # LangChain
    LANGCHAIN_TRACING_V2: bool = False
    LANGCHAIN_API_KEY: str = ""

    # JWT Settings
    JWT_SECRET_KEY: str = "your-jwt-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # Encryption
    ENCRYPTION_KEY: str = ""

    # Crisis Support
    CRISIS_HOTLINE: str = "400-161-9995"

    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 100  # 请求数
    RATE_LIMIT_PERIOD: int = 60  # 秒

    # CORS - 支持从环境变量读取
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://rainbowrainy.github.io",
        "https://heartmirror-demo.vercel.app",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors(cls, v):
        if isinstance(v, str):
            return parse_cors_origins(v)
        return v

    @model_validator(mode="after")
    def validate_security_settings(self):
        """验证安全配置 - 只警告不阻止启动"""
        if self.JWT_SECRET_KEY in INSECURE_KEYS:
            warnings.warn(
                "WARNING: Using insecure default JWT_SECRET_KEY. "
                "Set a secure key for production!",
                UserWarning
            )

        # 检查 SECRET_KEY - 只警告不阻止启动
        if self.SECRET_KEY in INSECURE_KEYS:
            warnings.warn(
                "WARNING: Using insecure default SECRET_KEY. "
                "Set a secure key for production!",
                UserWarning
            )

        # 检查加密密钥 - 只警告不阻止启动
        if not self.ENCRYPTION_KEY or len(self.ENCRYPTION_KEY) < 32:
            warnings.warn(
                "WARNING: ENCRYPTION_KEY is not set or too short. "
                "Sensitive data will not be properly encrypted!",
                UserWarning
            )

        return self

    @property
    def is_production(self) -> bool:
        """是否为生产环境"""
        return self.APP_ENV == "production"

    def generate_secure_key(self) -> str:
        """生成安全的随机密钥"""
        return secrets.token_urlsafe(32)


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


settings = get_settings()