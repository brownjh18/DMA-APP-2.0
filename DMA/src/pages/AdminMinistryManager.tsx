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
  people,
  person,
  eye,
  eyeOff,
  arrowBack,
  ellipsisVertical,
  search,
  closeCircle as closeIcon,
  checkmarkCircle
} from 'ionicons/icons';
import { apiService, BACKEND_BASE_URL } from '../services/api';
import './AdminManager.css';

const PAGE_SIZE = 20;

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
  const [displayedCount, setDisplayedCount] = useState(PAGE_SIZE);

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

  const allSorted = getSortedAndFilteredMinistries();
  const visibleMinistries = allSorted.slice(0, displayedCount);
  const hasMore = displayedCount < allSorted.length;

  const handleInfiniteScroll = async (ev: any) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    setDisplayedCount(prev => Math.min(prev + PAGE_SIZE, allSorted.length));
    (ev as any).target.complete();
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <IonButton fill="clear" slot="start" onClick={() => history.goBack()} style={{ marginLeft: '4px' }}>
            <IonIcon icon={arrowBack} style={{ fontSize: '22px' }} />
          </IonButton>
          <IonTitle className="title-ios" style={{ textAlign: 'left', marginLeft: '-16px' }}>Ministry Manager</IonTitle>

        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
        <div className="am-page">

          {/* Stats Modules */}
          <div className="am-stats">
            {statsModules.map((mod, i) => (
              <div
                key={i}
                className="am-stat-pill"
                style={{ '--chip-color': mod.color } as any}
                onClick={() => {
                  if (mod.name === 'Total Ministries') setFilterBy('all');
                  else if (mod.name === 'Active') setFilterBy(filterBy === 'active' ? 'all' : 'active');
                }}
              >
                <div
                  className="am-action-icon"
                  style={{ background: mod.color }}
                >
                  <IonIcon icon={mod.icon} />
                </div>
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
                placeholder="Search ministries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

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

          {/* Ministries List */}
          <div className="am-list">
            {visibleMinistries.length === 0 ? (
              <div className="am-empty">
                <IonIcon icon={people} />
                <p className="am-empty-title">No ministries found</p>
                <p className="am-empty-text">
                  {searchQuery || filterBy !== 'all' 
                    ? 'Try adjusting your search or filters' 
                    : 'Start by adding your first ministry'}
                </p>
              </div>
            ) : (
              visibleMinistries.map((ministry) => (
                <div
                  key={ministry._id}
                  className="am-card"
                  onClick={() => openEditPage(ministry)}
                >
                  <div className={`am-accent ${ministry.isPublished ? 'green' : 'amber'}`} />

                  <div className="am-thumb">
                    <img 
                      src={ministry.imageUrl ? (ministry.imageUrl.startsWith('/uploads') ? `${BACKEND_BASE_URL}${ministry.imageUrl}` : ministry.imageUrl) : DEFAULT_MINISTRY_THUMBNAIL} 
                      alt={ministry.name || 'Ministry'}
                      onError={(e) => {
                        if (ministry.imageUrl && !failedThumbnails.has(ministry._id)) {
                          (e.target as HTMLImageElement).src = DEFAULT_MINISTRY_THUMBNAIL;
                          setFailedThumbnails(prev => new Set(prev).add(ministry._id));
                        }
                      }}
                    />
                  </div>

                  <div className="am-content">
                    <p className="am-title">
                      {ministry.name || 'Untitled'}
                    </p>
                    <p className="am-subtitle">
                      {ministry.leader || 'Dove Church'}
                    </p>
                    <div className="am-meta">
                      <p className="am-meta-item">
                        <IonIcon icon={people} />
                        {ministry.members} members
                      </p>
                    </div>
                  </div>

                  <div className="am-actions">
                    <span className={`am-status ${ministry.isPublished ? 'active' : 'inactive'}`}>
                      {ministry.isPublished ? 'Active' : 'Inactive'}
                    </span>
                    <div className="am-btns">
                      <div
                        className={`am-btn toggle ${ministry.isPublished ? '' : 'inactive'}`}
                        onClick={(e) => { e.stopPropagation(); toggleStatus(ministry._id); }}
                      >
                        <IonIcon 
                          icon={ministry.isPublished ? eyeOff : eye}
                          style={{ color: ministry.isPublished ? '#10b981' : '#f59e0b' }}
                        />
                      </div>
                      <div
                        className="am-btn more"
                        onClick={(e) => { e.stopPropagation(); openActionSheet(ministry); }}
                      >
                        <IonIcon icon={ellipsisVertical} />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Infinite Scroll */}
          <IonInfiniteScroll
            onIonInfinite={handleInfiniteScroll}
            disabled={!hasMore}
          >
            <IonInfiniteScrollContent loadingText="Loading more ministries..." />
          </IonInfiniteScroll>

          {/* Footer */}
          <div className="am-footer">
            <IonText>
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

      {/* Action Popover */}
      <AdminPopover
        isOpen={showActionSheet}
        onDidDismiss={() => setShowActionSheet(false)}
        header={selectedMinistry?.name || 'Ministry Options'}
        options={[
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
            role: 'cancel',
            handler: () => {}
          }
        ]}
      />

      {loading && ministries.length === 0 ? (
        <div className="am-loading">
          <div className="am-loading-spinner" />
          <p style={{ fontSize: '14px', margin: 0 }}>Loading ministries...</p>
        </div>
      ) : null}
    </IonPage>
  );
};

export default AdminMinistryManager;
