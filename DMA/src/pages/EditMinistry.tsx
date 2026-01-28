import React, { useState, useEffect, useContext } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonText,
  IonLoading,
  IonAlert
} from '@ionic/react';
import {
  save,
  people,
  text,
  calendar,
  person,
  image,
  closeCircle,
  arrowBack
} from 'ionicons/icons';
import { useHistory, useParams, useLocation } from 'react-router-dom';
import { apiService } from '../services/api';
import { AuthContext } from '../App';

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

  // Redirect if not logged in or not admin
  useEffect(() => {
    if (!isLoggedIn || !isAdmin) {
      history.push('/signin');
    }
  }, [isLoggedIn, isAdmin, history]);

  // Show loading if auth check is in progress
  if (!isLoggedIn || !isAdmin) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <IonLoading isOpen={true} message="Checking permissions..." />
        </IonContent>
      </IonPage>
    );
  }

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    leader: '',
    category: '',
    meetingSchedule: '',
    endTime: '',
    location: '',
    contactEmail: '',
    contactPhone: '',
    memberCount: '',
    status: 'active'
  });

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [currentThumbnailUrl, setCurrentThumbnailUrl] = useState<string>('');
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const thumbnailInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Get ministry data from navigation state
    const ministry = (location.state as any)?.ministry;
    if (ministry) {
      setFormData({
        name: ministry.name || '',
        description: ministry.description || '',
        leader: ministry.leader || '',
        category: ministry.category || '',
        meetingSchedule: ministry.meetingSchedule || '',
        endTime: ministry.endTime || '',
        location: ministry.location || '',
        contactPhone: ministry.contactPhone || '',
        contactEmail: ministry.contactEmail || '',
        memberCount: ministry.memberCount?.toString() || '',
        status: ministry.isActive ? 'active' : 'inactive',
      });
      setCurrentThumbnailUrl(ministry.imageUrl || '');
    } else {
      // Fallback: try to load from API if no state data
      loadMinistry();
    }
  }, [location.state]);

  const loadMinistry = async () => {
    try {
      const ministry = await apiService.getMinistry(id);
      setFormData({
        name: ministry.name || '',
        description: ministry.description || '',
        leader: ministry.leader || '',
        category: ministry.category || '',
        meetingSchedule: ministry.meetingSchedule || '',
        endTime: ministry.endTime || '',
        location: ministry.location || '',
        contactEmail: ministry.contactEmail || '',
        contactPhone: ministry.contactPhone || '',
        memberCount: ministry.memberCount?.toString() || '',
        status: ministry.isActive ? 'active' : 'inactive',
      });
      setCurrentThumbnailUrl(ministry.imageUrl || '');
    } catch (error) {
      // Silently fail - data should come from navigation state
      console.log('API load failed, using navigation state data');
    }
  };

  const handleThumbnailSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setThumbnailPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview('');
    setCurrentThumbnailUrl('');
  };

  const uploadThumbnail = async (): Promise<string | null> => {
    if (!thumbnailFile) return null;

    setUploadingThumbnail(true);
    try {
      const formData = new FormData();
      formData.append('thumbnailFile', thumbnailFile);
      const response = await apiService.uploadThumbnail(formData);
      return response.thumbnailUrl;
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      throw error;
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!formData.name || !formData.description || !formData.leader || !formData.category) {
      setAlertMessage('Please fill in all required fields (Name, Description, Leader, Category)');
      setShowAlert(true);
      return;
    }

    setLoading(true);

    try {
      let imageUrl = currentThumbnailUrl;

      // Upload new thumbnail if selected
      if (thumbnailFile) {
        try {
          const uploadedUrl = await uploadThumbnail();
          if (uploadedUrl) {
            imageUrl = uploadedUrl;
          }
        } catch (error) {
          setAlertMessage('Failed to upload thumbnail. Please try again.');
          setShowAlert(true);
          setLoading(false);
          return;
        }
      }

      const ministryData: any = {
        name: formData.name,
        description: formData.description,
        leader: formData.leader,
        category: formData.category,
        imageUrl: imageUrl
      };

      if (formData.meetingSchedule) {
        ministryData.meetingSchedule = formData.meetingSchedule;
      }

      if (formData.location) {
        ministryData.location = formData.location;
      }

      if (formData.contactEmail) {
        ministryData.contactEmail = formData.contactEmail;
      }

      if (formData.contactPhone) {
        ministryData.contactPhone = formData.contactPhone;
      }

      if (formData.endTime) {
        ministryData.endTime = formData.endTime;
      }


      if (formData.memberCount) {
        ministryData.memberCount = parseInt(formData.memberCount);
      }

      ministryData.isActive = formData.status === 'active';

      console.log('Updating ministry with ID:', id, 'Data:', ministryData);
      const response = await apiService.updateMinistry(id, ministryData);
      console.log('Update response:', response);

      // Store updated ministry data for the list page
      localStorage.setItem('updatedMinistry', JSON.stringify(response.ministry));

      setAlertMessage('Ministry updated successfully!');
      setShowAlert(true);

      // Navigate back after success
      setTimeout(() => {
        history.push('/admin/ministries');
      }, 1500);
    } catch (error: any) {
      console.error('Error updating ministry:', error);
      setAlertMessage(error.message || 'Failed to update ministry');
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

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
          <IonTitle className="title-ios">Edit Ministry</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
        <div style={{ padding: '20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <IonIcon
              icon={people}
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
              Edit Ministry
            </h1>
            <p style={{
              margin: '0',
              color: 'var(--ion-text-color)',
              opacity: 0.7,
              fontSize: '1em'
            }}>
              Update ministry details and settings
            </p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Ministry Name *</IonLabel>
              <IonInput
                value={formData.name}
                onIonChange={(e) => handleInputChange('name', e.detail.value!)}
                placeholder="Enter ministry name"
              />
            </IonItem>

            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Ministry Category *</IonLabel>
              <IonSelect
                value={formData.category}
                onIonChange={(e) => handleInputChange('category', e.detail.value)}
                placeholder="Select ministry category"
              >
                <IonSelectOption value="worship">Worship Ministry</IonSelectOption>
                <IonSelectOption value="youth">Youth Ministry</IonSelectOption>
                <IonSelectOption value="children">Children Ministry</IonSelectOption>
                <IonSelectOption value="evangelism">Evangelism Ministry</IonSelectOption>
                <IonSelectOption value="intercessions">Intercessions Ministry</IonSelectOption>
                <IonSelectOption value="married-couples">Married Couples Ministry</IonSelectOption>
                <IonSelectOption value="other">Other</IonSelectOption>
              </IonSelect>
            </IonItem>

            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Leader *</IonLabel>
              <IonInput
                value={formData.leader}
                onIonChange={(e) => handleInputChange('leader', e.detail.value!)}
                placeholder="Enter leader name"
              />
            </IonItem>

            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Ministry Description *</IonLabel>
              <IonTextarea
                value={formData.description}
                onIonChange={(e) => handleInputChange('description', e.detail.value!)}
                placeholder="Describe the ministry's purpose and activities"
                rows={4}
              />
            </IonItem>

            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Meeting Schedule</IonLabel>
              <IonInput
                value={formData.meetingSchedule}
                onIonChange={(e) => handleInputChange('meetingSchedule', e.detail.value!)}
                placeholder="Enter meeting schedule"
              />
            </IonItem>

            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">End Time (Optional)</IonLabel>
              <IonInput
                type="time"
                value={formData.endTime}
                onIonChange={(e) => handleInputChange('endTime', e.detail.value!)}
                placeholder="End time of meeting"
              />
            </IonItem>

            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Location</IonLabel>
              <IonInput
                value={formData.location}
                onIonChange={(e) => handleInputChange('location', e.detail.value!)}
                placeholder="Meeting location"
              />
            </IonItem>

            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Contact Email</IonLabel>
              <IonInput
                type="email"
                value={formData.contactEmail}
                onIonChange={(e) => handleInputChange('contactEmail', e.detail.value!)}
                placeholder="Email address for inquiries"
              />
            </IonItem>

            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Contact Phone</IonLabel>
              <IonInput
                value={formData.contactPhone}
                onIonChange={(e) => handleInputChange('contactPhone', e.detail.value!)}
                placeholder="Phone number for inquiries"
              />
            </IonItem>


            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Current Member Count</IonLabel>
              <IonInput
                type="number"
                value={formData.memberCount}
                onIonChange={(e) => handleInputChange('memberCount', e.detail.value!)}
                placeholder="Approximate number of members"
              />
            </IonItem>

            <IonItem style={{ marginBottom: '16px', '--border-radius': '12px' }}>
              <IonLabel position="stacked">Status</IonLabel>
              <IonSelect
                value={formData.status}
                onIonChange={(e) => handleInputChange('status', e.detail.value)}
              >
                <IonSelectOption value="active">Active</IonSelectOption>
                <IonSelectOption value="inactive">Inactive</IonSelectOption>
              </IonSelect>
            </IonItem>

            {/* Thumbnail Upload */}
            <div style={{ marginBottom: '16px' }}>
              <IonLabel style={{ display: 'block', marginBottom: '8px', fontSize: '0.9em', color: 'var(--ion-color-medium)' }}>
                Ministry Thumbnail (Optional)
              </IonLabel>

              {/* Hidden file input - always present */}
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/*"
                onChange={handleThumbnailSelect}
                style={{ display: 'none' }}
              />

              {(thumbnailPreview || currentThumbnailUrl) ? (
                <div style={{
                  borderRadius: '12px',
                  overflow: 'hidden',
                  backgroundColor: 'rgba(0,0,0,0.02)'
                }}>
                  <img
                    src={thumbnailPreview || currentThumbnailUrl}
                    alt="Thumbnail preview"
                    style={{
                      width: '100%',
                      height: '200px',
                      objectFit: 'cover',
                      display: 'block'
                    }}
                  />
                  <div style={{ padding: '12px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <IonButton
                      fill="clear"
                      size="small"
                      onClick={() => thumbnailInputRef.current?.click()}
                      style={{
                        borderRadius: '25px',
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.08) 100%)',
                        backdropFilter: 'blur(20px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                        color: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? '#ffffff' : '#000000',
                        fontWeight: '600',
                        transition: 'transform 0.2s ease',
                        minWidth: '80px',
                        height: '32px'
                      }}
                      onMouseDown={(e) => {
                        const target = e.currentTarget as HTMLElement;
                        target.style.transform = 'scale(0.95)';
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
                      <IonIcon icon={image} slot="start" />
                      Change
                    </IonButton>
                    <IonButton
                      fill="clear"
                      size="small"
                      color="danger"
                      onClick={removeThumbnail}
                      style={{
                        borderRadius: '25px',
                        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(239, 68, 68, 0.15) 50%, rgba(239, 68, 68, 0.08) 100%)',
                        backdropFilter: 'blur(20px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        boxShadow: '0 8px 32px rgba(239, 68, 68, 0.2), inset 0 1px 0 rgba(239, 68, 68, 0.1)',
                        color: '#ffffff',
                        fontWeight: '600',
                        transition: 'transform 0.2s ease',
                        minWidth: '80px',
                        height: '32px'
                      }}
                      onMouseDown={(e) => {
                        const target = e.currentTarget as HTMLElement;
                        target.style.transform = 'scale(0.95)';
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
                      <IonIcon icon={closeCircle} slot="start" />
                      Remove
                    </IonButton>
                  </div>
                </div>
              ) : (
                <div style={{
                  border: '2px dashed var(--ion-color-medium)',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center',
                  backgroundColor: 'rgba(0,0,0,0.02)',
                  cursor: 'pointer'
                }}
                onClick={() => thumbnailInputRef.current?.click()}
                >
                  <IonIcon icon={image} style={{ fontSize: '2em', color: 'var(--ion-color-medium)', marginBottom: '8px' }} />
                  <p style={{ margin: '0 0 12px 0', color: 'var(--ion-color-medium)', fontSize: '0.9em' }}>
                    Click to upload a thumbnail image
                  </p>
                  <IonButton
                    fill="outline"
                    size="small"
                    style={{ '--border-radius': '6px' }}
                  >
                    <IonIcon icon={image} slot="start" />
                    Choose Image
                  </IonButton>
                </div>
              )}
            </div>
          </div>

          <IonButton
            expand="block"
            onClick={handleSave}
            disabled={loading}
            style={{
              height: '48px',
              borderRadius: '24px',
              fontWeight: '600',
              backgroundColor: 'var(--ion-color-primary)',
              '--border-radius': '24px'
            }}
          >
            <IonIcon icon={save} slot="start" />
            Update Ministry
          </IonButton>

          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <IonText style={{ color: 'var(--ion-text-color)', opacity: 0.6, fontSize: '0.9em' }}>
              Dove Ministries Africa - Ministry Management
            </IonText>
          </div>
        </div>

        <IonLoading isOpen={loading || uploadingThumbnail} message={uploadingThumbnail ? "Uploading thumbnail..." : "Updating ministry..."} />
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="Notice"
          message={alertMessage}
          buttons={['OK']}
        />
      </IonContent>
    </IonPage>
  );
};

export default EditMinistry;