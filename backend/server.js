const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const multer = require('multer');
const cron = require('node-cron');
const passport = require('passport');
require('dotenv').config();

// Import services
const liveCache = require('./services/liveCache');
const Sermon = require('./models/Sermon');

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
const PORT = process.env.PORT || 5000;

// Rate limiting
const limiter = rateLimit({
  windowMs: process.env.NODE_ENV === 'production' ? 15 * 60 * 1000 : 60 * 60 * 1000, // 15 minutes in production, 1 hour in development
  max: process.env.NODE_ENV === 'production' ? 100 : 5000, // limit each IP to 100 requests per windowMs in production, 5000 in development
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(limiter);
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Passport middleware
app.use(passport.initialize());

// Multer configuration for file uploads
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
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for videos
  },
  fileFilter: (req, file, cb) => {
    // Accept video files
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed!'), false);
    }
  }
});

// Separate multer for thumbnails
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
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for thumbnails
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads/videos', express.static(path.join(__dirname, 'uploads/videos')));
app.use('/uploads/videos/thumbnails', express.static(path.join(__dirname, 'uploads/videos/thumbnails')));
app.use('/uploads/podcasts', express.static(path.join(__dirname, 'uploads/podcasts')));
app.use('/uploads/thumbnails', express.static(path.join(__dirname, 'uploads/thumbnails')));

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, '../DMA/dist')));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dove-ministries', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Function to check and update ended live broadcasts
async function checkAndUpdateEndedBroadcasts() {
  try {
    console.log('🔍 Checking for ended live broadcasts...');

    const now = Date.now();
    const broadcastsToUpdate = await Sermon.find({
      type: 'live_broadcast',
      isLive: true,
      $or: [
        { broadcastEndTime: { $exists: true } }, // Already has end time
        { broadcastStartTime: { $lt: new Date(now - 4 * 60 * 60 * 1000) } } // Started more than 4 hours ago
      ]
    });

    let updatedCount = 0;
    for (const broadcast of broadcastsToUpdate) {
      // Check if it should be considered ended
      let shouldEnd = false;

      if (broadcast.broadcastEndTime) {
        shouldEnd = true;
      } else if (broadcast.broadcastStartTime) {
        const startTime = new Date(broadcast.broadcastStartTime).getTime();
        const durationMs = now - startTime;
        const durationHours = durationMs / (1000 * 60 * 60);

        if (durationHours > 4) {
          shouldEnd = true;
        }
      }

      if (shouldEnd) {
        broadcast.isLive = false;

        // Set broadcastEndTime if not already set
        if (!broadcast.broadcastEndTime) {
          broadcast.broadcastEndTime = new Date();
        }

        // Calculate duration if not already set
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
        updatedCount++;
        console.log(`✅ Ended broadcast: ${broadcast.title} (${broadcast._id})`);
      }
    }

    if (updatedCount > 0) {
      console.log(`✅ Updated ${updatedCount} ended live broadcasts`);
    } else {
      console.log('✅ No ended live broadcasts found');
    }
  } catch (error) {
    console.error('❌ Error checking ended broadcasts:', error);
  }
}

// Initialize caches and schedule updates
console.log('🚀 Initializing caches...');
liveCache.updateLiveCache(); // Initial live update
checkAndUpdateEndedBroadcasts(); // Initial check for ended broadcasts

// Schedule cache updates and broadcast checks every 30 minutes
cron.schedule("*/30 * * * *", async () => {
  console.log('⏰ Running scheduled cache update...');
  await liveCache.updateLiveCache();
  await checkAndUpdateEndedBroadcasts();
  console.log('✅ Scheduled cache update complete');
});

// Add health check endpoint for cache status
app.get('/api/cache-status', (req, res) => {
  res.json(liveCache.getCacheStatus());
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

// Thumbnail upload route
app.post('/api/upload/thumbnail', thumbnailUpload.single('thumbnailFile'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const thumbnailUrl = `/uploads/thumbnails/${req.file.filename}`;
    res.json({
      message: 'Thumbnail uploaded successfully',
      thumbnailUrl: thumbnailUrl
    });
  } catch (error) {
    console.error('Thumbnail upload error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' ? 'Something went wrong!' : err.message
  });
});

// Catch all handler: send back React's index.html file for client-side routing
app.get('*', (req, res) => {
  // For API routes that don't exist, return 404
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return res.status(404).json({ error: 'Route not found' });
  }
  // For client-side routes, serve index.html
  res.sendFile(path.join(__dirname, '../DMA/dist/index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Server accessible at: http://0.0.0.0:${PORT}`);
  console.log(`Network access: http://192.168.100.43:${PORT}`);
});

module.exports = app;