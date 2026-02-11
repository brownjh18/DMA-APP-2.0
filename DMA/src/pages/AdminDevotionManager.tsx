import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
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
  IonRefresherContent,
  IonActionSheet,
  useIonViewWillEnter,
  useIonActionSheet
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import {
  add,
  create,
  trash,
  book,
  eye,
  eyeOff,
  calendar,
  star,
  ellipsisHorizontal,
  arrowBack
} from 'ionicons/icons';

const AdminDevotionManager: React.FC = () => {
  const history = useHistory();
  const [devotions, setDevotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [devotionsLoading, setDevotionsLoading] = useState<boolean>(false);
  const [presentActionSheet] = useIonActionSheet();
  const [sortBy, setSortBy] = useState<string>('date');
  const [filterBy, setFilterBy] = useState<string>('all');
  const [animatingStat, setAnimatingStat] = useState<string | null>(null);

  // Helper function to clear API cache for devotions
  const clearDevotionsCache = () => {
    try {
      // Check if localStorage is available
      if (typeof localStorage === 'undefined') {
        console.warn('localStorage is not available');
        return;
      }
      
      // Remove all cached devotions data from localStorage
      const keys = Object.keys(localStorage || {});
      if (Array.isArray(keys)) {
        keys.forEach(key => {
          if (key && key.startsWith && key.startsWith('api_cache_') && key.includes('devotions')) {
            try {
              localStorage.removeItem(key);
            } catch (removeError) {
              console.warn('Failed to remove cache key:', key, removeError);
            }
          }
        });
        console.log('Devotions API cache cleared');
      }
    } catch (error) {
      console.warn('Failed to clear devotions cache:', error);
    }
  };

  useEffect(() => {
    loadDevotions();
  }, []);

  // Reload devotions when page becomes active (e.g., when returning from Add/Edit pages)
  useIonViewWillEnter(() => {
    loadDevotions();
  });

  const loadDevotions = async () => {
    if (devotionsLoading || devotions.length > 0) return; // Prevent multiple calls if already loaded

    try {
      setDevotionsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/devotions?page=1&limit=100&published=all', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDevotions(data.devotions); // Keep full devotion objects
      } else {
        console.error('Failed to fetch devotions');
      }
    } catch (error) {
      console.error('Error fetching devotions:', error);
    } finally {
      setLoading(false);
      setDevotionsLoading(false);
    }
  };

  const handleRefresh = async (event: CustomEvent) => {
    await loadDevotions();
    event.detail.complete();
  };

  const toggleStatus = async (id: string) => {
    const devotion = devotions.find(d => d._id === id);
    if (!devotion) return;

    const newStatus = devotion.status === 'publish' ? 'draft' : 'publish';

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/devotions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setDevotions(devotions.map(devotion =>
          devotion._id === id
            ? { ...devotion, status: newStatus }
            : devotion
        ));
        // Set refresh flag for main pages
        sessionStorage.setItem('devotionsNeedRefresh', 'true');
        // Clear API cache for devotions
        clearDevotionsCache();
      }
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const toggleFeatured = async (id: string) => {
    const devotion = devotions.find(d => d._id === id);
    if (!devotion) return;

    const newFeatured = !devotion.isFeatured;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/devotions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isFeatured: newFeatured })
      });

      if (response.ok) {
        setDevotions(devotions.map(devotion =>
          devotion._id === id
            ? { ...devotion, isFeatured: newFeatured }
            : devotion
        ));
        // Set refresh flag for main pages
        sessionStorage.setItem('devotionsNeedRefresh', 'true');
        // Clear API cache for devotions
        clearDevotionsCache();
      }
    } catch (error) {
      console.error('Error toggling featured:', error);
    }
  };

  const deleteDevotion = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/devotions/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setDevotions(devotions.filter(devotion => devotion._id !== id));
        // Set refresh flag for main pages
        sessionStorage.setItem('devotionsNeedRefresh', 'true');
        // Clear API cache for devotions
        clearDevotionsCache();
      }
    } catch (error) {
      console.error('Error deleting devotion:', error);
    }
  };

  const openEditPage = (devotion: any) => {
    history.push(`/admin/devotions/edit/${devotion._id}`, { devotion });
  };

  const showOptions = (devotion: any) => {
    presentActionSheet({
      header: 'Devotion Options',
      buttons: [
        {
          text: devotion.isFeatured ? 'Remove from Featured' : 'Mark as Featured',
          icon: star,
          handler: () => toggleFeatured(devotion._id)
        },
        {
          text: devotion.status === 'publish' ? 'Unpublish' : 'Publish',
          icon: devotion.status === 'publish' ? eyeOff : eye,
          handler: () => toggleStatus(devotion._id)
        },
        {
          text: 'Edit',
          icon: create,
          handler: () => openEditPage(devotion)
        },
        {
          text: 'Delete',
          role: 'destructive',
          icon: trash,
          handler: () => deleteDevotion(devotion._id)
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });
  };

  const handleStatClick = (statType: string) => {
    // Trigger animation
    setAnimatingStat(statType);
    setTimeout(() => setAnimatingStat(null), 600); // Animation duration

    // Update sorting/filtering
    setSortBy(statType);
    setFilterBy(statType === 'published' || statType === 'featured' ? statType : 'all');
  };

  const getSortedAndFilteredDevotions = () => {
    // Apply filter
    let filtered = devotions;
    if (filterBy === 'published') {
      filtered = devotions.filter(d => d.status === 'publish');
    } else if (filterBy === 'featured') {
      filtered = devotions.filter(d => d.isFeatured === true);
    }

    // Apply sorting
    let sorted = [...filtered];
    switch (sortBy) {
      case 'date':
        sorted.sort((a, b) => {
          const dateA = new Date(a.date || a.createdAt || 0);
          const dateB = new Date(b.date || b.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        });
        break;
      case 'views':
        sorted.sort((a, b) => {
          const viewsA = a.views || 0;
          const viewsB = b.views || 0;
          return viewsB - viewsA;
        });
        break;
      case 'published':
      case 'featured':
        sorted.sort((a, b) => {
          const dateA = new Date(a.date || a.createdAt || 0);
          const dateB = new Date(b.date || b.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        });
        break;
      default:
        break;
    }

    return sorted;
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
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
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            overflowX: 'auto',
            paddingBottom: '8px',
            marginBottom: '24px'
          }}>
            <div style={{
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              minWidth: '70px'
            }}>
              <div
                onClick={() => handleStatClick('date')}
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  border: '3px solid #8b5cf6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: sortBy === 'date' && filterBy === 'all' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  transform: animatingStat === 'date' ? 'scale(1.2) rotate(5deg)' : 'scale(1)',
                  boxShadow: animatingStat === 'date' ? '0 8px 25px rgba(139, 92, 246, 0.6), 0 0 0 4px rgba(139, 92, 246, 0.3)' : 'none',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {animatingStat === 'date' && (
                  <div style={{
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    right: '0',
                    bottom: '0',
                    background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)',
                    borderRadius: '50%',
                    animation: 'pulse 0.6s ease-out'
                  }} />
                )}
                <div style={{
                  fontSize: '1.2em',
                  fontWeight: '700',
                  color: '#8b5cf6',
                  position: 'relative',
                  zIndex: 1,
                  animation: animatingStat === 'date' ? 'bounce 0.6s ease-out' : 'none'
                }}>
                  {devotions.length}
                </div>
              </div>
              <div style={{ fontSize: '0.75em', color: 'var(--ion-color-medium)', fontWeight: '500' }}>Total</div>
            </div>
            <div style={{
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              minWidth: '70px'
            }}>
              <div
                onClick={() => handleStatClick('published')}
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  border: '3px solid #10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: filterBy === 'published' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  transform: animatingStat === 'published' ? 'scale(1.2) rotate(3deg)' : 'scale(1)',
                  boxShadow: animatingStat === 'published' ? '0 8px 25px rgba(16, 185, 129, 0.6), 0 0 0 4px rgba(16, 185, 129, 0.3)' : 'none',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {animatingStat === 'published' && (
                  <div style={{
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    right: '0',
                    bottom: '0',
                    background: 'radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, transparent 70%)',
                    borderRadius: '50%',
                    animation: 'pulse 0.6s ease-out'
                  }} />
                )}
                <div style={{
                  fontSize: '1.2em',
                  fontWeight: '700',
                  color: '#10b981',
                  position: 'relative',
                  zIndex: 1,
                  animation: animatingStat === 'published' ? 'bounce 0.6s ease-out' : 'none'
                }}>
                  {devotions.filter(d => d.status === 'publish').length}
                </div>
              </div>
              <div style={{ fontSize: '0.75em', color: 'var(--ion-color-medium)', fontWeight: '500' }}>Published</div>
            </div>
            <div style={{
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              minWidth: '70px'
            }}>
              <div
                onClick={() => handleStatClick('featured')}
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  border: '3px solid #f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: filterBy === 'featured' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  transform: animatingStat === 'featured' ? 'scale(1.2) rotate(-3deg)' : 'scale(1)',
                  boxShadow: animatingStat === 'featured' ? '0 8px 25px rgba(245, 158, 11, 0.6), 0 0 0 4px rgba(245, 158, 11, 0.3)' : 'none',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {animatingStat === 'featured' && (
                  <div style={{
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    right: '0',
                    bottom: '0',
                    background: 'radial-gradient(circle, rgba(245, 158, 11, 0.4) 0%, transparent 70%)',
                    borderRadius: '50%',
                    animation: 'pulse 0.6s ease-out'
                  }} />
                )}
                <div style={{
                  fontSize: '1.2em',
                  fontWeight: '700',
                  color: '#f59e0b',
                  position: 'relative',
                  zIndex: 1,
                  animation: animatingStat === 'featured' ? 'bounce 0.6s ease-out' : 'none'
                }}>
                  {devotions.filter(d => d.isFeatured).length}
                </div>
              </div>
              <div style={{ fontSize: '0.75em', color: 'var(--ion-color-medium)', fontWeight: '500' }}>Featured</div>
            </div>
          </div>

          {/* Add Button */}
          <div style={{ marginBottom: '24px' }}>
            <IonButton
              expand="block"
              onClick={() => history.push('/admin/devotions/add')}
              style={{
                height: '48px',
                borderRadius: '24px',
                fontWeight: '600',
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.8) 0%, rgba(56, 189, 248, 0.6) 50%, rgba(56, 189, 248, 0.4) 100%)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                border: '1px solid rgba(56, 189, 248, 0.5)',
                boxShadow: '0 8px 32px rgba(56, 189, 248, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '--border-radius': '24px'
              }}
              onMouseDown={(e) => {
                const target = e.currentTarget as HTMLElement;
                target.style.transform = 'scale(0.98)';
                target.style.boxShadow = '0 4px 16px rgba(56, 189, 248, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
              }}
              onMouseUp={(e) => {
                const target = e.currentTarget as HTMLElement;
                setTimeout(() => {
                  target.style.transform = 'scale(1)';
                  target.style.boxShadow = '0 8px 32px rgba(56, 189, 248, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
                }, 200);
              }}
              onMouseLeave={(e) => {
                const target = e.currentTarget as HTMLElement;
                target.style.transform = 'scale(1)';
                target.style.boxShadow = '0 8px 32px rgba(56, 189, 248, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
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
              {filterBy === 'all' ? 'All Devotions' :
               filterBy === 'published' ? 'Published Devotions' :
               filterBy === 'featured' ? 'Featured Devotions' :
               'All Devotions'}
              {sortBy === 'views' && ' (Sorted by Views)'}
              {sortBy === 'date' && ' (Sorted by Date)'}
            </h2>

            {getSortedAndFilteredDevotions().length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {getSortedAndFilteredDevotions().map(d => (
                  <div
                    key={d._id}
                    style={{
                      backgroundColor: 'transparent',
                      borderRadius: '16px',
                      border: '1px solid var(--ion-card-border-color, rgba(0,0,0,0.1))',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out'
                    }}
                    onClick={() => showOptions(d)}
                  >
                    <div style={{ padding: '10px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                      {/* Thumbnail on the left */}
                      <div style={{
                        width: '90px',
                        height: '140px',
                        borderRadius: '12px 0 0 12px',
                        overflow: 'hidden',
                        flexShrink: 0,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        position: 'relative'
                      }}>
                        <img
                          src={d.thumbnailUrl ? (d.thumbnailUrl.startsWith('/uploads/') ? `http://localhost:5000${d.thumbnailUrl}` : d.thumbnailUrl) : '/hero-evangelism.jpg'}
                          alt="Devotion thumbnail"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                          onError={(e) => {
                            e.currentTarget.src = '/hero-evangelism.jpg';
                          }}
                        />
                        {/* Status Badges */}
                        {d.status === 'publish' && (
                          <div style={{
                            position: 'absolute',
                            top: '8px',
                            left: '8px',
                            background: 'linear-gradient(135deg, #16a34a, #15803d)',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '0.65em',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            backdropFilter: 'blur(8px)'
                          }}>
                            Published
                          </div>
                        )}
                      </div>

                      {/* Details on the right */}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', minHeight: '70px' }}>
                        {/* Header with date */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start'
                        }}>
                          <div style={{ flex: 1 }}>
                            <h3 style={{
                              margin: '0 0 4px 0',
                              fontSize: '0.95em',
                              fontWeight: '600',
                              color: 'var(--ion-text-color)',
                              lineHeight: '1.3'
                            }}>
                              {d.title}
                            </h3>
                            <p style={{
                              margin: '0',
                              fontSize: '0.75em',
                              color: 'var(--ion-color-primary)',
                              fontWeight: '500'
                            }}>
                              {d.scripture}
                            </p>
                          </div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            {d.isFeatured && (
                              <div style={{
                                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                color: 'white',
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                backdropFilter: 'blur(8px)'
                              }}>
                                <IonIcon icon={star} style={{ fontSize: '0.7em', color: 'white' }} />
                              </div>
                            )}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              color: 'var(--ion-color-medium)',
                              fontSize: '0.7em'
                            }}>
                              <IonIcon icon={calendar} />
                              <span>{new Date(d.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                            </div>
                          </div>
                        </div>

                        {/* Content */}
                        <div style={{
                          margin: '0',
                          color: 'var(--ion-color-medium)',
                          fontSize: '0.8em',
                          lineHeight: '1.4',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {d.content}
                        </div>

                        {/* Reflection */}
                        <div style={{
                          margin: '0',
                          color: 'var(--ion-color-primary)',
                          fontSize: '0.75em',
                          fontStyle: 'italic',
                          lineHeight: '1.4',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          opacity: 0.9
                        }}>
                          {d.reflection}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: 'var(--ion-color-medium)'
              }}>
                <IonIcon icon={book} style={{ fontSize: '3em', marginBottom: '16px', opacity: 0.5 }} />
                <h3 style={{ margin: '0 0 8px 0', color: 'var(--ion-text-color)' }}>No devotions found</h3>
                <p style={{ margin: 0, fontSize: '0.9em' }}>No devotions available for this category.</p>
              </div>
            )}
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

      </IonContent>
    </IonPage>
  );
};

export default AdminDevotionManager;