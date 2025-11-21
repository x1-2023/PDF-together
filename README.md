# PDF Together - Discord Activity

A real-time collaborative PDF reader and whiteboard for Discord Activities.

## 🚀 Setup Guide

### Prerequisites
- Node.js 18+
- NPM
- A Discord Application (for Client ID/Secret)

### 1. Installation

```bash
# Install dependencies
npm install

# Setup environment variables
# Copy .env.example to .env (if available) or create one
# Required: VITE_DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, etc.
```

### 2. Running Locally

```bash
# Start Backend (Port 3001)
npm run server

# Start Frontend (Port 5173)
npm run dev
```

---

## 🌐 Deployment with Caddy (Proxmox)

This guide assumes you are running this app on a Proxmox VM/LXC with IP `192.168.1.102`.

### Architecture
- **Public IP** -> **Router (Port 80/443)** -> **Caddy Gateway** -> **This App (192.168.1.102)**

### 1. Caddy Setup
Install Caddy on your gateway machine (or the same machine).

### 2. Caddyfile Configuration
Add this to your `/etc/caddy/Caddyfile`:

```caddy
{
    email your-email@example.com
}

# Replace with your actual domain
your-domain.com {
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
