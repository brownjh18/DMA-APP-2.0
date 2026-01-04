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
  arrowBack
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
                    value={title}
                    onIonChange={(e) => setTitle(e.detail.value || '')}
                    placeholder="Enter podcast title"
                    style={{ '--padding-start': '16px', '--inner-padding-end': '16px' }}
                  />
                </IonItem>

                <IonItem style={{ marginBottom: '16px', borderRadius: '8px' }}>
                  <IonLabel position="stacked" style={{ fontWeight: '600' }}>
                    Speaker/Presenter *
                  </IonLabel>
                  <IonInput
                    value={speaker}
                    onIonChange={(e) => setSpeaker(e.detail.value || '')}
                    placeholder="Enter speaker name"
                    style={{ '--padding-start': '16px', '--inner-padding-end': '16px' }}
                  />
                </IonItem>

                <IonItem style={{ marginBottom: '16px', borderRadius: '8px' }}>
                  <IonLabel position="stacked" style={{ fontWeight: '600' }}>
                    Category
                  </IonLabel>
                  <IonSelect
                    value={category}
                    onIonChange={(e) => setCategory(e.detail.value || '')}
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
                    value={description}
                    onIonChange={(e) => setDescription(e.detail.value || '')}
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
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                          style={{ display: 'none' }}
                          id="audio-file"
                        />
                        <IonButton
                          fill="outline"
                          onClick={() => document.getElementById('audio-file')?.click()}
                          style={{ borderRadius: '8px' }}
                        >
                          <IonIcon icon={musicalNote} slot="start" />
                          Choose Audio
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
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                          style={{ display: 'none' }}
                          id="thumbnail-file"
                        />
                        <IonButton
                          fill="outline"
                          onClick={() => document.getElementById('thumbnail-file')?.click()}
                          style={{ borderRadius: '8px' }}
                        >
                          <IonIcon icon={image} slot="start" />
                          Choose Image
                        </IonButton>
                        {thumbnailFile && (
                          <div style={{
                            marginTop: '12px',
                            fontSize: '0.9em',
                            color: 'var(--ion-color-primary)',
                            fontWeight: '500'
                          }}>
                            ✓ {thumbnailFile.name}
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
                    value={status}
                    onIonChange={(e) => setStatus(e.detail.value || 'draft')}
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
              disabled={loading}
              style={{
                flex: 1,
                height: '48px',
                borderRadius: '24px',
                fontWeight: '600',
                backgroundColor: 'var(--ion-color-primary)'
              }}
            >
              <IonIcon icon={save} slot="start" />
              {loading ? 'Creating...' : 'Create Podcast'}
            </IonButton>
          </div>

        </div>
      </IonContent>
    </IonPage>
  );
};

export default AddPodcast;