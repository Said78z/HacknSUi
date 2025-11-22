#!/bin/bash

echo "========================================"
echo " LémanFlow - Initial Setup"
echo "========================================"
echo ""

echo "[1/3] Installing Backend Dependencies..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Backend installation failed!"
    exit 1
fi

cd ..

echo ""
echo "[2/3] Installing Frontend Dependencies..."
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Frontend installation failed!"
    exit 1
fi

cd ..

echo ""
echo "[3/3] Creating Environment Files..."

if [ ! -f "backend/.env" ]; then
    cp "backend/.env.example" "backend/.env"
    echo "Created backend/.env from .env.example"
else
    echo "backend/.env already exists, skipping..."
fi

echo ""
echo "========================================"
echo " Setup Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "  1. Edit backend/.env with your configuration"
echo "  2. Run: ./start-demo.sh"
echo ""
echo "For full setup with blockchain:"
echo "  See GETTING_STARTED.md"
echo ""
