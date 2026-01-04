// @ts-nocheck
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonLoading, IonRefresher, IonRefresherContent, IonMenuButton, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon } from '@ionic/react';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import VideoPlayer from '../components/VideoPlayer';
import { fetchCombinedSermons, YouTubeVideo } from '../services/youtubeService';
import { usePlayer } from '../contexts/PlayerContext';
import { apiService, BACKEND_BASE_URL } from '../services/api';
import { useNotifications } from '../contexts/NotificationContext';
import Comments from '../components/Comments';

import { play, eye, share, bookmark, close, ellipsisVertical, personAdd, personCircle } from 'ionicons/icons';
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

// Helper function to convert relative URLs to full backend URLs
const getFullUrl = (url: string) => {
  return url;
};

// Helper function to get thumbnail URL with fallback for external videos
const getThumbnailUrl = (sermon: any) => {
  if (sermon.thumbnailUrl) {
    return getFullUrl(sermon.thumbnailUrl);
  }

  // For external videos, try to get thumbnail from YouTube or provide default
  // Check both videoUrl (for uploaded videos) and streamUrl (for live broadcasts)
  const videoUrl = sermon.videoUrl || sermon.streamUrl || '';
  if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
    // Extract YouTube video ID
    let videoId = '';
    if (videoUrl.includes('youtu.be/')) {
      videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0];
    } else if (videoUrl.includes('live/')) {
      videoId = videoUrl.split('live/')[1]?.split('?')[0];
    } else if (videoUrl.includes('v=')) {
      videoId = videoUrl.split('v=')[1]?.split('&')[0];
    }

    if (videoId) {
      // Use maxresdefault for highest quality thumbnails (works for both live and uploaded)
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
  }

  // Default thumbnail for external videos
  return '/Bible.JPG'; // Fallback to existing Bible image
};

