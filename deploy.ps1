# Discord PDF - PowerShell Deployment
# For Windows users

Write-Host "🐳 Discord PDF - Docker Deployment" -ForegroundColor Blue
Write-Host "====================================" -ForegroundColor Blue
Write-Host ""

# Prompt for configuration
$DISCORD_CLIENT_ID = Read-Host "Discord Client ID"
$DISCORD_CLIENT_SECRET = Read-Host "Discord Client Secret"
$FRONTEND_PORT = Read-Host "Frontend Port [8080]"
if ([string]::IsNullOrWhiteSpace($FRONTEND_PORT)) { $FRONTEND_PORT = "8080" }

$BACKEND_PORT = Read-Host "Backend Port [3001]"
if ([string]::IsNullOrWhiteSpace($BACKEND_PORT)) { $BACKEND_PORT = "3001" }

$DOMAIN = Read-Host "Your VPS IP/Domain"
$MAX_SIZE_MB = Read-Host "Max Upload Size (MB) [50]"
if ([string]::IsNullOrWhiteSpace($MAX_SIZE_MB)) { $MAX_SIZE_MB = "50" }

$MAX_FILE_SIZE = [int]$MAX_SIZE_MB * 1024 * 1024

Write-Host ""
Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  Frontend: http://$DOMAIN:$FRONTEND_PORT"
Write-Host "  Backend:  http://$DOMAIN:$BACKEND_PORT"
Write-Host "  Max Upload: ${MAX_SIZE_MB}MB"
Write-Host ""

# Create network
Write-Host "Creating Docker network..." -ForegroundColor Blue
docker network create discord-pdf-network 2>$null

# Create uploads directory
if (-not (Test-Path "./uploads")) {
    New-Item -ItemType Directory -Path "./uploads"
}

# Stop old containers
Write-Host "Stopping old containers..." -ForegroundColor Blue
docker stop discord-pdf-backend 2>$null
docker rm discord-pdf-backend 2>$null
docker stop discord-pdf-frontend 2>$null
docker rm discord-pdf-frontend 2>$null

# Build backend
Write-Host ""
Write-Host "Building backend image..." -ForegroundColor Blue
docker build -t discord-pdf-backend ./backend

# Build frontend
Write-Host ""
Write-Host "Building frontend image..." -ForegroundColor Blue
docker build `
  --build-arg VITE_DISCORD_CLIENT_ID="$DISCORD_CLIENT_ID" `
  --build-arg VITE_BACKEND_URL="http://${DOMAIN}:${BACKEND_PORT}" `
  --build-arg VITE_BACKEND_WS_URL="ws://${DOMAIN}:${BACKEND_PORT}" `
  -t discord-pdf-frontend `
  ./frontend

# Run backend
Write-Host ""
Write-Host "Starting Backend Container..." -ForegroundColor Green
docker run -d `
  --restart=unless-stopped `
  --name discord-pdf-backend `
  --network discord-pdf-network `
  -e "PORT=3001" `
  -e "NODE_ENV=production" `
  -e "UPLOADS_DIR=/app/uploads" `
  -e "DISCORD_CLIENT_ID=$DISCORD_CLIENT_ID" `
  -e "DISCORD_CLIENT_SECRET=$DISCORD_CLIENT_SECRET" `
  -e "CORS_ORIGIN=http://${DOMAIN}:${FRONTEND_PORT}" `
  -e "MAX_FILE_SIZE=$MAX_FILE_SIZE" `
  -p "${BACKEND_PORT}:3001" `
  -v "${PWD}/uploads:/app/uploads" `
  discord-pdf-backend

Write-Host "✓ Backend started" -ForegroundColor Green

# Run frontend
Write-Host ""
Write-Host "Starting Frontend Container..." -ForegroundColor Green
docker run -d `
  --restart=unless-stopped `
  --name discord-pdf-frontend `
  --network discord-pdf-network `
  -p "${FRONTEND_PORT}:80" `
  discord-pdf-frontend

Write-Host "✓ Frontend started" -ForegroundColor Green

# Success
Write-Host ""
Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host "Access:"
Write-Host "  Frontend: http://${DOMAIN}:${FRONTEND_PORT}"
Write-Host "  Backend:  http://${DOMAIN}:${BACKEND_PORT}/health"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Configure firewall (if on Linux VPS)"
Write-Host "2. Discord URL Mapping: /.proxy -> http://${DOMAIN}:${FRONTEND_PORT}"
Write-Host "3. Test: curl http://${DOMAIN}:${BACKEND_PORT}/health"
Write-Host ""
