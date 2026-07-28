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
  people,
  closeCircle,
  image,
  checkmarkCircle,
  informationCircle,
  calendar,
  location,
  call,
  mail,
  person,
  peopleOutline,
  time,
  briefcase,
  arrowBack
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { apiService } from '../services/api';

import { AuthContext } from '../App';
import { useSettings } from '../contexts/SettingsContext';
import { useBackgroundUpload } from '../hooks/useBackgroundUpload';
import './AdminForm.css';
import './AdminDashboard.css';

const AddMinistry: React.FC = () => {
  const history = useHistory();
  const { isLoggedIn, isAdmin } = useContext(AuthContext);
  const bgUpload = useBackgroundUpload('add-ministry', 'New ministry');
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
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
    name: '',
    description: '',
    leader: '',
    category: '',
    meetingDay: '',
    meetingTime: '',
    endTime: '',
    location: '',
    contactEmail: '',
    contactPhone: '',
    linkUrl: '',
    memberCount: '',
    status: 'active'
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
    if (!formData.name || !formData.description || !formData.leader || !formData.category) {
      setAlertHeader('Validation Error');
      setAlertMessage('Please fill in all required fields (Name, Description, Leader, Category)');
      setShowAlert(true);
      return;
    }

    setLoading(true);

    try {
      bgUpload.register();
      let thumbnailUrl = '';

      const hasThumbnail = !!thumbnailPreview;
      const steps: SaveProgressStep[] = [
        ...(hasThumbnail ? [{ label: 'Uploading thumbnail', status: 'pending' as const }] : []),
        { label: 'Saving ministry', status: 'pending' as const }
      ];
      setSaveSteps(steps);
      setSaveProgress(0);
      setSaveStatus('uploading');
      setSaveError('');
      setShowSaveModal(true);

      const updateStep = (idx: number, patch: Partial<SaveProgressStep>) =>
        setSaveSteps(prev => prev.map((s, i) => i === idx ? { ...s, ...patch } : s));

      if (hasThumbnail) {
        updateStep(0, { status: 'active', progress: 0 });
        const input = fileInputRef.current;
        if (input && input.files && input.files[0]) {
          const thumbnailFormData = new FormData();
          thumbnailFormData.append('thumbnailFile', input.files[0]);
          const response = await apiService.uploadThumbnail(thumbnailFormData, (pct) => {
            updateStep(0, { progress: pct });
            setSaveProgress(Math.round((pct / 100) * 50));
            bgUpload.progress(Math.round((pct / 100) * 50));
          });
          thumbnailUrl = response.thumbnailUrl;
        }
        updateStep(0, { status: 'success', progress: 100 });
        setSaveProgress(50);
        bgUpload.progress(50);
      }

      const saveIdx = hasThumbnail ? 1 : 0;
      updateStep(saveIdx, { status: 'active' });
      const ministryData: any = {
        name: formData.name,
        description: formData.description,
        leader: formData.leader,
        category: formData.category,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        linkUrl: formData.linkUrl || undefined,
        isActive: formData.status === 'active'
      };

      if (formData.meetingDay && formData.meetingTime) {
        ministryData.meetingSchedule = `${formData.meetingDay} ${formData.meetingTime}`;
      }

      if (formData.endTime) {
        ministryData.endTime = formData.endTime;
      }

      if (formData.memberCount) {
        ministryData.memberCount = parseInt(formData.memberCount);
      }

      if (thumbnailUrl) {
        ministryData.imageUrl = thumbnailUrl;
      }

      await apiService.createMinistry(ministryData);
      updateStep(saveIdx, { status: 'success' });

      setSaveStatus('success');
      setSaveProgress(100);
      bgUpload.complete();
      sessionStorage.setItem('ministriesNeedRefresh', 'true');
      setTimeout(() => {
        history.replace('/admin/ministries');
      }, 1500);
    } catch (error) {
      setSaveStatus('error');
      setSaveError(error instanceof Error ? error.message : 'Failed to create ministry');
      bgUpload.fail(error instanceof Error ? error.message : 'Failed to create ministry');
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
          <IonTitle className="title-ios" style={{ textAlign: 'left', marginLeft: '-16px' }}>Add Ministry</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding af-page">
        <div className="af-section">
          <div className="af-toggle-row">
            <span className="af-toggle-label">Active</span>
            <div
              className={`af-toggle ${formData.status === 'active' ? 'active' : ''}`}
              onClick={() => handleInputChange('status', formData.status === 'active' ? 'inactive' : 'active')}
            >
              <div className="af-toggle-knob" />
            </div>
          </div>
        </div>

        <div className="af-section">
          <h2 className="af-section-title">Ministry Details</h2>
          <div className="af-card">
            <div className="af-field">
              <label className="af-label">
                Ministry Name <span className="af-required">*</span>
              </label>
              <input
                type="text"
                className="af-input"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter ministry name"
              />
            </div>

            <div className="af-field">
              <label className="af-label">
                Category <span className="af-required">*</span>
              </label>
              <select
                className="af-input af-select"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
              >
                <option value="">Select category</option>
                <option value="worship">Worship Ministry</option>
                <option value="youth">Youth Ministry</option>
                <option value="children">Children Ministry</option>
                <option value="evangelism">Evangelism Ministry</option>
                <option value="intercessions">Intercessions Ministry</option>
                <option value="married-couples">Married Couples Ministry</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="af-field">
              <label className="af-label">
                Ministry Leader <span className="af-required">*</span>
              </label>
              <input
                type="text"
                className="af-input"
                value={formData.leader}
                onChange={(e) => handleInputChange('leader', e.target.value)}
                placeholder="Enter leader's name"
              />
            </div>

            <div className="af-field">
              <label className="af-label">
                Description <span className="af-required">*</span>
              </label>
              <textarea
                className="af-input af-textarea"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe the ministry's purpose and activities"
                rows={4}
              />
            </div>

            <div className="af-row">
              <div className="af-field">
                <label className="af-label">Meeting Day</label>
                <select
                  className="af-input af-select"
                  value={formData.meetingDay}
                  onChange={(e) => handleInputChange('meetingDay', e.target.value)}
                >
                  <option value="">Select day</option>
                  <option value="sunday">Sunday</option>
                  <option value="monday">Monday</option>
                  <option value="tuesday">Tuesday</option>
                  <option value="wednesday">Wednesday</option>
                  <option value="thursday">Thursday</option>
                  <option value="friday">Friday</option>
                  <option value="saturday">Saturday</option>
                </select>
              </div>
              <div className="af-field">
                <label className="af-label">Meeting Time</label>
                <input
                  type="time"
                  className="af-input"
                  value={formData.meetingTime}
                  onChange={(e) => handleInputChange('meetingTime', e.target.value)}
                />
              </div>
            </div>

            <div className="af-field">
              <label className="af-label">End Time</label>
              <input
                type="time"
                className="af-input"
                value={formData.endTime}
                onChange={(e) => handleInputChange('endTime', e.target.value)}
              />
            </div>

            <div className="af-field">
              <label className="af-label">Location</label>
              <input
                type="text"
                className="af-input"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Meeting location"
              />
            </div>

            <div className="af-row">
              <div className="af-field">
                <label className="af-label">Contact Email</label>
                <input
                  type="email"
                  className="af-input"
                  value={formData.contactEmail}
                  onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                  placeholder="Email for inquiries"
                />
              </div>
              <div className="af-field">
                <label className="af-label">Contact Phone</label>
                <input
                  type="tel"
                  className="af-input"
                  value={formData.contactPhone}
                  onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                  placeholder="Phone for inquiries"
                />
              </div>
            </div>

            <div className="af-field">
              <label className="af-label">Link URL</label>
              <input
                type="url"
                className="af-input"
                value={formData.linkUrl}
                onChange={(e) => handleInputChange('linkUrl', e.target.value)}
                placeholder="e.g., Zoom link, YouTube stream URL"
              />
            </div>

            <div className="af-field">
              <label className="af-label">Member Count</label>
              <input
                type="number"
                className="af-input"
                value={formData.memberCount}
                onChange={(e) => handleInputChange('memberCount', e.target.value)}
                placeholder="Approximate number of members"
              />
            </div>
          </div>
        </div>

        <div className="af-section">
          <h2 className="af-section-title">Ministry Thumbnail</h2>
          <div className="af-card">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleThumbnailSelect}
              style={{ display: 'none' }}
            />
            {!thumbnailPreview ? (
              <div
                className="af-upload"
                onClick={() => fileInputRef.current?.click()}
              >
                <IonIcon icon={image} className="af-upload-icon" />
                <p className="af-upload-text">Upload thumbnail image</p>
                <p className="af-upload-hint">Optional • Max 5MB • JPG, PNG, WebP</p>
              </div>
            ) : (
              <div>
                <img
                  src={thumbnailPreview}
                  alt="Thumbnail preview"
                  className="af-upload-preview"
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <IonIcon icon={image} style={{ color: 'var(--ion-color-primary)', fontSize: '16px' }} />
                    <span className="af-upload-text">Thumbnail selected</span>
                  </div>
                  <button
                    className="af-submit af-submit-danger"
                    style={{ width: 'auto', padding: '8px 16px', fontSize: '13px' }}
                    onClick={() => {
                      setThumbnailPreview(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                  >
                    <IonIcon icon={closeCircle} style={{ fontSize: '14px', marginRight: '4px' }} />
                    Remove
                  </button>
                </div>
              </div>
            )}
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
              <span>Saving Ministry...</span>
            </>
          ) : (
            <>
              <IonIcon icon={save} style={{ fontSize: '20px', marginRight: '8px' }} />
              <span>Save Ministry</span>
            </>
          )}
        </button>

        <div className="af-footer">
          <IonText>Dove Church • Ministry Management System</IonText>
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
          title="Saving ministry..."
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

export default AddMinistry;
