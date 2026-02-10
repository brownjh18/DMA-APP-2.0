const mongoose = require('mongoose');
const Sermon = require('../models/Sermon');

async function checkSermonThumbnails() {
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

    const sermons = await Sermon.find({ ...sermonFilter, isPublished: true }).limit(10);

    console.log('Sermons with thumbnail info:');
    sermons.forEach((sermon, index) => {
      console.log(`${index + 1}. ${sermon.title}`);
      console.log(`   thumbnailUrl: ${sermon.thumbnailUrl || 'null'}`);
      console.log(`   videoUrl: ${sermon.videoUrl || 'null'}`);
      console.log(`   youtubeId: ${sermon.youtubeId || 'null'}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkSermonThumbnails();