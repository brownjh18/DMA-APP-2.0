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

    setLoading(true);
    try {
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

      if (thumbnailPreview) {
        const thumbInput = thumbnailInputRef.current;
        if (thumbInput && thumbInput.files && thumbInput.files[0]) {
          formDataToSend.append('thumbnailFile', thumbInput.files[0]);
        }
      }

      await apiService.createPodcast(formDataToSend);
      setLoading(false);
      setAlertHeader('Success!');
      setAlertMessage('Podcast created successfully!');
      setShowAlert(true);
      sessionStorage.setItem('podcastsNeedRefresh', 'true');
      setTimeout(() => history.push('/admin/radio'), 1500);
    } catch (error) {
      setLoading(false);
      setAlertHeader('Error');
      setAlertMessage(error instanceof Error ? error.message : 'Failed to create podcast');
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
          <IonTitle className="title-ios" style={{ textAlign: 'left', marginLeft: '-16px' }}>Add Podcast</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding">
        <div className="af-page">
          {/* Hero Section */}
          <div className="af-section">
            <h1 className="nd-title" style={{ textAlign: 'center', marginBottom: '8px' }}>Add New Podcast</h1>
            <p style={{ textAlign: 'center', color: 'var(--ion-color-medium)', fontSize: '14px', margin: 0 }}>Create a new radio broadcast podcast</p>
          </div>

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
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                {['draft', 'published', 'scheduled'].map((s) => (
                  <button key={s} onClick={() => handleInputChange('status', s)}
                    className={`af-submit ${formData.status === s ? '' : 'af-submit-secondary'}`}
                    style={{ flex: 1, padding: '8px', fontSize: '13px', textTransform: 'capitalize' }}>
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

        <IonLoading isOpen={loading} message="Creating podcast..." duration={0} />
        <IonAlert isOpen={showAlert} onDidDismiss={() => setShowAlert(false)} header={alertHeader} message={alertMessage} buttons={[{ text: 'OK', role: 'cancel' }]} />
      </IonContent>
    </IonPage>
  );
};

export default AddPodcast;
