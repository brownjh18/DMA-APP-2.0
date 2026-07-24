import React, { useState, useEffect, useRef, useContext } from 'react';
import { IonIcon, IonBadge, IonButton, IonAvatar } from '@ionic/react';
import { search, radio, playCircle, calendar, book, people } from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import { AuthContext } from '../App';
import { YouTubeVideo } from '../services/youtubeService';
import { usePlayer } from '../contexts/PlayerContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useSettings } from '../contexts/SettingsContext';
import apiService, { BACKEND_BASE_URL } from '../services/api';
import './FloatingSearchIcon.css';

const FloatingSearchIcon: React.FC = () => {
  const [liveStreams, setLiveStreams] = useState<YouTubeVideo[]>([]);
  const [liveBroadcasts, setLiveBroadcasts] = useState<any[]>([]);
  const [isCheckingLive, setIsCheckingLive] = useState(false);
  const history = useHistory();
  const location = useLocation();
  const { setCurrentMedia, setIsPlaying, setCurrentSermon, isPlaying, currentSermon, currentMedia } = usePlayer();
  const { unreadCount } = useNotifications();
  const { isDarkMode } = useSettings();
  const { user } = useContext(AuthContext);
  const prevUnreadCount = useRef(unreadCount);
  const [isSwinging, setIsSwinging] = useState(false);

  // Check for live broadcasts and YouTube live streams periodically with rate limiting and caching
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;
    const baseDelay = 30000; // 30 seconds base delay
    const maxDelay = 300000; // 5 minutes max delay
    let lastCheckTime = 0;
    let cachedRadioBroadcasts: any[] = [];
    let cachedYouTubeStreams: YouTubeVideo[] = [];
    const cacheDuration = 300000; // 5 minutes cache

    const checkLiveContent = async (force = false) => {
      const now = Date.now();

      // Use cached results if available and not expired, unless forced
      if (!force && (cachedRadioBroadcasts.length > 0 || cachedYouTubeStreams.length > 0) && (now - lastCheckTime) < cacheDuration) {
        setLiveBroadcasts(cachedRadioBroadcasts);
        setLiveStreams(cachedYouTubeStreams);
        return;
      }

      try {
        setIsCheckingLive(true);

        // Check radio broadcasts
        let radioBroadcasts: any[] = [];
        try {
          const response = await apiService.getLiveBroadcasts({ status: 'live', limit: 1 });
          radioBroadcasts = response.broadcasts || [];
        } catch (radioError) {
          console.error('Error checking radio broadcasts:', radioError);
          radioBroadcasts = cachedRadioBroadcasts; // Keep cached on error
        }

        // YouTube live streams removed - only checking radio broadcasts

        setLiveBroadcasts(radioBroadcasts);
        setLiveStreams([]); // YouTube streams removed
        cachedRadioBroadcasts = radioBroadcasts;
        cachedYouTubeStreams = []; // YouTube streams removed
        lastCheckTime = now;
        retryCount = 0; // Reset retry count on success
      } catch (error: any) {
        console.error('Error checking live content:', error);

        // Handle rate limiting (429) with exponential backoff
        if (error.message?.includes('429') || error.status === 429) {
          retryCount++;
          if (retryCount <= maxRetries) {
            const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
            console.log(`Rate limited. Retrying in ${delay / 1000} seconds...`);
            setTimeout(() => checkLiveContent(true), delay); // Force retry
            return;
          }
        }

        // On error, keep existing cached results if available
        if (cachedRadioBroadcasts.length === 0) {
          setLiveBroadcasts([]);
        }
        if (cachedYouTubeStreams.length === 0) {
          setLiveStreams([]);
        }
      } finally {
        setIsCheckingLive(false);
      }
    };

    // Check immediately and then every 10 minutes (reduced frequency)
    checkLiveContent();
    const interval = setInterval(() => checkLiveContent(), 600000); // 10 minutes

    // Listen for live broadcast updates
    const handleLiveBroadcastUpdate = () => {
      checkLiveContent();
    };

    window.addEventListener('liveBroadcastUpdate', handleLiveBroadcastUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('liveBroadcastUpdate', handleLiveBroadcastUpdate);
    };
  }, []);

  // Trigger bell swing when new notifications arrive
  useEffect(() => {
    if (unreadCount > prevUnreadCount.current) {
      setIsSwinging(true);
      const timer = setTimeout(() => setIsSwinging(false), 1600);
      prevUnreadCount.current = unreadCount;
      return () => clearTimeout(timer);
    }
    prevUnreadCount.current = unreadCount;
  }, [unreadCount]);

  const handleSearchClick = () => {
    history.push('/search');
  };

  const handleLiveBroadcastClick = () => {
    // Prioritize YouTube live streams over radio broadcasts
    if (liveStreams.length > 0) {
      // Navigate to video player and play the YouTube live stream
      const liveStream = liveStreams[0]; // Get the first live stream
      setCurrentSermon({
        id: liveStream.id,
        title: liveStream.title,
        description: liveStream.description || '',
        thumbnailUrl: liveStream.thumbnailUrl || '/bible.JPG',
        publishedAt: liveStream.publishedAt || '',
        duration: liveStream.duration || 'LIVE',
        viewCount: liveStream.viewCount?.toString() || '0'
      });
      setIsPlaying(true);
      history.push('/tab2'); // Navigate to sermons tab where video player is
    } else if (liveBroadcasts.length > 0) {
      // Navigate to podcast player and play the live radio broadcast
      const liveBroadcast = liveBroadcasts[0]; // Get the first live broadcast
      // Convert live broadcast to Podcast format for the player
      const podcast = {
        id: liveBroadcast.id,
        title: liveBroadcast.title,
        description: liveBroadcast.description || '',
        thumbnailUrl: liveBroadcast.thumbnailUrl || '/bible.JPG',
        publishedAt: liveBroadcast.broadcastStartTime || '',
        duration: 'LIVE',
        viewCount: '0',
        audioUrl: liveBroadcast.streamUrl || '',
        speaker: liveBroadcast.speaker || 'Dove Ministries Africa',
        isLive: true
      };
      setCurrentMedia(podcast);
      setIsPlaying(true);
      history.push('/podcast-player'); // Navigate to podcast player
    }
  };

  // Hide floating icons on search page
  if (location.pathname === '/search') {
    return null;
  }

  return (
    <>
      <div className="floating-search-container">
        {/* Live Broadcast Button - only show when there's an active live broadcast or YouTube live stream, and not on the go live page */}
        {(liveBroadcasts.length > 0 || liveStreams.length > 0) && location.pathname !== '/admin/live' && (
          <div
            className={`floating-live-button ${(liveBroadcasts.length > 0 || liveStreams.length > 0) ? 'blinking' : ''}`}
            onClick={handleLiveBroadcastClick}
            style={{
              position: 'absolute',
              top: 'calc(var(--ion-safe-area-top) - 18px)',
              right: 'auto',
              left: 124, // Position to the left of the search button (124px from right edge)
              width: 45,
              height: 45,
              borderRadius: 25,
              backgroundColor: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 8px 32px rgba(239, 68, 68, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
              zIndex: 999,
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '2px solid rgba(255,255,255,0.3)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              overflow: 'hidden',
              // Enhanced glow effect for live broadcast
              animation: 'liveBroadcastPulse 2s infinite',
            }}
            onMouseEnter={(e) => {
              const target = e.currentTarget;
              target.style.transform = 'scale(1.05)';
              target.style.boxShadow = '0 12px 40px rgba(239, 68, 68, 0.5), inset 0 1px 0 rgba(255,255,255,0.3)';
            }}
            onMouseLeave={(e) => {
              const target = e.currentTarget;
              target.style.transform = 'scale(1)';
              target.style.boxShadow = '0 8px 32px rgba(239, 68, 68, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)';
            }}
          >
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 50%, rgba(255, 255, 255, 0.1) 100%)',
              pointerEvents: 'none',
              borderRadius: '25px'
            }} />
            <div style={{
              position: 'absolute',
              top: '2px',
              right: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              color: '#ef4444',
              fontSize: '10px',
              fontWeight: 'bold',
              padding: '2px 6px',
              borderRadius: '8px',
              zIndex: 2,
              boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}>
              LIVE
            </div>
            <IonIcon
              icon={radio}
              style={{
                color: 'white',
                fontSize: '22px', // Slightly larger icon to accommodate LIVE badge
                flexShrink: 0,
                position: 'relative',
                zIndex: 1
              }}
            />
          </div>
        )}

        {/* Profile Photo Icon */}
        <div
          className="floating-profile-button"
          onClick={(e) => {
            e.stopPropagation();
            if (user?.profilePicture) {
              history.push('/profile');
            } else {
              history.push('/signin');
            }
          }}
          style={{
            position: 'fixed',
            top: 'calc(var(--ion-safe-area-top) + 4px)',
            right: 16,
            width: 56,
            height: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10001,
            transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
            overflow: 'visible',
          }}
        >
          {user?.profilePicture ? (
            <img
              src={user.profilePicture.startsWith('data:') || user.profilePicture.startsWith('http')
                ? user.profilePicture
                : `${BACKEND_BASE_URL}${user.profilePicture}`}
              alt="profile"
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid ' + (isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.15)'),
                boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
              }}
            />
          ) : (
            <div
              style={{
                fontSize: '12px',
                fontWeight: '700',
                color: '#fff',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                width: '100%',
                height: '36px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
                letterSpacing: '0.3px',
                border: '1px solid rgba(255,255,255,0.15)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.94)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(99,102,241,0.3)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.2)';
              }}
            >
              Sign In
            </div>
          )}
        </div>

        {/* Notification Bell Button - Minimal Redesign */}
        <div
          className="floating-notification-button"
          onClick={(e) => {
            e.stopPropagation();
            if (location.pathname === '/notifications') {
              history.goBack();
            } else {
              history.push('/notifications');
            }
          }}
          style={{
            position: 'fixed',
            top: 'calc(var(--ion-safe-area-top) + 4px)',
            right: 76,
            width: 44,
            height: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10000,
            transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
            overflow: 'visible',
          }}
        >
          {/* Custom SVG Bell Icon */}
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={isSwinging ? 'notification-bell-svg' : ''}
            style={{
              transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))',
            }}
          >
            <path
              d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
              stroke={unreadCount > 0
                ? (isDarkMode ? '#7EB1FF' : '#3478F6')
                : (isDarkMode ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.65)')}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transition: 'stroke 0.3s ease' }}
            />
            <path
              d="M13.73 21a2 2 0 0 1-3.46 0"
              stroke={unreadCount > 0
                ? (isDarkMode ? '#7EB1FF' : '#3478F6')
                : (isDarkMode ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.65)')}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transition: 'stroke 0.3s ease' }}
            />
            {unreadCount > 0 && (
              <circle
                cx="17"
                cy="4"
                r="3.5"
                fill="#FF3B30"
                className="notification-dot-pulse"
              />
            )}
          </svg>
          {unreadCount > 0 && (
            <span
              className="notification-count"
              style={{
                position: 'absolute',
                top: 0,
                right: -2,
                minWidth: 18,
                height: 18,
                borderRadius: 9,
                background: '#FF3B30',
                color: '#fff',
                fontSize: 11,
                fontWeight: 700,
                fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
                boxShadow: '0 1px 4px rgba(255, 59, 48, 0.4)',
                lineHeight: 1,
                border: '2px solid ' + (isDarkMode ? 'rgba(0,0,0,0.9)' : '#fff'),
              }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>

        {/* Search Button */}
        <div
          className="floating-search-button"
          onClick={(e) => {
            e.stopPropagation();
            handleSearchClick();
          }}
          style={{
            position: 'fixed',
            top: 'calc(var(--ion-safe-area-top) + 4px)',
            right: 130,
            width: 44,
            height: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 999,
            transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))',
            }}
          >
            <circle
              cx="11"
              cy="11"
              r="7"
              stroke={isDarkMode ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.65)'}
              strokeWidth="2"
              strokeLinecap="round"
              style={{ transition: 'stroke 0.3s ease' }}
            />
            <line
              x1="16.5"
              y1="16.5"
              x2="21"
              y2="21"
              stroke={isDarkMode ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.65)'}
              strokeWidth="2"
              strokeLinecap="round"
              style={{ transition: 'stroke 0.3s ease' }}
            />
</svg>
        </div>
      </div>
    </>
  );
};

export default FloatingSearchIcon;