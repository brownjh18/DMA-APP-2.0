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
  settings,
  people,
  checkmarkCircle,
  flame
} from 'ionicons/icons';
import { useSocket } from '../contexts/SocketContext';
import { apiService, BACKEND_BASE_URL } from '../services/api';
import './Tab4.css';

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

  return (
    <IonPage>
      <IonHeader translucent>
        <BackButton />
        <IonToolbar className="toolbar-ios">
          <IonTitle className="title-ios">Devotion Manager</IonTitle>
          <IonButton fill="clear" slot="end" onClick={() => loadDevotions(true)} style={{ marginRight: '8px' }}>
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
                  if (mod.name === 'Total Devotions') setFilterBy('all');
                  else if (mod.name === 'Published') setFilterBy(filterBy === 'published' ? 'all' : 'published');
                  else if (mod.name === 'Drafts') setFilterBy(filterBy === 'draft' ? 'all' : 'draft');
                  else if (mod.name === 'Featured') setFilterBy('featured');
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
                  placeholder="Search devotions..."
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

          {/* Devotions List */}
          <div>
            {getSortedAndFilteredDevotions().length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: 'var(--ion-color-medium)',
                opacity: 0.6
              }}>
                <IonIcon icon={book} style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.3 }} />
                <p style={{ fontSize: '18px', fontWeight: '500', margin: '0 0 8px 0' }}>No devotions found</p>
                <p style={{ fontSize: '14px', margin: 0 }}>
                  {searchQuery || filterBy !== 'all' 
                    ? 'Try adjusting your search or filters' 
                    : 'Start by adding your first devotion'}
                </p>
              </div>
            ) : (
              getSortedAndFilteredDevotions().map((devotion) => (
                <div
                  key={devotion._id}
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
                    e.currentTarget.style.borderColor = '#8b5cf640';
                    e.currentTarget.style.background = '#8b5cf608';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px #8b5cf620';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--ion-color-step-200)';
                    e.currentTarget.style.background = 'var(--ion-card-background)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  onClick={() => openEditPage(devotion)}
                >
                  {/* Left accent line */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '3px',
                    height: '100%',
                    background: devotion.status === 'publish' ? '#10b981' : '#f59e0b',
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
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <img 
                      src={devotion.thumbnailUrl || DEFAULT_DEVOTION_THUMBNAIL} 
                      alt={devotion.title || 'Devotion'}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        position: 'absolute',
                        top: 0,
                        left: 0
                      }}
                      onError={(e) => {
                        // If custom thumbnail fails, show default image
                        if (devotion.thumbnailUrl && !failedThumbnails.has(devotion._id)) {
                          (e.target as HTMLImageElement).src = DEFAULT_DEVOTION_THUMBNAIL;
                          setFailedThumbnails(prev => new Set(prev).add(devotion._id));
                        }
                      }}
                    />
                    {devotion.isFeatured && (
                      <div style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        background: '#ec4899',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid var(--ion-card-background)',
                        zIndex: 1
                      }}>
                        <IonIcon icon={star} style={{ fontSize: '8px', color: 'white' }} />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: 'var(--ion-text-color)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        {devotion.title || 'Untitled'}
                      </p>
                    </div>
                    <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: 'var(--ion-color-medium)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {devotion.content ? devotion.content.substring(0, 80) + (devotion.content.length > 80 ? '...' : '') : 'No description'}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--ion-color-medium)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <IonIcon icon={book} style={{ fontSize: '12px' }} />
                        {devotion.scripture || 'No scripture'}
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
                      background: devotion.status === 'publish' ? '#10b98120' : '#f59e0b20',
                      color: devotion.status === 'publish' ? '#10b981' : '#f59e0b',
                      whiteSpace: 'nowrap'
                    }}>
                      {devotion.status === 'publish' ? 'Published' : 'Draft'}
                    </div>
                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div
                        onClick={(e) => { e.stopPropagation(); toggleStatus(devotion._id); }}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          background: devotion.status === 'publish' ? '#10b98115' : '#f59e0b15',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = devotion.status === 'publish' ? '#10b98125' : '#f59e0b25'}
                        onMouseLeave={(e) => e.currentTarget.style.background = devotion.status === 'publish' ? '#10b98115' : '#f59e0b15'}
                      >
                        <IonIcon 
                          icon={devotion.status === 'publish' ? eyeOff : eye} 
                          style={{ fontSize: '16px', color: devotion.status === 'publish' ? '#10b981' : '#f59e0b' }} 
                        />
                      </div>
                      <div
                        onClick={(e) => { e.stopPropagation(); toggleFeatured(devotion._id); }}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          background: devotion.isFeatured ? '#ec489915' : '#64748b15',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = devotion.isFeatured ? '#ec489925' : '#64748b25'}
                        onMouseLeave={(e) => e.currentTarget.style.background = devotion.isFeatured ? '#ec489915' : '#64748b15'}
                      >
                        <IonIcon 
                          icon={star} 
                          style={{ fontSize: '16px', color: devotion.isFeatured ? '#ec4899' : 'var(--ion-color-medium)' }} 
                        />
                      </div>
                      <div
                        onClick={(e) => { e.stopPropagation(); openActionSheet(devotion); }}
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

      {/* Action Sheet */}
      <IonActionSheet
        isOpen={showActionSheet}
        onDidDismiss={() => setShowActionSheet(false)}
        header={selectedDevotion?.title || 'Devotion Options'}
        buttons={[
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
            role: 'cancel'
          }
        ]}
      />

      {loading && devotions.length === 0 ? (
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
          <p style={{ fontSize: '14px', margin: 0 }}>Loading devotions...</p>
        </div>
      ) : null}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </IonPage>
  );
};

export default AdminDevotionManager;