import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
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
  IonRefresherContent
} from '@ionic/react';
import {
  create,
  save,
  informationCircle,
  call,
  mail,
  location,
  time
} from 'ionicons/icons';

const AdminContactManager: React.FC = () => {
  const [contactInfo, setContactInfo] = useState({
    churchName: 'Dove Ministries Africa',
    address: '123 Faith Street, Kampala, Uganda',
    phone: '+256 123 456 789',
    email: 'info@doveministriesafrica.org',
    serviceTimes: 'Sundays: 8:00 AM & 10:30 AM\nWednesdays: 7:00 PM',
    about: 'Dove Ministries Africa is a vibrant church community dedicated to spreading God\'s love and serving our community through worship, fellowship, and outreach programs.',
    mission: 'To bring hope, healing, and transformation to lives through the power of God\'s love.'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadContactInfo();
  }, []);

  const loadContactInfo = async () => {
    // In real app, fetch from API
    setLoading(false);
  };

  const handleRefresh = async (event: CustomEvent) => {
    await loadContactInfo();
    event.detail.complete();
  };

  const handleSave = async () => {
    setLoading(true);
    // In real app, save to API
    setTimeout(() => {
      setLoading(false);
      // Show success message
    }, 1000);
  };

  const handleInputChange = (field: string, value: string) => {
    setContactInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/admin" />
          </IonButtons>
          <IonTitle className="title-ios">About & Contact</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
        <div style={{ padding: '20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <IonIcon icon={informationCircle} style={{ fontSize: '3em', color: 'var(--ion-color-primary)', marginBottom: '16px' }} />
            <h1 style={{ margin: '0 0 8px 0', fontSize: '1.8em', fontWeight: '700', color: 'var(--ion-text-color)' }}>
              About & Contact Management
            </h1>
            <p style={{ margin: '0', color: 'var(--ion-text-color)', opacity: 0.7, fontSize: '1em' }}>
              Update church information and contact details
            </p>
          </div>

          {/* Save Button */}
          <div style={{ marginBottom: '24px' }}>
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
                  <IonLabel position="stacked">About Description</IonLabel>
                  <IonTextarea
                    value={contactInfo.about}
                    onIonChange={(e) => handleInputChange('about', e.detail.value!)}
                    placeholder="Enter church description"
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
                  <p style={{ margin: '0', fontSize: '0.9em', fontWeight: '600', color: 'var(--ion-color-primary)' }}>
                    "{contactInfo.mission}"
                  </p>
                </div>
              </IonCardContent>
            </IonCard>
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