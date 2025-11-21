#!/bin/bash

# Docker Run Script với Environment Variables
# Không cần edit .env files, config tất cả qua command line

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🐳 Discord PDF - Docker Run with Environment Config${NC}"
echo "==========================================================="
echo ""

# Prompt for configuration
echo -e "${YELLOW}Configuration:${NC}"
echo ""

read -p "Discord Client ID: " DISCORD_CLIENT_ID
read -p "Discord Client Secret: " DISCORD_CLIENT_SECRET
echo ""

read -p "Frontend Port [8080]: " FRONTEND_PORT
FRONTEND_PORT=${FRONTEND_PORT:-8080}

read -p "Backend Port [3001]: " BACKEND_PORT
BACKEND_PORT=${BACKEND_PORT:-3001}

read -p "Your VPS IP or Domain: " DOMAIN

read -p "Max PDF Upload Size in MB [50]: " MAX_SIZE_MB
MAX_SIZE_MB=${MAX_SIZE_MB:-50}

# Calculate bytes
MAX_FILE_SIZE=$((MAX_SIZE_MB * 1024 * 1024))

echo ""
echo -e "${YELLOW}Configuration Summary:${NC}"
echo "  Discord Client ID: ${DISCORD_CLIENT_ID:0:20}..."
echo "  Frontend: http://$DOMAIN:$FRONTEND_PORT"
echo "  Backend:  http://$DOMAIN:$BACKEND_PORT"
echo "  Max Upload: ${MAX_SIZE_MB}MB"
echo ""
read -p "Continue? [y/N] " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found. Install Docker first.${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Building Docker images...${NC}"

# Build backend
docker build -t discord-pdf-backend ./backend

# Build frontend with build args
docker build \
  --build-arg VITE_DISCORD_CLIENT_ID=$DISCORD_CLIENT_ID \
  --build-arg VITE_BACKEND_URL=http://$DOMAIN:$BACKEND_PORT \
  --build-arg VITE_BACKEND_WS_URL=ws://$DOMAIN:$BACKEND_PORT \
  -t discord-pdf-frontend ./frontend

echo ""
echo -e "${BLUE}Starting containers...${NC}"

# Create network if not exists
docker network create discord-pdf-network 2>/dev/null || true

# Stop and remove old containers
docker stop discord-pdf-backend 2>/dev/null || true
docker rm discord-pdf-backend 2>/dev/null || true
docker stop discord-pdf-frontend 2>/dev/null || true
docker rm discord-pdf-frontend 2>/dev/null || true

# Run backend
docker run -d \
  --name discord-pdf-backend \
  --network discord-pdf-network \
  --restart unless-stopped \
  -p $BACKEND_PORT:3001 \
  -v $(pwd)/uploads:/app/uploads \
  -e PORT=3001 \
  -e NODE_ENV=production \
  -e UPLOADS_DIR=/app/uploads \
  -e DISCORD_CLIENT_ID=$DISCORD_CLIENT_ID \
  -e DISCORD_CLIENT_SECRET=$DISCORD_CLIENT_SECRET \
  -e CORS_ORIGIN=http://$DOMAIN:$FRONTEND_PORT \
  -e MAX_FILE_SIZE=$MAX_FILE_SIZE \
  discord-pdf-backend

echo "✓ Backend container started"

# Run frontend
docker run -d \
  --name discord-pdf-frontend \
  --network discord-pdf-network \
  --restart unless-stopped \
  -p $FRONTEND_PORT:80 \
  discord-pdf-frontend

echo "✓ Frontend container started"

echo ""
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo ""
echo "Access your app:"
echo "  Frontend: http://$DOMAIN:$FRONTEND_PORT"
echo "  Backend:  http://$DOMAIN:$BACKEND_PORT/health"
echo ""
echo "Docker commands:"
echo "  docker ps                              - Check status"
echo "  docker logs discord-pdf-backend -f     - View backend logs"
echo "  docker logs discord-pdf-frontend -f    - View frontend logs"
echo "  docker stop discord-pdf-backend        - Stop backend"
echo "  docker stop discord-pdf-frontend       - Stop frontend"
echo "  docker restart discord-pdf-backend     - Restart backend"
echo ""
echo -e "${YELLOW}⚠️  Next steps:${NC}"
echo "1. Configure firewall:"
echo "   sudo ufw allow $FRONTEND_PORT/tcp"
echo "   sudo ufw allow $BACKEND_PORT/tcp"
echo ""
echo "2. Update Discord Activity URL Mapping:"
echo "   /.proxy -> http://$DOMAIN:$FRONTEND_PORT"
echo ""
echo "3. Test upload with max ${MAX_SIZE_MB}MB PDFs"
