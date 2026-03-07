# HeartMirror

> 闭环循证AI心理健康自助管理系统

[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-green.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 项目简介

HeartMirror是一款面向18-28岁学生与年轻职场人群的AI心理健康自助管理系统。通过「情绪识别-动态评估-个性化干预-效果跟踪-危机转诊」全流程服务闭环，帮助用户进行情绪管理和心理健康自我关护。

### 产品定位

- 闭环循证AI心理健康自助管理系统
- 面向18-28岁学生与年轻职场人群
- 符合中国《个人信息保护法》与精神卫生相关法规

## 实现进度

### 后端模块

| 模块 | 功能 | 状态 |
|------|------|------|
| auth | JWT认证 + 访客模式 | 完成 |
| chat | AI对话 + 情绪检测 | 完成 |
| emotion | 情绪记录与历史 | 完成 |
| diary | 情绪日记CRUD | 完成 |
| questionnaire | PHQ-9/GAD-7对话式评估 | 完成 |
| risk | 四级风险评估 | 完成 |
| intervention | 循证干预推荐 | 完成 |
| crisis | 危机支持资源 | 完成 |
| dashboard | 数据看板统计 | 完成 |

### AI Agent系统

| Agent | 功能 | 状态 |
|-------|------|------|
| EmotionAgent | 混合情绪识别引擎(规则+BERT+LLM) | 完成 |
| QuestionnaireAgent | RAG驱动的对话式评估 | 完成 |
| RiskAgent | 多维度风险量化模型 | 完成 |
| InterventionAgent | 循证个性化干预推荐 | 完成 |
| Orchestrator | 多Agent协调 + 用户记忆集成 | 完成 |

### 前端页面

| 页面 | 路由 | 状态 |
|------|------|------|
| Home | / | 完成 |
| Chat | /chat | 完成 |
| Diary | /diary | 完成 |
| Dashboard | /dashboard | 完成 |
| Questionnaire | /questionnaire | 完成 |
| Intervention | /intervention | 完成 |
| Crisis | /crisis | 完成 |

### 桌面应用

| 平台 | 状态 |
|------|------|
| Windows | 配置完成(需安装VS Build Tools) |
| macOS | 配置完成 |
| Linux | 配置完成 |

## 技术栈

### 后端

| 组件 | 技术选型 | 版本 |
|------|----------|------|
| Web框架 | FastAPI | ^0.109.0 |
| LLM框架 | LangChain | ^0.3.0 |
| 核心LLM | OpenRouter (多模型支持) | API |
| 情绪识别 | 中文BERT (微调) | bert-base-chinese |
| 向量检索 | Sentence-BERT + ChromaDB | - |
| 数据库 | PostgreSQL + Redis | - |
| ORM | SQLAlchemy | ^2.0.0 |

### 前端

| 组件 | 技术选型 | 版本 |
|------|----------|------|
| 框架 | React + TypeScript | 18.x |
| UI库 | Ant Design | 5.x |
| 状态管理 | Zustand | 4.x |
| 可视化 | ECharts | 5.x |
| 构建工具 | Vite | 5.x |

### 桌面应用

| 组件 | 技术选型 | 版本 |
|------|----------|------|
| 框架 | Tauri | 2.x |
| 后端 | Rust | 1.94+ |

## 快速开始

### 环境要求

- Python 3.10+
- Node.js 18.x+
- Docker & Docker Compose (可选)

### 后端启动

```bash
# 创建虚拟环境
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Linux/Mac

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 启动服务
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 前端启动

```bash
cd frontend
npm install
npm run dev
```

### 桌面应用构建

```bash
# 安装依赖
npm install

# 开发模式
npm run tauri:dev

# 生产构建
npm run tauri:build
```

> Windows平台需先安装 Visual Studio Build Tools 并选择"使用C++的桌面开发"工作负载。

### 访问地址

| 服务 | 地址 |
|------|------|
| 前端应用 | http://localhost:5173 |
| 后端API | http://localhost:8000 |
| API文档 | http://localhost:8000/docs |
| API文档(ReDoc) | http://localhost:8000/redoc |

## 项目结构

```
HeartMirror/
├── backend/                    # 后端服务
│   ├── app/
│   │   ├── agents/             # AI Agent模块
│   │   │   ├── emotion_agent/  # 情绪识别Agent
│   │   │   ├── questionnaire_agent/  # 问卷Agent
│   │   │   ├── risk_agent/     # 风险评估Agent
│   │   │   ├── intervention_agent/   # 干预方案Agent
│   │   │   └── orchestrator.py # Agent协调器
│   │   ├── api/                # API路由 (8个模块)
│   │   ├── core/               # 核心基础设施
│   │   ├── models/             # 数据库模型
│   │   ├── services/           # 业务服务层
│   │   ├── schemas/            # Pydantic模型
│   │   └── utils/              # 工具函数
│   ├── tests/                  # 测试目录
│   └── requirements.txt
│
├── frontend/                   # 前端应用
│   ├── src/
│   │   ├── components/         # UI组件
│   │   ├── pages/              # 页面组件 (7个页面)
│   │   ├── stores/             # Zustand状态管理
│   │   └── services/           # API服务
│   └── package.json
│
├── src-tauri/                  # Tauri桌面应用
│   ├── src/main.rs             # Rust入口
│   ├── Cargo.toml              # Rust配置
│   ├── tauri.conf.json         # Tauri配置
│   └── icons/                  # 应用图标
│
├── knowledge_base/             # 知识库构建
├── docs/                       # 项目文档
├── docker-compose.yml          # Docker编排
└── package.json                # 根项目配置
```

## 核心依赖

```txt
# LangChain
langchain>=0.3.0
langchain-community>=0.3.0
langchain-core>=0.3.0

# 向量数据库
chromadb>=0.4.22

# 模型
transformers>=4.36.0
torch>=2.1.0
sentence-transformers>=2.2.0

# 后端框架
fastapi>=0.109.0
uvicorn[standard]>=0.27.0

# 测试
pytest>=7.4.0
```

## 部署

### Render云平台

项目已部署至Render云平台：

- 地址: https://heartmirror-backend-free.onrender.com
- 健康检查: https://heartmirror-backend-free.onrender.com/health

部署配置文件: `render.yaml`

### 关键优化

- 延迟加载: 所有重型依赖(langchain, torch, transformers)延迟加载
- 快速启动: 启动时不初始化任何服务，按需初始化
- 数据库连接池: 异步SQLAlchemy引擎

## 测试

```bash
cd backend

# 运行所有测试
pytest

# 运行带覆盖率
pytest --cov=app tests/

# 运行特定测试
pytest tests/test_api/test_auth.py -v
```

## 免责声明

**HeartMirror是一款心理健康自助管理工具，不提供医疗诊断服务，不能替代专业心理咨询或治疗。**

如果您正处于危机状态，请立即联系专业机构：

| 热线 | 电话 | 服务时间 |
|------|------|----------|
| 全国心理援助热线 | 400-161-9995 | 24小时 |
| 北京心理危机研究与干预中心 | 010-82951332 | 24小时 |
| 上海心理援助热线 | 021-34289888 | 24小时 |
| 紧急求助 | 120 / 110 | 24小时 |

## 许可证

[MIT License](LICENSE)

## 贡献

1. Fork本仓库
2. 创建特性分支 (`git checkout -b feature/FeatureName`)
3. 提交更改 (`git commit -m 'Add FeatureName'`)
4. 推送到分支 (`git push origin feature/FeatureName`)
5. 提交Pull Request

## 联系方式

- 项目主页: https://github.com/RAINBOWrainy/HeartMirror
- 问题反馈: https://github.com/RAINBOWrainy/HeartMirror/issues