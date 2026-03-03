# Railway 配置 - 指定 backend 目录为构建根目录
# 此文件告诉 Railway 如何构建项目

# 项目结构：
# HeartMirror/
# ├── backend/     <- Python FastAPI 后端
# │   ├── app/
# │   ├── requirements.txt
# │   ├── railway.json
# │   └── nixpacks.toml
# └── frontend/    <- React 前端（部署在 GitHub Pages）

# Railway 应该从 backend 目录构建 Python 服务
# 请在 Railway Dashboard 中设置 Root Directory = backend