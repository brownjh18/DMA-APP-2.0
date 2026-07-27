import React, { useState, useEffect, useContext } from 'react';
import {
  IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton, IonIcon, IonAlert, IonText, IonSpinner
} from '@ionic/react';
import {
  save, person, closeCircle, image, personOutline, mail, lockClosed, call, shield, checkmarkCircle, informationCircle, arrowBack
} from 'ionicons/icons';
import { useHistory, useRouteMatch } from 'react-router-dom';
import SaveProgressModal, { SaveProgressStep } from '../components/SaveProgressModal';
import { apiService } from '../services/api';
import { BACKEND_BASE_URL } from '../services/api';

import { AuthContext } from '../App';
import { useSettings } from '../contexts/SettingsContext';
import './AdminForm.css';
import './AdminDashboard.css';

const EditUser: React.FC = () => {
  const history = useHistory();
  const match = useRouteMatch<{ id: string }>('/admin/users/edit/:id');
  const userId = match?.params?.id;
  const { isLoggedIn, isAdmin } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertHeader, setAlertHeader] = useState('Notice');
  const { isDarkMode } = useSettings();
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [existingProfilePicture, setExistingProfilePicture] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveSteps, setSaveSteps] = useState<SaveProgressStep[]>([]);
  const [saveProgress, setSaveProgress] = useState(0);
  const [saveStatus, setSaveStatus] = useState<'uploading' | 'success' | 'error'>('uploading');
  const [saveError, setSaveError] = useState('');

  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', role: 'user'
  });

  useEffect(() => {
    return () => {
      if (profilePreview && profilePreview.startsWith('blob:')) {
        URL.revokeObjectURL(profilePreview);
      }
    };
  }, [profilePreview]);

  useEffect(() => {
    if (!isLoggedIn || !isAdmin) {
      history.push('/signin');
    }
  }, [isLoggedIn, isAdmin, history]);

  useEffect(() => {
    const loadUser = async () => {
      if (!userId) return;

      const locationState = history.location.state as any;
      if (locationState?.user) {
        const u = locationState.user;
        setFormData({
          name: u.name || '',
          email: u.email || '',
          phone: u.phone || '',
          role: u.role || 'user'
        });
        if (u.profilePicture) {
          const picUrl = u.profilePicture.startsWith('data:')
            ? u.profilePicture
            : `${BACKEND_BASE_URL}${u.profilePicture}`;
          setExistingProfilePicture(picUrl);
        }
        setLoading(false);
        return;
      }

      try {
        const res = await apiService.getUsers();
        const users = res.users || res || [];
        const user = users.find((u: any) => (u._id || u.id) === userId);
        if (user) {
          setFormData({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            role: user.role || 'user'
          });
          if (user.profilePicture) {
            const picUrl = user.profilePicture.startsWith('data:')
              ? user.profilePicture
              : `${BACKEND_BASE_URL}${user.profilePicture}`;
            setExistingProfilePicture(picUrl);
          }
        } else {
          setAlertHeader('Error');
          setAlertMessage('User not found');
          setShowAlert(true);
          setTimeout(() => history.push('/admin/users'), 1500);
        }
      } catch {
        setAlertHeader('Error');
        setAlertMessage('Failed to load user data');
        setShowAlert(true);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [userId, history]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleProfileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (file && file.size > 5 * 1024 * 1024) {
      setAlertHeader('Upload Error');
      setAlertMessage('Profile picture file size must be less than 5MB');
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
      setProfilePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      setAlertHeader('Validation Error');
      setAlertMessage('Please fill in all required fields (Name, Email)');
      setShowAlert(true);
      return;
    }

    const hasProfile = profilePreview && fileInputRef.current?.files?.[0];
    const steps: SaveProgressStep[] = hasProfile
      ? [
          { label: 'Uploading profile picture', status: 'pending' },
          { label: 'Updating user account', status: 'pending' },
        ]
      : [
          { label: 'Updating user account', status: 'pending' },
        ];

    setSaveSteps(steps);
    setSaveProgress(0);
    setSaveStatus('uploading');
    setSaveError('');
    setShowSaveModal(true);
    setSaving(true);

    try {
      let currentStepIndex = 0;

      const userData: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        role: formData.role
      };

      const updateStep = (idx: number, patch: Partial<SaveProgressStep>) =>
        setSaveSteps(prev => prev.map((s, i) => i === idx ? { ...s, ...patch } : s));

      if (hasProfile) {
        const input = fileInputRef.current!;
        const profileFormData = new FormData();
        profileFormData.append('thumbnailFile', input.files![0]);

        updateStep(0, { status: 'active', progress: 0 });

        const response = await apiService.uploadThumbnail(profileFormData, (pct) => {
          updateStep(0, { progress: pct });
          setSaveProgress(Math.round((pct / 100) * 50));
        });
        userData.profilePicture = response.thumbnailUrl;

        updateStep(0, { status: 'success', progress: 100 });
        setSaveProgress(50);
        currentStepIndex = 1;
      }

      updateStep(currentStepIndex, { status: 'active' });

      await apiService.updateUser(userId!, userData);

      updateStep(currentStepIndex, { status: 'success' });
      setSaveProgress(100);
      setSaveStatus('success');
      sessionStorage.setItem('usersNeedRefresh', 'true');
      setTimeout(() => history.push('/admin/users'), 1500);
    } catch (error) {
      setSaveStatus('error');
      setSaveError(error instanceof Error ? error.message : 'Failed to update user');
      setSaveSteps(prev => prev.map(s => s.status === 'active' ? { ...s, status: 'error' } : s));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader translucent>
          <IonToolbar className="toolbar-ios">
            <IonButton fill="clear" slot="start" onClick={() => history.goBack()} style={{ marginLeft: '4px' }}><IonIcon icon={arrowBack} style={{ fontSize: '22px' }} /></IonButton>
            <IonTitle className="title-ios" style={{ textAlign: 'left', marginLeft: '-16px' }}>Edit User</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen className="ion-padding">
          <div className="af-loading">
            <IonSpinner name="crescent" color="primary" />
            <p style={{ fontSize: '14px', marginTop: '16px' }}>Loading user...</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  const displayImage = profilePreview || existingProfilePicture;

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <IonButton fill="clear" slot="start" onClick={() => history.goBack()} style={{ marginLeft: '4px' }}><IonIcon icon={arrowBack} style={{ fontSize: '22px' }} /></IonButton>
          <IonTitle className="title-ios" style={{ textAlign: 'left', marginLeft: '-16px' }}>Edit User</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding">
        <div className="af-page">
          <div className="af-section">
            <div className="af-card" style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'var(--ion-color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <IonIcon icon={person} style={{ color: '#fff', fontSize: '28px' }} />
              </div>
              <h1 className="nd-title" style={{ margin: '0 0 6px 0', fontSize: '22px' }}>Edit User</h1>
              <p style={{ margin: '0', color: 'var(--ion-color-medium)', fontSize: '14px' }}>Update user account details</p>
            </div>
          </div>

          <div className="af-section">
            <div className="af-card">
              <div className="af-row" style={{ marginBottom: '16px', gap: '12px', justifyContent: 'center' }}>
                <button type="button" onClick={() => handleInputChange('role', 'user')}
                  className="role-btn role-btn-user"
                  style={formData.role === 'user' ? { background: 'rgba(99, 102, 241, 0.18)', color: '#6366f1', borderColor: 'rgba(99, 102, 241, 0.3)' } : undefined}>
                  <IonIcon icon={person} /> User
                </button>
                <button type="button" onClick={() => handleInputChange('role', 'admin')}
                  className="role-btn role-btn-admin"
                  style={formData.role === 'admin' ? { background: 'rgba(245, 158, 11, 0.18)', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.3)' } : undefined}>
                  <IonIcon icon={shield} /> Admin
                </button>
              </div>

              <div className="af-field" style={{ textAlign: 'center' }}>
                <label className="af-label">Profile Picture</label>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleProfileSelect} style={{ display: 'none' }} />
                {!displayImage ? (
                  <div className="af-upload" onClick={() => fileInputRef.current?.click()}>
                    <div className="af-upload-icon"><IonIcon icon={image} style={{ fontSize: '32px' }} /></div>
                    <p className="af-upload-text">Click to upload photo</p>
                    <p className="af-upload-hint">JPG, PNG (Max 5MB)</p>
                  </div>
                ) : (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img src={displayImage} alt="Profile preview" className="af-upload-preview" style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--ion-color-primary)' }} />
                    <button type="button" onClick={() => { setProfilePreview(null); setExistingProfilePicture(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                      style={{ position: 'absolute', top: '-8px', right: '-8px', width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: '#ef4444', color: '#fff', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                      <IonIcon icon={closeCircle} />
                    </button>
                  </div>
                )}
              </div>

              <div className="af-field">
                <label className="af-label">Full Name <span className="af-required">*</span></label>
                <input type="text" className="af-input" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} placeholder="Enter full name" />
              </div>

              <div className="af-field">
                <label className="af-label">Email Address <span className="af-required">*</span></label>
                <input type="email" className="af-input" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} placeholder="Enter email address" />
              </div>

              <div className="af-field">
                <label className="af-label">Phone Number</label>
                <input type="tel" className="af-input" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} placeholder="Enter phone number (optional)" />
              </div>
            </div>
          </div>

          <button onClick={handleSave} disabled={saving} className="af-submit">
            {saving ? (
              <><IonSpinner name="crescent" color="white" style={{ width: '20px', height: '20px' }} /><span> Saving...</span></>
            ) : (
              <><IonIcon icon={save} style={{ fontSize: '18px', marginRight: '8px' }} />Update User</>
            )}
          </button>

          <div className="af-footer">
            <IonText>Dove Church - User Management System</IonText>
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
          title="Updating user..."
        />
        <IonAlert isOpen={showAlert} onDidDismiss={() => setShowAlert(false)} header={alertHeader} message={alertMessage} buttons={[{ text: 'OK', role: 'cancel' }]} />
      </IonContent>
    </IonPage>
  );
};

export default EditUser;
