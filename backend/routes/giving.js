const express = require('express');
const { body, validationResult } = require('express-validator');
const Donation = require('../models/Donation');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all donations (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      type,
      search
    } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }
    if (type) {
      query.type = type;
    }
    if (search) {
      query.$or = [
        { donorName: new RegExp(search, 'i') },
        { donorEmail: new RegExp(search, 'i') },
        { purpose: new RegExp(search, 'i') }
      ];
    }

    const donations = await Donation.find(query)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Donation.countDocuments(query);

    res.json({
      donations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Donations fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single donation (admin only)
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate('createdBy', 'name');

    if (!donation) {
      return res.status(404).json({ error: 'Donation not found' });
    }

    res.json({ donation });
  } catch (error) {
    console.error('Donation fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create donation (public or admin)
router.post('/', [
  body('donorName').trim().isLength({ min: 2 }).withMessage('Donor name must be at least 2 characters'),
  body('donorEmail').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('type').optional().isIn(['one-time', 'monthly', 'yearly']).withMessage('Invalid donation type'),
  body('purpose').optional().trim(),
  body('isAnonymous').optional().isBoolean(),
  body('phone').optional().trim(),
  body('status').optional().isIn(['pending', 'completed', 'cancelled', 'refunded'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user is authenticated (admin creating donation)
    const isAuthenticated = req.user && req.user.id;
    const defaultStatus = isAuthenticated ? 'completed' : 'pending';

    const donationData = {
      ...req.body,
      status: req.body.status || defaultStatus,
      createdBy: isAuthenticated ? (req.user.id.startsWith('demo-') ? '507f1f77bcf86cd799439011' : req.user.id) : null
    };

    const donation = new Donation(donationData);
    await donation.save();

    res.status(201).json({
      message: 'Donation submitted successfully',
      donation: {
        id: donation._id,
        donorName: donation.isAnonymous ? 'Anonymous' : donation.donorName,
        amount: donation.amount,
        type: donation.type,
        purpose: donation.purpose,
        status: donation.status,
        createdAt: donation.createdAt
      }
    });
  } catch (error) {
    console.error('Donation creation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update donation (admin/moderator only)
router.put('/:id', [
  authenticateToken,
  requireAdmin,
  body('donorName').optional().trim().isLength({ min: 2 }).withMessage('Donor name must be at least 2 characters'),
  body('donorEmail').optional().isEmail().normalizeEmail().withMessage('Valid email required'),
  body('amount').optional().isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('type').optional().isIn(['one-time', 'monthly', 'yearly']).withMessage('Invalid donation type'),
  body('purpose').optional().trim(),
  body('status').optional().isIn(['pending', 'completed', 'cancelled', 'refunded']).withMessage('Invalid status'),
  body('isAnonymous').optional().isBoolean(),
  body('phone').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const donation = await Donation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name');

    if (!donation) {
      return res.status(404).json({ error: 'Donation not found' });
    }

    res.json({
      message: 'Donation updated successfully',
      donation
    });
  } catch (error) {
    console.error('Donation update error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete donation (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const donation = await Donation.findByIdAndDelete(req.params.id);

    if (!donation) {
      return res.status(404).json({ error: 'Donation not found' });
    }

    res.json({ message: 'Donation deleted successfully' });
  } catch (error) {
    console.error('Donation deletion error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get donation statistics (admin only)
router.get('/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const totalDonations = await Donation.countDocuments();
    const totalAmount = await Donation.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const monthlyStats = await Donation.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          amount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    res.json({
      totalDonations,
      totalAmount: totalAmount[0]?.total || 0,
      monthlyStats
    });
  } catch (error) {
    console.error('Donation stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;