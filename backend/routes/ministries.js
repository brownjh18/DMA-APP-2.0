const express = require('express');
const { body, validationResult } = require('express-validator');
const Ministry = require('../models/Ministry');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all ministries (public)
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      active
    } = req.query;

    const query = {};
    if (active !== 'all') {
      query.isActive = active === 'true' || active === undefined ? true : false;
    }

    if (search) {
      query.$text = { $search: search };
    }
    if (category) {
      query.category = category;
    }

    const ministries = await Ministry.find(query)
      .populate('createdBy', 'name')
      .sort({ name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Ministry.countDocuments(query);

    res.json({
      ministries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Ministries fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single ministry
router.get('/:id', async (req, res) => {
  try {
    const ministry = await Ministry.findById(req.params.id)
      .populate('createdBy', 'name');

    if (!ministry) {
      return res.status(404).json({ error: 'Ministry not found' });
    }

    res.json({ ministry });
  } catch (error) {
    console.error('Ministry fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create ministry (admin only)
router.post('/', [
  authenticateToken,
  requireAdmin,
  body('name').trim().isLength({ min: 1 }).withMessage('Name is required'),
  body('description').trim().isLength({ min: 1 }).withMessage('Description is required'),
  body('leader').optional().trim(),
  body('activities').optional().isArray(),
  body('meetingSchedule').optional().trim(),
  body('endTime').optional().trim(),
  body('contactEmail').optional().isEmail().withMessage('Valid contact email required'),
  body('contactPhone').optional().trim(),
  body('imageUrl').optional().trim(),
  body('category').optional().isIn(['worship', 'youth', 'children', 'evangelism', 'intercessions', 'married-couples', 'other']),
  body('memberCount').optional().isInt({ min: 0 }).withMessage('Member count must be non-negative'),
  body('isActive').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const ministryData = {
      ...req.body,
      createdBy: req.user.id.startsWith('demo-') ? '507f1f77bcf86cd799439011' : req.user.id
    };

    const ministry = new Ministry(ministryData);
    await ministry.save();

    await ministry.populate('createdBy', 'name');

    res.status(201).json({
      message: 'Ministry created successfully',
      ministry
    });
  } catch (error) {
    console.error('Ministry creation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update ministry (admin only)
router.put('/:id', [
  authenticateToken,
  requireAdmin,
  body('name').optional().trim().isLength({ min: 1 }).withMessage('Name cannot be empty'),
  body('description').optional().trim().isLength({ min: 1 }).withMessage('Description cannot be empty'),
  body('leader').optional().trim(),
  body('activities').optional().isArray(),
  body('meetingSchedule').optional().trim(),
  body('endTime').optional().trim(),
  body('contactEmail').optional().isEmail().withMessage('Valid contact email required'),
  body('contactPhone').optional().trim(),
  body('imageUrl').optional().trim(),
  body('category').optional().isIn(['worship', 'youth', 'children', 'evangelism', 'intercessions', 'married-couples', 'other']),
  body('memberCount').optional().isInt({ min: 0 }).withMessage('Member count must be non-negative'),
  body('isActive').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Get the old ministry to check if it was just activated
    const oldMinistry = await Ministry.findById(req.params.id);

    const ministry = await Ministry.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name');

    if (!ministry) {
      return res.status(404).json({ error: 'Ministry not found' });
    }

    res.json({
      message: 'Ministry updated successfully',
      ministry
    });
  } catch (error) {
    console.error('Ministry update error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete ministry (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const ministry = await Ministry.findByIdAndDelete(req.params.id);

    if (!ministry) {
      return res.status(404).json({ error: 'Ministry not found' });
    }

    res.json({ message: 'Ministry deleted successfully' });
  } catch (error) {
    console.error('Ministry deletion error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update member count (moderator+)
router.patch('/:id/members', [
  authenticateToken,
  requireAdmin,
  body('memberCount').isInt({ min: 0 }).withMessage('Member count must be non-negative')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const ministry = await Ministry.findByIdAndUpdate(
      req.params.id,
      { memberCount: req.body.memberCount },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name');

    if (!ministry) {
      return res.status(404).json({ error: 'Ministry not found' });
    }

    res.json({
      message: 'Member count updated successfully',
      ministry
    });
  } catch (error) {
    console.error('Member count update error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get ministry categories
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = [
      { value: 'worship', label: 'Worship Ministry' },
      { value: 'youth', label: 'Youth Ministry' },
      { value: 'children', label: 'Children Ministry' },
      { value: 'evangelism', label: 'Evangelism Ministry' },
      { value: 'intercessions', label: 'Intercessions Ministry' },
      { value: 'married-couples', label: 'Married Couples Ministry' },
      { value: 'other', label: 'Other' }
    ];

    res.json({ categories });
  } catch (error) {
    console.error('Categories fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;