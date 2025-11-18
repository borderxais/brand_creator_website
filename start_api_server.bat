@echo off
cd /d "%~dp0backend\app"
python -m uvicorn main.main:app --reload --host 0.0.0.0 --port 5000
