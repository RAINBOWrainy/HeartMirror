# HeartMirror Backend Dockerfile
# AI心理健康自助管理系统后端服务

# ===== 构建阶段 =====
FROM python:3.11-slim as builder

WORKDIR /app

# 安装构建依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 安装Poetry
RUN pip install poetry==1.7.1

# 复制依赖文件
COPY pyproject.toml poetry.lock* ./

# 导出依赖到requirements.txt
RUN poetry export --without-hashes --only main -f requirements.txt -o requirements.txt

# ===== 生产阶段 =====
FROM python:3.11-slim as production

WORKDIR /app

# 设置环境变量
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# 安装运行时依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 创建非root用户
RUN groupadd -r heartmirror && useradd -r -g heartmirror heartmirror

# 从构建阶段复制requirements
COPY --from=builder /app/requirements.txt .

# 安装Python依赖
RUN pip install --no-cache-dir -r requirements.txt

# 预下载BERT模型，避免运行时下载（提升启动速度）
RUN python -c "from transformers import BertTokenizer, BertModel; \
    BertTokenizer.from_pretrained('bert-base-chinese'); \
    BertModel.from_pretrained('bert-base-chinese'); \
    print('BERT model downloaded successfully')" || echo "BERT model download failed, will use keyword-based fallback"

# 复制应用代码
COPY --chown=heartmirror:heartmirror . .

# 切换到非root用户
USER heartmirror

# 暴露端口
EXPOSE 8000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# 启动命令
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]