const express = require('express');
const router = express.Router();

// YouTube API configuration
const API_KEY = process.env.YOUTUBE_API_KEY || 'AIzaSyAe9r1CdXxjR8uJoEB1cd7gqqOKmcdiyjA';
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

// Helper function to extract video ID from URL
function extractVideoId(url) {
  if (!url) return null;

  // YouTube URL patterns
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

// Fetch video details from YouTube
router.get('/video-details', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'Video URL is required' });
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    // Fetch video details from YouTube API
    const response = await fetch(
      `${BASE_URL}/videos?id=${videoId}&key=${API_KEY}&part=snippet,contentDetails,statistics`
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('YouTube API error:', errorData);
      return res.status(400).json({
        error: 'Failed to fetch video details from YouTube',
        details: errorData.error?.message || 'Unknown error'
      });
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const video = data.items[0];
    const snippet = video.snippet;
    const contentDetails = video.contentDetails;
    const statistics = video.statistics;

    // Fetch comments if available
    let comments = [];
    if (statistics.commentCount && statistics.commentCount > 0) {
      try {
        const commentsResponse = await fetch(
          `${BASE_URL}/commentThreads?part=snippet&videoId=${videoId}&key=${API_KEY}&maxResults=50&order=relevance`
        );

        if (commentsResponse.ok) {
          const commentsData = await commentsResponse.json();
          comments = commentsData.items.map(thread => {
            const comment = thread.snippet.topLevelComment.snippet;
            return {
              author: comment.authorDisplayName,
              text: comment.textDisplay,
              publishedAt: comment.publishedAt,
              authorChannelUrl: comment.authorChannelUrl,
              likeCount: comment.likeCount || 0
            };
          });
        } else {
          console.warn('Failed to fetch comments:', commentsResponse.status);
        }
      } catch (commentError) {
        console.warn('Error fetching comments:', commentError.message);
      }
    }

    // Extract and format the video details
    const isLive = snippet.liveBroadcastContent === 'live';
    const videoDetails = {
      id: video.id,
      title: snippet.title,
      description: snippet.description,
      thumbnailUrl: snippet.thumbnails?.maxres?.url ||
                    snippet.thumbnails?.high?.url ||
                    snippet.thumbnails?.default?.url,
      publishedAt: snippet.publishedAt,
      duration: isLive ? 'LIVE' : parseDuration(contentDetails.duration),
      viewCount: statistics.viewCount ? parseInt(statistics.viewCount) : 0,
      likeCount: statistics.likeCount ? parseInt(statistics.likeCount) : 0,
      commentCount: statistics.commentCount ? parseInt(statistics.commentCount) : 0,
      channelTitle: snippet.channelTitle,
      channelId: snippet.channelId,
      tags: snippet.tags || [],
      youtubeComments: comments,
      subscribeUrl: `https://www.youtube.com/channel/${snippet.channelId}?sub_confirmation=1`,
      isLive: isLive
    };

    res.json(videoDetails);

  } catch (error) {
    console.error('Error fetching YouTube video details:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

module.exports = router;