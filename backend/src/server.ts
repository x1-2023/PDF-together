import 'dotenv/config';
import express from 'express';
import { WebSocketServer } from 'ws';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { RoomManager } from './RoomManager';
import { WebSocketHandler } from './WebSocketHandler';
import { DatabaseManager } from './DatabaseManager';

const app = express();
const PORT = process.env.PORT || 3001;
const UPLOADS_DIR = process.env.UPLOADS_DIR || './uploads';

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800'), // Default 50MB (in bytes)
  },
});

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Exchange Discord authorization code for access token
app.post('/api/token', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    const clientId = process.env.DISCORD_CLIENT_ID;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error('Missing Discord credentials in environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Exchange code for token with Discord
    // For Activities, redirect_uri should be /.proxy
    const response = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: 'https://pdf.0xit.me',
      }),
    });

    const data = await response.json() as any;

    if (!response.ok) {
      console.error('Discord token exchange failed:', data);
      return res.status(response.status).json(data);
    }

    // Fetch user profile
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${data.access_token}`,
      },
    });

    const userData = await userResponse.json() as any;

    if (!userResponse.ok) {
      console.error('Failed to fetch user profile:', userData);
      return res.status(userResponse.status).json(userData);
    }

    res.json({
      access_token: data.access_token,
      user: {
        id: userData.id,
        username: userData.username,
        discriminator: userData.discriminator,
        avatar: userData.avatar,
      },
    });
  } catch (error) {
    console.error('Token exchange error:', error);
    res.status(500).json({ error: 'Failed to exchange token' });
  }
});

// Get list of pre-loaded PDFs
app.get('/api/pdfs', (req, res) => {
  try {
    const files = fs.readdirSync(UPLOADS_DIR);
    const pdfFiles = files
      .filter(f => f.endsWith('.pdf'))
      .map(f => ({
        id: f,
        name: f.replace(/^\d+-/, '').replace(/^[a-f0-9-]+-/, ''), // Remove UUID prefix if exists
        url: `/pdf/${f}`,
        size: fs.statSync(path.join(UPLOADS_DIR, f)).size
      }));

    res.json({ pdfs: pdfFiles });
  } catch (error) {
    console.error('Error listing PDFs:', error);
    res.status(500).json({ error: 'Failed to list PDFs' });
  }
});

app.post('/api/upload-pdf', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const pdfId = req.file.filename;
    const url = `/pdf/${pdfId}`;

    console.log(`PDF uploaded: ${pdfId}`);

    res.json({
      pdfId,
      url,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

app.get('/pdf/:id', (req, res) => {
  const { id } = req.params;
  const filePath = path.join(UPLOADS_DIR, id);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'PDF not found' });
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.sendFile(path.resolve(filePath));
});

app.delete('/api/pdfs/:id', (req, res) => {
  const { id } = req.params;
  const filePath = path.join(UPLOADS_DIR, id);

  try {
    // Delete file if exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete annotations from DB (for all channels)
    db.deleteAllAnnotationsForPdf(id);

    // Broadcast deletion to all connected clients
    const message = JSON.stringify({
      type: 'pdf_deleted',
      pdfId: id
    });

    wss.clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN is 1
        client.send(message);
      }
    });

    console.log(`🗑️ Deleted PDF: ${id}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting PDF:', error);
    res.status(500).json({ error: 'Failed to delete PDF' });
  }
});

// Start HTTP server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Uploads directory: ${path.resolve(UPLOADS_DIR)}`);
});

// Setup Database
const DB_PATH = process.env.DB_PATH || './data/discord-pdf.db';
const db = new DatabaseManager(DB_PATH);
console.log(`📂 Database initialized: ${DB_PATH}`);

// Setup WebSocket
const wss = new WebSocketServer({ server, path: '/ws' });
const roomManager = new RoomManager(db);
new WebSocketHandler(wss, roomManager);

console.log('WebSocket server ready on /ws');

// Periodic database save (every 5 minutes)
const SAVE_INTERVAL = 5 * 60 * 1000; // 5 minutes
setInterval(() => {
  console.log('💾 Periodic save to database...');
  roomManager.saveAllRoomsToDatabase();
  const stats = db.getStats();
  console.log(`📊 DB Stats: ${stats.totalAnnotations} annotations, ${stats.totalChannels} channels, ${(stats.dbSizeBytes / 1024 / 1024).toFixed(2)} MB`);
}, SAVE_INTERVAL);

// Database stats endpoint
app.get('/api/stats', (_req, res) => {
  const stats = db.getStats();
  res.json(stats);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, saving and closing...');
  roomManager.saveAllRoomsToDatabase();
  db.close();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, saving and closing...');
  roomManager.saveAllRoomsToDatabase();
  db.close();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
