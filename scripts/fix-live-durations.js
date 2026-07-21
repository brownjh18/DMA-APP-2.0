require('dotenv').config();
const mongoose = require('mongoose');
const Sermon = require('../models/Sermon');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB\n');

  // Fix the 2 sermons stuck with duration "LIVE" - YouTube videos are deleted
  const liveSermons = await Sermon.find({ duration: 'LIVE' });
  console.log(`Found ${liveSermons.length} sermons with duration "LIVE"\n`);

  for (const s of liveSermons) {
    console.log(`Fixing: ${s.title}`);
    console.log(`  videoUrl: ${s.videoUrl}`);
    s.duration = '00:00';
    s.isLive = false;
    await s.save();
    console.log(`  Updated: duration → 00:00, isLive → false\n`);
  }

  console.log('Done!');
  await mongoose.disconnect();
}

main().catch(console.error);
