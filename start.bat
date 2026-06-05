@echo off
chcp 65001
echo ==============================================
echo    简历智能匹配工具 - 启动脚本
echo ==============================================
echo.

REM 检查Node.js是否可用
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误：未找到Node.js
    echo 请确保已安装Node.js并添加到系统PATH
    pause
    exit /b 1
)

echo 检测到Node.js版本：
node --version
echo.

REM 检查npm是否可用
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误：未找到npm
    pause
    exit /b 1
)

echo 检测到npm版本：
npm --version
echo.

REM 安装依赖（如果node_modules不存在）
if not exist "node_modules" (
    echo 正在安装依赖...
    npm install
    if %errorlevel% neq 0 (
        echo 安装依赖失败
        pause
        exit /b 1
    )
    echo 依赖安装成功
    echo.
)

REM 启动开发服务器
echo 正在启动开发服务器...
echo 服务器启动后，请访问：http://localhost:5173
echo.
npm run dev

pause
