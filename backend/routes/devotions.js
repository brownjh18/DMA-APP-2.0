const express = require('express');
const { body, validationResult } = require('express-validator');
const Devotion = require('../models/Devotion');
const { authenticateToken, requireModerator } = require('../middleware/auth');

const router = express.Router();

// Get all devotions (public)
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      featured,
      published = true
    } = req.query;

    const query = { isPublished: published };

    if (search) {
      query.$text = { $search: search };
    }
    if (featured === 'true') {
      query.isFeatured = true;
    }

    const devotions = await Devotion.find(query)
      .populate('createdBy', 'name')
      .sort({ date: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Devotion.countDocuments(query);

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
  requireModerator,
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('scripture').trim().isLength({ min: 1 }).withMessage('Scripture is required'),
  body('content').trim().isLength({ min: 1 }).withMessage('Content is required'),
  body('reflection').trim().isLength({ min: 1 }).withMessage('Reflection is required'),
  body('prayer').trim().isLength({ min: 1 }).withMessage('Prayer is required'),
  body('date').isISO8601().withMessage('Valid date required'),
  body('author').optional().trim(),
  body('tags').optional().isArray(),
  body('isPublished').optional().isBoolean(),
  body('isFeatured').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const devotionData = {
      ...req.body,
      createdBy: req.user.id
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
  requireModerator,
  body('title').optional().trim().isLength({ min: 1 }).withMessage('Title cannot be empty'),
  body('scripture').optional().trim().isLength({ min: 1 }).withMessage('Scripture cannot be empty'),
  body('content').optional().trim().isLength({ min: 1 }).withMessage('Content cannot be empty'),
  body('reflection').optional().trim().isLength({ min: 1 }).withMessage('Reflection cannot be empty'),
  body('prayer').optional().trim().isLength({ min: 1 }).withMessage('Prayer cannot be empty'),
  body('date').optional().isISO8601().withMessage('Valid date required'),
  body('isPublished').optional().isBoolean(),
  body('isFeatured').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const devotion = await Devotion.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
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

// Delete devotion (moderator+)
router.delete('/:id', authenticateToken, requireModerator, async (req, res) => {
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