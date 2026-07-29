import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonButtons,
  IonIcon,
  IonText,
  IonAlert
} from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';
import { usePlayer } from '../contexts/PlayerContext';
import { isPodcast } from '../utils/mediaUtils';
import { Capacitor } from '@capacitor/core';
import { AuthContext } from '../App';
import apiService, { BACKEND_BASE_URL } from '../services/api';
import {
  play,
  pause,
  playBack,
  playForward,
  volumeHigh,
  volumeLow,
  volumeOff,
  share,
  heart,
  heartOutline,
  chevronForward,
  chevronBack,
  list,
  informationCircle,
  alertCircleOutline,
  calendar,
  time,
  eye
} from 'ionicons/icons';

// Helper function to convert relative URLs to full backend URLs
const getFullUrl = (url: string) => {
  if (!url || url.trim() === '') {
    return '/bible.JPG'; // Default fallback
  }
  if (url.startsWith('/uploads/') || url.startsWith('/uploads')) {
    return `${BACKEND_BASE_URL}${url}`;
  }
  if (url.startsWith('http')) {
    return url;
  }
  if (url.startsWith('/')) {
    return `${BACKEND_BASE_URL}${url}`;
  }
  return `${BACKEND_BASE_URL}/${url}`;
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

type ViewType = 'home' | 'upnext';

const FullPodcastPlayer: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const contentRef = useRef<HTMLIonContentElement>(null);
  const { currentMedia, isPlaying, setIsPlaying, setCurrentMedia, setCurrentSermon, savePlaybackPosition, getPlaybackPosition, skipForward, skipBackward, clearPlayer } = usePlayer();
  const { isLoggedIn } = useContext(AuthContext);

  const [showAuthAlert, setShowAuthAlert] = useState(false);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [queuePodcasts, setQueuePodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  
  // View navigation state
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [views] = useState<ViewType[]>(['home', 'upnext']);
  
  // Swipe gesture state
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const touchEndRef = useRef<{ x: number; y: number; time: number } | null>(null);
  
  // Check for id query parameter and fetch podcast if not in context
  useEffect(() => {
    const fetchPodcastById = async () => {
      if (currentMedia) {
        setLoading(false);
        return;
      }
      
      const urlParams = new URLSearchParams(location.search);
      const podcastId = urlParams.get('id');
      
      if (podcastId) {
        try {
          setLoading(true);
          const response = await fetch(`${BACKEND_BASE_URL}/api/podcasts/${podcastId}`);
          if (response.ok) {
            const data = await response.json();
            const podcastData = data.podcast || data;
            
            const formattedPodcast: Podcast = {
              id: podcastData._id || podcastData.id,
              title: podcastData.title,
              description: podcastData.description || '',
              thumbnailUrl: podcastData.thumbnailUrl || '',
              publishedAt: podcastData.publishedAt || podcastData.date || new Date().toISOString(),
              duration: podcastData.duration || '00:00',
              viewCount: podcastData.viewCount?.toString() || '0',
              audioUrl: podcastData.audioUrl || podcastData.audioFile || '',
              speaker: podcastData.speaker || 'Dove Ministries Africa',
              isLive: false
            };
            
            setCurrentMedia(formattedPodcast);
            setIsPlaying(true);
          }
        } catch (error) {
          console.error('Failed to fetch podcast by ID:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    
    fetchPodcastById();
  }, [location.search, currentMedia, setCurrentMedia, setIsPlaying]);

  const podcast = currentMedia && isPodcast(currentMedia) ? currentMedia : null;
  const [deviceVolumeSupported] = useState(true);

  // Parse podcast duration when podcast changes
  useEffect(() => {
    if (podcast?.duration) {
      // Parse duration string like "5:30" or "1:05:30" to seconds
      const parts = podcast.duration.split(':').map(Number);
      let seconds = 0;
      if (parts.length === 2) {
        seconds = parts[0] * 60 + parts[1];
      } else if (parts.length === 3) {
        seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
      } else {
        seconds = Number(podcast.duration) || 0;
      }
      setDuration(seconds);
      console.log('FullPodcastPlayer: Set duration to', seconds, 'seconds from', podcast.duration);
    } else {
      setDuration(0);
    }
  }, [podcast?.duration]);

  // Current view index for swipe navigation
  const currentViewIndex = views.indexOf(currentView);
  const canGoNext = currentViewIndex < views.length - 1;
  const canGoPrev = currentViewIndex > 0;

  // Fetch queue podcasts when component loads or current podcast changes
  useEffect(() => {
    const fetchQueuePodcasts = async () => {
      if (!podcast) return;

      try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/podcasts?page=1&limit=50`);
        if (response.ok) {
          const data = await response.json();
          const queueItems = data.podcasts
            .filter((p: Podcast) => p.id !== podcast.id)
            .slice(0, 20);
          setQueuePodcasts(queueItems);
        }
      } catch (error) {
        console.warn('Failed to fetch queue podcasts:', error);
        setQueuePodcasts([]);
      }
    };

    fetchQueuePodcasts();
  }, [podcast]);

  // Listen for notification next/prev controls
  useEffect(() => {
    const handleNotificationNext = () => {
      if (queuePodcasts.length > 0) {
        const nextPod = queuePodcasts[0];
        if (nextPod) {
          setCurrentMedia(nextPod);
          setIsPlaying(true);
        }
      }
    };
    const handleNotificationPrev = () => {
      if (queuePodcasts.length > 0) {
        const prevPod = queuePodcasts[queuePodcasts.length - 1];
        if (prevPod) {
          setCurrentMedia(prevPod);
          setIsPlaying(true);
        }
      }
    };
    window.addEventListener('notification-next', handleNotificationNext);
    window.addEventListener('notification-prev', handleNotificationPrev);
    return () => {
      window.removeEventListener('notification-next', handleNotificationNext);
      window.removeEventListener('notification-prev', handleNotificationPrev);
    };
  }, [queuePodcasts, setCurrentMedia, setIsPlaying]);

  // Check if podcast is saved
  useEffect(() => {
    const checkSavedStatus = async () => {
      if (podcast && isLoggedIn) {
        try {
          const response = await apiService.getSavedPodcasts();
          const isAlreadySaved = response.savedPodcasts.some((p: any) => (p._id || p.id) === podcast.id);
          setIsSaved(isAlreadySaved);
        } catch (error) {
          console.warn('Error checking saved status:', error);
          setIsSaved(false);
        }
      } else if (podcast) {
        try {
          const savedPodcasts = JSON.parse(localStorage.getItem('savedPodcasts') || '[]');
          const isAlreadySaved = savedPodcasts.some((p: any) => p.id === podcast.id);
          setIsSaved(isAlreadySaved);
        } catch (error) {
          setIsSaved(false);
        }
      } else {
        setIsSaved(false);
      }
    };

    checkSavedStatus();
  }, [podcast, isLoggedIn]);

  // Global mouse event listeners for volume dragging
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDraggingVolume) {
        const sliderElement = document.querySelector('.volume-slider-container') as HTMLElement;
        if (sliderElement) {
          handleVolumeMove(e.clientY, sliderElement);
        }
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDraggingVolume) {
        handleVolumeEnd();
      }
    };

    if (isDraggingVolume) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDraggingVolume]);

  // Auto-play when component loads
  useEffect(() => {
    if (podcast && !isPlaying) {
      // Auto-start playing when opening the player
      setIsPlaying(true);
    }
  }, [podcast]);

  // Save position on unmount
  useEffect(() => {
    return () => {
      savePlaybackPosition(getPlaybackPosition());
    };
  }, []);

  const handleSave = async () => {
    if (!podcast) return;

    if (!isLoggedIn) {
      setShowAuthAlert(true);
      return;
    }

    try {
      const result = await apiService.savePodcast(podcast.id);
      setIsSaved(result.saved);
      window.dispatchEvent(new Event('savedItemsChanged'));
    } catch (error) {
      console.error('Error saving/unsaving podcast:', error);
      alert('Failed to save podcast. Please try again.');
    }
  };

  const handleShare = async () => {
    if (!podcast) return;

    // Generate the shareable URL that points to the Vercel deployment
    const shareUrl = `${window.location.origin}/podcast-player?id=${podcast.id}`;
    
    const shareData = {
      title: podcast.title,
      text: `${podcast.title} - ${podcast.speaker || 'Dove Ministries Africa'}\n\n${podcast.description}`,
      url: shareUrl
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handlePlayPause = () => {
    // Toggle play state in context - AudioPlayer will handle actual audio
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(event.target.value);
    console.log('FullPodcastPlayer: Seeking to', time);
    savePlaybackPosition(time);
    // Dispatch event for AudioPlayer to seek the audio element
    window.dispatchEvent(new CustomEvent('audio-seek', { detail: { time } }));
  };

  const handleSkipBackward = () => {
    console.log('FullPodcastPlayer: skipBackward clicked');
    skipBackward();
  };

  const handleSkipForward = () => {
    console.log('FullPodcastPlayer: skipForward clicked');
    skipForward();
  };

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (isMuted) {
      setVolume(1);
      setIsMuted(false);
    } else {
      setVolume(0);
      setIsMuted(true);
    }
  };

  const calculateVolumeFromPosition = (clientY: number, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const clickY = clientY - rect.top;
    const height = rect.height;
    const newVolume = Math.max(0, Math.min(1, 1 - (clickY / height)));
    return newVolume;
  };

  const handleVolumeStart = (clientY: number, element: HTMLElement) => {
    setIsDraggingVolume(true);
    const newVolume = calculateVolumeFromPosition(clientY, element);
    handleVolumeChange({ target: { value: newVolume.toString() } } as any);
  };

  const handleVolumeMove = (clientY: number, element: HTMLElement) => {
    if (isDraggingVolume) {
      const newVolume = calculateVolumeFromPosition(clientY, element);
      handleVolumeChange({ target: { value: newVolume.toString() } } as any);
    }
  };

  const handleVolumeEnd = () => {
    setIsDraggingVolume(false);
  };

  // Mouse events for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleVolumeStart(e.clientY, e.currentTarget as HTMLElement);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingVolume) {
      e.preventDefault();
      handleVolumeMove(e.clientY, e.currentTarget as HTMLElement);
    }
  };

  const handleMouseUp = () => {
    handleVolumeEnd();
  };

  // Touch events for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    touchEndRef.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchEndRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  };

  const handleTouchEnd = () => {
    if (!touchStartRef.current || !touchEndRef.current) return;
    
    const distanceX = touchStartRef.current.x - touchEndRef.current.x;
    const distanceY = Math.abs(touchStartRef.current.y - touchEndRef.current.y);
    const timeDiff = touchEndRef.current.time - touchStartRef.current.time;
    
    const minSwipeDistance = 60;
    const maxSwipeTime = 400;
    const maxVerticalDistance = 80;
    
    const isLeftSwipe = distanceX > minSwipeDistance && distanceY < maxVerticalDistance && timeDiff < maxSwipeTime;
    const isRightSwipe = distanceX < -minSwipeDistance && distanceY < maxVerticalDistance && timeDiff < maxSwipeTime;
    
    if (isLeftSwipe && canGoNext) {
      setCurrentView(views[currentViewIndex + 1]);
    } else if (isRightSwipe && canGoPrev) {
      setCurrentView(views[currentViewIndex - 1]);
    }
    
    touchStartRef.current = null;
    touchEndRef.current = null;
  };

  const goToNextView = () => {
    if (canGoNext) {
      setCurrentView(views[currentViewIndex + 1]);
    }
  };

  const goToPrevView = () => {
    if (canGoPrev) {
      setCurrentView(views[currentViewIndex - 1]);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getViewTitle = (view: ViewType) => {
    switch (view) {
      case 'home': return 'Home';
      case 'upnext': return 'Up Next';
      default: return '';
    }
  };

  if (loading) {
    return (
      <IonPage>
        <IonContent fullscreen className="content-ios">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <IonText>Loading podcast...</IonText>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!podcast) {
    return (
      <IonPage>
        <IonContent fullscreen className="content-ios">
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', padding: '20px', textAlign: 'center' }}>
            <IonText>Podcast not found</IonText>
            <IonButton onClick={() => {
              clearPlayer();
              history.goBack();
            }} style={{ marginTop: '16px' }}>
              Go Back
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage className="podcast-player-page">
      <IonHeader translucent>
        <IonToolbar style={{ '--background': 'transparent' }}>
          <IonButton fill="clear" slot="start" onClick={() => { clearPlayer(); history.goBack(); }} style={{ marginLeft: '4px' }}>
            <IonIcon icon={chevronBack} style={{ fontSize: '22px', color: 'white' }} />
          </IonButton>
          <IonTitle style={{ color: 'white' }}>
            Now Playing
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent 
        ref={contentRef}
        fullscreen 
        scrollY={false}
        className="podcast-player-content"
        style={{ '--background': 'transparent' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Background Image with Blur */}
        <div
          className="podcast-player-bg"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${getFullUrl(podcast.thumbnailUrl)})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(30px) saturate(1.1)',
            zIndex: -1,
            transform: 'scale(1.1)'
          }}
        />

        {/* Gradient Overlay */}
        <div
          className="podcast-player-overlay"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: -1
          }}
        />

        {/* Main Content Container */}
        <div style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '0 16px',
          maxWidth: '100vw',
          margin: '0 auto',
          overflow: 'hidden'
        }}>
          {/* View Tabs */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            paddingTop: '16px',
            marginBottom: '12px',
            padding: '16px 4px 0',
            flexShrink: 0
          }}>
            <div className="pc-tabs" style={{
              display: 'flex',
              gap: '4px',
              padding: '4px',
              borderRadius: '12px'
            }}>
              {views.map((view) => (
                <div
                  key={view}
                  onClick={() => setCurrentView(view)}
                  className={currentView === view ? 'pc-tab pc-tab-active' : 'pc-tab'}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '10px',
                    fontSize: '0.85em',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    textTransform: 'capitalize',
                    minWidth: '80px',
                    textAlign: 'center'
                  }}
                >
                  {view}
                </div>
              ))}
            </div>
          </div>

          {/* Scrollable Content Area - only this scrolls */}
          <div style={{
            flex: 1,
            minHeight: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Home View */}
            {currentView === 'home' && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                paddingBottom: '180px',
                animation: 'fadeIn 0.3s ease-out'
              }}>
                {/* Album Art */}
                <div style={{
                  width: 'clamp(160px, 42vmin, 280px)',
                  height: 'clamp(160px, 42vmin, 280px)',
                  borderRadius: '20px',
                  backgroundImage: `url(${getFullUrl(podcast.thumbnailUrl)})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)',
                  position: 'relative',
                  overflow: 'hidden',
                  flexShrink: 0,
                  marginBottom: 'clamp(12px, 3vmin, 20px)'
                }}>
                  <div className="pc-home-album-border" style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderRadius: '20px',
                    animation: isPlaying ? 'pulse-border 2s infinite' : 'none',
                    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)'
                  }} />
                </div>

                {/* Podcast Details */}
                <div style={{
                  textAlign: 'center',
                  maxWidth: '400px',
                  width: '100%',
                  padding: '0 8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 'clamp(6px, 1.5vmin, 14px)'
                }}>
                  <h1 style={{
                    fontSize: 'clamp(1.1em, 3.5vmin, 1.5em)',
                    fontWeight: '700',
                    margin: 0,
                    lineHeight: '1.3',
                    textShadow: '0 2px 8px rgba(0,0,0,0.5)'
                  }}>
                    {podcast.title}
                  </h1>

                  <p className="pc-home-speaker" style={{
                    fontSize: 'clamp(0.85em, 2.2vmin, 1em)',
                    fontWeight: '500',
                    margin: 0
                  }}>
                    {podcast.speaker || 'Dove Ministries Africa'}
                  </p>

                  <div className="pc-home-meta" style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: '12px',
                    fontSize: 'clamp(0.7em, 1.8vmin, 0.85em)'
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <IonIcon icon={calendar} style={{ fontSize: '14px' }} />
                      {formatDate(podcast.publishedAt)}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <IonIcon icon={time} style={{ fontSize: '14px' }} />
                      {podcast.duration}
                    </span>
                  </div>

                  <p className="pc-home-desc" style={{
                    margin: 0,
                    fontSize: 'clamp(0.78em, 1.8vmin, 0.95em)',
                    lineHeight: '1.5',
                    maxWidth: '100%',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {podcast.description || 'No description available for this podcast.'}
                  </p>
                </div>
              </div>
            )}

            {/* UpNext View */}
            {currentView === 'upnext' && (
              <div style={{ animation: 'fadeIn 0.3s ease-out', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <div style={{ flexShrink: 0, marginBottom: '12px' }}>
                  <h4 className="pc-upnext-header" style={{
                    margin: '0 0 4px 0',
                    fontSize: '0.9em',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Up Next
                  </h4>
                  <p className="pc-upnext-sub" style={{
                    margin: 0,
                    fontSize: '0.8em'
                  }}>
                    {queuePodcasts.length} podcasts in queue
                  </p>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingRight: '4px', paddingBottom: '200px' }}>
                {queuePodcasts.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {queuePodcasts.map((queuePodcast, index) => (
                      <div
                        key={queuePodcast.id}
                        className="pc-upnext-item"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          padding: '8px',
                          borderRadius: '14px',
                          cursor: 'pointer',
                          transition: 'all 0.25s ease',
                          backdropFilter: 'blur(10px)'
                        }}
                        onClick={() => {
                          setCurrentMedia(queuePodcast);
                          setIsPlaying(true);
                        }}
                      >
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          backgroundImage: `url(${getFullUrl(queuePodcast.thumbnailUrl)})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          flexShrink: 0,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                        }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 className="pc-upnext-item-title" style={{
                            margin: '0 0 4px 0',
                            fontSize: '0.9em',
                            fontWeight: '600',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {queuePodcast.title}
                          </h4>
                          <p className="pc-upnext-item-sub" style={{
                            margin: 0,
                            fontSize: '0.8em',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {queuePodcast.speaker || 'Dove Ministries Africa'} • {queuePodcast.duration}
                          </p>
                        </div>
                        <div className="pc-upnext-item-num" style={{
                          fontSize: '0.75em',
                          fontWeight: '600',
                          padding: '4px 10px',
                          borderRadius: '8px'
                        }}>
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="pc-upnext-empty" style={{
                    textAlign: 'center',
                    padding: '48px 24px',
                    fontSize: '0.9em',
                    borderRadius: '16px'
                  }}>
                    No other podcasts available
                  </div>
                )}
                </div>
              </div>
            )}
          </div>

          {/* Controls Section - fixed above bottom nav */}
          <div className="podcast-controls-section" style={{
            position: 'fixed',
            bottom: '90px',
            left: '16px',
            right: '16px',
            padding: '16px 20px calc(8px + env(safe-area-inset-bottom, 0px))',
            borderRadius: '20px',
            zIndex: 100,
            minHeight: '150px'
          }}>
            {/* Progress Bar */}
            <div style={{ marginBottom: '16px' }}>
              <div className="pc-time" style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 'clamp(0.85em, 2vw, 0.95em)',
                opacity: 0.9,
                marginBottom: '12px',
                fontWeight: '500',
                padding: '0 4px'
              }}>
                <span>{formatTime(getPlaybackPosition())}</span>
                <span>{formatTime(duration)}</span>
              </div>
              <div className="pc-track" style={{
                position: 'relative',
                width: '100%',
                height: '8px',
                borderRadius: '4px',
                cursor: 'pointer',
                overflow: 'visible'
              }}>
                {/* Progress fill */}
                <div className="pc-fill" style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  height: '100%',
                  width: `${duration ? (getPlaybackPosition() / duration) * 100 : 0}%`,
                  borderRadius: '4px',
                  transition: 'width 0.1s linear'
                }} />
                {/* Thumb indicator */}
                <div className="pc-thumb" style={{
                  position: 'absolute',
                  left: `${duration ? (getPlaybackPosition() / duration) * 100 : 0}%`,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  zIndex: 10,
                  pointerEvents: 'none'
                }} />
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={getPlaybackPosition()}
                  onChange={handleSeek}
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    left: 0,
                    width: '100%',
                    height: '20px',
                    opacity: 0,
                    cursor: 'pointer',
                    appearance: 'none',
                    background: 'transparent',
                    margin: 0,
                    padding: 0
                  }}
                />
              </div>
            </div>

            {/* Main Controls */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '20px',
              marginBottom: '16px'
            }}>
              {/* Save Button */}
              <IonButton
                fill="clear"
                onClick={handleSave}
                className={isSaved ? 'pc-icon-heart' : 'pc-icon-outline'}
                style={{
                  '--ripple-color': 'rgba(255,255,255,0.3)',
                  width: 'clamp(48px, 12vw, 62px)',
                  height: 'clamp(48px, 12vw, 62px)',
                  borderRadius: '50%',
                  flexShrink: 1,
                  marginRight: '-6px'
                }}
              >
                <IonIcon icon={isSaved ? heart : heartOutline} style={{ fontSize: '1.6em' }} />
              </IonButton>

              {/* Rewind Button */}
              <div
                className="pc-btn"
                style={{
                  width: 'clamp(44px, 10vw, 52px)',
                  height: 'clamp(44px, 10vw, 52px)',
                  borderRadius: '26px',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 1,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={handleSkipBackward}
              >
                <IonIcon icon={playBack} className="pc-icon" style={{ fontSize: '1.4em' }} />
              </div>

              {/* Play/Pause Button */}
              <div
                className="pc-btn-play"
                style={{
                  width: 'clamp(50px, 14vw, 72px)',
                  height: 'clamp(50px, 14vw, 72px)',
                  borderRadius: '38px',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  cursor: audioError ? 'not-allowed' : 'pointer',
                  opacity: audioError ? 0.6 : 1
                }}
                onClick={audioError ? undefined : handlePlayPause}
              >
                <IonIcon icon={audioError ? alertCircleOutline : (isPlaying ? pause : play)} className="pc-icon" style={{ fontSize: '1.7em' }} />
              </div>

              {/* Forward Button */}
              <div
                className="pc-btn"
                style={{
                  width: 'clamp(44px, 10vw, 52px)',
                  height: 'clamp(44px, 10vw, 52px)',
                  borderRadius: '26px',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 1,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={handleSkipForward}
              >
                <IonIcon icon={playForward} className="pc-icon" style={{ fontSize: '1.4em' }} />
              </div>

              {/* Share Button */}
              <IonButton
                fill="clear"
                onClick={handleShare}
                className="pc-icon-share"
                style={{
                  '--ripple-color': 'rgba(255,255,255,0.3)',
                  width: 'clamp(48px, 12vw, 62px)',
                  height: 'clamp(48px, 12vw, 62px)',
                  borderRadius: '50%',
                  flexShrink: 1,
                  marginLeft: '-6px'
                }}
              >
                <IonIcon icon={share} style={{ fontSize: '1.6em' }} />
              </IonButton>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes pulse-border {
            0% { transform: scale(1); opacity: 0.6; }
            50% { transform: scale(1.02); opacity: 1; }
            100% { transform: scale(1); opacity: 0.6; }
          }

          @keyframes fadeIn {
            0% { opacity: 0; transform: translateY(10px); }
            100% { opacity: 1; transform: translateY(0); }
          }

          input[type="range"]::-webkit-slider-thumb {
            appearance: none;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: white;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            transition: transform 0.2s ease;
          }

          input[type="range"]::-webkit-slider-thumb:hover {
            transform: scale(1.15);
          }

          input[type="range"]::-moz-range-thumb {
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: white;
            cursor: pointer;
            border: none;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          }

          /* Scrollbar styling */
          div::-webkit-scrollbar {
            width: 4px;
          }
          
          div::-webkit-scrollbar-track {
            background: rgba(255,255,255,0.05);
            border-radius: 2px;
          }
          
          div::-webkit-scrollbar-thumb {
            background: rgba(255,255,255,0.2);
            border-radius: 2px;
          }
          
          div::-webkit-scrollbar-thumb:hover {
            background: rgba(255,255,255,0.3);
          }
        `}</style>

        <IonAlert isOpen={showAuthAlert} onDidDismiss={() => setShowAuthAlert(false)}
          header="Sign In Required" message="You must sign in to save this podcast."
          buttons={[{ text: 'OK', role: 'cancel' }, { text: 'Sign In', handler: () => history.push('/signin') }]} />

      </IonContent>
    </IonPage>
  );
};

export default FullPodcastPlayer;
