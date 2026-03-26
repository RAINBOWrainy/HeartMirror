@echo off
chcp 65001 >nul
echo ========================================
echo   HeartMirror 企业级本地部署启动脚本
echo   AI心理健康自助管理系统
echo ========================================
echo.

:: 检查Java环境
java -version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到Java环境，请安装JDK 17+
    echo 下载地址: https://adoptium.net/
    pause
    exit /b 1
)

:: 检查Node.js环境
node -v >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到Node.js环境，请安装Node.js 18+
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

echo [信息] 环境检查通过
echo.

:: 创建数据目录
if not exist "data" mkdir data

:: 启动后端
echo [步骤1] 启动Java后端 (端口: 8080)...
cd backend-java

:: 检查是否需要安装依赖
if not exist "target\heartmirror-backend-1.0.0.jar" (
    echo [信息] 首次运行，正在构建后端项目...
    call mvnw.cmd clean package -DskipTests
    if errorlevel 1 (
        echo [错误] Maven构建失败
        pause
        exit /b 1
    )
)

:: 后台启动后端
start "HeartMirror Backend" cmd /c "java -jar target\heartmirror-backend-1.0.0.jar"
cd ..

:: 等待后端启动
echo [信息] 等待后端启动...
timeout /t 10 /nobreak >nul

:: 启动前端
echo [步骤2] 启动React前端 (端口: 3002)...
cd frontend

:: 检查是否需要安装依赖
if not exist "node_modules" (
    echo [信息] 首次运行，正在安装前端依赖...
    call npm install
    if errorlevel 1 (
        echo [错误] npm install失败
        pause
        exit /b 1
    )
)

:: 启动前端开发服务器
start "HeartMirror Frontend" cmd /c "npm run dev"
cd ..

echo.
echo ========================================
echo   HeartMirror 启动完成！
echo ========================================
echo.
echo   前端地址: http://localhost:3002
echo   后端API:  http://localhost:8080
echo   API文档:  http://localhost:8080/swagger-ui.html
echo.
echo   首次使用请在"设置"页面配置AI API
echo ========================================
echo.

:: 自动打开浏览器
timeout /t 5 /nobreak >nul
start http://localhost:3002

pause