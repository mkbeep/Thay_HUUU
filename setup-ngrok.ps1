# ngrok -> App Expo port 8081. QR only when App is running.
# Backend port 3000 local; Metro proxies /api to :3000
#
# Order:
#   1. cd backend  && npm run dev
#   2. cd App      && npm run start
#   3. npm run setup-ngrok   (from backend) or .\setup-ngrok.ps1 (from repo root)

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

function Test-PortListening($port) {
    return [bool](Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1)
}

function Get-AuthtokenFromGlobalConfig {
    $globalConfig = Join-Path $env:LOCALAPPDATA "ngrok\ngrok.yml"
    if (-not (Test-Path $globalConfig)) { return $null }
    $raw = Get-Content $globalConfig -Raw
    if ($raw -match "(?m)^authtoken:\s*(\S+)") { return $Matches[1].Trim() }
    return $null
}

function Wait-ForAppTunnel($seconds = 50) {
    for ($i = 0; $i -lt $seconds; $i++) {
        try {
            $tunnels = (Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels").tunnels
            $app = $tunnels | Where-Object { "$($_.config.addr)" -match ":8081\b" } | Select-Object -First 1
            if (-not $app) {
                $app = $tunnels | Select-Object -First 1
            }
            if ($app.public_url) { return $app.public_url }
        } catch { }
        Start-Sleep -Seconds 1
    }
    return $null
}

Write-Host "=== ngrok -> App port 8081 (menu QR) ===" -ForegroundColor Cyan

if (-not (Get-Command ngrok -ErrorAction SilentlyContinue)) {
    Write-Host "Install ngrok: https://ngrok.com/download" -ForegroundColor Red
    exit 1
}

if (-not (Test-PortListening 8081)) {
    Write-Host ""
    Write-Host "App is NOT running on port 8081!" -ForegroundColor Red
    Write-Host "  cd App" -ForegroundColor Yellow
    Write-Host "  npm run start" -ForegroundColor Yellow
    Write-Host "Wait for: Web is waiting on http://localhost:8081" -ForegroundColor Yellow
    Write-Host "Then run again: npm run setup-ngrok" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

if (-not (Test-PortListening 3000)) {
    Write-Host "Warning: backend port 3000 not running -> cd backend; npm run dev" -ForegroundColor Yellow
    Write-Host "(App opens but orders/API may fail)" -ForegroundColor Yellow
}

$token = Get-AuthtokenFromGlobalConfig
if (-not $token) {
    Write-Host "Run: ngrok config add-authtoken YOUR_TOKEN" -ForegroundColor Red
    exit 1
}

$tempConfig = Join-Path $env:TEMP "restaurant-ngrok-app.yml"
@"
version: "2"
authtoken: $token
tunnels:
  app:
    addr: 8081
    proto: http
"@ | Set-Content -Path $tempConfig -Encoding ASCII

Stop-Process -Name ngrok -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "Starting ngrok -> localhost:8081 (Expo App)..." -ForegroundColor Cyan
Start-Process -FilePath "ngrok" -ArgumentList "start","app","--config",$tempConfig -WindowStyle Minimized
Start-Sleep -Seconds 4

$appUrlRaw = Wait-ForAppTunnel 55
if (-not $appUrlRaw) {
    Write-Host "Could not get ngrok URL. Check authtoken." -ForegroundColor Red
    exit 1
}

$appUrl = $appUrlRaw.TrimEnd("/")
$apiUrl = "$appUrl/api/v1"

Write-Host ""
Write-Host "App (QR / browser): $appUrl" -ForegroundColor Green
Write-Host "API (via Metro proxy): $apiUrl" -ForegroundColor Green
Write-Host ""

function Update-EnvFile($path, $replacements) {
    if (-not (Test-Path $path)) { return }
    $content = Get-Content $path -Raw
    foreach ($kv in $replacements.GetEnumerator()) {
        $key = [regex]::Escape($kv.Key)
        if ($content -match "(?m)^$key=") {
            $content = $content -replace "(?m)^$key=.*", "$($kv.Key)=$($kv.Value)"
        } else {
            $content += "`n$($kv.Key)=$($kv.Value)"
        }
    }
    Set-Content -Path $path -Value $content.TrimEnd() -NoNewline -Encoding UTF8
    Write-Host "  OK $path" -ForegroundColor Green
}

Update-EnvFile "$root\backend\.env" @{
    "BACKEND_URL" = $appUrl
    "CUSTOMER_WEB_BASE_URL" = $appUrl
    "CUSTOMER_WEB_PROXY" = "false"
}

$corsBase = "http://localhost:5173,http://localhost:8081,http://localhost:19006,$appUrl"
$backendEnv = Get-Content "$root\backend\.env" -Raw
$backendEnv = $backendEnv -replace "(?m)^CORS_ORIGIN=.*", "CORS_ORIGIN=$corsBase"
Set-Content "$root\backend\.env" -Value $backendEnv.TrimEnd() -NoNewline -Encoding UTF8

$ngrokHost = ([uri]$appUrl).Host
Update-EnvFile "$root\App\.env" @{
    "API_URL" = $apiUrl
    "CUSTOMER_WEB_BASE_URL" = $appUrl
    "EXPO_API_PROXY_TARGET" = "http://127.0.0.1:3000"
    "REACT_NATIVE_PACKAGER_HOSTNAME" = $ngrokHost
}

Update-EnvFile "$root\admin-web\.env" @{
    "VITE_API_URL" = $apiUrl
    "VITE_SOCKET_URL" = $appUrl
    "VITE_CUSTOMER_WEB_URL" = $appUrl
}

Write-Host "Generating QR codes..." -ForegroundColor Cyan
Push-Location "$root\backend"
npm run generate-qr 2>&1 | ForEach-Object { Write-Host $_ }
Pop-Location

Write-Host ""
Write-Host "=== DONE ===" -ForegroundColor Green
Write-Host "1. Restart App (Ctrl+C then npm run start) to load new .env" -ForegroundColor Cyan
Write-Host "2. Keep App + backend + ngrok running while guests scan QR" -ForegroundColor Cyan
Write-Host "3. Print QR from: backend\qr-codes\index.html" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test link: $appUrl/table/1?tid=..." -ForegroundColor White
