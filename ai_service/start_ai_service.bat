@echo off
echo ============================================================
echo Starting Bad Teddy AI Microservice (FastAPI on Port 5000)
echo ============================================================
cd /d "%~dp0"
".venv\Scripts\python.exe" -m uvicorn app:app --host 127.0.0.1 --port 5000
pause
