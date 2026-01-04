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
  IonActionSheet
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import {
  add,
  create,
  trash,
  radio,
  eye,
  eyeOff,
  playCircle,
  time,
  ellipsisVertical,
  arrowBack
} from 'ionicons/icons';

const AdminRadioManager: React.FC = () => {
  const history = useHistory();
  const [podcasts, setPodcasts] = useState<any[]>([]);
  const [liveBroadcasts, setLiveBroadcasts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [selectedBroadcast, setSelectedBroadcast] = useState<any>(null);
  const [sortBy, setSortBy] = useState<string>('date');
  const [filterBy, setFilterBy] = useState<string>('all');
  const [animatingStat, setAnimatingStat] = useState<string | null>(null);

  useEffect(() => {
    loadPodcasts();
  }, []);

  const loadPodcasts = async () => {
    try {
      // Load podcasts - include all for admin management (published and drafts)
      // Set a high limit to get all podcasts at once for admin management
      const podcastResponse = await fetch('/api/podcasts?published=false&limit=1000');
      if (podcastResponse.ok) {
        const podcastData = await podcastResponse.json();
        setPodcasts(podcastData.podcasts);
      } else {
        console.error('Failed to fetch podcasts');
        setPodcasts([]);
      }

      // Load live broadcasts (both live and recorded)
      const liveResponse = await fetch('/api/live-broadcasts?type=live_broadcast');
      if (liveResponse.ok) {
        const liveData = await liveResponse.json();
        setLiveBroadcasts(liveData.broadcasts);
      } else {
        console.error('Failed to fetch live broadcasts');
        setLiveBroadcasts([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setPodcasts([]);
      setLiveBroadcasts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (event: CustomEvent) => {
    await loadPodcasts();
    event.detail.complete();
  };

  const toggleStatus = async (id: string) => {
    try {
      // Get auth token
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // Check if it's a podcast or live broadcast
      const podcast = podcasts.find(p => p.id === id);
      const liveBroadcast = liveBroadcasts.find(b => b.id === id);

      if (podcast) {
        const newStatus = podcast.status === 'published' ? 'draft' : 'published';
        const response = await fetch(`/api/podcasts/${id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
          // Reload data to ensure consistency
          await loadPodcasts();
        } else {
          console.error('Failed to update podcast status');
        }
      } else if (liveBroadcast) {
        const newStatus = liveBroadcast.status === 'published' ? 'draft' : 'published';
        const response = await fetch(`/api/live-broadcasts/${id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ isPublished: newStatus === 'published' })
        });

        if (response.ok) {
          // Reload data to ensure consistency
          await loadPodcasts();
        } else {
          console.error('Failed to update live broadcast status');
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const deleteBroadcast = async (id: string) => {
    try {
      // Get auth token
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // Check if it's a podcast or live broadcast
      const podcast = podcasts.find(p => p.id === id);
      const liveBroadcast = liveBroadcasts.find(b => b.id === id);

      if (podcast) {
        const response = await fetch(`/api/podcasts/${id}`, {
          method: 'DELETE',
          headers
        });

        if (response.ok) {
          setPodcasts(podcasts.filter(podcast => podcast.id !== id));
        } else {
          console.error('Failed to delete podcast');
        }
      } else if (liveBroadcast) {
        const response = await fetch(`/api/live-broadcasts/${id}`, {
          method: 'DELETE',
          headers
        });

        if (response.ok) {
          setLiveBroadcasts(liveBroadcasts.filter(broadcast => broadcast.id !== id));
        } else {
          console.error('Failed to delete live broadcast');
        }
      }
    } catch (error) {
      console.error('Error deleting broadcast:', error);
    }
  };

  const openActionSheet = (broadcast: any) => {
    setSelectedBroadcast(broadcast);
    setShowActionSheet(true);
  };

  const handleActionSheet = (action: string) => {
    if (!selectedBroadcast) return;

    switch (action) {
      case 'toggle':
        toggleStatus(selectedBroadcast.id);
        break;
      case 'edit':
        openEditPage(selectedBroadcast);
        break;
      case 'delete':
        deleteBroadcast(selectedBroadcast.id);
        break;
    }
    setShowActionSheet(false);
    setSelectedBroadcast(null);
  };

  const openEditPage = (broadcast: any) => {
    // Check if it's a podcast or live broadcast
    const podcast = podcasts.find(p => p.id === broadcast.id);
    if (podcast) {
      history.push(`/admin/radio/edit/${broadcast.id}`);
    } else {
      // For live broadcasts, you might want to go to a different edit page or handle differently
      history.push(`/admin/live/edit/${broadcast.id}`);
    }
  };

  const handleStatClick = (statType: string) => {
    // Trigger animation
    setAnimatingStat(statType);
    setTimeout(() => setAnimatingStat(null), 600); // Animation duration

    // Update sorting/filtering
    setSortBy(statType);
    setFilterBy(statType === 'published' || statType === 'draft' ? statType : 'all');
  };

  const getSortedAndFilteredBroadcasts = () => {
    // Combine podcasts and live broadcasts
    const allBroadcasts = [
      ...podcasts.map(p => ({ ...p, type: 'podcast' })),
      ...liveBroadcasts.map(l => ({ ...l, type: 'live' }))
    ];

    // Apply filter
    let filtered = allBroadcasts;
    if (filterBy === 'published') {
      filtered = allBroadcasts.filter(b =>
        (b.type === 'podcast' && b.status === 'published') ||
        (b.type === 'live' && b.status === 'published')
      );
    } else if (filterBy === 'draft') {
      filtered = allBroadcasts.filter(b =>
        (b.type === 'podcast' && b.status === 'draft') ||
        (b.type === 'live' && b.status === 'draft')
      );
    }

    // Apply sorting
    let sorted = [...filtered];
    switch (sortBy) {
      case 'date':
        sorted.sort((a, b) => {
          const dateA = a.type === 'podcast' ? new Date(a.publishedAt || a.date || 0) :
                      new Date(a.broadcastStartTime || a.createdAt || 0);
          const dateB = b.type === 'podcast' ? new Date(b.publishedAt || b.date || 0) :
                      new Date(b.broadcastStartTime || b.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        });
        break;
      case 'live_recordings':
        sorted = sorted.filter(b => b.broadcastStartTime); // Only show items with broadcastStartTime (originated from live broadcasts)
        sorted.sort((a, b) => {
          const dateA = new Date(a.broadcastStartTime);
          const dateB = new Date(b.broadcastStartTime);
          return dateB.getTime() - dateA.getTime();
        });
        break;
      case 'listens':
        sorted.sort((a, b) => {
          const listensA = a.type === 'podcast' ? (a.listens || 0) : (a.viewCount || 0);
          const listensB = b.type === 'podcast' ? (b.listens || 0) : (b.viewCount || 0);
          return listensB - listensA;
        });
        break;
      case 'published':
      case 'draft':
        sorted.sort((a, b) => {
          const dateA = a.type === 'podcast' ? new Date(a.publishedAt || a.date || 0) :
                      new Date(a.broadcastStartTime || a.createdAt || 0);
          const dateB = b.type === 'podcast' ? new Date(b.publishedAt || b.date || 0) :
                      new Date(b.broadcastStartTime || b.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        });
        break;
      default:
        break;
    }

    return sorted;
  };

  const getBadgeColor = (broadcast: any) => {
    if (broadcast.isLive) {
      return '#ef4444'; // Red for currently live broadcasts
    } else if (broadcast.broadcastStartTime && broadcast.type === 'podcast') {
      return '#059669'; // Green for recorded live broadcasts (converted to podcasts)
    } else {
      return '#007bff'; // Blue for regular uploaded podcasts
    }
  };

  const getBadgeText = (broadcast: any) => {
    if (broadcast.isLive) {
      return 'LIVE';
    } else if (broadcast.broadcastStartTime && broadcast.type === 'podcast') {
      return 'LIVE RECORDED';
    } else {
      return 'UPLOADED';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return '#10b981';
      case 'draft': return '#f59e0b';
      case 'scheduled': return '#8b5cf6';
      default: return '#6b7280';
    }
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
          <IonTitle className="title-ios">Radio Manager</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
        <div style={{ padding: '20px' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <IonIcon
              icon={radio}
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
              Radio Broadcast Management
            </h1>
            <p style={{
              margin: '0',
              color: 'var(--ion-text-color)',
              opacity: 0.7,
              fontSize: '1em'
            }}>
              Manage podcasts and radio broadcasts
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
                  border: '3px solid #3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: sortBy === 'date' && filterBy === 'all' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  transform: animatingStat === 'date' ? 'scale(1.2) rotate(5deg)' : 'scale(1)',
                  boxShadow: animatingStat === 'date' ? '0 8px 25px rgba(59, 130, 246, 0.6), 0 0 0 4px rgba(59, 130, 246, 0.3)' : 'none',
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
                    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, transparent 70%)',
                    borderRadius: '50%',
                    animation: 'pulse 0.6s ease-out'
                  }} />
                )}
                <div style={{
                  fontSize: '1.2em',
                  fontWeight: '700',
                  color: '#3b82f6',
                  position: 'relative',
                  zIndex: 1,
                  animation: animatingStat === 'date' ? 'bounce 0.6s ease-out' : 'none'
                }}>
                  {podcasts.length + liveBroadcasts.length}
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
                onClick={() => handleStatClick('live_recordings')}
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  border: '3px solid #ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: sortBy === 'live_recordings' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  transform: animatingStat === 'live_recordings' ? 'scale(1.2) rotate(-5deg)' : 'scale(1)',
                  boxShadow: animatingStat === 'live_recordings' ? '0 8px 25px rgba(239, 68, 68, 0.6), 0 0 0 4px rgba(239, 68, 68, 0.3)' : 'none',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {animatingStat === 'live_recordings' && (
                  <div style={{
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    right: '0',
                    bottom: '0',
                    background: 'radial-gradient(circle, rgba(239, 68, 68, 0.4) 0%, transparent 70%)',
                    borderRadius: '50%',
                    animation: 'pulse 0.6s ease-out'
                  }} />
                )}
                <div style={{
                  fontSize: '1.2em',
                  fontWeight: '700',
                  color: '#ef4444',
                  position: 'relative',
                  zIndex: 1,
                  animation: animatingStat === 'live_recordings' ? 'bounce 0.6s ease-out' : 'none'
                }}>
                  {podcasts.filter(p => p.broadcastStartTime).length + liveBroadcasts.filter(l => l.broadcastStartTime).length}
                </div>
              </div>
              <div style={{ fontSize: '0.75em', color: 'var(--ion-color-medium)', fontWeight: '500' }}>Live</div>
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
                  {podcasts.filter(p => p.status === 'published').length + liveBroadcasts.filter(b => b.status === 'published').length}
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
                onClick={() => handleStatClick('draft')}
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  border: '3px solid #f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: filterBy === 'draft' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  transform: animatingStat === 'draft' ? 'scale(1.2) rotate(-3deg)' : 'scale(1)',
                  boxShadow: animatingStat === 'draft' ? '0 8px 25px rgba(245, 158, 11, 0.6), 0 0 0 4px rgba(245, 158, 11, 0.3)' : 'none',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {animatingStat === 'draft' && (
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
                  animation: animatingStat === 'draft' ? 'bounce 0.6s ease-out' : 'none'
                }}>
                  {podcasts.filter(p => p.status === 'draft').length + liveBroadcasts.filter(b => b.status === 'draft').length}
                </div>
              </div>
              <div style={{ fontSize: '0.75em', color: 'var(--ion-color-medium)', fontWeight: '500' }}>Drafts</div>
            </div>
          </div>

          {/* Add Button */}
          <div style={{ marginBottom: '24px' }}>
            <IonButton
              expand="block"
              onClick={() => history.push('/admin/radio/add')}
              style={{
                height: '48px',
                borderRadius: '24px',
                fontWeight: '600',
                backgroundColor: 'var(--ion-color-primary)',
                '--border-radius': '24px'
              }}
            >
              <IonIcon icon={add} slot="start" />
              Add Podcast
            </IonButton>
          </div>

          {/* Broadcasts List */}
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
              {filterBy === 'all' ? 'All Broadcasts' :
               filterBy === 'published' ? 'Published Broadcasts' :
               filterBy === 'draft' ? 'Draft Broadcasts' :
               'Live Recordings'}
              {sortBy === 'listens' && ' (Sorted by Listens)'}
              {sortBy === 'date' && ' (Sorted by Date)'}
              {sortBy === 'live_recordings' && ' (Live Recordings)'}
            </h2>

            {/* Sorted and Filtered Broadcasts */}
            {getSortedAndFilteredBroadcasts().map((broadcast) => (
              <IonCard key={`${broadcast.type}-${broadcast.id}`} style={{
                margin: '0 0 12px 0',
                borderRadius: '12px',
                border: broadcast.isLive ? '2px solid #ef4444' : '1px solid var(--ion-color-step-300)'
              }}>
                <IonCardContent style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        margin: '0 0 8px 0',
                        fontSize: '1.1em',
                        fontWeight: '600',
                        color: 'var(--ion-text-color)'
                      }}>
                        {broadcast.title}
                      </h3>
                      <p style={{
                        margin: '0 0 8px 0',
                        fontSize: '0.9em',
                        color: 'var(--ion-color-medium)'
                      }}>
                        {broadcast.speaker}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.8em', color: 'var(--ion-color-medium)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <IonIcon icon={playCircle} />
                          {broadcast.type === 'podcast' ? (broadcast.listens || 0) + ' listens' : (broadcast.viewCount || 0) + ' views'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <IonIcon icon={radio} />
                          {broadcast.duration || 'Live'}
                        </div>
                        {(broadcast.publishedAt || broadcast.broadcastStartTime) && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <IonIcon icon={time} />
                            {new Date(broadcast.publishedAt || broadcast.broadcastStartTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                      <IonBadge
                        style={{
                          background: `linear-gradient(135deg, ${getStatusColor(broadcast.status)}, ${getStatusColor(broadcast.status)}dd)`,
                          color: 'white',
                          fontSize: '0.7em',
                          fontWeight: '600',
                          borderRadius: '10px',
                          padding: '3px 8px',
                          boxShadow: `0 2px 6px ${getStatusColor(broadcast.status)}40`,
                          border: `1px solid ${getStatusColor(broadcast.status)}60`,
                          textTransform: 'capitalize',
                          letterSpacing: '0.3px'
                        }}
                      >
                        {broadcast.status}
                      </IonBadge>
                      <IonButton
                        fill="clear"
                        size="small"
                        onClick={() => openActionSheet(broadcast)}
                        style={{ color: 'var(--ion-color-medium)' }}
                      >
                        <IonIcon icon={ellipsisVertical} />
                      </IonButton>
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
              Dove Ministries Africa - Radio Broadcast Management
            </IonText>
          </div>
        </div>

      </IonContent>

      {/* Action Sheet for Options Menu */}
      <IonActionSheet
        isOpen={showActionSheet}
        onDidDismiss={() => setShowActionSheet(false)}
        buttons={[
          {
            text: selectedBroadcast?.status === 'published' ? 'Unpublish' : 'Publish',
            icon: selectedBroadcast?.status === 'published' ? eyeOff : eye,
            handler: () => handleActionSheet('toggle')
          },
          {
            text: 'Edit',
            icon: create,
            handler: () => handleActionSheet('edit')
          },
          {
            text: 'Delete',
            icon: trash,
            role: 'destructive',
            handler: () => handleActionSheet('delete')
          },
          {
            text: 'Cancel',
            role: 'cancel'
          }
        ]}
      />
    </IonPage>
  );
};

export default AdminRadioManager;