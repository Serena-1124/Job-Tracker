Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "   求职投递追踪工具 - 启动中" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

$npmPath = Get-Command npm -ErrorAction SilentlyContinue

if ($null -eq $npmPath) {
    Write-Host "错误：找不到 npm 命令" -ForegroundColor Red
    Write-Host "请确保 Node.js 已安装并添加到系统 PATH" -ForegroundColor Yellow
    Read-Host "按 Enter 退出"
    exit 1
}

Write-Host "检测到 npm 路径：" -ForegroundColor Green
Write-Host $npmPath.Source
Write-Host ""

Write-Host "正在启动开发服务器..." -ForegroundColor Cyan
Write-Host "启动成功后，请访问：http://localhost:5173" -ForegroundColor Cyan
Write-Host "按 Ctrl+C 可以停止服务器" -ForegroundColor Yellow
Write-Host ""

npm run dev
