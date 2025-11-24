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
  book,
  eye,
  eyeOff,
  calendar,
  star
} from 'ionicons/icons';

const AdminDevotionManager: React.FC = () => {
  const [devotions, setDevotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDevotion, setEditingDevotion] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    scripture: '',
    author: '',
    date: '',
    status: 'draft',
    featured: false,
    description: ''
  });

  useEffect(() => {
    loadDevotions();
  }, []);

  const loadDevotions = async () => {
    // Mock data - replace with API call
    const mockDevotions = [
      {
        id: '1',
        title: 'God\'s Unconditional Love',
        scripture: 'John 3:16',
        author: 'Pastor Daniel Kaggwa',
        date: '2025-01-15',
        status: 'published',
        featured: true,
        views: 850
      },
      {
        id: '2',
        title: 'The Power of Faith',
        scripture: 'Hebrews 11:1',
        author: 'Pastor Erica Kaggwa',
        date: '2025-01-08',
        status: 'published',
        featured: false,
        views: 620
      },
      {
        id: '3',
        title: 'Walking in Grace',
        scripture: 'Ephesians 2:8-9',
        author: 'Guest Writer',
        date: '2025-01-22',
        status: 'draft',
        featured: false,
        views: 0
      }
    ];
    setDevotions(mockDevotions);
    setLoading(false);
  };

  const handleRefresh = async (event: CustomEvent) => {
    await loadDevotions();
    event.detail.complete();
  };

  const toggleStatus = (id: string) => {
    setDevotions(devotions.map(devotion =>
      devotion.id === id
        ? { ...devotion, status: devotion.status === 'published' ? 'draft' : 'published' }
        : devotion
    ));
  };

  const toggleFeatured = (id: string) => {
    setDevotions(devotions.map(devotion =>
      devotion.id === id
        ? { ...devotion, featured: !devotion.featured }
        : devotion
    ));
  };

  const deleteDevotion = (id: string) => {
    setDevotions(devotions.filter(devotion => devotion.id !== id));
  };

  const openEditModal = (devotion: any) => {
    setEditingDevotion(devotion);
    setEditFormData({
      title: devotion.title || '',
      scripture: devotion.scripture || '',
      author: devotion.author || '',
      date: devotion.date || '',
      status: devotion.status || 'draft',
      featured: devotion.featured || false,
      description: devotion.description || ''
    });
    setShowEditModal(true);
  };

  const handleEditInputChange = (field: string, value: string | boolean) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveEdit = () => {
    if (!editFormData.title || !editFormData.scripture || !editFormData.author || !editFormData.date) {
      return;
    }

    setDevotions(devotions.map(devotion =>
      devotion.id === editingDevotion.id
        ? { ...devotion, ...editFormData }
        : devotion
    ));
    setShowEditModal(false);
    setEditingDevotion(null);
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/admin" />
          </IonButtons>
          <IonTitle className="title-ios">Devotion Manager</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
        <div style={{ padding: '20px' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <IonIcon
              icon={book}
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
              Devotion Management
            </h1>
            <p style={{
              margin: '0',
              color: 'var(--ion-text-color)',
              opacity: 0.7,
              fontSize: '1em'
            }}>
              Manage daily devotionals and spiritual content
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
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              padding: '16px',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5em', fontWeight: '700', color: '#8b5cf6' }}>
                {devotions.length}
              </div>
              <div style={{ fontSize: '0.8em', color: 'var(--ion-color-medium)' }}>Total Devotions</div>
            </div>
            <div style={{
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              padding: '16px',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.5em', fontWeight: '700', color: '#10b981' }}>
                {devotions.filter(d => d.status === 'published').length}
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
                {devotions.filter(d => d.featured).length}
              </div>
              <div style={{ fontSize: '0.8em', color: 'var(--ion-color-medium)' }}>Featured</div>
            </div>
          </div>

          {/* Add Button */}
          <div style={{ marginBottom: '24px' }}>
            <IonButton
              expand="block"
              routerLink="/admin/devotions/add"
              style={{
                height: '48px',
                borderRadius: '24px',
                fontWeight: '600',
                backgroundColor: 'var(--ion-color-primary)',
                '--border-radius': '24px'
              }}
            >
              <IonIcon icon={add} slot="start" />
              Add Devotion
            </IonButton>
          </div>

          {/* Devotions List */}
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
              All Devotions
            </h2>

            {devotions.map((devotion) => (
              <IonCard key={devotion.id} style={{ margin: '0 0 12px 0', borderRadius: '12px' }}>
                <IonCardContent style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <h3 style={{
                          margin: '0',
                          fontSize: '1.1em',
                          fontWeight: '600',
                          color: 'var(--ion-text-color)'
                        }}>
                          {devotion.title}
                        </h3>
                        {devotion.featured && (
                          <IonIcon icon={star} style={{ color: '#f59e0b', fontSize: '1.2em' }} />
                        )}
                      </div>
                      <p style={{
                        margin: '0 0 8px 0',
                        fontSize: '0.9em',
                        color: 'var(--ion-color-primary)',
                        fontWeight: '500'
                      }}>
                        {devotion.scripture}
                      </p>
                      <p style={{
                        margin: '0 0 8px 0',
                        fontSize: '0.9em',
                        color: 'var(--ion-color-medium)'
                      }}>
                        {devotion.author}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.8em', color: 'var(--ion-color-medium)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <IonIcon icon={calendar} />
                          {devotion.date}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <IonIcon icon={eye} />
                          {devotion.views}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <IonBadge
                          style={{
                            backgroundColor: devotion.status === 'published' ? '#10b981' : '#f59e0b',
                            color: 'white',
                            fontWeight: '600',
                            borderRadius: '8px'
                          }}
                        >
                          {devotion.status}
                        </IonBadge>
                        {devotion.featured && (
                          <IonBadge
                            style={{
                              backgroundColor: '#f59e0b',
                              color: 'white',
                              fontWeight: '600',
                              borderRadius: '8px'
                            }}
                          >
                            Featured
                          </IonBadge>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <IonButton
                          fill="clear"
                          size="small"
                          onClick={() => toggleFeatured(devotion.id)}
                          style={{ color: devotion.featured ? '#f59e0b' : 'var(--ion-color-medium)' }}
                        >
                          <IonIcon icon={star} />
                        </IonButton>
                        <IonButton
                          fill="clear"
                          size="small"
                          onClick={() => toggleStatus(devotion.id)}
                          style={{ color: 'var(--ion-color-primary)' }}
                        >
                          <IonIcon icon={devotion.status === 'published' ? eyeOff : eye} />
                        </IonButton>
                        <IonButton
                          fill="clear"
                          size="small"
                          onClick={() => openEditModal(devotion)}
                          style={{ color: 'var(--ion-color-primary)' }}
                        >
                          <IonIcon icon={create} />
                        </IonButton>
                        <IonButton
                          fill="clear"
                          size="small"
                          style={{ color: '#ef4444' }}
                          onClick={() => deleteDevotion(devotion.id)}
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
              Dove Ministries Africa - Devotion Management
            </IonText>
          </div>
        </div>

        {/* Edit Devotion Modal */}
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

              .edit-floating-sidebar {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) scale(0.8);
                width: 90%;
                max-width: 500px;
                max-height: 70vh;
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
                overflow: visible;
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
                max-height: calc(70vh - 80px);
                overflow-y: auto;
                overflow-x: hidden;
                padding-right: 8px;
                -webkit-overflow-scrolling: touch;
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
              }

              @media (max-width: 576px) {
                .edit-floating-sidebar {
                  width: 95%;
                  max-width: 460px;
                  max-height: 75vh;
                  padding: 16px;
                  top: 45%;
                  transform: translate(-50%, -50%) scale(0.8);
                }

                .edit-floating-sidebar.open {
                  top: 50%;
                  transform: translate(-50%, -50%) scale(1);
                }

                .edit-content {
                  max-height: calc(75vh - 80px);
                  gap: 12px;
                }
              }

              @media (max-height: 600px) {
                .edit-floating-sidebar {
                  max-height: 80vh;
                  top: 45%;
                }

                .edit-content {
                  max-height: calc(80vh - 80px);
                }
              }
            `}</style>

            <div className="edit-sidebar-overlay" onClick={() => setShowEditModal(false)}></div>

            <div className={`edit-floating-sidebar ${showEditModal ? 'open' : ''}`}>
              <div className="edit-close-button" onClick={() => setShowEditModal(false)}>
                <IonIcon icon={trash} />
              </div>

              <div className="edit-content">
                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                  <h2 style={{ margin: '0', color: 'var(--ion-text-color)', fontSize: '1.3em', fontWeight: '700' }}>
                    Edit Devotion
                  </h2>
                </div>

                <IonItem style={{ '--border-radius': '12px' }}>
                  <IonLabel position="stacked">Devotion Title *</IonLabel>
                  <IonInput
                    value={editFormData.title}
                    onIonChange={(e) => handleEditInputChange('title', e.detail.value!)}
                    placeholder="Enter devotion title"
                  />
                </IonItem>

                <IonItem style={{ '--border-radius': '12px' }}>
                  <IonLabel position="stacked">Scripture Reference *</IonLabel>
                  <IonInput
                    value={editFormData.scripture}
                    onIonChange={(e) => handleEditInputChange('scripture', e.detail.value!)}
                    placeholder="e.g., John 3:16"
                  />
                </IonItem>

                <IonItem style={{ '--border-radius': '12px' }}>
                  <IonLabel position="stacked">Author *</IonLabel>
                  <IonInput
                    value={editFormData.author}
                    onIonChange={(e) => handleEditInputChange('author', e.detail.value!)}
                    placeholder="Enter author name"
                  />
                </IonItem>

                <IonItem style={{ '--border-radius': '12px' }}>
                  <IonLabel position="stacked">Date *</IonLabel>
                  <IonInput
                    type="date"
                    value={editFormData.date}
                    onIonChange={(e) => handleEditInputChange('date', e.detail.value!)}
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
                  <IonLabel position="stacked">Featured</IonLabel>
                  <IonSelect
                    value={editFormData.featured ? 'true' : 'false'}
                    onIonChange={(e) => handleEditInputChange('featured', e.detail.value === 'true')}
                  >
                    <IonSelectOption value="false">No</IonSelectOption>
                    <IonSelectOption value="true">Yes</IonSelectOption>
                  </IonSelect>
                </IonItem>

                <IonItem style={{ '--border-radius': '12px' }}>
                  <IonLabel position="stacked">Description</IonLabel>
                  <IonTextarea
                    value={editFormData.description}
                    onIonChange={(e) => handleEditInputChange('description', e.detail.value!)}
                    placeholder="Enter devotion description"
                    rows={3}
                  />
                </IonItem>

                <IonButton
                  expand="block"
                  onClick={handleSaveEdit}
                  disabled={!editFormData.title || !editFormData.scripture || !editFormData.author || !editFormData.date}
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

export default AdminDevotionManager;