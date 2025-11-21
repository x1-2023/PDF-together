#!/bin/bash

# Quick Deploy Script - Docker Method
# Usage: ./quick-deploy-docker.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🐳 Discord PDF - Quick Deploy (Docker)${NC}"
echo "========================================"
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found${NC}"
    echo "Install Docker first:"
    echo "  curl -fsSL https://get.docker.com -o get-docker.sh"
    echo "  sudo sh get-docker.sh"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose not found${NC}"
    echo "Install Docker Compose first"
    exit 1
fi

# Get configuration
read -p "Enter frontend port [8080]: " FRONTEND_PORT
FRONTEND_PORT=${FRONTEND_PORT:-8080}

read -p "Enter backend port [3001]: " BACKEND_PORT
BACKEND_PORT=${BACKEND_PORT:-3001}

read -p "Enter your VPS IP or domain: " DOMAIN

# Check .env
if [ ! -f "backend/.env" ]; then
    echo -e "${RED}❌ backend/.env not found${NC}"
    echo "Create backend/.env first with Discord credentials"
    exit 1
fi

if [ ! -f "frontend/.env" ]; then
    echo -e "${RED}❌ frontend/.env not found${NC}"
    echo "Create frontend/.env first"
    exit 1
fi

echo ""
echo -e "${YELLOW}Configuration:${NC}"
echo "Frontend: http://$DOMAIN:$FRONTEND_PORT"
echo "Backend:  http://$DOMAIN:$BACKEND_PORT"
echo ""

# Update docker-compose.yml
echo "Updating docker-compose.yml..."
cp docker-compose.yml docker-compose.yml.bak

cat > docker-compose.yml <<EOF
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: discord-pdf-backend
    restart: unless-stopped
    ports:
      - "${BACKEND_PORT}:3001"
    env_file:
      - ./backend/.env
    volumes:
      - ./uploads:/app/uploads
    networks:
      - discord-pdf-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: discord-pdf-frontend
    restart: unless-stopped
    ports:
      - "${FRONTEND_PORT}:80"
    depends_on:
      - backend
    networks:
      - discord-pdf-network

networks:
  discord-pdf-network:
    driver: bridge
EOF

echo "Building Docker images..."
docker-compose build

echo "Starting containers..."
docker-compose up -d

echo ""
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo ""
echo "Access your app:"
echo "  Frontend: http://$DOMAIN:$FRONTEND_PORT"
echo "  Backend:  http://$DOMAIN:$BACKEND_PORT/health"
echo ""
echo "Docker Commands:"
echo "  docker-compose ps          - Check status"
echo "  docker-compose logs -f     - View logs"
echo "  docker-compose restart     - Restart"
echo "  docker-compose down        - Stop"
echo ""
echo -e "${YELLOW}⚠️  Next steps:${NC}"
echo "1. Configure firewall:"
echo "   sudo ufw allow $FRONTEND_PORT/tcp"
echo "   sudo ufw allow $BACKEND_PORT/tcp"
echo ""
echo "2. Update Discord Activity URL Mapping:"
echo "   /.proxy -> http://$DOMAIN:$FRONTEND_PORT"
echo ""
echo "3. Check logs:"
echo "   docker-compose logs -f"
