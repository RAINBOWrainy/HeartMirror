# HeartMirror 心镜

> 闭环循证AI心理健康自助管理系统

[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-green.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 📖 项目简介

HeartMirror（心镜）是一款面向18-28岁学生与年轻职场人群的AI心理健康自助管理系统。通过「情绪识别-动态评估-个性化干预-效果跟踪-危机转诊」全流程服务闭环，帮助用户进行情绪管理和心理健康自我关护。

### 产品定位
- 闭环循证AI心理健康自助管理系统
- 面向18-28岁学生与年轻职场人群
- 符合中国《个人信息保护法》与精神卫生相关法规

---

## ✨ 核心功能

| 功能模块 | 描述 | 技术实现 |
|---------|------|----------|
| 🔍 实时情绪识别 | 基于微调中文BERT模型的情绪分析 | BERT + LangChain Agent |
| 📋 RAG动态问卷 | 对话式心理健康评估 | ChromaDB + Sentence-BERT |
| 📊 风险量化分层 | 多维度风险评估模型 | PHQ-9/GAD-7量表 |
| 💡 个性化干预 | 循证CBT、正念等干预方案 | 知识图谱 + 推荐引擎 |
| 📈 效果跟踪 | LSTM情绪趋势预测 | PyTorch/TensorFlow |
| 🆘 危机支持 | 心理援助热线与转诊服务 | 风险触发机制 |

---

## 🛠 技术栈

### 后端技术
| 组件 | 技术选型 | 版本 |
|------|----------|------|
| Web框架 | FastAPI | ^0.109.0 |
| LLM框架 | LangChain | ^0.3.0 |
| 核心LLM | 通义千问 Qwen3.5-Plus | API |
| 情绪识别 | 中文BERT (微调) | bert-base-chinese |
| 向量检索 | Sentence-BERT + ChromaDB | - |
| 数据库 | PostgreSQL + Neo4j + Redis | - |
| ORM | SQLAlchemy | ^2.0.0 |

### 前端技术
| 组件 | 技术选型 | 版本 |
|------|----------|------|
| 框架 | React + TypeScript | 18.x |
| UI库 | Ant Design | 5.x |
| 状态管理 | Zustand | 4.x |
| 可视化 | ECharts | 5.x |
| 构建工具 | Vite | 5.x |

---

## 🚀 快速开始

### 环境要求

- **Python** 3.10 或更高版本
- **Node.js** 18.x 或更高版本
- **Docker** & Docker Compose（可选，用于本地数据库）

### 安装步骤

#### 方式一：使用虚拟环境脚本（推荐）

**Windows用户：**
```bash
cd backend
# 双击运行或命令行执行
setup_venv.bat
```

**Linux/Mac用户：**
```bash
cd backend
chmod +x setup_venv.sh
./setup_venv.sh
```

#### 方式二：手动配置

**1. 创建虚拟环境**
```bash
cd backend
python -m venv .venv

# Windows激活
.venv\Scripts\activate

# Linux/Mac激活
source .venv/bin/activate
```

**2. 安装依赖**
```bash
pip install -r requirements.txt
```

**3. 配置环境变量**
```bash
cp .env.example .env
# 编辑 .env 文件，填入必要配置
```

**4. 运行环境校验**
```bash
python scripts/check_environment.py
```

**5. 启动后端服务**
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 启动前端

```bash
cd frontend
npm install
npm run dev
```

### 启动Docker服务（可选）

```bash
# 启动 PostgreSQL + Redis + Neo4j
docker-compose up -d

# 查看服务状态
docker-compose ps

# 停止服务
docker-compose down
```

### 访问应用

| 服务 | 地址 |
|------|------|
| 前端应用 | http://localhost:5173 |
| 后端API | http://localhost:8000 |
| API文档 (Swagger) | http://localhost:8000/docs |
| API文档 (ReDoc) | http://localhost:8000/redoc |

---

## 📁 项目结构

```
HeartMirror/
├── .vscode/                    # VS Code配置
│   ├── launch.json             # 调试配置
│   ├── settings.json           # 编辑器设置
│   ├── extensions.json         # 推荐扩展
│   └── tasks.json              # 任务配置
│
├── backend/                    # 后端服务
│   ├── app/
│   │   ├── agents/             # Agent模块（核心）
│   │   │   ├── emotion_agent/  # 情绪识别Agent
│   │   │   ├── questionnaire_agent/  # 动态问卷Agent
│   │   │   ├── risk_agent/     # 风险量化Agent
│   │   │   ├── intervention_agent/   # 干预方案Agent
│   │   │   └── orchestrator.py # Agent协调器
│   │   ├── api/                # API路由
│   │   ├── core/               # 核心基础设施
│   │   ├── models/             # 数据库模型
│   │   ├── services/           # 业务服务
│   │   ├── knowledge/          # 知识库模块
│   │   ├── schemas/            # Pydantic模型
│   │   └── utils/              # 工具函数
│   ├── tests/                  # 测试目录
│   ├── scripts/                # 脚本目录
│   │   └── check_environment.py  # 环境校验脚本
│   ├── requirements.txt        # 依赖配置
│   ├── setup_venv.bat          # Windows虚拟环境脚本
│   ├── setup_venv.sh           # Linux/Mac虚拟环境脚本
│   └── .env.example            # 环境变量模板
│
├── frontend/                   # 前端应用
│   ├── src/
│   │   ├── components/         # UI组件
│   │   ├── pages/              # 页面组件
│   │   ├── stores/             # 状态管理
│   │   ├── services/           # API服务
│   │   └── utils/              # 工具函数
│   ├── package.json
│   └── vite.config.ts
│
├── knowledge_base/             # 知识库构建
│   ├── dsm5_builder/           # DSM-5知识构建
│   └── vector_builder/         # 向量库构建
│
├── docs/                       # 项目文档
├── docker-compose.yml          # Docker编排
├── .gitignore
└── README.md
```

---

## 📦 核心依赖

### requirements.txt 主要依赖

```txt
# LangChain全家桶
langchain>=0.3.0
langchain-community>=0.3.0
langchain-core>=0.3.0

# 向量数据库
chromadb>=0.4.22

# 模型相关
transformers>=4.36.0
torch>=2.1.0
sentence-transformers>=2.2.0

# 数据处理
pandas>=2.0.0
numpy>=1.24.0
scikit-learn>=1.3.0

# 后端框架
fastapi>=0.109.0
uvicorn[standard]>=0.27.0

# 加密安全
cryptography>=41.0.0

# 可视化
plotly>=5.18.0
matplotlib>=3.8.0

# 测试框架
pytest>=7.4.0
```

---

## 🔧 模块功能说明

### Agent模块

| Agent | 功能 | 输入 | 输出 |
|-------|------|------|------|
| EmotionAgent | 情绪识别 | 用户文本 | 情绪类型、强度、风险等级 |
| QuestionnaireAgent | 动态问卷 | 用户回答 | 评估问题、得分 |
| RiskAgent | 风险量化 | 多维度信息 | 风险等级(green/yellow/orange/red) |
| InterventionAgent | 干预方案 | 用户需求 | 个性化干预建议 |

### 服务模块

| 服务 | 功能 |
|------|------|
| AuthService | 用户注册、登录、令牌管理 |
| EncryptionService | 端到端数据加密 |
| TrackingService | 情绪记录、效果跟踪 |
| CrisisService | 危机资源、安全计划 |

### 知识库模块

| 组件 | 功能 |
|------|------|
| DSM5KnowledgeGraph | DSM-5知识图谱管理 |
| VectorStore | ChromaDB向量存储 |
| Embedder | Sentence-BERT文本嵌入 |

---

## 🧪 测试

```bash
# 运行所有测试
cd backend
pytest

# 运行带覆盖率的测试
pytest --cov=app tests/

# 运行特定测试文件
pytest tests/test_api/test_auth.py -v
```

---

## ❓ 常见问题

### Q1: 依赖安装失败
```bash
# 尝试使用国内镜像
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

### Q2: PyTorch安装问题
```bash
# CPU版本
pip install torch --index-url https://download.pytorch.org/whl/cpu

# GPU版本（CUDA 11.8）
pip install torch --index-url https://download.pytorch.org/whl/cu118
```

### Q3: 数据库连接失败
- 检查Docker服务是否启动：`docker-compose ps`
- 检查.env文件中的数据库配置
- 确认端口未被占用

### Q4: 通义千问API配置
1. 访问 [阿里云DashScope](https://dashscope.aliyun.com/) 获取API Key
2. 在.env文件中设置：`DASHSCOPE_API_KEY=your-api-key`

---

## ⚠️ 免责声明

**HeartMirror是一款心理健康自助管理工具，不提供医疗诊断服务，不能替代专业心理咨询或治疗。**

如果您正处于危机状态，请立即联系专业机构：

| 热线 | 电话 | 服务时间 |
|------|------|----------|
| 全国心理援助热线 | 400-161-9995 | 24小时 |
| 北京心理危机研究与干预中心 | 010-82951332 | 24小时 |
| 上海心理援助热线 | 021-34289888 | 24小时 |
| 紧急求助 | 120 / 110 | 24小时 |

---

## 📄 许可证

[MIT License](LICENSE)

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

---

## 📞 联系方式

- 项目主页：https://github.com/your-repo/HeartMirror
- 问题反馈：https://github.com/your-repo/HeartMirror/issues