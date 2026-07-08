import React, { useState, useEffect, useCallback } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonContent,
  IonList,
  IonLabel,
  IonIcon,
  IonSpinner,
  IonText,
  IonChip,
  IonBadge,
  IonButton,
} from '@ionic/react';
import {
  search,
  playCircle,
  radio,
  calendar,
  book,
  people,
  arrowBack,
  close,
} from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import apiService, { BACKEND_BASE_URL } from '../services/api';
import { useSettings } from '../contexts/SettingsContext';
import './Search.css';

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

const Search: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const history = useHistory();
  const location = useLocation();
  const { isDarkMode } = useSettings();

  // Auto-focus search input when page loads
  useEffect(() => {
    const timer = setTimeout(() => {
      const searchInput = document.querySelector('.search-native-input') as HTMLInputElement;
      if (searchInput) searchInput.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Debounced search
  const performSearch = useCallback(async (query: string, filter: string = 'all') => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }
    setIsLoading(true);
    try {
      const response = await apiService.search(query.trim());
      let results: SearchResult[] = response.results || [];
      if (filter !== 'all') {
        results = results.filter((r) => r.type === filter);
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

  // Sync query from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const query = urlParams.get('q');
    if (query) setSearchQuery(query);
  }, [location.search]);

  // Debounced search trigger
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }
    const delay = searchQuery.trim().length <= 2 ? 50 : 150;
    const timer = setTimeout(() => performSearch(searchQuery, selectedFilter), delay);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedFilter, performSearch]);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    const newUrl = query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : '/search';
    history.replace(newUrl);
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      sermon: playCircle,
      podcast: radio,
      event: calendar,
      devotion: book,
      ministry: people,
    };
    return icons[type] || search;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      sermon: 'primary',
      podcast: 'secondary',
      event: 'tertiary',
      devotion: 'success',
      ministry: 'warning',
    };
    return colors[type] || 'medium';
  };

  const filters = [
    { value: 'all', label: 'All' },
    { value: 'sermon', label: 'Sermons' },
    { value: 'podcast', label: 'Podcasts' },
    { value: 'event', label: 'Events' },
    { value: 'devotion', label: 'Devotions' },
    { value: 'ministry', label: 'Ministries' },
  ];

  return (
    <IonPage className="search-page">
      <IonHeader 
        translucent 
        className="search-header"
        style={{
          '--background': isDarkMode ? 'rgba(20, 20, 22, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          '--border-color': isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
          '--backdrop-filter': isDarkMode ? 'blur(28px) saturate(140%) brightness(0.8)' : 'blur(20px) saturate(180%)',
          '--webkit-backdrop-filter': isDarkMode ? 'blur(28px) saturate(140%) brightness(0.8)' : 'blur(20px) saturate(180%)',
        } as React.CSSProperties}
      >
        <IonToolbar className="search-toolbar" style={{ '--padding-start': '8px', '--padding-end': '8px' }}>
          <IonButton
            fill="clear"
            slot="start"
            onClick={() => history.goBack()}
            style={{ '--color': 'var(--ion-color-primary)' }}
          >
            <IonIcon icon={arrowBack} />
          </IonButton>

          {/* Search bar */}
          <div className="search-header-bar">
            <IonIcon
              icon={search}
              style={{ color: 'var(--ion-color-primary, #007aff)', fontSize: '18px', flexShrink: 0 }}
            />
            <input
              className="search-native-input"
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search..."
              autoFocus
            />
            {searchQuery && (
              <IonIcon
                icon={close}
                style={{
                  color: isDarkMode ? '#636366' : '#8e8e93',
                  fontSize: '16px',
                  cursor: 'pointer',
                  padding: '4px',
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

      <IonContent className="search-page-content">
        <div className="search-page-container" style={{ padding: '16px' }}>

          {/* Filter chips */}
          <div style={{ marginTop: '16px', marginBottom: '20px' }}>
            <IonText
              style={{
                fontSize: '0.85em',
                marginBottom: '10px',
                display: 'block',
                fontWeight: '600',
                color: isDarkMode ? '#98989d' : '#8e8e93',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Filter by
            </IonText>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {filters.map((f) => (
                <button
                  key={f.value}
                  className={`search-filter-chip${selectedFilter === f.value ? ' active' : ''}`}
                  onClick={() => setSelectedFilter(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Loading */}
          {isLoading && (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <IonSpinner name="crescent" color="primary" style={{ width: '40px', height: '40px' }} />
              <IonText
                style={{
                  display: 'block',
                  marginTop: '16px',
                  fontSize: '14px',
                  color: isDarkMode ? '#98989d' : '#8e8e93',
                }}
              >
                Searching…
              </IonText>
            </div>
          )}

          {/* Results */}
          {!isLoading && hasSearched && (
            <>
              {searchResults.length > 0 ? (
                <>
                  <IonText
                    style={{
                      fontSize: '0.85em',
                      marginBottom: '16px',
                      display: 'block',
                      color: isDarkMode ? '#98989d' : '#8e8e93',
                    }}
                  >
                    {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                  </IonText>

                  <IonList lines="none" style={{ background: 'transparent' }}>
                    {searchResults.map((result, index) => (
                      <div
                        key={`${result.type}-${result.id}-${index}`}
                        className="search-result-card"
                        onClick={() => history.push(result.url)}
                      >
                        {/* Thumbnail */}
                        <div
                          style={{
                            width: '96px',
                            height: '96px',
                            flexShrink: 0,
                            borderRadius: '12px',
                            overflow: 'hidden',
                            background: isDarkMode ? '#2c2c2e' : '#f2f2f7',
                          }}
                        >
                          {result.image ? (
                            <img
                              src={result.image.startsWith('http') ? result.image : `${BACKEND_BASE_URL}${result.image}`}
                              alt={result.title}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src =
                                  result.type === 'devotion'
                                    ? '/hero-evangelism.jpg'
                                    : result.type === 'event' || result.type === 'ministry'
                                    ? '/dove.png'
                                    : '/bible.JPG';
                                target.onerror = null;
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                              }}
                            >
                              <IonIcon icon={getTypeIcon(result.type)} color="light" style={{ fontSize: '28px' }} />
                            </div>
                          )}
                        </div>

                        {/* Text */}
                        <IonLabel style={{ flex: 1, margin: '0', overflow: 'hidden' }}>
                          <h2
                            style={{
                              fontWeight: '600',
                              marginBottom: '4px',
                              fontSize: '15px',
                              color: isDarkMode ? '#ffffff' : '#1c1c1e',
                              whiteSpace: 'normal',
                            }}
                          >
                            {result.title}
                          </h2>
                          <p
                            style={{
                              color: isDarkMode ? '#98989d' : '#8e8e93',
                              fontSize: '0.85em',
                              marginBottom: '4px',
                            }}
                          >
                            {result.subtitle || result.type.charAt(0).toUpperCase() + result.type.slice(1)}
                          </p>
                          {result.description && (
                            <p
                              style={{
                                color: isDarkMode ? '#636366' : '#aeaeb2',
                                fontSize: '0.8em',
                                lineHeight: '1.4',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                marginBottom: '4px',
                              }}
                            >
                              {result.description}
                            </p>
                          )}
                          {result.date && (
                            <p style={{ color: isDarkMode ? '#636366' : '#aeaeb2', fontSize: '0.75em', margin: 0 }}>
                              {new Date(result.date).toLocaleDateString()}
                            </p>
                          )}
                        </IonLabel>

                        {/* Type badge */}
                        <IonBadge
                          color={getTypeColor(result.type)}
                          style={{
                            fontSize: '0.65em',
                            padding: '4px 8px',
                            borderRadius: '8px',
                            alignSelf: 'flex-start',
                            marginTop: '2px',
                            flexShrink: 0,
                          }}
                        >
                          {result.type}
                        </IonBadge>
                      </div>
                    ))}
                  </IonList>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '48px 20px' }}>
                  <IonIcon
                    icon={search}
                    style={{
                      fontSize: '48px',
                      color: isDarkMode ? '#3a3a3c' : '#c7c7cc',
                      marginBottom: '16px',
                    }}
                  />
                  <h3 style={{ color: isDarkMode ? '#98989d' : '#8e8e93', margin: '0 0 8px' }}>No results found</h3>
                  <p style={{ color: isDarkMode ? '#636366' : '#aeaeb2', margin: 0, fontSize: '0.9em' }}>
                    Try different keywords or check your spelling
                  </p>
                </div>
              )}
            </>
          )}

          {/* Initial empty state */}
          {!hasSearched && !isLoading && (
            <div style={{ textAlign: 'center', padding: '72px 20px 40px' }}>
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: isDarkMode ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                }}
              >
                <IonIcon icon={search} style={{ fontSize: '32px', color: '#6366f1' }} />
              </div>
              <h3 style={{ color: isDarkMode ? '#ffffff' : '#1c1c1e', margin: '0 0 8px', fontSize: '1.2em', fontWeight: '600' }}>
                Search Content
              </h3>
              <p style={{ color: isDarkMode ? '#98989d' : '#8e8e93', margin: 0, fontSize: '0.9em', lineHeight: '1.5' }}>
                Find sermons, events, devotions, and more
              </p>
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Search;
