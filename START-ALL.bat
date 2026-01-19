@echo off
echo ========================================
echo  FutureIntern - Starting Both Servers
echo ========================================
echo.
echo This will open TWO windows:
echo   1. Backend (Flask) - http://localhost:5000
echo   2. Frontend (Vite) - http://localhost:5173
echo.
echo KEEP BOTH WINDOWS OPEN while using the app!
echo.
pause

echo Starting Backend in new window...
start "FutureIntern Backend" cmd /k "%~dp0start-backend.bat"

timeout /t 3 /nobreak >nul

echo Starting Frontend in new window...
start "FutureIntern Frontend" cmd /k "%~dp0start-frontend.bat"

echo.
echo ========================================
echo  Both servers are starting!
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Open your browser to: http://localhost:5173
echo.
echo To stop the servers, close both windows
echo or press Ctrl+C in each window.
echo.
pause
