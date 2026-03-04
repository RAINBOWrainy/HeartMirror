"""
Database Configuration
PostgreSQL + SQLAlchemy Async Setup
"""
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings


def get_database_url():
    """
    获取数据库 URL，自动转换格式
    Railway 提供的格式: postgres:// 或 postgresql://
    SQLAlchemy asyncpg 需要的格式: postgresql+asyncpg://
    """
    url = settings.DATABASE_URL

    if not url:
        # 如果没有配置数据库 URL，使用 SQLite
        return "sqlite+aiosqlite:///./heartmirror.db"

    # 转换 Railway 提供的 postgres:// 为 asyncpg 格式
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)

    return url


# 创建异步引擎
async_engine = create_async_engine(
    get_database_url(),
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)

# 创建异步会话工厂
async_session_maker = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    """SQLAlchemy Declarative Base"""

    pass


async def init_database():
    """初始化数据库 - 创建所有表"""
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_database():
    """关闭数据库连接"""
    await async_engine.dispose()


async def get_db():
    """
    获取数据库会话的依赖项

    Yields:
        AsyncSession: 异步数据库会话
    """
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()