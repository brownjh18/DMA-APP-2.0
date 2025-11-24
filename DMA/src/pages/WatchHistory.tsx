import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButtons, IonBackButton, IonIcon, IonBadge } from '@ionic/react';
import { play, time, removeCircle, videocam } from 'ionicons/icons';

const WatchHistory: React.FC = () => {
  // Mock watch history data
  const watchHistory = [
    {
      id: 1,
      title: 'The Power of Prayer',
      speaker: 'Pastor Daniel Kaggwa',
      date: '2025-11-17',
      time: '10:30 AM',
      duration: '45:30',
      watched: '35:20'
    },
    {
      id: 2,
      title: 'Fruit of the Spirit: Love',
      speaker: 'Pastor Erica Kaggwa',
      date: '2025-11-16',
      time: '2:15 PM',
      duration: '42:15',
      watched: '42:15'
    },
    {
      id: 3,
      title: 'Transformation Through Faith',
      speaker: 'Evangelist Jonah',
      date: '2025-11-15',
      time: '8:45 AM',
      duration: '38:45',
      watched: '25:10'
    },
    {
      id: 4,
      title: 'Married Couples Ministry: Building Strong Families',
      speaker: 'Pastor Daniel Kaggwa',
      date: '2025-11-14',
      time: '7:00 PM',
      duration: '40:22',
      watched: '40:22'
    },
    {
      id: 5,
      title: 'Youth Empowerment',
      speaker: 'Youth Leader',
      date: '2025-11-13',
      time: '4:30 PM',
      duration: '36:18',
      watched: '18:45'
    },
  ];

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const getWatchStatus = (watched: string, duration: string) => {
    const watchedMinutes = parseInt(watched.split(':')[0]) * 60 + parseInt(watched.split(':')[1]);
    const durationMinutes = parseInt(duration.split(':')[0]) * 60 + parseInt(duration.split(':')[1]);

    if (watchedMinutes >= durationMinutes) {
      return { status: 'Completed', color: '#10b981' };
    } else if (watchedMinutes > durationMinutes * 0.8) {
      return { status: 'Almost Done', color: '#f59e0b' };
    } else {
      return { status: 'In Progress', color: '#6366f1' };
    }
  };

  const totalWatchTime = watchHistory.reduce((total, item) => {
    const minutes = parseInt(item.watched.split(':')[0]) * 60 + parseInt(item.watched.split(':')[1]);
    return total + minutes;
  }, 0);

  const formatTotalTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/profile" />
          </IonButtons>
          <IonTitle className="title-ios">Watch History</IonTitle>
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
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <IonIcon
              icon={videocam}
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
              Watch History
            </h1>
            <p style={{
              margin: '0',
              color: 'var(--ion-text-color)',
              opacity: 0.7,
              fontSize: '1em'
            }}>
              {watchHistory.length} sermons • {formatTotalTime(totalWatchTime)} watched
            </p>
          </div>

          {/* Watch History List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {watchHistory.map((item) => {
              const watchStatus = getWatchStatus(item.watched, item.duration);
              return (
                <div
                  key={item.id}
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
                    backgroundColor: watchStatus.color,
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
                      {item.title}
                    </h3>
                    <p style={{
                      margin: '0',
                      fontSize: '0.85em',
                      color: 'var(--ion-color-medium)'
                    }}>
                      {item.speaker} • {item.watched}/{item.duration} • {getTimeAgo(item.date)}
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
              );
            })}
          </div>

          {/* Empty State */}
          {watchHistory.length === 0 && (
            <div style={{
              backgroundColor: 'rgba(0,0,0,0.05)',
              borderRadius: '12px',
              padding: '32px 20px',
              textAlign: 'center',
              border: '1px solid var(--ion-color-step-300)'
            }}>
              <IonIcon
                icon={videocam}
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
                No Watch History
              </h3>
              <p style={{
                margin: '0',
                fontSize: '0.9em',
                color: 'var(--ion-color-medium)',
                lineHeight: '1.5'
              }}>
                Start watching sermons to build your watch history and track your viewing progress.
              </p>
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default WatchHistory;