import React, { useState, useEffect, useContext } from 'react';
import {
  IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton, IonIcon, IonLoading, IonAlert, IonText, IonSpinner
} from '@ionic/react';
import {
  save, person, closeCircle, image, personOutline, mail, lockClosed, call, shield, checkmarkCircle, informationCircle, arrowBack
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { apiService } from '../services/api';

import { AuthContext } from '../App';
import { useSettings } from '../contexts/SettingsContext';
import './AdminForm.css';
import './AdminDashboard.css';

const AddUser: React.FC = () => {
  const history = useHistory();
  const { isLoggedIn, isAdmin } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertHeader, setAlertHeader] = useState('Notice');
  const { isDarkMode } = useSettings();
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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

  if (!isLoggedIn || !isAdmin) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <div className="af-loading">
            <IonSpinner name="crescent" color="primary" />
            <p style={{ fontSize: '14px', marginTop: '16px' }}>Checking permissions...</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', phone: '', role: 'user'
  });

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
    if (!formData.name || !formData.email || !formData.password) {
      setAlertHeader('Validation Error');
      setAlertMessage('Please fill in all required fields (Name, Email, Password)');
      setShowAlert(true);
      return;
    }

    setLoading(true);
    try {
      const userData: any = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || undefined,
        role: formData.role
      };

      if (profilePreview) {
        const input = fileInputRef.current;
        if (input && input.files && input.files[0]) {
          const profileFormData = new FormData();
          profileFormData.append('profileFile', input.files[0]);
          const response = await apiService.uploadThumbnail(profileFormData);
          userData.profilePicture = response.thumbnailUrl;
        }
      }

      await apiService.adminRegister(userData);
      setLoading(false);
      setAlertHeader('Success!');
      setAlertMessage('User created successfully!');
      setShowAlert(true);
      sessionStorage.setItem('usersNeedRefresh', 'true');
      setTimeout(() => history.push('/admin/users'), 1500);
    } catch (error) {
      setLoading(false);
      setAlertHeader('Error');
      setAlertMessage(error instanceof Error ? error.message : 'Failed to create user');
      setShowAlert(true);
    }
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <IonButton fill="clear" slot="start" onClick={() => history.goBack()} style={{ marginLeft: '4px' }}><IonIcon icon={arrowBack} style={{ fontSize: '22px' }} /></IonButton>
          <IonTitle className="title-ios" style={{ textAlign: 'left', marginLeft: '-16px' }}>Add User</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding">
        <div className="af-page">
          <div className="af-section">
            <div className="af-card" style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'var(--ion-color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <IonIcon icon={person} style={{ color: '#fff', fontSize: '28px' }} />
              </div>
              <h1 className="nd-title" style={{ margin: '0 0 6px 0', fontSize: '22px' }}>Add New User</h1>
              <p style={{ margin: '0', color: 'var(--ion-color-medium)', fontSize: '14px' }}>Create a new user account</p>
            </div>
          </div>

          <div className="af-section">
            <div className="af-card">
              <div className="af-row" style={{ marginBottom: '16px' }}>
                <button type="button" onClick={() => handleInputChange('role', 'user')}
                  className={`af-submit ${formData.role === 'user' ? '' : 'af-submit-secondary'}`}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <IonIcon icon={person} /> User
                </button>
                <button type="button" onClick={() => handleInputChange('role', 'admin')}
                  className={`af-submit ${formData.role === 'admin' ? '' : 'af-submit-secondary'}`}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <IonIcon icon={shield} /> Admin
                </button>
              </div>

              <div className="af-field" style={{ textAlign: 'center' }}>
                <label className="af-label">Profile Picture</label>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleProfileSelect} style={{ display: 'none' }} />
                {!profilePreview ? (
                  <div className="af-upload" onClick={() => fileInputRef.current?.click()}>
                    <div className="af-upload-icon"><IonIcon icon={image} style={{ fontSize: '32px' }} /></div>
                    <p className="af-upload-text">Click to upload photo</p>
                    <p className="af-upload-hint">JPG, PNG (Max 5MB)</p>
                  </div>
                ) : (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img src={profilePreview} alt="Profile preview" className="af-upload-preview" style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--ion-color-primary)' }} />
                    <button type="button" onClick={() => { setProfilePreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
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
                <label className="af-label">Password <span className="af-required">*</span></label>
                <input type="password" className="af-input" value={formData.password} onChange={(e) => handleInputChange('password', e.target.value)} placeholder="Enter password" />
              </div>

              <div className="af-field">
                <label className="af-label">Phone Number</label>
                <input type="tel" className="af-input" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} placeholder="Enter phone number (optional)" />
              </div>
            </div>
          </div>

          <button onClick={handleSave} disabled={loading} className="af-submit">
            {loading ? (
              <><IonSpinner name="crescent" color="white" style={{ width: '20px', height: '20px' }} /><span> Creating User...</span></>
            ) : (
              <><IonIcon icon={save} style={{ fontSize: '18px', marginRight: '8px' }} />Create User</>
            )}
          </button>

          <div className="af-footer">
            <IonText>Dove Church - User Management System</IonText>
          </div>
        </div>

        <IonLoading isOpen={loading} message="Creating user..." duration={0} />
        <IonAlert isOpen={showAlert} onDidDismiss={() => setShowAlert(false)} header={alertHeader} message={alertMessage} buttons={[{ text: 'OK', role: 'cancel' }]} />
      </IonContent>
    </IonPage>
  );
};

export default AddUser;
