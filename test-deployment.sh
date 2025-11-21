#!/bin/bash

# Deployment Test Script
# Tests if Discord PDF is deployed correctly

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🧪 Discord PDF Deployment Test"
echo "==============================="
echo ""

# Get config
read -p "Enter your VPS IP or domain: " HOST
read -p "Enter frontend port [8080]: " FRONTEND_PORT
FRONTEND_PORT=${FRONTEND_PORT:-8080}
read -p "Enter backend port [3001]: " BACKEND_PORT
BACKEND_PORT=${BACKEND_PORT:-3001}

echo ""
echo "Testing deployment at:"
echo "  Frontend: http://$HOST:$FRONTEND_PORT"
echo "  Backend:  http://$HOST:$BACKEND_PORT"
echo ""

PASSED=0
FAILED=0

# Test 1: Backend Health Check
echo -n "1. Backend health check... "
if curl -s -f "http://$HOST:$BACKEND_PORT/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    echo "   Backend is not responding at http://$HOST:$BACKEND_PORT/health"
    ((FAILED++))
fi

# Test 2: Backend CORS
echo -n "2. Backend CORS headers... "
CORS=$(curl -s -I -H "Origin: https://discord.com" "http://$HOST:$BACKEND_PORT/health" | grep -i "access-control-allow-origin" || echo "")
if [ ! -z "$CORS" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ WARNING${NC}"
    echo "   CORS headers not found (may cause issues with Discord)"
fi

# Test 3: Frontend accessible
echo -n "3. Frontend accessible... "
if curl -s -f "http://$HOST:$FRONTEND_PORT" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    echo "   Frontend is not responding at http://$HOST:$FRONTEND_PORT"
    ((FAILED++))
fi

# Test 4: Frontend serves index.html
echo -n "4. Frontend index.html... "
if curl -s "http://$HOST:$FRONTEND_PORT" | grep -q "<!DOCTYPE html>"; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    echo "   Frontend is not serving HTML correctly"
    ((FAILED++))
fi

# Test 5: WebSocket endpoint
echo -n "5. WebSocket endpoint... "
# Try to connect to WebSocket (requires wscat)
if command -v wscat &> /dev/null; then
    timeout 3 wscat -c "ws://$HOST:$BACKEND_PORT/ws?channelId=test&userId=test" > /dev/null 2>&1 && WS_RESULT=0 || WS_RESULT=$?
    if [ $WS_RESULT -eq 124 ] || [ $WS_RESULT -eq 0 ]; then
        # Timeout or success means WebSocket is accepting connections
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}"
        echo "   WebSocket not accepting connections"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⊘ SKIP${NC}"
    echo "   Install wscat to test WebSocket: npm install -g wscat"
fi

# Test 6: Backend can list PDFs
echo -n "6. Backend PDF list endpoint... "
if curl -s -f "http://$HOST:$BACKEND_PORT/api/pdfs" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    echo "   PDF list endpoint not responding"
    ((FAILED++))
fi

# Test 7: Firewall ports
echo -n "7. Firewall configuration... "
if command -v ufw &> /dev/null; then
    UFW_FRONTEND=$(sudo ufw status | grep "$FRONTEND_PORT" || echo "")
    UFW_BACKEND=$(sudo ufw status | grep "$BACKEND_PORT" || echo "")
    if [ ! -z "$UFW_FRONTEND" ] && [ ! -z "$UFW_BACKEND" ]; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠ WARNING${NC}"
        echo "   Ports may not be open in firewall"
        echo "   Run: sudo ufw allow $FRONTEND_PORT/tcp && sudo ufw allow $BACKEND_PORT/tcp"
    fi
else
    echo -e "${YELLOW}⊘ SKIP${NC}"
    echo "   UFW not installed, check firewall manually"
fi

# Test 8: Service status (PM2 or Docker)
echo -n "8. Service status... "
if command -v pm2 &> /dev/null; then
    if pm2 list | grep -q "discord-pdf"; then
        echo -e "${GREEN}✓ PASS (PM2)${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}"
        echo "   PM2 services not running"
        ((FAILED++))
    fi
elif command -v docker-compose &> /dev/null; then
    if docker-compose ps | grep -q "Up"; then
        echo -e "${GREEN}✓ PASS (Docker)${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}"
        echo "   Docker containers not running"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⊘ SKIP${NC}"
    echo "   No process manager detected"
fi

# Summary
echo ""
echo "==============================="
echo "Test Results:"
echo -e "  ${GREEN}Passed: $PASSED${NC}"
if [ $FAILED -gt 0 ]; then
    echo -e "  ${RED}Failed: $FAILED${NC}"
fi
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All critical tests passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Configure Discord Activity URL Mapping:"
    echo "   /.proxy -> http://$HOST:$FRONTEND_PORT"
    echo ""
    echo "2. Test from Discord client"
    echo ""
    echo "3. Upload a test PDF and verify functionality"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "1. Check logs:"
    echo "   pm2 logs (for PM2)"
    echo "   docker-compose logs (for Docker)"
    echo ""
    echo "2. Check if services are running:"
    echo "   pm2 status (for PM2)"
    echo "   docker-compose ps (for Docker)"
    echo ""
    echo "3. Check firewall:"
    echo "   sudo ufw status"
    echo ""
    echo "4. See DEPLOYMENT-GUIDE.md for more help"
    exit 1
fi
