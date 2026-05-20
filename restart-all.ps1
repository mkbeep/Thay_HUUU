# Script to restart backend and Expo Web
Write-Host "Restarting Backend and Expo Web..." -ForegroundColor Cyan

# Kill existing processes
Write-Host "`nStopping existing processes..." -ForegroundColor Yellow

# Kill node processes on port 3000 (backend)
$backend = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($backend) {
    $backendPid = $backend.OwningProcess
    Write-Host "   Stopping backend (PID: $backendPid)..." -ForegroundColor Gray
    Stop-Process -Id $backendPid -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# Kill node processes on port 8081 (Expo)
$expo = Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue
if ($expo) {
    $expoPid = $expo.OwningProcess
    Write-Host "   Stopping Expo (PID: $expoPid)..." -ForegroundColor Gray
    Stop-Process -Id $expoPid -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

Write-Host "`nOld processes stopped" -ForegroundColor Green

# Start backend in new terminal
Write-Host "`nStarting Backend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; npm run dev"

Start-Sleep -Seconds 3

# Start Expo Web in new terminal
Write-Host "Starting Expo Web..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\App'; npm run web"

Write-Host "`nServices starting..." -ForegroundColor Green
Write-Host "`nCheck the new terminal windows for logs" -ForegroundColor Yellow
Write-Host "`nURLs to test:" -ForegroundColor Cyan
Write-Host "   Backend: http://localhost:3000/api/v1/health" -ForegroundColor Gray
Write-Host "   Expo Web: http://localhost:8081" -ForegroundColor Gray
Write-Host "   Ngrok: https://unfrothed-sharri-releasible.ngrok-free.dev/table/1?ngrok-skip-browser-warning=true" -ForegroundColor Gray

Write-Host "`nWait 10-15 seconds for services to fully start..." -ForegroundColor Yellow
Write-Host "`nTip: Clear browser cache on mobile before testing!" -ForegroundColor Magenta
