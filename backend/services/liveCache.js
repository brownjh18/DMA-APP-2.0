// Removed YouTube service dependencies

// Cache configuration - increased durations to reduce API calls
const CACHE_DURATIONS = {
  LIVE: 30 * 60 * 1000,        // 30 minutes for live videos (was checking every 15 min)
  RECENT: 2 * 60 * 60 * 1000,   // 2 hours for recent videos
  ERROR: 10 * 60 * 1000,        // 10 minutes on error (prevent rapid retries)
};

// Cache for YouTube live video ID
let cachedLiveVideoId = null;
let cachedRecentVideos = [];
let lastUpdated = null;
let recentLastUpdated = null;
let quotaExceededAt = null;
let lastLiveError = null;
let lastRecentError = null;

// Check if quota is exceeded
function isQuotaExceeded() {
  if (!quotaExceededAt) return false;
  const timeSinceQuotaError = Date.now() - quotaExceededAt;
  // Keep quota flag for 1 hour to prevent hammering the API
  return timeSinceQuotaError < 60 * 60 * 1000;
}

async function updateLiveCache() {
  // YouTube service removed - no live video caching
  cachedLiveVideoId = null;
  lastUpdated = new Date();
  lastLiveError = null;
  console.log('✅ Live cache updated: No live video (YouTube service removed)');
}

async function updateRecentVideosCache() {
  // YouTube service removed - no recent videos caching
  cachedRecentVideos = [];
  recentLastUpdated = new Date();
  lastRecentError = null;
  console.log('✅ Recent videos cache updated: No videos (YouTube service removed)');
}

function getLiveCache() {
  const isCacheExpired = !lastUpdated || Date.now() - lastUpdated > CACHE_DURATIONS.LIVE;
  return {
    liveVideoId: cachedLiveVideoId,
    updatedAt: lastUpdated,
    cacheStatus: {
      isQuotaExceeded: isQuotaExceeded(),
      cacheAgeMs: lastUpdated ? Date.now() - lastUpdated : null,
      isFresh: !isCacheExpired,
      lastError: lastLiveError,
    },
  };
}

function getRecentVideosCache() {
  // Return cached videos if available
  if (cachedRecentVideos && cachedRecentVideos.length > 0) {
    const isCacheExpired = !recentLastUpdated || Date.now() - recentLastUpdated > CACHE_DURATIONS.RECENT;
    return {
      videos: cachedRecentVideos,
      updatedAt: recentLastUpdated,
      cacheStatus: {
        isQuotaExceeded: isQuotaExceeded(),
        cacheAgeMs: recentLastUpdated ? Date.now() - recentLastUpdated : null,
        isFresh: !isCacheExpired,
        lastError: lastRecentError,
      },
    };
  }

  // Fallback to sample videos if no real videos in cache
  console.log('📺 Returning sample YouTube videos (cache empty or error)');
  const sampleVideos = [
    {
      id: 'sample1',
      title: 'Sample YouTube Sermon 1',
      description: 'This is a sample YouTube video',
      thumbnailUrl: 'https://img.youtube.com/vi/sample1/maxresdefault.jpg',
      publishedAt: new Date().toISOString(),
      duration: '45:00',
      viewCount: '1000',
      isLive: false,
    },
    {
      id: 'sample2',
      title: 'Sample YouTube Sermon 2',
      description: 'This is another sample YouTube video',
      thumbnailUrl: 'https://img.youtube.com/vi/sample2/maxresdefault.jpg',
      publishedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      duration: '50:00',
      viewCount: '800',
      isLive: false,
    }
  ];

  return {
    videos: sampleVideos,
    updatedAt: new Date(),
    cacheStatus: {
      isQuotaExceeded: isQuotaExceeded(),
      cached: false,
      lastError: lastRecentError,
      message: 'Showing sample videos - YouTube API may be temporarily unavailable',
    },
  };
}

function getCacheStatus() {
  const quotaResetTime = quotaExceededAt ? new Date(quotaExceededAt + 60 * 60 * 1000) : null;
  return {
    isQuotaExceeded: isQuotaExceeded(),
    quotaResetAt: quotaResetTime,
    quotaResetInMinutes: quotaExceededAt ? Math.ceil((quotaExceededAt + 60 * 60 * 1000 - Date.now()) / 60000) : null,
    liveCache: {
      cacheAgeMs: lastUpdated ? Date.now() - lastUpdated : null,
      lastError: lastLiveError,
    },
    recentCache: {
      cacheAgeMs: recentLastUpdated ? Date.now() - recentLastUpdated : null,
      lastError: lastRecentError,
    },
    cacheDurations: CACHE_DURATIONS,
  };
}

const isoToTime = (iso) => {
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

module.exports = {
  updateLiveCache,
  getLiveCache,
  updateRecentVideosCache,
  getRecentVideosCache,
  getCacheStatus,
};