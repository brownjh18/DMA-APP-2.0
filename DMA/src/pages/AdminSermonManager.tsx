import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  IonText,
  IonRefresher,
  IonRefresherContent,
  IonLoading,
  IonAlert,
  IonActionSheet,
  IonFab,
  IonFabButton,
  useIonViewWillEnter
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import {
  add,
  create,
  trash,
  playCircle,
  eye,
  eyeOff,
  ellipsisVertical,
  arrowBack,
  calendar,
  musicalNote,
  time,
  search,
  closeCircle as closeIcon,
  settings,
  people,
  checkmarkCircle
} from 'ionicons/icons';
import { apiService, BACKEND_BASE_URL } from '../services/api';
import './Tab4.css';

const AdminSermonManager: React.FC = () => {
  const history = useHistory();
  const [sermons, setSermons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sermonsLoading, setSermonsLoading] = useState<boolean>(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sermonToDelete, setSermonToDelete] = useState<any>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [selectedSermon, setSelectedSermon] = useState<any>(null);
  const [sortBy, setSortBy] = useState<string>('date');
  const [filterBy, setFilterBy] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Utility function to clear API cache for sermons
  const clearSermonsCache = () => {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('api_cache_') && key.includes('/sermons')) {
          localStorage.removeItem(key);
          console.log('🗑️ Cleared cache:', key);
        }
      });
    } catch (error) {
      console.warn('Error clearing cache:', error);
    }
  };

  // Utility function to handle API errors gracefully
  const handleApiError = (error: any, action: string) => {
    console.error(`Error ${action}:`, error);
    
    if (error.message?.includes('Sermon not found') || error.message?.includes('404')) {
      console.log(`🗑️ Resource not found during ${action}, clearing cache and refreshing`);
      clearSermonsCache();
      sessionStorage.setItem('sermonsNeedRefresh', 'true');
      setTimeout(() => loadSermons(true), 1000);
      return true; // Error was handled
    }
    
    return false; // Error was not handled, show generic message
  };

  // Check if sermon data might be stale and needs refresh
  const isDataStale = () => {
    try {
      // Check if we have sermons data that's older than 5 minutes
      const cacheKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('api_cache_') && key.includes('/sermons')
      );
      
      for (const key of cacheKeys) {
        const cached = localStorage.getItem(key);
        if (cached) {
          const parsed = JSON.parse(cached);
          const age = Date.now() - parsed.timestamp;
          const maxAge = 5 * 60 * 1000; // 5 minutes
          
          if (age > maxAge) {
            console.log(`📅 Cache data is stale (${Math.round(age / 1000 / 60)} minutes old), will refresh`);
            return true;
          }
        }
      }
    } catch (error) {
      console.warn('Error checking cache age:', error);
    }
    return false;
  };

  useEffect(() => {
    // Check if refresh is needed on component mount
    const needsRefresh = sessionStorage.getItem('sermonsNeedRefresh') === 'true';
    const staleData = isDataStale();
    const shouldRefresh = needsRefresh || staleData;
    
    console.log('📱 AdminSermonManager mounted, needsRefresh:', needsRefresh, 'staleData:', staleData);
    loadSermons(shouldRefresh);
  }, []);

  // Reload sermons when page becomes active (e.g., when returning from Add/Edit pages)
  useIonViewWillEnter(() => {
    const needsRefresh = sessionStorage.getItem('sermonsNeedRefresh') === 'true';
    if (needsRefresh) {
      console.log('🔄 Refreshing sermons due to navigation back from add/edit page');
      loadSermons(true);
    } else if (sermons.length === 0) {
      // Only load if no sermons exist
      loadSermons();
    }
  });


  const loadSermons = async (forceRefresh = false) => {
    // Check for refresh flag in sessionStorage
    const needsRefresh = sessionStorage.getItem('sermonsNeedRefresh') === 'true';
    
    // Prevent multiple concurrent calls, but always allow refresh when needed
    if (!forceRefresh && !needsRefresh && sermonsLoading) return;

    try {
      setSermonsLoading(true);
      setLoading(true);
      console.log('Loading sermons from API...');
      
      // Clear refresh flag if it exists
      if (needsRefresh) {
        sessionStorage.removeItem('sermonsNeedRefresh');
        console.log('🔄 Refresh flag detected and cleared');
        
        // Also clear the cache when refresh is needed
        clearSermonsCache();
      }
      
      // Load all sermons (both published and drafts) for admin
      const response = await apiService.getSermons({ published: 'all' });
      console.log('Sermons loaded:', response.sermons?.length || 0);
      setSermons(response.sermons || []);
    } catch (error: any) {
      console.error('Error loading sermons:', error);
      
      if (!handleApiError(error, 'loading sermons')) {
        setAlertMessage('Failed to load sermons. Please try again.');
        setShowAlert(true);
        setSermons([]);
      }
    } finally {
      setLoading(false);
      setSermonsLoading(false);
    }
  };

  const handleRefresh = async (event: CustomEvent) => {
    await loadSermons();
    event.detail.complete();
  };

  const toggleStatus = async (id: string) => {
    try {
      const sermon = sermons.find(s => s._id === id);
      if (!sermon) {
        console.warn('Sermon not found in local state:', id);
        setAlertMessage('Sermon not found. Refreshing sermon list...');
        setShowAlert(true);
        await loadSermons(true);
        return;
      }

      const newStatus = !sermon.isPublished;
      await apiService.toggleSermonPublishStatus(id, newStatus);

      // Update local state immediately for instant feedback
      setSermons(sermons.map(s => 
        s._id === id ? { ...s, isPublished: newStatus } : s
      ));

      setAlertMessage(`Sermon ${newStatus ? 'published' : 'unpublished'} successfully!`);
      setShowAlert(true);

      // Also trigger a refresh to ensure data consistency
      console.log('🔄 Refreshing sermon list after status change');
      sessionStorage.setItem('sermonsNeedRefresh', 'true');
      setTimeout(() => loadSermons(true), 500);
    } catch (error: any) {
      console.error('Error toggling sermon status:', error);
      
      // Handle specific error cases
      if (error.message?.includes('Sermon not found') || error.message?.includes('404')) {
        console.log('🗑️ Sermon not found in database, removing from local state');
        
        // Remove the sermon from local state since it doesn't exist in the database
        setSermons(sermons.filter(s => s._id !== id));
        
        setAlertMessage('This sermon no longer exists and has been removed from the list.');
        setShowAlert(true);
        
        // Trigger a refresh to ensure data consistency
        sessionStorage.setItem('sermonsNeedRefresh', 'true');
        setTimeout(() => loadSermons(true), 1000);
      } else {
        setAlertMessage('Failed to update sermon status. Please try again.');
        setShowAlert(true);
      }
    }
  };

  const confirmDeleteSermon = (sermon: any) => {
    setSermonToDelete(sermon);
    setShowDeleteConfirm(true);
  };

  const deleteSermon = async () => {
    if (!sermonToDelete) return;

    try {
      await apiService.deleteSermon(sermonToDelete._id);

      // Update local state immediately for instant feedback
      setSermons(sermons.filter(s => s._id !== sermonToDelete._id));

      setAlertMessage('Sermon deleted successfully!');
      setShowAlert(true);

      // Also trigger a refresh to ensure data consistency
      console.log('🔄 Refreshing sermon list after deletion');
      sessionStorage.setItem('sermonsNeedRefresh', 'true');
      setTimeout(() => loadSermons(true), 500);
    } catch (error: any) {
      console.error('Error deleting sermon:', error);
      
      // Handle specific error cases
      if (error.message?.includes('Sermon not found') || error.message?.includes('404')) {
        console.log('🗑️ Sermon not found in database, removing from local state');
        
        // Remove the sermon from local state since it doesn't exist in the database
        setSermons(sermons.filter(s => s._id !== sermonToDelete._id));
        
        setAlertMessage('This sermon no longer exists and has been removed from the list.');
        setShowAlert(true);
        
        // Trigger a refresh to ensure data consistency
        sessionStorage.setItem('sermonsNeedRefresh', 'true');
        setTimeout(() => loadSermons(true), 1000);
      } else {
        setAlertMessage('Failed to delete sermon. Please try again.');
        setShowAlert(true);
      }
    } finally {
      setShowDeleteConfirm(false);
      setSermonToDelete(null);
    }
  };

  const openEditPage = (sermon: any) => {
    history.push(`/admin/sermons/edit/${sermon._id}`, { sermon });
  };

  const openActionSheet = (sermon: any) => {
    setSelectedSermon(sermon);
    setShowActionSheet(true);
  };

  const handleStatClick = (statType: string) => {
    setFilterBy(statType === 'published' || statType === 'draft' ? statType : 'all');
  };

  // Calculate stats
  const totalSermons = sermons.length;
  const publishedSermons = sermons.filter(s => s.isPublished).length;
  const draftSermons = sermons.filter(s => !s.isPublished).length;
  const totalViews = sermons.reduce((acc, s) => acc + (s.viewCount || 0), 0);

  const statsModules = [
    { name: 'Total Sermons', icon: playCircle, color: '#6366f1', val: totalSermons, sub: 'sermons' },
    { name: 'Published', icon: eye, color: '#10b981', val: publishedSermons, sub: 'sermons' },
    { name: 'Drafts', icon: closeIcon, color: '#f59e0b', val: draftSermons, sub: 'sermons' },
    { name: 'Total Views', icon: people, color: '#8b5cf6', val: totalViews, sub: 'views' }
  ];

  const getSortedAndFilteredSermons = () => {
    let filtered = sermons;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.title?.toLowerCase().includes(query) || 
        s.speaker?.toLowerCase().includes(query)
      );
    }

    // Apply filter
    if (filterBy === 'published') {
      filtered = filtered.filter(s => s.isPublished === true);
    } else if (filterBy === 'draft') {
      filtered = filtered.filter(s => s.isPublished === false);
    }

    // Apply sorting
    let sorted = [...filtered];
    switch (sortBy) {
      case 'date':
        sorted.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.date || 0);
          const dateB = new Date(b.createdAt || b.date || 0);
          return dateB.getTime() - dateA.getTime();
        });
        break;
      case 'views':
        sorted.sort((a, b) => {
          const viewsA = a.viewCount || 0;
          const viewsB = b.viewCount || 0;
          return viewsB - viewsA;
        });
        break;
      case 'published':
      case 'draft':
        sorted.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.date || 0);
          const dateB = new Date(b.createdAt || b.date || 0);
          return dateB.getTime() - dateA.getTime();
        });
        break;
      default:
        break;
    }

    return sorted;
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <div
          onClick={() => history.goBack()}
          style={{
            position: 'absolute',
            top: 'calc(var(--ion-safe-area-top) - -5px)',
            left: 20,
            width: 40,
            height: 40,
            borderRadius: 20,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 999,
            boxShadow: '0 4px 12px rgba(99,102,241,0.4)'
          }}
        >
          <IonIcon icon={arrowBack} style={{ color: 'white', fontSize: '18px' }} />
        </div>
        <IonToolbar className="toolbar-ios">
          <IonTitle className="title-ios">
            <span style={{ fontWeight: '700', color: 'var(--ion-color-primary)' }}>Sermon Management</span>
          </IonTitle>
          <IonButton fill="clear" slot="end" onClick={() => loadSermons(true)} style={{ marginRight: '8px' }}>
            <IonIcon icon={settings} />
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
        <div style={{ padding: '16px', maxWidth: '1200px', margin: '0 auto', paddingBottom: '100px' }}>
          
          {/* Stats Modules - 2 Column Grid */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: 'var(--ion-text-color)' }}>
              Sermon Statistics
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: '8px',
              background: 'var(--ion-card-background)',
              borderRadius: '16px',
              padding: '8px',
              border: '1px solid var(--ion-color-step-200)'
            }}>
              {statsModules.map((mod, i) => (
                <div key={i} onClick={() => {
                  if (mod.name === 'Total Sermons') setFilterBy('all');
                  else if (mod.name === 'Published') setFilterBy(filterBy === 'published' ? 'all' : 'published');
                  else if (mod.name === 'Drafts') setFilterBy(filterBy === 'draft' ? 'all' : 'draft');
                  else if (mod.name === 'Total Views') setSortBy('views');
                }} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: '1px solid transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${mod.color}10`;
                  e.currentTarget.style.borderColor = `${mod.color}30`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
                >
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: mod.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: `0 4px 12px ${mod.color}40`
                  }}>
                    <IonIcon icon={mod.icon} style={{ fontSize: '20px', color: 'white' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 2px 0', fontSize: '13px', fontWeight: '600', color: 'var(--ion-text-color)' }}>{mod.name}</p>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--ion-text-color)', opacity: 0.5 }}>{mod.sub}</p>
                  </div>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: `${mod.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: mod.color }}>{mod.val}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ 
              display: 'flex', 
              gap: '10px',
              marginBottom: filterBy !== 'all' ? '12px' : '0'
            }}>
              <div style={{
                flex: 1,
                position: 'relative',
                background: 'var(--ion-card-background)',
                borderRadius: 14,
                border: '1px solid var(--ion-color-step-200)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
              }}>
                <IonIcon 
                  icon={search} 
                  style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--ion-color-primary)',
                    fontSize: '18px'
                  }} 
                />
                <input
                  type="text"
                  placeholder="Search sermons..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 14px 14px 44px',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'var(--ion-text-color)',
                    fontSize: '0.95em'
                  }}
                />
              </div>
            </div>

            {/* Active Filter Badge */}
            {filterBy !== 'all' && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--ion-color-step-200)',
                padding: '6px 12px',
                borderRadius: 20,
                marginBottom: '8px'
              }}>
                <IonText style={{ color: 'var(--ion-text-color)', opacity: 0.6, fontSize: '0.8em', fontWeight: '500' }}>
                  Filter: {filterBy.charAt(0).toUpperCase() + filterBy.slice(1)}
                </IonText>
                <div 
                  onClick={() => setFilterBy('all')}
                  style={{
                    cursor: 'pointer',
                    padding: '2px'
                  }}
                >
                  <IonIcon icon={closeIcon} style={{ color: 'var(--ion-text-color)', opacity: 0.4, fontSize: '16px' }} />
                </div>
              </div>
            )}
          </div>

          {/* Sermons List */}
          <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
            <IonRefresherContent></IonRefresherContent>
          </IonRefresher>

          <div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: 'var(--ion-text-color)' }}>
              {filterBy === 'all' ? 'All Sermons' :
               filterBy === 'published' ? 'Published Sermons' :
               filterBy === 'draft' ? 'Draft Sermons' :
               'All Sermons'}
              <span style={{ 
                color: 'var(--ion-text-color)', 
                opacity: 0.4, 
                fontWeight: '400',
                fontSize: '0.85em',
                marginLeft: '8px'
              }}>
                ({getSortedAndFilteredSermons().length})
              </span>
            </h3>

            {getSortedAndFilteredSermons().length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: 'var(--ion-card-background)',
                borderRadius: 20,
                border: '1px solid var(--ion-color-step-200)'
              }}>
                <div style={{
                  width: 80,
                  height: 80,
                  borderRadius: 24,
                  background: 'var(--ion-color-primary)',
                  opacity: 0.1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px'
                }}>
                  <IonIcon
                    icon={playCircle}
                    style={{
                      fontSize: '2.5em',
                      color: 'var(--ion-color-primary)'
                    }}
                  />
                </div>
                <h3 style={{
                  margin: '0 0 8px 0',
                  fontSize: '1.2em',
                  fontWeight: '600',
                  color: 'var(--ion-text-color)'
                }}>
                  {loading ? 'Loading sermons...' : 'No sermons found'}
                </h3>
                <p style={{
                  margin: '0',
                  fontSize: '0.9em',
                  color: 'var(--ion-text-color)',
                  opacity: 0.6,
                  lineHeight: '1.4'
                }}>
                  {loading
                    ? 'Please wait while we fetch the sermon list'
                    : searchQuery
                      ? 'No sermons match your search'
                      : filterBy !== 'all'
                        ? `No sermons match the current ${filterBy} filter`
                        : 'No sermons have been added yet'
                  }
                </p>
                {!loading && (searchQuery || filterBy !== 'all') && (
                  <IonButton
                    fill="outline"
                    onClick={() => {
                      setFilterBy('all');
                      setSearchQuery('');
                    }}
                    style={{
                      marginTop: '20px',
                      '--border-color': 'var(--ion-color-step-200)',
                      '--color': 'var(--ion-color-primary)',
                      '--background': 'transparent',
                      '--border-radius': '12px'
                    }}
                  >
                    Clear filters
                  </IonButton>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {getSortedAndFilteredSermons().map((sermon) => (
                  <div
                    key={sermon._id}
                    onClick={(e) => {
                      e.stopPropagation();
                      openActionSheet(sermon);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: 'var(--ion-card-background)',
                      borderRadius: 14,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      padding: '14px',
                      border: '1px solid var(--ion-color-step-200)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {/* Sermon Thumbnail */}
                    <div style={{ position: 'relative', marginRight: '14px' }}>
                      {sermon.thumbnailUrl ? (
                        <img
                          src={sermon.thumbnailUrl.startsWith('/uploads') ? `${BACKEND_BASE_URL}${sermon.thumbnailUrl}` : sermon.thumbnailUrl}
                          alt={sermon.title}
                          style={{
                            width: '120px',
                            height: '68px',
                            borderRadius: '10px',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '120px',
                            height: '68px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-secondary))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                          }}
                        >
                          <IonIcon icon={playCircle} style={{ fontSize: '2em', color: 'white' }} />
                        </div>
                      )}
                      {/* Duration Badge - Bottom Right */}
                      {sermon.duration && (
                        <div style={{
                          position: 'absolute',
                          bottom: '4px',
                          right: '4px',
                          background: 'rgba(0, 0, 0, 0.85)',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '0.7em',
                          fontWeight: '500',
                          color: '#fff'
                        }}>
                          {sermon.duration}
                        </div>
                      )}
                      {/* Published/Draft Badge - Top Left */}
                      <div style={{
                        position: 'absolute',
                        top: '4px',
                        left: '4px',
                        background: sermon.isPublished 
                          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                          : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '0.6em',
                        fontWeight: '600',
                        color: '#fff',
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}>
                        {sermon.isPublished ? 'Published' : 'Draft'}
                      </div>
                    </div>

                    {/* Sermon Info */}
                    <div style={{ flex: '1', minWidth: 0 }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        marginBottom: '4px'
                      }}>
                        <h4 style={{
                          margin: 0,
                          fontSize: '0.95em',
                          fontWeight: '600',
                          color: 'var(--ion-text-color)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {sermon.title}
                        </h4>
                      </div>
                      <p style={{
                        margin: '0 0 4px 0',
                        fontSize: '0.8em',
                        color: 'var(--ion-text-color)',
                        opacity: 0.6,
                        fontWeight: '500',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {sermon.speaker || 'Dove Church'}
                      </p>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        fontSize: '0.7em',
                        color: 'var(--ion-text-color)',
                        opacity: 0.4
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <IonIcon icon={calendar} style={{ fontSize: '12px' }} />
                          <span>{new Date(sermon.createdAt || sermon.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>•</span>
                          <IonIcon icon={eye} style={{ fontSize: '12px' }} />
                          <span>{sermon.viewCount || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Options Button */}
                    <IonButton
                      fill="clear"
                      onClick={(e) => {
                        e.stopPropagation();
                        openActionSheet(sermon);
                      }}
                      style={{
                        margin: 0,
                        padding: '8px',
                        minWidth: 'auto',
                        height: 'auto',
                        '--color': 'var(--ion-text-color)',
                        opacity: 0.5
                      }}
                    >
                      <IonIcon icon={ellipsisVertical} style={{ fontSize: '1.2em' }} />
                    </IonButton>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--ion-color-step-200)' }}>
            <IonText style={{ color: 'var(--ion-text-color)', opacity: 0.4, fontSize: '11px' }}>
              Dove Church • Sermon Management
            </IonText>
          </div>
        </div>

        {/* FAB Button */}
        <IonFab horizontal="end" vertical="bottom" slot="fixed" style={{ marginBottom: '80px', marginRight: '16px' }}>
          <IonFabButton onClick={() => history.push('/admin/sermons/add')} style={{ '--background': '#6366f1', '--box-shadow': '0 4px 16px rgba(99, 102, 241, 0.5)' }}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        <IonLoading isOpen={loading} message="Loading sermons..." />
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="Notice"
          message={alertMessage}
          buttons={['OK']}
        />
        <IonAlert
          isOpen={showDeleteConfirm}
          onDidDismiss={() => {
            setShowDeleteConfirm(false);
            setSermonToDelete(null);
          }}
          header="Confirm Delete"
          message={`Are you sure you want to delete the sermon "${sermonToDelete?.title}" by ${sermonToDelete?.speaker}? This action cannot be undone.`}
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
              handler: () => {
                setShowDeleteConfirm(false);
                setSermonToDelete(null);
              }
            },
            {
              text: 'Delete',
              role: 'destructive',
              handler: deleteSermon
            }
          ]}
        />
        <IonActionSheet
          isOpen={showActionSheet}
          onDidDismiss={() => setShowActionSheet(false)}
          header={`Options for "${selectedSermon?.title}"`}
          buttons={[
            {
              text: selectedSermon?.isPublished ? 'Unpublish' : 'Publish',
              icon: selectedSermon?.isPublished ? eyeOff : eye,
              handler: () => {
                if (selectedSermon) {
                  toggleStatus(selectedSermon._id);
                }
              }
            },
            {
              text: 'Edit',
              icon: create,
              handler: () => {
                if (selectedSermon) {
                  openEditPage(selectedSermon);
                }
              }
            },
            {
              text: 'Delete',
              role: 'destructive',
              icon: trash,
              handler: () => {
                if (selectedSermon) {
                  confirmDeleteSermon(selectedSermon);
                }
              }
            },
            {
              text: 'Cancel',
              role: 'cancel'
            }
          ]}
        />

      </IonContent>
      <style>{`
        input::placeholder {
          color: var(--ion-text-color) !important;
          opacity: 0.4 !important;
        }
      `}</style>
    </IonPage>
  );
};

export default AdminSermonManager;