"""
Core Module Initialization
"""
from app.core.database import Base, db_manager, get_db
from app.core.security import (
    create_access_token,
    decrypt_data,
    encrypt_data,
    get_password_hash,
    verify_password,
    verify_token,
)

__all__ = [
    "Base",
    "db_manager",
    "get_db",
    "create_access_token",
    "decrypt_data",
    "encrypt_data",
    "get_password_hash",
    "verify_password",
    "verify_token",
]


def __getattr__(name):
    """向后兼容 - 延迟加载 async_engine 和 async_session_maker"""
    if name == "async_engine":
        return db_manager.engine
    if name == "async_session_maker":
        return db_manager.session_maker
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")