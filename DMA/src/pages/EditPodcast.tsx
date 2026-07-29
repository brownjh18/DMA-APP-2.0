import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonIcon, IonButton, IonAlert, IonText, IonSpinner
} from '@ionic/react';
import {
  save, radio, closeCircle, image, musicalNote, checkmarkCircle, informationCircle, person,
  documentText, cloudUpload, arrowBack
} from 'ionicons/icons';
import { useHistory, useParams } from 'react-router-dom';
import { apiService } from '../services/api';
import SaveProgressModal, { SaveProgressStep } from '../components/SaveProgressModal';
import { AuthContext } from '../App';
import { useSettings } from '../contexts/SettingsContext';
import { useBackgroundUpload } from '../hooks/useBackgroundUpload';
import { Capacitor } from '@capacitor/core';
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
  const bgUpload = useBackgroundUpload('edit-podcast', 'Edit podcast');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveSteps, setSaveSteps] = useState<SaveProgressStep[]>([]);
  const [saveProgress, setSaveProgress] = useState(0);
  const [saveStatus, setSaveStatus] = useState<'uploading' | 'success' | 'error'>('uploading');
  const [saveError, setSaveError] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertHeader, setAlertHeader] = useState('Notice');
  const { isDarkMode } = useSettings();
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [audioFileName, setAudioFileName] = useState<string>('');
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
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
      setSelectedAudioFile(file);
      getAudioDuration(file).then(duration => {
        setFormData(prev => ({ ...prev, duration }));
      }).catch(() => {});
    }
  };

  const handleAudioPickNative = async () => {
    try {
      const { FilePicker } = await import('@capawesome/capacitor-file-picker');
      const result = await FilePicker.pickFiles({
        types: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/mp4', 'audio/x-m4a'],
        limit: 1
      });
      if (result.files.length > 0) {
        const picked = result.files[0];
        if (picked.size > 300 * 1024 * 1024) {
          setAlertHeader('Upload Error');
          setAlertMessage('Audio file size must be less than 300MB');
          setShowAlert(true);
          return;
        }
        setAudioFileName(picked.name);
        const file = new File([picked.blob!], picked.name, { type: picked.mimeType });
        setSelectedAudioFile(file);
        getAudioDuration(file).then(duration => {
          setFormData(prev => ({ ...prev, duration }));
        }).catch(() => {});
      }
    } catch (error: any) {
      if (error?.message !== 'User cancelled images app.') {
        console.error('File picker error:', error);
      }
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

    const hasFiles = !!(fileInputRef.current?.files?.[0] || thumbnailInputRef.current?.files?.[0]);

    const steps: SaveProgressStep[] = [];
    if (hasFiles) {
      steps.push({ label: 'Uploading files', status: 'active', progress: 0 });
    }
    steps.push({ label: 'Save podcast', status: hasFiles ? 'pending' : 'active' });

    setSaveSteps(steps);
    setSaveProgress(0);
    setSaveStatus('uploading');
    setShowSaveModal(true);
    setSaving(true);

    try {
      bgUpload.register();
      if (hasFiles) {
        const formDataToSend = new FormData();
        formDataToSend.append('title', formData.title);
        formDataToSend.append('speaker', formData.speaker);
        formDataToSend.append('description', formData.description);
        formDataToSend.append('duration', formData.duration);
        formDataToSend.append('status', formData.status);
        if (selectedAudioFile) formDataToSend.append('audioFile', selectedAudioFile);
        if (thumbnailInputRef.current?.files?.[0]) formDataToSend.append('thumbnailFile', thumbnailInputRef.current.files[0]);
        await apiService.updatePodcast(id, formDataToSend, (pct) => {
          setSaveSteps(prev => prev.map((s, i) => i === 0 ? { ...s, progress: pct } : s));
          setSaveProgress(pct);
          bgUpload.progress(pct);
        });
        setSaveSteps(prev => prev.map((s, i) => i === 0 ? { ...s, status: 'success', progress: 100 } : s));
        setSaveProgress(100);
        setSaveSteps(prev => prev.map((s, i) => i === 1 ? { ...s, status: 'active' } : s));
      } else {
        const updateData: any = { title: formData.title, speaker: formData.speaker, description: formData.description,
          duration: formData.duration, status: formData.status };
        if (thumbnailRemoved) {
          updateData.thumbnailUrl = '';
        }
        const saveIdx = steps.findIndex(s => s.label.includes('Save'));
        setSaveSteps(prev => prev.map((s, i) => i === saveIdx ? { ...s, status: 'active' } : s));
        await apiService.updatePodcastJson(id, updateData);
        setSaveSteps(prev => prev.map((s, i) => i === saveIdx ? { ...s, status: 'success', progress: 100 } : s));
      }

      setSaveProgress(100);
      setSaveStatus('success');
      bgUpload.complete();
      setSaving(false);
      sessionStorage.setItem('podcastsNeedRefresh', 'true');
      setTimeout(() => history.replace('/admin/radio'), 2000);
    } catch (error) {
      setSaveSteps(prev => prev.map(s => s.status === 'active' ? { ...s, status: 'error' } : s));
      setSaveStatus('error');
      setSaveError(error instanceof Error ? error.message : 'Failed to update podcast');
      bgUpload.fail(error instanceof Error ? error.message : 'Failed to update podcast');
      setSaving(false);
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
          <IonTitle className="title-ios" style={{ textAlign: 'left', marginLeft: '-28px' }}>Edit Podcast</IonTitle>
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
                <label className="af-label">Audio File</label>
                <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleAudioSelect} style={{ display: 'none' }} />
                {!audioFileName ? (
                  <div className="af-upload" onClick={() => {
                    if (Capacitor.isNativePlatform()) {
                      handleAudioPickNative();
                    } else {
                      fileInputRef.current?.click();
                    }
                  }}>
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
                      <button onClick={() => { setAudioFileName(''); setSelectedAudioFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
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
              <><IonSpinner name="crescent" color="white" style={{ width: '20px', height: '20px' }} /><span>Saving...</span></>
            ) : (
              <><IonIcon icon={save} style={{ fontSize: '20px' }} /><span>Update Podcast</span></>
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
          title="Updating podcast..."
        />
        <IonAlert isOpen={showAlert} onDidDismiss={() => setShowAlert(false)} header={alertHeader} message={alertMessage} buttons={[{ text: 'OK', role: 'cancel' }]} />
      </IonContent>
    </IonPage>
  );
};

export default EditPodcast;
