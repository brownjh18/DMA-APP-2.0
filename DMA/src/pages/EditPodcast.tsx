import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonIcon, IonButton, IonLoading, IonAlert, IonText, IonSpinner
} from '@ionic/react';
import {
  save, radio, closeCircle, image, musicalNote, checkmarkCircle, informationCircle, person,
  documentText, cloudUpload, arrowBack
} from 'ionicons/icons';
import { useHistory, useParams } from 'react-router-dom';
import { apiService, API_BASE_URL } from '../services/api';
import { AuthContext } from '../App';
import { useSettings } from '../contexts/SettingsContext';
import './AdminForm.css';
import './AdminDashboard.css';

interface PodcastData {
  id: string; title: string; speaker: string; description: string;
  duration: string; status: string; thumbnailUrl?: string; audioUrl?: string;
}

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

const EditPodcast: React.FC = () => {
  const history = useHistory();
  const { id } = useParams<{ id: string }>();
  const { isLoggedIn, isAdmin } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertHeader, setAlertHeader] = useState('Notice');
  const { isDarkMode } = useSettings();
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [audioFileName, setAudioFileName] = useState<string>('');
  const [thumbnailRemoved, setThumbnailRemoved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (thumbnailPreview && thumbnailPreview.startsWith('blob:')) {
        URL.revokeObjectURL(thumbnailPreview);
      }
    };
  }, [thumbnailPreview]);

  useEffect(() => {
    if (!isLoggedIn || !isAdmin) { history.push('/signin'); return; }
    loadPodcastData();
  }, [isLoggedIn, isAdmin, history, id]);

  const [formData, setFormData] = useState({
    title: '', speaker: '', description: '', duration: '', status: 'draft',
    thumbnailUrl: ''
  });

  const loadPodcastData = async () => {
    try {
      const data = await apiService.getPodcast(id);
      const podcast: PodcastData = {
        id: data.podcast.id, title: data.podcast.title, speaker: data.podcast.speaker,
        description: data.podcast.description,
        duration: data.podcast.duration, status: data.podcast.status,
        thumbnailUrl: data.podcast.thumbnailUrl, audioUrl: data.podcast.audioUrl
      };
      setFormData({
        title: podcast.title, speaker: podcast.speaker, description: podcast.description,
        duration: podcast.duration, status: podcast.status,
        thumbnailUrl: podcast.thumbnailUrl || ''
      });
      setThumbnailRemoved(false);
      if (podcast.audioUrl) setAudioFileName('Current audio file exists');
    } catch (error) {
      console.error('Error loading podcast data:', error);
      setAlertHeader('Error');
      setAlertMessage('Failed to load podcast data');
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAudioSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (file && file.size > 300 * 1024 * 1024) {
      setAlertHeader('Upload Error'); setAlertMessage('Audio file size must be less than 300MB'); setShowAlert(true);
      event.target.value = ''; return;
    }
    if (file && !file.type.startsWith('audio/')) {
      setAlertHeader('Invalid File');       setAlertMessage('Please select a valid audio file'); setShowAlert(true);
      event.target.value = ''; return;
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
      setAlertHeader('Upload Error'); setAlertMessage('Thumbnail file size must be less than 5MB'); setShowAlert(true);
      event.target.value = ''; return;
    }
    if (file && !file.type.startsWith('image/')) {
      setAlertHeader('Invalid File'); setAlertMessage('Please select a valid image file (JPEG, PNG, WebP)'); setShowAlert(true);
      event.target.value = ''; return;
    }
    if (file) {
      setThumbnailPreview(URL.createObjectURL(file));
      setThumbnailRemoved(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.speaker) {
      setAlertHeader('Validation Error'); setAlertMessage('Please fill in all required fields (Title, Speaker)'); setShowAlert(true);
      return;
    }
    setSaving(true);
    try {
      const hasFiles = fileInputRef.current?.files?.[0] || thumbnailInputRef.current?.files?.[0];
      if (hasFiles) {
        const formDataToSend = new FormData();
        formDataToSend.append('title', formData.title);
        formDataToSend.append('speaker', formData.speaker);
        formDataToSend.append('description', formData.description);
        formDataToSend.append('duration', formData.duration);
        formDataToSend.append('status', formData.status);
        if (fileInputRef.current?.files?.[0]) formDataToSend.append('audioFile', fileInputRef.current.files[0]);
        if (thumbnailInputRef.current?.files?.[0]) formDataToSend.append('thumbnailFile', thumbnailInputRef.current.files[0]);
        await apiService.updatePodcast(id, formDataToSend);
      } else {
        const updateData: any = { title: formData.title, speaker: formData.speaker, description: formData.description,
          duration: formData.duration, status: formData.status };
        if (thumbnailRemoved) {
          updateData.thumbnailUrl = '';
        }
        const response = await fetch(`${API_BASE_URL}/podcasts/${id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json',
            ...(localStorage.getItem('token') && { Authorization: `Bearer ${localStorage.getItem('token')}` }) },
          body: JSON.stringify(updateData)
        });
        if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.error || 'Failed to update podcast'); }
      }
      setSaving(false);
      setAlertHeader('Success!'); setAlertMessage('Podcast updated successfully!'); setShowAlert(true);
      sessionStorage.setItem('podcastsNeedRefresh', 'true');
      setTimeout(() => history.push('/admin/radio'), 1500);
    } catch (error) {
      setSaving(false);
      setAlertHeader('Error'); setAlertMessage(error instanceof Error ? error.message : 'Failed to update podcast'); setShowAlert(true);
    }
  };

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

  if (loading) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <div className="af-loading">
            <IonSpinner name="crescent" color="primary" />
            <IonText color="medium"><p>Loading podcast data...</p></IonText>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <IonButton fill="clear" slot="start" onClick={() => history.goBack()} style={{ marginLeft: '4px' }}>
            <IonIcon icon={arrowBack} style={{ fontSize: '22px' }} />
          </IonButton>
          <IonTitle className="title-ios" style={{ textAlign: 'left', marginLeft: '-16px' }}>Edit Podcast</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding">
        <div className="af-page">
          {/* Hero Section */}
          <div className="af-section">
            <h1 className="nd-title" style={{ textAlign: 'center', marginBottom: '8px' }}>Edit Podcast</h1>
            <p style={{ textAlign: 'center', color: 'var(--ion-color-medium)', fontSize: '14px', margin: 0 }}>Update podcast information and media files</p>
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
                <label className="af-label">Audio File</label>
                <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleAudioSelect} style={{ display: 'none' }} />
                {!audioFileName ? (
                  <div className="af-upload" onClick={() => fileInputRef.current?.click()}>
                    <div className="af-upload-icon"><IonIcon icon={musicalNote} /></div>
                    <p className="af-upload-text">Replace audio file</p>
                    <p className="af-upload-hint">Optional &bull; Max 300MB &bull; All audio formats</p>
                  </div>
                ) : (
                  <div className="af-upload" style={{ borderStyle: 'solid', borderColor: 'var(--ion-color-success, #22c55e)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="af-upload-icon"><IonIcon icon={musicalNote} /></div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p className="af-upload-text">{audioFileName}</p>
                        <p className="af-upload-hint">Audio file ready</p>
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
                {(!thumbnailPreview && !formData.thumbnailUrl) ? (
                  <div className="af-upload" onClick={() => thumbnailInputRef.current?.click()}>
                    <div className="af-upload-icon"><IonIcon icon={image} /></div>
                    <p className="af-upload-text">Upload thumbnail image</p>
                    <p className="af-upload-hint">Optional &bull; Max 5MB &bull; JPG, PNG, WebP</p>
                  </div>
                ) : (
                  <div>
                    <img src={thumbnailPreview || formData.thumbnailUrl} alt="Thumbnail preview" className="af-upload-preview" />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                      <span className="af-upload-hint">Thumbnail {thumbnailPreview ? 'selected' : 'exists'}</span>
                      <button onClick={() => { setThumbnailPreview(''); setFormData(prev => ({ ...prev, thumbnailUrl: '' })); setThumbnailRemoved(true); if (thumbnailInputRef.current) thumbnailInputRef.current.value = ''; }}
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
          <button onClick={handleSave} disabled={saving} className="af-submit">
            {saving ? (
              <><IonSpinner name="crescent" color="white" style={{ width: '20px', height: '20px' }} /><span>Updating Podcast...</span></>
            ) : (
              <><IonIcon icon={save} style={{ fontSize: '20px' }} /><span>Update Podcast</span></>
            )}
          </button>

          {/* Footer */}
          <div className="af-footer">
            <IonText>Dove Church &bull; Podcast Management System</IonText>
          </div>
        </div>

        <IonLoading isOpen={saving} message="Updating podcast..." duration={0} />
        <IonAlert isOpen={showAlert} onDidDismiss={() => setShowAlert(false)} header={alertHeader} message={alertMessage} buttons={[{ text: 'OK', role: 'cancel' }]} />
      </IonContent>
    </IonPage>
  );
};

export default EditPodcast;
