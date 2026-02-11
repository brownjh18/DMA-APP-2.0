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
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonBadge,
  IonText,
  IonRefresher,
  IonRefresherContent,
  IonActionSheet
} from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';
import apiService from '../services/api';
import {
  add,
  create,
  trash,
  calendar,
  location,
  people,
  time,
  eye,
  eyeOff,
  arrowBack,
  ellipsisVertical
} from 'ionicons/icons';
import './Tab4.css';

const AdminEventManager: React.FC = () => {
  const history = useHistory();
  const currentLocation = useLocation();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('date');
  const [filterBy, setFilterBy] = useState<string>('all');
  const [animatingStat, setAnimatingStat] = useState<string | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  // Refresh events when navigating to this page
  useEffect(() => {
    if (currentLocation.pathname === '/admin/events') {
      loadEvents();
    }
  }, [currentLocation.pathname]);

  // Check for refresh flag on mount
  useEffect(() => {
    const needsRefresh = sessionStorage.getItem('eventsNeedRefresh');
    if (needsRefresh === 'true') {
      sessionStorage.removeItem('eventsNeedRefresh');
      loadEvents();
    }
  }, []);


  const loadEvents = async () => {
    if (eventsLoading || events.length > 0) return; // Prevent multiple calls if already loaded

    try {
      setEventsLoading(true);
      console.log('Loading events from API...');
      const data = await apiService.getEvents({ page: 1, limit: 100, published: 'all' });
      const formattedEvents = data.events.map((event: any) => ({
        id: event._id,
        title: event.title,
        date: event.date.split('T')[0], // Format date
        time: event.time,
        location: event.location,
        description: event.description,
        status: event.isPublished ? 'published' : 'draft',
        attendees: event.currentAttendees || 0,
        capacity: event.maxAttendees || 0,
        organizer: event.speaker || '',
        contactInfo: event.contactPhone || '',
        imageUrl: event.imageUrl
      }));
      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
      setEventsLoading(false);
    }
  };

  const handleRefresh = async (event: CustomEvent) => {
    await loadEvents();
    event.detail.complete();
  };

  const toggleStatus = async (id: string) => {
    try {
      const event = events.find(e => e.id === id);
      if (!event) return;

      const newStatus = event.status === 'published' ? false : true;

      await apiService.updateEvent(id, { isPublished: newStatus });

      setEvents(events.map(event =>
        event.id === id
          ? { ...event, status: newStatus ? 'published' : 'draft' }
          : event
      ));
    } catch (error) {
      console.error('Error updating event status:', error);
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      await apiService.deleteEvent(id);
      setEvents(events.filter(event => event.id !== id));
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const openEditPage = (event: any) => {
    history.push(`/admin/events/edit/${event.id}`, { event });
  };

  const openActionSheet = (event: any) => {
    setSelectedEvent(event);
    setShowActionSheet(true);
  };

  const handleStatClick = (statType: string) => {
    // Trigger animation
    setAnimatingStat(statType);
    setTimeout(() => setAnimatingStat(null), 600); // Animation duration

    // Update sorting/filtering
    setSortBy(statType);
    setFilterBy(statType === 'published' || statType === 'attendees' ? statType : 'all');
  };

  const getSortedAndFilteredEvents = () => {
    // Apply filter
    let filtered = events;
    if (filterBy === 'published') {
      filtered = events.filter(e => e.status === 'published');
    }

    // Apply sorting
    let sorted = [...filtered];
    switch (sortBy) {
      case 'date':
        sorted.sort((a, b) => {
          const dateA = new Date(a.date + ' ' + a.time);
          const dateB = new Date(b.date + ' ' + b.time);
          return dateB.getTime() - dateA.getTime();
        });
        break;
      case 'attendees':
        sorted.sort((a, b) => {
          const attendeesA = a.attendees || 0;
          const attendeesB = b.attendees || 0;
          return attendeesB - attendeesA;
        });
        break;
      case 'published':
        sorted.sort((a, b) => {
          const dateA = new Date(a.date + ' ' + a.time);
          const dateB = new Date(b.date + ' ' + b.time);
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
          <IonTitle className="title-ios">Event Manager</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
        <div style={{ padding: '20px' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <IonIcon
              icon={calendar}
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
              Event Management
            </h1>
            <p style={{
              margin: '0',
              color: 'var(--ion-text-color)',
              opacity: 0.7,
              fontSize: '1em'
            }}>
              Organize and manage church events
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
                  border: '3px solid #f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: sortBy === 'date' && filterBy === 'all' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  transform: animatingStat === 'date' ? 'scale(1.2) rotate(5deg)' : 'scale(1)',
                  boxShadow: animatingStat === 'date' ? '0 8px 25px rgba(245, 158, 11, 0.6), 0 0 0 4px rgba(245, 158, 11, 0.3)' : 'none',
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
                  animation: animatingStat === 'date' ? 'bounce 0.6s ease-out' : 'none'
                }}>
                  {events.length}
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
                  {events.filter(e => e.status === 'published').length}
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
                onClick={() => handleStatClick('attendees')}
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  border: '3px solid #3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: sortBy === 'attendees' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  transform: animatingStat === 'attendees' ? 'scale(1.2) rotate(-3deg)' : 'scale(1)',
                  boxShadow: animatingStat === 'attendees' ? '0 8px 25px rgba(59, 130, 246, 0.6), 0 0 0 4px rgba(59, 130, 246, 0.3)' : 'none',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {animatingStat === 'attendees' && (
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
                  animation: animatingStat === 'attendees' ? 'bounce 0.6s ease-out' : 'none'
                }}>
                  {events.reduce((sum, e) => sum + e.attendees, 0)}
                </div>
              </div>
              <div style={{ fontSize: '0.75em', color: 'var(--ion-color-medium)', fontWeight: '500' }}>Attendees</div>
            </div>
          </div>

          {/* Add Button */}
          <div style={{ marginBottom: '24px' }}>
            <IonButton
              expand="block"
              onClick={() => history.push('/admin/events/add')}
              style={{
                height: '48px',
                borderRadius: '24px',
                fontWeight: '600',
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.8) 0%, rgba(56, 189, 248, 0.6) 50%, rgba(56, 189, 248, 0.4) 100%)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                border: '1px solid rgba(56, 189, 248, 0.5)',
                boxShadow: '0 8px 32px rgba(56, 189, 248, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '--border-radius': '24px'
              }}
              onMouseDown={(e) => {
                const target = e.currentTarget as HTMLElement;
                target.style.transform = 'scale(0.98)';
                target.style.boxShadow = '0 4px 16px rgba(56, 189, 248, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
              }}
              onMouseUp={(e) => {
                const target = e.currentTarget as HTMLElement;
                setTimeout(() => {
                  target.style.transform = 'scale(1)';
                  target.style.boxShadow = '0 8px 32px rgba(56, 189, 248, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                }, 200);
              }}
              onMouseLeave={(e) => {
                const target = e.currentTarget as HTMLElement;
                target.style.transform = 'scale(1)';
                target.style.boxShadow = '0 8px 32px rgba(56, 189, 248, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
              }}
            >
              <IonIcon icon={add} slot="start" />
              Add Event
            </IonButton>
          </div>

          {/* Events List */}
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
              {filterBy === 'all' ? 'All Events' :
               filterBy === 'published' ? 'Published Events' :
               'All Events'}
              {sortBy === 'attendees' && ' (Sorted by Attendees)'}
              {sortBy === 'date' && ' (Sorted by Date)'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px', margin: '0 auto' }}>
              {getSortedAndFilteredEvents().map((event) => (
                <div
                  key={event.id}
                  className="podcast-item"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: 'var(--ion-background-color)',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    padding: '12px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    maxWidth: '500px',
                    position: 'relative'
                  }}
                  onClick={() => openActionSheet(event)}
                >
                  <div className="podcast-options-btn">
                    <IonButton
                      fill="clear"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        openActionSheet(event);
                      }}
                      style={{
                        margin: '0',
                        padding: '0',
                        minWidth: 'auto',
                        height: 'auto',
                        '--color': 'white'
                      }}
                    >
                      <IonIcon icon={ellipsisVertical} style={{ fontSize: '1.2em' }} />
                    </IonButton>
                  </div>

                  <div className="podcast-thumbnail-container" style={{ position: 'relative', marginRight: '16px' }}>
                    {event.imageUrl ? (
                      <img
                        src={event.imageUrl.startsWith('/uploads') ? `http://localhost:5000${event.imageUrl}` : event.imageUrl}
                        alt={event.title}
                        className="podcast-thumbnail"
                      />
                    ) : (
                      <div
                        className="podcast-thumbnail"
                        style={{
                          background: 'linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-secondary))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <IonIcon icon={calendar} style={{ fontSize: '2em', color: 'white' }} />
                      </div>
                    )}
                    <div className={`podcast-badge ${event.status !== 'published' ? 'live' : ''}`}>
                      {event.status === 'published' ? 'EVENT' : 'DRAFT'}
                    </div>
                  </div>

                  <div style={{ flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ width: '100%' }}>
                      <h4 className="podcast-title" style={{ marginBottom: '6px' }}>
                        {event.title}
                      </h4>
                      <p style={{ margin: '0 0 8px 0', fontSize: '0.85em', color: 'var(--ion-color-medium)', fontWeight: '500' }}>
                        {event.organizer || 'Dove Ministries Africa'}
                      </p>
                      <div className="podcast-meta">
                        <div className="podcast-meta-item">
                          <IonIcon icon={calendar} />
                          <span>{new Date(event.date + ' ' + event.time).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        </div>
                        <div className="podcast-meta-item">
                          <IonIcon icon={location} />
                          <span>{event.location}</span>
                        </div>
                        <div className="podcast-meta-item">
                          <IonIcon icon={people} />
                          <span>{event.attendees}/{event.capacity} attendees</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <IonText style={{
              color: 'var(--ion-text-color)',
              opacity: 0.6,
              fontSize: '0.9em'
            }}>
              Dove Ministries Africa - Event Management
            </IonText>
          </div>
        </div>

        <IonActionSheet
          isOpen={showActionSheet}
          onDidDismiss={() => setShowActionSheet(false)}
          header={`Options for "${selectedEvent?.title}"`}
          buttons={[
            {
              text: selectedEvent?.status === 'published' ? 'Unpublish' : 'Publish',
              icon: selectedEvent?.status === 'published' ? eyeOff : eye,
              handler: () => {
                if (selectedEvent) {
                  toggleStatus(selectedEvent.id);
                }
              }
            },
            {
              text: 'Edit',
              icon: create,
              handler: () => {
                if (selectedEvent) {
                  openEditPage(selectedEvent);
                }
              }
            },
            {
              text: 'Delete',
              role: 'destructive',
              icon: trash,
              handler: () => {
                if (selectedEvent) {
                  deleteEvent(selectedEvent.id);
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

export default AdminEventManager;