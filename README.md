# HeartMirror (心镜)

> 闭环循证AI心理健康自助管理系统 - 企业级Java本地部署版

[![Java](https://img.shields.io/badge/Java-17+-orange.svg)](https://adoptium.net/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2+-green.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📖 目录

- [项目简介](#项目简介)
- [功能特点](#功能特点)
- [环境要求](#环境要求)
- [快速开始](#快速开始)
- [详细安装步骤](#详细安装步骤)
- [配置AI API](#配置ai-api)
- [功能模块说明](#功能模块说明)
- [常见问题](#常见问题)
- [免责声明](#免责声明)

---

## 项目简介

**HeartMirror（心镜）** 是一款面向18-28岁学生与年轻职场人群的AI心理健康自助管理系统。

### 核心特点

- 🔒 **本地部署** - 所有数据存储在您的电脑上，隐私安全可控
- 🤖 **自定义AI** - 支持接入您自己的AI API（OpenAI、智谱AI、DeepSeek等）
- 📊 **专业评估** - 内置PHQ-9、GAD-7、DASS-21等专业心理量表
- 💡 **个性化干预** - 基于情绪状态推荐CBT、正念等干预方案
- 🆘 **危机支持** - 提供全国心理援助热线和接地练习

---

## 功能特点

| 功能模块 | 说明 |
|----------|------|
| AI对话 | 与AI助手进行情绪倾诉，获得温暖回应 |
| 情绪日记 | 记录每日心情，自动分析情绪趋势 |
| 心理评估 | PHQ-9抑郁症筛查、GAD-7焦虑症筛查、DASS-21综合评估 |
| 干预方案 | 深呼吸、正念冥想、CBT认知重构等8种干预练习 |
| 数据看板 | 可视化情绪趋势、活动统计、风险等级 |
| 危机支持 | 全国心理援助热线、接地练习、安全计划 |

---

## 环境要求

### 必需软件

| 软件 | 版本要求 | 下载地址 |
|------|----------|----------|
| Java JDK | 17 或更高版本 | [ Adoptium 下载](https://adoptium.net/) |
| Node.js | 18.x 或更高版本 | [Node.js 下载](https://nodejs.org/) |

### 检查您的环境

打开命令行（CMD或PowerShell），输入以下命令检查：

```bash
# 检查Java版本（需要17+）
java -version

# 检查Node.js版本（需要18+）
node -v
```

**如果Java版本低于17，请继续阅读下面的安装步骤。**

---

## 快速开始

### Windows用户（推荐）

1. 双击运行 `start.bat`
2. 首次运行会自动安装依赖并启动
3. 浏览器自动打开 http://localhost:3002

### Mac/Linux用户

```bash
chmod +x start.sh
./start.sh
```

---

## 详细安装步骤

### 第一步：安装Java JDK 17+

#### Windows安装步骤

1. **下载JDK 17**
   - 访问 https://adoptium.net/
   - 选择 "LTS" 版本，选择 "17" 或 "21"
   - 选择您的操作系统（Windows）
   - 点击下载 .msi 安装包

2. **安装JDK**
   - 双击下载的 .msi 文件
   - 按照安装向导完成安装
   - 建议安装到默认路径

3. **设置环境变量（重要！）**

   **方法一：自动设置（推荐）**
   - 安装时勾选 "Set JAVA_HOME variable"
   - 安装程序会自动设置

   **方法二：手动设置**
   - 按 `Win + R`，输入 `sysdm.cpl`，回车
   - 点击"高级" → "环境变量"
   - 在"系统变量"中点击"新建"：
     - 变量名：`JAVA_HOME`
     - 变量值：`C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot`（根据实际安装路径）
   - 找到系统变量中的 `Path`，点击"编辑"，添加：
     - `%JAVA_HOME%\bin`
   - 点击"确定"保存

4. **验证安装**

   打开**新的**命令行窗口，输入：
   ```bash
   java -version
   ```

   应该显示类似：
   ```
   openjdk version "17.0.x" ...
   ```

#### Mac安装步骤

```bash
# 使用Homebrew安装
brew install openjdk@17

# 设置环境变量
echo 'export PATH="/usr/local/opt/openjdk@17/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### 第二步：安装Node.js

1. 访问 https://nodejs.org/
2. 下载 LTS（长期支持）版本
3. 运行安装程序，使用默认设置
4. 验证安装：
   ```bash
   node -v
   npm -v
   ```

### 第三步：启动项目

#### 方法一：一键启动（推荐）

双击 `start.bat`（Windows）或运行 `./start.sh`（Mac/Linux）

脚本会自动：
- 检查环境
- 构建后端
- 安装前端依赖
- 启动服务
- 打开浏览器

#### 方法二：手动启动

**启动后端：**
```bash
cd backend-java

# 首次运行需要构建
mvnw.cmd clean package -DskipTests   # Windows
./mvnw clean package -DskipTests      # Mac/Linux

# 启动服务
java -jar target/heartmirror-backend-1.0.0.jar
```

**启动前端：**
```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 第四步：访问应用

- 前端地址：http://localhost:3002
- 后端API：http://localhost:8080
- API文档：http://localhost:8080/swagger-ui.html

---

## 配置AI API

### 首次使用配置

1. 打开应用后，点击左侧导航栏的 **"设置"**
2. 填写您的AI API配置：

| 字段 | 说明 | 示例 |
|------|------|------|
| API Key | 您的API密钥 | `sk-xxxxx` |
| Base URL | API地址 | `https://api.openai.com/v1` |
| Model | 模型名称 | `gpt-3.5-turbo` |

3. 点击 **"测试连接"** 验证配置
4. 点击 **"保存设置"** 完成配置

### 支持的AI提供商

| 提供商 | Base URL | 获取API Key |
|--------|----------|-------------|
| OpenAI | `https://api.openai.com/v1` | [平台地址](https://platform.openai.com/) |
| 智谱AI | `https://open.bigmodel.cn/api/paas/v4` | [平台地址](https://open.bigmodel.cn/) |
| DeepSeek | `https://api.deepseek.com/v1` | [平台地址](https://platform.deepseek.com/) |
| 通义千问 | `https://dashscope.aliyuncs.com/api/v1` | [平台地址](https://dashscope.console.aliyun.com/) |
| OpenRouter | `https://openrouter.ai/api/v1` | [平台地址](https://openrouter.ai/) |
| 本地模型 | `http://localhost:11434/v1` | Ollama本地部署 |

### 推荐模型

| 用途 | 推荐模型 | 说明 |
|------|----------|------|
| 日常使用 | gpt-3.5-turbo | 性价比高 |
| 更好效果 | gpt-4 | 效果更好但更贵 |
| 国内用户 | glm-4, deepseek-chat | 国内可直接访问 |
| 免费试用 | OpenRouter免费模型 | 每日有限额 |

---

## 功能模块说明

### AI对话

- 与AI助手进行情绪对话
- 自动识别情绪类型和强度
- 高风险情绪自动提示危机资源

### 情绪日记

- 记录每日心情和感受
- AI自动分析情绪
- 查看历史日记和情绪趋势

### 心理评估

提供三种专业量表：

**PHQ-9 抑郁症筛查量表**
- 9个问题，评估抑郁症状
- 分数范围：0-27
- 建议：定期自测，关注变化

**GAD-7 焦虑症筛查量表**
- 7个问题，评估焦虑症状
- 分数范围：0-21
- 建议：焦虑时自测

**DASS-21 综合评估量表**
- 21个问题，评估抑郁、焦虑、压力
- 提供三个维度的分数

### 干预方案

系统提供8种循证干预方案：

| 类型 | 说明 | 时长 |
|------|------|------|
| 深呼吸放松 | 快速缓解紧张焦虑 | 5分钟 |
| 正念冥想 | 培养情绪觉察力 | 15分钟 |
| CBT认知重构 | 改变消极思维模式 | 20分钟 |
| 渐进式肌肉放松 | 释放身体紧张 | 20分钟 |
| 感恩日记 | 培养积极情绪 | 10分钟 |
| 身体锻炼 | 释放压力改善情绪 | 30分钟 |
| 社交连接 | 获得情感支持 | 15分钟 |
| 情绪书写 | 理解和处理情绪 | 20分钟 |

### 数据看板

- 活动概览：对话次数、日记数量、干预完成
- 情绪趋势图：查看情绪变化趋势
- 情绪分布：了解主要情绪类型
- 风险等级：最新评估的风险状态

### 危机支持

提供即时帮助资源：
- 全国心理援助热线：400-161-9995
- 各地区热线（北京、上海、广州等11个城市）
- 接地练习：5-4-3-2-1感官接地法等
- 安全计划制定指导

---

## 常见问题

### 1. 启动失败：JAVA_HOME not found

**原因**：Java未正确安装或环境变量未设置

**解决方法**：
1. 确认已安装Java 17+
2. 设置JAVA_HOME环境变量（见详细安装步骤）
3. 重新打开命令行窗口

### 2. 后端启动失败：端口8080被占用

**原因**：其他程序占用了8080端口

**解决方法**：
```bash
# 查看占用端口的程序
netstat -ano | findstr :8080

# 结束占用进程（替换PID为实际进程ID）
taskkill /PID <进程ID> /F
```

### 3. 前端无法连接后端

**原因**：后端未启动或端口不对

**解决方法**：
1. 确认后端已启动并显示 "Started HeartMirrorApplication"
2. 检查 http://localhost:8080/health 是否返回 "OK"

### 4. AI对话无响应

**原因**：AI API未配置或配置错误

**解决方法**：
1. 进入"设置"页面检查API配置
2. 点击"测试连接"验证配置
3. 确认API Key正确且有余额

### 5. 数据库错误

**原因**：数据库文件损坏

**解决方法**：
1. 关闭应用
2. 删除 `data/heartmirror.db` 文件
3. 重新启动应用（会自动创建新数据库）

### 6. 首次启动很慢

**原因**：首次运行需要下载依赖

**解决方法**：
- 正常现象，耐心等待
- Maven下载依赖可能需要5-10分钟
- npm安装依赖可能需要2-3分钟

---

## 项目结构

```
HeartMirror/
├── backend-java/          # Java后端
│   ├── src/main/java/com/heartmirror/
│   │   ├── config/        # 配置类
│   │   ├── controller/    # API控制器
│   │   ├── service/       # 业务逻辑
│   │   ├── entity/        # 数据实体
│   │   ├── repository/    # 数据访问
│   │   ├── dto/           # 数据传输对象
│   │   └── security/      # 安全组件
│   └── pom.xml            # Maven配置
│
├── frontend/              # React前端
│   ├── src/
│   │   ├── components/    # UI组件
│   │   ├── pages/         # 页面
│   │   ├── services/      # API服务
│   │   └── stores/        # 状态管理
│   └── package.json       # npm配置
│
├── data/                  # 数据库目录
│   └── heartmirror.db     # SQLite数据库
│
├── start.bat              # Windows启动脚本
├── start.sh               # Mac/Linux启动脚本
└── README.md              # 本文件
```

---

## 免责声明

**⚠️ 重要提示**

HeartMirror是一款**心理健康自助管理工具**，不提供医疗诊断服务，**不能替代专业心理咨询或治疗**。

如果您正处于危机状态，请立即联系专业机构：

| 热线名称 | 电话 | 服务时间 |
|----------|------|----------|
| 全国心理援助热线 | **400-161-9995** | 24小时 |
| 北京心理危机干预中心 | 010-82951332 | 24小时 |
| 上海心理援助热线 | 021-34289888 | 24小时 |
| 紧急求助 | **120 / 110** | 24小时 |

---

## 许可证

[MIT License](LICENSE)

---

## 技术支持

如遇问题，请检查：
1. Java版本是否为17+
2. Node.js版本是否为18+
3. AI API配置是否正确
4. 查看 `logs/` 目录下的日志文件

---

**祝您使用愉快！如有心理健康问题，请及时寻求专业帮助。** 💙