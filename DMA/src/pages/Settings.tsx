import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonIcon,
  IonToggle,
  IonSelect,
  IonSelectOption,
  IonItem,
  IonLabel,
} from "@ionic/react";

import {
  moon,
  language,
  informationCircle,
  settingsSharp,
  heart,
  arrowBack,
} from "ionicons/icons";

import { useSettings } from '../contexts/SettingsContext';
import { useHistory } from 'react-router-dom';

const Settings: React.FC = () => {
  const history = useHistory();
  const { language, darkMode, setLanguage, setDarkMode } = useSettings();
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

          {/* Essential Settings */}
          <div style={{ marginBottom: '32px' }}>
            {/* Language Selection */}
            <IonItem
              style={{
                marginBottom: '16px',
                borderRadius: '12px',
                border: '1px solid var(--ion-color-step-300)',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                '--border-radius': '12px'
              }}
              lines="none"
            >
              <IonIcon icon={language} slot="start" style={{ color: 'var(--ion-color-primary)' }} />
              <IonLabel>Language</IonLabel>
              <IonSelect
                placeholder="Select language"
                value={language}
                onIonChange={(e) => setLanguage(e.detail.value)}
              >
                <IonSelectOption value="en">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🇺🇸 English
                  </div>
                </IonSelectOption>
                <IonSelectOption value="sw">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🇰🇪 Swahili
                  </div>
                </IonSelectOption>
                <IonSelectOption value="lg">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🇺🇬 Luganda
                  </div>
                </IonSelectOption>
              </IonSelect>
            </IonItem>

            {/* Dark Mode Toggle */}
            <IonItem
              style={{
                marginBottom: '16px',
                borderRadius: '12px',
                border: '1px solid var(--ion-color-step-300)',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                '--border-radius': '12px'
              }}
              lines="none"
            >
              <IonIcon icon={moon} slot="start" style={{ color: 'var(--ion-color-primary)' }} />
              <IonLabel>Dark Mode</IonLabel>
              <IonToggle
                slot="end"
                checked={darkMode}
                onIonChange={(e) => setDarkMode(e.detail.checked)}
              />
            </IonItem>

          </div>


          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <p style={{
              color: 'var(--ion-text-color)',
              opacity: 0.6,
              fontSize: '0.8em',
              margin: '0'
            }}>
              Dove Ministries Africa
            </p>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Settings;
