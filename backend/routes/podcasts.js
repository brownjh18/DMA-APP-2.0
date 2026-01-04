const express = require('express');
console.log('🎵 Podcasts routes module loaded');
const { body, validationResult } = require('express-validator');
const Sermon = require('../models/Sermon');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const notificationService = require('../services/notificationService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;

// Set ffmpeg and ffprobe paths
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

// Function to get audio duration using ffmpeg
const getAudioDuration = (audioPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg(audioPath)
      .ffprobe((err, data) => {
        if (err) {
          console.error('Error getting audio metadata:', err);
          reject(err);
          return;
        }

        // Get duration in seconds and format as mm:ss or hh:mm:ss
        const totalSeconds = Math.floor(data.format.duration || 0);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        let duration = '';
        if (hours > 0) {
          duration = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
          duration = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }

        resolve(duration);
      });
  });
};

// Multer configuration for podcast uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = path.join(__dirname, '../uploads');
    if (file.fieldname === 'audioFile') {
      uploadPath = path.join(uploadPath, 'podcasts');
    } else if (file.fieldname === 'thumbnailFile') {
      uploadPath = path.join(uploadPath, 'thumbnails');
    }

    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    if (file.fieldname === 'thumbnailFile') {
      cb(null, 'thumbnail-' + uniqueSuffix + path.extname(file.originalname));
    } else {
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'audioFile') {
      if (file.mimetype.startsWith('audio/')) {
        cb(null, true);
      } else {
        cb(new Error('Only audio files are allowed!'), false);
      }
    } else if (file.fieldname === 'thumbnailFile') {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed!'), false);
      }
    } else {
      // Allow other fields (like title, description) to pass through
      cb(null, true);
    }
  }
});

const router = express.Router();

