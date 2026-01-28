import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonLoading, IonRefresher, IonRefresherContent, IonMenuButton, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon, IonPopover, IonActionSheet } from '@ionic/react';
import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { play, eye, share, heart, heartOutline, radio, pause, ellipsisVertical, time, musicalNote, calendar } from 'ionicons/icons';
import { usePlayer } from '../contexts/PlayerContext';
import { apiService, BACKEND_BASE_URL } from '../services/api';

import './Tab4.css';

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
  const [savedPodcasts, setSavedPodcasts] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [selectedPodcast, setSelectedPodcast] = useState<Podcast | null>(null);
  const history = useHistory();
  const { currentMedia, setCurrentMedia, setIsPlaying } = usePlayer();

  // Helper function to convert relative URLs to full backend URLs
  const getFullUrl = (url: string) => {
    if (url.startsWith('/uploads')) {
      return `http://localhost:5000${url}`;
    }
    return url;
  };

  useEffect(() => {
    loadContent();
    // Load saved podcasts from localStorage
    const saved = JSON.parse(localStorage.getItem('savedPodcasts') || '[]');
    setSavedPodcasts(saved);
  }, []);

  // Check for refresh flags from admin operations
  useEffect(() => {
    const needsRefresh = sessionStorage.getItem('podcastsNeedRefresh');
    if (needsRefresh === 'true') {
      sessionStorage.removeItem('podcastsNeedRefresh');
      loadContent(true); // Force refresh
    }
  }, []);

  const loadContent = async (forceRefresh: boolean = false) => {
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
      const podcastData = await apiService.getPodcasts({ published: true, page: 1, limit: 20 }, forceRefresh);

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
    await loadContent(true);
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

  const isPodcastSaved = (podcastId: string) => {
    return savedPodcasts.some(p => p.id === podcastId);
  };

  const toggleSavePodcast = (podcast: Podcast | null, event: React.MouseEvent) => {
    // Safety check - don't proceed if podcast is null or missing ID
    if (!podcast || !podcast.id || podcast.id === 'undefined') {
      console.error('toggleSavePodcast: Invalid podcast or missing ID:', podcast);
      return;
    }
    
    event.stopPropagation();
    
    if (isPodcastSaved(podcast.id)) {
      // Unsave
      const updated = savedPodcasts.filter(p => p.id !== podcast.id);
      setSavedPodcasts(updated);
      localStorage.setItem('savedPodcasts', JSON.stringify(updated));
      
      // Also save to server (toggle endpoint)
      apiService.savePodcast(podcast.id).catch(console.warn);
    } else {
      // Save
      const podcastToSave = {
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
      
      const updated = [...savedPodcasts, podcastToSave];
      setSavedPodcasts(updated);
      localStorage.setItem('savedPodcasts', JSON.stringify(updated));
      
      // Also save to server
      apiService.savePodcast(podcast.id).catch(console.warn);
    }
    
    // Dispatch event to notify other pages
    window.dispatchEvent(new Event('savedItemsChanged'));
  };

  const handlePodcastClick = (podcast: Podcast) => {
    setCurrentMedia(podcast);
    setIsPlaying(true);
    history.push('/podcast-player');
  };

  const handleOptionsClick = (podcast: Podcast, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedPodcast(podcast);
    setShowActionSheet(true);
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px', margin: '0 auto' }}>
              {liveBroadcasts.map((broadcast) => (
                <div
                  key={`live-${broadcast.id}`}
                  className="podcast-item"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: 'var(--ion-background-color)',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    padding: '12px',
                    boxShadow: '0 6px 20px rgba(239, 68, 68, 0.25)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    maxWidth: '500px'
                  }}
                  onClick={() => handlePodcastClick(broadcast)}
                >
                  <div className="podcast-options-btn">
                    <IonButton
                      fill="clear"
                      size="small"
                      onClick={(e) => handleOptionsClick(broadcast, e)}
                      style={{
                        margin: '0',
                        padding: '0',
                        minWidth: 'auto',
                        height: 'auto',
                        '--color': 'white'
                      }}
                    >
                      <IonIcon icon={ellipsisVertical} style={{ fontSize: '1.2em' }} />
                    </IonButton>
                  </div>

                  <div className="podcast-thumbnail-container" style={{ position: 'relative', marginRight: '16px' }}>
                    <img
                      src={getFullUrl(broadcast.thumbnailUrl)}
                      alt={broadcast.title}
                      className="podcast-thumbnail"
                    />
                    <div className="podcast-play-overlay">
                      <IonIcon icon={radio} />
                    </div>
                    <div className="podcast-duration-badge">
                      {broadcast.duration}
                    </div>
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '0.7em',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
                      border: '1px solid rgba(239, 68, 68, 0.8)',
                      backdropFilter: 'blur(10px)',
                      zIndex: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      animation: 'pulse 2s infinite'
                    }}>
                      <div style={{
                        width: '6px',
                        height: '6px',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        boxShadow: '0 0 6px rgba(255, 255, 255, 0.8)'
                      }} />
                      LIVE
                    </div>
                  </div>

                  <div style={{ flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ width: '100%' }}>
                      <h4 className="podcast-title" style={{ marginBottom: '6px' }}>
                        {broadcast.title}
                      </h4>
                      <p style={{ margin: '0 0 8px 0', fontSize: '0.85em', color: 'var(--ion-color-medium)', fontWeight: '500' }}>
                        {broadcast.speaker || 'Dove Ministries Africa'}
                      </p>
                      <div className="podcast-meta">
                        <div className="podcast-meta-item" style={{ color: '#ef4444', fontWeight: '600' }}>
                          <IonIcon icon={radio} />
                          <span>Live broadcast</span>
                        </div>
                        <div className="podcast-meta-item">
                          <IonIcon icon={eye} />
                          <span>{broadcast.viewCount} watching</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Podcasts Section - YouTube-style */}
        <div style={{ padding: '10px 15px' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1em', fontWeight: '600' }}>
            Recent Podcasts
          </h3>

          {/* YouTube-style List Layout for podcasts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '600px', margin: '0 auto' }}>
            {/* Include all podcasts (including the lastPodcast if it exists) */}
            {(lastPodcast ? [lastPodcast, ...podcasts] : podcasts).map((podcast) => (
              <div
                key={podcast.id}
                className="podcast-item"
                style={{
                  display: 'flex',
                  backgroundColor: 'var(--ion-background-color)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: 'none',
                  padding: '8px',
                  position: 'relative',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  transition: 'box-shadow 0.2s ease'
                }}
                onClick={() => handlePodcastClick(podcast)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                }}
              >
                {/* YouTube-style Thumbnail */}
                <div style={{
                  position: 'relative',
                  width: '168px',
                  aspectRatio: '16/9',
                  flexShrink: 0,
                  marginRight: '12px',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  <img
                    src={getFullUrl(podcast.thumbnailUrl)}
                    alt={podcast.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '8px'
                    }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (!target.src.includes('/bible.JPG')) {
                        target.src = '/bible.JPG';
                      }
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: '4px',
                    right: '4px',
                    backgroundColor: podcast.isLive ? '#ef4444' : 'rgba(0,0,0,0.8)',
                    color: 'white',
                    padding: '2px 4px',
                    borderRadius: '2px',
                    fontSize: '0.7em',
                    fontWeight: podcast.isLive ? 'bold' : 'normal'
                  }}>
                    {podcast.isLive ? 'LIVE' : (podcast.duration || '—')}
                  </div>
                  {currentMedia && podcast.id === currentMedia.id && (
                    <div style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      backgroundColor: 'rgba(0, 0, 255, 0.9)',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '2px',
                      fontSize: '0.6em',
                      fontWeight: 'bold'
                    }}>
                      Playing
                    </div>
                  )}
                </div>

                {/* YouTube-style Podcast Details */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <h4 style={{
                    fontSize: '0.9em',
                    fontWeight: '600',
                    margin: '0 0 4px 0',
                    lineHeight: '1.3',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    color: 'var(--ion-text-color)'
                  }}>
                    {podcast.title}
                  </h4>
                  <p style={{
                    margin: '0 0 2px 0',
                    fontSize: '0.8em',
                    color: 'var(--ion-color-medium)',
                    fontWeight: '500'
                  }}>
                    Dove Ministries Africa
                  </p>
                  <p style={{
                    margin: '0',
                    fontSize: '0.8em',
                    color: 'var(--ion-color-medium)'
                  }}>
                    {podcast.viewCount} listens • {formatDate(podcast.publishedAt)}
                  </p>
                </div>

                {/* Options Button */}
                <IonButton
                  fill="clear"
                  size="small"
                  onClick={(e) => handleOptionsClick(podcast, e)}
                  style={{
                    margin: '0',
                    padding: '8px',
                    minWidth: '40px',
                    height: '40px',
                    '--color': 'var(--ion-color-medium)',
                    alignSelf: 'flex-start',
                    marginTop: '0'
                  }}
                >
                  <IonIcon icon={ellipsisVertical} style={{ fontSize: '1.4em' }} />
                </IonButton>
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

          {podcasts.length === 0 && !error && !loading && lastPodcast === null && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--ion-color-medium)' }}>
              <h3>No recent podcasts available</h3>
              <p>Please check back later for new content from Dove Ministries Africa.</p>
            </div>
          )}
        </div>

        {/* Action Sheet for podcast options */}
        <IonActionSheet
          isOpen={showActionSheet}
          onDidDismiss={() => {
            setShowActionSheet(false);
            setSelectedPodcast(null);
          }}
          header={`Options for "${selectedPodcast?.title}"`}
          buttons={[
            {
              text: isPodcastSaved(selectedPodcast?.id || '') ? 'Unsave' : 'Save',
              icon: isPodcastSaved(selectedPodcast?.id || '') ? heart : heartOutline,
              handler: () => {
                if (selectedPodcast && selectedPodcast.id) {
                  console.log('ActionSheet: Toggling save for podcast:', selectedPodcast.id);
                  toggleSavePodcast(selectedPodcast, { stopPropagation: () => {} } as any);
                } else {
                  console.error('ActionSheet: selectedPodcast is null or has no ID:', selectedPodcast);
                }
              }
            },
            {
              text: 'Share',
              icon: share,
              handler: async () => {
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
              }
            },
            {
              text: 'Cancel',
              role: 'cancel'
            }
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default Tab4;