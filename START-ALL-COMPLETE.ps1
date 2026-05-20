# Complete startup script: Backend + App + Admin-web + Ngrok
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Restaurant System (Complete)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Check ngrok
if (-not (Get-Command ngrok -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: ngrok not installed!" -ForegroundColor Red
    Write-Host "Download: https://ngrok.com/download" -ForegroundColor Yellow
    exit 1
}

# Stop all existing processes
Write-Host "`n[1/5] Stopping old processes..." -ForegroundColor Yellow
$ports = @(3000, 5173, 8081, 4040)
foreach ($port in $ports) {
    $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($conn) {
        $pid = $conn.OwningProcess
        Write-Host "  Stopping port $port (PID: $pid)" -ForegroundColor Gray
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
}
Stop-Process -Name ngrok -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

# Start Backend
Write-Host "`n[2/5] Starting Backend (port 3000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; Write-Host 'BACKEND SERVER' -ForegroundColor Cyan; npm run dev"
Start-Sleep -Seconds 5

# Start Expo App
Write-Host "`n[3/5] Starting Expo App (port 8081)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\App'; Write-Host 'EXPO APP (Customer Web)' -ForegroundColor Cyan; npm run start"
Start-Sleep -Seconds 3

# Start Admin Web
Write-Host "`n[4/5] Starting Admin Web (port 5173)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\admin-web'; Write-Host 'ADMIN WEB' -ForegroundColor Cyan; npm run dev"
Start-Sleep -Seconds 3

# Wait for Expo to be ready
Write-Host "`n[5/5] Waiting for Expo to start (25 seconds)..." -ForegroundColor Yellow
Write-Host "  This is necessary before starting ngrok..." -ForegroundColor Gray
Start-Sleep -Seconds 25

# Start ngrok
Write-Host "`nStarting ngrok..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; Write-Host 'NGROK TUNNEL' -ForegroundColor Cyan; .\setup-ngrok.ps1"

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "ALL SERVICES STARTING!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Write-Host "`nIMPORTANT NEXT STEPS:" -ForegroundColor Magenta
Write-Host "1. Wait for ngrok terminal to show NEW URL" -ForegroundColor Yellow
Write-Host "2. Go to EXPO APP terminal and press Ctrl+C" -ForegroundColor Yellow
Write-Host "3. In that terminal, run: npm run start" -ForegroundColor Yellow
Write-Host "4. Go to ADMIN WEB terminal and press Ctrl+C" -ForegroundColor Yellow
Write-Host "5. In that terminal, run: npm run dev" -ForegroundColor Yellow
Write-Host "6. Use the NEW ngrok URL to test" -ForegroundColor Yellow

Write-Host "`nLocal URLs (for laptop testing):" -ForegroundColor Cyan
Write-Host "  Backend API: http://localhost:3000/api/v1/health" -ForegroundColor Gray
Write-Host "  Expo App: http://localhost:8081" -ForegroundColor Gray
Write-Host "  Admin Web: http://localhost:5173" -ForegroundColor Gray
Write-Host "  Ngrok Dashboard: http://localhost:4040" -ForegroundColor Gray

Write-Host "`nAfter ngrok shows URL, test on mobile:" -ForegroundColor Cyan
Write-Host "  https://NEW-URL.ngrok-free.dev/table/1?ngrok-skip-browser-warning=true" -ForegroundColor Gray
