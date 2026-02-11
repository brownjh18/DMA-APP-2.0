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
  IonText,
  IonIcon,
  IonLoading,
  IonAlert,
  IonAvatar,
  IonToast,
  IonSelect,
  IonSelectOption
} from '@ionic/react';
import { person, call, create, checkmarkCircle, camera, image, arrowBack } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import apiService, { BACKEND_BASE_URL } from '../services/api';
import { AuthContext } from '../App';

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


      // Update profile information
      const profileResponse = await apiService.updateProfile({
        name: formData.name,
        phone: formData.phone
      });



      let profilePictureUrl = user?.profilePicture;
      let finalResponse = profileResponse;

      // Upload profile picture if selected
      if (selectedImage) {
        const formDataUpload = new FormData();
        formDataUpload.append('profilePicture', selectedImage);
        const uploadResponse = await apiService.uploadProfilePicture(formDataUpload);
  
        profilePictureUrl = uploadResponse.user.profilePicture;
        finalResponse = uploadResponse; // Use the upload response if it has the token
      }

  

      // Update token in localStorage if new token provided
      if (finalResponse.token) {
        localStorage.setItem('token', finalResponse.token);
        apiService.setToken(finalResponse.token);
      }

      // Update global user state
      const updatedUser = {
        ...finalResponse.user,
        profilePicture: profilePictureUrl
      };
      updateUser(updatedUser);
      setUser(updatedUser);

      // Clear form selections
      setSelectedImage(null);
      setImagePreview(null);

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
        <IonHeader translucent>
          <div
            onClick={() => history.goBack()}
            style={{
              position: 'absolute',
              top: 'calc(var(--ion-safe-area-top) - -5px)',
              left: 20,
              width: 45,
              height: 45,
              borderRadius: 25,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 6px 16px rgba(0,0,0,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 999,
              transition: 'transform 0.2s ease'
            }}
            onMouseDown={(e) => {
              const target = e.currentTarget as HTMLElement;
              target.style.transform = 'scale(0.8)';
            }}
            onMouseUp={(e) => {
              const target = e.currentTarget as HTMLElement;
              setTimeout(() => {
                target.style.transform = 'scale(1)';
              }, 200);
            }}
            onMouseLeave={(e) => {
              const target = e.currentTarget as HTMLElement;
              target.style.transform = 'scale(1)';
            }}
          >
            <IonIcon
              icon={arrowBack}
              style={{
                color: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? '#ffffff' : '#000000',
                fontSize: '20px',
              }}
            />
          </div>
          <IonToolbar className="toolbar-ios">
              <IonTitle className="title-ios">Edit Profile</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen className="content-ios">
          <div style={{ padding: '20px', textAlign: 'center' }}>
            Loading...
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!user) {
    return (
      <IonPage>
        <IonHeader translucent>
          <div
            onClick={() => history.goBack()}
            style={{
              position: 'absolute',
              top: 'calc(var(--ion-safe-area-top) - -5px)',
              left: 20,
              width: 45,
              height: 45,
              borderRadius: 25,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 6px 16px rgba(0,0,0,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 999,
              transition: 'transform 0.2s ease'
            }}
            onMouseDown={(e) => {
              const target = e.currentTarget as HTMLElement;
              target.style.transform = 'scale(0.8)';
            }}
            onMouseUp={(e) => {
              const target = e.currentTarget as HTMLElement;
              setTimeout(() => {
                target.style.transform = 'scale(1)';
              }, 200);
            }}
            onMouseLeave={(e) => {
              const target = e.currentTarget as HTMLElement;
              target.style.transform = 'scale(1)';
            }}
          >
            <IonIcon
              icon={arrowBack}
              style={{
                color: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? '#ffffff' : '#000000',
                fontSize: '20px',
              }}
            />
          </div>
          <IonToolbar className="toolbar-ios">
            <IonTitle className="title-ios">Edit Profile</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen className="content-ios">
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <IonIcon icon={person} style={{ fontSize: '4em', color: 'var(--ion-text-color)', marginBottom: '20px' }} />
            <h2 style={{ color: 'var(--ion-text-color)', marginBottom: '20px' }}>Authentication Required</h2>
            <p style={{ color: 'var(--ion-text-color)', marginBottom: '30px' }}>
              Please sign in to edit your profile.
            </p>
            <IonButton
              expand="block"
              style={{
                backgroundColor: 'var(--ion-color-primary)',
                color: 'white',
                borderRadius: '12px',
                fontWeight: '600'
              }}
              onClick={() => history.push('/signin')}
            >
              Sign In
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader translucent>
        <div
          onClick={() => history.goBack()}
          style={{
            position: 'absolute',
            top: 'calc(var(--ion-safe-area-top) - -5px)',
            left: 20,
            width: 45,
            height: 45,
            borderRadius: 25,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 6px 16px rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 999,
            transition: 'transform 0.2s ease'
          }}
          onMouseDown={(e) => {
            const target = e.currentTarget as HTMLElement;
            target.style.transform = 'scale(0.8)';
          }}
          onMouseUp={(e) => {
            const target = e.currentTarget as HTMLElement;
            setTimeout(() => {
              target.style.transform = 'scale(1)';
            }, 200);
          }}
          onMouseLeave={(e) => {
            const target = e.currentTarget as HTMLElement;
            target.style.transform = 'scale(1)';
          }}
        >
          <IonIcon
            icon={arrowBack}
            style={{
              color: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? '#ffffff' : '#000000',
              fontSize: '20px',
            }}
          />
        </div>
        <IonToolbar className="toolbar-ios">
            <IonTitle className="title-ios">Edit Profile</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
        <div style={{
          padding: '20px',
          maxWidth: '400px',
          margin: '0 auto',
          paddingTop: '40px'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <IonIcon
              icon={create}
              style={{
                fontSize: '3em',
                color: 'var(--ion-color-primary)',
                marginBottom: '16px'
              }}
            />
            <h1 style={{
              margin: '0 0 8px 0',
              fontSize: '1.8em',
              fontWeight: '700',
              color: 'var(--ion-text-color)'
            }}>
              Edit Profile
            </h1>
            <p style={{
              margin: '0 0 4px 0',
              color: 'var(--ion-text-color)',
              opacity: 0.7,
              fontSize: '1em'
            }}>
              Update your account information
            </p>
            <p style={{
              margin: '0',
              color: 'var(--ion-color-medium)',
              fontSize: '0.9em'
            }}>
              {user.email}
            </p>
          </div>

          {/* Profile Picture Section */}
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{
              margin: '0 0 16px 0',
              fontSize: '1.4em',
              fontWeight: '600',
              color: 'var(--ion-text-color)'
            }}>
              Profile Picture
            </h2>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px'
            }}>
              {/* Current/Preview Image */}
              <div style={{ position: 'relative' }}>
                <IonAvatar style={{
                  width: '120px',
                  height: '120px',
                  border: '4px solid var(--ion-color-primary)',
                  background: 'black'
                }}>
                  <img
                    src={imagePreview || 
                      (user?.profilePicture ? `${BACKEND_BASE_URL}${user.profilePicture}?t=${Date.now()}` : 
                       `https://i.pravatar.cc/150?img=12&u=${encodeURIComponent(user?.email || 'default')}`)}
                    alt="Profile Preview"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      // Fallback to default avatar if image fails to load
                      (e.target as HTMLImageElement).src = `https://i.pravatar.cc/150?img=12&u=${encodeURIComponent(user?.email || 'default')}`;
                    }}
                  />
                </IonAvatar>

                {/* Camera overlay */}
                <div style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '8px',
                  backgroundColor: 'var(--ion-color-primary)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}>
                  <IonIcon icon={camera} style={{ color: 'white', fontSize: '1.2em' }} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      opacity: 0,
                      cursor: 'pointer'
                    }}
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Edit Profile Form */}
          <form onSubmit={handleSave}>
            {/* Name Input */}
            <IonItem
              style={{
                marginBottom: '16px',
                borderRadius: '12px',
                border: '1px solid var(--ion-color-step-300)',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                '--border-radius': '12px'
              }}
              lines="none"
            >
              <IonIcon icon={person} slot="start" style={{ color: 'var(--ion-color-primary)' }} />
              <IonInput
                type="text"
                value={formData.name}
                onIonChange={(e) => handleInputChange('name', e.detail.value!)}
                placeholder="Full name"
                required
                style={{ color: 'var(--ion-text-color)' }}
              />
            </IonItem>

            {/* Phone Input */}
            <IonItem
              style={{
                marginBottom: '24px',
                borderRadius: '12px',
                border: '1px solid var(--ion-color-step-300)',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                '--border-radius': '12px'
              }}
              lines="none"
            >
              <IonIcon icon={call} slot="start" style={{ color: 'var(--ion-color-primary)' }} />
              <IonInput
                type="tel"
                value={formData.phone}
                onIonChange={(e) => handleInputChange('phone', e.detail.value!)}
                placeholder="Phone number (optional)"
                style={{ color: 'var(--ion-text-color)' }}
              />
            </IonItem>

            {/* Save Button */}
            <IonButton
              expand="block"
              type="submit"
              style={{
                height: '48px',
                borderRadius: '24px',
                fontWeight: '600',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(30px) saturate(150%)',
                WebkitBackdropFilter: 'blur(30px) saturate(150%)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 15px 45px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
                color: '#ffffff',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '--border-radius': '24px'
              }}
              disabled={saving}
              onMouseDown={(e) => {
                const target = e.currentTarget as HTMLElement;
                target.style.transform = 'scale(0.98)';
                target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.3)';
              }}
              onMouseUp={(e) => {
                const target = e.currentTarget as HTMLElement;
                setTimeout(() => {
                  target.style.transform = 'scale(1)';
                  target.style.boxShadow = '0 15px 45px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.4)';
                }, 200);
              }}
              onMouseLeave={(e) => {
                const target = e.currentTarget as HTMLElement;
                target.style.transform = 'scale(1)';
                target.style.boxShadow = '0 15px 45px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.4)';
              }}
            >
              <IonIcon icon={checkmarkCircle} slot="start" />
              {saving ? 'Saving...' : 'Save Changes'}
            </IonButton>
          </form>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <IonText style={{
              color: 'var(--ion-text-color)',
              opacity: 0.6,
              fontSize: '0.8em'
            }}>
              Dove Ministries Africa
            </IonText>
          </div>
        </div>

        {/* Loading Spinner */}
        <IonLoading
          isOpen={saving}
          message="Saving your changes..."
          spinner="crescent"
        />

        {/* Success Toast */}
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={success}
          duration={2000}
          color="success"
          position="top"
        />

        {/* Alert */}
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header={error ? 'Error' : 'Success'}
          message={error || success}
          buttons={error ? ['Try Again'] : ['OK']}
        />
      </IonContent>
    </IonPage>
  );
};

export default EditProfile;