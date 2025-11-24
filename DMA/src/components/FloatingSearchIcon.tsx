import React, { useState, useEffect } from 'react';
import { IonIcon, IonFab, IonFabButton, IonInput, IonButton, IonList, IonItem, IonLabel } from '@ionic/react';
import { search, close, home, playCircle, book, calendar, people, heart, wallet, download, bookmark, time, documentText, person, settings, informationCircle, radio } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { fetchLiveStreams, YouTubeVideo } from '../services/youtubeService';
import { usePlayer } from '../contexts/PlayerContext';
// import { searchContent, getSearchSuggestions, SearchResult } from '../services/searchService';
import './FloatingSearchIcon.css';

interface SearchResult {
  id: string;
  type: 'sermon' | 'news' | 'event' | 'devotion' | 'ministry' | 'gallery';
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
  const [isCheckingLive, setIsCheckingLive] = useState(false);
  const history = useHistory();
  const { setCurrentSermon, setIsPlaying } = usePlayer();

  // App-specific suggestions that map to actual pages and content
  const appSuggestions = [
    { text: 'Home', route: '/tab1', description: 'Main dashboard and daily devotion' },
    { text: 'Sermons', route: '/tab2', description: 'Watch and listen to sermons' },
    { text: 'Devotions', route: '/tab3', description: 'Daily devotionals and readings' },
    { text: 'Events', route: '/events', description: 'Upcoming church events and programs' },
    { text: 'Ministries', route: '/ministries', description: 'Church ministries and departments' },
    { text: 'Prayer Requests', route: '/prayer', description: 'Submit and view prayer requests' },
    { text: 'Giving', route: '/giving', description: 'Online giving and donations' },
    { text: 'Downloads', route: '/downloads', description: 'Downloaded sermons and content' },
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

  // Check for live streams periodically
  useEffect(() => {
    const checkLiveStreams = async () => {
      try {
        setIsCheckingLive(true);
        const streams = await fetchLiveStreams(1); // Check for active live streams
        setLiveStreams(streams);
      } catch (error) {
        console.error('Error checking live streams:', error);
        setLiveStreams([]);
      } finally {
        setIsCheckingLive(false);
      }
    };

    // Check immediately and then every 30 seconds
    checkLiveStreams();
    const interval = setInterval(checkLiveStreams, 30000);

    return () => clearInterval(interval);
  }, []);

  const performSearch = async (query: string) => {
    setIsLoading(true);
    try {
      let searchResults: SearchResult[] = [];

      if (query.trim()) {
        // Find matching app pages/content based on query
        const matchingPages = appSuggestions.filter(item =>
          item.text.toLowerCase().includes(query.toLowerCase()) ||
          item.description.toLowerCase().includes(query.toLowerCase())
        );

        // Create search results from matching pages
        searchResults = matchingPages.map((page, index) => ({
          id: `page-${index}`,
          type: 'sermon' as const, // Using sermon as default type
          title: page.text,
          subtitle: 'App Page',
          description: page.description,
          url: page.route,
          score: 1
        }));
      } else {
        // If no query, show all available pages as results
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

      setTimeout(() => {
        setSearchResults(searchResults);
        setShowResults(true);
        setShowSuggestions(false);
        setIsLoading(false);
      }, 300); // Short delay for better UX

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

  const handleLiveStreamClick = () => {
    if (liveStreams.length > 0) {
      // Navigate to sermons page and play the live stream
      const liveStream = liveStreams[0]; // Get the first live stream
      // Convert YouTubeVideo to Sermon format
      const sermon = {
        id: liveStream.id,
        title: liveStream.title,
        description: liveStream.description || '',
        thumbnailUrl: liveStream.thumbnailUrl || '',
        publishedAt: liveStream.publishedAt || '',
        duration: liveStream.duration || '',
        viewCount: liveStream.viewCount?.toString() || '',
      };
      setCurrentSermon(sermon);
      setIsPlaying(true);
      history.push('/tab2'); // Navigate to sermons page
    }
  };

  return (
    <>
      {isExpanded && <div className="search-backdrop" onClick={handleClose}></div>}
      <div className={`floating-search-container ${isExpanded ? 'expanded' : ''}`}>
        {/* Live Stream Button - only show when there's an active live stream */}
        {liveStreams.length > 0 && !isExpanded && (
          <div
            className={`floating-live-button ${liveStreams.length > 0 ? 'blinking' : ''}`}
            onClick={handleLiveStreamClick}
            style={{
              position: 'absolute',
              top: 'var(--ion-safe-area-top)', // Same horizontal level as search button
              right: 75, // Position next to search button (10px right + 50px button + 25px gap)
              width: 40,
              height: 40,
              borderRadius: 20,
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
            }}
          >
            <IonIcon
              icon={radio}
              style={{
                color: 'white',
                fontSize: '16px',
              }}
            />
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
                            suggestion === 'Downloads' ? download :
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
                            result.type === 'news' ? 'newspaper' :
                            result.type === 'event' ? 'calendar' :
                            result.type === 'devotion' ? 'book' :
                            result.type === 'ministry' ? 'people' :
                            result.type === 'gallery' ? 'images' :
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
          <div
            className="floating-search-button"
            onClick={handleSearchClick}
            style={{
              position: 'absolute',
              top: 'calc(var(--ion-safe-area-top) - 18px)',
              right: 10,
              width: 45,
              height: 45,
              borderRadius: 25,
              backgroundColor: 'rgba(var(--ion-background-color-rgb), 0.95)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 6px 10px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)',
              zIndex: 999,
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            <IonIcon
              icon={search}
              style={{
                color: 'var(--ion-text-color)',
                fontSize: '20px',
              }}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default FloatingSearchIcon;