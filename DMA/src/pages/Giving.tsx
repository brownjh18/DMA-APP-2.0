import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardContent, IonIcon, IonButton, IonItem, IonLabel, IonInput, IonTextarea } from '@ionic/react';
import { cash, card, phonePortrait, location, heart, informationCircle, arrowBack } from 'ionicons/icons';
import './Giving.css';

const Giving: React.FC = () => {
  const history = useHistory();

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
    { name: 'Tithes', icon: heart, color: '#ef4444' },
    { name: 'Sunday Offertory', icon: location, color: '#f59e0b' },
    { name: 'Special Offertory', icon: phonePortrait, color: '#8b5cf6' },
    { name: 'Thanksgiving Offering', icon: heart, color: '#06b6d4' },
    { name: 'Building Fund', icon: card, color: '#10b981' },
    { name: 'Missions Support', icon: cash, color: '#ec4899' }
  ];

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          
          <IonTitle className="title-ios">Giving</IonTitle>
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
              Tithe & Offertory
            </h1>
            <p style={{
              margin: '0',
              color: 'var(--ion-text-color)',
              opacity: 0.7,
              fontSize: '1em'
            }}>
              Honor God with your tithes and offerings
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
              Honor God with your tithes and bring your offerings with joy.
              Your faithful giving supports the work of ministry across Africa.
            </p>
            <p style={{
              margin: '0',
              fontSize: '0.9em',
              fontStyle: 'italic',
              textAlign: 'center',
              color: 'var(--ion-color-medium)'
            }}>
              "Bring the whole tithe into the storehouse..."
              <br />
              <span style={{ fontSize: '0.8em' }}>- Malachi 3:10</span>
            </p>
          </div>

          {/* Tithe & Offertory Information */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{
              margin: '0 0 16px 0',
              fontSize: '1.4em',
              fontWeight: '600',
              color: 'var(--ion-text-color)'
            }}>
              Understanding Tithe & Offertory
            </h2>

            <div style={{
              backgroundColor: 'rgba(0,0,0,0.05)',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '16px'
            }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1em', color: 'var(--ion-text-color)' }}>Tithe</h3>
              <p style={{
                margin: '0 0 16px 0',
                color: 'var(--ion-text-color)',
                lineHeight: '1.5',
                fontSize: '0.9em'
              }}>
                The tithe is 10% of your income given to God as an act of worship and obedience.
                It is the first portion of your income that belongs to God.
              </p>
              <p style={{
                margin: '0',
                fontSize: '0.9em',
                fontStyle: 'italic',
                color: 'var(--ion-color-medium)'
              }}>
                "Honor the Lord with your wealth and with the firstfruits of all your produce."
                <br />
                <span style={{ fontSize: '0.8em' }}>- Proverbs 3:9</span>
              </p>
            </div>

            <div style={{
              backgroundColor: 'rgba(0,0,0,0.05)',
              padding: '20px',
              borderRadius: '12px'
            }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1em', color: 'var(--ion-text-color)' }}>Offertory</h3>
              <p style={{
                margin: '0 0 16px 0',
                color: 'var(--ion-text-color)',
                lineHeight: '1.5',
                fontSize: '0.9em'
              }}>
                Offerings are additional gifts given above the tithe, given freely from the heart
                as an expression of gratitude and generosity.
              </p>
              <p style={{
                margin: '0',
                fontSize: '0.9em',
                fontStyle: 'italic',
                color: 'var(--ion-color-medium)'
              }}>
                "Each of you should give what you have decided in your heart to give..."
                <br />
                <span style={{ fontSize: '0.8em' }}>- 2 Corinthians 9:7</span>
              </p>
            </div>
          </div>

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

          {/* Giving Categories */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{
              margin: '0 0 16px 0',
              fontSize: '1.4em',
              fontWeight: '600',
              color: 'var(--ion-text-color)'
            }}>
              Types of Giving
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {givingCategories.map((category, index) => (
                <div key={index} style={{
                  backgroundColor: 'rgba(0,0,0,0.05)',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(0,0,0,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <IonIcon icon={category.icon} style={{ color: category.color, fontSize: '1.5em' }} />
                  <span style={{ fontWeight: '600', color: 'var(--ion-text-color)' }}>{category.name}</span>
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