# Discord Activity Setup Guide

Hướng dẫn chi tiết để chạy **PDF Together** như một Discord Activity.

## 📋 Yêu cầu

- Discord Developer Account
- Domain có SSL (HTTPS required cho Discord Activities)
- Server đã setup (xem [README.md](./README.md))

## 🎯 Bước 1: Tạo Discord Application

1. Truy cập [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"**
3. Đặt tên cho app (ví dụ: "PDF Together")
4. Chấp nhận Terms of Service

## 🔧 Bước 2: Cấu hình Application

### General Information

1. Vào tab **"General Information"**
2. Upload **App Icon** (512x512px recommended)
3. Thêm **Description**: "Real-time collaborative PDF reader with AI assistance"
4. Lưu **Application ID** và **Client Secret**

### OAuth2 Settings

1. Vào tab **"OAuth2"**
2. Thêm **Redirect URLs**:
   ```
   https://your-domain.com
   https://your-domain.com/.proxy
   ```
   
   > ⚠️ **Quan trọng**: Discord Activities yêu cầu `/.proxy` redirect URI

3. Trong **OAuth2 URL Generator**:
   - Chọn scopes: `identify`, `guilds`
   - Copy OAuth2 URL để test

### Activities Settings

1. Vào tab **"Activities"** (nếu chưa có, request access từ Discord)
2. Click **"Enable Activities"**
3. Cấu hình **Activity Settings**:
   - **Activity Name**: PDF Together
   - **Activity URL**: `https://your-domain.com`
   - **Supported Platforms**: Desktop, Web
   
4. Thêm **URL Mappings**:
   ```
   Prefix: /
   Target: https://your-domain.com
   ```

## 🔐 Bước 3: Cấu hình Environment Variables

### Backend (.env)

```bash
# Discord OAuth
DISCORD_CLIENT_ID=your_application_id_here
DISCORD_CLIENT_SECRET=your_client_secret_here

# Server
PORT=3001
NODE_ENV=production
UPLOADS_DIR=./uploads
DB_PATH=./data/discord-pdf.db

# CORS
CORS_ORIGIN=https://your-domain.com

# File Upload
MAX_FILE_SIZE=524288000
```

### Frontend (.env)

```bash
# API Endpoints
VITE_API_URL=https://your-domain.com
VITE_WS_URL=wss://your-domain.com/ws

# Discord
VITE_DISCORD_CLIENT_ID=your_application_id_here

# Gemini AI (Optional)
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

## 🌐 Bước 4: Deploy với HTTPS

Discord Activities **yêu cầu HTTPS**. Có 3 options:

### Option 1: Cloudflare Tunnel (Recommended - Free)

```bash
# Download cloudflared
# Windows
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe -o cloudflared.exe

# Linux
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared-linux-amd64

# Run tunnel
cloudflared tunnel --url http://localhost:5173
```

### Option 2: Caddy Reverse Proxy (Recommended cho VPS)

Xem chi tiết trong [README.md](./README.md) phần Deployment.

```caddy
your-domain.com {
    reverse_proxy /ws* localhost:3001
    reverse_proxy /api* localhost:3001
    reverse_proxy * localhost:5173
}
```

### Option 3: Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location /api {
        proxy_pass http://localhost:3001;
    }

    location / {
        proxy_pass http://localhost:5173;
    }
}
```

## 🧪 Bước 5: Testing

### Local Testing với Discord

1. Mở Discord Desktop hoặc Web
2. Vào bất kỳ server nào
3. Click vào **Activities** (rocket icon) trong voice channel
4. Chọn **"Add an Activity"**
5. Paste **Application ID** của bạn
6. Activity sẽ xuất hiện để test

### Testing OAuth Flow

1. Navigate đến: `https://your-domain.com`
2. Click "Login with Discord"
3. Authorize app
4. Verify redirect về app thành công

## 📝 Bước 6: Submit cho Review (Optional)

Để app xuất hiện public trong Discord Activity Store:

1. Vào **Discord Developer Portal** → Your App
2. Tab **"Activities"** → **"Submit for Review"**
3. Điền thông tin:
   - **Terms of Service URL**: `https://your-domain.com/#/terms`
   - **Privacy Policy URL**: `https://your-domain.com/#/privacy`
   - Screenshots (1280x720px)
   - Description
   - Age Rating

4. Submit và chờ Discord review (thường 1-2 tuần)

## 🐛 Troubleshooting

### Issue: "Invalid OAuth2 redirect_uri"

**Fix**: Đảm bảo redirect URI trong code khớp với Discord Developer Portal:
```typescript
// backend/src/server.ts line 102
redirect_uri: 'https://your-domain.com'
```

### Issue: "Activity failed to load"

**Checklist**:
- [ ] HTTPS đang hoạt động
- [ ] CORS headers đúng
- [ ] WebSocket connection thành công
- [ ] Check browser console for errors

### Issue: WebSocket connection failed

**Fix**: Đảm bảo reverse proxy support WebSocket upgrade:
```
Upgrade: websocket
Connection: Upgrade
```

### Issue: "This site can't be reached"

**Fix**: 
- Check firewall rules
- Verify DNS pointing đúng
- Test với `curl https://your-domain.com/health`

## 📚 Resources

- [Discord Activities Documentation](https://discord.com/developers/docs/activities/overview)
- [Discord OAuth2 Guide](https://discord.com/developers/docs/topics/oauth2)
- [Cloudflare Tunnel Docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Caddy Documentation](https://caddyserver.com/docs/)

## 🔗 URLs cần thiết cho Discord Submission

Khi submit Discord Activity, bạn cần provide các URLs sau:

- **Terms of Service**: `https://your-domain.com/#/terms`
- **Privacy Policy**: `https://your-domain.com/#/privacy`
- **Support Server**: Your Discord server invite link (optional)

## ✅ Checklist trước khi Submit

- [ ] App hoạt động trên HTTPS
- [ ] OAuth2 flow hoạt động
- [ ] WebSocket real-time sync hoạt động
- [ ] Terms of Service page accessible
- [ ] Privacy Policy page accessible
- [ ] Screenshots prepared (1280x720px)
- [ ] App icon uploaded (512x512px)
- [ ] Description đầy đủ và rõ ràng
- [ ] Tested trên cả Desktop và Web Discord

---

**Lưu ý**: Discord Activities vẫn đang trong beta. Một số features có thể thay đổi. Luôn check [Discord Developer Docs](https://discord.com/developers/docs) để cập nhật mới nhất.
