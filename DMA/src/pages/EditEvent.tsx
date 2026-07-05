import React, { useState, useEffect, useContext } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonIcon,
  IonLoading,
  IonAlert,
  IonText,
  IonSpinner
} from '@ionic/react';
import {
  save,
  calendar,
  closeCircle,
  image,
  checkmarkCircle,
  informationCircle,
  film,
  location as locationIcon,
  call,
  people
} from 'ionicons/icons';
import { useHistory, useParams, useLocation } from 'react-router-dom';
import { apiService } from '../services/api';
import BackButton from '../components/BackButton';
import { AuthContext } from '../App';
import { useSettings } from '../contexts/SettingsContext';
import './AdminForm.css';
import './AdminDashboard.css';

interface RouteParams {
  id: string;
}

const EditEvent: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const { id } = useParams<RouteParams>();
  const { isLoggedIn, isAdmin } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertHeader, setAlertHeader] = useState('Notice');
  const { isDarkMode } = useSettings();
  const [dragActive, setDragActive] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [currentThumbnailUrl, setCurrentThumbnailUrl] = useState<string>('');
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>('');
  const thumbnailInputRef = React.useRef<HTMLInputElement>(null);
  const videoInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (thumbnailPreview && thumbnailPreview.startsWith('blob:')) {
        URL.revokeObjectURL(thumbnailPreview);
      }
      if (videoPreview && videoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(videoPreview);
      }
    };
  }, [thumbnailPreview, videoPreview]);

  useEffect(() => {
    if (!isLoggedIn || !isAdmin) {
      history.push('/signin');
    }
  }, [isLoggedIn, isAdmin, history]);

  if (!isLoggedIn || !isAdmin) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <div className="af-loading">
            <div className="af-loading-spinner" />
            <IonText color="medium">
              <p>Checking permissions...</p>
            </IonText>
          </div>
        </IonContent>
      </IonPage>
    );
  }

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
    status: 'draft',
    thumbnailFile: null as File | null,
    videoFile: null as File | null
  });

  useEffect(() => {
    const event = (location.state as any)?.event;
    if (event) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        date: event.date || '',
        time: event.time || '',
        endTime: event.endDate || '',
        location: event.location || '',
        capacity: event.maxAttendees ? event.maxAttendees.toString() : '',
        organizer: event.speaker || '',
        contactInfo: event.contactPhone || '',
        status: event.isPublished ? 'published' : 'draft',
        thumbnailFile: null,
        videoFile: null
      });
      setCurrentThumbnailUrl(event.imageUrl || '');
      setCurrentVideoUrl(event.videoUrl || '');
    } else {
      loadEvent();
    }
  }, [location.state]);

  const loadEvent = async () => {
    try {
      const event = await apiService.getEvent(id);
      setFormData({
        title: event.title || '',
        description: event.description || '',
        date: event.date ? event.date.split('T')[0] : '',
        time: event.time || '',
        endTime: event.endDate ? event.endDate.split('T')[0] : '',
        location: event.location || '',
        capacity: event.maxAttendees ? event.maxAttendees.toString() : '',
        organizer: event.speaker || '',
        contactInfo: event.contactPhone || '',
        status: event.isPublished ? 'published' : 'draft',
        thumbnailFile: null,
        videoFile: null
      });
      setCurrentThumbnailUrl(event.imageUrl || '');
      setCurrentVideoUrl(event.videoUrl || '');
    } catch (error) {
      console.log('API load failed, using navigation state data');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleThumbnailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;

    if (file && file.size > 5 * 1024 * 1024) {
      setAlertHeader('Upload Error');
      setAlertMessage('Thumbnail file size must be less than 5MB');
      setShowAlert(true);
      event.target.value = '';
      return;
    }

    if (file && !file.type.startsWith('image/')) {
      setAlertHeader('Invalid File');
      setAlertMessage('Please select a valid image file (JPEG, PNG, WebP)');
      setShowAlert(true);
      event.target.value = '';
      return;
    }

    setFormData(prev => ({ ...prev, thumbnailFile: file }));
    if (file) {
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleVideoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;

    if (file && file.size > 100 * 1024 * 1024) {
      setAlertHeader('File Too Large');
      setAlertMessage('Video file size must be less than 100MB');
      setShowAlert(true);
      event.target.value = '';
      return;
    }

    if (file && !file.type.startsWith('video/')) {
      setAlertHeader('Invalid File');
      setAlertMessage('Please select a valid video file');
      setShowAlert(true);
      event.target.value = '';
      return;
    }

    setFormData(prev => ({ ...prev, videoFile: file }));
    if (file) {
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('video/')) {
      if (file.size > 100 * 1024 * 1024) {
        setAlertHeader('File Too Large');
        setAlertMessage('Video file size must be less than 100MB');
        setShowAlert(true);
        return;
      }
      setFormData(prev => ({ ...prev, videoFile: file }));
      setVideoPreview(URL.createObjectURL(file));
    } else {
      setAlertHeader('Invalid File');
      setAlertMessage('Please drop a video file');
      setShowAlert(true);
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.date || !formData.time || !formData.location) {
      setAlertHeader('Validation Error');
      setAlertMessage('Please fill in all required fields (Title, Date, Time, Location)');
      setShowAlert(true);
      return;
    }

    setLoading(true);

    try {
      let thumbnailUrl = currentThumbnailUrl;
      let videoUrl = currentVideoUrl;

      if (formData.thumbnailFile) {
        const thumbnailFormData = new FormData();
        thumbnailFormData.append('thumbnailFile', formData.thumbnailFile);
        const thumbnailResponse = await apiService.uploadThumbnail(thumbnailFormData);
        thumbnailUrl = thumbnailResponse.thumbnailUrl;
      }

      if (formData.videoFile) {
        setUploadingVideo(true);
        const videoFormData = new FormData();
        videoFormData.append('videoFile', formData.videoFile);
        const uploadResponse = await apiService.uploadEventVideo(videoFormData);
        videoUrl = uploadResponse.videoUrl;
        setUploadingVideo(false);
      }

      const updateData: any = {
        title: formData.title,
        description: formData.description,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        maxAttendees: formData.capacity ? parseInt(formData.capacity) : null,
        speaker: formData.organizer || null,
        contactPhone: formData.contactInfo || null,
        isPublished: formData.status === 'published',
        endDate: formData.endTime || null
      };

      if (thumbnailUrl) {
        updateData.imageUrl = thumbnailUrl;
      }

      if (videoUrl) {
        updateData.videoUrl = videoUrl;
      } else if (!formData.videoFile && currentVideoUrl === '') {
        updateData.videoUrl = null;
      }

      await apiService.updateEvent(id, updateData);

      setLoading(false);

      setAlertHeader('Success!');
      setAlertMessage('Event updated successfully!');
      setShowAlert(true);

      sessionStorage.setItem('eventsNeedRefresh', 'true');

      setTimeout(() => {
        history.push('/admin/events');
      }, 1500);
    } catch (error) {
      setLoading(false);
      setUploadingVideo(false);
      setAlertHeader('Error');
      setAlertMessage(error instanceof Error ? error.message : 'Failed to update event');
      setShowAlert(true);
    }
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios" style={{ background: 'transparent' }}>
          <BackButton />
          <IonTitle className="nd-title">Edit Event</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding af-page">
        <div className="af-section">
          <div className="af-toggle-row">
            <span className="af-toggle-label">Published</span>
            <div
              className={`af-toggle${formData.status === 'published' ? ' active' : ''}`}
              onClick={() => handleInputChange('status', formData.status === 'published' ? 'draft' : 'published')}
            >
              <div className="af-toggle-knob" />
            </div>
          </div>
        </div>

        <div className="af-section">
          <div className="af-card">
            <div className="af-field">
              <label className="af-label">
                Event Title <span className="af-required">*</span>
              </label>
              <input
                type="text"
                className="af-input"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter event title"
              />
            </div>

            <div className="af-field">
              <label className="af-label">
                Description
              </label>
              <textarea
                className="af-input af-textarea"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe the event details and purpose"
                rows={4}
              />
            </div>

            <div className="af-row">
              <div className="af-field">
                <label className="af-label">
                  Date <span className="af-required">*</span>
                </label>
                <input
                  type="date"
                  className="af-input"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                />
              </div>
              <div className="af-field">
                <label className="af-label">
                  Start Time <span className="af-required">*</span>
                </label>
                <input
                  type="time"
                  className="af-input"
                  value={formData.time}
                  onChange={(e) => handleInputChange('time', e.target.value)}
                />
              </div>
            </div>

            <div className="af-field">
              <label className="af-label">
                End Time
              </label>
              <input
                type="time"
                className="af-input"
                value={formData.endTime}
                onChange={(e) => handleInputChange('endTime', e.target.value)}
              />
            </div>

            <div className="af-field">
              <label className="af-label">
                Location <span className="af-required">*</span>
              </label>
              <input
                type="text"
                className="af-input"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Enter event location"
              />
            </div>

            <div className="af-row">
              <div className="af-field">
                <label className="af-label">
                  Capacity
                </label>
                <input
                  type="number"
                  className="af-input"
                  value={formData.capacity}
                  onChange={(e) => handleInputChange('capacity', e.target.value)}
                  placeholder="Max attendees"
                />
              </div>
              <div className="af-field">
                <label className="af-label">
                  Organizer
                </label>
                <input
                  type="text"
                  className="af-input"
                  value={formData.organizer}
                  onChange={(e) => handleInputChange('organizer', e.target.value)}
                  placeholder="Event organizer"
                />
              </div>
            </div>

            <div className="af-field">
              <label className="af-label">
                Contact Information
              </label>
              <input
                type="text"
                className="af-input"
                value={formData.contactInfo}
                onChange={(e) => handleInputChange('contactInfo', e.target.value)}
                placeholder="Phone or email for inquiries"
              />
            </div>
          </div>
        </div>

        <div className="af-section">
          <h3 className="af-section-title">Thumbnail</h3>
          <input
            ref={thumbnailInputRef}
            type="file"
            accept="image/*"
            onChange={handleThumbnailChange}
            style={{ display: 'none' }}
          />
          {!formData.thumbnailFile && !thumbnailPreview && !currentThumbnailUrl ? (
            <div
              className="af-upload"
              onClick={() => thumbnailInputRef.current?.click()}
            >
              <div className="af-upload-icon">
                <IonIcon icon={image} />
              </div>
              <p className="af-upload-text">Upload thumbnail image</p>
              <p className="af-upload-hint">Optional - Max 5MB - JPG, PNG, WebP</p>
            </div>
          ) : (
            <div className="af-card" style={{ padding: 0, overflow: 'hidden' }}>
              <img
                src={thumbnailPreview || currentThumbnailUrl || ''}
                alt="Thumbnail preview"
                className="af-upload-preview"
              />
              <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <IonIcon icon={image} style={{ fontSize: '16px', color: 'var(--ion-color-primary)' }} />
                  <span className="af-upload-text" style={{ margin: 0 }}>{formData.thumbnailFile?.name || 'Current thumbnail'}</span>
                </div>
                <button
                  className="af-submit af-submit-danger"
                  style={{ width: 'auto', padding: '6px 12px', fontSize: '12px', borderRadius: '8px' }}
                  onClick={() => {
                    setFormData(prev => ({ ...prev, thumbnailFile: null }));
                    setThumbnailPreview(null);
                    if (thumbnailInputRef.current) {
                      thumbnailInputRef.current.value = '';
                    }
                  }}
                >
                  <IonIcon icon={closeCircle} style={{ fontSize: '14px' }} />
                  Remove
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="af-section">
          <h3 className="af-section-title">Event Video</h3>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            onChange={handleVideoChange}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            style={{ display: 'none' }}
          />
          {!formData.videoFile && !videoPreview && !currentVideoUrl ? (
            <div
              className={`af-upload${dragActive ? ' af-upload--active' : ''}`}
              onClick={() => videoInputRef.current?.click()}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {dragActive && (
                <div className="af-upload-icon" style={{ color: 'var(--ion-color-primary)' }}>
                  Drop video here
                </div>
              )}
              <div className="af-upload-icon">
                <IonIcon icon={film} />
              </div>
              <p className="af-upload-text">Drag & drop your video here</p>
              <p className="af-upload-hint">or click to browse (max 100MB)</p>
            </div>
          ) : (
            <div className="af-card" style={{ padding: 0, overflow: 'hidden' }}>
              {videoPreview && (
                <video
                  src={videoPreview}
                  controls
                  style={{ width: '100%', maxHeight: '250px', objectFit: 'contain', background: '#000', display: 'block' }}
                />
              )}
              <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(34, 197, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IonIcon icon={checkmarkCircle} style={{ color: '#22c55e', fontSize: '20px' }} />
                  </div>
                  <div>
                    <p className="af-upload-text" style={{ margin: 0, maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {formData.videoFile?.name || 'Current video'}
                    </p>
                    <p className="af-upload-hint">
                      {formData.videoFile && (formData.videoFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  className="af-submit af-submit-danger"
                  style={{ width: '36px', height: '36px', padding: 0, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={() => {
                    setFormData(prev => ({ ...prev, videoFile: null }));
                    setVideoPreview(null);
                    if (videoInputRef.current) {
                      videoInputRef.current.value = '';
                    }
                  }}
                >
                  <IonIcon icon={closeCircle} style={{ fontSize: '18px' }} />
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          className="af-submit"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? (
            <>
              <IonSpinner name="crescent" color="white" style={{ width: '20px', height: '20px' }} />
              <span>{uploadingVideo ? 'Uploading Video...' : 'Updating Event...'}</span>
            </>
          ) : (
            <>
              <IonIcon icon={save} style={{ fontSize: '20px' }} />
              <span>Update Event</span>
            </>
          )}
        </button>

        <div className="af-footer">
          <IonText>Dove Church - Event Management System</IonText>
        </div>

        <IonLoading 
          isOpen={loading} 
          message={uploadingVideo ? "Uploading video..." : "Updating event..."} 
          duration={0}
        />
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header={alertHeader}
          message={alertMessage}
          buttons={[{ text: 'OK', role: 'cancel' }]}
        />
      </IonContent>
    </IonPage>
  );
};

export default EditEvent;
