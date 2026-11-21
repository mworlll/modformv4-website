#!/bin/bash
cd "$(dirname "$0")"
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    cp ".env.example" ".env"
fi
echo "========================================================"
echo "  MODFORM 汽车用品与车居美学独立站 · 服务启动器"
echo "========================================================"

if command -v python3 >/dev/null 2>&1; then
    echo "🚀 正在使用 Python 3 + SQLite 启动 MODFORM 服务端..."
    (sleep 1 && open "http://localhost:${PORT:-8000}/index.html" 2>/dev/null || xdg-open "http://localhost:${PORT:-8000}/index.html" 2>/dev/null) &
    python3 server.py
else
    echo "❌ 未检测到 Python 3，请先安装 Python 3 (https://www.python.org/) 后再启动正式服务。"
    exit 1
fi
