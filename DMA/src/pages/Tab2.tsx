// @ts-nocheck
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonLoading, IonRefresher, IonRefresherContent, IonButtons, IonMenuButton, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon } from '@ionic/react';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import VideoPlayer from '../components/VideoPlayer';
import { fetchRecentSermons, fetchLiveStreams, YouTubeVideo } from '../services/youtubeService';
import { usePlayer } from '../contexts/PlayerContext';
import { play, eye, share, download } from 'ionicons/icons';
import './Tab2.css';

const toSermon = (video: YouTubeVideo) => ({
  id: video.id,
  title: video.title,
  description: video.description || '',
  thumbnailUrl: video.thumbnailUrl || '',
  publishedAt: video.publishedAt || '',
  duration: video.duration || '',
  viewCount: video.viewCount || '',
});

const Tab2: React.FC = () => {
  const [sermons, setSermons] = useState<YouTubeVideo[]>([]);
  const [lastSermon, setLastSermon] = useState<YouTubeVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [expandedDescription, setExpandedDescription] = useState(false);
  const location = useLocation();
  const { currentSermon, setCurrentSermon, setIsPlaying } = usePlayer();

  useEffect(() => {
    loadSermons();
  }, []);

  // Check for videoId parameter and auto-select video
  useEffect(() => {
    if (!loading && sermons.length > 0) {
      const urlParams = new URLSearchParams(location.search);
      const videoId = urlParams.get('videoId');

      if (videoId) {
        // Find the video in the loaded sermons
        const video = [...sermons, lastSermon].find(v => v && v.id === videoId);
        if (video) {
          setCurrentSermon(video);
          setIsPlaying(true);
        }
      }
    }
  }, [loading, sermons, lastSermon, location.search, setCurrentSermon, setIsPlaying]);

  // Infinite scrolling effect
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop
        >= document.documentElement.offsetHeight - 1000 &&
        hasMore &&
        !isLoadingMore &&
        !loading
      ) {
        loadSermons(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoadingMore, loading, nextPageToken]);

  const loadSermons = async (loadMore: boolean = false) => {
    try {
      if (loadMore) {
        setIsLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }

      // Fetch live streams and recent videos
      const [liveStreamsResult, recentVideosResult] = await Promise.allSettled([
        fetchLiveStreams(5), // Get up to 5 live streams
        fetchRecentSermons(45, loadMore ? nextPageToken : undefined) // Get recent videos
      ]);

      let liveStreams: YouTubeVideo[] = [];
      if (liveStreamsResult.status === 'fulfilled') {
        liveStreams = liveStreamsResult.value;
      }

      let recentVideos: YouTubeVideo[] = [];
      let nextPageTokenResult: string | undefined;

      if (recentVideosResult.status === 'fulfilled') {
        recentVideos = recentVideosResult.value.videos;
        nextPageTokenResult = recentVideosResult.value.nextPageToken;
      }

      if (loadMore) {
        // For load more, just append new videos (live streams are only loaded initially)
        setSermons(prev => [...prev, ...recentVideos]);
      } else {
        // Combine live streams and recent videos, prioritizing live streams
        const allVideos = [...liveStreams, ...recentVideos];

        if (allVideos.length > 0) {
          // Set the most recent (or first live stream) as the featured sermon
          const featuredVideo = liveStreams.length > 0 ? liveStreams[0] : allVideos[0];
          setLastSermon(featuredVideo);

          // Show the rest in the list, excluding the featured one
          const remainingVideos = allVideos.filter(video => video.id !== featuredVideo.id);
          setSermons(remainingVideos);
        } else {
          // If no videos from YouTube, show empty state
          setLastSermon(null);
          setSermons([]);
          setError('No sermons available at this time. Please check back later.');
          return;
        }
      }

      setNextPageToken(nextPageTokenResult);
      setHasMore(!!nextPageTokenResult);
    } catch (err) {
      console.error('Error loading sermons from YouTube:', err);
      // Show error state instead of mock data
      if (!loadMore) {
        setError('Unable to load sermons. Please check your internet connection and try again.');
        setLastSermon(null);
        setSermons([]);
      } else {
        setIsLoadingMore(false);
      }
    } finally {
      if (!loadMore) {
        setLoading(false);
      }
    }
  };


  const handleRefresh = async (event: CustomEvent) => {
    await loadSermons();
    event.detail.complete();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDownload = (sermon: YouTubeVideo, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the video play
    // For demo purposes, show download info
    alert(`Download started for "${sermon.title}"\n\nThis would download the sermon for offline listening.`);
  };

  if (loading) {
    return (
      <IonPage>
        <IonLoading isOpen={loading} message="Loading sermons..." />
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Sermons</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="sermons-content">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Sermons</IonTitle>
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

        {/* YouTube-style Video Player Section */}
        {currentSermon && (
          <>
            {/* Blurred Background */}
            <div
              style={{
                backgroundImage: `url(${currentSermon.thumbnailUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(20px)',
                position: 'fixed',
                top: 'calc(var(--ion-safe-area-top) + 56px)', // Position exactly below the page header
                left: '0',
                right: '0',
                height: '350px', // Approximate height of the player section
                zIndex: '9',
                opacity: '0.4'
              }}
            />
            {/* Content Overlay */}
            <div style={{
              background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.05) 80%, transparent 100%)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              position: 'fixed',
              top: 'calc(var(--ion-safe-area-top) + 56px)', // Position exactly below the page header
              left: '0',
              right: '0',
              zIndex: '10'
            }}>
              <VideoPlayer
                key={currentSermon.id}
                url={`https://www.youtube.com/watch?v=${currentSermon.id}`}
                title={currentSermon.title}
                playing={true}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
              <div style={{ padding: '15px 15px 0px 15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, marginRight: '4px' }}>
                    <h2 style={{ margin: '0 0 8px 0', fontSize: '0.9em', fontWeight: '600' }}>
                      {currentSermon.title}
                    </h2>
                    <p style={{ margin: '0 0 8px 0', color: 'var(--ion-color-medium)', fontSize: '0.8em' }}>
                      <IonIcon icon={eye} style={{ verticalAlign: 'middle', marginRight: '4px' }} />{currentSermon.viewCount} views • {formatDate(currentSermon.publishedAt)}
                    </p>
                    {currentSermon.description && !expandedDescription && (
                      <div style={{ marginTop: '8px' }}>
                        <IonButton
                          fill="clear"
                          size="small"
                          style={{
                            margin: '0',
                            padding: '0px 8px',
                            fontSize: '1em',
                            color: '#60a5fa',
                            height: 'auto',
                            '--padding-start': '8px',
                            '--padding-end': '8px',
                            fontWeight: '500',
                            textTransform: 'none'
                          }}
                          onClick={() => setExpandedDescription(true)}
                        >
                          Show more
                        </IonButton>
                      </div>
                    )}
                    {currentSermon.description && expandedDescription && (
                      <div>
                        <p style={{ margin: '0 0 8px 0', lineHeight: '1.4', color: 'var(--ion-color-dark)', fontSize: '0.8em' }}>
                          {currentSermon.description}
                        </p>
                        <IonButton
                          fill="clear"
                          size="small"
                          style={{
                            margin: '8px 0 0 0',
                            padding: '0px 8px',
                            fontSize: '1em',
                            color: '#60a5fa',
                            height: 'auto',
                            '--padding-start': '8px',
                            '--padding-end': '8px',
                            fontWeight: '500',
                            textTransform: 'none'
                          }}
                          onClick={() => setExpandedDescription(false)}
                        >
                          Show less
                        </IonButton>
                      </div>
                    )}
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    <IonButton fill="clear" size="large" style={{ padding: '2px', marginTop: '-2px' }}>
                      <IonIcon icon={share} />
                    </IonButton>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* YouTube-style Recent Sermons Grid */}
        <div style={{ padding: '15px', marginTop: currentSermon ? '300px' : '0' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1em', fontWeight: '600' }}>
            Recent Sermons
          </h3>

          {lastSermon && !currentSermon && (
            <div
              className="video-item"
              style={{
                display: 'flex',
                marginBottom: '20px',
                backgroundColor: 'var(--ion-background-color)',
                borderRadius: '8px',
                overflow: 'hidden',
                cursor: 'pointer',
                border: 'none'
              }}
              onClick={() => {
                setCurrentSermon(lastSermon);
                setIsPlaying(true);
              }}
            >
              <div style={{ flex: '0.7', position: 'relative' }}>
                <img
                  src={lastSermon.thumbnailUrl}
                  alt={lastSermon.title}
                  style={{
                    width: '100%',
                    height: '100px',
                    objectFit: 'cover'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '8px',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '0.8em'
                }}>
                  {lastSermon.duration}
                </div>
                {lastSermon.isLive && (
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    backgroundColor: 'red',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '0.7em',
                    fontWeight: 'bold'
                  }}>
                    LIVE
                  </div>
                )}
              </div>
              <div style={{ flex: '1', padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ flex: 1, marginRight: '8px' }}>
                      <h4 className="video-title" style={{ fontSize: '0.95em', fontWeight: '600', margin: '0 0 4px 0' }}>
                        {lastSermon.title}
                      </h4>
                      <p style={{ margin: '0', fontSize: '0.8em', color: 'var(--ion-color-medium)' }}>
                        Dove Ministries Africa
                      </p>
                    </div>
                    <IonButton
                      fill="clear"
                      size="small"
                      onClick={(e) => handleDownload(lastSermon, e)}
                      style={{
                        margin: '0',
                        padding: '6px',
                        minWidth: '44px',
                        height: '44px',
                        '--color': 'var(--ion-color-primary)',
                        '--padding-start': '6px',
                        '--padding-end': '6px',
                        alignSelf: 'flex-start'
                      }}
                    >
                      <IonIcon icon={download} style={{ fontSize: '1.8em' }} />
                    </IonButton>
                  </div>
                  <p style={{ margin: '0', fontSize: '0.8em', color: 'var(--ion-color-medium)' }}>
                    {formatDate(lastSermon.publishedAt)} • {lastSermon.viewCount} views
                  </p>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {sermons.map((sermon) => (
              <div
                key={sermon.id}
                className="video-item"
                style={{
                  display: 'flex',
                  backgroundColor: 'var(--ion-background-color)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  // boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  border: 'none'
                }}
                onClick={() => {
                  setCurrentSermon(sermon);
                  setIsPlaying(true);
                }}
              >
                <div style={{ flex: '0.7', position: 'relative', width: '100%'}}>
                  <img
                    src={sermon.thumbnailUrl}
                    alt={sermon.title}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
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
                    {sermon.duration}
                  </div>
                  {sermon.isLive && (
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      backgroundColor: 'red',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '0.7em',
                      fontWeight: 'bold'
                    }}>
                      LIVE
                    </div>
                  )}
                </div>
                <div style={{ flex: '1', padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ flex: 1, marginRight: '8px' }}>
                        <h4 className="video-title" style={{ fontSize: '0.85em', fontWeight: '600', margin: '0 0 4px 0' }}>
                          {sermon.title}
                        </h4>
                        <p style={{ margin: '0', fontSize: '0.8em', color: 'var(--ion-color-medium)' }}>
                          Dove Ministries Africa
                        </p>
                      </div>
                      <IonButton
                        fill="clear"
                        size="small"
                        onClick={(e) => handleDownload(sermon, e)}
                        style={{
                          margin: '0',
                          padding: '6px',
                          minWidth: '44px',
                          height: '44px',
                          '--color': 'var(--ion-color-primary)',
                          '--padding-start': '6px',
                          '--padding-end': '6px',
                          alignSelf: 'flex-start'
                        }}
                      >
                        <IonIcon icon={download} style={{ fontSize: '1.8em' }} />
                      </IonButton>
                    </div>
                    <p style={{ margin: '0', fontSize: '0.8em', color: 'var(--ion-color-medium)' }}>
                      {formatDate(sermon.publishedAt)} • {sermon.viewCount} views
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {isLoadingMore && (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--ion-color-medium)' }}>
              <p>Loading more sermons...</p>
            </div>
          )}

          {!hasMore && sermons.length > 0 && (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--ion-color-medium)' }}>
              <p>You've reached the end of all available sermons.</p>
            </div>
          )}

          {sermons.length === 0 && !error && !loading && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--ion-color-medium)' }}>
              <h3>No recent sermons available</h3>
              <p>Please check back later for new content from Dove Ministries Africa.</p>
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Tab2;
