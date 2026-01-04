import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
  IonRouterLink,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonMenuButton,
  IonButton,
  IonChip,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonSkeletonText,
  IonText,
  IonRefresher,
  IonRefresherContent,
  IonThumbnail,
  useIonViewWillEnter,
} from '@ionic/react';
import {
  playCircle,
  play,
  book,
  calendar,
  time,
  heart,
  newspaper,
  informationCircle,
  location,
  people,
  radio,
} from 'ionicons/icons';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import { fetchCombinedSermons } from '../services/youtubeService';
import { apiService, BACKEND_BASE_URL, API_BASE_URL } from '../services/api';
import { usePlayer } from '../contexts/PlayerContext';
import { useSettings } from '../contexts/SettingsContext';
import { useNotifications } from '../contexts/NotificationContext';
import './Tab1.css';

// Helper function to convert relative URLs to full backend URLs
const getFullUrl = (url: string) => {
  if (url && url.startsWith('/uploads/')) {
    return `${BACKEND_BASE_URL}${url}`;
  }
  return url;
};

// Helper function to calculate duration between start and end times
const calculateDuration = (startTime: string, endTime: string) => {
  if (!startTime || !endTime) return '—';
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  const diffMs = end - start;
  if (diffMs <= 0) return '—';
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return hours > 0 ? `${hours}:${mins.toString().padStart(2, '0')}:00` : `${mins}:00`;
};

// Helper function to check if a broadcast should be considered ended
const shouldBeConsideredEnded = (broadcast: any) => {
  // If explicitly marked as not live, it's ended
  if (!broadcast.isLive) return true;
  
  // If it has an end time, it's ended
  if (broadcast.broadcastEndTime) return true;
  
  // If it started more than 4 hours ago and has no end time, consider it ended (safety fallback)
  if (broadcast.broadcastStartTime) {
    const startTime = new Date(broadcast.broadcastStartTime).getTime();
    const currentTime = Date.now();
    const durationMs = currentTime - startTime;
    const durationHours = durationMs / (1000 * 60 * 60);
    
    // If broadcast started more than 4 hours ago, consider it ended
    if (durationHours > 4) {
      return true;
    }
  }
  
  return false;
};

interface Devotion {
  id?: string;
  title: string;
  scripture: string;
  content: string;
  reflection: string;
  prayer: string;
  date: string;
  category: string;
  day: number;
  week: number;
}

interface Podcast {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  duration: string;
  viewCount: string;
  audioUrl: string;
  speaker?: string;
  isLive?: boolean;
  broadcastStartTime?: string;
}

interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  imageUrl?: string;
  category?: string;
}

interface YouTubeVideo {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  publishedAt?: string;
  duration?: string;
  viewCount?: string | number;
  channelTitle?: string;
  isLive?: boolean;
}

const generateDailyDevotions = (): Devotion[] => {
  const today = new Date();
  const devotions: Devotion[] = [];

  const series = [
    {
      id: 'faith-foundation',
      devotions: [
        {
          title: 'The Foundation of Faith',
          scripture: 'Hebrews 11:1',
          content: 'Now faith is confidence in what we hope for and assurance about what we do not see.',
          reflection: 'Faith is the cornerstone of our relationship with God.',
          prayer: 'Lord, increase my faith and help me trust You completely.'
        }
      ]
    },
    {
      id: 'love-relationships',
      devotions: [
        {
          title: 'God\'s Love for Us',
          scripture: 'Romans 5:8',
          content: 'But God demonstrates his own love for us in this: While we were still sinners, Christ died for us.',
          reflection: 'God loved us unconditionally even when we were sinners.',
          prayer: 'Thank You Lord for loving me unconditionally.'
        }
      ]
    },
    {
      id: 'spiritual-growth',
      devotions: [
        {
          title: 'Growing in Spiritual Maturity',
          scripture: 'Ephesians 4:15',
          content: 'Speaking the truth in love, we will grow to become mature in Christ.',
          reflection: 'Spiritual growth happens as we become more like Christ.',
          prayer: 'Help me to grow spiritually and become more like Jesus.'
        }
      ]
    }
  ];

  let dayCounter = 1;
  series.forEach((s, seriesIndex) => {
    s.devotions.forEach((d, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - dayCounter + 1);
      devotions.push({
        ...d,
        category: s.id,
        day: i + 1,
        week: seriesIndex + 1,
        date: date.toISOString().split('T')[0]
      });
      dayCounter++;
    });
  });

  return devotions;
};

