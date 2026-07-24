const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const cron = require('node-cron');
const passport = require('passport');
require('dotenv').config();

const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.warn('⚠️  Missing environment variables:', missingEnvVars.join(', '));
} else {
  console.log('✅ All required environment variables are configured');
}

const liveCache = require('./services/liveCache');
const cloudStorage = require('./services/cloudStorage');
const Sermon = require('./models/Sermon');
const Devotion = require('./models/Devotion');
const Event = require('./models/Event');
const Ministry = require('./models/Ministry');
const User = require('./models/User');
const Notification = require('./models/Notification');

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || 'AIzaSyDBYdCJVQ1FpSXPOHd6xFx4eLLuMUBzjw8';
const YOUTUBE_BASE_URL = 'https://www.googleapis.com/youtube/v3';

function extractVideoId(url) {
  if (!url) return null;
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&\n?#]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^&\n?#]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([^&\n?#]+)/,
    /(?:https?:\/\/)?youtu\.be\/([^&\n?#]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/live\/([^&\n?#]+)/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
}

function parseDuration(isoDuration) {
  if (!isoDuration) return null;
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return null;
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  if (hours === 0 && minutes === 0 && seconds === 0) return null;
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

async function fetchYouTubeVideoDetails(videoUrl) {
  try {
    const videoId = extractVideoId(videoUrl);
    if (!videoId) return null;
    const response = await fetch(
      `${YOUTUBE_BASE_URL}/videos?id=${videoId}&key=${YOUTUBE_API_KEY}&part=snippet,contentDetails,statistics`
    );
    if (!response.ok) return null;
    const data = await response.json();
    if (!data.items || data.items.length === 0) return null;
    const video = data.items[0];
    const snippet = video.snippet;
    const contentDetails = video.contentDetails;
    const statistics = video.statistics;
    const isLive = snippet.liveBroadcastContent === 'live';
    const parsedDuration = isLive ? null : parseDuration(contentDetails?.duration);
    return {
      description: snippet.description || '',
      duration: parsedDuration,
      viewCount: statistics.viewCount ? parseInt(statistics.viewCount) : 0,
      thumbnailUrl: snippet.thumbnails?.maxres?.url ||
                    snippet.thumbnails?.high?.url ||
                    snippet.thumbnails?.default?.url,
      publishedAt: snippet.publishedAt,
      isLive: isLive
    };
  } catch (error) {
    console.error('Error fetching YouTube video details:', error.message);
    return null;
  }
}

const isCloudStorage = cloudStorage.isConfigured();
console.log('☁️ Cloud Storage Status:', cloudStorage.getConfigStatus());

const authRoutes = require('./routes/auth');
const sermonRoutes = require('./routes/sermons');
const podcastRoutes = require('./routes/podcasts');
const liveBroadcastRoutes = require('./routes/liveBroadcasts');
const devotionRoutes = require('./routes/devotions');
const eventRoutes = require('./routes/events');
const prayerRequestRoutes = require('./routes/prayerRequests');
const ministryRoutes = require('./routes/ministries');
const newsRoutes = require('./routes/news');
const givingRoutes = require('./routes/giving');
const contactRoutes = require('./routes/contacts');
const searchRoutes = require('./routes/search');
const commentsRoutes = require('./routes/comments');
const youtubeRoutes = require('./routes/youtube');
const notificationRoutes = require('./routes/notifications');

const app = express();
app.set('strict routing', false);
app.set('case sensitive routing', false);

const PORT = process.env.PORT || 10000;
const isFly = !!process.env.FLY_APP_NAME;
const isRender = !!process.env.RENDER;
const isProduction = isFly || isRender;

const limiter = rateLimit({
  windowMs: isProduction ? 15 * 60 * 1000 : 60 * 60 * 1000,
  max: 5000,
  standardHeaders: false,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.'
});

const allowedOrigins = [
  'https://dove-church.fly.dev',
  'https://dove-church.onrender.com',
  'https://localhost',
  'http://localhost',
  'http://localhost:5000',
  'http://localhost:5173',
  'ionic://localhost',
  'capacitor://localhost'
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (process.env.CORS_ORIGIN === '*') return callback(null, true);
    if (!process.env.CORS_ORIGIN) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with'],
  maxAge: 86400
};

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));
app.use(limiter);
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb', parameterLimit: 1000000 }));
app.use(passport.initialize());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) cb(null, true);
    else cb(new Error('Only video files are allowed!'), false);
  }
});

