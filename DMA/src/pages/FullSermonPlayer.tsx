// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  IonText
} from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';
import { usePlayer } from '../contexts/PlayerContext';
import { isPodcast } from '../utils/mediaUtils';
import VideoPlayer from '../components/VideoPlayer';
import { Capacitor } from '@capacitor/core';
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
  ellipsisHorizontal,
  list,
  alertCircle
} from 'ionicons/icons';

// Helper function to convert relative URLs to full backend URLs
const getFullUrl = (url: string) => {
  // Since /uploads is now proxied in vite.config.ts, we can use relative URLs
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
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
  }

  // Default thumbnail for external videos
  return '/assets/default-video-thumbnail.png'; // You might want to add this image
};

interface Sermon {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  duration: string;
  viewCount: string;
  videoUrl?: string;
  speaker?: string;
  isDatabaseSermon?: boolean;
}


const FullSermonPlayer: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const { currentMedia, isPlaying, setIsPlaying, setCurrentMedia, setCurrentSermon } = usePlayer();

  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('down');
  const [queueSermons, setQueueSermons] = useState<Sermon[]>([]);

  const sermon = currentMedia && !isPodcast(currentMedia) ? currentMedia : null;
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

  // Fetch queue sermons when component loads or current sermon changes
  useEffect(() => {
    const fetchQueueSermons = async () => {
      if (!sermon) return;

      try {
        const response = await fetch('/api/sermons?page=1&limit=10');
        if (response.ok) {
          const data = await response.json();
          // Filter out the current sermon and take up to 5 for the queue
          const queueItems = data.sermons
            .filter((s: Sermon) => s.id !== sermon.id)
            .slice(0, 5);
          setQueueSermons(queueItems);
        }
      } catch (error) {
        console.warn('Failed to fetch queue sermons:', error);
        // Fallback to empty array
        setQueueSermons([]);
      }
    };

    fetchQueueSermons();
  }, [sermon]);

  // Auto-play when component loads and isPlaying is true
  useEffect(() => {
    if (sermon && isPlaying) {
      // Small delay to ensure component is fully mounted
      const timer = setTimeout(() => {
        // VideoPlayer handles its own playing state
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [sermon, isPlaying]);

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

  // Scroll-based queue control
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDifference = currentScrollY - lastScrollY;

      // Determine scroll direction with threshold to avoid accidental toggles
      if (Math.abs(scrollDifference) > 10) {
        if (scrollDifference > 0) {
          // Scrolling down
          setScrollDirection('down');
          // Close queue when scrolling down
          if (showQueue) {
            setShowQueue(false);
          }
        } else {
          // Scrolling up
          setScrollDirection('up');
          // Open queue when scrolling up
          if (!showQueue) {
            setShowQueue(true);
          }
        }
        setLastScrollY(currentScrollY);
      }

      // Clear any existing timeout
      clearTimeout(scrollTimeout);

      // Set a timeout to reset scroll direction after scrolling stops
      scrollTimeout = setTimeout(() => {
        setLastScrollY(currentScrollY);
      }, 150);
    };

    // Add scroll event listener
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [lastScrollY, showQueue]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
    } else {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!sermon) {
    return (
      <IonPage>
        <IonContent fullscreen className="content-ios">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <IonText>Loading sermon...</IonText>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader translucent style={{ background: 'transparent' }}>
        <IonToolbar style={{ '--background': 'transparent' }}>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen scrollY={false} style={{ '--background': 'transparent' }}>
        {/* Background Image with Blur */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${getThumbnailUrl(sermon)})`,
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
          height: showQueue ? '60vh' : '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '20px',
          color: 'white',
          transition: 'height 0.3s ease'
        }}>
          {/* Top Section - Sermon Info */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', paddingTop: '20px' }}>
            {/* Video Player - Full Screen */}
            <div style={{
              width: '100%',
              height: '100%',
              position: 'relative',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)'
            }}>
              console.log('FullSermonPlayer - playing video url:', getFullUrl(sermon.videoUrl || sermon.streamUrl || ''));
              <VideoPlayer
                url={getFullUrl(sermon.videoUrl || sermon.streamUrl || '')}
                title={sermon.title}
                playing={isPlaying}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                fullScreen={true}
              />
            </div>

            {/* Controls Row when Queue is Open */}
            {showQueue && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', marginTop: '20px' }}>
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
                  onClick={() => setIsLiked(!isLiked)}
                  className="control-button"
                  style={{
                    '--color': isLiked ? '#ff4757' : 'white',
                    '--ripple-color': 'rgba(255,71,87,0.3)',
                    '--border-radius': '26px',
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%'
                  }}
                >
                  <IonIcon icon={isLiked ? heart : heartOutline} style={{ fontSize: '1.5em' }} />
                </IonButton>

                <IonButton
                  fill="clear"
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
                  <IonIcon icon={share} style={{ fontSize: '1.5em' }} />
                </IonButton>

                <div className="volume-slider-container" style={{
                  position: 'relative',
                  width: '90px',
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
              </div>
            )}

            {/* Sermon Details */}
            <div style={{ textAlign: 'center', maxWidth: '320px', padding: '0 20px' }}>
              <h1 style={{
                fontSize: showQueue ? '1.5em' : '1.9em',
                fontWeight: '700',
                margin: '0 0 10px 0',
                lineHeight: '1.1',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                letterSpacing: '-0.02em'
              }}>
                {sermon.title}
              </h1>

              {/* Hide these details when queue is open */}
              {!showQueue && (
                <>
                  <p style={{
                    fontSize: '1.1em',
                    opacity: 0.85,
                    margin: '0 0 16px 0',
                    fontWeight: '500',
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                  }}>
                    {sermon.speaker || 'Dove Ministries Africa'}
                  </p>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '16px',
                    fontSize: '0.9em',
                    opacity: 0.75,
                    fontWeight: '500'
                  }}>
                    <span>{formatDate(sermon.publishedAt)}</span>
                    <span style={{ opacity: 0.5 }}>•</span>
                    <span>{sermon.viewCount} views</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Bottom Section - Controls */}
          <div style={{
            paddingBottom: showQueue ? '220px' : '160px',
            paddingTop: '10px'
          }}>
            {/* Main Controls */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '24px',
              marginBottom: '28px'
            }}>
              <IonButton
                fill="clear"
                className="control-button"
                style={{
                  '--color': 'white',
                  '--ripple-color': 'rgba(255,255,255,0.3)',
                  '--border-radius': '24px',
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%'
                }}
              >
                <IonIcon icon={playBack} style={{ fontSize: '1.4em' }} />
              </IonButton>

              <div style={{ position: 'relative' }}>
                <IonButton
                  fill="solid"
                  onClick={handlePlayPause}
                  className="play-button"
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    '--background': 'white',
                    '--color': 'black',
                    '--ripple-color': 'rgba(0,0,0,0.2)',
                    '--border-radius': '36px',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.5), 0 0 0 2px rgba(255,255,255,0.2)',
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
                  }}
                >
                  <IonIcon icon={isPlaying ? pause : play} style={{ fontSize: '1.8em' }} />
                </IonButton>
              </div>

              <IonButton
                fill="clear"
                className="control-button"
                style={{
                  '--color': 'white',
                  '--ripple-color': 'rgba(255,255,255,0.3)',
                  '--border-radius': '24px',
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%'
                }}
              >
                <IonIcon icon={playForward} style={{ fontSize: '1.4em' }} />
              </IonButton>
            </div>

            {/* Secondary Controls - Hidden when queue is open */}
            {!showQueue && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '20px',
                padding: '0 20px',
                marginBottom: '20px'
              }}>
                <IonButton
                  fill="clear"
                  className="control-button"
                  onClick={() => setShowQueue(!showQueue)}
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
                  onClick={() => setIsLiked(!isLiked)}
                  className="control-button"
                  style={{
                    '--color': isLiked ? '#ff4757' : 'white',
                    '--ripple-color': 'rgba(255,71,87,0.3)',
                    '--border-radius': '26px',
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%'
                  }}
                >
                  <IonIcon icon={isLiked ? heart : heartOutline} style={{ fontSize: '1.5em' }} />
                </IonButton>

                <IonButton
                  fill="clear"
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
                  <IonIcon icon={share} style={{ fontSize: '1.5em' }} />
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
                  width: '90px',
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

            {/* Compact description - Hidden when queue is open */}
            {!showQueue && (
              <div style={{
                padding: '0 24px',
                marginBottom: '16px',
                maxHeight: '80px',
                overflow: 'hidden'
              }}>
                <p style={{
                  fontSize: '0.9em',
                  lineHeight: '1.4',
                  opacity: 0.8,
                  margin: 0,
                  textAlign: 'center',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {sermon.description}
                </p>
              </div>
            )}
          </div>
        </div>

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
                height: '40vh',
                backgroundImage: `url(${getThumbnailUrl(sermon)})`,
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
                height: '40vh',
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
            <div style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              height: '40vh',
              backdropFilter: 'blur(20px)',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              zIndex: 1000,
              overflowY: 'auto',
              animation: 'slideUp 0.3s ease-out'
            }}>
            <div style={{ padding: '20px', paddingBottom: '40px' }}>
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
                  Up Next
                </h3>
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {queueSermons.length > 0 ? (
                  queueSermons.map((queueSermon, index) => (
                    <div
                      key={queueSermon.id}
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
                        // Switch to this sermon
                        setCurrentMedia(queueSermon);
                        setIsPlaying(true);
                        setShowQueue(false);
                      }}
                    >
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '4px',
                        backgroundImage: `url(${getThumbnailUrl(queueSermon)})`,
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
                          {queueSermon.title}
                        </h4>
                        <p style={{
                          margin: 0,
                          fontSize: '0.8em',
                          color: 'rgba(255,255,255,0.7)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {queueSermon.speaker || 'Dove Ministries Africa'} • {queueSermon.duration}
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
                    No other sermons available
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
        )}

        <style>{`
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

          @keyframes breathe {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.02); }
          }

          @keyframes glow {
            0%, 100% { box-shadow: 0 12px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1); }
            50% { box-shadow: 0 16px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.2); }
          }

          .play-button {
            animation: ${isPlaying ? 'glow 2s ease-in-out infinite' : 'breathe 3s ease-in-out infinite'};
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
        `}</style>
      </IonContent>
    </IonPage>
  );
};

export default FullSermonPlayer;