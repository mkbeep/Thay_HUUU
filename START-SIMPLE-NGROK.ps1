# Script khởi động đơn giản: Backend + Admin-web local, chỉ backend dùng ngrok
# Admin-web sẽ kết nối tới backend qua ngrok để nhận real-time updates
# Chạy: .\START-SIMPLE-NGROK.ps1

Write-Host "🚀 KHỞI ĐỘNG HỆ THỐNG (Backend Public + Admin Local)" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

# Kiểm tra ngrok
Write-Host "🔍 Kiểm tra ngrok..." -ForegroundColor Yellow
$ngrokPath = Get-Command ngrok -ErrorAction SilentlyContinue
if (-not $ngrokPath) {
    Write-Host "❌ Không tìm thấy ngrok!" -ForegroundColor Red
    Write-Host "📥 Vui lòng cài đặt ngrok:" -ForegroundColor Yellow
    Write-Host "   1. Tải về: https://ngrok.com/download" -ForegroundColor White
    Write-Host "   2. Giải nén và thêm vào PATH" -ForegroundColor White
    Write-Host "   3. Đăng ký tài khoản miễn phí tại: https://dashboard.ngrok.com/signup" -ForegroundColor White
    Write-Host "   4. Chạy: ngrok config add-authtoken YOUR_TOKEN" -ForegroundColor White
    exit 1
}
Write-Host "✅ Tìm thấy ngrok" -ForegroundColor Green
Write-Host ""

# Kiểm tra node_modules
Write-Host "📦 Kiểm tra dependencies..." -ForegroundColor Yellow

$needInstall = $false

if (-not (Test-Path "backend\node_modules")) {
    Write-Host "⚠️  Backend chưa cài đặt dependencies" -ForegroundColor Yellow
    $needInstall = $true
}

if (-not (Test-Path "admin-web\node_modules")) {
    Write-Host "⚠️  Admin-web chưa cài đặt dependencies" -ForegroundColor Yellow
    $needInstall = $true
}

if ($needInstall) {
    Write-Host ""
    Write-Host "📥 Đang cài đặt dependencies..." -ForegroundColor Cyan
    
    if (-not (Test-Path "backend\node_modules")) {
        Write-Host "  📦 Cài đặt backend..." -ForegroundColor Yellow
        Set-Location backend
        npm install
        Set-Location ..
    }
    
    if (-not (Test-Path "admin-web\node_modules")) {
        Write-Host "  📦 Cài đặt admin-web..." -ForegroundColor Yellow
        Set-Location admin-web
        npm install
        Set-Location ..
    }
    
    Write-Host "✅ Đã cài đặt xong dependencies" -ForegroundColor Green
}
Write-Host ""

# Cập nhật file .env của admin-web để kết nối tới backend ngrok
Write-Host "📝 Cập nhật cấu hình admin-web..." -ForegroundColor Cyan
$adminEnvPath = "admin-web\.env"
$backendNgrokUrl = "https://unfrothed-sharri-releasible.ngrok-free.dev"

$adminEnvContent = @"
VITE_API_URL=$backendNgrokUrl/api/v1
VITE_CUSTOMER_WEB_URL=$backendNgrokUrl
VITE_SOCKET_URL=$backendNgrokUrl
"@

Set-Content -Path $adminEnvPath -Value $adminEnvContent -NoNewline
Write-Host "✅ Đã cập nhật admin-web\.env" -ForegroundColor Green
Write-Host ""

# Khởi động backend
Write-Host "🔧 Khởi động Backend (port 3000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; Write-Host '🔧 BACKEND SERVER' -ForegroundColor Green; npm run dev"
Start-Sleep -Seconds 5

# Khởi động ngrok cho backend
Write-Host "🌍 Khởi động ngrok cho Backend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '🌍 NGROK - BACKEND (port 3000)' -ForegroundColor Magenta; ngrok http 3000 --domain=unfrothed-sharri-releasible.ngrok-free.dev"
Start-Sleep -Seconds 5

# Khởi động admin-web
Write-Host "🌐 Khởi động Admin Web (port 5173)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\admin-web'; Write-Host '🌐 ADMIN WEB' -ForegroundColor Blue; npm run dev"
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "✅ HỆ THỐNG ĐÃ KHỞI ĐỘNG!" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Thông tin truy cập:" -ForegroundColor Cyan
Write-Host "   🔧 Backend Local:  http://localhost:3000" -ForegroundColor White
Write-Host "   🌍 Backend Public: $backendNgrokUrl" -ForegroundColor White
Write-Host "   🌐 Admin Web:      http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "🔑 Tài khoản đăng nhập Admin:" -ForegroundColor Cyan
Write-Host "   Email:    admin@restaurant.com" -ForegroundColor White
Write-Host "   Password: Admin@123456" -ForegroundColor White
Write-Host ""
Write-Host "✅ GIẢI PHÁP CHO VẤN ĐỀ REAL-TIME:" -ForegroundColor Green
Write-Host "   • Admin-web chạy local (http://localhost:5173)" -ForegroundColor White
Write-Host "   • Nhưng kết nối tới backend qua ngrok ($backendNgrokUrl)" -ForegroundColor White
Write-Host "   • WebSocket sẽ hoạt động qua ngrok URL" -ForegroundColor White
Write-Host "   • Khi khách quét QR → backend nhận order → admin-web cập nhật ngay!" -ForegroundColor White
Write-Host ""
Write-Host "📱 Để khách hàng quét QR:" -ForegroundColor Cyan
Write-Host "   1. Mở backend\qr-codes\index.html trong trình duyệt" -ForegroundColor White
Write-Host "   2. In QR codes cho các bàn" -ForegroundColor White
Write-Host "   3. Khách quét QR sẽ mở: $backendNgrokUrl/table/..." -ForegroundColor White
Write-Host ""
Write-Host "🔄 Luồng hoạt động:" -ForegroundColor Cyan
Write-Host "   1. Khách quét QR → Mở web app (ngrok URL)" -ForegroundColor White
Write-Host "   2. Khách đặt món → Gửi tới backend (ngrok)" -ForegroundColor White
Write-Host "   3. Backend nhận order → Phát WebSocket event" -ForegroundColor White
Write-Host "   4. Admin-web (local) nhận WebSocket → Cập nhật UI ngay lập tức!" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Lưu ý:" -ForegroundColor Yellow
Write-Host "   • Admin-web vẫn chạy local nhưng kết nối backend qua ngrok" -ForegroundColor White
Write-Host "   • Không cần public admin-web, chỉ cần backend public" -ForegroundColor White
Write-Host "   • WebSocket sẽ hoạt động bình thường qua ngrok" -ForegroundColor White
Write-Host ""
Write-Host "🛑 Để dừng tất cả, đóng các cửa sổ PowerShell" -ForegroundColor Red
Write-Host ""
