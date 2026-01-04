import React, { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonButtons,
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
  calendar,
  time,
  location,
  people,
  informationCircle,
  arrowBack
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import apiService from '../services/api';

const AddEvent: React.FC = () => {
  const history = useHistory();
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    endTime: '',
    location: '',
    capacity: '',
    organizer: '',
    contactInfo: '',
    status: 'draft',
    imageUrl: ''
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);

    const formDataUpload = new FormData();
    formDataUpload.append('thumbnailFile', file);

    try {
      const data = await apiService.uploadThumbnail(formDataUpload);
      setFormData(prev => ({
        ...prev,
        imageUrl: data.thumbnailUrl
      }));
    } catch (error: any) {
      console.error('Error uploading image:', error);
      alert(`Error uploading image: ${error.message || 'Please try again.'}`);
    }

    setUploadingImage(false);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.date || !formData.time || !formData.location) {
      setAlertMessage('Please fill in all required fields (Title, Date, Time, Location)');
      setShowAlert(true);
      return;
    }

    setLoading(true);

    try {
      const eventData: any = {
        title: formData.title,
        description: formData.description,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        maxAttendees: formData.capacity ? parseInt(formData.capacity) : undefined,
        speaker: formData.organizer,
        contactPhone: formData.contactInfo,
        isPublished: formData.status === 'published'
      };

      // Only include imageUrl if it's not empty
      if (formData.imageUrl && formData.imageUrl.trim() !== '') {
        eventData.imageUrl = formData.imageUrl;
      }

      const result = await apiService.createEvent(eventData);

      setAlertMessage('Event added successfully!');
      setShowAlert(true);

      // Set refresh flag for main pages
      sessionStorage.setItem('eventsNeedRefresh', 'true');

      // Navigate back after success
      setTimeout(() => {
        history.push('/admin/events');
      }, 1500);
    } catch (error: any) {
      console.error('Error saving event:', error);
      setAlertMessage(error.message || 'Failed to add event. Please try again.');
      setShowAlert(true);
    }

    setLoading(false);
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
            <IonTitle className="title-ios">Add Event</IonTitle>
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
              icon={calendar}
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
              Add New Event
            </h1>
            <p style={{
              margin: '0',
              color: 'var(--ion-text-color)',
              opacity: 0.7,
              fontSize: '1em'
            }}>
              Create a new church event
            </p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Event Title *</IonLabel>
              <IonInput
                value={formData.title}
                onIonChange={(e) => handleInputChange('title', e.detail.value!)}
                placeholder="Enter event title"
              />
            </IonItem>

            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Date *</IonLabel>
              <IonInput
                type="date"
                value={formData.date}
                onIonChange={(e) => handleInputChange('date', e.detail.value!)}
              />
            </IonItem>

            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Start Time *</IonLabel>
              <IonInput
                type="time"
                value={formData.time}
                onIonChange={(e) => handleInputChange('time', e.detail.value!)}
              />
            </IonItem>

            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">End Time</IonLabel>
              <IonInput
                type="time"
                value={formData.endTime}
                onIonChange={(e) => handleInputChange('endTime', e.detail.value!)}
              />
            </IonItem>

            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Location *</IonLabel>
              <IonInput
                value={formData.location}
                onIonChange={(e) => handleInputChange('location', e.detail.value!)}
                placeholder="Enter event location"
              />
            </IonItem>

            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Capacity</IonLabel>
              <IonInput
                type="number"
                value={formData.capacity}
                onIonChange={(e) => handleInputChange('capacity', e.detail.value!)}
                placeholder="Maximum attendees (optional)"
              />
            </IonItem>

            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Organizer</IonLabel>
              <IonInput
                value={formData.organizer}
                onIonChange={(e) => handleInputChange('organizer', e.detail.value!)}
                placeholder="Event organizer or ministry"
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
              <IonLabel position="stacked">Status</IonLabel>
              <IonSelect
                value={formData.status}
                onIonChange={(e) => handleInputChange('status', e.detail.value)}
              >
                <IonSelectOption value="draft">Draft</IonSelectOption>
                <IonSelectOption value="published">Published</IonSelectOption>
              </IonSelect>
            </IonItem>

            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Event Description</IonLabel>
              <IonTextarea
                value={formData.description}
                onIonChange={(e) => handleInputChange('description', e.detail.value!)}
                placeholder="Describe the event details and purpose"
                rows={4}
              />
            </IonItem>

            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Event Poster/Thumbnail</IonLabel>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '100%' }}
                disabled={uploadingImage}
              />
              {uploadingImage && <p style={{ fontSize: '0.9em', color: '#666', marginTop: '4px' }}>Uploading image...</p>}
              {formData.imageUrl && (
                <div style={{ marginTop: '8px' }}>
                  <img
                    src={formData.imageUrl}
                    alt="Event poster preview"
                    style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '8px' }}
                  />
                </div>
              )}
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
            Save Event
          </IonButton>

          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <IonText style={{ color: 'var(--ion-text-color)', opacity: 0.6, fontSize: '0.9em' }}>
              Dove Ministries Africa - Event Management
            </IonText>
          </div>
        </div>

        <IonLoading isOpen={loading} message="Saving event..." />
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

export default AddEvent;