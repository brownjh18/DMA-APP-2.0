const express = require('express');
const Sermon = require('../models/Sermon');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const liveCache = require('../services/liveCache');

const router = express.Router();

// Get YouTube live video ID
router.get('/live', async (req, res) => {
  try {
    const cache = liveCache.getLiveCache();
    res.json(cache);
  } catch (error) {
    console.error('Get live video ID error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all live broadcasts and recordings
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      type = 'live_broadcast'
    } = req.query;

    const query = { type };

    if (status === 'live') {
      query.isLive = true;
    } else if (status === 'recorded') {
      query.isLive = false;
      query.audioUrl = { $exists: true, $ne: '' };
    }

    const broadcasts = await Sermon.find(query)
      .populate('createdBy', 'name')
      .sort({ broadcastStartTime: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Sermon.countDocuments(query);

    res.json({
      broadcasts: broadcasts.map(broadcast => ({
        id: broadcast._id,
        title: broadcast.title,
        speaker: broadcast.speaker,
        description: broadcast.description,
        thumbnailUrl: broadcast.thumbnailUrl || '/bible.JPG',
        isLive: broadcast.isLive,
        streamUrl: broadcast.streamUrl,
        audioUrl: broadcast.audioUrl,
        broadcastStartTime: broadcast.broadcastStartTime,
        broadcastEndTime: broadcast.broadcastEndTime,
        recordingStatus: broadcast.recordingStatus,
        duration: broadcast.duration,
        viewCount: broadcast.viewCount,
        status: broadcast.isPublished ? 'published' : 'draft'
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Live broadcasts fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single live broadcast
router.get('/:id', async (req, res) => {
  try {
    const broadcast = await Sermon.findOne({
      _id: req.params.id,
      type: 'live_broadcast'
    }).populate('createdBy', 'name');

    if (!broadcast) {
      return res.status(404).json({ error: 'Live broadcast not found' });
    }

    res.json({
      broadcast: {
        id: broadcast._id,
        title: broadcast.title,
        speaker: broadcast.speaker,
        description: broadcast.description,
        thumbnailUrl: broadcast.thumbnailUrl || '/bible.JPG',
        isLive: broadcast.isLive,
        streamUrl: broadcast.streamUrl,
        audioUrl: broadcast.audioUrl,
        broadcastStartTime: broadcast.broadcastStartTime,
        broadcastEndTime: broadcast.broadcastEndTime,
        recordingStatus: broadcast.recordingStatus,
        duration: broadcast.duration,
        viewCount: broadcast.viewCount,
        status: broadcast.isPublished ? 'published' : 'draft'
      }
    });
  } catch (error) {
    console.error('Live broadcast fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Start a live broadcast - temporarily disabled auth for testing
router.post('/start', async (req, res) => {
  try {
    const { title, speaker, description, thumbnailUrl, streamUrl } = req.body;

    // Handle demo users - set default user when auth is disabled
    let createdBy;
    if (req.user && req.user.id.startsWith('demo-')) {
      // For demo users, find or create the admin user
      let adminUser = await User.findOne({ email: process.env.ADMIN_EMAIL });
      if (!adminUser) {
        adminUser = new User({
          name: 'Admin User',
          email: process.env.ADMIN_EMAIL,
          password: process.env.ADMIN_PASSWORD,
          role: 'admin'
        });
        await adminUser.save();
      }
      createdBy = adminUser._id;
    } else if (req.user) {
      createdBy = req.user.id;
    } else {
      // For testing without auth, create or find a default admin user
      let adminUser = await User.findOne({ email: process.env.ADMIN_EMAIL || 'admin@doveministriesafrica.org' });
      if (!adminUser) {
        adminUser = new User({
          name: 'Admin User',
          email: process.env.ADMIN_EMAIL || 'admin@doveministriesafrica.org',
          password: process.env.ADMIN_PASSWORD || 'admin123',
          role: 'admin'
        });
        await adminUser.save();
      }
      createdBy = adminUser._id;
    }

    // End any currently live broadcasts by this user
    await Sermon.updateMany(
      { createdBy: createdBy, isLive: true, type: 'live_broadcast' },
      { isLive: false, broadcastEndTime: new Date() }
    );

    const broadcast = new Sermon({
      title,
      speaker,
      description,
      thumbnailUrl: thumbnailUrl || '/bible.JPG',
      streamUrl,
      type: 'live_broadcast',
      isLive: true,
      broadcastStartTime: new Date(),
      recordingStatus: 'recording',
      isPublished: true,
      createdBy: createdBy
    });

    await broadcast.save();
    await broadcast.populate('createdBy', 'name');

    // Start recording the live stream
    if (streamUrl) {
      try {
        const uploadPath = path.join(__dirname, '../uploads/podcasts');
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }

        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const outputFile = path.join(uploadPath, `live-recording-${broadcast._id}-${uniqueSuffix}.mp3`);

        const ffmpeg = spawn('ffmpeg', [
          '-i', streamUrl,
          '-acodec', 'libmp3lame',
          '-ab', '128k',
          '-f', 'mp3',
          outputFile
        ]);

        broadcast.recordingPid = ffmpeg.pid;
        broadcast.audioUrl = `/uploads/podcasts/${path.basename(outputFile)}`;
        await broadcast.save();

        console.log(`Started recording for broadcast ${broadcast._id} with PID ${ffmpeg.pid}`);

        // Handle recording process events
        ffmpeg.on('error', async (error) => {
          console.error(`Recording error for broadcast ${broadcast._id}:`, error);
          await Sermon.findByIdAndUpdate(broadcast._id, { recordingStatus: 'failed' });
        });

        ffmpeg.on('close', async (code) => {
          console.log(`Recording process for broadcast ${broadcast._id} exited with code ${code}`);
          if (code === 0) {
            // Recording completed successfully
            await Sermon.findByIdAndUpdate(broadcast._id, { recordingStatus: 'completed' });
          } else {
            await Sermon.findByIdAndUpdate(broadcast._id, { recordingStatus: 'failed' });
          }
        });

      } catch (recordingError) {
        console.error('Failed to start recording:', recordingError);
        broadcast.recordingStatus = 'failed';
        await broadcast.save();
      }
    }

    res.status(201).json({
      message: 'Live broadcast started successfully',
      broadcast: {
        id: broadcast._id,
        title: broadcast.title,
        speaker: broadcast.speaker,
        description: broadcast.description,
        thumbnailUrl: broadcast.thumbnailUrl,
        isLive: broadcast.isLive,
        streamUrl: broadcast.streamUrl,
        broadcastStartTime: broadcast.broadcastStartTime
      }
    });
  } catch (error) {
    console.error('Start live broadcast error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Stop a live broadcast - temporarily disabled auth for testing
router.post('/:id/stop', async (req, res) => {
  try {
    // Handle demo users - set default user when auth is disabled
    let createdBy;
    if (req.user && req.user.id.startsWith('demo-')) {
      // For demo users, find the admin user
      let adminUser = await User.findOne({ email: process.env.ADMIN_EMAIL });
      if (!adminUser) {
        return res.status(404).json({ error: 'Admin user not found' });
      }
      createdBy = adminUser._id;
    } else if (req.user) {
      createdBy = req.user.id;
    } else {
      // For testing without auth, create or find a default admin user
      let adminUser = await User.findOne({ email: process.env.ADMIN_EMAIL || 'admin@doveministriesafrica.org' });
      if (!adminUser) {
        adminUser = new User({
          name: 'Admin User',
          email: process.env.ADMIN_EMAIL || 'admin@doveministriesafrica.org',
          password: process.env.ADMIN_PASSWORD || 'admin123',
          role: 'admin'
        });
        await adminUser.save();
      }
      createdBy = adminUser._id;
    }

    const broadcast = await Sermon.findOne({
      _id: req.params.id,
      type: 'live_broadcast',
      createdBy: createdBy
    });

    if (!broadcast) {
      return res.status(404).json({ error: 'Live broadcast not found' });
    }

    // Stop the recording process if it's running
    if (broadcast.recordingPid) {
      try {
        process.kill(broadcast.recordingPid, 'SIGTERM');
        console.log(`Stopped recording process ${broadcast.recordingPid} for broadcast ${broadcast._id}`);
      } catch (killError) {
        console.warn(`Could not kill recording process ${broadcast.recordingPid}:`, killError);
      }
      broadcast.recordingPid = undefined;
    }

    broadcast.isLive = false;
    broadcast.broadcastEndTime = new Date();

    // Calculate duration from start time to end time
    if (broadcast.broadcastStartTime) {
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

    res.json({
      message: 'Live broadcast stopped successfully',
      broadcast: {
        id: broadcast._id,
        isLive: broadcast.isLive,
        broadcastEndTime: broadcast.broadcastEndTime
      }
    });
  } catch (error) {
    console.error('Stop live broadcast error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload recording for a broadcast - temporarily disabled auth for testing
router.post('/:id/recording', [
  multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/podcasts');
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'live-recording-' + uniqueSuffix + path.extname(file.originalname));
      }
    }),
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('audio/')) {
        cb(null, true);
      } else {
        cb(new Error('Only audio files are allowed!'), false);
      }
    }
  }).single('audioFile')
], async (req, res) => {
  try {
    // Handle demo users - set default user when auth is disabled
    let createdBy;
    if (req.user && req.user.id.startsWith('demo-')) {
      // For demo users, find the admin user
      let adminUser = await User.findOne({ email: process.env.ADMIN_EMAIL });
      if (!adminUser) {
        return res.status(404).json({ error: 'Admin user not found' });
      }
      createdBy = adminUser._id;
    } else if (req.user) {
      createdBy = req.user.id;
    } else {
      // For testing without auth, create or find a default admin user
      let adminUser = await User.findOne({ email: process.env.ADMIN_EMAIL || 'admin@doveministriesafrica.org' });
      if (!adminUser) {
        adminUser = new User({
          name: 'Admin User',
          email: process.env.ADMIN_EMAIL || 'admin@doveministriesafrica.org',
          password: process.env.ADMIN_PASSWORD || 'admin123',
          role: 'admin'
        });
        await adminUser.save();
      }
      createdBy = adminUser._id;
    }

    const broadcast = await Sermon.findOne({
      _id: req.params.id,
      type: 'live_broadcast',
      createdBy: createdBy
    });

    if (!broadcast) {
      return res.status(404).json({ error: 'Live broadcast not found' });
    }

    let audioUrl = '';
    let duration = req.body.duration || '00:00';

    // Handle uploaded file
    if (req.file) {
      audioUrl = `/uploads/podcasts/${req.file.filename}`;

      // Try to get audio duration using ffmpeg
      try {
        const audioPath = path.join(__dirname, '../uploads/podcasts', req.file.filename);
        const ffmpeg = require('fluent-ffmpeg');
        const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
        const ffprobePath = require('@ffprobe-installer/ffprobe').path;

        ffmpeg.setFfmpegPath(ffmpegPath);
        ffmpeg.setFfprobePath(ffprobePath);

        const getAudioDuration = (audioPath) => {
          return new Promise((resolve, reject) => {
            ffmpeg(audioPath)
              .ffprobe((err, data) => {
                if (err) {
                  console.warn('Could not get audio duration:', err);
                  resolve(duration); // Use provided duration as fallback
                  return;
                }

                const totalSeconds = Math.floor(data.format.duration || 0);
                const hours = Math.floor(totalSeconds / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);
                const seconds = totalSeconds % 60;

                let formattedDuration = '';
                if (hours > 0) {
                  formattedDuration = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                } else {
                  formattedDuration = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                }

                resolve(formattedDuration);
              });
          });
        };

        duration = await getAudioDuration(audioPath);
      } catch (durationError) {
        console.warn('Could not get audio duration:', durationError);
        // Keep the provided duration
      }
    } else {
      // Fallback to body audioUrl if no file uploaded
      audioUrl = req.body.audioUrl || '';
    }

    broadcast.audioUrl = audioUrl;
    broadcast.duration = duration;
    broadcast.recordingStatus = 'completed';
    broadcast.type = 'podcast'; // Convert to podcast once recorded
    broadcast.date = broadcast.broadcastEndTime || new Date(); // Set date for podcast sorting

    await broadcast.save();
    res.json({
      message: 'Recording uploaded successfully',
      broadcast: {
        id: broadcast._id,
        audioUrl: broadcast.audioUrl,
        duration: broadcast.duration,
        recordingStatus: broadcast.recordingStatus,
        type: broadcast.type
      }
    });
  } catch (error) {
    console.error('Upload recording error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update live broadcast - temporarily disabled auth for testing
router.put('/:id', [
  multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/thumbnails');
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'thumbnailFile-' + uniqueSuffix + path.extname(file.originalname));
      }
    }),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for thumbnails
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed!'), false);
      }
    }
  }).single('thumbnailFile')
], async (req, res) => {
  try {
    const { title, speaker, description, thumbnailUrl, streamUrl, isLive, isPublished } = req.body;

    // Handle demo users - set default user when auth is disabled
    let createdBy;
    if (req.user && req.user.id.startsWith('demo-')) {
      // For demo users, find the admin user
      let adminUser = await User.findOne({ email: process.env.ADMIN_EMAIL });
      if (!adminUser) {
        return res.status(404).json({ error: 'Admin user not found' });
      }
      createdBy = adminUser._id;
    } else if (req.user) {
      createdBy = req.user.id;
    } else {
      // For testing without auth, create or find a default admin user
      let adminUser = await User.findOne({ email: process.env.ADMIN_EMAIL || 'admin@doveministriesafrica.org' });
      if (!adminUser) {
        adminUser = new User({
          name: 'Admin User',
          email: process.env.ADMIN_EMAIL || 'admin@doveministriesafrica.org',
          password: process.env.ADMIN_PASSWORD || 'admin123',
          role: 'admin'
        });
        await adminUser.save();
      }
      createdBy = adminUser._id;
    }

    // Find the broadcast first to check ownership (skip check if createdBy not set for testing)
    const existingBroadcast = await Sermon.findOne({
      _id: req.params.id,
      type: 'live_broadcast',
      ...(createdBy ? { createdBy: createdBy } : {}) // Only check ownership if createdBy is set
    });

    if (!existingBroadcast) {
      return res.status(404).json({ error: 'Live broadcast not found' });
    }

    // First find the current broadcast to check its live status
    const currentBroadcast = await Sermon.findOne({
      _id: req.params.id,
      type: 'live_broadcast',
      createdBy: createdBy
    });

    if (!currentBroadcast) {
      return res.status(404).json({ error: 'Live broadcast not found' });
    }

    const updateData = {
      title,
      speaker,
      description,
      streamUrl,
      isLive
    };

    // Handle thumbnail upload
    if (req.file) {
      updateData.thumbnailUrl = `/uploads/thumbnails/${req.file.filename}`;
    } else if (thumbnailUrl) {
      updateData.thumbnailUrl = thumbnailUrl;
    }

    // Handle publish/draft status
    if (isPublished !== undefined) {
      updateData.isPublished = isPublished;
    }

    // If stopping the broadcast, set end time
    if (isLive === false && currentBroadcast.isLive) {
      updateData.broadcastEndTime = new Date();
    }

    const broadcast = await Sermon.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('createdBy', 'name');

    if (!broadcast) {
      return res.status(404).json({ error: 'Live broadcast not found' });
    }

    res.json({
      message: 'Live broadcast updated successfully',
      broadcast: {
        id: broadcast._id,
        title: broadcast.title,
        speaker: broadcast.speaker,
        description: broadcast.description,
        thumbnailUrl: broadcast.thumbnailUrl,
        isLive: broadcast.isLive,
        streamUrl: broadcast.streamUrl,
        broadcastStartTime: broadcast.broadcastStartTime,
        broadcastEndTime: broadcast.broadcastEndTime
      }
    });
  } catch (error) {
    console.error('Update live broadcast error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete live broadcast
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Handle demo users
    let createdBy;
    if (req.user.id.startsWith('demo-')) {
      // For demo users, find the admin user
      let adminUser = await User.findOne({ email: process.env.ADMIN_EMAIL });
      if (!adminUser) {
        return res.status(404).json({ error: 'Admin user not found' });
      }
      createdBy = adminUser._id;
    } else {
      createdBy = req.user.id;
    }

    const broadcast = await Sermon.findOneAndDelete({
      _id: req.params.id,
      type: 'live_broadcast',
      createdBy: createdBy
    });

    if (!broadcast) {
      return res.status(404).json({ error: 'Live broadcast not found' });
    }

    // Stop recording process if it's still running
    if (broadcast.recordingPid) {
      try {
        process.kill(broadcast.recordingPid, 'SIGTERM');
        console.log(`Stopped recording process ${broadcast.recordingPid} for deleted broadcast ${broadcast._id}`);
      } catch (killError) {
        console.warn(`Could not kill recording process ${broadcast.recordingPid}:`, killError);
      }
    }

    res.json({ message: 'Live broadcast deleted successfully' });
  } catch (error) {
    console.error('Delete live broadcast error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin trigger to refresh live status
router.post('/live/refresh', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await liveCache.updateLiveCache();
    res.json({ message: 'Live status refreshed successfully' });
  } catch (error) {
    console.error('Refresh live status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;