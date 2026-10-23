#!/bin/bash
# NEXUS Development Launcher
# Starts both the FastAPI backend and Vite frontend

echo "🚀 Starting NEXUS Full-Stack Environment..."

# 1. Start Backend
if [ -d "backend" ]; then
  echo "⚡ Starting FastAPI Backend on http://localhost:8000..."
  python3 -m pip install -q -r backend/requirements.txt 2>/dev/null
  python3 -m uvicorn app.main:app --app-dir backend --reload --port 8000 &
  BACKEND_PID=$!
fi

# 2. Start Frontend
if [ -d "frontend" ]; then
  echo "⚡ Starting Vite Frontend on http://localhost:5173..."
  cd frontend && npm run dev
fi

trap "kill $BACKEND_PID" EXIT
