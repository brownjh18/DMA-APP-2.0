import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonIcon,
  IonButton,
  IonItem,
  IonLabel,
  IonToggle,
  IonAlert,
  IonModal,
  IonTextarea,
} from "@ionic/react";

import {
  settingsSharp,
  arrowBack,
  moon,
  sunny,
  phonePortrait,
  notifications,
  trash,
  informationCircleOutline,
  shieldCheckmark,
  documentText,
  close,
  globe,
  person,
  chevronForward,
} from "ionicons/icons";

import { useSettings } from '../contexts/SettingsContext';
import { AuthContext } from '../App';
import { useHistory } from 'react-router-dom';
import { useState, useEffect, useContext } from 'react';
import { Capacitor } from '@capacitor/core';
import './Settings.css';

const Settings: React.FC = () => {
  const history = useHistory();
  const { user } = useContext(AuthContext);
  const { 
    appearance, 
    setAppearance,
    pushNotifications,
    setPushNotifications,
    clearCache,
  } = useSettings();

  const [showClearCacheAlert, setShowClearCacheAlert] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [pushNotificationStatus, setPushNotificationStatus] = useState<string>('unknown');

  // Check push notification permission status
  useEffect(() => {
    setPushNotificationStatus('granted');
  }, []);

  const handlePushNotificationToggle = async (checked: boolean) => {
    setPushNotifications(checked);
    if (checked) {
      console.log('Push notifications enabled (local setting only - Firebase not configured)');
    } else {
      console.log('Push notifications disabled');
    }
  };

  const openPrivacyPolicy = () => {
    setShowPrivacyModal(true);
  };

  const openTermsOfService = () => {
    setShowTermsModal(true);
  };

  const themeOptions = [
    { key: 'system' as const, icon: phonePortrait, label: 'System' },
    { key: 'light' as const, icon: sunny, label: 'Light' },
    { key: 'dark' as const, icon: moon, label: 'Dark' },
  ];

  // Get user initials for avatar
  const getUserInitials = () => {
    const name = user?.name || user?.firstName || user?.username || 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getUserName = () => {
    return user?.name || user?.firstName || user?.username || 'User';
  };

  const getUserEmail = () => {
    return user?.email || '';
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <IonButton
            fill="clear"
            onClick={() => history.goBack()}
            slot="start"
            style={{ marginLeft: '4px' }}
          >
            <IonIcon icon={arrowBack} style={{ fontSize: '22px' }} />
          </IonButton>
          <IonTitle className="title-ios">Settings</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="settings-content">

        {/* Profile Card */}
        <div className="settings-profile-card" onClick={() => history.push('/profile')}>
          <div className="settings-profile-avatar">
            {getUserInitials()}
          </div>
          <div className="settings-profile-info">
            <p className="settings-profile-name">{getUserName()}</p>
            <p className="settings-profile-email">{getUserEmail() || 'Tap to sign in'}</p>
          </div>
          <IonIcon icon={chevronForward} className="settings-profile-arrow" />
        </div>

        {/* Appearance Section */}
        <div className="settings-section">
          <p className="settings-section-title">Appearance</p>
          <div className="settings-section-card">
            <div className="settings-theme-selector">
              {themeOptions.map((opt) => (
                <div
                  key={opt.key}
                  className={`settings-theme-option ${appearance === opt.key ? 'active' : ''}`}
                  onClick={() => setAppearance(opt.key)}
                >
                  <IonIcon icon={opt.icon} className="settings-theme-option-icon" />
                  <span className="settings-theme-option-label">{opt.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="settings-section">
          <p className="settings-section-title">Notifications</p>
          <div className="settings-section-card">
            <div className="settings-item no-icon">
              <IonIcon
                icon={notifications}
                className="settings-item-icon"
                style={{ background: '#ff3b30' }}
              />
              <div className="settings-item-content">
                <span className="settings-item-label">Push Notifications</span>
              </div>
              <div className="settings-toggle-wrapper" onClick={() => handlePushNotificationToggle(!pushNotifications)}>
                <div className={`settings-toggle-track ${pushNotifications ? 'on' : ''}`}>
                  <div className="settings-toggle-knob" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Storage Section */}
        <div className="settings-section">
          <p className="settings-section-title">Storage</p>
          <div className="settings-section-card">
            <div
              className="settings-item no-icon settings-item-destructive"
              onClick={() => setShowClearCacheAlert(true)}
            >
              <IonIcon
                icon={trash}
                className="settings-item-icon"
                style={{ background: '#ff3b30' }}
              />
              <div className="settings-item-content">
                <span className="settings-item-label">Clear Cache</span>
              </div>
              <IonIcon icon={chevronForward} className="settings-item-arrow" />
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="settings-section">
          <p className="settings-section-title">About</p>
          <div className="settings-section-card">
            <div className="settings-item">
              <IonIcon
                icon={informationCircleOutline}
                className="settings-item-icon"
                style={{ background: '#5856d6' }}
              />
              <div className="settings-item-content">
                <span className="settings-item-label">App Version</span>
              </div>
              <span className="settings-item-value">1.0.0</span>
            </div>
            <div className="settings-item" onClick={openPrivacyPolicy}>
              <IonIcon
                icon={shieldCheckmark}
                className="settings-item-icon"
                style={{ background: '#34c759' }}
              />
              <div className="settings-item-content">
                <span className="settings-item-label">Privacy Policy</span>
              </div>
              <IonIcon icon={chevronForward} className="settings-item-arrow" />
            </div>
            <div className="settings-item" onClick={openTermsOfService}>
              <IonIcon
                icon={documentText}
                className="settings-item-icon"
                style={{ background: '#007aff' }}
              />
              <div className="settings-item-content">
                <span className="settings-item-label">Terms of Service</span>
              </div>
              <IonIcon icon={chevronForward} className="settings-item-arrow" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="settings-footer">
          <p className="settings-footer-text">Dove Church</p>
          <p className="settings-footer-version">Version 1.0.0</p>
        </div>
      </IonContent>

      {/* Clear Cache Confirmation Alert */}
      <IonAlert
        isOpen={showClearCacheAlert}
        onDidDismiss={() => setShowClearCacheAlert(false)}
        header="Clear Cache"
        message="This will remove all cached data, downloads, and saved preferences. Are you sure?"
        buttons={[
          {
            text: 'Cancel',
            role: 'cancel',
            handler: () => {
              setShowClearCacheAlert(false);
            },
          },
          {
            text: 'Clear',
            handler: () => {
              clearCache();
            },
          },
        ]}
      />

      {/* Privacy Policy Modal */}
      <div>
        {showPrivacyModal && (
          <>
            <div className="settings-modal-overlay" onClick={() => setShowPrivacyModal(false)} />
            <div className="settings-modal">
              <div className="settings-modal-handle" />
              <div className="settings-modal-header">
                <h2>Privacy Policy</h2>
                <div className="settings-modal-close-btn" onClick={() => setShowPrivacyModal(false)}>
                  <IonIcon icon={close} style={{ fontSize: '18px' }} />
                </div>
              </div>
              <div className="settings-modal-body">
                <h3>1. Information We Collect</h3>
                <p>We collect information you provide directly to us, such as when you create an account, update your profile, or contact us for support.</p>

                <h3>2. How We Use Your Information</h3>
                <p>We use the information we collect to provide, maintain, and improve our services, process transactions, and send you technical notices and support messages.</p>

                <h3>3. Information Sharing</h3>
                <p>We do not share your personal information with third parties except as described in this policy or with your consent.</p>

                <h3>4. Data Security</h3>
                <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>

                <h3>5. Your Rights</h3>
                <p>You have the right to access, update, or delete your personal information at any time. You can do this through your profile settings or by contacting us.</p>

                <h3>6. Contact Us</h3>
                <p>If you have any questions about this Privacy Policy, please contact us at privacy@dovechurch.com</p>

                <p className="last-updated">Last updated: January 2025</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Terms of Service Modal */}
      <div>
        {showTermsModal && (
          <>
            <div className="settings-modal-overlay" onClick={() => setShowTermsModal(false)} />
            <div className="settings-modal">
              <div className="settings-modal-handle" />
              <div className="settings-modal-header">
                <h2>Terms of Service</h2>
                <div className="settings-modal-close-btn" onClick={() => setShowTermsModal(false)}>
                  <IonIcon icon={close} style={{ fontSize: '18px' }} />
                </div>
              </div>
              <div className="settings-modal-body">
                <h3>1. Acceptance of Terms</h3>
                <p>By accessing and using this application, you accept and agree to be bound by the terms and provision of this agreement.</p>

                <h3>2. Use License</h3>
                <p>Permission is granted to temporarily download one copy of the application for personal, non-commercial transitory viewing only.</p>

                <h3>3. User Account</h3>
                <p>When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms.</p>

                <h3>4. Content Guidelines</h3>
                <p>Users are responsible for the content they post. You agree not to post content that is illegal, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, or otherwise objectionable.</p>

                <h3>5. Intellectual Property</h3>
                <p>All content, features, and functionality of this application are owned by Dove Church and are protected by international copyright, trademark, and other intellectual property laws.</p>

                <h3>6. Termination</h3>
                <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>

                <h3>7. Limitation of Liability</h3>
                <p>In no event shall Dove Church, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages.</p>

                <h3>8. Changes to Terms</h3>
                <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will try to provide at least 30 days notice prior to any new terms taking effect.</p>

                <h3>9. Contact Us</h3>
                <p>If you have any questions about these Terms, please contact us at legal@dovechurch.com</p>

                <p className="last-updated">Last updated: January 2025</p>
              </div>
            </div>
          </>
        )}
      </div>
    </IonPage>
  );
};

export default Settings;