import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  IonText,
  IonLoading
} from '@ionic/react';
import { useHistory, useParams } from 'react-router-dom';
import {
  save,
  radio,
  image,
  videocam,
  closeCircle,
  arrowBack
} from 'ionicons/icons';
import './AdminForm.css';
import './AdminDashboard.css';

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
      const hasFiles = formData.thumbnailFile;

      if (hasFiles) {
        const formDataToSend = new FormData();

        formDataToSend.append('title', formData.title);
        formDataToSend.append('speaker', formData.speaker);
        formDataToSend.append('description', formData.description);
        formDataToSend.append('streamUrl', formData.streamUrl);

        const isPublished = formData.status === 'published';
        formDataToSend.append('isPublished', isPublished.toString());

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
        const updateData: any = {
          title: formData.title,
          speaker: formData.speaker,
          description: formData.description,
          streamUrl: formData.streamUrl,
          isPublished: formData.status === 'published'
        };

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
        <div className="af-loading">
          <div className="af-loading-spinner"></div>
          <p>Loading broadcast data...</p>
        </div>
        <IonLoading isOpen={loading} message="Loading broadcast data..." />
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
          <IonTitle className="title-ios" style={{ textAlign: 'left', marginLeft: '-16px' }}>Edit Live Broadcast</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
        <div className="af-page">
          <div className="af-section">
            <div className="af-card" style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'var(--ion-color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <IonIcon icon={videocam} style={{ color: '#fff', fontSize: '28px' }} />
              </div>
              <h1 className="nd-title" style={{ margin: '0 0 6px 0', fontSize: '22px' }}>Edit Live Broadcast</h1>
              <p style={{ margin: '0', color: 'var(--ion-color-medium)', fontSize: '14px' }}>Update live broadcast information and settings</p>
            </div>
          </div>

          <div className="af-section">
            <h2 className="af-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IonIcon icon={radio} /> Basic Information
            </h2>
            <div className="af-card">
              <div className="af-field">
                <label className="af-label">Broadcast Title <span className="af-required">*</span></label>
                <input type="text" className="af-input" value={formData.title} onChange={(e) => handleInputChange('title', e.target.value)} placeholder="Enter broadcast title" />
              </div>

              <div className="af-field">
                <label className="af-label">Speaker/Presenter <span className="af-required">*</span></label>
                <input type="text" className="af-input" value={formData.speaker} onChange={(e) => handleInputChange('speaker', e.target.value)} placeholder="Enter speaker name" />
              </div>

              <div className="af-field">
                <label className="af-label">Stream URL</label>
                <input type="url" className="af-input" value={formData.streamUrl} onChange={(e) => handleInputChange('streamUrl', e.target.value)} placeholder="Enter streaming URL (optional)" />
              </div>

              <div className="af-field">
                <label className="af-label">Description</label>
                <textarea className="af-input af-textarea" value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} placeholder="Enter broadcast description" rows={4} />
              </div>
            </div>
          </div>

          <div className="af-section">
            <h2 className="af-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IonIcon icon={image} /> Media Files
            </h2>
            <div className="af-card">
              {formData.thumbnailUrl && !formData.thumbnailFile ? (
                <div style={{ marginBottom: '12px' }}>
                  <img src={formData.thumbnailUrl} alt="Current thumbnail" className="af-upload-preview" />
                  <div className="af-row" style={{ marginTop: '12px', gap: '12px', justifyContent: 'center' }}>
                    <button type="button" className="role-btn role-btn-user"
                      style={{ background: 'rgba(99, 102, 241, 0.18)', color: '#6366f1', borderColor: 'rgba(99, 102, 241, 0.3)' }}
                      onClick={() => document.getElementById('thumbnail-file-edit')?.click()}>
                      <IonIcon icon={image} style={{ marginRight: '6px' }} />Change
                    </button>
                    <button type="button" className="role-btn role-btn-admin"
                      style={{ background: 'rgba(239, 68, 68, 0.18)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                      onClick={() => setFormData(prev => ({ ...prev, thumbnailFile: null, thumbnailUrl: '' }))}>
                      Remove
                    </button>
                  </div>
                </div>
              ) : formData.thumbnailFile ? (
                <div style={{ marginBottom: '12px' }}>
                  <img src={URL.createObjectURL(formData.thumbnailFile)} alt="New thumbnail preview" className="af-upload-preview" />
                  <div className="af-row" style={{ marginTop: '12px', gap: '12px', justifyContent: 'center' }}>
                    <button type="button" className="role-btn role-btn-user"
                      style={{ background: 'rgba(99, 102, 241, 0.18)', color: '#6366f1', borderColor: 'rgba(99, 102, 241, 0.3)' }}
                      onClick={() => document.getElementById('thumbnail-file-edit')?.click()}>
                      <IonIcon icon={image} style={{ marginRight: '6px' }} />Change
                    </button>
                    <button type="button" className="role-btn role-btn-admin"
                      style={{ background: 'rgba(239, 68, 68, 0.18)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                      onClick={() => setFormData(prev => ({ ...prev, thumbnailFile: null, thumbnailUrl: '' }))}>
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="af-upload" onClick={() => document.getElementById('thumbnail-file-edit')?.click()}>
                  <div className="af-upload-icon"><IonIcon icon={image} /></div>
                  <p className="af-upload-text">Thumbnail Image</p>
                  <p className="af-upload-hint">JPG, PNG (Max 5MB)</p>
                </div>
              )}
              <input type="file" accept="image/*" onChange={(e) => handleFileChange('thumbnailFile', e.target.files?.[0] || null)} style={{ display: 'none' }} id="thumbnail-file-edit" />
            </div>
          </div>

          <div className="af-section">
            <h2 className="af-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IonIcon icon={save} /> Publishing Options
            </h2>
            <div className="af-card">
              <div className="af-field">
                <label className="af-label">Status</label>
                <select className="af-input af-select" value={formData.status} onChange={(e) => handleInputChange('status', e.target.value)}>
                  <option value="draft">Draft (Save as draft)</option>
                  <option value="published">Published (Make visible to users)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="af-row" style={{ marginBottom: '40px' }}>
            <button type="button" className="af-submit af-submit-secondary" style={{ flex: 1 }} onClick={() => history.push('/admin/radio')}>
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={saving} className="af-submit" style={{ flex: 1 }}>
              <IonIcon icon={save} style={{ fontSize: '18px', marginRight: '8px' }} />
              {saving ? 'Updating...' : 'Update Broadcast'}
            </button>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default EditLiveBroadcast;
