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
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [dragActive, setDragActive] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [currentThumbnailUrl, setCurrentThumbnailUrl] = useState<string>('');
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>('');
  const thumbnailInputRef = React.useRef<HTMLInputElement>(null);
  const videoInputRef = React.useRef<HTMLInputElement>(null);

  // Detect color scheme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Cleanup object URLs on unmount to prevent memory leaks
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

  // Color scheme helpers
  const colors = isDarkMode ? {
    bg: 'transparent',
    text: '#fff',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    textMuted: 'rgba(255, 255, 255, 0.4)',
    textLight: 'rgba(255, 255, 255, 0.6)',
    inputBg: 'rgba(255, 255, 255, 0.08)',
    inputBorder: 'rgba(255, 255, 255, 0.15)',
    cardBg: 'rgba(255, 255, 255, 0.08)',
    cardBorder: 'rgba(255, 255, 255, 0.1)',
    tabBg: 'rgba(255, 255, 255, 0.05)',
    dropzoneBg: 'rgba(255, 255, 255, 0.03)',
    dropzoneBorder: 'rgba(255, 255, 255, 0.3)',
    dropzoneHoverBorder: 'rgba(255, 255, 255, 0.5)',
    dropzoneHoverBg: 'rgba(255, 255, 255, 0.06)',
    buttonBg: 'rgba(255, 255, 255, 0.15)',
    buttonBorder: 'rgba(255, 255, 255, 0.2)',
    buttonHoverBg: 'rgba(255, 255, 255, 0.25)',
    error: '#f87171',
    success: '#22c55e',
    successBg: 'rgba(34, 197, 94, 0.15)',
    successBorder: 'rgba(34, 197, 94, 0.3)',
    warning: '#f59e0b',
    warningBg: 'rgba(245, 158, 11, 0.15)',
    danger: '#ef4444',
    dangerBg: 'rgba(239, 68, 68, 0.2)',
    dangerHoverBg: 'rgba(239, 68, 68, 0.3)',
    primary: '#667eea',
    primaryShadow: 'rgba(102, 126, 234, 0.2)',
    footer: 'rgba(255, 255, 255, 0.4)',
    heroText: '#fff',
    heroSubtext: 'rgba(255, 255, 255, 0.85)',
    iconBg: 'rgba(255, 255, 255, 0.1)',
    iconBgLight: 'rgba(255, 255, 255, 0.2)',
    videoCardBg: 'rgba(34, 197, 94, 0.2)',
    loadingBg: 'rgba(255, 255, 255, 0.2)',
    alertBg: 'rgba(30, 30, 40, 0.95)',
    alertShadow: 'rgba(0, 0, 0, 0.5)',
    alertBtn: '#667eea',
    scrollbarThumb: 'rgba(255, 255, 255, 0.2)',
    scrollbarThumbHover: 'rgba(255, 255, 255, 0.3)',
  } : {
    bg: '#f8fafc',
    text: '#1e293b',
    textSecondary: '#475569',
    textMuted: '#94a3b8',
    textLight: '#64748b',
    inputBg: '#ffffff',
    inputBorder: '#e2e8f0',
    cardBg: '#ffffff',
    cardBorder: '#e2e8f0',
    tabBg: '#f1f5f9',
    dropzoneBg: '#f8fafc',
    dropzoneBorder: '#cbd5e1',
    dropzoneHoverBorder: '#667eea',
    dropzoneHoverBg: '#eef2ff',
    buttonBg: '#e2e8f0',
    buttonBorder: '#cbd5e1',
    buttonHoverBg: '#cbd5e1',
    error: '#dc2626',
    success: '#16a34a',
    successBg: 'rgba(22, 163, 74, 0.1)',
    successBorder: 'rgba(22, 163, 74, 0.3)',
    warning: '#d97706',
    warningBg: 'rgba(217, 119, 6, 0.1)',
    danger: '#dc2626',
    dangerBg: 'rgba(220, 38, 38, 0.1)',
    dangerHoverBg: 'rgba(220, 38, 38, 0.15)',
    primary: '#6366f1',
    primaryShadow: 'rgba(99, 102, 241, 0.2)',
    footer: '#94a3b8',
    heroText: '#fff',
    heroSubtext: 'rgba(255, 255, 255, 0.9)',
    iconBg: 'rgba(255, 255, 255, 0.2)',
    iconBgLight: 'rgba(255, 255, 255, 0.3)',
    videoCardBg: 'rgba(22, 163, 74, 0.1)',
    loadingBg: 'rgba(99, 102, 241, 0.1)',
    alertBg: '#ffffff',
    alertShadow: 'rgba(0, 0, 0, 0.15)',
    alertBtn: '#6366f1',
    scrollbarThumb: '#cbd5e1',
    scrollbarThumbHover: '#94a3b8',
  };

  // Redirect if not logged in or not admin
  useEffect(() => {
    if (!isLoggedIn || !isAdmin) {
      history.push('/signin');
    }
  }, [isLoggedIn, isAdmin, history]);

  if (!isLoggedIn || !isAdmin) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: '16px'
          }}>
            <IonSpinner name="crescent" color="primary" />
            <IonText color="medium">
              <p style={{ fontSize: '14px' }}>Checking permissions...</p>
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
      <IonHeader translucent style={{ background: isDarkMode ? 'transparent' : colors.bg }}>
        <IonToolbar style={{ 
          background: isDarkMode ? 'transparent' : colors.bg,
          '--border-width': '0px'
        }}>
          <BackButton />
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '0 8px' 
          }}>
            <IonTitle style={{ 
              color: isDarkMode ? '#fff' : colors.text, 
              fontWeight: '600',
              fontSize: '18px',
              letterSpacing: '-0.3px',
              textAlign: 'center'
            }}>
              Edit Event
            </IonTitle>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding" style={{ background: isDarkMode ? 'transparent' : colors.bg }}>
        {/* Hero Section */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
          borderRadius: '24px',
          padding: '32px 24px',
          marginBottom: '24px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(102, 126, 234, 0.3)'
        }}>
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)'
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-30px',
            left: '-30px',
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px)'
          }} />

          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(20px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            }}>
              <IonIcon icon={calendar} style={{ color: '#fff', fontSize: '32px' }} />
            </div>
            <h1 style={{
              margin: '0 0 8px 0',
              fontSize: '24px',
              fontWeight: '700',
              color: '#fff',
              letterSpacing: '-0.5px'
            }}>
              Edit Event
            </h1>
            <p style={{
              margin: '0',
              color: 'rgba(255, 255, 255, 0.85)',
              fontSize: '14px',
              fontWeight: '400'
            }}>
              Update event details and settings
            </p>
          </div>
        </div>

        {/* Status Toggle */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : colors.tabBg,
          borderRadius: '16px',
          padding: '4px',
        }}>
          <button
            onClick={() => handleInputChange('status', 'draft')}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '12px',
              border: 'none',
              background: formData.status === 'draft' 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                : 'transparent',
              color: formData.status === 'draft' ? '#fff' : (isDarkMode ? 'rgba(255, 255, 255, 0.6)' : colors.textLight),
              fontSize: '14px',
              fontWeight: formData.status === 'draft' ? '600' : '400',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <IonIcon icon={informationCircle} style={{ fontSize: '16px' }} />
            Draft
          </button>
          <button
            onClick={() => handleInputChange('status', 'published')}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '12px',
              border: 'none',
              background: formData.status === 'published' 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                : 'transparent',
              color: formData.status === 'published' ? '#fff' : (isDarkMode ? 'rgba(255, 255, 255, 0.6)' : colors.textLight),
              fontSize: '14px',
              fontWeight: formData.status === 'published' ? '600' : '400',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <IonIcon icon={checkmarkCircle} style={{ fontSize: '16px' }} />
            Published
          </button>
        </div>

        {/* Form Fields */}
        <div style={{
          background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : colors.cardBg,
          backdropFilter: isDarkMode ? 'blur(20px)' : 'none',
          borderRadius: '20px',
          padding: '24px',
          marginBottom: '24px',
          border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : `1px solid ${colors.cardBorder}`,
          boxShadow: isDarkMode ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}>
          {/* Title */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : colors.textSecondary,
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Event Title <span style={{ color: colors.error }}>*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter event title"
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '12px',
                border: `2px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.15)' : colors.inputBorder}`,
                background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : colors.inputBg,
                color: isDarkMode ? '#fff' : colors.text,
                fontSize: '15px',
                outline: 'none',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.boxShadow = `0 0 0 3px ${colors.primaryShadow}`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.15)' : colors.inputBorder;
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Date and Time Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : colors.textSecondary,
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Date <span style={{ color: colors.error }}>*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: `2px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.15)' : colors.inputBorder}`,
                  background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : colors.inputBg,
                  color: isDarkMode ? '#fff' : colors.text,
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.boxShadow = `0 0 0 3px ${colors.primaryShadow}`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.15)' : colors.inputBorder;
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : colors.textSecondary,
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Start Time <span style={{ color: colors.error }}>*</span>
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => handleInputChange('time', e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: `2px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.15)' : colors.inputBorder}`,
                  background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : colors.inputBg,
                  color: isDarkMode ? '#fff' : colors.text,
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.boxShadow = `0 0 0 3px ${colors.primaryShadow}`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.15)' : colors.inputBorder;
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* End Time */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : colors.textSecondary,
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              End Time
            </label>
            <input
              type="time"
              value={formData.endTime}
              onChange={(e) => handleInputChange('endTime', e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '12px',
                border: `2px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.15)' : colors.inputBorder}`,
                background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : colors.inputBg,
                color: isDarkMode ? '#fff' : colors.text,
                fontSize: '15px',
                outline: 'none',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.boxShadow = `0 0 0 3px ${colors.primaryShadow}`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.15)' : colors.inputBorder;
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Location */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : colors.textSecondary,
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Location <span style={{ color: colors.error }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Enter event location"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  paddingLeft: '44px',
                  borderRadius: '12px',
                  border: `2px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.15)' : colors.inputBorder}`,
                  background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : colors.inputBg,
                  color: isDarkMode ? '#fff' : colors.text,
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.boxShadow = `0 0 0 3px ${colors.primaryShadow}`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.15)' : colors.inputBorder;
                  e.target.style.boxShadow = 'none';
                }}
              />
              <IonIcon icon={locationIcon} style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : colors.textMuted,
                fontSize: '18px'
              }} />
            </div>
          </div>

          {/* Capacity and Organizer Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : colors.textSecondary,
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Capacity
              </label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => handleInputChange('capacity', e.target.value)}
                placeholder="Max attendees"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: `2px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.15)' : colors.inputBorder}`,
                  background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : colors.inputBg,
                  color: isDarkMode ? '#fff' : colors.text,
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.boxShadow = `0 0 0 3px ${colors.primaryShadow}`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.15)' : colors.inputBorder;
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : colors.textSecondary,
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Organizer
              </label>
              <input
                type="text"
                value={formData.organizer}
                onChange={(e) => handleInputChange('organizer', e.target.value)}
                placeholder="Event organizer"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: `2px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.15)' : colors.inputBorder}`,
                  background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : colors.inputBg,
                  color: isDarkMode ? '#fff' : colors.text,
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.boxShadow = `0 0 0 3px ${colors.primaryShadow}`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.15)' : colors.inputBorder;
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* Contact Info */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : colors.textSecondary,
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Contact Information
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={formData.contactInfo}
                onChange={(e) => handleInputChange('contactInfo', e.target.value)}
                placeholder="Phone or email for inquiries"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  paddingLeft: '44px',
                  borderRadius: '12px',
                  border: `2px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.15)' : colors.inputBorder}`,
                  background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : colors.inputBg,
                  color: isDarkMode ? '#fff' : colors.text,
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.boxShadow = `0 0 0 3px ${colors.primaryShadow}`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.15)' : colors.inputBorder;
                  e.target.style.boxShadow = 'none';
                }}
              />
              <IonIcon icon={call} style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : colors.textMuted,
                fontSize: '18px'
              }} />
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : colors.textSecondary,
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the event details and purpose"
              rows={4}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '12px',
                border: `2px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.15)' : colors.inputBorder}`,
                background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : colors.inputBg,
                color: isDarkMode ? '#fff' : colors.text,
                fontSize: '15px',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                transition: 'all 0.2s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.boxShadow = `0 0 0 3px ${colors.primaryShadow}`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.15)' : colors.inputBorder;
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Thumbnail Upload */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : colors.textSecondary,
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Thumbnail
            </label>
            <input
              ref={thumbnailInputRef}
              type="file"
              accept="image/*"
              onChange={handleThumbnailChange}
              style={{ display: 'none' }}
            />
            {!formData.thumbnailFile && !thumbnailPreview && !currentThumbnailUrl ? (
              <div
                onClick={() => thumbnailInputRef.current?.click()}
                style={{
                  border: `2px dashed ${isDarkMode ? 'rgba(255, 255, 255, 0.3)' : colors.dropzoneBorder}`,
                  borderRadius: '16px',
                  padding: '32px 24px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  background: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : colors.dropzoneBg
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.5)' : colors.dropzoneHoverBorder;
                  e.currentTarget.style.background = isDarkMode ? 'rgba(255, 255, 255, 0.06)' : colors.dropzoneHoverBg;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.3)' : colors.dropzoneBorder;
                  e.currentTarget.style.background = isDarkMode ? 'rgba(255, 255, 255, 0.03)' : colors.dropzoneBg;
                }}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : colors.iconBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px'
                }}>
                  <IonIcon icon={image} style={{ color: isDarkMode ? '#fff' : colors.textSecondary, fontSize: '24px' }} />
                </div>
                <p style={{
                  margin: '0 0 4px 0',
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : colors.textSecondary,
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Upload thumbnail image
                </p>
                <p style={{
                  margin: '0',
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.4)' : colors.textMuted,
                  fontSize: '12px'
                }}>
                  Optional • Max 5MB • JPG, PNG, WebP
                </p>
              </div>
            ) : (
              <div style={{
                borderRadius: '16px',
                overflow: 'hidden',
                background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : colors.inputBg,
                border: `2px solid ${isDarkMode ? 'rgba(102, 126, 234, 0.3)' : colors.primary}`
              }}>
                <img
                  src={thumbnailPreview || currentThumbnailUrl || ''}
                  alt="Thumbnail preview"
                  style={{
                    width: '100%',
                    height: '200px',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                />
                <div style={{
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <IonIcon icon={image} style={{ color: colors.primary, fontSize: '16px' }} />
                    <span style={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : colors.textSecondary, fontSize: '13px' }}>
                      {formData.thumbnailFile?.name || 'Current thumbnail'}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setFormData(prev => ({ ...prev, thumbnailFile: null }));
                      setThumbnailPreview(null);
                      if (thumbnailInputRef.current) {
                        thumbnailInputRef.current.value = '';
                      }
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      background: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : colors.dangerBg,
                      color: colors.danger,
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = isDarkMode ? 'rgba(239, 68, 68, 0.3)' : colors.dangerHoverBg;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = isDarkMode ? 'rgba(239, 68, 68, 0.2)' : colors.dangerBg;
                    }}
                  >
                    <IonIcon icon={closeCircle} style={{ fontSize: '14px' }} />
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Video Upload */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : colors.textSecondary,
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Event Video
            </label>
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
                onClick={() => videoInputRef.current?.click()}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                style={{
                  border: dragActive 
                    ? '2px dashed #667eea' 
                    : `2px dashed ${isDarkMode ? 'rgba(255, 255, 255, 0.3)' : colors.dropzoneBorder}`,
                  borderRadius: '16px',
                  padding: '40px 24px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  background: dragActive 
                    ? 'rgba(102, 126, 234, 0.1)' 
                    : (isDarkMode ? 'rgba(255, 255, 255, 0.03)' : colors.dropzoneBg),
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  if (!dragActive) {
                    e.currentTarget.style.borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.5)' : colors.dropzoneHoverBorder;
                    e.currentTarget.style.background = isDarkMode ? 'rgba(255, 255, 255, 0.06)' : colors.dropzoneHoverBg;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!dragActive) {
                    e.currentTarget.style.borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.3)' : colors.dropzoneBorder;
                    e.currentTarget.style.background = isDarkMode ? 'rgba(255, 255, 255, 0.03)' : colors.dropzoneBg;
                  }
                }}
              >
                {dragActive && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(102, 126, 234, 0.1)',
                    border: '2px dashed #667eea',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1
                  }}>
                    <IonText color="primary">
                      <p style={{ fontWeight: '600', margin: 0, color: '#667eea' }}>Drop video here</p>
                    </IonText>
                  </div>
                )}
                <div style={{ position: 'relative', zIndex: dragActive ? 0 : 1 }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '14px',
                    background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : colors.iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px'
                  }}>
                    <IonIcon icon={film} style={{ color: isDarkMode ? '#fff' : colors.textSecondary, fontSize: '28px' }} />
                  </div>
                  <p style={{
                    margin: '0 0 8px 0',
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : colors.textSecondary,
                    fontSize: '15px',
                    fontWeight: '500'
                  }}>
                    Drag & drop your video here
                  </p>
                  <p style={{
                    margin: '0 0 16px 0',
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : colors.textMuted,
                    fontSize: '13px'
                  }}>
                    or click to browse (max 100MB)
                  </p>
                  <span style={{
                    padding: '8px 20px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: '500'
                  }}>
                    Choose Video
                  </span>
                </div>
              </div>
            ) : (
              <div style={{
                borderRadius: '16px',
                overflow: 'hidden',
                background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : colors.videoCardBg,
                border: `2px solid ${isDarkMode ? 'rgba(34, 197, 94, 0.3)' : colors.successBorder}`
              }}>
                {videoPreview && (
                  <video
                    src={videoPreview}
                    controls
                    style={{
                      width: '100%',
                      maxHeight: '250px',
                      objectFit: 'contain',
                      background: '#000'
                    }}
                  />
                )}
                <div style={{
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: isDarkMode ? 'rgba(34, 197, 94, 0.2)' : colors.videoCardBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <IonIcon icon={checkmarkCircle} style={{ color: colors.success, fontSize: '20px' }} />
                    </div>
                    <div>
                      <p style={{
                        margin: 0,
                        color: isDarkMode ? '#fff' : colors.text,
                        fontSize: '14px',
                        fontWeight: '500',
                        maxWidth: '250px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {formData.videoFile?.name || 'Current video'}
                      </p>
                      <p style={{
                        margin: '4px 0 0 0',
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : colors.textMuted,
                        fontSize: '12px'
                      }}>
                        {formData.videoFile && (formData.videoFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setFormData(prev => ({ ...prev, videoFile: null }));
                      setVideoPreview(null);
                      if (videoInputRef.current) {
                        videoInputRef.current.value = '';
                      }
                    }}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      border: 'none',
                      background: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : colors.dangerBg,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = isDarkMode ? 'rgba(239, 68, 68, 0.3)' : colors.dangerHoverBg;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = isDarkMode ? 'rgba(239, 68, 68, 0.2)' : colors.dangerBg;
                    }}
                  >
                    <IonIcon icon={closeCircle} style={{ color: colors.danger, fontSize: '18px' }} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <button 
          onClick={handleSave} 
          disabled={loading}
          style={{
            width: '100%',
            padding: '16px 32px',
            borderRadius: '16px',
            border: 'none',
            background: loading 
              ? (isDarkMode ? 'rgba(255, 255, 255, 0.2)' : colors.loadingBg)
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
            color: '#fff',
            fontSize: '16px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading 
              ? 'none' 
              : '0 8px 32px rgba(102, 126, 234, 0.4), 0 2px 8px rgba(102, 126, 234, 0.2)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: loading ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            letterSpacing: '0.3px',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(102, 126, 234, 0.5), 0 4px 12px rgba(102, 126, 234, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(102, 126, 234, 0.4), 0 2px 8px rgba(102, 126, 234, 0.2)';
            }
          }}
          onMouseDown={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = 'scale(0.98)';
            }
          }}
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

        {/* Footer */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: '32px', 
          marginBottom: '20px' 
        }}>
          <IonText style={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.4)' : colors.footer, fontSize: '12px' }}>
            Dove Church • Event Management System
          </IonText>
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
          cssClass="modern-alert"
        />
      </IonContent>

      <style>{`
        .modern-alert {
          --background: ${colors.alertBg};
          --color: ${isDarkMode ? '#fff' : colors.text};
          --border-radius: 16px;
          --box-shadow: 0 20px 60px ${colors.alertShadow};
        }
        .modern-alert .alert-title {
          font-weight: 600;
          font-size: 18px;
        }
        .modern-alert .alert-message {
          font-size: 14px;
          line-height: 1.5;
        }
        .modern-alert .alert-button {
          color: ${colors.alertBtn};
          font-weight: 600;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: ${colors.scrollbarThumb};
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: ${colors.scrollbarThumbHover};
        }

        /* Input focus animations */
        input:focus, textarea:focus {
          transition: all 0.2s ease;
        }

        /* Button ripple effect */
        button:active {
          transition: all 0.1s ease;
        }
      `}</style>
    </IonPage>
  );
};

export default EditEvent;