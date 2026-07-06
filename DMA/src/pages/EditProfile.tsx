import React, { useState, useEffect, useContext } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
  IonLoading,
  IonAlert,
  IonAvatar,
  IonToast,
  IonButtons,
  IonBackButton,
} from '@ionic/react';
import { camera, checkmarkCircle, person, call, arrowBack } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import apiService, { BACKEND_BASE_URL } from '../services/api';
import { AuthContext } from '../App';
import './EditProfile.css';

const EditProfile: React.FC = () => {
  const { user: authUser, updateUser } = useContext(AuthContext);
  const [user, setUser] = useState<any>(authUser);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const history = useHistory();

  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  });

  useEffect(() => {
    const loadUserData = async () => {
      try {
        if (authUser) {
          // Use AuthContext user data as primary source
          setUser(authUser);
          setFormData({
            name: authUser.name || '',
            phone: authUser.phone || ''
          });

        } else {
          // Fallback to API if no AuthContext user
          const token = localStorage.getItem('token');
          if (token) {
            apiService.setToken(token);
            const userData = await apiService.getProfile();
            setUser(userData.user);
            setFormData({
              name: userData.user.name || '',
              phone: userData.user.phone || ''
            });

          } else {
            history.push('/signin');
            return;
          }
        }
      } catch (error) {

        setError('Failed to load user data. Please try again.');
        setShowAlert(true);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [authUser, history]);

  // Sync user state when AuthContext user changes
  useEffect(() => {
    if (authUser && authUser !== user) {
      setUser(authUser);
      setFormData({
        name: authUser.name || '',
        phone: authUser.phone || ''
      });

    }
  }, [authUser, user]);

  const handleInputChange = (field: string, value: string | null | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value || ''
    }));
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


  const handleSave = async () => {
    console.log('🔵 handleSave called, formData:', formData);

    if (!formData.name) {
      setError('Name is required');
      setShowAlert(true);
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      let profilePictureUrl = user?.profilePicture || null;

      // Convert image to base64 data URL if selected (avoids CORS issues with Vercel upload endpoint)
      if (selectedImage) {
        console.log('📤 Converting image to base64...');
        try {
          const base64Url = await new Promise<string>((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const maxSize = 400;
              let { width, height } = img;
              if (width > maxSize || height > maxSize) {
                if (width > height) { height = Math.round(height * maxSize / width); width = maxSize; }
                else { width = Math.round(width * maxSize / height); height = maxSize; }
              }
              canvas.width = width;
              canvas.height = height;
              canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL('image/jpeg', 0.85));
            };
            img.onerror = () => reject(new Error('Failed to load image for resize'));
            img.src = URL.createObjectURL(selectedImage);
          });
          profilePictureUrl = base64Url;
          console.log('✅ Image resized and converted, size:', Math.round(base64Url.length / 1024), 'KB');
        } catch (imgErr: any) {
          console.error('Image conversion failed (non-blocking):', imgErr);
        }
      }

      // Build update payload — only send changed fields
      const updatePayload: Record<string, any> = {
        name: formData.name,
        phone: formData.phone || '',
      };
      if (profilePictureUrl && profilePictureUrl !== user?.profilePicture) {
        updatePayload.profilePicture = profilePictureUrl;
      }

      console.log('📤 Calling updateProfile with payload:', { ...updatePayload, profilePicture: updatePayload.profilePicture ? '[base64...]' : undefined });
      const response = await apiService.updateProfile(updatePayload);
      console.log('✅ updateProfile response:', response);

      // Use the full user data from response, falling back to current state
      const updatedUserData = {
        ...user,
        ...(response.user || {}),
      };

      // Update global user state with the latest data
      updateUser(updatedUserData);
      setUser(updatedUserData);

      // Also update localStorage directly for persistence
      localStorage.setItem('user', JSON.stringify(updatedUserData));

      // Clear all API cache to ensure fresh data is loaded
      apiService.clearAllCache();

      // Clear form selections
      setSelectedImage(null);
      setImagePreview(null);

      // Force a refresh of the user profile to get the latest data
      try {
        const refreshedUserData = await apiService.getProfile(true);
        if (refreshedUserData.user) {
          updateUser(refreshedUserData.user);
        }
      } catch (refreshError) {
        console.error('Failed to refresh user data after update:', refreshError);
      }

      // Show success message
      setSuccess('Profile updated successfully!');
      setShowToast(true);

      // Redirect to profile page after a short delay
      setTimeout(() => {
        history.push('/profile');
      }, 1500);

    } catch (err: any) {
      console.error('Profile save error:', err);
      setError(err.message || 'Failed to update profile. Please try again.');
      setShowAlert(true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/profile" />
            </IonButtons>
            <IonTitle>Edit Profile</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding ion-text-center">
          <IonLabel>Loading...</IonLabel>
        </IonContent>
      </IonPage>
    );
  }

  if (!user) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/profile" />
            </IonButtons>
            <IonTitle>Edit Profile</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding ion-text-center">
          <h2>Authentication Required</h2>
          <p>Please sign in to edit your profile.</p>
          <IonButton routerLink="/signin">Sign In</IonButton>
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
          <IonTitle className="title-ios" style={{ textAlign: 'left', marginLeft: '-16px' }}>Edit Profile</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <div className="edit-profile-container">
          <div className="avatar-section">
            <IonAvatar className="profile-avatar">
              <img
                src={imagePreview || (user?.profilePicture ? (user.profilePicture.startsWith('data:') ? user.profilePicture : `${BACKEND_BASE_URL}${user.profilePicture}?t=${Date.now()}`) : `https://i.pravatar.cc/150?img=12&u=${encodeURIComponent(user?.email || 'default')}`)}
                alt="Profile Preview"
              />
            </IonAvatar>
            <div className="camera-overlay">
              <IonIcon icon={camera} />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="image-upload-input"
              />
            </div>
          </div>
          <p className="user-email">{user.email}</p>

          <div className="form-section">
            <IonItem lines="none" className="input-item">
              <IonIcon icon={person} slot="start" />
              <IonInput
                type="text"
                value={formData.name}
                onIonChange={(e) => handleInputChange('name', e.detail.value!)}
                placeholder="Full name"
                required
              />
            </IonItem>

            <IonItem lines="none" className="input-item">
              <IonIcon icon={call} slot="start" />
              <IonInput
                type="tel"
                value={formData.phone}
                onIonChange={(e) => handleInputChange('phone', e.detail.value!)}
                placeholder="Phone number (optional)"
              />
            </IonItem>

            <IonButton
              expand="block"
              onClick={handleSave}
              className="save-button"
              disabled={saving}
            >
              <IonIcon icon={checkmarkCircle} slot="start" />
              {saving ? 'Saving...' : 'Save Changes'}
            </IonButton>
          </div>
        </div>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={success}
          duration={2000}
          color="success"
          position="top"
        />
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header={'Error'}
          message={error}
          buttons={['OK']}
        />
      </IonContent>
    </IonPage>
  );
};

export default EditProfile;