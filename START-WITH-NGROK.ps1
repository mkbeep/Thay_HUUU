# Script khởi động toàn bộ hệ thống với ngrok (public backend + admin-web)
# Chạy: .\START-WITH-NGROK.ps1

Write-Host "🚀 KHỞI ĐỘNG HỆ THỐNG VỚI NGROK" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
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

# Khởi động backend
Write-Host "🔧 Khởi động Backend (port 3000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; Write-Host '🔧 BACKEND SERVER' -ForegroundColor Green; npm run dev"
Start-Sleep -Seconds 5

# Khởi động admin-web
Write-Host "🌐 Khởi động Admin Web (port 5173)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\admin-web'; Write-Host '🌐 ADMIN WEB' -ForegroundColor Blue; npm run dev"
Start-Sleep -Seconds 5

# Khởi động ngrok cho backend
Write-Host "🌍 Khởi động ngrok cho Backend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '🌍 NGROK - BACKEND (port 3000)' -ForegroundColor Magenta; ngrok http 3000 --domain=unfrothed-sharri-releasible.ngrok-free.dev"
Start-Sleep -Seconds 3

# Khởi động ngrok cho admin-web
Write-Host "🌍 Khởi động ngrok cho Admin Web..." -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  LƯU Ý QUAN TRỌNG:" -ForegroundColor Yellow
Write-Host "   Bạn cần tạo thêm 1 domain ngrok miễn phí cho admin-web" -ForegroundColor White
Write-Host "   1. Truy cập: https://dashboard.ngrok.com/cloud-edge/domains" -ForegroundColor White
Write-Host "   2. Tạo domain mới (ví dụ: admin-your-name.ngrok-free.dev)" -ForegroundColor White
Write-Host "   3. Sao chép domain và dán vào lệnh dưới đây" -ForegroundColor White
Write-Host ""

$adminDomain = Read-Host "Nhập domain ngrok cho admin-web (hoặc Enter để bỏ qua)"

if ($adminDomain) {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '🌍 NGROK - ADMIN WEB (port 5173)' -ForegroundColor Magenta; ngrok http 5173 --domain=$adminDomain"
    
    Write-Host ""
    Write-Host "✅ Đã khởi động ngrok cho admin-web: https://$adminDomain" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 CẬP NHẬT CẤU HÌNH:" -ForegroundColor Yellow
    Write-Host "   Mở file admin-web\.env và cập nhật:" -ForegroundColor White
    Write-Host "   VITE_API_URL=https://unfrothed-sharri-releasible.ngrok-free.dev/api/v1" -ForegroundColor Cyan
    Write-Host "   VITE_SOCKET_URL=https://unfrothed-sharri-releasible.ngrok-free.dev" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   Sau đó khởi động lại admin-web để áp dụng thay đổi" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "⚠️  Bỏ qua ngrok cho admin-web" -ForegroundColor Yellow
    Write-Host "   Admin-web sẽ chỉ chạy local: http://localhost:5173" -ForegroundColor White
    Write-Host "   WebSocket real-time có thể không hoạt động đầy đủ" -ForegroundColor White
}

Write-Host ""
Write-Host "✅ HỆ THỐNG ĐÃ KHỞI ĐỘNG!" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Thông tin truy cập:" -ForegroundColor Cyan
Write-Host "   🔧 Backend Local:  http://localhost:3000" -ForegroundColor White
Write-Host "   🌍 Backend Public: https://unfrothed-sharri-releasible.ngrok-free.dev" -ForegroundColor White
Write-Host "   🌐 Admin Web:      http://localhost:5173" -ForegroundColor White
if ($adminDomain) {
    Write-Host "   🌍 Admin Public:   https://$adminDomain" -ForegroundColor White
}
Write-Host ""
Write-Host "🔑 Tài khoản đăng nhập:" -ForegroundColor Cyan
Write-Host "   Email:    admin@restaurant.com" -ForegroundColor White
Write-Host "   Password: Admin@123456" -ForegroundColor White
Write-Host ""
Write-Host "📱 Để khách hàng quét QR:" -ForegroundColor Cyan
Write-Host "   1. Mở backend\qr-codes\index.html" -ForegroundColor White
Write-Host "   2. In QR codes cho các bàn" -ForegroundColor White
Write-Host "   3. Khách quét QR sẽ mở: https://unfrothed-sharri-releasible.ngrok-free.dev/table/..." -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Lưu ý:" -ForegroundColor Yellow
Write-Host "   • Ngrok miễn phí chỉ cho 1 domain cố định" -ForegroundColor White
Write-Host "   • Nếu cần 2 domain (backend + admin), cần nâng cấp hoặc dùng 2 tài khoản" -ForegroundColor White
Write-Host "   • Hoặc chỉ public backend, admin-web dùng local" -ForegroundColor White
Write-Host ""
Write-Host "🛑 Để dừng tất cả, đóng các cửa sổ PowerShell" -ForegroundColor Red
Write-Host ""
