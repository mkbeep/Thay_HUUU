# Complete startup script with ngrok
Write-Host "Starting Restaurant System with ngrok..." -ForegroundColor Cyan

# Check if ngrok is installed
if (-not (Get-Command ngrok -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: ngrok is not installed!" -ForegroundColor Red
    Write-Host "Download from: https://ngrok.com/download" -ForegroundColor Yellow
    exit 1
}

# Kill existing processes
Write-Host "`nStopping existing processes..." -ForegroundColor Yellow

$ports = @(3000, 8081, 4040)
foreach ($port in $ports) {
    $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($conn) {
        $pid = $conn.OwningProcess
        Write-Host "  Stopping process on port $port (PID: $pid)" -ForegroundColor Gray
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
}

Stop-Process -Name ngrok -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

Write-Host "`nStarting services..." -ForegroundColor Cyan

# Start Backend
Write-Host "1. Starting Backend (port 3000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; npm run dev"
Start-Sleep -Seconds 5

# Start Expo App
Write-Host "2. Starting Expo App (port 8081)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\App'; npm run start"

Write-Host "`nWaiting for Expo to start (30 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Start ngrok
Write-Host "3. Starting ngrok..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; .\setup-ngrok.ps1"

Write-Host "`n=== IMPORTANT ===" -ForegroundColor Magenta
Write-Host "After ngrok starts:" -ForegroundColor Yellow
Write-Host "1. Check the ngrok terminal for the new URL" -ForegroundColor White
Write-Host "2. Restart the App terminal (Ctrl+C then 'npm run start')" -ForegroundColor White
Write-Host "3. Use the NEW ngrok URL to test on mobile" -ForegroundColor White
Write-Host "`nngrok web interface: http://localhost:4040" -ForegroundColor Cyan
