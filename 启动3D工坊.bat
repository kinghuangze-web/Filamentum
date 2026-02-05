@echo off
chcp 65001 >nul
title 3D 创作工坊 - 服务端
echo ==========================================
echo       正在启动 3D 创作工坊...
echo       请勿关闭此窗口，最小化即可
echo ==========================================

:: 切换到项目目录
cd /d "d:\wenjian\3D打印\1\my-3d-app"

:: 打开浏览器（延迟2秒，等待服务启动）
timeout /t 2 >nul
start http://localhost:3000

:: 启动开发服务器
npm run dev

pause
