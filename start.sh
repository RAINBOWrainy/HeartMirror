#!/bin/bash

echo "========================================"
echo "  HeartMirror 企业级本地部署启动脚本"
echo "  AI心理健康自助管理系统"
echo "========================================"
echo ""

# 检查Java环境
if ! command -v java &> /dev/null; then
    echo "[错误] 未检测到Java环境，请安装JDK 17+"
    echo "下载地址: https://adoptium.net/"
    exit 1
fi

# 检查Node.js环境
if ! command -v node &> /dev/null; then
    echo "[错误] 未检测到Node.js环境，请安装Node.js 18+"
    echo "下载地址: https://nodejs.org/"
    exit 1
fi

echo "[信息] 环境检查通过"
echo ""

# 创建数据目录
mkdir -p data

# 启动后端
echo "[步骤1] 启动Java后端 (端口: 8080)..."
cd backend-java

# 检查是否需要构建
if [ ! -f "target/heartmirror-backend-1.0.0.jar" ]; then
    echo "[信息] 首次运行，正在构建后端项目..."
    ./mvnw clean package -DskipTests
    if [ $? -ne 0 ]; then
        echo "[错误] Maven构建失败"
        exit 1
    fi
fi

# 后台启动后端
java -jar target/heartmirror-backend-1.0.0.jar &
BACKEND_PID=$!
cd ..

# 等待后端启动
echo "[信息] 等待后端启动..."
sleep 10

# 启动前端
echo "[步骤2] 启动React前端 (端口: 3002)..."
cd frontend

# 检查是否需要安装依赖
if [ ! -d "node_modules" ]; then
    echo "[信息] 首次运行，正在安装前端依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "[错误] npm install失败"
        exit 1
    fi
fi

# 启动前端开发服务器
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "========================================"
echo "  HeartMirror 启动完成！"
echo "========================================"
echo ""
echo "  前端地址: http://localhost:3002"
echo "  后端API:  http://localhost:8080"
echo "  API文档:  http://localhost:8080/swagger-ui.html"
echo ""
echo "  首次使用请在"设置"页面配置AI API"
echo "========================================"
echo ""

# 保存PID用于关闭
echo $BACKEND_PID > /tmp/heartmirror-backend.pid
echo $FRONTEND_PID > /tmp/heartmirror-frontend.pid

# 打开浏览器
if command -v open &> /dev/null; then
    open http://localhost:3002
elif command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3002
fi

echo "按Ctrl+C停止服务"

# 等待用户中断
trap "echo '正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM
wait