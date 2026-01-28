import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonItem,
  IonLabel,
  IonText,
  IonCard,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonLoading
} from '@ionic/react';
import { useHistory, useParams } from 'react-router-dom';
import { apiService, API_BASE_URL } from '../services/api';

import {
  save,
  radio,
  image,
  musicalNote,
  time,
  arrowBack,
  closeCircle
} from 'ionicons/icons';

interface PodcastData {
  id: string;
  title: string;
  speaker: string;
  description: string;
  category: string;
  duration: string;
  status: string;
  thumbnailUrl?: string;
  audioUrl?: string;
}

const EditPodcast: React.FC = () => {
  const history = useHistory();
  const { id } = useParams<{ id: string }>();
  const [formData, setFormData] = useState({
    title: '',
    speaker: '',
    description: '',
    category: '',
    duration: '',
    audioFile: null as File | null,
    thumbnailFile: null as File | null,
    thumbnailUrl: '',
    status: 'draft'
  });

  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originalData, setOriginalData] = useState<PodcastData | null>(null);

  useEffect(() => {
    loadPodcastData();
  }, [id]);

  const loadPodcastData = async () => {
    try {
      const data = await apiService.getPodcast(id);
      const podcast: PodcastData = {
        id: data.podcast.id,
        title: data.podcast.title,
        speaker: data.podcast.speaker,
        description: data.podcast.description,
        category: data.podcast.series || '',
        duration: data.podcast.duration,
        status: data.podcast.status,
        thumbnailUrl: data.podcast.thumbnailUrl,
        audioUrl: data.podcast.audioUrl
      };

      setOriginalData(podcast);
      setFormData({
        title: podcast.title,
        speaker: podcast.speaker,
        description: podcast.description,
        category: podcast.category,
        duration: podcast.duration,
        status: podcast.status,
        audioFile: null,
        thumbnailFile: null,
        thumbnailUrl: podcast.thumbnailUrl || ''
      });
    } catch (error) {
      console.error('Error loading podcast data:', error);
      alert('Failed to load podcast data');
      history.push('/admin/radio');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = (field: string, file: File | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: file
    }));

    if (field === 'thumbnailFile') {
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setThumbnailPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setThumbnailPreview('');
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.speaker.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);

    try {
      // Check if we have file uploads
      const hasFiles = formData.audioFile || formData.thumbnailFile;

      if (hasFiles) {
        // Use FormData for file uploads
        const formDataToSend = new FormData();

        // Add text fields
        formDataToSend.append('title', formData.title);
        formDataToSend.append('speaker', formData.speaker);
        formDataToSend.append('description', formData.description);
        formDataToSend.append('category', formData.category);
        formDataToSend.append('duration', formData.duration);
        formDataToSend.append('status', formData.status);

        // Add files if present
        if (formData.audioFile) {
          formDataToSend.append('audioFile', formData.audioFile);
        }
        if (formData.thumbnailFile) {
          formDataToSend.append('thumbnailFile', formData.thumbnailFile);
        }

        await apiService.updatePodcast(id, formDataToSend);
        alert(`Podcast "${formData.title}" updated successfully!`);
        history.push('/admin/radio');
      } else {
        // Use JSON for text-only updates
        const updateData: any = {
          title: formData.title,
          speaker: formData.speaker,
          description: formData.description,
          category: formData.category,
          duration: formData.duration,
          status: formData.status
        };

        // Include thumbnailUrl if changed
        if (formData.thumbnailUrl !== (originalData?.thumbnailUrl || '')) {
          updateData.thumbnailUrl = formData.thumbnailUrl;
        }

        const response = await fetch(`${API_BASE_URL}/podcasts/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('token') && { Authorization: `Bearer ${localStorage.getItem('token')}` })
          },
          body: JSON.stringify(updateData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update podcast');
        }

        alert(`Podcast "${formData.title}" updated successfully!`);
        history.push('/admin/radio');
      }
    } catch (error) {
      console.error('Error updating podcast:', error);
      alert('Failed to update podcast. Please try again.');
    } finally {
      setSaving(false);
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
          <IonTitle className="title-ios">Edit Podcast</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
        <div style={{ padding: '20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <IonIcon
              icon={radio}
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
              Edit Podcast
            </h1>
            <p style={{
              margin: '0',
              color: 'var(--ion-text-color)',
              opacity: 0.7,
              fontSize: '1em'
            }}>
              Update podcast information and media files
            </p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Podcast Title *</IonLabel>
              <IonInput
                value={formData.title}
                onIonChange={(e) => handleInputChange('title', e.detail.value)}
                placeholder="Enter podcast title"
              />
            </IonItem>

            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Speaker/Presenter *</IonLabel>
              <IonInput
                value={formData.speaker}
                onIonChange={(e) => handleInputChange('speaker', e.detail.value)}
                placeholder="Enter speaker name"
              />
            </IonItem>

            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Category</IonLabel>
              <IonSelect
                value={formData.category}
                onIonChange={(e) => handleInputChange('category', e.detail.value)}
                placeholder="Select category"
              >
                <IonSelectOption value="faith">Faith & Belief</IonSelectOption>
                <IonSelectOption value="prayer">Prayer & Worship</IonSelectOption>
                <IonSelectOption value="teaching">Bible Teaching</IonSelectOption>
                <IonSelectOption value="testimony">Testimonies</IonSelectOption>
                <IonSelectOption value="youth">Youth Ministry</IonSelectOption>
                <IonSelectOption value="family">Family & Relationships</IonSelectOption>
                <IonSelectOption value="other">Other</IonSelectOption>
              </IonSelect>
            </IonItem>

            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Duration</IonLabel>
              <IonInput
                value={formData.duration}
                onIonChange={(e) => handleInputChange('duration', e.detail.value)}
                placeholder="Enter duration (e.g., 30:00)"
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
                <IonSelectOption value="scheduled">Scheduled</IonSelectOption>
              </IonSelect>
            </IonItem>

            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Podcast Description</IonLabel>
              <IonTextarea
                value={formData.description}
                onIonChange={(e) => handleInputChange('description', e.detail.value)}
                placeholder="Describe the podcast content"
                rows={4}
              />
            </IonItem>

            {/* Audio File Upload */}
            <div style={{ marginBottom: '16px' }}>
              <IonLabel style={{ display: 'block', marginBottom: '8px', fontSize: '0.9em', color: 'var(--ion-color-medium)' }}>
                Audio File
              </IonLabel>
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => handleFileChange('audioFile', e.target.files?.[0] || null)}
                style={{ display: 'none' }}
                id="audio-file-edit"
              />
              <div style={{
                border: '2px dashed var(--ion-color-medium)',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center',
                backgroundColor: 'rgba(0,0,0,0.02)',
                cursor: 'pointer'
              }}
              onClick={() => document.getElementById('audio-file-edit')?.click()}
              >
                <IonIcon icon={musicalNote} style={{ fontSize: '2em', color: 'var(--ion-color-medium)', marginBottom: '8px' }} />
                <p style={{ margin: '0 0 12px 0', color: 'var(--ion-color-medium)', fontSize: '0.9em' }}>
                  Click to replace audio file (MP3, WAV, M4A - Max 100MB)
                </p>
                <IonButton fill="outline" size="small" style={{ '--border-radius': '6px' }}>
                  <IonIcon icon={musicalNote} slot="start" />
                  Replace Audio File
                </IonButton>
                {originalData?.audioUrl && (
                  <div style={{
                    marginTop: '8px',
                    fontSize: '0.8em',
                    color: 'var(--ion-color-success)',
                    fontWeight: '500'
                  }}>
                    ✓ Current audio file exists
                  </div>
                )}
                {formData.audioFile && (
                  <div style={{
                    marginTop: '8px',
                    fontSize: '0.9em',
                    color: 'var(--ion-color-primary)',
                    fontWeight: '500'
                  }}>
                    ✓ New: {formData.audioFile.name}
                  </div>
                )}
              </div>
            </div>

            {/* Thumbnail Upload */}
            <div style={{ marginBottom: '16px' }}>
              <IonLabel style={{ display: 'block', marginBottom: '8px', fontSize: '0.9em', color: 'var(--ion-color-medium)' }}>
                Podcast Thumbnail (Optional)
              </IonLabel>

              {/* Hidden file input - always present */}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange('thumbnailFile', e.target.files?.[0] || null)}
                style={{ display: 'none' }}
                id="thumbnail-file-edit"
              />

              {(thumbnailPreview || formData.thumbnailUrl) ? (
                <div style={{
                  borderRadius: '12px',
                  overflow: 'hidden',
                  backgroundColor: 'rgba(0,0,0,0.02)'
                }}>
                  <img
                    src={thumbnailPreview || formData.thumbnailUrl}
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
                      onClick={() => document.getElementById('thumbnail-file-edit')?.click()}
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
                      onClick={() => {
                        setFormData(prev => ({ ...prev, thumbnailFile: null, thumbnailUrl: '' }));
                        setThumbnailPreview('');
                      }}
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
              ) : (
                <div style={{
                  border: '2px dashed var(--ion-color-medium)',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center',
                  backgroundColor: 'rgba(0,0,0,0.02)',
                  cursor: 'pointer'
                }}
                onClick={() => document.getElementById('thumbnail-file-edit')?.click()}
                >
                  <IonIcon icon={image} style={{ fontSize: '2em', color: 'var(--ion-color-medium)', marginBottom: '8px' }} />
                  <p style={{ margin: '0 0 12px 0', color: 'var(--ion-color-medium)', fontSize: '0.9em' }}>
                    Click to upload a thumbnail image
                  </p>
                  <IonButton
                    fill="outline"
                    size="small"
                    style={{ '--border-radius': '6px' }}
                  >
                    <IonIcon icon={image} slot="start" />
                    Choose Image
                  </IonButton>
                </div>
              )}
            </div>
          </div>

          <IonButton
            expand="block"
            onClick={handleSubmit}
            disabled={saving}
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
            {saving ? 'Updating...' : 'Update Podcast'}
          </IonButton>

          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <IonText style={{ color: 'var(--ion-text-color)', opacity: 0.6, fontSize: '0.9em' }}>
              Dove Ministries Africa - Podcast Management
            </IonText>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default EditPodcast;