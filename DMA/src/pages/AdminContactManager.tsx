import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonText,
  IonRefresher,
  IonRefresherContent,
  IonImg,
  IonGrid,
  IonRow,
  IonCol
} from '@ionic/react';
import {
  create,
  save,
  informationCircle,
  call,
  mail,
  location,
  time,
  camera,
  trash,
  personAdd,
  arrowBack
} from 'ionicons/icons';

const AdminContactManager: React.FC = () => {
  const history = useHistory();
  const [contactInfo, setContactInfo] = useState({
    churchName: 'Dove Ministries Africa',
    address: '123 Faith Street, Kampala, Uganda',
    phone: '+256 123 456 789',
    email: 'info@doveministriesafrica.org',
    serviceTimes: 'Sundays: 8:00 AM & 10:30 AM\nWednesdays: 7:00 PM',
    about: 'Dove Ministries Africa is a vibrant church community dedicated to spreading God\'s love and serving our community through worship, fellowship, and outreach programs.',
    mission: 'To bring hope, healing, and transformation to lives through the power of God\'s love.',
    founders: [
      {
        name: 'Pastor Daniel Kaggwa',
        title: 'Co-Founder & Senior Pastor',
        imageUrl: '/pastor.jpg'
      },
      {
        name: 'Erica Kaggwa',
        title: 'Co-Founder & Ministry Leader',
        imageUrl: '/mommy-erica.jpg'
      }
    ]
  });
  const [contactId, setContactId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadContactInfo();
  }, []);

  const loadContactInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/contacts/admin', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.contacts && data.contacts.length > 0) {
          const contact = data.contacts[0];
          setContactId(contact._id);
          setContactInfo({
            churchName: contact.churchName,
            address: contact.address,
            phone: contact.phone,
            email: contact.email,
            serviceTimes: contact.serviceTimes,
            about: contact.about,
            mission: contact.mission,
            founders: contact.founders || [
              {
                name: 'Pastor Daniel Kaggwa',
                title: 'Co-Founder & Senior Pastor',
                imageUrl: '/pastor.jpg'
              },
              {
                name: 'Erica Kaggwa',
                title: 'Co-Founder & Ministry Leader',
                imageUrl: '/mommy-erica.jpg'
              }
            ]
          });
        }
      } else {
        console.error('Failed to load contact info');
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

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let response;

      if (contactId) {
        // Update existing
        response = await fetch(`/api/contacts/${contactId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(contactInfo)
        });
      } else {
        // Create new
        response = await fetch('/api/contacts', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(contactInfo)
        });
      }

      if (response.ok) {
        const data = await response.json();
        if (!contactId) {
          setContactId(data.contact._id);
        }
        // Show success message
        console.log('Contact info saved successfully');
      } else {
        console.error('Failed to save contact info');
      }
    } catch (error) {
      console.error('Error saving contact info:', error);
    }
    setLoading(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setContactInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFounderChange = (index: number, field: string, value: string) => {
    setContactInfo(prev => ({
      ...prev,
      founders: prev.founders.map((founder, i) =>
        i === index ? { ...founder, [field]: value } : founder
      )
    }));
  };

  const handleImageUpload = async (index: number, file: File) => {
    try {
      const formData = new FormData();
      formData.append('thumbnailFile', file);

      const response = await fetch('/api/upload/thumbnail', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        handleFounderChange(index, 'imageUrl', data.thumbnailUrl);
      } else {
        console.error('Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const handleAddFounder = () => {
    setContactInfo(prev => ({
      ...prev,
      founders: [...prev.founders, { name: '', title: '', imageUrl: '/default-avatar.png' }]
    }));
  };

  const handleRemoveFounder = (index: number) => {
    setContactInfo(prev => ({
      ...prev,
      founders: prev.founders.filter((_, i) => i !== index)
    }));
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
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
          <IonTitle className="title-ios">About & Contact</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
        <div style={{ padding: '20px' }}>

          <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
            <IonRefresherContent></IonRefresherContent>
          </IonRefresher>

          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '1.3em', fontWeight: '600', color: 'var(--ion-text-color)' }}>
              Church Information
            </h2>

            <IonCard style={{ margin: '0 0 16px 0', borderRadius: '12px' }}>
              <IonCardContent style={{ padding: '16px' }}>
                <IonItem style={{ marginBottom: '16px', '--border-radius': '8px' }}>
                  <IonLabel position="stacked">Church Name</IonLabel>
                  <IonInput
                    value={contactInfo.churchName}
                    onIonChange={(e) => handleInputChange('churchName', e.detail.value!)}
                    placeholder="Enter church name"
                  />
                </IonItem>

                <IonItem style={{ marginBottom: '16px', '--border-radius': '8px' }}>
                  <IonLabel position="stacked">Address</IonLabel>
                  <IonInput
                    value={contactInfo.address}
                    onIonChange={(e) => handleInputChange('address', e.detail.value!)}
                    placeholder="Enter church address"
                  />
                </IonItem>

                <IonItem style={{ marginBottom: '16px', '--border-radius': '8px' }}>
                  <IonLabel position="stacked">Phone</IonLabel>
                  <IonInput
                    value={contactInfo.phone}
                    onIonChange={(e) => handleInputChange('phone', e.detail.value!)}
                    placeholder="Enter phone number"
                  />
                </IonItem>

                <IonItem style={{ marginBottom: '16px', '--border-radius': '8px' }}>
                  <IonLabel position="stacked">Email</IonLabel>
                  <IonInput
                    value={contactInfo.email}
                    onIonChange={(e) => handleInputChange('email', e.detail.value!)}
                    placeholder="Enter email address"
                  />
                </IonItem>

                <IonItem style={{ marginBottom: '16px', '--border-radius': '8px' }}>
                  <IonLabel position="stacked">Service Times</IonLabel>
                  <IonTextarea
                    value={contactInfo.serviceTimes}
                    onIonChange={(e) => handleInputChange('serviceTimes', e.detail.value!)}
                    placeholder="Enter service times"
                    rows={3}
                  />
                </IonItem>
              </IonCardContent>
            </IonCard>

            <h2 style={{ margin: '24px 0 16px 0', fontSize: '1.3em', fontWeight: '600', color: 'var(--ion-text-color)' }}>
              About Content
            </h2>

            <IonCard style={{ margin: '0 0 16px 0', borderRadius: '12px' }}>
              <IonCardContent style={{ padding: '16px' }}>
                <IonItem style={{ marginBottom: '16px', '--border-radius': '8px' }}>
                  <IonLabel position="stacked">Our Story</IonLabel>
                  <IonTextarea
                    value={contactInfo.about}
                    onIonChange={(e) => handleInputChange('about', e.detail.value!)}
                    placeholder="Enter church story"
                    rows={4}
                  />
                </IonItem>

                <IonItem style={{ '--border-radius': '8px' }}>
                  <IonLabel position="stacked">Mission Statement</IonLabel>
                  <IonTextarea
                    value={contactInfo.mission}
                    onIonChange={(e) => handleInputChange('mission', e.detail.value!)}
                    placeholder="Enter mission statement"
                    rows={3}
                  />
                </IonItem>
              </IonCardContent>
            </IonCard>

            <h2 style={{ margin: '24px 0 16px 0', fontSize: '1.3em', fontWeight: '600', color: 'var(--ion-text-color)' }}>
              Leaders
            </h2>

            <IonCard style={{ margin: '0 0 16px 0', borderRadius: '12px' }}>
              <IonCardContent style={{ padding: '16px' }}>
                {contactInfo.founders.map((founder, index) => (
                  <div key={index} style={{ marginBottom: index < contactInfo.founders.length - 1 ? '24px' : '0', paddingBottom: index < contactInfo.founders.length - 1 ? '24px' : '0', borderBottom: index < contactInfo.founders.length - 1 ? '1px solid var(--ion-color-step-200)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                      <div style={{ position: 'relative' }}>
                        <img
                          src={founder.imageUrl || '/default-avatar.png'}
                          alt={founder.name}
                          style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '16px',
                            objectFit: 'cover',
                            border: '3px solid var(--ion-color-primary)'
                          }}
                        />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImageUpload(index, file);
                            }
                          }}
                          style={{
                            position: 'absolute',
                            top: '0',
                            left: '0',
                            width: '80px',
                            height: '80px',
                            opacity: '0',
                            cursor: 'pointer'
                          }}
                        />
                        <IonIcon
                          icon={camera}
                          style={{
                            position: 'absolute',
                            bottom: '0',
                            right: '0',
                            backgroundColor: 'var(--ion-color-primary)',
                            color: 'white',
                            borderRadius: '50%',
                            padding: '4px',
                            fontSize: '16px'
                          }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                          <IonItem style={{ marginBottom: '8px', '--border-radius': '8px' }}>
                            <IonLabel position="stacked">Name</IonLabel>
                            <IonInput
                              value={founder.name}
                              onIonChange={(e) => handleFounderChange(index, 'name', e.detail.value!)}
                              placeholder="Enter founder name"
                            />
                          </IonItem>
                          <IonItem style={{ '--border-radius': '8px' }}>
                            <IonLabel position="stacked">Title</IonLabel>
                            <IonInput
                              value={founder.title}
                              onIonChange={(e) => handleFounderChange(index, 'title', e.detail.value!)}
                              placeholder="Enter founder title"
                            />
                          </IonItem>
                          <IonButton
                            fill="clear"
                            color="danger"
                            size="small"
                            onClick={() => handleRemoveFounder(index)}
                            style={{ marginTop: '8px', alignSelf: 'flex-end' }}
                          >
                            <IonIcon icon={trash} />
                            Remove
                          </IonButton>
                        </div>
                    </div>
                  </div>
                ))}
              </IonCardContent>
            </IonCard>

            <IonButton
              expand="block"
              fill="outline"
              onClick={handleAddFounder}
              style={{
                marginBottom: '24px',
                '--border-radius': '12px'
              }}
            >
              <IonIcon icon={personAdd} slot="start" />
              Add Leader
            </IonButton>

            <h2 style={{ margin: '24px 0 16px 0', fontSize: '1.3em', fontWeight: '600', color: 'var(--ion-text-color)' }}>
              Preview
            </h2>

            <IonCard style={{ borderRadius: '12px' }}>
              <IonCardContent style={{ padding: '16px' }}>
                <h3 style={{ margin: '0 0 16px 0', color: 'var(--ion-text-color)' }}>{contactInfo.churchName}</h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <IonIcon icon={location} style={{ color: 'var(--ion-color-primary)' }} />
                  <span style={{ fontSize: '0.9em', color: 'var(--ion-color-medium)' }}>{contactInfo.address}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <IonIcon icon={call} style={{ color: 'var(--ion-color-primary)' }} />
                  <span style={{ fontSize: '0.9em', color: 'var(--ion-color-medium)' }}>{contactInfo.phone}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <IonIcon icon={mail} style={{ color: 'var(--ion-color-primary)' }} />
                  <span style={{ fontSize: '0.9em', color: 'var(--ion-color-medium)' }}>{contactInfo.email}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <IonIcon icon={time} style={{ color: 'var(--ion-color-primary)' }} />
                  <div style={{ fontSize: '0.9em', color: 'var(--ion-color-medium)', whiteSpace: 'pre-line' }}>
                    {contactInfo.serviceTimes}
                  </div>
                </div>

                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--ion-color-step-200)' }}>
                  <p style={{ margin: '0 0 12px 0', fontSize: '0.9em', color: 'var(--ion-color-medium)' }}>
                    {contactInfo.about}
                  </p>
                  <p style={{ margin: '0', fontSize: '0.9em', color: 'var(--ion-color-medium)' }}>
                    {contactInfo.mission}
                  </p>
                </div>

                {contactInfo.founders && contactInfo.founders.length > 0 && (
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--ion-color-step-200)' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '1em', fontWeight: '600', color: 'var(--ion-text-color)' }}>
                      Leaders
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {contactInfo.founders.map((founder, index) => (
                        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img src={founder.imageUrl || '/default-avatar.png'} alt={founder.name} style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '12px',
                            objectFit: 'cover',
                            border: '2px solid var(--ion-color-primary)'
                          }} />
                          <div>
                            <p style={{ margin: '0 0 2px 0', fontSize: '0.9em', fontWeight: '600', color: 'var(--ion-text-color)' }}>{founder.name}</p>
                            <p style={{ margin: '0', fontSize: '0.8em', color: 'var(--ion-color-medium)' }}>{founder.title}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </IonCardContent>
            </IonCard>

            {/* Save Button at Bottom */}
            <div style={{ marginTop: '32px', marginBottom: '24px' }}>
              <IonButton
                expand="block"
                onClick={handleSave}
                disabled={loading}
                style={{
                  height: '48px',
                  borderRadius: '24px',
                  fontWeight: '600',
                  backgroundColor: 'var(--ion-color-primary)',
                  '--border-radius': '24px'
                }}
              >
                <IonIcon icon={save} slot="start" />
                Save Changes
              </IonButton>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <IonText style={{ color: 'var(--ion-text-color)', opacity: 0.6, fontSize: '0.9em' }}>
              Dove Ministries Africa - Contact Management
            </IonText>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AdminContactManager;