import React, { useState, useEffect, useContext } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonIcon,
  IonButton,
  IonAlert,
  IonText,
  IonSpinner
} from '@ionic/react';
import SaveProgressModal, { SaveProgressStep } from '../components/SaveProgressModal';
import {
  save,
  radio,
  closeCircle,
  image,
  musicalNote,
  checkmarkCircle,
  informationCircle,
  person,
  documentText,
  cloudUpload,
  arrowBack
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { apiService } from '../services/api';
import { AuthContext } from '../App';
import { useSettings } from '../contexts/SettingsContext';
import './AdminForm.css';
import './AdminDashboard.css';

const getAudioDuration = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    audio.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(url);
      const totalSeconds = Math.floor(audio.duration);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      resolve(hours > 0
        ? `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    });
    audio.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not load audio metadata'));
    });
  });
};

const AddPodcast: React.FC = () => {
  const history = useHistory();
  const { isLoggedIn, isAdmin } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveSteps, setSaveSteps] = useState<SaveProgressStep[]>([]);
  const [saveProgress, setSaveProgress] = useState(0);
  const [saveStatus, setSaveStatus] = useState<'uploading' | 'success' | 'error'>('uploading');
  const [saveError, setSaveError] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertHeader, setAlertHeader] = useState('Notice');
  const { isDarkMode } = useSettings();
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState<string>('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const thumbnailInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (thumbnailPreview && thumbnailPreview.startsWith('blob:')) {
        URL.revokeObjectURL(thumbnailPreview);
      }
    };
  }, [thumbnailPreview]);

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
            <IonText color="medium"><p>Checking permissions...</p></IonText>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  const [formData, setFormData] = useState({
    title: '', speaker: '', description: '', duration: '', status: 'draft'
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAudioSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
      if (file && file.size > 300 * 1024 * 1024) {
        setAlertHeader('Upload Error');
        setAlertMessage('Audio file size must be less than 300MB');
      setShowAlert(true);
      event.target.value = '';
      return;
    }
    if (file && !file.type.startsWith('audio/')) {
      setAlertHeader('Invalid File');
      setAlertMessage('Please select a valid audio file');
      setShowAlert(true);
      event.target.value = '';
      return;
    }
    if (file) {
      setAudioFileName(file.name);
      getAudioDuration(file).then(duration => {
        setFormData(prev => ({ ...prev, duration }));
      }).catch(() => {});
    }
  };

  const handleThumbnailSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
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
    if (file) {
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.speaker || !audioFileName) {
      setAlertHeader('Validation Error');
      setAlertMessage('Please fill in all required fields (Title, Speaker, Audio File)');
      setShowAlert(true);
      return;
    }

    const hasThumbnail = !!thumbnailPreview;
    const steps: SaveProgressStep[] = [
      ...(hasThumbnail ? [{ label: 'Uploading thumbnail', status: 'pending' as const }] : []),
      { label: 'Creating podcast', status: 'pending' as const }
    ];
    setSaveSteps(steps);
    setSaveProgress(0);
    setSaveStatus('uploading');
    setSaveError('');
    setShowSaveModal(true);
    setLoading(true);

    try {
      let currentStep = 0;
      const thumbSteps = hasThumbnail ? 1 : 0;
      const totalSteps = thumbSteps + 1;

      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('speaker', formData.speaker);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('duration', formData.duration);
      formDataToSend.append('status', formData.status);

      const audioInput = fileInputRef.current;
      if (audioInput && audioInput.files && audioInput.files[0]) {
        formDataToSend.append('audioFile', audioInput.files[0]);
      }

      if (hasThumbnail) {
        setSaveSteps(prev => prev.map((s, i) => i === 0 ? { ...s, status: 'active' } : s));
        const thumbInput = thumbnailInputRef.current;
        if (thumbInput && thumbInput.files && thumbInput.files[0]) {
          formDataToSend.append('thumbnailFile', thumbInput.files[0]);
        }
        currentStep++;
        setSaveProgress(Math.round((currentStep / totalSteps) * 100));
        setSaveSteps(prev => prev.map((s, i) => i === 0 ? { ...s, status: 'success' } : s));
      }

      setSaveSteps(prev => prev.map((s, i) => i === (hasThumbnail ? 1 : 0) ? { ...s, status: 'active' } : s));
      await apiService.createPodcast(formDataToSend);
      currentStep++;
      setSaveProgress(Math.round((currentStep / totalSteps) * 100));
      setSaveSteps(prev => prev.map((s, i) => i === (hasThumbnail ? 1 : 0) ? { ...s, status: 'success' } : s));

      setSaveStatus('success');
      setSaveProgress(100);
      sessionStorage.setItem('podcastsNeedRefresh', 'true');
      setTimeout(() => history.push('/admin/radio'), 1500);
    } catch (error) {
      setSaveStatus('error');
      setSaveError(error instanceof Error ? error.message : 'Failed to create podcast');
      setSaveSteps(prev => prev.map(s => s.status === 'active' ? { ...s, status: 'error' } : s));
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <IonButton fill="clear" slot="start" onClick={() => history.goBack()} style={{ marginLeft: '4px' }}>
            <IonIcon icon={arrowBack} style={{ fontSize: '22px' }} />
          </IonButton>
          <IonTitle className="title-ios" style={{ textAlign: 'left', marginLeft: '-16px' }}>Add Podcast</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding">
        <div className="af-page">
          {/* Status Toggle */}
          <div className="af-section">
            <div className="af-card">
              <div className="af-toggle-row">
                {['draft', 'published', 'scheduled'].map((s) => (
                  <button key={s} onClick={() => handleInputChange('status', s)} className={`af-toggle ${formData.status === s ? 'active' : ''}`}>
                    <span className="af-toggle-knob" />
                  </button>
                ))}
              </div>
              <div className="af-row" style={{ display: 'flex', gap: '12px', marginTop: '8px', justifyContent: 'center' }}>
                {['draft', 'published', 'scheduled'].map((s) => (
                  <button key={s} onClick={() => handleInputChange('status', s)}
                    className="role-btn"
                    style={{
                      ...(formData.status === s
                        ? s === 'published'
                          ? { background: 'rgba(16, 185, 129, 0.18)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' }
                          : s === 'scheduled'
                            ? { background: 'rgba(99, 102, 241, 0.18)', color: '#6366f1', borderColor: 'rgba(99, 102, 241, 0.3)' }
                            : { background: 'rgba(245, 158, 11, 0.18)', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.3)' }
                        : {}),
                      textTransform: 'capitalize',
                    }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="af-section">
            <div className="af-card">
              <div className="af-field">
                <label className="af-label">Podcast Title <span className="af-required">*</span></label>
                <input type="text" className="af-input" value={formData.title} onChange={(e) => handleInputChange('title', e.target.value)} placeholder="Enter podcast title" />
              </div>

              <div className="af-field">
                <label className="af-label">Speaker/Presenter <span className="af-required">*</span></label>
                <input type="text" className="af-input" value={formData.speaker} onChange={(e) => handleInputChange('speaker', e.target.value)} placeholder="Enter speaker name" />
              </div>

              <div className="af-field">
                <label className="af-label">Description</label>
                <textarea className="af-input af-textarea" value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} placeholder="Describe the podcast content" rows={4} />
              </div>

              {/* Audio File Upload */}
              <div className="af-field">
                <label className="af-label">Audio File <span className="af-required">*</span></label>
                <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleAudioSelect} style={{ display: 'none' }} />
                {!audioFileName ? (
                  <div className="af-upload" onClick={() => fileInputRef.current?.click()}>
                    <div className="af-upload-icon"><IonIcon icon={musicalNote} /></div>
                    <p className="af-upload-text">Upload audio file</p>
                    <p className="af-upload-hint">Required &bull; Max 300MB &bull; All audio formats</p>
                  </div>
                ) : (
                  <div className="af-upload" style={{ borderStyle: 'solid', borderColor: 'var(--ion-color-success, #22c55e)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="af-upload-icon"><IonIcon icon={musicalNote} /></div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p className="af-upload-text">{audioFileName}</p>
                        <p className="af-upload-hint">Audio file selected</p>
                      </div>
                      <button onClick={() => { setAudioFileName(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                        className="af-submit af-submit-danger" style={{ width: 'auto', padding: '6px 12px', fontSize: '12px' }}>
                        <IonIcon icon={closeCircle} /> Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Thumbnail Upload */}
              <div className="af-field">
                <label className="af-label">Podcast Thumbnail</label>
                <input ref={thumbnailInputRef} type="file" accept="image/*" onChange={handleThumbnailSelect} style={{ display: 'none' }} />
                {!thumbnailPreview ? (
                  <div className="af-upload" onClick={() => thumbnailInputRef.current?.click()}>
                    <div className="af-upload-icon"><IonIcon icon={image} /></div>
                    <p className="af-upload-text">Upload thumbnail image</p>
                    <p className="af-upload-hint">Optional &bull; Max 5MB &bull; JPG, PNG, WebP</p>
                  </div>
                ) : (
                  <div>
                    <img src={thumbnailPreview} alt="Thumbnail preview" className="af-upload-preview" />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                      <span className="af-upload-hint">Thumbnail selected</span>
                      <button onClick={() => { setThumbnailPreview(null); if (thumbnailInputRef.current) thumbnailInputRef.current.value = ''; }}
                        className="af-submit af-submit-danger" style={{ width: 'auto', padding: '6px 12px', fontSize: '12px' }}>
                        <IonIcon icon={closeCircle} /> Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button onClick={handleSave} disabled={loading} className="af-submit">
            {loading ? (
              <><IonSpinner name="crescent" color="white" style={{ width: '20px', height: '20px' }} /><span>Creating Podcast...</span></>
            ) : (
              <><IonIcon icon={save} style={{ fontSize: '20px' }} /><span>Create Podcast</span></>
            )}
          </button>

          {/* Footer */}
          <div className="af-footer">
            <IonText>Dove Church &bull; Podcast Management System</IonText>
          </div>
        </div>

        <SaveProgressModal
          isOpen={showSaveModal}
          steps={saveSteps}
          overallProgress={saveProgress}
          status={saveStatus}
          errorMessage={saveError}
          onDismiss={() => {
            setShowSaveModal(false);
            if (saveStatus === 'error') {
              setSaveSteps([]);
              setSaveProgress(0);
              setSaveError('');
            }
          }}
          title="Creating podcast..."
        />
        <IonAlert isOpen={showAlert} onDidDismiss={() => setShowAlert(false)} header={alertHeader} message={alertMessage} buttons={[{ text: 'OK', role: 'cancel' }]} />
      </IonContent>
    </IonPage>
  );
};

export default AddPodcast;
