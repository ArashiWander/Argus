#!/bin/bash

# Argus Platform - Health Check Script

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Argus Platform Health Check${NC}\n"

# Check backend
echo -ne "Backend Service: "
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo -e "${GREEN}✅ Running${NC}"
    echo -e "${BLUE}Health Details:${NC}"
    curl -s http://localhost:3001/api/health | jq . 2>/dev/null || curl -s http://localhost:3001/api/health
    echo ""
else
    echo -e "${RED}❌ Not responding${NC}"
fi

# Check frontend
echo -ne "Frontend Service: "
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Running${NC}"
else
    echo -e "${YELLOW}⚠️  Not accessible (may still be starting)${NC}"
fi

echo -e "\n${BLUE}📍 Access Points:${NC}"
echo -e "   Frontend:  http://localhost:3000"
echo -e "   Backend:   http://localhost:3001"
echo -e "   API Docs:  docs/api-documentation.yaml"
