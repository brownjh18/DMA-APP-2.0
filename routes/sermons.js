const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const Sermon = require('../models/Sermon');
const User = require('../models/User');
const { authenticateToken, requireAdmin, requireModerator } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudStorage = require('../services/cloudStorage');

// Check if Cloudinary is configured
const isCloudStorage = cloudStorage.isConfigured();

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

const router = express.Router();

// YouTube API configuration
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || 'AIzaSyDBYdCJVQ1FpSXPOHd6xFx4eLLuMUBzjw8';
const YOUTUBE_BASE_URL = 'https://www.googleapis.com/youtube/v3';

// Helper function to extract video ID from URL
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
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

// Helper function to convert ISO 8601 duration to readable format
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
  } else {
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}

// Helper function to fetch YouTube video details
async function fetchYouTubeVideoDetails(videoUrl) {
  try {
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      console.log('Not a valid YouTube URL:', videoUrl);
      return null;
    }

    const response = await fetch(
      `${YOUTUBE_BASE_URL}/videos?id=${videoId}&key=${YOUTUBE_API_KEY}&part=snippet,contentDetails,statistics`
    );

    if (!response.ok) {
      console.error('YouTube API error:', response.status);
      return null;
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      console.log('Video not found on YouTube');
      return null;
    }

    const video = data.items[0];
    const snippet = video.snippet;
    const contentDetails = video.contentDetails;
    const statistics = video.statistics;

    const isLive = snippet.liveBroadcastContent === 'live';
    const parsedDuration = isLive ? null : parseDuration(contentDetails.duration);

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

// Function to get video duration using ffmpeg (if available)
const getVideoDuration = (videoPath) => {
  return new Promise((resolve, reject) => {
    if (!ffmpeg) {
      console.warn('ffmpeg not available, returning default duration');
      return resolve('00:00');
    }
    
    ffmpeg(videoPath)
      .ffprobe((err, data) => {
        if (err) {
          console.error('Error getting video metadata:', err);
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

// Function to generate thumbnail from video (if ffmpeg available)
const generateThumbnail = (videoPath) => {
  return new Promise((resolve, reject) => {
    if (!ffmpeg) {
      console.warn('ffmpeg not available, skipping thumbnail generation');
      return resolve('');
    }
    
    const thumbnailDir = path.join(__dirname, '../uploads/videos/thumbnails');

    // Ensure thumbnails directory exists
    if (!fs.existsSync(thumbnailDir)) {
      fs.mkdirSync(thumbnailDir, { recursive: true });
      console.log('Created thumbnails directory:', thumbnailDir);
    }

    const thumbnailPath = path.join(thumbnailDir, `thumbnail-${Date.now()}.png`);
    console.log('Generating thumbnail to:', thumbnailPath);

    // First get video duration to determine safe seek time
    getVideoDuration(videoPath).then((duration) => {
      // Parse duration (format: "mm:ss" or "h:mm:ss")
      const durationParts = duration.split(':').map(Number);
      let totalSeconds = 0;

      if (durationParts.length === 3) {
        // hh:mm:ss format
        totalSeconds = durationParts[0] * 3600 + durationParts[1] * 60 + durationParts[2];
      } else {
        // mm:ss format
        totalSeconds = durationParts[0] * 60 + durationParts[1];
      }

      // Seek to 10% of video duration, but at least 1 second and at most 30 seconds
      const seekTime = Math.min(Math.max(Math.floor(totalSeconds * 0.1), 1), 30);
      const seekString = `00:00:${seekTime.toString().padStart(2, '0')}`;

      console.log(`Video duration: ${duration} (${totalSeconds}s), seeking to: ${seekString}`);

      ffmpeg(videoPath)
        .seekInput(seekString) // Seek to safe position
        .frames(1) // Extract 1 frame
        .size('640x360') // 16:9 aspect ratio for cover behavior
        .output(thumbnailPath)
        .on('start', (commandLine) => {
          console.log('FFmpeg command: ' + commandLine);
        })
        .on('progress', (progress) => {
          console.log('FFmpeg progress: ' + progress.percent + '% done');
        })
        .on('end', () => {
          console.log('Thumbnail generated successfully:', thumbnailPath);
          if (fs.existsSync(thumbnailPath)) {
            console.log('Thumbnail file exists on disk');
            resolve(`/uploads/videos/thumbnails/${path.basename(thumbnailPath)}`);
          } else {
            console.log('Thumbnail file does NOT exist on disk');
            reject(new Error('Thumbnail file was not created'));
          }
        })
        .on('error', (err) => {
          console.error('Error generating thumbnail:', err);
          reject(err);
        })
        .run();
    }).catch((durationError) => {
      console.warn('Failed to get video duration for thumbnail, using default seek:', durationError.message);
      // Fallback: try to seek to 1 second if duration check fails
      ffmpeg(videoPath)
        .seekInput('00:00:01') // Seek to 1 second as fallback
        .frames(1) // Extract 1 frame
        .size('640x360') // 16:9 aspect ratio for cover behavior
        .output(thumbnailPath)
        .on('start', (commandLine) => {
          console.log('FFmpeg fallback command: ' + commandLine);
        })
        .on('end', () => {
          console.log('Thumbnail generated successfully with fallback:', thumbnailPath);
          if (fs.existsSync(thumbnailPath)) {
            console.log('Thumbnail file exists on disk');
            resolve(`/uploads/videos/thumbnails/${path.basename(thumbnailPath)}`);
          } else {
            console.log('Thumbnail file does NOT exist on disk');
            reject(new Error('Thumbnail file was not created'));
          }
        })
        .on('error', (fallbackErr) => {
          console.error('Error generating thumbnail with fallback:', fallbackErr);
          reject(fallbackErr);
        })
        .run();
    });
  });
};

// Multer configuration - use Cloudinary if configured, otherwise local storage
let videoUpload;
if (isCloudStorage) {
  console.log('☁️ Using Cloudinary for video uploads');
  videoUpload = cloudStorage.uploadVideo;
} else {
  console.log('💾 Using local storage for video uploads');
  // Local storage configuration
  const videoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      const videoDir = path.join(__dirname, '../uploads/videos');
      if (!fs.existsSync(videoDir)) {
        fs.mkdirSync(videoDir, { recursive: true });
      }
      cb(null, videoDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'sermon-video-' + uniqueSuffix + path.extname(file.originalname));
    }
  });
  
  videoUpload = multer({
    storage: videoStorage,
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB limit
    },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('video/')) {
        cb(null, true);
      } else {
        cb(new Error('Only video files are allowed!'), false);
      }
    }
  });
}

// Get all sermons (public, but allow unpublished for admin)
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      speaker,
      series,
      featured,
      published = true
    } = req.query;

    // Include documents without type field (backward compatibility) or with type: 'sermon', exclude podcasts
    const typeFilter = {
      $and: [
        { $or: [{ type: { $exists: false } }, { type: 'sermon' }] },
        { type: { $ne: 'podcast' } }
      ]
    };

    // Handle published filter
    let query;
    if (published === 'false') {
      // Show only unpublished sermons
      query = { ...typeFilter, isPublished: false };
    } else if (published === 'all') {
      // Show all sermons (published and unpublished)
      query = typeFilter;
    } else {
      // Default: show only published sermons
      query = { ...typeFilter, isPublished: true };
    }

    // Add search filters
    if (search) {
      query.$text = { $search: search };
    }
    if (speaker) {
      query.speaker = new RegExp(speaker, 'i');
    }
    if (series) {
      query.series = new RegExp(series, 'i');
    }
    if (featured === 'true') {
      query.isFeatured = true;
    }

    console.log('Sermons query:', JSON.stringify(query, null, 2));

    const sermons = await Sermon.find(query)
      .populate('createdBy', 'name')
      .sort({ date: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Sermon.countDocuments(query);

    console.log(`Found ${sermons.length} sermons (total: ${total})`);

    res.json({
      sermons,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Sermons fetch error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Get featured sermons
router.get('/featured', async (req, res) => {
  try {
    const sermons = await Sermon.find({
      isPublished: true,
      isFeatured: true,
      $and: [
        { $or: [{ type: { $exists: false } }, { type: 'sermon' }] },
        { type: { $ne: 'podcast' } }
      ]
    })
      .populate('createdBy', 'name')
      .sort({ date: -1 })
      .limit(5);

    res.json({ sermons });
  } catch (error) {
    console.error('Featured sermons fetch error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Get saved sermons for the logged-in user (must be before /:id)
router.get('/saved', authenticateToken, async (req, res) => {
  try {
    console.log('GET /api/sermons/saved - Request received for user:', req.user.id);
    
    // Handle demo users - they use localStorage, not server-side storage
    if (req.user.id.startsWith('demo-')) {
      console.log('Demo user detected, returning empty list for demo users');
      return res.json({ savedSermons: [] });
    }
    
    const userDoc = await User.findById(req.user.id).populate({
      path: 'savedSermons',
      model: Sermon,
      match: { $and: [{ $or: [{ type: { $exists: false } }, { type: 'sermon' }] }, { type: { $ne: 'podcast' } }] }
    });

    if (!userDoc) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Filter to only sermons (in case podcasts were also saved)
    const savedSermons = userDoc.savedSermons.filter(item => item && item.type !== 'podcast');

    console.log(`Returning ${savedSermons.length} saved sermons`);
    res.json({ savedSermons });
  } catch (error) {
    console.error('Get saved sermons error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Get single sermon
router.get('/:id', async (req, res) => {
  try {
    const sermon = await Sermon.findById(req.params.id)
      .populate('createdBy', 'name');

    if (!sermon) {
      return res.status(404).json({ error: 'Sermon not found' });
    }

    // Increment view count
    sermon.viewCount += 1;
    await sermon.save();

    res.json({ sermon });
  } catch (error) {
    console.error('Sermon fetch error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Upload video for sermon
router.post('/upload-video', authenticateToken, videoUpload.single('video'), async (req, res) => {
  console.log('Video upload route called');
  try {
    if (!req.file) {
      console.log('No video file provided');
      return res.status(400).json({ error: 'No video file provided' });
    }

    console.log('Video file received:', req.file.originalname);
    
    let videoUrl = '';
    let thumbnailUrl = '';
    let duration = '00:00';
    
// Helper function to get video duration from Cloudinary with polling
// Cloudinary videos need time to process - longer videos take longer
async function getCloudinaryDuration(publicId, maxRetries = 60, initialDelayMs = 2000) {
  const cloudinary = require('cloudinary').v2;
  let currentDelay = initialDelayMs;
  
  console.log(`🎬 Starting Cloudinary duration polling for: ${publicId}`);
  console.log(`   Max retries: ${maxRetries}, Initial delay: ${initialDelayMs}ms`);
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📊 Fetching duration (attempt ${attempt}/${maxRetries})...`);
      const result = await cloudinary.api.resource(publicId, { resource_type: 'video' });
      
      if (result) {
        // Check if video is still processing (no duration yet)
        if (result.duration === null || result.duration === undefined) {
          console.log(`⏳ Video still processing (attempt ${attempt}/${maxRetries})`);
          console.log(`   Video info: format=${result.format}, bytes=${result.bytes}`);
          
          if (attempt < maxRetries) {
            // Exponential backoff: increase delay up to 10 seconds max
            currentDelay = Math.min(currentDelay * 1.5, 10000);
            console.log(`   Waiting ${currentDelay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, currentDelay));
          }
          continue;
        }
        
        // Duration is available
        const totalSeconds = Math.floor(result.duration);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        let duration = '';
        if (hours > 0) {
          duration = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
          duration = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        console.log(`✅ Cloudinary video ready! Duration: ${duration} (${totalSeconds}s)`);
        console.log(`   Format: ${result.format}, Size: ${(result.bytes / 1024 / 1024).toFixed(2)}MB`);
        return duration;
      } else {
        console.warn(`⚠️ Attempt ${attempt}: No result from Cloudinary`);
      }
    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed:`, error.message);
      
      // Check if it's a resource not found error
      if (error.error && error.error.code === 'resource_not_found') {
        console.error(`   Video not found on Cloudinary: ${publicId}`);
        return '00:00';
      }
      
      if (attempt < maxRetries) {
        currentDelay = Math.min(currentDelay * 1.5, 10000);
        await new Promise(resolve => setTimeout(resolve, currentDelay));
      }
    }
  }
  
  console.error(`❌ Failed to get video duration after ${maxRetries} attempts`);
  console.error(`   The video may still be processing on Cloudinary`);
  return '00:00';
}

    if (isCloudStorage) {
      // Video already uploaded to Cloudinary by multer-storage-cloudinary
      // req.file.path contains the Cloudinary URL
      videoUrl = req.file.path;
      console.log('Cloudinary video URL:', videoUrl);
      
      // Generate thumbnail URL using Cloudinary transformation
      let publicId = cloudStorage.extractPublicId(videoUrl);
      console.log('Extracted public ID:', publicId);
      
      // If extraction failed, try to construct public ID manually
      if (!publicId) {
        console.log('Extraction failed, trying manual construction...');
        const match = videoUrl.match(/\/v\d+\/(.+)$/);
        if (match && match[1]) {
          publicId = match[1];
          console.log('Manually extracted public ID:', publicId);
        }
      }
      
      if (publicId) {
        thumbnailUrl = cloudStorage.getVideoThumbnailUrl(publicId);
        console.log('Cloudinary thumbnail URL:', thumbnailUrl);
        
        // Respond immediately — don't block on duration polling
        res.json({
          message: 'Video uploaded successfully',
          videoUrl,
          thumbnailUrl,
          duration: '00:00',
          filename: 'cloud-upload'
        });

        // Duration will be resolved by the sermon creation route's background job
        // No need to poll here — the POST / route handles it after saving

        return;
      } else {
        console.error('❌ Could not extract public ID from Cloudinary URL:', videoUrl);
      }
    } else {
      // Local storage
      videoUrl = `/uploads/videos/${req.file.filename}`;
      const videoPath = req.file.path;
      console.log('Local video path:', videoPath);

      // Respond immediately — process duration and thumbnail asynchronously
      res.json({
        message: 'Video uploaded successfully',
        videoUrl,
        thumbnailUrl: '',
        duration: '00:00',
        filename: req.file.filename
      });

      // Duration will be resolved by the sermon creation route's background job
      // Just generate the thumbnail here
      (async () => {
        try {
          const thumb = await generateThumbnail(videoPath);
          console.log('Thumbnail generated (async):', thumb);
        } catch (e) {
          console.warn('Failed to generate thumbnail:', e.message);
        }
      })();

      return;
    }

    // Fallback — shouldn't reach here
    res.json({
      message: 'Video uploaded successfully',
      videoUrl,
      thumbnailUrl,
      duration,
      filename: isCloudStorage ? 'cloud-upload' : req.file.filename
    });
  } catch (error) {
    console.error('Video upload error:', error);
    
    // Clean up uploaded file if there was an error after upload
    if (!isCloudStorage && req.file) {
      const filePath = path.join(__dirname, '../uploads/videos', req.file.filename);
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log('Cleaned up uploaded file after error:', filePath);
        }
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }
    
    res.status(500).json({ error: 'Server error during video upload', details: error.message });
  }
});

// Create new sermon (admin only)
router.post('/', authenticateToken, requireAdmin, [
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('speaker').trim().isLength({ min: 1 }).withMessage('Speaker is required'),
  body('description').optional().trim(),
  body('scripture').optional().trim(),
  body('date').optional().isISO8601().withMessage('Valid date required'),
  body('duration').optional().trim(),
  body('videoUrl').optional().trim(),
  body('audioUrl').optional().trim(),
  body('youtubeId').optional().trim(),
  body('thumbnailUrl').optional().trim(),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('series').optional().trim(),
  body('isPublished').optional().isBoolean().withMessage('isPublished must be a boolean'),
  body('isFeatured').optional().isBoolean().withMessage('isFeatured must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if the user ID is a valid ObjectId
    let createdBy = null;
    if (req.user && req.user.id) {
      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(req.user.id)) {
        createdBy = req.user.id;
      } else {
        console.warn('Invalid user ID format, setting createdBy to null:', req.user.id);
      }
    }

    let sermonData = {
      ...req.body,
      type: 'sermon',
      createdBy: createdBy
    };

    // Fetch YouTube video details if videoUrl is provided and duration is missing
    if (sermonData.videoUrl && (!sermonData.duration || sermonData.duration === '00:00')) {
      console.log('Fetching YouTube video details for:', sermonData.videoUrl);
      const youtubeDetails = await fetchYouTubeVideoDetails(sermonData.videoUrl);
      
      if (youtubeDetails) {
        console.log('YouTube video details fetched:', youtubeDetails);
        // Only update fields that are not already provided
        if (!sermonData.duration || sermonData.duration === '00:00') {
          sermonData.duration = youtubeDetails.duration || '00:00';
        }
        if (!sermonData.viewCount || sermonData.viewCount === 0) {
          sermonData.viewCount = youtubeDetails.viewCount;
        }
        if (!sermonData.thumbnailUrl) {
          sermonData.thumbnailUrl = youtubeDetails.thumbnailUrl;
        }
        if (!sermonData.date && youtubeDetails.publishedAt) {
          sermonData.date = youtubeDetails.publishedAt;
        }
        // Save description from YouTube if not provided
        if (!sermonData.description && youtubeDetails.description) {
          sermonData.description = youtubeDetails.description;
        }
        // Set isLive flag so the cron job can find and update it later
        if (youtubeDetails.isLive) {
          sermonData.isLive = true;
        }
      }
    }

    console.log('Creating sermon with data:', sermonData);

    try {
      const sermon = new Sermon(sermonData);
      await sermon.save();

      await sermon.populate('createdBy', 'name');

      console.log('Sermon created successfully:', sermon._id);

      // For uploaded (non-YouTube) videos with no duration, fetch it in the background
      const videoUrl = sermon.videoUrl || '';
      const isUploadedVideo = videoUrl && !videoUrl.includes('youtube.com') && !videoUrl.includes('youtu.be') && !videoUrl.includes('youtube-nocookie.com');
      if (isUploadedVideo && (!sermon.duration || sermon.duration === '00:00')) {
        const updateDuration = async () => {
          try {
            let dur = null;
            if (videoUrl.includes('cloudinary.com') || videoUrl.includes('res.cloudinary.com')) {
              const publicId = cloudStorage.extractPublicId(videoUrl);
              if (publicId) {
                // Quick single attempt — don't wait for processing
                const cloudinary = require('cloudinary').v2;
                const result = await cloudinary.api.resource(publicId, { resource_type: 'video' });
                if (result && result.duration != null) {
                  const totalSeconds = Math.floor(result.duration);
                  const h = Math.floor(totalSeconds / 3600);
                  const m = Math.floor((totalSeconds % 3600) / 60);
                  const s = totalSeconds % 60;
                  dur = h > 0
                    ? `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
                    : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                }
              }
            } else {
              const localPath = path.join(__dirname, '..', videoUrl);
              if (fs.existsSync(localPath)) {
                dur = await getVideoDuration(localPath);
              }
            }
            if (dur && dur !== '00:00') {
              await Sermon.findByIdAndUpdate(sermon._id, { duration: dur });
              console.log(`✅ Sermon "${sermon.title}" duration updated to ${dur}`);
            } else {
              console.log(`⏳ Sermon "${sermon.title}" video not ready yet — run /api/sermons/fix-durations later`);
            }
          } catch (e) {
            console.warn('Failed to update sermon duration:', e.message);
          }
        };
        updateDuration();
      }

      res.status(201).json({
        message: 'Sermon created successfully',
        sermon
      });
    } catch (saveError) {
      console.error('Sermon save error:', saveError);
      if (saveError.name === 'ValidationError') {
        return res.status(400).json({ error: 'Validation error', details: saveError.message });
      }
      if (saveError.code === 11000) {
        return res.status(400).json({ error: 'Duplicate key error', details: saveError.message });
      }
      res.status(500).json({ error: 'Server error during save', details: saveError.message });
    }
  } catch (error) {
    console.error('Sermon creation error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Update sermon (admin only)
router.put('/:id', authenticateToken, requireAdmin, [
  body('title').optional().trim().isLength({ min: 1 }).withMessage('Title cannot be empty'),
  body('speaker').optional().trim().isLength({ min: 1 }).withMessage('Speaker cannot be empty'),
  body('description').optional().trim(),
  body('scripture').optional().trim(),
  body('date').optional().isISO8601().withMessage('Valid date required'),
  body('duration').optional().trim(),
  body('videoUrl').optional().trim(),
  body('audioUrl').optional().trim(),
  body('youtubeId').optional().trim(),
  body('thumbnailUrl').optional().trim(),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('series').optional().trim(),
  body('isPublished').optional().isBoolean().withMessage('isPublished must be a boolean'),
  body('isFeatured').optional().isBoolean().withMessage('isFeatured must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const oldSermon = await Sermon.findById(req.params.id);
    if (!oldSermon) {
      return res.status(404).json({ error: 'Sermon not found' });
    }

    let updateData = { ...req.body };

    // Fetch YouTube video details if videoUrl is being updated and duration is missing
    if (updateData.videoUrl && updateData.videoUrl !== oldSermon.videoUrl) {
      console.log('Video URL changed, fetching YouTube video details for:', updateData.videoUrl);
      const youtubeDetails = await fetchYouTubeVideoDetails(updateData.videoUrl);
      
      if (youtubeDetails) {
        console.log('YouTube video details fetched:', youtubeDetails);
        // Only update fields that are not already provided in the request
        if (!updateData.duration || updateData.duration === '00:00') {
          updateData.duration = youtubeDetails.duration || '00:00';
        }
        if (!updateData.viewCount || updateData.viewCount === 0) {
          updateData.viewCount = youtubeDetails.viewCount;
        }
        if (!updateData.thumbnailUrl) {
          updateData.thumbnailUrl = youtubeDetails.thumbnailUrl;
        }
        // Update description from YouTube if not provided in the request
        if (!updateData.description && youtubeDetails.description) {
          updateData.description = youtubeDetails.description;
        }
        // Set isLive flag if the YouTube video is currently live
        if (youtubeDetails.isLive) {
          updateData.isLive = true;
        }
      }
    }

    console.log('Updating sermon with data:', updateData);

    try {
      const sermon = await Sermon.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      ).populate('createdBy', 'name');

      if (!sermon) {
        return res.status(404).json({ error: 'Sermon not found' });
      }

      console.log('Sermon updated successfully:', sermon._id);

      res.json({
        message: 'Sermon updated successfully',
        sermon
      });
    } catch (updateError) {
      console.error('Sermon update error:', updateError);
      if (updateError.name === 'ValidationError') {
        return res.status(400).json({ error: 'Validation error', details: updateError.message });
      }
      if (updateError.code === 11000) {
        return res.status(400).json({ error: 'Duplicate key error', details: updateError.message });
      }
      res.status(500).json({ error: 'Server error during update', details: updateError.message });
    }
  } catch (error) {
    console.error('Sermon update error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Delete sermon (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('Attempting to delete sermon:', req.params.id);
    
    const sermon = await Sermon.findById(req.params.id);

    if (!sermon) {
      console.log('Sermon not found for deletion:', req.params.id);
      return res.status(404).json({ error: 'Sermon not found' });
    }

    // Delete files from Cloudinary if configured
    if (isCloudStorage) {
      const filesToDelete = [];
      if (sermon.videoUrl && sermon.videoUrl.includes('cloudinary.com')) {
        filesToDelete.push(sermon.videoUrl);
      }
      if (sermon.thumbnailUrl && sermon.thumbnailUrl.includes('cloudinary.com')) {
        filesToDelete.push(sermon.thumbnailUrl);
      }
      if (sermon.audioUrl && sermon.audioUrl.includes('cloudinary.com')) {
        filesToDelete.push(sermon.audioUrl);
      }
      
      if (filesToDelete.length > 0) {
        console.log('Deleting', filesToDelete.length, 'file(s) from Cloudinary...');
        await cloudStorage.deleteFiles(filesToDelete);
      }
    }

    // Delete the sermon from database
    await Sermon.findByIdAndDelete(req.params.id);

    console.log('Sermon deleted successfully:', req.params.id);

    res.json({ message: 'Sermon deleted successfully' });
  } catch (error) {
    console.error('Sermon deletion error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Toggle publish/draft status (moderator+)
router.patch('/:id/publish', authenticateToken, requireModerator, async (req, res) => {
  try {
    const { isPublished } = req.body;
    
    console.log(`Toggle publish request for sermon ${req.params.id} to ${isPublished}`);
    
    if (typeof isPublished !== 'boolean') {
      return res.status(400).json({ error: 'isPublished must be a boolean value' });
    }

    const sermon = await Sermon.findByIdAndUpdate(
      req.params.id,
      { isPublished },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name');

    if (!sermon) {
      console.log(`Sermon not found for publish toggle: ${req.params.id}`);
      return res.status(404).json({ error: 'Sermon not found' });
    }

    console.log(`Sermon ${req.params.id} publish status updated to:`, isPublished);

    res.json({
      message: `Sermon ${isPublished ? 'published' : 'drafted'} successfully`,
      sermon
    });
  } catch (error) {
    console.error('Sermon publish toggle error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});


// Save/unsave a sermon
router.post('/:id/save', authenticateToken, async (req, res) => {
  try {
    console.log('Save/unsave sermon request for:', req.params.id);
    
    // Handle demo users - they use localStorage, not server-side storage
    if (req.user.id.startsWith('demo-')) {
      console.log('Demo user detected, save not persisted to server');
      return res.json({ 
        message: 'Demo user - sermon save/unsave handled locally',
        saved: true
      });
    }
    
    const sermon = await Sermon.findById(req.params.id);

    if (!sermon) {
      return res.status(404).json({ error: 'Sermon not found' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user already saved this sermon (convert to ObjectId for proper comparison)
    const sermonId = new mongoose.Types.ObjectId(req.params.id);
    const alreadySaved = user.savedSermons.some(id => id.equals(sermonId));

    if (alreadySaved) {
      // Unsave: remove from savedSermons
      user.savedSermons = user.savedSermons.filter(id => id.toString() !== req.params.id);
    } else {
      // Save: add to savedSermons
      user.savedSermons.push(new mongoose.Types.ObjectId(req.params.id));
    }

    await user.save();

    res.json({
      message: alreadySaved ? 'Sermon unsaved' : 'Sermon saved',
      saved: !alreadySaved
    });
  } catch (error) {
    console.error('Save sermon error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Subscribe/unsubscribe to a channel/ministry
router.post('/subscribe/:channel', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const channel = req.params.channel;
    const alreadySubscribed = user.subscriptions.includes(channel);

    if (alreadySubscribed) {
      // Unsubscribe: remove from subscriptions
      user.subscriptions = user.subscriptions.filter(sub => sub !== channel);
    } else {
      // Subscribe: add to subscriptions
      user.subscriptions.push(channel);
    }

    await user.save();

    res.json({
      message: alreadySubscribed ? 'Unsubscribed successfully' : 'Subscribed successfully',
      subscribed: !alreadySubscribed
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});


// Get sermon statistics (admin only)
router.get('/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Use the same filtering logic as the main sermons query to exclude podcasts
    const sermonFilter = {
      $and: [
        { $or: [{ type: { $exists: false } }, { type: 'sermon' }] },
        { type: { $ne: 'podcast' } }
      ]
    };

    const totalSermons = await Sermon.countDocuments(sermonFilter);
    const publishedSermons = await Sermon.countDocuments({ ...sermonFilter, isPublished: true });
    const featuredSermons = await Sermon.countDocuments({ ...sermonFilter, isFeatured: true });
    const totalViews = await Sermon.aggregate([
      { $match: sermonFilter },
      { $group: { _id: null, totalViews: { $sum: '$viewCount' } } }
    ]);

    res.json({
      stats: {
        total: totalSermons,
        published: publishedSermons,
        featured: featuredSermons,
        totalViews: totalViews[0]?.totalViews || 0
      }
    });
  } catch (error) {
    console.error('Sermon stats error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Refresh sermon duration from Cloudinary (admin only)
// Use this if the sermon was created before video processing completed
router.post('/:id/refresh-duration', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const sermon = await Sermon.findById(req.params.id);
    
    if (!sermon) {
      return res.status(404).json({ error: 'Sermon not found' });
    }

    // Check if this is a Cloudinary video
    if (!sermon.videoUrl || !sermon.videoUrl.includes('cloudinary.com')) {
      return res.status(400).json({ error: 'Not a Cloudinary video' });
    }

    console.log(`Refreshing duration for sermon: ${sermon._id}`);
    console.log(`Video URL: ${sermon.videoUrl}`);

    // Extract public ID from Cloudinary URL
    let publicId = cloudStorage.extractPublicId(sermon.videoUrl);
    
    if (!publicId) {
      const match = sermon.videoUrl.match(/\/v\d+\/(.+)$/);
      if (match && match[1]) {
        publicId = match[1];
      }
    }

    if (!publicId) {
      return res.status(400).json({ error: 'Could not extract Cloudinary public ID' });
    }

    console.log(`Extracted public ID: ${publicId}`);

    // Fetch fresh duration from Cloudinary
    const freshDuration = await getCloudinaryDuration(publicId);
    
    console.log(`Fresh duration from Cloudinary: ${freshDuration}`);

    // Update sermon with new duration
    const oldDuration = sermon.duration;
    sermon.duration = freshDuration;
    await sermon.save();

    console.log(`Duration updated: ${oldDuration} -> ${freshDuration}`);

    res.json({
      message: 'Duration refreshed successfully',
      sermon,
      previousDuration: oldDuration,
      newDuration: freshDuration
    });
  } catch (error) {
    console.error('Error refreshing sermon duration:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Update live status for YouTube sermons (admin only)
// Called periodically to check if YouTube live streams have ended
router.post('/update-live-status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const liveSermons = await Sermon.find({
      type: 'sermon',
      videoUrl: { $regex: /youtu\.be\/|youtube\.com\/(watch|live|embed)/i },
      $or: [
        { isLive: true },
        { duration: '00:00' },
        { duration: 'LIVE' }
      ]
    });

    const updated = [];

    for (const sermon of liveSermons) {
      const videoId = extractVideoId(sermon.videoUrl);
      if (!videoId) continue;

      const youtubeDetails = await fetchYouTubeVideoDetails(sermon.videoUrl);
      if (!youtubeDetails) continue;

      const isStillLive = youtubeDetails.isLive;
      const actualDuration = youtubeDetails.duration;

      if (isStillLive) {
        continue;
      }

      // Only save if YouTube returned a real duration
      if (actualDuration) {
        sermon.isLive = false;
        sermon.duration = actualDuration;
        await sermon.save();
        updated.push({
          id: sermon._id.toString(),
          title: sermon.title,
          wasLive: true,
          newDuration: actualDuration
        });
      }
    }

    res.json({ message: 'Live status check complete', updated });
  } catch (error) {
    console.error('Error updating live status:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Fix durations for uploaded videos stuck at 00:00
router.post('/fix-durations', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const sermons = await Sermon.find({
      $or: [
        { duration: '00:00' },
        { duration: { $exists: false } },
        { duration: '' }
      ],
      videoUrl: { $exists: true, $ne: '', $nin: [null] }
    });

    const results = [];
    for (const sermon of sermons) {
      const videoUrl = sermon.videoUrl || '';
      if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) continue;

      try {
        let dur = null;
        if (videoUrl.includes('cloudinary.com') || videoUrl.includes('res.cloudinary.com')) {
          const publicId = cloudStorage.extractPublicId(videoUrl);
          if (publicId) {
            const cloudinary = require('cloudinary').v2;
            const result = await cloudinary.api.resource(publicId, { resource_type: 'video' });
            if (result && result.duration != null) {
              const totalSeconds = Math.floor(result.duration);
              const h = Math.floor(totalSeconds / 3600);
              const m = Math.floor((totalSeconds % 3600) / 60);
              const s = totalSeconds % 60;
              dur = h > 0
                ? `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
                : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
            }
          }
        } else {
          const localPath = path.join(__dirname, '..', videoUrl);
          if (fs.existsSync(localPath)) {
            dur = await getVideoDuration(localPath);
          }
        }
        if (dur && dur !== '00:00') {
          await Sermon.findByIdAndUpdate(sermon._id, { duration: dur });
          results.push({ id: sermon._id, title: sermon.title, duration: dur });
        }
      } catch (e) {
        console.warn(`Failed to fix duration for "${sermon.title}":`, e.message);
      }
    }

    res.json({ message: `Fixed ${results.length} sermon(s)`, results });
  } catch (error) {
    console.error('Fix durations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
