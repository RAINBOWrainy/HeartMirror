# HeartMirror Frontend

React + TypeScript 前端应用

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 代码检查
npm run lint

# 格式化代码
npm run format
```

## 项目结构

```
src/
├── components/     # UI组件
│   ├── Chat/       # 对话组件
│   ├── EmotionDiary/  # 情绪日记
│   ├── Dashboard/  # 数据看板
│   ├── CrisisSupport/  # 危机支持
│   └── common/     # 公共组件
├── pages/          # 页面组件
├── stores/         # Zustand状态管理
├── services/       # API服务
├── hooks/          # 自定义Hooks
├── utils/          # 工具函数
├── types/          # TypeScript类型定义
├── App.tsx         # 主应用组件
└── main.tsx        # 入口文件
```