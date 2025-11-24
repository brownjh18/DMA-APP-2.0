import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardContent, IonItem, IonLabel, IonInput, IonTextarea, IonButton, IonCheckbox, IonText, IonButtons, IonBackButton, IonAlert, IonIcon, IonModal, IonBadge } from '@ionic/react';
import { heart, mail, person, lockClosed, globe, time, informationCircle, checkmarkCircle, closeCircle, calendar } from 'ionicons/icons';
import { useState } from 'react';
import apiService from '../services/api';
import './PrayerRequest.css';

const PrayerRequest: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [request, setRequest] = useState('');
  const [confidential, setConfidential] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState<any>(null);
  const [myRequests, setMyRequests] = useState<any[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.submitPrayerRequest({
        name,
        email,
        request,
        isConfidential: confidential,
        category: 'personal' // Default category
      });

      // Store submitted request data for modal
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
      setMyRequests(prev => [newRequest, ...prev]);
      setShowModal(true);

      // Reset form
      setName('');
      setEmail('');
      setRequest('');
      setConfidential(false);
    } catch (error) {
      console.error('Error submitting prayer request:', error);
      // You could show an error alert here
    }
  };

  const handleViewDetails = () => {
    // Load mock previous requests for demo
    const mockPreviousRequests = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        request: 'Please pray for healing for my grandmother who is in the hospital.',
        confidential: false,
        submittedAt: '2025-11-15T10:30:00Z',
        status: 'answered'
      },
      {
        id: '2',
        name: 'John Doe',
        email: 'john@example.com',
        request: 'Thank you for praying for my job interview. I got the position!',
        confidential: false,
        submittedAt: '2025-11-10T14:20:00Z',
        status: 'answered'
      }
    ];
    setMyRequests(prev => [...mockPreviousRequests, ...prev]);
    setShowDetailsModal(true);
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tab1" />
          </IonButtons>
          <IonTitle className="title-ios">Prayer Request</IonTitle>
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
              Submit your prayer request to our dedicated team
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
              Submit Prayer Request
            </IonButton>

            {/* View Details Button */}
            <IonButton
              expand="block"
              fill="outline"
              onClick={handleViewDetails}
              style={{
                height: '44px',
                borderRadius: '8px',
                fontWeight: '600',
                marginTop: '12px',
                '--border-radius': '8px'
              }}
            >
              <IonIcon icon={time} slot="start" />
              View My Prayer Requests
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

        {/* View Details Modal - Redesigned like Admin Prayer Request Details */}
        {showDetailsModal && (
          <>
            {/* INLINE CSS */}
            <style>{`
              .prayer-sidebar-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0);
                z-index: 9998;
                opacity: 1;
                visibility: visible;
                transition: all 0.3s ease-in-out;
              }

              .prayer-floating-sidebar {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) scale(0.8);
                width: 85%;
                max-width: 400px;
                max-height: 50vh;
                padding: 20px;
                border-radius: 24px;
                border: 1px solid var(--ion-color-medium);
                backdrop-filter: blur(22px);
                -webkit-backdrop-filter: blur(22px);
                background: rgba(var(--ion-background-color-rgb), 0.9);
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                z-index: 9999;
                transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                display: flex;
                flex-direction: column;
                overflow: hidden;
              }

              .prayer-floating-sidebar.open {
                transform: translate(-50%, -50%) scale(1);
              }

              .prayer-close-button {
                position: absolute;
                top: 12px;
                right: 12px;
                background: rgba(var(--ion-background-color-rgb), 0.3);
                border: 1px solid var(--ion-color-step-200);
                border-radius: 50%;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: 0.2s ease-in-out;
                z-index: 10000;
              }

              .prayer-close-button:hover {
                background: rgba(var(--ion-background-color-rgb), 0.5);
                transform: scale(1.1);
              }

              .prayer-close-button ion-icon {
                font-size: 18px;
              }

              .prayer-content {
                margin-top: 40px;
                display: flex;
                flex-direction: column;
                gap: 16px;
                flex: 1;
                overflow-y: auto;
                padding-right: 4px;
              }

              .prayer-content::-webkit-scrollbar {
                width: 4px;
              }

              .prayer-content::-webkit-scrollbar-track {
                background: rgba(var(--ion-background-color-rgb), 0.1);
                border-radius: 2px;
              }

              .prayer-content::-webkit-scrollbar-thumb {
                background: var(--ion-color-step-400);
                border-radius: 2px;
              }

              .prayer-content::-webkit-scrollbar-thumb:hover {
                background: var(--ion-color-step-500);
              }

              .prayer-info-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px 14px;
                border-radius: 16px;
                background: rgba(var(--ion-background-color-rgb), 0.3);
                border: 1px solid var(--ion-color-step-200);
              }

              .prayer-info-item ion-icon {
                font-size: 20px;
                color: var(--ion-color-primary);
              }

              .prayer-request-section {
                padding: 16px;
                border-radius: 16px;
                background: rgba(var(--ion-background-color-rgb), 0.4);
                border: 1px solid var(--ion-color-step-150);
              }

              .prayer-status-badge {
                display: inline-flex;
                align-items: center;
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 0.85em;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }

              .prayer-status-pending {
                background: rgba(245, 158, 11, 0.1);
                color: #f59e0b;
                border: 1px solid rgba(245, 158, 11, 0.2);
              }

              .prayer-status-answered {
                background: rgba(16, 185, 129, 0.1);
                color: #10b981;
                border: 1px solid rgba(16, 185, 129, 0.2);
              }

              @media (max-width: 576px) {
                .prayer-floating-sidebar {
                  width: 95%;
                  max-width: 360px;
                  max-height: 70vh;
                  padding: 16px;
                }
              }

              @media (prefers-color-scheme: dark) {
                .prayer-floating-sidebar {
                  border-color: rgba(255,255,255,0.18);
                  box-shadow: 0 8px 25px rgba(0,0,0,0.4);
                }
                .prayer-info-item,
                .prayer-request-section {
                  border-color: rgba(255,255,255,0.18);
                }
              }
            `}</style>

            {/* SIDEBAR OVERLAY */}
            <div className="prayer-sidebar-overlay" onClick={() => setShowDetailsModal(false)}></div>

            {/* SIDEBAR CONTENT */}
            <div className={`prayer-floating-sidebar ${showDetailsModal ? 'open' : ''}`}>
              {/* Close Button */}
              <div className="prayer-close-button" onClick={() => setShowDetailsModal(false)}>
                <IonIcon icon={closeCircle} />
              </div>

              {/* Content */}
              <div className="prayer-content">
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                  <h2 style={{ margin: '0', color: 'var(--ion-text-color)', fontSize: '1.3em', fontWeight: '700' }}>
                    My Prayer Requests
                  </h2>
                  <p style={{ margin: '0', color: 'var(--ion-color-medium)', fontSize: '0.9em' }}>
                    Your prayer journey with us
                  </p>
                </div>

                {myRequests.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {myRequests.map((req, index) => (
                      <div key={req.id || index}>
                        {/* Status Badge */}
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                          <div className={`prayer-status-badge ${req.status === 'answered' ? 'prayer-status-answered' : 'prayer-status-pending'}`}>
                            {req.status}
                          </div>
                        </div>

                        {/* Request Details */}
                        <div className="prayer-info-item">
                          <IonIcon icon={person} />
                          <div>
                            <div style={{ fontWeight: '600', color: 'var(--ion-text-color)' }}>{req.name}</div>
                            <div style={{ fontSize: '0.85em', color: 'var(--ion-color-medium)' }}>{req.email}</div>
                          </div>
                        </div>

                        <div className="prayer-info-item">
                          <IonIcon icon={calendar} />
                          <div style={{ color: 'var(--ion-text-color)' }}>
                            Submitted: {new Date(req.submittedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>

                        {/* Prayer Request */}
                        <div className="prayer-request-section">
                          <h3 style={{ margin: '0 0 12px 0', color: 'var(--ion-text-color)', fontSize: '1.1em' }}>
                            Prayer Request #{myRequests.length - index}
                          </h3>
                          <p style={{ margin: '0', color: 'var(--ion-text-color)', lineHeight: '1.5', fontSize: '0.95em' }}>
                            {req.request}
                          </p>
                        </div>

                        {/* Confidential Badge */}
                        {req.confidential && (
                          <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <IonBadge color="medium" style={{ fontSize: '0.8em', padding: '6px 12px' }}>
                              <IonIcon icon={lockClosed} style={{ marginRight: '4px' }} />
                              Confidential
                            </IonBadge>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <IonIcon
                      icon={heart}
                      style={{
                        fontSize: '3em',
                        color: 'var(--ion-color-medium)',
                        marginBottom: '16px',
                        opacity: 0.5
                      }}
                    />
                    <p style={{
                      margin: '0',
                      color: 'var(--ion-color-medium)',
                      fontSize: '1em'
                    }}>
                      No prayer requests submitted yet
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default PrayerRequest;