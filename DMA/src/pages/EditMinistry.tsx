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
  people,
  closeCircle,
  image,
  checkmarkCircle,
  informationCircle,
  calendar,
  location as locationIcon,
  call,
  mail,
  person,
  peopleOutline,
  time,
  briefcase
} from 'ionicons/icons';
import { useHistory, useParams, useLocation } from 'react-router-dom';
import { apiService } from '../services/api';
import { AuthContext } from '../App';
import { useSettings } from '../contexts/SettingsContext';
import './AdminForm.css';
import './AdminDashboard.css';

interface RouteParams {
  id: string;
}

const EditMinistry: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const { id } = useParams<RouteParams>();
  const { isLoggedIn, isAdmin } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertHeader, setAlertHeader] = useState('Notice');
  const { isDarkMode } = useSettings();
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [currentThumbnailUrl, setCurrentThumbnailUrl] = useState<string>('');
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
    name: '', description: '', leader: '', category: '', meetingSchedule: '',
    endTime: '', location: '', contactEmail: '', contactPhone: '', memberCount: '', status: 'active'
  });

  useEffect(() => {
    const ministry = (location.state as any)?.ministry;
    if (ministry) {
      setFormData({
        name: ministry.name || '', description: ministry.description || '', leader: ministry.leader || '',
        category: ministry.category || '', meetingSchedule: ministry.meetingSchedule || '',
        endTime: ministry.endTime || '', location: ministry.location || '', contactPhone: ministry.contactPhone || '',
        contactEmail: ministry.contactEmail || '', memberCount: ministry.memberCount?.toString() || '',
        status: ministry.isActive ? 'active' : 'inactive',
      });
      setCurrentThumbnailUrl(ministry.imageUrl || '');
    } else {
      loadMinistry();
    }
  }, [location.state]);

  const loadMinistry = async () => {
    try {
      const ministry = await apiService.getMinistry(id);
      setFormData({
        name: ministry.name || '', description: ministry.description || '', leader: ministry.leader || '',
        category: ministry.category || '', meetingSchedule: ministry.meetingSchedule || '',
        endTime: ministry.endTime || '', location: ministry.location || '', contactEmail: ministry.contactEmail || '',
        contactPhone: ministry.contactPhone || '', memberCount: ministry.memberCount?.toString() || '',
        status: ministry.isActive ? 'active' : 'inactive',
      });
      setCurrentThumbnailUrl(ministry.imageUrl || '');
    } catch (error) {
      console.log('API load failed, using navigation state data');
    }
  };

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
      let imageUrl = currentThumbnailUrl;
      if (thumbnailPreview) {
        const input = fileInputRef.current;
        if (input && input.files && input.files[0]) {
          const thumbnailFormData = new FormData();
          thumbnailFormData.append('thumbnailFile', input.files[0]);
          const response = await apiService.uploadThumbnail(thumbnailFormData);
          imageUrl = response.thumbnailUrl;
        }
      }

      const ministryData: any = {
        name: formData.name, description: formData.description, leader: formData.leader,
        category: formData.category, imageUrl, meetingSchedule: formData.meetingSchedule,
        location: formData.location, contactEmail: formData.contactEmail, contactPhone: formData.contactPhone,
        endTime: formData.endTime, memberCount: formData.memberCount ? parseInt(formData.memberCount) : undefined,
        isActive: formData.status === 'active'
      };

      await apiService.updateMinistry(id, ministryData);
      setLoading(false);
      setAlertHeader('Success!');
      setAlertMessage('Ministry updated successfully!');
      setShowAlert(true);
      sessionStorage.setItem('ministriesNeedRefresh', 'true');
      setTimeout(() => history.push('/admin/ministries'), 1500);
    } catch (error) {
      setLoading(false);
      setAlertHeader('Error');
      setAlertMessage(error instanceof Error ? error.message : 'Failed to update ministry');
      setShowAlert(true);
    }
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios" style={{ background: 'transparent' }}>
          <BackButton />
          <IonTitle className="nd-title" style={{ textAlign: 'center' }}>
            Edit Ministry
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding af-page">
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
          borderRadius: '24px',
          padding: '32px 24px',
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          <IonIcon icon={people} style={{ color: '#fff', fontSize: '32px', marginBottom: '12px' }} />
          <h1 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700', color: '#fff' }}>
            Edit Ministry
          </h1>
          <p style={{ margin: '0', color: 'rgba(255, 255, 255, 0.85)', fontSize: '14px' }}>
            Update ministry details and settings
          </p>
        </div>

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

            <div className="af-field">
              <label className="af-label">Meeting Schedule</label>
              <input
                type="text"
                className="af-input"
                value={formData.meetingSchedule}
                onChange={(e) => handleInputChange('meetingSchedule', e.target.value)}
                placeholder="e.g., Sunday 9:00 AM"
              />
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
            {!thumbnailPreview && !currentThumbnailUrl ? (
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
                  src={thumbnailPreview || currentThumbnailUrl}
                  alt="Thumbnail preview"
                  className="af-upload-preview"
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <IonIcon icon={image} style={{ color: 'var(--ion-color-primary)', fontSize: '16px' }} />
                    <span className="af-upload-text">Current thumbnail</span>
                  </div>
                  <button
                    className="af-submit af-submit-danger"
                    style={{ width: 'auto', padding: '8px 16px', fontSize: '13px' }}
                    onClick={() => {
                      setThumbnailPreview(null);
                      setCurrentThumbnailUrl('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
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
              <span>Updating Ministry...</span>
            </>
          ) : (
            <>
              <IonIcon icon={save} style={{ fontSize: '20px', marginRight: '8px' }} />
              <span>Update Ministry</span>
            </>
          )}
        </button>

        <div className="af-footer">
          <IonText>Dove Church • Ministry Management System</IonText>
        </div>

        <IonLoading
          isOpen={loading}
          message="Updating ministry..."
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

export default EditMinistry;
