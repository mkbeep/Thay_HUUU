# Chuyen ve script o thu muc goc du an
$root = Split-Path $PSScriptRoot -Parent
& "$root\setup-ngrok.ps1" @args
exit $LASTEXITCODE
