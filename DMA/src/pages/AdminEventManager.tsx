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
import { useHistory, useLocation } from 'react-router-dom';
import apiService, { BACKEND_BASE_URL } from '../services/api';
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
  ellipsisVertical,
  search,
  closeCircle as closeIcon,
  settings,
  checkmarkCircle
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
  const [searchQuery, setSearchQuery] = useState('');
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
    setFilterBy(statType === 'published' ? 'published' : 'all');
  };

  // Calculate stats
  const totalEvents = events.length;
  const publishedEvents = events.filter(e => e.status === 'published').length;
  const totalAttendees = events.reduce((sum, e) => sum + e.attendees, 0);

  const statsModules = [
    { name: 'Total Events', icon: calendar, color: '#6366f1', val: totalEvents, sub: 'events' },
    { name: 'Published', icon: checkmarkCircle, color: '#10b981', val: publishedEvents, sub: 'events' },
    { name: 'Total Attendees', icon: people, color: '#f59e0b', val: totalAttendees, sub: 'attendees' }
  ];

  const getSortedAndFilteredEvents = () => {
    let filtered = events;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e => 
        e.title?.toLowerCase().includes(query) || 
        e.organizer?.toLowerCase().includes(query)
      );
    }

    // Apply filter
    if (filterBy === 'published') {
      filtered = filtered.filter(e => e.status === 'published');
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
            <span style={{ fontWeight: '700', color: 'var(--ion-color-primary)' }}>Event Management</span>
          </IonTitle>
          <IonButton fill="clear" slot="end" onClick={() => loadEvents()} style={{ marginRight: '8px' }}>
            <IonIcon icon={settings} />
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
        <div style={{ padding: '16px', maxWidth: '1200px', margin: '0 auto', paddingBottom: '100px' }}>
          
          {/* Stats Modules - 2 Column Grid */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: 'var(--ion-text-color)' }}>
              Event Statistics
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
                  if (mod.name === 'Total Events') setFilterBy('all');
                  else if (mod.name === 'Published') setFilterBy(filterBy === 'published' ? 'all' : 'published');
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
                  placeholder="Search events..."
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

          {/* Events List */}
          <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
            <IonRefresherContent></IonRefresherContent>
          </IonRefresher>

          <div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: 'var(--ion-text-color)' }}>
              {filterBy === 'all' ? 'All Events' :
               filterBy === 'published' ? 'Published Events' :
               'All Events'}
              <span style={{ 
                color: 'var(--ion-text-color)', 
                opacity: 0.4, 
                fontWeight: '400',
                fontSize: '0.85em',
                marginLeft: '8px'
              }}>
                ({getSortedAndFilteredEvents().length})
              </span>
            </h3>

            {getSortedAndFilteredEvents().length === 0 ? (
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
                    icon={calendar}
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
                  {loading ? 'Loading events...' : 'No events found'}
                </h3>
                <p style={{
                  margin: '0',
                  fontSize: '0.9em',
                  color: 'var(--ion-text-color)',
                  opacity: 0.6,
                  lineHeight: '1.4'
                }}>
                  {loading
                    ? 'Please wait while we fetch the event list'
                    : searchQuery
                      ? 'No events match your search'
                      : filterBy !== 'all'
                        ? `No events match the current ${filterBy} filter`
                        : 'No events have been added yet'
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
                {getSortedAndFilteredEvents().map((event) => (
                  <div
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      openActionSheet(event);
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
                    {/* Event Thumbnail */}
                    <div style={{ position: 'relative', marginRight: '14px' }}>
                      {event.imageUrl ? (
                        <img
                          src={event.imageUrl.startsWith('/uploads') ? `${BACKEND_BASE_URL}${event.imageUrl}` : event.imageUrl}
                          alt={event.title}
                          style={{
                            width: '80px',
                            height: '45px',
                            borderRadius: '8px',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '80px',
                            height: '45px',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                          }}
                        >
                          <IonIcon icon={calendar} style={{ fontSize: '1.5em', color: 'white' }} />
                        </div>
                      )}
                      {/* Status Badge - Top Left */}
                      <div style={{
                        position: 'absolute',
                        top: '4px',
                        left: '4px',
                        background: event.status === 'published' 
                          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                          : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.55em',
                        fontWeight: '600',
                        color: '#fff',
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}>
                        {event.status === 'published' ? 'Published' : 'Draft'}
                      </div>
                    </div>

                    {/* Event Info */}
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
                          {event.title}
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
                        {event.organizer || 'Dove Church'}
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
                          <IonIcon icon={calendar} style={{ fontSize: '12px' }} />
                          <span>{new Date(event.date + ' ' + event.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>•</span>
                          <IonIcon icon={people} style={{ fontSize: '12px' }} />
                          <span>{event.attendees}/{event.capacity}</span>
                        </div>
                      </div>
                    </div>

                    {/* Options Button */}
                    <IonButton
                      fill="clear"
                      onClick={(e) => {
                        e.stopPropagation();
                        openActionSheet(event);
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
              Dove Church • Event Management
            </IonText>
          </div>
        </div>

        {/* FAB Button */}
        <IonFab horizontal="end" vertical="bottom" slot="fixed" style={{ marginBottom: '80px', marginRight: '16px' }}>
          <IonFabButton onClick={() => history.push('/admin/events/add')} style={{ '--background': '#6366f1', '--box-shadow': '0 4px 16px rgba(99, 102, 241, 0.5)' }}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

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

export default AdminEventManager;