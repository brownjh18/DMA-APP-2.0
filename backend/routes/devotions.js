const express = require('express');
const mongoose = require('mongoose');
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
      query = {
        $or: [
          { status: { $ne: 'publish' } },
          { status: { $exists: false }, isPublished: false }
        ]
      };
    } else if (published === 'true' || published === undefined) {
      // Default: show only published devotions
      query = {
        $or: [
          { status: 'publish' },
          { status: { $exists: false }, isPublished: { $ne: false } }
        ]
      };
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
      $or: [
        { status: 'publish' },
        { status: { $exists: false }, isPublished: { $ne: false } }
      ],
      isFeatured: true
    })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({ devotions });
  } catch (error) {
    console.error('Featured devotions fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get saved devotions for the logged-in user (must be before /:id)
router.get('/saved', authenticateToken, async (req, res) => {
  try {
    console.log('GET /api/devotions/saved - Request received for user:', req.user.id);
    
    // Handle demo users - they use localStorage, not server-side storage
    if (req.user.id.startsWith('demo-')) {
      console.log('Demo user detected, returning empty list for demo users');
      return res.json({ savedDevotions: [] });
    }
    
    const userDoc = await User.findById(req.user.id).populate({
      path: 'savedDevotions',
      model: Devotion
    });

    if (!userDoc) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`Returning ${userDoc.savedDevotions.length} saved devotions`);
    res.json({ savedDevotions: userDoc.savedDevotions });
  } catch (error) {
    console.error('Get saved devotions error:', error);
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
  body('author').optional().trim(),
  body('tags').optional().isArray(),
  body('status').optional().isString(),
  body('isFeatured').optional().isBoolean(),
  body('thumbnailUrl').optional().isString()
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
  body('status').optional().isString(),
  body('isFeatured').optional().isBoolean(),
  body('thumbnailUrl').optional().isString()
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

// Save/unsave a devotion
router.post('/:id/save', authenticateToken, async (req, res) => {
  try {
    console.log('POST /api/devotions/:id/save - Request received for devotion:', req.params.id);
    
    // Handle demo users - they use localStorage, not server-side storage
    if (req.user.id.startsWith('demo-')) {
      console.log('Demo user detected, save not persisted to server');
      return res.json({ 
        message: 'Demo user - devotion save/unsave handled locally',
        saved: true
      });
    }
    
    const devotion = await Devotion.findById(req.params.id);

    if (!devotion) {
      return res.status(404).json({ error: 'Devotion not found' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user already saved this devotion (convert to ObjectId for proper comparison)
    const devotionId = new mongoose.Types.ObjectId(req.params.id);
    const alreadySaved = user.savedDevotions.some(id => id.equals(devotionId));

    if (alreadySaved) {
      // Unsave: remove from savedDevotions
      user.savedDevotions = user.savedDevotions.filter(id => id.toString() !== req.params.id);
    } else {
      // Save: add to savedDevotions
      user.savedDevotions.push(req.params.id);
    }

    await user.save();

    res.json({
      message: alreadySaved ? 'Devotion unsaved' : 'Devotion saved',
      saved: !alreadySaved
    });
  } catch (error) {
    console.error('Save devotion error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
