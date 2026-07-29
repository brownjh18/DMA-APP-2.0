import {
  IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonIcon,
  IonAvatar, IonButton, IonList, IonItem, IonLabel, IonListHeader,
  IonAlert
} from '@ionic/react';
import {
  person, logOut, arrowBack, chevronForward, statsChart,
  settings, helpCircle, informationCircle, close, lockClosed
} from 'ionicons/icons';
import { useState, useEffect, useContext } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { apiService, BACKEND_BASE_URL } from '../services/api';
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
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');

  const openHelpFeedback = () => {
    setShowHelpFeedbackModal(true);
  };

  const openAbout = () => {
    setShowAboutModal(true);
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setChangingPassword(true);
    try {
      await apiService.changePassword({ currentPassword, newPassword });
      setPasswordSuccess('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess('');
      }, 1500);
    } catch (err: any) {
      setPasswordError(err?.message || 'Failed to change password. Check your current password.');
    } finally {
      setChangingPassword(false);
    }
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
    <>
      <div className="settings-popover-overlay" onClick={() => setShowHelpFeedbackModal(false)} />
      <div className="settings-popover">
        <div className="settings-popover-close" onClick={() => setShowHelpFeedbackModal(false)}>
          <IonIcon icon={close} />
        </div>

        <h2 className="settings-popover-title">Help & Feedback</h2>

        <div className="settings-popover-body-scroll">
          <h3>Support & Help</h3>
          <p>For help with your account, app navigation, or technical issues, please contact our support team.</p>
          
          <h3>Email Support</h3>
          <p>Email us at: support@doveapp.com</p>
          
          <h3>Phone Support</h3>
          <p>Call us at: 1-800-HELP-NOW (1-800-435-7669)</p>
          
          <h3>Report a Bug</h3>
          <p>If you encounter an issue, please provide details including:</p>
          <ul>
            <li>What you were trying to do</li>
            <li>What happened instead</li>
            <li>Screenshots if possible</li>
            <li>Your device and app version</li>
          </ul>
          
          <h3>Feature Requests</h3>
          <p>Share your ideas for new features or improvements by contacting us at: features@doveapp.com</p>
          
          <h3>Community Support</h3>
          <p>Connect with other users in our community forums and Discord channel for tips, tricks, and peer support.</p>
          
          <p className="settings-popover-footer-text">Last updated: January 2025</p>
        </div>
      </div>
    </>
  );

  const AboutModal = () => (
    <>
      <div className="settings-popover-overlay" onClick={() => setShowAboutModal(false)} />
      <div className="settings-popover">
        <div className="settings-popover-close" onClick={() => setShowAboutModal(false)}>
          <IonIcon icon={close} />
        </div>

        <h2 className="settings-popover-title">About Dove App</h2>

        <div className="settings-popover-body-scroll">
          <div style={{ textAlign: 'center', marginBottom: '12px' }}>
            <p style={{ fontSize: '22px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 4px' }}>Dove App v1.0.0</p>
            <p style={{ fontSize: '13px', color: '#8e8e93', margin: 0 }}>Your spiritual journey companion</p>
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
          
          <p className="settings-popover-footer-text">Version 1.0.0 | Last updated: January 2025</p>
        </div>
      </div>
    </>
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
          <IonItem button onClick={() => { setShowPasswordModal(true); setPasswordError(''); setPasswordSuccess(''); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }} detail={false}>
            <IonIcon slot="start" icon={lockClosed} />
            <IonLabel>Change Password</IonLabel>
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
          <button
            className="signout-btn"
            onClick={() => {
              logout();
              history.push('/tab1');
            }}
          >
            <IonIcon icon={logOut} />
            <span>Sign Out</span>
          </button>
        </div>
      </IonContent>
      {showHelpFeedbackModal && <HelpFeedbackModal />}
      {showAboutModal && <AboutModal />}
      {showPasswordModal && (
        <>
          <div className="settings-popover-overlay" onClick={() => setShowPasswordModal(false)} />
          <div className="settings-popover">
            <div className="settings-popover-close" onClick={() => setShowPasswordModal(false)}>
              <IonIcon icon={close} />
            </div>
            <h2 className="settings-popover-title">Change Password</h2>
            <div className="settings-popover-body-scroll">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#636366', display: 'block', marginBottom: '6px' }}>Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e5e5e7', fontSize: '15px', background: '#fafafa', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#636366', display: 'block', marginBottom: '6px' }}>New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e5e5e7', fontSize: '15px', background: '#fafafa', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#636366', display: 'block', marginBottom: '6px' }}>Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e5e5e7', fontSize: '15px', background: '#fafafa', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                {passwordError && <p style={{ color: '#ef4444', fontSize: '13px', margin: 0 }}>{passwordError}</p>}
                {passwordSuccess && <p style={{ color: '#22c55e', fontSize: '13px', margin: 0 }}>{passwordSuccess}</p>}
                <button
                  onClick={handleChangePassword}
                  disabled={changingPassword}
                  style={{
                    width: '100%', padding: '12px', borderRadius: '12px', border: 'none',
                    background: changingPassword ? '#a5b4fc' : '#6366f1', color: '#fff',
                    fontSize: '15px', fontWeight: '600', cursor: changingPassword ? 'not-allowed' : 'pointer',
                    marginTop: '4px'
                  }}
                >
                  {changingPassword ? 'Changing...' : 'Update Password'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </IonPage>
  );
};

export default Profile;