const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied' });
    }
    const token = authHeader.split(' ')[1];
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const User = require('../models/User');
    const user = await User.findById(decoded.userId || decoded.id);
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, unreadOnly = false } = req.query;
    const query = { userId: req.user._id };
    if (unreadOnly === 'true') query.read = false;
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // Populate thumbnails from content for notifications that don't have one stored
    const Sermon = require('../models/Sermon');
    const Devotion = require('../models/Devotion');
    const Event = require('../models/Event');
    const Ministry = require('../models/Ministry');

    const enriched = await Promise.all(notifications.map(async (n) => {
      if (n.thumbnailUrl) return n.toObject();

      const obj = n.toObject();
      try {
        if (n.contentType === 'sermon' && n.contentId) {
          const sermon = await Sermon.findById(n.contentId).select('thumbnailUrl');
          if (sermon?.thumbnailUrl) obj.thumbnailUrl = sermon.thumbnailUrl;
        } else if (n.contentType === 'podcast' && n.contentId) {
          const podcast = await Sermon.findById(n.contentId).select('thumbnailUrl');
          if (podcast?.thumbnailUrl) obj.thumbnailUrl = podcast.thumbnailUrl;
        } else if (n.contentType === 'devotion' && n.contentId) {
          const devotion = await Devotion.findById(n.contentId).select('thumbnailUrl');
          if (devotion?.thumbnailUrl) obj.thumbnailUrl = devotion.thumbnailUrl;
        } else if (n.contentType === 'event' && n.contentId) {
          const event = await Event.findById(n.contentId).select('imageUrl');
          if (event?.imageUrl) obj.thumbnailUrl = event.imageUrl;
        } else if (n.contentType === 'ministry' && n.contentId) {
          const ministry = await Ministry.findById(n.contentId).select('imageUrl');
          if (ministry?.imageUrl) obj.thumbnailUrl = ministry.imageUrl;
        }
      } catch (e) {
        // Content may have been deleted — skip
      }
      return obj;
    }));

    const unreadCount = await Notification.countDocuments({ userId: req.user._id, read: false });
    res.json({ notifications: enriched, unreadCount });
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ userId: req.user._id, read: false });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// NOTE: /read-all and /clear-all must be defined BEFORE /:id routes
// to prevent 'read-all' / 'clear-all' being matched as a MongoDB ObjectId

router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, read: false },
      { read: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

router.delete('/clear-all', authenticateToken, async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.user._id });
    res.json({ message: 'All notifications cleared' });
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ error: 'Notification not found' });
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });
    if (!notification) return res.status(404).json({ error: 'Notification not found' });
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

module.exports = router;
