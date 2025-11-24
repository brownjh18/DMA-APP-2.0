import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonGrid, IonRow, IonCol, IonIcon, IonButton, IonList, IonItem, IonLabel, IonBadge, IonButtons, IonBackButton, IonSegment, IonSegmentButton, IonRefresher, IonRefresherContent, IonText } from '@ionic/react';
import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { people, playCircle, book, calendar, chatbubble, images, newspaper, statsChart, add, create, trash, settings, logOut, cardOutline, informationCircle } from 'ionicons/icons';
import './AdminDashboard.css';

const AdminDashboard: React.FC = () => {
  const history = useHistory();
  const [activeSegment, setActiveSegment] = useState('overview');
  const [stats, setStats] = useState({
    sermons: { total: 0, published: 0, featured: 0 },
    devotions: { total: 0, published: 0, featured: 0 },
    events: { total: 0, upcoming: 0 },
    prayerRequests: { total: 0, pending: 0, answered: 0 },
    users: { total: 0, active: 0 }
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    // Mock stats - in real app, fetch from API
    setStats({
      sermons: { total: 15, published: 12, featured: 3 },
      devotions: { total: 25, published: 20, featured: 5 },
      events: { total: 8, upcoming: 5 },
      prayerRequests: { total: 45, pending: 12, answered: 33 },
      users: { total: 1250, active: 980 }
    });
  };

  const handleRefresh = async (event: CustomEvent) => {
    await loadStats();
    event.detail.complete();
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tab1" />
          </IonButtons>
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
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <IonIcon
              icon={settings}
              style={{
                fontSize: '3em',
                color: 'var(--ion-color-primary)',
                marginBottom: '16px'
              }}
            />
            <h1 style={{
              margin: '0 0 8px 0',
              fontSize: '2.2em',
              fontWeight: '700',
              color: 'var(--ion-text-color)'
            }}>
              Admin Dashboard
            </h1>
            <p style={{
              margin: '0',
              color: 'var(--ion-text-color)',
              opacity: 0.7,
              fontSize: '1.1em'
            }}>
              Comprehensive content and user management system
            </p>
          </div>

          {/* Main Dashboard Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px',
            marginBottom: '32px'
          }}>
            {/* Quick Stats Cards */}
            <div style={{
              backgroundColor: 'var(--ion-background-color)',
              padding: '24px',
              borderRadius: '16px',
              border: '1px solid var(--ion-color-step-200)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <IonIcon icon={statsChart} style={{ fontSize: '1.8em', color: 'var(--ion-color-primary)' }} />
                <h2 style={{ margin: '0', fontSize: '1.4em', fontWeight: '600', color: 'var(--ion-text-color)' }}>
                  Platform Statistics
                </h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{
                  textAlign: 'center',
                  padding: '16px',
                  backgroundColor: 'var(--ion-item-background)',
                  borderRadius: '12px',
                  border: '1px solid var(--ion-color-step-150)',
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{ fontSize: '2em', fontWeight: '700', color: 'var(--ion-color-primary)' }}>{stats.sermons.total}</div>
                  <div style={{ fontSize: '0.9em', color: 'var(--ion-color-medium)', marginTop: '4px' }}>Sermons</div>
                </div>
                <div style={{
                  textAlign: 'center',
                  padding: '16px',
                  backgroundColor: 'var(--ion-item-background)',
                  borderRadius: '12px',
                  border: '1px solid var(--ion-color-step-150)',
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{ fontSize: '2em', fontWeight: '700', color: '#8b5cf6' }}>{stats.devotions.total}</div>
                  <div style={{ fontSize: '0.9em', color: 'var(--ion-color-medium)', marginTop: '4px' }}>Devotions</div>
                </div>
                <div style={{
                  textAlign: 'center',
                  padding: '16px',
                  backgroundColor: 'var(--ion-item-background)',
                  borderRadius: '12px',
                  border: '1px solid var(--ion-color-step-150)',
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{ fontSize: '2em', fontWeight: '700', color: '#f59e0b' }}>{stats.events.total}</div>
                  <div style={{ fontSize: '0.9em', color: 'var(--ion-color-medium)', marginTop: '4px' }}>Events</div>
                </div>
                <div style={{
                  textAlign: 'center',
                  padding: '16px',
                  backgroundColor: 'var(--ion-item-background)',
                  borderRadius: '12px',
                  border: '1px solid var(--ion-color-step-150)',
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{ fontSize: '2em', fontWeight: '700', color: '#10b981' }}>{stats.users.active}</div>
                  <div style={{ fontSize: '0.9em', color: 'var(--ion-color-medium)', marginTop: '4px' }}>Active Users</div>
                </div>
              </div>
            </div>

            {/* Content Management Section */}
            <div style={{
              backgroundColor: 'var(--ion-background-color)',
              padding: '24px',
              borderRadius: '16px',
              border: '1px solid var(--ion-color-step-200)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <IonIcon icon={create} style={{ fontSize: '1.8em', color: 'var(--ion-color-primary)' }} />
                <h2 style={{ margin: '0', fontSize: '1.4em', fontWeight: '600', color: 'var(--ion-text-color)' }}>
                  Content Management
                </h2>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '12px',
                alignItems: 'center',
                padding: '0px'
              }}>
                <div
                  onClick={() => history.push('/admin/sermons')}
                  style={{
                    height: '100px',
                    background: 'linear-gradient(135deg, var(--ion-color-primary) 0%, var(--ion-color-primary-shade) 100%)',
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(var(--ion-color-primary-rgb), 0.3)',
                    transition: 'all 0.2s ease',
                    margin: '0 auto'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <IonIcon icon={playCircle} style={{ fontSize: '28px', color: 'white', marginBottom: '6px' }} />
                  <span style={{ fontSize: '0.75em', textAlign: 'center', lineHeight: '1.1', fontWeight: '600', color: 'white' }}>Manage Sermon</span>
                </div>

                <div
                  onClick={() => history.push('/admin/devotions')}
                  style={{
                    height: '100px',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                    transition: 'all 0.2s ease',
                    margin: '0 auto'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <IonIcon icon={book} style={{ fontSize: '28px', color: 'white', marginBottom: '6px' }} />
                  <span style={{ fontSize: '0.75em', textAlign: 'center', lineHeight: '1.1', fontWeight: '600', color: 'white' }}>Manage Devotion</span>
                </div>

                <div
                  onClick={() => history.push('/admin/events')}
                  style={{
                    height: '100px',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                    transition: 'all 0.2s ease',
                    margin: '0 auto'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <IonIcon icon={calendar} style={{ fontSize: '28px', color: 'white', marginBottom: '6px' }} />
                  <span style={{ fontSize: '0.75em', textAlign: 'center', lineHeight: '1.1', fontWeight: '600', color: 'white' }}>Manage Events</span>
                </div>

                <div
                  onClick={() => history.push('/admin/ministries')}
                  style={{
                    height: '100px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                    transition: 'all 0.2s ease',
                    margin: '0 auto'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <IonIcon icon={people} style={{ fontSize: '28px', color: 'white', marginBottom: '6px' }} />
                  <span style={{ fontSize: '0.75em', textAlign: 'center', lineHeight: '1.1', fontWeight: '600', color: 'white' }}>Manage Ministries</span>
                </div>

                <div
                  onClick={() => history.push('/admin/giving')}
                  style={{
                    height: '100px',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                    transition: 'all 0.2s ease',
                    margin: '0 auto'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <IonIcon icon={cardOutline} style={{ fontSize: '28px', color: 'white', marginBottom: '6px' }} />
                  <span style={{ fontSize: '0.75em', textAlign: 'center', lineHeight: '1.1', fontWeight: '600', color: 'white' }}>Manage Giving</span>
                </div>

                <div
                  onClick={() => history.push('/admin/news')}
                  style={{
                    height: '100px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                    transition: 'all 0.2s ease',
                    margin: '0 auto'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <IonIcon icon={newspaper} style={{ fontSize: '28px', color: 'white', marginBottom: '6px' }} />
                  <span style={{ fontSize: '0.75em', textAlign: 'center', lineHeight: '1.1', fontWeight: '600', color: 'white' }}>News & Updates</span>
                </div>

                <div
                  onClick={() => history.push('/admin/users')}
                  style={{
                    height: '100px',
                    background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(6, 182, 212, 0.3)',
                    transition: 'all 0.2s ease',
                    margin: '0 auto'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <IonIcon icon={people} style={{ fontSize: '28px', color: 'white', marginBottom: '6px' }} />
                  <span style={{ fontSize: '0.75em', textAlign: 'center', lineHeight: '1.1', fontWeight: '600', color: 'white' }}>Manage Users</span>
                </div>

                <div
                  onClick={() => history.push('/admin/contact')}
                  style={{
                    height: '100px',
                    background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(107, 114, 128, 0.3)',
                    transition: 'all 0.2s ease',
                    margin: '0 auto'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <IonIcon icon={informationCircle} style={{ fontSize: '28px', color: 'white', marginBottom: '6px' }} />
                  <span style={{ fontSize: '0.75em', textAlign: 'center', lineHeight: '1.1', fontWeight: '600', color: 'white' }}>About & Contact</span>
                </div>
              </div>
            </div>

            {/* User Management Section */}
            <div style={{
              backgroundColor: 'var(--ion-background-color)',
              padding: '24px',
              borderRadius: '16px',
              border: '1px solid var(--ion-color-step-200)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <IonIcon icon={people} style={{ fontSize: '1.8em', color: 'var(--ion-color-primary)' }} />
                <h2 style={{ margin: '0', fontSize: '1.4em', fontWeight: '600', color: 'var(--ion-text-color)' }}>
                  User Management
                </h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  backgroundColor: 'var(--ion-item-background)',
                  borderRadius: '8px',
                  border: '1px solid var(--ion-color-step-150)',
                  transition: 'all 0.2s ease'
                }}>
                  <span style={{ fontWeight: '500', color: 'var(--ion-text-color)' }}>Total Users</span>
                  <span style={{ fontWeight: '600', color: 'var(--ion-color-primary)' }}>{stats.users.total}</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  backgroundColor: 'var(--ion-item-background)',
                  borderRadius: '8px',
                  border: '1px solid var(--ion-color-step-150)',
                  transition: 'all 0.2s ease'
                }}>
                  <span style={{ fontWeight: '500', color: 'var(--ion-text-color)' }}>Active Users</span>
                  <span style={{ fontWeight: '600', color: '#10b981' }}>{stats.users.active}</span>
                </div>
              </div>
            </div>

            {/* Prayer Requests Section */}
            <div style={{
              backgroundColor: 'var(--ion-background-color)',
              padding: '24px',
              borderRadius: '16px',
              border: '1px solid var(--ion-color-step-200)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <IonIcon icon={chatbubble} style={{ fontSize: '1.8em', color: 'var(--ion-color-primary)' }} />
                <h2 style={{ margin: '0', fontSize: '1.4em', fontWeight: '600', color: 'var(--ion-text-color)' }}>
                  Prayer Requests
                </h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  backgroundColor: 'var(--ion-item-background)',
                  borderRadius: '8px',
                  border: '1px solid var(--ion-color-step-150)',
                  transition: 'all 0.2s ease'
                }}>
                  <span style={{ fontWeight: '500', color: 'var(--ion-text-color)' }}>Total Requests</span>
                  <span style={{ fontWeight: '600', color: 'var(--ion-color-primary)' }}>{stats.prayerRequests.total}</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                  transition: 'all 0.2s ease'
                }}>
                  <span style={{ fontWeight: '500', color: 'var(--ion-text-color)' }}>Pending</span>
                  <span style={{ fontWeight: '600', color: '#f59e0b' }}>{stats.prayerRequests.pending}</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  transition: 'all 0.2s ease'
                }}>
                  <span style={{ fontWeight: '500', color: 'var(--ion-text-color)' }}>Answered</span>
                  <span style={{ fontWeight: '600', color: '#10b981' }}>{stats.prayerRequests.answered}</span>
                </div>
                <IonButton expand="block" fill="outline" style={{ borderRadius: '12px', marginTop: '8px' }} onClick={() => history.push('/admin/prayer')}>
                  <IonIcon icon={chatbubble} slot="start" />
                  Review Requests
                </IonButton>
              </div>
            </div>
          </div>

          {/* Recent Activity Section */}
          <div style={{
            backgroundColor: 'var(--ion-background-color)',
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid var(--ion-color-step-200)',
            marginBottom: '32px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <IonIcon icon={statsChart} style={{ fontSize: '1.8em', color: 'var(--ion-color-primary)' }} />
              <h2 style={{ margin: '0', fontSize: '1.4em', fontWeight: '600', color: 'var(--ion-text-color)' }}>
                Recent Activity
              </h2>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '16px'
            }}>
              {[
                { action: 'New sermon uploaded', details: '"The Power of Prayer"', time: '2 hours ago', icon: playCircle, color: '#10b981' },
                { action: 'Prayer request answered', details: 'Request #124 resolved', time: '4 hours ago', icon: chatbubble, color: '#6366f1' },
                { action: 'Event created', details: 'Youth Conference 2025', time: '1 day ago', icon: calendar, color: '#f59e0b' },
                { action: 'New user registered', details: 'Welcome message sent', time: '2 days ago', icon: people, color: '#8b5cf6' }
              ].map((activity, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '16px',
                    backgroundColor: 'var(--ion-item-background)',
                    borderRadius: '12px',
                    border: '1px solid var(--ion-color-step-150)',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    backgroundColor: activity.color,
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                  }}>
                    <IonIcon icon={activity.icon} style={{ color: 'white', fontSize: '1.3em' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{
                      margin: '0 0 4px 0',
                      fontSize: '0.95em',
                      fontWeight: '600',
                      color: 'var(--ion-text-color)'
                    }}>
                      {activity.action}
                    </h4>
                    <p style={{
                      margin: '0 0 4px 0',
                      fontSize: '0.85em',
                      color: 'var(--ion-color-medium)'
                    }}>
                      {activity.details}
                    </p>
                    <p style={{
                      margin: '0',
                      fontSize: '0.8em',
                      color: 'var(--ion-color-medium)',
                      fontWeight: '500'
                    }}>
                      {activity.time}
                    </p>
                  </div>
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
    </IonPage>
  );
};

export default AdminDashboard;