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
  videocam,
  closeCircle,
  image,
  cloudUpload,
  link,
  checkmarkCircle,
  film,
  warning
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

const EditSermon: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const { id } = useParams<RouteParams>();
  const { isLoggedIn, isAdmin } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertHeader, setAlertHeader] = useState('Notice');
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [hasFetchedDetails, setHasFetchedDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'external'>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
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
    series: '',
    status: 'draft',
    videoSource: 'upload',
    videoFile: null as File | null,
    videoUrl: '',
    existingVideoUrl: '',
    duration: '00:00',
    viewCount: 0,
    thumbnailUrl: '',
    thumbnailFile: null as File | null
  });

  useEffect(() => {
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
      setActiveTab(videoSource);
      if (sermon.thumbnailUrl) {
        setThumbnailPreview(sermon.thumbnailUrl);
      }
    } else {
      loadSermon();
    }
  }, [location.state]);

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
      setActiveTab(videoSource);
      if (sermon.thumbnailUrl) {
        setThumbnailPreview(sermon.thumbnailUrl);
      }
    } catch (error) {
      console.log('API load failed, using navigation state data');
    }
  };

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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

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

  const handleSave = async () => {
    if (!formData.title || !formData.speaker) {
      setAlertHeader('Validation Error');
      setAlertMessage('Please fill in all required fields (Title, Speaker)');
      setShowAlert(true);
      return;
    }

    if (formData.videoSource === 'upload' && !formData.videoFile && !formData.existingVideoUrl) {
      setAlertHeader('Validation Error');
      setAlertMessage('Please select a video file to upload');
      setShowAlert(true);
      return;
    }
    if (formData.videoSource === 'external' && !formData.videoUrl.trim()) {
      setAlertHeader('Validation Error');
      setAlertMessage('Please enter a video URL');
      setShowAlert(true);
      return;
    }

    setLoading(true);

    try {
      let videoUrl = formData.existingVideoUrl;
      let thumbnailUrl = formData.thumbnailUrl;

      if (formData.thumbnailFile) {
        const thumbnailFormData = new FormData();
        thumbnailFormData.append('thumbnailFile', formData.thumbnailFile);
        const thumbnailResponse = await apiService.uploadThumbnail(thumbnailFormData);
        thumbnailUrl = thumbnailResponse.thumbnailUrl;
      }

      if (formData.videoSource === 'upload') {
        if (formData.videoFile) {
          setUploadingVideo(true);
          const videoFormData = new FormData();
          videoFormData.append('video', formData.videoFile);

          const uploadResponse = await apiService.uploadSermonVideo(videoFormData);
          videoUrl = uploadResponse.videoUrl;
          setUploadingVideo(false);
        }
      } else {
        videoUrl = formData.videoUrl.trim();
      }

      const sermonData = {
        title: formData.title,
        speaker: formData.speaker,
        description: formData.description,
        series: formData.series,
        videoUrl: videoUrl,
        thumbnailUrl: thumbnailUrl || undefined,
        isPublished: formData.status === 'published'
      };

      if (formData.videoSource === 'external' && videoUrl && (!formData.existingVideoUrl || formData.existingVideoUrl !== videoUrl)) {
        if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
          const videoId = videoUrl.includes('youtu.be/')
            ? videoUrl.split('youtu.be/')[1]?.split('?')[0]
            : videoUrl.split('v=')[1]?.split('&')[0];

          if (videoId) {
            (sermonData as any).thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
          }
        }
      }

      await apiService.updateSermon(id, sermonData);

      setLoading(false);

      setAlertHeader('Success!');
      setAlertMessage('Sermon updated successfully!');
      setShowAlert(true);

      sessionStorage.setItem('sermonsNeedRefresh', 'true');

      setTimeout(() => {
        history.push('/admin/sermons');
      }, 1500);
    } catch (error) {
      setLoading(false);
      setUploadingVideo(false);
      setAlertHeader('Error');
      setAlertMessage(error instanceof Error ? error.message : 'Failed to update sermon');
      setShowAlert(true);
    }
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios" style={{ background: 'transparent', '--border-width': '0px' } as any}>
          <BackButton />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px' }}>
            <IonTitle className="nd-title" style={{ textAlign: 'center' }}>
              Edit Sermon
            </IonTitle>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding">
        <div className="af-page">
          <div className="af-section">
            <h2 className="af-section-title">Edit Sermon</h2>
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
                className="af-input"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter sermon title"
              />
            </div>

            {/* Speaker */}
            <div className="af-field">
              <label className="af-label">
                Speaker <span className="af-required">*</span>
              </label>
              <input
                type="text"
                className="af-input"
                value={formData.speaker}
                onChange={(e) => handleInputChange('speaker', e.target.value)}
                placeholder="Enter speaker name"
              />
            </div>

            {/* Series */}
            <div className="af-field">
              <label className="af-label">Series</label>
              <input
                type="text"
                className="af-input"
                value={formData.series}
                onChange={(e) => handleInputChange('series', e.target.value)}
                placeholder="Enter sermon series (optional)"
              />
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
                <label className="af-label">Video File</label>
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
                {!formData.videoFile && !formData.existingVideoUrl ? (
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
                ) : formData.videoFile ? (
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
                            {formData.videoFile.name} (New)
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
                ) : (
                  <div className="af-card" style={{ textAlign: 'center', padding: '20px' }}>
                    <IonIcon icon={checkmarkCircle} style={{ color: '#22c55e', fontSize: '40px', marginBottom: '12px' }} />
                    <p style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '500' }}>
                      Current video file is preserved
                    </p>
                    <p className="af-hint">
                      Upload a new file to replace it
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="af-field">
                <label className="af-label">Video URL</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="url"
                    className="af-input"
                    value={formData.videoUrl}
                    onChange={(e) => handleInputChange('videoUrl', e.target.value)}
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
                        {formData.thumbnailFile?.name || (formData.thumbnailUrl ? 'From video' : 'Current')}
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
                <span>{uploadingVideo ? 'Uploading Video...' : 'Updating Sermon...'}</span>
              </>
            ) : (
              <>
                <IonIcon icon={save} style={{ fontSize: '20px' }} />
                <span>Update Sermon</span>
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
          message={uploadingVideo ? "Uploading video..." : "Updating sermon..."}
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

export default EditSermon;
