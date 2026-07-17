import React, { useState, useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardContent, IonIcon, IonButton, IonRefresher, IonRefresherContent, IonLoading } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { calendar, location, time, people, arrowBack } from 'ionicons/icons';
import { apiService, BACKEND_BASE_URL } from '../services/api';
import { useSettings } from '../contexts/SettingsContext';
import { WEEKLY_PROGRAMS } from '../constants/weeklyPrograms';
import './Events.css';

// Helper function to convert relative URLs to full backend URLs
const getFullUrl = (url: string) => {
  if (url && url.startsWith('/uploads/')) {
    return `${BACKEND_BASE_URL}${url}`;
  }
  return url;
};

const Events: React.FC = () => {
  const history = useHistory();
  const { isDarkMode } = useSettings();
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const loadUpcomingEvents = async () => {
      // Create an AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/events?published=true&limit=50`, {
          signal: controller.signal
        });
        
        if (response.ok) {
          const data = await response.json();
          if (isMounted) {
            setUpcomingEvents(data.events || []);
          }
        } else {
          if (isMounted) {
            setUpcomingEvents([]);
          }
        }
      } catch (error: any) {
        console.error('Error loading events:', error);
        if (isMounted) {
          setUpcomingEvents([]);
        }
      } finally {
        clearTimeout(timeoutId);
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    loadUpcomingEvents();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const loadUpcomingEvents = async () => {
    try {
      const data = await apiService.getEvents({ published: 'true', limit: 50 });
      setUpcomingEvents(data.events || []);
    } catch (error) {
      console.error('Error loading events:', error);
      setUpcomingEvents([]);
    }
    setLoading(false);
  };

  const handleRefresh = async (event: CustomEvent) => {
    await loadUpcomingEvents();
    event.detail.complete();
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <IonButton fill="clear" slot="start" onClick={() => history.goBack()} style={{ marginLeft: '4px' }}>
            <IonIcon icon={arrowBack} style={{ fontSize: '22px' }} />
          </IonButton>
          <IonTitle className="title-ios" style={{ textAlign: 'left', marginLeft: '-16px' }}>Events</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>
        <div style={{
          padding: '20px',
          maxWidth: '400px',
          margin: '0 auto',
          paddingTop: '20px'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <IonIcon
              icon={calendar}
              style={{
                fontSize: '3em',
                color: '#6366f1',
                marginBottom: '16px'
              }}
            />
            <h1 style={{
              margin: '0 0 8px 0',
              fontSize: '1.8em',
              fontWeight: '700',
              color: isDarkMode ? '#ffffff' : '#000000'
            }}>
              Church Events
            </h1>
            <p style={{
              margin: '0',
              color: isDarkMode ? '#92949c' : '#8e8e93',
              opacity: 0.7,
              fontSize: '1em'
            }}>
              Join us for upcoming events and programs
            </p>
          </div>

          {/* Upcoming Events */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{
              margin: '0 0 16px 0',
              fontSize: '1.4em',
              fontWeight: '600',
              color: isDarkMode ? '#ffffff' : '#000000'
            }}>
              Upcoming Events
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {upcomingEvents.length > 0 ? upcomingEvents.map((event: any) => (
                <div key={event._id}
                className="event-content-card"
                style={{ cursor: 'pointer' }}
                onClick={() => history.push(`/event/${event._id}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}>
                    {event.imageUrl && (
                      <div style={{
                        height: '120px',
                        backgroundImage: `url(${getFullUrl(event.imageUrl)})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }} />
                    )}
                    <div style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <IonIcon icon={calendar} style={{ color: '#6366f1', fontSize: '1.2em' }} />
                        <span style={{
                          fontWeight: '600',
                          backgroundColor: '#6366f1',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.8em'
                        }}>
                          {event.category || 'Event'}
                        </span>
                      </div>
                      <h3 style={{
                        margin: '0 0 8px 0',
                        fontSize: '1.1em',
                        fontWeight: '600',
                        color: isDarkMode ? '#ffffff' : '#000000'
                      }}>
                        {event.title}
                      </h3>
                      <p style={{
                        margin: '0 0 8px 0',
                        color: isDarkMode ? '#92949c' : '#8e8e93',
                        fontSize: '0.9em'
                      }}>
                        {formatEventDate(event.date)} • {event.location}
                      </p>
                      <p style={{
                        margin: '0 0 12px 0',
                        color: isDarkMode ? '#92949c' : '#8e8e93',
                        fontSize: '0.9em',
                        lineHeight: '1.4',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {event.description}
                      </p>
                      <IonButton
                        onClick={() => history.push(`/event/${event._id}`)}
                        style={{
                          width: '100%',
                          height: '44px',
                          borderRadius: '8px',
                          fontWeight: '600',
                          backgroundColor: '#6366f1',
                          '--border-radius': '8px'
                        }}>
                        <IonIcon icon={calendar} slot="start" />
                        Learn More
                      </IonButton>
                    </div>
                </div>
              )) : (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: isDarkMode ? '#92949c' : '#8e8e93'
                }}>
                  <IonIcon icon={calendar} style={{ fontSize: '3em', marginBottom: '16px', opacity: 0.5 }} />
                  <p>No upcoming events at this time.</p>
                </div>
              )}
            </div>
          </div>

          {/* Weekly Programs */}
          <div id="weekly-programs" style={{ marginBottom: '32px' }}>
            <h2 style={{
              margin: '0 0 16px 0',
              fontSize: '1.4em',
              fontWeight: '600',
              color: isDarkMode ? '#ffffff' : '#000000'
            }}>
              Weekly Programs
            </h2>

            <div className="weekly-programs-list" role="list" aria-label="Weekly programs">
              {WEEKLY_PROGRAMS.map((p, idx) => (
                <article
                  key={idx}
                  className="weekly-program-card"
                  role="listitem"
                  style={{ ['--program-color' as any]: p.color }}
                >
                  <div className="weekly-program-card-top">
                    <div className="weekly-program-card-icon">
                      <IonIcon icon={calendar} />
                    </div>
                    <span className="weekly-program-card-day">{p.day}</span>
                  </div>
                  <h4 className="weekly-program-card-name">{p.program}</h4>
                  <p className="weekly-program-card-desc">{p.description}</p>
                  <div className="weekly-program-card-meta">
                    <span className="weekly-program-card-time">
                      <IonIcon icon={time} />
                      {p.time}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Host Your Event */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{
              margin: '0 0 16px 0',
              fontSize: '1.4em',
              fontWeight: '600',
              color: isDarkMode ? '#ffffff' : '#000000'
            }}>
              Host Your Event
            </h2>

            <div className="host-event-section-themed">
              <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1em' }}>Partner With Us</h3>
              <p style={{
                margin: '0 0 20px 0',
                color: isDarkMode ? '#ffffff' : '#000000',
                lineHeight: '1.5',
                fontSize: '0.9em'
              }}>
                Organize impactful events in your community with our support and resources.
              </p>

              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '1em' }}>Contact Information</h4>
                <p style={{ margin: '0 0 4px 0', fontSize: '0.9em', color: isDarkMode ? '#92949c' : '#8e8e93' }}>
                  <strong>Email:</strong> thesignofthedoveministries@gmail.com
                </p>
                <p style={{ margin: '0 0 4px 0', fontSize: '0.9em', color: isDarkMode ? '#92949c' : '#8e8e93' }}>
                  <strong>Phone:</strong> +256 772824677 | +256 700116734
                </p>
                <p style={{ margin: '0', fontSize: '0.9em', color: isDarkMode ? '#92949c' : '#8e8e93' }}>
                  <strong>Address:</strong> Nfuufu Zone, Zzana-Bunamwaya, Kampala, Uganda
                </p>
              </div>

              <IonButton routerLink="/tab5" style={{
                height: '44px',
                borderRadius: '8px',
                fontWeight: '600',
                backgroundColor: '#6366f1',
                '--border-radius': '8px'
              }}>
                <IonIcon icon={people} slot="start" />
                Get In Touch
              </IonButton>
            </div>
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <p style={{
              color: isDarkMode ? '#ffffff' : '#000000',
              opacity: 0.6,
              fontSize: '0.8em',
              margin: '0'
            }}>
              Dove Ministries Africa
            </p>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Events;