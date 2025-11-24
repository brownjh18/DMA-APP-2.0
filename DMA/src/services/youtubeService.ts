// src/services/youtubeService.ts
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

const USE_SERVER_PROXY = false; // set to false to try direct fetch (not recommended)

export async function fetchRecentSermons(maxResults = 30, pageToken?: string): Promise<FetchResult> {
  if (USE_SERVER_PROXY) {
    // YOUR BACKEND /api/youtube/recent should call YouTube using the project API_KEY
    const q = new URLSearchParams();
    q.set('maxResults', String(maxResults));
    if (pageToken) q.set('pageToken', pageToken);
    const resp = await fetch(`/api/youtube/recent?${q.toString()}`);
    if (!resp.ok) throw new Error('Server proxy error: ' + resp.statusText);
    return resp.json();
  } else {
    // Quick direct client-side call (DEVELOPMENT ONLY).
    return await fetchDirectFromYouTube(maxResults, pageToken);
  }
}

/**
 * Fetch live streams specifically
 */
export async function fetchLiveStreams(maxResults = 10): Promise<YouTubeVideo[]> {
  if (USE_SERVER_PROXY) {
    const resp = await fetch(`/api/youtube/live?maxResults=${maxResults}`);
    if (!resp.ok) throw new Error('Server proxy error: ' + resp.statusText);
    return resp.json();
  } else {
    return await fetchLiveStreamsDirect(maxResults);
  }
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
  if (!searchResp.ok) throw new Error('YouTube live search failed');
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
  if (!videosResp.ok) throw new Error('YouTube live videos failed');
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
