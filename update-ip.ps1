# Script tự động cập nhật IP WiFi trong tất cả file cấu hình
# Chạy: .\update-ip.ps1

Write-Host "🔍 Đang lấy địa chỉ IP WiFi hiện tại..." -ForegroundColor Cyan

# Lấy IP WiFi (adapter có tên chứa "Wi-Fi" hoặc "Wireless")
$wifiAdapter = Get-NetAdapter | Where-Object { $_.Status -eq "Up" -and ($_.Name -like "*Wi-Fi*" -or $_.InterfaceDescription -like "*Wireless*") } | Select-Object -First 1

if ($wifiAdapter) {
    $ipAddress = (Get-NetIPAddress -InterfaceIndex $wifiAdapter.ifIndex -AddressFamily IPv4).IPAddress
    Write-Host "✅ Tìm thấy IP WiFi: $ipAddress" -ForegroundColor Green
} else {
    # Fallback: lấy IP của adapter đang active
    $ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like "192.168.*" -and $_.PrefixOrigin -eq "Dhcp" } | Select-Object -First 1).IPAddress
    
    if ($ipAddress) {
        Write-Host "✅ Tìm thấy IP: $ipAddress" -ForegroundColor Green
    } else {
        Write-Host "❌ Không tìm thấy địa chỉ IP. Vui lòng kiểm tra kết nối mạng." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "📝 Đang cập nhật các file cấu hình..." -ForegroundColor Cyan

# Danh sách các file cần cập nhật
$files = @(
    "App\.env",
    "admin-web\.env",
    "backend\.env",
    "App\package.json",
    "backend\src\server.ts",
    "backend\qr-codes\README.md",
    "backend\qr-codes\index.html"
)

$oldIpPattern = "192\.168\.\d+\.\d+"

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "  📄 Đang cập nhật $file..." -ForegroundColor Yellow
        
        $content = Get-Content $file -Raw
        $newContent = $content -replace $oldIpPattern, $ipAddress
        
        Set-Content -Path $file -Value $newContent -NoNewline
        
        Write-Host "  ✅ Đã cập nhật $file" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Không tìm thấy $file" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🎉 Hoàn tất! Địa chỉ IP đã được cập nhật thành: $ipAddress" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Các bước tiếp theo:" -ForegroundColor Cyan
Write-Host "  1. Khởi động lại backend: cd backend && npm run dev" -ForegroundColor White
Write-Host "  2. Khởi động lại admin-web: cd admin-web && npm run dev" -ForegroundColor White
Write-Host "  3. Khởi động lại app: cd App && npm start" -ForegroundColor White
Write-Host "  4. Tạo lại QR codes: cd backend && npm run generate-qr" -ForegroundColor White
Write-Host ""
