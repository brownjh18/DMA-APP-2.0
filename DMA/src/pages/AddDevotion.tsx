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
  book,
  text,
  calendar,
  person,
  star,
  arrowBack
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';

const AddDevotion: React.FC = () => {
  const history = useHistory();
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // Helper function to clear API cache for devotions
  const clearDevotionsCache = () => {
    try {
      // Check if localStorage is available
      if (typeof localStorage === 'undefined') {
        console.warn('localStorage is not available');
        return;
      }
      
      // Remove all cached devotions data from localStorage
      const keys = Object.keys(localStorage || {});
      if (Array.isArray(keys)) {
        keys.forEach(key => {
          if (key && key.startsWith && key.startsWith('api_cache_') && key.includes('devotions')) {
            try {
              localStorage.removeItem(key);
            } catch (removeError) {
              console.warn('Failed to remove cache key:', key, removeError);
            }
          }
        });
        console.log('Devotions API cache cleared');
      }
    } catch (error) {
      console.warn('Failed to clear devotions cache:', error);
    }
  };

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    author: '',
    date: '',
    scripture: '',
    reflection: '',
    prayer: '',
    category: 'faith-foundation',
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
    if (!formData.title || !formData.content || !formData.scripture || !formData.reflection || !formData.prayer || !formData.author || !formData.date) {
      setAlertMessage('Please fill in all required fields (Title, Scripture, Content, Reflection, Prayer, Author, Date)');
      setShowAlert(true);
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      console.log('Token from localStorage:', token);

      if (!token) {
        setAlertMessage('You must be logged in to add devotions. Please sign in first.');
        setShowAlert(true);
        setLoading(false);
        return;
      }

      const response = await fetch('/api/devotions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title,
          scripture: formData.scripture,
          content: formData.content,
          reflection: formData.reflection,
          prayer: formData.prayer,
          date: new Date(formData.date).toISOString(),
          author: formData.author,
          category: formData.category,
          isPublished: formData.status === 'published',
          isFeatured: formData.featured
        })
      });

      if (response.ok) {
        setLoading(false);
        setAlertMessage('Devotion added successfully!');
        setShowAlert(true);

        // Set refresh flag for main pages
        sessionStorage.setItem('devotionsNeedRefresh', 'true');
        // Clear API cache for devotions
        clearDevotionsCache();

        // Navigate back after success
        setTimeout(() => {
          history.push('/admin/devotions');
        }, 1500);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.log('API Error Response:', errorData);
        setAlertMessage(errorData.error || `Failed to add devotion (${response.status})`);
        setShowAlert(true);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error adding devotion:', error);
      setAlertMessage('Network error. Please try again.');
      setShowAlert(true);
      setLoading(false);
    }
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
              <IonLabel position="stacked">Scripture Reference *</IonLabel>
              <IonInput
                value={formData.scripture}
                onIonChange={(e) => handleInputChange('scripture', e.detail.value!)}
                placeholder="e.g., Psalm 23:1-6"
              />
            </IonItem>

            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Category</IonLabel>
              <IonSelect
                value={formData.category}
                onIonChange={(e) => handleInputChange('category', e.detail.value)}
              >
                <IonSelectOption value="faith-foundation">Faith Foundation</IonSelectOption>
                <IonSelectOption value="love-relationships">Love & Relationships</IonSelectOption>
                <IonSelectOption value="spiritual-growth">Spiritual Growth</IonSelectOption>
              </IonSelect>
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
              <IonLabel position="stacked">Reflection *</IonLabel>
              <IonTextarea
                value={formData.reflection}
                onIonChange={(e) => handleInputChange('reflection', e.detail.value!)}
                placeholder="Add reflection questions or thoughts"
                rows={3}
              />
            </IonItem>

            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Prayer *</IonLabel>
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