#!/bin/bash

echo "🚀 启动日本股票监控系统..."
echo "========================================"

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# 检查端口是否被占用
check_port() {
    if lsof -Pi :$1 -s TCP:LISTEN -t >/dev/null 2>&1; then
        echo "⚠️  端口 $1 已被占用，尝试停止现有进程..."
        lsof -Pi :$1 -s TCP:LISTEN -t | xargs kill -9 2>/dev/null
        sleep 2
    fi
}

# 停止现有进程
echo "0. 清理现有进程..."
killall -9 node 2>/dev/null
sleep 2
echo "✅ 清理完成"
echo ""

# 启动后端API服务器
echo "1. 启动后端API服务器 (端口 3001)..."
check_port 3001
node server.js > /tmp/server.log 2>&1 &
SERVER_PID=$!
sleep 3

if ps -p $SERVER_PID > /dev/null; then
    echo "✅ 后端服务器启动成功 (PID: $SERVER_PID)"
    echo "   日志: tail -f /tmp/server.log"
else
    echo "❌ 后端服务器启动失败"
    cat /tmp/server.log
    exit 1
fi

echo ""

# 启动前端静态文件服务器
echo "2. 启动前端服务器 (端口 3000)..."
check_port 3000

# 使用npx serve 或 python http.server 来提供静态文件
if command -v npx &> /dev/null; then
    npx serve -s build -l 3000 > /tmp/frontend.log 2>&1 &
    FRONTEND_CMD="npx serve"
elif command -v python3 &> /dev/null; then
    cd build && python3 -m http.server 3000 > /tmp/frontend.log 2>&1 &
    cd ..
    FRONTEND_CMD="python3 http.server"
else
    echo "❌ 未找到可用的静态文件服务器 (需要 npx 或 python3)"
    exit 1
fi

FRONTEND_PID=$!
sleep 5

if ps -p $FRONTEND_PID > /dev/null; then
    echo "✅ 前端服务器启动成功 (PID: $FRONTEND_PID, 使用 $FRONTEND_CMD)"
    echo "   日志: tail -f /tmp/frontend.log"
else
    echo "❌ 前端服务器启动失败"
    cat /tmp/frontend.log
    exit 1
fi

echo ""
echo "========================================"
echo "🎉 系统启动完成！"
echo ""
echo "📊 访问以下地址查看股票数据："
echo "   http://localhost:3000"
echo ""
echo "🔗 API 端点："
echo "   http://localhost:3001/api/stocks"
echo "   http://localhost:3001/api/stock/7974"
echo "   http://localhost:3001/api/all-stocks"
echo ""
echo "📝 查看日志："
echo "   后端: tail -f /tmp/server.log"
echo "   前端: tail -f /tmp/frontend.log"
echo ""
echo "🛑 停止服务: pkill -9 node"
echo "========================================"

# 保持脚本运行并捕获Ctrl+C
cleanup() {
    echo ""
    echo "🛑 正在停止服务..."
    kill $SERVER_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ 服务已停止"
    exit 0
}

trap cleanup INT TERM

# 保持脚本运行
wait
