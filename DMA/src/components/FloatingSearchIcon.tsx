import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { IonIcon, IonBadge, IonPopover, IonButton, IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonAvatar, IonText, IonChip, IonSpinner, IonSearchbar } from '@ionic/react';
import { search, radio, playCircle, calendar, book, people, informationCircle, arrowBack, close, personCircleOutline } from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import { AuthContext } from '../App';
import { YouTubeVideo } from '../services/youtubeService';
import { usePlayer } from '../contexts/PlayerContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useSettings } from '../contexts/SettingsContext';
import apiService, { BACKEND_BASE_URL } from '../services/api';
import './FloatingSearchIcon.css';

interface SearchResult {
  id: string;
  type: 'sermon' | 'podcast' | 'event' | 'devotion' | 'ministry';
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  date?: string;
  url: string;
  score: number;
}

const FloatingSearchIcon: React.FC = () => {
  const [liveStreams, setLiveStreams] = useState<YouTubeVideo[]>([]);
  const [liveBroadcasts, setLiveBroadcasts] = useState<any[]>([]);
  const [isCheckingLive, setIsCheckingLive] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
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

  // Debounced search function
  const performSearch = useCallback(async (query: string, filter: string = 'all') => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.search(query.trim());
      let results = response.results || [];

      // Apply filter if not 'all'
      if (filter !== 'all') {
        results = results.filter((result: SearchResult) => result.type === filter);
      }

      setSearchResults(results);
      setHasSearched(true);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
      setHasSearched(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    const debounceDelay = searchQuery.trim().length <= 2 ? 50 : 150; // Faster for short queries
    const debounceTimer = setTimeout(() => {
      performSearch(searchQuery, selectedFilter);
    }, debounceDelay);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, selectedFilter, performSearch]);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sermon': return playCircle;
      case 'podcast': return radio;
      case 'event': return calendar;
      case 'devotion': return book;
      case 'ministry': return people;
      default: return search;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'sermon': return 'primary';
      case 'podcast': return 'secondary';
      case 'event': return 'tertiary';
      case 'devotion': return 'success';
      case 'ministry': return 'warning';
      default: return 'medium';
    }
  };

  const filters = [
    { value: 'all', label: 'All' },
    { value: 'sermon', label: 'Sermons' },
    { value: 'podcast', label: 'Podcasts' },
    { value: 'event', label: 'Events' },
    { value: 'devotion', label: 'Devotions' },
    { value: 'ministry', label: 'Ministries' }
  ];

  const handleSearchClick = () => {
    setShowSearchModal(true);
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
              right: 120,
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
              border: '1px solid rgba(255,255,255,0.2)',
              transition: 'transform 0.2s ease',
              overflow: 'hidden'
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
            <IonIcon
              icon={radio}
              style={{
                color: 'white',
                fontSize: '20px',
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
            history.push('/profile');
          }}
          style={{
            position: 'fixed',
            top: 'calc(var(--ion-safe-area-top) + 4px)',
            right: 16,
            width: 44,
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
              onClick={(e) => {
                e.stopPropagation();
                history.push('/signin');
              }}
              style={{
                fontSize: '11px',
                fontWeight: '600',
                color: '#fff',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                padding: '4px 10px',
                borderRadius: '8px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 6px rgba(99,102,241,0.3)',
                letterSpacing: '0.3px',
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
            right: 70,
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
            right: 124,
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


      {/* Search Modal - White Background for Light Mode, Blur for Dark Mode */}
      <IonModal
        isOpen={showSearchModal}
        onDidDismiss={() => setShowSearchModal(false)}
        className={isDarkMode ? 'search-modal dark-theme' : 'search-modal'}
        style={{
          '--width': '100%',
          '--max-width': '100%',
          '--height': '100%',
          '--max-height': '100%',
          '--border-radius': '0',
          '--margin': '0'
        }}
      >
        <IonHeader className="search-header">
          <IonToolbar className="search-toolbar">
            <IonButton
              fill="clear"
              slot="start"
              onClick={() => setShowSearchModal(false)}
              style={{ '--color': 'var(--ion-color-primary)' }}
            >
              <IonIcon icon={close} />
            </IonButton>
            
            {/* Custom Search Bar in Header with X button inside */}
            <div className="custom-searchbar" style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              background: 'var(--ion-color-step-50, #f5f5f7)',
              borderRadius: '12px',
              padding: '0 12px',
              height: '40px',
              marginRight: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              border: '1px solid var(--ion-color-step-100, #e5e5e5)',
              transition: 'all 0.3s ease'
            }}>
              <IonIcon 
                icon={search} 
                style={{ 
                  color: 'var(--ion-color-primary, #007aff)', 
                  fontSize: '18px',
                  flexShrink: 0
                }} 
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search..."
                autoFocus
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'transparent',
                  padding: '8px',
                  fontSize: '15px',
                  color: 'var(--ion-text-color, #1c1c1e)',
                  outline: 'none',
                  fontFamily: 'inherit',
                  minWidth: '0'
                }}
              />
              {searchQuery && (
                <IonIcon 
                  icon={close} 
                  style={{ 
                    color: 'var(--ion-color-medium, #8e8e93)', 
                    fontSize: '16px',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    setHasSearched(false);
                  }}
                />
              )}
            </div>
          </IonToolbar>
        </IonHeader>

        <IonContent className="search-content">
          <style>{`
            /* Full page modal on all screen sizes */
            .search-modal {
              --width: 100% !important;
              --max-width: 100% !important;
              --height: 100% !important;
              --max-height: 100% !important;
              --border-radius: 0 !important;
              margin: 0 !important;
            }
            @media (min-width: 768px) {
              .search-modal {
                --width: 100% !important;
                --max-width: 100% !important;
              }
            }
            @media (prefers-color-scheme: light) {
              /* Admin-style soft gradient background for search */
              .search-modal, .search-header, .search-toolbar, .search-content {
                background: linear-gradient(180deg, #ffffff 0%, #f3f7ff 100%) !important;
                --background: linear-gradient(180deg, #ffffff 0%, #f3f7ff 100%) !important;
                box-shadow: 0 12px 48px rgba(15, 23, 42, 0.06);
              }
              .search-header {
                border-bottom: 1px solid var(--ion-color-step-100, #e5e5e5);
              }
              .custom-searchbar {
                background: var(--ion-color-step-50, #f5f5f7) !important;
                border: 1px solid var(--ion-color-step-100, #e5e5e5) !important;
                box-shadow: 0 2px 8px rgba(0,0,0,0.04) !important;
              }
            }
            @media (prefers-color-scheme: dark) {
              /* Dark semi-opaque panel for admin look */
              .search-modal, .search-header, .search-toolbar, .search-content {
                background: rgba(16,18,20,0.64) !important;
                --background: rgba(16,18,20,0.64) !important;
                backdrop-filter: blur(18px) saturate(160%) !important;
                -webkit-backdrop-filter: blur(18px) saturate(160%) !important;
                border: 1px solid rgba(255,255,255,0.04);
                box-shadow: 0 20px 60px rgba(0,0,0,0.6);
              }
              .search-toolbar {
                background: transparent !important;
                --background: transparent !important;
              }
              .custom-searchbar {
                background: rgba(30, 30, 30, 0.6) !important;
                backdrop-filter: blur(16px) saturate(180%) !important;
                -webkit-backdrop-filter: blur(16px) saturate(180%) !important;
                border: 1px solid rgba(255, 255, 255, 0.1) !important;
                box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3) !important;
              }
            }
            /* Support app-controlled dark theme using data-theme="dark" */
            [data-theme="dark"] .search-modal,
            [data-theme="dark"] .search-header,
            [data-theme="dark"] .search-toolbar,
            [data-theme="dark"] .search-content {
              background: rgba(16,18,20,0.64) !important;
              --background: rgba(16,18,20,0.64) !important;
              backdrop-filter: blur(18px) saturate(160%) !important;
              -webkit-backdrop-filter: blur(18px) saturate(160%) !important;
              border: 1px solid rgba(255,255,255,0.04);
              box-shadow: 0 20px 60px rgba(0,0,0,0.6);
            }
            [data-theme="dark"] .search-toolbar {
              background: transparent !important;
              --background: transparent !important;
            }
            [data-theme="dark"] .custom-searchbar {
              background: rgba(30, 30, 30, 0.6) !important;
              backdrop-filter: blur(16px) saturate(180%) !important;
              -webkit-backdrop-filter: blur(16px) saturate(180%) !important;
              border: 1px solid rgba(255, 255, 255, 0.1) !important;
              box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3) !important;
            }
            /* Fallback: when modal gets a dark-theme class (added via cssClass) */
            .search-modal.dark-theme,
            .search-modal.dark-theme .search-header,
            .search-modal.dark-theme .search-toolbar,
            .search-modal.dark-theme .search-content {
              background: rgba(16,18,20,0.64) !important;
              --background: rgba(16,18,20,0.64) !important;
              backdrop-filter: blur(18px) saturate(160%) !important;
              -webkit-backdrop-filter: blur(18px) saturate(160%) !important;
              border: 1px solid rgba(255,255,255,0.04);
              box-shadow: 0 20px 60px rgba(0,0,0,0.6);
            }
            .search-modal.dark-theme .search-toolbar {
              background: transparent !important;
              --background: transparent !important;
            }
            .search-modal.dark-theme .custom-searchbar {
              background: rgba(30, 30, 30, 0.6) !important;
              backdrop-filter: blur(16px) saturate(180%) !important;
              -webkit-backdrop-filter: blur(16px) saturate(180%) !important;
              border: 1px solid rgba(255, 255, 255, 0.1) !important;
              box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3) !important;
            }
            /* Use Ionic CSS variables for colors to adapt to both modes */
            .filter-label, .loading-text, .results-count, .no-results-title, .no-results-text, .result-card-title, .result-card-subtitle, .result-card-description {
              color: var(--ion-text-color, #1c1c1e) !important;
            }
            .filter-chips, .loading-spinner, .no-results {
              color: var(--ion-text-color, #1c1c1e);
            }
            /* Full frosted backdrop for the modal content */
            .search-content {
              position: relative;
              overflow: hidden;
            }
            .search-content::before {
              content: '';
              position: absolute;
              inset: 0;
              z-index: 0;
              pointer-events: none;
              backdrop-filter: blur(28px) saturate(160%);
              -webkit-backdrop-filter: blur(28px) saturate(160%);
              background: rgba(255,255,255,0.18);
            }
            /* Dark mode frosted backdrop */
            @media (prefers-color-scheme: dark) {
              .search-content::before {
                background: rgba(10,12,14,0.56);
                backdrop-filter: blur(28px) saturate(140%);
                -webkit-backdrop-filter: blur(28px) saturate(140%);
              }
            }
            [data-theme="dark"] .search-content::before,
            .search-modal.dark-theme .search-content::before {
              background: rgba(10,12,14,0.56);
              backdrop-filter: blur(28px) saturate(140%);
              -webkit-backdrop-filter: blur(28px) saturate(140%);
            }
            /* Ensure content sits above the frosted layer */
            .yt-search-shell, .yt-results-list, .yt-sidebar, .yt-controls { z-index: 1; position: relative; }
          `}</style>
          <div style={{ padding: '16px' }}>
            <div className="yt-search-shell">
              <div>
                <div className="yt-controls">
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 800 }}>Search</div>
                    <div style={{ color: 'var(--ion-color-medium)' }}>{searchResults.length} results</div>
                  </div>
                  <div className="yt-filters">
                    <select value={selectedFilter} onChange={(e) => handleFilterChange(e.target.value)} style={{ padding: '6px 8px', borderRadius: 6 }}>
                      {filters.map(f => (<option key={f.value} value={f.value}>{f.label}</option>))}
                    </select>
                    <IonButton fill="clear">Sort</IonButton>
                  </div>
                </div>

                {/* Main results list */}
                {isLoading && (
                  <div className="loading-spinner" style={{ textAlign: 'center', padding: '40px' }}>
                    <IonSpinner name="crescent" color="primary" />
                    <IonText className="loading-text" style={{ display: 'block', marginTop: '16px', color: 'var(--ion-text-color)' }}>
                      Searching...
                    </IonText>
                  </div>
                )}

                {!isLoading && (
                  <div className="yt-results-list">
                    {hasSearched && searchResults.length === 0 && (
                      <div className="no-results" style={{ textAlign: 'center', padding: '40px 20px' }}>
                        <IonIcon icon={search} size="large" style={{ marginBottom: '16px', color: 'var(--ion-color-medium)' }} />
                        <div className="no-results-title" style={{ fontWeight: '600', marginBottom: '8px', color: 'var(--ion-text-color)' }}>No results found</div>
                        <div className="no-results-text" style={{ fontSize: '0.9em', color: 'var(--ion-color-medium)' }}>Try different keywords or check your spelling</div>
                      </div>
                    )}

                    {hasSearched && searchResults.length > 0 && searchResults.map((result, i) => (
                      <div key={`${result.type}-${result.id}-${i}`} className="yt-card" onClick={() => { setShowSearchModal(false); history.push(result.url); }}>
                        {result.image ? (
                          <img className="yt-thumb" src={result.image.startsWith('/uploads') ? `${BACKEND_BASE_URL}${result.image}` : result.image} alt={result.title} />
                        ) : (
                          <div className="yt-thumb" style={{ display:'flex', alignItems:'center', justifyContent:'center', background:'var(--ion-color-step-100, rgba(0,0,0,0.04))' }}>
                            <IonIcon icon={getTypeIcon(result.type)} />
                          </div>
                        )}
                        <div className="yt-meta">
                          <div className="yt-title">{result.title}</div>
                          <div className="yt-sub">{result.subtitle || (result.type.charAt(0).toUpperCase() + result.type.slice(1))} • {result.date ? new Date(result.date).toLocaleDateString() : ''}</div>
                          {result.description && <div className="yt-desc">{result.description}</div>}
                        </div>
                        <div className="yt-right">
                          <div style={{ fontSize:12, color:'var(--ion-color-medium)' }}>{result.score ? Math.round(result.score * 100) + '%' : ''}</div>
                          <IonButton size="small" fill="clear">Open</IonButton>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!hasSearched && !isLoading && (
                  <div style={{ textAlign:'center', padding: '80px 20px' }}>
                    <div style={{ fontSize:20, fontWeight:700 }}>Search the library</div>
                    <div style={{ marginTop:8, color: 'var(--ion-color-medium)' }}>Find sermons, events, devotions, podcasts and more</div>
                  </div>
                )}
              </div>

              {/* Right: suggestions / trending */}
              <aside className="yt-sidebar">
                <div style={{ fontWeight:700 }}>Recommended</div>
                <div className="yt-suggestion">Trending Now</div>
                <div className="yt-suggestion">Popular Sermons</div>
                <div className="yt-suggestion">Suggested Ministries</div>
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontWeight:700 }}>Channels</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:8 }}>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}><IonAvatar><img src="/dove.png" alt="Dove"/></IonAvatar><div style={{ fontSize:14 }}>Dove Ministries</div></div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </IonContent>
      </IonModal>
    </>
  );
};

export default FloatingSearchIcon;