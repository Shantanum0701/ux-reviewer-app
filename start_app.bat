@echo off
echo ====================================
echo UX Reviewer - Smart Start
echo ====================================

:: Kill existing node processes to prevent zombie servers
taskkill /F /IM node.exe >nul 2>&1

:: Check Server
if not exist "server\node_modules" (
    echo [Server] Installing dependencies...
    cd server && call npm install && cd ..
)

:: Check Client
if not exist "client\node_modules" (
    echo [Client] Installing dependencies...
    cd client && call npm install && cd ..
)

echo.
echo Starting Application...
start "UX Server" cmd /k "cd server && npm start"
start "UX Client" cmd /k "cd client && npm run dev"

echo App is launching!
echo Frontend: http://localhost:5173
echo Backend: http://localhost:3000
echo.
pause
