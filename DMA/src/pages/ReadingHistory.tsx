import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButtons, IonBackButton, IonIcon, IonBadge } from '@ionic/react';
import { book, time, removeCircle, library } from 'ionicons/icons';

const ReadingHistory: React.FC = () => {
  // Mock reading history data
  const readingHistory = [
    {
      id: 1,
      title: 'God\'s Unconditional Love',
      scripture: 'John 3:16',
      date: '2025-11-17',
      time: '2:30 PM',
      readTime: '5 min read'
    },
    {
      id: 2,
      title: 'The Power of Faith',
      scripture: 'Hebrews 11:1',
      date: '2025-11-16',
      time: '8:15 AM',
      readTime: '4 min read'
    },
    {
      id: 3,
      title: 'Walking in Grace',
      scripture: 'Ephesians 2:8-9',
      date: '2025-11-15',
      time: '7:45 PM',
      readTime: '6 min read'
    },
    {
      id: 4,
      title: 'The Fruit of the Spirit',
      scripture: 'Galatians 5:22-23',
      date: '2025-11-14',
      time: '9:20 AM',
      readTime: '7 min read'
    },
    {
      id: 5,
      title: 'God\'s Promises',
      scripture: 'Jeremiah 29:11',
      date: '2025-11-13',
      time: '6:30 PM',
      readTime: '5 min read'
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

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/profile" />
          </IonButtons>
          <IonTitle className="title-ios">Reading History</IonTitle>
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
              icon={library}
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
              Reading History
            </h1>
            <p style={{
              margin: '0',
              color: 'var(--ion-text-color)',
              opacity: 0.7,
              fontSize: '1em'
            }}>
              {readingHistory.length} devotions • {readingHistory.reduce((total, item) => {
                const minutes = parseInt(item.readTime.split(' ')[0]);
                return total + minutes;
              }, 0)} minutes read
            </p>
          </div>

          {/* Reading History List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {readingHistory.map((item) => (
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
                    {item.title}
                  </h3>
                  <p style={{
                    margin: '0',
                    fontSize: '0.85em',
                    color: 'var(--ion-color-medium)'
                  }}>
                    {item.scripture} • {item.readTime} • {getTimeAgo(item.date)}
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

          {/* Empty State */}
          {readingHistory.length === 0 && (
            <div style={{
              backgroundColor: 'rgba(0,0,0,0.05)',
              borderRadius: '12px',
              padding: '32px 20px',
              textAlign: 'center',
              border: '1px solid var(--ion-color-step-300)'
            }}>
              <IonIcon
                icon={library}
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
                No Reading History
              </h3>
              <p style={{
                margin: '0',
                fontSize: '0.9em',
                color: 'var(--ion-color-medium)',
                lineHeight: '1.5'
              }}>
                Start reading devotions to build your reading history and track your spiritual growth.
              </p>
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ReadingHistory;