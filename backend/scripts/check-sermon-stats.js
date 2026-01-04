const mongoose = require('mongoose');
const Sermon = require('../models/Sermon');

async function checkSermonStats() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dove-ministries');
    console.log('Connected to MongoDB');

    // Use the same filtering logic as the updated stats endpoint
    const sermonFilter = {
      $and: [
        { $or: [{ type: { $exists: false } }, { type: 'sermon' }] },
        { type: { $ne: 'podcast' } }
      ]
    };

    const total = await Sermon.countDocuments(sermonFilter);
    const published = await Sermon.countDocuments({ ...sermonFilter, isPublished: true });
    const featured = await Sermon.countDocuments({ ...sermonFilter, isFeatured: true });
    const totalViews = await Sermon.aggregate([
      { $match: sermonFilter },
      { $group: { _id: null, totalViews: { $sum: '$viewCount' } } }
    ]);

    console.log('Real sermon stats from database (filtered):');
    console.log('Total:', total);
    console.log('Published:', published);
    console.log('Featured:', featured);
    console.log('Total Views:', totalViews[0]?.totalViews || 0);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkSermonStats();