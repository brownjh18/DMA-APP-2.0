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
  IonActionSheet,
  IonFab,
  IonFabButton
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import {
  add,
  create,
  trash,
  people,
  person,
  eye,
  eyeOff,
  informationCircle,
  arrowBack,
  ellipsisVertical,
  search,
  closeCircle as closeIcon,
  settings,
  checkmarkCircle
} from 'ionicons/icons';
import './Tab4.css';
import { BACKEND_BASE_URL } from '../services/api';
import { apiService } from '../services/api';

const AdminMinistryManager: React.FC = () => {
  const history = useHistory();
  const [ministries, setMinistries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<string>('date');
  const [filterBy, setFilterBy] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [selectedMinistry, setSelectedMinistry] = useState<any>(null);

  useEffect(() => {
    loadMinistries();
  }, []);

  // Check for updated ministry data from EditMinistry page
  useEffect(() => {
    const updatedMinistryData = localStorage.getItem('updatedMinistry');
    if (updatedMinistryData) {
      try {
        const updatedMinistryRaw = JSON.parse(updatedMinistryData);
        const updatedMinistry = {
          id: updatedMinistryRaw._id,
          name: updatedMinistryRaw.name,
          leader: updatedMinistryRaw.leader,
          description: updatedMinistryRaw.description,
          members: updatedMinistryRaw.memberCount || 0,
          status: updatedMinistryRaw.isActive ? 'active' : 'inactive',
          meetings: updatedMinistryRaw.meetingSchedule || 'TBD',
          category: updatedMinistryRaw.category,
          endTime: updatedMinistryRaw.endTime,
          contactEmail: updatedMinistryRaw.contactEmail,
          contactPhone: updatedMinistryRaw.contactPhone
        };
        localStorage.removeItem('updatedMinistry'); // Clean up
        loadMinistries(); // Reload to get updated data from server
      } catch (error) {
        console.error('Error parsing updated ministry data:', error);
      }
    }
  }, []);

  const loadMinistries = async () => {
    try {
      const data = await apiService.getMinistries({ page: 1, limit: 100 });
      const formattedMinistries = data.ministries.map((ministry: any) => ({
        id: ministry._id,
        name: ministry.name,
        leader: ministry.leader,
        description: ministry.description,
        members: ministry.memberCount || 0,
        status: ministry.isActive ? 'active' : 'inactive',
        meetings: ministry.meetingSchedule || 'TBD',
        category: ministry.category,
        endTime: ministry.endTime,
        contactEmail: ministry.contactEmail,
        contactPhone: ministry.contactPhone,
        imageUrl: ministry.imageUrl
      }));
      setMinistries(formattedMinistries);
    } catch (error) {
      console.error('Error loading ministries:', error);
    }
    setLoading(false);
  };

  const handleRefresh = async (event: CustomEvent) => {
    await loadMinistries();
    event.detail.complete();
  };

  const toggleStatus = async (id: string) => {
    try {
      const ministry = ministries.find(m => m.id === id);
      if (!ministry) return;

      const newStatus = ministry.status === 'active' ? false : true;
      await apiService.updateMinistry(id, { isActive: newStatus });
      await loadMinistries(); // Reload to get updated data from server
    } catch (error) {
      console.error('Error updating ministry status:', error);
    }
  };

  const deleteMinistry = async (id: string) => {
    try {
      await apiService.deleteMinistry(id);
      await loadMinistries(); // Reload to get updated data from server
    } catch (error) {
      console.error('Error deleting ministry:', error);
    }
  };

  const openEditPage = (ministry: any) => {
    history.push(`/admin/ministries/edit/${ministry.id}`, { ministry });
  };

  const openActionSheet = (ministry: any) => {
    setSelectedMinistry(ministry);
    setShowActionSheet(true);
  };

  const handleStatClick = (statType: string) => {
    setFilterBy(statType === 'active' ? 'active' : 'all');
  };

  // Calculate stats
  const totalMinistries = ministries.length;
  const activeMinistries = ministries.filter(m => m.status === 'active').length;
  const totalMembers = ministries.reduce((sum, m) => sum + m.members, 0);

  const statsModules = [
    { name: 'Total Ministries', icon: people, color: '#6366f1', val: totalMinistries, sub: 'ministries' },
    { name: 'Active', icon: checkmarkCircle, color: '#10b981', val: activeMinistries, sub: 'ministries' },
    { name: 'Total Members', icon: person, color: '#f59e0b', val: totalMembers, sub: 'members' }
  ];

  const getSortedAndFilteredMinistries = () => {
    let filtered = ministries;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m => 
        m.name?.toLowerCase().includes(query) || 
        m.leader?.toLowerCase().includes(query)
      );
    }

    // Apply filter
    if (filterBy === 'active') {
      filtered = filtered.filter(m => m.status === 'active');
    }

    // Apply sorting
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
            <span style={{ fontWeight: '700', color: 'var(--ion-color-primary)' }}>Ministry Management</span>
          </IonTitle>
          <IonButton fill="clear" slot="end" onClick={() => loadMinistries()} style={{ marginRight: '8px' }}>
            <IonIcon icon={settings} />
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
        <div style={{ padding: '16px', maxWidth: '1200px', margin: '0 auto', paddingBottom: '100px' }}>
          
          {/* Stats Modules - 2 Column Grid */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: 'var(--ion-text-color)' }}>
              Ministry Statistics
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
                <div key={i} onClick={() => {
                  if (mod.name === 'Total Ministries') setFilterBy('all');
                  else if (mod.name === 'Active') setFilterBy(filterBy === 'active' ? 'all' : 'active');
                }} style={{
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

          <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
            <IonRefresherContent></IonRefresherContent>
          </IonRefresher>

          <div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: 'var(--ion-text-color)' }}>
              {filterBy === 'all' ? 'All Ministries' :
               filterBy === 'active' ? 'Active Ministries' :
               'All Ministries'}
              <span style={{ 
                color: 'var(--ion-text-color)', 
                opacity: 0.4, 
                fontWeight: '400',
                fontSize: '0.85em',
                marginLeft: '8px'
              }}>
                ({getSortedAndFilteredMinistries().length})
              </span>
            </h3>

            {getSortedAndFilteredMinistries().length === 0 ? (
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
                    icon={people}
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
                  {loading ? 'Loading ministries...' : 'No ministries found'}
                </h3>
                <p style={{
                  margin: '0',
                  fontSize: '0.9em',
                  color: 'var(--ion-text-color)',
                  opacity: 0.6,
                  lineHeight: '1.4'
                }}>
                  {loading
                    ? 'Please wait while we fetch the ministry list'
                    : searchQuery
                      ? 'No ministries match your search'
                      : filterBy !== 'all'
                        ? `No ministries match the current ${filterBy} filter`
                        : 'No ministries have been added yet'
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
                {getSortedAndFilteredMinistries().map((ministry) => (
                  <div
                    key={ministry.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      openActionSheet(ministry);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: 'var(--ion-card-background)',
                      borderRadius: 14,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      padding: '14px',
                      border: '1px solid var(--ion-color-step-200)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {/* Ministry Thumbnail */}
                    <div style={{ position: 'relative', marginRight: '14px' }}>
                      {ministry.imageUrl ? (
                        <img
                          src={ministry.imageUrl.startsWith('/uploads') ? `${BACKEND_BASE_URL}${ministry.imageUrl}` : ministry.imageUrl}
                          alt={ministry.name}
                          style={{
                            width: '80px',
                            height: '45px',
                            borderRadius: '8px',
                            objectFit: 'cover'
                          }}
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '80px',
                            height: '45px',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                          }}
                        >
                          <IonIcon icon={people} style={{ fontSize: '1.5em', color: 'white' }} />
                        </div>
                      )}
                      {/* Status Badge - Top Left */}
                      <div style={{
                        position: 'absolute',
                        top: '4px',
                        left: '4px',
                        background: ministry.status === 'active' 
                          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                          : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.55em',
                        fontWeight: '600',
                        color: '#fff',
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}>
                        {ministry.status === 'active' ? 'Active' : 'Inactive'}
                      </div>
                    </div>

                    {/* Ministry Info */}
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
                          {ministry.name}
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
                        {ministry.leader || 'Dove Church'}
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
                          <IonIcon icon={person} style={{ fontSize: '12px' }} />
                          <span>{ministry.leader}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>•</span>
                          <IonIcon icon={people} style={{ fontSize: '12px' }} />
                          <span>{ministry.members}</span>
                        </div>
                      </div>
                    </div>

                    {/* Options Button */}
                    <IonButton
                      fill="clear"
                      onClick={(e) => {
                        e.stopPropagation();
                        openActionSheet(ministry);
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
              Dove Church • Ministry Management
            </IonText>
          </div>
        </div>

        {/* FAB Button */}
        <IonFab horizontal="end" vertical="bottom" slot="fixed" style={{ marginBottom: '80px', marginRight: '16px' }}>
          <IonFabButton onClick={() => history.push('/admin/ministries/add')} style={{ '--background': '#6366f1', '--box-shadow': '0 4px 16px rgba(99, 102, 241, 0.5)' }}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        <IonActionSheet
          isOpen={showActionSheet}
          onDidDismiss={() => setShowActionSheet(false)}
          header={`Options for "${selectedMinistry?.name}"`}
          buttons={[
            {
              text: selectedMinistry?.status === 'active' ? 'Deactivate' : 'Activate',
              icon: selectedMinistry?.status === 'active' ? eyeOff : eye,
              handler: () => {
                if (selectedMinistry) {
                  toggleStatus(selectedMinistry.id);
                }
              }
            },
            {
              text: 'Edit',
              icon: create,
              handler: () => {
                if (selectedMinistry) {
                  openEditPage(selectedMinistry);
                }
              }
            },
            {
              text: 'Delete',
              role: 'destructive',
              icon: trash,
              handler: () => {
                if (selectedMinistry) {
                  deleteMinistry(selectedMinistry.id);
                }
              }
            },
            {
              text: 'Cancel',
              role: 'cancel'
            }
          ]}
        />

        <style>{`
          input::placeholder {
            color: var(--ion-text-color) !important;
            opacity: 0.4 !important;
          }
        `}</style>
      </IonContent>
    </IonPage>
  );
};

export default AdminMinistryManager;