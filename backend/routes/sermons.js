const express = require('express');
const { body, validationResult } = require('express-validator');
const Sermon = require('../models/Sermon');
const { authenticateToken, requireModerator } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Multer configuration for video uploads
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/videos'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'sermon-video-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const videoUpload = multer({
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

// Get all sermons (public)
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

    const query = { isPublished: published };

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

    const sermons = await Sermon.find(query)
      .populate('createdBy', 'name')
      .sort({ date: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Sermon.countDocuments(query);

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
    res.status(500).json({ error: 'Server error' });
  }
});

// Get featured sermons
router.get('/featured', async (req, res) => {
  try {
    const sermons = await Sermon.find({
      isPublished: true,
      isFeatured: true
    })
      .populate('createdBy', 'name')
      .sort({ date: -1 })
      .limit(5);

    res.json({ sermons });
  } catch (error) {
    console.error('Featured sermons fetch error:', error);
    res.status(500).json({ error: 'Server error' });
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
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload video for sermon
router.post('/upload-video', authenticateToken, requireModerator, videoUpload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    const videoUrl = `/uploads/videos/${req.file.filename}`;

    res.json({
      message: 'Video uploaded successfully',
      videoUrl: videoUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({ error: 'Server error during video upload' });
  }
});

// Create new sermon (moderator+)
router.post('/', [
  authenticateToken,
  requireModerator,
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('speaker').trim().isLength({ min: 1 }).withMessage('Speaker is required'),
  body('date').optional().isISO8601().withMessage('Valid date required'),
  body('description').optional().trim(),
  body('scripture').optional().trim(),
  body('videoUrl').optional().isURL().withMessage('Valid video URL required'),
  body('audioUrl').optional().isURL().withMessage('Valid audio URL required'),
  body('youtubeId').optional().trim(),
  body('thumbnailUrl').optional().isURL().withMessage('Valid thumbnail URL required'),
  body('duration').optional().trim(),
  body('series').optional().trim(),
  body('tags').optional().isArray(),
  body('isPublished').optional().isBoolean(),
  body('isFeatured').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const sermonData = {
      ...req.body,
      createdBy: req.user.id
    };

    const sermon = new Sermon(sermonData);
    await sermon.save();

    await sermon.populate('createdBy', 'name');

    res.status(201).json({
      message: 'Sermon created successfully',
      sermon
    });
  } catch (error) {
    console.error('Sermon creation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update sermon (moderator+)
router.put('/:id', [
  authenticateToken,
  requireModerator,
  body('title').optional().trim().isLength({ min: 1 }).withMessage('Title cannot be empty'),
  body('speaker').optional().trim().isLength({ min: 1 }).withMessage('Speaker cannot be empty'),
  body('date').optional().isISO8601().withMessage('Valid date required'),
  body('videoUrl').optional().isURL().withMessage('Valid video URL required'),
  body('audioUrl').optional().isURL().withMessage('Valid audio URL required'),
  body('thumbnailUrl').optional().isURL().withMessage('Valid thumbnail URL required'),
  body('isPublished').optional().isBoolean(),
  body('isFeatured').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const sermon = await Sermon.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name');

    if (!sermon) {
      return res.status(404).json({ error: 'Sermon not found' });
    }

    res.json({
      message: 'Sermon updated successfully',
      sermon
    });
  } catch (error) {
    console.error('Sermon update error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete sermon (moderator+)
router.delete('/:id', authenticateToken, requireModerator, async (req, res) => {
  try {
    const sermon = await Sermon.findByIdAndDelete(req.params.id);

    if (!sermon) {
      return res.status(404).json({ error: 'Sermon not found' });
    }

    res.json({ message: 'Sermon deleted successfully' });
  } catch (error) {
    console.error('Sermon deletion error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get sermon statistics (admin)
router.get('/admin/stats', authenticateToken, requireModerator, async (req, res) => {
  try {
    const totalSermons = await Sermon.countDocuments();
    const publishedSermons = await Sermon.countDocuments({ isPublished: true });
    const featuredSermons = await Sermon.countDocuments({ isFeatured: true });
    const totalViews = await Sermon.aggregate([
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
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;