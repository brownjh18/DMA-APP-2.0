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
  IonFab,
  IonFabButton,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  useIonViewWillEnter
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import AdminPopover from '../components/AdminPopover';
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
  checkmarkCircle
} from 'ionicons/icons';
import './AdminManager.css';
import './AdminDashboard.css';

const PAGE_SIZE = 20;

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
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);

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

  const handleInfiniteScroll = (e: any) => {
    setTimeout(() => {
      setDisplayCount(prev => prev + PAGE_SIZE);
      e.target.complete();
    }, 300);
  };

  const sortedAndFiltered = getSortedAndFilteredEvents();
  const displayedEvents = sortedAndFiltered.slice(0, displayCount);

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <IonButton fill="clear" slot="start" onClick={() => history.goBack()} style={{ marginLeft: '4px' }}>
            <IonIcon icon={arrowBack} style={{ fontSize: '22px' }} />
          </IonButton>
          <IonTitle className="title-ios" style={{ textAlign: 'left', marginLeft: '-16px' }}>Event Manager</IonTitle>
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
                onClick={() => {
                  if (mod.name === 'Total Events') setFilterBy('all');
                  else if (mod.name === 'Published') setFilterBy(filterBy === 'published' ? 'all' : 'published');
                }}
              >
                <div className="am-stat-dot" style={{ background: mod.color }} />
                <div className="am-stat-data">
                  <span className="am-stat-num" style={{ color: mod.color }}>{mod.val}</span>
                  <span className="am-stat-txt">{mod.sub}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Search Bar */}
          <div className="am-section">
            <div className="am-search">
              <div className="am-search-box">
                <IonIcon icon={search} />
                <input
                  type="text"
                  placeholder="Search events..."
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
          </div>

          {/* Events List */}
          <div className="am-list">
            {displayedEvents.length === 0 ? (
              <div className="am-empty">
                <IonIcon icon={calendar} />
                <p className="am-empty-title">No events found</p>
                <p className="am-empty-text">
                  {searchQuery || filterBy !== 'all' 
                    ? 'Try adjusting your search or filters' 
                    : 'Start by adding your first event'}
                </p>
              </div>
            ) : (
              displayedEvents.map((event) => (
                <div
                  key={event._id}
                  className="am-card"
                  onClick={() => openEditPage(event)}
                >
                  {/* Left accent line */}
                  <div className={`am-accent ${event.isPublished ? 'green' : 'amber'}`} />

                  {/* Thumbnail */}
                  <div className="am-thumb">
                    <img 
                      src={event.imageUrl ? (event.imageUrl.startsWith('/uploads') ? `${BACKEND_BASE_URL}${event.imageUrl}` : event.imageUrl) : DEFAULT_EVENT_THUMBNAIL} 
                      alt={event.title || 'Event'}
                      onError={(e) => {
                        if (event.imageUrl && !failedThumbnails.has(event._id)) {
                          (e.target as HTMLImageElement).src = DEFAULT_EVENT_THUMBNAIL;
                          setFailedThumbnails(prev => new Set(prev).add(event._id));
                        }
                      }}
                    />
                  </div>

                  {/* Content */}
                  <div className="am-content">
                    <p className="am-title">
                      {event.title || 'Untitled'}
                    </p>
                    <p className="am-subtitle">
                      {event.organizer || 'Dove Church'}
                    </p>
                    <div className="am-meta">
                      <p className="am-meta-item">
                        <IonIcon icon={calendar} />
                        {event.date ? formatDate(event.date) : 'No date'}
                      </p>
                      <p className="am-meta-item">
                        <IonIcon icon={people} />
                        {event.attendees}/{event.capacity}
                      </p>
                    </div>
                  </div>

                  {/* Action buttons with status badge */}
                  <div className="am-actions">
                    <div className={`am-status ${event.isPublished ? 'published' : 'draft'}`}>
                      {event.isPublished ? 'Published' : 'Draft'}
                    </div>
                    <div className="am-btns">
                      <div
                        className={`am-btn toggle ${event.isPublished ? '' : 'inactive'}`}
                        onClick={(e) => { e.stopPropagation(); toggleStatus(event._id); }}
                      >
                        <IonIcon icon={event.isPublished ? eyeOff : eye} />
                      </div>
                      <div
                        className="am-btn more"
                        onClick={(e) => { e.stopPropagation(); openActionSheet(event); }}
                      >
                        <IonIcon icon={ellipsisVertical} />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="am-footer">
            <IonText>Dove Church • Admin Panel v2.0</IonText>
          </div>

          {/* Infinite Scroll */}
          {displayedEvents.length < sortedAndFiltered.length && (
            <IonInfiniteScroll onIonInfinite={handleInfiniteScroll}>
              <IonInfiniteScrollContent />
            </IonInfiniteScroll>
          )}
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

      {/* Action Popover */}
      <AdminPopover
        isOpen={showActionSheet}
        onDidDismiss={() => setShowActionSheet(false)}
        header={selectedEvent?.title || 'Event Options'}
        options={[
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
            role: 'cancel',
            handler: () => {}
          }
        ]}
      />

      {loading && events.length === 0 ? (
        <div className="am-loading">
          <div className="am-loading-spinner" />
          <p>Loading events...</p>
        </div>
      ) : null}
    </IonPage>
  );
};

export default AdminEventManager;