const fs = require('fs');

const thumbnailUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed!'), false);
  }
});

// Ensure thumbnail directory exists for local uploads
const thumbnailDir = path.join(__dirname, 'uploads', 'thumbnails');
if (!fs.existsSync(thumbnailDir)) {
  fs.mkdirSync(thumbnailDir, { recursive: true });
}

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'DMA/dist')));

// Database connection
let cachedConnection = null;
const connectDB = async () => {
  if (cachedConnection && mongoose.connection.readyState === 1) return cachedConnection;
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://dove_admin:kQt3f0wk2abekE5x@cluster1.xxt8zzi.mongodb.net/dmaApp?appName=Cluster1';
    cachedConnection = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB connected successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    return cachedConnection;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    if (!isProduction) setTimeout(connectDB, 5000);
    throw error;
  }
};

connectDB();
mongoose.connection.once('open', async () => {
  console.log('📦 Database connection opened');
  await createDefaultAdminUser();
  setupChangeStreams();
});
mongoose.connection.on('connected', () => console.log('✅ Mongoose connected'));
mongoose.connection.on('error', (err) => console.error('❌ Mongoose error:', err));
mongoose.connection.on('disconnected', () => console.warn('⚠️ Mongoose disconnected'));

async function createDefaultAdminUser() {
  try {
    const adminEmail = 'brownjh18@gmail.com';
    const adminPassword = 'Jonah@2002';
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        existingAdmin.isActive = true;
        await existingAdmin.save();
        console.log('✅ Updated user to admin:', adminEmail);
      }
      return;
    }
    await new User({ name: 'Admin User', email: adminEmail, password: adminPassword, role: 'admin', isActive: true }).save();
    console.log('✅ Default admin user created');
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
  }
}

