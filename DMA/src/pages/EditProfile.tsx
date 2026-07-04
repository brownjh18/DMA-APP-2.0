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
import { camera, checkmarkCircle, person, call } from 'ionicons/icons';
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
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


  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      setError('Name is required');
      setShowAlert(true);
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('phone', formData.phone);
      if (selectedImage) {
        data.append('profilePicture', selectedImage);
      }

      const response = await apiService.updateProfile(data);
      
      const updatedUserData = response.user || {};

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
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/profile" />
          </IonButtons>
          <IonTitle>Edit Profile</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <div className="edit-profile-container">
          <div className="avatar-section">
            <IonAvatar className="profile-avatar">
              <img
                src={imagePreview || (user?.profilePicture ? `${BACKEND_BASE_URL}${user.profilePicture}?t=${Date.now()}` : `https://i.pravatar.cc/150?img=12&u=${encodeURIComponent(user?.email || 'default')}`)}
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

          <form onSubmit={handleSave} className="form-section">
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
              type="submit"
              className="save-button"
              disabled={saving}
            >
              <IonIcon icon={checkmarkCircle} slot="start" />
              {saving ? 'Saving...' : 'Save Changes'}
            </IonButton>
          </form>
        </div>

        <IonLoading isOpen={saving} message="Saving..." />
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