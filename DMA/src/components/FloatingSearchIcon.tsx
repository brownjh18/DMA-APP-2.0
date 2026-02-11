import React, { useState, useEffect, useCallback } from 'react';
import { IonIcon, IonBadge, IonPopover, IonButton, IonModal, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonAvatar, IonText, IonChip, IonSpinner, IonSearchbar } from '@ionic/react';
import { search, radio, playCircle, calendar, book, people, newspaper, informationCircle, arrowBack, close } from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import { YouTubeVideo } from '../services/youtubeService';
import { usePlayer } from '../contexts/PlayerContext';
import apiService, { BACKEND_BASE_URL } from '../services/api';
import './FloatingSearchIcon.css';

interface SearchResult {
  id: string;
  type: 'sermon' | 'podcast' | 'event' | 'devotion' | 'ministry' | 'news';
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
      case 'news': return newspaper;
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
      case 'news': return 'danger';
      default: return 'medium';
    }
  };

  const filters = [
    { value: 'all', label: 'All' },
    { value: 'sermon', label: 'Sermons' },
    { value: 'podcast', label: 'Podcasts' },
    { value: 'event', label: 'Events' },
    { value: 'devotion', label: 'Devotions' },
    { value: 'ministry', label: 'Ministries' },
    { value: 'news', label: 'News' }
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
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.08) 100%)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 999,
            transition: 'transform 0.2s ease',
            overflow: 'hidden'
          }}
        >
          {/* Frosted glass overlay */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%, rgba(255, 255, 255, 0.05) 100%)',
            pointerEvents: 'none',
            borderRadius: '25px'
          }} />
          <IonIcon
            icon={search}
            style={{
              color: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? '#ffffff' : '#000000',
              fontSize: '20px',
            }}
          />
        </div>
      </div>


      {/* Search Modal - New Transparent Blur Design */}
      <IonModal
        isOpen={showSearchModal}
        onDidDismiss={() => setShowSearchModal(false)}
        className="search-modal-transparent"
      >
        <IonHeader className="search-header-transparent">
          <IonToolbar style={{ '--background': 'transparent' }}>
            <IonButton
              fill="clear"
              slot="start"
              onClick={() => setShowSearchModal(false)}
              className="close-button-transparent"
            >
              <IonIcon icon={close} />
            </IonButton>
            <IonTitle style={{ color: 'var(--ion-text-color)' }}>Search</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent className="search-content-transparent">
          <div style={{ padding: '0 16px' }}>
            {/* Search Bar */}
            <div className="search-bar-transparent">
              <IonSearchbar
                value={searchQuery}
                onIonInput={(e: any) => handleSearchChange(e.detail.value!)}
                onIonClear={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setHasSearched(false);
                }}
                placeholder="Search sermons, events, devotions..."
                showClearButton="always"
                style={{ '--background': 'transparent', '--color': 'var(--ion-text-color)', '--placeholder-color': 'rgba(var(--ion-text-color-rgb), 0.7)' }}
              />
            </div>

            {/* Filter Chips */}
            <div className="filter-chips-transparent">
              <IonText style={{ fontSize: '0.9em', marginBottom: '8px', display: 'block', color: 'var(--ion-text-color)' }}>
                Filter by:
              </IonText>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {filters.map((filter) => (
                  <IonChip
                    key={filter.value}
                    className={`filter-chip-transparent ${selectedFilter === filter.value ? 'active' : ''}`}
                    onClick={() => handleFilterChange(filter.value)}
                  >
                    <IonLabel>{filter.label}</IonLabel>
                  </IonChip>
                ))}
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="loading-spinner-transparent">
                <IonSpinner name="crescent" color="primary" />
                <IonText style={{ display: 'block', marginTop: '16px', color: 'var(--ion-text-color)' }}>
                  Searching...
                </IonText>
              </div>
            )}

            {/* Search Results */}
            {!isLoading && hasSearched && (
              <>
                {searchResults.length > 0 ? (
                  <div style={{ marginBottom: '20px' }}>
                    <IonText style={{ fontSize: '0.9em', marginBottom: '16px', display: 'block', color: 'var(--ion-text-color)' }}>
                      {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                    </IonText>

                    {searchResults.map((result, index) => (
                      <div
                        key={`${result.type}-${result.id}-${index}`}
                        className="result-card-transparent"
                        onClick={() => {
                          setShowSearchModal(false);
                          history.push(result.url);
                        }}
                      >
                        <div className="result-card-content">
                          {/* Thumbnail */}
                          {result.image ? (
                            <img
                              src={result.image.startsWith('/uploads') ? `${BACKEND_BASE_URL}${result.image}` : result.image}
                              alt={result.title}
                              className="result-card-thumbnail"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/bible.JPG';
                              }}
                            />
                          ) : (
                            <div
                              className="result-card-thumbnail"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: 'rgba(var(--ion-text-color-rgb), 0.1)'
                              }}
                            >
                              <IonIcon
                                icon={getTypeIcon(result.type)}
                                style={{ fontSize: '24px', color: 'var(--ion-text-color)' }}
                              />
                            </div>
                          )}

                          {/* Content */}
                          <div className="result-card-info">
                            <div className="result-card-title">{result.title}</div>
                            <div className="result-card-subtitle">
                              {result.subtitle || result.type.charAt(0).toUpperCase() + result.type.slice(1)}
                            </div>
                            {result.description && (
                              <div className="result-card-description">
                                {result.description}
                              </div>
                            )}
                            {result.date && (
                              <div style={{ color: 'rgba(var(--ion-text-color-rgb), 0.6)', fontSize: '0.8em', marginTop: '4px' }}>
                                {new Date(result.date).toLocaleDateString()}
                              </div>
                            )}
                          </div>

                          {/* Type Badge */}
                          <div className="result-card-type">
                            {result.type}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-results-transparent">
                    <IonIcon
                      icon={search}
                      size="large"
                      className="no-results-icon"
                      style={{ marginBottom: '16px' }}
                    />
                    <div className="no-results-title">No results found</div>
                    <div className="no-results-text">Try different keywords or check your spelling</div>
                  </div>
                )}
              </>
            )}

            {/* Initial State */}
            {!hasSearched && !isLoading && (
              <div className="no-results-transparent">
                <IonIcon
                  icon={search}
                  size="large"
                  className="no-results-icon"
                  style={{ marginBottom: '16px' }}
                />
                <div className="no-results-title">Search Content</div>
                <div className="no-results-text">Find sermons, events, devotions, and more</div>
              </div>
            )}
          </div>
        </IonContent>
      </IonModal>
    </>
  );
};

export default FloatingSearchIcon;