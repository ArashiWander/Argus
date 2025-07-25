#!/bin/bash

# Argus Platform - Enhanced Startup Script

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 Starting Argus Monitoring Platform...${NC}"

# Check if setup was completed
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠️  Environment not configured. Please run ./setup.sh first${NC}"
    exit 1
fi

# Function to cleanup background processes
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down services...${NC}"
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    exit 0
}

trap cleanup EXIT INT TERM

# Start backend
echo -e "${GREEN}🌐 Starting backend service...${NC}"
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
sleep 3
if ! curl -s http://localhost:3001/api/health > /dev/null; then
    echo -e "${YELLOW}⚠️  Backend health check failed, but continuing...${NC}"
fi

# Start frontend
echo -e "${GREEN}🎨 Starting frontend service...${NC}"
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo -e "\n${GREEN}✅ Argus Platform is starting up!${NC}"
echo -e "\n${BLUE}📍 Access Points:${NC}"
echo -e "   Frontend:  http://localhost:3000"
echo -e "   Backend:   http://localhost:3001"
echo -e "   Health:    http://localhost:3001/api/health"
echo -e "\n${BLUE}📚 Quick Commands:${NC}"
echo -e "   Health Check: curl http://localhost:3001/api/health"
echo -e "   Run Demo:     ./demo.sh"
echo -e "   Stop:         Press Ctrl+C"
echo -e "\nPress Ctrl+C to stop all services"

wait
