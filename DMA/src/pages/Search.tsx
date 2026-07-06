import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSearchbar,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonSpinner,
  IonText,
  IonChip,
  IonAvatar,
  IonBadge,
  IonButton,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle
} from '@ionic/react';
import {
  search,
  playCircle,
  radio,
  calendar,
  book,
  people,
  arrowBack,
  filter,
  close
} from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import apiService, { BACKEND_BASE_URL } from '../services/api';
import { useSettings } from '../contexts/SettingsContext';

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
      const searchInput = document.querySelector('.modern-searchbar input') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      }
    }, 300);
    return () => clearTimeout(timer);
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

  // Get search query from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const query = urlParams.get('q');
    if (query) {
      setSearchQuery(query);
      // performSearch will be called automatically by the debounced effect
    }
  }, [location.search]);

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
    // Update URL with search query
    const newUrl = query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : '/search';
    history.replace(newUrl);
  };

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
    // Search will be triggered automatically by useEffect when selectedFilter changes
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

  return (
    <IonPage className="search-page">
      <style>{`
        .search-page {
          background: ${isDarkMode ? '#000000' : '#ffffff'} !important;
          --ion-background-color: ${isDarkMode ? '#000000' : '#ffffff'} !important;
        }
        .search-page .ion-page {
          background: ${isDarkMode ? '#000000' : '#ffffff'} !important;
        }
        .search-page > div {
          background: ${isDarkMode ? '#000000' : '#ffffff'} !important;
        }
        .header-searchbar {
          background: ${isDarkMode ? '#2c2c2e' : 'var(--ion-color-step-50, #f5f5f7)'} !important;
          border-color: ${isDarkMode ? '#3a3a3c' : 'var(--ion-color-step-100, #e5e5e5)'} !important;
        }
        .header-searchbar input {
          color: ${isDarkMode ? '#ffffff' : 'var(--ion-text-color, #1c1c1e)'} !important;
        }
        .search-page-content {
          --ion-background-color: ${isDarkMode ? '#000000' : '#ffffff'} !important;
          background: ${isDarkMode ? '#000000' : '#ffffff'} !important;
        }
        .search-page-content .ion-page {
          background: ${isDarkMode ? '#000000' : '#ffffff'} !important;
        }
        .search-page-container {
          background: ${isDarkMode ? '#000000' : '#ffffff'} !important;
        }
        .filter-chip {
          --background: ${isDarkMode ? '#2c2c2e' : '#f5f5f7'};
          --color: ${isDarkMode ? '#ffffff' : '#1c1c1e'};
          --border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
          padding: 8px 16px;
          height: 36px;
          --padding-start: 16px;
          --padding-end: 16px;
          margin: 0;
          transition: all 0.2s ease;
        }
        .filter-chip.selected {
          --background: #007aff;
          --color: #ffffff;
        }
        .search-result-item {
          --padding-start: 12px;
          --inner-padding-end: 12px;
          --background: transparent;
          border-bottom: 1px solid ${isDarkMode ? 'rgba(84, 84, 88, 0.36)' : 'var(--ion-color-step-100)'};
          margin-bottom: 8px;
        }
        .search-result-item:last-child {
          border-bottom: none;
        }
      `}</style>
      <IonHeader translucent>
        <IonToolbar style={{ 
          '--padding-start': '8px', 
          '--padding-end': '8px'
        }}>
          <IonButton
            fill="clear"
            slot="start"
            onClick={() => history.goBack()}
            style={{ '--color': 'var(--ion-color-primary)' }}
          >
            <IonIcon icon={arrowBack} />
          </IonButton>
          
          {/* Modern Search Bar in Header */}
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            background: isDarkMode ? '#2c2c2e' : 'var(--ion-color-step-50, #f5f5f7)',
            borderRadius: '12px',
            padding: '0 12px',
            height: '40px',
            marginRight: '8px',
            boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.04)',
            border: `1px solid ${isDarkMode ? '#3a3a3c' : 'var(--ion-color-step-100, #e5e5e5)'}`
          }} className="header-searchbar">
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
                color: isDarkMode ? '#ffffff' : 'var(--ion-text-color, #1c1c1e)',
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

      <IonContent 
        className="search-page-content"
        style={{ 
          '--ion-background-color': isDarkMode ? '#000000 !important' : '#ffffff !important',
          background: isDarkMode ? '#000000 !important' : '#ffffff !important'
        }}
      >
        <div style={{ padding: '16px', background: isDarkMode ? '#000000 !important' : '#ffffff !important' }} className="search-page-container">

          {/* Filter Chips */}
          <div style={{ marginTop: '16px', marginBottom: '16px' }}>
            <IonText color="medium" style={{ fontSize: '0.9em', marginBottom: '12px', display: 'block', fontWeight: '500' }}>
              Filter by:
            </IonText>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {filters.map((filter) => (
                  <IonChip
                    key={filter.value}
                    color={selectedFilter === filter.value ? 'primary' : 'medium'}
                    onClick={() => handleFilterChange(filter.value)}
                    style={{ 
                      cursor: 'pointer',
                      fontWeight: selectedFilter === filter.value ? '600' : '400',
                      background: selectedFilter === filter.value ? 'var(--ion-color-primary)' : (isDarkMode ? '#2c2c2e' : 'var(--ion-color-step-50, #f5f5f7)'),
                      borderRadius: '20px',
                      padding: '8px 16px',
                      height: '36px',
                      margin: 0,
                      color: selectedFilter === filter.value ? '#ffffff' : (isDarkMode ? '#ffffff' : undefined)
                    }}
                  >
                  <IonLabel style={{ fontSize: '14px' }}>{filter.label}</IonLabel>
                </IonChip>
              ))}
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <IonSpinner name="crescent" color="primary" style={{ width: '40px', height: '40px' }} />
              <IonText color="medium" style={{ display: 'block', marginTop: '16px', fontSize: '14px' }}>
                Searching...
              </IonText>
            </div>
          )}

          {/* Search Results */}
          {!isLoading && hasSearched && (
            <>
              {searchResults.length > 0 ? (
                <>
                  <IonText color="medium" style={{ fontSize: '0.9em', marginBottom: '16px', display: 'block' }}>
                    {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                  </IonText>

                  <IonList lines="none" style={{ background: 'transparent' }}>
                    {searchResults.map((result, index) => (
                      <div
                        key={`${result.type}-${result.id}-${index}`}
                        onClick={() => history.push(result.url)}
                        style={{
                          display: 'flex',
                          gap: '16px',
                          padding: '12px',
                          marginBottom: '12px',
                          background: isDarkMode ? '#1c1c1e' : 'var(--ion-background-color, #ffffff)',
                          borderRadius: '16px',
                          boxShadow: isDarkMode ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.06)',
                          cursor: 'pointer',
                          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                          border: `1px solid ${isDarkMode ? 'rgba(84, 84, 88, 0.36)' : 'var(--ion-color-step-100, #e5e5e5)'}`
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = isDarkMode ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = isDarkMode ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.06)';
                        }}
                      >
                        {/* Thumbnail */}
                        <div
                          style={{
                            width: '100px',
                            height: '100px',
                            flexShrink: 0,
                            borderRadius: '12px',
                            overflow: 'hidden',
                            background: 'var(--ion-color-step-100)'
                          }}
                        >
                          {result.image ? (
                            <img
                              src={`${BACKEND_BASE_URL}${result.image}`}
                              alt={result.title}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                // Use type-specific fallback images
                                if (result.type === 'devotion') {
                                  target.src = '/hero-evangelism.jpg';
                                } else if (result.type === 'event' || result.type === 'ministry') {
                                  target.src = '/dove.png';
                                } else {
                                  target.src = '/bible.JPG';
                                }
                                target.onerror = null; // Prevent infinite loop
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
                                background: 'linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-secondary))'
                              }}
                            >
                              <IonIcon
                                icon={getTypeIcon(result.type)}
                                color="light"
                                size="large"
                              />
                            </div>
                          )}
                        </div>

                        <IonLabel style={{ flex: 1, margin: '0 12px' }}>
                          <h2 style={{ fontWeight: '600', marginBottom: '4px', fontSize: '15px', color: isDarkMode ? '#ffffff' : undefined }}>{result.title}</h2>
                          <p style={{ color: isDarkMode ? '#98989d' : 'var(--ion-color-medium)', fontSize: '0.85em', marginBottom: '4px' }}>
                            {result.subtitle || result.type.charAt(0).toUpperCase() + result.type.slice(1)}
                          </p>
                          {result.description && (
                            <p style={{
                              color: isDarkMode ? '#98989d' : 'var(--ion-color-medium)',
                              fontSize: '0.8em',
                              lineHeight: '1.4',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              marginBottom: '4px'
                            }}>
                              {result.description}
                            </p>
                          )}
                          {result.date && (
                            <p style={{ color: isDarkMode ? '#98989d' : 'var(--ion-color-medium)', fontSize: '0.75em' }}>
                              {new Date(result.date).toLocaleDateString()}
                            </p>
                          )}
                        </IonLabel>

                        <IonBadge
                          color={getTypeColor(result.type)}
                          style={{ 
                            fontSize: '0.65em', 
                            padding: '4px 8px',
                            borderRadius: '8px',
                            alignSelf: 'center'
                          }}
                        >
                          {result.type}
                        </IonBadge>
                      </div>
                    ))}
                  </IonList>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <IonIcon
                    icon={search}
                    size="large"
                    color="medium"
                    style={{ marginBottom: '16px' }}
                  />
                  <IonText color="medium">
                    <h3>No results found</h3>
                    <p>Try different keywords or check your spelling</p>
                  </IonText>
                </div>
              )}
            </>
          )}

          {/* Initial State */}
          {!hasSearched && !isLoading && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <IonIcon
                icon={search}
                size="large"
                color="medium"
                style={{ marginBottom: '16px' }}
              />
              <IonText color="medium">
                <h3>Search Content</h3>
                <p>Find sermons, events, devotions, and more</p>
              </IonText>
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Search;