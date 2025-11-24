import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
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
  IonRefresherContent
} from '@ionic/react';
import {
  add,
  create,
  trash,
  calendar,
  location,
  people,
  time,
  eye,
  eyeOff
} from 'ionicons/icons';

const AdminEventManager: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    description: '',
    status: 'draft',
    capacity: ''
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    // Mock data - replace with API call
    const mockEvents = [
      {
        id: '1',
        title: 'Transformation Conference 2025',
        date: '2025-02-15',
        time: '09:00 AM',
        location: 'Main Sanctuary',
        description: 'Annual transformation conference',
        status: 'published',
        attendees: 150,
        capacity: 200
      },
      {
        id: '2',
        title: 'Youth Camp 2025',
        date: '2025-03-20',
        time: '06:00 PM',
        location: 'Mountain Resort',
        description: 'Youth spiritual retreat',
        status: 'published',
        attendees: 75,
        capacity: 100
      },
      {
        id: '3',
        title: 'Prayer Meeting',
        date: '2025-01-25',
        time: '07:00 PM',
        location: 'Fellowship Hall',
        description: 'Weekly prayer gathering',
        status: 'draft',
        attendees: 0,
        capacity: 50
      }
    ];
    setEvents(mockEvents);
    setLoading(false);
  };

  const handleRefresh = async (event: CustomEvent) => {
    await loadEvents();
    event.detail.complete();
  };

  const toggleStatus = (id: string) => {
    setEvents(events.map(event =>
      event.id === id
        ? { ...event, status: event.status === 'published' ? 'draft' : 'published' }
        : event
    ));
  };

  const deleteEvent = (id: string) => {
    setEvents(events.filter(event => event.id !== id));
  };

  const openEditModal = (event: any) => {
    setEditingEvent(event);
    setEditFormData({
      title: event.title || '',
      date: event.date || '',
      time: event.time || '',
      location: event.location || '',
      description: event.description || '',
      status: event.status || 'draft',
      capacity: event.capacity?.toString() || ''
    });
    setShowEditModal(true);
  };

  const handleEditInputChange = (field: string, value: string) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveEdit = () => {
    if (!editFormData.title || !editFormData.date || !editFormData.time || !editFormData.location) {
      return;
    }

    setEvents(events.map(event =>
      event.id === editingEvent.id
        ? { ...event, ...editFormData, capacity: parseInt(editFormData.capacity) || 0 }
        : event
    ));
    setShowEditModal(false);
    setEditingEvent(null);
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/admin" />
          </IonButtons>
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
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '12px',
            marginBottom: '24px'
          }}>
            <div style={{
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              padding: '16px',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5em', fontWeight: '700', color: '#f59e0b' }}>
                {events.length}
              </div>
              <div style={{ fontSize: '0.8em', color: 'var(--ion-color-medium)' }}>Total Events</div>
            </div>
            <div style={{
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              padding: '16px',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5em', fontWeight: '700', color: '#10b981' }}>
                {events.filter(e => e.status === 'published').length}
              </div>
              <div style={{ fontSize: '0.8em', color: 'var(--ion-color-medium)' }}>Published</div>
            </div>
            <div style={{
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              padding: '16px',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5em', fontWeight: '700', color: '#3b82f6' }}>
                {events.reduce((sum, e) => sum + e.attendees, 0)}
              </div>
              <div style={{ fontSize: '0.8em', color: 'var(--ion-color-medium)' }}>Total Attendees</div>
            </div>
          </div>

          {/* Add Button */}
          <div style={{ marginBottom: '24px' }}>
            <IonButton
              expand="block"
              routerLink="/admin/events/add"
              style={{
                height: '48px',
                borderRadius: '24px',
                fontWeight: '600',
                backgroundColor: 'var(--ion-color-primary)',
                '--border-radius': '24px'
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
              All Events
            </h2>

            {events.map((event) => (
              <IonCard key={event.id} style={{ margin: '0 0 12px 0', borderRadius: '12px' }}>
                <IonCardContent style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <h3 style={{
                          margin: '0',
                          fontSize: '1.1em',
                          fontWeight: '600',
                          color: 'var(--ion-text-color)'
                        }}>
                          {event.title}
                        </h3>
                        <IonBadge
                          style={{
                            backgroundColor: event.status === 'published' ? '#10b981' : '#f59e0b',
                            color: 'white',
                            fontWeight: '600',
                            borderRadius: '8px'
                          }}
                        >
                          {event.status}
                        </IonBadge>
                      </div>
                      <p style={{
                        margin: '0 0 8px 0',
                        fontSize: '0.9em',
                        color: 'var(--ion-color-medium)'
                      }}>
                        {event.description}
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8em', color: 'var(--ion-color-medium)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <IonIcon icon={calendar} />
                          {event.date} at {event.time}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <IonIcon icon={location} />
                          {event.location}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <IonIcon icon={people} />
                          {event.attendees}/{event.capacity} attendees
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <IonButton
                          fill="clear"
                          size="small"
                          onClick={() => toggleStatus(event.id)}
                          style={{ color: 'var(--ion-color-primary)' }}
                        >
                          <IonIcon icon={event.status === 'published' ? eyeOff : eye} />
                        </IonButton>
                        <IonButton
                          fill="clear"
                          size="small"
                          onClick={() => openEditModal(event)}
                          style={{ color: 'var(--ion-color-primary)' }}
                        >
                          <IonIcon icon={create} />
                        </IonButton>
                        <IonButton
                          fill="clear"
                          size="small"
                          style={{ color: '#ef4444' }}
                          onClick={() => deleteEvent(event.id)}
                        >
                          <IonIcon icon={trash} />
                        </IonButton>
                      </div>
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
              Dove Ministries Africa - Event Management
            </IonText>
          </div>
        </div>

        {/* Edit Event Modal */}
        {showEditModal && (
          <>
            <style>{`
              .edit-sidebar-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0);
                z-index: 9998;
                opacity: 1;
                visibility: visible;
                transition: all 0.3s ease-in-out;
              }

              .edit-floating-sidebar {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) scale(0.8);
                width: 90%;
                max-width: 500px;
                max-height: 70vh;
                height: auto;
                padding: 20px;
                border-radius: 24px;
                border: 1px solid var(--ion-color-medium);
                backdrop-filter: blur(22px);
                -webkit-backdrop-filter: blur(22px);
                background: rgba(var(--ion-background-color-rgb), 0.9);
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                z-index: 9999;
                transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                display: flex;
                flex-direction: column;
                overflow: visible;
              }

              .edit-floating-sidebar.open {
                transform: translate(-50%, -50%) scale(1);
              }

              .edit-close-button {
                position: absolute;
                top: 12px;
                right: 12px;
                background: rgba(var(--ion-background-color-rgb), 0.3);
                border: 1px solid var(--ion-color-step-200);
                border-radius: 50%;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: 0.2s ease-in-out;
                z-index: 10000;
              }

              .edit-close-button:hover {
                background: rgba(var(--ion-background-color-rgb), 0.5);
                transform: scale(1.1);
              }

              .edit-content {
                margin-top: 40px;
                display: flex;
                flex-direction: column;
                gap: 16px;
                max-height: calc(70vh - 80px);
                overflow-y: auto;
                overflow-x: hidden;
                padding-right: 8px;
                -webkit-overflow-scrolling: touch;
              }

              .edit-content::-webkit-scrollbar {
                width: 6px;
              }

              .edit-content::-webkit-scrollbar-track {
                background: rgba(var(--ion-background-color-rgb), 0.1);
                border-radius: 3px;
              }

              .edit-content::-webkit-scrollbar-thumb {
                background: var(--ion-color-step-400);
                border-radius: 3px;
              }

              .edit-content::-webkit-scrollbar-thumb:hover {
                background: var(--ion-color-step-500);
              }

              .edit-submit-btn {
                margin-top: 16px;
                --border-radius: 16px;
                font-weight: 600;
                flex-shrink: 0;
              }

              @media (max-width: 576px) {
                .edit-floating-sidebar {
                  width: 95%;
                  max-width: 460px;
                  max-height: 75vh;
                  padding: 16px;
                  top: 45%;
                  transform: translate(-50%, -50%) scale(0.8);
                }

                .edit-floating-sidebar.open {
                  top: 50%;
                  transform: translate(-50%, -50%) scale(1);
                }

                .edit-content {
                  max-height: calc(75vh - 80px);
                  gap: 12px;
                }
              }

              @media (max-height: 600px) {
                .edit-floating-sidebar {
                  max-height: 80vh;
                  top: 45%;
                }

                .edit-content {
                  max-height: calc(80vh - 80px);
                }
              }
            `}</style>

            <div className="edit-sidebar-overlay" onClick={() => setShowEditModal(false)}></div>

            <div className={`edit-floating-sidebar ${showEditModal ? 'open' : ''}`}>
              <div className="edit-close-button" onClick={() => setShowEditModal(false)}>
                <IonIcon icon={trash} />
              </div>

              <div className="edit-content">
                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                  <h2 style={{ margin: '0', color: 'var(--ion-text-color)', fontSize: '1.3em', fontWeight: '700' }}>
                    Edit Event
                  </h2>
                </div>

                <IonItem style={{ '--border-radius': '12px' }}>
                  <IonLabel position="stacked">Event Title *</IonLabel>
                  <IonInput
                    value={editFormData.title}
                    onIonChange={(e) => handleEditInputChange('title', e.detail.value!)}
                    placeholder="Enter event title"
                  />
                </IonItem>

                <IonItem style={{ '--border-radius': '12px' }}>
                  <IonLabel position="stacked">Date *</IonLabel>
                  <IonInput
                    type="date"
                    value={editFormData.date}
                    onIonChange={(e) => handleEditInputChange('date', e.detail.value!)}
                  />
                </IonItem>

                <IonItem style={{ '--border-radius': '12px' }}>
                  <IonLabel position="stacked">Time *</IonLabel>
                  <IonInput
                    type="time"
                    value={editFormData.time}
                    onIonChange={(e) => handleEditInputChange('time', e.detail.value!)}
                  />
                </IonItem>

                <IonItem style={{ '--border-radius': '12px' }}>
                  <IonLabel position="stacked">Location *</IonLabel>
                  <IonInput
                    value={editFormData.location}
                    onIonChange={(e) => handleEditInputChange('location', e.detail.value!)}
                    placeholder="Enter event location"
                  />
                </IonItem>

                <IonItem style={{ '--border-radius': '12px' }}>
                  <IonLabel position="stacked">Capacity</IonLabel>
                  <IonInput
                    type="number"
                    value={editFormData.capacity}
                    onIonChange={(e) => handleEditInputChange('capacity', e.detail.value!)}
                    placeholder="Enter capacity"
                  />
                </IonItem>

                <IonItem style={{ '--border-radius': '12px' }}>
                  <IonLabel position="stacked">Status</IonLabel>
                  <IonSelect
                    value={editFormData.status}
                    onIonChange={(e) => handleEditInputChange('status', e.detail.value)}
                  >
                    <IonSelectOption value="draft">Draft</IonSelectOption>
                    <IonSelectOption value="published">Published</IonSelectOption>
                  </IonSelect>
                </IonItem>

                <IonItem style={{ '--border-radius': '12px' }}>
                  <IonLabel position="stacked">Description</IonLabel>
                  <IonTextarea
                    value={editFormData.description}
                    onIonChange={(e) => handleEditInputChange('description', e.detail.value!)}
                    placeholder="Enter event description"
                    rows={3}
                  />
                </IonItem>

                <IonButton
                  expand="block"
                  onClick={handleSaveEdit}
                  disabled={!editFormData.title || !editFormData.date || !editFormData.time || !editFormData.location}
                  className="edit-submit-btn"
                >
                  <IonIcon icon={create} slot="start" />
                  Save Changes
                </IonButton>
              </div>
            </div>
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default AdminEventManager;