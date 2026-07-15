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
const cloudStorage = require('../services/cloudStorage');

// Try to load ffmpeg/ffprobe if available (for local development only)
let ffmpeg = null;
try {
  ffmpeg = require('fluent-ffmpeg');
  const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
  const ffprobePath = require('@ffprobe-installer/ffprobe').path;
  ffmpeg.setFfmpegPath(ffmpegPath);
  ffmpeg.setFfprobePath(ffprobePath);
} catch (error) {
  console.warn('ffmpeg/ffprobe not available (running in production mode)');
}

// Check Cloudinary configuration
const isCloudStorageConfigured = cloudStorage.isConfigured();
console.log('☁️ Cloud Storage configured for podcasts:', isCloudStorageConfigured);

// Multer configuration - use memory storage when Cloudinary is configured
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'audioFile' || file.fieldname === 'thumbnailFile' || file.fieldname === 'audio' || file.fieldname === 'thumbnail') {
      cb(null, true);
    } else {
      cb(null, true);
    }
  }
});

// Helper function to upload buffer to Cloudinary
async function uploadBufferToCloudinary(buffer, fieldName, mimeType) {
  // Create a temp file path for the upload
  const tempPath = path.join(__dirname, '../uploads/temp');
  if (!fs.existsSync(tempPath)) {
    fs.mkdirSync(tempPath, { recursive: true });
  }
  
  const ext = path.extname(mimeType || '.file') || '.file';
  const tempFile = path.join(tempPath, `${fieldName}-${Date.now()}${ext}`);
  
  // Write buffer to temp file
  fs.writeFileSync(tempFile, buffer);
  
  try {
    let result;
    if (fieldName.includes('audio')) {
      result = await cloudStorage.uploadFile(tempFile, {
        resource_type: 'video',
        folder: 'dove-ministries/podcasts'
      });
    } else {
      result = await cloudStorage.uploadFile(tempFile, {
        resource_type: 'image',
        folder: 'dove-ministries/thumbnails',
        transformation: [{ width: 800, height: 600, crop: 'fill' }]
      });
    }
    
    // Clean up temp file
    try { fs.unlinkSync(tempFile); } catch (e) {}
    
    return result.secure_url;
  } catch (error) {
    // Clean up temp file
    try { fs.unlinkSync(tempFile); } catch (e) {}
    throw error;
  }
}

