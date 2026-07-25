import React, { useState, useEffect, useContext } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  IonAlert,
  IonText,
  IonSpinner
} from '@ionic/react';
import SaveProgressModal, { SaveProgressStep } from '../components/SaveProgressModal';
import {
  save,
  book,
  closeCircle,
  image,
  informationCircle,
  star,
  arrowBack
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { apiService } from '../services/api';

import { AuthContext } from '../App';
import './AdminForm.css';
import './AdminDashboard.css';

const AddDevotion: React.FC = () => {
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
  const [dragActive, setDragActive] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const thumbnailInputRef = React.useRef<HTMLInputElement>(null);

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
    content: '',
    scripture: '',
    reflection: '',
    prayer: '',
    featured: false,
    thumbnailFile: null as File | null,
    thumbnailUrl: ''
  });

  const handleInputChange = (field: string, value: string | boolean) => {
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
    if (file && file.type.startsWith('image/')) {
      if (file.size > 5 * 1024 * 1024) {
        setAlertHeader('File Too Large');
        setAlertMessage('Image file size must be less than 5MB');
        setShowAlert(true);
        return;
      }
      setFormData(prev => ({ ...prev, thumbnailFile: file }));
      setThumbnailPreview(URL.createObjectURL(file));
    } else {
      setAlertHeader('Invalid File');
      setAlertMessage('Please drop an image file');
      setShowAlert(true);
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.content || !formData.scripture || !formData.reflection || !formData.prayer) {
      setAlertHeader('Validation Error');
      setAlertMessage('Please fill in all required fields (Title, Scripture, Content, Reflection, Prayer)');
      setShowAlert(true);
      return;
    }

    const hasThumbnail = !!formData.thumbnailFile;
    const steps: SaveProgressStep[] = [
      ...(hasThumbnail ? [{ label: 'Uploading thumbnail', status: 'pending' as const }] : []),
      { label: 'Saving devotion', status: 'pending' as const }
    ];
    setSaveSteps(steps);
    setSaveProgress(0);
    setSaveStatus('uploading');
    setSaveError('');
    setShowSaveModal(true);
    setLoading(true);

    try {
      let thumbnailUrl = '';
      let currentStep = 0;
      const thumbSteps = hasThumbnail ? 1 : 0;
      const totalSteps = thumbSteps + 1;

      const updateStep = (idx: number, patch: Partial<SaveProgressStep>) =>
        setSaveSteps(prev => prev.map((s, i) => i === idx ? { ...s, ...patch } : s));

      if (hasThumbnail) {
        updateStep(0, { status: 'active', progress: 0 });
        const thumbnailFormData = new FormData();
        thumbnailFormData.append('thumbnailFile', formData.thumbnailFile!);
        const thumbnailResponse = await apiService.uploadThumbnail(thumbnailFormData, (pct) => {
          updateStep(0, { progress: pct });
          setSaveProgress(Math.round((pct / 100) * 50));
        });
        thumbnailUrl = thumbnailResponse.thumbnailUrl;
        currentStep++;
        setSaveProgress(Math.round((currentStep / totalSteps) * 100));
        updateStep(0, { status: 'success', progress: 100 });
      }

      const saveIdx = hasThumbnail ? 1 : 0;
      updateStep(saveIdx, { status: 'active' });
      setSaveProgress(hasThumbnail ? 60 : 50);

      await apiService.createDevotion({
        title: formData.title,
        scripture: formData.scripture,
        content: formData.content,
        reflection: formData.reflection,
        prayer: formData.prayer,
        status: 'publish',
        isFeatured: formData.featured,
        thumbnailUrl: thumbnailUrl || undefined
      });

      currentStep++;
      setSaveProgress(Math.round((currentStep / totalSteps) * 100));
      updateStep(saveIdx, { status: 'success' });
      setSaveStatus('success');
      setSaveProgress(100);
      sessionStorage.setItem('devotionsNeedRefresh', 'true');
      setTimeout(() => {
        history.push('/admin/devotions');
      }, 1500);
    } catch (error) {
      console.error('Error adding devotion:', error);
      setSaveStatus('error');
      setSaveError(error instanceof Error ? error.message : 'Network error. Please try again.');
      setSaveSteps(prev => prev.map(s => s.status === 'active' ? { ...s, status: 'error' } : s));
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <IonButton fill="clear" slot="start" onClick={() => history.goBack()} style={{ marginLeft: '4px' }}><IonIcon icon={arrowBack} style={{ fontSize: '22px' }} /></IonButton>
          <IonTitle className="title-ios" style={{ textAlign: 'left', marginLeft: '-16px' }}>Add Devotion</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding">
        <div className="af-page">
          <div className="af-section">
            <div className="af-toggle-row">
              <span className="af-toggle-label">
                <IonIcon icon={informationCircle} /> Standard
              </span>
              <div
                className={`af-toggle ${!formData.featured ? 'active' : ''}`}
                onClick={() => handleInputChange('featured', false)}
              >
                <div className="af-toggle-knob" />
              </div>
            </div>
            <div className="af-toggle-row">
              <span className="af-toggle-label">
                <IonIcon icon={star} /> Featured
              </span>
              <div
                className={`af-toggle ${formData.featured ? 'active' : ''}`}
                onClick={() => handleInputChange('featured', true)}
              >
                <div className="af-toggle-knob" />
              </div>
            </div>
          </div>

          <div className="af-section">
            <div className="af-card">
              <div className="af-field">
                <label className="af-label">
                  Devotion Title <span className="af-required">*</span>
                </label>
                <input
                  type="text"
                  className="af-input"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter devotion title"
                />
              </div>

              <div className="af-field">
                <label className="af-label">
                  Scripture Reference <span className="af-required">*</span>
                </label>
                <input
                  type="text"
                  className="af-input"
                  value={formData.scripture}
                  onChange={(e) => handleInputChange('scripture', e.target.value)}
                  placeholder="e.g., Psalm 23:1-6"
                />
              </div>

              <div className="af-field">
                <label className="af-label">
                  Devotion Content <span className="af-required">*</span>
                </label>
                <textarea
                  className="af-input af-textarea"
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  placeholder="Enter the main devotion content"
                  rows={6}
                />
              </div>

              <div className="af-field">
                <label className="af-label">
                  Reflection <span className="af-required">*</span>
                </label>
                <textarea
                  className="af-input af-textarea"
                  value={formData.reflection}
                  onChange={(e) => handleInputChange('reflection', e.target.value)}
                  placeholder="Add reflection questions or thoughts"
                  rows={3}
                />
              </div>

              <div className="af-field">
                <label className="af-label">
                  Prayer <span className="af-required">*</span>
                </label>
                <textarea
                  className="af-input af-textarea"
                  value={formData.prayer}
                  onChange={(e) => handleInputChange('prayer', e.target.value)}
                  placeholder="Include a sample prayer"
                  rows={3}
                />
              </div>

              <div className="af-field">
                <label className="af-label">Thumbnail</label>
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  style={{ display: 'none' }}
                />
                {!formData.thumbnailFile && !thumbnailPreview ? (
                  <div
                    className={`af-upload ${dragActive ? 'drag-active' : ''}`}
                    onClick={() => thumbnailInputRef.current?.click()}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <IonIcon icon={image} className="af-upload-icon" />
                    <p className="af-upload-text">Upload thumbnail image</p>
                    <p className="af-upload-hint">Optional · Max 5MB · JPG, PNG, WebP</p>
                  </div>
                ) : (
                  <div className="af-card">
                    <img
                      src={thumbnailPreview || undefined}
                      alt="Thumbnail preview"
                      className="af-upload-preview"
                    />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <IonIcon icon={image} style={{ color: '#6366f1', fontSize: '16px' }} />
                        <span className="af-hint">{formData.thumbnailFile?.name}</span>
                      </div>
                      <button
                        className="af-submit af-submit-danger"
                        style={{ width: 'auto', padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => {
                          setFormData(prev => ({ ...prev, thumbnailFile: null }));
                          setThumbnailPreview(null);
                          if (thumbnailInputRef.current) {
                            thumbnailInputRef.current.value = '';
                          }
                        }}
                      >
                        <IonIcon icon={closeCircle} /> Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            className="af-submit"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? (
              <>
                <IonSpinner name="crescent" color="white" style={{ width: '20px', height: '20px' }} />
                <span>Saving Devotion...</span>
              </>
            ) : (
              <>
                <IonIcon icon={save} /> Save Devotion
              </>
            )}
          </button>

          <div className="af-footer">
            <IonText>Dove Church · Devotion Management System</IonText>
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
          title="Saving devotion..."
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

export default AddDevotion;
