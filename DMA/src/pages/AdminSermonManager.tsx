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
  playCircle,
  eye,
  eyeOff,
  ellipsisVertical,
  arrowBack,
  calendar,
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
  const [failedThumbnails, setFailedThumbnails] = useState<Set<string>>(new Set());
  
  // Default thumbnail for sermons when no custom thumbnail is uploaded
  const DEFAULT_SERMON_THUMBNAIL = '/hero-evangelism.jpg';

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
      loadSermons();
    }
  });

  const loadSermons = async (forceRefresh = false) => {
    const needsRefresh = sessionStorage.getItem('sermonsNeedRefresh') === 'true';
    
    if (!forceRefresh && !needsRefresh && sermonsLoading) return;

    try {
      setSermonsLoading(true);
      setLoading(true);
      console.log('Loading sermons from API...');
      
      if (needsRefresh) {
        sessionStorage.removeItem('sermonsNeedRefresh');
        console.log('🔄 Refresh flag detected and cleared');
        clearSermonsCache();
      }
      
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

      setSermons(sermons.map(s => 
        s._id === id ? { ...s, isPublished: newStatus } : s
      ));

      setAlertMessage(`Sermon ${newStatus ? 'published' : 'unpublished'} successfully!`);
      setShowAlert(true);

      console.log('🔄 Refreshing sermon list after status change');
      sessionStorage.setItem('sermonsNeedRefresh', 'true');
      setTimeout(() => loadSermons(true), 500);
    } catch (error: any) {
      console.error('Error toggling sermon status:', error);
      
      if (error.message?.includes('Sermon not found') || error.message?.includes('404')) {
        console.log('🗑️ Sermon not found in database, removing from local state');
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

      console.log('🔄 Refreshing sermon list after deletion');
      sessionStorage.setItem('sermonsNeedRefresh', 'true');
      setTimeout(() => loadSermons(true), 500);
    } catch (error: any) {
      console.error('Error deleting sermon:', error);
      
      if (error.message?.includes('Sermon not found') || error.message?.includes('404')) {
        console.log('🗑️ Sermon not found in database, removing from local state');
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
    switch (sortBy) {
      case 'date':
        sorted.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.date || 0);
          const dateB = new Date(b.createdAt || b.date || 0);
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

  const formatDuration = (duration: string) => {
    if (!duration) return 'No duration';
    return duration;
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <BackButton />
        <IonToolbar className="toolbar-ios">
          <IonTitle className="title-ios">Sermon Manager</IonTitle>
          <IonButton fill="clear" slot="end" onClick={() => loadSermons(true)} style={{ marginRight: '8px' }}>
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
                  if (mod.name === 'Total Sermons') setFilterBy('all');
                  else if (mod.name === 'Published') setFilterBy(filterBy === 'published' ? 'all' : 'published');
                  else if (mod.name === 'Drafts') setFilterBy(filterBy === 'draft' ? 'all' : 'draft');
                  else if (mod.name === 'Total Views') setSortBy('views');
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
                  <IonIcon icon={closeIcon} style={{ fontSize: '14px' }} />
                </div>
              </div>
            )}
          </div>

          {/* Sermons List */}
          <div>
            {getSortedAndFilteredSermons().length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: 'var(--ion-color-medium)',
                opacity: 0.6
              }}>
                <IonIcon icon={playCircle} style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.3 }} />
                <p style={{ fontSize: '18px', fontWeight: '500', margin: '0 0 8px 0' }}>No sermons found</p>
                <p style={{ fontSize: '14px', margin: 0 }}>
                  {searchQuery || filterBy !== 'all' 
                    ? 'Try adjusting your search or filters' 
                    : 'Start by adding your first sermon'}
                </p>
              </div>
            ) : (
              getSortedAndFilteredSermons().map((sermon) => (
                <div
                  key={sermon._id}
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
                  onClick={() => openEditPage(sermon)}
                >
                  {/* Left accent line */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '3px',
                    height: '100%',
                    background: sermon.isPublished ? '#10b981' : '#f59e0b',
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
                    <img 
                      src={sermon.thumbnailUrl ? (sermon.thumbnailUrl.startsWith('/uploads') ? `${BACKEND_BASE_URL}${sermon.thumbnailUrl}` : sermon.thumbnailUrl) : DEFAULT_SERMON_THUMBNAIL} 
                      alt={sermon.title || 'Sermon'}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        position: 'absolute',
                        top: 0,
                        left: 0
                      }}
                      onError={(e) => {
                        if (sermon.thumbnailUrl && !failedThumbnails.has(sermon._id)) {
                          (e.target as HTMLImageElement).src = DEFAULT_SERMON_THUMBNAIL;
                          setFailedThumbnails(prev => new Set(prev).add(sermon._id));
                        }
                      }}
                    />
                    {/* Duration Badge */}
                    {sermon.duration && (
                      <div style={{
                        position: 'absolute',
                        bottom: '2px',
                        right: '2px',
                        background: 'rgba(0, 0, 0, 0.75)',
                        padding: '2px 4px',
                        borderRadius: '3px',
                        fontSize: '9px',
                        fontWeight: '500',
                        color: '#fff'
                      }}>
                        {sermon.duration}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: 'var(--ion-text-color)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        {sermon.title || 'Untitled'}
                      </p>
                    </div>
                    <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: 'var(--ion-color-medium)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {sermon.speaker || 'Dove Church'}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--ion-color-medium)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <IonIcon icon={calendar} style={{ fontSize: '12px' }} />
                        {sermon.createdAt ? formatDate(sermon.createdAt) : 'No date'}
                      </p>
                    </div>
                  </div>

                  {/* Action buttons with status badge above */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    {/* Status Badge */}
                    <div style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: '500',
                      background: sermon.isPublished ? '#10b98120' : '#f59e0b20',
                      color: sermon.isPublished ? '#10b981' : '#f59e0b',
                      whiteSpace: 'nowrap'
                    }}>
                      {sermon.isPublished ? 'Published' : 'Draft'}
                    </div>
                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div
                        onClick={(e) => { e.stopPropagation(); toggleStatus(sermon._id); }}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          background: sermon.isPublished ? '#10b98115' : '#f59e0b15',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = sermon.isPublished ? '#10b98125' : '#f59e0b25'}
                        onMouseLeave={(e) => e.currentTarget.style.background = sermon.isPublished ? '#10b98115' : '#f59e0b15'}
                      >
                        <IonIcon 
                          icon={sermon.isPublished ? eyeOff : eye} 
                          style={{ fontSize: '16px', color: sermon.isPublished ? '#10b981' : '#f59e0b' }} 
                        />
                      </div>
                      <div
                        onClick={(e) => { e.stopPropagation(); openActionSheet(sermon); }}
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

        {/* FAB for adding new sermon */}
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

      {/* Delete Confirmation Alert */}
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

      {/* Action Sheet */}
      <IonActionSheet
        isOpen={showActionSheet}
        onDidDismiss={() => setShowActionSheet(false)}
        header={selectedSermon?.title || 'Sermon Options'}
        buttons={[
          {
            text: 'Edit',
            icon: create,
            handler: () => {
              if (selectedSermon) openEditPage(selectedSermon);
            }
          },
          {
            text: selectedSermon?.isPublished ? 'Unpublish' : 'Publish',
            icon: selectedSermon?.isPublished ? eyeOff : eye,
            handler: () => {
              if (selectedSermon) toggleStatus(selectedSermon._id);
            }
          },
          {
            text: 'Delete',
            icon: trash,
            role: 'destructive',
            handler: () => {
              if (selectedSermon) confirmDeleteSermon(selectedSermon);
            }
          },
          {
            text: 'Cancel',
            icon: arrowBack,
            role: 'cancel'
          }
        ]}
      />

      {loading && sermons.length === 0 ? (
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
          <p style={{ fontSize: '14px', margin: 0 }}>Loading sermons...</p>
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

export default AdminSermonManager;