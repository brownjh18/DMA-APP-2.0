import React, { useState, useEffect } from 'react';
import { IonIcon, IonFab, IonFabButton, IonInput, IonButton, IonList, IonItem, IonLabel, IonBadge, IonPopover } from '@ionic/react';
import { search, close, home, playCircle, book, calendar, people, heart, wallet, download, bookmark, time, documentText, person, settings, informationCircle, radio, notifications as notificationsIcon } from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import { YouTubeVideo } from '../services/youtubeService';
import { usePlayer } from '../contexts/PlayerContext';
import { useNotifications, NotificationItem } from '../contexts/NotificationContext';
import apiService from '../services/api';
import NotificationPopover from './NotificationPopover';
// import { searchContent, getSearchSuggestions, SearchResult } from '../services/searchService';
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [liveStreams, setLiveStreams] = useState<YouTubeVideo[]>([]);
  const [liveBroadcasts, setLiveBroadcasts] = useState<any[]>([]);
  const [isCheckingLive, setIsCheckingLive] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationEvent, setNotificationEvent] = useState<MouseEvent | undefined>();
  const history = useHistory();
  const location = useLocation();
  const { setCurrentMedia, setIsPlaying, setCurrentSermon, isPlaying, currentSermon, currentMedia } = usePlayer();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification, clearAllNotifications } = useNotifications();

  // App-specific suggestions that map to actual pages and content
  const appSuggestions = [
    { text: 'Home', route: '/tab1', description: 'Main dashboard and daily devotion' },
    { text: 'Sermons', route: '/tab2', description: 'Watch and listen to sermons' },
    { text: 'Devotions', route: '/tab3', description: 'Daily devotionals and readings' },
    { text: 'Events', route: '/events', description: 'Upcoming church events and programs' },
    { text: 'Ministries', route: '/ministries', description: 'Church ministries and departments' },
    { text: 'Prayer Requests', route: '/prayer', description: 'Submit and view prayer requests' },
    { text: 'Giving', route: '/giving', description: 'Online giving and donations' },
    { text: 'Saved', route: '/saved', description: 'Saved sermons and content' },
    { text: 'My Favorites', route: '/favorites', description: 'Your saved favorite content' },
    { text: 'Watch History', route: '/watch-history', description: 'Recently watched sermons' },
    { text: 'Reading History', route: '/reading-history', description: 'Recently read devotions' },
    { text: 'Profile', route: '/profile', description: 'Your account and preferences' },
    { text: 'Settings', route: '/settings', description: 'App settings and preferences' },
    { text: 'About DMA', route: '/tab5', description: 'About Dove Ministries Africa' }
  ];

  // Extract just the text for filtering
  const allSuggestions = appSuggestions.map(item => item.text);

  useEffect(() => {
    // Show app-specific suggestions
    if (searchQuery.trim().length === 0) {
      // Show popular/default suggestions when no query
      setSuggestions(['Home', 'Sermons', 'Devotions', 'Events', 'Ministries']);
      setShowSuggestions(true);
    } else {
      const filtered = allSuggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5); // Limit to 5 suggestions
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    }
  }, [searchQuery]);


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

  const performSearch = async (query: string) => {
    setIsLoading(true);
    try {
      let searchResults: SearchResult[] = [];

      if (query.trim()) {
        // Call backend search API
        const response = await apiService.search(query.trim());
        searchResults = response.results || [];
      } else {
        // If no query, show app pages as results
        searchResults = appSuggestions.map((page, index) => ({
          id: `page-${index}`,
          type: 'sermon' as const,
          title: page.text,
          subtitle: 'App Page',
          description: page.description,
          url: page.route,
          score: 1
        }));
      }

      setSearchResults(searchResults);
      setShowResults(true);
      setShowSuggestions(false);
      setIsLoading(false);

    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
      setShowResults(true);
      setShowSuggestions(false);
      setIsLoading(false);
    }
  };

  const handleSearchClick = () => {
    if (isExpanded) {
      // If expanded, perform search
      performSearch(searchQuery);
    } else {
      // Expand the search bar
      setIsExpanded(true);
    }
  };

  const handleClose = () => {
    setIsExpanded(false);
    setSearchQuery('');
    setShowSuggestions(false);
    setShowResults(false);
    setSearchResults([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      performSearch(searchQuery);
    } else if (e.key === 'Escape') {
      handleClose();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    // Find the corresponding app page and navigate directly
    const appPage = appSuggestions.find(item => item.text === suggestion);
    if (appPage) {
      history.push(appPage.route);
      handleClose();
    } else {
      // Fallback to search if not found
      setSearchQuery(suggestion);
      performSearch(suggestion);
    }
  };

  const handleBackToSuggestions = () => {
    setShowResults(false);
    setShowSuggestions(true);
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

  const handleNotificationClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    setNotificationEvent(event.nativeEvent);
    setShowNotifications(true);
  };

  const handleNotificationSelect = (notification: NotificationItem) => {
    // Mark notification as read
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Navigate to the notification's data URL if available
    if (notification.data?.url) {
      history.push(notification.data.url);
    }
    setShowNotifications(false);
  };

  return (
    <>
      {isExpanded && <div className="search-backdrop" onClick={handleClose}></div>}
      <div className={`floating-search-container ${isExpanded ? 'expanded' : ''}`}>
        {/* Live Broadcast Button - only show when there's an active live broadcast or YouTube live stream, and not on the go live page */}
        {(liveBroadcasts.length > 0 || liveStreams.length > 0) && !isExpanded && location.pathname !== '/admin/live' && (
          <div
            className={`floating-live-button ${(liveBroadcasts.length > 0 || liveStreams.length > 0) ? 'blinking' : ''}`}
            onClick={handleLiveBroadcastClick}
            style={{
              position: 'absolute',
              top: 'calc(var(--ion-safe-area-top) + 4px)', // Position slightly below search button
              right: 90, // Position next to search button (20px right + 45px button + 25px gap)
              width: 70,
              height: 32,
              borderRadius: 16,
              backgroundColor: 'red',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 6px 10px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)',
              zIndex: 999,
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              padding: '0 8px',
              gap: '4px'
            }}
          >
            <IonIcon
              icon={radio}
              style={{
                color: 'white',
                fontSize: '14px',
                flexShrink: 0
              }}
            />
            <span style={{
              color: 'white',
              fontSize: '12px',
              fontWeight: '600',
              whiteSpace: 'nowrap'
            }}>
              Live
            </span>
          </div>
        )}

        {isExpanded ? (
          <div className="search-container">
            <div className="expanded-search-bar">
              <IonInput
                value={searchQuery}
                placeholder="Search..."
                onIonChange={(e) => setSearchQuery(e.detail.value!)}
                onKeyPress={handleKeyPress}
                autofocus
                className="search-input"
              />
              <IonButton fill="clear" onClick={handleSearchClick} className="search-submit-btn">
                <IonIcon icon={search} />
              </IonButton>
              <IonButton fill="clear" onClick={handleClose} className="search-close-btn">
                <IonIcon icon={close} />
              </IonButton>
            </div>
            {showSuggestions && (
              <div className="search-suggestions">
                <div className="suggestions-header">
                  <span className="suggestions-title">Quick Access</span>
                </div>
                <IonList className="suggestions-list">
                  {suggestions.map((suggestion, index) => {
                    const appPage = appSuggestions.find(item => item.text === suggestion);
                    return (
                      <IonItem
                        key={index}
                        button
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="suggestion-item"
                      >
                        <IonIcon
                          icon={
                            suggestion === 'Home' ? home :
                            suggestion === 'Sermons' ? playCircle :
                            suggestion === 'Devotions' ? book :
                            suggestion === 'Events' ? calendar :
                            suggestion === 'Ministries' ? people :
                            suggestion === 'Prayer Requests' ? heart :
                            suggestion === 'Giving' ? wallet :
                            suggestion === 'Saved' ? download :
                            suggestion === 'My Favorites' ? bookmark :
                            suggestion === 'Watch History' ? time :
                            suggestion === 'Reading History' ? documentText :
                            suggestion === 'Profile' ? person :
                            suggestion === 'Settings' ? settings :
                            suggestion === 'About DMA' ? informationCircle :
                            search
                          }
                          slot="start"
                          className="suggestion-icon"
                        />
                        <IonLabel>
                          <h3>{suggestion}</h3>
                          <p>{appPage?.description}</p>
                        </IonLabel>
                      </IonItem>
                    );
                  })}
                </IonList>
              </div>
            )}

            {showResults && (
              <div className="search-results">
                <div className="results-header">
                  <IonButton fill="clear" onClick={handleBackToSuggestions} className="back-btn">
                    <IonIcon icon="arrow-back" />
                  </IonButton>
                  <span className="results-title">
                    {searchQuery.trim() ? `Search Results for "${searchQuery}"` : 'All App Pages'}
                  </span>
                </div>
                <IonList className="results-list">
                  {isLoading ? (
                    <IonItem className="loading-item">
                      <IonLabel>Searching...</IonLabel>
                    </IonItem>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((result, index) => (
                      <IonItem
                        key={result.id || index}
                        button
                        onClick={() => {
                          // Navigate to the result's URL
                          history.push(result.url);
                          handleClose();
                        }}
                        className="result-item"
                      >
                        <IonIcon
                          icon={
                            result.type === 'sermon' ? 'play-circle' :
                            result.type === 'podcast' ? radio :
                            result.type === 'event' ? 'calendar' :
                            result.type === 'devotion' ? 'book' :
                            result.type === 'ministry' ? 'people' :
                            'search'
                          }
                          slot="start"
                          className="result-icon"
                        />
                        <IonLabel>
                          <h3>{result.title}</h3>
                          <p>{result.subtitle || result.type}</p>
                          {result.description && <p className="result-description">{result.description}</p>}
                        </IonLabel>
                      </IonItem>
                    ))
                  ) : (
                    <IonItem className="no-results">
                      <IonLabel>No results found for "{searchQuery}"</IonLabel>
                    </IonItem>
                  )}
                </IonList>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Notification Button */}
            <div
              className="floating-notification-button"
              onClick={handleNotificationClick}
              style={{
                position: 'absolute',
                top: 'calc(var(--ion-safe-area-top) - 0px)',
                right: (liveBroadcasts.length > 0 || liveStreams.length > 0) ? 160 : 95, // Adjust position when live button is active
                width: 45,
                height: 45,
                borderRadius: 25,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 999,
              }}
            >
              <IonIcon
                icon={notificationsIcon}
                style={{
                  color: 'var(--ion-text-color)',
                  fontSize: '24px',
                }}
              />
              {unreadCount > 0 && (
                <IonBadge
                  color="danger"
                  style={{
                    position: 'absolute',
                    top: '5px',
                    right: '5px',
                    minWidth: '16px',
                    height: '16px',
                    fontSize: '10px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--ion-background-color)',
                  }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </IonBadge>
              )}
            </div>

            {/* Search Button */}
            <div
              className="floating-search-button"
              onClick={(e) => {
                const target = e.currentTarget as HTMLElement;
                target.style.transform = 'scale(0.8)';
                setTimeout(() => {
                  target.style.transform = 'scale(1)';
                }, 200);
                handleSearchClick();
              }}
              style={{
                position: 'absolute',
                top: 'calc(var(--ion-safe-area-top) - 18px)',
                right: 20,
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
            >
              <IonIcon
                icon={search}
                style={{
                  color: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? '#ffffff' : '#000000',
                  fontSize: '20px',
                }}
              />
            </div>
          </>
        )}

        {/* Notification Popover */}
        <IonPopover
          isOpen={showNotifications}
          event={notificationEvent}
          onDidDismiss={() => setShowNotifications(false)}
          side="bottom"
          alignment="center"
          style={{ '--offset-y': '8px' }}
        >
          <div style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.08) 100%)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '16px',
            overflow: 'hidden',
            minWidth: '120px',
            maxWidth: '280px',
            padding: '2px 0',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            position: 'relative'
          }}>
            {/* Frosted glass overlay */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%, rgba(255, 255, 255, 0.05) 100%)',
              pointerEvents: 'none',
              borderRadius: '16px'
            }} />
            <div style={{
              padding: '8px 12px',
              borderBottom: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(13, 128, 163, 0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '0.95em',
                fontWeight: '600',
                color: 'white'
              }}>
                Notifications
              </h3>
              {unreadCount > 0 && (
                <IonButton
                  fill="clear"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    markAllAsRead();
                  }}
                  style={{
                    '--color': 'white',
                    '--padding-start': '6px',
                    '--padding-end': '6px',
                    '--padding-top': '2px',
                    '--padding-bottom': '2px',
                    fontSize: '0.75em',
                    fontWeight: '500',
                    height: '24px',
                    minHeight: '24px'
                  }}
                >
                  Mark All Read
                </IonButton>
              )}
            </div>
            <IonList style={{ background: 'transparent', padding: '0', position: 'relative', zIndex: 1 }}>
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <IonItem
                    key={notification.id}
                    button
                    onClick={() => handleNotificationSelect(notification)}
                    style={{
                      '--background-hover': 'rgba(255,255,255,0.1)',
                      '--padding-start': '8px',
                      '--inner-padding-end': '8px',
                      minHeight: '48px',
                      opacity: notification.read ? 0.7 : 1
                    }}
                  >
                    <IonIcon
                      icon={
                        notification.type === 'sermon' ? playCircle :
                        notification.type === 'event' ? calendar :
                        notification.type === 'devotion' ? book :
                        notification.type === 'podcast' ? radio :
                        notification.type === 'ministry' ? people :
                        notification.type === 'news' ? 'newspaper' :
                        informationCircle
                      }
                      slot="start"
                      style={{
                        fontSize: '1em',
                        color: notification.read ? 'var(--ion-color-medium)' : 'var(--ion-color-primary)',
                        marginRight: '6px'
                      }}
                    />
                    <IonLabel style={{ flex: 1 }}>
                      <h3 style={{
                        fontSize: '0.8em',
                        fontWeight: '600',
                        margin: '0 0 2px 0',
                        color: notification.read ? 'var(--ion-color-medium)' : 'var(--ion-text-color)'
                      }}>
                        {notification.title}
                      </h3>
                      <p style={{
                        fontSize: '0.75em',
                        margin: '0',
                        color: 'var(--ion-color-medium)',
                        lineHeight: '1.2'
                      }}>
                        {notification.message}
                      </p>
                      <p style={{
                        fontSize: '0.65em',
                        margin: '2px 0 0 0',
                        color: 'var(--ion-color-medium)',
                        opacity: 0.8
                      }}>
                        {notification.timestamp.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </IonLabel>
                    {!notification.read && (
                      <div style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '3px',
                        backgroundColor: 'var(--ion-color-primary)',
                        flexShrink: 0
                      }} />
                    )}
                  </IonItem>
                ))
              ) : (
                <IonItem style={{ '--background-hover': 'transparent', '--padding-start': '8px', '--inner-padding-end': '8px', minHeight: '40px' }}>
                  <IonLabel>
                    <h3 style={{ fontSize: '0.8em', color: 'var(--ion-color-medium)' }}>
                      No notifications
                    </h3>
                    <p style={{ fontSize: '0.75em', color: 'var(--ion-color-medium)' }}>
                      You're all caught up!
                    </p>
                  </IonLabel>
                </IonItem>
              )}
            </IonList>
          </div>
        </IonPopover>
      </div>
    </>
  );
};

export default FloatingSearchIcon;