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
  newspaper,
  arrowBack,
  filter,
  close
} from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import apiService, { BACKEND_BASE_URL } from '../services/api';

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

const Search: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const searchbarRef = useRef<HTMLIonSearchbarElement>(null);
  const history = useHistory();
  const location = useLocation();

  // Auto-focus search bar when page loads
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchbarRef.current) {
        searchbarRef.current.setFocus();
      }
    }, 300); // Small delay to ensure DOM is ready

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

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButton
            fill="clear"
            slot="start"
            onClick={() => history.goBack()}
          >
            <IonIcon icon={arrowBack} />
          </IonButton>
          <IonTitle>Search</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <div style={{ padding: '16px' }}>
          {/* Search Bar */}
          <IonSearchbar
            ref={searchbarRef}
            value={searchQuery}
            onIonInput={(e) => handleSearchChange(e.detail.value!)}
            onIonClear={() => {
              setSearchQuery('');
              setSearchResults([]);
              setHasSearched(false);
            }}
            placeholder="Search sermons, events, devotions..."
            showClearButton="always"
          />

          {/* Filter Chips */}
          <div style={{ marginTop: '16px', marginBottom: '16px' }}>
            <IonText color="medium" style={{ fontSize: '0.9em', marginBottom: '8px', display: 'block' }}>
              Filter by:
            </IonText>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {filters.map((filter) => (
                <IonChip
                  key={filter.value}
                  color={selectedFilter === filter.value ? 'primary' : 'light'}
                  onClick={() => handleFilterChange(filter.value)}
                  style={{ cursor: 'pointer' }}
                >
                  <IonLabel>{filter.label}</IonLabel>
                </IonChip>
              ))}
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <IonSpinner name="crescent" />
              <IonText color="medium" style={{ display: 'block', marginTop: '16px' }}>
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

                  <IonList>
                    {searchResults.map((result, index) => (
                      <IonItem
                        key={`${result.type}-${result.id}-${index}`}
                        button
                        onClick={() => history.push(result.url)}
                        style={{ '--padding-start': '16px', '--inner-padding-end': '16px' }}
                      >
                        {/* Thumbnail */}
                        <div
                          slot="start"
                          style={{
                            marginRight: '16px',
                            width: '120px',
                            height: '120px',
                            flexShrink: 0
                          }}
                        >
                          {result.image ? (
                            <img
                              src={`${BACKEND_BASE_URL}${result.image}`}
                              alt={result.title}
                              style={{
                                width: '100%',
                                height: '100%',
                                borderRadius: '12px',
                                objectFit: 'cover'
                              }}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/bible.JPG';
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '100%',
                                height: '100%',
                                borderRadius: '12px',
                                backgroundColor: 'var(--ion-color-light-shade)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <IonIcon
                                icon={getTypeIcon(result.type)}
                                color={getTypeColor(result.type)}
                                size="large"
                              />
                            </div>
                          )}
                        </div>

                        <IonLabel>
                          <h2 style={{ fontWeight: '600', marginBottom: '4px' }}>{result.title}</h2>
                          <p style={{ color: 'var(--ion-color-medium)', fontSize: '0.9em', marginBottom: '4px' }}>
                            {result.subtitle || result.type.charAt(0).toUpperCase() + result.type.slice(1)}
                          </p>
                          {result.description && (
                            <p style={{
                              color: 'var(--ion-color-medium)',
                              fontSize: '0.85em',
                              lineHeight: '1.4',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}>
                              {result.description}
                            </p>
                          )}
                          {result.date && (
                            <p style={{ color: 'var(--ion-color-medium)', fontSize: '0.8em', marginTop: '4px' }}>
                              {new Date(result.date).toLocaleDateString()}
                            </p>
                          )}
                        </IonLabel>

                        <IonBadge
                          color={getTypeColor(result.type)}
                          slot="end"
                          style={{ fontSize: '0.7em', padding: '4px 8px' }}
                        >
                          {result.type}
                        </IonBadge>
                      </IonItem>
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