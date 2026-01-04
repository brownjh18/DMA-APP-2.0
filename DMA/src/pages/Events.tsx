import React, { useState, useEffect } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardContent, IonIcon, IonButton, IonRefresher, IonRefresherContent } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { calendar, location, time, people, arrowBack } from 'ionicons/icons';
import { apiService } from '../services/api';
import './Events.css';

const Events: React.FC = () => {
  const history = useHistory();
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUpcomingEvents();
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

  const weeklyPrograms = [
    { day: 'Mon', program: 'Enough is Enough Prayer Service', time: '5:00PM - 7:00PM', color: '#ff6b6b' },
    { day: 'Tue', program: 'New Believers Class', time: '4:00PM - 5:00PM', color: '#4ecdc4' },
    { day: 'Wed', program: 'Intercessions & Bible Study', time: '8:00AM - 8:00PM', color: '#45b7d1' },
    { day: 'Thu', program: 'Worship Team Fellowship', time: '7:00PM - 9:00PM', color: '#f9ca24' },
    { day: 'Fri', program: "Eagle's Friday Prayer Service", time: '6:00PM - 8:00PM', color: '#f0932b' },
    { day: 'Sat', program: 'Worship Team Fellowship', time: '6:00PM - 9:00PM', color: '#eb4d4b' },
    { day: 'Sun', program: 'Sunday Services', time: '7:30AM - 1:30PM', color: '#6c5ce7' },
  ];

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          
          <IonTitle className="title-ios">Events</IonTitle>
        </IonToolbar>
      </IonHeader>

      {/* Back Button */}
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
              Church Events
            </h1>
            <p style={{
              margin: '0',
              color: 'var(--ion-text-color)',
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
              color: 'var(--ion-text-color)'
            }}>
              Upcoming Events
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {upcomingEvents.length > 0 ? upcomingEvents.map((event: any) => (
                <div key={event._id} style={{
                  backgroundColor: 'rgba(0,0,0,0.05)',
                  borderRadius: '12px',
                  border: '1px solid rgba(0,0,0,0.1)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
                onClick={() => history.push(`/event/${event._id}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}>
                    {event.imageUrl && (
                      <div style={{
                        height: '120px',
                        backgroundImage: `url(${event.imageUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }} />
                    )}
                    <div style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <IonIcon icon={calendar} style={{ color: 'var(--ion-color-primary)', fontSize: '1.2em' }} />
                        <span style={{
                          fontWeight: '600',
                          backgroundColor: 'var(--ion-color-primary)',
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
                        color: 'var(--ion-text-color)'
                      }}>
                        {event.title}
                      </h3>
                      <p style={{
                        margin: '0 0 8px 0',
                        color: 'var(--ion-color-medium)',
                        fontSize: '0.9em'
                      }}>
                        {formatEventDate(event.date)} • {event.location}
                      </p>
                      <p style={{
                        margin: '0',
                        color: 'var(--ion-color-medium)',
                        fontSize: '0.9em',
                        lineHeight: '1.4'
                      }}>
                        {event.description}
                      </p>
                    </div>
                </div>
              )) : (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: 'var(--ion-color-medium)'
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
              color: 'var(--ion-text-color)'
            }}>
              Weekly Programs
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {weeklyPrograms.map((p, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'rgba(0,0,0,0.05)',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(0,0,0,0.1)'
                }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '12px',
                    backgroundColor: p.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '16px',
                    flexShrink: 0
                  }}>
                    <span style={{
                      color: 'white',
                      fontWeight: '700',
                      fontSize: '1.1em'
                    }}>
                      {p.day}
                    </span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{
                      margin: '0 0 4px 0',
                      fontSize: '1em',
                      fontWeight: '600',
                      color: 'var(--ion-text-color)'
                    }}>
                      {p.program}
                    </h4>
                    <p style={{
                      margin: '0',
                      fontSize: '0.9em',
                      color: 'var(--ion-color-medium)'
                    }}>
                      {p.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Host Your Event */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{
              margin: '0 0 16px 0',
              fontSize: '1.4em',
              fontWeight: '600',
              color: 'var(--ion-text-color)'
            }}>
              Host Your Event
            </h2>

            <div style={{
              backgroundColor: 'rgba(0,0,0,0.05)',
              padding: '20px',
              borderRadius: '12px'
            }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1em' }}>Partner With Us</h3>
              <p style={{
                margin: '0 0 20px 0',
                color: 'var(--ion-text-color)',
                lineHeight: '1.5',
                fontSize: '0.9em'
              }}>
                Organize impactful events in your community with our support and resources.
              </p>

              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '1em' }}>Contact Information</h4>
                <p style={{ margin: '0 0 4px 0', fontSize: '0.9em', color: 'var(--ion-color-medium)' }}>
                  <strong>Email:</strong> thesignofthedoveministries@gmail.com
                </p>
                <p style={{ margin: '0 0 4px 0', fontSize: '0.9em', color: 'var(--ion-color-medium)' }}>
                  <strong>Phone:</strong> +256 772824677 | +256 700116734
                </p>
                <p style={{ margin: '0', fontSize: '0.9em', color: 'var(--ion-color-medium)' }}>
                  <strong>Address:</strong> Nfuufu Zone, Zzana-Bunamwaya, Kampala, Uganda
                </p>
              </div>

              <IonButton routerLink="/tab5" style={{
                height: '44px',
                borderRadius: '8px',
                fontWeight: '600',
                backgroundColor: 'var(--ion-color-primary)',
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
              color: 'var(--ion-text-color)',
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