import {
  IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonIcon,
  IonAvatar, IonButton, IonList, IonItem, IonLabel, IonListHeader
} from '@ionic/react';
import {
  person, logOut, arrowBack, chevronForward, statsChart,
  settings, helpCircle, informationCircle, close
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

  const [showHelpFeedbackModal, setShowHelpFeedbackModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  const openHelpFeedback = () => {
    setShowHelpFeedbackModal(true);
  };

  const openAbout = () => {
    setShowAboutModal(true);
  };

  useEffect(() => {
    if (!isAuthChecking) setLoading(false);
  }, [isAuthChecking]);

  const getUserRoleLabel = () => {
    if (user?.role === 'admin') return 'Administrator';
    if (user?.role === 'moderator') return 'Moderator';
    return 'Member';
  };

  const HelpFeedbackModal = () => (
    <div className="settings-modal-overlay" onClick={() => setShowHelpFeedbackModal(false)}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-modal-header">
          <h2>Help & Feedback</h2>
          <div className="settings-modal-close-btn" onClick={() => setShowHelpFeedbackModal(false)}>
            <IonIcon icon={close} style={{ fontSize: '18px' }} />
          </div>
        </div>
        <div className="settings-modal-body">
          <h3>Support & Help</h3>
          <p>For help with your account, app navigation, or technical issues, please contact our support team.</p>
          
          <h3>Email Support</h3>
          <p>Email us at: support@doveapp.com</p>
          
          <h3>Phone Support</h3>
          <p>Call us at: 1-800-HELP-NOW (1-800-435-7669)</p>
          
          <h3>Report a Bug</h3>
          <p>If you encounter an issue, please provide details including:
            <ul>
              <li>What you were trying to do</li>
              <li>What happened instead</li>
              <li>Screenshots if possible</li>
              <li>Your device and app version</li>
            </ul>
          </p>
          
          <h3>Feature Requests</h3>
          <p>Share your ideas for new features or improvements by contacting us at: features@doveapp.com</p>
          
          <h3>Community Support</h3>
          <p>Connect with other users in our community forums and Discord channel for tips, tricks, and peer support.</p>
          
          <p className="last-updated">Last updated: January 2025</p>
        </div>
      </div>
    </div>
  );

  const AboutModal = () => (
    <div className="settings-modal-overlay" onClick={() => setShowAboutModal(false)}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-modal-header">
          <h2>About Dove App v1.0.0</h2>
          <div className="settings-modal-close-btn" onClick={() => setShowAboutModal(false)}>
            <IonIcon icon={close} style={{ fontSize: '18px' }} />
          </div>
        </div>
        <div className="settings-modal-body">
          <div className="about-app-info">
            <h1>Dove App v1.0.0</h1>
            <p>Your spiritual journey companion for prayer, devotion, worship, and community connection.</p>
          </div>
          
          <h3>Our Mission</h3>
          <p>Dove App helps believers deepen their faith, connect with their faith community, and grow spiritually through daily devotionals, prayer requests, and meaningful relationships.</p>
          
          <h3>Key Features</h3>
          <ul>
            <li>Daily inspirational devotions and scripture reflections</li>
            <li>Prayer requests and community support</li>
            <li>Live streaming services and recorded sermons</li>
            <li>Ministry connections and volunteer opportunities</li>
            <li>Personal prayer journal and meditation</li>
            <li>Live events and broadcasts</li>
            <li>Favorites and reading history tracking</li>
          </ul>
          
          <h3>Technology</h3>
          <p>Built with modern web technologies to provide a smooth, secure, and accessible experience across all devices.</p>
          
          <h3>Company</h3>
          <p>Dove App is committed to helping churches and faith communities connect with their members and grow spiritually in today's digital world.</p>
          
          <p className="last-updated">Version 1.0.0 | Last updated: January 2025</p>
        </div>
      </div>
    </div>
  );

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
        <IonToolbar className="toolbar-ios">
          <IonButton slot="start" fill="clear" onClick={goBack} style={{ marginLeft: '4px' }}>
            <IonIcon icon={arrowBack} style={{ fontSize: '22px' }} />
          </IonButton>
          <IonTitle className="title-ios" style={{ textAlign: 'left', marginLeft: '-16px' }}>Profile</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <div className="profile-header">
          <IonAvatar className="profile-avatar">
            <img
              src={user.profilePicture ? (user.profilePicture.startsWith('data:') ? user.profilePicture : `${BACKEND_BASE_URL}${user.profilePicture}?t=${Date.now()}`) : 'https://i.pravatar.cc/150?img=12'}
              alt="User Avatar"
            />
          </IonAvatar>
          <div className="profile-details">
            <h1 className="profile-name">{user.name}</h1>
            <p className="profile-email">{user.email}</p>
            {user.phone && <p className="profile-phone">{user.phone}</p>}
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
           <IonItem button onClick={() => openHelpFeedback()} detail={false}>
             <IonIcon slot="start" icon={helpCircle} />
             <IonLabel>Help & Feedback</IonLabel>
             <IonIcon slot="end" icon={chevronForward} />
           </IonItem>
           <IonItem button onClick={() => openAbout()} detail={false}>
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