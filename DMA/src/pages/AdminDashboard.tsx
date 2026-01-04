import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonGrid, IonRow, IonCol, IonIcon, IonButton, IonList, IonItem, IonLabel, IonBadge, IonSegment, IonSegmentButton, IonRefresher, IonRefresherContent, IonText, IonAlert } from '@ionic/react';
import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { people, playCircle, book, calendar, chatbubble, images, newspaper, statsChart, add, create, trash, settings, logOut, cardOutline, informationCircle, radio, videocam, arrowBack } from 'ionicons/icons';
import { apiService } from '../services/api';
import './AdminDashboard.css';

const AdminDashboard: React.FC = () => {
  const history = useHistory();
  const [activeSegment, setActiveSegment] = useState('overview');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [stats, setStats] = useState({
    sermons: { total: 0, published: 0, featured: 0 },
    devotions: { total: 0, published: 0, featured: 0 },
    events: { total: 0, published: 0 },
    ministries: { total: 0, published: 0 },
    podcasts: { total: 0, published: 0 },
    users: { total: 0, active: 0 }
  });

  useEffect(() => {
    loadStats();
  }, []);

  // Refresh stats when window regains focus
  useEffect(() => {
    const handleFocus = () => {
      loadStats();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const loadStats = async () => {
    try {
      // Fetch real sermon stats
      const sermonStats = await apiService.getSermonStats();

      // Fetch real devotion stats
      const devotionsResponse = await apiService.getDevotions({ limit: 1000 }); // Get all for counting
      const devotions = devotionsResponse.devotions || [];
      const publishedDevotions = devotions.filter((d: any) => d.isPublished).length;
      const featuredDevotions = devotions.filter((d: any) => d.isFeatured).length;

      // Fetch real event stats
      const eventsResponse = await apiService.getEvents({ limit: 1000 }); // Get all for counting
      const events = eventsResponse.events || [];
      const publishedEvents = events.filter((e: any) => e.isPublished).length;

      // Fetch real ministry stats
      const ministriesResponse = await apiService.getMinistries({ limit: 1000 }); // Get all for counting
      const ministries = ministriesResponse.ministries || [];
      const publishedMinistries = ministries.length;

      // Fetch real podcast stats
      const podcastsResponse = await apiService.getPodcasts({ limit: 1000 }); // Get all for counting
      const podcasts = podcastsResponse.podcasts || [];
      const publishedPodcasts = podcasts.filter((p: any) => p.isPublished).length;

      // Fetch real live broadcast stats
      const liveBroadcastsResponse = await apiService.getLiveBroadcasts({ limit: 1000 }); // Get all for counting
      const liveBroadcasts = liveBroadcastsResponse.broadcasts || [];
      const publishedLiveBroadcasts = liveBroadcasts.filter((b: any) => b.status === 'published').length;

      // Fetch real user stats
      const usersResponse = await apiService.getUsers({ limit: 1000 }); // Get all for counting
      const users = usersResponse.users || [];
      const activeUsers = users.filter((u: any) => u.isActive).length;

      setStats({
        sermons: {
          total: sermonStats.stats.total,
          published: sermonStats.stats.published,
          featured: sermonStats.stats.featured
        },
        devotions: {
          total: devotions.length,
          published: publishedDevotions,
          featured: featuredDevotions
        },
        events: {
          total: events.length,
          published: publishedEvents
        },
        ministries: {
          total: ministries.length,
          published: publishedMinistries
        },
        podcasts: {
          total: podcasts.length,
          published: publishedPodcasts
        },
        users: {
          total: users.length,
          active: activeUsers
        }
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      // Show error state instead of mock data
      setStats({
        sermons: { total: 0, published: 0, featured: 0 },
        devotions: { total: 0, published: 0, featured: 0 },
        events: { total: 0, published: 0 },
        ministries: { total: 0, published: 0 },
        podcasts: { total: 0, published: 0 },
        users: { total: 0, active: 0 }
      });
    }
  };

  const handleRefresh = async (event: CustomEvent) => {
    await loadStats();
    event.detail.complete();
  };


  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
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
          <IonTitle className="title-ios">Admin Dashboard</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
        <div style={{
          padding: '20px',
          maxWidth: '1200px',
          margin: '0 auto',
          paddingTop: '20px'
        }}>

          {/* Main Dashboard Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px',
            marginBottom: '32px'
          }}>

            {/* Content Management Section */}
            <div style={{
              backgroundColor: 'var(--ion-background-color)',
              padding: '24px',
              borderRadius: '16px',
              border: '1px solid var(--ion-color-step-200)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              gridColumn: '1 / -1' // Span full width
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <IonIcon icon={create} style={{ fontSize: '1.8em', color: 'var(--ion-color-primary)' }} />
                  <h2 style={{ margin: '0', fontSize: '1.4em', fontWeight: '600', color: 'var(--ion-text-color)' }}>
                    Content Management
                  </h2>
                </div>
                <IonButton fill="clear" onClick={loadStats} style={{ '--color': 'var(--ion-color-primary)' }}>
                  <IonIcon icon={settings} slot="icon-only" />
                </IonButton>
              </div>
              {/* Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px',
                borderBottom: '2px solid var(--ion-color-step-200)',
                fontWeight: '600',
                color: 'var(--ion-text-color)',
                fontSize: '0.9em'
              }}>
                <span style={{ flex: 1 }}>Manage</span>
                <span style={{ flex: 2 }}>Content Type</span>
                <span style={{ flex: 1, textAlign: 'center' }}>Total</span>
              </div>
              {/* Rows */}
              {[
                { name: 'Sermons', icon: playCircle, route: '/admin/sermons', total: stats.sermons.total, published: stats.sermons.published, bg: 'var(--ion-color-primary)' },
                { name: 'Devotions', icon: book, route: '/admin/devotions', total: stats.devotions.total, published: stats.devotions.published, bg: '#8b5cf6' },
                { name: 'Events', icon: calendar, route: '/admin/events', total: stats.events.total, published: stats.events.published, bg: '#f59e0b' },
                { name: 'Ministries', icon: people, route: '/admin/ministries', total: stats.ministries.total, published: stats.ministries.published, bg: '#10b981' },
                { name: 'Users', icon: people, route: '/admin/users', total: stats.users.total, published: stats.users.active, bg: '#06b6d4' },
                { name: 'Broadcasts', icon: radio, route: '/admin/radio', total: stats.podcasts.total, published: stats.podcasts.published, bg: '#667eea' },
                { name: 'Go Live', icon: videocam, route: '/admin/live', total: '-', published: '-', bg: '#ef4444' },
                { name: 'Contact', icon: informationCircle, route: '/admin/contact', total: '-', published: '-', bg: '#6b7280' }
              ].map((item, index) => (
                <div key={index} className="content-row" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  borderBottom: index < 7 ? '1px solid var(--ion-color-step-150)' : 'none',
                  transition: 'background-color 0.2s ease',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  marginBottom: '8px'
                }}
                onClick={() => history.push(item.route)}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--ion-item-background)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--ion-color-step-100)'}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      onClick={() => history.push(item.route)}
                      style={{
                        width: '40px',
                        height: '40px',
                        background: `linear-gradient(135deg, ${item.bg} 0%, ${item.bg} 100%)`,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: `0 4px 12px rgba(0, 0, 0, 0.2)`,
                        border: '2px solid rgba(255, 255, 255, 0.1)',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                        e.currentTarget.style.boxShadow = `0 6px 20px rgba(0, 0, 0, 0.3)`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = `0 4px 12px rgba(0, 0, 0, 0.2)`;
                      }}
                    >
                      <IonIcon icon={item.icon} style={{ fontSize: '20px', color: 'white' }} />
                    </div>
                  </div>
                  <span style={{ flex: 2, fontWeight: '500', color: 'var(--ion-text-color)' }}>{item.name}</span>
                  <span style={{ flex: 1, textAlign: 'center', fontWeight: '600', color: 'var(--ion-color-primary)' }}>{item.total}</span>
                </div>
              ))}
            </div>

          </div>



          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <IonText style={{
              color: 'var(--ion-text-color)',
              opacity: 0.6,
              fontSize: '0.9em'
            }}>
              Dove Ministries Africa - Advanced Admin Control Panel
            </IonText>
          </div>
        </div>
      </IonContent>

      <IonAlert
        isOpen={showAlert}
        onDidDismiss={() => setShowAlert(false)}
        header="Alert"
        message={alertMessage}
        buttons={['OK']}
      />
    </IonPage>
  );
};

export default AdminDashboard;