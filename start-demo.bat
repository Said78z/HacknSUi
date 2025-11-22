@echo off
echo ========================================
echo  LémanFlow - Starting Demo Environment
echo ========================================
echo.

echo [1/2] Starting Backend Server...
start "LémanFlow Backend" cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend...
start "LémanFlow Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo  Demo Environment Started!
echo ========================================
echo.
echo Backend:  http://localhost:4000
echo Frontend: http://localhost:5173
echo.
echo Press any key to close this window...
pause >nul
