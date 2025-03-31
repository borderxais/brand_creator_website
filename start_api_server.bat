@echo off
cd src\app\api\advertiser
python -m uvicorn api_endpoints:app --reload --host 0.0.0.0 --port 8000
