@echo off
echo ========================================================
echo        Starting ACE Academy Coaching Platform
echo ========================================================

start cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak >nul
start cmd /k "cd frontend && npm run dev"

echo.
echo Backend running at http://localhost:5000
echo Frontend running at http://localhost:5173
echo.
pause

