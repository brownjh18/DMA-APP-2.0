import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonBadge,
  IonText,
  IonRefresher,
  IonRefresherContent,
  IonLoading,
  IonAlert,
  IonActionSheet,
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
  arrowBack
} from 'ionicons/icons';
import { apiService } from '../services/api';

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
  const [animatingStat, setAnimatingStat] = useState<string | null>(null);

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
    // Trigger animation
    setAnimatingStat(statType);
    setTimeout(() => setAnimatingStat(null), 600); // Animation duration

    // Update sorting/filtering
    setSortBy(statType);
    setFilterBy(statType === 'published' || statType === 'draft' ? statType : 'all');
  };

  const getSortedAndFilteredSermons = () => {
    // Apply filter
    let filtered = sermons;
    if (filterBy === 'published') {
      filtered = sermons.filter(s => s.isPublished === true);
    } else if (filterBy === 'draft') {
      filtered = sermons.filter(s => s.isPublished === false);
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
        <IonToolbar className="toolbar-ios">
          <div
            onClick={() => history.goBack()}
            style={{
              position: 'absolute',
              top: 'calc(var(--ion-safe-area-top) - -5px)',
              left: 20,
              width: 45,
              height: 45,
              borderRadius: 25,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 6px 16px rgba(0,0,0,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 999,
              transition: 'transform 0.2s ease'
            }}
            onMouseDown={(e) => {
              const target = e.currentTarget as HTMLElement;
              target.style.transform = 'scale(0.8)';
            }}
            onMouseUp={(e) => {
              const target = e.currentTarget as HTMLElement;
              setTimeout(() => {
                target.style.transform = 'scale(1)';
              }, 200);
            }}
            onMouseLeave={(e) => {
              const target = e.currentTarget as HTMLElement;
              target.style.transform = 'scale(1)';
            }}
          >
            <IonIcon
              icon={arrowBack}
              style={{
                color: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? '#ffffff' : '#000000',
                fontSize: '20px',
              }}
            />
          </div>
          <IonTitle className="title-ios">Sermon Manager</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
        <div style={{ padding: '20px' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <IonIcon
              icon={playCircle}
              style={{
                fontSize: '3em',
                color: 'var(--ion-color-primary)',
                marginBottom: '16px'
              }}
            />
            <h1 style={{
              margin: '0 0 8px 0',
              fontSize: '1.8em',
              fontWeight: '700',
              color: 'var(--ion-text-color)'
            }}>
              Sermon Management
            </h1>
            <p style={{
              margin: '0',
              color: 'var(--ion-text-color)',
              opacity: 0.7,
              fontSize: '1em'
            }}>
              Manage church sermons and audio content
            </p>
          </div>

          {/* Stats Cards */}
          <div style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            overflowX: 'auto',
            paddingBottom: '8px',
            marginBottom: '24px'
          }}>
            <div style={{
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              minWidth: '70px'
            }}>
              <div
                onClick={() => handleStatClick('date')}
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  border: '3px solid #3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: sortBy === 'date' && filterBy === 'all' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  transform: animatingStat === 'date' ? 'scale(1.2) rotate(5deg)' : 'scale(1)',
                  boxShadow: animatingStat === 'date' ? '0 8px 25px rgba(59, 130, 246, 0.6), 0 0 0 4px rgba(59, 130, 246, 0.3)' : 'none',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {animatingStat === 'date' && (
                  <div style={{
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    right: '0',
                    bottom: '0',
                    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%)',
                    borderRadius: '50%',
                    animation: 'pulse 0.6s ease-out'
                  }} />
                )}
                <div style={{
                  fontSize: '1.2em',
                  fontWeight: '700',
                  color: '#3b82f6',
                  position: 'relative',
                  zIndex: 1,
                  animation: animatingStat === 'date' ? 'bounce 0.6s ease-out' : 'none'
                }}>
                  {sermons.length}
                </div>
              </div>
              <div style={{ fontSize: '0.75em', color: 'var(--ion-color-medium)', fontWeight: '500' }}>Total</div>
            </div>
            <div style={{
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              minWidth: '70px'
            }}>
              <div
                onClick={() => handleStatClick('published')}
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  border: '3px solid #10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: filterBy === 'published' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  transform: animatingStat === 'published' ? 'scale(1.2) rotate(3deg)' : 'scale(1)',
                  boxShadow: animatingStat === 'published' ? '0 8px 25px rgba(16, 185, 129, 0.6), 0 0 0 4px rgba(16, 185, 129, 0.3)' : 'none',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {animatingStat === 'published' && (
                  <div style={{
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    right: '0',
                    bottom: '0',
                    background: 'radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, transparent 70%)',
                    borderRadius: '50%',
                    animation: 'pulse 0.6s ease-out'
                  }} />
                )}
                <div style={{
                  fontSize: '1.2em',
                  fontWeight: '700',
                  color: '#10b981',
                  position: 'relative',
                  zIndex: 1,
                  animation: animatingStat === 'published' ? 'bounce 0.6s ease-out' : 'none'
                }}>
                  {sermons.filter(s => s.isPublished === true).length}
                </div>
              </div>
              <div style={{ fontSize: '0.75em', color: 'var(--ion-color-medium)', fontWeight: '500' }}>Published</div>
            </div>
            <div style={{
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              minWidth: '70px'
            }}>
              <div
                onClick={() => handleStatClick('draft')}
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  border: '3px solid #f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: filterBy === 'draft' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  transform: animatingStat === 'draft' ? 'scale(1.2) rotate(-3deg)' : 'scale(1)',
                  boxShadow: animatingStat === 'draft' ? '0 8px 25px rgba(245, 158, 11, 0.6), 0 0 0 4px rgba(245, 158, 11, 0.3)' : 'none',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {animatingStat === 'draft' && (
                  <div style={{
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    right: '0',
                    bottom: '0',
                    background: 'radial-gradient(circle, rgba(245, 158, 11, 0.4) 0%, transparent 70%)',
                    borderRadius: '50%',
                    animation: 'pulse 0.6s ease-out'
                  }} />
                )}
                <div style={{
                  fontSize: '1.2em',
                  fontWeight: '700',
                  color: '#f59e0b',
                  position: 'relative',
                  zIndex: 1,
                  animation: animatingStat === 'draft' ? 'bounce 0.6s ease-out' : 'none'
                }}>
                  {sermons.filter(s => s.isPublished === false).length}
                </div>
              </div>
              <div style={{ fontSize: '0.75em', color: 'var(--ion-color-medium)', fontWeight: '500' }}>Drafts</div>
            </div>
          </div>

          {/* Add Button */}
          <div style={{ marginBottom: '24px' }}>
            <IonButton
              expand="block"
              onClick={() => history.push('/admin/sermons/add')}
              style={{
                height: '48px',
                borderRadius: '24px',
                fontWeight: '600',
                backgroundColor: 'var(--ion-color-primary)',
                '--border-radius': '24px'
              }}
            >
              <IonIcon icon={add} slot="start" />
              Add Sermon
            </IonButton>
          </div>

          {/* Sermons List */}
          <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
            <IonRefresherContent></IonRefresherContent>
          </IonRefresher>

          <div style={{ marginBottom: '20px' }}>
            <h2 style={{
              margin: '0 0 16px 0',
              fontSize: '1.3em',
              fontWeight: '600',
              color: 'var(--ion-text-color)'
            }}>
              {filterBy === 'all' ? 'All Sermons' :
               filterBy === 'published' ? 'Published Sermons' :
               filterBy === 'draft' ? 'Draft Sermons' :
               'All Sermons'}
              {sortBy === 'views' && ' (Sorted by Views)'}
              {sortBy === 'date' && ' (Sorted by Date)'}
            </h2>

            {getSortedAndFilteredSermons().map((sermon) => (
              <IonCard key={sermon._id} style={{ margin: '0 0 12px 0', borderRadius: '12px' }}>
                <IonCardContent style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        margin: '0 0 8px 0',
                        fontSize: '1.1em',
                        fontWeight: '600',
                        color: 'var(--ion-text-color)'
                      }}>
                        {sermon.title}
                      </h3>
                      <p style={{
                        margin: '0 0 8px 0',
                        fontSize: '0.9em',
                        color: 'var(--ion-color-medium)'
                      }}>
                        {sermon.speaker}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.8em', color: 'var(--ion-color-medium)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <IonIcon icon={eye} />
                          {sermon.viewCount || 0}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      <IonBadge
                        style={{
                          backgroundColor: sermon.isPublished ? '#10b981' : '#f59e0b',
                          color: 'white',
                          fontWeight: '600',
                          borderRadius: '8px'
                        }}
                      >
                        {sermon.isPublished ? 'published' : 'draft'}
                      </IonBadge>
                      <IonButton
                        fill="clear"
                        size="small"
                        onClick={() => openActionSheet(sermon)}
                        style={{ color: 'var(--ion-color-medium)' }}
                      >
                        <IonIcon icon={ellipsisVertical} />
                      </IonButton>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            ))}
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <IonText style={{
              color: 'var(--ion-text-color)',
              opacity: 0.6,
              fontSize: '0.9em'
            }}>
              Dove Ministries Africa - Sermon Management
            </IonText>
          </div>
        </div>

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
    </IonPage>
  );
};

export default AdminSermonManager;