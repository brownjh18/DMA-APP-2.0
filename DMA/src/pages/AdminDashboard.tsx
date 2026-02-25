import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonIcon, IonButton, IonText, IonAlert } from '@ionic/react';
import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { 
  people, playCircle, book, calendar, add, settings, arrowBack, 
  flash, shield, wallet, videocam, radio, heart, mail, grid, list
} from 'ionicons/icons';
import { apiService } from '../services/api';
import './AdminDashboard.css';

const AdminDashboard: React.FC = () => {
  const history = useHistory();
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [data, setData] = useState({
    sermons: { total: 0, published: 0 },
    devotions: { total: 0, published: 0 },
    events: { total: 0, published: 0, upcoming: 0 },
    ministries: { total: 0 },
    podcasts: { total: 0, published: 0 },
    users: { total: 0, active: 0 },
    prayers: { pending: 0 }
  });

  useEffect(() => {
    const cached = localStorage.getItem('adminCache2');
    if (cached) {
      try { setData(JSON.parse(cached)); } catch (e) {}
    }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [sermons, devotions, events, ministries, podcasts, users] = await Promise.all([
        apiService.getSermonStats().catch(() => ({ stats: { total: 0, published: 0 } })),
        apiService.getDevotions({ limit: 50 }).catch(() => ({ devotions: [] })),
        apiService.getEvents({ limit: 50 }).catch(() => ({ events: [] })),
        apiService.getMinistries({ limit: 50 }).catch(() => ({ ministries: [] })),
        apiService.getPodcasts({ limit: 50 }).catch(() => ({ podcasts: [] })),
        apiService.getUsers({ limit: 50 }).catch(() => ({ users: [] }))
      ]);

      const eventsData = events.events || [];
      const newData = {
        sermons: { total: sermons.stats?.total || 0, published: sermons.stats?.published || 0 },
        devotions: { total: devotions.devotions?.length || 0, published: devotions.devotions?.filter((d: any) => d.isPublished).length || 0 },
        events: { total: eventsData.length, published: eventsData.filter((e: any) => e.isPublished).length, upcoming: eventsData.filter((e: any) => new Date(e.date) > new Date() && e.isPublished).length },
        ministries: { total: ministries.ministries?.length || 0 },
        podcasts: { total: podcasts.podcasts?.length || 0, published: podcasts.podcasts?.filter((p: any) => p.isPublished).length || 0 },
        users: { total: users.users?.length || 0, active: users.users?.filter((u: any) => u.isActive).length || 0 },
        prayers: { pending: 0 }
      };

      setData(newData);
      localStorage.setItem('adminCache2', JSON.stringify(newData));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const totalContent = data.sermons.total + data.devotions.total + data.events.total + data.ministries.total + data.podcasts.total;

  // Keep the quick actions design as requested
  const quickActions = [
    { label: 'New Sermon', icon: add, color: '#6366f1', route: '/admin/sermons/add' },
    { label: 'New Event', icon: add, color: '#f59e0b', route: '/admin/events/add' },
    { label: 'New Devotion', icon: add, color: '#8b5cf6', route: '/admin/devotions/add' },
    { label: 'New User', icon: add, color: '#06b6d4', route: '/admin/users/add' }
  ];

  const contentModules = [
    { name: 'Sermons', icon: playCircle, route: '/admin/sermons', color: '#6366f1', val: data.sermons.total, sub: `${data.sermons.published} pub` },
    { name: 'Devotions', icon: book, route: '/admin/devotions', color: '#8b5cf6', val: data.devotions.total, sub: `${data.devotions.published} pub` },
    { name: 'Events', icon: calendar, route: '/admin/events', color: '#f59e0b', val: data.events.total, sub: `${data.events.upcoming} upc` },
    { name: 'Ministries', icon: people, route: '/admin/ministries', color: '#10b981', val: data.ministries.total, sub: 'active' },
    { name: 'Podcasts', icon: radio, route: '/admin/radio', color: '#ec4899', val: data.podcasts.total, sub: `${data.podcasts.published} pub` },
    { name: 'Live', icon: videocam, route: '/admin/live', color: '#ef4444', val: '-', sub: 'broadcasts' },
    { name: 'Users', icon: shield, route: '/admin/users', color: '#06b6d4', val: data.users.total, sub: `${data.users.active} active` },
    { name: 'Prayers', icon: heart, route: '/admin/prayer', color: '#f97316', val: data.prayers.pending, sub: 'pending' },
    { name: 'Contact', icon: mail, route: '/admin/contact', color: '#64748b', val: '-', sub: 'messages' },
    { name: 'Giving', icon: wallet, route: '/admin/giving', color: '#14b8a6', val: '-', sub: 'donations' }
  ];

  return (
    <IonPage>
      <IonHeader translucent>
        <div
          onClick={() => history.goBack()}
          style={{
            position: 'absolute',
            top: 'calc(var(--ion-safe-area-top) - -5px)',
            left: 20,
            width: 40,
            height: 40,
            borderRadius: 20,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 999,
            boxShadow: '0 4px 12px rgba(99,102,241,0.4)'
          }}
        >
          <IonIcon icon={arrowBack} style={{ color: 'white', fontSize: '18px' }} />
        </div>
        <IonToolbar className="toolbar-ios">
          <IonTitle className="title-ios">
            <span style={{ fontWeight: '700', color: 'var(--ion-color-primary)' }}>Dashboard</span>
          </IonTitle>
          <IonButton fill="clear" slot="end" onClick={loadData} style={{ marginRight: '8px' }}>
            <IonIcon icon={settings} />
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
        <div style={{ padding: '16px', maxWidth: '1200px', margin: '0 auto', paddingBottom: '100px' }}>
          
          {/* Welcome Banner Only */}
          <div style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
            borderRadius: '20px',
            padding: '24px 28px',
            marginBottom: '20px'
          }}>
            <h1 style={{ margin: '0 0 4px 0', fontSize: '22px', fontWeight: '700', color: 'white' }}>
              Welcome Back! 👋
            </h1>
            <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
              <span style={{ fontWeight: '700', fontSize: '18px' }}>{totalContent}</span> content items total
            </p>
          </div>

          {/* Quick Actions - Keep original design */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: 'var(--ion-text-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IonIcon icon={flash} style={{ color: '#f59e0b' }} /> Quick Actions
            </h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {quickActions.map((action, i) => (
                <button key={i} onClick={() => history.push(action.route)} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  background: `${action.color}12`,
                  border: `1px solid ${action.color}30`,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = `${action.color}25`; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = `${action.color}12`; }}
                >
                  <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: action.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IonIcon icon={action.icon} style={{ fontSize: '14px', color: 'white' }} />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--ion-text-color)' }}>{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content Modules - List View Style */}
          <div>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: 'var(--ion-text-color)' }}>
              Content Management
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: '8px',
              background: 'var(--ion-card-background)',
              borderRadius: '16px',
              padding: '8px',
              border: '1px solid var(--ion-color-step-200)'
            }}>
              {contentModules.map((mod, i) => (
                <div key={i} onClick={() => history.push(mod.route)} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: '1px solid transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${mod.color}10`;
                  e.currentTarget.style.borderColor = `${mod.color}30`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
                >
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: mod.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: `0 4px 12px ${mod.color}40`
                  }}>
                    <IonIcon icon={mod.icon} style={{ fontSize: '20px', color: 'white' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 2px 0', fontSize: '13px', fontWeight: '600', color: 'var(--ion-text-color)' }}>{mod.name}</p>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--ion-text-color)', opacity: 0.5 }}>{mod.sub}</p>
                  </div>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: `${mod.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: mod.color }}>{mod.val}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--ion-color-step-200)' }}>
            <IonText style={{ color: 'var(--ion-text-color)', opacity: 0.4, fontSize: '11px' }}>
              Dove Church • Admin Panel
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
