import React, { useState } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardContent, IonButtons, IonBackButton, IonIcon, IonButton, IonItem, IonLabel, IonInput, IonTextarea } from '@ionic/react';
import { cash, card, phonePortrait, location, heart, informationCircle } from 'ionicons/icons';
import './Giving.css';

const Giving: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    amount: '',
    message: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const givingOptions = [
    {
      method: 'Mobile Money',
      details: ['MTN Mobile Money: +256 772824677', 'Airtel Money: +256 700116734'],
      icon: phonePortrait,
      color: '#ef4444'
    },
    {
      method: 'Bank Transfer',
      details: ['Account Name: Dove Ministries Africa', 'Bank: Centenary Bank', 'Account: 1234567890'],
      icon: card,
      color: '#3b82f6'
    },
    {
      method: 'In-Person Giving',
      details: ['During Sunday Services', 'Special Events', 'Church Office Visits'],
      icon: location,
      color: '#10b981'
    }
  ];

  const givingCategories = [
    { name: 'Tithes & Offerings', icon: heart, color: '#ef4444' },
    { name: 'Building Fund', icon: location, color: '#f59e0b' },
    { name: 'Missions & Evangelism', icon: phonePortrait, color: '#8b5cf6' },
    { name: 'Children & Youth', icon: heart, color: '#06b6d4' },
    { name: 'Community Development', icon: card, color: '#10b981' },
    { name: 'Special Projects', icon: cash, color: '#ec4899' }
  ];

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tab1" />
          </IonButtons>
          <IonTitle className="title-ios">Giving</IonTitle>
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
              Give with Joy
            </h1>
            <p style={{
              margin: '0',
              color: 'var(--ion-text-color)',
              opacity: 0.7,
              fontSize: '1em'
            }}>
              Your generosity transforms lives across Africa
            </p>
          </div>

          {/* Introduction */}
          <div style={{
            backgroundColor: 'rgba(0,0,0,0.05)',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '32px'
          }}>
            <p style={{
              margin: '0 0 16px 0',
              color: 'var(--ion-text-color)',
              lineHeight: '1.5'
            }}>
              Your generosity transforms lives and spreads God's love across Africa.
              Every contribution makes a difference in our community.
            </p>
            <p style={{
              margin: '0',
              fontSize: '0.9em',
              fontStyle: 'italic',
              textAlign: 'center',
              color: 'var(--ion-color-medium)'
            }}>
              "Each of you should give what you have decided in your heart to give..."
              <br />
              <span style={{ fontSize: '0.8em' }}>- 2 Corinthians 9:7</span>
            </p>
          </div>

          {/* Giving Form */}
          <form style={{ marginBottom: '32px' }}>
            <h2 style={{
              margin: '0 0 16px 0',
              fontSize: '1.4em',
              fontWeight: '600',
              color: 'var(--ion-text-color)'
            }}>
              Make a Donation
            </h2>

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
              <IonIcon icon={heart} slot="start" style={{ color: 'var(--ion-color-primary)' }} />
              <IonInput
                type="text"
                value={formData.name}
                onIonChange={(e) => handleInputChange('name', e.detail.value!)}
                placeholder="Your full name"
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
              <IonIcon icon={informationCircle} slot="start" style={{ color: 'var(--ion-color-primary)' }} />
              <IonInput
                type="email"
                value={formData.email}
                onIonChange={(e) => handleInputChange('email', e.detail.value!)}
                placeholder="Your email address"
                style={{ color: 'var(--ion-text-color)' }}
              />
            </IonItem>

            {/* Amount Input */}
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
              <IonIcon icon={cash} slot="start" style={{ color: 'var(--ion-color-primary)' }} />
              <IonInput
                type="number"
                value={formData.amount}
                onIonChange={(e) => handleInputChange('amount', e.detail.value!)}
                placeholder="Donation amount (optional)"
                style={{ color: 'var(--ion-text-color)' }}
              />
            </IonItem>

            {/* Message Input */}
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
              <IonIcon icon={heart} slot="start" style={{ color: 'var(--ion-color-primary)' }} />
              <IonTextarea
                value={formData.message}
                onIonChange={(e) => handleInputChange('message', e.detail.value!)}
                placeholder="Leave a message or prayer request (optional)"
                rows={3}
                style={{ color: 'var(--ion-text-color)' }}
              />
            </IonItem>

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
              Submit Donation
            </IonButton>
          </form>

          {/* Ways to Give */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{
              margin: '0 0 16px 0',
              fontSize: '1.4em',
              fontWeight: '600',
              color: 'var(--ion-text-color)'
            }}>
              Ways to Give
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {givingOptions.map((option, index) => (
                <div key={index} style={{
                  backgroundColor: 'rgba(0,0,0,0.05)',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(0,0,0,0.1)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <IonIcon icon={option.icon} style={{ color: option.color, fontSize: '1.5em' }} />
                    <span style={{ fontWeight: '600', color: 'var(--ion-text-color)' }}>{option.method}</span>
                  </div>
                  {option.details.map((detail, i) => (
                    <p key={i} style={{
                      margin: '0',
                      color: 'var(--ion-color-medium)',
                      fontSize: '0.9em',
                      lineHeight: '1.4'
                    }}>
                      {detail}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </div>


          {/* Contact Information */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{
              margin: '0 0 16px 0',
              fontSize: '1.4em',
              fontWeight: '600',
              color: 'var(--ion-text-color)'
            }}>
              Questions About Giving?
            </h2>

            <div style={{
              backgroundColor: 'rgba(0,0,0,0.05)',
              padding: '20px',
              borderRadius: '12px'
            }}>
              <p style={{
                margin: '0 0 20px 0',
                color: 'var(--ion-text-color)',
                lineHeight: '1.5',
                fontSize: '0.9em'
              }}>
                Contact us for giving questions or special opportunities.
              </p>

              {/* Email Contact */}
              <IonItem
                style={{
                  marginBottom: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--ion-color-step-300)',
                  '--border-radius': '8px'
                }}
                lines="none"
              >
                <IonIcon icon={informationCircle} slot="start" style={{ color: 'var(--ion-color-primary)' }} />
                <IonLabel>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '0.9em' }}>Email</h3>
                  <p style={{ margin: 0, fontSize: '0.8em', color: 'var(--ion-color-medium)' }}>
                    thesignofthedoveministries@gmail.com
                  </p>
                </IonLabel>
              </IonItem>

              {/* Phone Contact */}
              <IonItem
                style={{
                  marginBottom: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--ion-color-step-300)',
                  '--border-radius': '8px'
                }}
                lines="none"
              >
                <IonIcon icon={phonePortrait} slot="start" style={{ color: 'var(--ion-color-primary)' }} />
                <IonLabel>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '0.9em' }}>Phone</h3>
                  <p style={{ margin: 0, fontSize: '0.8em', color: 'var(--ion-color-medium)' }}>
                    +256 772824677 | +256 700116734
                  </p>
                </IonLabel>
              </IonItem>

              {/* Address Contact */}
              <IonItem
                style={{
                  marginBottom: '20px',
                  borderRadius: '8px',
                  border: '1px solid var(--ion-color-step-300)',
                  '--border-radius': '8px'
                }}
                lines="none"
              >
                <IonIcon icon={location} slot="start" style={{ color: 'var(--ion-color-primary)' }} />
                <IonLabel>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '0.9em' }}>Address</h3>
                  <p style={{ margin: 0, fontSize: '0.8em', color: 'var(--ion-color-medium)' }}>
                    Nfuufu Zone, Zzana-Bunamwaya, Kampala, Uganda
                  </p>
                </IonLabel>
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
              Dove Ministries Africa
            </p>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Giving;