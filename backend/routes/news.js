const express = require('express');
const { body, validationResult } = require('express-validator');
const News = require('../models/News');
const { authenticateToken, requireModerator } = require('../middleware/auth');

const router = express.Router();

// Get all news articles (public)
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      published = true
    } = req.query;

    const query = { isPublished: published };

    if (search) {
      query.$text = { $search: search };
    }
    if (category) {
      query.category = category;
    }

    const news = await News.find(query)
      .populate('createdBy', 'name')
      .sort({ publishDate: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await News.countDocuments(query);

    res.json({
      news,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('News fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get featured news
router.get('/featured', async (req, res) => {
  try {
    const news = await News.find({
      isPublished: true,
      isFeatured: true
    })
      .populate('createdBy', 'name')
      .sort({ publishDate: -1 })
      .limit(5);

    res.json({ news });
  } catch (error) {
    console.error('Featured news fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single news article
router.get('/:id', async (req, res) => {
  try {
    const article = await News.findById(req.params.id)
      .populate('createdBy', 'name');

    if (!article) {
      return res.status(404).json({ error: 'News article not found' });
    }

    // Increment view count
    article.viewCount += 1;
    await article.save();

    res.json({ article });
  } catch (error) {
    console.error('News article fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create news article (moderator+)
router.post('/', [
  authenticateToken,
  requireModerator,
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('content').trim().isLength({ min: 1 }).withMessage('Content is required'),
  body('excerpt').optional().trim(),
  body('author').optional().trim(),
  body('category').optional().isIn(['announcement', 'ministry-update', 'event', 'testimony', 'community', 'other']),
  body('imageUrl').optional().isURL().withMessage('Valid image URL required'),
  body('tags').optional().isArray(),
  body('publishDate').optional().isISO8601().withMessage('Valid publish date required'),
  body('isPublished').optional().isBoolean(),
  body('isFeatured').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const newsData = {
      ...req.body,
      createdBy: req.user.id
    };

    const article = new News(newsData);
    await article.save();

    await article.populate('createdBy', 'name');

    res.status(201).json({
      message: 'News article created successfully',
      article
    });
  } catch (error) {
    console.error('News article creation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update news article (moderator+)
router.put('/:id', [
  authenticateToken,
  requireModerator,
  body('title').optional().trim().isLength({ min: 1 }).withMessage('Title cannot be empty'),
  body('content').optional().trim().isLength({ min: 1 }).withMessage('Content cannot be empty'),
  body('excerpt').optional().trim(),
  body('author').optional().trim(),
  body('category').optional().isIn(['announcement', 'ministry-update', 'event', 'testimony', 'community', 'other']),
  body('imageUrl').optional().isURL().withMessage('Valid image URL required'),
  body('tags').optional().isArray(),
  body('publishDate').optional().isISO8601().withMessage('Valid publish date required'),
  body('isPublished').optional().isBoolean(),
  body('isFeatured').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const article = await News.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name');

    if (!article) {
      return res.status(404).json({ error: 'News article not found' });
    }

    res.json({
      message: 'News article updated successfully',
      article
    });
  } catch (error) {
    console.error('News article update error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete news article (moderator+)
router.delete('/:id', authenticateToken, requireModerator, async (req, res) => {
  try {
    const article = await News.findByIdAndDelete(req.params.id);

    if (!article) {
      return res.status(404).json({ error: 'News article not found' });
    }

    res.json({ message: 'News article deleted successfully' });
  } catch (error) {
    console.error('News article deletion error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get news categories
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = [
      { value: 'announcement', label: 'Announcements' },
      { value: 'ministry-update', label: 'Ministry Updates' },
      { value: 'event', label: 'Events' },
      { value: 'testimony', label: 'Testimonies' },
      { value: 'community', label: 'Community' },
      { value: 'other', label: 'Other' }
    ];

    res.json({ categories });
  } catch (error) {
    console.error('Categories fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get news statistics (moderator+)
router.get('/admin/stats', authenticateToken, requireModerator, async (req, res) => {
  try {
    const totalArticles = await News.countDocuments();
    const publishedArticles = await News.countDocuments({ isPublished: true });
    const featuredArticles = await News.countDocuments({ isFeatured: true });
    const totalViews = await News.aggregate([
      { $group: { _id: null, totalViews: { $sum: '$viewCount' } } }
    ]);

    res.json({
      stats: {
        total: totalArticles,
        published: publishedArticles,
        featured: featuredArticles,
        totalViews: totalViews[0]?.totalViews || 0
      }
    });
  } catch (error) {
    console.error('News stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;