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
  radio,
  eye,
  eyeOff,
  playCircle,
  ellipsisVertical,
  arrowBack,
  musicalNote,
  time,
  search,
  closeCircle as closeIcon,
  settings,
  people,
  checkmarkCircle,
  calendar
} from 'ionicons/icons';
import './Tab4.css';
import { apiService, BACKEND_BASE_URL } from '../services/api';

const AdminRadioManager: React.FC = () => {
  const history = useHistory();
  const [podcasts, setPodcasts] = useState<any[]>([]);
  const [liveBroadcasts, setLiveBroadcasts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [podcastsLoading, setPodcastsLoading] = useState<boolean>(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [broadcastToDelete, setBroadcastToDelete] = useState<any>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [selectedBroadcast, setSelectedBroadcast] = useState<any>(null);
  const [sortBy, setSortBy] = useState<string>('date');
  const [filterBy, setFilterBy] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Utility function to clear API cache for podcasts
  const clearPodcastsCache = () => {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('api_cache_') && (key.includes('/podcasts') || key.includes('/live-broadcasts'))) {
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
    return false;
  };

  useEffect(() => {
    // Initial load - check if refresh is needed
    const needsRefresh = sessionStorage.getItem('podcastsNeedRefresh') === 'true';
    const shouldRefresh = needsRefresh || podcasts.length === 0;
    
    console.log('📱 AdminRadioManager mounted, needsRefresh:', needsRefresh, 'podcasts.length:', podcasts.length);
    loadPodcasts(shouldRefresh);
  }, []);

  useIonViewWillEnter(() => {
    const needsRefresh = sessionStorage.getItem('podcastsNeedRefresh') === 'true';
    if (needsRefresh) {
      console.log('🔄 Refreshing podcasts due to navigation back from add/edit page');
      loadPodcasts(true);
    } else if (podcasts.length === 0) {
      loadPodcasts();
    }
  });

  const loadPodcasts = async (forceRefresh = false) => {
    const needsRefresh = sessionStorage.getItem('podcastsNeedRefresh') === 'true';
    
    // Don't block if already loading - just return to prevent duplicate calls
    if (!forceRefresh && !needsRefresh && podcastsLoading) return;

    try {
      setLoading(true);
      console.log('Loading podcasts from API...');
      
      if (needsRefresh) {
        sessionStorage.removeItem('podcastsNeedRefresh');
        console.log('🔄 Refresh flag detected and cleared');
        clearPodcastsCache();
      }
      
      // Load podcasts using apiService - includes all for admin management (published and drafts)
      const podcastData = await apiService.getPodcasts({ published: 'false', limit: 1000 });
      if (podcastData && podcastData.podcasts) {
        setPodcasts(podcastData.podcasts);
      } else {
        setPodcasts([]);
      }

      // Load live broadcasts using apiService (both live and recorded)
      const liveData = await apiService.getLiveBroadcasts({ type: 'live_broadcast' });
      if (liveData && liveData.broadcasts) {
        setLiveBroadcasts(liveData.broadcasts);
      } else {
        setLiveBroadcasts([]);
      }
    } catch (error: any) {
      console.error('Error loading podcasts:', error);
      if (!handleApiError(error, 'loading podcasts')) {
        setAlertMessage('Failed to load podcasts. Please try again.');
        setShowAlert(true);
        setPodcasts([]);
        setLiveBroadcasts([]);
      }
    } finally {
      setLoading(false);
      setPodcastsLoading(false);
    }
  };

  const handleRefresh = async (event: CustomEvent) => {
    await loadPodcasts();
    event.detail.complete();
  };

  const toggleStatus = async (id: string) => {
    try {
      // Check if it's a podcast or live broadcast
      const podcast = podcasts.find(p => p._id === id);
      const liveBroadcast = liveBroadcasts.find(b => b._id === id);

      if (podcast) {
        const newStatus = podcast.status === 'published' ? 'draft' : 'published';
        const token = localStorage.getItem('token');
        const response = await fetch(`${BACKEND_BASE_URL}/api/podcasts/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
          setPodcasts(podcasts.map(p => 
            p._id === id ? { ...p, status: newStatus } : p
          ));
          setAlertMessage(`Podcast ${newStatus === 'published' ? 'published' : 'unpublished'} successfully!`);
          setShowAlert(true);
          sessionStorage.setItem('podcastsNeedRefresh', 'true');
          setTimeout(() => loadPodcasts(true), 500);
        } else {
          console.error('Failed to update podcast status');
        }
      } else if (liveBroadcast) {
        const newStatus = liveBroadcast.status === 'published' ? 'draft' : 'published';
        const token = localStorage.getItem('token');
        const response = await fetch(`${BACKEND_BASE_URL}/api/live-broadcasts/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ isPublished: newStatus === 'published' })
        });

        if (response.ok) {
          setLiveBroadcasts(liveBroadcasts.map(b => 
            b._id === id ? { ...b, status: newStatus } : b
          ));
          setAlertMessage(`Broadcast ${newStatus === 'published' ? 'published' : 'unpublished'} successfully!`);
          setShowAlert(true);
          sessionStorage.setItem('podcastsNeedRefresh', 'true');
          setTimeout(() => loadPodcasts(true), 500);
        } else {
          console.error('Failed to update live broadcast status');
        }
      }
    } catch (error: any) {
      console.error('Error updating status:', error);
      setAlertMessage('Failed to update status. Please try again.');
      setShowAlert(true);
    }
  };

  const confirmDeleteBroadcast = (broadcast: any) => {
    setBroadcastToDelete(broadcast);
    setShowDeleteConfirm(true);
  };

  const deleteBroadcast = async () => {
    if (!broadcastToDelete) return;

    try {
      const podcast = podcasts.find(p => p._id === broadcastToDelete._id);
      const liveBroadcast = liveBroadcasts.find(b => b._id === broadcastToDelete._id);

      if (podcast) {
        await apiService.deletePodcast(broadcastToDelete._id);
        setPodcasts(podcasts.filter(podcast => podcast._id !== broadcastToDelete._id));
      } else if (liveBroadcast) {
        await apiService.deleteLiveBroadcast(broadcastToDelete._id);
        setLiveBroadcasts(liveBroadcasts.filter(broadcast => broadcast._id !== broadcastToDelete._id));
      }

      setAlertMessage('Broadcast deleted successfully!');
      setShowAlert(true);
      sessionStorage.setItem('podcastsNeedRefresh', 'true');
      setTimeout(() => loadPodcasts(true), 500);
    } catch (error: any) {
      console.error('Error deleting broadcast:', error);
      setAlertMessage('Failed to delete broadcast. Please try again.');
      setShowAlert(true);
    } finally {
      setShowDeleteConfirm(false);
      setBroadcastToDelete(null);
    }
  };

  const openEditPage = (broadcast: any) => {
    const podcast = podcasts.find(p => p._id === broadcast.id || p._id === broadcast._id);
    if (podcast) {
      history.push(`/admin/radio/edit/${broadcast._id || broadcast.id}`, { broadcast });
    } else {
      history.push(`/admin/live/edit/${broadcast._id || broadcast.id}`, { broadcast });
    }
  };

  const openActionSheet = (broadcast: any) => {
    setSelectedBroadcast(broadcast);
    setShowActionSheet(true);
  };

  const handleStatClick = (statType: string) => {
    if (statType === 'total') setFilterBy('all');
    else if (statType === 'published') setFilterBy(filterBy === 'published' ? 'all' : 'published');
    else if (statType === 'draft') setFilterBy(filterBy === 'draft' ? 'all' : 'draft');
    else if (statType === 'views') setSortBy('listens');
  };

  // Calculate stats
  const totalBroadcasts = podcasts.length + liveBroadcasts.length;
  const publishedBroadcasts = podcasts.filter(p => p.status === 'published').length + liveBroadcasts.filter(b => b.status === 'published').length;
  const draftBroadcasts = podcasts.filter(p => p.status === 'draft').length + liveBroadcasts.filter(b => b.status === 'draft').length;
  const totalListens = podcasts.reduce((acc, p) => acc + (p.listens || 0), 0) + liveBroadcasts.reduce((acc, b) => acc + (b.viewCount || 0), 0);

  const statsModules = [
    { name: 'Total Broadcasts', icon: radio, color: '#6366f1', val: totalBroadcasts, sub: 'broadcasts' },
    { name: 'Published', icon: eye, color: '#10b981', val: publishedBroadcasts, sub: 'broadcasts' },
    { name: 'Drafts', icon: closeIcon, color: '#f59e0b', val: draftBroadcasts, sub: 'broadcasts' },
    { name: 'Total Listens', icon: people, color: '#8b5cf6', val: totalListens, sub: 'listens' }
  ];

  const getSortedAndFilteredBroadcasts = () => {
    // Combine podcasts and live broadcasts
    const allBroadcasts = [
      ...podcasts.map(p => ({ ...p, type: 'podcast', isPublished: p.status === 'published' })),
      ...liveBroadcasts.map(l => ({ ...l, type: 'live', isPublished: l.status === 'published' }))
    ];

    // Apply search filter
    let filtered = allBroadcasts;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = allBroadcasts.filter(b =>
        b.title?.toLowerCase().includes(query) ||
        b.speaker?.toLowerCase().includes(query) ||
        b.description?.toLowerCase().includes(query)
      );
    }

    // Apply filter
    if (filterBy === 'published') {
      filtered = filtered.filter(b => b.isPublished === true);
    } else if (filterBy === 'draft') {
      filtered = filtered.filter(b => b.isPublished === false);
    }

    // Apply sorting
    let sorted = [...filtered];
    switch (sortBy) {
      case 'date':
        sorted.sort((a, b) => {
          const dateA = a.type === 'podcast' ? new Date(a.publishedAt || a.date || 0) :
                      new Date(a.broadcastStartTime || a.createdAt || 0);
          const dateB = b.type === 'podcast' ? new Date(b.publishedAt || b.date || 0) :
                      new Date(b.broadcastStartTime || b.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        });
        break;
      case 'listens':
        sorted.sort((a, b) => {
          const listensA = a.type === 'podcast' ? (a.listens || 0) : (a.viewCount || 0);
          const listensB = b.type === 'podcast' ? (b.listens || 0) : (b.viewCount || 0);
          return listensB - listensA;
        });
        break;
      default:
        break;
    }

    return sorted;
  };

  const getStatusColor = (broadcast: any) => {
    if (broadcast.isLive) {
      return '#ef4444';
    } else if (broadcast.broadcastStartTime && broadcast.type === 'podcast') {
      return '#059669';
    } else {
      return '#007bff';
    }
  };

  const getBadgeText = (broadcast: any) => {
    if (broadcast.isLive) {
      return 'LIVE';
    } else if (broadcast.broadcastStartTime && broadcast.type === 'podcast') {
      return 'RECORDED';
    } else {
      return 'UPLOADED';
    }
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
            <span style={{ fontWeight: '700', color: 'var(--ion-color-primary)' }}>Radio Management</span>
          </IonTitle>
          <IonButton fill="clear" slot="end" onClick={() => loadPodcasts(true)} style={{ marginRight: '8px' }}>
            <IonIcon icon={settings} />
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
        <div style={{ padding: '16px', maxWidth: '1200px', margin: '0 auto', paddingBottom: '100px' }}>
          
          {/* Stats Modules - 2 Column Grid */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: 'var(--ion-text-color)' }}>
              Broadcast Statistics
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
                <div key={i} onClick={() => handleStatClick(mod.name.toLowerCase().replace(' ', ''))} style={{
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
                  placeholder="Search podcasts & broadcasts..."
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

          {/* Broadcasts List */}
          <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
            <IonRefresherContent></IonRefresherContent>
          </IonRefresher>

          <div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: 'var(--ion-text-color)' }}>
              {filterBy === 'all' ? 'All Broadcasts' :
               filterBy === 'published' ? 'Published Broadcasts' :
               filterBy === 'draft' ? 'Draft Broadcasts' :
               'All Broadcasts'}
              <span style={{ 
                color: 'var(--ion-text-color)', 
                opacity: 0.4, 
                fontWeight: '400',
                fontSize: '0.85em',
                marginLeft: '8px'
              }}>
                ({getSortedAndFilteredBroadcasts().length})
              </span>
            </h3>

            {getSortedAndFilteredBroadcasts().length === 0 ? (
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
                    icon={radio}
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
                  {loading ? 'Loading broadcasts...' : 'No broadcasts found'}
                </h3>
                <p style={{
                  margin: '0',
                  fontSize: '0.9em',
                  color: 'var(--ion-text-color)',
                  opacity: 0.6,
                  lineHeight: '1.4'
                }}>
                  {loading
                    ? 'Please wait while we fetch the broadcast list'
                    : searchQuery
                      ? 'No broadcasts match your search'
                      : filterBy !== 'all'
                        ? `No broadcasts match the current ${filterBy} filter`
                        : 'No podcasts have been added yet'
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
                {getSortedAndFilteredBroadcasts().map((broadcast) => (
                  <div
                    key={`${broadcast.type}-${broadcast._id || broadcast.id || Math.random()}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      openActionSheet(broadcast);
                    }}
 style={{
                      display: 'flex', alignItems: 'center',
                      background: 'var(--ion-card-background)',
                      borderRadius: 14,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      padding: '14px',
                      border: '1px solid var(--ion-color-step-200)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {/* Broadcast Thumbnail */}
                    <div style={{ position: 'relative', marginRight: '14px' }}>
                      {broadcast.thumbnailUrl ? (
                        <img
                          src={broadcast.thumbnailUrl.startsWith('/uploads') ? `${BACKEND_BASE_URL}${broadcast.thumbnailUrl}` : broadcast.thumbnailUrl}
                          alt={broadcast.title}
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
                          <IonIcon icon={broadcast.type === 'live' ? radio : playCircle} style={{ fontSize: '2em', color: 'white' }} />
                        </div>
                      )}
                      {/* Type Badge - Top Left (LIVE/RECORDED/UPLOADED) */}
                      <div style={{
                        position: 'absolute',
                        top: '4px',
                        left: '4px',
                        background: getStatusColor(broadcast),
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '0.6em',
                        fontWeight: '600',
                        color: '#fff',
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}>
                        {getBadgeText(broadcast)}
                      </div>
                      {/* Duration Badge - Bottom Right */}
                      {broadcast.duration && broadcast.duration !== 'Live' && (
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
                          {broadcast.duration}
                        </div>
                      )}
                      {/* Published/Draft Badge - Bottom Left */}
                      <div style={{
                        position: 'absolute',
                        bottom: '4px',
                        left: '4px',
                        background: broadcast.isPublished 
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
                        {broadcast.isPublished ? 'Published' : 'Draft'}
                      </div>
                    </div>

                    {/* Broadcast Info */}
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
                          {broadcast.title}
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
                        {broadcast.speaker || 'Dove Church'}
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
                          <span>{new Date(broadcast.publishedAt || broadcast.broadcastStartTime || broadcast.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>•</span>
                          <IonIcon icon={broadcast.type === 'podcast' ? musicalNote : eye} style={{ fontSize: '12px' }} />
                          <span>{broadcast.type === 'podcast' ? (broadcast.listens || 0) : (broadcast.viewCount || 0)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Options Button */}
                    <IonButton
                      fill="clear"
                      onClick={(e) => {
                        e.stopPropagation();
                        openActionSheet(broadcast);
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
              Dove Church • Radio Management
            </IonText>
          </div>
        </div>

        {/* FAB Button */}
        <IonFab horizontal="end" vertical="bottom" slot="fixed" style={{ marginBottom: '80px', marginRight: '16px' }}>
          <IonFabButton onClick={() => history.push('/admin/radio/add')} style={{ '--background': '#6366f1', '--box-shadow': '0 4px 16px rgba(99, 102, 241, 0.5)' }}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

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
            setBroadcastToDelete(null);
          }}
          header="Confirm Delete"
          message={`Are you sure you want to delete "${broadcastToDelete?.title}"? This action cannot be undone.`}
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
              handler: () => {
                setShowDeleteConfirm(false);
                setBroadcastToDelete(null);
              }
            },
            {
              text: 'Delete',
              role: 'destructive',
              handler: deleteBroadcast
            }
          ]}
        />
        <IonActionSheet
          isOpen={showActionSheet}
          onDidDismiss={() => setShowActionSheet(false)}
          header={`Options for "${selectedBroadcast?.title}"`}
          buttons={[
            {
              text: selectedBroadcast?.isPublished ? 'Unpublish' : 'Publish',
              icon: selectedBroadcast?.isPublished ? eyeOff : eye,
              handler: () => {
                if (selectedBroadcast) {
                  toggleStatus(selectedBroadcast._id || selectedBroadcast.id);
                }
              }
            },
            {
              text: 'Edit',
              icon: create,
              handler: () => {
                if (selectedBroadcast) {
                  openEditPage(selectedBroadcast);
                }
              }
            },
            {
              text: 'Delete',
              role: 'destructive',
              icon: trash,
              handler: () => {
                if (selectedBroadcast) {
                  confirmDeleteBroadcast(selectedBroadcast);
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

export default AdminRadioManager;
