import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonBadge,
  IonText,
  IonRefresher,
  IonRefresherContent
} from '@ionic/react';
import {
  add,
  create,
  trash,
  playCircle,
  eye,
  eyeOff
} from 'ionicons/icons';

const AdminSermonManager: React.FC = () => {
  const [sermons, setSermons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSermon, setEditingSermon] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    speaker: '',
    series: '',
    status: 'draft'
  });

  useEffect(() => {
    loadSermons();
  }, []);

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (showEditModal) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [showEditModal]);

  const loadSermons = async () => {
    // Mock data - replace with API call
    const mockSermons = [
      {
        id: '1',
        title: 'The Power of Prayer',
        speaker: 'Pastor Daniel Kaggwa',
        status: 'published',
        views: 1250
      },
      {
        id: '2',
        title: 'Walking in Faith',
        speaker: 'Pastor Erica Kaggwa',
        status: 'published',
        views: 980
      },
      {
        id: '3',
        title: 'Fruit of the Spirit',
        speaker: 'Guest Speaker',
        status: 'draft',
        views: 0
      }
    ];
    setSermons(mockSermons);
    setLoading(false);
  };

  const handleRefresh = async (event: CustomEvent) => {
    await loadSermons();
    event.detail.complete();
  };

  const toggleStatus = (id: string) => {
    setSermons(sermons.map(sermon =>
      sermon.id === id
        ? { ...sermon, status: sermon.status === 'published' ? 'draft' : 'published' }
        : sermon
    ));
  };

  const deleteSermon = (id: string) => {
    setSermons(sermons.filter(sermon => sermon.id !== id));
  };

  const openEditModal = (sermon: any) => {
    setEditingSermon(sermon);
    setEditFormData({
      title: sermon.title || '',
      description: sermon.description || '',
      speaker: sermon.speaker || '',
      series: sermon.series || '',
      status: sermon.status || 'draft'
    });
    setShowEditModal(true);
  };

  const handleEditInputChange = (field: string, value: string) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveEdit = () => {
    if (!editFormData.title || !editFormData.speaker) {
      return;
    }

    setSermons(sermons.map(sermon =>
      sermon.id === editingSermon.id
        ? { ...sermon, ...editFormData }
        : sermon
    ));
    setShowEditModal(false);
    setEditingSermon(null);
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/admin" />
          </IonButtons>
          <IonTitle className="title-ios">Sermon Manager</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
        <div style={{ padding: '20px' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <IonIcon
              icon={playCircle}
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
              Sermon Management
            </h1>
            <p style={{
              margin: '0',
              color: 'var(--ion-text-color)',
              opacity: 0.7,
              fontSize: '1em'
            }}>
              Manage church sermons and audio content
            </p>
          </div>

          {/* Stats Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '12px',
            marginBottom: '24px'
          }}>
            <div style={{
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              padding: '16px',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5em', fontWeight: '700', color: '#3b82f6' }}>
                {sermons.length}
              </div>
              <div style={{ fontSize: '0.8em', color: 'var(--ion-color-medium)' }}>Total Sermons</div>
            </div>
            <div style={{
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              padding: '16px',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5em', fontWeight: '700', color: '#10b981' }}>
                {sermons.filter(s => s.status === 'published').length}
              </div>
              <div style={{ fontSize: '0.8em', color: 'var(--ion-color-medium)' }}>Published</div>
            </div>
            <div style={{
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              padding: '16px',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5em', fontWeight: '700', color: '#f59e0b' }}>
                {sermons.filter(s => s.status === 'draft').length}
              </div>
              <div style={{ fontSize: '0.8em', color: 'var(--ion-color-medium)' }}>Drafts</div>
            </div>
          </div>

          {/* Add Button */}
          <div style={{ marginBottom: '24px' }}>
            <IonButton
              expand="block"
              routerLink="/admin/sermons/add"
              style={{
                height: '48px',
                borderRadius: '24px',
                fontWeight: '600',
                backgroundColor: 'var(--ion-color-primary)',
                '--border-radius': '24px'
              }}
            >
              <IonIcon icon={add} slot="start" />
              Add Sermon
            </IonButton>
          </div>

          {/* Sermons List */}
          <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
            <IonRefresherContent></IonRefresherContent>
          </IonRefresher>

          <div style={{ marginBottom: '20px' }}>
            <h2 style={{
              margin: '0 0 16px 0',
              fontSize: '1.3em',
              fontWeight: '600',
              color: 'var(--ion-text-color)'
            }}>
              All Sermons
            </h2>

            {sermons.map((sermon) => (
              <IonCard key={sermon.id} style={{ margin: '0 0 12px 0', borderRadius: '12px' }}>
                <IonCardContent style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        margin: '0 0 8px 0',
                        fontSize: '1.1em',
                        fontWeight: '600',
                        color: 'var(--ion-text-color)'
                      }}>
                        {sermon.title}
                      </h3>
                      <p style={{
                        margin: '0 0 8px 0',
                        fontSize: '0.9em',
                        color: 'var(--ion-color-medium)'
                      }}>
                        {sermon.speaker}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.8em', color: 'var(--ion-color-medium)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <IonIcon icon={eye} />
                          {sermon.views}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      <IonBadge
                        style={{
                          backgroundColor: sermon.status === 'published' ? '#10b981' : '#f59e0b',
                          color: 'white',
                          fontWeight: '600',
                          borderRadius: '8px'
                        }}
                      >
                        {sermon.status}
                      </IonBadge>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <IonButton
                          fill="clear"
                          size="small"
                          onClick={() => toggleStatus(sermon.id)}
                          style={{ color: 'var(--ion-color-primary)' }}
                        >
                          <IonIcon icon={sermon.status === 'published' ? eyeOff : eye} />
                        </IonButton>
                        <IonButton
                          fill="clear"
                          size="small"
                          onClick={() => openEditModal(sermon)}
                          style={{ color: 'var(--ion-color-primary)' }}
                        >
                          <IonIcon icon={create} />
                        </IonButton>
                        <IonButton
                          fill="clear"
                          size="small"
                          style={{ color: '#ef4444' }}
                          onClick={() => deleteSermon(sermon.id)}
                        >
                          <IonIcon icon={trash} />
                        </IonButton>
                      </div>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            ))}
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <IonText style={{
              color: 'var(--ion-text-color)',
              opacity: 0.6,
              fontSize: '0.9em'
            }}>
              Dove Ministries Africa - Sermon Management
            </IonText>
          </div>
        </div>

        {/* Edit Sermon Modal */}
        {showEditModal && (
          <>
            <style>{`
              .edit-sidebar-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0);
                z-index: 9998;
                opacity: 1;
                visibility: visible;
                transition: all 0.3s ease-in-out;
              }

              body.modal-open {
                overflow: hidden;
                position: fixed;
                width: 100%;
              }

              .edit-floating-sidebar {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) scale(0.8);
                width: 90%;
                max-width: 500px;
                max-height: 85vh;
                height: auto;
                padding: 20px;
                border-radius: 24px;
                border: 1px solid var(--ion-color-medium);
                backdrop-filter: blur(22px);
                -webkit-backdrop-filter: blur(22px);
                background: rgba(var(--ion-background-color-rgb), 0.9);
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                z-index: 9999;
                transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                display: flex;
                flex-direction: column;
                overflow: hidden;
              }

              .edit-floating-sidebar.open {
                transform: translate(-50%, -50%) scale(1);
              }

              .edit-close-button {
                position: absolute;
                top: 12px;
                right: 12px;
                background: rgba(var(--ion-background-color-rgb), 0.3);
                border: 1px solid var(--ion-color-step-200);
                border-radius: 50%;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: 0.2s ease-in-out;
                z-index: 10000;
              }

              .edit-close-button:hover {
                background: rgba(var(--ion-background-color-rgb), 0.5);
                transform: scale(1.1);
              }

              .edit-content {
                margin-top: 40px;
                display: flex;
                flex-direction: column;
                gap: 16px;
                max-height: calc(85vh - 180px);
                overflow-y: auto;
                overflow-x: hidden;
                padding-right: 8px;
                padding-bottom: 20px;
                -webkit-overflow-scrolling: touch;
                flex: 1;
              }

              .edit-content::-webkit-scrollbar {
                width: 6px;
              }

              .edit-content::-webkit-scrollbar-track {
                background: rgba(var(--ion-background-color-rgb), 0.1);
                border-radius: 3px;
              }

              .edit-content::-webkit-scrollbar-thumb {
                background: var(--ion-color-step-400);
                border-radius: 3px;
              }

              .edit-content::-webkit-scrollbar-thumb:hover {
                background: var(--ion-color-step-500);
              }

              .edit-submit-btn {
                margin-top: 16px;
                --border-radius: 16px;
                font-weight: 600;
                flex-shrink: 0;
                position: sticky;
                bottom: 0;
                background: rgba(var(--ion-background-color-rgb), 0.95);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                border-top: 1px solid var(--ion-color-step-200);
                padding-top: 16px;
                margin-top: auto;
                margin-bottom: 0;
              }

              @media (max-width: 576px) {
                .edit-floating-sidebar {
                  width: 95%;
                  max-width: 460px;
                  max-height: 90vh;
                  padding: 16px;
                  top: 45%;
                  transform: translate(-50%, -50%) scale(0.8);
                }

                .edit-floating-sidebar.open {
                  top: 50%;
                  transform: translate(-50%, -50%) scale(1);
                }

                .edit-content {
                  max-height: calc(90vh - 180px);
                  gap: 12px;
                }
              }

              @media (max-height: 600px) {
                .edit-floating-sidebar {
                  max-height: 95vh;
                  top: 45%;
                }

                .edit-content {
                  max-height: calc(95vh - 180px);
                }
              }
            `}</style>

            <div
              className="edit-sidebar-overlay"
              onClick={() => setShowEditModal(false)}
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
            ></div>

            <div
              className={`edit-floating-sidebar ${showEditModal ? 'open' : ''}`}
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
            >
              <div className="edit-close-button" onClick={() => setShowEditModal(false)}>
                <IonIcon icon={trash} />
              </div>

              <div
                className="edit-content"
                onWheel={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
              >
                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                  <h2 style={{ margin: '0', color: 'var(--ion-text-color)', fontSize: '1.3em', fontWeight: '700' }}>
                    Edit Sermon
                  </h2>
                </div>

                <IonItem style={{ '--border-radius': '12px' }}>
                  <IonLabel position="stacked">Sermon Title *</IonLabel>
                  <IonInput
                    value={editFormData.title}
                    onIonChange={(e) => handleEditInputChange('title', e.detail.value!)}
                    placeholder="Enter sermon title"
                  />
                </IonItem>

                <IonItem style={{ '--border-radius': '12px' }}>
                  <IonLabel position="stacked">Speaker *</IonLabel>
                  <IonInput
                    value={editFormData.speaker}
                    onIonChange={(e) => handleEditInputChange('speaker', e.detail.value!)}
                    placeholder="Enter speaker name"
                  />
                </IonItem>


                <IonItem style={{ '--border-radius': '12px' }}>
                  <IonLabel position="stacked">Series</IonLabel>
                  <IonInput
                    value={editFormData.series}
                    onIonChange={(e) => handleEditInputChange('series', e.detail.value!)}
                    placeholder="Enter sermon series (optional)"
                  />
                </IonItem>

                <IonItem style={{ '--border-radius': '12px' }}>
                  <IonLabel position="stacked">Status</IonLabel>
                  <IonSelect
                    value={editFormData.status}
                    onIonChange={(e) => handleEditInputChange('status', e.detail.value)}
                  >
                    <IonSelectOption value="draft">Draft</IonSelectOption>
                    <IonSelectOption value="published">Published</IonSelectOption>
                  </IonSelect>
                </IonItem>

                <IonItem style={{ '--border-radius': '12px' }}>
                  <IonLabel position="stacked">Description</IonLabel>
                  <IonTextarea
                    value={editFormData.description}
                    onIonChange={(e) => handleEditInputChange('description', e.detail.value!)}
                    placeholder="Enter sermon description or notes"
                    rows={3}
                  />
                </IonItem>

                <IonButton
                  expand="block"
                  onClick={handleSaveEdit}
                  disabled={!editFormData.title || !editFormData.speaker}
                  className="edit-submit-btn"
                >
                  <IonIcon icon={create} slot="start" />
                  Save Changes
                </IonButton>
              </div>
            </div>
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default AdminSermonManager;