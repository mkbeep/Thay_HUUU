# ============================================
# SCRIPT KHỞI ĐỘNG TẤT CẢ (LOCAL - KHÔNG NGROK)
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  KHỞI ĐỘNG HỆ THỐNG LOCAL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Kiểm tra Node.js
Write-Host "Kiểm tra Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if (-not $nodeVersion) {
    Write-Host "❌ Node.js chưa được cài đặt!" -ForegroundColor Red
    Write-Host "Vui lòng tải Node.js tại: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
Write-Host ""

# Cấu hình Environment Variables
Write-Host "Cấu hình environment variables..." -ForegroundColor Yellow

# Backend .env
$backendEnv = @"
NODE_ENV=development
PORT=3000
BACKEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:5173,http://localhost:8081
CUSTOMER_WEB_BASE_URL=http://localhost:8081
"@

# Admin-web .env
$adminEnv = @"
VITE_API_URL=http://localhost:3000
"@

# App .env
$appEnv = @"
VITE_API_URL=http://localhost:3000
VITE_PUBLIC_WEB_URL=http://localhost:8081
"@

# Cập nhật CORS trong backend/.env (giữ nguyên các biến khác)
$backendEnvPath = "backend\.env"
if (Test-Path $backendEnvPath) {
    $content = Get-Content $backendEnvPath -Raw
    $content = $content -replace 'CORS_ORIGIN=.*', 'CORS_ORIGIN=http://localhost:5173,http://localhost:8081'
    $content = $content -replace 'CUSTOMER_WEB_BASE_URL=.*', 'CUSTOMER_WEB_BASE_URL=http://localhost:8081'
    $content = $content -replace 'BACKEND_URL=.*', 'BACKEND_URL=http://localhost:3000'
    Set-Content -Path $backendEnvPath -Value $content
    Write-Host "✅ Đã cập nhật backend/.env" -ForegroundColor Green
}

# Cập nhật admin-web/.env
$adminEnvPath = "admin-web\.env"
Set-Content -Path $adminEnvPath -Value $adminEnv
Write-Host "✅ Đã cập nhật admin-web/.env" -ForegroundColor Green

# Cập nhật App/.env
$appEnvPath = "App\.env"
Set-Content -Path $appEnvPath -Value $appEnv
Write-Host "✅ Đã cập nhật App/.env" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  KHỞI ĐỘNG CÁC SERVICES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Khởi động Backend
Write-Host "🚀 Khởi động Backend (port 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; Write-Host '=== BACKEND ===' -ForegroundColor Green; npm run dev"
Start-Sleep -Seconds 3

# Khởi động Admin-web
Write-Host "🚀 Khởi động Admin-web (port 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\admin-web'; Write-Host '=== ADMIN WEB ===' -ForegroundColor Cyan; npm run dev"
Start-Sleep -Seconds 3

# Khởi động App
Write-Host "🚀 Khởi động App (port 8081)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\App'; Write-Host '=== CUSTOMER APP ===' -ForegroundColor Magenta; npm run dev"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ TẤT CẢ SERVICES ĐÃ KHỞI ĐỘNG!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📍 TRUY CẬP:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Backend API:    http://localhost:3000" -ForegroundColor White
Write-Host "  Admin Web:      http://localhost:5173" -ForegroundColor Cyan
Write-Host "  Customer App:   http://localhost:8081" -ForegroundColor Magenta
Write-Host ""
Write-Host "🔐 ĐĂNG NHẬP ADMIN:" -ForegroundColor Yellow
Write-Host "  Email:    admin@restaurant.com" -ForegroundColor White
Write-Host "  Password: Admin@123456" -ForegroundColor White
Write-Host ""
Write-Host "📱 TEST CUSTOMER APP:" -ForegroundColor Yellow
Write-Host "  Bàn 1: http://localhost:8081?tableId=1" -ForegroundColor White
Write-Host "  Bàn 2: http://localhost:8081?tableId=2" -ForegroundColor White
Write-Host "  Bàn 3: http://localhost:8081?tableId=3" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  LƯU Ý:" -ForegroundColor Yellow
Write-Host "  - Chế độ LOCAL: Chỉ hoạt động trên máy này" -ForegroundColor White
Write-Host "  - Để deploy lên internet: Xem HUONG-DAN-DEPLOY.md" -ForegroundColor White
Write-Host "  - Để dừng: Đóng các cửa sổ PowerShell" -ForegroundColor White
Write-Host ""
Write-Host "Nhấn Enter để thoát script này (services vẫn chạy)..."
Read-Host
