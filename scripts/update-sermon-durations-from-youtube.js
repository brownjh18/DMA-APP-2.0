const mongoose = require('mongoose');
const Sermon = require('../models/Sermon');
require('dotenv').config();

// YouTube API configuration
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || 'AIzaSyAe9r1CdXxjR8uJoEB1cd7gqqOKmcdiyjA';
const YOUTUBE_BASE_URL = 'https://www.googleapis.com/youtube/v3';

// Helper function to extract video ID from URL
function extractVideoId(url) {
  if (!url) return null;

  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&\n?#]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^&\n?#]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([^&\n?#]+)/,
    /(?:https?:\/\/)?youtu\.be\/([^&\n?#]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/live\/([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

// Helper function to convert ISO 8601 duration to readable format
function parseDuration(isoDuration) {
  if (!isoDuration) return '00:00';

  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '00:00';

  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}

// Helper function to fetch YouTube video details
async function fetchYouTubeVideoDetails(videoUrl) {
  try {
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      console.log('Not a valid YouTube URL:', videoUrl);
      return null;
    }

    const response = await fetch(
      `${YOUTUBE_BASE_URL}/videos?id=${videoId}&key=${YOUTUBE_API_KEY}&part=snippet,contentDetails,statistics`
    );

    if (!response.ok) {
      console.error('YouTube API error:', response.status);
      return null;
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      console.log('Video not found on YouTube');
      return null;
    }

    const video = data.items[0];
    const snippet = video.snippet;
    const contentDetails = video.contentDetails;
    const statistics = video.statistics;

    const isLive = snippet.liveBroadcastContent === 'live';

    return {
      duration: isLive ? 'LIVE' : parseDuration(contentDetails.duration),
      viewCount: statistics.viewCount ? parseInt(statistics.viewCount) : 0,
      thumbnailUrl: snippet.thumbnails?.maxres?.url ||
                    snippet.thumbnails?.high?.url ||
                    snippet.thumbnails?.default?.url,
      publishedAt: snippet.publishedAt,
      isLive: isLive
    };
  } catch (error) {
    console.error('Error fetching YouTube video details:', error.message);
    return null;
  }
}

// Main function to update sermon durations
async function updateSermonDurations() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dove-ministries', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to database');

    // Find sermons that have videoUrl but no valid duration
    const sermonsToUpdate = await Sermon.find({
      videoUrl: { $exists: true, $ne: '' },
      $or: [
        { duration: { $exists: false } },
        { duration: null },
        { duration: '' },
        { duration: '00:00' }
      ]
    });

    console.log(`Found ${sermonsToUpdate.length} sermons to update`);

    let updatedCount = 0;
    let failedCount = 0;

    for (const sermon of sermonsToUpdate) {
      console.log(`\nProcessing: ${sermon.title}`);
      console.log(`  Video URL: ${sermon.videoUrl}`);
      console.log(`  Current duration: ${sermon.duration || 'none'}`);

      const youtubeDetails = await fetchYouTubeVideoDetails(sermon.videoUrl);

      if (youtubeDetails) {
        console.log(`  Fetched duration: ${youtubeDetails.duration}`);
        console.log(`  Fetched view count: ${youtubeDetails.viewCount}`);
        console.log(`  Fetched thumbnail: ${youtubeDetails.thumbnailUrl ? 'yes' : 'no'}`);

        // Update the sermon
        await Sermon.findByIdAndUpdate(sermon._id, {
          duration: youtubeDetails.duration,
          viewCount: youtubeDetails.viewCount,
          thumbnailUrl: youtubeDetails.thumbnailUrl || sermon.thumbnailUrl
        });

        console.log(`  ✅ Updated successfully`);
        updatedCount++;
      } else {
        console.log(`  ❌ Failed to fetch video details`);
        failedCount++;
      }

      // Add a small delay to avoid hitting YouTube API rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`\n=== Summary ===`);
    console.log(`Total sermons processed: ${sermonsToUpdate.length}`);
    console.log(`Successfully updated: ${updatedCount}`);
    console.log(`Failed to update: ${failedCount}`);

  } catch (error) {
    console.error('Error updating sermon durations:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from database');
    process.exit(0);
  }
}

// Run the update
updateSermonDurations();
