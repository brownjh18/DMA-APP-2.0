import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
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
  notifications,
  language,
  volumeHigh,
  download,
  person,
  shield,
  helpCircle,
  informationCircle,
  settingsSharp,
  heart,
} from "ionicons/icons";

const Settings: React.FC = () => {
  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/profile" />
          </IonButtons>
          <IonTitle className="title-ios">Settings</IonTitle>
        </IonToolbar>
      </IonHeader>

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

          {/* Settings Form */}
          <form style={{ marginBottom: '32px' }}>
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
              <IonSelect placeholder="Select language" value="en">
                <IonSelectOption value="en">English</IonSelectOption>
                <IonSelectOption value="sw">Swahili</IonSelectOption>
                <IonSelectOption value="lg">Luganda</IonSelectOption>
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
              <IonToggle slot="end" />
            </IonItem>

            {/* Notifications Toggle */}
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
              <IonIcon icon={notifications} slot="start" style={{ color: 'var(--ion-color-primary)' }} />
              <IonLabel>Push Notifications</IonLabel>
              <IonToggle slot="end" checked />
            </IonItem>

            {/* Auto Download Toggle */}
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
              <IonIcon icon={download} slot="start" style={{ color: 'var(--ion-color-primary)' }} />
              <IonLabel>Auto Download Sermons</IonLabel>
              <IonToggle slot="end" />
            </IonItem>

            {/* High Quality Audio Toggle */}
            <IonItem
              style={{
                marginBottom: '24px',
                borderRadius: '12px',
                border: '1px solid var(--ion-color-step-300)',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                '--border-radius': '12px'
              }}
              lines="none"
            >
              <IonIcon icon={volumeHigh} slot="start" style={{ color: 'var(--ion-color-primary)' }} />
              <IonLabel>High Quality Audio</IonLabel>
              <IonToggle slot="end" checked />
            </IonItem>
          </form>

          {/* Help Center */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{
              margin: '0 0 16px 0',
              fontSize: '1.4em',
              fontWeight: '600',
              color: 'var(--ion-text-color)'
            }}>
              Help Center
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Get Help & Support */}
              <div style={{
                borderRadius: '12px',
                border: '1px solid var(--ion-color-step-300)',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden',
                cursor: 'pointer'
              }}>
                <div
                  onClick={() => {}}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '16px'
                  }}
                >
                  <div style={{
                    backgroundColor: '#10b981',
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <IonIcon icon={helpCircle} style={{ color: 'white', fontSize: '1.4em' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{
                      margin: '0 0 6px 0',
                      fontSize: '1.1em',
                      fontWeight: '600',
                      color: 'var(--ion-text-color)'
                    }}>
                      Get Help & Support
                    </p>
                    <p style={{
                      margin: '0',
                      fontSize: '0.9em',
                      color: 'var(--ion-color-medium)'
                    }}>
                      Find answers to common questions and get support
                    </p>
                  </div>
                  <IonIcon icon={settingsSharp} style={{
                    color: 'var(--ion-color-medium)',
                    fontSize: '1.4em'
                  }} />
                </div>
              </div>

              {/* Troubleshooting */}
              <div style={{
                borderRadius: '12px',
                border: '1px solid var(--ion-color-step-300)',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden',
                cursor: 'pointer'
              }}>
                <div
                  onClick={() => {}}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '16px'
                  }}
                >
                  <div style={{
                    backgroundColor: '#f59e0b',
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <IonIcon icon={settingsSharp} style={{ color: 'white', fontSize: '1.4em' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{
                      margin: '0 0 6px 0',
                      fontSize: '1.1em',
                      fontWeight: '600',
                      color: 'var(--ion-text-color)'
                    }}>
                      Troubleshooting
                    </p>
                    <p style={{
                      margin: '0',
                      fontSize: '0.9em',
                      color: 'var(--ion-color-medium)'
                    }}>
                      Fix common issues and technical problems
                    </p>
                  </div>
                  <IonIcon icon={settingsSharp} style={{
                    color: 'var(--ion-color-medium)',
                    fontSize: '1.4em'
                  }} />
                </div>
              </div>

              {/* Contact Support */}
              <div style={{
                borderRadius: '12px',
                border: '1px solid var(--ion-color-step-300)',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden',
                cursor: 'pointer'
              }}>
                <div
                  onClick={() => {}}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '16px'
                  }}
                >
                  <div style={{
                    backgroundColor: '#3b82f6',
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <IonIcon icon={informationCircle} style={{ color: 'white', fontSize: '1.4em' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{
                      margin: '0 0 6px 0',
                      fontSize: '1.1em',
                      fontWeight: '600',
                      color: 'var(--ion-text-color)'
                    }}>
                      Contact Support
                    </p>
                    <p style={{
                      margin: '0',
                      fontSize: '0.9em',
                      color: 'var(--ion-color-medium)'
                    }}>
                      Reach out to our support team for assistance
                    </p>
                  </div>
                  <IonIcon icon={settingsSharp} style={{
                    color: 'var(--ion-color-medium)',
                    fontSize: '1.4em'
                  }} />
                </div>
              </div>
            </div>
          </div>

          {/* About */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{
              margin: '0 0 16px 0',
              fontSize: '1.4em',
              fontWeight: '600',
              color: 'var(--ion-text-color)'
            }}>
              About
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* App Information */}
              <div style={{
                borderRadius: '12px',
                border: '1px solid var(--ion-color-step-300)',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px'
                }}>
                  <div style={{
                    backgroundColor: '#8b5cf6',
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <IonIcon icon={informationCircle} style={{ color: 'white', fontSize: '1.4em' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{
                      margin: '0 0 6px 0',
                      fontSize: '1.1em',
                      fontWeight: '600',
                      color: 'var(--ion-text-color)'
                    }}>
                      Dove Ministries Africa
                    </p>
                    <p style={{
                      margin: '0 0 8px 0',
                      fontSize: '0.9em',
                      color: 'var(--ion-color-medium)'
                    }}>
                      App Information and Version
                    </p>
                    <div style={{
                      backgroundColor: 'rgba(0,0,0,0.08)',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      border: '1px solid rgba(0,0,0,0.15)'
                    }}>
                      <p style={{
                        margin: '0 0 4px 0',
                        fontSize: '0.9em',
                        color: 'var(--ion-text-color)',
                        fontWeight: '500'
                      }}>
                        Version 1.0.0
                      </p>
                      <p style={{
                        margin: '0',
                        fontSize: '0.8em',
                        color: 'var(--ion-color-medium)'
                      }}>
                        Build 2025.11.19
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* What's New */}
              <div style={{
                borderRadius: '12px',
                border: '1px solid var(--ion-color-step-300)',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden',
                cursor: 'pointer'
              }}>
                <div
                  onClick={() => {}}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '16px'
                  }}
                >
                  <div style={{
                    backgroundColor: '#06b6d4',
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <IonIcon icon={settingsSharp} style={{ color: 'white', fontSize: '1.4em' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{
                      margin: '0 0 6px 0',
                      fontSize: '1.1em',
                      fontWeight: '600',
                      color: 'var(--ion-text-color)'
                    }}>
                      What's New
                    </p>
                    <p style={{
                      margin: '0',
                      fontSize: '0.9em',
                      color: 'var(--ion-color-medium)'
                    }}>
                      See the latest updates and features
                    </p>
                  </div>
                  <IonIcon icon={settingsSharp} style={{
                    color: 'var(--ion-color-medium)',
                    fontSize: '1.4em'
                  }} />
                </div>
              </div>

              {/* Rate & Review */}
              <div style={{
                borderRadius: '12px',
                border: '1px solid var(--ion-color-step-300)',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden',
                cursor: 'pointer'
              }}>
                <div
                  onClick={() => {}}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '16px'
                  }}
                >
                  <div style={{
                    backgroundColor: '#ec4899',
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <IonIcon icon={heart} style={{ color: 'white', fontSize: '1.4em' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{
                      margin: '0 0 6px 0',
                      fontSize: '1.1em',
                      fontWeight: '600',
                      color: 'var(--ion-text-color)'
                    }}>
                      Rate & Review
                    </p>
                    <p style={{
                      margin: '0',
                      fontSize: '0.9em',
                      color: 'var(--ion-color-medium)'
                    }}>
                      Share your feedback and help us improve
                    </p>
                  </div>
                  <IonIcon icon={settingsSharp} style={{
                    color: 'var(--ion-color-medium)',
                    fontSize: '1.4em'
                  }} />
                </div>
              </div>
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
              Dove Ministries Africa
            </p>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Settings;
