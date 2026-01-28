import React, { useState } from 'react';
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
  IonCol
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { apiService } from '../services/api';

import {
  save,
  radio,
  image,
  musicalNote,
  time,
  arrowBack,
  closeCircle
} from 'ionicons/icons';

const AddPodcast: React.FC = () => {
  const history = useHistory();
  const [title, setTitle] = useState('');
  const [speaker, setSpeaker] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [duration, setDuration] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [status, setStatus] = useState('draft');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !speaker.trim() || !audioFile) {
      alert('Please fill in all required fields and select an audio file');
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();

      // Add text fields
      formDataToSend.append('title', title);
      formDataToSend.append('speaker', speaker);
      formDataToSend.append('description', description);
      formDataToSend.append('category', category);
      formDataToSend.append('duration', duration);
      formDataToSend.append('status', status);

      // Add files
      if (audioFile) {
        formDataToSend.append('audioFile', audioFile);
      }
      if (thumbnailFile) {
        formDataToSend.append('thumbnailFile', thumbnailFile);
      }


      const response = await apiService.createPodcast(formDataToSend);

      // Show success message
      alert(`Podcast "${title}" created successfully!`);
      
      // Set refresh flag for main pages
      sessionStorage.setItem('podcastsNeedRefresh', 'true');
      
      history.push('/admin/radio');
    } catch (error) {
      console.error('Error adding podcast:', error);
      alert('Failed to add podcast. Please try again.');
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
          <IonTitle className="title-ios">Add Podcast</IonTitle>
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
              Add New Podcast
            </h1>
            <p style={{
              margin: '0',
              color: 'var(--ion-text-color)',
              opacity: 0.7,
              fontSize: '1em'
            }}>
              Create a new radio broadcast podcast
            </p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Podcast Title *</IonLabel>
              <IonInput
                value={title}
                onIonChange={(e) => setTitle(e.detail.value || '')}
                placeholder="Enter podcast title"
              />
            </IonItem>

            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Speaker/Presenter *</IonLabel>
              <IonInput
                value={speaker}
                onIonChange={(e) => setSpeaker(e.detail.value || '')}
                placeholder="Enter speaker name"
              />
            </IonItem>

            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Category</IonLabel>
              <IonSelect
                value={category}
                onIonChange={(e) => setCategory(e.detail.value || '')}
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
                value={duration}
                onIonChange={(e) => setDuration(e.detail.value || '')}
                placeholder="Enter duration (e.g., 30:00)"
              />
            </IonItem>

            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Status</IonLabel>
              <IonSelect
                value={status}
                onIonChange={(e) => setStatus(e.detail.value || 'draft')}
              >
                <IonSelectOption value="draft">Draft</IonSelectOption>
                <IonSelectOption value="published">Published</IonSelectOption>
                <IonSelectOption value="scheduled">Scheduled</IonSelectOption>
              </IonSelect>
            </IonItem>

            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Podcast Description</IonLabel>
              <IonTextarea
                value={description}
                onIonChange={(e) => setDescription(e.detail.value || '')}
                placeholder="Describe the podcast content"
                rows={4}
              />
            </IonItem>

            {/* Audio File Upload */}
            <div style={{ marginBottom: '16px' }}>
              <IonLabel style={{ display: 'block', marginBottom: '8px', fontSize: '0.9em', color: 'var(--ion-color-medium)' }}>
                Audio File *
              </IonLabel>
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                style={{ display: 'none' }}
                id="audio-file"
              />
              <div style={{
                border: '2px dashed var(--ion-color-medium)',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center',
                backgroundColor: 'rgba(0,0,0,0.02)',
                cursor: 'pointer'
              }}
              onClick={() => document.getElementById('audio-file')?.click()}
              >
                <IonIcon icon={musicalNote} style={{ fontSize: '2em', color: 'var(--ion-color-medium)', marginBottom: '8px' }} />
                <p style={{ margin: '0 0 12px 0', color: 'var(--ion-color-medium)', fontSize: '0.9em' }}>
                  Click to select audio file (MP3, WAV, M4A - Max 100MB)
                </p>
                <IonButton fill="outline" size="small" style={{ '--border-radius': '6px' }}>
                  <IonIcon icon={musicalNote} slot="start" />
                  Choose Audio File
                </IonButton>
                {audioFile && (
                  <div style={{
                    marginTop: '12px',
                    fontSize: '0.9em',
                    color: 'var(--ion-color-primary)',
                    fontWeight: '500'
                  }}>
                    ✓ {audioFile.name}
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
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setThumbnailFile(file);
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      setThumbnailPreview(event.target?.result as string);
                    };
                    reader.readAsDataURL(file);
                  } else {
                    setThumbnailPreview('');
                  }
                }}
                style={{ display: 'none' }}
                id="thumbnail-file"
              />

              {(thumbnailPreview) ? (
                <div style={{
                  borderRadius: '12px',
                  overflow: 'hidden',
                  backgroundColor: 'rgba(0,0,0,0.02)'
                }}>
                  <img
                    src={thumbnailPreview}
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
                      onClick={() => document.getElementById('thumbnail-file')?.click()}
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
                        setThumbnailFile(null);
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
                onClick={() => document.getElementById('thumbnail-file')?.click()}
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
            {loading ? 'Creating...' : 'Create Podcast'}
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

export default AddPodcast;