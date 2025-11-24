import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardContent, IonButtons, IonBackButton, IonIcon, IonRouterLink, IonButton } from '@ionic/react';
import { calendar, location, time, people } from 'ionicons/icons';
import './Events.css';

const Events: React.FC = () => {
  const events = [
    {
      id: 1,
      title: 'Transformation Conference',
      date: 'Nov 17-23, 2025',
      time: '9:00 AM - 4:00 PM',
      location: 'Kyazanga',
      description: 'A week of Transformation, and knowing who you were born to be in God\'s Kingdom',
      type: 'Conference',
      image: 'event.jpg'
    },
    {
      id: 2,
      title: '20th Anniversary Celebration',
      date: 'Dec 1-4, 2025',
      time: '9:00 AM - 6:00 PM',
      location: 'Zana',
      description: 'Join us as we celebrate 20 years of existence as Dove Church in Uganda',
      type: 'Celebration',
      image: '20th.jpg'
    },
    {
      id: 3,
      title: 'Sunday Special Service',
      date: 'Nov 2025',
      time: '4:00 PM - 7:00 PM',
      location: 'Zana',
      description: 'Divine Healing & Restoration',
      type: 'Service',
      image: 'Sunday Stream.jpg'
    }
  ];

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
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tab1" />
          </IonButtons>
          <IonTitle className="title-ios">Events</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
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
              {events.map((event) => (
                <div key={event.id} style={{
                  backgroundColor: 'rgba(0,0,0,0.05)',
                  borderRadius: '12px',
                  border: '1px solid rgba(0,0,0,0.1)',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '120px',
                    backgroundImage: `url(/public/${event.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }} />
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
                        {event.type}
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
                      {event.date} • {event.location}
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
              ))}
            </div>
          </div>

          {/* Weekly Programs */}
          <div style={{ marginBottom: '32px' }}>
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