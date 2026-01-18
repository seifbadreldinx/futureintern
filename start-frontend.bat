@echo off
echo ========================================
echo Starting FutureIntern Frontend Server
echo ========================================
echo.

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: npm is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo.
    echo After installing Node.js:
    echo 1. Close and reopen this window
    echo 2. Run this script again
    echo.
    pause
    exit /b 1
)

cd front

echo Installing dependencies (if needed)...
call npm install
if errorlevel 1 (
    echo.
    echo ERROR: Failed to install dependencies
    echo Please check your internet connection and try again
    pause
    exit /b 1
)

echo.
echo Starting Vite development server
echo The app will open at http://localhost:5173
echo Press Ctrl+C to stop the server
echo.

npm run dev

pause