// Function to get audio duration from buffer (if ffmpeg available)
const getAudioDurationFromBuffer = (buffer, mimeType) => {
  return new Promise((resolve, reject) => {
    if (!ffmpeg) {
      console.warn('ffmpeg not available, returning default duration');
      return resolve('00:00');
    }
    
    const tempPath = path.join(__dirname, '../uploads/temp');
    if (!fs.existsSync(tempPath)) {
      fs.mkdirSync(tempPath, { recursive: true });
    }
    
    const ext = mimeType ? mimeType.split('/')[1] : 'mp3';
    const tempFile = path.join(tempPath, `audio-${Date.now()}.${ext}`);
    
    fs.writeFileSync(tempFile, buffer);
    
    ffmpeg(tempFile)
      .ffprobe((err, data) => {
        // Clean up temp file
        try { fs.unlinkSync(tempFile); } catch (e) {}
        
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
      id: podcast._id, title: podcast.title, speaker: podcast.speaker,
      description: podcast.description, thumbnailUrl: podcast.thumbnailUrl || '/bible.JPG',
      publishedAt: podcast.date.toISOString(), duration: podcast.duration || '00:00',
      viewCount: podcast.viewCount.toString(), audioUrl: podcast.audioUrl,
      status: podcast.isPublished ? 'published' : 'draft', listens: podcast.viewCount,
      broadcastStartTime: podcast.broadcastStartTime ? podcast.broadcastStartTime.toISOString() : null
    }));

    res.json({ podcasts: formattedPodcasts, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('Podcasts fetch error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
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
    res.status(500).json({ error: 'Server error', details: error.message });
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
    res.status(500).json({ error: 'Server error', details: error.message });
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

    if (req.files && req.files.length > 0) {
      // Handle audio file
      const audioFile = req.files.find(file => 
        file.fieldname === 'audioFile' || file.fieldname === 'audio'
      );
      
      if (audioFile) {
        console.log('☁️ Processing audio file:', audioFile.fieldname, 'size:', audioFile.size);
        
        if (isCloudStorageConfigured) {
          // Upload to Cloudinary from memory buffer
          try {
            audioUrl = await uploadBufferToCloudinary(audioFile.buffer, 'audio', audioFile.mimetype);
            console.log('☁️ Audio uploaded to Cloudinary:', audioUrl);
          } catch (cloudError) {
            console.error('☁️ Cloudinary upload failed, using local storage:', cloudError.message);
            const uploadPath = path.join(__dirname, '../uploads/podcasts');
            if (!fs.existsSync(uploadPath)) {
              fs.mkdirSync(uploadPath, { recursive: true });
            }
            const audioFilename = `podcast-audio-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(audioFile.originalname)}`;
            const localPath = path.join(uploadPath, audioFilename);
            fs.writeFileSync(localPath, audioFile.buffer);
            audioUrl = `/uploads/podcasts/${audioFilename}`;
          }
        } else {
          // Save to local storage
          const uploadPath = path.join(__dirname, '../uploads/podcasts');
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
          const audioFilename = `podcast-audio-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(audioFile.originalname)}`;
          const localPath = path.join(uploadPath, audioFilename);
          fs.writeFileSync(localPath, audioFile.buffer);
          audioUrl = `/uploads/podcasts/${audioFilename}`;
        }

        // Get duration from buffer
        try {
          duration = await getAudioDurationFromBuffer(audioFile.buffer, audioFile.mimetype);
          console.log('☁️ Audio duration:', duration);
        } catch (durationError) {
          console.warn('Could not get audio duration:', durationError.message);
          duration = '00:00';
        }
      }

      // Handle thumbnail file
      const thumbnailFile = req.files.find(file => 
        file.fieldname === 'thumbnailFile' || file.fieldname === 'thumbnail'
      );
      
      if (thumbnailFile) {
        console.log('☁️ Processing thumbnail file:', thumbnailFile.fieldname, 'size:', thumbnailFile.size);
        
        if (isCloudStorageConfigured) {
          try {
            thumbnailUrl = await uploadBufferToCloudinary(thumbnailFile.buffer, 'thumbnail', thumbnailFile.mimetype);
            console.log('☁️ Thumbnail uploaded to Cloudinary:', thumbnailUrl);
          } catch (cloudError) {
            console.error('☁️ Cloudinary thumbnail upload failed:', cloudError.message);
            const uploadPath = path.join(__dirname, '../uploads/thumbnails');
            if (!fs.existsSync(uploadPath)) {
              fs.mkdirSync(uploadPath, { recursive: true });
            }
            const thumbnailFilename = `podcast-thumbnail-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(thumbnailFile.originalname)}`;
            const localPath = path.join(uploadPath, thumbnailFilename);
            fs.writeFileSync(localPath, thumbnailFile.buffer);
            thumbnailUrl = `/uploads/thumbnails/${thumbnailFilename}`;
          }
        } else {
          const uploadPath = path.join(__dirname, '../uploads/thumbnails');
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
          const thumbnailFilename = `podcast-thumbnail-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(thumbnailFile.originalname)}`;
          const localPath = path.join(uploadPath, thumbnailFilename);
          fs.writeFileSync(localPath, thumbnailFile.buffer);
          thumbnailUrl = `/uploads/thumbnails/${thumbnailFilename}`;
        }
      }
    }

    console.log('POST /api/podcasts - Creating with audioUrl:', audioUrl, 'thumbnailUrl:', thumbnailUrl);

    const podcastData = {
      title: req.body.title, speaker: req.body.speaker, description: req.body.description,
      series: req.body.category, duration: duration, audioUrl: audioUrl, thumbnailUrl: thumbnailUrl,
      isPublished: req.body.status === 'published', type: 'podcast',
      createdBy: req.user?.id || null
    };

    const podcast = new Sermon(podcastData);
    await podcast.save();
    console.log('POST /api/podcasts - Podcast saved successfully with ID:', podcast._id);

    const formattedPodcast = {
      id: podcast._id, title: podcast.title, speaker: podcast.speaker,
      description: podcast.description, thumbnailUrl: podcast.thumbnailUrl,
      publishedAt: podcast.date.toISOString(), duration: podcast.duration,
      viewCount: podcast.viewCount.toString(), audioUrl: podcast.audioUrl,
      status: podcast.isPublished ? 'published' : 'draft', listens: podcast.viewCount
    };

    res.status(201).json({ message: 'Podcast created successfully', podcast: formattedPodcast });
  } catch (error) {
    console.error('Podcast creation error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
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

    if (req.files && req.files.length > 0) {
      const audioFile = req.files.find(file => 
        file.fieldname === 'audioFile' || file.fieldname === 'audio'
      );
      
      if (audioFile) {
        if (isCloudStorageConfigured) {
          try {
            audioUrl = await uploadBufferToCloudinary(audioFile.buffer, 'audio', audioFile.mimetype);
            console.log('☁️ Audio uploaded to Cloudinary:', audioUrl);
          } catch (cloudError) {
            console.error('☁️ Cloudinary upload failed:', cloudError.message);
            audioUrl = `/uploads/podcasts/${audioFile.filename}`;
          }
        } else {
          const uploadPath = path.join(__dirname, '../uploads/podcasts');
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
          const localPath = path.join(uploadPath, audioFile.filename);
          fs.writeFileSync(localPath, audioFile.buffer);
          audioUrl = `/uploads/podcasts/${audioFile.filename}`;
        }

        try { duration = await getAudioDurationFromBuffer(audioFile.buffer, audioFile.mimetype); } 
        catch (e) { duration = '00:00'; }
      }

      const thumbnailFile = req.files.find(file => 
        file.fieldname === 'thumbnailFile' || file.fieldname === 'thumbnail'
      );
      
      if (thumbnailFile) {
        if (isCloudStorageConfigured) {
          try {
            thumbnailUrl = await uploadBufferToCloudinary(thumbnailFile.buffer, 'thumbnail', thumbnailFile.mimetype);
            console.log('☁️ Thumbnail uploaded to Cloudinary:', thumbnailUrl);
          } catch (cloudError) {
            console.error('☁️ Cloudinary thumbnail upload failed:', cloudError.message);
            thumbnailUrl = `/uploads/thumbnails/${thumbnailFile.filename}`;
          }
        } else {
          const uploadPath = path.join(__dirname, '../uploads/thumbnails');
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
          const localPath = path.join(uploadPath, thumbnailFile.filename);
          fs.writeFileSync(localPath, thumbnailFile.buffer);
          thumbnailUrl = `/uploads/thumbnails/${thumbnailFile.filename}`;
        }
      }
    }

    // Allow explicit thumbnailUrl from body (e.g., empty string to clear)
    if (req.body.thumbnailUrl !== undefined && !(req.files && req.files.some(f => f.fieldname === 'thumbnailFile' || f.fieldname === 'thumbnail'))) {
      thumbnailUrl = req.body.thumbnailUrl;
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

    res.json({ message: 'Podcast updated successfully', podcast: formattedPodcast });
  } catch (error) {
    console.error('Podcast update error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
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
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Delete podcast
router.delete('/:id', async (req, res) => {
  try {
    const podcast = await Sermon.findOne({ _id: req.params.id, type: 'podcast' });
    
    if (!podcast) {
      return res.status(404).json({ error: 'Podcast not found' });
    }

    // Delete files from Cloudinary if configured
    if (isCloudStorageConfigured) {
      const filesToDelete = [];
      if (podcast.audioUrl && podcast.audioUrl.includes('cloudinary.com')) {
        filesToDelete.push(podcast.audioUrl);
      }
      if (podcast.thumbnailUrl && podcast.thumbnailUrl.includes('cloudinary.com')) {
        filesToDelete.push(podcast.thumbnailUrl);
      }
      
      if (filesToDelete.length > 0) {
        console.log('Deleting', filesToDelete.length, 'file(s) from Cloudinary...');
        await cloudStorage.deleteFiles(filesToDelete);
      }
    }

    // Delete the podcast from database
    await Sermon.findByIdAndDelete(req.params.id);

    res.json({ message: 'Podcast deleted successfully' });
  } catch (error) {
    console.error('Podcast deletion error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

module.exports = router;
