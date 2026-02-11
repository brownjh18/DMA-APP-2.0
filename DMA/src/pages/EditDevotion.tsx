import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
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
  star,
  arrowBack,
  image,
  closeCircle
} from 'ionicons/icons';
import { useHistory, useParams, useLocation } from 'react-router-dom';
import { apiService } from '../services/api';

interface RouteParams {
  id: string;
}

const EditDevotion: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const { id } = useParams<RouteParams>();
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
    scripture: '',
    author: '',
    featured: false,
    description: '',
    reflection: '',
    prayer: '',
    thumbnailFile: null as File | null,
    thumbnailUrl: ''
  });

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [currentThumbnailUrl, setCurrentThumbnailUrl] = useState<string>('');

  // Default thumbnail for devotions when no custom thumbnail is uploaded
  const DEFAULT_DEVOTION_THUMBNAIL = '/hero-evangelism.jpg';

  useEffect(() => {
    // Get devotion data from navigation state
    const devotion = (location.state as any)?.devotion;
    if (devotion) {
      setFormData({
        title: devotion.title || '',
        scripture: devotion.scripture || '',
        author: devotion.author || '',
        featured: devotion.isFeatured || false,
        description: devotion.content || '',
        reflection: devotion.reflection || '',
        prayer: devotion.prayer || '',
        thumbnailFile: null,
        thumbnailUrl: devotion.thumbnailUrl || ''
      });
      setCurrentThumbnailUrl(devotion.thumbnailUrl || '');
    } else {
      // Fallback: try to load from API if no state data
      loadDevotion();
    }
  }, [location.state]);

  const loadDevotion = async () => {
    try {
      const devotion = await apiService.getDevotion(id);
      setFormData({
        title: devotion.title || '',
        scripture: devotion.scripture || '',
        author: devotion.author || '',
        featured: devotion.isFeatured || false,
        description: devotion.content || '',
        reflection: devotion.reflection || '',
        prayer: devotion.prayer || '',
        thumbnailFile: null,
        thumbnailUrl: devotion.thumbnailUrl || ''
      });
      setCurrentThumbnailUrl(devotion.thumbnailUrl || '');
    } catch (error) {
      // Silently fail - data should come from navigation state
      console.log('API load failed, using navigation state data');
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const thumbnailInputRef = React.useRef<HTMLInputElement>(null);

  const handleThumbnailSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setAlertMessage('File size must be less than 5MB');
        setShowAlert(true);
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setAlertMessage('Please select a valid image file');
        setShowAlert(true);
        return;
      }

      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setThumbnailPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview('');
    setCurrentThumbnailUrl(''); // This will show the default thumbnail
  };

  const handleSave = async () => {
    if (!formData.title || !formData.scripture || !formData.author) {
      setAlertMessage('Please fill in all required fields (Title, Scripture, Author)');
      setShowAlert(true);
      return;
    }

    setLoading(true);

    try {
      let thumbnailUrl = currentThumbnailUrl;

      // Upload new thumbnail if selected
      if (thumbnailFile) {
        const thumbnailFormData = new FormData();
        thumbnailFormData.append('thumbnailFile', thumbnailFile);
        const response = await fetch('/api/upload/thumbnail', {
          method: 'POST',
          body: thumbnailFormData
        });
        if (response.ok) {
          const data = await response.json();
          thumbnailUrl = data.thumbnailUrl;
        }
      }

      const devotionData: any = {
        title: formData.title,
        scripture: formData.scripture,
        author: formData.author,
        status: 'publish',
        isFeatured: formData.featured
      };

      if (formData.description.trim()) {
        devotionData.content = formData.description;
      }

      if (formData.reflection.trim()) {
        devotionData.reflection = formData.reflection;
      }

      if (formData.prayer.trim()) {
        devotionData.prayer = formData.prayer;
      }

      if (thumbnailUrl) {
        devotionData.thumbnailUrl = thumbnailUrl;
      }

      const response = await apiService.updateDevotion(id, devotionData);

      setAlertMessage('Devotion updated successfully!');
      setShowAlert(true);

      // Set refresh flag for main pages
      sessionStorage.setItem('devotionsNeedRefresh', 'true');
      // Clear API cache for devotions
      clearDevotionsCache();

      // Navigate back after success
      setTimeout(() => {
        history.push('/admin/devotions');
      }, 1500);
    } catch (error: any) {
      console.error('Error updating devotion:', error);
      setAlertMessage(error.message || 'Failed to update devotion');
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader translucent>
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
        <IonToolbar className="toolbar-ios">
          
          <IonTitle className="title-ios">Edit Devotion</IonTitle>
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
              Edit Devotion
            </h1>
            <p style={{
              margin: '0',
              color: 'var(--ion-text-color)',
              opacity: 0.7,
              fontSize: '1em'
            }}>
              Update devotion details and settings
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
              <IonLabel position="stacked">Scripture Reference *</IonLabel>
              <IonInput
                value={formData.scripture}
                onIonChange={(e) => handleInputChange('scripture', e.detail.value!)}
                placeholder="e.g., John 3:16"
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
              <IonLabel position="stacked">Featured</IonLabel>
              <IonSelect
                value={formData.featured ? 'true' : 'false'}
                onIonChange={(e) => handleInputChange('featured', e.detail.value === 'true')}
              >
                <IonSelectOption value="false">No</IonSelectOption>
                <IonSelectOption value="true">Yes</IonSelectOption>
              </IonSelect>
            </IonItem>

            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Description</IonLabel>
              <IonTextarea
                value={formData.description}
                onIonChange={(e) => handleInputChange('description', e.detail.value!)}
                placeholder="Enter devotion description"
                rows={4}
              />
            </IonItem>

            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Reflection</IonLabel>
              <IonTextarea
                value={formData.reflection}
                onIonChange={(e) => handleInputChange('reflection', e.detail.value!)}
                placeholder="Enter devotion reflection"
                rows={4}
              />
            </IonItem>

            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Prayer</IonLabel>
              <IonTextarea
                value={formData.prayer}
                onIonChange={(e) => handleInputChange('prayer', e.detail.value!)}
                placeholder="Enter devotion prayer"
                rows={4}
              />
            </IonItem>
          </div>

          {/* Thumbnail Upload */}
          <div style={{ marginBottom: '16px' }}>
            <IonLabel style={{ display: 'block', marginBottom: '8px', fontSize: '0.9em', color: 'var(--ion-color-medium)' }}>
              Devotion Thumbnail
            </IonLabel>

            <div style={{
              borderRadius: '12px',
              overflow: 'hidden',
              backgroundColor: 'rgba(0,0,0,0.02)'
            }}>
              <img
                src={thumbnailPreview || currentThumbnailUrl || DEFAULT_DEVOTION_THUMBNAIL}
                alt="Thumbnail preview"
                style={{
                  width: '100%',
                  height: '200px',
                  objectFit: 'cover',
                  display: 'block'
                }}
              />
              <div style={{ padding: '12px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <IonButton
                  fill="clear"
                  size="small"
                  onClick={() => thumbnailInputRef.current?.click()}
                  style={{
                    borderRadius: '25px',
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.08) 100%)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                    color: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? '#ffffff' : '#000000',
                    fontWeight: '600',
                    transition: 'transform 0.2s ease',
                    minWidth: '80px',
                    height: '32px'
                  }}
                  onMouseDown={(e) => {
                    const target = e.currentTarget as HTMLElement;
                    target.style.transform = 'scale(0.95)';
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
                  <IonIcon icon={image} slot="start" />
                  Change
                </IonButton>
                <IonButton
                  fill="clear"
                  size="small"
                  color="danger"
                  onClick={removeThumbnail}
                  style={{
                    borderRadius: '25px',
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(239, 68, 68, 0.15) 50%, rgba(239, 68, 68, 0.08) 100%)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    boxShadow: '0 8px 32px rgba(239, 68, 68, 0.2), inset 0 1px 0 rgba(239, 68, 68, 0.1)',
                    color: '#ffffff',
                    fontWeight: '600',
                    transition: 'transform 0.2s ease',
                    minWidth: '80px',
                    height: '32px'
                  }}
                  onMouseDown={(e) => {
                    const target = e.currentTarget as HTMLElement;
                    target.style.transform = 'scale(0.95)';
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
                  <IonIcon icon={closeCircle} slot="start" />
                  Remove
                </IonButton>
              </div>
            </div>
            <input
              ref={thumbnailInputRef}
              type="file"
              accept="image/*"
              onChange={handleThumbnailSelect}
              style={{ display: 'none' }}
            />
          </div>

          <IonButton
            expand="block"
            onClick={handleSave}
            disabled={loading}
            style={{
              height: '48px',
              borderRadius: '24px',
              fontWeight: '600',
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.8) 0%, rgba(56, 189, 248, 0.6) 50%, rgba(56, 189, 248, 0.4) 100%)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(56, 189, 248, 0.5)',
              boxShadow: '0 8px 32px rgba(56, 189, 248, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
              color: '#ffffff',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              '--border-radius': '24px'
            }}
            onMouseDown={(e) => {
              const target = e.currentTarget as HTMLElement;
              target.style.transform = 'scale(0.98)';
              target.style.boxShadow = '0 4px 16px rgba(56, 189, 248, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
            }}
            onMouseUp={(e) => {
              const target = e.currentTarget as HTMLElement;
              setTimeout(() => {
                target.style.transform = 'scale(1)';
                target.style.boxShadow = '0 8px 32px rgba(56, 189, 248, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
              }, 200);
            }}
            onMouseLeave={(e) => {
              const target = e.currentTarget as HTMLElement;
              target.style.transform = 'scale(1)';
              target.style.boxShadow = '0 8px 32px rgba(56, 189, 248, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
            }}
          >
            <IonIcon icon={save} slot="start" />
            Update Devotion
          </IonButton>

          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <IonText style={{ color: 'var(--ion-text-color)', opacity: 0.6, fontSize: '0.9em' }}>
              Dove Ministries Africa - Devotion Management
            </IonText>
          </div>
        </div>

        <IonLoading isOpen={loading} message="Updating devotion..." />
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

export default EditDevotion;