import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardContent, IonButtons, IonBackButton, IonIcon, IonAvatar, IonButton, IonBadge, IonText, useIonViewDidEnter } from '@ionic/react';
import { person, mail, call, location, calendar, heart, book, play, settings, logOut, people, statsChart, home, star, time, checkmarkCircle, personCircleOutline } from 'ionicons/icons';
import { useState, useEffect, useContext } from 'react';
import { useHistory } from 'react-router-dom';
import apiService from '../services/api';
import { AuthContext } from '../App';

const Profile: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const history = useHistory();
  const { user: globalUser, logout, updateUser } = useContext(AuthContext);

  const fetchUserData = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        apiService.setToken(token);
        const userData = await apiService.getProfile();
        setUser(userData.user);
        updateUser(userData.user); // Update global user with fresh data
      } catch (error) {
        // Token may be expired, but keep cached data to prevent sign out
        console.log('Failed to fetch profile, using cached data');
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (globalUser) {
      setUser(globalUser);
      setLoading(false);
    } else {
      // User is logged out, clear local state and check for token
      setUser(null);
      fetchUserData();
    }
  }, [globalUser]);

  useIonViewDidEnter(() => {
    // Always refresh user data when returning to profile page
    fetchUserData();
  });

  if (loading) {
    return (
      <IonPage>
        <IonHeader translucent>
          <IonToolbar className="toolbar-ios">
            <IonButtons slot="start">
              <IonBackButton defaultHref="/tab1" />
            </IonButtons>
            <IonTitle className="title-ios">Profile</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen className="content-ios">
          <div style={{ padding: '20px', textAlign: 'center' }}>
            Loading...
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!user) {
    return (
      <IonPage>
        <IonHeader translucent>
          <IonToolbar className="toolbar-ios">
            <IonButtons slot="start">
              <IonBackButton defaultHref="/tab1" />
            </IonButtons>
            <IonTitle className="title-ios">Profile</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen className="content-ios">
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <IonIcon icon={personCircleOutline} style={{ fontSize: '4em', color: 'var(--ion-text-color)', marginBottom: '20px' }} />
            <h2 style={{ color: 'var(--ion-text-color)', marginBottom: '20px' }}>Sign In Required</h2>
            <p style={{ color: 'var(--ion-text-color)', marginBottom: '30px' }}>
              Please sign in to access your profile and account features.
            </p>
            <IonButton
              expand="block"
              style={{
                backgroundColor: 'var(--ion-color-primary)',
                color: 'white',
                borderRadius: '12px',
                fontWeight: '600'
              }}
              onClick={() => history.push('/signin')}
            >
              Sign In
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tab1" />
          </IonButtons>
          <IonTitle className="title-ios">Profile</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
        <div style={{
          padding: '20px 24px',
          maxWidth: '400px',
          margin: '0 auto',
          paddingTop: '40px'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <IonAvatar style={{
              width: '100px',
              height: '100px',
              margin: '0 auto 20px auto',
              border: '3px solid var(--ion-color-primary)'
            }}>
              <img
                src={user.profilePicture ? `http://localhost:5000${user.profilePicture}` : 'https://i.pravatar.cc/150?img=12'}
                alt="User Avatar"
              />
            </IonAvatar>

            <h1 style={{
              margin: '0 0 8px 0',
              fontSize: '1.8em',
              fontWeight: '700',
              color: 'var(--ion-text-color)'
            }}>
              {user.name}
            </h1>

            <p style={{
              margin: '0',
              color: 'var(--ion-text-color)',
              opacity: 0.7,
              fontSize: '1em'
            }}>
              {user.role === 'admin' ? 'Administrator' : user.role === 'moderator' ? 'Moderator' : 'Member'}
            </p>
          </div>

          {/* Account Information */}
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{
              margin: '0 0 16px 0',
              fontSize: '1.4em',
              fontWeight: '600',
              color: 'var(--ion-text-color)'
            }}>
              Account Information
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                backgroundColor: 'rgba(0,0,0,0.05)',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid var(--ion-color-step-300)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <IonIcon icon={mail} style={{ color: 'var(--ion-color-primary)', fontSize: '1.5em' }} />
                  <span style={{ fontWeight: '600', color: 'var(--ion-text-color)' }}>Email</span>
                </div>
                <p style={{ margin: '0', color: 'var(--ion-color-medium)', fontSize: '0.9em' }}>{user.email}</p>
              </div>

              <div style={{
                backgroundColor: 'rgba(0,0,0,0.05)',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid var(--ion-color-step-300)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <IonIcon icon={person} style={{ color: 'var(--ion-color-primary)', fontSize: '1.5em' }} />
                  <span style={{ fontWeight: '600', color: 'var(--ion-text-color)' }}>Role</span>
                </div>
                <p style={{ margin: '0', color: 'var(--ion-color-medium)', fontSize: '0.9em' }}>
                  {user.role === 'admin' ? 'Administrator' : user.role === 'moderator' ? 'Moderator' : 'Member'}
                </p>
              </div>

              <div style={{
                backgroundColor: 'rgba(0,0,0,0.05)',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid var(--ion-color-step-300)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <IonIcon icon={call} style={{ color: 'var(--ion-color-primary)', fontSize: '1.5em' }} />
                  <span style={{ fontWeight: '600', color: 'var(--ion-text-color)' }}>Phone</span>
                </div>
                <p style={{ margin: '0', color: 'var(--ion-color-medium)', fontSize: '0.9em' }}>
                  {user.phone || 'Not provided'}
                </p>
              </div>
            </div>
          </div>

          {/* Edit Profile Button */}
          <div style={{ marginBottom: '24px' }}>
            <IonButton
              expand="block"
              style={{
                height: '44px',
                borderRadius: '8px',
                fontWeight: '600',
                backgroundColor: 'var(--ion-color-primary)',
                '--border-radius': '8px'
              }}
              onClick={() => history.push('/edit-profile')}
            >
              <IonIcon icon={person} slot="start" />
              Edit Profile
            </IonButton>
          </div>

          {/* Quick Actions */}
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{
              margin: '0 0 16px 0',
              fontSize: '1.4em',
              fontWeight: '600',
              color: 'var(--ion-text-color)'
            }}>
              Quick Actions
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '5px',
              alignItems: 'center',
              padding: '0px'
            }}>
              <div
                onClick={() => history.push('/settings')}
                style={{
                  width: '75px',
                  height: '75px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                  transition: 'all 0.2s ease',
                  margin: '0 auto'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <IonIcon icon={settings} style={{ fontSize: '22px', color: 'white', marginBottom: '4px' }} />
                <span style={{ fontSize: '0.65em', textAlign: 'center', lineHeight: '1.1', fontWeight: '600', color: 'white' }}>Settings</span>
              </div>

              <div
                onClick={() => history.push('/favorites')}
                style={{
                  width: '75px',
                  height: '75px',
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
                <IonIcon icon={heart} style={{ fontSize: '22px', color: 'white', marginBottom: '4px' }} />
                <span style={{ fontSize: '0.65em', textAlign: 'center', lineHeight: '1.1', fontWeight: '600', color: 'white' }}>Favorites</span>
              </div>

              <div
                onClick={() => history.push('/reading-history')}
                style={{
                  width: '75px',
                  height: '75px',
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
                <IonIcon icon={book} style={{ fontSize: '22px', color: 'white', marginBottom: '4px' }} />
                <span style={{ fontSize: '0.65em', textAlign: 'center', lineHeight: '1.1', fontWeight: '600', color: 'white' }}>Reading</span>
              </div>

              <div
                onClick={() => history.push('/watch-history')}
                style={{
                  width: '75px',
                  height: '75px',
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
                <IonIcon icon={play} style={{ fontSize: '22px', color: 'white', marginBottom: '4px' }} />
                <span style={{ fontSize: '0.65em', textAlign: 'center', lineHeight: '1.1', fontWeight: '600', color: 'white' }}>Watch</span>
              </div>
            </div>
          </div>

          {/* Sign Out */}
          <IonButton
            expand="block"
            color="danger"
            onClick={() => {
              logout();
              // Redirect to home page after logout
              history.push('/tab1');
            }}
            style={{
              height: '44px',
              borderRadius: '8px',
              fontWeight: '600'
            }}
          >
            <IonIcon icon={logOut} slot="start" />
            Sign Out
          </IonButton>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <IonText style={{
              color: 'var(--ion-text-color)',
              opacity: 0.6,
              fontSize: '0.8em'
            }}>
              Dove Ministries Africa
            </IonText>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Profile;