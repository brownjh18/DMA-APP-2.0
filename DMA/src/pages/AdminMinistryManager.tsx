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
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonBadge,
  IonText,
  IonRefresher,
  IonRefresherContent
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
  closeCircle,
  informationCircle,
  arrowBack
} from 'ionicons/icons';

const AdminMinistryManager: React.FC = () => {
  const history = useHistory();
  const [ministries, setMinistries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<string>('date');
  const [filterBy, setFilterBy] = useState<string>('all');
  const [animatingStat, setAnimatingStat] = useState<string | null>(null);

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
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ministries?page=1&limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
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
          contactPhone: ministry.contactPhone
        }));
        setMinistries(formattedMinistries);
      } else {
        console.error('Failed to load ministries');
      }
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
      const token = localStorage.getItem('token');
      const ministry = ministries.find(m => m.id === id);
      if (!ministry) return;

      const newStatus = ministry.status === 'active' ? false : true;

      const response = await fetch(`/api/ministries/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: newStatus })
      });

      if (response.ok) {
        await loadMinistries(); // Reload to get updated data from server
      } else {
        console.error('Failed to update ministry status');
      }
    } catch (error) {
      console.error('Error updating ministry status:', error);
    }
  };

  const deleteMinistry = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/ministries/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await loadMinistries(); // Reload to get updated data from server
      } else {
        console.error('Failed to delete ministry');
      }
    } catch (error) {
      console.error('Error deleting ministry:', error);
    }
  };

  const openEditPage = (ministry: any) => {
    history.push(`/admin/ministries/edit/${ministry.id}`, { ministry });
  };

  const handleStatClick = (statType: string) => {
    // Trigger animation
    setAnimatingStat(statType);
    setTimeout(() => setAnimatingStat(null), 600); // Animation duration

    // Update sorting/filtering
    setSortBy(statType);
    setFilterBy(statType === 'members' ? statType : 'all');
  };

  const getSortedAndFilteredMinistries = () => {
    // Apply filter
    let filtered = ministries;

    // Apply sorting
    let sorted = [...filtered];
    switch (sortBy) {
      case 'date':
        // Since we don't have date fields, sort by name
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
          <IonTitle className="title-ios">Ministry Manager</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
        <div style={{ padding: '20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <IonIcon icon={people} style={{ fontSize: '3em', color: 'var(--ion-color-primary)', marginBottom: '16px' }} />
            <h1 style={{ margin: '0 0 8px 0', fontSize: '1.8em', fontWeight: '700', color: 'var(--ion-text-color)' }}>
              Ministry Management
            </h1>
            <p style={{ margin: '0', color: 'var(--ion-text-color)', opacity: 0.7, fontSize: '1em' }}>
              Organize and manage church ministries
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
                  border: '3px solid #10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: sortBy === 'date' && filterBy === 'all' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  transform: animatingStat === 'date' ? 'scale(1.2) rotate(5deg)' : 'scale(1)',
                  boxShadow: animatingStat === 'date' ? '0 8px 25px rgba(16, 185, 129, 0.6), 0 0 0 4px rgba(16, 185, 129, 0.3)' : 'none',
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
                  animation: animatingStat === 'date' ? 'bounce 0.6s ease-out' : 'none'
                }}>
                  {ministries.length}
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
                onClick={() => handleStatClick('members')}
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  border: '3px solid #3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: sortBy === 'members' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  transform: animatingStat === 'members' ? 'scale(1.2) rotate(-3deg)' : 'scale(1)',
                  boxShadow: animatingStat === 'members' ? '0 8px 25px rgba(59, 130, 246, 0.6), 0 0 0 4px rgba(59, 130, 246, 0.3)' : 'none',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {animatingStat === 'members' && (
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
                  animation: animatingStat === 'members' ? 'bounce 0.6s ease-out' : 'none'
                }}>
                  {ministries.reduce((sum, m) => sum + m.members, 0)}
                </div>
              </div>
              <div style={{ fontSize: '0.75em', color: 'var(--ion-color-medium)', fontWeight: '500' }}>Members</div>
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
                  backgroundColor: sortBy === 'published' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
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
                  {ministries.filter(m => m.status === 'active').length}
                </div>
              </div>
              <div style={{ fontSize: '0.75em', color: 'var(--ion-color-medium)', fontWeight: '500' }}>Published</div>
            </div>
          </div>

          {/* Add Button */}
          <div style={{ marginBottom: '24px' }}>
            <IonButton
              expand="block"
              onClick={() => history.push('/admin/ministries/add')}
              style={{
                height: '48px',
                borderRadius: '24px',
                fontWeight: '600',
                backgroundColor: 'var(--ion-color-primary)',
                '--border-radius': '24px'
              }}
            >
              <IonIcon icon={add} slot="start" />
              Add Ministry
            </IonButton>
          </div>

          <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
            <IonRefresherContent></IonRefresherContent>
          </IonRefresher>

          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '1.3em', fontWeight: '600', color: 'var(--ion-text-color)' }}>
              All Ministries
              {sortBy === 'members' && ' (Sorted by Members)'}
              {sortBy === 'date' && ' (Sorted by Name)'}
            </h2>

            {getSortedAndFilteredMinistries().map((ministry) => (
              <IonCard key={ministry.id} style={{ margin: '0 0 12px 0', borderRadius: '12px' }}>
                <IonCardContent style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <h3 style={{ margin: '0', fontSize: '1.1em', fontWeight: '600', color: 'var(--ion-text-color)' }}>
                          {ministry.name}
                        </h3>
                        <IonBadge style={{ backgroundColor: ministry.status === 'active' ? '#10b981' : '#6b7280', color: 'white', fontWeight: '600', borderRadius: '8px' }}>
                          {ministry.status}
                        </IonBadge>
                      </div>
                      <p style={{ margin: '0 0 8px 0', fontSize: '0.9em', color: 'var(--ion-color-medium)' }}>
                        {ministry.description}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', fontSize: '0.8em', color: 'var(--ion-color-medium)' }}>
                        <IonIcon icon={person} />
                        Leader: {ministry.leader}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', fontSize: '0.8em', color: 'var(--ion-color-medium)' }}>
                        <IonIcon icon={people} />
                        {ministry.members} members • {ministry.meetings}
                      </div>
                      {ministry.category && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', fontSize: '0.8em', color: 'var(--ion-color-medium)' }}>
                          <IonIcon icon={informationCircle} />
                          Category: {ministry.category}
                        </div>
                      )}
                      {ministry.endTime && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', fontSize: '0.8em', color: 'var(--ion-color-medium)' }}>
                          <IonIcon icon={informationCircle} />
                          End Time: {ministry.endTime}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <IonButton fill="clear" size="small" onClick={() => toggleStatus(ministry.id)} style={{ color: 'var(--ion-color-primary)' }}>
                        <IonIcon icon={ministry.status === 'active' ? eyeOff : eye} />
                      </IonButton>
                      <IonButton fill="clear" size="small" style={{ color: 'var(--ion-color-primary)' }} onClick={() => openEditPage(ministry)}>
                        <IonIcon icon={create} />
                      </IonButton>
                      <IonButton fill="clear" size="small" style={{ color: '#ef4444' }} onClick={() => deleteMinistry(ministry.id)}>
                        <IonIcon icon={trash} />
                      </IonButton>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <IonText style={{ color: 'var(--ion-text-color)', opacity: 0.6, fontSize: '0.9em' }}>
              Dove Ministries Africa - Ministry Management
            </IonText>
          </div>
        </div>

      </IonContent>
    </IonPage>
  );
};

export default AdminMinistryManager;