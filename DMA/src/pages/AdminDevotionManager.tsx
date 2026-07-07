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
  book,
  eye,
  eyeOff,
  ellipsisVertical,
  arrowBack,
  calendar,
  star,
  time,
  search,
  closeCircle as closeIcon,
  people,
  checkmarkCircle,
  flame
} from 'ionicons/icons';
import { useSocket } from '../contexts/SocketContext';
import { apiService, BACKEND_BASE_URL } from '../services/api';
import './AdminManager.css';

const PAGE_SIZE = 20;

const AdminDevotionManager: React.FC = () => {
  const history = useHistory();
  const [devotions, setDevotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [devotionsLoading, setDevotionsLoading] = useState<boolean>(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [devotionToDelete, setDevotionToDelete] = useState<any>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [selectedDevotion, setSelectedDevotion] = useState<any>(null);
  const [sortBy, setSortBy] = useState<string>('date');
  const [filterBy, setFilterBy] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [failedThumbnails, setFailedThumbnails] = useState<Set<string>>(new Set());
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  
  // Default thumbnail for devotions when no custom thumbnail is uploaded
  const DEFAULT_DEVOTION_THUMBNAIL = '/hero-evangelism.jpg';
  
  // Socket.io real-time updates
  const { isConnected, onDevotionCreated, onDevotionUpdated, onDevotionDeleted } = useSocket();

  // Helper function to clear API cache for devotions
  const clearDevotionsCache = () => {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('api_cache_') && key.includes('/devotions')) {
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
    
    if (error.message?.includes('Devotion not found') || error.message?.includes('404')) {
      console.log(`🗑️ Resource not found during ${action}, clearing cache and refreshing`);
      clearDevotionsCache();
      sessionStorage.setItem('devotionsNeedRefresh', 'true');
      setTimeout(() => loadDevotions(true), 1000);
      return true; // Error was handled
    }
    
    return false; // Error was not handled, show generic message
  };

  // Check if devotion data might be stale and needs refresh
  const isDataStale = () => {
    try {
      const cacheKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('api_cache_') && key.includes('/devotions')
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
      console.log('🔌 AdminDevotionManager: Setting up Socket.io listeners');
      
      onDevotionCreated((data: any) => {
        console.log('📥 Received devotion:created event:', data);
        if (data.devotion) {
          setDevotions(prev => [data.devotion, ...prev]);
          clearDevotionsCache();
          sessionStorage.setItem('devotionsNeedRefresh', 'true');
        }
      });

      onDevotionUpdated((data: any) => {
        console.log('📥 Received devotion:updated event:', data);
        if (data.devotion) {
          setDevotions(prev => 
            prev.map(d => d._id === data.devotion._id ? data.devotion : d)
          );
          clearDevotionsCache();
          sessionStorage.setItem('devotionsNeedRefresh', 'true');
        }
      });

      onDevotionDeleted((data: any) => {
        console.log('📥 Received devotion:deleted event:', data);
        if (data.id) {
          setDevotions(prev => prev.filter(d => d._id !== data.id));
          clearDevotionsCache();
          sessionStorage.setItem('devotionsNeedRefresh', 'true');
        }
      });
    }

    // Check if refresh is needed on component mount
    const needsRefresh = sessionStorage.getItem('devotionsNeedRefresh') === 'true';
    const staleData = isDataStale();
    const shouldRefresh = needsRefresh || staleData;
    
    console.log('📱 AdminDevotionManager mounted, needsRefresh:', needsRefresh, 'staleData:', staleData);
    loadDevotions(shouldRefresh);
  }, [isConnected]);

  // Reload devotions when page becomes active (e.g., when returning from Add/Edit pages)
  useIonViewWillEnter(() => {
    const needsRefresh = sessionStorage.getItem('devotionsNeedRefresh') === 'true';
    if (needsRefresh) {
      console.log('🔄 Refreshing devotions due to navigation back from add/edit page');
      loadDevotions(true);
    } else if (devotions.length === 0) {
      // Only load if no devotions exist
      loadDevotions();
    }
  });

  const loadDevotions = async (forceRefresh = false) => {
    // Check for refresh flag in sessionStorage
    const needsRefresh = sessionStorage.getItem('devotionsNeedRefresh') === 'true';
    
    // Prevent multiple concurrent calls, but always allow refresh when needed
    if (!forceRefresh && !needsRefresh && devotionsLoading) return;

    try {
      setDevotionsLoading(true);
      setLoading(true);
      console.log('Loading devotions from API...');
      
      // Clear refresh flag if it exists
      if (needsRefresh) {
        sessionStorage.removeItem('devotionsNeedRefresh');
        console.log('🔄 Refresh flag detected and cleared');
        
        // Also clear the cache when refresh is needed
        clearDevotionsCache();
      }
      
      // Load all devotions (both published and drafts) for admin
      const response = await apiService.getDevotions({ limit: 100, published: 'all' });
      console.log('Devotions loaded:', response.devotions?.length || 0);
      setDevotions(response.devotions || []);
    } catch (error: any) {
      console.error('Error loading devotions:', error);
      
      if (!handleApiError(error, 'loading devotions')) {
        setAlertMessage('Failed to load devotions. Please try again.');
        setShowAlert(true);
        setDevotions([]);
      }
    } finally {
      setLoading(false);
      setDevotionsLoading(false);
    }
  };

  const handleRefresh = async (event: CustomEvent) => {
    await loadDevotions();
    event.detail.complete();
  };

  const toggleStatus = async (id: string) => {
    try {
      const devotion = devotions.find(d => d._id === id);
      if (!devotion) {
        console.warn('Devotion not found in local state:', id);
        setAlertMessage('Devotion not found. Refreshing devotion list...');
        setShowAlert(true);
        await loadDevotions(true);
        return;
      }

      const newStatus = devotion.status === 'publish' ? 'draft' : 'publish';
      await apiService.updateDevotion(id, { status: newStatus });

      // Update local state immediately for instant feedback
      setDevotions(devotions.map(d => 
        d._id === id ? { ...d, status: newStatus } : d
      ));

      setAlertMessage(`Devotion ${newStatus === 'publish' ? 'published' : 'unpublished'} successfully!`);
      setShowAlert(true);

      // Also trigger a refresh to ensure data consistency
      console.log('🔄 Refreshing devotion list after status change');
      sessionStorage.setItem('devotionsNeedRefresh', 'true');
      setTimeout(() => loadDevotions(true), 500);
    } catch (error: any) {
      console.error('Error toggling devotion status:', error);
      
      if (error.message?.includes('Devotion not found') || error.message?.includes('404')) {
        console.log('🗑️ Devotion not found in database, removing from local state');
        setDevotions(devotions.filter(d => d._id !== id));
        setAlertMessage('This devotion no longer exists and has been removed from the list.');
        setShowAlert(true);
        sessionStorage.setItem('devotionsNeedRefresh', 'true');
        setTimeout(() => loadDevotions(true), 1000);
      } else {
        setAlertMessage('Failed to update devotion status. Please try again.');
        setShowAlert(true);
      }
    }
  };

  const toggleFeatured = async (id: string) => {
    try {
      const devotion = devotions.find(d => d._id === id);
      if (!devotion) {
        console.warn('Devotion not found in local state:', id);
        return;
      }

      const newFeatured = !devotion.isFeatured;
      await apiService.updateDevotion(id, { isFeatured: newFeatured });

      // Update local state immediately for instant feedback
      setDevotions(devotions.map(d => 
        d._id === id ? { ...d, isFeatured: newFeatured } : d
      ));

      setAlertMessage(`Devotion ${newFeatured ? 'featured' : 'unfeatured'} successfully!`);
      setShowAlert(true);

      sessionStorage.setItem('devotionsNeedRefresh', 'true');
      setTimeout(() => loadDevotions(true), 500);
    } catch (error: any) {
      console.error('Error toggling featured:', error);
      setAlertMessage('Failed to update featured status. Please try again.');
      setShowAlert(true);
    }
  };

  const confirmDeleteDevotion = (devotion: any) => {
    setDevotionToDelete(devotion);
    setShowDeleteConfirm(true);
  };

  const deleteDevotion = async () => {
    if (!devotionToDelete) return;

    try {
      await apiService.deleteDevotion(devotionToDelete._id);

      // Update local state immediately for instant feedback
      setDevotions(devotions.filter(d => d._id !== devotionToDelete._id));

      setAlertMessage('Devotion deleted successfully!');
      setShowAlert(true);

      // Also trigger a refresh to ensure data consistency
      console.log('🔄 Refreshing devotion list after deletion');
      sessionStorage.setItem('devotionsNeedRefresh', 'true');
      setTimeout(() => loadDevotions(true), 500);
    } catch (error: any) {
      console.error('Error deleting devotion:', error);
      
      if (error.message?.includes('Devotion not found') || error.message?.includes('404')) {
        console.log('🗑️ Devotion not found in database, removing from local state');
        setDevotions(devotions.filter(d => d._id !== devotionToDelete._id));
        setAlertMessage('This devotion no longer exists and has been removed from the list.');
        setShowAlert(true);
        sessionStorage.setItem('devotionsNeedRefresh', 'true');
        setTimeout(() => loadDevotions(true), 1000);
      } else {
        setAlertMessage('Failed to delete devotion. Please try again.');
        setShowAlert(true);
      }
    } finally {
      setShowDeleteConfirm(false);
      setDevotionToDelete(null);
    }
  };

  const openEditPage = (devotion: any) => {
    history.push(`/admin/devotions/edit/${devotion._id}`, { devotion });
  };

  const openActionSheet = (devotion: any) => {
    setSelectedDevotion(devotion);
    setShowActionSheet(true);
  };

  const handleStatClick = (statType: string) => {
    setFilterBy(statType === 'published' || statType === 'draft' ? statType : 'all');
  };

  const handleInfiniteScroll = async (ev: CustomEvent) => {
    setTimeout(() => {
      setDisplayCount(prev => prev + PAGE_SIZE);
      (ev.target as HTMLIonInfiniteScrollElement).complete();
    }, 300);
  };

  // Calculate stats
  const totalDevotions = devotions.length;
  const publishedDevotions = devotions.filter(d => d.status === 'publish').length;
  const draftDevotions = devotions.filter(d => d.status === 'draft').length;
  const featuredDevotions = devotions.filter(d => d.isFeatured).length;

  const statsModules = [
    { name: 'Total Devotions', icon: book, color: '#8b5cf6', val: totalDevotions, sub: 'devotions' },
    { name: 'Published', icon: eye, color: '#10b981', val: publishedDevotions, sub: 'devotions' },
    { name: 'Drafts', icon: closeIcon, color: '#f59e0b', val: draftDevotions, sub: 'devotions' },
    { name: 'Featured', icon: star, color: '#ec4899', val: featuredDevotions, sub: 'featured' }
  ];

  const getSortedAndFilteredDevotions = () => {
    let filtered = devotions;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(d => 
        d.title?.toLowerCase().includes(query) || 
        d.content?.toLowerCase().includes(query)
      );
    }

    // Apply filter
    if (filterBy === 'published') {
      filtered = filtered.filter(d => d.status === 'publish');
    } else if (filterBy === 'draft') {
      filtered = filtered.filter(d => d.status === 'draft');
    } else if (filterBy === 'featured') {
      filtered = filtered.filter(d => d.isFeatured);
    }

    // Apply sorting
    let sorted = [...filtered];
    switch (sortBy) {
      case 'date':
        sorted.sort((a, b) => {
          const dateA = new Date(a.date || a.createdAt || 0);
          const dateB = new Date(b.date || b.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        });
        break;
      case 'title':
        sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      default:
        break;
    }

    return sorted;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const sortedDevotions = getSortedAndFilteredDevotions();
  const displayedDevotions = sortedDevotions.slice(0, displayCount);
  const hasMore = displayCount < sortedDevotions.length;

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <IonButton fill="clear" slot="start" onClick={() => history.goBack()} style={{ marginLeft: '4px' }}>
            <IonIcon icon={arrowBack} style={{ fontSize: '22px' }} />
          </IonButton>
          <IonTitle className="title-ios" style={{ textAlign: 'left', marginLeft: '-16px' }}>Devotion Manager</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
        <div className="am-page">
          <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
            <IonRefresherContent />
          </IonRefresher>

          {/* Stats Modules */}
          <div className="am-stats">
            {statsModules.map((mod, i) => (
              <div key={i} className="am-stat-pill" onClick={() => {
                if (mod.name === 'Total Devotions') setFilterBy('all');
                else if (mod.name === 'Published') setFilterBy(filterBy === 'published' ? 'all' : 'published');
                else if (mod.name === 'Drafts') setFilterBy(filterBy === 'draft' ? 'all' : 'draft');
                else if (mod.name === 'Featured') setFilterBy('featured');
              }}>
                <div className="am-stat-dot" style={{ background: mod.color }} />
                <div className="am-stat-data">
                  <span className="am-stat-num" style={{ color: mod.color }}>{mod.val}</span>
                  <span className="am-stat-txt">{mod.sub}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Search Bar */}
          <div className="am-search">
            <div className="am-search-box">
              <IonIcon icon={search} />
              <input
                type="text"
                placeholder="Search devotions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Active Filter Badge */}
          {filterBy !== 'all' && (
            <div className="am-filter-badge">
              <span className="am-filter-badge-text">
                Filter: {filterBy.charAt(0).toUpperCase() + filterBy.slice(1)}
              </span>
              <div className="am-filter-badge-close" onClick={() => setFilterBy('all')}>
                <IonIcon icon={closeIcon} style={{ fontSize: '14px' }} />
              </div>
            </div>
          )}

          {/* Devotions List */}
          <div className="am-list">
            {displayedDevotions.length === 0 ? (
              <div className="am-empty">
                <IonIcon icon={book} />
                <p className="am-empty-title">No devotions found</p>
                <p className="am-empty-text">
                  {searchQuery || filterBy !== 'all' 
                    ? 'Try adjusting your search or filters' 
                    : 'Start by adding your first devotion'}
                </p>
              </div>
            ) : (
              displayedDevotions.map((devotion) => (
                <div
                  key={devotion._id}
                  className="am-card"
                  onClick={() => openEditPage(devotion)}
                >
                  {/* Left accent line */}
                  <div className={`am-accent ${devotion.status === 'publish' ? 'green' : 'amber'}`} />

                  {/* Thumbnail */}
                  <div className="am-thumb">
                    <img 
                      src={devotion.thumbnailUrl || DEFAULT_DEVOTION_THUMBNAIL} 
                      alt={devotion.title || 'Devotion'}
                      onError={(e) => {
                        if (devotion.thumbnailUrl && !failedThumbnails.has(devotion._id)) {
                          (e.target as HTMLImageElement).src = DEFAULT_DEVOTION_THUMBNAIL;
                          setFailedThumbnails(prev => new Set(prev).add(devotion._id));
                        }
                      }}
                    />
                    {devotion.isFeatured && (
                      <div className="am-thumb-badge" style={{ top: '2px', right: '2px', bottom: 'auto', left: 'auto', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ec4899', border: '2px solid var(--ion-card-background)' }}>
                        <IonIcon icon={star} style={{ fontSize: '8px', color: 'white' }} />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="am-content">
                    <p className="am-title">{devotion.title || 'Untitled'}</p>
                    <p className="am-subtitle">
                      {devotion.content ? devotion.content.substring(0, 80) + (devotion.content.length > 80 ? '...' : '') : 'No description'}
                    </p>
                    <div className="am-meta">
                      <p className="am-meta-item">
                        <IonIcon icon={book} />
                        {devotion.scripture || 'No scripture'}
                      </p>
                    </div>
                  </div>

                  {/* Action buttons with status badge above */}
                  <div className="am-actions">
                    {/* Status Badge */}
                    <div className={`am-status ${devotion.status === 'publish' ? 'published' : 'draft'}`}>
                      {devotion.status === 'publish' ? 'Published' : 'Draft'}
                    </div>
                    {/* Action buttons */}
                    <div className="am-btns">
                      <div
                        className={`am-btn toggle ${devotion.status !== 'publish' ? 'inactive' : ''}`}
                        onClick={(e) => { e.stopPropagation(); toggleStatus(devotion._id); }}
                      >
                        <IonIcon 
                          icon={devotion.status === 'publish' ? eyeOff : eye} 
                          style={{ color: devotion.status === 'publish' ? '#10b981' : '#f59e0b' }}
                        />
                      </div>
                      <div
                        className={`am-btn featured ${devotion.isFeatured ? 'active' : ''}`}
                        onClick={(e) => { e.stopPropagation(); toggleFeatured(devotion._id); }}
                      >
                        <IonIcon 
                          icon={star} 
                          style={{ color: devotion.isFeatured ? '#f59e0b' : 'var(--ion-color-medium)' }}
                        />
                      </div>
                      <div
                        className="am-btn more"
                        onClick={(e) => { e.stopPropagation(); openActionSheet(devotion); }}
                      >
                        <IonIcon icon={ellipsisVertical} style={{ color: 'var(--ion-color-medium)' }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Infinite Scroll */}
          {hasMore && (
            <IonInfiniteScroll onIonInfinite={handleInfiniteScroll}>
              <IonInfiniteScrollContent />
            </IonInfiniteScroll>
          )}

          {/* Footer */}
          <div className="am-footer">
            <IonText>Dove Church • Admin Panel v2.0</IonText>
          </div>
        </div>

        {/* FAB for adding new devotion */}
        <IonFab
          horizontal="end"
          vertical="bottom"
          slot="fixed"
          style={{
            '--background': '#8b5cf6',
            '--box-shadow': '0 6px 20px rgba(139, 92, 246, 0.4)',
            'marginBottom': '70px',
            'marginRight': '16px'
          } as any}
        >
          <IonFabButton onClick={() => history.push('/admin/devotions/add')}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>
      </IonContent>

      {/* Delete Confirmation Alert */}
      <IonAlert
        isOpen={showDeleteConfirm}
        onDidDismiss={() => setShowDeleteConfirm(false)}
        header="Delete Devotion"
        message="Are you sure you want to delete this devotion? This action cannot be undone."
        buttons={[
          { text: 'Cancel', role: 'cancel' },
          { text: 'Delete', role: 'destructive', handler: deleteDevotion }
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
        header={selectedDevotion?.title || 'Devotion Options'}
        options={[
          {
            text: 'Edit',
            icon: create,
            handler: () => {
              if (selectedDevotion) openEditPage(selectedDevotion);
            }
          },
          {
            text: selectedDevotion?.status === 'publish' ? 'Unpublish' : 'Publish',
            icon: selectedDevotion?.status === 'publish' ? eyeOff : eye,
            handler: () => {
              if (selectedDevotion) toggleStatus(selectedDevotion._id);
            }
          },
          {
            text: selectedDevotion?.isFeatured ? 'Remove Featured' : 'Mark as Featured',
            icon: star,
            handler: () => {
              if (selectedDevotion) toggleFeatured(selectedDevotion._id);
            }
          },
          {
            text: 'Delete',
            icon: trash,
            role: 'destructive',
            handler: () => {
              if (selectedDevotion) confirmDeleteDevotion(selectedDevotion);
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

      {loading && devotions.length === 0 && (
        <div className="am-loading">
          <div className="am-loading-spinner" />
          <p>Loading devotions...</p>
        </div>
      )}
    </IonPage>
  );
};

export default AdminDevotionManager;
