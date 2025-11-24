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
  IonCardContent,
  IonItem,
  IonLabel,
  IonInput,
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
  newspaper,
  calendar,
  eye,
  eyeOff,
  closeCircle
} from 'ionicons/icons';

const AdminNewsManager: React.FC = () => {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedNews, setSelectedNews] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    excerpt: '',
    author: '',
    date: ''
  });

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    const mockNews = [
      {
        id: '1',
        title: 'New Youth Conference Announced',
        excerpt: 'Join us for an exciting weekend of worship and fellowship...',
        author: 'Pastor Daniel Kaggwa',
        date: '2025-01-15',
        status: 'published',
        views: 245
      },
      {
        id: '2',
        title: 'Community Outreach Success',
        excerpt: 'Our recent food drive helped over 200 families...',
        author: 'Sarah Johnson',
        date: '2025-01-10',
        status: 'published',
        views: 189
      },
      {
        id: '3',
        title: 'Upcoming Missions Trip',
        excerpt: 'Planning a missions trip to support local communities...',
        author: 'Pastor Erica Kaggwa',
        date: '2025-01-20',
        status: 'draft',
        views: 0
      }
    ];
    setNews(mockNews);
    setLoading(false);
  };

  const handleRefresh = async (event: CustomEvent) => {
    await loadNews();
    event.detail.complete();
  };

  const toggleStatus = (id: string) => {
    setNews(news.map(item =>
      item.id === id
        ? { ...item, status: item.status === 'published' ? 'draft' : 'published' }
        : item
    ));
  };

  const deleteNews = (id: string) => {
    setNews(news.filter(item => item.id !== id));
  };

  const openEditModal = (newsItem: any) => {
    setSelectedNews(newsItem);
    setEditForm({
      title: newsItem.title,
      excerpt: newsItem.excerpt,
      author: newsItem.author,
      date: newsItem.date
    });
    setShowEditModal(true);
  };

  const handleEditSave = () => {
    if (!selectedNews) return;

    setNews(news.map(item =>
      item.id === selectedNews.id
        ? { ...item, ...editForm }
        : item
    ));
    setShowEditModal(false);
    setSelectedNews(null);
  };

  const handleEditInputChange = (field: string, value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/admin" />
          </IonButtons>
          <IonTitle className="title-ios">News Manager</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
        <div style={{ padding: '20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <IonIcon icon={newspaper} style={{ fontSize: '3em', color: 'var(--ion-color-primary)', marginBottom: '16px' }} />
            <h1 style={{ margin: '0 0 8px 0', fontSize: '1.8em', fontWeight: '700', color: 'var(--ion-text-color)' }}>
              News & Updates Management
            </h1>
            <p style={{ margin: '0', color: 'var(--ion-text-color)', opacity: 0.7, fontSize: '1em' }}>
              Create and manage church news and announcements
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            <div style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5em', fontWeight: '700', color: '#6366f1' }}>{news.length}</div>
              <div style={{ fontSize: '0.8em', color: 'var(--ion-color-medium)' }}>Total Articles</div>
            </div>
            <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5em', fontWeight: '700', color: '#10b981' }}>{news.filter(n => n.status === 'published').length}</div>
              <div style={{ fontSize: '0.8em', color: 'var(--ion-color-medium)' }}>Published</div>
            </div>
            <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5em', fontWeight: '700', color: '#3b82f6' }}>{news.reduce((sum, n) => sum + n.views, 0)}</div>
              <div style={{ fontSize: '0.8em', color: 'var(--ion-color-medium)' }}>Total Views</div>
            </div>
          </div>

          {/* Add Button */}
          <div style={{ marginBottom: '24px' }}>
            <IonButton
              expand="block"
              routerLink="/admin/news/add"
              style={{
                height: '48px',
                borderRadius: '24px',
                fontWeight: '600',
                backgroundColor: 'var(--ion-color-primary)',
                '--border-radius': '24px'
              }}
            >
              <IonIcon icon={add} slot="start" />
              Add News Article
            </IonButton>
          </div>

          <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
            <IonRefresherContent></IonRefresherContent>
          </IonRefresher>

          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '1.3em', fontWeight: '600', color: 'var(--ion-text-color)' }}>
              All News Articles
            </h2>

            {news.map((item) => (
              <IonCard key={item.id} style={{ margin: '0 0 12px 0', borderRadius: '12px' }}>
                <IonCardContent style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <h3 style={{ margin: '0', fontSize: '1.1em', fontWeight: '600', color: 'var(--ion-text-color)' }}>
                          {item.title}
                        </h3>
                        <IonBadge style={{ backgroundColor: item.status === 'published' ? '#10b981' : '#f59e0b', color: 'white', fontWeight: '600', borderRadius: '8px' }}>
                          {item.status}
                        </IonBadge>
                      </div>
                      <p style={{ margin: '0 0 8px 0', fontSize: '0.9em', color: 'var(--ion-color-medium)' }}>
                        {item.excerpt}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.8em', color: 'var(--ion-color-medium)' }}>
                        <span>By {item.author}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <IonIcon icon={calendar} />
                          {item.date}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <IonIcon icon={eye} />
                          {item.views} views
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <IonButton fill="clear" size="small" onClick={() => toggleStatus(item.id)} style={{ color: 'var(--ion-color-primary)' }}>
                        <IonIcon icon={item.status === 'published' ? eyeOff : eye} />
                      </IonButton>
                      <IonButton fill="clear" size="small" style={{ color: 'var(--ion-color-primary)' }} onClick={() => openEditModal(item)}>
                        <IonIcon icon={create} />
                      </IonButton>
                      <IonButton fill="clear" size="small" style={{ color: '#ef4444' }} onClick={() => deleteNews(item.id)}>
                        <IonIcon icon={trash} />
                      </IonButton>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <IonText style={{ color: 'var(--ion-text-color)', opacity: 0.6, fontSize: '0.9em' }}>
              Dove Ministries Africa - News Management
            </IonText>
          </div>
        </div>

        {/* Edit News Modal */}
        {showEditModal && (
          <>
            {/* INLINE CSS */}
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

              .edit-close-button ion-icon {
                font-size: 18px;
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
                width: 4px;
              }

              .edit-content::-webkit-scrollbar-track {
                background: rgba(var(--ion-background-color-rgb), 0.1);
                border-radius: 2px;
              }

              .edit-content::-webkit-scrollbar-thumb {
                background: var(--ion-color-step-400);
                border-radius: 2px;
              }

              .edit-content::-webkit-scrollbar-thumb:hover {
                background: var(--ion-color-step-500);
              }

              .edit-submit-btn {
                margin-top: 16px;
                --border-radius: 16px;
                font-weight: 600;
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

              @media (prefers-color-scheme: dark) {
                .edit-floating-sidebar {
                  border-color: rgba(255,255,255,0.18);
                  box-shadow: 0 8px 25px rgba(0,0,0,0.4);
                }
              }
            `}</style>

            {/* SIDEBAR OVERLAY */}
            <div className="edit-sidebar-overlay" onClick={() => setShowEditModal(false)}></div>

            {/* SIDEBAR CONTENT */}
            <div className={`edit-floating-sidebar ${showEditModal ? 'open' : ''}`}>
              {/* Close Button */}
              <div className="edit-close-button" onClick={() => setShowEditModal(false)}>
                <IonIcon icon={closeCircle} />
              </div>

              {/* Content */}
              <div className="edit-content">
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                  <h2 style={{ margin: '0', color: 'var(--ion-text-color)', fontSize: '1.3em', fontWeight: '700' }}>
                    Edit News Article
                  </h2>
                </div>

                {/* Form Fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <IonItem style={{ '--border-radius': '12px', '--padding-start': '16px', '--inner-padding-end': '16px' }}>
                    <IonLabel position="stacked" style={{ fontWeight: '600', color: 'var(--ion-text-color)' }}>Title</IonLabel>
                    <IonInput
                      value={editForm.title}
                      onIonChange={(e) => handleEditInputChange('title', e.detail.value!)}
                      placeholder="Enter article title"
                      style={{ color: 'var(--ion-text-color)' }}
                    />
                  </IonItem>

                  <IonItem style={{ '--border-radius': '12px', '--padding-start': '16px', '--inner-padding-end': '16px' }}>
                    <IonLabel position="stacked" style={{ fontWeight: '600', color: 'var(--ion-text-color)' }}>Author</IonLabel>
                    <IonInput
                      value={editForm.author}
                      onIonChange={(e) => handleEditInputChange('author', e.detail.value!)}
                      placeholder="Enter author name"
                      style={{ color: 'var(--ion-text-color)' }}
                    />
                  </IonItem>

                  <IonItem style={{ '--border-radius': '12px', '--padding-start': '16px', '--inner-padding-end': '16px' }}>
                    <IonLabel position="stacked" style={{ fontWeight: '600', color: 'var(--ion-text-color)' }}>Date</IonLabel>
                    <IonInput
                      value={editForm.date}
                      onIonChange={(e) => handleEditInputChange('date', e.detail.value!)}
                      placeholder="Enter date (YYYY-MM-DD)"
                      style={{ color: 'var(--ion-text-color)' }}
                    />
                  </IonItem>

                  <IonItem style={{ '--border-radius': '12px', '--padding-start': '16px', '--inner-padding-end': '16px' }}>
                    <IonLabel position="stacked" style={{ fontWeight: '600', color: 'var(--ion-text-color)' }}>Excerpt</IonLabel>
                    <IonTextarea
                      value={editForm.excerpt}
                      onIonChange={(e) => handleEditInputChange('excerpt', e.detail.value!)}
                      placeholder="Enter article excerpt"
                      rows={3}
                      style={{ color: 'var(--ion-text-color)' }}
                    />
                  </IonItem>
                </div>

                {/* Submit Button */}
                <IonButton
                  expand="block"
                  onClick={handleEditSave}
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

export default AdminNewsManager;