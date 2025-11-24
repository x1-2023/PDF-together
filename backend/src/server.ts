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
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      process.env.CORS_ORIGIN
    ].filter(Boolean);

    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
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
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '524288000'), // Default 500MB
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
    const dbBooks = db.getAllBooks();
    const dbBooksMap = new Map(dbBooks.map(b => [b.id, b]));

    const pdfFiles = files
      .filter(f => f.endsWith('.pdf'))
      .map(f => {
        const stats = fs.statSync(path.join(UPLOADS_DIR, f));
        const bookMetadata = dbBooksMap.get(f);

        return {
          id: f,
          title: bookMetadata?.title || f.replace(/^\d+-/, '').replace(/^[a-f0-9-]+-/, ''), // Use title from DB or fallback to filename
          author: bookMetadata?.author || 'Unknown Author',
          cover: bookMetadata?.cover_image || null,
          description: bookMetadata?.description || '',
          url: `/pdf/${f}`,
          size: stats.size,
          uploadedAt: bookMetadata?.created_at || stats.birthtimeMs
        };
      });

    res.json({ pdfs: pdfFiles });
  } catch (error) {
    console.error('Error listing PDFs:', error);
    res.status(500).json({ error: 'Failed to list PDFs' });
  }
});

// Random cover images for new sessions
const COVER_IMAGES = [
  "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80", // Books
  "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=800&q=80", // Library
  "https://images.unsplash.com/photo-1507842217121-9e9f147d7121?w=800&q=80", // Library 2
  "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800&q=80", // Open book
  "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&q=80", // Reading
  "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=80", // Tablet reading
];

const getRandomCover = () => COVER_IMAGES[Math.floor(Math.random() * COVER_IMAGES.length)];

app.post('/api/upload-pdf', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const pdfId = req.file.filename;
    const url = `/pdf/${pdfId}`;

    // Extract metadata from request body
    const { title, author, description } = req.body;

    // Save metadata to DB
    db.saveBook({
      id: pdfId,
      title: title || req.file.originalname.replace('.pdf', ''),
      author: author || 'Unknown Author',
      description: description || '',
      cover_image: getRandomCover(), // Assign random cover
      uploaded_by: 'user' // TODO: Get actual user from token if available
    });

    console.log(`PDF uploaded: ${pdfId}`);

    res.json({
      pdfId,
      url,
      title: title || req.file.originalname,
      author: author || 'Unknown Author'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Update book metadata
app.put('/api/pdfs/:id/metadata', (req, res) => {
  try {
    const { id } = req.params;
    const { title, author, description, cover_image } = req.body;

    const book = db.getBook(id);
    if (!book) {
      // If book doesn't exist in DB but exists in FS (legacy), create it
      const filePath = path.join(UPLOADS_DIR, id);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'PDF not found' });
      }
    }

    db.saveBook({
      id,
      title: title || book?.title || id,
      author: author !== undefined ? author : book?.author,
      description: description !== undefined ? description : book?.description,
      cover_image: cover_image !== undefined ? cover_image : book?.cover_image,
      uploaded_by: book?.uploaded_by // Preserve uploader
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating metadata:', error);
    res.status(500).json({ error: 'Failed to update metadata' });
  }
});

app.get('/pdf/:id', (req, res) => {
  const { id } = req.params;
  const filePath = path.join(UPLOADS_DIR, id);

  console.log(`[PDF Request] ID: ${id}, Path: ${filePath}, Exists: ${fs.existsSync(filePath)}`);

  if (!fs.existsSync(filePath)) {
    console.error(`[PDF Error] File not found: ${filePath}`);
    return res.status(404).json({ error: 'PDF not found' });
  }

  // Add CORS headers for PDF files
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
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

    // Delete annotations from DB (for all channels) AND book metadata
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
const wss = new WebSocketServer({
  server,
  path: '/ws',
  verifyClient: (info, cb) => {
    // Accept all connections, or implement specific logic for discordsays.com
    cb(true);
  }
});
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
