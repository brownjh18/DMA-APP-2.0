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
  IonFab,
  IonFabButton,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  useIonViewWillEnter
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import AdminPopover from '../components/AdminPopover';
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
  time,
  search,
  closeCircle as closeIcon,
  checkmarkCircle,
  calendar,
  stop as stopIcon
} from 'ionicons/icons';
import { useSocket } from '../contexts/SocketContext';
import { apiService, BACKEND_BASE_URL } from '../services/api';
import './AdminManager.css';

const PAGE_SIZE = 20;

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
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);

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

  const handleInfiniteScroll = async (ev: any) => {
    const all = getSortedAndFilteredBroadcasts();
    if (displayCount >= all.length) {
      ev.target.complete();
      return;
    }
    setTimeout(() => {
      setDisplayCount(prev => prev + PAGE_SIZE);
      ev.target.complete();
    }, 300);
  };

  const toggleStatus = async (id: string) => {
    try {
      const podcast = podcasts.find(p => p._id === id);
      const liveBroadcast = liveBroadcasts.find(b => b._id === id);

      if (podcast) {
        const newStatus = podcast.status === 'published' ? 'draft' : 'published';
        const fd = new FormData();
        fd.append('status', newStatus);
        await apiService.updatePodcast(id, fd);

        setPodcasts(podcasts.map(p =>
          p._id === id ? { ...p, status: newStatus } : p
        ));

        setAlertMessage(`Podcast ${newStatus === 'published' ? 'published' : 'unpublished'} successfully!`);
        setShowAlert(true);
        sessionStorage.setItem('podcastsNeedRefresh', 'true');
        setTimeout(() => loadPodcasts(true), 500);
      } else if (liveBroadcast) {
        const newStatus = liveBroadcast.status === 'published' ? 'draft' : 'published';
        await apiService.updateLiveBroadcast(id, { isPublished: newStatus === 'published' });

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

  const endLiveBroadcast = async (id: string) => {
    try {
      await apiService.stopLiveBroadcast(id);
      setAlertMessage('Live broadcast ended successfully!');
      setShowAlert(true);
      sessionStorage.setItem('podcastsNeedRefresh', 'true');
      setTimeout(() => loadPodcasts(true), 500);
    } catch (error: any) {
      console.error('Error ending live broadcast:', error);
      setAlertMessage(`Failed to end live broadcast: ${error.message || 'Please try again.'}`);
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

      if (error.message?.includes('not found') || error.message?.includes('404')) {
        console.log('🗑️ Broadcast not found in database, removing from local state');
        setPodcasts(podcasts.filter(p => p._id !== broadcastToDelete._id));
        setLiveBroadcasts(liveBroadcasts.filter(broadcast => broadcast._id !== broadcastToDelete._id));
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
  const statsModules = [
    { name: 'Total Broadcasts', icon: radio, color: '#6366f1', val: totalBroadcasts, sub: 'broadcasts' },
    { name: 'Published', icon: eye, color: '#10b981', val: publishedBroadcasts, sub: 'broadcasts' },
    { name: 'Drafts', icon: closeIcon, color: '#f59e0b', val: draftBroadcasts, sub: 'broadcasts' }
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
      default:
        break;
    }

    return sorted;
  };

  const visibleBroadcasts = getSortedAndFilteredBroadcasts().slice(0, displayCount);

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <IonButton fill="clear" slot="start" onClick={() => history.goBack()} style={{ marginLeft: '4px' }}>
            <IonIcon icon={arrowBack} style={{ fontSize: '22px' }} />
          </IonButton>
          <IonTitle className="title-ios" style={{ textAlign: 'left', marginLeft: '-16px' }}>Radio Manager</IonTitle>

        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
        <div className="am-page">

          {/* Stats */}
          <div className="am-stats">
            {statsModules.map((mod, i) => (
              <div key={i} className="am-stat-pill" onClick={() => {
                if (mod.name === 'Total Broadcasts') setFilterBy('all');
                else if (mod.name === 'Published') setFilterBy(filterBy === 'published' ? 'all' : 'published');
                else if (mod.name === 'Drafts') setFilterBy(filterBy === 'draft' ? 'all' : 'draft');
              }}>
                <div className="am-stat-dot" style={{ background: mod.color }} />
                <div className="am-stat-data">
                  <span className="am-stat-num" style={{ color: mod.color }}>{mod.val}</span>
                  <span className="am-stat-txt">{mod.sub}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="am-search">
            <div className="am-search-box">
              <IonIcon icon={search} />
              <input
                type="text"
                placeholder="Search podcasts & broadcasts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Active Filter Badge */}
          {filterBy !== 'all' && (
            <div className="am-filter-badge">
              <IonText className="am-filter-badge-text">
                Filter: {filterBy.charAt(0).toUpperCase() + filterBy.slice(1)}
              </IonText>
              <div className="am-filter-badge-close" onClick={() => setFilterBy('all')}>
                <IonIcon icon={closeIcon} style={{ fontSize: '14px' }} />
              </div>
            </div>
          )}

          {/* Broadcasts List */}
          <div className="am-list">
            {visibleBroadcasts.length === 0 ? (
              <div className="am-empty">
                <IonIcon icon={radio} />
                <p className="am-empty-title">No broadcasts found</p>
                <p className="am-empty-text">
                  {searchQuery || filterBy !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Start by adding your first broadcast'}
                </p>
              </div>
            ) : (
              visibleBroadcasts.map((broadcast) => (
                <div
                  key={`${broadcast.type}-${broadcast._id || broadcast.id || Math.random()}`}
                  className="am-card"
                  onClick={() => openEditPage(broadcast)}
                >
                  {/* Left accent line */}
                  <div className={`am-accent ${broadcast.isPublished ? 'green' : 'amber'}`} />

                  {/* Thumbnail */}
                  <div className="am-thumb">
                    {broadcast.thumbnailUrl ? (
                      <img
                        src={broadcast.thumbnailUrl.startsWith('/uploads') ? `${BACKEND_BASE_URL}${broadcast.thumbnailUrl}` : broadcast.thumbnailUrl}
                        alt={broadcast.title || 'Broadcast'}
                        onError={(e) => {
                          if (broadcast.thumbnailUrl && !failedThumbnails.has(broadcast._id || broadcast.id)) {
                            (e.target as HTMLImageElement).src = DEFAULT_RADIO_THUMBNAIL;
                            setFailedThumbnails(prev => new Set(prev).add(broadcast._id || broadcast.id));
                          }
                        }}
                      />
                    ) : (
                      <IonIcon icon={broadcast.type === 'live' ? radio : playCircle} className="am-thumb-icon" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="am-content">
                    <p className="am-title">
                      {broadcast.title || 'Untitled'}
                    </p>
                    <p className="am-subtitle">
                      {broadcast.speaker || 'Dove Church'}
                    </p>
                    <div className="am-meta">
                      <p className="am-meta-item">
                        <IonIcon icon={calendar} />
                        {new Date(broadcast.publishedAt || broadcast.broadcastStartTime || broadcast.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {/* Action buttons with status badge above */}
                  <div className="am-actions">
                    <div className={`am-status ${broadcast.isPublished ? 'published' : 'draft'}`}>
                      {broadcast.isPublished ? 'Published' : 'Draft'}
                    </div>
                    <div className="am-btns">
                      {broadcast.isLive && broadcast.type === 'live' && (
                        <div
                          className="am-btn end-live"
                          onClick={(e) => { e.stopPropagation(); endLiveBroadcast(broadcast._id || broadcast.id); }}
                          title="End live broadcast"
                        >
                          <IonIcon icon={stopIcon} />
                        </div>
                      )}
                      <div
                        className={`am-btn toggle ${broadcast.isPublished ? '' : 'inactive'}`}
                        onClick={(e) => { e.stopPropagation(); toggleStatus(broadcast._id || broadcast.id); }}
                      >
                        <IonIcon icon={broadcast.isPublished ? eyeOff : eye} />
                      </div>
                      <div
                        className="am-btn more"
                        onClick={(e) => { e.stopPropagation(); openActionSheet(broadcast); }}
                      >
                        <IonIcon icon={ellipsisVertical} />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Infinite Scroll */}
            {visibleBroadcasts.length > 0 && (
              <IonInfiniteScroll onIonInfinite={handleInfiniteScroll} threshold="100px">
                <IonInfiniteScrollContent />
              </IonInfiniteScroll>
            )}
          </div>

          {/* Footer */}
          <div className="am-footer">
            <IonText>
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

        {/* Action Popover */}
        <AdminPopover
          isOpen={showActionSheet}
          onDidDismiss={() => setShowActionSheet(false)}
          header={selectedBroadcast?.title || 'Broadcast Options'}
          options={[
            {
              text: 'Edit',
              icon: create,
              handler: () => {
                if (selectedBroadcast) openEditPage(selectedBroadcast);
              }
            },
            ...(selectedBroadcast?.isLive && selectedBroadcast?.type === 'live' ? [{
              text: 'End Live Broadcast',
              icon: stopIcon,
              handler: () => {
                if (selectedBroadcast) endLiveBroadcast(selectedBroadcast._id || selectedBroadcast.id);
              }
            }] : []),
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
              role: 'cancel',
              handler: () => {}
            }
          ]}
        />

        {/* Loading */}
        {loading && podcasts.length === 0 && liveBroadcasts.length === 0 ? (
          <div className="am-loading">
            <div className="am-loading-spinner" />
            <p>Loading broadcasts...</p>
          </div>
        ) : null}

      </IonContent>
    </IonPage>
  );
};

export default AdminRadioManager;
