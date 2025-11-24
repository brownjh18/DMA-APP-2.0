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
  book,
  text,
  calendar,
  person,
  star
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';

const AddDevotion: React.FC = () => {
  const history = useHistory();
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    author: '',
    date: '',
    scripture: '',
    reflection: '',
    prayer: '',
    featured: false,
    status: 'draft'
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!formData.title || !formData.content || !formData.author || !formData.date) {
      setAlertMessage('Please fill in all required fields (Title, Content, Author, Date)');
      setShowAlert(true);
      return;
    }

    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setAlertMessage('Devotion added successfully!');
      setShowAlert(true);

      // Navigate back after success
      setTimeout(() => {
        history.push('/admin/devotions');
      }, 1500);
    }, 1000);
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/admin/devotions" />
          </IonButtons>
          <IonTitle className="title-ios">Add Devotion</IonTitle>
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
              icon={book}
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
              Add New Devotion
            </h1>
            <p style={{
              margin: '0',
              color: 'var(--ion-text-color)',
              opacity: 0.7,
              fontSize: '1em'
            }}>
              Create a new daily devotion
            </p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Devotion Title *</IonLabel>
              <IonInput
                value={formData.title}
                onIonChange={(e) => handleInputChange('title', e.detail.value!)}
                placeholder="Enter devotion title"
              />
            </IonItem>

            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Author *</IonLabel>
              <IonInput
                value={formData.author}
                onIonChange={(e) => handleInputChange('author', e.detail.value!)}
                placeholder="Enter author name"
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
              <IonLabel position="stacked">Scripture Reference</IonLabel>
              <IonInput
                value={formData.scripture}
                onIonChange={(e) => handleInputChange('scripture', e.detail.value!)}
                placeholder="e.g., Psalm 23:1-6"
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
              <IonLabel position="stacked">Devotion Content *</IonLabel>
              <IonTextarea
                value={formData.content}
                onIonChange={(e) => handleInputChange('content', e.detail.value!)}
                placeholder="Enter the main devotion content"
                rows={6}
              />
            </IonItem>

            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Reflection Questions</IonLabel>
              <IonTextarea
                value={formData.reflection}
                onIonChange={(e) => handleInputChange('reflection', e.detail.value!)}
                placeholder="Add reflection questions or thoughts"
                rows={3}
              />
            </IonItem>

            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Prayer</IonLabel>
              <IonTextarea
                value={formData.prayer}
                onIonChange={(e) => handleInputChange('prayer', e.detail.value!)}
                placeholder="Include a sample prayer"
                rows={3}
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
            Save Devotion
          </IonButton>

          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <IonText style={{ color: 'var(--ion-text-color)', opacity: 0.6, fontSize: '0.9em' }}>
              Dove Ministries Africa - Devotion Management
            </IonText>
          </div>
        </div>

        <IonLoading isOpen={loading} message="Saving devotion..." />
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

export default AddDevotion;