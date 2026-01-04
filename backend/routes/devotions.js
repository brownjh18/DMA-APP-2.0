const express = require('express');
const { body, validationResult } = require('express-validator');
const Devotion = require('../models/Devotion');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all devotions (public)
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      featured,
      published
    } = req.query;

    // Build query based on published parameter
    let query = {};
    if (published === 'all') {
      // Show all devotions
      query = {};
    } else if (published === 'false') {
      // Show only drafts
      query = { isPublished: false };
    } else if (published === 'true' || published === undefined) {
      // Default: show only published devotions
      query = { isPublished: true };
    }

    if (search) {
      query.$text = { $search: search };
    }
    if (featured === 'true') {
      query.isFeatured = true;
    }

    console.log('Devotions query:', query);
    console.log('Request query params:', req.query);

    const devotions = await Devotion.find(query)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Devotion.countDocuments(query);

    console.log(`Found ${devotions.length} devotions out of ${total} total`);

    res.json({
      devotions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Devotions fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get featured devotions
router.get('/featured', async (req, res) => {
  try {
    const devotions = await Devotion.find({
      isPublished: true,
      isFeatured: true
    })
      .populate('createdBy', 'name')
      .sort({ date: -1 })
      .limit(5);

    res.json({ devotions });
  } catch (error) {
    console.error('Featured devotions fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single devotion
router.get('/:id', async (req, res) => {
  try {
    const devotion = await Devotion.findById(req.params.id)
      .populate('createdBy', 'name');

    if (!devotion) {
      return res.status(404).json({ error: 'Devotion not found' });
    }

    res.json({ devotion });
  } catch (error) {
    console.error('Devotion fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create devotion (moderator+)
router.post('/', [
  authenticateToken,
  requireAdmin,
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('scripture').trim().isLength({ min: 1 }).withMessage('Scripture is required'),
  body('content').trim().isLength({ min: 1 }).withMessage('Content is required'),
  body('reflection').trim().isLength({ min: 1 }).withMessage('Reflection is required'),
  body('prayer').trim().isLength({ min: 1 }).withMessage('Prayer is required'),
  body('date').isISO8601().withMessage('Valid date required'),
  body('author').optional().trim(),
  body('category').optional().isIn(['faith-foundation', 'love-relationships', 'spiritual-growth']),
  body('tags').optional().isArray(),
  body('isPublished').optional().isBoolean(),
  body('isFeatured').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Handle demo users
    let createdBy;
    if (req.user.id.startsWith('demo-')) {
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
    } else {
      createdBy = req.user.id;
    }

    const devotionData = {
      ...req.body,
      createdBy: createdBy
    };

    const devotion = new Devotion(devotionData);
    await devotion.save();

    await devotion.populate('createdBy', 'name');

    // Create notifications for all users about the new devotion
    try {
      await notificationService.createContentNotification(
        'devotion',
        devotion._id,
        `New Devotion: ${devotion.title}`,
        `A new daily devotion "${devotion.title}" is now available for reading.`,
        {
          url: `/full-devotion?id=${devotion._id}`,
          scripture: devotion.scripture,
          date: devotion.date
        }
      );
    } catch (notificationError) {
      console.error('Error creating devotion notification:', notificationError);
      // Don't fail the request if notification creation fails
    }

    res.status(201).json({
      message: 'Devotion created successfully',
      devotion
    });
  } catch (error) {
    console.error('Devotion creation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update devotion (moderator+)
router.put('/:id', [
  authenticateToken,
  requireAdmin,
  body('title').optional().trim().isLength({ min: 1 }).withMessage('Title cannot be empty'),
  body('scripture').optional().trim().isLength({ min: 1 }).withMessage('Scripture cannot be empty'),
  body('content').optional().trim().isLength({ min: 1 }).withMessage('Content cannot be empty'),
  body('reflection').optional().trim().isLength({ min: 1 }).withMessage('Reflection cannot be empty'),
  body('prayer').optional().trim().isLength({ min: 1 }).withMessage('Prayer cannot be empty'),
  body('date').optional().isISO8601().withMessage('Valid date required'),
  body('category').optional().isIn(['faith-foundation', 'love-relationships', 'spiritual-growth']),
  body('isPublished').optional().isBoolean(),
  body('isFeatured').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Get the old devotion to check if it was just published
    const oldDevotion = await Devotion.findById(req.params.id);

    // Prevent demo users from changing createdBy
    const updateData = { ...req.body };
    if (req.user.id.startsWith('demo-')) {
      delete updateData.createdBy;
    }

    const devotion = await Devotion.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('createdBy', 'name');

    if (!devotion) {
      return res.status(404).json({ error: 'Devotion not found' });
    }
    res.json({
      message: 'Devotion updated successfully',
      devotion
    });
  } catch (error) {
    console.error('Devotion update error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete devotion (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const devotion = await Devotion.findByIdAndDelete(req.params.id);

    if (!devotion) {
      return res.status(404).json({ error: 'Devotion not found' });
    }

    res.json({ message: 'Devotion deleted successfully' });
  } catch (error) {
    console.error('Devotion deletion error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;