const Tab2: React.FC = () => {
  const [sermons, setSermons] = useState<YouTubeVideo[]>([]);
  const [lastSermon, setLastSermon] = useState<YouTubeVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [expandedDescription, setExpandedDescription] = useState(false);
  const [lastScroll, setLastScroll] = useState(0);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const location = useLocation();
  const { currentSermon, setCurrentSermon, setIsPlaying, setCurrentMedia, isPlaying, savePlaybackPosition, getPlaybackPosition } = usePlayer();
  const { addNotification } = useNotifications();

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

  // Check for refresh flags from admin operations
  useEffect(() => {
    const needsRefresh = sessionStorage.getItem('sermonsNeedRefresh');
    if (needsRefresh === 'true') {
      sessionStorage.removeItem('sermonsNeedRefresh');
      loadSermons();
    }
  }, []);

  // Safety check to prevent loading state from getting stuck
  useEffect(() => {
    if (loading && !isLoadingMore && sermons.length > 0) {
      // If we have sermons loaded but still showing loading, clear it
      setLoading(false);
    }
  }, [loading, isLoadingMore, sermons.length]);


  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      // Component cleanup
    };
  }, []);

  const loadSermons = async (loadMore: boolean = false) => {
    try {
      if (loadMore) {
        setIsLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }

      // Fetch combined sermons (database + YouTube)
      const combinedResult = await fetchCombinedSermons(50, loadMore ? nextPageToken : undefined);

      if (loadMore) {
        // For load more, just append new videos
        setSermons(prev => [...prev, ...combinedResult.videos]);
      } else {
        // For initial load, set featured sermon and remaining videos
        if (combinedResult.videos.length > 0) {
          // Apply safety check to mark old live broadcasts as ended
          const checkedVideos = combinedResult.videos.map((video: any) => {
            if (shouldBeConsideredEnded(video)) {
              return {
                ...video,
                isLive: false,
                duration: video.duration || '00:00'
              };
            }
            return video;
          });

          // Set the most recent as the featured sermon
          const featuredVideo = checkedVideos[0];
          setLastSermon(featuredVideo);

          // Show the rest in the list, excluding the featured one
          const remainingVideos = checkedVideos.slice(1);
          setSermons(remainingVideos);
        } else {
          // If no videos available, show empty state
          setLastSermon(null);
          setSermons([]);
          setError('No sermons available at this time. Please check back later.');
          return;
        }
      }

      setNextPageToken(combinedResult.nextPageToken);
      setHasMore(!!combinedResult.nextPageToken);
      if (loadMore) {
        setIsLoadingMore(false);
      }
    } catch (err) {
      console.error('Error loading sermons from YouTube:', err);
      // Show error state instead of mock data
      if (!loadMore) {
        setError('Unable to load sermons. Please check your internet connection and try again.');
        setLastSermon(null);
        setSermons([]);
      }
    } finally {
      if (!loadMore) {
        setLoading(false);
      } else {
        setIsLoadingMore(false);
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
  
  // Helper function to check if a broadcast should be considered ended
  const shouldBeConsideredEnded = (sermon: any) => {
    // If explicitly marked as not live, it's ended
    if (!sermon.isLive) return true;
    
    // If it has an end time, it's ended
    if (sermon.broadcastEndTime) return true;
    
    // If it started more than 4 hours ago and has no end time, consider it ended (safety fallback)
    if (sermon.broadcastStartTime) {
      const startTime = new Date(sermon.broadcastStartTime).getTime();
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

  const handleSave = async (sermon: YouTubeVideo, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the video play

    try {
      // Get existing saved sermons
      const savedSermons = JSON.parse(localStorage.getItem('savedSermons') || '[]');

      // Check if already saved
      const isAlreadySaved = savedSermons.some((s: any) => s.id === sermon.id);

      if (isAlreadySaved) {
        alert(`"${sermon.title}" is already in your saved list.`);
        return;
      }

      // Save to backend
      const response = await apiService.saveSermon(sermon.id);

      // Create saved sermon object for localStorage
      const savedSermon = {
        id: sermon.id,
        title: sermon.title,
        speaker: 'Dove Ministries Africa',
        description: sermon.description || '',
        date: sermon.publishedAt || '',
        duration: sermon.duration || '',
        thumbnailUrl: sermon.thumbnailUrl || '',
        savedAt: new Date().toISOString(),
        videoUrl: (sermon as any).videoUrl || (sermon as any).streamUrl || '',
        youtubeId: sermon.id.length === 11 ? sermon.id : '', // YouTube IDs are 11 chars
        isDatabaseSermon: sermon.id.length > 11 // Assume longer IDs are database sermons
      };

      // Add to saved sermons
      savedSermons.push(savedSermon);
      localStorage.setItem('savedSermons', JSON.stringify(savedSermons));

      // Show success message
      alert(`"${sermon.title}" has been saved to your list!`);

      // Add notification for saved sermon
      addNotification({
        type: 'sermon',
        title: 'Sermon Saved',
        message: `"${sermon.title}" has been saved to your library for offline viewing`,
        data: { sermonId: sermon.id, title: sermon.title }
      });
    } catch (error) {
      console.error('Error saving sermon:', error);
      alert('Failed to save sermon. Please try again.');
    }
  };



  const handleSubscribe = async () => {
    try {
      const response = await apiService.subscribe('Dove Ministries Africa');
      alert(response.message);
    } catch (error) {
      console.error('Error subscribing:', error);
      alert('Failed to subscribe. Please try again.');
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Sermons</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent
        fullscreen
        className="sermons-content"
        onIonScroll={(e) => {
          if (!currentSermon) return;
          const currentScroll = e.detail.scrollTop;
          if (currentScroll > lastScroll + 10) {
            setExpandedDescription(false);
          } else if (currentScroll < lastScroll - 10) {
            setExpandedDescription(true);
          }
          setLastScroll(currentScroll);
        }}
      >
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

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--ion-color-medium)' }}>
            <p>Loading sermons...</p>
          </div>
        )}

        {/* YouTube-style Video Player Section */}
        {!loading && currentSermon && (() => {
          console.log('Rendering video player section, currentSermon:', currentSermon);
          return (
          <>
            {/* Video Player and Details Container */}
            <div style={{ position: 'relative' }}>
              {/* Video Player */}
              <div style={{
                width: '100%',
                background: 'black',
                position: 'relative'
              }}>
                <VideoPlayer
                  key={currentSermon.id}
                  url={getFullUrl((currentSermon as any).videoUrl || (currentSermon as any).streamUrl || '')}
                  title={currentSermon.title}
                  playing={isPlaying}
                  startTime={getPlaybackPosition()}
                  onPlay={() => setIsPlaying(true)}
                  onTimeUpdate={savePlaybackPosition}
                />
              </div>

              {/* Video Details Section */}
              <div className="video-details-section">
              {/* Video Title */}
              <h1 className="video-title-large">
                {currentSermon.title}
              </h1>

              {/* Channel Info and Action Buttons */}
              <div className="channel-info-row">
                <div className="channel-info">
                  <div>
                    <h3 className="channel-name">
                      Dove Ministries Africa
                    </h3>
                    <p className="channel-stats">
                      {currentSermon.viewCount} views • {formatDate(currentSermon.publishedAt)}
                    </p>
                  </div>
                </div>
                {/* Action Buttons next to channel info */}
                <div className="channel-action-buttons">
                  {/* Share Button */}
                  <div
                    className="channel-action-button"
                    onClick={async () => {
                      if (currentSermon) {
                        const shareData = {
                          title: currentSermon.title,
                          text: currentSermon.description,
                          url: window.location.href
                        };

                        try {
                          if (navigator.share) {
                            await navigator.share(shareData);
                          } else {
                            // Fallback: copy to clipboard
                            const textToCopy = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
                            await navigator.clipboard.writeText(textToCopy);
                            alert('Sermon details copied to clipboard!');
                          }
                        } catch (error) {
                          console.error('Error sharing:', error);
                          alert('Failed to share sermon. Please try again.');
                        }
                      }
                    }}
                    style={{
                      width: 45,
                      height: 45,
                      borderRadius: 25,
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      boxShadow: '0 6px 16px rgba(0,0,0,0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      marginLeft: '12px',
                      transition: 'transform 0.2s ease'
                    }}
                    onMouseDown={(e) => {
                      const target = e.currentTarget as HTMLElement;
                      target.style.transform = 'scale(0.8)';
                    }}
                    onMouseUp={(e) => {
                      const target = e.currentTarget as HTMLElement;
                      target.style.transform = 'scale(1)';
                    }}
                    onMouseLeave={(e) => {
                      const target = e.currentTarget as HTMLElement;
                      target.style.transform = 'scale(1)';
                    }}
                  >
                    <IonIcon
                      icon={share}
                      style={{
                        color: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? '#ffffff' : '#000000',
                        fontSize: '20px',
                      }}
                    />
                  </div>

                  {/* Save Button */}
                  <div
                    className="channel-action-button"
                    onClick={() => {
                      if (currentSermon) {
                        handleSave(currentSermon, { stopPropagation: () => {} } as any);
                      }
                    }}
                    style={{
                      width: 45,
                      height: 45,
                      borderRadius: 25,
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      boxShadow: '0 6px 16px rgba(0,0,0,0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      marginLeft: '12px',
                      transition: 'transform 0.2s ease'
                    }}
                    onMouseDown={(e) => {
                      const target = e.currentTarget as HTMLElement;
                      target.style.transform = 'scale(0.8)';
                    }}
                    onMouseUp={(e) => {
                      const target = e.currentTarget as HTMLElement;
                      target.style.transform = 'scale(1)';
                    }}
                    onMouseLeave={(e) => {
                      const target = e.currentTarget as HTMLElement;
                      target.style.transform = 'scale(1)';
                    }}
                  >
                    <IonIcon
                      icon={bookmark}
                      style={{
                        color: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? '#ffffff' : '#000000',
                        fontSize: '20px',
                      }}
                    />
                  </div>

                  {/* Subscribe Button */}
                  <div
                    className="channel-action-button"
                    onClick={handleSubscribe}
                    style={{
                      width: 45,
                      height: 45,
                      borderRadius: 25,
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      boxShadow: '0 6px 16px rgba(0,0,0,0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      marginLeft: '12px',
                      transition: 'transform 0.2s ease'
                    }}
                    onMouseDown={(e) => {
                      const target = e.currentTarget as HTMLElement;
                      target.style.transform = 'scale(0.8)';
                    }}
                    onMouseUp={(e) => {
                      const target = e.currentTarget as HTMLElement;
                      target.style.transform = 'scale(1)';
                    }}
                    onMouseLeave={(e) => {
                      const target = e.currentTarget as HTMLElement;
                      target.style.transform = 'scale(1)';
                    }}
                  >
                    <IonIcon
                      icon={personAdd}
                      style={{
                        color: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? '#ffffff' : '#000000',
                        fontSize: '20px',
                      }}
                    />
                  </div>
                </div>
              </div>


              {/* Description */}
              <div className="description-section">
                <p className="description-text">
                  {(() => {
                    const description = currentSermon.description || 'No description available.';
                    const shouldTruncate = description.length > 150 && !descriptionExpanded;

                    return shouldTruncate ? (
                      <>
                        {description.substring(0, 150)}...
                        <button
                          onClick={() => setDescriptionExpanded(true)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--ion-color-primary)',
                            cursor: 'pointer',
                            fontSize: '0.9em',
                            fontWeight: '600',
                            marginLeft: '4px',
                            padding: '0'
                          }}
                        >
                          Show more
                        </button>
                      </>
                    ) : (
                      <>
                        {description}
                        {description.length > 150 && (
                          <button
                            onClick={() => setDescriptionExpanded(false)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--ion-color-primary)',
                              cursor: 'pointer',
                              fontSize: '0.9em',
                              fontWeight: '600',
                              marginLeft: '4px',
                              padding: '0'
                            }}
                          >
                            Show less
                          </button>
                        )}
                      </>
                    );
                  })()}
                </p>
              </div>

              {/* Comments Section */}
              {currentSermon && (
                <Comments
                  contentId={currentSermon.id}
                  contentType="sermon"
                />
              )}
            </div>
          </div>
          </>
          );
        })()}

        {/* YouTube-style Recent Sermons Grid */}
        {!loading && (
          <div style={{ padding: '10px 15px', marginTop: currentSermon ? '20px' : '0' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1em', fontWeight: '600' }}>
              Recent Sermons
            </h3>

            {lastSermon && !currentSermon && (
              <div
                className="video-item"
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
                onClick={async () => {
                  setCurrentSermon(lastSermon as any);
                  setIsPlaying(true);

                  // Increment view count for database sermons
                  if (lastSermon && (lastSermon as any).isDatabaseSermon) {
                    try {
                      await apiService.getSermon(lastSermon.id);
                    } catch (error) {
                      console.error('Error incrementing view count:', error);
                    }
                  }
                }}
              >
                <div className="sermon-thumbnail-container" style={{ position: 'relative' }}>
                  <img
                    src={getThumbnailUrl(lastSermon)}
                    alt={lastSermon.title}
                    className="sermon-thumbnail"
                    onError={(e) => {
                      // Fallback to default thumbnail if YouTube thumbnail fails to load
                      const target = e.target as HTMLImageElement;
                      if (!target.src.includes('/Bible.JPG')) {
                        target.src = '/Bible.JPG';
                      }
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '8px',
                    backgroundColor: lastSermon.isLive ? '#ef4444' : 'rgba(0,0,0,0.8)',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '0.8em',
                    fontWeight: lastSermon.isLive ? 'bold' : 'normal'
                  }}>
                    {lastSermon.isLive ? 'LIVE' : (lastSermon.duration || '—')}
                  </div>
                </div>
                <div style={{ flex: '1', padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ width: '100%' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <h4 className="video-title" style={{ fontSize: '0.95em', fontWeight: '600', margin: '0 0 4px 0' }}>
                        {lastSermon.title}
                      </h4>
                      <p style={{ margin: '0', fontSize: '0.8em', color: 'var(--ion-color-medium)' }}>
                        Dove Ministries Africa
                      </p>
                    </div>
                    <p style={{ margin: '0', fontSize: '0.8em', color: 'var(--ion-color-medium)' }}>
                      {formatDate(lastSermon.publishedAt)} • {lastSermon.viewCount} views
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '410px', margin: '0 auto' }}>
              {(currentSermon ? [lastSermon, ...sermons].filter(s => s) : sermons).map((sermon) => (
                <div
                  key={sermon.id}
                  className="video-item"
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
                  onClick={async () => {
                    console.log('Setting currentSermon:', sermon);
                    // Directly set currentSermon instead of using setCurrentMedia
                    setCurrentSermon(sermon as any);
                    setIsPlaying(true);
                    console.log('currentSermon should now be set');

                    // Increment view count for database sermons
                    if ((sermon as any).isDatabaseSermon) {
                      try {
                        await apiService.getSermon(sermon.id);
                      } catch (error) {
                        console.error('Error incrementing view count:', error);
                      }
                    }
                  }}
                >
                  <div className="sermon-thumbnail-container" style={{ position: 'relative' }}>
                    <img
                      src={getThumbnailUrl(sermon)}
                      alt={sermon.title}
                      className="sermon-thumbnail"
                      onError={(e) => {
                        // Fallback to default thumbnail if YouTube thumbnail fails to load
                        const target = e.target as HTMLImageElement;
                        if (!target.src.includes('/Bible.JPG')) {
                          target.src = '/Bible.JPG';
                        }
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      bottom: '8px',
                      right: '8px',
                      backgroundColor: sermon.isLive ? '#ef4444' : 'rgba(0,0,0,0.8)',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '0.8em',
                      fontWeight: sermon.isLive ? 'bold' : 'normal'
                    }}>
                      {sermon.isLive ? 'LIVE' : (sermon.duration || '—')}
                    </div>
                    {currentSermon && sermon.id === currentSermon.id && (
                    <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    backgroundColor: 'rgba(0, 0, 255, 0.9)',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.7em',
                    fontWeight: 'bold'
                    }}>
                    Playing
                    </div>
                    )}
                  </div>
                  <div style={{ flex: '1', padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ width: '100%' }}>
                      <div style={{ marginBottom: '8px' }}>
                        <h4 className="video-title" style={{ fontSize: '0.85em', fontWeight: '600', margin: '0 0 4px 0' }}>
                          {sermon.title}
                        </h4>
                        <p style={{ margin: '0', fontSize: '0.8em', color: 'var(--ion-color-medium)' }}>
                          Dove Ministries Africa
                        </p>
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
        )}


      </IonContent>
    </IonPage>
  );
};

export default Tab2;
