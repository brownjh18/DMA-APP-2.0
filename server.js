const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { createServer } = require('http');
const multer = require('multer');
const cron = require('node-cron');
const passport = require('passport');
require('dotenv').config();

// Validate critical environment variables
const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.warn('⚠️  Missing environment variables:', missingEnvVars.join(', '));
  console.warn('⚠️  Please configure these in Vercel dashboard or .env file');
} else {
  console.log('✅ All required environment variables are configured');
}

// Import services
const liveCache = require('./services/liveCache');
const cloudStorage = require('./services/cloudStorage');
const Sermon = require('./models/Sermon');
const User = require('./models/User');

// Check if Cloudinary is configured
const isCloudStorage = cloudStorage.isConfigured();
console.log('☁️ Cloud Storage Status:', cloudStorage.getConfigStatus());

// Import routes
const authRoutes = require('./routes/auth');
const sermonRoutes = require('./routes/sermons');
const podcastRoutes = require('./routes/podcasts');
console.log('📡 Podcast routes imported:', typeof podcastRoutes);
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

const app = express();

// Treat routes with and without trailing slashes as the same
app.set('strict routing', false);
app.set('case sensitive routing', false);

// PORT for Vercel (they set it automatically)
const PORT = process.env.PORT || 3000;

// Note: Socket.IO has been moved to websocket-server.js for Oracle Cloud Always Free hosting
// This allows Vercel to handle API routes efficiently while the WS server maintains persistent connections

// Rate limiting
const limiter = rateLimit({
  windowMs: process.env.NODE_ENV === 'production' ? 15 * 60 * 1000 : 60 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 5000 : 5000,
  message: 'Too many requests from this IP, please try again later.'
});

// CORS configuration
const allowedOrigins = [
  'https://dovechurchapp.vercel.app',
  'https://dove-church-frontend.vercel.app',
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
    if (allowedOrigins.includes(origin) || process.env.CORS_ORIGIN === '*' || !process.env.CORS_ORIGIN) {
      callback(null, true);
    } else if (process.env.CORS_ORIGIN && process.env.CORS_ORIGIN.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with']
};

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(limiter);
app.use(cors(corsOptions));
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb', parameterLimit: 1000000 }));

// Passport middleware
app.use(passport.initialize());

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed!'), false);
    }
  }
});

const thumbnailStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads/thumbnails');
    if (!require('fs').existsSync(uploadPath)) {
      require('fs').mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'thumbnail-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const thumbnailUpload = multer({
  storage: thumbnailStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads/videos', express.static(path.join(__dirname, 'uploads/videos')));
app.use('/uploads/videos/thumbnails', express.static(path.join(__dirname, 'uploads/videos/thumbnails')));
app.use('/uploads/podcasts', express.static(path.join(__dirname, 'uploads/podcasts')));
app.use('/uploads/thumbnails', express.static(path.join(__dirname, 'uploads/thumbnails')));

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, '../DMA/dist')));

// Database connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://dove_admin:kQt3f0wk2abekE5x@cluster1.xxt8zzi.mongodb.net/?appName=Cluster1';
    
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ MongoDB connected successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('🔄 Retrying connection in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

connectDB();
mongoose.connection.once('open', async () => {
  console.log('📦 Database connection opened, creating default admin user...');
  await createDefaultAdminUser();
});

mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ Mongoose disconnected from MongoDB');
});

// Create default admin user
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
        console.log('✅ Updated existing user to admin role:', adminEmail);
      } else {
        console.log('✅ Admin user already exists:', adminEmail);
      }
      return;
    }
    
    const adminUser = new User({
      name: 'Admin User',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      isActive: true
    });
    
    await adminUser.save();
    console.log('✅ Default admin user created successfully!');
  } catch (error) {
    console.error('❌ Error creating default admin user:', error.message);
  }
}

// Check ended live broadcasts
async function checkAndUpdateEndedBroadcasts() {
  try {
    console.log('🔍 Checking for ended live broadcasts...');
    
    const now = Date.now();
    const broadcastsToUpdate = await Sermon.find({
      type: 'live_broadcast',
      isLive: true,
      $or: [
        { broadcastEndTime: { $exists: true } },
        { broadcastStartTime: { $lt: new Date(now - 4 * 60 * 60 * 1000) } }
      ]
    });
    
    for (const broadcast of broadcastsToUpdate) {
      let shouldEnd = false;
      
      if (broadcast.broadcastEndTime) {
        shouldEnd = true;
      } else if (broadcast.broadcastStartTime) {
        const startTime = new Date(broadcast.broadcastStartTime).getTime();
        const durationHours = (now - startTime) / (1000 * 60 * 60);
        if (durationHours > 4) shouldEnd = true;
      }
      
      if (shouldEnd) {
        broadcast.isLive = false;
        if (!broadcast.broadcastEndTime) {
          broadcast.broadcastEndTime = new Date();
        }
        if (!broadcast.duration && broadcast.broadcastStartTime) {
          const startTime = new Date(broadcast.broadcastStartTime).getTime();
          const endTime = broadcast.broadcastEndTime.getTime();
          const diffMs = endTime - startTime;
          if (diffMs > 0) {
            const diffMins = Math.floor(diffMs / (1000 * 60));
            const hours = Math.floor(diffMins / 60);
            const mins = diffMins % 60;
            broadcast.duration = hours > 0 ? `${hours}:${mins.toString().padStart(2, '0')}:00` : `${mins}:00`;
          }
        }
        await broadcast.save();
        console.log(`✅ Ended broadcast: ${broadcast.title} (${broadcast._id})`);
      }
    }
  } catch (error) {
    console.error('❌ Error checking ended broadcasts:', error);
  }
}

// Initialize
console.log('🚀 Initializing caches...');
liveCache.updateLiveCache();
checkAndUpdateEndedBroadcasts();

cron.schedule("*/30 * * * *", async () => {
  console.log('⏰ Running scheduled cache update...');
  await liveCache.updateLiveCache();
  await checkAndUpdateEndedBroadcasts();
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

// Thumbnail upload
app.post('/api/upload/thumbnail', (req, res) => {
  thumbnailUpload.single('thumbnailFile')(req, res, async (err) => {
    try {
      if (err) return res.status(400).json({ error: err.message });
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      
      let thumbnailUrl = '';
      
      if (isCloudStorage && req.file.path) {
        const cloudResult = await cloudStorage.uploadFile(req.file.path, {
          resource_type: 'image',
          folder: 'dove-ministries/thumbnails',
          transformation: [{ width: 800, height: 600, crop: 'fill', gravity: 'auto' }]
        });
        thumbnailUrl = cloudResult.secure_url;
        try { require('fs').unlinkSync(req.file.path); } catch (e) {}
      } else {
        thumbnailUrl = `/uploads/thumbnails/${req.file.filename}`;
      }
      
      res.json({ message: 'Thumbnail uploaded successfully', thumbnailUrl });
    } catch (error) {
      console.error('Thumbnail upload error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), environment: process.env.NODE_ENV });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' ? 'Something went wrong!' : err.message
  });
});

// Catch all
app.get('*', (req, res) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return res.status(404).json({ error: 'Route not found' });
  }
  res.sendFile(path.join(__dirname, '../DMA/dist/index.html'));
});

// Create server for Vercel
const server = createServer(app);

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM received, shutting down...');
  await mongoose.connection.close();
  server.close(() => process.exit(0));
});

process.on('SIGINT', async () => {
  console.log('\n🛑 SIGINT received, shutting down...');
  await mongoose.connection.close();
  server.close(() => process.exit(0));
});

module.exports = app;