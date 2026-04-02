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
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState<boolean>(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [sortBy, setSortBy] = useState<string>('date');
  const [filterBy, setFilterBy] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [failedThumbnails, setFailedThumbnails] = useState<Set<string>>(new Set());
  
  // Default thumbnail for events when no custom thumbnail is uploaded
  const DEFAULT_EVENT_THUMBNAIL = '/hero-evangelism.jpg';

  useEffect(() => {
    loadEvents();
  }, []);

  useIonViewWillEnter(() => {
    const needsRefresh = sessionStorage.getItem('eventsNeedRefresh') === 'true';
    if (needsRefresh) {
      sessionStorage.removeItem('eventsNeedRefresh');
      loadEvents(true);
    } else if (events.length === 0) {
      loadEvents();
    }
  });

  const loadEvents = async (forceRefresh = false) => {
    if (!forceRefresh && eventsLoading && events.length > 0) return;

    try {
      setEventsLoading(true);
      setLoading(true);
      console.log('Loading events from API...');
      
      const data = await apiService.getEvents({ page: 1, limit: 100, published: 'all' });
      const formattedEvents = data.events.map((event: any) => ({
        _id: event._id,
        title: event.title,
        date: event.date,
        time: event.time,
        location: event.location,
        description: event.description,
        isPublished: event.isPublished,
        attendees: event.currentAttendees || 0,
        capacity: event.maxAttendees || 0,
        organizer: event.speaker || '',
        imageUrl: event.imageUrl
      }));
      console.log('Events loaded:', formattedEvents.length);
      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
      setAlertMessage('Failed to load events. Please try again.');
      setShowAlert(true);
    } finally {
      setLoading(false);
      setEventsLoading(false);
    }
  };

  const handleRefresh = async (event: CustomEvent) => {
    await loadEvents(true);
    event.detail.complete();
  };

  const toggleStatus = async (id: string) => {
    try {
      const event = events.find(e => e._id === id);
      if (!event) {
        setAlertMessage('Event not found.');
        setShowAlert(true);
        return;
      }

      const newStatus = !event.isPublished;
      await apiService.updateEvent(id, { isPublished: newStatus });

      setEvents(events.map(e => 
        e._id === id ? { ...e, isPublished: newStatus } : e
      ));

      setAlertMessage(`Event ${newStatus ? 'published' : 'unpublished'} successfully!`);
      setShowAlert(true);

      sessionStorage.setItem('eventsNeedRefresh', 'true');
    } catch (error) {
      console.error('Error updating event status:', error);
      setAlertMessage('Failed to update event status. Please try again.');
      setShowAlert(true);
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      await apiService.deleteEvent(id);
      setEvents(events.filter(e => e._id !== id));
      setAlertMessage('Event deleted successfully!');
      setShowAlert(true);
      sessionStorage.setItem('eventsNeedRefresh', 'true');
    } catch (error) {
      console.error('Error deleting event:', error);
      setAlertMessage('Failed to delete event. Please try again.');
      setShowAlert(true);
    }
  };

  const openEditPage = (event: any) => {
    history.push(`/admin/events/edit/${event._id}`, { event });
  };

  const openActionSheet = (event: any) => {
    setSelectedEvent(event);
    setShowActionSheet(true);
  };

  // Calculate stats
  const totalEvents = events.length;
  const publishedEvents = events.filter(e => e.isPublished).length;
  const totalAttendees = events.reduce((sum, e) => sum + e.attendees, 0);

  const statsModules = [
    { name: 'Total Events', icon: calendar, color: '#f59e0b', val: totalEvents, sub: 'events' },
    { name: 'Published', icon: checkmarkCircle, color: '#10b981', val: publishedEvents, sub: 'events' },
    { name: 'Total Attendees', icon: people, color: '#8b5cf6', val: totalAttendees, sub: 'attendees' }
  ];

  const getSortedAndFilteredEvents = () => {
    let filtered = events;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e => 
        e.title?.toLowerCase().includes(query) || 
        e.organizer?.toLowerCase().includes(query)
      );
    }

    if (filterBy === 'published') {
      filtered = filtered.filter(e => e.isPublished === true);
    }

    let sorted = [...filtered];
    switch (sortBy) {
      case 'date':
        sorted.sort((a, b) => {
          const dateA = new Date(a.date + ' ' + a.time);
          const dateB = new Date(b.date + ' ' + b.time);
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
          <IonTitle className="title-ios">Event Manager</IonTitle>
          <IonButton fill="clear" slot="end" onClick={() => loadEvents(true)} style={{ marginRight: '8px' }}>
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
                  if (mod.name === 'Total Events') setFilterBy('all');
                  else if (mod.name === 'Published') setFilterBy(filterBy === 'published' ? 'all' : 'published');
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

          {/* Events List */}
          <div>
            {getSortedAndFilteredEvents().length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: 'var(--ion-color-medium)',
                opacity: 0.6
              }}>
                <IonIcon icon={calendar} style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.3 }} />
                <p style={{ fontSize: '18px', fontWeight: '500', margin: '0 0 8px 0' }}>No events found</p>
                <p style={{ fontSize: '14px', margin: 0 }}>
                  {searchQuery || filterBy !== 'all' 
                    ? 'Try adjusting your search or filters' 
                    : 'Start by adding your first event'}
                </p>
              </div>
            ) : (
              getSortedAndFilteredEvents().map((event) => (
                <div
                  key={event._id}
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
                    e.currentTarget.style.borderColor = '#f59e0b40';
                    e.currentTarget.style.background = '#f59e0b08';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px #f59e0b20';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--ion-color-step-200)';
                    e.currentTarget.style.background = 'var(--ion-card-background)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  onClick={() => openEditPage(event)}
                >
                  {/* Left accent line */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '3px',
                    height: '100%',
                    background: event.isPublished ? '#10b981' : '#f59e0b',
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
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <img 
                      src={event.imageUrl ? (event.imageUrl.startsWith('/uploads') ? `${BACKEND_BASE_URL}${event.imageUrl}` : event.imageUrl) : DEFAULT_EVENT_THUMBNAIL} 
                      alt={event.title || 'Event'}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        position: 'absolute',
                        top: 0,
                        left: 0
                      }}
                      onError={(e) => {
                        if (event.imageUrl && !failedThumbnails.has(event._id)) {
                          (e.target as HTMLImageElement).src = DEFAULT_EVENT_THUMBNAIL;
                          setFailedThumbnails(prev => new Set(prev).add(event._id));
                        }
                      }}
                    />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: 'var(--ion-text-color)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        {event.title || 'Untitled'}
                      </p>
                    </div>
                    <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: 'var(--ion-color-medium)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {event.organizer || 'Dove Church'}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--ion-color-medium)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <IonIcon icon={calendar} style={{ fontSize: '12px' }} />
                        {event.date ? formatDate(event.date) : 'No date'}
                      </p>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--ion-color-medium)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <IonIcon icon={people} style={{ fontSize: '12px' }} />
                        {event.attendees}/{event.capacity}
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
                      background: event.isPublished ? '#10b98120' : '#f59e0b20',
                      color: event.isPublished ? '#10b981' : '#f59e0b',
                      whiteSpace: 'nowrap'
                    }}>
                      {event.isPublished ? 'Published' : 'Draft'}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div
                        onClick={(e) => { e.stopPropagation(); toggleStatus(event._id); }}
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          background: event.isPublished ? '#10b98115' : '#f59e0b15',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = event.isPublished ? '#10b98125' : '#f59e0b25'}
                        onMouseLeave={(e) => e.currentTarget.style.background = event.isPublished ? '#10b98115' : '#f59e0b15'}
                      >
                        <IonIcon 
                          icon={event.isPublished ? eyeOff : eye} 
                          style={{ fontSize: '16px', color: event.isPublished ? '#10b981' : '#f59e0b' }} 
                        />
                      </div>
                      <div
                        onClick={(e) => { e.stopPropagation(); openActionSheet(event); }}
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

        {/* FAB for adding new event */}
        <IonFab
          horizontal="end"
          vertical="bottom"
          slot="fixed"
          style={{
            '--background': '#f59e0b',
            '--box-shadow': '0 6px 20px rgba(245, 158, 11, 0.4)',
            'marginBottom': '70px',
            'marginRight': '16px'
          } as any}
        >
          <IonFabButton onClick={() => history.push('/admin/events/add')}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>
      </IonContent>

      {/* Delete Confirmation Alert */}
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
        header={selectedEvent?.title || 'Event Options'}
        buttons={[
          {
            text: 'Edit',
            icon: create,
            handler: () => {
              if (selectedEvent) openEditPage(selectedEvent);
            }
          },
          {
            text: selectedEvent?.isPublished ? 'Unpublish' : 'Publish',
            icon: selectedEvent?.isPublished ? eyeOff : eye,
            handler: () => {
              if (selectedEvent) toggleStatus(selectedEvent._id);
            }
          },
          {
            text: 'Delete',
            icon: trash,
            role: 'destructive',
            handler: () => {
              if (selectedEvent) deleteEvent(selectedEvent._id);
            }
          },
          {
            text: 'Cancel',
            icon: arrowBack,
            role: 'cancel'
          }
        ]}
      />

      {loading && events.length === 0 ? (
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
          <p style={{ fontSize: '14px', margin: 0 }}>Loading events...</p>
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

export default AdminEventManager;