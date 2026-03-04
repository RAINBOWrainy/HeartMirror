"""
HeartMirror Application Configuration
"""
from functools import lru_cache
from typing import List, Union
import json
import os

from pydantic_settings import BaseSettings


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


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

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

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

    @property
    def CORS_ORIGINS(self) -> List[str]:
        """获取 CORS 源列表"""
        # 从环境变量读取
        cors_env = os.environ.get("CORS_ORIGINS", "")
        if cors_env:
            return parse_cors_origins(cors_env)
        # 默认值 - 包含 GitHub Pages
        return [
            "http://localhost:5173",
            "http://localhost:3000",
            "https://rainbowrainy.github.io",
            "https://heartmirror-demo.vercel.app",
        ]


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


settings = get_settings()