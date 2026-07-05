import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

import { connectMongo } from './db.js';
import { listPlaylists } from './playlists.js';
import { registerSocketHandlers } from './socketHandlers.js';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;
const isDev = process.env.NODE_ENV !== 'production';

const allowedOrigins = (process.env.CLIENT_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (isDev && /^https?:\/\/localhost:\d+$/.test(origin)) return true;
  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
  })
);

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
  },
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/playlists', async (_req, res) => {
  try {
    const playlists = await listPlaylists();
    res.json(playlists);
  } catch {
    res.status(500).json({ error: 'Failed to fetch playlists' });
  }
});

app.get('/api/audio-proxy', async (req, res) => {
  const url = req.query.url;

  if (typeof url !== 'string' || !url.startsWith('https://audio-ssl.itunes.apple.com/')) {
    res.status(400).json({ error: 'Invalid audio URL' });
    return;
  }

  try {
    const response = await fetch(url);

    if (!response.ok) {
      res.status(response.status).json({ error: 'Failed to fetch audio' });
      return;
    }

    res.setHeader('Content-Type', response.headers.get('content-type') ?? 'audio/mp4');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const buffer = Buffer.from(await response.arrayBuffer());
    res.send(buffer);
  } catch {
    res.status(500).json({ error: 'Audio proxy failed' });
  }
});

io.on('connection', (socket) => {
  socket.emit('welcome', { message: 'Connected to Master Beat server' });

  registerSocketHandlers(io, socket);
});

connectMongo()
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
    });
  })
  .catch((error) => {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  });
