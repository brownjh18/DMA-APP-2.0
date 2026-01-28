import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonItem,
  IonLabel,
  IonText,
  IonCard,
  IonCardContent,
  IonLoading
} from '@ionic/react';
import { useHistory, useParams } from 'react-router-dom';
import {
  save,
  radio,
  image,
  videocam,
  time,
  arrowBack
} from 'ionicons/icons';

interface LiveBroadcastData {
  id: string;
  title: string;
  speaker: string;
  description: string;
  thumbnailUrl?: string;
  streamUrl?: string;
  isLive: boolean;
  status: string;
  broadcastStartTime?: string;
  broadcastEndTime?: string;
}

const EditLiveBroadcast: React.FC = () => {
  const history = useHistory();
  const { id } = useParams<{ id: string }>();
  const [formData, setFormData] = useState({
    title: '',
    speaker: '',
    description: '',
    streamUrl: '',
    thumbnailFile: null as File | null,
    thumbnailUrl: '',
    status: 'draft'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originalData, setOriginalData] = useState<LiveBroadcastData | null>(null);

  useEffect(() => {
    loadBroadcastData();
  }, [id]);

  const loadBroadcastData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`/api/live-broadcasts/${id}`, { headers });
      if (!response.ok) {
        throw new Error('Failed to fetch broadcast data');
      }

      const data = await response.json();
      const broadcast: LiveBroadcastData = {
        id: data.broadcast.id,
        title: data.broadcast.title,
        speaker: data.broadcast.speaker,
        description: data.broadcast.description,
        thumbnailUrl: data.broadcast.thumbnailUrl,
        streamUrl: data.broadcast.streamUrl,
        isLive: data.broadcast.isLive,
        status: data.broadcast.status,
        broadcastStartTime: data.broadcast.broadcastStartTime,
        broadcastEndTime: data.broadcast.broadcastEndTime
      };

      setOriginalData(broadcast);
      setFormData({
        title: broadcast.title,
        speaker: broadcast.speaker,
        description: broadcast.description,
        streamUrl: broadcast.streamUrl || '',
        status: broadcast.status,
        thumbnailFile: null,
        thumbnailUrl: broadcast.thumbnailUrl || ''
      });
    } catch (error) {
      console.error('Error loading broadcast data:', error);
      alert('Failed to load broadcast data');
      history.push('/admin/radio');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = (field: string, file: File | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: file
    }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.speaker.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);

    try {
      // Check if we have file uploads
      const hasFiles = formData.thumbnailFile;

      if (hasFiles) {
        // Use FormData for file uploads
        const formDataToSend = new FormData();

        // Add text fields
        formDataToSend.append('title', formData.title);
        formDataToSend.append('speaker', formData.speaker);
        formDataToSend.append('description', formData.description);
        formDataToSend.append('streamUrl', formData.streamUrl);

        // Convert status to isPublished
        const isPublished = formData.status === 'published';
        formDataToSend.append('isPublished', isPublished.toString());

        // Add files if present
        if (formData.thumbnailFile) {
          formDataToSend.append('thumbnailFile', formData.thumbnailFile);
        }

        const token = localStorage.getItem('token');
        const headers: HeadersInit = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`/api/live-broadcasts/${id}`, {
          method: 'PUT',
          headers,
          body: formDataToSend
        });

        if (response.ok) {
          alert('Live broadcast updated successfully!');
          history.push('/admin/radio');
        } else {
          const errorData = await response.json();
          alert(`Failed to update broadcast: ${errorData.error || 'Please try again.'}`);
        }
      } else {
        // Use JSON for text-only updates
        const updateData: any = {
          title: formData.title,
          speaker: formData.speaker,
          description: formData.description,
          streamUrl: formData.streamUrl,
          isPublished: formData.status === 'published'
        };

        // Include thumbnailUrl if changed
        if (formData.thumbnailUrl !== (originalData?.thumbnailUrl || '')) {
          updateData.thumbnailUrl = formData.thumbnailUrl;
        }

        const token = localStorage.getItem('token');
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`/api/live-broadcasts/${id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(updateData)
        });

        if (response.ok) {
          alert('Live broadcast updated successfully!');
          history.push('/admin/radio');
        } else {
          const errorData = await response.json();
          alert(`Failed to update broadcast: ${errorData.error || 'Please try again.'}`);
        }
      }
    } catch (error) {
      console.error('Error updating broadcast:', error);
      alert('Failed to update broadcast. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <IonPage>
        <IonLoading isOpen={loading} message="Loading broadcast data..." />
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
          <IonTitle className="title-ios">Edit Live Broadcast</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
        <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <IonIcon
              icon={videocam}
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
              Edit Live Broadcast
            </h1>
            <p style={{
              margin: '0',
              color: 'var(--ion-text-color)',
              opacity: 0.7,
              fontSize: '1em'
            }}>
              Update live broadcast information and settings
            </p>
          </div>

          {/* Form */}
          <IonCard style={{ borderRadius: '16px', marginBottom: '20px' }}>
            <IonCardContent style={{ padding: '24px' }}>

              {/* Basic Information */}
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{
                  margin: '0 0 20px 0',
                  fontSize: '1.2em',
                  fontWeight: '600',
                  color: 'var(--ion-text-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <IonIcon icon={radio} />
                  Basic Information
                </h2>

                <IonItem style={{ marginBottom: '16px', borderRadius: '8px' }}>
                  <IonLabel position="stacked" style={{ fontWeight: '600' }}>
                    Broadcast Title *
                  </IonLabel>
                  <IonInput
                    value={formData.title}
                    onIonChange={(e) => handleInputChange('title', e.detail.value)}
                    placeholder="Enter broadcast title"
                    style={{ '--padding-start': '16px', '--inner-padding-end': '16px' }}
                  />
                </IonItem>

                <IonItem style={{ marginBottom: '16px', borderRadius: '8px' }}>
                  <IonLabel position="stacked" style={{ fontWeight: '600' }}>
                    Speaker/Presenter *
                  </IonLabel>
                  <IonInput
                    value={formData.speaker}
                    onIonChange={(e) => handleInputChange('speaker', e.detail.value)}
                    placeholder="Enter speaker name"
                    style={{ '--padding-start': '16px', '--inner-padding-end': '16px' }}
                  />
                </IonItem>

                <IonItem style={{ marginBottom: '16px', borderRadius: '8px' }}>
                  <IonLabel position="stacked" style={{ fontWeight: '600' }}>
                    Stream URL
                  </IonLabel>
                  <IonInput
                    value={formData.streamUrl}
                    onIonChange={(e) => handleInputChange('streamUrl', e.detail.value)}
                    placeholder="Enter streaming URL (optional)"
                    style={{ '--padding-start': '16px', '--inner-padding-end': '16px' }}
                  />
                </IonItem>

                <IonItem style={{ borderRadius: '8px' }}>
                  <IonLabel position="stacked" style={{ fontWeight: '600' }}>
                    Description
                  </IonLabel>
                  <IonTextarea
                    value={formData.description}
                    onIonChange={(e) => handleInputChange('description', e.detail.value)}
                    placeholder="Enter broadcast description"
                    rows={4}
                    style={{ '--padding-start': '16px', '--inner-padding-end': '16px' }}
                  />
                </IonItem>
              </div>

              {/* Media Files */}
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{
                  margin: '0 0 20px 0',
                  fontSize: '1.2em',
                  fontWeight: '600',
                  color: 'var(--ion-text-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <IonIcon icon={image} />
                  Media Files
                </h2>

                {formData.thumbnailUrl && !formData.thumbnailFile ? (
                  <div style={{
                    borderRadius: '12px',
                    overflow: 'hidden',
                    backgroundColor: 'var(--ion-item-background)',
                    marginBottom: '16px'
                  }}>
                    <img
                      src={formData.thumbnailUrl}
                      alt="Current thumbnail"
                      style={{
                        width: '100%',
                        height: '200px',
                        objectFit: 'cover',
                        display: 'block'
                      }}
                    />
                    <div style={{ padding: '8px', display: 'flex', gap: '8px' }}>
                      <IonButton
                        onClick={() => document.getElementById('thumbnail-file-edit')?.click()}
                        style={{
                          flex: 1,
                          '--border-radius': '12px',
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))',
                          backdropFilter: 'blur(10px)',
                          WebkitBackdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          borderRadius: '12px'
                        }}
                      >
                        <IonIcon icon={image} slot="start" />
                        Change
                      </IonButton>
                      <IonButton
                        fill="outline"
                        onClick={() => setFormData(prev => ({ ...prev, thumbnailFile: null, thumbnailUrl: '' }))}
                        style={{
                          flex: 1,
                          '--border-radius': '12px',
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))',
                          backdropFilter: 'blur(10px)',
                          WebkitBackdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          borderRadius: '12px'
                        }}
                      >
                        Remove
                      </IonButton>
                    </div>
                  </div>
                ) : formData.thumbnailFile ? (
                  <div style={{
                    borderRadius: '12px',
                    overflow: 'hidden',
                    backgroundColor: 'var(--ion-item-background)',
                    marginBottom: '16px'
                  }}>
                    <img
                      src={URL.createObjectURL(formData.thumbnailFile)}
                      alt="New thumbnail preview"
                      style={{
                        width: '100%',
                        height: '200px',
                        objectFit: 'cover',
                        display: 'block'
                      }}
                    />
                    <div style={{ padding: '8px', display: 'flex', gap: '8px' }}>
                      <IonButton
                        onClick={() => document.getElementById('thumbnail-file-edit')?.click()}
                        style={{
                          flex: 1,
                          '--border-radius': '12px',
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))',
                          backdropFilter: 'blur(10px)',
                          WebkitBackdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          borderRadius: '12px'
                        }}
                      >
                        <IonIcon icon={image} slot="start" />
                        Change
                      </IonButton>
                      <IonButton
                        fill="outline"
                        onClick={() => setFormData(prev => ({ ...prev, thumbnailFile: null, thumbnailUrl: '' }))}
                        style={{
                          flex: 1,
                          '--border-radius': '12px',
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))',
                          backdropFilter: 'blur(10px)',
                          WebkitBackdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          borderRadius: '12px'
                        }}
                      >
                        Remove
                      </IonButton>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    border: '2px dashed var(--ion-color-step-300)',
                    borderRadius: '12px',
                    padding: '20px',
                    textAlign: 'center',
                    marginBottom: '16px',
                    backgroundColor: 'var(--ion-item-background)',
                    transition: 'all 0.2s ease'
                  }}>
                    <IonIcon
                      icon={image}
                      style={{
                        fontSize: '2em',
                        color: 'var(--ion-color-primary)',
                        marginBottom: '12px'
                      }}
                    />
                    <div style={{ fontWeight: '600', marginBottom: '8px', color: 'var(--ion-text-color)' }}>
                      Thumbnail Image
                    </div>
                    <div style={{ fontSize: '0.9em', color: 'var(--ion-color-medium)', marginBottom: '16px' }}>
                      JPG, PNG (Max 5MB)
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange('thumbnailFile', e.target.files?.[0] || null)}
                      style={{ display: 'none' }}
                      id="thumbnail-file-edit"
                    />
                    <IonButton
                      fill="outline"
                      onClick={() => document.getElementById('thumbnail-file-edit')?.click()}
                      style={{ borderRadius: '8px' }}
                    >
                      <IonIcon icon={image} slot="start" />
                      Choose Image
                    </IonButton>
                  </div>
                )}
              </div>

              {/* Publishing Options */}
              <div>
                <h2 style={{
                  margin: '0 0 20px 0',
                  fontSize: '1.2em',
                  fontWeight: '600',
                  color: 'var(--ion-text-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <IonIcon icon={save} />
                  Publishing Options
                </h2>

                <IonItem style={{ borderRadius: '8px' }}>
                  <IonLabel position="stacked" style={{ fontWeight: '600' }}>
                    Status
                  </IonLabel>
                  <IonSelect
                    value={formData.status}
                    onIonChange={(e) => handleInputChange('status', e.detail.value)}
                    style={{ '--padding-start': '16px', '--inner-padding-end': '16px' }}
                  >
                    <IonSelectOption value="draft">Draft (Save as draft)</IonSelectOption>
                    <IonSelectOption value="published">Published (Make visible to users)</IonSelectOption>
                  </IonSelect>
                </IonItem>
              </div>

            </IonCardContent>
          </IonCard>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '40px' }}>
            <IonButton
              expand="block"
              fill="outline"
              onClick={() => history.push('/admin/radio')}
              style={{
                flex: 1,
                height: '48px',
                borderRadius: '24px',
                fontWeight: '600'
              }}
            >
              Cancel
            </IonButton>
            <IonButton
              expand="block"
              onClick={handleSubmit}
              disabled={saving}
              style={{
                flex: 1,
                height: '48px',
                borderRadius: '24px',
                fontWeight: '600',
                backgroundColor: 'var(--ion-color-primary)'
              }}
            >
              <IonIcon icon={save} slot="start" />
              {saving ? 'Updating...' : 'Update Broadcast'}
            </IonButton>
          </div>

        </div>
      </IonContent>
    </IonPage>
  );
};

export default EditLiveBroadcast;