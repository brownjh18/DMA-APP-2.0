import React, { useState, useEffect, useRef } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  IonText,
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
  playCircle,
  eye,
  eyeOff,
  ellipsisVertical,
  arrowBack,
  calendar,
  search,
  closeCircle as closeIcon,
  settings,
  trendingUp
} from 'ionicons/icons';
import { apiService, BACKEND_BASE_URL } from '../services/api';
import './AdminSermonManager.css';

const PAGE_SIZE = 20;

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
  const [failedThumbnails, setFailedThumbnails] = useState<Set<string>>(new Set());

  // Pagination state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const infiniteRef = useRef<HTMLIonInfiniteScrollElement>(null);

  const DEFAULT_SERMON_THUMBNAIL = '/hero-evangelism.jpg';

  const clearSermonsCache = () => {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('api_cache_') && key.includes('/sermons')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Error clearing cache:', error);
    }
  };

  const handleApiError = (error: any, action: string) => {
    console.error(`Error ${action}:`, error);
    if (error.message?.includes('Sermon not found') || error.message?.includes('404')) {
      clearSermonsCache();
      sessionStorage.setItem('sermonsNeedRefresh', 'true');
      setTimeout(() => loadSermons(true), 1000);
      return true;
    }
    return false;
  };

  const isDataStale = () => {
    try {
      const cacheKeys = Object.keys(localStorage).filter(key =>
        key.startsWith('api_cache_') && key.includes('/sermons')
      );
      for (const key of cacheKeys) {
        const cached = localStorage.getItem(key);
        if (cached) {
          const parsed = JSON.parse(cached);
          const age = Date.now() - parsed.timestamp;
          if (age > 5 * 60 * 1000) return true;
        }
      }
    } catch (error) {
      console.warn('Error checking cache age:', error);
    }
    return false;
  };

  useEffect(() => {
    const needsRefresh = sessionStorage.getItem('sermonsNeedRefresh') === 'true';
    const staleData = isDataStale();
    loadSermons(needsRefresh || staleData);
  }, []);

  useIonViewWillEnter(() => {
    const needsRefresh = sessionStorage.getItem('sermonsNeedRefresh') === 'true';
    if (needsRefresh) {
      loadSermons(true);
    } else if (sermons.length === 0) {
      loadSermons();
    }
  });

  const loadSermons = async (forceRefresh = false) => {
    const needsRefresh = sessionStorage.getItem('sermonsNeedRefresh') === 'true';
    if (!forceRefresh && !needsRefresh && sermonsLoading) return;

    try {
      setSermonsLoading(true);
      setLoading(true);
      if (needsRefresh) {
        sessionStorage.removeItem('sermonsNeedRefresh');
        clearSermonsCache();
      }
      const response = await apiService.getSermons({ published: 'all', page: 1, limit: PAGE_SIZE });
      const allSermons = response.sermons || [];
      setSermons(allSermons);
      setPage(1);
      setHasMore(allSermons.length >= PAGE_SIZE);
    } catch (error: any) {
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

  const loadMore = async (event: CustomEvent) => {
    if (loadingMore || !hasMore) {
      (event.target as HTMLIonInfiniteScrollElement).complete();
      return;
    }

    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const response = await apiService.getSermons({ published: 'all', page: nextPage, limit: PAGE_SIZE });
      const newSermons = response.sermons || [];

      if (newSermons.length === 0) {
        setHasMore(false);
      } else {
        setSermons(prev => [...prev, ...newSermons]);
        setPage(nextPage);
        setHasMore(newSermons.length >= PAGE_SIZE);
      }
    } catch (error) {
      console.error('Error loading more sermons:', error);
    } finally {
      setLoadingMore(false);
      (event.target as HTMLIonInfiniteScrollElement).complete();
    }
  };

  const toggleStatus = async (id: string) => {
    try {
      const sermon = sermons.find(s => s._id === id);
      if (!sermon) {
        setAlertMessage('Sermon not found. Refreshing sermon list...');
        setShowAlert(true);
        await loadSermons(true);
        return;
      }
      const newStatus = !sermon.isPublished;
      await apiService.toggleSermonPublishStatus(id, newStatus);
      setSermons(sermons.map(s => s._id === id ? { ...s, isPublished: newStatus } : s));
      setAlertMessage(`Sermon ${newStatus ? 'published' : 'unpublished'} successfully!`);
      setShowAlert(true);
      sessionStorage.setItem('sermonsNeedRefresh', 'true');
      setTimeout(() => loadSermons(true), 500);
    } catch (error: any) {
      if (error.message?.includes('Sermon not found') || error.message?.includes('404')) {
        setSermons(sermons.filter(s => s._id !== id));
        setAlertMessage('This sermon no longer exists and has been removed from the list.');
        setShowAlert(true);
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
      setSermons(sermons.filter(s => s._id !== sermonToDelete._id));
      setAlertMessage('Sermon deleted successfully!');
      setShowAlert(true);
      sessionStorage.setItem('sermonsNeedRefresh', 'true');
      setTimeout(() => loadSermons(true), 500);
    } catch (error: any) {
      if (error.message?.includes('Sermon not found') || error.message?.includes('404')) {
        setSermons(sermons.filter(s => s._id !== sermonToDelete._id));
        setAlertMessage('This sermon no longer exists and has been removed from the list.');
        setShowAlert(true);
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

  const totalSermons = sermons.length;
  const publishedSermons = sermons.filter(s => s.isPublished).length;
  const draftSermons = sermons.filter(s => !s.isPublished).length;
  const totalViews = sermons.reduce((acc, s) => acc + (s.viewCount || 0), 0);

  const stats = [
    { label: 'Total', value: totalSermons, icon: playCircle, color: '#6366f1', filter: 'all' },
    { label: 'Published', value: publishedSermons, icon: eye, color: '#10b981', filter: 'published' },
    { label: 'Drafts', value: draftSermons, icon: closeIcon, color: '#f59e0b', filter: 'draft' },
    { label: 'Views', value: totalViews, icon: trendingUp, color: '#8b5cf6', filter: null },
  ];

  const quickActions = [
    { label: 'Add Sermon', icon: add, route: '/admin/sermons/add', color: '#6366f1' },
    { label: 'Published', icon: eye, route: null, color: '#10b981', action: () => setFilterBy(filterBy === 'published' ? 'all' : 'published') },
    { label: 'Drafts', icon: closeIcon, route: null, color: '#f59e0b', action: () => setFilterBy(filterBy === 'draft' ? 'all' : 'draft') },
  ];

  const getSortedAndFilteredSermons = () => {
    let filtered = sermons;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.title?.toLowerCase().includes(query) ||
        s.speaker?.toLowerCase().includes(query)
      );
    }
    if (filterBy === 'published') {
      filtered = filtered.filter(s => s.isPublished === true);
    } else if (filterBy === 'draft') {
      filtered = filtered.filter(s => s.isPublished === false);
    }
    let sorted = [...filtered];
    if (sortBy === 'date') {
      sorted.sort((a, b) => new Date(b.createdAt || b.date || 0).getTime() - new Date(a.createdAt || a.date || 0).getTime());
    } else if (sortBy === 'title') {
      sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }
    return sorted;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const displayedSermons = getSortedAndFilteredSermons();

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <IonButton fill="clear" slot="start" onClick={() => history.goBack()} style={{ marginLeft: '4px' }}>
            <IonIcon icon={arrowBack} style={{ fontSize: '22px' }} />
          </IonButton>
          <IonTitle className="title-ios" style={{ textAlign: 'left', marginLeft: '-16px' }}>Sermon Manager</IonTitle>
          <IonButton fill="clear" slot="end" onClick={() => loadSermons(true)} style={{ marginRight: '12px' }}>
            <IonIcon icon={settings} style={{ animation: sermonsLoading ? 'spin 1s linear infinite' : 'none' }} />
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
        <div className="sm-page">

          {/* Stats Row */}
          <div className="sm-stats">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="sm-stat-pill"
                onClick={() => {
                  if (stat.filter) setFilterBy(filterBy === stat.filter ? 'all' : stat.filter);
                }}
              >
                <div className="sm-stat-dot" style={{ background: stat.color }} />
                <div className="sm-stat-data">
                  <span className="sm-stat-num" style={{ color: stat.color }}>{stat.value}</span>
                  <span className="sm-stat-txt">{stat.label}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="sm-section">
            <div className="sm-section-header">
              <h2 className="sm-section-title">Actions</h2>
            </div>
            <div className="sm-actions-scroll">
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  className="sm-action-chip"
                  onClick={() => action.route ? history.push(action.route) : action.action?.()}
                  style={{ '--chip-color': action.color } as React.CSSProperties}
                >
                  <div className="sm-action-icon">
                    <IonIcon icon={action.icon} />
                  </div>
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <div className="sm-section">
            <div className="sm-search">
              <div className="sm-search-box">
                <IonIcon icon={search} />
                <input
                  type="text"
                  placeholder="Search sermons..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {filterBy !== 'all' && (
              <div className="sm-filter-badge">
                <span className="sm-filter-badge-text">
                  Filter: {filterBy.charAt(0).toUpperCase() + filterBy.slice(1)}
                </span>
                <div className="sm-filter-badge-close" onClick={() => setFilterBy('all')}>
                  <IonIcon icon={closeIcon} style={{ fontSize: '14px' }} />
                </div>
              </div>
            )}
          </div>

          {/* Sermons List */}
          <div className="sm-section">
            <div className="sm-section-header">
              <h2 className="sm-section-title">Sermons</h2>
              <span className="sm-stat-txt">{displayedSermons.length} items</span>
            </div>

            {loading && sermons.length === 0 ? (
              <div className="sm-loading">
                <div className="sm-loading-spinner" />
                <p>Loading sermons...</p>
              </div>
            ) : displayedSermons.length === 0 ? (
              <div className="sm-empty">
                <IonIcon icon={playCircle} />
                <p className="sm-empty-title">No sermons found</p>
                <p className="sm-empty-text">
                  {searchQuery || filterBy !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Start by adding your first sermon'}
                </p>
              </div>
            ) : (
              <>
                <div className="sm-sermon-list">
                  {displayedSermons.map((sermon) => (
                    <div
                      key={sermon._id}
                      className="sm-sermon-card"
                      onClick={() => openEditPage(sermon)}
                    >
                      <div className={`sm-sermon-accent ${sermon.isPublished ? 'published' : 'draft'}`} />

                      <div className="sm-sermon-thumb">
                        <img
                          src={sermon.thumbnailUrl ? (sermon.thumbnailUrl.startsWith('/uploads') ? `${BACKEND_BASE_URL}${sermon.thumbnailUrl}` : sermon.thumbnailUrl) : DEFAULT_SERMON_THUMBNAIL}
                          alt={sermon.title || 'Sermon'}
                          onError={(e) => {
                            if (sermon.thumbnailUrl && !failedThumbnails.has(sermon._id)) {
                              (e.target as HTMLImageElement).src = DEFAULT_SERMON_THUMBNAIL;
                              setFailedThumbnails(prev => new Set(prev).add(sermon._id));
                            }
                          }}
                        />
                        {sermon.duration && (
                          <div className="sm-sermon-duration">{sermon.duration}</div>
                        )}
                      </div>

                      <div className="sm-sermon-content">
                        <p className="sm-sermon-title">{sermon.title || 'Untitled'}</p>
                        <p className="sm-sermon-speaker">{sermon.speaker || 'Dove Church'}</p>
                        <div className="sm-sermon-meta">
                          <p className="sm-sermon-date">
                            <IonIcon icon={calendar} />
                            {sermon.createdAt ? formatDate(sermon.createdAt) : 'No date'}
                          </p>
                        </div>
                      </div>

                      <div className="sm-sermon-actions">
                        <div className={`sm-sermon-status ${sermon.isPublished ? 'published' : 'draft'}`}>
                          {sermon.isPublished ? 'Published' : 'Draft'}
                        </div>
                        <div className="sm-sermon-btns">
                          <div
                            className={`sm-sermon-btn toggle ${sermon.isPublished ? '' : 'draft'}`}
                            onClick={(e) => { e.stopPropagation(); toggleStatus(sermon._id); }}
                          >
                            <IonIcon
                              icon={sermon.isPublished ? eyeOff : eye}
                              style={{ color: sermon.isPublished ? '#10b981' : '#f59e0b' }}
                            />
                          </div>
                          <div
                            className="sm-sermon-btn more"
                            onClick={(e) => { e.stopPropagation(); openActionSheet(sermon); }}
                          >
                            <IonIcon icon={ellipsisVertical} style={{ color: '#8e8e93' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Infinite Scroll */}
                <IonInfiniteScroll
                  ref={infiniteRef}
                  onIonInfinite={loadMore}
                  threshold="100px"
                  disabled={!hasMore || searchQuery.trim() !== '' || filterBy !== 'all'}
                >
                  <IonInfiniteScrollContent
                    loadingText="Loading more sermons..."
                    loadingSpinner="bubbles"
                  />
                </IonInfiniteScroll>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="sm-footer">
            <IonText>Dove Church &bull; Admin Panel v2.0</IonText>
          </div>
        </div>

        {/* FAB */}
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
          <IonFabButton onClick={() => history.push('/admin/sermons/add')}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>
      </IonContent>

      {/* Delete Confirmation */}
      <IonAlert
        isOpen={showDeleteConfirm}
        onDidDismiss={() => setShowDeleteConfirm(false)}
        header="Delete Sermon"
        message="Are you sure you want to delete this sermon? This action cannot be undone."
        buttons={[
          { text: 'Cancel', role: 'cancel' },
          { text: 'Delete', role: 'destructive', handler: deleteSermon }
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
        header={selectedSermon?.title || 'Sermon Options'}
        options={[
          {
            text: 'Edit',
            icon: create,
            handler: () => { if (selectedSermon) openEditPage(selectedSermon); }
          },
          {
            text: selectedSermon?.isPublished ? 'Unpublish' : 'Publish',
            icon: selectedSermon?.isPublished ? eyeOff : eye,
            handler: () => { if (selectedSermon) toggleStatus(selectedSermon._id); }
          },
          {
            text: 'Delete',
            icon: trash,
            role: 'destructive',
            handler: () => { if (selectedSermon) confirmDeleteSermon(selectedSermon); }
          },
          {
            text: 'Cancel',
            icon: arrowBack,
            role: 'cancel',
            handler: () => {}
          }
        ]}
      />

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </IonPage>
  );
};

export default AdminSermonManager;
