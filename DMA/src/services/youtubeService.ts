// src/services/youtubeService.ts
import { apiService } from './api';

export type YouTubeVideo = {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  publishedAt?: string;
  duration?: string; // e.g. "12:34"
  viewCount?: string | number;
  isLive?: boolean;
};

export interface Sermon {
  _id: string;
  title: string;
  speaker: string;
  description?: string;
  scripture?: string;
  date: string;
  duration?: string;
  videoUrl?: string;
  audioUrl?: string;
  youtubeId?: string;
  thumbnailUrl?: string;
  tags: string[];
  series?: string;
  viewCount: number;
  likeCount: number;
  isPublished: boolean;
  isFeatured: boolean;
  isLive?: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

type FetchResult = {
  videos: YouTubeVideo[];
  nextPageToken?: string;
};

/**
 * Recommended: call your backend proxy endpoint (server side) which hides API_KEY.
 * The server should implement the same logic we would do client-side:
 * 1) call search.list with channelId & order=date to get videoIds
 * 2) call videos.list with those ids to get contentDetails/statistics
 *
 * If you truly must call YouTube directly from the client (development/test only),
 * use the 'fetchDirectFromYouTube' function below — but DO NOT embed long-lived keys in production.
 */

const USE_SERVER_PROXY = true; // set to false to try direct fetch (not recommended)

// Global flag to disable YouTube API calls when quota is exceeded
let youtubeQuotaExceeded = false;
let quotaCheckTime = 0;
const QUOTA_RESET_TIME = 60 * 60 * 1000; // 1 hour

export async function fetchRecentSermons(maxResults = 30, pageToken?: string): Promise<FetchResult> {
  // YouTube integration removed - only return database sermons
  console.log('🔍 fetchRecentSermons: YouTube integration removed, returning empty result');
  return { videos: [], nextPageToken: undefined };
}

/**
 * Fetch live streams specifically
 */
export async function fetchLiveStreams(maxResults = 10): Promise<YouTubeVideo[]> {
  // YouTube live streaming removed
  console.log('🔍 fetchLiveStreams: YouTube live streaming removed, returning empty array');
  return [];
}

/* ---------- CLIENT DIRECT CALL (DEV ONLY) ---------- */
/* Uses your given API key & channel id. NOTE: DO NOT expose this in production. */
async function fetchDirectFromYouTube(maxResults = 30, pageToken?: string): Promise<FetchResult> {
   // USER-SUPPLIED CREDENTIALS (for quick testing only)
   const API_KEY = 'AIzaSyDBYdCJVQ1FpSXPOHd6xFx4eLLuMUBzjw8';
   const CHANNEL_ID = 'UCeD__nWtSfoyMRZAL0KYjhw';

   console.log('Fetching YouTube videos with API_KEY:', API_KEY.substring(0, 10) + '...', 'CHANNEL_ID:', CHANNEL_ID);

   // 1) search.list to fetch the latest video ids (include videos and live broadcasts, order=date)
   const sParams = new URLSearchParams({
     key: API_KEY,
     channelId: CHANNEL_ID,
     part: 'snippet',
     order: 'date',
     type: 'video', // This will include both regular videos and live broadcasts
     maxResults: String(Math.min(maxResults, 50)),
   });
   if (pageToken) sParams.set('pageToken', pageToken);

   console.log('YouTube search URL:', `https://www.googleapis.com/youtube/v3/search?${sParams.toString()}`);

   const searchResp = await fetch(`https://www.googleapis.com/youtube/v3/search?${sParams.toString()}`);
   console.log('YouTube search response status:', searchResp.status, searchResp.statusText);

   if (!searchResp.ok) {
     const errorText = await searchResp.text();
     console.error('YouTube search error response:', errorText);

     // Check for quota exceeded
     if (searchResp.status === 403 && errorText.includes('quota')) {
       youtubeQuotaExceeded = true;
       quotaCheckTime = Date.now();
     }

     throw new Error(`YouTube search failed: ${searchResp.status} ${searchResp.statusText} - ${errorText}`);
   }
   const searchJson = await searchResp.json();
   console.log('YouTube search results:', searchJson.items ? searchJson.items.length : 0, 'videos found');

  const ids = (searchJson.items || []).map((it: any) => it.id.videoId).filter(Boolean);
  if (ids.length === 0) {
    return { videos: [], nextPageToken: searchJson.nextPageToken };
  }

  // 2) videos.list to get durations and stats (up to 50 ids per call)
  const vParams = new URLSearchParams({
    key: API_KEY,
    part: 'snippet,contentDetails,statistics,liveStreamingDetails',
    id: ids.join(','),
    maxResults: '50',
  });

  console.log('YouTube videos URL:', `https://www.googleapis.com/youtube/v3/videos?${vParams.toString()}`);

  const videosResp = await fetch(`https://www.googleapis.com/youtube/v3/videos?${vParams.toString()}`);
  console.log('YouTube videos response status:', videosResp.status, videosResp.statusText);

  if (!videosResp.ok) {
    const errorText = await videosResp.text();
    console.error('YouTube videos error response:', errorText);

    // Check for quota exceeded
    if (videosResp.status === 403 && errorText.includes('quota')) {
      youtubeQuotaExceeded = true;
      quotaCheckTime = Date.now();
    }

    throw new Error(`YouTube videos failed: ${videosResp.status} ${videosResp.statusText} - ${errorText}`);
  }
  const videosJson = await videosResp.json();
  console.log('YouTube videos details fetched for', videosJson.items ? videosJson.items.length : 0, 'videos');

  // Helper: convert ISO 8601 duration to mm:ss or hh:mm:ss
  const isoToTime = (iso?: string) => {
    if (!iso) return '';
    // simple parser
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '';
    const [, h='0', m='0', s='0'] = match;
    const hh = Number(h);
    const mm = Number(m);
    const ss = Number(s);
    const parts = [];
    if (hh) parts.push(String(hh).padStart(2,'0'));
    parts.push(String(mm).padStart(2,'0'));
    parts.push(String(ss).padStart(2,'0'));
    return parts.join(':');
  };

  const videoMap: YouTubeVideo[] = (videosJson.items || []).map((item: any) => {
    // Determine if this is a live stream
    const liveDetails = item.liveStreamingDetails;
    const isLive = !!(
      liveDetails &&
      (liveDetails.concurrentViewers !== undefined || // Currently live
       liveDetails.scheduledStartTime) // Upcoming live stream
    );

    return {
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
      publishedAt: item.snippet.publishedAt,
      duration: isLive ? 'LIVE' : isoToTime(item.contentDetails?.duration),
      viewCount: item.statistics?.viewCount || liveDetails?.concurrentViewers,
      isLive: isLive,
    };
  });

  // The search.list returned items in descending date order; ensure we return newest-first
  return { videos: videoMap, nextPageToken: searchJson.nextPageToken };
}

/* ---------- FETCH LIVE STREAMS DIRECT (DEV ONLY) ---------- */
async function fetchLiveStreamsDirect(maxResults = 10): Promise<YouTubeVideo[]> {
    const API_KEY = 'AIzaSyDBYdCJVQ1FpSXPOHd6xFx4eLLuMUBzjw8';
  const CHANNEL_ID = 'UCeD__nWtSfoyMRZAL0KYjhw';

  // Search for live broadcasts specifically
  const sParams = new URLSearchParams({
    key: API_KEY,
    channelId: CHANNEL_ID,
    part: 'snippet',
    eventType: 'live', // Only live broadcasts
    type: 'video',
    order: 'date',
    maxResults: String(Math.min(maxResults, 50)),
  });

  const searchResp = await fetch(`https://www.googleapis.com/youtube/v3/search?${sParams.toString()}`);
  if (!searchResp.ok) {
    const errorText = await searchResp.text();
    console.error('YouTube live search error response:', errorText);

    // Check for quota exceeded
    if (searchResp.status === 403 && errorText.includes('quota')) {
      youtubeQuotaExceeded = true;
      quotaCheckTime = Date.now();
    }

    throw new Error('YouTube live search failed');
  }
  const searchJson = await searchResp.json();

  const ids = (searchJson.items || []).map((it: any) => it.id.videoId).filter(Boolean);
  if (ids.length === 0) {
    return [];
  }

  // Get detailed info for live streams
  const vParams = new URLSearchParams({
    key: API_KEY,
    part: 'snippet,contentDetails,statistics,liveStreamingDetails',
    id: ids.join(','),
    maxResults: '50',
  });

  const videosResp = await fetch(`https://www.googleapis.com/youtube/v3/videos?${vParams.toString()}`);
  if (!videosResp.ok) {
    const errorText = await videosResp.text();
    console.error('YouTube live videos error response:', errorText);

    // Check for quota exceeded
    if (videosResp.status === 403 && errorText.includes('quota')) {
      youtubeQuotaExceeded = true;
      quotaCheckTime = Date.now();
    }

    throw new Error('YouTube live videos failed');
  }
  const videosJson = await videosResp.json();

  // Helper: convert ISO 8601 duration to mm:ss or hh:mm:ss
  const isoToTime = (iso?: string) => {
    if (!iso) return '';
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '';
    const [, h='0', m='0', s='0'] = match;
    const hh = Number(h);
    const mm = Number(m);
    const ss = Number(s);
    const parts = [];
    if (hh) parts.push(String(hh).padStart(2,'0'));
    parts.push(String(mm).padStart(2,'0'));
    parts.push(String(ss).padStart(2,'0'));
    return parts.join(':');
  };

  const liveVideos: YouTubeVideo[] = (videosJson.items || []).map((item: any) => {
    const liveDetails = item.liveStreamingDetails;
    const isLive = !!(
      liveDetails &&
      (liveDetails.concurrentViewers !== undefined || liveDetails.scheduledStartTime)
    );

    return {
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
      publishedAt: item.snippet.publishedAt,
      duration: isLive ? 'LIVE' : isoToTime(item.contentDetails?.duration),
      viewCount: item.statistics?.viewCount || liveDetails?.concurrentViewers,
      isLive: isLive,
    };
  });

  return liveVideos;
}

/**
 * Check if a YouTube video is currently live
 */
async function checkYouTubeLiveStatus(videoId: string): Promise<boolean> {
  try {
    const API_KEY = 'AIzaSyDBYdCJVQ1FpSXPOHd6xFx4eLLuMUBzjw8';
    const url = `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${videoId}&key=${API_KEY}`;

    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Failed to check live status for video ${videoId}:`, response.status);
      return false;
    }

    const data = await response.json();
    if (data.items && data.items.length > 0) {
      const liveDetails = data.items[0].liveStreamingDetails;
      // Video is live if it has concurrent viewers (actively streaming)
      return !!(liveDetails && liveDetails.concurrentViewers !== undefined);
    }
    return false;
  } catch (error) {
    console.warn('Error checking YouTube live status:', error);
    return false;
  }
}

/**
 * Fetch combined sermons from database and YouTube
 * Prioritizes database sermons - they always show even if YouTube fails
 */
export async function fetchCombinedSermons(maxResults = 30, pageToken?: string, includeDrafts = false): Promise<FetchResult> {
  let dbVideos: YouTubeVideo[] = [];

  // Only fetch database sermons (YouTube integration removed)
  try {
    // Get sermons based on includeDrafts flag
    const uploadedResponse = await apiService.getSermons({
      published: includeDrafts ? false : true, // false = all, true = published only
      limit: maxResults
    });

    // Filter to only include sermons that have videoUrl (admin-uploaded) OR are published
    // Exclude podcasts (items with audioUrl but no videoUrl)
    const relevantSermons = (uploadedResponse.sermons || []).filter((sermon: Sermon) =>
      (sermon.videoUrl || (includeDrafts ? true : sermon.isPublished)) &&
      !(sermon.audioUrl && !sermon.videoUrl)
    );

    // Convert database sermons to YouTubeVideo format for compatibility
    const sermonPromises = relevantSermons.map(async (sermon: Sermon) => {
      // Determine thumbnail URL
      let thumbnailUrl = sermon.thumbnailUrl;
      let isLive = sermon.isLive || false;

      if (sermon.videoUrl && (sermon.videoUrl.includes('youtube.com') || sermon.videoUrl.includes('youtu.be'))) {
        // Extract YouTube video ID
        let videoId = '';
        if (sermon.videoUrl.includes('youtu.be/')) {
          videoId = sermon.videoUrl.split('youtu.be/')[1]?.split('?')[0];
        } else if (sermon.videoUrl.includes('live/')) {
          videoId = sermon.videoUrl.split('live/')[1]?.split('?')[0];
        } else if (sermon.videoUrl.includes('v=')) {
          videoId = sermon.videoUrl.split('v=')[1]?.split('&')[0];
        }

        if (videoId) {
          // Check if this YouTube video is currently live
          isLive = await checkYouTubeLiveStatus(videoId);

          // Use maxresdefault for highest quality thumbnails (works for both live and uploaded)
          if (!thumbnailUrl) {
            thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
          }
        }
      }

      if (!thumbnailUrl) {
        thumbnailUrl = '/default-sermon-thumb.jpg'; // Fallback
      }

      // Determine duration based on live status
      let duration: string | undefined;
      if (isLive) {
        // If currently live, show LIVE
        duration = 'LIVE';
      } else {
        // If not live, use actual duration from sermon
        // Check if sermon has a valid duration (not 'LIVE' and not empty)
        if (sermon.duration && sermon.duration !== 'LIVE' && sermon.duration !== '—') {
          duration = sermon.duration;
        } else if (sermon.broadcastStartTime && sermon.broadcastEndTime) {
          // Calculate duration from broadcast start/end times
          const startTime = new Date(sermon.broadcastStartTime).getTime();
          const endTime = new Date(sermon.broadcastEndTime).getTime();
          const diffMs = endTime - startTime;
          if (diffMs > 0) {
            const diffMins = Math.floor(diffMs / (1000 * 60));
            const hours = Math.floor(diffMins / 60);
            const mins = diffMins % 60;
            duration = hours > 0 ? `${hours}:${mins.toString().padStart(2, '0')}:00` : `${mins}:00`;
          }
        } else if (sermon.videoUrl) {
          // For uploaded videos without duration, leave undefined (will be fetched from video metadata)
          duration = undefined;
        } else {
          // Fallback duration for other cases
          duration = '45:00';
        }
      }

      return {
        id: sermon._id, // Always use database _id for database sermons
        title: sermon.title,
        description: sermon.description || `${sermon.speaker} - ${sermon.scripture || ''}`,
        thumbnailUrl: thumbnailUrl,
        publishedAt: sermon.date,
        duration: duration,
        viewCount: sermon.viewCount,
        isLive: isLive,
        // Add database sermon metadata
        isDatabaseSermon: true,
        videoUrl: sermon.videoUrl,
        youtubeId: sermon.youtubeId, // Keep youtubeId for reference
        speaker: sermon.speaker,
        scripture: sermon.scripture
      } as YouTubeVideo & { isDatabaseSermon: boolean; videoUrl?: string; youtubeId?: string; speaker?: string; scripture?: string };
    });

    // Wait for all live status checks to complete
    dbVideos = await Promise.all(sermonPromises);
  } catch (dbError) {
    console.error('Error fetching database sermons:', dbError);
    // Continue with empty dbVideos array
  }

  // Sort by live status first, then by date (live videos first, then newest first)
  const allVideos = dbVideos.sort((a, b) => {
    // Live videos always come first
    if (a.isLive && !b.isLive) return -1;
    if (!a.isLive && b.isLive) return 1;

    // Then sort by date
    const dateA = new Date(a.publishedAt || '').getTime();
    const dateB = new Date(b.publishedAt || '').getTime();
    return dateB - dateA; // Newest first
  });

  const result = {
    videos: allVideos.slice(0, maxResults),
    nextPageToken: undefined // No pagination for database-only results
  };


  return result;
}
