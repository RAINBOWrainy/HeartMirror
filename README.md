# HeartMirror (心镜)

> AI companion for 2AM spiraling — when no friends are awake and therapy isn't available.

**HeartMirror** 是一款隐私优先的 AI 心理健康伴侣，专门为凌晨 2 点思绪翻涌时刻设计。它不给出泛泛的安慰，而是帮你梳理情绪，理清思绪。

- 💆 **适合深夜情绪崩溃**：温和风格，帮你从情绪漩涡中走出来
- 🔒 **隐私至上**：完全本地模式，数据永不离开你的设备
- 🤖 **多 AI 提供商支持**：支持**所有兼容 OpenAI API 格式的大模型**
  - Anthropic Claude
  - OpenAI GPT-4o / GPT-4 / GPT-3.5
  - 本地 Ollama (完全离线)
  - DeepSeek, 通义千问, 文心一言, 豆包, Gemini
  - 任何自定义部署的开源模型
- 🔐 **端到端加密**：所有对话使用 AES-256-GCM 加密存储
- 📱 **PWA 支持**：可添加到手机主屏幕，离线访问历史对话
- 📤 **导入导出**：随时迁移数据，从云端转到本地或反向

---

## 📖 项目简介

HeartMirror 是一个全栈单仓库 Next.js 14 项目，支持两种部署模式：

| 模式 | 说明 | 适合人群 |
|---|---|---|
| **Local 本地模式** | 完全自给自足，你提供 API Key，所有数据加密存储在本地 | 技术用户，极度注重隐私 |
| **Cloud 云端模式** | 托管服务，开箱即用，数据端到端加密 | 普通用户，零门槛 |

**核心理念**：两种模式共享同一套加密原语，不管选择哪种方式，你的数据都受到同等保护。

---

## 🚀 快速开始（本地模式）

### 环境要求

- Node.js 18+
- npm / yarn / bun

### 安装启动

```bash
# 克隆项目
git clone https://github.com/RAINBOWrainy/HeartMirror.git
cd HeartMirror

# 安装依赖
npm install

# 生成 Prisma 客户端
npx prisma generate

# 启动开发服务器
npm run dev
```

