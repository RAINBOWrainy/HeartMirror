# HeartMirror / 心镜

> English | [中文](#中文)

---

## English Version

### What is HeartMirror?

HeartMirror is a privacy-first AI mental health companion designed for those **2AM moments** when your mind won't settle, no friends are awake, and therapy feels out of reach. Instead of generic comfort, it helps you untangle your thoughts and regain clarity.

**Core Philosophy**: No data collection. No tracking. Your conversations never leave your device (local mode) or stay encrypted end-to-end (cloud mode).

### Features

- **Midnight Mode** — Warm, gentle interface designed for late-night emotional processing
- **Multi-AI Provider Support** — Connect to any OpenAI-compatible AI:
  - Anthropic Claude (Claude 3.5 Sonnet, etc.)
  - OpenAI GPT-4o / GPT-4 / GPT-3.5
  - Local Ollama (fully offline)
  - DeepSeek, Google Gemini, Alibaba Qwen, Baidu Wenxin, ByteDance Doubao
  - Any self-hosted open-source model
- **Crisis Detection** — Automatically detects self-harm/suicide keywords and displays emergency resources
- **End-to-End Encryption** — AES-256-GCM encryption for all conversations
- **Local-First Mode** — Your API key and data never leave your device
- **Cloud Mode** — Hosted service with zero-knowledge architecture
- **PWA Support** — Add to home screen, access offline
- **Import/Export** — Migrate data between local and cloud anytime

### Quick Start (Local Mode)

```bash
# Clone the repository
git clone https://github.com/RAINBOWrainy/HeartMirror.git
cd HeartMirror

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3003](http://localhost:3003)

### Configure AI Provider

**Anthropic Claude:**
1. Select Provider preset: `Anthropic`
2. Enter your Anthropic API Key
3. Confirm model (default: `claude-3-sonnet-20240229`)
4. Start chatting

**OpenAI:**
1. Select Provider preset: `OpenAI`
2. Enter your OpenAI API Key
3. Choose model: `gpt-4o` or `gpt-4-turbo`
4. Start chatting

**Local Ollama (fully offline):**
1. Install [Ollama](https://ollama.com/)
2. Pull a model: `ollama pull llama3`
3. Select Provider preset: `Ollama`
4. Base URL: `http://localhost:11434/v1` (pre-filled)
5. Model: `llama3`
6. Start chatting — data never leaves your machine

**Custom OpenAI-Compatible Provider:**
1. Select Provider preset: `Custom (OpenAI)`
2. Enter API Base URL
3. Enter API Key (optional if self-hosted)
4. Enter model name
5. Start chatting

### Cloud Mode

Cloud mode provides hosted service with end-to-end encryption.

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your:
#   - DATABASE_URL (PostgreSQL)
#   - JWT_PRIVATE_KEY / JWT_PUBLIC_KEY
#   - UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
#   - RESEND_API_KEY

# Start with cloud mode
DEPLOY_MODE=cloud npm run dev
```

### Deploy to Vercel

```bash
# Set environment variables in Vercel Dashboard
DEPLOY_MODE=cloud
DATABASE_URL=<your-postgres-url>
JWT_PRIVATE_KEY=<your-private-key>
JWT_PUBLIC_KEY=<your-public-key>
UPSTASH_REDIS_REST_URL=<your-redis-url>
UPSTASH_REDIS_REST_TOKEN=<your-redis-token>
RESEND_API_KEY=<your-resend-key>
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Deploy
vercel --prod
```

### Desktop App (Tauri)

HeartMirror can be built as a native desktop app with **full offline support**.

```bash
# Install dependencies
npm install

# Run in Tauri dev mode
npm run tauri:dev

# Build production binary
npm run tauri:build
```

Output in `src-tauri/target/release/bundle/`:
- **Windows**: `.msi` installer + `.exe`
- **macOS**: `.app` + `.dmg`
- **Linux**: `.deb` + `.AppImage`

### Architecture

```
src/
├── app/
│   ├── (auth)/           # Authentication pages
│   ├── api/             # API routes
│   ├── assessment/      # PHQ-9 / GAD-7 assessments
│   ├── exercises/       # Mindfulness exercises
│   ├── journal/         # Mood journal
│   ├── settings/       # Settings page
│   ├── tracker/         # Progress tracker
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Main chat page
├── components/
│   ├── assessments/     # PHQ9, GAD7 components
│   ├── navigation/      # Sidebar, FooterNav
│   ├── CrisisSupport.tsx
│   └── MigrationWizard.tsx
├── features/
│   ├── ai/             # AI provider integration
│   ├── auth/           # Authentication (local/cloud)
│   ├── database/        # Database (local/cloud)
│   └── tracker/         # Assessment flow logic
├── contexts/            # React contexts
├── lib/                # Utilities, i18n, crypto
├── prisma/             # Database schema
└── workers/            # Web workers
```

### Security Design

- **Key Derivation**: PBKDF2 with 100,000 iterations from user password
- **Encryption**: AES-256-GCM authenticated encryption
- **Local Mode**: Password-protected + encrypted storage
- **Cloud Mode**: Client-side encryption, server cannot read plaintext

### Privacy Commitment

- **Local Mode**: Your API key and conversations never leave your device
- **Cloud Mode**: Conversations encrypted in-browser before storage
- **No Tracking**: No analytics, no data sales
- **Open Source**: Audit every line of code

### Disclaimer

HeartMirror is a **mental health self-help tool** and **cannot replace professional mental health care or therapy**.

If you are in crisis, please contact:
- **China Mental Health Hotline**: **400-161-9995** (24/7)
- **Beijing Crisis Center**: 010-82951332 (24/7)
- **Emergency**: **120 / 110**

### License

MIT License — See [LICENSE](LICENSE)

---

## 中文

### 什么是心镜？

心镜（HeartMirror）是一款**隐私优先的 AI 心理健康伴侣**，专为凌晨思绪翻涌的时刻设计。当朋友都在睡觉、预约心理咨询还来不及时，心镜陪你梳理情绪，理清思绪。

**核心理念**：不收集数据，不追踪行为。本地模式时对话永不离开设备；云端模式时端到端加密。

### 核心功能

- **深夜对话模式** — 温和风格，帮你从情绪漩涡中走出来
- **多 AI 提供商支持** — 支持所有兼容 OpenAI API 格式的大模型：
  - Anthropic Claude
  - OpenAI GPT-4o / GPT-4 / GPT-3.5
  - 本地 Ollama（完全离线）
  - DeepSeek、Google Gemini、阿里通义千问、百度文心一言、字节豆包
  - 任何自部署的开源模型
- **危机检测** — 自动识别自伤/自杀相关关键词，显示紧急求助资源
- **端到端加密** — AES-256-GCM 加密所有对话
- **本地优先模式** — API Key 和数据永不离开设备
- **云端模式** — 托管服务，零知识架构
- **PWA 支持** — 可添加到手机主屏幕，离线访问
- **导入导出** — 随时在本地和云端之间迁移数据

### 快速开始（本地模式）

```bash
# 克隆项目
git clone https://github.com/RAINBOWrainy/HeartMirror.git
cd HeartMirror

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

打开浏览器访问 [http://localhost:3003](http://localhost:3003)

### 配置 AI 提供商

**Anthropic Claude：**
1. 在设置中选择 Provider 预设：`Anthropic`
2. 输入你的 Anthropic API Key
3. 确认模型名称（默认 `claude-3-sonnet-20240229`）
4. 开始聊天

**OpenAI：**
1. 在设置中选择 Provider 预设：`OpenAI`
2. 输入你的 OpenAI API Key
3. 选择模型：`gpt-4o` 或 `gpt-4-turbo`
4. 开始聊天

**本地 Ollama（完全离线）：**
1. 安装 [Ollama](https://ollama.com/)
2. 拉取模型：`ollama pull llama3`
3. 在设置中选择 Provider 预设：`Ollama`
4. Base URL：`http://localhost:11434/v1`（已预设）
5. 模型：`llama3`
6. 开始聊天 — 完全离线，数据永不离开你的机器

**自定义 OpenAI 兼容提供商：**
1. 在设置中选择 Provider 预设：`Custom (OpenAI)`
2. 填入 API Base URL
3. 输入 API Key（如自部署可留空）
4. 输入模型名称
5. 开始聊天

### 云端模式

云端模式提供托管服务，附带端到端加密。

```bash
# 复制环境变量模板
cp .env.example .env.local

# 编辑 .env.local 填写：
#   - DATABASE_URL (PostgreSQL)
#   - JWT_PRIVATE_KEY / JWT_PUBLIC_KEY
#   - UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
#   - RESEND_API_KEY

# 以云端模式启动
DEPLOY_MODE=cloud npm run dev
```

### 部署到 Vercel

```bash
# 在 Vercel Dashboard 中设置环境变量
DEPLOY_MODE=cloud
DATABASE_URL=<your-postgres-url>
JWT_PRIVATE_KEY=<your-private-key>
JWT_PUBLIC_KEY=<your-public-key>
UPSTASH_REDIS_REST_URL=<your-redis-url>
UPSTASH_REDIS_REST_TOKEN=<your-redis-token>
RESEND_API_KEY=<your-resend-key>
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# 部署
vercel --prod
```

### 桌面应用（Tauri）

心镜可构建为原生桌面应用，**完全离线支持**。

```bash
# 安装依赖
npm install

# Tauri 开发模式运行
npm run tauri:dev

# 构建生产版本
npm run tauri:build
```

输出位置 `src-tauri/target/release/bundle/`：
- **Windows**：`.msi` 安装包 + `.exe`
- **macOS**：`.app` + `.dmg`
- **Linux**：`.deb` + `.AppImage`

### 项目架构

```
src/
├── app/
│   ├── (auth)/           # 认证页面（登录、注册等）
│   ├── api/              # API 路由
│   ├── assessment/      # PHQ-9 / GAD-7 评估
│   ├── exercises/       # 正念练习
│   ├── journal/         # 心情日记
│   ├── settings/       # 设置页面
│   ├── tracker/         # 进度追踪
│   ├── layout.tsx       # 根布局
│   └── page.tsx         # 主聊天页面
├── components/
│   ├── assessments/     # PHQ9、GAD7 评估组件
│   ├── navigation/      # 侧边栏、底部导航
│   ├── CrisisSupport.tsx # 危机支持组件
│   └── MigrationWizard.tsx # 数据迁移向导
├── features/
│   ├── ai/             # AI 提供商集成
│   ├── auth/           # 认证模块（本地/云端）
│   ├── database/        # 数据库模块（本地/云端）
│   └── tracker/         # 评估流程逻辑
├── contexts/            # React Context
├── lib/                # 工具函数、i18n、加密
├── prisma/             # 数据库 Schema
└── workers/            # Web Workers
```

### 安全设计

- **密钥派生**：PBKDF2 + 100,000 次迭代从用户密码得到加密密钥
- **加密算法**：AES-256-GCM 认证加密（保密性 + 完整性）
- **本地模式**：密码保护 + 加密存储
- **云端模式**：客户端加密，服务端无法读取明文

### 隐私承诺

- **本地模式**：API Key 和对话永不离开设备
- **云端模式**：对话在浏览器端加密后才存到服务器
- **不追踪**：不收集分析数据，不售卖数据
- **代码开源**：可审计每一行代码

### 免责声明

心镜是一款**心理健康自助工具**，**不能替代专业心理咨询或治疗**。

如果你正处于危机中，请立即联系：
- **全国心理援助热线**：**400-161-9995**（24 小时）
- **北京心理危机干预中心**：010-82951332（24 小时）
- **紧急求助**：**120 / 110**

### 许可证

MIT License — 详见 [LICENSE](LICENSE)
