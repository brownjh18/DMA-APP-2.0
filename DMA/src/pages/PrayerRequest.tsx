import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardContent, IonItem, IonLabel, IonInput, IonTextarea, IonButton, IonCheckbox, IonText, IonAlert, IonIcon, IonModal, IonBadge } from '@ionic/react';
import { heart, mail, person, lockClosed, globe, time, informationCircle, checkmarkCircle, closeCircle, calendar, arrowBack } from 'ionicons/icons';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import apiService from '../services/api';
import './PrayerRequest.css';

const PrayerRequest: React.FC = () => {
  const history = useHistory();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [request, setRequest] = useState('');
  const [confidential, setConfidential] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Construct WhatsApp message
    const message = `*Prayer Request Submission*\n\n*Name:* ${name}\n*Email:* ${email}\n*Request:* ${request}\n*Confidential:* ${confidential ? 'Yes' : 'No'}\n*Submitted:* ${new Date().toLocaleString()}`;

    // Encode the message for URL
    const encodedMessage = encodeURIComponent(message);

    // WhatsApp URL
    const whatsappUrl = `https://wa.me/256760255970?text=${encodedMessage}`;

    // Open WhatsApp
    window.open(whatsappUrl, '_blank');

    // Store submitted request data for modal (for UI feedback)
    const newRequest = {
      id: Date.now().toString(),
      name,
      email,
      request,
      confidential,
      submittedAt: new Date().toISOString(),
      status: 'pending'
    };

    setSubmittedRequest(newRequest);
    setShowModal(true);

    // Reset form
    setName('');
    setEmail('');
    setRequest('');
    setConfidential(false);
  };


  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          
          <IonTitle className="title-ios">Prayer Request</IonTitle>
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
              icon={heart}
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
              Share Your Heart
            </h1>
            <p style={{
              margin: '0',
              color: 'var(--ion-text-color)',
              opacity: 0.7,
              fontSize: '1em'
            }}>
              Submit your prayer request via WhatsApp to our prayer team
            </p>
          </div>

          {/* Prayer Request Form */}
          <form onSubmit={handleSubmit}>
            {/* Name Input */}
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
              <IonIcon icon={person} slot="start" style={{ color: 'var(--ion-color-primary)' }} />
              <IonInput
                type="text"
                value={name}
                onIonChange={(e) => setName(e.detail.value!)}
                placeholder="Your full name"
                required
                style={{ color: 'var(--ion-text-color)' }}
              />
            </IonItem>

            {/* Email Input */}
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
              <IonIcon icon={mail} slot="start" style={{ color: 'var(--ion-color-primary)' }} />
              <IonInput
                type="email"
                value={email}
                onIonChange={(e) => setEmail(e.detail.value!)}
                placeholder="Your email address"
                required
                style={{ color: 'var(--ion-text-color)' }}
              />
            </IonItem>

            {/* Prayer Request Input */}
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
              <IonIcon icon={heart} slot="start" style={{ color: 'var(--ion-color-primary)' }} />
              <IonTextarea
                value={request}
                onIonChange={(e) => setRequest(e.detail.value!)}
                placeholder="Share what's on your heart..."
                rows={4}
                required
                style={{ color: 'var(--ion-text-color)' }}
              />
            </IonItem>

            {/* Confidentiality Checkbox */}
            <div style={{
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              padding: '12px',
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
              borderRadius: '12px'
            }}>
              <IonCheckbox
                checked={confidential}
                onIonChange={(e) => setConfidential(e.detail.checked)}
                style={{ marginRight: '12px' }}
              />
              <IonLabel style={{ margin: 0 }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1em' }}>Keep my request confidential</h3>
                <p style={{ margin: 0, fontSize: '0.9em', color: 'var(--ion-color-medium)' }}>Your privacy is important to us</p>
              </IonLabel>
            </div>

            {/* Submit Button */}
            <IonButton
              expand="block"
              type="submit"
              style={{
                height: '44px',
                borderRadius: '8px',
                fontWeight: '600',
                backgroundColor: 'var(--ion-color-primary)',
                '--border-radius': '8px'
              }}
            >
              <IonIcon icon={heart} slot="start" />
              Send via WhatsApp
            </IonButton>
          </form>

          {/* Scripture Quote */}
          <div style={{
            marginTop: '32px',
            textAlign: 'center',
            backgroundColor: 'rgba(0,0,0,0.05)',
            padding: '20px',
            borderRadius: '12px'
          }}>
            <p style={{
              margin: '0',
              fontSize: '0.9em',
              fontStyle: 'italic',
              color: 'var(--ion-color-medium)'
            }}>
              "Be anxious for nothing, but in everything by prayer and supplication,
              with thanksgiving, let your requests be made known to God."
              <br />
              <span style={{ fontSize: '0.8em' }}>- Philippians 4:6</span>
            </p>
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

        {/* Frosted Glass Success Modal */}
        <IonModal
          isOpen={showModal}
          onDidDismiss={() => setShowModal(false)}
          style={{
            '--border-radius': '24px',
            '--background': 'rgba(var(--ion-background-color-rgb), 0.8)',
            '--backdrop-filter': 'blur(20px)',
            '--webkit-backdrop-filter': 'blur(20px)',
            'border': '1px solid rgba(255, 255, 255, 0.2)',
            'boxShadow': '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}
        >
          <div style={{
            padding: '0',
            borderRadius: '24px',
            overflow: 'hidden',
            backgroundColor: 'rgba(var(--ion-background-color-rgb), 0.9)',
            backdropFilter: 'blur(10px)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '24px 24px 16px 24px',
              textAlign: 'center',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <IonIcon
                icon={checkmarkCircle}
                style={{
                  fontSize: '4em',
                  color: '#10b981',
                  marginBottom: '16px'
                }}
              />
              <h2 style={{
                margin: '0 0 8px 0',
                color: 'var(--ion-text-color)',
                fontSize: '1.5em',
                fontWeight: '700'
              }}>
                Prayer Request Submitted
              </h2>
              <p style={{
                margin: '0',
                color: 'var(--ion-color-medium)',
                fontSize: '1em'
              }}>
                Your heart has been heard
              </p>
            </div>

            {/* Modal Content */}
            <div style={{
              padding: '16px 24px 24px 24px',
              backgroundColor: 'rgba(var(--ion-background-color-rgb), 0.6)',
              backdropFilter: 'blur(5px)'
            }}>
              {submittedRequest && (
                <div>
                  <div style={{
                    backgroundColor: 'rgba(var(--ion-background-color-rgb), 0.8)',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid var(--ion-color-step-200)',
                    marginBottom: '16px',
                    backdropFilter: 'blur(5px)'
                  }}>
                    <h3 style={{
                      margin: '0 0 8px 0',
                      color: 'var(--ion-text-color)',
                      fontSize: '1.1em',
                      fontWeight: '600'
                    }}>
                      Your Request:
                    </h3>
                    <p style={{
                      margin: '0',
                      color: 'var(--ion-text-color)',
                      lineHeight: '1.5',
                      fontSize: '0.95em'
                    }}>
                      {submittedRequest.request}
                    </p>
                  </div>

                  <div style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    marginBottom: '20px'
                  }}>
                    <p style={{
                      margin: '0',
                      color: 'var(--ion-text-color)',
                      fontSize: '0.95em',
                      textAlign: 'center',
                      fontStyle: 'italic'
                    }}>
                      "Our prayer team will be standing with you in faith.
                      We believe in the power of prayer and trust in God's perfect timing."
                    </p>
                  </div>

                  <IonButton
                    expand="block"
                    onClick={() => setShowModal(false)}
                    style={{
                      '--border-radius': '20px',
                      'backgroundColor': 'var(--ion-color-primary)',
                      'fontWeight': '600',
                      'boxShadow': '0 4px 12px rgba(var(--ion-color-primary-rgb), 0.3)'
                    }}
                  >
                    <IonIcon icon={heart} slot="start" />
                    Amen
                  </IonButton>
                </div>
              )}
            </div>
          </div>
        </IonModal>

      </IonContent>
    </IonPage>
  );
};

export default PrayerRequest;