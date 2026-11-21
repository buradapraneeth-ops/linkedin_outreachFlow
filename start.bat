@echo off
echo ========================================================
echo Starting LinkedIn Outreach Platform Full-Stack Environment
echo ========================================================
echo.
echo [1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "OutreachFlow Backend API (Port 8000)" cmd /k "python -m uvicorn server.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Starting Vite Frontend on http://localhost:3000 ...
start "OutreachFlow Frontend UI (Port 3000)" cmd /k "npm run dev"

echo.
echo Both servers started!
echo - Frontend UI: http://localhost:3000
echo - Backend API: http://127.0.0.1:8000/docs
echo ========================================================
