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
  arrowBack,
  image,
  closeCircle,
 videocam
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
    status: 'draft'
  });

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const thumbnailInputRef = React.useRef<HTMLInputElement>(null);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const videoInputRef = React.useRef<HTMLInputElement>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleThumbnailSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
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
  };

  const handleVideoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (100MB limit for videos)
      if (file.size > 100 * 1024 * 1024) {
        alert('Video file size must be less than 100MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('video/')) {
        alert('Please select a valid video file');
        return;
      }

      setVideoFile(file);
      // Create a preview URL
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
    }
  };

  const removeVideo = () => {
    setVideoFile(null);
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setVideoPreview('');
  };

  const uploadThumbnail = async (): Promise<string | null> => {
    if (!thumbnailFile) return null;

    setUploadingThumbnail(true);
    try {
      const formData = new FormData();
      formData.append('thumbnailFile', thumbnailFile);
      const response = await apiService.uploadThumbnail(formData);
      return response.thumbnailUrl;
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      throw error;
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const uploadVideo = async (): Promise<string | null> => {
    if (!videoFile) return null;

    setUploadingVideo(true);
    try {
      const formData = new FormData();
      formData.append('videoFile', videoFile);
      const response = await apiService.uploadEventVideo(formData);
      return response.videoUrl;
    } catch (error) {
      console.error('Error uploading video:', error);
      throw error;
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.date || !formData.time || !formData.location) {
      setAlertMessage('Please fill in all required fields (Title, Date, Time, Location)');
      setShowAlert(true);
      return;
    }

    setLoading(true);

    try {
      let imageUrl = null;
      let videoUrl = null;

      // Upload thumbnail if selected
      if (thumbnailFile) {
        try {
          imageUrl = await uploadThumbnail();
        } catch (error) {
          alert('Failed to upload thumbnail. Please try again.');
          setLoading(false);
          return;
        }
      }

      // Upload video if selected
      if (videoFile) {
        try {
          videoUrl = await uploadVideo();
        } catch (error) {
          alert('Failed to upload video. Please try again.');
          setLoading(false);
          return;
        }
      }

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

      if (imageUrl) {
        eventData.imageUrl = imageUrl;
      }

      if (videoUrl) {
        eventData.videoUrl = videoUrl;
        // Auto-generate thumbnail from video if no thumbnail was uploaded
        if (!imageUrl) {
          eventData.autoGeneratedThumbnail = true;
        }
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

            {/* Thumbnail Upload */}
            <div style={{ marginBottom: '16px' }}>
              <IonLabel style={{ display: 'block', marginBottom: '8px', fontSize: '0.9em', color: 'var(--ion-color-medium)' }}>
                Event Thumbnail (Optional)
              </IonLabel>

              {!thumbnailPreview ? (
                <div style={{
                  border: '2px dashed var(--ion-color-medium)',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center',
                  backgroundColor: 'rgba(0,0,0,0.02)'
                }}>
                  <IonIcon icon={image} style={{ fontSize: '2em', color: 'var(--ion-color-medium)', marginBottom: '8px' }} />
                  <p style={{ margin: '0 0 12px 0', color: 'var(--ion-color-medium)', fontSize: '0.9em' }}>
                    Upload a thumbnail image for the event
                  </p>
                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailSelect}
                    style={{ display: 'none' }}
                  />
                  <IonButton
                    onClick={() => thumbnailInputRef.current?.click()}
                    style={{
                      '--border-radius': '8px'
                    }}
                  >
                    <IonIcon icon={image} slot="start" />
                    Choose Image
                  </IonButton>
                </div>
              ) : (
                <div style={{
                  borderRadius: '12px',
                  overflow: 'hidden',
                  backgroundColor: 'var(--ion-item-background)',
                  marginBottom: '16px'
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
              )}
            </div>
          </div>

          {/* Video Upload */}
          <div style={{ marginBottom: '16px' }}>
            <IonLabel style={{ display: 'block', marginBottom: '8px', fontSize: '0.9em', color: 'var(--ion-color-medium)' }}>
              Event Video (Optional)
            </IonLabel>

            {!videoPreview ? (
              <div style={{
                border: '2px dashed var(--ion-color-medium)',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center',
                backgroundColor: 'rgba(0,0,0,0.02)'
              }}>
                <IonIcon icon={videocam} style={{ fontSize: '2em', color: 'var(--ion-color-medium)', marginBottom: '8px' }} />
                <p style={{ margin: '0 0 12px 0', color: 'var(--ion-color-medium)', fontSize: '0.9em' }}>
                  Upload a video for this event (max 100MB)
                </p>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoSelect}
                  style={{ display: 'none' }}
                />
                <IonButton
                  onClick={() => videoInputRef.current?.click()}
                  style={{ '--border-radius': '8px' }}
                >
                  <IonIcon icon={videocam} slot="start" />
                  Choose Video
                </IonButton>
              </div>
            ) : (
              <div style={{
                borderRadius: '12px',
                overflow: 'hidden',
                backgroundColor: 'var(--ion-item-background)',
                marginBottom: '16px'
              }}>
                <video
                  src={videoPreview}
                  controls
                  style={{
                    width: '100%',
                    height: '200px',
                    objectFit: 'cover',
                    display: 'block',
                    backgroundColor: '#000'
                  }}
                />
                <div style={{ padding: '12px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <IonButton fill="clear" size="small" onClick={() => videoInputRef.current?.click()}>
                    <IonIcon icon={videocam} slot="start" />
                    Change
                  </IonButton>
                  <IonButton fill="clear" size="small" color="danger" onClick={removeVideo}>
                    <IonIcon icon={closeCircle} slot="start" />
                    Remove
                  </IonButton>
                </div>
              </div>
            )}
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