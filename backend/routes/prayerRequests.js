const express = require('express');
const { body, validationResult } = require('express-validator');
const PrayerRequest = require('../models/PrayerRequest');
const { authenticateToken, requireModerator } = require('../middleware/auth');

const router = express.Router();

// Submit prayer request (public)
router.post('/', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('request').trim().isLength({ min: 10 }).withMessage('Prayer request must be at least 10 characters'),
  body('isConfidential').optional().isBoolean(),
  body('category').optional().isIn(['personal', 'family', 'health', 'spiritual', 'ministry', 'community', 'other'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const prayerRequest = new PrayerRequest(req.body);
    await prayerRequest.save();

    res.status(201).json({
      message: 'Prayer request submitted successfully. Our prayer team will be standing with you.',
      requestId: prayerRequest._id
    });
  } catch (error) {
    console.error('Prayer request submission error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get prayer requests (moderator+)
router.get('/', authenticateToken, requireModerator, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      priority
    } = req.query;

    const query = {};

    if (status) {
      if (status === 'answered') {
        query.isAnswered = true;
      } else if (status === 'pending') {
        query.isAnswered = false;
      }
    }
    if (category) {
      query.category = category;
    }
    if (priority) {
      query.priority = priority;
    }

    const prayerRequests = await PrayerRequest.find(query)
      .populate('assignedTo', 'name')
      .populate('answeredBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await PrayerRequest.countDocuments(query);

    res.json({
      prayerRequests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Prayer requests fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single prayer request (moderator+)
router.get('/:id', authenticateToken, requireModerator, async (req, res) => {
  try {
    const prayerRequest = await PrayerRequest.findById(req.params.id)
      .populate('assignedTo', 'name')
      .populate('answeredBy', 'name');

    if (!prayerRequest) {
      return res.status(404).json({ error: 'Prayer request not found' });
    }

    res.json({ prayerRequest });
  } catch (error) {
    console.error('Prayer request fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update prayer request (moderator+)
router.put('/:id', [
  authenticateToken,
  requireModerator,
  body('isAnswered').optional().isBoolean(),
  body('response').optional().trim(),
  body('assignedTo').optional().isMongoId().withMessage('Invalid user ID'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('followUpNeeded').optional().isBoolean(),
  body('tags').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updateData = { ...req.body };

    // If marking as answered, set answered date and user
    if (updateData.isAnswered && !updateData.answeredDate) {
      updateData.answeredDate = new Date();
      updateData.answeredBy = req.user.id;
    }

    const prayerRequest = await PrayerRequest.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('assignedTo', 'name')
      .populate('answeredBy', 'name');

    if (!prayerRequest) {
      return res.status(404).json({ error: 'Prayer request not found' });
    }

    res.json({
      message: 'Prayer request updated successfully',
      prayerRequest
    });
  } catch (error) {
    console.error('Prayer request update error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete prayer request (moderator+)
router.delete('/:id', authenticateToken, requireModerator, async (req, res) => {
  try {
    const prayerRequest = await PrayerRequest.findByIdAndDelete(req.params.id);

    if (!prayerRequest) {
      return res.status(404).json({ error: 'Prayer request not found' });
    }

    res.json({ message: 'Prayer request deleted successfully' });
  } catch (error) {
    console.error('Prayer request deletion error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get prayer request statistics (moderator+)
router.get('/admin/stats', authenticateToken, requireModerator, async (req, res) => {
  try {
    const total = await PrayerRequest.countDocuments();
    const answered = await PrayerRequest.countDocuments({ isAnswered: true });
    const pending = await PrayerRequest.countDocuments({ isAnswered: false });
    const urgent = await PrayerRequest.countDocuments({ priority: 'urgent' });
    const followUp = await PrayerRequest.countDocuments({ followUpNeeded: true });

    // Category breakdown
    const categoryStats = await PrayerRequest.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    res.json({
      stats: {
        total,
        answered,
        pending,
        urgent,
        followUp,
        categories: categoryStats
      }
    });
  } catch (error) {
    console.error('Prayer request stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;