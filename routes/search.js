const express = require('express');
const Sermon = require('../models/Sermon');
const Event = require('../models/Event');
const Devotion = require('../models/Devotion');
const Ministry = require('../models/Ministry');
const News = require('../models/News');

const router = express.Router();

// Global search across all content
router.get('/', async (req, res) => {
  try {
    const { q: query, limit = 20 } = req.query;
    console.log('🔍 Search request:', { query, limit });

    if (!query || query.trim().length < 1) {
      console.log('❌ Search query too short or empty');
      return res.json({
        results: [],
        total: 0,
        query: query || ''
      });
    }

    const searchRegex = new RegExp(query.trim(), 'i'); // Case-insensitive regex for partial matches
    const searchQuery = {
      $or: [
        { title: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
        { speaker: { $regex: searchRegex } },
        { content: { $regex: searchRegex } },
        { verse: { $regex: searchRegex } },
        { name: { $regex: searchRegex } },
        { leader: { $regex: searchRegex } },
        { category: { $regex: searchRegex } },
        { excerpt: { $regex: searchRegex } },
        { author: { $regex: searchRegex } },
        { location: { $regex: searchRegex } }
      ]
    };
    const publishedFilter = { isPublished: true };
    console.log('🔍 Search query object:', searchQuery);

    // Search across all collections
    const [sermons, podcasts, events, devotions, ministries, news] = await Promise.all([
      Sermon.find({ ...searchQuery, ...publishedFilter, type: { $ne: 'podcast' } })
        .select('title speaker description thumbnailUrl date')
        .limit(5),
      Sermon.find({ ...searchQuery, ...publishedFilter, type: 'podcast' })
        .select('title speaker description thumbnailUrl date')
        .limit(5),
      Event.find({ ...searchQuery, ...publishedFilter })
        .select('title description date location category imageUrl')
        .limit(5),
      Devotion.find({ ...searchQuery, ...publishedFilter })
        .select('title content verse date')
        .limit(5),
      Ministry.find({ ...searchQuery, isActive: true })
        .select('name description leader category imageUrl')
        .limit(5),
      News.find({ ...searchQuery, ...publishedFilter })
        .select('title excerpt content author category publishDate imageUrl')
        .limit(5)
    ]);

    console.log('📊 Search results counts:', {
      sermons: sermons.length,
      podcasts: podcasts.length,
      events: events.length,
      devotions: devotions.length,
      ministries: ministries.length,
      news: news.length
    });

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
        image: item.imageUrl,
        date: item.date,
        url: `/event/${item._id}`,
        score: item._doc.score || 0
      })),
      ...devotions.map(item => ({
        id: item._id,
        type: 'devotion',
        title: item.title,
        subtitle: item.verse,
        description: item.content?.substring(0, 100) + (item.content?.length > 100 ? '...' : ''),
        date: item.date,
        url: `/full-devotion?id=${item._id}`,
        score: item._doc.score || 0
      })),
      ...ministries.map(item => ({
        id: item._id,
        type: 'ministry',
        title: item.name,
        subtitle: item.leader || item.category,
        description: item.description?.substring(0, 100) + (item.description?.length > 100 ? '...' : ''),
        image: item.imageUrl,
        url: `/ministry/${item._id}`,
        score: item._doc.score || 0
      })),
      ...news.map(item => ({
        id: item._id,
        type: 'news',
        title: item.title,
        subtitle: item.author || item.category,
        description: (item.excerpt || item.content)?.substring(0, 100) + ((item.excerpt || item.content)?.length > 100 ? '...' : ''),
        image: item.imageUrl,
        date: item.publishDate,
        url: `/full-news?newsId=${item._id}`,
        score: item._doc.score || 0
      }))
    ];

    // Sort by date (newest first) and limit total results
    const sortedResults = results
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      .slice(0, parseInt(limit));

    console.log('✅ Search completed:', {
      query: query.trim(),
      totalResults: sortedResults.length,
      results: sortedResults.map(r => ({ type: r.type, title: r.title, score: r.score }))
    });

    res.json({
      results: sortedResults,
      total: sortedResults.length,
      query: query.trim()
    });

  } catch (error) {
    console.error('❌ Search error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ error: 'Search failed', details: error.message });
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