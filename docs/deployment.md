# HeartMirror 部署指南

## 本地开发环境

### 1. 环境准备

**系统要求**：
- Python 3.10+
- Node.js 18+
- Docker & Docker Compose

### 2. 克隆项目

```bash
git clone https://github.com/your-repo/HeartMirror.git
cd HeartMirror
```

### 3. 启动基础设施

```bash
docker-compose up -d
```

启动服务：
- PostgreSQL (5432)
- Redis (6379)
- Neo4j (7474, 7687)
- ChromaDB (8001)

### 4. 后端配置

```bash
cd backend

# Windows
setup_venv.bat

# Linux/Mac
chmod +x setup_venv.sh
./setup_venv.sh

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件
```

### 5. 前端配置

```bash
cd frontend
npm install
```

### 6. 启动服务

```bash
# 后端
cd backend
uvicorn app.main:app --reload

# 前端
cd frontend
npm run dev
```

---

## 免费云平台部署

### Vercel (前端)

1. 连接GitHub仓库
2. 设置根目录为 `frontend`
3. 配置环境变量：
   - `VITE_API_URL`: 后端API地址

### Render (后端)

1. 创建Web Service
2. 连接GitHub仓库
3. 配置：
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. 环境变量：参考 `.env.example`

### Supabase (PostgreSQL)

1. 创建项目
2. 获取数据库连接字符串
3. 配置到后端环境变量

### Redis Cloud

1. 创建免费Redis实例
2. 获取连接URL
3. 配置到后端环境变量

### Neo4j AuraDB

1. 创建免费实例
2. 获取连接信息
3. 配置到后端环境变量

---

## 生产环境检查清单

- [ ] 设置 `DEBUG=false`
- [ ] 配置强密钥
- [ ] 配置HTTPS
- [ ] 配置CORS允许的域名
- [ ] 设置通义千问API密钥
- [ ] 配置数据库备份
- [ ] 配置日志收集
- [ ] 配置监控告警

---

## Docker生产部署

```dockerfile
# backend/Dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
# 构建镜像
docker build -t heartmirror-backend ./backend

# 运行容器
docker run -d -p 8000:8000 --env-file .env heartmirror-backend
```