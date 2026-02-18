@echo off
echo ==========================================
echo UX Reviewer - One-Click Setup
echo ==========================================

echo [1/2] Installing Server Dependencies...
cd server
if not exist "package.json" (
    echo Error: server/package.json not found!
    exit /b 1
)
call npm install
if %ERRORLEVEL% neq 0 (
    echo Server install failed!
    exit /b %ERRORLEVEL%
)

echo.
echo [2/2] Installing Client Dependencies...
cd ../client
if not exist "package.json" (
    echo Error: client/package.json not found!
    exit /b 1
)
call npm install
if %ERRORLEVEL% neq 0 (
    echo Client install failed!
    exit /b %ERRORLEVEL%
)

echo.
echo ==========================================
echo Setup Complete! run "start_app.bat" now.
echo ==========================================
pause