async function checkAndUpdateEndedBroadcasts() {
  try {
    const now = Date.now();

    // Check radio live broadcasts
    const broadcasts = await Sermon.find({
      type: 'live_broadcast', isLive: true,
      $or: [
        { broadcastEndTime: { $exists: true } },
        { broadcastStartTime: { $lt: new Date(now - 4 * 60 * 60 * 1000) } }
      ]
    });
    for (const b of broadcasts) {
      let shouldEnd = !!b.broadcastEndTime;
      if (!shouldEnd && b.broadcastStartTime) {
        const hours = (now - new Date(b.broadcastStartTime).getTime()) / (1000 * 60 * 60);
        if (hours > 4) shouldEnd = true;
      }
      if (shouldEnd) {
        b.isLive = false;
        if (!b.broadcastEndTime) b.broadcastEndTime = new Date();
        if (!b.duration && b.broadcastStartTime) {
          const diffMs = b.broadcastEndTime.getTime() - new Date(b.broadcastStartTime).getTime();
          if (diffMs > 0) {
            const mins = Math.floor(diffMs / (1000 * 60));
            b.duration = `${Math.floor(mins / 60)}:${(mins % 60).toString().padStart(2, '0')}:00`;
          }
        }
        await b.save();
        console.log(`✅ Ended broadcast: ${b.title}`);
      }
    }

    // Check YouTube sermons with stale live status - use YouTube API to check actual status
    const liveSermons = await Sermon.find({
      type: 'sermon',
      videoUrl: { $regex: /youtu\.be\/|youtube\.com\/(watch|live|embed)/i },
      $or: [
        { isLive: true },
        { duration: '00:00' },
        { duration: 'LIVE' }
      ]
    });
    for (const s of liveSermons) {
      const youtubeDetails = await fetchYouTubeVideoDetails(s.videoUrl);
      if (youtubeDetails) {
        const isStillLive = youtubeDetails.isLive;
        const actualDuration = youtubeDetails.duration;

        if (isStillLive) {
          console.log(`🔴 YouTube sermon still live: ${s.title}`);
          continue;
        }

        // Only save if YouTube returned a real duration
        // null = YouTube hasn't processed the video yet, keep retrying
        // '00:00' = empty duration, skip
        if (actualDuration) {
          s.isLive = false;
          s.duration = actualDuration;
          await s.save();
          console.log(`✅ Ended YouTube sermon live: ${s.title} (duration: ${actualDuration})`);
        } else {
          console.log(`⏳ YouTube sermon ended but duration not ready yet: ${s.title}`);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error checking broadcasts:', error);
  }
}

// Initialize
console.log('🚀 Initializing caches...');
liveCache.updateLiveCache();
checkAndUpdateEndedBroadcasts();
cron.schedule("*/30 * * * *", async () => {
  await liveCache.updateLiveCache();
  await checkAndUpdateEndedBroadcasts();
});

// Create HTTP server + Socket.IO
const server = createServer({ maxHeaderSize: 65536 }, app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  transports: ['websocket', 'polling']
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  socket.on('join', (userId) => {
    if (userId) {
      socket.join(`user:${userId}`);
      console.log(`👤 User ${userId} joined their room`);
    }
  });

  // Live broadcast audio streaming
  socket.on('broadcast:join-room', (broadcastId) => {
    if (broadcastId) {
      socket.join(`broadcast:${broadcastId}`);
      console.log(`🎙️ Client ${socket.id} joined broadcast room ${broadcastId}`);
    }
  });

  socket.on('broadcast:leave-room', (broadcastId) => {
    if (broadcastId) {
      socket.leave(`broadcast:${broadcastId}`);
      console.log(`🎙️ Client ${socket.id} left broadcast room ${broadcastId}`);
    }
  });

  socket.on('broadcast:audio', (data) => {
    if (data && data.broadcastId && data.chunk) {
      // Relay audio chunk to all listeners in the broadcast room (excluding sender)
      socket.to(`broadcast:${data.broadcastId}`).emit('broadcast:audio', {
        chunk: data.chunk,
        mimeType: data.mimeType,
        timestamp: Date.now()
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Make io accessible in routes
app.set('io', io);

// Helper: create notification for all users and emit via Socket.IO
async function createAndEmitNotification({ title, message, type, contentType, contentId }) {
  try {
    const users = await User.find({ isActive: true }).select('_id');
    const notifications = users.map(user => ({
      userId: user._id,
      title,
      message,
      type,
      contentType,
      contentId,
      read: false
    }));
    const saved = await Notification.insertMany(notifications);
    console.log(`📢 Created ${saved.length} notifications for "${title}"`);

    // Emit to all connected users
    for (const notif of saved) {
      io.to(`user:${notif.userId.toString()}`).emit('notification:new', notif);
    }

    return saved;
  } catch (error) {
    console.error('❌ Error creating notifications:', error);
  }
}

// MongoDB change streams for real-time notifications
function setupChangeStreams() {
  if (!isProduction && !process.env.USE_CHANGE_STREAMS) {
    console.log('ℹ️ Skipping change streams in development');
    return;
  }

  try {
    const sermonStream = Sermon.watch([], { fullDocument: 'updateLookup' });
    sermonStream.on('change', async (change) => {
      const doc = change.fullDocument;
      if (!doc) return;
      if (doc.type === 'podcast') {
        if (change.operationType === 'insert') {
          await createAndEmitNotification({ title: 'New Podcast', message: `"${doc.title}" is now available`, type: 'podcast', contentType: 'podcast', contentId: doc._id });
        }
      } else {
        const ops = {
          insert: { title: 'New Sermon', message: `"${doc.title}" has been added` },
          update: { title: 'Sermon Updated', message: `"${doc.title}" has been updated` },
          delete: { title: 'Sermon Removed', message: 'A sermon has been removed' }
        };
        const op = ops[change.operationType];
        if (op) {
          await createAndEmitNotification({ ...op, type: 'sermon', contentType: 'sermon', contentId: doc._id });
        }
      }
    });

    const devotionStream = Devotion.watch([], { fullDocument: 'updateLookup' });
    devotionStream.on('change', async (change) => {
      const doc = change.fullDocument;
      if (!doc) return;
      const ops = {
        insert: { title: 'New Devotion', message: `"${doc.title || doc.scripture}" is now available` },
        update: { title: 'Devotion Updated', message: `"${doc.title || doc.scripture}" has been updated` }
      };
      const op = ops[change.operationType];
      if (op) await createAndEmitNotification({ ...op, type: 'devotion', contentType: 'devotion', contentId: doc._id });
    });

    const eventStream = Event.watch([], { fullDocument: 'updateLookup' });
    eventStream.on('change', async (change) => {
      const doc = change.fullDocument;
      if (!doc) return;
      const ops = {
        insert: { title: 'New Event', message: `"${doc.title}" has been scheduled` },
        update: { title: 'Event Updated', message: `"${doc.title}" has been updated` }
      };
      const op = ops[change.operationType];
      if (op) await createAndEmitNotification({ ...op, type: 'event', contentType: 'event', contentId: doc._id });
    });

    const ministryStream = Ministry.watch([], { fullDocument: 'updateLookup' });
    ministryStream.on('change', async (change) => {
      const doc = change.fullDocument;
      if (!doc) return;
      const ops = {
        insert: { title: 'New Ministry', message: `"${doc.name}" has been added` },
        update: { title: 'Ministry Updated', message: `"${doc.name}" has been updated` }
      };
      const op = ops[change.operationType];
      if (op) await createAndEmitNotification({ ...op, type: 'ministry', contentType: 'ministry', contentId: doc._id });
    });

    console.log('📡 MongoDB change streams active');
  } catch (error) {
    console.error('❌ Change streams error:', error.message);
    console.log('ℹ️ Change streams require MongoDB Atlas replica set');
  }
}

// Ensure DB connection for API requests
app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('❌ DB connection failed:', error.message);
    res.status(503).json({ error: 'Database connection failed. Please try again.' });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sermons', sermonRoutes);
app.use('/api/podcasts', podcastRoutes);
app.use('/api/live-broadcasts', liveBroadcastRoutes);
app.use('/api/devotions', devotionRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/prayer-requests', prayerRequestRoutes);
app.use('/api/ministries', ministryRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/giving', givingRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/youtube', youtubeRoutes);
app.use('/api/notifications', notificationRoutes);

// Thumbnail upload
app.post('/api/upload/thumbnail', (req, res) => {
  thumbnailUpload.single('thumbnailFile')(req, res, async (err) => {
    try {
      if (err) return res.status(400).json({ error: err.message });
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

      if (isCloudStorage) {
        // Upload to Cloudinary
        const result = await new Promise((resolve, reject) => {
          cloudStorage.cloudinary.uploader.upload_stream(
            { resource_type: 'image', folder: 'dove-ministries/thumbnails', transformation: [{ width: 800, height: 600, crop: 'fill', gravity: 'auto' }] },
            (error, result) => { if (error) reject(error); else resolve(result); }
          ).end(req.file.buffer);
        });
        return res.json({ message: 'Thumbnail uploaded successfully', thumbnailUrl: result.secure_url });
      }

      // Fallback: save locally
      const ext = path.extname(req.file.originalname) || '.jpg';
      const filename = `thumb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
      const filepath = path.join(thumbnailDir, filename);
      fs.writeFileSync(filepath, req.file.buffer);
      const thumbnailUrl = `/uploads/thumbnails/${filename}`;
      return res.json({ message: 'Thumbnail uploaded successfully', thumbnailUrl });
    } catch (error) {
      console.error('Thumbnail upload error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), environment: process.env.NODE_ENV, platform: isFly ? 'fly.io' : 'local', mongoReady: mongoose.connection.readyState, dbName: mongoose.connection.name });
});

// App version check
app.get('/api/app/version', (req, res) => {
  res.json({
    latestVersion: '1.1.0',
    minimumVersion: '1.0.0',
    releaseDate: '2026-07-24',
    releaseNotes: [
      'Improved save functionality for sermons, podcasts, and devotions',
      'Better notification support for mobile devices',
      'Performance improvements and bug fixes',
    ],
    updateUrl: 'https://play.google.com/store/apps/details?id=io.dove.ministries.africa',
    forceUpdate: false,
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: isProduction ? 'Something went wrong!' : err.message });
});

// 404 for API
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// SPA catch-all — serve React app for non-API routes
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'DMA', 'dist', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) res.status(404).send('Not found');
  });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Platform: ${isFly ? 'Fly.io' : 'Local'}`);
  console.log(`🔌 Socket.IO enabled`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM received, shutting down...');
  io.close();
  await mongoose.connection.close();
  server.close(() => process.exit(0));
});

process.on('SIGINT', async () => {
  console.log('\n🛑 SIGINT received, shutting down...');
  io.close();
  await mongoose.connection.close();
  server.close(() => process.exit(0));
});

module.exports = app;
