import React, { useState, useEffect, useContext } from 'react';
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
  IonAlert,
  IonRadioGroup,
  IonRadio
} from '@ionic/react';
import {
  save,
  videocam,
  text,
  calendar,
  person,
  time,
  closeCircle,
  arrowBack,
  image
} from 'ionicons/icons';
import { useHistory, useParams, useLocation } from 'react-router-dom';
import { apiService } from '../services/api';
import { AuthContext } from '../App';

interface RouteParams {
  id: string;
}

const EditSermon: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const { id } = useParams<RouteParams>();
  const { isLoggedIn, isAdmin } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [hasFetchedDetails, setHasFetchedDetails] = useState(false);
  const [formKey, setFormKey] = useState(Date.now()); // Force re-render key
  const videoInputRef = React.useRef<HTMLInputElement>(null);
  const thumbnailInputRef = React.useRef<HTMLInputElement>(null);

  // Redirect if not logged in or not admin
  useEffect(() => {
    if (!isLoggedIn || !isAdmin) {
      history.push('/signin');
    }
  }, [isLoggedIn, isAdmin, history]);

  // Show loading if auth check is in progress
  if (!isLoggedIn || !isAdmin) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <IonLoading isOpen={true} message="Checking permissions..." />
        </IonContent>
      </IonPage>
    );
  }

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    speaker: '',
    series: '',
    status: 'draft',
    videoSource: 'upload', // 'upload' or 'external'
    videoFile: null as File | null,
    videoUrl: '',
    existingVideoUrl: '',
    duration: '00:00',
    viewCount: 0,
    thumbnailUrl: '',
    thumbnailFile: null as File | null
  });

  useEffect(() => {
    // Get sermon data from navigation state
    const sermon = (location.state as any)?.sermon;
    if (sermon) {
      const existingVideoUrl = sermon.videoUrl || '';
      const videoSource = existingVideoUrl.startsWith('/uploads/') ? 'upload' : 'external';
      setFormData({
        title: sermon.title || '',
        description: sermon.description || '',
        speaker: sermon.speaker || '',
        series: sermon.series || '',
        status: sermon.isPublished ? 'published' : 'draft',
        videoSource: videoSource,
        videoFile: null,
        videoUrl: videoSource === 'external' ? existingVideoUrl : '',
        existingVideoUrl: existingVideoUrl,
        duration: sermon.duration || '00:00',
        viewCount: sermon.viewCount || 0,
        thumbnailUrl: sermon.thumbnailUrl || '',
        thumbnailFile: null
      });
    } else {
      // Fallback: try to load from API if no state data
      loadSermon();
    }
  }, [location.state]);

  // Reset file input when component mounts
  useEffect(() => {
    const fileInput = document.getElementById('edit-video-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }, []);

  const loadSermon = async () => {
    try {
      const sermon = await apiService.getSermon(id);
      const existingVideoUrl = sermon.videoUrl || '';
      const videoSource = existingVideoUrl.startsWith('/uploads/') ? 'upload' : 'external';
      setFormData({
        title: sermon.title || '',
        description: sermon.description || '',
        speaker: sermon.speaker || '',
        series: sermon.series || '',
        status: sermon.isPublished ? 'published' : 'draft',
        videoSource: videoSource,
        videoFile: null,
        videoUrl: videoSource === 'external' ? existingVideoUrl : '',
        existingVideoUrl: existingVideoUrl,
        duration: sermon.duration || '00:00',
        viewCount: sermon.viewCount || 0,
        thumbnailUrl: sermon.thumbnailUrl || '',
        thumbnailFile: null
      });
    } catch (error) {
      // Silently fail - data should come from navigation state
      console.log('API load failed, using navigation state data');
    }
  };

  // Fetch video details when external URL changes
  useEffect(() => {
    if (formData.videoSource === 'external' && formData.videoUrl.trim()) {
      const timeoutId = setTimeout(() => {
        fetchVideoDetails(formData.videoUrl);
      }, 1000);
      return () => clearTimeout(timeoutId);
    } else {
      setHasFetchedDetails(false);
    }
  }, [formData.videoUrl, formData.videoSource]);

  const fetchVideoDetails = async (url: string) => {
    if (!url.trim()) return;
    setFetchingDetails(true);
    try {
      const details = await apiService.getYouTubeVideoDetails(url);
      setFormData(prev => ({
        ...prev,
        title: details.title || prev.title,
        description: details.description || prev.description,
        speaker: details.channelTitle || prev.speaker,
        series: prev.series,
        videoUrl: url,
        duration: details.duration || '00:00',
        viewCount: details.viewCount || 0,
        thumbnailUrl: details.thumbnailUrl || ''
      }));
      setHasFetchedDetails(true);
      setAlertMessage('Video details fetched successfully!');
      setShowAlert(true);
    } catch (error) {
      setAlertMessage(error instanceof Error ? error.message : 'Failed to fetch video details');
      setShowAlert(true);
    } finally {
      setFetchingDetails(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'videoSource') {
      setFormData(prev => ({ ...prev, [field]: value }));
      if (value === 'upload') {
        setHasFetchedDetails(false);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;

    // Validate file size (100MB limit)
    if (file && file.size > 100 * 1024 * 1024) {
      setAlertMessage('Video file size must be less than 100MB');
      setShowAlert(true);
      // Clear the file input
      event.target.value = '';
      return;
    }

    setFormData(prev => ({
      ...prev,
      videoFile: file
    }));
  };

  const handleThumbnailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;

    // Validate file size (5MB limit)
    if (file && file.size > 5 * 1024 * 1024) {
      setAlertMessage('Thumbnail file size must be less than 5MB');
      setShowAlert(true);
      // Clear the file input
      event.target.value = '';
      return;
    }

    // Validate file type
    if (file && !file.type.startsWith('image/')) {
      setAlertMessage('Please select a valid image file');
      setShowAlert(true);
      // Clear the file input
      event.target.value = '';
      return;
    }

    setFormData(prev => ({
      ...prev,
      thumbnailFile: file
    }));
  };

  const handleSave = async () => {
    if (!formData.title || !formData.speaker) {
      setAlertMessage('Please fill in all required fields (Title, Speaker)');
      setShowAlert(true);
      return;
    }

    // Validate video source
    if (formData.videoSource === 'upload' && !formData.videoFile && !formData.existingVideoUrl) {
      setAlertMessage('Please select a video file to upload');
      setShowAlert(true);
      return;
    }
    if (formData.videoSource === 'external' && !formData.videoUrl.trim()) {
      setAlertMessage('Please enter a video URL');
      setShowAlert(true);
      return;
    }

    setLoading(true);

    try {
      let videoUrl = formData.existingVideoUrl;
      let thumbnailUrl = formData.thumbnailUrl;

      // Upload thumbnail if selected
      if (formData.thumbnailFile) {
        const thumbnailFormData = new FormData();
        thumbnailFormData.append('thumbnailFile', formData.thumbnailFile);
        const thumbnailResponse = await apiService.uploadThumbnail(thumbnailFormData);
        thumbnailUrl = thumbnailResponse.thumbnailUrl;
      }

      if (formData.videoSource === 'upload') {
        // Upload new video if file is selected
        if (formData.videoFile) {
          const videoFormData = new FormData();
          videoFormData.append('video', formData.videoFile);

          const uploadResponse = await apiService.uploadSermonVideo(videoFormData);
          videoUrl = uploadResponse.videoUrl;
        }
        // If no new file, keep existing videoUrl
      } else {
        // External video URL
        videoUrl = formData.videoUrl.trim();
      }

      // Prepare sermon data
      const sermonData = {
        title: formData.title,
        speaker: formData.speaker,
        description: formData.description,
        series: formData.series,
        videoUrl: videoUrl,
        thumbnailUrl: thumbnailUrl || undefined,
        isPublished: formData.status === 'published'
      };

      // Extract thumbnail for external videos if not already set
      if (formData.videoSource === 'external' && videoUrl && (!formData.existingVideoUrl || formData.existingVideoUrl !== videoUrl)) {
        if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
          // Extract YouTube video ID
          const videoId = videoUrl.includes('youtu.be/')
            ? videoUrl.split('youtu.be/')[1]?.split('?')[0]
            : videoUrl.split('v=')[1]?.split('&')[0];

          if (videoId) {
            (sermonData as any).thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
          }
        }
      }

      console.log('Updating sermon data:', sermonData); // Debug log

      // Update sermon
      await apiService.updateSermon(id, sermonData);

      setLoading(false);
      setAlertMessage('Sermon updated successfully!');
      setShowAlert(true);

      // Set refresh flag for main pages
      sessionStorage.setItem('sermonsNeedRefresh', 'true');

      // Navigate back after success
      setTimeout(() => {
        history.push('/admin/sermons');
      }, 1500);
    } catch (error) {
      setLoading(false);
      setAlertMessage(error instanceof Error ? error.message : 'Failed to update sermon');
      setShowAlert(true);
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
          <IonTitle className="title-ios">Edit Sermon</IonTitle>
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
              Edit Sermon
            </h1>
            <p style={{
              margin: '0',
              color: 'var(--ion-text-color)',
              opacity: 0.7,
              fontSize: '1em'
            }}>
              Update sermon details and settings
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

            {/* Video Source Selection */}
            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Video Source</IonLabel>
              <IonRadioGroup
                value={formData.videoSource}
                onIonChange={(e) => handleInputChange('videoSource', e.detail.value)}
              >
                <IonItem>
                  <IonLabel>Upload Video File</IonLabel>
                  <IonRadio slot="start" value="upload" />
                </IonItem>
                <IonItem>
                  <IonLabel>External Video Link</IonLabel>
                  <IonRadio slot="start" value="external" />
                </IonItem>
              </IonRadioGroup>
            </IonItem>

            {/* Video Upload or URL Input */}
            {formData.videoSource === 'upload' ? (
              <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
                <IonLabel position="stacked">Video File</IonLabel>
                <input
                  id="edit-video-upload"
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
                    New file selected: {formData.videoFile.name}
                  </IonText>
                )}
                {formData.existingVideoUrl && !formData.videoFile && (
                  <IonText style={{ fontSize: '0.9em', color: 'var(--ion-color-success)', marginTop: '4px' }}>
                    Current video file is preserved
                  </IonText>
                )}
              </IonItem>
            ) : (
              <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
                <IonLabel position="stacked">Video URL</IonLabel>
                <IonInput
                  value={formData.videoUrl}
                  onIonChange={(e) => handleInputChange('videoUrl', e.detail.value!)}
                  placeholder="Enter external video URL (e.g., YouTube, Vimeo)"
                  type="url"
                  disabled={fetchingDetails}
                />
{formData.videoSource === 'external' && fetchingDetails && (
  <IonText style={{ fontSize: '0.9em', color: 'var(--ion-color-primary)', marginTop: '8px', display: 'block' }}>
    Fetching video details...
  </IonText>
)}
              </IonItem>
            )}

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
                onIonInput={(e) => handleInputChange('description', e.detail.value || '')}
                placeholder="Enter sermon description or notes"
                rows={4}
              />
            </IonItem>

            {/* Thumbnail Upload */}
            <div style={{ marginBottom: '16px' }}>
              <IonLabel style={{ display: 'block', marginBottom: '8px', fontSize: '0.9em', color: 'var(--ion-color-medium)' }}>
                Sermon Thumbnail (Optional)
              </IonLabel>

              <input
                ref={thumbnailInputRef}
                id="thumbnail-file-edit"
                type="file"
                accept="image/*"
                onChange={handleThumbnailChange}
                style={{ display: 'none' }}
              />
              {!formData.thumbnailFile && !formData.thumbnailUrl ? (
                <div style={{
                  border: '2px dashed var(--ion-color-medium)',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center',
                  backgroundColor: 'rgba(0,0,0,0.02)'
                }}>
                  <IonIcon icon={image} style={{ fontSize: '2em', color: 'var(--ion-color-medium)', marginBottom: '8px' }} />
                  <p style={{ margin: '0 0 12px 0', color: 'var(--ion-color-medium)', fontSize: '0.9em' }}>
                    Upload a thumbnail image for the sermon
                  </p>
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
              ) : formData.thumbnailFile ? (
                <div style={{
                  borderRadius: '12px',
                  overflow: 'hidden',
                  backgroundColor: 'rgba(0,0,0,0.02)'
                }}>
                  <img
                    src={URL.createObjectURL(formData.thumbnailFile)}
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
                      onClick={() => {
                        setFormData(prev => ({ ...prev, thumbnailFile: null }));
                        if (thumbnailInputRef.current) {
                          thumbnailInputRef.current.value = '';
                        }
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
                  borderRadius: '12px',
                  overflow: 'hidden',
                  backgroundColor: 'rgba(0,0,0,0.02)'
                }}>
                  <img
                    src={formData.thumbnailUrl}
                    alt="Current thumbnail"
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
                      onClick={() => {
                        setFormData(prev => ({ ...prev, thumbnailUrl: '', thumbnailFile: null }));
                        if (thumbnailInputRef.current) {
                          thumbnailInputRef.current.value = '';
                        }
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
              )}
            </div>
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
            Update Sermon
          </IonButton>

          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <IonText style={{ color: 'var(--ion-text-color)', opacity: 0.6, fontSize: '0.9em' }}>
              Dove Ministries Africa - Sermon Management
            </IonText>
          </div>
        </div>

        <IonLoading isOpen={loading} message="Updating sermon..." />
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

export default EditSermon;