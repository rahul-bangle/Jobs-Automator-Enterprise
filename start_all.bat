@echo off
echo ------------------------------------------
echo 🚀 STARTING JOBS AUTOMATOR (LOCAL DEV)
echo ------------------------------------------

REM Start Backend
echo [1/2] Launching Backend on http://localhost:8001...
start "Backend (FastAPI)" cmd /k "cd backend && venv_new\Scripts\python.exe -m uvicorn app.main:app --port 8001"

REM Start Frontend
echo [2/2] Launching Frontend on http://localhost:5173...
start "Frontend (Vite)" cmd /k "cd frontend && npm run dev"

echo.
echo ✅ Done. Two terminal windows have been opened.
echo Keep them running while you use the application.
echo ------------------------------------------
pause
