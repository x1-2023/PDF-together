# PDF Together - Discord Activity

A real-time collaborative PDF reader and whiteboard for Discord Activities.

## 🚀 Setup Guide

### Prerequisites
- Node.js 18+
- NPM
- A Discord Application (for Client ID/Secret)

### 1. Installation

**Backend:**
```bash
cd backend
npm install
# Create uploads directory and set permissions (Linux/Proxmox)
mkdir -p uploads
chmod 777 uploads
```

**Frontend:**
```bash
cd frontend
npm install
```

**Environment Variables:**
Copy `.env.example` to `.env` in `backend/` and `frontend/` (if applicable) and fill in your Discord App credentials.

### 2. Running Locally (Development)

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

### 3. Running with PM2 (Production/Stable)

We have included an `ecosystem.config.js` for easy deployment.

```bash
# 1. Build Frontend
cd frontend
npm run build
cd ..

# 2. Install PM2 globally
npm install -g pm2

# 3. Start both services (Backend + Frontend Preview)
pm2 start ecosystem.config.js

# 4. Save list to restart on reboot
pm2 save
pm2 startup
```

---

## 🌐 Deployment with Caddy (Proxmox)

This guide assumes you are running this app on a Proxmox VM/LXC with IP `192.168.1.102`.

### Architecture
- **Public IP** -> **Router (Port 80/443)** -> **Caddy Gateway** -> **This App (192.168.1.102)**

### 1. Caddy Setup (Debian/Ubuntu/Proxmox LXC)

Run these commands on your gateway machine to install Caddy:

```bash
# Install dependencies
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl

# Add Caddy repository
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list

# Install Caddy
sudo apt update
sudo apt install caddy
```

### 2. Caddyfile Configuration
Add this to your `/etc/caddy/Caddyfile`:

```caddy
{
    email your-email@example.com
}

# Replace with your actual domain
# Your subdomain
pdf.0xit.me {
    # Proxy to the local IP of this app
    # Frontend (Vite)
    reverse_proxy /ws* 192.168.1.102:3001
    reverse_proxy /api* 192.168.1.102:3001
    reverse_proxy * 192.168.1.102:5173
}
```

*Note: Ensure your Router forwards Port 80 and 443 to the machine running Caddy.*

### 3. Production Build (Recommended)
For better performance in production, build the frontend instead of using `npm run dev`.

```bash
# Build Frontend
cd frontend
npm run build

# Serve with Backend
# (Ensure backend is configured to serve static files from frontend/dist)
cd ../backend
npm start
```
