import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButtons, IonBackButton, IonIcon, IonBadge, IonSegment, IonSegmentButton, IonLabel } from '@ionic/react';
import { heart, play, book, removeCircle, bookmark } from 'ionicons/icons';
import { useState } from 'react';

const MyFavorites: React.FC = () => {
  const [segment, setSegment] = useState<string>('sermons');

  // Mock favorite data
  const favoriteSermons = [
    { id: 1, title: 'The Power of Prayer', speaker: 'Pastor Daniel Kaggwa', date: '2025-11-10', duration: '45:30' },
    { id: 2, title: 'Fruit of the Spirit: Love', speaker: 'Pastor Erica Kaggwa', date: '2025-11-03', duration: '42:15' },
    { id: 3, title: 'Transformation Through Faith', speaker: 'Evangelist Jonah', date: '2025-10-27', duration: '38:45' },
  ];

  const favoriteDevotions = [
    { id: 1, title: 'God\'s Unconditional Love', scripture: 'John 3:16', date: '2025-11-17' },
    { id: 2, title: 'The Power of Faith', scripture: 'Hebrews 11:1', date: '2025-11-16' },
    { id: 3, title: 'Walking in Grace', scripture: 'Ephesians 2:8-9', date: '2025-11-15' },
  ];

  const favoriteEvents = [
    { id: 1, title: 'Transformation Conference', date: '2025-11-17 to 2025-11-23', location: 'Kyazanga' },
    { id: 2, title: '20th Anniversary Celebration', date: '2025-12-01 to 2025-12-04', location: 'Zana' },
  ];

  const renderContent = () => {
    switch (segment) {
      case 'sermons':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {favoriteSermons.map((sermon) => (
              <div
                key={sermon.id}
                style={{
                  backgroundColor: 'rgba(0,0,0,0.05)',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid var(--ion-color-step-300)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div style={{
                  backgroundColor: 'var(--ion-color-primary)',
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <IonIcon icon={play} style={{ color: 'white', fontSize: '1.1em' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    margin: '0 0 4px 0',
                    fontSize: '1em',
                    fontWeight: '600',
                    color: 'var(--ion-text-color)'
                  }}>
                    {sermon.title}
                  </h3>
                  <p style={{
                    margin: '0',
                    fontSize: '0.85em',
                    color: 'var(--ion-color-medium)'
                  }}>
                    {sermon.speaker} • {sermon.date} • {sermon.duration}
                  </p>
                </div>
                <IonIcon
                  icon={removeCircle}
                  style={{
                    color: '#ef4444',
                    fontSize: '1.3em',
                    cursor: 'pointer'
                  }}
                />
              </div>
            ))}
          </div>
        );
      case 'devotions':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {favoriteDevotions.map((devotion) => (
              <div
                key={devotion.id}
                style={{
                  backgroundColor: 'rgba(0,0,0,0.05)',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid var(--ion-color-step-300)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div style={{
                  backgroundColor: 'var(--ion-color-primary)',
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <IonIcon icon={book} style={{ color: 'white', fontSize: '1.1em' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    margin: '0 0 4px 0',
                    fontSize: '1em',
                    fontWeight: '600',
                    color: 'var(--ion-text-color)'
                  }}>
                    {devotion.title}
                  </h3>
                  <p style={{
                    margin: '0',
                    fontSize: '0.85em',
                    color: 'var(--ion-color-medium)'
                  }}>
                    {devotion.scripture} • {devotion.date}
                  </p>
                </div>
                <IonIcon
                  icon={removeCircle}
                  style={{
                    color: '#ef4444',
                    fontSize: '1.3em',
                    cursor: 'pointer'
                  }}
                />
              </div>
            ))}
          </div>
        );
      case 'events':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {favoriteEvents.map((event) => (
              <div
                key={event.id}
                style={{
                  backgroundColor: 'rgba(0,0,0,0.05)',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid var(--ion-color-step-300)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div style={{
                  backgroundColor: 'var(--ion-color-primary)',
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <IonIcon icon={heart} style={{ color: 'white', fontSize: '1.1em' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    margin: '0 0 4px 0',
                    fontSize: '1em',
                    fontWeight: '600',
                    color: 'var(--ion-text-color)'
                  }}>
                    {event.title}
                  </h3>
                  <p style={{
                    margin: '0',
                    fontSize: '0.85em',
                    color: 'var(--ion-color-medium)'
                  }}>
                    📍 {event.location} • {event.date}
                  </p>
                </div>
                <IonIcon
                  icon={removeCircle}
                  style={{
                    color: '#ef4444',
                    fontSize: '1.3em',
                    cursor: 'pointer'
                  }}
                />
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/profile" />
          </IonButtons>
          <IonTitle className="title-ios">My Favorites</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
        <div style={{
          padding: '20px',
          maxWidth: '400px',
          margin: '0 auto',
          paddingTop: '40px'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <IonIcon
              icon={bookmark}
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
              My Favorites
            </h1>
            <p style={{
              margin: '0',
              color: 'var(--ion-text-color)',
              opacity: 0.7,
              fontSize: '1em'
            }}>
              {segment === 'sermons' ? favoriteSermons.length :
               segment === 'devotions' ? favoriteDevotions.length :
               favoriteEvents.length} {segment === 'sermons' ? 'sermons' :
                                      segment === 'devotions' ? 'devotions' : 'events'}
            </p>
          </div>

          {/* Category Selector */}
          <div style={{ marginBottom: '24px' }}>
            <IonSegment
              value={segment}
              onIonChange={(e) => setSegment(e.detail.value as string)}
              style={{
                '--background': 'rgba(0,0,0,0.05)',
                '--background-checked': 'var(--ion-color-primary)',
                '--color-checked': 'white',
                '--border-radius': '12px',
                backgroundColor: 'rgba(0,0,0,0.05)',
                borderRadius: '12px',
                padding: '4px',
                border: '1px solid var(--ion-color-step-300)'
              }}
            >
              <IonSegmentButton value="sermons" style={{ '--border-radius': '8px' }}>
                <IonLabel style={{ fontWeight: '600', fontSize: '0.9em' }}>Sermons</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="devotions" style={{ '--border-radius': '8px' }}>
                <IonLabel style={{ fontWeight: '600', fontSize: '0.9em' }}>Devotions</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="events" style={{ '--border-radius': '8px' }}>
                <IonLabel style={{ fontWeight: '600', fontSize: '0.9em' }}>Events</IonLabel>
              </IonSegmentButton>
            </IonSegment>
          </div>

          {/* CONTENT */}
          {renderContent()}

          {/* Empty State */}
          {segment === 'sermons' && favoriteSermons.length === 0 && (
            <div style={{
              backgroundColor: 'rgba(0,0,0,0.05)',
              borderRadius: '12px',
              padding: '32px 20px',
              textAlign: 'center',
              border: '1px solid var(--ion-color-step-300)'
            }}>
              <IonIcon
                icon={play}
                style={{
                  fontSize: '3em',
                  color: 'var(--ion-color-primary)',
                  marginBottom: '16px'
                }}
              />
              <h3 style={{
                margin: '0 0 8px 0',
                fontSize: '1.2em',
                fontWeight: '600',
                color: 'var(--ion-text-color)'
              }}>
                No Favorite Sermons
              </h3>
              <p style={{
                margin: '0',
                fontSize: '0.9em',
                color: 'var(--ion-color-medium)',
                lineHeight: '1.5'
              }}>
                Start watching sermons and tap the heart icon to add them to your favorites.
              </p>
            </div>
          )}

          {segment === 'devotions' && favoriteDevotions.length === 0 && (
            <div style={{
              backgroundColor: 'rgba(0,0,0,0.05)',
              borderRadius: '12px',
              padding: '32px 20px',
              textAlign: 'center',
              border: '1px solid var(--ion-color-step-300)'
            }}>
              <IonIcon
                icon={book}
                style={{
                  fontSize: '3em',
                  color: 'var(--ion-color-primary)',
                  marginBottom: '16px'
                }}
              />
              <h3 style={{
                margin: '0 0 8px 0',
                fontSize: '1.2em',
                fontWeight: '600',
                color: 'var(--ion-text-color)'
              }}>
                No Favorite Devotions
              </h3>
              <p style={{
                margin: '0',
                fontSize: '0.9em',
                color: 'var(--ion-color-medium)',
                lineHeight: '1.5'
              }}>
                Read devotions and tap the heart icon to add them to your favorites.
              </p>
            </div>
          )}

          {segment === 'events' && favoriteEvents.length === 0 && (
            <div style={{
              backgroundColor: 'rgba(0,0,0,0.05)',
              borderRadius: '12px',
              padding: '32px 20px',
              textAlign: 'center',
              border: '1px solid var(--ion-color-step-300)'
            }}>
              <IonIcon
                icon={heart}
                style={{
                  fontSize: '3em',
                  color: 'var(--ion-color-primary)',
                  marginBottom: '16px'
                }}
              />
              <h3 style={{
                margin: '0 0 8px 0',
                fontSize: '1.2em',
                fontWeight: '600',
                color: 'var(--ion-text-color)'
              }}>
                No Favorite Events
              </h3>
              <p style={{
                margin: '0',
                fontSize: '0.9em',
                color: 'var(--ion-color-medium)',
                lineHeight: '1.5'
              }}>
                Browse upcoming events and tap the heart icon to add them to your favorites.
              </p>
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default MyFavorites;