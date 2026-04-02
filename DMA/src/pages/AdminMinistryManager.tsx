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
  people,
  person,
  eye,
  eyeOff,
  arrowBack,
  ellipsisVertical,
  search,
  closeCircle as closeIcon,
  settings,
  checkmarkCircle
} from 'ionicons/icons';
import { apiService, BACKEND_BASE_URL } from '../services/api';
import './Tab4.css';

const AdminMinistryManager: React.FC = () => {
  const history = useHistory();
  const [ministries, setMinistries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ministriesLoading, setMinistriesLoading] = useState<boolean>(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [selectedMinistry, setSelectedMinistry] = useState<any>(null);
  const [sortBy, setSortBy] = useState<string>('date');
  const [filterBy, setFilterBy] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [failedThumbnails, setFailedThumbnails] = useState<Set<string>>(new Set());
  
  // Default thumbnail for ministries when no custom thumbnail is uploaded
  const DEFAULT_MINISTRY_THUMBNAIL = '/hero-evangelism.jpg';

  useEffect(() => {
    loadMinistries();
  }, []);

  useIonViewWillEnter(() => {
    const needsRefresh = sessionStorage.getItem('ministriesNeedRefresh') === 'true';
    if (needsRefresh) {
      sessionStorage.removeItem('ministriesNeedRefresh');
      loadMinistries(true);
    } else if (ministries.length === 0) {
      loadMinistries();
    }
  });

  const loadMinistries = async (forceRefresh = false) => {
    if (!forceRefresh && ministriesLoading && ministries.length > 0) return;

    try {
      setMinistriesLoading(true);
      setLoading(true);
      console.log('Loading ministries from API...');
      
      const data = await apiService.getMinistries({ page: 1, limit: 100 });
      const formattedMinistries = data.ministries.map((ministry: any) => ({
        _id: ministry._id,
        name: ministry.name,
        leader: ministry.leader,
        description: ministry.description,
        members: ministry.memberCount || 0,
        isPublished: ministry.isActive,
        category: ministry.category,
        imageUrl: ministry.imageUrl
      }));
      console.log('Ministries loaded:', formattedMinistries.length);
      setMinistries(formattedMinistries);
    } catch (error) {
      console.error('Error loading ministries:', error);
      setAlertMessage('Failed to load ministries. Please try again.');
      setShowAlert(true);
    } finally {
      setLoading(false);
      setMinistriesLoading(false);
    }
  };

  const handleRefresh = async (event: CustomEvent) => {
    await loadMinistries(true);
    event.detail.complete();
  };

  const toggleStatus = async (id: string) => {
    try {
      const ministry = ministries.find(m => m._id === id);
      if (!ministry) {
        setAlertMessage('Ministry not found.');
        setShowAlert(true);
        return;
      }

      const newStatus = !ministry.isPublished;
      await apiService.updateMinistry(id, { isActive: newStatus });

      setMinistries(ministries.map(m => 
        m._id === id ? { ...m, isPublished: newStatus } : m
      ));

      setAlertMessage(`Ministry ${newStatus ? 'activated' : 'deactivated'} successfully!`);
      setShowAlert(true);

      sessionStorage.setItem('ministriesNeedRefresh', 'true');
    } catch (error) {
      console.error('Error updating ministry status:', error);
      setAlertMessage('Failed to update ministry status. Please try again.');
      setShowAlert(true);
    }
  };

  const deleteMinistry = async (id: string) => {
    try {
      await apiService.deleteMinistry(id);
      setMinistries(ministries.filter(m => m._id !== id));
      setAlertMessage('Ministry deleted successfully!');
      setShowAlert(true);
      sessionStorage.setItem('ministriesNeedRefresh', 'true');
    } catch (error) {
      console.error('Error deleting ministry:', error);
      setAlertMessage('Failed to delete ministry. Please try again.');
      setShowAlert(true);
    }
  };

  const openEditPage = (ministry: any) => {
    history.push(`/admin/ministries/edit/${ministry._id}`, { ministry });
  };

  const openActionSheet = (ministry: any) => {
    setSelectedMinistry(ministry);
    setShowActionSheet(true);
  };

  // Calculate stats
  const totalMinistries = ministries.length;
  const activeMinistries = ministries.filter(m => m.isPublished).length;
  const totalMembers = ministries.reduce((sum, m) => sum + m.members, 0);

  const statsModules = [
    { name: 'Total Ministries', icon: people, color: '#6366f1', val: totalMinistries, sub: 'ministries' },
    { name: 'Active', icon: checkmarkCircle, color: '#10b981', val: activeMinistries, sub: 'ministries' },
    { name: 'Total Members', icon: person, color: '#f59e0b', val: totalMembers, sub: 'members' }
  ];

  const getSortedAndFilteredMinistries = () => {
    let filtered = ministries;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m => 
        m.name?.toLowerCase().includes(query) || 
        m.leader?.toLowerCase().includes(query)
      );
    }

    if (filterBy === 'active') {
      filtered = filtered.filter(m => m.isPublished === true);
    }

    let sorted = [...filtered];
    switch (sortBy) {
      case 'date':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'members':
        sorted.sort((a, b) => {
          const membersA = a.members || 0;
          const membersB = b.members || 0;
          return membersB - membersA;
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
          <IonTitle className="title-ios">Ministry Manager</IonTitle>
          <IonButton fill="clear" slot="end" onClick={() => loadMinistries(true)} style={{ marginRight: '8px' }}>
            <IonIcon icon={settings} />
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
        <div style={{ padding: '16px', maxWidth: '1200px', margin: '0 auto', paddingBottom: '100px' }}>

          {/* Stats Modules */}
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
                  if (mod.name === 'Total Ministries') setFilterBy('all');
                  else if (mod.name === 'Active') setFilterBy(filterBy === 'active' ? 'all' : 'active');
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
                  placeholder="Search ministries..."
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

          {/* Ministries List */}
          <div>
            {getSortedAndFilteredMinistries().length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: 'var(--ion-color-medium)',
                opacity: 0.6
              }}>
                <IonIcon icon={people} style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.3 }} />
                <p style={{ fontSize: '18px', fontWeight: '500', margin: '0 0 8px 0' }}>No ministries found</p>
                <p style={{ fontSize: '14px', margin: 0 }}>
                  {searchQuery || filterBy !== 'all' 
                    ? 'Try adjusting your search or filters' 
                    : 'Start by adding your first ministry'}
                </p>
              </div>
            ) : (
              getSortedAndFilteredMinistries().map((ministry) => (
                <div
                  key={ministry._id}
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
                  onClick={() => openEditPage(ministry)}
                >
                  {/* Left accent line */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '3px',
                    height: '100%',
                    background: ministry.isPublished ? '#10b981' : '#f59e0b',
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
                      src={ministry.imageUrl ? (ministry.imageUrl.startsWith('/uploads') ? `${BACKEND_BASE_URL}${ministry.imageUrl}` : ministry.imageUrl) : DEFAULT_MINISTRY_THUMBNAIL} 
                      alt={ministry.name || 'Ministry'}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        position: 'absolute',
                        top: 0,
                        left: 0
                      }}
                      onError={(e) => {
                        if (ministry.imageUrl && !failedThumbnails.has(ministry._id)) {
                          (e.target as HTMLImageElement).src = DEFAULT_MINISTRY_THUMBNAIL;
                          setFailedThumbnails(prev => new Set(prev).add(ministry._id));
                        }
                      }}
                    />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: 'var(--ion-text-color)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        {ministry.name || 'Untitled'}
                      </p>
                    </div>
                    <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: 'var(--ion-color-medium)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ministry.leader || 'Dove Church'}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--ion-color-medium)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <IonIcon icon={people} style={{ fontSize: '12px' }} />
                        {ministry.members} members
                      </p>
                    </div>
                  </div>

                  {/* Action buttons with status badge above */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    <div style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: '500',
                      background: ministry.isPublished ? '#10b98120' : '#f59e0b20',
                      color: ministry.isPublished ? '#10b981' : '#f59e0b',
                      whiteSpace: 'nowrap'
                    }}>
                      {ministry.isPublished ? 'Active' : 'Inactive'}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div
                        onClick={(e) => { e.stopPropagation(); toggleStatus(ministry._id); }}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          background: ministry.isPublished ? '#10b98115' : '#f59e0b15',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = ministry.isPublished ? '#10b98125' : '#f59e0b25'}
                        onMouseLeave={(e) => e.currentTarget.style.background = ministry.isPublished ? '#10b98115' : '#f59e0b15'}
                      >
                        <IonIcon 
                          icon={ministry.isPublished ? eyeOff : eye} 
                          style={{ fontSize: '16px', color: ministry.isPublished ? '#10b981' : '#f59e0b' }} 
                        />
                      </div>
                      <div
                        onClick={(e) => { e.stopPropagation(); openActionSheet(ministry); }}
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

        {/* FAB for adding new ministry */}
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
          <IonFabButton onClick={() => history.push('/admin/ministries/add')}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>
      </IonContent>

      {/* Alert */}
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
        header={selectedMinistry?.name || 'Ministry Options'}
        buttons={[
          {
            text: 'Edit',
            icon: create,
            handler: () => {
              if (selectedMinistry) openEditPage(selectedMinistry);
            }
          },
          {
            text: selectedMinistry?.isPublished ? 'Deactivate' : 'Activate',
            icon: selectedMinistry?.isPublished ? eyeOff : eye,
            handler: () => {
              if (selectedMinistry) toggleStatus(selectedMinistry._id);
            }
          },
          {
            text: 'Delete',
            icon: trash,
            role: 'destructive',
            handler: () => {
              if (selectedMinistry) deleteMinistry(selectedMinistry._id);
            }
          },
          {
            text: 'Cancel',
            icon: arrowBack,
            role: 'cancel'
          }
        ]}
      />

      {loading && ministries.length === 0 ? (
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
          <p style={{ fontSize: '14px', margin: 0 }}>Loading ministries...</p>
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

export default AdminMinistryManager;