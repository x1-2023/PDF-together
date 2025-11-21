#!/bin/bash

# Discord PDF Deployment Script
# For VPS/Homelab with custom ports

set -e

echo "🚀 Discord PDF Deployment Script"
echo "================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKEND_PORT=${BACKEND_PORT:-3001}
FRONTEND_PORT=${FRONTEND_PORT:-8080}
DOMAIN=${DOMAIN:-"localhost"}

echo -e "${YELLOW}Configuration:${NC}"
echo "Backend Port: $BACKEND_PORT"
echo "Frontend Port: $FRONTEND_PORT"
echo "Domain: $DOMAIN"
echo ""

# Check if .env files exist
if [ ! -f "backend/.env" ] || [ ! -f "frontend/.env" ]; then
    echo -e "${RED}❌ Error: .env files not found${NC}"
    echo "Please configure backend/.env and frontend/.env first"
    echo "See SECURITY-SETUP.md for instructions"
    exit 1
fi

# Check if Discord credentials are set
if grep -q "your_discord_client_id_here" backend/.env; then
    echo -e "${RED}❌ Error: Discord credentials not configured${NC}"
    echo "Please update backend/.env with real Discord Client ID and Secret"
    exit 1
fi

echo -e "${GREEN}✓ Configuration files found${NC}"
echo ""

# Choose deployment method
echo "Choose deployment method:"
echo "1) PM2 (Process Manager)"
echo "2) Docker Compose"
echo "3) Systemd Service"
read -p "Enter choice [1-3]: " choice

case $choice in
    1)
        echo -e "${YELLOW}Deploying with PM2...${NC}"

        # Install PM2 if not exists
        if ! command -v pm2 &> /dev/null; then
            echo "Installing PM2..."
            npm install -g pm2
        fi

        # Build backend
        echo "Building backend..."
        cd backend
        npm install
        npm run build
        cd ..

        # Build frontend
        echo "Building frontend..."
        cd frontend
        npm install
        npm run build
        cd ..

        # Start backend with PM2
        echo "Starting backend on port $BACKEND_PORT..."
        cd backend
        pm2 start dist/server.js --name discord-pdf-backend
        cd ..

        # Serve frontend with PM2 (using serve package)
        echo "Installing serve package..."
        npm install -g serve

        echo "Starting frontend on port $FRONTEND_PORT..."
        pm2 start "serve -s frontend/dist -l $FRONTEND_PORT" --name discord-pdf-frontend

        # Save PM2 process list
        pm2 save
        pm2 startup

        echo -e "${GREEN}✅ Deployment complete!${NC}"
        echo "Backend running on: http://$DOMAIN:$BACKEND_PORT"
        echo "Frontend running on: http://$DOMAIN:$FRONTEND_PORT"
        echo ""
        echo "PM2 commands:"
        echo "  pm2 status                  - Check status"
        echo "  pm2 logs                    - View logs"
        echo "  pm2 restart all             - Restart services"
        echo "  pm2 stop all                - Stop services"
        ;;

    2)
        echo -e "${YELLOW}Deploying with Docker Compose...${NC}"

        # Check if Docker is installed
        if ! command -v docker &> /dev/null; then
            echo -e "${RED}❌ Docker not found. Please install Docker first.${NC}"
            exit 1
        fi

        # Update docker-compose.yml with ports
        echo "Updating docker-compose.yml..."
        sed -i "s/8080:80/$FRONTEND_PORT:80/" docker-compose.yml
        sed -i "s/3001:3001/$BACKEND_PORT:3001/" docker-compose.yml

        # Build and start
        echo "Building Docker images..."
        docker-compose build

        echo "Starting containers..."
        docker-compose up -d

        echo -e "${GREEN}✅ Deployment complete!${NC}"
        echo "Backend running on: http://$DOMAIN:$BACKEND_PORT"
        echo "Frontend running on: http://$DOMAIN:$FRONTEND_PORT"
        echo ""
        echo "Docker commands:"
        echo "  docker-compose ps           - Check status"
        echo "  docker-compose logs -f      - View logs"
        echo "  docker-compose restart      - Restart services"
        echo "  docker-compose down         - Stop services"
        ;;

    3)
        echo -e "${YELLOW}Deploying with Systemd...${NC}"

        # Build
        echo "Building application..."
        cd backend && npm install && npm run build && cd ..
        cd frontend && npm install && npm run build && cd ..

        # Create systemd service for backend
        echo "Creating systemd service for backend..."
        sudo tee /etc/systemd/system/discord-pdf-backend.service > /dev/null <<EOF
[Unit]
Description=Discord PDF Backend
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)/backend
Environment=NODE_ENV=production
Environment=PORT=$BACKEND_PORT
ExecStart=/usr/bin/node dist/server.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

        # Create systemd service for frontend
        echo "Creating systemd service for frontend..."

        # Install serve if not exists
        if ! command -v serve &> /dev/null; then
            npm install -g serve
        fi

        sudo tee /etc/systemd/system/discord-pdf-frontend.service > /dev/null <<EOF
[Unit]
Description=Discord PDF Frontend
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)/frontend
ExecStart=$(which serve) -s dist -l $FRONTEND_PORT
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

        # Reload systemd and start services
        sudo systemctl daemon-reload
        sudo systemctl enable discord-pdf-backend
        sudo systemctl enable discord-pdf-frontend
        sudo systemctl start discord-pdf-backend
        sudo systemctl start discord-pdf-frontend

        echo -e "${GREEN}✅ Deployment complete!${NC}"
        echo "Backend running on: http://$DOMAIN:$BACKEND_PORT"
        echo "Frontend running on: http://$DOMAIN:$FRONTEND_PORT"
        echo ""
        echo "Systemd commands:"
        echo "  sudo systemctl status discord-pdf-backend  - Check backend status"
        echo "  sudo systemctl status discord-pdf-frontend - Check frontend status"
        echo "  sudo journalctl -u discord-pdf-backend -f - View backend logs"
        echo "  sudo systemctl restart discord-pdf-*       - Restart services"
        ;;

    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${YELLOW}⚠️  Important: Configure DNS/Firewall${NC}"
echo "1. Point your subdomain to this server's IP"
echo "2. Open firewall ports:"
echo "   sudo ufw allow $BACKEND_PORT/tcp"
echo "   sudo ufw allow $FRONTEND_PORT/tcp"
echo ""
echo "3. Update Discord Activity settings:"
echo "   - URL Mappings: /.proxy -> http://$DOMAIN:$FRONTEND_PORT"
echo ""
echo -e "${GREEN}Deployment complete! 🎉${NC}"
