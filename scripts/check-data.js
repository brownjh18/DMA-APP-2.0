const mongoose = require('mongoose');
const Sermon = require('../models/Sermon');
const Ministry = require('../models/Ministry');

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dove-ministries');
    console.log('Connected to MongoDB');

    // Check podcasts
    const podcastFilter = { type: 'podcast', isPublished: true };
    const totalPodcasts = await Sermon.countDocuments(podcastFilter);
    console.log('Total published podcasts:', totalPodcasts);

    if (totalPodcasts > 0) {
      const podcasts = await Sermon.find(podcastFilter).limit(5);
      console.log('Sample podcasts:');
      podcasts.forEach(p => console.log(`- ${p.title} (${p.speaker})`));
    }

    // Check ministries
    const ministryFilter = { isActive: true };
    const totalMinistries = await Ministry.countDocuments(ministryFilter);
    console.log('Total active ministries:', totalMinistries);

    if (totalMinistries > 0) {
      const ministries = await Ministry.find(ministryFilter).limit(5);
      console.log('Sample ministries:');
      ministries.forEach(m => console.log(`- ${m.name} (${m.category})`));
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkData();