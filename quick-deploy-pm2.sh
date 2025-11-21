#!/bin/bash

# Quick Deploy Script - PM2 Method
# Usage: ./quick-deploy-pm2.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🚀 Discord PDF - Quick Deploy (PM2)${NC}"
echo "========================================"
echo ""

# Get configuration
read -p "Enter frontend port [8080]: " FRONTEND_PORT
FRONTEND_PORT=${FRONTEND_PORT:-8080}

read -p "Enter backend port [3001]: " BACKEND_PORT
BACKEND_PORT=${BACKEND_PORT:-3001}

read -p "Enter your VPS IP or domain: " DOMAIN

echo ""
echo -e "${YELLOW}Configuration:${NC}"
echo "Frontend: http://$DOMAIN:$FRONTEND_PORT"
echo "Backend:  http://$DOMAIN:$BACKEND_PORT"
echo ""
read -p "Continue? [y/N] " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ first"
    exit 1
fi

# Install PM2
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

# Build backend
echo "Building backend..."
cd backend
npm install
npm run build

# Start backend
echo "Starting backend on port $BACKEND_PORT..."
PORT=$BACKEND_PORT pm2 start dist/server.js --name discord-pdf-backend

cd ..

# Build frontend
echo "Building frontend..."
cd frontend
npm install
npm run build

cd ..

# Install serve
if ! command -v serve &> /dev/null; then
    echo "Installing serve..."
    npm install -g serve
fi

# Start frontend
echo "Starting frontend on port $FRONTEND_PORT..."
pm2 start "serve -s frontend/dist -l $FRONTEND_PORT" --name discord-pdf-frontend

# Save PM2 config
pm2 save

echo ""
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo ""
echo "Access your app:"
echo "  Frontend: http://$DOMAIN:$FRONTEND_PORT"
echo "  Backend:  http://$DOMAIN:$BACKEND_PORT/health"
echo ""
echo "PM2 Commands:"
echo "  pm2 status       - Check status"
echo "  pm2 logs         - View logs"
echo "  pm2 restart all  - Restart"
echo "  pm2 stop all     - Stop"
echo ""
echo -e "${YELLOW}⚠️  Next steps:${NC}"
echo "1. Configure firewall:"
echo "   sudo ufw allow $FRONTEND_PORT/tcp"
echo "   sudo ufw allow $BACKEND_PORT/tcp"
echo ""
echo "2. Update Discord Activity URL Mapping:"
echo "   /.proxy -> http://$DOMAIN:$FRONTEND_PORT"
echo ""
echo "3. Setup auto-start on boot:"
echo "   pm2 startup"
