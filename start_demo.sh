#!/bin/bash
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "==> Voice AI Transcript Evaluator — Demo Mode"
echo "    No API keys required."
echo ""

# ── Backend ──────────────────────────────────────────────────────────────────
echo "==> Setting up Python backend..."
cd "$ROOT/backend"

if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi
source .venv/bin/activate
pip install -q -r requirements.txt

echo "==> Seeding demo data..."
python seed_demo.py

echo "==> Starting backend on http://localhost:8000 ..."
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

# ── Frontend ──────────────────────────────────────────────────────────────────
echo "==> Setting up frontend..."
cd "$ROOT/frontend"

if [ ! -d "node_modules" ]; then
  echo "    Installing npm packages (first run — takes ~1 min)..."
  npm install --silent
fi

echo "==> Starting frontend on http://localhost:5173 ..."
npm run dev &
FRONTEND_PID=$!

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo "  ┌─────────────────────────────────────────────┐"
echo "  │  App   →  http://localhost:5173              │"
echo "  │  API   →  http://localhost:8000/docs         │"
echo "  └─────────────────────────────────────────────┘"
echo ""
echo "  Press Ctrl+C to stop."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait $BACKEND_PID $FRONTEND_PID
