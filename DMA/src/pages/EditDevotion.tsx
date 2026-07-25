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
import {
  save,
  book,
  closeCircle,
  image,
  informationCircle,
  star,
  arrowBack
} from 'ionicons/icons';
import { useHistory, useParams, useLocation } from 'react-router-dom';
import { apiService } from '../services/api';
import SaveProgressModal, { SaveProgressStep } from '../components/SaveProgressModal';
import { AuthContext } from '../App';
import './AdminForm.css';
import './AdminDashboard.css';

interface RouteParams {
  id: string;
}

const EditDevotion: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const { id } = useParams<RouteParams>();
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
  const [currentThumbnailUrl, setCurrentThumbnailUrl] = useState<string>('');
  const [thumbnailRemoved, setThumbnailRemoved] = useState(false);
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

  useEffect(() => {
    const devotion = (location.state as any)?.devotion;
    if (devotion) {
      setFormData({
        title: devotion.title || '',
        content: devotion.content || devotion.description || '',
        scripture: devotion.scripture || '',
        reflection: devotion.reflection || '',
        prayer: devotion.prayer || '',
        featured: devotion.isFeatured || false,
        thumbnailFile: null,
        thumbnailUrl: devotion.thumbnailUrl || ''
      });
      setCurrentThumbnailUrl(devotion.thumbnailUrl || '');
      setThumbnailRemoved(false);
    } else {
      loadDevotion();
    }
  }, [location.state]);

  const loadDevotion = async () => {
    try {
      const devotion = await apiService.getDevotion(id);
      setFormData({
        title: devotion.title || '',
        content: devotion.content || '',
        scripture: devotion.scripture || '',
        reflection: devotion.reflection || '',
        prayer: devotion.prayer || '',
        featured: devotion.isFeatured || false,
        thumbnailFile: null,
        thumbnailUrl: devotion.thumbnailUrl || ''
      });
      setCurrentThumbnailUrl(devotion.thumbnailUrl || '');
      setThumbnailRemoved(false);
    } catch (error) {
      console.log('API load failed, using navigation state data');
    }
  };

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
    setThumbnailRemoved(false);
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
    if (!formData.title || !formData.scripture) {
      setAlertHeader('Validation Error');
      setAlertMessage('Please fill in all required fields (Title, Scripture)');
      setShowAlert(true);
      return;
    }

    const hasThumbnail = !!formData.thumbnailFile || thumbnailRemoved;

    const steps: SaveProgressStep[] = [];
    if (hasThumbnail) {
      steps.push({ label: 'Uploading thumbnail', status: 'active', progress: 0 });
    }
    steps.push({ label: 'Saving devotion', status: hasThumbnail ? 'pending' : 'active' });

    setSaveSteps(steps);
    setSaveProgress(0);
    setSaveStatus('uploading');
    setShowSaveModal(true);
    setLoading(true);

    try {
      let thumbnailUrl = currentThumbnailUrl;

      if (formData.thumbnailFile) {
        const thumbnailFormData = new FormData();
        thumbnailFormData.append('thumbnailFile', formData.thumbnailFile);
        const thumbnailResponse = await apiService.uploadThumbnail(thumbnailFormData, (pct) => {
          setSaveSteps(prev => prev.map((s, i) => i === 0 ? { ...s, progress: pct } : s));
        });
        thumbnailUrl = thumbnailResponse.thumbnailUrl;
        setSaveSteps(prev => prev.map((s, i) => i === 0 ? { ...s, status: 'success', progress: 100 } : s));
        setSaveProgress(50);
      } else if (thumbnailRemoved) {
        thumbnailUrl = '';
        setSaveSteps(prev => prev.map((s, i) => i === 0 ? { ...s, status: 'success' } : s));
        setSaveProgress(50);
      }

      const saveIdx = steps.findIndex(s => s.label.includes('Saving'));
      setSaveSteps(prev => prev.map((s, i) => i === saveIdx ? { ...s, status: 'active', progress: 0 } : s));
      setSaveProgress(60);

      await apiService.updateDevotion(id, {
        title: formData.title,
        scripture: formData.scripture,
        content: formData.content,
        reflection: formData.reflection,
        prayer: formData.prayer,
        isFeatured: formData.featured,
        thumbnailUrl: thumbnailUrl
      });

      setSaveSteps(prev => prev.map((s, i) => i === saveIdx ? { ...s, status: 'success', progress: 100 } : s));
      setSaveProgress(100);
      setSaveStatus('success');
      setLoading(false);

      sessionStorage.setItem('devotionsNeedRefresh', 'true');

      setTimeout(() => {
        history.push('/admin/devotions');
      }, 2000);
    } catch (error) {
      console.error('Error updating devotion:', error);
      setSaveSteps(prev => prev.map(s => s.status === 'active' ? { ...s, status: 'error' } : s));
      setSaveStatus('error');
      setSaveError(error instanceof Error ? error.message : 'Network error. Please try again.');
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
          <IonTitle className="title-ios" style={{ textAlign: 'left', marginLeft: '-16px' }}>Edit Devotion</IonTitle>
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
                {!formData.thumbnailFile && !thumbnailPreview && !currentThumbnailUrl ? (
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
                      src={thumbnailPreview || currentThumbnailUrl || 'https://via.placeholder.com/600x400/6366f1/ffffff?text=No+Thumbnail'}
                      alt="Thumbnail preview"
                      className="af-upload-preview"
                    />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <IonIcon icon={image} style={{ color: '#6366f1', fontSize: '16px' }} />
                        <span className="af-hint">
                          {formData.thumbnailFile?.name || (currentThumbnailUrl ? 'Current thumbnail' : '')}
                        </span>
                      </div>
                      <button
                        className="af-submit af-submit-danger"
                        style={{ width: 'auto', padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => {
                          setFormData(prev => ({ ...prev, thumbnailFile: null }));
                          setThumbnailPreview(null);
                          setCurrentThumbnailUrl('');
                          setThumbnailRemoved(true);
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
                <span>Updating Devotion...</span>
              </>
            ) : (
              <>
                <IonIcon icon={save} /> Update Devotion
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
          title="Updating devotion..."
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

export default EditDevotion;
