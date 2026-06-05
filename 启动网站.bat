@echo off
chcp 65001 >nul
echo ==============================================
echo    求职投递追踪工具 - 启动中
echo ==============================================
echo.
echo 正在启动开发服务器...
echo.
echo 启动成功后，请访问：http://localhost:5173
echo 按 Ctrl+C 可以停止服务器
echo.

cd /d "%~dp0"

where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误：找不到 npm 命令
    echo 请确保 Node.js 已安装并添加到系统 PATH
    pause
    exit /b 1
)

npm run dev

pause
