import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardContent, IonIcon, IonButton, IonText, IonRefresher, IonRefresherContent } from '@ionic/react';
import { call, mail, location, time, people, heart, book, radio, calendar, cash, chatbubble, camera, informationCircle, chevronBack, arrowBack } from 'ionicons/icons';
import './Tab5.css';

const Tab5: React.FC = () => {
  const [contactInfo, setContactInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const history = useHistory();

  useEffect(() => {
    loadContactInfo();
    const userData = JSON.parse(localStorage.getItem('user') || 'null');
    setUser(userData);
  }, []);

  const loadContactInfo = async () => {
    try {
      const response = await fetch('/api/contacts');
      if (response.ok) {
        const data = await response.json();
        console.log('Contact data loaded:', data);
        setContactInfo(data);
      } else {
        console.error('Failed to load contact info', response.status);
      }
    } catch (error) {
      console.error('Error loading contact info:', error);
    }
    setLoading(false);
  };

  const handleRefresh = async (event: CustomEvent) => {
    await loadContactInfo();
    event.detail.complete();
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <IonTitle className="title-ios">About & Contact</IonTitle>
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
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>
        <div style={{
          padding: '20px',
          maxWidth: '400px',
          margin: '0 auto',
          paddingTop: '20px'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <IonIcon
              icon={informationCircle}
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
              About {contactInfo?.churchName || 'Dove Ministries'}
            </h1>
            <p style={{
              margin: '0',
              color: 'var(--ion-text-color)',
              opacity: 0.7,
              fontSize: '1em'
            }}>
              Transforming lives through faith and community
            </p>
          </div>

          {/* Our Story */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{
              margin: '0 0 16px 0',
              fontSize: '1.4em',
              fontWeight: '600',
              color: 'var(--ion-text-color)'
            }}>
              Our Story
            </h2>
            <div style={{
              backgroundColor: 'rgba(0,0,0,0.05)',
              padding: '20px',
              borderRadius: '12px'
            }}>
              <p style={{
                margin: '0',
                color: 'var(--ion-text-color)',
                lineHeight: '1.5',
                fontSize: '0.9em'
              }}>
                {contactInfo?.about || 'Transforming lives through faith, community, and service across Africa. Founded in 2005 by Pastor Daniel and Erica Kaggwa.'}
              </p>
            </div>
          </div>

          {/* Our Mission */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{
              margin: '0 0 16px 0',
              fontSize: '1.4em',
              fontWeight: '600',
              color: 'var(--ion-text-color)'
            }}>
              Our Mission
            </h2>
            <div style={{
              backgroundColor: 'rgba(0,0,0,0.05)',
              padding: '20px',
              borderRadius: '12px'
            }}>
              <p style={{
                margin: '0',
                color: 'var(--ion-text-color)',
                lineHeight: '1.5',
                fontSize: '0.9em'
              }}>
                {contactInfo?.mission || 'To take the gospel of Jesus Christ to the lost and assimilate them into a church community where they may grow spiritually.'}
              </p>
            </div>
          </div>

          {/* Meet Our Founders */}
          {contactInfo?.founders && contactInfo.founders.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{
                margin: '0 0 16px 0',
                fontSize: '1.4em',
                fontWeight: '600',
                color: 'var(--ion-text-color)'
              }}>
                Meet Our Leaders
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {contactInfo.founders.map((founder: any, index: number) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    backgroundColor: 'rgba(0,0,0,0.05)',
                    padding: '16px',
                    borderRadius: '16px',
                    border: '1px solid rgba(0,0,0,0.1)'
                  }}>
                    <img src={founder.imageUrl || '/default-avatar.png'} alt={founder.name} style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '12px',
                      objectFit: 'cover',
                      border: '3px solid var(--ion-color-primary)'
                    }} />
                    <div>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2em', fontWeight: '600', color: 'var(--ion-text-color)' }}>{founder.name}</h3>
                      <p style={{ margin: '0', color: 'var(--ion-color-medium)', fontSize: '0.9em' }}>{founder.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{
              margin: '0 0 16px 0',
              fontSize: '1.4em',
              fontWeight: '600',
              color: 'var(--ion-text-color)'
            }}>
              Get In Touch
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Phone */}
              <div style={{
                backgroundColor: 'rgba(0,0,0,0.05)',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <IonIcon icon={call} style={{ color: '#10b981', fontSize: '1.5em' }} />
                  <span style={{ fontWeight: '600', color: 'var(--ion-text-color)' }}>Call Us</span>
                </div>
                  <p style={{ margin: '0', color: 'var(--ion-color-medium)', fontSize: '0.9em' }}>{contactInfo?.phone || '+256 772824677'}</p>
              </div>

              {/* Email */}
              <div style={{
                backgroundColor: 'rgba(0,0,0,0.05)',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <IonIcon icon={mail} style={{ color: '#f59e0b', fontSize: '1.5em' }} />
                  <span style={{ fontWeight: '600', color: 'var(--ion-text-color)' }}>Email Us</span>
                </div>
                <p style={{ margin: '0', color: 'var(--ion-color-medium)', fontSize: '0.9em' }}>{contactInfo?.email || 'thesignofthedove ministries@gmail.com'}</p>
              </div>

              {/* Location */}
              <div style={{
                backgroundColor: 'rgba(0,0,0,0.05)',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <IonIcon icon={location} style={{ color: '#8b5cf6', fontSize: '1.5em' }} />
                  <span style={{ fontWeight: '600', color: 'var(--ion-text-color)' }}>Visit Us</span>
                </div>
                <p style={{ margin: '0', color: 'var(--ion-color-medium)', fontSize: '0.9em', whiteSpace: 'pre-line' }}>{contactInfo?.address || 'Nfuufu Zone\nZzana-Bunamwaya, Kampala'}</p>
              </div>

              {/* Hours */}
              <div style={{
                backgroundColor: 'rgba(0,0,0,0.05)',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <IonIcon icon={time} style={{ color: '#06b6d4', fontSize: '1.5em' }} />
                  <span style={{ fontWeight: '600', color: 'var(--ion-text-color)' }}>Office Hours</span>
                </div>
                <div style={{ fontSize: '0.9em', color: 'var(--ion-color-medium)', whiteSpace: 'pre-line' }}>
                  {contactInfo?.serviceTimes || 'Mon-Fri: 9AM-5PM\nSat: 10AM-2PM'}
                </div>
              </div>
            </div>
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

export default Tab5;