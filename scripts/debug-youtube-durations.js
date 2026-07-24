require('dotenv').config();
const mongoose = require('mongoose');
const Sermon = require('../models/Sermon');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB\n');

  const youtubeSermons = await Sermon.find({
    type: 'sermon',
    videoUrl: { $regex: /youtu\.be\/|youtube\.com\/(watch|live|embed)/i }
  });

  console.log(`Found ${youtubeSermons.length} sermons with YouTube URLs\n`);

  for (const s of youtubeSermons) {
    console.log(`Title: ${s.title}`);
    console.log(`  type: ${s.type}`);
    console.log(`  duration: ${s.duration}`);
    console.log(`  isLive: ${s.isLive}`);
    console.log(`  videoUrl: ${s.videoUrl}`);
    console.log('');
  }

  const allSermons = await Sermon.find({});
  const byType = {};
  for (const s of allSermons) {
    const t = s.type || 'undefined';
    if (!byType[t]) byType[t] = [];
    byType[t].push({ title: s.title, duration: s.duration, isLive: s.isLive, videoUrl: s.videoUrl });
  }
  console.log('\nAll documents by type:');
  for (const [type, items] of Object.entries(byType)) {
    console.log(`\n  ${type} (${items.length}):`);
    for (const i of items) {
      console.log(`    "${i.title}" | dur: ${i.duration} | isLive: ${i.isLive} | hasUrl: ${!!i.videoUrl}`);
    }
  }

  await mongoose.disconnect();
}

main().catch(console.error);
