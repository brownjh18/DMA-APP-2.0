// @ts-nocheck
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonLoading, IonRefresher, IonRefresherContent, IonMenuButton, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon, IonPopover, IonActionSheet, IonRouterLink } from '@ionic/react';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import VideoPlayer from '../components/VideoPlayer';
import { fetchCombinedSermons, YouTubeVideo } from '../services/youtubeService';
import { usePlayer } from '../contexts/PlayerContext';
import { apiService, BACKEND_BASE_URL } from '../services/api';

import { play, eye, share, close, ellipsisVertical, personCircle, heart, heartOutline, home, list, radio, heartCircle, book, informationCircle } from 'ionicons/icons';
import './Tab2.css';

// Sidebar navigation items
const sidebarItems = [
  { icon: home, label: 'Home', path: '/tab1' },
  { icon: list, label: 'Sermons', path: '/tab2', active: true },
  { icon: radio, label: 'Podcasts', path: '/tab4' },
  { icon: heartCircle, label: 'My Favorites', path: '/my-favorites' },
  { icon: book, label: 'Devotions', path: '/full-devotion' },
  { icon: informationCircle, label: 'About DMA', path: '/tab5' },
];

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
  if (url.startsWith('/uploads')) {
    return `http://localhost:5000${url}`;
  }
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
  const [savedSermons, setSavedSermons] = useState<any[]>([]);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [selectedSermonForActionSheet, setSelectedSermonForActionSheet] = useState<any>(null);
  const location = useLocation();
  const { currentSermon, setCurrentSermon, setIsPlaying, setCurrentMedia, isPlaying, savePlaybackPosition, getPlaybackPosition } = usePlayer();

  useEffect(() => {
    loadSermons();
    // Load saved sermons from localStorage
    const saved = JSON.parse(localStorage.getItem('savedSermons') || '[]');
    setSavedSermons(saved);
  }, []);

  // Check for videoId/sermonId parameter and auto-select video
  useEffect(() => {
    if (!loading) {
      const urlParams = new URLSearchParams(location.search);
      const videoId = urlParams.get('videoId') || urlParams.get('sermonId');

      if (videoId) {
        // First, try to find the video in the loaded sermons
        let video = [...sermons, lastSermon].find(v => v && v.id === videoId);
        
        if (video) {
          setCurrentSermon(video);
          setIsPlaying(true);
        } else {
          // If not found in loaded sermons, fetch it directly from the database
          const fetchSermonById = async () => {
            try {
              const data = await apiService.getSermon(videoId);
              const sermon = data.sermon || data;
              
              // Format the sermon to match YouTubeVideo interface
              const formattedSermon = {
                id: sermon._id || sermon.id,
                title: sermon.title,
                description: sermon.description || '',
                thumbnailUrl: sermon.thumbnailUrl || sermon.thumbnail || '',
                publishedAt: sermon.date || sermon.createdAt || new Date().toISOString(),
                duration: sermon.duration || '00:00',
                viewCount: sermon.viewCount?.toString() || '0',
                videoUrl: sermon.videoUrl || '',
                streamUrl: sermon.streamUrl || '',
                isDatabaseSermon: true,
                isLive: false
              };
              
              setCurrentSermon(formattedSermon as any);
              setIsPlaying(true);
            } catch (error) {
              console.error('Failed to fetch sermon by ID:', error);
            }
          };
          
          fetchSermonById();
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
      console.log('🔄 Tab2: Detected sermonsNeedRefresh flag, reloading content');
      // Clear cache and reload
      apiService.clearCacheByType('sermons');
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

  const isSermonSaved = (sermonId: string) => {
    return savedSermons.some(sermon => sermon.id === sermonId);
  };

  const saveSermon = async (sermon: any) => {
    const sermonToSave = {
      id: sermon.id,
      title: sermon.title,
      speaker: 'Dove Ministries Africa',
      description: sermon.description || '',
      scripture: '',
      date: sermon.publishedAt || new Date().toISOString(),
      duration: sermon.duration || '',
      tags: [],
      thumbnailUrl: sermon.thumbnailUrl || '',
      savedAt: new Date().toISOString(),
      videoUrl: sermon.videoUrl || sermon.streamUrl || '',
      youtubeId: sermon.youtubeId || '',
      isDatabaseSermon: sermon.isDatabaseSermon || false
    };

    const updatedSaved = [...savedSermons, sermonToSave];
    setSavedSermons(updatedSaved);
    localStorage.setItem('savedSermons', JSON.stringify(updatedSaved));

    // Also save to server for logged-in users
    try {
      await apiService.saveSermon(sermon.id);
      console.log('Sermon saved to server successfully');
    } catch (error) {
      console.warn('Failed to save sermon to server (user may not be logged in):', error);
    }
    
    // Dispatch event to notify other pages
    window.dispatchEvent(new Event('savedItemsChanged'));
  };

  const unsaveSermon = async (sermonId: string) => {
    const updatedSaved = savedSermons.filter(sermon => sermon.id !== sermonId);
    setSavedSermons(updatedSaved);
    localStorage.setItem('savedSermons', JSON.stringify(updatedSaved));
    
    // Dispatch event to notify other pages
    window.dispatchEvent(new Event('savedItemsChanged'));
  };

  const toggleSaveSermon = (sermon: any) => {
    if (isSermonSaved(sermon.id)) {
      unsaveSermon(sermon.id);
    } else {
      saveSermon(sermon);
    }
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
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSaveSermon(currentSermon);
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
                      icon={isSermonSaved(currentSermon.id) ? heart : heartOutline}
                      style={{
                        color: isSermonSaved(currentSermon.id) ? '#ef4444' : (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? '#ffffff' : '#000000'),
                        fontSize: '20px',
                      }}
                    />
                  </div>
                  {/* Close Button */}
                  <div
                    className="channel-action-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentSermon(null);
                      setIsPlaying(false);
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
                      icon={close}
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
            </div>
          </div>
          </>
          );
        })()}

        {/* YouTube-style Main Page Layout */}
        {!loading && !currentSermon && (
          <div className="main-layout">
            {/* YouTube-style Sidebar */}
            <aside className="sidebar">
              {sidebarItems.map((item, index) => (
                <IonRouterLink
                  key={index}
                  routerLink={item.path}
                  className={`sidebar-item ${item.active ? 'active' : ''}`}
                >
                  <div className="sidebar-icon">
                    <IonIcon icon={item.icon} />
                  </div>
                  <span className="sidebar-label">{item.label}</span>
                </IonRouterLink>
              ))}
            </aside>

            {/* Main Content */}
            <main className="main-content">
            {/* Featured Sermon Section - YouTube Hero Style */}
            {lastSermon && (
              <div style={{ marginBottom: '24px' }}>
                <h2 className="section-header" style={{
                  margin: '0 0 16px 0',
                  fontSize: '1.4em',
                  fontWeight: '700',
                  color: 'var(--ion-text-color)'
                }}>
                  Featured Sermon
                </h2>
                <div
                  className="featured-sermon"
                  style={{
                    backgroundColor: 'var(--ion-background-color)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
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
                  {/* Large Featured Thumbnail */}
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '16/9',
                    overflow: 'hidden'
                  }}>
                    <img
                      src={getThumbnailUrl(lastSermon)}
                      alt={lastSermon.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (!target.src.includes('/Bible.JPG')) {
                          target.src = '/Bible.JPG';
                        }
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      bottom: '12px',
                      right: '12px',
                      backgroundColor: lastSermon.isLive ? '#ef4444' : 'rgba(0,0,0,0.8)',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.8em',
                      fontWeight: lastSermon.isLive ? 'bold' : 'normal'
                    }}>
                      {lastSermon.isLive ? 'LIVE' : (lastSermon.duration || '—')}
                    </div>
                    {/* Play Button Overlay */}
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backdropFilter: 'blur(10px)'
                    }}>
                      <IonIcon icon={play} style={{ fontSize: '24px', color: 'white' }} />
                    </div>
                  </div>

                  {/* Featured Sermon Details */}
                  <div style={{ padding: '16px' }}>
                    <h3 style={{
                      fontSize: '1.2em',
                      fontWeight: '600',
                      margin: '0 0 8px 0',
                      lineHeight: '1.3',
                      color: 'var(--ion-text-color)'
                    }}>
                      {lastSermon.title}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{
                        fontSize: '0.9em',
                        color: 'var(--ion-color-medium)',
                        fontWeight: '500'
                      }}>
                        Dove Ministries Africa
                      </span>
                    </div>
                    <p style={{
                      margin: '0',
                      fontSize: '0.85em',
                      color: 'var(--ion-color-medium)',
                      lineHeight: '1.4'
                    }}>
                      {lastSermon.viewCount} views • {formatDate(lastSermon.publishedAt)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Sermons Grid - YouTube Style */}
            <div>
              <h3 style={{
                margin: '0 0 16px 0',
                fontSize: '1.2em',
                fontWeight: '600',
                color: 'var(--ion-text-color)'
              }}>
                Recent Sermons
              </h3>

              {/* YouTube-style Grid Layout */}
              <div className="sermons-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '16px',
                maxWidth: '100%',
                margin: '0 auto'
              }}>
                {sermons.map((sermon) => (
                  <div
                    key={sermon.id}
                    className="video-item"
                    style={{
                      backgroundColor: 'var(--ion-background-color)',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      position: 'relative'
                    }}
                    onClick={async () => {
                      console.log('Setting currentSermon:', sermon);
                      setCurrentSermon(sermon as any);
                      setIsPlaying(true);

                      // Increment view count for database sermons
                      if ((sermon as any).isDatabaseSermon) {
                        try {
                          await apiService.getSermon(sermon.id);
                        } catch (error) {
                          console.error('Error incrementing view count:', error);
                        }
                      }
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                    }}
                  >
                    {/* YouTube-style Thumbnail */}
                    <div style={{
                      position: 'relative',
                      width: '100%',
                      aspectRatio: '16/9',
                      overflow: 'hidden'
                    }}>
                      <img
                        src={getThumbnailUrl(sermon)}
                        alt={sermon.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
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
                        fontSize: '0.75em',
                        fontWeight: sermon.isLive ? 'bold' : 'normal'
                      }}>
                        {sermon.isLive ? 'LIVE' : (sermon.duration || '—')}
                      </div>
                    </div>

                    {/* YouTube-style Video Details */}
                    <div style={{ padding: '12px', position: 'relative' }}>
                      <h4 style={{
                        fontSize: '0.95em',
                        fontWeight: '600',
                        margin: '0 0 6px 0',
                        lineHeight: '1.3',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        color: 'var(--ion-text-color)'
                      }}>
                        {sermon.title}
                      </h4>
                      <p style={{
                        margin: '0 0 4px 0',
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
                        {sermon.viewCount} views • {formatDate(sermon.publishedAt)}
                      </p>

                      {/* Options Button */}
                      <IonButton
                        fill="clear"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSermonForActionSheet(sermon);
                          setShowActionSheet(true);
                        }}
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          margin: '0',
                          padding: '6px',
                          minWidth: '32px',
                          height: '32px',
                          '--color': 'var(--ion-color-medium)'
                        }}
                      >
                        <IonIcon icon={ellipsisVertical} style={{ fontSize: '1.2em' }} />
                      </IonButton>
                    </div>
                  </div>
                ))}
              </div>
            </main>
          </div>
        )}

        {/* List View for When Sermon is Playing */}
        {!loading && currentSermon && (
          <div style={{ padding: '10px 15px', marginTop: '20px' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1em', fontWeight: '600' }}>
              More Sermons
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '600px', margin: '0 auto' }}>
              {(currentSermon ? [lastSermon, ...sermons].filter(s => s && s.id !== currentSermon.id) : sermons).map((sermon) => (
                <div
                  key={sermon.id}
                  className="video-item"
                  style={{
                    display: 'flex',
                    backgroundColor: 'var(--ion-background-color)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    border: 'none',
                    padding: '12px',
                    position: 'relative',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    transition: 'box-shadow 0.2s ease'
                  }}
                  onClick={async () => {
                    console.log('Setting currentSermon:', sermon);
                    setCurrentSermon(sermon as any);
                    setIsPlaying(true);

                    // Increment view count for database sermons
                    if ((sermon as any).isDatabaseSermon) {
                      try {
                        await apiService.getSermon(sermon.id);
                      } catch (error) {
                        console.error('Error incrementing view count:', error);
                      }
                    }
                  }}
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
                      src={getThumbnailUrl(sermon)}
                      alt={sermon.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (!target.src.includes('/Bible.JPG')) {
                          target.src = '/Bible.JPG';
                        }
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      bottom: '4px',
                      right: '4px',
                      backgroundColor: sermon.isLive ? '#ef4444' : 'rgba(0,0,0,0.8)',
                      color: 'white',
                      padding: '2px 4px',
                      borderRadius: '2px',
                      fontSize: '0.7em',
                      fontWeight: sermon.isLive ? 'bold' : 'normal'
                    }}>
                      {sermon.isLive ? 'LIVE' : (sermon.duration || '—')}
                    </div>
                    {currentSermon && sermon.id === currentSermon.id && (
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

                  {/* YouTube-style Video Details */}
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
                      {sermon.title}
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
                      {sermon.viewCount} views • {formatDate(sermon.publishedAt)}
                    </p>
                  </div>

                  {/* Options Button */}
                  <IonButton
                    fill="clear"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSermonForActionSheet(sermon);
                      setShowActionSheet(true);
                    }}
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

        {/* Action Sheet for sermon options */}
        <IonActionSheet
          isOpen={showActionSheet}
          onDidDismiss={() => {
            setShowActionSheet(false);
            setSelectedSermonForActionSheet(null);
          }}
          header={`Options for "${selectedSermonForActionSheet?.title}"`}
          buttons={[
            {
              text: selectedSermonForActionSheet && isSermonSaved(selectedSermonForActionSheet.id) ? 'Unsave' : 'Save',
              icon: selectedSermonForActionSheet && isSermonSaved(selectedSermonForActionSheet.id) ? heart : heartOutline,
              handler: () => {
                if (selectedSermonForActionSheet) {
                  toggleSaveSermon(selectedSermonForActionSheet);
                }
              }
            },
            {
              text: 'Share',
              icon: share,
              handler: async () => {
                if (selectedSermonForActionSheet) {
                  const shareData = {
                    title: selectedSermonForActionSheet.title,
                    text: selectedSermonForActionSheet.description,
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

export default Tab2;
