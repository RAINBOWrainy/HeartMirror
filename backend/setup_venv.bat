@echo off
REM ============================================================
REM HeartMirror Virtual Environment Setup Script (Windows)
REM ============================================================

echo ========================================
echo HeartMirror 虚拟环境配置脚本
echo ========================================

REM 检查Python版本
python --version 2>nul
if errorlevel 1 (
    echo [ERROR] Python 未安装，请先安装 Python 3.10+
    pause
    exit /b 1
)

REM 创建虚拟环境
if not exist ".venv" (
    echo [INFO] 正在创建虚拟环境...
    python -m venv .venv
    echo [OK] 虚拟环境创建成功
) else (
    echo [INFO] 虚拟环境已存在
)

REM 激活虚拟环境
echo [INFO] 正在激活虚拟环境...
call .venv\Scripts\activate.bat

REM 升级pip
echo [INFO] 正在升级 pip...
python -m pip install --upgrade pip -q

REM 安装依赖
echo [INFO] 正在安装依赖...
pip install -r requirements.txt

REM 运行环境检查
echo [INFO] 正在检查环境...
python scripts\check_environment.py

echo ========================================
echo 环境配置完成！
echo.
echo 使用方法:
echo   1. 激活虚拟环境: .venv\Scripts\activate.bat
echo   2. 启动服务: uvicorn app.main:app --reload
echo   3. 退出虚拟环境: deactivate
echo ========================================
pause