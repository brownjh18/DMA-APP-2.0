import {
  IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonIcon,
  IonAvatar, IonButton, IonList, IonItem, IonLabel, IonListHeader
} from '@ionic/react';
import {
  person, logOut, arrowBack, chevronForward, statsChart,
  settings, helpCircle, informationCircle
} from 'ionicons/icons';
import { useState, useEffect, useContext } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { BACKEND_BASE_URL } from '../services/api';
import { AuthContext } from '../App';
import './Profile.css';

const Profile: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const history = useHistory();
  const location = useLocation();
  const { user, logout, isLoggedIn, isAuthChecking } = useContext(AuthContext);

  const goBack = () => history.goBack();

  useEffect(() => {
    if (!isAuthChecking) setLoading(false);
  }, [isAuthChecking]);

  const getUserRoleLabel = () => {
    if (user?.role === 'admin') return 'Administrator';
    if (user?.role === 'moderator') return 'Moderator';
    return 'Member';
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButton slot="start" fill="clear" onClick={goBack}>
              <IonIcon icon={arrowBack} />
            </IonButton>
            <IonTitle>Profile</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="loading-placeholder">Loading...</div>
        </IonContent>
      </IonPage>
    );
  }

  if (!user || !isLoggedIn) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButton slot="start" fill="clear" onClick={goBack}>
              <IonIcon icon={arrowBack} />
            </IonButton>
            <IonTitle>Profile</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen className="ion-padding">
          <div className="signin-prompt">
            <IonIcon icon={person} className="signin-icon" />
            <h2>Sign In Required</h2>
            <p>Please sign in to view your profile and activity.</p>
            <IonButton
              onClick={() => history.push({ pathname: '/signin', state: { from: location } })}
              expand="block"
              className="signin-button"
            >
              Sign In
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage className="profile-page">
      <IonHeader translucent>
        <IonToolbar>
          <IonButton slot="start" fill="clear" onClick={goBack}>
            <IonIcon icon={arrowBack} />
          </IonButton>
          <IonTitle>Profile</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <div className="profile-header">
          <IonAvatar className="profile-avatar">
            <img
              src={user.profilePicture ? `${BACKEND_BASE_URL}${user.profilePicture}?t=${Date.now()}` : 'https://i.pravatar.cc/150?img=12'}
              alt="User Avatar"
            />
          </IonAvatar>
          <div className="profile-details">
            <h1 className="profile-name">{user.name}</h1>
            <p className="profile-email">{user.email}</p>
          </div>
        </div>

        <IonList lines="none" className="profile-options">
          <IonListHeader>Account</IonListHeader>
          <IonItem button onClick={() => history.push('/edit-profile')} detail={false}>
            <IonIcon slot="start" icon={person} />
            <IonLabel>Edit Profile</IonLabel>
            <IonIcon slot="end" icon={chevronForward} />
          </IonItem>
          <IonItem button onClick={() => history.push('/settings')} detail={false}>
            <IonIcon slot="start" icon={settings} />
            <IonLabel>Settings</IonLabel>
            <IonIcon slot="end" icon={chevronForward} />
          </IonItem>

          <IonListHeader>Support</IonListHeader>
          <IonItem button onClick={() => history.push('/tab1')} detail={false}>
            <IonIcon slot="start" icon={helpCircle} />
            <IonLabel>Help & Feedback</IonLabel>
            <IonIcon slot="end" icon={chevronForward} />
          </IonItem>
          <IonItem button onClick={() => history.push('/tab1')} detail={false}>
            <IonIcon slot="start" icon={informationCircle} />
            <IonLabel>About</IonLabel>
            <IonIcon slot="end" icon={chevronForward} />
          </IonItem>
        </IonList>

        <div className="danger-zone">
          <IonButton
            expand="block"
            color="danger"
            fill="clear"
            onClick={() => {
              logout();
              history.push('/tab1');
            }}
          >
            <IonIcon slot="start" icon={logOut} />
            Sign Out
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Profile;