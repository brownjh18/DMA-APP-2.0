const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const Comment = require('../models/Comment');
const Sermon = require('../models/Sermon');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get comments for a specific content (sermon/podcast)
router.get('/:contentId', async (req, res) => {
  try {
    const { contentId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    console.log('GET /api/comments/:contentId - contentId:', contentId);

    const comments = await Comment.find({
      contentId,
      isApproved: true
    })
      .populate('user', 'name profilePicture')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Comment.countDocuments({
      contentId,
      isApproved: true
    });

    console.log('Found', comments.length, 'comments for contentId:', contentId);

    res.json({
      comments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Comments fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new comment
router.post('/', authenticateToken, [
  body('content').trim().isLength({ min: 1, max: 1000 }).withMessage('Comment must be 1-1000 characters'),
  body('contentId').notEmpty().withMessage('Content ID required'),
  body('contentType').isIn(['sermon', 'podcast', 'live_broadcast']).withMessage('Valid content type required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content, contentId, contentType } = req.body;

    // Verify the content exists (only for database content, not YouTube)
    if (contentType === 'sermon' || contentType === 'podcast') {
      // Check if contentId is a valid ObjectId
      if (mongoose.Types.ObjectId.isValid(contentId)) {
        const contentExists = await Sermon.findById(contentId);
        if (!contentExists) {
          return res.status(404).json({ error: 'Content not found' });
        }
      } else {
        // For YouTube content, contentId is a string, so we skip validation
        // YouTube videos are validated on the frontend
      }
    }

    // Handle demo users - they can't actually save comments to database
    if (req.user.id.startsWith('demo-')) {
      return res.status(201).json({
        message: 'Demo user - comment not persisted',
        comment: {
          _id: 'demo-' + Date.now(),
          content,
          contentId,
          contentType,
          user: {
            _id: req.user.id,
            name: req.user.name,
            profilePicture: req.user.profilePicture
          },
          createdAt: new Date(),
          isApproved: true
        }
      });
    }

    const comment = new Comment({
      content,
      contentId,
      contentType,
      user: req.user.id
    });

    await comment.save();
    await comment.populate('user', 'name profilePicture');

    res.status(201).json({
      message: 'Comment created successfully',
      comment
    });
  } catch (error) {
    console.error('Comment creation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a comment (user can delete their own, moderators can delete any)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Check if user owns the comment or is moderator/admin
    const isOwner = comment.user.toString() === req.user.id;
    const isModerator = ['moderator', 'admin'].includes(req.user.role);

    if (!isOwner && !isModerator) {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }

    // Handle demo users
    if (req.user.id.startsWith('demo-')) {
      return res.json({ message: 'Demo user - comment deletion not persisted' });
    }

    await Comment.findByIdAndDelete(req.params.id);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Comment deletion error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;