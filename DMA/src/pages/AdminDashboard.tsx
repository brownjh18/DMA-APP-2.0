import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonIcon, IonButton, IonText, IonAlert, IonBadge, IonChip, IonFab, IonFabButton, IonFabList } from '@ionic/react';
import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import BackButton from '../components/BackButton';
import { 
  people, playCircle, book, calendar, add, settings,
  flash, shield, videocam, radio, mail, trendingUp, statsChart, 
  person, documentText, time, checkmarkCircle, pulse
} from 'ionicons/icons';
import { apiService } from '../services/api';
import './AdminDashboard.css';

const AdminDashboard: React.FC = () => {
  const history = useHistory();
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [fabExpanded, setFabExpanded] = useState(false);
  const [data, setData] = useState({
    sermons: { total: 0, published: 0, views: 0 },
    devotions: { total: 0, published: 0 },
    events: { total: 0, published: 0, upcoming: 0 },
    ministries: { total: 0 },
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
      const [sermons, devotions, events, ministries, podcasts, users] = await Promise.all([
        apiService.getSermonStats().catch(() => ({ stats: { total: 0, published: 0, totalViews: 0 } })),
        apiService.getDevotions({ limit: 50 }).catch(() => ({ devotions: [] })),
        apiService.getEvents({ limit: 50 }).catch(() => ({ events: [] })),
        apiService.getMinistries({ limit: 50 }).catch(() => ({ ministries: [] })),
        apiService.getPodcasts({ limit: 50 }).catch(() => ({ podcasts: [] })),
        apiService.getUsers({ limit: 50 }).catch(() => ({ users: [] }))
      ]);

      const eventsData = events.events || [];
      const newData = {
        sermons: { 
          total: sermons.stats?.total || 0, 
          published: sermons.stats?.published || 0,
          views: sermons.stats?.totalViews || 0
        },
        devotions: { total: devotions.devotions?.length || 0, published: devotions.devotions?.filter((d: any) => d.isPublished).length || 0 },
        events: { total: eventsData.length, published: eventsData.filter((e: any) => e.isPublished).length, upcoming: eventsData.filter((e: any) => new Date(e.date) > new Date() && e.isPublished).length },
        ministries: { total: ministries.ministries?.length || 0 },
        podcasts: { total: podcasts.podcasts?.length || 0, published: podcasts.podcasts?.filter((p: any) => p.isPublished).length || 0 },
        users: { total: users.users?.length || 0, active: users.users?.filter((u: any) => u.isActive).length || 0 },
        prayers: { pending: 0 }
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

  const statsCards = [
    { 
      title: 'Total Content', 
      value: totalContent, 
      icon: documentText, 
      color: '#6366f1',
      trend: '+12%',
      bgColor: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
    },
    { 
      title: 'Published', 
      value: totalPublished, 
      icon: checkmarkCircle, 
      color: '#10b981',
      trend: '+8%',
      bgColor: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
    },
    { 
      title: 'Total Views', 
      value: data.sermons.views.toLocaleString(), 
      icon: statsChart, 
      color: '#f59e0b',
      trend: '+24%',
      bgColor: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
    },
    { 
      title: 'Active Users', 
      value: data.users.active, 
      icon: person, 
      color: '#ec4899',
      trend: '+5%',
      bgColor: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)'
    }
  ];

  const quickActions = [
    { label: 'New Sermon', icon: add, color: '#6366f1', route: '/admin/sermons/add' },
    { label: 'New Event', icon: add, color: '#f59e0b', route: '/admin/events/add' },
    { label: 'New Devotion', icon: add, color: '#8b5cf6', route: '/admin/devotions/add' },
    { label: 'New User', icon: add, color: '#06b6d4', route: '/admin/users/add' }
  ];

  const contentModules = [
    { name: 'Sermons', icon: playCircle, route: '/admin/sermons', color: '#6366f1', val: data.sermons.total, sub: `${data.sermons.published} published`, badge: data.sermons.total },
    { name: 'Devotions', icon: book, route: '/admin/devotions', color: '#8b5cf6', val: data.devotions.total, sub: `${data.devotions.published} published`, badge: data.devotions.total },
    { name: 'Events', icon: calendar, route: '/admin/events', color: '#f59e0b', val: data.events.total, sub: `${data.events.upcoming} upcoming`, badge: data.events.upcoming },
    { name: 'Ministries', icon: people, route: '/admin/ministries', color: '#10b981', val: data.ministries.total, sub: 'active ministries', badge: data.ministries.total },
    { name: 'Podcasts', icon: radio, route: '/admin/radio', color: '#ec4899', val: data.podcasts.total, sub: `${data.podcasts.published} published`, badge: data.podcasts.total },
    { name: 'Live', icon: videocam, route: '/admin/live', color: '#ef4444', val: 'LIVE', sub: 'broadcasts', badge: null, isLive: true },
    { name: 'Users', icon: shield, route: '/admin/users', color: '#06b6d4', val: data.users.total, sub: `${data.users.active} active`, badge: data.users.active },
    { name: 'Contact', icon: mail, route: '/admin/contact', color: '#64748b', val: '-', sub: 'messages', badge: null }
  ];

  return (
    <IonPage>
      <IonHeader translucent>
        <BackButton />
        <IonToolbar className="toolbar-ios" style={{ background: 'transparent' }}>
          <IonTitle className="title-ios" style={{ textAlign: 'center' }}>
            <span style={{ fontWeight: '700', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Dashboard
            </span>
          </IonTitle>
          <IonButton 
            fill="clear" 
            slot="end" 
            onClick={loadData} 
            style={{ marginRight: '12px' }}
            disabled={isLoading}
          >
            <IonIcon icon={settings} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
        <div style={{ padding: '12px', maxWidth: '1200px', margin: '0 auto', paddingBottom: '100px' }}>
          
          {/* Modern Welcome Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #6366f1 100%)',
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '20px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(124, 58, 237, 0.3)'
          }}>
            {/* Decorative circles */}
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)'
            }} />
            <div style={{
              position: 'absolute',
              bottom: '-30px',
              right: '40px',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(10px)'
            }} />
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '1px' }}>
                ADMIN OVERVIEW
              </p>
              <h1 style={{ margin: '0 0 8px 0', fontSize: '22px', fontWeight: '700', color: 'white', letterSpacing: '-0.5px', lineHeight: '1.2' }}>
                Welcome Back! 👋
              </h1>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.85)' }}>
                  <span style={{ fontWeight: '700', fontSize: '18px' }}>{totalContent}</span> total content
                </p>
                <div style={{ 
                  width: '3px', 
                  height: '3px', 
                  borderRadius: '50%', 
                  background: 'rgba(255,255,255,0.5)' 
                }} />
                <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.85)' }}>
                  <span style={{ fontWeight: '700', fontSize: '18px' }}>{totalPublished}</span> published
                </p>
              </div>
            </div>
          </div>

          {/* Stats Cards - Modern Compact Horizontal Cards */}
          <div style={{ 
            display: 'flex', 
            gap: '10px',
            overflowX: 'auto',
            paddingBottom: '4px',
            marginBottom: '20px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}>
            {statsCards.map((stat, i) => (
              <div key={i} style={{
                minWidth: '150px',
                flex: '0 0 auto',
                borderRadius: '14px',
                padding: '12px 16px',
                border: `1px solid ${stat.color}20`,
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                background: `linear-gradient(135deg, ${stat.color}08 0%, ${stat.color}03 100%)`,
                backdropFilter: 'blur(10px)',
                boxShadow: `0 2px 8px ${stat.color}10`,
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 8px 24px ${stat.color}25`;
                e.currentTarget.style.borderColor = `${stat.color}40`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `0 2px 8px ${stat.color}10`;
                e.currentTarget.style.borderColor = `${stat.color}20`;
              }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: stat.bgColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: `0 2px 8px ${stat.color}30`
                  }}>
                    <IonIcon icon={stat.icon} style={{ fontSize: '16px', color: 'white' }} />
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--ion-text-color)', opacity: 0.7 }}>{stat.title}</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '22px', fontWeight: '700', color: stat.color, lineHeight: '1.1' }}>{stat.value}</span>
                  <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: 'var(--ion-text-color)', opacity: 0.5 }}>{stat.trend}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Custom FAB Button for Quick Actions */}
          <div style={{
            position: 'fixed',
            bottom: '90px',
            right: '16px',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
          }}>
            {/* Quick action buttons - shown when expanded (ordered from top to bottom) */}
            {fabExpanded && (
              <>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: '#6366f1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
                  cursor: 'pointer',
                  animation: 'fadeInUp 0.45s ease',
                  transition: 'transform 0.2s ease'
                }}
                onClick={() => history.push('/admin/sermons/add')}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <IonIcon icon={playCircle} style={{ fontSize: '22px', color: 'white' }} />
                </div>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: '#8b5cf6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
                  cursor: 'pointer',
                  animation: 'fadeInUp 0.4s ease',
                  transition: 'transform 0.2s ease'
                }}
                onClick={() => history.push('/admin/devotions/add')}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <IonIcon icon={book} style={{ fontSize: '22px', color: 'white' }} />
                </div>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: '#f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)',
                  cursor: 'pointer',
                  animation: 'fadeInUp 0.35s ease',
                  transition: 'transform 0.2s ease'
                }}
                onClick={() => history.push('/admin/events/add')}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <IonIcon icon={calendar} style={{ fontSize: '22px', color: 'white' }} />
                </div>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                  cursor: 'pointer',
                  animation: 'fadeInUp 0.3s ease',
                  transition: 'transform 0.2s ease'
                }}
                onClick={() => history.push('/admin/ministries/add')}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <IonIcon icon={people} style={{ fontSize: '22px', color: 'white' }} />
                </div>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: '#ec4899',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(236, 72, 153, 0.4)',
                  cursor: 'pointer',
                  animation: 'fadeInUp 0.25s ease',
                  transition: 'transform 0.2s ease'
                }}
                onClick={() => history.push('/admin/radio/add')}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <IonIcon icon={radio} style={{ fontSize: '22px', color: 'white' }} />
                </div>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: '#06b6d4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(6, 182, 212, 0.4)',
                  cursor: 'pointer',
                  animation: 'fadeInUp 0.2s ease',
                  transition: 'transform 0.2s ease'
                }}
                onClick={() => history.push('/admin/users/add')}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <IonIcon icon={person} style={{ fontSize: '22px', color: 'white' }} />
                </div>
              </>
            )}
            
            {/* Main FAB button - at the bottom */}
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 20px rgba(99, 102, 241, 0.4)',
              cursor: 'pointer',
              transition: 'transform 0.3s ease',
              transform: fabExpanded ? 'rotate(45deg)' : 'rotate(0deg)'
            }}
            onClick={() => setFabExpanded(!fabExpanded)}
            onMouseEnter={(e) => e.currentTarget.style.transform = fabExpanded ? 'scale(1.1) rotate(45deg)' : 'scale(1.1) rotate(0deg)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = fabExpanded ? 'scale(1) rotate(45deg)' : 'scale(1) rotate(0deg)'}
            >
              <IonIcon icon={add} style={{ fontSize: '24px', color: 'white' }} />
            </div>
          </div>

          {/* Content Modules - Modern Grid */}
          <div>
            <h3 style={{ 
              margin: '0 0 12px 0', 
              fontSize: '14px', 
              fontWeight: '600', 
              color: 'var(--ion-text-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{ 
                width: '18px', 
                height: '18px', 
                borderRadius: '5px', 
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <IonIcon icon={trendingUp} style={{ fontSize: '10px', color: 'white' }} />
              </div>
              Content Management
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: '10px'
            }}>
              {contentModules.map((mod, i) => (
                <div key={i} onClick={() => history.push(mod.route)} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: 'var(--ion-card-background)',
                  border: '1px solid var(--ion-color-step-200)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${mod.color}40`;
                  e.currentTarget.style.background = `${mod.color}08`;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 8px 24px ${mod.color}20`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--ion-color-step-200)';
                  e.currentTarget.style.background = 'var(--ion-card-background)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                >
                  {/* Hover gradient accent */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '3px',
                    height: '100%',
                    background: mod.color,
                    opacity: 0,
                    transition: 'opacity 0.2s ease'
                  }} className="module-accent" />
                  
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: `linear-gradient(135deg, ${mod.color} 0%, ${mod.color}cc 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: `0 4px 12px ${mod.color}30`
                  }}>
                    <IonIcon icon={mod.icon} style={{ fontSize: '18px', color: 'white' }} />
                    {mod.isLive && (
                      <div style={{
                        position: 'absolute',
                        top: '-3px',
                        right: '-3px',
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: '#ef4444',
                        border: '2px solid var(--ion-card-background)',
                        animation: 'pulse 2s infinite'
                      }} />
                    )}
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px', flexWrap: 'wrap' }}>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: 'var(--ion-text-color)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mod.name}</p>
                      {mod.badge !== null && mod.badge > 0 && (
                        <IonBadge style={{ 
                          background: `${mod.color}20`, 
                          color: mod.color,
                          fontSize: '9px',
                          padding: '1px 4px',
                          borderRadius: '4px',
                          flexShrink: 0
                        }}>
                          {mod.badge}
                        </IonBadge>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--ion-color-medium)', fontWeight: '400', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mod.sub}</p>
                  </div>
                  
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: `${mod.color}10`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <span style={{ fontSize: '15px', fontWeight: '700', color: mod.color }}>{mod.val}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '28px', paddingTop: '16px', borderTop: '1px solid var(--ion-color-step-200)' }}>
            <IonText style={{ color: 'var(--ion-text-color)', opacity: 0.4, fontSize: '11px' }}>
              Dove Church • Admin Panel v2.0
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

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </IonPage>
  );
};

export default AdminDashboard;