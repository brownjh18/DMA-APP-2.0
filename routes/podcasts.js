const express = require('express');
console.log('🎵 Podcasts routes module loaded');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const Sermon = require('../models/Sermon');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const cloudStorage = require('../services/cloudStorage');

// Set ffmpeg and ffprobe paths
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

// Check Cloudinary configuration
const isCloudStorageConfigured = cloudStorage.isConfigured();
console.log('☁️ Cloud Storage configured for podcasts:', isCloudStorageConfigured);

// Get Cloudinary upload functions
const { uploadAudio, uploadThumbnail } = cloudStorage;

// Multer configuration for local storage (fallback)
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = path.join(__dirname, '../uploads');
    if (file.fieldname === 'audioFile') {
      uploadPath = path.join(uploadPath, 'podcasts');
    } else if (file.fieldname === 'thumbnailFile') {
      uploadPath = path.join(uploadPath, 'thumbnails');
    }
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

// Upload middleware - uses Cloudinary if configured, else local
const upload = multer({
  storage: isCloudStorageConfigured ? undefined : localStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'audioFile' || file.fieldname === 'thumbnailFile') {
      cb(null, true);
    } else {
      cb(null, true);
    }
  }
});

// Helper function to upload file to Cloudinary or local
async function uploadFileToStorage(file, fieldName) {
  if (isCloudStorageConfigured && file) {
    console.log(`☁️ Uploading ${fieldName} to Cloudinary...`);
    try {
      let result;
      if (fieldName === 'audioFile') {
        result = await cloudStorage.uploadFile(file.path, {
          resource_type: 'video',
          folder: 'dove-ministries/podcasts'
        });
      } else {
        result = await cloudStorage.uploadFile(file.path, {
          resource_type: 'image',
          folder: 'dove-ministries/thumbnails'
        });
      }
      console.log(`☁️ ${fieldName} uploaded to Cloudinary:`, result.secure_url);
      return result.secure_url;
    } catch (error) {
      console.error(`☁️ Cloudinary upload failed for ${fieldName}:`, error);
      // Fallback to local URL
      return `/uploads/${fieldName === 'audioFile' ? 'podcasts' : 'thumbnails'}/${file.filename}`;
    }
  } else {
    // Local storage
    return `/uploads/${fieldName === 'audioFile' ? 'podcasts' : 'thumbnails'}/${file.filename}`;
  }
}

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

const router = express.Router();

