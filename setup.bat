@echo off
echo ========================================
echo  LémanFlow - Initial Setup
echo ========================================
echo.

echo [1/3] Installing Backend Dependencies...
cd backend
call npm install
if errorlevel 1 (
    echo ERROR: Backend installation failed!
    pause
    exit /b 1
)

cd ..

echo.
echo [2/3] Installing Frontend Dependencies...
cd frontend
call npm install
if errorlevel 1 (
    echo ERROR: Frontend installation failed!
    pause
    exit /b 1
)

cd ..

echo.
echo [3/3] Creating Environment Files...

if not exist "backend\.env" (
    copy "backend\.env.example" "backend\.env"
    echo Created backend/.env from .env.example
) else (
    echo backend/.env already exists, skipping...
)

echo.
echo ========================================
echo  Setup Complete!
echo ========================================
echo.
echo Next steps:
echo   1. Edit backend/.env with your configuration
echo   2. Run: start-demo.bat
echo.
echo For full setup with blockchain:
echo   See GETTING_STARTED.md
echo.
pause
