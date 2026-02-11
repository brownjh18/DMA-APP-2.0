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
  IonText
} from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';
import { usePlayer } from '../contexts/PlayerContext';
import { isPodcast } from '../utils/mediaUtils';
import { Capacitor } from '@capacitor/core';
import { AuthContext } from '../App';
import apiService from '../services/api';
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
  chatbubbleOutline,
  send,
  alertCircleOutline,
  calendar,
  time,
  eye
} from 'ionicons/icons';

// Helper function to convert relative URLs to full backend URLs
const getFullUrl = (url: string) => {
  return url;
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

interface Comment {
  _id: string;
  content: string;
  user?: {
    name: string;
    profileImage?: string;
  };
  createdAt: string;
}

type ViewType = 'home' | 'upnext' | 'comments';

const FullPodcastPlayer: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const contentRef = useRef<HTMLIonContentElement>(null);
  const { currentMedia, isPlaying, setIsPlaying, setCurrentMedia, setCurrentSermon, savePlaybackPosition, getPlaybackPosition, skipForward, skipBackward } = usePlayer();
  const { isLoggedIn } = useContext(AuthContext);

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
  const [views] = useState<ViewType[]>(['home', 'upnext', 'comments']);
  
  // Swipe gesture state
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const touchEndRef = useRef<{ x: number; y: number; time: number } | null>(null);
  
  // Comments state
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

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
          const response = await fetch(`/api/podcasts/${podcastId}`);
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
        const response = await fetch('/api/podcasts?page=1&limit=50');
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

  // Check if podcast is saved
  useEffect(() => {
    const checkSavedStatus = async () => {
      if (podcast && isLoggedIn) {
        try {
          const response = await apiService.getSavedPodcasts();
          const isAlreadySaved = response.savedPodcasts.some((p: any) => p._id === podcast.id);
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

  // Fetch comments when podcast changes
  useEffect(() => {
    const fetchComments = async () => {
      if (!podcast?.id) return;

      try {
        const response = await fetch(`/api/comments/${podcast.id}?_t=${Date.now()}`);
        if (response.ok) {
          const data = await response.json();
          setComments(data.comments || []);
        }
      } catch (error) {
        console.warn('Failed to fetch comments:', error);
      }
    };

    fetchComments();
  }, [podcast?.id]);

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

    try {
      if (isLoggedIn) {
        if (isSaved) {
          await apiService.unsavePodcast(podcast.id);
          setIsSaved(false);
        } else {
          await apiService.savePodcast(podcast.id);
          setIsSaved(true);
        }
      } else {
        const savedPodcasts = JSON.parse(localStorage.getItem('savedPodcasts') || '[]');
        const isAlreadySaved = savedPodcasts.some((p: any) => p.id === podcast.id);

        if (isAlreadySaved) {
          const updatedPodcasts = savedPodcasts.filter((p: any) => p.id !== podcast.id);
          localStorage.setItem('savedPodcasts', JSON.stringify(updatedPodcasts));
          setIsSaved(false);
        } else {
          savedPodcasts.push({
            id: podcast.id,
            title: podcast.title,
            speaker: podcast.speaker || 'Dove Ministries Africa',
            description: podcast.description || '',
            thumbnailUrl: podcast.thumbnailUrl || '',
            publishedAt: podcast.publishedAt || '',
            duration: podcast.duration || '',
            audioUrl: podcast.audioUrl || '',
            savedAt: new Date().toISOString()
          });
          localStorage.setItem('savedPodcasts', JSON.stringify(savedPodcasts));
          setIsSaved(true);
        }
        // Dispatch event to notify other pages
        window.dispatchEvent(new Event('savedItemsChanged'));
      }
    } catch (error) {
      console.error('Error saving/unsaving podcast:', error);
    }
  };

  const handleShare = async () => {
    if (!podcast) return;

    const shareData = {
      title: podcast.title,
      text: `${podcast.title} - ${podcast.speaker || 'Dove Ministries Africa'}\n\n${podcast.description}`,
      url: window.location.href
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

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!podcast || !newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment.trim(),
          contentId: podcast.id,
          contentType: 'podcast'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setComments(prev => [data.comment, ...prev]);
        setNewComment('');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setIsSubmittingComment(false);
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
      case 'comments': return 'Comments';
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
            <IonButton onClick={() => history.goBack()} style={{ marginTop: '16px' }}>
              Go Back
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader translucent style={{ background: 'transparent' }}>
        <IonToolbar style={{ '--background': 'transparent' }}>
          <IonButtons slot="start">
            <div
              onClick={() => history.goBack()}
              style={{
                position: 'absolute',
                top: 'calc(var(--ion-safe-area-top) - 23px)',
                left: 'clamp(16px, 5vw, 32px)',
                width: 45,
                height: 45,
                borderRadius: 25,
                background: 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.08))',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 999,
                transition: 'transform 0.2s ease'
              }}
            >
              <IonIcon
                icon={chevronBack}
                style={{
                  color: 'white',
                  fontSize: '24px',
                }}
              />
            </div>
          </IonButtons>
          <IonTitle style={{ color: 'white', textAlign: 'center', paddingRight: '60px' }}>
            Now Playing
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent 
        ref={contentRef}
        fullscreen 
        style={{ '--background': 'transparent' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Background Image with Blur */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${getFullUrl(podcast.thumbnailUrl)})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(30px) brightness(0.5) saturate(1.1)',
            zIndex: -1,
            transform: 'scale(1.1)'
          }}
        />

        {/* Gradient Overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              linear-gradient(180deg,
                rgba(0,0,0,0.3) 0%,
                rgba(0,0,0,0.4) 40%,
                rgba(0,0,0,0.6) 100%
              )
            `,
            zIndex: -1
          }}
        />

        {/* Main Content Container */}
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '16px 16px 0 16px',
          color: 'white',
          maxWidth: '100vw',
          margin: '0 auto'
        }}>
          {/* Middle Section - View Content (Home/UpNext/About/Comments) */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            paddingBottom: '340px' // Space for fixed controls
          }}>
            {/* View Header - Tabs Only */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '20px',
              padding: '0 4px'
            }}>
              {/* View Tabs */}
              <div style={{
                display: 'flex',
                gap: '4px',
                background: 'rgba(255,255,255,0.1)',
                padding: '4px',
                borderRadius: '12px'
              }}>
                {views.map((view) => (
                  <div
                    key={view}
                    onClick={() => setCurrentView(view)}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '10px',
                      fontSize: '0.85em',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      backgroundColor: currentView === view ? 'rgba(255,255,255,0.25)' : 'transparent',
                      color: currentView === view ? 'white' : 'rgba(255,255,255,0.6)',
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

            {/* View Content */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              paddingRight: '8px'
            }}>
              {/* Home View - Centered Podcast Info */}
              {currentView === 'home' && (
                <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                  {/* Album Art - Centered */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginBottom: '20px'
                  }}>
                    <div style={{
                      width: 'clamp(180px, 45vw, 220px)',
                      height: 'clamp(180px, 45vw, 220px)',
                      borderRadius: '20px',
                      backgroundImage: `url(${getFullUrl(podcast.thumbnailUrl)})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <div style={{
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
                  </div>

                  {/* Podcast Details - Centered, No Container */}
                  <div style={{
                    textAlign: 'center',
                    maxWidth: '400px',
                    margin: '0 auto',
                    padding: '0 8px'
                  }}>
                    <h1 style={{
                      fontSize: 'clamp(1.2em, 4vw, 1.5em)',
                      fontWeight: '700',
                      margin: '0 0 10px 0',
                      lineHeight: '1.3',
                      color: 'white',
                      textShadow: '0 2px 8px rgba(0,0,0,0.5)'
                    }}>
                      {podcast.title}
                    </h1>

                    <p style={{
                      fontSize: 'clamp(0.9em, 2.5vw, 1em)',
                      color: 'rgba(255,255,255,0.85)',
                      fontWeight: '500',
                      margin: '0 0 14px 0'
                    }}>
                      {podcast.speaker || 'Dove Ministries Africa'}
                    </p>

                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'center',
                      gap: '16px',
                      fontSize: 'clamp(0.75em, 2vw, 0.85em)',
                      color: 'rgba(255,255,255,0.65)',
                      marginBottom: '16px'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <IonIcon icon={calendar} style={{ fontSize: '14px' }} />
                        {formatDate(podcast.publishedAt)}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <IonIcon icon={eye} style={{ fontSize: '14px' }} />
                        {podcast.viewCount}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <IonIcon icon={time} style={{ fontSize: '14px' }} />
                        {podcast.duration}
                      </span>
                    </div>

                    {/* Description */}
                    <p style={{
                      margin: 0,
                      fontSize: 'clamp(0.85em, 2vw, 0.95em)',
                      color: 'rgba(255,255,255,0.75)',
                      lineHeight: '1.6',
                      maxWidth: '100%'
                    }}>
                      {podcast.description || 'No description available for this podcast.'}
                    </p>
                  </div>
                </div>
              )}

              {/* UpNext View */}
              {currentView === 'upnext' && (
                <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                  <div style={{ marginBottom: '32px' }}>
                    <h4 style={{
                      margin: '0 0 4px 0',
                      fontSize: '0.9em',
                      fontWeight: '600',
                      color: 'rgba(255,255,255,0.6)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Up Next
                    </h4>
                    <p style={{
                      margin: 0,
                      fontSize: '0.8em',
                      color: 'rgba(255,255,255,0.4)'
                    }}>
                      {queuePodcasts.length} podcasts in queue
                    </p>
                  </div>
                  {queuePodcasts.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {queuePodcasts.map((queuePodcast, index) => (
                        <div
                          key={queuePodcast.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '14px',
                            padding: '8px',
                            backgroundColor: 'rgba(255,255,255,0.08)',
                            borderRadius: '14px',
                            cursor: 'pointer',
                            transition: 'all 0.25s ease',
                            border: '1px solid rgba(255,255,255,0.08)',
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
                            <h4 style={{
                              margin: '0 0 4px 0',
                              fontSize: '0.9em',
                              fontWeight: '600',
                              color: 'white',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {queuePodcast.title}
                            </h4>
                            <p style={{
                              margin: 0,
                              fontSize: '0.8em',
                              color: 'rgba(255,255,255,0.6)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {queuePodcast.speaker || 'Dove Ministries Africa'} • {queuePodcast.duration}
                            </p>
                          </div>
                          <div style={{
                            fontSize: '0.75em',
                            color: 'rgba(255,255,255,0.4)',
                            fontWeight: '600',
                            padding: '4px 10px',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '8px'
                          }}>
                            {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{
                      textAlign: 'center',
                      padding: '48px 24px',
                      color: 'rgba(255,255,255,0.5)',
                      fontSize: '0.9em',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      borderRadius: '16px',
                      border: '1px solid rgba(255,255,255,0.08)'
                    }}>
                      No other podcasts available
                    </div>
                  )}
                </div>
              )}

              {/* Comments View */}
              {currentView === 'comments' && (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '10px',
                  animation: 'fadeIn 0.3s ease-out'
                }}>
                  {/* Comment Form */}
                  <form onSubmit={handleSubmitComment} style={{
                    padding: '18px',
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a comment..."
                      style={{
                        width: '100%',
                        minHeight: '80px',
                        padding: '14px',
                        backgroundColor: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '12px',
                        color: 'white',
                        fontSize: '0.9em',
                        resize: 'vertical',
                        outline: 'none',
                        fontFamily: 'inherit'
                      }}
                      disabled={isSubmittingComment}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                      <IonButton
                        type="submit"
                        fill="solid"
                        disabled={!newComment.trim() || isSubmittingComment}
                        style={{
                          '--background': 'rgba(255,255,255,0.2)',
                          '--color': 'white',
                          '--border-radius': '10px',
                          fontSize: '0.85em',
                          padding: '10px 20px',
                          fontWeight: '600'
                        }}
                      >
                        <IonIcon icon={send} style={{ fontSize: '14px', marginRight: '6px' }} />
                        {isSubmittingComment ? 'Posting...' : 'Post'}
                      </IonButton>
                    </div>
                  </form>

                  {/* Comments List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {comments.length > 0 ? (
                      comments.map((comment) => (
                        <div key={comment._id} style={{
                          padding: '12px',
                          backgroundColor: 'rgba(255,255,255,0.06)',
                          borderRadius: '12px',
                          border: '1px solid rgba(255,255,255,0.06)',
                          transition: 'all 0.25s ease'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <div style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              backgroundColor: 'rgba(99, 102, 241, 0.3)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.9em',
                              fontWeight: '600',
                              color: 'white',
                              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)'
                            }}>
                              {(comment.user?.name || 'U')[0].toUpperCase()}
                            </div>
                            <div style={{ flex: 1 }}>
                              <span style={{
                                fontSize: '0.85em',
                                fontWeight: '600',
                                color: 'white'
                              }}>
                                {comment.user?.name || 'Anonymous'}
                              </span>
                              <span style={{
                                fontSize: '0.75em',
                                color: 'rgba(255,255,255,0.4)',
                                marginLeft: '8px'
                              }}>
                                {new Date(comment.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <p style={{
                            margin: 0,
                            fontSize: '0.9em',
                            color: 'rgba(255,255,255,0.8)',
                            lineHeight: '1.6',
                            paddingLeft: '36px'
                          }}>
                            {comment.content}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div style={{
                        textAlign: 'center',
                        padding: '48px 24px',
                        color: 'rgba(255,255,255,0.5)',
                        fontSize: '0.9em',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        borderRadius: '16px',
                        border: '1px solid rgba(255,255,255,0.08)'
                      }}>
                        No comments yet. Be the first to comment!
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Fixed Bottom Controls Section */}
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '48px 20px calc(48px + env(safe-area-inset-bottom, 0px))',
            background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.8) 20%)',
            backdropFilter: 'blur(20px)',
            zIndex: 100
          }}>
            {/* Progress Bar */}
            <div style={{ marginBottom: '40px' }}>
              <div style={{
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
              <div style={{
                position: 'relative',
                width: '100%',
                height: '8px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '4px',
                cursor: 'pointer',
                overflow: 'visible'
              }}>
                {/* Progress fill */}
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  height: '100%',
                  width: `${duration ? (getPlaybackPosition() / duration) * 100 : 0}%`,
                  background: 'rgba(255,255,255,0.9)',
                  borderRadius: '4px',
                  transition: 'width 0.1s linear',
                  boxShadow: '0 0 8px rgba(255,255,255,0.3)'
                }} />
                {/* Thumb indicator */}
                <div style={{
                  position: 'absolute',
                  left: `${duration ? (getPlaybackPosition() / duration) * 100 : 0}%`,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: 'white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.4), 0 0 0 2px rgba(255,255,255,0.3)',
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
              gap: 'clamp(20px, 5vw, 36px)',
              marginBottom: '16px'
            }}>
              {/* Save Button */}
              <IonButton
                fill="clear"
                onClick={handleSave}
                style={{
                  '--color': isSaved ? '#ff4d4d' : 'rgba(255,255,255,0.7)',
                  '--ripple-color': 'rgba(255,255,255,0.3)',
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%'
                }}
              >
                <IonIcon icon={isSaved ? heart : heartOutline} style={{ fontSize: '1.6em' }} />
              </IonButton>

              {/* Rewind Button */}
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '26px',
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={handleSkipBackward}
              >
                <IonIcon icon={playBack} style={{ fontSize: '1.4em', color: '#ffffff' }} />
              </div>

              {/* Play/Pause Button */}
              <div
                style={{
                  width: 'clamp(68px, 16vw, 76px)',
                  height: 'clamp(68px, 16vw, 76px)',
                  borderRadius: '38px',
                  background: audioError ? 'rgba(102,102,102,0.3)' : 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  border: audioError ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  cursor: audioError ? 'not-allowed' : 'pointer',
                  opacity: audioError ? 0.6 : 1
                }}
                onClick={audioError ? undefined : handlePlayPause}
              >
                <IonIcon icon={audioError ? alertCircleOutline : (isPlaying ? pause : play)} style={{ fontSize: '1.7em', color: '#ffffff' }} />
              </div>

              {/* Forward Button */}
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '26px',
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={handleSkipForward}
              >
                <IonIcon icon={playForward} style={{ fontSize: '1.4em', color: '#ffffff' }} />
              </div>

              {/* Share Button */}
              <IonButton
                fill="clear"
                onClick={handleShare}
                style={{
                  '--color': 'rgba(255,255,255,0.7)',
                  '--ripple-color': 'rgba(255,255,255,0.3)',
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%'
                }}
              >
                <IonIcon icon={share} style={{ fontSize: '1.6em' }} />
              </IonButton>
            </div>

            {/* Volume Controls - Always Visible */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '0 8px'
            }}>
              <IonButton
                fill="clear"
                onClick={toggleMute}
                style={{
                  '--color': 'rgba(255,255,255,0.7)',
                  '--ripple-color': 'rgba(255,255,255,0.3)',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%'
                }}
              >
                <IonIcon icon={isMuted || volume === 0 ? volumeOff : volume < 0.5 ? volumeLow : volumeHigh} style={{ fontSize: '1.2em' }} />
              </IonButton>
              
              <div className="volume-slider-container" style={{
                position: 'relative',
                width: 'clamp(100px, 30vw, 140px)',
                height: '6px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '2px',
                cursor: 'pointer'
              }}>
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  height: '100%',
                  width: `${(isMuted ? 0 : volume) * 100}%`,
                  background: 'rgba(255,255,255,0.8)',
                  borderRadius: '2px',
                  transition: 'width 0.1s ease'
                }} />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="volume-slider"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer',
                    appearance: 'none'
                  }}
                />
              </div>
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
      </IonContent>
    </IonPage>
  );
};

export default FullPodcastPlayer;
