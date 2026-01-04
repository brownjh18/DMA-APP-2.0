const express = require('express');
const Sermon = require('../models/Sermon');
const Event = require('../models/Event');
const Devotion = require('../models/Devotion');
const Ministry = require('../models/Ministry');

const router = express.Router();

// Global search across all content
router.get('/', async (req, res) => {
  try {
    const { q: query, limit = 20 } = req.query;

    if (!query || query.trim().length < 2) {
      return res.json({
        results: [],
        total: 0,
        query: query || ''
      });
    }

    const searchQuery = { $text: { $search: query.trim() } };
    const publishedFilter = { isPublished: true };

    // Search across all collections
    const [sermons, podcasts, events, devotions, ministries] = await Promise.all([
      Sermon.find({ ...searchQuery, ...publishedFilter, type: { $ne: 'podcast' } })
        .select('title speaker description thumbnailUrl date')
        .sort({ score: { $meta: 'textScore' } })
        .limit(5),
      Sermon.find({ ...searchQuery, ...publishedFilter, type: 'podcast' })
        .select('title speaker description thumbnailUrl date')
        .sort({ score: { $meta: 'textScore' } })
        .limit(5),
      Event.find({ ...searchQuery, ...publishedFilter })
        .select('title description date location category')
        .sort({ score: { $meta: 'textScore' } })
        .limit(5),
      Devotion.find({ ...searchQuery, ...publishedFilter })
        .select('title content verse date')
        .sort({ score: { $meta: 'textScore' } })
        .limit(5),
      Ministry.find({ ...searchQuery, isActive: true })
        .select('name description leader category')
        .sort({ score: { $meta: 'textScore' } })
        .limit(5)
    ]);

    // Format results with type and navigation info
    const results = [
      ...sermons.map(item => ({
        id: item._id,
        type: 'sermon',
        title: item.title,
        subtitle: item.speaker,
        description: item.description?.substring(0, 100) + (item.description?.length > 100 ? '...' : ''),
        image: item.thumbnailUrl,
        date: item.date,
        url: `/tab2?sermonId=${item._id}`,
        score: item._doc.score || 0
      })),
      ...podcasts.map(item => ({
        id: item._id,
        type: 'podcast',
        title: item.title,
        subtitle: item.speaker,
        description: item.description?.substring(0, 100) + (item.description?.length > 100 ? '...' : ''),
        image: item.thumbnailUrl,
        date: item.date,
        url: `/podcast-player?id=${item._id}`,
        score: item._doc.score || 0
      })),
      ...events.map(item => ({
        id: item._id,
        type: 'event',
        title: item.title,
        subtitle: item.location,
        description: item.description?.substring(0, 100) + (item.description?.length > 100 ? '...' : ''),
        date: item.date,
        url: `/events/${item._id}`,
        score: item._doc.score || 0
      })),
      ...devotions.map(item => ({
        id: item._id,
        type: 'devotion',
        title: item.title,
        subtitle: item.verse,
        description: item.content?.substring(0, 100) + (item.content?.length > 100 ? '...' : ''),
        date: item.date,
        url: `/tab3?devotionId=${item._id}`,
        score: item._doc.score || 0
      })),
      ...ministries.map(item => ({
        id: item._id,
        type: 'ministry',
        title: item.name,
        subtitle: item.leader || item.category,
        description: item.description?.substring(0, 100) + (item.description?.length > 100 ? '...' : ''),
        url: `/ministries/${item._id}`,
        score: item._doc.score || 0
      }))
    ];

    // Sort by relevance score and limit total results
    const sortedResults = results
      .sort((a, b) => b.score - a.score)
      .slice(0, parseInt(limit));

    res.json({
      results: sortedResults,
      total: sortedResults.length,
      query: query.trim()
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Search suggestions/popular terms
router.get('/suggestions', async (req, res) => {
  try {
    // Return popular search terms or trending content
    const suggestions = [
      'Sunday Service',
      'Prayer Meeting',
      'Bible Study',
      'Youth Ministry',
      'Worship',
      'Sermon',
      'Devotion',
      'Testimony',
      'Healing',
      'Salvation',
      'Faith',
      'Hope',
      'Love',
      'Grace',
      'Mercy',
      'Forgiveness',
      'Holy Spirit',
      'Jesus Christ',
      'God',
      'Prayer'
    ];

    res.json({ suggestions });
  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

module.exports = router;