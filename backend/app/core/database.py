"""
Database Configuration
PostgreSQL + SQLAlchemy Async Setup
"""
import logging
import ssl
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

logger = logging.getLogger(__name__)


def get_database_url():
    """
    获取数据库 URL，自动转换格式
    Render 提供的格式: postgres:// 或 postgresql://
    SQLAlchemy asyncpg 需要的格式: postgresql+asyncpg://
    """
    url = settings.DATABASE_URL

    if not url:
        # 如果没有配置数据库 URL，使用 SQLite
        logger.info("No DATABASE_URL configured, using SQLite")
        return "sqlite+aiosqlite:///./heartmirror.db"

    # 转换 Render 提供的 postgres:// 为 asyncpg 格式
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)

    # 移除 URL 中的 sslmode 参数（asyncpg 不支持）
    if "?sslmode=" in url:
        url = url.split("?sslmode=")[0]
    elif "&sslmode=" in url:
        url = url.replace("&sslmode=require", "").replace("&sslmode=verify-ca", "")

    logger.info(f"Database URL scheme: {url.split('://')[0]}")
    return url


def get_ssl_context():
    """
    创建 SSL 上下文，用于 Render PostgreSQL 的自签名证书
    """
    ssl_context = ssl.create_default_context()
    # 禁用证书验证（Render 使用自签名证书）
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE
    return ssl_context


def get_engine_args():
    """获取引擎参数"""
    url = get_database_url()
    args = {
        "echo": settings.DEBUG,
    }

    # PostgreSQL 特定配置
    if "postgresql" in url:
        args["pool_pre_ping"] = True
        args["pool_size"] = 5
        args["max_overflow"] = 10
        # Render PostgreSQL 使用自签名证书
        # 创建不验证证书的 SSL 上下文
        args["connect_args"] = {
            "ssl": get_ssl_context()
        }
    else:
        # SQLite 不支持这些参数
        args["pool_pre_ping"] = False

    return args


# 创建异步引擎
async_engine = create_async_engine(get_database_url(), **get_engine_args())

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
    try:
        async with async_engine.begin() as conn:
            # 创建所有表（如果不存在）
            # 注意：不再使用 drop_all 以保留数据
            await conn.run_sync(Base.metadata.create_all)
        logger.info("✅ Database tables created successfully")
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        logger.warning("⚠️ Continuing without database - some features may not work")
        # 不再抛出异常，允许应用继续启动


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