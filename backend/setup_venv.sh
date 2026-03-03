#!/bin/bash
# ============================================================
# HeartMirror Virtual Environment Setup Script (Linux/Mac)
# ============================================================

echo "========================================"
echo "HeartMirror 虚拟环境配置脚本"
echo "========================================"

# 检查Python版本
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python 未安装，请先安装 Python 3.10+"
    exit 1
fi

python3 --version

# 创建虚拟环境
if [ ! -d ".venv" ]; then
    echo "[INFO] 正在创建虚拟环境..."
    python3 -m venv .venv
    echo "[OK] 虚拟环境创建成功"
else
    echo "[INFO] 虚拟环境已存在"
fi

# 激活虚拟环境
echo "[INFO] 正在激活虚拟环境..."
source .venv/bin/activate

# 升级pip
echo "[INFO] 正在升级 pip..."
pip install --upgrade pip -q

# 安装依赖
echo "[INFO] 正在安装依赖..."
pip install -r requirements.txt

# 运行环境检查
echo "[INFO] 正在检查环境..."
python scripts/check_environment.py

echo "========================================"
echo "环境配置完成！"
echo ""
echo "使用方法:"
echo "  1. 激活虚拟环境: source .venv/bin/activate"
echo "  2. 启动服务: uvicorn app.main:app --reload"
echo "  3. 退出虚拟环境: deactivate"
echo "========================================"