const DEFAULT_PROGRAMS = [
  { day: 'Mon', program: 'Enough is Enough Prayer Service', time: '5:00PM - 7:00PM', color: '#ff6b6b' },
  { day: 'Tue', program: 'New Believers Class', time: '4:00PM - 5:00PM', color: '#4ecdc4' },
  { day: 'Wed', program: 'Intercessions & Bible Study', time: '8:00AM - 8:00PM', color: '#45b7d1' },
  { day: 'Thu', program: 'Worship Team Fellowship', time: '7:00PM - 9:00PM', color: '#f9ca24' },
  { day: 'Fri', program: "Eagle's Friday Prayer Service", time: '6:00PM - 8:00PM', color: '#f0932b' },
  { day: 'Sat', program: 'Worship Team Fellowship', time: '6:00PM - 9:00PM', color: '#eb4d4b' },
  { day: 'Sun', program: 'Sunday Services', time: '7:30AM - 1:30PM', color: '#6c5ce7' },
];


const Tab1: React.FC = () => {
  const [latestVideos, setLatestVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const infiniteScrollRef = useRef<HTMLIonInfiniteScrollElement | null>(null);
  const history = useHistory();
  const [allDevotions, setAllDevotions] = useState<Devotion[]>([]);
  const [latestPodcasts, setLatestPodcasts] = useState<Podcast[]>([]);
  const [podcastsLoading, setPodcastsLoading] = useState(false);
  const [maxPodcasts, setMaxPodcasts] = useState(3);
  const [latestEvents, setLatestEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [latestMinistries, setLatestMinistries] = useState<any[]>([]);
  const [ministriesLoading, setMinistriesLoading] = useState(false);
  const [devotionsLoading, setDevotionsLoading] = useState(false);
  const { setCurrentMedia, setIsPlaying } = usePlayer();
  const { showNotification } = useSettings();
  const { addNotification } = useNotifications();

  // Cache timestamps to prevent excessive API calls
  const devotionsCacheTime = useRef<number>(0);
  const sermonsCacheTime = useRef<number>(0);
  const podcastsCacheTime = useRef<number>(0);
  const eventsCacheTime = useRef<number>(0);
  const ministriesCacheTime = useRef<number>(0);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Use a ref to prevent multiple initializations
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) {
      console.log('Tab1: Already initialized, skipping');
      return;
    }

    console.log('🔄 Tab1: Initial load useEffect triggered');
    initializedRef.current = true;

    loadDevotions();
    void loadLatestContent();
    void loadLatestPodcasts();
    void loadLatestEvents();
    void loadLatestMinistries();
  }, []); // Empty dependency array

  // Check for refresh flags from admin operations
  useEffect(() => {
    const needsRefresh = sessionStorage.getItem('sermonsNeedRefresh');
    if (needsRefresh === 'true') {
      sessionStorage.removeItem('sermonsNeedRefresh');
      console.log('🔄 Tab1: Detected sermonsNeedRefresh flag, reloading content');
      loadLatestContent();
    }
  }, []);

  // Check for devotion refresh flags from admin operations
  useEffect(() => {
    const needsRefresh = sessionStorage.getItem('devotionsNeedRefresh');
    if (needsRefresh === 'true') {
      sessionStorage.removeItem('devotionsNeedRefresh');
      console.log('🔄 Tab1: Detected devotionsNeedRefresh flag, reloading devotions');
      loadDevotions(true); // Force refresh, bypass cache
    }
  }, []);

  // Set max podcasts based on screen size
  useEffect(() => {
    const updateMaxPodcasts = () => {
      setMaxPodcasts(window.innerWidth >= 768 ? 6 : 3);
    };

    updateMaxPodcasts();
    window.addEventListener('resize', updateMaxPodcasts);

    return () => window.removeEventListener('resize', updateMaxPodcasts);
  }, []);

  // Remove duplicate loadDevotions call - it's already called in useEffect on mount

  const loadDevotions = async (forceRefresh: boolean = false) => {
    const now = Date.now();
    console.log('loadDevotions called - devotionsLoading:', devotionsLoading, 'allDevotions.length:', allDevotions.length, 'cache age:', now - devotionsCacheTime.current, 'forceRefresh:', forceRefresh);

    // Check cache first - only use cache if we have data AND it's fresh AND not forcing refresh
    if (!forceRefresh && allDevotions.length > 0 && (now - devotionsCacheTime.current) < CACHE_DURATION) {
      console.log('loadDevotions: Using cached data');
      return;
    }

    if (devotionsLoading) {
      console.log('loadDevotions: Already loading');
      return; // Prevent multiple simultaneous calls
    }

    try {
      setDevotionsLoading(true);
      console.log('Loading devotions from API...');
      const data = await apiService.getDevotions({ published: true, limit: 100 }, forceRefresh);
      // Sort devotions chronologically (oldest first) to assign day numbers
      const chronologicalDevotions = [...(data.devotions || [])].sort((a: any, b: any) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Create a map of devotion IDs to their chronological day numbers
      const dayNumberMap = new Map();
      chronologicalDevotions.forEach((devotion: any, index: number) => {
        dayNumberMap.set(devotion._id || devotion.id, index + 1);
      });

      // Sort devotions by date (newest first) for display
      const displayDevotions = [...(data.devotions || [])].sort((a: any, b: any) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      const formattedDevotions: Devotion[] = displayDevotions.map((devotion: any) => ({
        id: devotion._id || devotion.id,
        title: devotion.title,
        scripture: devotion.scripture,
        content: devotion.content,
        reflection: devotion.reflection,
        prayer: devotion.prayer,
        date: new Date(devotion.date).toISOString().split('T')[0],
        category: devotion.category,
        day: dayNumberMap.get(devotion._id || devotion.id) || 1, // Use chronological day number
        week: 1 // Default week
      }));
      setAllDevotions(formattedDevotions);
      devotionsCacheTime.current = Date.now();
      console.log('Fetched devotions from DB:', formattedDevotions.length);

      // Add notification for new devotions (only if not forcing refresh and we have new data)
      if (!forceRefresh && formattedDevotions.length > 0) {
        addNotification({
          type: 'devotion',
          title: 'New Devotions Available',
          message: `${formattedDevotions.length} new devotion${formattedDevotions.length > 1 ? 's' : ''} ${formattedDevotions.length > 1 ? 'have' : 'has'} been published`,
          data: { count: formattedDevotions.length }
        });
      }
    } catch (error) {
      console.error('Error fetching devotions from DB:', error);
      setAllDevotions([]);
    } finally {
      setDevotionsLoading(false);
    }
  };

  const loadLatestContent = async () => {
    const now = Date.now();

    // Check cache first
    if (latestVideos.length > 0 && (now - sermonsCacheTime.current) < CACHE_DURATION) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const result = await fetchCombinedSermons(10);
      setLatestVideos(result.videos || []);
      setNextPageToken(result.nextPageToken);
      sermonsCacheTime.current = Date.now();

      // Show notification if enabled
      if (result.videos && result.videos.length > 0) {
        showNotification('New Content Available', `${result.videos.length} new sermons loaded`);
        // Add in-app notification for new sermons
        addNotification({
          type: 'sermon',
          title: 'New Sermons Available',
          message: `${result.videos.length} new sermon${result.videos.length > 1 ? 's' : ''} ${result.videos.length > 1 ? 'have' : 'has'} been published`,
          data: { count: result.videos.length }
        });
      }
    } catch (error) {
      console.error('Error loading latest content:', error);
      setLatestVideos([]); // Ensure empty array on error
    } finally {
      setLoading(false);
    }
  };

  const loadLatestPodcasts = async () => {
    const now = Date.now();
    console.log('Loading latest podcasts - cache age:', now - podcastsCacheTime.current);

    // Check cache first
    if (latestPodcasts.length > 0 && (now - podcastsCacheTime.current) < CACHE_DURATION) {
      console.log('loadLatestPodcasts: Using cached data');
      setPodcastsLoading(false);
      return;
    }

    console.log('Loading latest podcasts and live broadcasts...');
    setPodcastsLoading(true);
    try {
      // Fetch regular podcasts
      let podcasts: Podcast[] = [];
      try {
        const data = await apiService.getPodcasts({ page: 1, limit: 3, published: true });
        podcasts = data.podcasts || [];
      } catch (podcastError) {
        console.warn('Failed to fetch podcasts:', podcastError);
      }

      // Fetch live broadcasts (both live and recently ended)
      let liveBroadcasts: Podcast[] = [];
      try {
        const data = await apiService.getLiveBroadcasts({ page: 1, limit: 10, type: 'live_broadcast' });
        const allBroadcasts = data.broadcasts || [];
    
        // Separate live and ended broadcasts
        const liveOnes = allBroadcasts.filter((b: any) => b.isLive);
        const endedOnes = allBroadcasts.filter((b: any) => !b.isLive).slice(0, 2); // Limit to 2 recently ended
    
        // Format live broadcasts
        const formattedLive = liveOnes.map((broadcast: any) => ({
          id: broadcast.id,
          title: broadcast.title,
          description: broadcast.description,
          thumbnailUrl: broadcast.thumbnailUrl,
          publishedAt: broadcast.broadcastStartTime,
          duration: 'LIVE',
          viewCount: '0',
          audioUrl: broadcast.streamUrl || '',
          speaker: broadcast.speaker,
          isLive: broadcast.isLive,
          broadcastStartTime: broadcast.broadcastStartTime
        }));
    
        // Format ended broadcasts
        const formattedEnded = endedOnes.map((broadcast: any) => ({
          id: broadcast.id,
          title: broadcast.title,
          description: broadcast.description,
          thumbnailUrl: broadcast.thumbnailUrl,
          publishedAt: broadcast.broadcastEndTime || broadcast.broadcastStartTime,
          duration: broadcast.duration || calculateDuration(broadcast.broadcastStartTime, broadcast.broadcastEndTime),
          viewCount: '0',
          audioUrl: broadcast.audioUrl || '',
          speaker: broadcast.speaker,
          isLive: false,
          broadcastStartTime: broadcast.broadcastStartTime
        }));

        // Apply safety check to live broadcasts - mark as ended if they should be
        const checkedLiveBroadcasts = formattedLive.map((broadcast: any) => {
          if (shouldBeConsideredEnded(broadcast)) {
            return {
              ...broadcast,
              isLive: false,
              duration: broadcast.duration || '00:00'
            };
          }
          return broadcast;
        });
    
        liveBroadcasts = [...checkedLiveBroadcasts, ...formattedEnded];
      } catch (liveError) {
        console.warn('Failed to fetch live broadcasts:', liveError);
      }

      // Combine and sort: live broadcasts first, then regular podcasts
      const combined = [...liveBroadcasts, ...podcasts].sort((a, b) => {
        // Live broadcasts always come first
        if (a.isLive && !b.isLive) return -1;
        if (!a.isLive && b.isLive) return 1;

        // Then sort by date
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      });

      setLatestPodcasts(combined.slice(0, 6)); // Limit to 6 total
      podcastsCacheTime.current = Date.now();
      console.log('Podcasts and live broadcasts loaded successfully:', combined.length, 'items');

      // Add notification for new podcasts
      if (podcasts.length > 0) {
        addNotification({
          type: 'podcast',
          title: 'New Podcasts Available',
          message: `${podcasts.length} new podcast${podcasts.length > 1 ? 's' : ''} ${podcasts.length > 1 ? 'have' : 'has'} been published`,
          data: { count: podcasts.length }
        });
      }
    } catch (error) {
      console.error('Error loading latest podcasts:', error);
      setLatestPodcasts([]);
    } finally {
      setPodcastsLoading(false);
    }
  };

  const loadLatestEvents = async () => {
    const now = Date.now();
    console.log('Loading latest events - cache age:', now - eventsCacheTime.current);

    // Check cache first
    if (latestEvents.length > 0 && (now - eventsCacheTime.current) < CACHE_DURATION) {
      console.log('loadLatestEvents: Using cached data');
      setEventsLoading(false);
      return;
    }

    console.log('Loading latest events...');
    setEventsLoading(true);
    try {
      const data = await apiService.getEvents({ limit: 3, published: 'true' });
      setLatestEvents(data.events || []);
      eventsCacheTime.current = Date.now();
      console.log('Events loaded successfully:', data.events?.length || 0, 'events');

      // Add notification for new events
      if (data.events && data.events.length > 0) {
        addNotification({
          type: 'event',
          title: 'New Events Available',
          message: `${data.events.length} new event${data.events.length > 1 ? 's' : ''} ${data.events.length > 1 ? 'have' : 'has'} been scheduled`,
          data: { count: data.events.length }
        });
      }
    } catch (error) {
      console.error('Error loading latest events:', error);
      setLatestEvents([]);
    } finally {
      setEventsLoading(false);
    }
  };

  const loadLatestMinistries = async () => {
    const now = Date.now();
    console.log('Loading latest ministries - cache age:', now - ministriesCacheTime.current);

    // Check cache first
    if (latestMinistries.length > 0 && (now - ministriesCacheTime.current) < CACHE_DURATION) {
      console.log('loadLatestMinistries: Using cached data');
      setMinistriesLoading(false);
      return;
    }

    console.log('Loading latest ministries...');
    setMinistriesLoading(true);
    try {
      const data = await apiService.getMinistries({ active: 'true', limit: 3 });
      setLatestMinistries(data.ministries || []);
      ministriesCacheTime.current = Date.now();
      console.log('Ministries loaded successfully:', data.ministries?.length || 0, 'ministries');

      // Show notification if enabled
      if (data.ministries && data.ministries.length > 0) {
        showNotification('Ministries Updated', `${data.ministries.length} ministries available`);
      }
    } catch (error) {
      console.error('Error loading latest ministries:', error);
      setLatestMinistries([]);
    } finally {
      setMinistriesLoading(false);
    }
  };


  const loadMoreVideos = async (event?: CustomEvent<void>) => {
    // if no token or already loading, complete and return
    (event?.target as HTMLIonInfiniteScrollElement | undefined)?.complete?.();
    if (!nextPageToken || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const result = await fetchCombinedSermons(10, nextPageToken);
      setLatestVideos((prev) => [...prev, ...(result.videos || [])]);
      setNextPageToken(result.nextPageToken);
    } catch (error) {
      console.error('Error loading more videos:', error);
    } finally {
      setIsLoadingMore(false);
      (event?.target as HTMLIonInfiniteScrollElement | undefined)?.complete?.();
    }
  };

  const handleRefresh = async (event: CustomEvent) => {
    await Promise.all([loadDevotions(true), loadLatestContent(), loadLatestPodcasts(), loadLatestEvents(), loadLatestMinistries()]);
    event.detail.complete();
  };

  const handleVideoClick = async (video: YouTubeVideo) => {
    // Increment view count for database sermons
    if ((video as any).isDatabaseSermon) {
      try {
        await apiService.getSermon(video.id);
      } catch (error) {
        console.error('Error incrementing view count:', error);
      }
    }

    history.push(`/tab2?videoId=${video.id}`);
  };

  const handlePodcastClick = async (podcast: Podcast) => {
    // Set current media in PlayerContext
    setCurrentMedia(podcast);
    setIsPlaying(true);

    // Increment listen count for podcasts
    try {
      await fetch(`${API_BASE_URL}/podcasts/${podcast.id}?listen=true`, {
        method: 'GET',
        headers: {
          'x-requested-with': 'listen'
        }
      });
    } catch (error) {
      console.warn('Failed to increment listen count:', error);
    }

    // Navigate to player with state indicating origin
    history.push('/podcast-player', { from: 'home' });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatViews = (v?: number | string) => {
    if (!v) return '—';
    const n = typeof v === 'string' ? Number(v) : v;
    if (Number.isNaN(n)) return '—';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return `${n}`;
  };

  const todaysDevotion = allDevotions[0]; // Always show the latest devotion uploaded

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Home</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>
        {/* FOR YOU - DEVOTION */}
        {todaysDevotion && (
          <section className="section-padding">
            <div className="section-head">
              <div className="section-title">
                <IonIcon icon={heart} />
                <h2>Today's Devotion</h2>
              </div>
            </div>

            <article className="devotion-card" role="article" aria-labelledby="devotion-title">
              <div className="devotion-media" aria-hidden>
                {/* subtle background image + blur handled by CSS */}
              </div>

              <div className="devotion-content">
                <div className="devotion-top">
                  <div className="devotion-label">
                    <IonIcon icon={book} />
                    <span>Daily Devotion</span>
                  </div>

                  <div className="devotion-date" aria-hidden>
                    <IonIcon icon={time} />
                    <span>{formatDate(todaysDevotion.date)}</span>
                  </div>
                </div>

                <div id="devotion-title" className="devotion-verse">
                  <h3>{todaysDevotion.title}</h3>
                  <p className="verse-text">"{todaysDevotion.content}"</p>
                  <p className="verse-text" style={{ fontSize: '0.9em', opacity: 0.8, marginTop: '8px' }}>
                    {todaysDevotion.scripture}
                  </p>
                </div>

                <div className="devotion-bottom">
                  <p className="devotion-summary">
                    {todaysDevotion.reflection}
                  </p>

                  <div className="devotion-cta">
                    <IonButton
                      fill="outline"
                      size="default"
                      className="cta-btn"
                      aria-label="Read full devotion"
                      onClick={() => {
                        const devotionId = todaysDevotion.id || `${todaysDevotion.category}-${todaysDevotion.day}`;
                        console.log('Button clicked, navigating to:', `/full-devotion?id=${devotionId}`);
                        history.push(`/full-devotion?id=${devotionId}`);
                      }}
                    >
                      Read Full Devotion
                      <IonIcon icon={book} slot="end" />
                    </IonButton>
                  </div>
                </div>
              </div>
            </article>
          </section>
        )}

        {/* WEEKLY PROGRAMS */}
        <section className="section-padding programs-section">
          <div className="section-head">
            <div className="section-title">
              <IonIcon icon={time} />
              <h2>Weekly Programs</h2>
            </div>
          </div>

          <div className="programs-row" role="list">
            {DEFAULT_PROGRAMS.map((p, idx) => (
              <div
                key={idx}
                className="program-card"
                role="listitem"
                onClick={() => history.push('/events#weekly-programs')}
                style={{ cursor: 'pointer' }}
              >
                <div className="program-badge" style={{ background: p.color }}>
                  <strong>{p.day}</strong>
                </div>
                <div className="program-body">
                  <div className="program-name">{p.program}</div>
                  <div className="program-time">{p.time}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* LATEST SERMONS */}
        <section className="section-padding">
          <div className="section-head">
            <div className="section-title">
              <IonIcon icon={playCircle} />
              <h2>Latest Sermons</h2>
            </div>
            <IonButton fill="clear" className="view-all-link" onClick={() => history.push('/tab2')}>
              View All
            </IonButton>
          </div>

          <div className="devotions-row" role="list">
            {loading ? (
              // show 3 skeleton cards while initial load
              [0, 1, 2].map((n) => (
                <article key={n} className="devotion-card-small skeleton" role="article" aria-hidden>
                  <IonSkeletonText animated style={{ width: '100%', aspectRatio: '16/9', borderRadius: 20 }} />
                </article>
              ))
            ) : (
              latestVideos.slice(0, 5).map((video) => (
                  <article
                    key={video.id}
                    className="devotion-card-small"
                    role="article"
                    onClick={() => handleVideoClick(video)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="devotion-media-small">
                      <img
                        src={getFullUrl(video.thumbnailUrl || '/bible.JPG')}
                        alt={video.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: '20px'
                        }}
                        onError={(e) => {
                          e.currentTarget.src = '/bible.JPG'; // Fallback
                        }}
                        aria-hidden
                      />
                      {video.isLive && (
                        <div className="sermon-live-badge" style={{
                          position: 'absolute',
                          bottom: '8px',
                          right: '8px'
                        }}>
                          <IonBadge
                            style={{
                              backgroundColor: '#ef4444',
                              color: 'white',
                              fontSize: '0.5em',
                              fontWeight: 'bold',
                              animation: 'pulse 2s infinite'
                            }}
                          >
                            LIVE
                          </IonBadge>
                        </div>
                      )}
                    </div>
                    <div className="devotion-content-small">
                      <div className="devotion-top">
                        <div className="devotion-label">
                          <IonIcon icon={playCircle} />
                          <span>Sermon</span>
                        </div>
                      </div>
                      <div className="devotion-verse" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h3>{video.title.length > 40 ? video.title.substring(0, 40) + '…' : video.title}</h3>
                          <p className="verse-text">
                            {formatDate(video.publishedAt)} • {video.duration || '—'}
                            {video.viewCount && ` • ${formatViews(video.viewCount)} views`}
                          </p>
                        </div>
                        <div
                          style={{
                            width: '52px',
                            height: '52px',
                            borderRadius: '26px',
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            boxShadow: '0 6px 16px rgba(0,0,0,0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            cursor: 'pointer',
                            marginLeft: '8px',
                            transition: 'transform 0.2s ease'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            const target = e.currentTarget as HTMLElement;
                            target.style.transform = 'scale(0.8)';
                            setTimeout(() => {
                              target.style.transform = 'scale(1)';
                            }, 200);
                            handleVideoClick(video);
                          }}
                        >
                          <IonIcon icon={play} style={{ color: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? '#ffffff' : '#000000', fontSize: '22px' }} />
                        </div>
                      </div>
                    </div>
                  </article>
                ))
            )}
          </div>
        </section>

        {/* LATEST PODCASTS */}
        <section className="section-padding">
          <div className="podcasts-section-wrapper">
            <div className="section-head">
              <div className="section-title">
                <IonIcon icon={radio} />
                <h2>Latest Podcasts</h2>
              </div>
              <IonButton fill="clear" className="view-all-link" onClick={() => history.push('/tab4')}>
                View All
              </IonButton>
            </div>

            <div className="podcasts-row">
              {podcastsLoading ? (
                // show skeleton cards while initial load
                Array.from({ length: maxPodcasts }, (_, n) => (
                  <article key={n} className="podcast-card skeleton" role="article" aria-hidden>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <IonSkeletonText animated style={{ width: '56px', height: '56px', borderRadius: '50%', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <IonSkeletonText animated style={{ width: '100%', height: '16px', marginBottom: '4px' }} />
                        <IonSkeletonText animated style={{ width: '60%', height: '12px' }} />
                      </div>
                      <IonSkeletonText animated style={{ width: '44px', height: '44px', borderRadius: '22px', flexShrink: 0 }} />
                    </div>
                  </article>
                ))
              ) : (
                latestPodcasts.slice(0, maxPodcasts).map((podcast) => (
                  <article
                    key={podcast.id}
                    className="podcast-card"
                    role="article"
                    onClick={() => handlePodcastClick(podcast)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <div className="podcast-thumb-wrap" style={{ width: '56px', height: '60px', flexShrink: 0, position: 'relative' }}>
                        <img
                          src={getFullUrl(podcast.thumbnailUrl)}
                          alt={podcast.title}
                          className="podcast-thumb"
                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                        />
                        {podcast.isLive && (
                          <div className="podcast-live-badge">
                            <IonBadge
                              style={{
                                backgroundColor: '#ef4444',
                                color: 'white',
                                fontSize: '0.5em',
                                fontWeight: 'bold',
                                animation: 'pulse 2s infinite'
                              }}
                            >
                              LIVE
                            </IonBadge>
                          </div>
                        )}
                        <div className="podcast-play-overlay" style={{ width: '28px', height: '28px', borderRadius: '50%' }}>
                          <IonIcon icon={radio} style={{ fontSize: '14px' }} />
                        </div>
                      </div>
                      <div className="podcast-info" style={{ flex: 1 }}>
                        <h3 className="podcast-title" style={{ fontSize: '13px', margin: '0 0 2px 0' }}>
                          {podcast.title.length > 40 ? podcast.title.substring(0, 40) + '…' : podcast.title}
                        </h3>
                        <p className="podcast-meta" style={{ fontSize: '11px', margin: '0' }}>
                          {podcast.isLive ? 'Broadcasting now' : formatDate(podcast.publishedAt)}
                          {podcast.duration && ` • ${podcast.duration}`}
                          {podcast.speaker && ` • ${podcast.speaker}`}
                        </p>
                      </div>
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '22px',
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          boxShadow: '0 6px 16px rgba(0,0,0,0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          cursor: 'pointer',
                          marginRight: '8px',
                          transition: 'transform 0.2s ease'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          const target = e.currentTarget as HTMLElement;
                          target.style.transform = 'scale(0.8)';
                          setTimeout(() => {
                            target.style.transform = 'scale(1)';
                          }, 200);
                          handlePodcastClick(podcast);
                        }}
                      >
                        <IonIcon icon={play} style={{ color: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? '#ffffff' : '#000000', fontSize: '18px' }} />
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </section>


        {/* UPDATES */}
        <section className="section-padding">
          <div className="section-head">
            <div className="section-title">
              <IonIcon icon={newspaper} />
              <h2>Updates</h2>
            </div>
            <IonButton fill="clear" className="view-all-link" onClick={() => history.push('/events')}>
              View All
            </IonButton>
          </div>

          <div className="devotions-row" role="list">
            {eventsLoading ? (
              // show 3 skeleton cards while initial load
              [0, 1, 2].map((n) => (
                <article key={n} className="devotion-card-small skeleton" role="article" aria-hidden>
                  <IonSkeletonText animated style={{ width: '100%', aspectRatio: '16/9', borderRadius: 20 }} />
                </article>
              ))
            ) : latestEvents.length > 0 ? (
              latestEvents.slice(0, 3).map((event) => (
                <article
                  key={event._id}
                  className="devotion-card-small"
                  role="article"
                  onClick={() => history.push(`/event/${event._id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div
                    className="devotion-media-small"
                    style={{ backgroundImage: `url(${getFullUrl(event.imageUrl || '')})` }}
                    aria-hidden
                  />
                  <div className="devotion-content-small">
                    <div className="devotion-top">
                      <div className="devotion-label">
                        <IonIcon icon={calendar} />
                        <span>Event</span>
                      </div>
                    </div>
                    <div className="devotion-verse">
                      <h3>{event.title.length > 40 ? event.title.substring(0, 40) + '…' : event.title}</h3>
                      <p className="verse-text">
                        {formatDate(event.date)} • {event.location}
                      </p>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: 'var(--ion-color-medium)',
                width: '100%'
              }}>
                <IonIcon icon={calendar} style={{ fontSize: '3em', marginBottom: '16px', opacity: 0.5 }} />
                <p>No upcoming events at this time.</p>
              </div>
            )}
          </div>
        </section>

        {/* MINISTRIES */}
        <section className="section-padding">
          <div className="section-head">
            <div className="section-title">
              <IonIcon icon={people} />
              <h2>Ministries</h2>
            </div>
            <IonButton fill="clear" className="view-all-link" onClick={() => history.push('/ministries')}>
              View All
            </IonButton>
          </div>

          <div className="devotions-row" role="list">
            {ministriesLoading ? (
              // show 3 skeleton cards while initial load
              [0, 1, 2].map((n) => (
                <article key={n} className="devotion-card-small skeleton" role="article" aria-hidden>
                  <IonSkeletonText animated style={{ width: '100%', aspectRatio: '16/9', borderRadius: 20 }} />
                </article>
              ))
            ) : latestMinistries.length > 0 ? (
              latestMinistries.slice(0, 3).map((ministry) => (
                <article
                  key={ministry._id}
                  className="devotion-card-small"
                  role="article"
                  onClick={() => history.push(`/ministry/${ministry._id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div
                    className="devotion-media-small"
                    style={{ backgroundImage: `url(${getFullUrl(ministry.imageUrl || '')})` }}
                    aria-hidden
                  />
                  <div className="devotion-content-small">
                    <div className="devotion-top">
                      <div className="devotion-label">
                        <IonIcon icon={people} />
                        <span>Ministry</span>
                      </div>
                    </div>
                    <div className="devotion-verse">
                      <h3>{ministry.name.length > 40 ? ministry.name.substring(0, 40) + '…' : ministry.name}</h3>
                      <p className="verse-text">
                        {ministry.description ? ministry.description.substring(0, 60) + '...' : ''}
                      </p>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: 'var(--ion-color-medium)',
                width: '100%'
              }}>
                <IonIcon icon={people} style={{ fontSize: '3em', marginBottom: '16px', opacity: 0.5 }} />
                <p>No ministries available at this time.</p>
              </div>
            )}
          </div>
        </section>

        {/* ABOUT DMA */}
        <div style={{
          padding: '20px',
          maxWidth: '400px',
          margin: '20px auto'
        }}>
          <div style={{
            backgroundColor: 'var(--ion-background-color)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 12px rgba(161, 117, 117, 0.1)',
            border: '1px solid var(--ion-color-step-200)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <IonIcon
                icon={informationCircle}
                style={{
                  fontSize: '2.5em',
                  color: 'var(--ion-color-primary)',
                  marginBottom: '12px'
                }}
              />
              <h2 style={{
                margin: '0 0 8px 0',
                fontSize: '1.5em',
                fontWeight: '700',
                color: 'var(--ion-text-color)'
              }}>
                About DMA
              </h2>
            </div>

            <p style={{
              margin: '0 0 20px 0',
              color: 'var(--ion-color-medium)',
              lineHeight: '1.6',
              fontSize: '0.95em',
              textAlign: 'center'
            }}>
              Transforming lives through faith, community, and service across Africa since 2005.
            </p>

            <IonRouterLink routerLink="/tab5">
              <IonButton style={{
                width: '100%',
                height: '44px',
                borderRadius: '8px',
                fontWeight: '600',
                backgroundColor: 'var(--ion-color-primary)',
                '--border-radius': '8px'
              }}>
                <IonIcon icon={informationCircle} slot="start" />
                Learn More
              </IonButton>
            </IonRouterLink>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Tab1;
