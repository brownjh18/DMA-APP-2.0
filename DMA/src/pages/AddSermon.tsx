import React, { useState, useEffect, useContext } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonIcon,
  IonButton,
  IonLoading,
  IonAlert,
  IonText,
  IonSpinner
} from '@ionic/react';
import {
  save,
  videocam,
  closeCircle,
  image,
  cloudUpload,
  link,
  checkmarkCircle,
  film,
  warning,
  arrowBack
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { apiService } from '../services/api';

import { AuthContext } from '../App';
import { useSettings } from '../contexts/SettingsContext';
import './AdminForm.css';
import './AdminDashboard.css';

const AddSermon: React.FC = () => {
  const history = useHistory();
  const { isLoggedIn, isAdmin } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertHeader, setAlertHeader] = useState('Notice');
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [hasFetchedDetails, setHasFetchedDetails] = useState(false);
  const [formKey, setFormKey] = useState(Date.now());
  const [activeTab, setActiveTab] = useState<'upload' | 'external'>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const videoInputRef = React.useRef<HTMLInputElement>(null);
  const thumbnailInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      if (thumbnailPreview && thumbnailPreview.startsWith('blob:')) {
        URL.revokeObjectURL(thumbnailPreview);
      }
    };
  }, [previewUrl, thumbnailPreview]);

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
            <IonSpinner name="crescent" color="primary" />
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
    speaker: '',
    status: 'published',
    videoSource: 'upload',
    videoFile: null as File | null,
    videoUrl: '',
    duration: '00:00',
    viewCount: 0,
    thumbnailUrl: '',
    thumbnailFile: null as File | null
  });

  useEffect(() => {
    setFormData({
      title: '',
      description: '',
      speaker: '',
      status: 'published',
      videoSource: 'upload',
      videoFile: null,
      videoUrl: '',
      duration: '00:00',
      viewCount: 0,
      thumbnailUrl: '',
      thumbnailFile: null
    });
    setFormKey(Date.now());
    setFormErrors({});
    setTouched({});
    setPreviewUrl(null);
    setThumbnailPreview(null);
  }, []);

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

  useEffect(() => {
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = '';
    }
  }, [formKey]);

  const validateField = (field: string, value: string) => {
    switch (field) {
      case 'title':
        if (!value.trim()) return 'Title is required';
        if (value.length < 3) return 'Title must be at least 3 characters';
        break;
      case 'speaker':
        if (!value.trim()) return 'Speaker is required';
        if (value.length < 2) return 'Speaker name must be at least 2 characters';
        break;
      case 'videoUrl':
        if (formData.videoSource === 'external' && !value.trim()) {
          return 'Video URL is required';
        }
        break;
    }
    return '';
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field as keyof typeof formData] as string);
    setFormErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (touched[field]) {
      const error = validateField(field, value);
      setFormErrors(prev => ({ ...prev, [field]: error }));
    }

    if (field === 'videoSource') {
      setActiveTab(value as 'upload' | 'external');
      if (value === 'upload') {
        setHasFetchedDetails(false);
      }
    }
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;

    if (file && file.size > 100 * 1024 * 1024) {
      setAlertHeader('File Too Large');
      setAlertMessage('Video file size must be less than 100MB');
      setShowAlert(true);
      event.target.value = '';
      return;
    }

    setFormData(prev => ({ ...prev, videoFile: file }));
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
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
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setAlertHeader('Invalid File');
      setAlertMessage('Please drop a video file');
      setShowAlert(true);
    }
  };

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
        videoUrl: url,
        duration: details.duration || '00:00',
        viewCount: details.viewCount || 0,
        thumbnailUrl: details.thumbnailUrl || ''
      }));

      if (details.thumbnailUrl) {
        setThumbnailPreview(details.thumbnailUrl);
      }

      setHasFetchedDetails(true);
      setAlertHeader('Success');
      setAlertMessage('Video details fetched successfully!');
      setShowAlert(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch video details';
      setAlertHeader('API Error');
      if (errorMessage.includes('API not configured') || errorMessage.includes('YouTube API')) {
        setAlertMessage('YouTube API is not configured. You can still save the sermon with manual entry.');
      } else {
        setAlertMessage(errorMessage || 'Failed to fetch video details. Please enter the details manually.');
      }
      setShowAlert(true);
    } finally {
      setFetchingDetails(false);
    }
  };

  const handleSave = async () => {
    const newTouched = { title: true, speaker: true };
    const newErrors: Record<string, string> = {};

    newErrors.title = validateField('title', formData.title);
    newErrors.speaker = validateField('speaker', formData.speaker);

    if (formData.videoSource === 'external') {
      newErrors.videoUrl = validateField('videoUrl', formData.videoUrl);
    } else if (!formData.videoFile) {
      newErrors.videoFile = 'Please select a video file';
    }

    setTouched(newTouched);
    setFormErrors(newErrors);

    if (Object.values(newErrors).some(error => error)) {
      setAlertHeader('Validation Error');
      setAlertMessage('Please fill in all required fields correctly');
      setShowAlert(true);
      return;
    }

    setLoading(true);

    try {
      let videoUrl = '';
      let thumbnailUrl = '';
      let videoDuration = '00:00';

      if (formData.thumbnailFile) {
        const thumbnailFormData = new FormData();
        thumbnailFormData.append('thumbnailFile', formData.thumbnailFile);
        const thumbnailResponse = await apiService.uploadThumbnail(thumbnailFormData);
        thumbnailUrl = thumbnailResponse.thumbnailUrl;
      }

      if (formData.videoSource === 'upload') {
        setUploadingVideo(true);
        const videoFormData = new FormData();
        videoFormData.append('video', formData.videoFile!);

        const uploadResponse = await apiService.uploadSermonVideo(videoFormData);
        videoUrl = uploadResponse.videoUrl;
        thumbnailUrl = uploadResponse.thumbnailUrl || thumbnailUrl;
        videoDuration = uploadResponse.duration || '00:00';
        setUploadingVideo(false);
      } else {
        videoUrl = formData.videoUrl.trim();
        thumbnailUrl = formData.thumbnailUrl || thumbnailUrl;
        videoDuration = formData.duration;
      }

      const sermonData = {
        title: formData.title,
        speaker: formData.speaker,
        description: formData.description,
        videoUrl: videoUrl,
        thumbnailUrl: thumbnailUrl || formData.thumbnailUrl || undefined,
        duration: videoDuration,
        viewCount: formData.viewCount,
        isPublished: formData.status === 'published'
      };

      await apiService.createSermon(sermonData);

      setLoading(false);

      setAlertHeader('Success!');
      setAlertMessage(`Sermon "${formData.title}" uploaded successfully!`);
      setShowAlert(true);

      sessionStorage.setItem('sermonsNeedRefresh', 'true');

      setTimeout(() => {
        history.push('/admin/sermons');
      }, 2000);
    } catch (error) {
      setLoading(false);
      setUploadingVideo(false);
      setAlertHeader('Error');
      setAlertMessage(error instanceof Error ? error.message : 'Failed to add sermon');
      setShowAlert(true);
    }
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <IonButton fill="clear" slot="start" onClick={() => history.goBack()} style={{ marginLeft: '4px' }}>
            <IonIcon icon={arrowBack} style={{ fontSize: '22px' }} />
          </IonButton>
          <IonTitle className="title-ios" style={{ textAlign: 'left', marginLeft: '-16px' }}>Add Sermon</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding">
        <div className="af-page">
          <div className="af-section">
            <h2 className="af-section-title">Upload New Sermon</h2>
          </div>

          {/* Video Source Tabs */}
          <div className="af-section">
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              <button
                onClick={() => handleInputChange('videoSource', 'upload')}
                className={`af-submit ${activeTab === 'upload' ? '' : 'af-submit-secondary'}`}
                type="button"
              >
                <IonIcon icon={cloudUpload} />
                Upload File
              </button>
              <button
                onClick={() => handleInputChange('videoSource', 'external')}
                className={`af-submit ${activeTab === 'external' ? '' : 'af-submit-secondary'}`}
                type="button"
              >
                <IonIcon icon={link} />
                External Link
              </button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="af-card">
            {/* Title */}
            <div className="af-field">
              <label className="af-label">
                Sermon Title <span className="af-required">*</span>
              </label>
              <input
                type="text"
                className={`af-input ${touched.title && formErrors.title ? 'af-input-error' : ''}`}
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                onBlur={() => handleBlur('title')}
                placeholder="Enter sermon title"
              />
              {touched.title && formErrors.title && (
                <p className="af-hint" style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <IonIcon icon={warning} style={{ fontSize: '12px' }} />
                  {formErrors.title}
                </p>
              )}
            </div>

            {/* Speaker */}
            <div className="af-field">
              <label className="af-label">
                Speaker <span className="af-required">*</span>
              </label>
              <input
                type="text"
                className={`af-input ${touched.speaker && formErrors.speaker ? 'af-input-error' : ''}`}
                value={formData.speaker}
                onChange={(e) => handleInputChange('speaker', e.target.value)}
                onBlur={() => handleBlur('speaker')}
                placeholder="Enter speaker name"
              />
              {touched.speaker && formErrors.speaker && (
                <p className="af-hint" style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <IonIcon icon={warning} style={{ fontSize: '12px' }} />
                  {formErrors.speaker}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="af-field">
              <label className="af-label">Description</label>
              <textarea
                className="af-input af-textarea"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter sermon description or notes"
                rows={4}
              />
            </div>

            {/* Video Upload / External URL */}
            {activeTab === 'upload' ? (
              <div className="af-field">
                <label className="af-label">
                  Video File <span className="af-required">*</span>
                </label>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  style={{ display: 'none' }}
                />
                {!formData.videoFile ? (
                  <div
                    className={`af-upload ${dragActive ? 'af-upload-drag-active' : ''}`}
                    onClick={() => videoInputRef.current?.click()}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <IonIcon icon={film} className="af-upload-icon" />
                    <p className="af-upload-text">
                      {dragActive ? 'Drop video here' : 'Drag & drop your video here'}
                    </p>
                    <p className="af-upload-hint">or click to browse (max 100MB)</p>
                  </div>
                ) : (
                  <div className="af-card">
                    {previewUrl && (
                      <video
                        src={previewUrl}
                        controls
                        className="af-upload-preview"
                        style={{ maxHeight: '250px', objectFit: 'contain', background: '#000' }}
                      />
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <IonIcon icon={checkmarkCircle} style={{ color: '#22c55e', fontSize: '20px' }} />
                        <div>
                          <p style={{ margin: 0, fontSize: '14px', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '250px' }}>
                            {formData.videoFile.name}
                          </p>
                          <p className="af-hint">
                            {(formData.videoFile.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, videoFile: null }));
                          setPreviewUrl(null);
                          if (videoInputRef.current) {
                            videoInputRef.current.value = '';
                          }
                        }}
                        className="af-submit af-submit-danger"
                        style={{ width: '36px', height: '36px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}
                      >
                        <IonIcon icon={closeCircle} />
                      </button>
                    </div>
                  </div>
                )}
                {formErrors.videoFile && (
                  <p className="af-hint" style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <IonIcon icon={warning} style={{ fontSize: '12px' }} />
                    {formErrors.videoFile}
                  </p>
                )}
              </div>
            ) : (
              <div className="af-field">
                <label className="af-label">
                  Video URL <span className="af-required">*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="url"
                    className={`af-input ${touched.videoUrl && formErrors.videoUrl ? 'af-input-error' : ''}`}
                    value={formData.videoUrl}
                    onChange={(e) => handleInputChange('videoUrl', e.target.value)}
                    onBlur={() => handleBlur('videoUrl')}
                    placeholder="https://youtube.com/watch?v=..."
                    disabled={fetchingDetails}
                    style={{ paddingRight: fetchingDetails ? '50px' : undefined }}
                  />
                  {fetchingDetails && (
                    <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)' }}>
                      <IonSpinner name="crescent" color="primary" style={{ width: '20px', height: '20px' }} />
                    </div>
                  )}
                </div>
                {touched.videoUrl && formErrors.videoUrl && (
                  <p className="af-hint" style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <IonIcon icon={warning} style={{ fontSize: '12px' }} />
                    {formErrors.videoUrl}
                  </p>
                )}
                {hasFetchedDetails && (
                  <div className="af-hint" style={{ color: '#22c55e', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                    <IonIcon icon={checkmarkCircle} style={{ fontSize: '16px' }} />
                    Video details fetched successfully
                  </div>
                )}
              </div>
            )}

            {/* Thumbnail Upload */}
            <div className="af-field">
              <label className="af-label">Thumbnail</label>
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/*"
                onChange={handleThumbnailChange}
                style={{ display: 'none' }}
              />
              {!formData.thumbnailFile && !thumbnailPreview ? (
                <div
                  className="af-upload"
                  onClick={() => thumbnailInputRef.current?.click()}
                >
                  <IonIcon icon={image} className="af-upload-icon" />
                  <p className="af-upload-text">Upload thumbnail image</p>
                  <p className="af-upload-hint">Optional - Max 5MB - JPG, PNG, WebP</p>
                </div>
              ) : (
                <div className="af-card" style={{ padding: 0, overflow: 'hidden' }}>
                  <img
                    src={thumbnailPreview || formData.thumbnailUrl}
                    alt="Thumbnail preview"
                    className="af-upload-preview"
                    style={{ marginTop: 0 }}
                  />
                  <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <IonIcon icon={image} style={{ fontSize: '16px' }} />
                      <span className="af-hint">
                        {formData.thumbnailFile?.name || 'From video'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, thumbnailFile: null, thumbnailUrl: '' }));
                        setThumbnailPreview(null);
                        if (thumbnailInputRef.current) {
                          thumbnailInputRef.current.value = '';
                        }
                      }}
                      className="af-submit af-submit-danger"
                      style={{ width: 'auto', padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <IonIcon icon={closeCircle} style={{ fontSize: '14px' }} />
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Status */}
            <div className="af-field">
              <label className="af-label">Status</label>
              <div className="af-toggle-row">
                <span className="af-toggle-label">
                  {formData.status === 'published' ? 'Published' : 'Draft'}
                </span>
                <div
                  className={`af-toggle ${formData.status === 'published' ? 'active' : ''}`}
                  onClick={() => handleInputChange('status', formData.status === 'published' ? 'draft' : 'published')}
                >
                  <div className="af-toggle-knob" />
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            className="af-submit"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? (
              <>
                <IonSpinner name="crescent" color="white" style={{ width: '20px', height: '20px' }} />
                <span>{uploadingVideo ? 'Uploading Video...' : 'Saving Sermon...'}</span>
              </>
            ) : (
              <>
                <IonIcon icon={save} style={{ fontSize: '20px' }} />
                <span>Save Sermon</span>
              </>
            )}
          </button>

          {/* Footer */}
          <div className="af-footer">
            <IonText>
              Dove Church - Sermon Management System
            </IonText>
          </div>
        </div>

        <IonLoading
          isOpen={loading}
          message={uploadingVideo ? "Uploading video..." : "Saving sermon..."}
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

export default AddSermon;
