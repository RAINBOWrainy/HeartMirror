"""
Database Configuration
PostgreSQL + SQLAlchemy Async Setup
使用延迟加载模式避免模块导入时阻塞
"""
import logging
import ssl
import asyncio
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine, AsyncEngine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

logger = logging.getLogger(__name__)


class DatabaseManager:
    """
    数据库管理器 - 延迟加载模式

    避免在模块导入时创建引擎，防止启动阻塞
    """

    _instance: Optional["DatabaseManager"] = None
    _engine: Optional[AsyncEngine] = None
    _session_maker: Optional[async_sessionmaker] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    @property
    def engine(self) -> AsyncEngine:
        """延迟创建数据库引擎"""
        if self._engine is None:
            logger.info("🔧 Creating database engine (lazy initialization)...")
            self._engine = create_async_engine(
                self._get_database_url(),
                **self._get_engine_args()
            )
            logger.info("✅ Database engine created")
        return self._engine

    @property
    def session_maker(self) -> async_sessionmaker:
        """延迟创建会话工厂"""
        if self._session_maker is None:
            self._session_maker = async_sessionmaker(
                bind=self.engine,
                class_=AsyncSession,
                expire_on_commit=False,
                autocommit=False,
                autoflush=False,
            )
        return self._session_maker

    def _get_database_url(self) -> str:
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

    def _get_ssl_context(self) -> ssl.SSLContext:
        """
        创建 SSL 上下文，用于 Render PostgreSQL 的自签名证书
        """
        ssl_context = ssl.create_default_context()
        # 禁用证书验证（Render 使用自签名证书）
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        return ssl_context

    def _get_engine_args(self) -> dict:
        """获取引擎参数"""
        url = self._get_database_url()
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
                "ssl": self._get_ssl_context(),
                "timeout": 10,  # 连接超时10秒
            }
        else:
            # SQLite 不支持这些参数
            args["pool_pre_ping"] = False

        return args

    async def dispose(self):
        """释放数据库连接"""
        if self._engine is not None:
            await self._engine.dispose()
            self._engine = None
            self._session_maker = None


# 全局数据库管理器实例（不创建引擎）
db_manager = DatabaseManager()


class Base(DeclarativeBase):
    """SQLAlchemy Declarative Base"""

    pass


async def init_database():
    """初始化数据库 - 创建所有表"""
    try:
        # 添加超时保护，最多等待30秒
        async with asyncio.timeout(30):
            # 通过访问 engine 属性触发延迟初始化
            engine = db_manager.engine
            async with engine.begin() as conn:
                # 创建所有表（如果不存在）
                # 注意：不再使用 drop_all 以保留数据
                await conn.run_sync(Base.metadata.create_all)
        logger.info("✅ Database tables created successfully")
    except asyncio.TimeoutError:
        logger.error("❌ Database initialization timed out after 30 seconds")
        logger.warning("⚠️ Continuing without database - some features may not work")
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        logger.warning("⚠️ Continuing without database - some features may not work")


async def close_database():
    """关闭数据库连接"""
    await db_manager.dispose()


async def get_db():
    """
    获取数据库会话的依赖项

    Yields:
        AsyncSession: 异步数据库会话
    """
    async with db_manager.session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# 为了向后兼容，提供模块级别的属性访问
def __getattr__(name):
    """延迟加载模块属性"""
    if name == "async_engine":
        return db_manager.engine
    if name == "async_session_maker":
        return db_manager.session_maker
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")