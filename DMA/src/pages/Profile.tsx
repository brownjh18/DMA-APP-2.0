import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardContent, IonIcon, IonAvatar, IonButton, IonBadge, IonText, useIonViewDidEnter } from '@ionic/react';
import { person, mail, call, location, calendar, settings, logOut, people, statsChart, home, star, time, checkmarkCircle, personCircleOutline, arrowBack } from 'ionicons/icons';
import { useState, useEffect, useContext } from 'react';
import { useHistory } from 'react-router-dom';
import apiService, { BACKEND_BASE_URL } from '../services/api';
import { AuthContext } from '../App';
const Profile: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const history = useHistory();
  const { user, logout, updateUser, isLoggedIn } = useContext(AuthContext);

  useEffect(() => {
    // Check auth state immediately
    if (user && isLoggedIn) {
      setLoading(false);
    } else if (!user && !isLoggedIn) {
      // User is not logged in, show sign-in prompt
      setLoading(false);
    } else {
      // Auth state is still loading, wait a bit
      const timer = setTimeout(() => {
        setLoading(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [user, isLoggedIn]);

  // Refresh user data when the component becomes active
  useIonViewDidEnter(() => {
    const refreshUserData = async () => {
      const token = localStorage.getItem('token');
      if (token && isLoggedIn) {
        try {
          apiService.setToken(token);
          const userData = await apiService.getProfile();
          // Update the user context with fresh data
          if (userData.user) {
            updateUser(userData.user);
          }
        } catch (error) {
          console.error('Failed to refresh user data:', error);
        }
      }
    };

    refreshUserData();
  });

  if (loading) {
    return (
      <IonPage>
        <IonHeader translucent>
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
          <IonToolbar className="toolbar-ios">
             
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

  if (!user || !isLoggedIn) {
    return (
      <IonPage>
        <IonHeader translucent>
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
          <IonToolbar className="toolbar-ios">
             
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
        <IonToolbar className="toolbar-ios">
           
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
                src={user.profilePicture ? `${BACKEND_BASE_URL}${user.profilePicture}?t=${Date.now()}` : 'https://i.pravatar.cc/150?img=12'}
                alt="User Avatar"
                style={{ background: 'black' }}
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

         {/* Action Buttons */}
         <div style={{
           display: 'flex',
           gap: '16px',
           marginBottom: '24px',
           flexWrap: 'wrap'
         }}>
           <IonButton
             expand="block"
             style={{
               flex: 1,
               minWidth: '140px',
               height: '48px',
               borderRadius: '24px',
               fontWeight: '600',
               background: 'rgba(255, 255, 255, 0.1)',
               backdropFilter: 'blur(30px) saturate(150%)',
               WebkitBackdropFilter: 'blur(30px) saturate(150%)',
               border: '1px solid rgba(255, 255, 255, 0.3)',
               boxShadow: '0 15px 45px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
               color: '#ffffff',
               transition: 'transform 0.2s ease, box-shadow 0.2s ease',
               '--border-radius': '24px'
             }}
             onClick={() => history.push('/edit-profile')}
             onMouseDown={(e) => {
               const target = e.currentTarget as HTMLElement;
               target.style.transform = 'scale(0.98)';
               target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
             }}
             onMouseUp={(e) => {
               const target = e.currentTarget as HTMLElement;
               setTimeout(() => {
                 target.style.transform = 'scale(1)';
                 target.style.boxShadow = '0 15px 45px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.4)';
               }, 200);
             }}
             onMouseLeave={(e) => {
               const target = e.currentTarget as HTMLElement;
               target.style.transform = 'scale(1)';
               target.style.boxShadow = '0 15px 45px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.4)';
             }}
           >
             <IonIcon icon={person} slot="start" />
             Edit Profile
           </IonButton>

           <IonButton
             expand="block"
             onClick={() => {
               logout();
               // Redirect to home page after logout
               history.push('/tab1');
             }}
             style={{
               flex: 1,
               minWidth: '140px',
               height: '48px',
               borderRadius: '24px',
               fontWeight: '600',
               background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.8) 0%, rgba(147, 51, 234, 0.6) 50%, rgba(147, 51, 234, 0.4) 100%)',
               backdropFilter: 'blur(20px) saturate(180%)',
               WebkitBackdropFilter: 'blur(20px) saturate(180%)',
               border: '1px solid rgba(147, 51, 234, 0.5)',
               boxShadow: '0 8px 32px rgba(147, 51, 234, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
               color: '#ffffff',
               transition: 'transform 0.2s ease, box-shadow 0.2s ease',
               '--border-radius': '24px'
             }}
             onMouseDown={(e) => {
               const target = e.currentTarget as HTMLElement;
               target.style.transform = 'scale(0.98)';
               target.style.boxShadow = '0 4px 16px rgba(147, 51, 234, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
             }}
             onMouseUp={(e) => {
               const target = e.currentTarget as HTMLElement;
               setTimeout(() => {
                 target.style.transform = 'scale(1)';
                 target.style.boxShadow = '0 8px 32px rgba(147, 51, 234, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
               }, 200);
             }}
             onMouseLeave={(e) => {
               const target = e.currentTarget as HTMLElement;
               target.style.transform = 'scale(1)';
               target.style.boxShadow = '0 8px 32px rgba(147, 51, 234, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
             }}
           >
             <IonIcon icon={logOut} slot="start" />
             Sign Out
           </IonButton>
         </div>

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