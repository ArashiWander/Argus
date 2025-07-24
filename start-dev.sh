#!/bin/bash

# Argus Development Startup Script

set -e

echo "🚀 Starting Argus Monitoring Platform..."

# Check if we're in the right directory
if [ ! -f "final_project_phases.md" ]; then
    echo "❌ Please run this script from the Argus project root directory"
    exit 1
fi

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check dependencies
echo "🔍 Checking dependencies..."

if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm is not installed. Please install npm and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node --version)"
    exit 1
fi

echo "✅ Dependencies check passed"

# Install backend dependencies if needed
echo "📦 Installing backend dependencies..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "✅ Backend dependencies already installed"
fi

# Build backend
echo "🔨 Building backend..."
npm run build

cd ..

# Install frontend dependencies if needed
echo "📦 Installing frontend dependencies..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "✅ Frontend dependencies already installed"
fi

cd ..

# Create .env file for backend if it doesn't exist
if [ ! -f "backend/.env" ]; then
    echo "⚙️ Creating backend .env file..."
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env from .env.example"
fi

# Function to kill background processes on script exit
cleanup() {
    echo "🛑 Shutting down services..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    exit 0
}

# Set up cleanup on script exit
trap cleanup EXIT INT TERM

# Start backend
echo "🌐 Starting backend service..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 3

# Start frontend
echo "🎨 Starting frontend service..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo "✅ Argus Monitoring Platform is starting up!"
echo ""
echo "📍 Services:"
echo "   Backend:  http://localhost:3001"
echo "   Frontend: http://localhost:3000"
echo "   Health:   http://localhost:3001/api/health"
echo ""
echo "📖 API Documentation: docs/api-documentation.yaml"
echo "📋 Project Status: final_project_phases.md"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user to stop
wait