打开浏览器访问 [http://localhost:3003](http://localhost:3003)

### 配置 AI

**使用 Anthropic Claude:**
1. 在设置中选择 Provider 预设: `Anthropic`
2. 输入你的 Anthropic API Key
3. 确认模型名称（默认 `claude-3-sonnet-20240229`）
4. 开始聊天

**使用 OpenAI:**
1. 在设置中选择 Provider 预设: `OpenAI`
2. 输入你的 OpenAI API Key
3. 选择模型: `gpt-4o` 或 `gpt-4-turbo` 或 `gpt-3.5-turbo`
4. 开始聊天

**使用本地 Ollama:**
1. 安装 [Ollama](https://ollama.com/)
2. 拉取模型: `ollama pull llama3`
3. 在设置中选择 Provider 预设: `Ollama`
4. Base URL: `http://localhost:11434/v1`（已预设）
5. 模型: `llama3`
6. 开始聊天 — 完全离线，数据永不离开你的机器

**使用自定义兼容 OpenAI 的提供商:**
1. 在设置中选择 Provider 预设: `Custom (OpenAI)`
2. 填入你的 API Base URL（必须包含 `/v1` 后缀如果需要）
3. 输入你的 API Key（如果不需要可以留空）
4. 输入模型名称
5. 开始聊天

支持: DeepSeek, Google Gemini, 阿里通义千问, 百度文心一言, 字节豆包, 任何本地或云服务的开源模型

### 构建生产版本

```bash
DEPLOY_MODE=local npm run build
```

---

## 🏗️ 架构说明

### 功能模块分离

项目采用**基于功能的模块分离**架构，通过 tsconfig 路径别名在构建时选择部署模式，保证死代码消除：

```
src/
├── app/
│   ├── api/chat/stream/    # 流式聊天 API
│   ├── layout.tsx           # 根布局
│   ├── globals.css          # 全局样式
│   └── page.tsx             # 主聊天页面
├── features/
│   ├── ai/
│   │   ├── shared/          # 共享类型、提示词工程
│   │   ├── local.ts         # 本地模式 AI 配置
│   │   └── cloud.ts         # 云端模式 AI 配置
│   ├── database/
│   │   ├── shared/          # 共享加密原语
│   │   ├── local.ts         # 本地 SQLite 数据库
│   │   └── cloud.ts         # 云端 PostgreSQL 数据库
│   └── auth/
│       ├── shared/
│       ├── local.ts         # 本地密码保护
│       └── cloud.ts         # 云端认证
├── prisma/
│   └── schema.prisma        # 一套 Schema 同时支持 SQLite / PostgreSQL
└── public/
    ├── manifest.json        # PWA 清单
    └── sw.js                # 离线支持 Service Worker
```

**构建时选择模式**: 通过 `DEPLOY_MODE` 环境变量选择导入哪个模块，只有选中模式的代码会被打包到最终产物。

### 加密设计

- 密钥派生：PBKDF2 + 100,000 次迭代从用户密码得到加密密钥
- 加密算法：AES-256-GCM 提供认证加密（保密性+完整性）
- 本地模式：密码保护 + 加密存储，即使别人拿到你的设备也无法读取对话
- 云端模式：每个用户各自的密钥，服务器端也无法读取你的对话内容

---

## ✨ 功能特性

- [x] 深夜对话模式 — 温和风格，验证情绪，梳理思绪
- [x] 危机检测 — 识别自伤/自杀关键词，自动显示紧急求助热线
- [x] 密码锁 — 共享设备上保护你的隐私
- [x] 对话历史 — 加密存储，随时查看
- [x] 单条消息复制 — 快速保存有用的回应
- [x] 全部导出/导入 — JSON 格式，方便迁移和备份
- [x] 清除所有对话 — 一键擦除
- [x] 法律声明 — 明确说明这是自助工具，不能替代专业治疗

---

## 📊 项目结构树

```
HeartMirror/
├── src/
│   ├── app/
│   │   ├── api/chat/stream/
│   │   │   └── route.ts      # 流式聊天 API
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── page.tsx           # 主页面
│   └── features/
│       ├── ai/
│       │   ├── shared/
│       │   │   ├── types.ts
│       │   │   └── prompt-engineering.ts
│       │   ├── local.ts
│       │   └── cloud.ts
│       ├── database/
│       │   ├── shared/
│       │   │   └── encryption.ts
│       │   ├── local.ts
│       │   └── cloud.ts
│       └── auth/
│           ├── shared/
│           ├── local.ts
│           └── cloud.ts
├── prisma/
│   └── schema.prisma
├── public/
│   ├── manifest.json
│   └── sw.js
├── package.json
├── tsconfig.json
├── next.config.mjs
├── tailwind.config.cjs
├── postcss.config.cjs
├── .gitignore
├── CLAUDE.md
└── README.md
```

---

## 🔒 隐私承诺

- **本地模式**: 你的 API Key 和所有对话永远不会离开你的设备
- **云端模式**: 对话内容在你的浏览器端加密后才存储到服务器，服务器无法读取明文
- **没有追踪**: 不收集分析数据，不售卖数据
- **代码开源**: 你可以审计每一行代码，确认没有后门

---

## ⚠️ 免责声明

HeartMirror 是一款**心理健康自助工具**，**不能替代专业心理咨询或治疗**。

如果你正处于危机中，请立即联系专业机构：

| 热线名称 | 电话 | 服务时间 |
|----------|------|----------|
| 全国心理援助热线 | **400-161-9995** | 24 小时 |
| 北京心理危机干预中心 | 010-82951332 | 24 小时 |
| 紧急求助 | **120 / 110** | 24 小时 |

---

## 📄 许可证

MIT License — 详见 [LICENSE](LICENSE)

---

**祝你好心情。** 💙
