# Script để restart Expo với cache cleared
Write-Host "🛑 Stopping all Node/Expo processes..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -like "*node*" -or $_.ProcessName -like "*expo*"} | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "✅ Processes stopped" -ForegroundColor Green
Write-Host ""

Write-Host "🧹 Clearing Expo cache..." -ForegroundColor Yellow
Write-Host ""

Write-Host "🚀 Starting Expo with cleared cache..." -ForegroundColor Cyan
npx expo start --clear

Write-Host ""
Write-Host "✅ Expo started! Now reload your app:" -ForegroundColor Green
Write-Host "   - Android: Press 'r' or shake device → Reload" -ForegroundColor White
Write-Host "   - iOS: Press Cmd+R or shake device → Reload" -ForegroundColor White
Write-Host "   - Web: Refresh browser (F5)" -ForegroundColor White
