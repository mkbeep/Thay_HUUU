# Simple startup - Backend + Admin (localhost only)
Write-Host "Starting Backend + Admin Web (localhost)" -ForegroundColor Cyan

# Stop old processes
$ports = @(3000, 5173)
foreach ($port in $ports) {
    $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($conn) {
        Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}
Start-Sleep -Seconds 2

# Start Backend
Write-Host "Starting Backend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; npm run dev"
Start-Sleep -Seconds 3

# Start Admin Web
Write-Host "Starting Admin Web..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\admin-web'; npm run dev"

Write-Host "`nDONE! Admin web will open at:" -ForegroundColor Green
Write-Host "http://localhost:5173" -ForegroundColor Cyan
Write-Host "`nLogin:" -ForegroundColor Yellow
Write-Host "Email: admin@restaurant.com" -ForegroundColor Gray
Write-Host "Password: Admin@123456" -ForegroundColor Gray
