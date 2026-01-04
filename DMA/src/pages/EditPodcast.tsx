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
  arrowBack
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
    status: 'draft'
  });
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
        thumbnailFile: null
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
        const updateData = {
          title: formData.title,
          speaker: formData.speaker,
          description: formData.description,
          category: formData.category,
          duration: formData.duration,
          status: formData.status
        };

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
        <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>

          {/* Header */}
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

          {/* Form */}
          <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
            <IonCardContent style={{ padding: '24px' }}>

              {/* Basic Information */}
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{
                  margin: '0 0 20px 0',
                  fontSize: '1.2em',
                  fontWeight: '600',
                  color: 'var(--ion-text-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <IonIcon icon={radio} />
                  Basic Information
                </h2>

                <IonItem style={{ marginBottom: '16px', borderRadius: '8px' }}>
                  <IonLabel position="stacked" style={{ fontWeight: '600' }}>
                    Podcast Title *
                  </IonLabel>
                  <IonInput
                    value={formData.title}
                    onIonChange={(e) => handleInputChange('title', e.detail.value)}
                    placeholder="Enter podcast title"
                    style={{ '--padding-start': '16px', '--inner-padding-end': '16px' }}
                  />
                </IonItem>

                <IonItem style={{ marginBottom: '16px', borderRadius: '8px' }}>
                  <IonLabel position="stacked" style={{ fontWeight: '600' }}>
                    Speaker/Presenter *
                  </IonLabel>
                  <IonInput
                    value={formData.speaker}
                    onIonChange={(e) => handleInputChange('speaker', e.detail.value)}
                    placeholder="Enter speaker name"
                    style={{ '--padding-start': '16px', '--inner-padding-end': '16px' }}
                  />
                </IonItem>

                <IonItem style={{ marginBottom: '16px', borderRadius: '8px' }}>
                  <IonLabel position="stacked" style={{ fontWeight: '600' }}>
                    Category
                  </IonLabel>
                  <IonSelect
                    value={formData.category}
                    onIonChange={(e) => handleInputChange('category', e.detail.value)}
                    placeholder="Select category"
                    style={{ '--padding-start': '16px', '--inner-padding-end': '16px' }}
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


                <IonItem style={{ borderRadius: '8px' }}>
                  <IonLabel position="stacked" style={{ fontWeight: '600' }}>
                    Description
                  </IonLabel>
                  <IonTextarea
                    value={formData.description}
                    onIonChange={(e) => handleInputChange('description', e.detail.value)}
                    placeholder="Enter podcast description"
                    rows={4}
                    style={{ '--padding-start': '16px', '--inner-padding-end': '16px' }}
                  />
                </IonItem>
              </div>

              {/* Media Files */}
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{
                  margin: '0 0 20px 0',
                  fontSize: '1.2em',
                  fontWeight: '600',
                  color: 'var(--ion-text-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <IonIcon icon={musicalNote} />
                  Media Files
                </h2>

                <IonGrid>
                  <IonRow>
                    <IonCol size="12" sizeMd="6">
                      <div style={{
                        border: '2px dashed var(--ion-color-step-300)',
                        borderRadius: '12px',
                        padding: '20px',
                        textAlign: 'center',
                        marginBottom: '16px',
                        backgroundColor: 'var(--ion-item-background)',
                        transition: 'all 0.2s ease'
                      }}>
                        <IonIcon
                          icon={musicalNote}
                          style={{
                            fontSize: '2em',
                            color: 'var(--ion-color-primary)',
                            marginBottom: '12px'
                          }}
                        />
                        <div style={{ fontWeight: '600', marginBottom: '8px', color: 'var(--ion-text-color)' }}>
                          Audio File
                        </div>
                        <div style={{ fontSize: '0.9em', color: 'var(--ion-color-medium)', marginBottom: '16px' }}>
                          MP3, WAV, or M4A (Max 100MB)
                        </div>
                        {originalData?.audioUrl && (
                          <div style={{
                            fontSize: '0.8em',
                            color: 'var(--ion-color-success)',
                            marginBottom: '12px',
                            fontWeight: '500'
                          }}>
                            ✓ Current audio file exists
                          </div>
                        )}
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={(e) => handleFileChange('audioFile', e.target.files?.[0] || null)}
                          style={{ display: 'none' }}
                          id="audio-file-edit"
                        />
                        <IonButton
                          fill="outline"
                          onClick={() => document.getElementById('audio-file-edit')?.click()}
                          style={{ borderRadius: '8px' }}
                        >
                          <IonIcon icon={musicalNote} slot="start" />
                          Replace Audio
                        </IonButton>
                        {formData.audioFile && (
                          <div style={{
                            marginTop: '12px',
                            fontSize: '0.9em',
                            color: 'var(--ion-color-primary)',
                            fontWeight: '500'
                          }}>
                            ✓ New: {formData.audioFile.name}
                          </div>
                        )}
                      </div>
                    </IonCol>

                    <IonCol size="12" sizeMd="6">
                      <div style={{
                        border: '2px dashed var(--ion-color-step-300)',
                        borderRadius: '12px',
                        padding: '20px',
                        textAlign: 'center',
                        marginBottom: '16px',
                        backgroundColor: 'var(--ion-item-background)',
                        transition: 'all 0.2s ease'
                      }}>
                        <IonIcon
                          icon={image}
                          style={{
                            fontSize: '2em',
                            color: 'var(--ion-color-primary)',
                            marginBottom: '12px'
                          }}
                        />
                        <div style={{ fontWeight: '600', marginBottom: '8px', color: 'var(--ion-text-color)' }}>
                          Thumbnail Image
                        </div>
                        <div style={{ fontSize: '0.9em', color: 'var(--ion-color-medium)', marginBottom: '16px' }}>
                          JPG, PNG (Max 5MB)
                        </div>
                        {originalData?.thumbnailUrl && (
                          <div style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '8px',
                            backgroundImage: `url(${originalData.thumbnailUrl})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            margin: '0 auto 12px auto',
                            border: '2px solid var(--ion-color-step-300)'
                          }} />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange('thumbnailFile', e.target.files?.[0] || null)}
                          style={{ display: 'none' }}
                          id="thumbnail-file-edit"
                        />
                        <IonButton
                          fill="outline"
                          onClick={() => document.getElementById('thumbnail-file-edit')?.click()}
                          style={{ borderRadius: '8px' }}
                        >
                          <IonIcon icon={image} slot="start" />
                          Replace Image
                        </IonButton>
                        {formData.thumbnailFile && (
                          <div style={{
                            marginTop: '12px',
                            fontSize: '0.9em',
                            color: 'var(--ion-color-primary)',
                            fontWeight: '500'
                          }}>
                            ✓ New: {formData.thumbnailFile.name}
                          </div>
                        )}
                      </div>
                    </IonCol>
                  </IonRow>
                </IonGrid>
              </div>

              {/* Publishing Options */}
              <div>
                <h2 style={{
                  margin: '0 0 20px 0',
                  fontSize: '1.2em',
                  fontWeight: '600',
                  color: 'var(--ion-text-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <IonIcon icon={save} />
                  Publishing Options
                </h2>

                <IonItem style={{ borderRadius: '8px' }}>
                  <IonLabel position="stacked" style={{ fontWeight: '600' }}>
                    Status
                  </IonLabel>
                  <IonSelect
                    value={formData.status}
                    onIonChange={(e) => handleInputChange('status', e.detail.value)}
                    style={{ '--padding-start': '16px', '--inner-padding-end': '16px' }}
                  >
                    <IonSelectOption value="draft">Draft (Save as draft)</IonSelectOption>
                    <IonSelectOption value="published">Published (Make live immediately)</IonSelectOption>
                    <IonSelectOption value="scheduled">Scheduled (Publish later)</IonSelectOption>
                  </IonSelect>
                </IonItem>
              </div>

            </IonCardContent>
          </IonCard>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '40px' }}>
            <IonButton
              expand="block"
              fill="outline"
              onClick={() => history.push('/admin/radio')}
              style={{
                flex: 1,
                height: '48px',
                borderRadius: '24px',
                fontWeight: '600'
              }}
            >
              Cancel
            </IonButton>
            <IonButton
              expand="block"
              onClick={handleSubmit}
              disabled={saving}
              style={{
                flex: 1,
                height: '48px',
                borderRadius: '24px',
                fontWeight: '600',
                backgroundColor: 'var(--ion-color-primary)'
              }}
            >
              <IonIcon icon={save} slot="start" />
              {saving ? 'Updating...' : 'Update Podcast'}
            </IonButton>
          </div>

        </div>
      </IonContent>
    </IonPage>
  );
};

export default EditPodcast;