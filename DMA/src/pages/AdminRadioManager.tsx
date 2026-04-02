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
import BackButton from '../components/BackButton';
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
import { useSocket } from '../contexts/SocketContext';
import { apiService, BACKEND_BASE_URL } from '../services/api';
import './Tab4.css';

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
  const [failedThumbnails, setFailedThumbnails] = useState<Set<string>>(new Set());
  
  // Default thumbnail for radio/podcasts when no custom thumbnail is uploaded
  const DEFAULT_RADIO_THUMBNAIL = '/hero-evangelism.jpg';
  
  // Socket.io real-time updates (only podcast events are supported in SocketContext)
  const { isConnected, onPodcastCreated, onPodcastUpdated, onPodcastDeleted } = useSocket();

  // Helper function to clear API cache for podcasts
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
    
    if (error.message?.includes('not found') || error.message?.includes('404')) {
      console.log(`🗑️ Resource not found during ${action}, clearing cache and refreshing`);
      clearPodcastsCache();
      sessionStorage.setItem('podcastsNeedRefresh', 'true');
      setTimeout(() => loadPodcasts(true), 1000);
      return true; // Error was handled
    }
    
    return false; // Error was not handled, show generic message
  };

  // Check if podcast data might be stale and needs refresh
  const isDataStale = () => {
    try {
      const cacheKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('api_cache_') && (key.includes('/podcasts') || key.includes('/live-broadcasts'))
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
    // Set up real-time Socket.io listeners
    if (isConnected) {
      console.log('🔌 AdminRadioManager: Setting up Socket.io listeners');
      
      // Podcast listeners
      onPodcastCreated((data: any) => {
        console.log('📥 Received podcast:created event:', data);
        if (data.podcast) {
          setPodcasts(prev => [data.podcast, ...prev]);
          clearPodcastsCache();
          sessionStorage.setItem('podcastsNeedRefresh', 'true');
        }
      });

      onPodcastUpdated((data: any) => {
        console.log('📥 Received podcast:updated event:', data);
        if (data.podcast) {
          setPodcasts(prev => 
            prev.map(p => p._id === data.podcast._id ? data.podcast : p)
          );
          clearPodcastsCache();
          sessionStorage.setItem('podcastsNeedRefresh', 'true');
        }
      });

      onPodcastDeleted((data: any) => {
        console.log('📥 Received podcast:deleted event:', data);
        if (data.id) {
          setPodcasts(prev => prev.filter(p => p._id !== data.id));
          clearPodcastsCache();
          sessionStorage.setItem('podcastsNeedRefresh', 'true');
        }
      });

    }

    // Check if refresh is needed on component mount
    const needsRefresh = sessionStorage.getItem('podcastsNeedRefresh') === 'true';
    const staleData = isDataStale();
    const shouldRefresh = needsRefresh || staleData;
    
    console.log('📱 AdminRadioManager mounted, needsRefresh:', needsRefresh, 'staleData:', staleData);
    loadPodcasts(shouldRefresh);
  }, [isConnected]);

  useIonViewWillEnter(() => {
    const needsRefresh = sessionStorage.getItem('podcastsNeedRefresh') === 'true';
    if (needsRefresh) {
      console.log('🔄 Refreshing podcasts due to navigation back from add/edit page');
      loadPodcasts(true);
    } else if (podcasts.length === 0 && liveBroadcasts.length === 0) {
      loadPodcasts();
    }
  });

  const loadPodcasts = async (forceRefresh = false) => {
    const needsRefresh = sessionStorage.getItem('podcastsNeedRefresh') === 'true';
    
    if (!forceRefresh && !needsRefresh && podcastsLoading) return;

    try {
      setPodcastsLoading(true);
      setLoading(true);
      console.log('Loading podcasts from API...');
      
      if (needsRefresh) {
        sessionStorage.removeItem('podcastsNeedRefresh');
        console.log('🔄 Refresh flag detected and cleared');
        clearPodcastsCache();
      }
      
      // Load podcasts using apiService - includes all for admin management (published and drafts)
      const podcastData = await apiService.getPodcasts({ limit: 100, published: 'all' });
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
        await fetch(`${BACKEND_BASE_URL}/api/podcasts/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ status: newStatus })
        });

        // Update local state immediately for instant feedback
        setPodcasts(podcasts.map(p => 
          p._id === id ? { ...p, status: newStatus } : p
        ));

        setAlertMessage(`Podcast ${newStatus === 'published' ? 'published' : 'unpublished'} successfully!`);
        setShowAlert(true);

        sessionStorage.setItem('podcastsNeedRefresh', 'true');
        setTimeout(() => loadPodcasts(true), 500);
      } else if (liveBroadcast) {
        const newStatus = liveBroadcast.status === 'published' ? 'draft' : 'published';
        const token = localStorage.getItem('token');
        await fetch(`${BACKEND_BASE_URL}/api/live-broadcasts/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ isPublished: newStatus === 'published' })
        });

        // Update local state immediately for instant feedback
        setLiveBroadcasts(liveBroadcasts.map(b => 
          b._id === id ? { ...b, status: newStatus } : b
        ));

        setAlertMessage(`Broadcast ${newStatus === 'published' ? 'published' : 'unpublished'} successfully!`);
        setShowAlert(true);

        sessionStorage.setItem('podcastsNeedRefresh', 'true');
        setTimeout(() => loadPodcasts(true), 500);
      }
    } catch (error: any) {
      console.error('Error updating status:', error);
      
      if (error.message?.includes('not found') || error.message?.includes('404')) {
        console.log('🗑️ Resource not found in database, removing from local state');
        setPodcasts(podcasts.filter(p => p._id !== id));
        setLiveBroadcasts(liveBroadcasts.filter(b => b._id !== id));
        setAlertMessage('This broadcast no longer exists and has been removed from the list.');
        setShowAlert(true);
        sessionStorage.setItem('podcastsNeedRefresh', 'true');
        setTimeout(() => loadPodcasts(true), 1000);
      } else {
        setAlertMessage('Failed to update status. Please try again.');
        setShowAlert(true);
      }
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
      
      if (error.message?.includes('not found') || error.message?.includes('404')) {
        console.log('🗑️ Broadcast not found in database, removing from local state');
        setPodcasts(podcasts.filter(p => p._id !== broadcastToDelete._id));
        setLiveBroadcasts(liveBroadcasts.filter(b => b._id !== broadcastToDelete._id));
        setAlertMessage('This broadcast no longer exists and has been removed from the list.');
        setShowAlert(true);
        sessionStorage.setItem('podcastsNeedRefresh', 'true');
        setTimeout(() => loadPodcasts(true), 1000);
      } else {
        setAlertMessage('Failed to delete broadcast. Please try again.');
        setShowAlert(true);
      }
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
    setFilterBy(statType === 'published' || statType === 'draft' ? statType : 'all');
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

  return (
    <IonPage>
      <IonHeader translucent>
        <BackButton />
        <IonToolbar className="toolbar-ios">
          <IonTitle className="title-ios">Radio Manager</IonTitle>
          <IonButton fill="clear" slot="end" onClick={() => loadPodcasts(true)} style={{ marginRight: '8px' }}>
            <IonIcon icon={settings} />
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
        <div style={{ padding: '16px', maxWidth: '1200px', margin: '0 auto', paddingBottom: '100px' }}>

          {/* Stats Modules - Modern Compact Horizontal Cards */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ 
              display: 'flex', 
              gap: '10px',
              overflowX: 'auto',
              paddingBottom: '4px',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}>
              {statsModules.map((mod, i) => (
                <div key={i} onClick={() => {
                  if (mod.name === 'Total Broadcasts') setFilterBy('all');
                  else if (mod.name === 'Published') setFilterBy(filterBy === 'published' ? 'all' : 'published');
                  else if (mod.name === 'Drafts') setFilterBy(filterBy === 'draft' ? 'all' : 'draft');
                  else if (mod.name === 'Total Listens') setSortBy('listens');
                }} style={{
                  minWidth: '140px',
                  flex: '0 0 auto',
                  padding: '12px 16px',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: `1px solid ${mod.color}20`,
                  background: `linear-gradient(135deg, ${mod.color}08 0%, ${mod.color}03 100%)`,
                  backdropFilter: 'blur(10px)',
                  boxShadow: `0 2px 8px ${mod.color}10`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 8px 24px ${mod.color}25`;
                  e.currentTarget.style.borderColor = `${mod.color}40`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = `0 2px 8px ${mod.color}10`;
                  e.currentTarget.style.borderColor = `${mod.color}20`;
                }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: mod.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: `0 2px 8px ${mod.color}30`
                    }}>
                      <IonIcon icon={mod.icon} style={{ fontSize: '16px', color: 'white' }} />
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--ion-text-color)', opacity: 0.7 }}>{mod.name}</span>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '22px', fontWeight: '700', color: mod.color, lineHeight: '1.1' }}>{mod.val}</span>
                    <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: 'var(--ion-text-color)', opacity: 0.5 }}>{mod.sub}</p>
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
                  <IonIcon icon={closeIcon} style={{ fontSize: '14px' }} />
                </div>
              </div>
            )}
          </div>

          {/* Broadcasts List */}
          <div>
            {getSortedAndFilteredBroadcasts().length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: 'var(--ion-color-medium)',
                opacity: 0.6
              }}>
                <IonIcon icon={radio} style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.3 }} />
                <p style={{ fontSize: '18px', fontWeight: '500', margin: '0 0 8px 0' }}>No broadcasts found</p>
                <p style={{ fontSize: '14px', margin: 0 }}>
                  {searchQuery || filterBy !== 'all' 
                    ? 'Try adjusting your search or filters' 
                    : 'Start by adding your first broadcast'}
                </p>
              </div>
            ) : (
              getSortedAndFilteredBroadcasts().map((broadcast) => (
                <div
                  key={`${broadcast.type}-${broadcast._id || broadcast.id || Math.random()}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: 'var(--ion-card-background)',
                    border: '1px solid var(--ion-color-step-200)',
                    position: 'relative',
                    overflow: 'hidden',
                    marginBottom: '10px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#6366f140';
                    e.currentTarget.style.background = '#6366f108';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px #6366f120';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--ion-color-step-200)';
                    e.currentTarget.style.background = 'var(--ion-card-background)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  onClick={() => openEditPage(broadcast)}
                >
                  {/* Left accent line */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '3px',
                    height: '100%',
                    background: broadcast.isPublished ? '#10b981' : '#f59e0b',
                    opacity: 0.8
                  }} />

                  {/* Thumbnail */}
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    position: 'relative',
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {broadcast.thumbnailUrl ? (
                      <img 
                        src={broadcast.thumbnailUrl.startsWith('/uploads') ? `${BACKEND_BASE_URL}${broadcast.thumbnailUrl}` : broadcast.thumbnailUrl} 
                        alt={broadcast.title || 'Broadcast'}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          position: 'absolute',
                          top: 0,
                          left: 0
                        }}
                        onError={(e) => {
                          if (broadcast.thumbnailUrl && !failedThumbnails.has(broadcast._id || broadcast.id)) {
                            (e.target as HTMLImageElement).src = DEFAULT_RADIO_THUMBNAIL;
                            setFailedThumbnails(prev => new Set(prev).add(broadcast._id || broadcast.id));
                          }
                        }}
                      />
                    ) : (
                      <IonIcon icon={broadcast.type === 'live' ? radio : playCircle} style={{ fontSize: '28px', color: 'white', opacity: 0.8 }} />
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: 'var(--ion-text-color)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        {broadcast.title || 'Untitled'}
                      </p>
                    </div>
                    <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: 'var(--ion-color-medium)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {broadcast.speaker || 'Dove Church'}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--ion-color-medium)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <IonIcon icon={calendar} style={{ fontSize: '12px' }} />
                        {new Date(broadcast.publishedAt || broadcast.broadcastStartTime || broadcast.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--ion-color-medium)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <IonIcon icon={broadcast.type === 'podcast' ? musicalNote : eye} style={{ fontSize: '12px' }} />
                        {broadcast.type === 'podcast' ? (broadcast.listens || 0) : (broadcast.viewCount || 0)}
                      </p>
                    </div>
                  </div>

                  {/* Action buttons with status badge above */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    {/* Status Badge - positioned above action buttons */}
                    <div style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: '500',
                      background: broadcast.isPublished ? '#10b98120' : '#f59e0b20',
                      color: broadcast.isPublished ? '#10b981' : '#f59e0b',
                      whiteSpace: 'nowrap'
                    }}>
                      {broadcast.isPublished ? 'Published' : 'Draft'}
                    </div>
                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div
                        onClick={(e) => { e.stopPropagation(); toggleStatus(broadcast._id || broadcast.id); }}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          background: broadcast.isPublished ? '#10b98115' : '#f59e0b15',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = broadcast.isPublished ? '#10b98125' : '#f59e0b25'}
                        onMouseLeave={(e) => e.currentTarget.style.background = broadcast.isPublished ? '#10b98115' : '#f59e0b15'}
                      >
                        <IonIcon 
                          icon={broadcast.isPublished ? eyeOff : eye} 
                          style={{ fontSize: '16px', color: broadcast.isPublished ? '#10b981' : '#f59e0b' }} 
                        />
                      </div>
                      <div
                        onClick={(e) => { e.stopPropagation(); openActionSheet(broadcast); }}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          background: '#64748b15',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#64748b25'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#64748b15'}
                      >
                        <IonIcon icon={ellipsisVertical} style={{ fontSize: '16px', color: 'var(--ion-color-medium)' }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '28px', paddingTop: '16px', borderTop: '1px solid var(--ion-color-step-200)' }}>
            <IonText style={{ color: 'var(--ion-text-color)', opacity: 0.4, fontSize: '11px' }}>
              Dove Church • Admin Panel v2.0
            </IonText>
          </div>
        </div>

        {/* FAB for adding new broadcast */}
        <IonFab
          horizontal="end"
          vertical="bottom"
          slot="fixed"
          style={{
            '--background': '#6366f1',
            '--box-shadow': '0 6px 20px rgba(99, 102, 241, 0.4)',
            'marginBottom': '70px',
            'marginRight': '16px'
          } as any}
        >
          <IonFabButton onClick={() => history.push('/admin/radio/add')}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        {/* Delete Confirmation Alert */}
        <IonAlert
          isOpen={showDeleteConfirm}
          onDidDismiss={() => setShowDeleteConfirm(false)}
          header="Delete Broadcast"
          message="Are you sure you want to delete this broadcast? This action cannot be undone."
          buttons={[
            { text: 'Cancel', role: 'cancel' },
            { text: 'Delete', role: 'destructive', handler: deleteBroadcast }
          ]}
        />

        {/* General Alert */}
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="Alert"
          message={alertMessage}
          buttons={['OK']}
        />

        {/* Action Sheet */}
        <IonActionSheet
          isOpen={showActionSheet}
          onDidDismiss={() => setShowActionSheet(false)}
          header={selectedBroadcast?.title || 'Broadcast Options'}
          buttons={[
            {
              text: 'Edit',
              icon: create,
              handler: () => {
                if (selectedBroadcast) openEditPage(selectedBroadcast);
              }
            },
            {
              text: selectedBroadcast?.isPublished ? 'Unpublish' : 'Publish',
              icon: selectedBroadcast?.isPublished ? eyeOff : eye,
              handler: () => {
                if (selectedBroadcast) toggleStatus(selectedBroadcast._id || selectedBroadcast.id);
              }
            },
            {
              text: 'Delete',
              icon: trash,
              role: 'destructive',
              handler: () => {
                if (selectedBroadcast) confirmDeleteBroadcast(selectedBroadcast);
              }
            },
            {
              text: 'Cancel',
              icon: arrowBack,
              role: 'cancel'
            }
          ]}
        />

        {loading && podcasts.length === 0 && liveBroadcasts.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: 'var(--ion-color-medium)',
            opacity: 0.6
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid var(--ion-color-step-200)',
              borderTop: '3px solid var(--ion-color-primary)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }} />
            <p style={{ fontSize: '14px', margin: 0 }}>Loading broadcasts...</p>
          </div>
        ) : null}

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </IonContent>
    </IonPage>
  );
};

export default AdminRadioManager;