import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonIcon,
  IonCard,
  IonCardContent,
  IonButton,
  IonButtons,
  IonText,
  IonLoading
} from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import {
  calendar,
  location,
  time,
  people,
  informationCircle,
  share,
  heart
} from 'ionicons/icons';
import './EventDetail.css';

const EventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    loadEvent();
  }, [id]);

  const loadEvent = async () => {
    try {
      const response = await fetch(`/api/events/${id}`);
      if (response.ok) {
        const data = await response.json();
        setEvent(data.event);
      } else {
        console.error('Failed to load event');
        history.push('/events');
      }
    } catch (error) {
      console.error('Error loading event:', error);
      history.push('/events');
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!event || !event.registrationRequired) return;

    try {
      const response = await fetch(`/api/events/${id}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'Guest User', // In a real app, get from user profile
          email: 'guest@example.com',
          phone: ''
        })
      });

      if (response.ok) {
        setIsRegistered(true);
        // Reload event to get updated attendee count
        loadEvent();
      } else {
        console.error('Failed to register');
      }
    } catch (error) {
      console.error('Error registering:', error);
    }
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatEventTime = (timeString: string) => {
    if (!timeString) return 'TBD';
    // Convert 24-hour time to 12-hour format
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <IonPage>
        <IonLoading isOpen={loading} message="Loading event..." />
      </IonPage>
    );
  }

  if (!event) {
    return (
      <IonPage>
        <IonHeader translucent>
          <IonToolbar className="toolbar-ios">
            
            <IonTitle className="title-ios">Event Not Found</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen className="content-ios">
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <IonIcon icon={informationCircle} style={{ fontSize: '4em', color: 'var(--ion-color-medium)', marginBottom: '16px' }} />
            <h2>Event Not Found</h2>
            <p>The event you're looking for doesn't exist or has been removed.</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          
          <IonTitle className="title-ios">Event Details</IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear">
              <IonIcon icon={share} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
        <div style={{ padding: '20px' }}>
          {/* Event Image */}
          {event.imageUrl && (
            <div style={{
              width: '100%',
              height: '200px',
              backgroundImage: `url(${event.imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: '12px',
              marginBottom: '20px'
            }} />
          )}

          {/* Event Title and Category */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <IonIcon icon={calendar} style={{ color: 'var(--ion-color-primary)', fontSize: '1.5em' }} />
              <span style={{
                fontWeight: '600',
                backgroundColor: 'var(--ion-color-primary)',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '16px',
                fontSize: '0.85em'
              }}>
                {event.category || 'Event'}
              </span>
            </div>
            <h1 style={{
              margin: '0 0 12px 0',
              fontSize: '1.8em',
              fontWeight: '700',
              color: 'var(--ion-text-color)'
            }}>
              {event.title}
            </h1>
          </div>

          {/* Event Details Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
            {/* Date & Time */}
            <IonCard style={{ margin: '0', borderRadius: '12px' }}>
              <IonCardContent style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <IonIcon icon={calendar} style={{ color: 'var(--ion-color-primary)' }} />
                  <span style={{ fontWeight: '600', color: 'var(--ion-text-color)' }}>Date & Time</span>
                </div>
                <p style={{ margin: '0 0 4px 0', color: 'var(--ion-text-color)', fontSize: '1.1em' }}>
                  {formatEventDate(event.date)}
                </p>
                <p style={{ margin: '0', color: 'var(--ion-color-medium)' }}>
                  <IonIcon icon={time} style={{ marginRight: '8px' }} />
                  {formatEventTime(event.time)}
                </p>
              </IonCardContent>
            </IonCard>

            {/* Location */}
            <IonCard style={{ margin: '0', borderRadius: '12px' }}>
              <IonCardContent style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <IonIcon icon={location} style={{ color: 'var(--ion-color-primary)' }} />
                  <span style={{ fontWeight: '600', color: 'var(--ion-text-color)' }}>Location</span>
                </div>
                <p style={{ margin: '0', color: 'var(--ion-text-color)', fontSize: '1.1em' }}>
                  {event.location}
                </p>
              </IonCardContent>
            </IonCard>

            {/* Attendees */}
            {event.registrationRequired && (
              <IonCard style={{ margin: '0', borderRadius: '12px' }}>
                <IonCardContent style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <IonIcon icon={people} style={{ color: 'var(--ion-color-primary)' }} />
                    <span style={{ fontWeight: '600', color: 'var(--ion-text-color)' }}>Registration</span>
                  </div>
                  <p style={{ margin: '0', color: 'var(--ion-text-color)' }}>
                    {event.currentAttendees || 0} / {event.maxAttendees || 'Unlimited'} attendees
                  </p>
                  {event.maxAttendees && (
                    <div style={{
                      width: '100%',
                      height: '8px',
                      backgroundColor: 'var(--ion-color-light)',
                      borderRadius: '4px',
                      marginTop: '8px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${Math.min(((event.currentAttendees || 0) / event.maxAttendees) * 100, 100)}%`,
                        height: '100%',
                        backgroundColor: 'var(--ion-color-primary)',
                        borderRadius: '4px'
                      }} />
                    </div>
                  )}
                </IonCardContent>
              </IonCard>
            )}
          </div>

          {/* Event Description */}
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{
              margin: '0 0 16px 0',
              fontSize: '1.4em',
              fontWeight: '600',
              color: 'var(--ion-text-color)'
            }}>
              About This Event
            </h2>
            <IonCard style={{ margin: '0', borderRadius: '12px' }}>
              <IonCardContent style={{ padding: '16px' }}>
                {event.description.split('\n').filter((p: string) => p.trim()).map((paragraph: string, index: number) => (
                  <p key={index} style={{
                    margin: '0 0 12px 0',
                    color: 'var(--ion-text-color)',
                    lineHeight: '1.6',
                    fontSize: '1em'
                  }}>
                    {paragraph.trim()}
                  </p>
                ))}
              </IonCardContent>
            </IonCard>
          </div>

          {/* Speaker/Organizer Info */}
          {event.speaker && (
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{
                margin: '0 0 16px 0',
                fontSize: '1.4em',
                fontWeight: '600',
                color: 'var(--ion-text-color)'
              }}>
                Speaker/Organizer
              </h2>
              <IonCard style={{ margin: '0', borderRadius: '12px' }}>
                <IonCardContent style={{ padding: '16px' }}>
                  <p style={{ margin: '0', color: 'var(--ion-text-color)', fontSize: '1.1em', fontWeight: '600' }}>
                    {event.speaker}
                  </p>
                </IonCardContent>
              </IonCard>
            </div>
          )}

          {/* Contact Information */}
          {(event.contactEmail || event.contactPhone) && (
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{
                margin: '0 0 16px 0',
                fontSize: '1.4em',
                fontWeight: '600',
                color: 'var(--ion-text-color)'
              }}>
                Contact Information
              </h2>
              <IonCard style={{ margin: '0', borderRadius: '12px' }}>
                <IonCardContent style={{ padding: '16px' }}>
                  {event.contactEmail && (
                    <p style={{ margin: '0 0 8px 0', color: 'var(--ion-text-color)' }}>
                      <strong>Email:</strong> {event.contactEmail}
                    </p>
                  )}
                  {event.contactPhone && (
                    <p style={{ margin: '0', color: 'var(--ion-text-color)' }}>
                      <strong>Phone:</strong> {event.contactPhone}
                    </p>
                  )}
                </IonCardContent>
              </IonCard>
            </div>
          )}

          {/* Registration Button */}
          {event.registrationRequired && (
            <div style={{ marginBottom: '24px' }}>
              <IonButton
                expand="block"
                onClick={handleRegister}
                disabled={isRegistered || (event.maxAttendees && event.currentAttendees >= event.maxAttendees)}
                style={{
                  height: '48px',
                  borderRadius: '24px',
                  fontWeight: '600',
                  backgroundColor: isRegistered ? 'var(--ion-color-success)' : 'var(--ion-color-primary)',
                  '--border-radius': '24px'
                }}
              >
                <IonIcon icon={isRegistered ? heart : people} slot="start" />
                {isRegistered ? 'Registered' :
                 event.maxAttendees && event.currentAttendees >= event.maxAttendees ? 'Event Full' :
                 'Register for Event'}
              </IonButton>
            </div>
          )}

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <IonText style={{
              color: 'var(--ion-text-color)',
              opacity: 0.6,
              fontSize: '0.9em'
            }}>
              Dove Ministries Africa
            </IonText>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default EventDetail;