// Get all podcasts
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, speaker, published = true } = req.query;
    const query = { type: 'podcast' };
    if (published !== 'false') query.isPublished = true;
    if (search) query.$text = { $search: search };
    if (speaker) query.speaker = new RegExp(speaker, 'i');

    const podcasts = await Sermon.find(query)
      .populate({ path: 'createdBy', select: 'name' })
      .sort({ date: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    const total = await Sermon.countDocuments(query);

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

    res.json({ podcasts: formattedPodcasts, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('Podcasts fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get saved podcasts
router.get('/saved', authenticateToken, async (req, res) => {
  try {
    if (req.user.id.startsWith('demo-')) {
      return res.json({ savedPodcasts: [] });
    }
    const userDoc = await User.findById(req.user.id).populate({ path: 'savedPodcasts', model: Sermon });
    if (!userDoc) return res.status(404).json({ error: 'User not found' });
    const savedPodcasts = userDoc.savedPodcasts.filter(item => item && item.type === 'podcast');
    const formattedSavedPodcasts = savedPodcasts.map(podcast => ({
      id: podcast._id, title: podcast.title, speaker: podcast.speaker,
      description: podcast.description, thumbnailUrl: podcast.thumbnailUrl || '/bible.JPG',
      publishedAt: podcast.date.toISOString(), duration: podcast.duration || '00:00',
      viewCount: podcast.viewCount.toString(), audioUrl: podcast.audioUrl,
      status: podcast.isPublished ? 'published' : 'draft', listens: podcast.viewCount
    }));
    res.json({ savedPodcasts: formattedSavedPodcasts });
  } catch (error) {
    console.error('Get saved podcasts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single podcast
router.get('/:id', async (req, res) => {
  try {
    const podcast = await Sermon.findOne({ _id: req.params.id, type: 'podcast' }).populate('createdBy', 'name');
    if (!podcast) return res.status(404).json({ error: 'Podcast not found' });

    const isListenRequest = req.query.listen === 'true' || req.headers['x-requested-with'] === 'listen';
    if (isListenRequest) {
      const now = Date.now();
      const lastListen = podcast.lastListenIncrement || 0;
      if (now - lastListen > 60000) {
        podcast.viewCount += 1;
        podcast.lastListenIncrement = now;
        await podcast.save();
      }
    }

    const formattedPodcast = {
      id: podcast._id, title: podcast.title, speaker: podcast.speaker,
      description: podcast.description, thumbnailUrl: podcast.thumbnailUrl || '/bible.JPG',
      publishedAt: podcast.date.toISOString(), duration: podcast.duration || '00:00',
      viewCount: podcast.viewCount.toString(), audioUrl: podcast.audioUrl,
      status: podcast.isPublished ? 'published' : 'draft', listens: podcast.viewCount,
      broadcastStartTime: podcast.broadcastStartTime ? podcast.broadcastStartTime.toISOString() : null
    };
    res.json({ podcast: formattedPodcast });
  } catch (error) {
    console.error('Podcast fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new podcast
router.post('/', upload.any(), async (req, res) => {
  try {
    console.log('POST /api/podcasts - Request received');
    console.log('☁️ Cloudinary configured:', isCloudStorageConfigured);

    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    let audioUrl = req.body.audioUrl || '';
    let thumbnailUrl = req.body.thumbnailUrl || '/bible.JPG';
    let duration = req.body.duration || '00:00';
    let tempFiles = []; // Track temp files for cleanup

    if (req.files && req.files.length > 0) {
      const audioFile = req.files.find(file => file.fieldname === 'audioFile');
      if (audioFile) {
        tempFiles.push(audioFile.path);
        if (isCloudStorageConfigured) {
          // Upload to Cloudinary
          const result = await cloudStorage.uploadFile(audioFile.path, {
            resource_type: 'video',
            folder: 'dove-ministries/podcasts'
          });
          audioUrl = result.secure_url;
          console.log('☁️ Audio uploaded to Cloudinary:', audioUrl);
        } else {
          audioUrl = `/uploads/podcasts/${audioFile.filename}`;
        }
        try {
          duration = await getAudioDuration(audioFile.path);
        } catch (durationError) {
          console.warn('Could not get audio duration:', durationError);
          duration = '00:00';
        }
      }

      const thumbnailFile = req.files.find(file => file.fieldname === 'thumbnailFile');
      if (thumbnailFile) {
        tempFiles.push(thumbnailFile.path);
        if (isCloudStorageConfigured) {
          const result = await cloudStorage.uploadFile(thumbnailFile.path, {
            resource_type: 'image',
            folder: 'dove-ministries/thumbnails',
            transformation: [{ width: 800, height: 600, crop: 'fill' }]
          });
          thumbnailUrl = result.secure_url;
          console.log('☁️ Thumbnail uploaded to Cloudinary:', thumbnailUrl);
        } else {
          thumbnailUrl = `/uploads/thumbnails/${thumbnailFile.filename}`;
        }
      }
    }

    const podcastData = {
      title: req.body.title, speaker: req.body.speaker, description: req.body.description,
      series: req.body.category, duration: duration, audioUrl: audioUrl, thumbnailUrl: thumbnailUrl,
      isPublished: req.body.status === 'published', type: 'podcast',
      createdBy: req.user?.id || null
    };

    const podcast = new Sermon(podcastData);
    await podcast.save();
    console.log('POST /api/podcasts - Podcast saved successfully with ID:', podcast._id);

    // Cleanup temp files
    for (const tempFile of tempFiles) {
      try { fs.unlinkSync(tempFile); } catch (e) {}
    }

    const formattedPodcast = {
      id: podcast._id, title: podcast.title, speaker: podcast.speaker,
      description: podcast.description, thumbnailUrl: podcast.thumbnailUrl,
      publishedAt: podcast.date.toISOString(), duration: podcast.duration,
      viewCount: podcast.viewCount.toString(), audioUrl: podcast.audioUrl,
      status: podcast.isPublished ? 'published' : 'draft', listens: podcast.viewCount
    };

    const io = req.app.get('io');
    io.emit('podcast:created', { podcast: formattedPodcast });
    res.status(201).json({ message: 'Podcast created successfully', podcast: formattedPodcast });
  } catch (error) {
    console.error('Podcast creation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update podcast
router.put('/:id', (req, res, next) => {
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    upload.any()(req, res, (err) => {
      if (err) return res.status(400).json({ error: 'File upload error: ' + err.message });
      next();
    });
  } else {
    next();
  }
}, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const existingPodcast = await Sermon.findOne({ _id: req.params.id, type: 'podcast' });
    if (!existingPodcast) return res.status(404).json({ error: 'Podcast not found' });

    let audioUrl = existingPodcast.audioUrl || '';
    let thumbnailUrl = existingPodcast.thumbnailUrl || '/bible.JPG';
    let duration = req.body.duration || existingPodcast.duration || '00:00';
    let tempFiles = [];

    if (req.files && req.files.length > 0) {
      const audioFile = req.files.find(file => file.fieldname === 'audioFile');
      if (audioFile) {
        tempFiles.push(audioFile.path);
        if (isCloudStorageConfigured) {
          const result = await cloudStorage.uploadFile(audioFile.path, {
            resource_type: 'video',
            folder: 'dove-ministries/podcasts'
          });
          audioUrl = result.secure_url;
          console.log('☁️ Audio uploaded to Cloudinary:', audioUrl);
        } else {
          audioUrl = `/uploads/podcasts/${audioFile.filename}`;
        }
        try { duration = await getAudioDuration(audioFile.path); } catch (e) { duration = '00:00'; }
      }

      const thumbnailFile = req.files.find(file => file.fieldname === 'thumbnailFile');
      if (thumbnailFile) {
        tempFiles.push(thumbnailFile.path);
        if (isCloudStorageConfigured) {
          const result = await cloudStorage.uploadFile(thumbnailFile.path, {
            resource_type: 'image',
            folder: 'dove-ministries/thumbnails',
            transformation: [{ width: 800, height: 600, crop: 'fill' }]
          });
          thumbnailUrl = result.secure_url;
          console.log('☁️ Thumbnail uploaded to Cloudinary:', thumbnailUrl);
        } else {
          thumbnailUrl = `/uploads/thumbnails/${thumbnailFile.filename}`;
        }
      }
    }

    for (const tempFile of tempFiles) {
      try { fs.unlinkSync(tempFile); } catch (e) {}
    }

    const updateData = {
      title: req.body.title, speaker: req.body.speaker, description: req.body.description,
      series: req.body.category, duration: duration, audioUrl: audioUrl, thumbnailUrl: thumbnailUrl,
      isPublished: req.body.status === 'published'
    };

    const podcast = await Sermon.findByIdAndUpdate(req.params.id, updateData, { new: true }).populate('createdBy', 'name');
    if (!podcast) return res.status(404).json({ error: 'Podcast not found' });

    const formattedPodcast = {
      id: podcast._id, title: podcast.title, speaker: podcast.speaker,
      description: podcast.description, thumbnailUrl: podcast.thumbnailUrl,
      publishedAt: podcast.date.toISOString(), duration: podcast.duration,
      viewCount: podcast.viewCount.toString(), audioUrl: podcast.audioUrl,
      status: podcast.isPublished ? 'published' : 'draft', listens: podcast.viewCount
    };

    const io = req.app.get('io');
    io.emit('podcast:updated', { podcast: formattedPodcast });
    res.json({ message: 'Podcast updated successfully', podcast: formattedPodcast });
  } catch (error) {
    console.error('Podcast update error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Save podcast
router.post('/:id/save', authenticateToken, async (req, res) => {
  try {
    if (!req.params.id || req.params.id === 'undefined' || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid podcast ID' });
    }
    if (req.user.id.startsWith('demo-')) {
      return res.json({ message: 'Demo user - podcast save handled locally', saved: true });
    }
    const userDoc = await User.findById(req.user.id);
    if (!userDoc) return res.status(404).json({ error: 'User not found' });
    const podcast = await Sermon.findOne({ _id: req.params.id, type: 'podcast' });
    if (!podcast) return res.status(404).json({ error: 'Podcast not found' });

    const podcastId = new mongoose.Types.ObjectId(req.params.id);
    const alreadySaved = userDoc.savedPodcasts.some(id => id.equals(podcastId));

    if (alreadySaved) {
      userDoc.savedPodcasts = userDoc.savedPodcasts.filter(id => !id.equals(podcastId));
    } else {
      userDoc.savedPodcasts.push(podcastId);
    }
    await userDoc.save();
    res.json({ message: alreadySaved ? 'Podcast unsaved' : 'Podcast saved', saved: !alreadySaved });
  } catch (error) {
    console.error('Podcast save error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete podcast
router.delete('/:id', async (req, res) => {
  try {
    const podcast = await Sermon.findByIdAndDelete(req.params.id);
    if (!podcast) return res.status(404).json({ error: 'Podcast not found' });
    const io = req.app.get('io');
    io.emit('podcast:deleted', { id: req.params.id });
    res.json({ message: 'Podcast deleted successfully' });
  } catch (error) {
    console.error('Podcast deletion error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
