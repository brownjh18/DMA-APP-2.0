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
  videocam,
  text,
  calendar,
  person,
  time
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { apiService } from '../services/api';

const AddSermon: React.FC = () => {
  const history = useHistory();
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    speaker: '',
    series: '',
    status: 'draft',
    videoFile: null as File | null,
    videoUrl: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setFormData(prev => ({
      ...prev,
      videoFile: file
    }));
  };

  const handleSave = async () => {
    if (!formData.title || !formData.speaker) {
      setAlertMessage('Please fill in all required fields (Title, Speaker)');
      setShowAlert(true);
      return;
    }

    setLoading(true);

    try {
      let videoUrl = '';

      // Upload video if file is selected
      if (formData.videoFile) {
        const videoFormData = new FormData();
        videoFormData.append('video', formData.videoFile);

        const uploadResponse = await apiService.uploadSermonVideo(videoFormData);
        videoUrl = uploadResponse.videoUrl;
      }

      // Prepare sermon data
      const sermonData = {
        title: formData.title,
        speaker: formData.speaker,
        description: formData.description,
        series: formData.series,
        videoUrl: videoUrl,
        isPublished: formData.status === 'published'
      };

      // Create sermon
      await apiService.createSermon(sermonData);

      setLoading(false);
      setAlertMessage('Sermon added successfully!');
      setShowAlert(true);

      // Navigate back after success
      setTimeout(() => {
        history.push('/admin/sermons');
      }, 1500);
    } catch (error) {
      setLoading(false);
      setAlertMessage(error instanceof Error ? error.message : 'Failed to add sermon');
      setShowAlert(true);
    }
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/admin/sermons" />
          </IonButtons>
          <IonTitle className="title-ios">Add Sermon</IonTitle>
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
              icon={videocam}
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
              Add New Sermon
            </h1>
            <p style={{
              margin: '0',
              color: 'var(--ion-text-color)',
              opacity: 0.7,
              fontSize: '1em'
            }}>
              Create a new sermon entry
            </p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Sermon Title *</IonLabel>
              <IonInput
                value={formData.title}
                onIonChange={(e) => handleInputChange('title', e.detail.value!)}
                placeholder="Enter sermon title"
              />
            </IonItem>

            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Speaker *</IonLabel>
              <IonInput
                value={formData.speaker}
                onIonChange={(e) => handleInputChange('speaker', e.detail.value!)}
                placeholder="Enter speaker name"
              />
            </IonItem>


            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Series</IonLabel>
              <IonInput
                value={formData.series}
                onIonChange={(e) => handleInputChange('series', e.detail.value!)}
                placeholder="Enter sermon series (optional)"
              />
            </IonItem>

            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Video Upload</IonLabel>
              <input
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                style={{
                  padding: '8px',
                  border: '1px solid var(--ion-color-light-shade)',
                  borderRadius: '4px',
                  backgroundColor: 'var(--ion-item-background)',
                  color: 'var(--ion-text-color)',
                  width: '100%'
                }}
              />
              {formData.videoFile && (
                <IonText style={{ fontSize: '0.9em', color: 'var(--ion-color-primary)', marginTop: '4px' }}>
                  Selected: {formData.videoFile.name}
                </IonText>
              )}
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
              <IonLabel position="stacked">Description</IonLabel>
              <IonTextarea
                value={formData.description}
                onIonChange={(e) => handleInputChange('description', e.detail.value!)}
                placeholder="Enter sermon description or notes"
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
            Save Sermon
          </IonButton>

          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <IonText style={{ color: 'var(--ion-text-color)', opacity: 0.6, fontSize: '0.9em' }}>
              Dove Ministries Africa - Sermon Management
            </IonText>
          </div>
        </div>

        <IonLoading isOpen={loading} message="Saving sermon..." />
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

export default AddSermon;