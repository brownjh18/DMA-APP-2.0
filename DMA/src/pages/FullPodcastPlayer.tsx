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
import { useNotifications } from '../contexts/NotificationContext';
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
  bookmark,
  bookmarkOutline,
  ellipsisHorizontal,
  list,
  alertCircle,
  arrowBack,
  chatbubbleOutline
} from 'ionicons/icons';

// Helper function to convert relative URLs to full backend URLs
const getFullUrl = (url: string) => {
  // Since /uploads is now proxied in vite.config.ts, we can use relative URLs
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


const FullPodcastPlayer: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const audioRef = useRef<HTMLAudioElement>(null);
  const { currentMedia, isPlaying, setIsPlaying, setCurrentMedia, setCurrentSermon, savePlaybackPosition, getPlaybackPosition } = usePlayer();
  const { isLoggedIn } = useContext(AuthContext);
  const { addNotification } = useNotifications();

  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [queuePodcasts, setQueuePodcasts] = useState<Podcast[]>([]);
  
  // Swipe gesture state
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; time: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number; time: number } | null>(null);
  
  // Upnext section view state
  const [showUpnextList, setShowUpnextList] = useState(true);
  const [queueView, setQueueView] = useState<'upnext' | 'about' | 'comments'>('upnext');

  // Comments state
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const podcast = currentMedia && isPodcast(currentMedia) ? currentMedia : null;
  const [deviceVolumeSupported, setDeviceVolumeSupported] = useState(false);

  useEffect(() => {
    // Check for device volume control support
    if (Capacitor.isNativePlatform()) {
      // On native platforms, HTML audio volume typically controls device media volume
      setDeviceVolumeSupported(true);
    } else {
      // On web, we still use HTML audio volume
      setDeviceVolumeSupported(true);
    }
  }, []);

  useEffect(() => {
    if (audioRef.current && podcast) {
      audioRef.current.volume = volume;
    }
  }, [volume, podcast]);

  // Fetch queue podcasts when component loads or current podcast changes
  useEffect(() => {
    const fetchQueuePodcasts = async () => {
      if (!podcast) return;

      try {
        const response = await fetch('/api/podcasts?page=1&limit=50');
        if (response.ok) {
          const data = await response.json();
          // Filter out the current podcast and take up to 20 for the queue
          const queueItems = data.podcasts
            .filter((p: Podcast) => p.id !== podcast.id)
            .slice(0, 20);
          setQueuePodcasts(queueItems);
        }
      } catch (error) {
        console.warn('Failed to fetch queue podcasts:', error);
        // Fallback to empty array
        setQueuePodcasts([]);
      }
    };

    fetchQueuePodcasts();
  }, [podcast]);

  // Check if podcast is saved when component loads or podcast changes
  useEffect(() => {
    const checkSavedStatus = async () => {
      if (podcast && isLoggedIn) {
        try {
          // Check if podcast is saved by trying to get saved podcasts and checking if this one is in the list
          const response = await apiService.getSavedPodcasts();
          const isAlreadySaved = response.savedPodcasts.some((p: any) => p._id === podcast.id);
          setIsSaved(isAlreadySaved);
        } catch (error) {
          console.warn('Error checking saved status:', error);
          setIsSaved(false);
        }
      } else if (podcast) {
        // For non-logged in users, fall back to localStorage
        try {
          const savedPodcasts = JSON.parse(localStorage.getItem('savedPodcasts') || '[]');
          const isAlreadySaved = savedPodcasts.some((p: any) => p.id === podcast.id);
          setIsSaved(isAlreadySaved);
        } catch (error) {
          console.warn('Error checking saved status from localStorage:', error);
          setIsSaved(false);
        }
      } else {
        setIsSaved(false);
      }
    };

    checkSavedStatus();
  }, [podcast, isLoggedIn]);

  // Reset queue view when queue is closed
  useEffect(() => {
    if (!showQueue) {
      setQueueView('upnext');
    }
  }, [showQueue]);

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

  // Auto-play when component loads and isPlaying is true
  useEffect(() => {
    if (podcast && isPlaying && audioRef.current && !audioError) {
      // Small delay to ensure audio element is ready
      const timer = setTimeout(() => {
        const playPromise = audioRef.current?.play();
        if (playPromise !== undefined) {
          playPromise
            .then(async () => {
              // Increment listen count when audio actually starts playing
              if (podcast?.id) {
                try {
                  await fetch(`http://localhost:5000/api/podcasts/${podcast.id}?listen=true`, {
                    method: 'GET',
                    headers: {
                      'x-requested-with': 'listen'
                    }
                  });
                } catch (error) {
                  console.warn('Failed to increment listen count:', error);
                }
              }
            })
            .catch((error) => {
              console.error('Auto-play failed:', error);
              setAudioError('Audio playback not supported or file is invalid');
              setIsPlaying(false);
            });
        }
      }, 100); // Small delay to ensure component is fully mounted

      return () => clearTimeout(timer);
    }
  }, [podcast, isPlaying, audioError]);

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

  const handleSave = async () => {
    if (!podcast) return;

    try {
      if (isLoggedIn) {
        // Use backend API for logged-in users
        if (isSaved) {
          // Unsave podcast
          await apiService.unsavePodcast(podcast.id);
          setIsSaved(false);
          alert(`"${podcast.title}" has been removed from your saved list.`);
        } else {
          // Save podcast
          await apiService.savePodcast(podcast.id);
          setIsSaved(true);
          alert(`"${podcast.title}" has been saved to your list!`);

          // Add notification for saved podcast
          addNotification({
            type: 'podcast',
            title: 'Podcast Saved',
            message: `"${podcast.title}" has been saved to your library for offline listening`,
            data: { podcastId: podcast.id, title: podcast.title }
          });
        }
      } else {
        // Fallback to localStorage for non-logged-in users
        const savedPodcasts = JSON.parse(localStorage.getItem('savedPodcasts') || '[]');
        const isAlreadySaved = savedPodcasts.some((p: any) => p.id === podcast.id);

        if (isAlreadySaved) {
          // Remove from saved podcasts
          const updatedPodcasts = savedPodcasts.filter((p: any) => p.id !== podcast.id);
          localStorage.setItem('savedPodcasts', JSON.stringify(updatedPodcasts));
          setIsSaved(false);
          alert(`"${podcast.title}" has been removed from your saved list.`);
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
          savedAt: new Date().toISOString()
        };

        // Add to saved podcasts
        savedPodcasts.push(savedPodcast);
        localStorage.setItem('savedPodcasts', JSON.stringify(savedPodcasts));
        setIsSaved(true);

        // Show success message
        alert(`"${podcast.title}" has been saved to your list!`);
      }
    } catch (error) {
      console.error('Error saving/unsaving podcast:', error);
      alert('Failed to save/unsave podcast. Please try again.');
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
        // Fallback: copy to clipboard
        const textToCopy = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
        await navigator.clipboard.writeText(textToCopy);
        alert('Podcast details copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      alert('Failed to share podcast. Please try again.');
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!podcast || !newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add auth header if needed
        },
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
      } else {
        alert('Failed to post comment. Please try again.');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Failed to post comment. Please try again.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handlePlayPause = async () => {
    if (audioRef.current && !audioError) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(async () => {
              setIsPlaying(true);
              // Increment listen count when audio actually starts playing
              if (podcast?.id) {
                try {
                  await fetch(`http://localhost:5000/api/podcasts/${podcast.id}?listen=true`, {
                    method: 'GET',
                    headers: {
                      'x-requested-with': 'listen'
                    }
                  });
                } catch (error) {
                  console.warn('Failed to increment listen count:', error);
                }
              }
            })
            .catch((error) => {
              console.error('Audio play failed:', error);
              setAudioError('Audio playback not supported or file is invalid');
              setIsPlaying(false);
            });
        }
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const time = audioRef.current.currentTime;
      savePlaybackPosition(time);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setAudioError(null); // Clear any previous errors

      // Seek to saved position
      const savedPosition = getPlaybackPosition();
      if (savedPosition > 0) {
        audioRef.current.currentTime = savedPosition;
      }
    }
  };

  const handleAudioError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    console.error('Audio loading error:', e);
    setAudioError('Audio file could not be loaded or is not supported');
    setIsPlaying(false);
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(event.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      savePlaybackPosition(time);
    }
  };

  const handleSkipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
    }
  };

  const handleSkipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 10);
    }
  };

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);

    // In mobile apps, HTML audio volume controls device media volume
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const calculateVolumeFromPosition = (clientY: number, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const clickY = clientY - rect.top;
    const height = rect.height;
    // For vertical slider: top = max volume (1), bottom = min volume (0)
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
    handleVolumeStart(touch.clientY, e.currentTarget as HTMLElement);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDraggingVolume) {
      e.preventDefault();
      const touch = e.touches[0];
      handleVolumeMove(touch.clientY, e.currentTarget as HTMLElement);
    }
  };

  const handleTouchEnd = () => {
    handleVolumeEnd();
  };

  // Swipe gesture handlers
  const handleSwipeStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    });
    setTouchEnd(null);
  };

  const handleSwipeMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchEnd({
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    });
  };

  const handleSwipeEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distanceY = touchStart.y - touchEnd.y;
    const distanceX = Math.abs(touchStart.x - touchEnd.x);
    const timeDiff = touchEnd.time - touchStart.time;
    
    // Swipe threshold: minimum 100px vertical distance (upward), maximum 500ms duration
    // Allow some horizontal movement but prioritize vertical
    const minSwipeDistance = 100;
    const maxSwipeTime = 500;
    const maxHorizontalDistance = 50;
    
    const isUpSwipe = distanceY > minSwipeDistance && 
                     distanceX < maxHorizontalDistance && 
                     timeDiff < maxSwipeTime;
    
    if (isUpSwipe) {
      // Only trigger if queue is not already open
      if (!showQueue) {
        setShowQueue(true);
      }
    }
    
    // Reset touch states
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Upnext section swipe handlers
  const handleUpnextSwipeStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    });
    setTouchEnd(null);
  };

  const handleUpnextSwipeMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchEnd({
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    });
  };

  const handleUpnextSwipeEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchEnd.y - touchStart.y;
    const timeDiff = touchEnd.time - touchStart.time;
    
    // Swipe threshold: minimum 80px horizontal distance, 100px vertical distance
    const minHorizontalSwipe = 80;
    const minVerticalSwipe = 100;
    const maxSwipeTime = 500;
    const maxHorizontalDistance = 30;
    
    const isLeftSwipe = distanceX > minHorizontalSwipe &&
                       Math.abs(distanceY) < maxHorizontalDistance &&
                       timeDiff < maxSwipeTime;

    const isRightSwipe = distanceX < -minHorizontalSwipe &&
                        Math.abs(distanceY) < maxHorizontalDistance &&
                        timeDiff < maxSwipeTime;

    const isDownSwipe = distanceY > minVerticalSwipe &&
                       Math.abs(distanceX) < maxHorizontalDistance &&
                       timeDiff < maxSwipeTime;

    if (isLeftSwipe) {
      // Cycle to next view: upnext -> about -> comments -> upnext
      const views: ('upnext' | 'about' | 'comments')[] = ['upnext', 'about', 'comments'];
      const currentIndex = views.indexOf(queueView);
      const nextIndex = (currentIndex + 1) % views.length;
      setQueueView(views[nextIndex]);
    } else if (isRightSwipe) {
      // Cycle to previous view: upnext <- about <- comments <- upnext
      const views: ('upnext' | 'about' | 'comments')[] = ['upnext', 'about', 'comments'];
      const currentIndex = views.indexOf(queueView);
      const prevIndex = currentIndex === 0 ? views.length - 1 : currentIndex - 1;
      setQueueView(views[prevIndex]);
    } else if (isDownSwipe) {
      // Close the queue section when swiping down
      setShowQueue(false);
    }
    
    // Reset touch states
    setTouchStart(null);
    setTouchEnd(null);
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

  if (!podcast) {
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
                background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 6px 16px rgba(0,0,0,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 999,
                transition: 'transform 0.2s ease'
              }}
              onMouseDown={(e) => {
                const target = e.currentTarget as HTMLElement;
                target.style.transform = 'scale(0.8)';
              }}
              onMouseUp={(e) => {
                const target = e.currentTarget as HTMLElement;
                setTimeout(() => {
                  target.style.transform = 'scale(1)';
                }, 200);
              }}
              onMouseLeave={(e) => {
                const target = e.currentTarget as HTMLElement;
                target.style.transform = 'scale(1)';
              }}
            >
              <IonIcon
                icon={arrowBack}
                style={{
                  color: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? '#ffffff' : '#000000',
                  fontSize: '20px',
                }}
              />
            </div>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent 
        fullscreen 
        scrollY={false} 
        style={{ '--background': 'transparent' }}
        onTouchStart={handleSwipeStart}
        onTouchMove={handleSwipeMove}
        onTouchEnd={handleSwipeEnd}
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
            filter: 'blur(25px) brightness(0.6) saturate(1.1)',
            zIndex: -1,
            transform: 'scale(1.1)'
          }}
        />

        {/* Multiple Gradient Overlays for Apple Music effect */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              linear-gradient(180deg,
                rgba(0,0,0,0.05) 0%,
                rgba(0,0,0,0.15) 20%,
                rgba(0,0,0,0.3) 50%,
                rgba(0,0,0,0.5) 80%,
                rgba(0,0,0,0.7) 100%
              ),
              linear-gradient(45deg,
                rgba(255,255,255,0.08) 0%,
                transparent 50%,
                rgba(255,255,255,0.05) 100%
              )
            `,
            zIndex: -1
          }}
        />

        {/* Subtle vignette effect */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.15) 100%)',
            zIndex: -1,
            pointerEvents: 'none'
          }}
        />

        <div style={{
          height: showQueue ? '70vh' : '100vh', // Increased height for better balance
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: showQueue ? '16px' : '16px 16px 0 16px', // Consistent padding
          color: 'white',
          transition: 'height 0.3s ease',
          maxWidth: '100vw', // Ensure it doesn't exceed viewport
          margin: '0 auto' // Center the content
        }}>
          {/* Top Section - Podcast Info */}
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            alignItems: 'center', 
            paddingTop: (showQueue && showUpnextList) ? '16px' : '12px', // Balanced spacing
            paddingBottom: showQueue ? '0' : '6px',
            minHeight: 0 // Allow flex shrinking
          }}>
            {/* Controls and Thumbnail Layout - Controls Left, Thumbnail Right */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              maxWidth: '480px', // Slightly smaller for better proportions
              margin: '0 auto 16px auto', // Reduced margin for better balance
              padding: showQueue ? '0 16px' : '0',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              gap: showQueue ? '16px' : '0' // Reduced gap
            }}>
              {/* Controls Row when Queue is Open - First */}
              {showQueue && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '2px',
                  flexShrink: 0
                }}>
                  <IonButton
                    fill="clear"
                    onClick={() => setShowQueue(!showQueue)}
                    className="control-button"
                    style={{
                      '--color': 'white',
                      '--ripple-color': 'rgba(255,255,255,0.3)',
                      '--border-radius': '26px',
                      width: '52px',
                      height: '52px',
                      borderRadius: '50%',
                      backgroundColor: showQueue ? 'rgba(255,255,255,0.1)' : 'transparent'
                    }}
                  >
                    <IonIcon icon={list} style={{ fontSize: '1.5em' }} />
                  </IonButton>

                  <IonButton
                    fill="clear"
                    onClick={toggleMute}
                    className="control-button"
                    style={{
                      '--color': 'white',
                      '--ripple-color': 'rgba(255,255,255,0.3)',
                      '--border-radius': '26px',
                      width: '52px',
                      height: '52px',
                      borderRadius: '50%'
                    }}
                  >
                    <IonIcon icon={isMuted || volume === 0 ? volumeOff : volume < 0.5 ? volumeLow : volumeHigh} style={{ fontSize: '1.5em' }} />
                  </IonButton>
                  <div className="volume-slider-container" style={{
                    position: 'relative',
                    width: '120px',
                    height: '5px',
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '2.5px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}>
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      height: '100%',
                      width: `${(isMuted ? 0 : volume) * 100}%`,
                      background: 'linear-gradient(90deg, #ffffff 0%, #f0f0f0 100%)',
                      borderRadius: '2.5px',
                      boxShadow: '0 0 6px rgba(255,255,255,0.4)',
                      transition: 'width 0.1s ease'
                    }} />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
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
              )}

              {/* Album Art - Compact When Queue is Open - Second */}
              <div style={{
                width: showQueue ? '56px' : 'clamp(160px, 40vw, 200px)', // Responsive sizing
                height: showQueue ? '56px' : 'clamp(160px, 40vw, 200px)',
                borderRadius: showQueue ? '8px' : '16px', // Slightly smaller border radius
                backgroundImage: `url(${getFullUrl(podcast.thumbnailUrl)})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                boxShadow: showQueue 
                  ? '0 4px 16px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)' 
                  : '0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)',
                position: 'relative',
                overflow: 'hidden',
                flexShrink: 0,
                transform: showQueue ? 'scale(0.7)' : 'scale(1)',
                opacity: showQueue ? 0.9 : 1, // Slightly less transparent
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
              }}>
              {/* Animated border effect */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                border: showQueue ? '1px solid rgba(255,255,255,0.3)' : '2px solid rgba(255,255,255,0.4)',
                borderRadius: showQueue ? '8px' : '20px',
                animation: isPlaying ? 'pulse-border 2s infinite' : 'none',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
              }} />

              {/* Inner glow effect */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: showQueue ? '160%' : '120%',
                height: showQueue ? '160%' : '120%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                borderRadius: '50%',
                opacity: isPlaying ? 0.6 : 0.3,
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
              }} />
              </div>
            </div>

            {/* Podcast Details */}
            <div style={{ textAlign: 'center', maxWidth: '340px', padding: '0 16px' }}> {/* Increased max-width and reduced padding */}
              <h1 style={{
                fontSize: showQueue ? '1.2em' : 'clamp(1.3em, 4vw, 1.6em)', // Responsive font sizing
                fontWeight: '700',
                margin: '0 0 8px 0', // Balanced margin
                lineHeight: '1.2', // Better line height
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                letterSpacing: '-0.01em'
              }}>
                {podcast.title}
              </h1>

              {/* Hide these details when queue is open */}
              {!showQueue && (
                <>
                  <p style={{
                    fontSize: 'clamp(0.85em, 2.5vw, 0.95em)', // Responsive font size
                    opacity: 0.9, // Higher opacity for better visibility
                    margin: '0 0 10px 0', // Balanced margin
                    fontWeight: '500',
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                  }}>
                    {podcast.speaker || 'Dove Ministries Africa'}
                  </p>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '14px', // Balanced gap
                    fontSize: 'clamp(0.7em, 2vw, 0.8em)', // Responsive font size
                    opacity: 0.8, // Better opacity
                    fontWeight: '500',
                    marginBottom: '16px' // Space before description
                  }}>
                    <span>{formatDate(podcast.publishedAt)}</span>
                    <span style={{ opacity: 0.6 }}>•</span>
                    <span>{podcast.viewCount} listens</span>
                  </div>
                  
                  {/* Description text moved here from bottom section */}
                  <div style={{
                    padding: '0 8px',
                    maxHeight: '90px', // Optimized height
                    overflow: 'hidden',
                    marginBottom: '8px'
                  }}>
                    <p style={{
                      fontSize: 'clamp(0.8em, 2vw, 0.9em)', // Responsive font sizing
                      lineHeight: '1.4', // Compact line height
                      opacity: 0.85, // Slightly reduced for hierarchy
                      margin: 0,
                      textAlign: 'center',
                      display: '-webkit-box',
                      WebkitLineClamp: 3, // Show up to 3 lines
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {podcast.description}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Bottom Section - Controls */}
          <div style={{
            paddingBottom: showQueue ? '280px' : '180px', // Better bottom spacing
            paddingTop: showQueue ? '12px' : '0px', // Reduced top padding
            paddingLeft: showQueue ? '0' : '16px',
            paddingRight: showQueue ? '0' : '16px',
            flexShrink: 0 // Prevent shrinking
          }}>
            {/* Progress Bar */}
            <div style={{ marginBottom: '20px', marginTop: '-30px', padding: '0 8px' }}> {/* Reduced padding and margin */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 'clamp(0.8em, 2vw, 0.9em)', // Responsive font size
                opacity: 0.95, // Better opacity
                marginBottom: '10px', // Reduced margin
                fontWeight: '500'
              }}>
                <span>{formatTime(getPlaybackPosition())}</span>
                <span>{formatTime(duration)}</span>
              </div>
              <div style={{
                position: 'relative',
                width: '100%',
                height: '5px', // Slightly thicker for better visibility
                background: 'rgba(255,255,255,0.25)', // Slightly more visible
                borderRadius: '2.5px',
                cursor: 'pointer'
              }}>
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  height: '100%',
                  width: `${duration ? (getPlaybackPosition() / duration) * 100 : 0}%`,
                  background: 'linear-gradient(90deg, #ffffff 0%, #f0f0f0 100%)',
                  borderRadius: '2px',
                  boxShadow: '0 0 6px rgba(255,255,255,0.4)'
                }} />
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={getPlaybackPosition()}
                  onChange={handleSeek}
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

            {/* Main Controls */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'clamp(16px, 4vw, 24px)', // Responsive gap
              marginBottom: '18px' // Balanced margin
            }}>
              {/* Save Button */}
              <IonButton
                fill="clear"
                onClick={handleSave}
                className="control-button"
                style={{
                  '--color': isSaved ? '#007bff' : 'white',
                  '--ripple-color': 'rgba(0,123,255,0.3)',
                  '--border-radius': '26px',
                  width: 'clamp(48px, 12vw, 52px)', // Responsive sizing
                  height: 'clamp(48px, 12vw, 52px)',
                  borderRadius: '50%'
                }}
              >
                <IonIcon icon={isSaved ? bookmark : bookmarkOutline} style={{ fontSize: 'clamp(1.3em, 3.5vw, 1.5em)' }} />
              </IonButton>

              {/* Rewind Button */}
              <div
                style={{
                  width: 'clamp(44px, 11vw, 48px)', // Responsive sizing
                  height: 'clamp(44px, 11vw, 48px)',
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
                  transition: 'transform 0.2s ease'
                }}
                onClick={(e) => {
                  const target = e.currentTarget as HTMLElement;
                  target.style.transform = 'scale(0.8)';
                  setTimeout(() => {
                    target.style.transform = 'scale(1)';
                  }, 200);
                  handleSkipBackward();
                }}
              >
                <IonIcon icon={playBack} style={{ fontSize: 'clamp(1.2em, 3vw, 1.4em)', color: '#ffffff' }} />
              </div>

              {/* Play/Pause Button */}
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    width: 'clamp(64px, 16vw, 72px)', // Responsive sizing
                    height: 'clamp(64px, 16vw, 72px)',
                    borderRadius: '32px',
                    background: audioError ? 'rgba(102,102,102,0.3)' : 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))',
                    backdropFilter: audioError ? 'none' : 'blur(10px)',
                    border: audioError ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.2)',
                    boxShadow: audioError ? '0 6px 16px rgba(0,0,0,0.2)' : '0 6px 16px rgba(0,0,0,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    cursor: audioError ? 'not-allowed' : 'pointer',
                    transition: 'transform 0.2s ease',
                    opacity: audioError ? 0.6 : 1
                  }}
                  onClick={audioError ? undefined : (e) => {
                    const target = e.currentTarget as HTMLElement;
                    target.style.transform = 'scale(0.8)';
                    setTimeout(() => {
                      target.style.transform = 'scale(1)';
                    }, 200);
                    handlePlayPause();
                  }}
                >
                  <IonIcon icon={audioError ? alertCircle : (isPlaying ? pause : play)} style={{ fontSize: 'clamp(1.6em, 4vw, 1.8em)', color: '#ffffff' }} />
                </div>
                {audioError && (
                  <div style={{
                    position: 'absolute',
                    top: '-40px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '0.8em',
                    whiteSpace: 'nowrap',
                    zIndex: 1000
                  }}>
                    {audioError}
                  </div>
                )}
              </div>

              {/* Forward Button */}
              <div
                style={{
                  width: 'clamp(44px, 11vw, 48px)', // Responsive sizing
                  height: 'clamp(44px, 11vw, 48px)',
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
                  transition: 'transform 0.2s ease'
                }}
                onClick={(e) => {
                  const target = e.currentTarget as HTMLElement;
                  target.style.transform = 'scale(0.8)';
                  setTimeout(() => {
                    target.style.transform = 'scale(1)';
                  }, 200);
                  handleSkipForward();
                }}
              >
                <IonIcon icon={playForward} style={{ fontSize: 'clamp(1.2em, 3vw, 1.4em)', color: '#ffffff' }} />
              </div>

              {/* Share Button */}
              <IonButton
                fill="clear"
                onClick={handleShare}
                className="control-button"
                style={{
                  '--color': 'white',
                  '--ripple-color': 'rgba(255,255,255,0.3)',
                  '--border-radius': '26px',
                  width: 'clamp(48px, 12vw, 52px)', // Responsive sizing
                  height: 'clamp(48px, 12vw, 52px)',
                  borderRadius: '50%'
                }}
              >
                <IonIcon icon={share} style={{ fontSize: 'clamp(1.3em, 3.5vw, 1.5em)' }} />
              </IonButton>
            </div>



            {/* Secondary Controls - Hidden when queue is open */}
            {!showQueue && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px', // Minimal gap for compact layout
                padding: '0 16px',
                marginBottom: '16px' // Balanced margin
              }}>
                <IonButton
                  fill="clear"
                  className="control-button"
                  onClick={() => setShowQueue(!showQueue)}
                  style={{
                    '--color': 'white',
                    '--ripple-color': 'rgba(255,255,255,0.3)',
                    '--border-radius': '26px',
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: showQueue ? 'rgba(255,255,255,0.1)' : 'transparent'
                  }}
                >
                  <IonIcon icon={list} style={{ fontSize: '1.4em' }} />
                </IonButton>

                <IonButton
                  fill="clear"
                  onClick={toggleMute}
                  className="control-button"
                  style={{
                    '--color': 'white',
                    '--ripple-color': 'rgba(255,255,255,0.3)',
                    '--border-radius': '26px',
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%'
                  }}
                >
                  <IonIcon icon={isMuted || volume === 0 ? volumeOff : volume < 0.5 ? volumeLow : volumeHigh} style={{ fontSize: '1.4em' }} />
                </IonButton>
                <div className="volume-slider-container" style={{
                  position: 'relative',
                  width: 'clamp(100px, 25vw, 120px)', // Responsive width
                  height: '5px',
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '2.5px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    height: '100%',
                    width: `${(isMuted ? 0 : volume) * 100}%`,
                    background: 'linear-gradient(90deg, #ffffff 0%, #f0f0f0 100%)',
                    borderRadius: '2.5px',
                    boxShadow: '0 0 6px rgba(255,255,255,0.4)',
                    transition: 'width 0.1s ease'
                  }} />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
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
            )}
          </div>
        </div>

        {/* Hidden Audio Element */}
        <audio
          ref={audioRef}
          src={getFullUrl(podcast.audioUrl)}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          onError={handleAudioError}
          style={{ display: 'none' }}
        />

        {/* Queue Extension */}
        {showQueue && (
          <>
            {/* Background Image with Blur for Queue */}
            <div
              style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                height: '45vh',
                backgroundImage: `url(${getFullUrl(podcast.thumbnailUrl)})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(25px) brightness(0.6) saturate(1.1)',
                zIndex: 999,
                transform: 'scale(1.1)'
              }}
            />

            {/* Multiple Gradient Overlays for Queue */}
            <div
              style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                height: '45vh',
                background: `
                  linear-gradient(180deg,
                    rgba(0,0,0,0.1) 0%,
                    rgba(0,0,0,0.3) 30%,
                    rgba(0,0,0,0.6) 70%,
                    rgba(0,0,0,0.9) 100%
                  ),
                  linear-gradient(45deg,
                    rgba(255,255,255,0.08) 0%,
                    transparent 50%,
                    rgba(255,255,255,0.05) 100%
                  )
                `,
                zIndex: 999
              }}
            />

            {/* Queue Content */}
            <div className="queue-content" style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              height: '45vh',
              backdropFilter: 'blur(20px)',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              zIndex: 1000,
              overflowY: 'auto',
              overflowX: 'hidden',
              WebkitOverflowScrolling: 'touch',
              animation: 'slideUp 0.3s ease-out'
            }}
            onTouchStart={handleUpnextSwipeStart}
            onTouchMove={handleUpnextSwipeMove}
            onTouchEnd={handleUpnextSwipeEnd}
            >
            <div style={{ padding: '20px', paddingBottom: '60px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <h3 style={{
                  margin: 0,
                  color: 'white',
                  fontSize: '1.2em',
                  fontWeight: '600'
                }}>
                  {queueView === 'upnext' ? 'Up Next' : queueView === 'about' ? 'About This Podcast' : 'Comments'}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {/* Up Next button */}
                  <IonButton
                    fill="clear"
                    onClick={() => setQueueView('upnext')}
                    style={{
                      '--color': queueView === 'upnext' ? '#007bff' : 'white',
                      '--ripple-color': 'rgba(255,255,255,0.3)',
                      width: '32px',
                      height: '32px',
                      backgroundColor: queueView === 'upnext' ? 'rgba(0,123,255,0.1)' : 'transparent'
                    }}
                  >
                    <IonIcon icon={list} />
                  </IonButton>

                  {/* About button */}
                  <IonButton
                    fill="clear"
                    onClick={() => setQueueView('about')}
                    style={{
                      '--color': queueView === 'about' ? '#007bff' : 'white',
                      '--ripple-color': 'rgba(255,255,255,0.3)',
                      width: '32px',
                      height: '32px',
                      backgroundColor: queueView === 'about' ? 'rgba(0,123,255,0.1)' : 'transparent'
                    }}
                  >
                    <IonIcon icon="information-circle" />
                  </IonButton>

                  {/* Comments button */}
                  <IonButton
                    fill="clear"
                    onClick={() => setQueueView('comments')}
                    style={{
                      '--color': queueView === 'comments' ? '#007bff' : 'white',
                      '--ripple-color': 'rgba(255,255,255,0.3)',
                      width: '32px',
                      height: '32px',
                      backgroundColor: queueView === 'comments' ? 'rgba(0,123,255,0.1)' : 'transparent'
                    }}
                  >
                    <IonIcon icon={chatbubbleOutline} />
                  </IonButton>

                  {/* Close button */}
                  <IonButton
                    fill="clear"
                    onClick={() => setShowQueue(false)}
                    style={{
                      '--color': 'white',
                      '--ripple-color': 'rgba(255,255,255,0.3)',
                      width: '32px',
                      height: '32px'
                    }}
                  >
                    <IonIcon icon="close" />
                  </IonButton>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '20px' }}>
                {queueView === 'upnext' ? (
                  // Upnext List View
                  <>
                    {queuePodcasts.length > 0 ? (
                      queuePodcasts.map((queuePodcast, index) => (
                      <div
                        key={queuePodcast.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px',
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s ease'
                        }}
                        onClick={() => {
                          // Switch to this podcast
                          setCurrentMedia(queuePodcast);
                          setIsPlaying(true);
                          setShowQueue(false);
                        }}
                      >
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '4px',
                          backgroundImage: `url(${getFullUrl(queuePodcast.thumbnailUrl)})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          flexShrink: 0
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
                            color: 'rgba(255,255,255,0.7)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {queuePodcast.speaker || 'Dove Ministries Africa'} • {queuePodcast.duration}
                          </p>
                        </div>
                      </div>
                    ))
                    ) : (
                      <div style={{
                        textAlign: 'center',
                        padding: '20px',
                        color: 'rgba(255,255,255,0.6)',
                        fontSize: '0.9em'
                      }}>
                        No other podcasts available
                      </div>
                    )}
                  </>
                ) : queueView === 'about' ? (
                  // Podcast Description View
                  <div style={{
                    padding: '16px',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderRadius: '8px',
                    lineHeight: '1.6'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '16px'
                    }}>
                      <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '8px',
                        backgroundImage: `url(${getFullUrl(podcast.thumbnailUrl)})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        flexShrink: 0
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{
                          margin: '0 0 4px 0',
                          fontSize: '1em',
                          fontWeight: '600',
                          color: 'white',
                          lineHeight: '1.2'
                        }}>
                          {podcast.title}
                        </h4>
                        <p style={{
                          margin: '0 0 4px 0',
                          fontSize: '0.85em',
                          color: 'rgba(255,255,255,0.8)',
                          fontWeight: '500'
                        }}>
                          {podcast.speaker || 'Dove Ministries Africa'}
                        </p>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '0.8em',
                          color: 'rgba(255,255,255,0.6)'
                        }}>
                          <span>{formatDate(podcast.publishedAt)}</span>
                          <span>•</span>
                          <span>{podcast.duration}</span>
                          <span>•</span>
                          <span>{podcast.viewCount} listens</span>
                        </div>
                      </div>
                    </div>

                    <div style={{
                      fontSize: '0.9em',
                      color: 'rgba(255,255,255,0.9)',
                      lineHeight: '1.6'
                    }}>
                      <h5 style={{
                        margin: '0 0 8px 0',
                        fontSize: '0.85em',
                        fontWeight: '600',
                        color: 'rgba(255,255,255,0.8)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Description
                      </h5>
                      <p style={{
                        margin: 0,
                        whiteSpace: 'pre-wrap'
                      }}>
                        {podcast.description || 'No description available for this podcast.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  // Comments View
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Comment Form */}
                    <form onSubmit={handleSubmitComment} style={{
                      padding: '16px',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      borderRadius: '8px'
                    }}>
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        style={{
                          width: '100%',
                          minHeight: '80px',
                          padding: '12px',
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px',
                          color: 'white',
                          fontSize: '0.9em',
                          resize: 'vertical',
                          outline: 'none'
                        }}
                        disabled={isSubmittingComment}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                        <IonButton
                          type="submit"
                          fill="clear"
                          disabled={!newComment.trim() || isSubmittingComment}
                          style={{
                            '--color': 'white',
                            '--background': 'rgba(0,123,255,0.2)',
                            fontSize: '0.85em',
                            padding: '8px 16px'
                          }}
                        >
                          {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                        </IonButton>
                      </div>
                    </form>

                    {/* Comments List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {comments.length > 0 ? (
                        comments.map((comment: any) => (
                          <div key={comment._id} style={{
                            padding: '12px',
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            borderRadius: '8px'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                              <div style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.8em',
                                fontWeight: '600',
                                color: 'white'
                              }}>
                                {(comment.user?.name || 'U')[0].toUpperCase()}
                              </div>
                              <span style={{
                                fontSize: '0.85em',
                                fontWeight: '600',
                                color: 'white'
                              }}>
                                {comment.user?.name || 'Anonymous'}
                              </span>
                              <span style={{
                                fontSize: '0.75em',
                                color: 'rgba(255,255,255,0.6)',
                                marginLeft: 'auto'
                              }}>
                                {new Date(comment.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p style={{
                              margin: 0,
                              fontSize: '0.9em',
                              color: 'rgba(255,255,255,0.9)',
                              lineHeight: '1.4'
                            }}>
                              {comment.content}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div style={{
                          textAlign: 'center',
                          padding: '20px',
                          color: 'rgba(255,255,255,0.6)',
                          fontSize: '0.9em'
                        }}>
                          No comments yet. Be the first to comment!
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
        )}

        <style>{`
          @keyframes pulse-border {
            0% {
              transform: scale(1);
              opacity: 0.6;
              filter: drop-shadow(0 0 0 rgba(255,255,255,0));
            }
            50% {
              transform: scale(1.03);
              opacity: 1;
              filter: drop-shadow(0 0 20px rgba(255,255,255,0.3));
            }
            100% {
              transform: scale(1);
              opacity: 0.6;
              filter: drop-shadow(0 0 0 rgba(255,255,255,0));
            }
          }

          @keyframes slideUp {
            0% {
              transform: translateY(100%);
              opacity: 0;
            }
            100% {
              transform: translateY(0);
              opacity: 1;
            }
          }

          @keyframes thumbnailSlide {
            0% {
              transform: scale(1) translateX(0);
              opacity: 1;
            }
            100% {
              transform: scale(0.4) translateX(150px);
              opacity: 0.9;
            }
          }

          @keyframes controlsSlide {
            0% {
              transform: translateX(0);
              opacity: 1;
            }
            100% {
              transform: translateX(-50px);
              opacity: 1;
            }
          }

          @keyframes breathe {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.02); }
          }

          @keyframes fadeInOut {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.8; }
          }

          @keyframes glow {
            0%, 100% { box-shadow: 0 12px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1); }
            50% { box-shadow: 0 16px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.2); }
          }

          .play-button {
            animation: ${isPlaying ? 'glow 2s ease-in-out infinite' : 'breathe 3s ease-in-out infinite'};
          }

          .queue-open .album-art {
            animation: thumbnailSlide 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          }

          .queue-open .controls-section {
            animation: controlsSlide 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          }

          input[type="range"]::-webkit-slider-thumb {
            appearance: none;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: white;
            cursor: pointer;
            box-shadow: 0 2px 12px rgba(0,0,0,0.4);
            border: 2px solid rgba(255,255,255,0.2);
            transition: all 0.2s ease;
          }

          input[type="range"]::-webkit-slider-thumb:hover {
            transform: scale(1.1);
            box-shadow: 0 4px 16px rgba(0,0,0,0.5);
          }

          input[type="range"]::-moz-range-thumb {
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: white;
            cursor: pointer;
            border: 2px solid rgba(255,255,255,0.2);
            box-shadow: 0 2px 12px rgba(0,0,0,0.4);
            transition: all 0.2s ease;
          }

          input[type="range"]::-moz-range-thumb:hover {
            transform: scale(1.1);
            box-shadow: 0 4px 16px rgba(0,0,0,0.5);
          }

          .control-button:hover {
            background: rgba(255,255,255,0.1) !important;
            transform: scale(1.05);
          }

          .control-button:active {
            transform: scale(0.95);
          }

          .volume-slider-container {
            transition: all 0.2s ease;
          }

          .volume-slider-container:focus-within {
            transform: scale(1.2);
            transform-origin: center;
          }

          .volume-slider-container:focus-within div {
            box-shadow: 0 0 12px rgba(255,255,255,0.6) !important;
          }

          /* Vertical slider styles */
          input[type="range"]::-webkit-slider-thumb {
            appearance: none;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: white;
            cursor: pointer;
            box-shadow: 0 2px 12px rgba(0,0,0,0.4);
            border: 2px solid rgba(255,255,255,0.2);
            transition: all 0.2s ease;
          }

          input[type="range"]::-webkit-slider-thumb:hover {
            transform: scale(1.1);
            box-shadow: 0 4px 16px rgba(0,0,0,0.5);
          }

          input[type="range"]::-moz-range-thumb {
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: white;
            cursor: pointer;
            border: 2px solid rgba(255,255,255,0.2);
            box-shadow: 0 2px 12px rgba(0,0,0,0.4);
            transition: all 0.2s ease;
          }

          input[type="range"]::-moz-range-thumb:hover {
            transform: scale(1.1);
            box-shadow: 0 4px 16px rgba(0,0,0,0.5);
          }

          /* Vertical orientation for range input */
          input[type="range"] {
            writing-mode: bt-lr;
            -webkit-appearance: slider-vertical;
          }

          /* Custom scrollbar for upnext section */
          .queue-content::-webkit-scrollbar {
            width: 4px;
          }

          .queue-content::-webkit-scrollbar-track {
            background: rgba(255,255,255,0.1);
            border-radius: 2px;
          }

          .queue-content::-webkit-scrollbar-thumb {
            background: rgba(255,255,255,0.3);
            border-radius: 2px;
          }

          .queue-content::-webkit-scrollbar-thumb:hover {
            background: rgba(255,255,255,0.5);
          }
        `}</style>
      </IonContent>
    </IonPage>
  );
};

export default FullPodcastPlayer;