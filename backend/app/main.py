"""
HeartMirror FastAPI Application Entry Point
"""
from contextlib import asynccontextmanager
from typing import List
import logging
import traceback
import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from loguru import logger

from app.config import settings
from app.core.database import close_database, init_database
from app.core.exceptions import HeartMirrorException, http_exception_from_error
from app.core.redis_client import close_redis, init_redis

# 导入API路由
from app.api import auth, chat, emotion, diary, dashboard, crisis, intervention, questionnaire


# 配置标准 logging
logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    应用生命周期管理
    """
    import asyncio

    # 启动时
    logger.info(f"🚀 Starting {settings.APP_NAME}...")
    logger.info(f"📝 Environment: {settings.APP_ENV}")

    # 初始化数据库 - 带超时保护
    try:
        await asyncio.wait_for(init_database(), timeout=30)
        logger.info("✅ Database initialized")
    except asyncio.TimeoutError:
        logger.error("❌ Database initialization timed out")
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")

    # 初始化Redis - 带超时保护
    try:
        await asyncio.wait_for(init_redis(), timeout=10)
        logger.info("✅ Redis connected")
    except asyncio.TimeoutError:
        logger.warning("⚠️ Redis connection timed out")
    except Exception as e:
        logger.warning(f"⚠️ Redis connection failed: {e}")

    # 跳过RAG初始化以加速启动（按需加载）
    # RAG会在首次使用时自动初始化
    logger.info("⚡ Skipping RAG initialization for faster startup (will initialize on demand)")

    yield

    # 关闭时
    logger.info("🛑 Shutting down...")
    await close_database()
    await close_redis()
    logger.info("👋 Goodbye!")


# 创建FastAPI应用
app = FastAPI(
    title=settings.APP_NAME,
    description="""
## HeartMirror - AI心理健康自助管理系统

闭环循证AI心理健康自助管理系统，面向18-28岁学生与年轻职场人群。

### 核心功能
- 🔍 实时情绪识别与追踪
- 📋 RAG驱动的对话式动态评估
- 📊 风险量化与分层管理
- 💡 循证个性化干预方案
- 📈 干预效果跟踪与自适应调整
- 🆘 危机支持与转诊服务

### 免责声明
⚠️ 本产品为心理健康自助管理工具，不替代专业临床诊断和治疗。
如有严重心理问题，请及时寻求专业医疗帮助。
    """,
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS中间件配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 全局异常处理
@app.exception_handler(HeartMirrorException)
async def heartmirror_exception_handler(request, exc: HeartMirrorException):
    """处理自定义异常"""
    http_exc = http_exception_from_error(exc)
    return JSONResponse(
        status_code=http_exc.status_code,
        content=http_exc.detail,
    )


# 注册路由
app.include_router(auth.router, prefix="/api/auth", tags=["认证"])
app.include_router(chat.router, prefix="/api/chat", tags=["对话"])
app.include_router(emotion.router, prefix="/api/emotion", tags=["情绪"])
app.include_router(diary.router, prefix="/api/diary", tags=["日记"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["看板"])
app.include_router(crisis.router, prefix="/api/crisis", tags=["危机支持"])
app.include_router(intervention.router, prefix="/api/intervention", tags=["干预方案"])
app.include_router(questionnaire.router, prefix="/api/questionnaire", tags=["问卷评估"])


# 健康检查端点
@app.get("/health", tags=["系统"])
async def health_check():
    """健康检查"""
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "version": "0.1.0",
    }


# API信息端点（供开发者使用）
@app.get("/api/info", tags=["系统"])
async def api_info():
    """API信息"""
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "docs": "/docs",
        "health": "/health",
    }


# 免责声明端点
@app.get("/disclaimer", tags=["系统"])
async def disclaimer():
    """获取免责声明"""
    return {
        "title": "HeartMirror 免责声明",
        "content": """
## 重要声明

HeartMirror（心镜）是一款心理健康自助管理工具，旨在帮助用户进行情绪管理和心理健康自我关护。

### 请注意：

1. **非医疗诊断**：本产品不提供医疗诊断服务，所有评估结果仅供参考。

2. **非替代治疗**：本产品不能替代专业心理咨询或治疗。

3. **紧急情况**：如果您或他人正处于危机状态，请立即联系专业机构：
   - 全国心理援助热线：400-161-9995
   - 北京心理危机研究与干预中心：010-82951332
   - 上海心理援助热线：021-34289888

4. **数据安全**：我们采用端到端加密保护您的隐私数据。

使用本产品即表示您已阅读并同意以上声明。
        """,
        "version": "1.0.0",
        "updated_at": "2024-01-01",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )


# ============================================================================
# SPA Static File Serving (for Render deployment)
# ============================================================================

# 检测前端静态文件目录
FRONTEND_STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")


def _is_api_route(path: str) -> bool:
    """检查是否为API路由"""
    api_prefixes = [
        "api/", "docs", "redoc", "health", "openapi.json",
        "favicon.ico", "robots.txt"
    ]
    return any(path.startswith(prefix) or path == prefix.rstrip("/") for prefix in api_prefixes)


# 挂载静态资源目录（如果存在）
if os.path.exists(os.path.join(FRONTEND_STATIC_DIR, "assets")):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_STATIC_DIR, "assets")), name="assets")


@app.get("/{full_path:path}", include_in_schema=False)
async def serve_spa(request: Request, full_path: str):
    """
    SPA路由回退 - 处理前端路由

    对于非API路由，返回index.html让前端路由处理
    这解决了SPA应用在页面刷新时404的问题
    """
    # 如果是API路由，跳过（让FastAPI返回404）
    if _is_api_route(full_path):
        return JSONResponse(
            status_code=404,
            content={"detail": "Not Found"}
        )

    # 检查是否请求静态文件（如图片、CSS等）
    file_path = os.path.join(FRONTEND_STATIC_DIR, full_path)
    if os.path.isfile(file_path):
        return FileResponse(file_path)

    # 返回index.html让前端路由处理
    index_path = os.path.join(FRONTEND_STATIC_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)

    # 如果前端未构建，返回提示信息
    return JSONResponse(
        status_code=503,
        content={
            "message": "Frontend not built. Please run 'npm run build' in the frontend directory.",
            "docs": "/docs"
        }
    )