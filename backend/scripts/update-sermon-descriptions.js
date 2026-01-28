// Script to fetch and update descriptions for existing sermons with YouTube URLs
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

    return {
      description: snippet.description || ''
    };
  } catch (error) {
    console.error('Error fetching YouTube video details:', error.message);
    return null;
  }
}

async function updateSermonDescriptions() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dma-app';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Find all sermons with videoUrl that don't have a description
    const sermonsToUpdate = await Sermon.find({
      videoUrl: { $exists: true, $ne: '' },
      $or: [
        { description: { $exists: false } },
        { description: null },
        { description: '' }
      ]
    });

    console.log(`Found ${sermonsToUpdate.length} sermons without descriptions to update`);

    let updatedCount = 0;
    for (const sermon of sermonsToUpdate) {
      console.log(`\nUpdating sermon: ${sermon.title}`);
      console.log(`Video URL: ${sermon.videoUrl}`);

      const details = await fetchYouTubeVideoDetails(sermon.videoUrl);

      if (details && details.description) {
        sermon.description = details.description;
        await sermon.save();
        console.log(`✅ Updated description for sermon: ${sermon.title}`);
        updatedCount++;
      } else {
        console.log(`❌ Could not fetch description for sermon: ${sermon.title}`);
      }

      // Rate limiting - wait 1 second between API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`\n✅ Update complete! Updated ${updatedCount} out of ${sermonsToUpdate.length} sermons`);

  } catch (error) {
    console.error('Error updating sermon descriptions:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

updateSermonDescriptions();
