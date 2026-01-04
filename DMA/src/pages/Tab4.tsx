import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonLoading, IonRefresher, IonRefresherContent, IonMenuButton, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon, IonPopover } from '@ionic/react';
import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { play, eye, share, bookmark, radio, pause, ellipsisVertical } from 'ionicons/icons';
import { usePlayer } from '../contexts/PlayerContext';
import { useNotifications } from '../contexts/NotificationContext';

import './Tab4.css';

// Helper function to convert relative URLs to full backend URLs
const getFullUrl = (url: string) => {
  // Since /uploads is now proxied in vite.config.ts, we can use relative URLs
  return url;
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


const Tab4: React.FC = () => {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [liveBroadcasts, setLiveBroadcasts] = useState<Podcast[]>([]);
  const [lastPodcast, setLastPodcast] = useState<Podcast | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showOptionsPopover, setShowOptionsPopover] = useState(false);
  const [optionsPopoverEvent, setOptionsPopoverEvent] = useState<MouseEvent | undefined>();
  const [selectedPodcast, setSelectedPodcast] = useState<Podcast | null>(null);
  const history = useHistory();
  const { setCurrentMedia, setIsPlaying } = usePlayer();
  const { addNotification } = useNotifications();

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    console.log('loadContent called');
    setLoading(true);
    setError(null);

    try {

      // Load live broadcasts first
      try {
        const liveResponse = await fetch('/api/live-broadcasts?type=live_broadcast&status=live&limit=5');
        if (liveResponse.ok) {
          const liveData = await liveResponse.json();
          const formattedLiveBroadcasts = liveData.broadcasts.map((broadcast: any) => ({
            id: broadcast.id,
            title: broadcast.title,
            description: broadcast.description || '',
            thumbnailUrl: broadcast.thumbnailUrl || '/bible.JPG',
            publishedAt: broadcast.broadcastStartTime || '',
            duration: (!shouldBeConsideredEnded(broadcast) && broadcast.isLive) ? 'LIVE' : (broadcast.duration || '00:00'),
            viewCount: broadcast.viewCount?.toString() || '0',
            audioUrl: broadcast.streamUrl || '',
            speaker: broadcast.speaker || 'Dove Ministries Africa',
            isLive: !shouldBeConsideredEnded(broadcast) && broadcast.isLive
          }));
          setLiveBroadcasts(formattedLiveBroadcasts);
        }
      } catch (e) {
        console.warn('Live broadcasts fetch failed:', e);
      }

      // Load podcasts - only show published ones
      const podcastResponse = await fetch('/api/podcasts?published=true&page=1&limit=20');
      if (!podcastResponse.ok) {
        throw new Error('Failed to fetch podcasts');
      }

      const podcastData = await podcastResponse.json();

      // Load all live broadcasts and filter for stopped ones that are published
      let stoppedLiveBroadcasts = [];
      try {
        const allLiveResponse = await fetch('/api/live-broadcasts?type=live_broadcast&limit=50');
        if (allLiveResponse.ok) {
          const allLiveData = await allLiveResponse.json();
          // Filter for broadcasts that are not currently live and are published
          const stoppedBroadcasts = allLiveData.broadcasts.filter((broadcast: any) =>
            !broadcast.isLive && broadcast.status === 'published'
          );
          stoppedLiveBroadcasts = stoppedBroadcasts.map((broadcast: any) => ({
            id: broadcast.id,
            title: broadcast.title,
            description: broadcast.description || '',
            thumbnailUrl: broadcast.thumbnailUrl || '/bible.JPG',
            publishedAt: broadcast.broadcastEndTime || broadcast.broadcastStartTime || '',
            duration: broadcast.duration || '00:00',
            viewCount: broadcast.viewCount?.toString() || '0',
            audioUrl: broadcast.audioUrl || '',
            speaker: broadcast.speaker || 'Dove Ministries Africa',
            isLive: false,
            broadcastStartTime: broadcast.broadcastStartTime // For badge color logic
          }));
        }
      } catch (e) {
        console.warn('All live broadcasts fetch failed:', e);
      }

      // Combine podcasts and stopped live broadcasts
      const allContent = [...podcastData.podcasts, ...stoppedLiveBroadcasts];

      if (allContent.length > 0) {
        // Sort by published date (newest first)
        allContent.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

        setLastPodcast(allContent[0]);
        setPodcasts(allContent.slice(1));
      } else {
        // No content available
        setLastPodcast(null);
        setPodcasts([]);
      }

      setHasMore(podcastData.pagination && podcastData.pagination.page * podcastData.pagination.limit < podcastData.pagination.total);
    } catch (err) {
      console.error('Error loading content:', err);
      setError('Unable to load content. Please check your internet connection and try again.');
      setLastPodcast(null);
      setPodcasts([]);
      setLiveBroadcasts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPodcasts = async (loadMore: boolean = false) => {
    try {
      if (loadMore) {
        setIsLoadingMore(true);
      }

      const page = loadMore ? Math.ceil(podcasts.length / 10) + 1 : 1;
      const response = await fetch(`/api/podcasts?page=${page}&limit=10`);

      if (!response.ok) {
        throw new Error('Failed to fetch podcasts');
      }

      const data = await response.json();

      if (loadMore) {
        setPodcasts(prev => [...prev, ...data.podcasts]);
        setIsLoadingMore(false);
      }

      setHasMore(data.pagination && data.pagination.page * data.pagination.limit < data.pagination.total);
    } catch (err) {
      console.error('Error loading more podcasts:', err);
      if (loadMore) {
        setIsLoadingMore(false);
      }
    }
  };

  const handleRefresh = async (event: CustomEvent) => {
    await loadContent();
    event.detail.complete();
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return 'Unknown date';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'Unknown date';
    }
  };

  const handleSave = (podcast: Podcast, event: React.MouseEvent) => {
    event.stopPropagation();

    try {
      // Get existing saved podcasts
      const savedPodcasts = JSON.parse(localStorage.getItem('savedPodcasts') || '[]');

      // Check if already saved
      const isAlreadySaved = savedPodcasts.some((p: any) => p.id === podcast.id);

      if (isAlreadySaved) {
        alert(`"${podcast.title}" is already in your saved list.`);
        return;
      }

      // Create saved podcast object
      const savedPodcast = {
        id: podcast.id,
        title: podcast.title,
        speaker: podcast.speaker || 'Dove Ministries Africa',
        description: podcast.description || '',
        thumbnailUrl: podcast.thumbnailUrl || '',
        publishedAt: podcast.publishedAt || '',
        duration: podcast.duration || '',
        audioUrl: podcast.audioUrl || '',
        isLive: podcast.isLive || false,
        savedAt: new Date().toISOString()
      };

      // Add to saved podcasts
      savedPodcasts.push(savedPodcast);
      localStorage.setItem('savedPodcasts', JSON.stringify(savedPodcasts));

      // Show success message
      alert(`"${podcast.title}" has been saved to your list!`);

      // Add notification for saved podcast
      addNotification({
        type: 'podcast',
        title: 'Podcast Saved',
        message: `"${podcast.title}" has been saved to your library for offline listening`,
        data: { podcastId: podcast.id, title: podcast.title }
      });
    } catch (error) {
      console.error('Error saving podcast:', error);
      alert('Failed to save podcast. Please try again.');
    }
  };

  const handlePodcastClick = (podcast: Podcast) => {
    setCurrentMedia(podcast);
    setIsPlaying(true);
    history.push('/podcast-player');
  };

  const handleOptionsClick = (podcast: Podcast, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedPodcast(podcast);
    setOptionsPopoverEvent(event.nativeEvent);
    setShowOptionsPopover(true);
  };

  const getBadgeColor = (podcast: Podcast) => {
    if (podcast.isLive) {
      return '#ef4444'; // Red for live broadcasts
    } else if (podcast.broadcastStartTime) {
      return '#059669'; // Green for recorded live broadcasts
    } else {
      return '#007bff'; // Blue for regular uploaded podcasts
    }
  };

  const getBadgeText = (podcast: Podcast) => {
    if (podcast.isLive) {
      return 'LIVE';
    } else {
      return 'PODCAST';
    }
  };

  if (loading) {
    return (
      <IonPage>
        <IonLoading isOpen={loading} message="Loading podcasts..." />
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Radio Podcast</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="podcasts-content">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Radio Podcast</IonTitle>
          </IonToolbar>
        </IonHeader>

        {error && (
          <IonItem>
            <IonLabel color="danger">
              <h3>Error</h3>
              <p>{error}</p>
            </IonLabel>
          </IonItem>
        )}


        {/* Live Broadcasts Section */}
        {liveBroadcasts.length > 0 && (
          <div style={{ padding: '15px', paddingBottom: '10px' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1em', fontWeight: '600', color: '#ef4444' }}>
              Live Now
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '410px', margin: '0 auto' }}>
              {liveBroadcasts.map((broadcast) => (
                <div
                  key={`live-${broadcast.id}`}
                  className="podcast-item"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: 'var(--ion-background-color)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: 'none',
                    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.2)',
                    maxWidth: '410px'
                  }}
                  onClick={() => handlePodcastClick(broadcast)}
                >
                  <div className="podcast-thumbnail-container" style={{ position: 'relative' }}>
                    <img
                      src={getFullUrl(broadcast.thumbnailUrl)}
                      alt={broadcast.title}
                      className="podcast-thumbnail"
                    />
                    <div style={{
                      position: 'absolute',
                      bottom: '8px',
                      right: '8px',
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      color: 'white',
                      padding: '3px 8px',
                      borderRadius: '8px',
                      fontSize: '0.8em',
                      fontWeight: '600',
                      backdropFilter: 'blur(10px)'
                    }}>
                      {broadcast.duration}
                    </div>
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      background: 'linear-gradient(135deg, #ef4444, #ef4444dd)',
                      color: 'white',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '0.75em',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
                      border: '1px solid rgba(239, 68, 68, 0.8)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      backdropFilter: 'blur(10px)'
                    }}>
                      <div style={{
                        width: '6px',
                        height: '6px',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        animation: 'pulse 1s infinite',
                        boxShadow: '0 0 6px rgba(255, 255, 255, 0.8)'
                      }} />
                      LIVE
                    </div>
                  </div>
                  <div style={{ flex: '1', padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div style={{ flex: 1, marginRight: '8px' }}>
                          <h4 className="podcast-title" style={{ fontSize: '0.85em', fontWeight: '600', margin: '0 0 4px 0' }}>
                            {broadcast.title}
                          </h4>
                          <p style={{ margin: '0', fontSize: '0.8em', color: 'var(--ion-color-medium)' }}>
                            {broadcast.speaker || 'Dove Ministries Africa'}
                          </p>
                        </div>
                      </div>
                      <p style={{ margin: '0', fontSize: '0.8em', color: 'var(--ion-color-medium)' }}>
                        Live broadcast • {broadcast.viewCount} watching
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Podcasts Grid */}
        <div style={{ padding: '10px 15px' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1em', fontWeight: '600' }}>
            Recent Podcasts
          </h3>
          {lastPodcast && (
            <div
              className="podcast-item"
              style={{
                display: 'flex',
                alignItems: 'center',
                margin: '0 auto 15px auto',
                backgroundColor: 'var(--ion-background-color)',
                borderRadius: '8px',
                cursor: 'pointer',
                border: 'none',
                maxWidth: '410px',
                position: 'relative'
              }}
              onClick={() => handlePodcastClick(lastPodcast)}
            >
              <IonButton
                fill="clear"
                size="small"
                onClick={(e) => handleOptionsClick(lastPodcast, e)}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  zIndex: 10,
                  margin: '0',
                  padding: '4px',
                  minWidth: '32px',
                  height: '32px',
                  '--color': 'white'
                }}
              >
                <IonIcon icon={ellipsisVertical} style={{ fontSize: '1.4em' }} />
              </IonButton>
              <div className="podcast-thumbnail-container" style={{ position: 'relative' }}>
                <img
                  src={getFullUrl(lastPodcast.thumbnailUrl)}
                  alt={lastPodcast.title}
                  className="podcast-thumbnail"
                />
                <div style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '8px',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '0.8em',
                  backgroundColor: 'rgba(0,0,0,0.8)'
                }}>
                  {lastPodcast.duration}
                </div>
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  left: '8px',
                  background: 'var(--ion-color-primary)',
                  color: 'white',
                  padding: '1px 4px',
                  borderRadius: '4px',
                  fontSize: '0.6em',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  backdropFilter: 'blur(10px)'
                }}>
                  {getBadgeText(lastPodcast)}
                </div>
              </div>
              <div style={{ flex: '1', padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ width: '100%' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <h4 className="podcast-title" style={{ fontSize: '0.95em', fontWeight: '600', margin: '0 0 4px 0' }}>
                      {lastPodcast.title}
                    </h4>
                    <p style={{ margin: '0', fontSize: '0.8em', color: 'var(--ion-color-medium)' }}>
                      Dove Ministries Africa
                    </p>
                  </div>
                  <p style={{ margin: '0', fontSize: '0.8em', color: 'var(--ion-color-medium)' }}>
                    {formatDate(lastPodcast.publishedAt)} • {lastPodcast.viewCount} listens
                  </p>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '410px', margin: '0 auto' }}>
            {podcasts.map((podcast) => (
              <div
                key={podcast.id}
                className="podcast-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'var(--ion-background-color)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: 'none',
                  maxWidth: '410px',
                  position: 'relative'
                }}
                onClick={() => handlePodcastClick(podcast)}
              >
                <IonButton
                  fill="clear"
                  size="small"
                  onClick={(e) => handleOptionsClick(podcast, e)}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    zIndex: 10,
                    margin: '0',
                    padding: '4px',
                    minWidth: '32px',
                    height: '32px',
                    '--color': 'white'
                  }}
                >
                  <IonIcon icon={ellipsisVertical} style={{ fontSize: '1.4em' }} />
                </IonButton>
                <div className="podcast-thumbnail-container" style={{ position: 'relative' }}>
                  <img
                    src={getFullUrl(podcast.thumbnailUrl)}
                    alt={podcast.title}
                    className="podcast-thumbnail"
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '8px',
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '0.8em'
                  }}>
                    {podcast.duration}
                  </div>
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    background: 'var(--ion-color-primary)',
                    color: 'white',
                    padding: '1px 4px',
                    borderRadius: '4px',
                    fontSize: '0.6em',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    backdropFilter: 'blur(10px)'
                  }}>
                    {getBadgeText(podcast)}
                  </div>
                </div>
                <div style={{ flex: '1', padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ width: '100%' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <h4 className="podcast-title" style={{ fontSize: '0.85em', fontWeight: '600', margin: '0 0 4px 0' }}>
                        {podcast.title}
                      </h4>
                      <p style={{ margin: '0', fontSize: '0.8em', color: 'var(--ion-color-medium)' }}>
                        Dove Ministries Africa
                      </p>
                    </div>
                    <p style={{ margin: '0', fontSize: '0.8em', color: 'var(--ion-color-medium)' }}>
                      {formatDate(podcast.publishedAt)} • {podcast.viewCount} listens
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {isLoadingMore && (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--ion-color-medium)' }}>
              <p>Loading more podcasts...</p>
            </div>
          )}

          {!hasMore && podcasts.length > 0 && (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--ion-color-medium)' }}>
              <p>You've reached the end of all available podcasts.</p>
            </div>
          )}

          {podcasts.length === 0 && !error && !loading && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--ion-color-medium)' }}>
              <h3>No recent podcasts available</h3>
              <p>Please check back later for new content from Dove Ministries Africa.</p>
            </div>
          )}
        </div>

        {/* Options Popover for podcast items */}
        <IonPopover isOpen={showOptionsPopover} event={optionsPopoverEvent} onDidDismiss={() => setShowOptionsPopover(false)} side="bottom" alignment="center">
          <div style={{
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.05) 100%)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '2px solid white',
            borderRadius: '8px',
            overflow: 'hidden',
            minWidth: '120px',
            padding: '2px 0'
          }}>
            <IonList style={{ background: 'transparent', padding: '0' }}>
              <IonItem button style={{ '--background-hover': 'rgba(255,255,255,0.1)', '--padding-start': '8px', '--inner-padding-end': '8px', minHeight: '32px' }} onClick={() => {
                if (selectedPodcast) {
                  handleSave(selectedPodcast, { stopPropagation: () => {} } as any);
                }
                setShowOptionsPopover(false);
              }}>
                <IonIcon icon={bookmark} slot="start" style={{ fontSize: '1em' }} />
                <IonLabel style={{ fontSize: '0.85em' }}>Save</IonLabel>
              </IonItem>
              <IonItem button style={{ '--background-hover': 'rgba(255,255,255,0.1)', '--padding-start': '8px', '--inner-padding-end': '8px', minHeight: '32px' }} onClick={async () => {
                if (selectedPodcast) {
                  const shareData = {
                    title: selectedPodcast.title,
                    text: selectedPodcast.description,
                    url: `${window.location.origin}/tab4`
                  };

                  try {
                    if (navigator.share) {
                      await navigator.share(shareData);
                    } else {
                      // Fallback: copy to clipboard
                      const textToCopy = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
                      await navigator.clipboard.writeText(textToCopy);
                      alert('Podcast details copied to clipboard!');
                    }
                  } catch (error) {
                    console.error('Error sharing:', error);
                    alert('Failed to share podcast. Please try again.');
                  }
                }
                setShowOptionsPopover(false);
              }}>
                <IonIcon icon={share} slot="start" style={{ fontSize: '1em' }} />
                <IonLabel style={{ fontSize: '0.85em' }}>Share</IonLabel>
              </IonItem>
            </IonList>
          </div>
        </IonPopover>
      </IonContent>
    </IonPage>
  );
};

export default Tab4;