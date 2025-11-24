import React, { useState } from 'react';
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
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonText,
  IonLoading,
  IonAlert
} from '@ionic/react';
import {
  save,
  people,
  person,
  calendar,
  informationCircle
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';

const AddMinistry: React.FC = () => {
  const history = useHistory();
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    leader: '',
    meetingDay: '',
    meetingTime: '',
    location: '',
    contactInfo: '',
    memberCount: '',
    status: 'active'
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!formData.name || !formData.description || !formData.leader) {
      setAlertMessage('Please fill in all required fields (Name, Description, Leader)');
      setShowAlert(true);
      return;
    }

    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setAlertMessage('Ministry added successfully!');
      setShowAlert(true);

      // Navigate back after success
      setTimeout(() => {
        history.push('/admin/ministries');
      }, 1500);
    }, 1000);
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/admin/ministries" />
          </IonButtons>
          <IonTitle className="title-ios">Add Ministry</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleSave} disabled={loading}>
              <IonIcon icon={save} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
        <div style={{ padding: '20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <IonIcon
              icon={people}
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
              Add New Ministry
            </h1>
            <p style={{
              margin: '0',
              color: 'var(--ion-text-color)',
              opacity: 0.7,
              fontSize: '1em'
            }}>
              Create a new church ministry
            </p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Ministry Name *</IonLabel>
              <IonInput
                value={formData.name}
                onIonChange={(e) => handleInputChange('name', e.detail.value!)}
                placeholder="Enter ministry name"
              />
            </IonItem>

            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Ministry Leader *</IonLabel>
              <IonInput
                value={formData.leader}
                onIonChange={(e) => handleInputChange('leader', e.detail.value!)}
                placeholder="Enter leader's name"
              />
            </IonItem>

            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Meeting Day</IonLabel>
              <IonSelect
                value={formData.meetingDay}
                onIonChange={(e) => handleInputChange('meetingDay', e.detail.value)}
                placeholder="Select meeting day"
              >
                <IonSelectOption value="sunday">Sunday</IonSelectOption>
                <IonSelectOption value="monday">Monday</IonSelectOption>
                <IonSelectOption value="tuesday">Tuesday</IonSelectOption>
                <IonSelectOption value="wednesday">Wednesday</IonSelectOption>
                <IonSelectOption value="thursday">Thursday</IonSelectOption>
                <IonSelectOption value="friday">Friday</IonSelectOption>
                <IonSelectOption value="saturday">Saturday</IonSelectOption>
              </IonSelect>
            </IonItem>

            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Meeting Time</IonLabel>
              <IonInput
                type="time"
                value={formData.meetingTime}
                onIonChange={(e) => handleInputChange('meetingTime', e.detail.value!)}
              />
            </IonItem>

            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Location</IonLabel>
              <IonInput
                value={formData.location}
                onIonChange={(e) => handleInputChange('location', e.detail.value!)}
                placeholder="Meeting location"
              />
            </IonItem>

            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Contact Information</IonLabel>
              <IonInput
                value={formData.contactInfo}
                onIonChange={(e) => handleInputChange('contactInfo', e.detail.value!)}
                placeholder="Phone or email for inquiries"
              />
            </IonItem>

            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Current Member Count</IonLabel>
              <IonInput
                type="number"
                value={formData.memberCount}
                onIonChange={(e) => handleInputChange('memberCount', e.detail.value!)}
                placeholder="Approximate number of members"
              />
            </IonItem>

            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Status</IonLabel>
              <IonSelect
                value={formData.status}
                onIonChange={(e) => handleInputChange('status', e.detail.value)}
              >
                <IonSelectOption value="active">Active</IonSelectOption>
                <IonSelectOption value="inactive">Inactive</IonSelectOption>
              </IonSelect>
            </IonItem>

            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Ministry Description *</IonLabel>
              <IonTextarea
                value={formData.description}
                onIonChange={(e) => handleInputChange('description', e.detail.value!)}
                placeholder="Describe the ministry's purpose and activities"
                rows={4}
              />
            </IonItem>
          </div>

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
            Save Ministry
          </IonButton>

          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <IonText style={{ color: 'var(--ion-text-color)', opacity: 0.6, fontSize: '0.9em' }}>
              Dove Ministries Africa - Ministry Management
            </IonText>
          </div>
        </div>

        <IonLoading isOpen={loading} message="Saving ministry..." />
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="Notice"
          message={alertMessage}
          buttons={['OK']}
        />
      </IonContent>
    </IonPage>
  );
};

export default AddMinistry;