@echo off
chcp 65001 >nul
title MODFORM 汽车用品与车居美学独立站服务
cd /d "%~dp0"

if not exist ".env" if exist ".env.example" copy /y ".env.example" ".env" >nul

echo ========================================================
echo   MODFORM 汽车用品与车居美学独立站 · 服务启动器
echo ========================================================

where python >nul 2>nul
if %errorlevel%==0 (
    echo [正在使用 Python 3 + SQLite 启动 MODFORM 服务端...]
    start "" "http://localhost:8000/index.html"
    python server.py
    goto :eof
)

echo [错误] 未检测到 Python 3，请先安装 Python 3 后再启动正式服务。
pause
