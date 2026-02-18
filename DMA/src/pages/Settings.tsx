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
} from "ionicons/icons";

import { useSettings } from '../contexts/SettingsContext';
import { useHistory } from 'react-router-dom';
import { useState } from 'react';

const Settings: React.FC = () => {
  const history = useHistory();
  const { 
    appearance, 
    setAppearance,
    pushNotifications,
    setPushNotifications,
    clearCache,
  } = useSettings();

  const [showClearCacheAlert, setShowClearCacheAlert] = useState(false);

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <IonTitle className="title-ios">Settings</IonTitle>
        </IonToolbar>
      </IonHeader>

      {/* Back Button */}
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

      <IonContent fullscreen className="content-ios">
        <div style={{
          padding: '20px',
          maxWidth: '400px',
          margin: '0 auto',
          paddingTop: '20px'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <IonIcon
              icon={settingsSharp}
              style={{
                fontSize: '3em',
                color: 'var(--ion-color-primary)',
                marginBottom: '16px'
              }}
            />
            <h1 style={{
              margin: '0 0 8px 0',
              fontSize: '1.8em',
              fontWeight: '700',
              color: 'var(--ion-text-color)'
            }}>
              Settings
            </h1>
            <p style={{
              margin: '0',
              color: 'var(--ion-text-color)',
              opacity: 0.7,
              fontSize: '1em'
            }}>
              Customize your app experience
            </p>
          </div>

          {/* Appearance Section */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              fontSize: '0.9em',
              fontWeight: '600',
              color: 'var(--ion-color-primary)',
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              Appearance
            </h3>
            
            {/* Appearance Selection - 3 Icons Horizontally */}
            <div
              style={{
                borderRadius: '16px',
                border: '1px solid var(--ion-color-step-300)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                padding: '16px',
                background: 'var(--ion-background-color, #ffffff)'
              }}
            >
              <div style={{
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <IonIcon icon={phonePortrait} slot="start" style={{ color: 'var(--ion-color-primary)' }} />
                  <IonLabel style={{ margin: 0 }}>Theme</IonLabel>
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-around',
                gap: '8px'
              }}>
                {/* System Option */}
                <IonButton
                  fill={appearance === 'system' ? 'solid' : 'clear'}
                  onClick={() => setAppearance('system')}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 'auto',
                    '--border-radius': '10px',
                    '--padding-start': '12px',
                    '--padding-end': '12px',
                    '--padding-top': '10px',
                    '--padding-bottom': '10px',
                    flex: 1,
                    '--background': appearance === 'system' 
                      ? 'var(--ion-color-primary)' 
                      : 'var(--ion-color-step-100, rgba(0,0,0,0.05))',
                    '--color': appearance === 'system' ? '#ffffff' : 'var(--ion-text-color)',
                  }}
                >
                  <IonIcon 
                    icon={phonePortrait} 
                    style={{ fontSize: '18px' }} 
                  />
                  <span style={{ fontSize: '10px', marginTop: '2px' }}>System</span>
                </IonButton>

                {/* Light Option */}
                <IonButton
                  fill={appearance === 'light' ? 'solid' : 'clear'}
                  onClick={() => setAppearance('light')}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 'auto',
                    '--border-radius': '10px',
                    '--padding-start': '12px',
                    '--padding-end': '12px',
                    '--padding-top': '10px',
                    '--padding-bottom': '10px',
                    flex: 1,
                    '--background': appearance === 'light' 
                      ? 'var(--ion-color-primary)' 
                      : 'var(--ion-color-step-100, rgba(0,0,0,0.05))',
                    '--color': appearance === 'light' ? '#ffffff' : 'var(--ion-text-color)',
                  }}
                >
                  <IonIcon 
                    icon={sunny} 
                    style={{ fontSize: '18px' }} 
                  />
                  <span style={{ fontSize: '10px', marginTop: '2px' }}>Light</span>
                </IonButton>

                {/* Dark Option */}
                <IonButton
                  fill={appearance === 'dark' ? 'solid' : 'clear'}
                  onClick={() => setAppearance('dark')}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 'auto',
                    '--border-radius': '10px',
                    '--padding-start': '12px',
                    '--padding-end': '12px',
                    '--padding-top': '10px',
                    '--padding-bottom': '10px',
                    flex: 1,
                    '--background': appearance === 'dark' 
                      ? 'var(--ion-color-primary)' 
                      : 'var(--ion-color-step-100, rgba(0,0,0,0.05))',
                    '--color': appearance === 'dark' ? '#ffffff' : 'var(--ion-text-color)',
                  }}
                >
                  <IonIcon 
                    icon={moon} 
                    style={{ fontSize: '18px' }} 
                  />
                  <span style={{ fontSize: '10px', marginTop: '2px' }}>Dark</span>
                </IonButton>
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              fontSize: '0.9em',
              fontWeight: '600',
              color: 'var(--ion-color-primary)',
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              Notifications
            </h3>

            <div
              style={{
                borderRadius: '16px',
                border: '1px solid var(--ion-color-step-300)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                background: 'var(--ion-background-color, #ffffff)'
              }}
            >
              {/* Push Notifications */}
              <IonItem
                style={{
                  '--border-radius': '16px'
                }}
                lines="none"
              >
                <IonIcon icon={notifications} slot="start" style={{ color: 'var(--ion-color-primary)' }} />
                <IonLabel>Push Notifications</IonLabel>
                <IonToggle
                  checked={pushNotifications}
                  onIonChange={(e) => setPushNotifications(e.detail.checked)}
                  slot="end"
                />
              </IonItem>
            </div>
          </div>

          {/* Storage Section */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              fontSize: '0.9em',
              fontWeight: '600',
              color: 'var(--ion-color-primary)',
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              Storage
            </h3>

            <div
              style={{
                borderRadius: '16px',
                border: '1px solid var(--ion-color-step-300)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                background: 'var(--ion-background-color, #ffffff)'
              }}
            >
              {/* Clear Cache */}
              <IonItem
                style={{
                  '--border-radius': '16px',
                  cursor: 'pointer'
                }}
                lines="none"
                button
                onClick={() => setShowClearCacheAlert(true)}
              >
                <IonIcon icon={trash} slot="start" style={{ color: 'var(--ion-color-danger)' }} />
                <IonLabel style={{ color: 'var(--ion-color-danger)' }}>Clear Cache</IonLabel>
              </IonItem>
            </div>
          </div>

          {/* About Section */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              fontSize: '0.9em',
              fontWeight: '600',
              color: 'var(--ion-color-primary)',
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              About
            </h3>

            <div
              style={{
                borderRadius: '16px',
                border: '1px solid var(--ion-color-step-300)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                background: 'var(--ion-background-color, #ffffff)'
              }}
            >
              {/* App Version */}
              <IonItem
                style={{
                  '--border-radius': '16px'
                }}
                lines="none"
              >
                <IonIcon icon={informationCircleOutline} slot="start" style={{ color: 'var(--ion-color-primary)' }} />
                <IonLabel>App Version</IonLabel>
                <span slot="end" style={{ opacity: 0.7 }}>1.0.0</span>
              </IonItem>

              {/* Privacy Policy */}
              <IonItem
                style={{
                  '--border-radius': '16px'
                }}
                lines="none"
                button
              >
                <IonIcon icon={shieldCheckmark} slot="start" style={{ color: 'var(--ion-color-primary)' }} />
                <IonLabel>Privacy Policy</IonLabel>
              </IonItem>

              {/* Terms of Service */}
              <IonItem
                style={{
                  '--border-radius': '16px'
                }}
                lines="none"
                button
              >
                <IonIcon icon={documentText} slot="start" style={{ color: 'var(--ion-color-primary)' }} />
                <IonLabel>Terms of Service</IonLabel>
              </IonItem>
            </div>
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <p style={{
              color: 'var(--ion-text-color)',
              opacity: 0.6,
              fontSize: '0.8em',
              margin: '0'
            }}>
              Dove Church
            </p>
          </div>
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
    </IonPage>
  );
};

export default Settings;
