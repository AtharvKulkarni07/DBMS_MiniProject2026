@echo off
title Disease Surveillance FastAPI Backend
echo =====================================================================
echo  DISEASE SURVEILLANCE SYSTEM - BACKEND REST API
echo  FastAPI Swagger UI Docs: http://127.0.0.1:8000/docs
echo =====================================================================
cd /d "%~dp0backend"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause
