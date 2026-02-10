const mongoose = require('mongoose');
const Sermon = require('../models/Sermon');
require('dotenv').config();

async function convertLiveBroadcastsToPodcasts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dove-ministries', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Find all live broadcasts that are not live (ended) and haven't been converted to podcasts
    const liveBroadcasts = await Sermon.find({
      type: 'live_broadcast',
      isLive: false
    });

    console.log(`Found ${liveBroadcasts.length} live broadcasts to convert`);

    for (const broadcast of liveBroadcasts) {
      // Convert to podcast
      broadcast.type = 'podcast';
      broadcast.recordingStatus = 'completed';
      broadcast.date = broadcast.broadcastEndTime || broadcast.broadcastStartTime || new Date();
      broadcast.audioUrl = broadcast.audioUrl || ''; // Keep existing audioUrl if any, otherwise empty
      broadcast.duration = broadcast.duration || '00:00'; // Default duration

      await broadcast.save();
      console.log(`Converted broadcast "${broadcast.title}" (ID: ${broadcast._id}) to podcast`);
    }

    console.log('Conversion completed successfully');

    // Verify the conversion
    const podcasts = await Sermon.find({
      type: 'podcast',
      broadcastStartTime: { $exists: true } // This identifies converted live broadcasts
    });

    console.log(`Total podcasts after conversion: ${podcasts.length}`);

  } catch (error) {
    console.error('Error converting live broadcasts:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the conversion
convertLiveBroadcastsToPodcasts();