// Get all podcasts (sermons with audio)
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      speaker,
      published = true
    } = req.query;

    // Filter for podcasts
    const query = { type: 'podcast' };

    // Allow unpublished podcasts if explicitly requested (for admin use)
    if (published !== 'false') {
      query.isPublished = published;
    }

    // Add search filters
    if (search) {
      query.$text = { $search: search };
    }
    if (speaker) {
      query.speaker = new RegExp(speaker, 'i');
    }

    const podcasts = await Sermon.find(query)
      .populate({ path: 'createdBy', select: 'name' })
      .sort({ date: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Sermon.countDocuments(query);

    // Transform to podcast format
    const formattedPodcasts = podcasts.map(podcast => ({
      id: podcast._id,
      title: podcast.title,
      speaker: podcast.speaker,
      description: podcast.description,
      thumbnailUrl: podcast.thumbnailUrl || '/bible.JPG',
      publishedAt: podcast.date.toISOString(),
      duration: podcast.duration || '00:00',
      viewCount: podcast.viewCount.toString(),
      audioUrl: podcast.audioUrl,
      status: podcast.isPublished ? 'published' : 'draft',
      listens: podcast.viewCount,
      broadcastStartTime: podcast.broadcastStartTime ? podcast.broadcastStartTime.toISOString() : null
    }));

    res.json({
      podcasts: formattedPodcasts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Podcasts fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get saved podcasts
router.get('/saved', authenticateToken, async (req, res) => {
  try {
    console.log('GET /api/podcasts/saved - Request received');

    const user = req.user;

    if (user.id === 'demo-admin-id') {
      console.log('GET /api/podcasts/saved - Demo user detected, returning empty list');
      return res.json({ savedPodcasts: [] });
    }

    const userDoc = await User.findById(user.id).populate('savedPodcasts');
    if (!userDoc) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Filter to only podcasts (in case sermons were also saved)
    const savedPodcasts = userDoc.savedPodcasts.filter(item => item.type === 'podcast');

    const formattedSavedPodcasts = savedPodcasts.map(podcast => ({
      id: podcast._id,
      title: podcast.title,
      speaker: podcast.speaker,
      description: podcast.description,
      thumbnailUrl: podcast.thumbnailUrl || '/bible.JPG',
      publishedAt: podcast.date.toISOString(),
      duration: podcast.duration || '00:00',
      viewCount: podcast.viewCount.toString(),
      audioUrl: podcast.audioUrl,
      status: podcast.isPublished ? 'published' : 'draft',
      listens: podcast.viewCount
    }));

    console.log('GET /api/podcasts/saved - Returning saved podcasts');
    res.json({ savedPodcasts: formattedSavedPodcasts });
  } catch (error) {
    console.error('Get saved podcasts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single podcast
router.get('/:id', async (req, res) => {
  try {
    const podcast = await Sermon.findOne({
      _id: req.params.id,
      type: 'podcast'
    }).populate('createdBy', 'name');

    if (!podcast) {
      return res.status(404).json({ error: 'Podcast not found' });
    }

    // Increment listen count only for actual plays, not page refreshes
    // Check if this is a legitimate listen request (not just metadata fetch)
    const isListenRequest = req.query.listen === 'true' || req.headers['x-requested-with'] === 'listen';

    if (isListenRequest) {
      // Simple rate limiting: don't increment more than once per minute per podcast
      const now = Date.now();
      const lastListen = podcast.lastListenIncrement || 0;
      const timeSinceLastListen = now - lastListen;

      // Only increment if it's been more than 60 seconds since last listen
      if (timeSinceLastListen > 60000) {
        podcast.viewCount += 1;
        podcast.lastListenIncrement = now;
        await podcast.save();
      }
    }

    // Transform to podcast format
    const formattedPodcast = {
      id: podcast._id,
      title: podcast.title,
      speaker: podcast.speaker,
      description: podcast.description,
      thumbnailUrl: podcast.thumbnailUrl || '/bible.JPG',
      publishedAt: podcast.date.toISOString(),
      duration: podcast.duration || '00:00',
      viewCount: podcast.viewCount.toString(),
      audioUrl: podcast.audioUrl,
      status: podcast.isPublished ? 'published' : 'draft',
      listens: podcast.viewCount,
      broadcastStartTime: podcast.broadcastStartTime ? podcast.broadcastStartTime.toISOString() : null
    };

    res.json({ podcast: formattedPodcast });
  } catch (error) {
    console.error('Podcast fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new podcast (moderator+) - temporarily disabled auth for testing
router.post('/', upload.any(), async (req, res) => {
  try {
    console.log('POST /api/podcasts - Request received');
    console.log('POST /api/podcasts - Content-Type:', req.headers['content-type']);
    console.log('POST /api/podcasts - Body keys:', Object.keys(req.body || {}));
    console.log('POST /api/podcasts - Files:', req.files ? req.files.length : 'none');

    // Log the actual body content
    if (req.body) {
      console.log('POST /api/podcasts - Body content:', JSON.stringify(req.body, null, 2));
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let audioUrl = req.body.audioUrl || '';
    let thumbnailUrl = req.body.thumbnailUrl || '/bible.JPG';
    let duration = req.body.duration || '00:00';

    // Handle uploaded files (with upload.any(), files is an array)
    if (req.files && req.files.length > 0) {
      const audioFile = req.files.find(file => file.fieldname === 'audioFile');
      if (audioFile) {
        audioUrl = `/uploads/podcasts/${audioFile.filename}`;

        // Get audio duration
        try {
          const audioPath = path.join(__dirname, '../uploads/podcasts', audioFile.filename);
          duration = await getAudioDuration(audioPath);
        } catch (durationError) {
          console.warn('Could not get audio duration:', durationError);
          duration = '00:00';
        }
      }

      const thumbnailFile = req.files.find(file => file.fieldname === 'thumbnailFile');
      if (thumbnailFile) {
        thumbnailUrl = `/uploads/thumbnails/${thumbnailFile.filename}`;
      }
    }

    console.log('POST /api/podcasts - Creating podcast with:', {
      title: req.body.title,
      speaker: req.body.speaker,
      audioUrl,
      thumbnailUrl
    });

    const podcastData = {
      title: req.body.title,
      speaker: req.body.speaker,
      description: req.body.description,
      series: req.body.category,
      duration: duration,
      audioUrl: audioUrl,
      thumbnailUrl: thumbnailUrl,
      isPublished: req.body.status === 'published',
      type: 'podcast',
      createdBy: req.user?.id || null // Handle case where auth is disabled
    };

    const podcast = new Sermon(podcastData);
    console.log('POST /api/podcasts - Saving podcast...');
    await podcast.save();
    console.log('POST /api/podcasts - Podcast saved successfully with ID:', podcast._id);

    // Create notifications for all users about the new podcast
    try {
      await notificationService.createContentNotification(
        'podcast',
        podcast._id,
        `New Podcast: ${podcast.title}`,
        `A new podcast "${podcast.title}" by ${podcast.speaker} is now available for listening.`,
        {
          url: `/podcast-player?id=${podcast._id}`,
          speaker: podcast.speaker,
          duration: podcast.duration
        }
      );
    } catch (notificationError) {
      console.error('Error creating podcast notification:', notificationError);
      // Don't fail the request if notification creation fails
    }

    // Skip populate if createdBy is null
    if (podcast.createdBy) {
      await podcast.populate('createdBy', 'name');
    }

    // Transform to podcast format
    const formattedPodcast = {
      id: podcast._id,
      title: podcast.title,
      speaker: podcast.speaker,
      description: podcast.description,
      thumbnailUrl: podcast.thumbnailUrl,
      publishedAt: podcast.date.toISOString(),
      duration: podcast.duration,
      viewCount: podcast.viewCount.toString(),
      audioUrl: podcast.audioUrl,
      status: podcast.isPublished ? 'published' : 'draft',
      listens: podcast.viewCount
    };

    console.log('POST /api/podcasts - Sending success response');
    res.status(201).json({
      message: 'Podcast created successfully',
      podcast: formattedPodcast
    });
  } catch (error) {
    console.error('Podcast creation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update podcast (moderator+) - temporarily disabled auth for testing
router.put('/:id', (req, res, next) => {
  // Check if this is a FormData request (multipart/form-data)
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    // Use multer for file uploads
    upload.any()(req, res, (err) => {
      if (err) {
        console.error('Multer error in PUT:', err);
        return res.status(400).json({ error: 'File upload error: ' + err.message });
      }
      next();
    });
  } else {
    // Skip multer for JSON requests
    next();
  }
}, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Find existing podcast
    const existingPodcast = await Sermon.findOne({ _id: req.params.id, type: 'podcast' });
    if (!existingPodcast) {
      return res.status(404).json({ error: 'Podcast not found' });
    }

    let audioUrl = existingPodcast.audioUrl || '';
    let thumbnailUrl = existingPodcast.thumbnailUrl || '/bible.JPG';
    let duration = req.body.duration || existingPodcast.duration || '00:00';

    // Handle uploaded files (only if FormData was sent, files is an array with upload.any())
    if (req.files && req.files.length > 0) {
      const audioFile = req.files.find(file => file.fieldname === 'audioFile');
      if (audioFile) {
        audioUrl = `/uploads/podcasts/${audioFile.filename}`;

        // Get audio duration
        try {
          const audioPath = path.join(__dirname, '../uploads/podcasts', audioFile.filename);
          duration = await getAudioDuration(audioPath);
        } catch (durationError) {
          console.warn('Could not get audio duration:', durationError);
          duration = '00:00';
        }
      }

      const thumbnailFile = req.files.find(file => file.fieldname === 'thumbnailFile');
      if (thumbnailFile) {
        thumbnailUrl = `/uploads/thumbnails/${thumbnailFile.filename}`;
      }
    }

    const updateData = {
      title: req.body.title,
      speaker: req.body.speaker,
      description: req.body.description,
      series: req.body.category,
      duration: duration,
      audioUrl: audioUrl,
      thumbnailUrl: thumbnailUrl,
      isPublished: req.body.status === 'published'
    };

    const podcast = await Sermon.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name');

    if (!podcast) {
      return res.status(404).json({ error: 'Podcast not found' });
    }

    // Transform to podcast format
    const formattedPodcast = {
      id: podcast._id,
      title: podcast.title,
      speaker: podcast.speaker,
      description: podcast.description,
      thumbnailUrl: podcast.thumbnailUrl,
      publishedAt: podcast.date.toISOString(),
      duration: podcast.duration,
      viewCount: podcast.viewCount.toString(),
      audioUrl: podcast.audioUrl,
      status: podcast.isPublished ? 'published' : 'draft',
      listens: podcast.viewCount
    };

    res.json({
      message: 'Podcast updated successfully',
      podcast: formattedPodcast
    });
  } catch (error) {
    console.error('Podcast update error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Save podcast
router.post('/:id/save', authenticateToken, async (req, res) => {
  try {
    console.log('POST /api/podcasts/:id/save - Request received');
    
    const user = req.user;
    const podcastId = req.params.id;

    if (user.id === 'demo-admin-id') {
      console.log('POST /api/podcasts/:id/save - Demo user detected, returning demo message');
      return res.json({ message: 'Demo user - podcast save/unsave not persisted' });
    }

    const userDoc = await User.findById(user.id);
    if (!userDoc) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if podcast exists
    const podcast = await Sermon.findOne({ _id: podcastId, type: 'podcast' });
    if (!podcast) {
      return res.status(404).json({ error: 'Podcast not found' });
    }

    // Check if already saved
    if (userDoc.savedPodcasts.includes(podcastId)) {
      return res.json({ message: 'Podcast already saved' });
    }

    // Add to saved podcasts
    userDoc.savedPodcasts.push(podcastId);
    await userDoc.save();

    console.log('POST /api/podcasts/:id/save - Podcast saved successfully');
    res.json({ message: 'Podcast saved successfully' });
  } catch (error) {
    console.error('Podcast save error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Unsave podcast
router.post('/:id/unsave', authenticateToken, async (req, res) => {
  try {
    console.log('POST /api/podcasts/:id/unsave - Request received');
    
    const user = req.user;
    const podcastId = req.params.id;

    if (user.id === 'demo-admin-id') {
      console.log('POST /api/podcasts/:id/unsave - Demo user detected, returning demo message');
      return res.json({ message: 'Demo user - podcast save/unsave not persisted' });
    }

    const userDoc = await User.findById(user.id);
    if (!userDoc) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if podcast is saved
    if (!userDoc.savedPodcasts.includes(podcastId)) {
      return res.json({ message: 'Podcast not in saved list' });
    }

    // Remove from saved podcasts
    userDoc.savedPodcasts = userDoc.savedPodcasts.filter(id => id.toString() !== podcastId);
    await userDoc.save();

    console.log('POST /api/podcasts/:id/unsave - Podcast unsaved successfully');
    res.json({ message: 'Podcast unsaved successfully' });
  } catch (error) {
    console.error('Podcast unsave error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

 // Delete podcast (moderator+) - temporarily disabled auth for testing
router.delete('/:id', async (req, res) => {
  try {
    const podcast = await Sermon.findByIdAndDelete(req.params.id);

    if (!podcast) {
      return res.status(404).json({ error: 'Podcast not found' });
    }

    res.json({ message: 'Podcast deleted successfully' });
  } catch (error) {
    console.error('Podcast deletion error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;