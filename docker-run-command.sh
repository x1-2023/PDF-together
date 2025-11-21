#!/bin/bash

# Generate Docker Run Commands
# Config qua -e flags, không cần .env files

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🐳 Discord PDF - Generate Docker Run Commands${NC}"
echo "=================================================="
echo ""

# Prompt for configuration
echo -e "${YELLOW}Configuration:${NC}"
echo ""

read -p "Discord Client ID: " DISCORD_CLIENT_ID
if [ -z "$DISCORD_CLIENT_ID" ]; then
    echo -e "${RED}❌ Required${NC}"
    exit 1
fi

read -p "Discord Client Secret: " DISCORD_CLIENT_SECRET
if [ -z "$DISCORD_CLIENT_SECRET" ]; then
    echo -e "${RED}❌ Required${NC}"
    exit 1
fi

echo ""
read -p "Frontend Port [8080]: " FRONTEND_PORT
FRONTEND_PORT=${FRONTEND_PORT:-8080}

read -p "Backend Port [3001]: " BACKEND_PORT
BACKEND_PORT=${BACKEND_PORT:-3001}

read -p "Your VPS IP/Domain: " DOMAIN
if [ -z "$DOMAIN" ]; then
    echo -e "${RED}❌ Required${NC}"
    exit 1
fi

read -p "Max Upload Size (MB) [50]: " MAX_SIZE_MB
MAX_SIZE_MB=${MAX_SIZE_MB:-50}
MAX_FILE_SIZE=$((MAX_SIZE_MB * 1024 * 1024))

# Summary
echo ""
echo -e "${YELLOW}Configuration:${NC}"
echo "  Frontend: http://$DOMAIN:$FRONTEND_PORT"
echo "  Backend:  http://$DOMAIN:$BACKEND_PORT"
echo "  Max Upload: ${MAX_SIZE_MB}MB"
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not installed${NC}"
    exit 1
fi

# Create network
echo -e "${BLUE}Creating Docker network...${NC}"
docker network create discord-pdf-network 2>/dev/null || echo "Network already exists"

# Create directories
mkdir -p ./uploads
mkdir -p ./data

# Stop old containers
echo ""
echo -e "${BLUE}Stopping old containers...${NC}"
docker stop discord-pdf-backend 2>/dev/null || true
docker rm discord-pdf-backend 2>/dev/null || true
docker stop discord-pdf-frontend 2>/dev/null || true
docker rm discord-pdf-frontend 2>/dev/null || true

# Build backend image
echo ""
echo -e "${BLUE}Building backend image...${NC}"
docker build -t discord-pdf-backend ./backend

# Build frontend image with args
echo ""
echo -e "${BLUE}Building frontend image...${NC}"
docker build \
  --build-arg VITE_DISCORD_CLIENT_ID="$DISCORD_CLIENT_ID" \
  --build-arg VITE_BACKEND_URL="http://$DOMAIN:$BACKEND_PORT" \
  --build-arg VITE_BACKEND_WS_URL="ws://$DOMAIN:$BACKEND_PORT" \
  -t discord-pdf-frontend \
  ./frontend

# Generate and run backend command
echo ""
echo -e "${GREEN}Starting Backend Container...${NC}"

BACKEND_CMD="docker run -d \\
  --restart=unless-stopped \\
  --name discord-pdf-backend \\
  --network discord-pdf-network \\
  -e \"PORT=3001\" \\
  -e \"NODE_ENV=production\" \\
  -e \"UPLOADS_DIR=/app/uploads\" \\
  -e \"DB_PATH=/app/data/discord-pdf.db\" \\
  -e \"DISCORD_CLIENT_ID=$DISCORD_CLIENT_ID\" \\
  -e \"DISCORD_CLIENT_SECRET=$DISCORD_CLIENT_SECRET\" \\
  -e \"CORS_ORIGIN=http://$DOMAIN:$FRONTEND_PORT\" \\
  -e \"MAX_FILE_SIZE=$MAX_FILE_SIZE\" \\
  -p $BACKEND_PORT:3001 \\
  -v $(pwd)/uploads:/app/uploads \\
  -v $(pwd)/data:/app/data \\
  discord-pdf-backend"

# Run backend
eval $BACKEND_CMD
echo "✓ Backend started"

# Generate and run frontend command
echo ""
echo -e "${GREEN}Starting Frontend Container...${NC}"

FRONTEND_CMD="docker run -d \\
  --restart=unless-stopped \\
  --name discord-pdf-frontend \\
  --network discord-pdf-network \\
  -p $FRONTEND_PORT:80 \\
  discord-pdf-frontend"

# Run frontend
eval $FRONTEND_CMD
echo "✓ Frontend started"

# Output commands for reference
echo ""
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Access:"
echo "  Frontend: http://$DOMAIN:$FRONTEND_PORT"
echo "  Backend:  http://$DOMAIN:$BACKEND_PORT/health"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Save commands to file
cat > docker-commands.txt <<EOF
# Discord PDF - Docker Run Commands
# Generated: $(date)

# Backend Container
$BACKEND_CMD

# Frontend Container
$FRONTEND_CMD

# Useful Commands:
docker ps                              # Check status
docker logs discord-pdf-backend -f     # Backend logs
docker logs discord-pdf-frontend -f    # Frontend logs
docker stop discord-pdf-backend        # Stop backend
docker stop discord-pdf-frontend       # Stop frontend
docker restart discord-pdf-backend     # Restart backend
docker restart discord-pdf-frontend    # Restart frontend
docker rm discord-pdf-backend          # Remove backend
docker rm discord-pdf-frontend         # Remove frontend

# Update upload limit:
docker stop discord-pdf-backend
docker rm discord-pdf-backend
docker run -d \\
  --restart=unless-stopped \\
  --name discord-pdf-backend \\
  --network discord-pdf-network \\
  -e "PORT=3001" \\
  -e "NODE_ENV=production" \\
  -e "UPLOADS_DIR=/app/uploads" \\
  -e "DISCORD_CLIENT_ID=$DISCORD_CLIENT_ID" \\
  -e "DISCORD_CLIENT_SECRET=$DISCORD_CLIENT_SECRET" \\
  -e "CORS_ORIGIN=http://$DOMAIN:$FRONTEND_PORT" \\
  -e "MAX_FILE_SIZE=104857600" \\
  -p $BACKEND_PORT:3001 \\
  -v $(pwd)/uploads:/app/uploads \\
  discord-pdf-backend
EOF

echo "Commands saved to: docker-commands.txt"
echo ""
echo -e "${YELLOW}Docker Commands:${NC}"
echo "  docker ps                              - Check status"
echo "  docker logs discord-pdf-backend -f     - View backend logs"
echo "  docker logs discord-pdf-frontend -f    - View frontend logs"
echo "  docker restart discord-pdf-backend     - Restart backend"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Configure firewall:"
echo "   sudo ufw allow $FRONTEND_PORT/tcp"
echo "   sudo ufw allow $BACKEND_PORT/tcp"
echo ""
echo "2. Discord URL Mapping:"
echo "   /.proxy -> http://$DOMAIN:$FRONTEND_PORT"
echo ""
echo "3. Test:"
echo "   curl http://$DOMAIN:$BACKEND_PORT/health"
echo ""
echo "Upload Limit: ${MAX_SIZE_MB}MB"
echo "To change: Edit MAX_FILE_SIZE in docker-commands.txt and re-run backend command"
