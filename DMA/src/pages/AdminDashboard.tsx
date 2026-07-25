import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonIcon, IonButton, IonText, IonAlert, IonBadge } from '@ionic/react';
import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import {
  people, playCircle, book, calendar, add,
  shield, videocam, radio, mail, trendingUp,
  person, documentText, checkmarkCircle, arrowForward, arrowBack
} from 'ionicons/icons';
import { apiService } from '../services/api';
import './AdminDashboard.css';

const AdminDashboard: React.FC = () => {
  const history = useHistory();
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [data, setData] = useState({
    sermons: { total: 0, published: 0 },
    devotions: { total: 0, published: 0 },
    events: { total: 0, published: 0, upcoming: 0 },
    ministries: { total: 0, active: 0 },
    podcasts: { total: 0, published: 0 },
    users: { total: 0, active: 0 },
    prayers: { pending: 0 }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const cached = localStorage.getItem('adminCache3');
    if (cached) {
      try { setData(JSON.parse(cached)); } catch (e) {}
    }
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sermons, devotions, events, ministries, podcasts, users, prayers] = await Promise.all([
        apiService.getSermonStats().catch(() => ({ stats: { total: 0, published: 0 } })),
        apiService.getDevotions({ limit: 50 }).catch(() => ({ devotions: [] })),
        apiService.getEvents({ limit: 50 }).catch(() => ({ events: [] })),
        apiService.getMinistries({ limit: 50 }).catch(() => ({ ministries: [] })),
        apiService.getPodcasts({ limit: 50 }).catch(() => ({ podcasts: [] })),
        apiService.getUsers({ limit: 50 }).catch(() => ({ users: [] })),
        apiService.getPrayerRequestStats().catch(() => ({ stats: { pending: 0 } }))
      ]);

      const eventsData = events.events || [];
      const newData = {
        sermons: {
          total: sermons.stats?.total || 0,
          published: sermons.stats?.published || 0
        },
        devotions: { total: devotions.devotions?.length || 0, published: devotions.devotions?.filter((d: any) => d.status === 'publish').length || 0 },
        events: { total: eventsData.length, published: eventsData.filter((e: any) => e.isPublished).length, upcoming: eventsData.filter((e: any) => new Date(e.date) > new Date() && e.isPublished).length },
        ministries: { total: ministries.ministries?.length || 0, active: ministries.ministries?.filter((m: any) => m.isActive).length || 0 },
        podcasts: { total: podcasts.podcasts?.length || 0, published: podcasts.podcasts?.filter((p: any) => p.status === 'published').length || 0 },
        users: { total: users.users?.length || 0, active: users.users?.filter((u: any) => u.isActive).length || 0 },
        prayers: { pending: prayers.stats?.pending || 0 }
      };

      setData(newData);
      localStorage.setItem('adminCache3', JSON.stringify(newData));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalContent = data.sermons.total + data.devotions.total + data.events.total + data.ministries.total + data.podcasts.total;
  const totalPublished = data.sermons.published + data.devotions.published + data.events.published + data.podcasts.published;

  const stats = [
    { label: 'Content', value: totalContent, icon: documentText, color: '#6366f1' },
    { label: 'Published', value: totalPublished, icon: checkmarkCircle, color: '#10b981' },
    { label: 'Users', value: data.users.active, icon: person, color: '#ec4899' },
  ];

  const quickActions = [
    { label: 'Sermon', icon: playCircle, route: '/admin/sermons/add', color: '#6366f1' },
    { label: 'Event', icon: calendar, route: '/admin/events/add', color: '#f59e0b' },
    { label: 'Devotion', icon: book, route: '/admin/devotions/add', color: '#8b5cf6' },
    { label: 'Podcast', icon: radio, route: '/admin/radio/add', color: '#ec4899' },
    { label: 'Ministry', icon: people, route: '/admin/ministries/add', color: '#10b981' },
    { label: 'User', icon: person, route: '/admin/users/add', color: '#06b6d4' },
  ];

  const contentModules = [
    { name: 'Sermons', icon: playCircle, route: '/admin/sermons', color: '#6366f1', count: data.sermons.total, detail: `${data.sermons.published} published` },
    { name: 'Devotions', icon: book, route: '/admin/devotions', color: '#8b5cf6', count: data.devotions.total, detail: `${data.devotions.published} published` },
    { name: 'Events', icon: calendar, route: '/admin/events', color: '#f59e0b', count: data.events.total, detail: `${data.events.upcoming} upcoming` },
    { name: 'Ministries', icon: people, route: '/admin/ministries', color: '#10b981', count: data.ministries.total, detail: `${data.ministries.active} active` },
    { name: 'Podcasts', icon: radio, route: '/admin/radio', color: '#ec4899', count: data.podcasts.total, detail: `${data.podcasts.published} published` },
    { name: 'Live', icon: videocam, route: '/admin/live', color: '#ef4444', count: null, detail: 'broadcasts', isLive: true },
    { name: 'Users', icon: shield, route: '/admin/users', color: '#06b6d4', count: data.users.total, detail: `${data.users.active} active` },
    { name: 'Contact', icon: mail, route: '/admin/contact', color: '#64748b', count: null, detail: 'messages' },
  ];

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <IonButton fill="clear" slot="start" onClick={() => history.goBack()} style={{ marginLeft: '4px' }}>
            <IonIcon icon={arrowBack} style={{ fontSize: '22px' }} />
          </IonButton>
          <IonTitle className="title-ios" style={{ textAlign: 'left', marginLeft: '-16px' }}>Dashboard</IonTitle>

        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
        <div className="nd-page">

          {/* Hero Section */}
          <div className="nd-hero">
            <div className="nd-hero-inner">
              <div className="nd-hero-text">
                <span className="nd-hero-label">Admin Panel</span>
                <h1 className="nd-hero-title">Welcome Back</h1>
              </div>
              <div className="nd-hero-ring">
                <svg viewBox="0 0 100 100" className="nd-ring-svg">
                  <circle cx="50" cy="50" r="42" className="nd-ring-bg" />
                  <circle cx="50" cy="50" r="42" className="nd-ring-fill" strokeDasharray={`${(totalPublished / Math.max(totalContent, 1)) * 264} 264`} />
                </svg>
                <div className="nd-ring-center">
                  <span className="nd-ring-value">{totalContent}</span>
                  <span className="nd-ring-label">items</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="nd-stats">
            {stats.map((stat, i) => (
              <div key={i} className="nd-stat-pill">
                <div className="nd-stat-dot" style={{ background: stat.color }} />
                <div className="nd-stat-data">
                  <span className="nd-stat-num" style={{ color: stat.color }}>{stat.value}</span>
                  <span className="nd-stat-txt">{stat.label}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="nd-section">
            <div className="nd-section-header">
              <h2 className="nd-section-title">Quick Create</h2>
            </div>
            <div className="nd-actions-scroll">
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  className="nd-action-chip"
                  onClick={() => history.push(action.route)}
                  style={{ '--chip-color': action.color } as React.CSSProperties}
                >
                  <div className="nd-action-icon">
                    <IonIcon icon={add} />
                  </div>
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content Modules */}
          <div className="nd-section">
            <div className="nd-section-header">
              <h2 className="nd-section-title">Manage</h2>
            </div>
            <div className="nd-module-list">
              {contentModules.map((mod, i) => (
                <div
                  key={i}
                  className="nd-module-row"
                  onClick={() => history.push(mod.route)}
                  style={{ '--mod-color': mod.color } as React.CSSProperties}
                >
                  <div className="nd-module-left">
                    <div className="nd-module-icon">
                      <IonIcon icon={mod.icon} />
                      {mod.isLive && <span className="nd-live-pip" />}
                    </div>
                    <div className="nd-module-text">
                      <span className="nd-module-name">{mod.name}</span>
                      <span className="nd-module-detail">{mod.detail}</span>
                    </div>
                  </div>
                  <div className="nd-module-right">
                    {mod.count !== null && mod.count > 0 && (
                      <span className="nd-module-count">{mod.count}</span>
                    )}
                    <IonIcon icon={arrowForward} className="nd-module-arrow" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="nd-footer">
            <IonText>Dove Church &bull; Admin Panel v2.0</IonText>
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

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </IonPage>
  );
};

export default AdminDashboard;
