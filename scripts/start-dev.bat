@echo off
echo Starting Restaurant Management System...
echo.

REM Start API Gateway
start "API Gateway" cmd /k "cd services\api-gateway && npm run dev"
timeout /t 2 /nobreak >nul

REM Start Auth Service
start "Auth Service" cmd /k "cd services\auth-service && npm run dev"
timeout /t 2 /nobreak >nul

REM Start Menu Service
start "Menu Service" cmd /k "cd services\menu-service && npm run dev"
timeout /t 2 /nobreak >nul

REM Start Order Service
start "Order Service" cmd /k "cd services\order-service && npm run dev"
timeout /t 2 /nobreak >nul

REM Start Table Service
start "Table Service" cmd /k "cd services\table-service && npm run dev"
timeout /t 2 /nobreak >nul

REM Start Frontend Admin
start "Frontend Admin" cmd /k "cd frontend-admin && npm start"
timeout /t 2 /nobreak >nul

REM Start Mobile App
start "Mobile App" cmd /k "cd mobile-app && npm start"

echo.
echo All services started!
echo.
echo Services:
echo - API Gateway: http://localhost:3000
echo - Frontend Admin: http://localhost:3000
echo - Mobile App: Check Expo terminal for QR code
echo.
pause
