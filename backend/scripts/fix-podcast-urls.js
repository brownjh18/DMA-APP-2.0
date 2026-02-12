/**
 * Script to fix podcast thumbnail and audio URLs in the database
 * This updates old local paths to use the Vercel proxy URL format
 * 
 * Run: node backend/scripts/fix-podcast-urls.js
 */

const mongoose = require('mongoose');

// Use the connection string from environment or default
const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://dove_admin:kQt3f0wk2abekE5x@cluster1.xxt8zzi.mongodb.net/?appName=Cluster1';

const VERCEl_PROXY_URL = 'https://dovechurchapp.vercel.app';

// Define the Podcast schema (minimal - just what we need)
const podcastSchema = new mongoose.Schema({
  title: String,
  thumbnailUrl: String,
  audioUrl: String,
  status: String
});

async function fixPodcastUrls() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const Podcast = mongoose.model('Sermon', podcastSchema, 'sermons');
    
    // Find all podcasts with local thumbnail URLs
    const podcasts = await Podcast.find({
      $or: [
        { thumbnailUrl: { $regex: '^/uploads/' } },
        { audioUrl: { $regex: '^/uploads/' } }
      ],
      type: 'podcast'
    });

    console.log(`📝 Found ${podcasts.length} podcasts with local URLs`);

    let updated = 0;
    for (const podcast of podcasts) {
      console.log(`\n📻 Podcast: ${podcast.title}`);
      console.log(`   Old thumbnail: ${podcast.thumbnailUrl}`);
      console.log(`   Old audio: ${podcast.audioUrl}`);

      // Update thumbnail URL to use Vercel proxy
      if (podcast.thumbnailUrl && podcast.thumbnailUrl.startsWith('/uploads/')) {
        podcast.thumbnailUrl = `${VERCEl_PROXY_URL}${podcast.thumbnailUrl}`;
      }

      // Update audio URL to use Vercel proxy
      if (podcast.audioUrl && podcast.audioUrl.startsWith('/uploads/')) {
        podcast.audioUrl = `${VERCEl_PROXY_URL}${podcast.audioUrl}`;
      }

      await podcast.save();
      updated++;

      console.log(`   New thumbnail: ${podcast.thumbnailUrl}`);
      console.log(`   New audio: ${podcast.audioUrl}`);
    }

    console.log(`\n✅ Updated ${updated} podcasts`);
    console.log('\n💡 Note: After running this script, re-upload any missing files to the backend');
    console.log('   New uploads will use Cloudinary (if configured) for persistent storage');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

fixPodcastUrls();
