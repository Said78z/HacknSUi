#!/bin/bash

echo "========================================"
echo " LémanFlow - Starting Demo Environment"
echo "========================================"
echo ""

echo "[1/2] Starting Backend Server..."
cd backend
npm run dev &
BACKEND_PID=$!

sleep 3

cd ../frontend
echo "[2/2] Starting Frontend..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "========================================"
echo " Demo Environment Started!"
echo "========================================"
echo ""
echo "Backend:  http://localhost:4000"
echo "Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
