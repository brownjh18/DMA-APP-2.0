import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardContent,
  IonIcon,
  IonText,
  IonButton,
  IonBadge,
  IonLoading,
  IonAlert,
  IonSearchbar,
  IonLabel,
  IonPopover,
  IonList,
  IonItem
} from '@ionic/react';
import { addIcons } from 'ionicons';
import { 
  heart,
  playCircle,
  calendar,
  person,
  time,
  book,
  search,
  radio,
  trash,
  close,
  play,
  eye,
  share,
  arrowBack
} from 'ionicons/icons';
import { apiService, BACKEND_BASE_URL } from '../services/api';
import { useHistory } from 'react-router-dom';
import { usePlayer } from '../contexts/PlayerContext';
import VideoPlayer from '../components/VideoPlayer';

// Add icons
addIcons({
  heart: heart,
  'play-circle': playCircle,
  calendar: calendar,
  person: person,
  time: time,
  book: book,
  search: search,
  radio: radio,
  trash: trash,
  close: close,
  play: play,
  eye: eye,
  share: share,
  'arrow-back': arrowBack
});

// Helper function to convert relative URLs to full backend URLs
const getFullUrl = (url: string) => {
  return url;
};

interface SavedSermon {
  id: string;
  title: string;
  speaker: string;
  description: string;
  scripture?: string;
  date: string;
  duration: string;
  tags?: string[];
  thumbnailUrl?: string;
  savedAt: string;
  videoUrl?: string;
  youtubeId?: string;
  isDatabaseSermon?: boolean;
}

interface SavedPodcast {
  id: string;
  title: string;
  speaker?: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  duration: string;
  audioUrl: string;
  savedAt: string;
  isLive?: boolean;
}

interface SavedDevotion {
  id: string;
  title: string;
  scripture: string;
  content: string;
  reflection: string;
  prayer: string;
  date: string;
  day: number;
  week: number;
  thumbnailUrl?: string;
  savedAt: string;
}

const Saved: React.FC = () => {
  const [savedSermons, setSavedSermons] = useState<SavedSermon[]>([]);
  const [savedPodcasts, setSavedPodcasts] = useState<SavedPodcast[]>([]);
  const [savedDevotions, setSavedDevotions] = useState<SavedDevotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'sermons' | 'podcasts' | 'devotions'>('sermons');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  
  const history = useHistory();
  const { setCurrentMedia, setIsPlaying, isPlaying, setCurrentSermon: setPlayerCurrentSermon } = usePlayer();
  
  const [currentSermon, setCurrentSermon] = useState<SavedSermon | null>(null);
  const [expandedDescription, setExpandedDescription] = useState(false);
  const [lastScroll, setLastScroll] = useState(0);
  const [showPopover, setShowPopover] = useState(false);
  const [popoverEvent, setPopoverEvent] = useState<MouseEvent | undefined>();

  useEffect(() => {
    // Load content on mount - always force refresh to get latest saved items
    loadSavedContent(true);
    
    // Also reload when the page gains focus (user navigates back)
    const handleFocus = () => {
      loadSavedContent(true); // Force refresh from server
    };
    
    // Listen for custom event when items are saved/removed from other pages
    // This ensures immediate UI updates when items are saved/deleted
    const handleSavedItemsChange = () => {
      console.log('📢 savedItemsChanged event received - refreshing saved items');
      // Immediately update from localStorage without waiting for API
      const localSermons = JSON.parse(localStorage.getItem('savedSermons') || '[]');
      const localPodcasts = JSON.parse(localStorage.getItem('savedPodcasts') || '[]');
      const localDevotions = JSON.parse(localStorage.getItem('savedDevotions') || '[]');
      
      console.log('📋 LocalStorage data:', {
        sermons: localSermons.length,
        podcasts: localPodcasts.length,
        devotions: localDevotions.length
      });
      
      // Update state immediately for instant UI feedback
      setSavedSermons(localSermons);
      setSavedPodcasts(localPodcasts);
      setSavedDevotions(localDevotions);
      
      console.log('🔄 State updated from localStorage, now refreshing from server...');
      // Then also refresh from server in background with force refresh
      loadSavedContent(true);
    };
    
    // Listen for storage changes (for cross-tab communication)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'savedSermons' || e.key === 'savedPodcasts' || e.key === 'savedDevotions') {
        // Immediately update from localStorage
        const localSermons = JSON.parse(localStorage.getItem('savedSermons') || '[]');
        const localPodcasts = JSON.parse(localStorage.getItem('savedPodcasts') || '[]');
        const localDevotions = JSON.parse(localStorage.getItem('savedDevotions') || '[]');
        
        setSavedSermons(localSermons);
        setSavedPodcasts(localPodcasts);
        setSavedDevotions(localDevotions);
        
        // Also refresh from server with force refresh
        loadSavedContent(true);
      }
    };
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('savedItemsChanged', handleSavedItemsChange as EventListener);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('savedItemsChanged', handleSavedItemsChange as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);


  const loadSavedContent = async (forceRefresh: boolean = false) => {
    console.log('🔄 loadSavedContent called with forceRefresh:', forceRefresh);
    setLoading(true);
    try {
      // First, try to fetch saved items from server
      let serverSermons: any[] = [];
      let serverPodcasts: any[] = [];
      let serverDevotions: any[] = [];
      
      try {
        console.log('📡 Fetching saved items from server...');
        const [sermonsRes, podcastsRes, devotionsRes] = await Promise.all([
          apiService.getSavedSermons(forceRefresh).catch(() => ({ savedSermons: [] })),
          apiService.getSavedPodcasts(forceRefresh).catch(() => ({ savedPodcasts: [] })),
          apiService.getSavedDevotions(forceRefresh).catch(() => ({ savedDevotions: [] }))
        ]);
        
        console.log('📥 Server response:', {
          sermons: sermonsRes.savedSermons?.length || 0,
          podcasts: podcastsRes.savedPodcasts?.length || 0,
          devotions: devotionsRes.savedDevotions?.length || 0
        });
        
        if (sermonsRes.savedSermons) {
          serverSermons = sermonsRes.savedSermons.map((s: any) => ({
            id: s._id,
            _id: s._id,
            title: s.title,
            speaker: s.speaker,
            description: s.description,
            thumbnailUrl: s.thumbnailUrl,
            videoUrl: s.videoUrl,
            duration: s.duration,
            date: s.date,
            scripture: s.scripture,
            series: s.series,
            type: 'sermon',
            savedAt: new Date().toISOString(),
            isDatabaseSermon: true
          }));
        }
        
        if (podcastsRes.savedPodcasts) {
          serverPodcasts = podcastsRes.savedPodcasts.map((p: any) => {
            // Handle both _id and id fields for compatibility
            const podcastId = p._id || p.id;
            if (!podcastId) {
              console.warn('Podcast missing ID:', p);
              return null;
            }
            return {
              id: podcastId,
              _id: podcastId,
              title: p.title,
              speaker: p.speaker,
              description: p.description,
              thumbnailUrl: p.thumbnailUrl,
              audioUrl: p.audioUrl,
              duration: p.duration,
              publishedAt: p.publishedAt,
              savedAt: new Date().toISOString()
            };
          }).filter((p: any) => p !== null);
        }
        
        if (devotionsRes.savedDevotions) {
          serverDevotions = devotionsRes.savedDevotions.map((d: any) => ({
            id: d._id,
            _id: d._id,
            title: d.title,
            scripture: d.scripture,
            content: d.content,
            reflection: d.reflection,
            prayer: d.prayer,
            date: d.createdAt || d.date,
            day: d.day || 1,
            week: 1,
            thumbnailUrl: d.thumbnailUrl,
            savedAt: new Date().toISOString()
          }));
        }
        
        console.log('💾 Saving to localStorage and updating state:', {
          sermons: serverSermons.length,
          podcasts: serverPodcasts.length,
          devotions: serverDevotions.length
        });
        
        // Save server data to localStorage
        localStorage.setItem('savedSermons', JSON.stringify(serverSermons));
        localStorage.setItem('savedPodcasts', JSON.stringify(serverPodcasts));
        localStorage.setItem('savedDevotions', JSON.stringify(serverDevotions));
        
        setSavedSermons(serverSermons);
        setSavedPodcasts(serverPodcasts);
        setSavedDevotions(serverDevotions);
        console.log('✅ State updated successfully');
      } catch (serverError) {
        console.error('Error fetching from server:', serverError);
        
        // Fallback to localStorage
        const localSermons = JSON.parse(localStorage.getItem('savedSermons') || '[]');
        const localPodcasts = JSON.parse(localStorage.getItem('savedPodcasts') || '[]');
        const localDevotions = JSON.parse(localStorage.getItem('savedDevotions') || '[]');
        
        setSavedSermons(localSermons);
        setSavedPodcasts(localPodcasts);
        setSavedDevotions(localDevotions);
      }
    } catch (error) {
      console.error('Error loading saved content:', error);
    } finally {
      setLoading(false);
    }
  };


  const removeSavedSermon = async (sermonId: string) => {
    // Remove from local state
    const updatedSermons = savedSermons.filter(s => s.id !== sermonId);
    setSavedSermons(updatedSermons);
    localStorage.setItem('savedSermons', JSON.stringify(updatedSermons));
    
    // Also remove from server
    try {
      await apiService.saveSermon(sermonId); // Toggle endpoint will remove it
    } catch (error) {
      console.warn('Failed to remove sermon from server:', error);
    }
    
    // Dispatch event to notify other pages
    window.dispatchEvent(new Event('savedItemsChanged'));
    
    setAlertMessage('Sermon removed from favorites');
    setShowAlert(true);
  };

  const removeSavedPodcast = async (podcastId: string) => {
    // Validate podcast ID
    if (!podcastId || podcastId === 'undefined') {
      console.error('removeSavedPodcast: Invalid podcast ID:', podcastId);
      setAlertMessage('Error: Unable to remove podcast (invalid ID)');
      setShowAlert(true);
      return;
    }
    
    console.log('Removing podcast from favorites:', podcastId);
    
    // Remove from local state
    const updatedPodcasts = savedPodcasts.filter(p => p.id !== podcastId);
    setSavedPodcasts(updatedPodcasts);
    localStorage.setItem('savedPodcasts', JSON.stringify(updatedPodcasts));
    
    // Also remove from server
    try {
      await apiService.savePodcast(podcastId); // Toggle endpoint will remove it
    } catch (error) {
      console.warn('Failed to remove podcast from server:', error);
    }
    
    // Dispatch event to notify other pages
    window.dispatchEvent(new Event('savedItemsChanged'));
    
    setAlertMessage('Podcast removed from favorites');
    setShowAlert(true);
  };

  const removeSavedDevotion = async (devotionId: string) => {
    // Remove from local state
    const updatedDevotions = savedDevotions.filter(d => d.id !== devotionId);
    setSavedDevotions(updatedDevotions);
    localStorage.setItem('savedDevotions', JSON.stringify(updatedDevotions));
    
    // Also remove from server
    try {
      await apiService.saveDevotion(devotionId); // Toggle endpoint will remove it
    } catch (error) {
      console.warn('Failed to remove devotion from server:', error);
    }
    
    // Dispatch event to notify other pages
    window.dispatchEvent(new Event('savedItemsChanged'));
    
    setAlertMessage('Devotion removed from favorites');
    setShowAlert(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const currentContent = activeTab === 'sermons' ? savedSermons : activeTab === 'podcasts' ? savedPodcasts : savedDevotions;
  const totalSermons = savedSermons.length;
  const totalPodcasts = savedPodcasts.length;
  const totalDevotions = savedDevotions.length;

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <IonTitle className="title-ios">My Favorites</IonTitle>
        </IonToolbar>
      </IonHeader>

      {/* Back Button */}
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

      <IonContent
        fullscreen
        className="content-ios"
        onIonScroll={(e) => {
          if (!currentSermon) return;
          const currentScroll = e.detail.scrollTop;
          if (currentScroll > lastScroll + 10) {
            setExpandedDescription(false);
          } else if (currentScroll < lastScroll - 10) {
            setExpandedDescription(true);
          }
          setLastScroll(currentScroll);
        }}
      >
        {currentSermon && (() => {
          console.log('Rendering video player section, currentSermon:', currentSermon);
          return (
            <>
              {/* Content Overlay */}
              <div style={{
                background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.05) 80%, transparent 100%)',
                position: 'fixed',
                top: 'calc(var(--ion-safe-area-top) + 56px)',
                left: '0',
                right: '0',
                zIndex: '10',
                height: expandedDescription ? '400px' : '200px',
                transition: 'height 0.3s ease'
              }}>
                {(() => {
                  if (!(currentSermon as any).videoUrl) {
                    return <div style={{ padding: '20px', textAlign: 'center', color: 'white' }}>Video not available</div>;
                  }
                  const videoUrl = getFullUrl((currentSermon as any).videoUrl);
                  console.log('Video URL:', videoUrl, 'isDatabase:', (currentSermon as any).isDatabaseSermon);
                  return (
                    <VideoPlayer
                      key={currentSermon.id}
                      url={videoUrl}
                      title={currentSermon.title}
                      playing={isPlaying}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                    />
                  );
                })()}
                <div style={{
                  margin: '0 10px',
                  padding: expandedDescription ? '5px 15px 10px 15px' : '5px 15px 0px 15px',
                  border: '2px solid white',
                  borderRadius: '16px',
                  background: 'linear-gradient(180deg, rgba(13, 128, 163, 0.1) 0%, rgba(13, 128, 163, 0.3) 50%, rgba(13, 128, 163, 0.1) 100%)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1, marginRight: '4px' }}>
                      <h2
                        style={{ margin: '0 0 8px 0', fontSize: '1.2em', fontWeight: '600', cursor: 'pointer' }}
                        onClick={() => setExpandedDescription(!expandedDescription)}
                      >
                        {currentSermon.title}
                      </h2>
                      <div style={{
                        maxHeight: expandedDescription ? '200px' : '0',
                        overflow: 'hidden',
                        transition: 'max-height 0.3s ease'
                      }}>
                        <p style={{ margin: '0 0 8px 0', color: 'var(--ion-color-medium)', fontSize: '0.8em' }}>
                          <IonIcon icon={eye} style={{ verticalAlign: 'middle', marginRight: '4px' }} />0 views • {formatDate(currentSermon.date)}
                        </p>
                        {currentSermon.description && (
                          <div>
                            <p style={{ margin: '0 0 8px 0', lineHeight: '1.4', color: 'var(--ion-color-dark)', fontSize: '0.8em' }}>
                              {currentSermon.description}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ flexShrink: 0, display: 'flex', gap: '8px' }}>
                      <IonButton fill="clear" size="small" style={{ padding: '4px', marginTop: '-2px', '--color': 'white', borderRadius: '4px', fontSize: '1.2em', fontWeight: 'bold' }} onClick={(e) => { e.persist(); setPopoverEvent(e.nativeEvent); setShowPopover(true); }}>
                        ⋮
                      </IonButton>
                      <IonButton
                        fill="clear"
                        size="small"
                        style={{ padding: '2px', marginTop: '-2px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentSermon(null);
                          setIsPlaying(false);
                        }}
                      >
                        <IonIcon icon={close} />
                      </IonButton>
                    </div>
                  </div>
                </div>
              </div>
            </>
          );
        })()}
        <div style={{ padding: '16px', marginTop: currentSermon ? (expandedDescription ? '385px' : '355px') : '0' }}>
          {!currentSermon && (
            <>
              {/* Header Section */}
              <div style={{
                textAlign: 'center',
                marginBottom: '24px',
                padding: '20px 0'
              }}>
                <IonIcon
                  icon={heart}
                  style={{
                    fontSize: '3em',
                    color: 'var(--ion-color-primary)',
                    marginBottom: '12px'
                  }}
                />
                <h1 style={{
                  margin: '0 0 8px 0',
                  fontSize: '1.8em',
                  fontWeight: '700',
                  color: 'var(--ion-text-color)'
                }}>
                  My Favorites
                </h1>
                <p style={{
                  margin: '0',
                  color: 'var(--ion-text-color)',
                  opacity: 0.7,
                  fontSize: '1em'
                }}>
                  Access your favorite sermons and podcasts
                </p>
              </div>

              {/* Category Tabs - Podcast Player Style */}
              <div style={{ maxWidth: '420px', margin: '0 auto', marginBottom: '20px' }}>
                <div style={{
                  display: 'flex',
                  gap: '4px',
                  background: 'var(--ion-item-background)',
                  padding: '4px',
                  borderRadius: '12px',
                  border: '1px solid var(--ion-color-primary)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <div
                    onClick={() => setActiveTab('sermons')}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      borderRadius: '10px',
                      fontSize: '0.85em',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      backgroundColor: activeTab === 'sermons' ? 'var(--ion-color-primary)' : 'transparent',
                      color: activeTab === 'sermons' ? 'white' : 'var(--ion-text-color)',
                      textTransform: 'capitalize',
                      textAlign: 'center'
                    }}
                  >
                    Sermons ({totalSermons})
                  </div>
                  <div
                    onClick={() => setActiveTab('podcasts')}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      borderRadius: '10px',
                      fontSize: '0.85em',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      backgroundColor: activeTab === 'podcasts' ? 'var(--ion-color-primary)' : 'transparent',
                      color: activeTab === 'podcasts' ? 'white' : 'var(--ion-text-color)',
                      textTransform: 'capitalize',
                      textAlign: 'center'
                    }}
                  >
                    Podcasts ({totalPodcasts})
                  </div>
                  <div
                    onClick={() => setActiveTab('devotions')}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      borderRadius: '10px',
                      fontSize: '0.85em',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      backgroundColor: activeTab === 'devotions' ? 'var(--ion-color-primary)' : 'transparent',
                      color: activeTab === 'devotions' ? 'white' : 'var(--ion-text-color)',
                      textTransform: 'capitalize',
                      textAlign: 'center'
                    }}
                  >
                    Devotions ({totalDevotions})
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Content List */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <IonLoading isOpen={loading} message="Loading saved content..." />
            </div>
          ) : currentContent.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: 'var(--ion-text-color)',
              opacity: 0.7
            }}>
              <IonIcon
                icon={activeTab === 'sermons' ? playCircle : activeTab === 'podcasts' ? radio : book}
                style={{
                  fontSize: '3em',
                  color: 'var(--ion-color-medium)',
                  marginBottom: '16px'
                }}
              />
              <h3>No favorite {activeTab} found</h3>
              <p>
                You haven't favorited any {activeTab} yet. Use the heart button on content to add them here.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '410px', margin: '0 auto' }}>
              {activeTab === 'sermons' && (
                // Sermons List - Same layout as Tab2.tsx
                (currentContent as SavedSermon[]).filter(sermon => !currentSermon || sermon.id !== currentSermon.id).map((sermon) => (
                  <div
                    key={sermon.id}
                    className="video-item"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: 'var(--ion-background-color)',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: 'none',
                      maxWidth: '600px'
                    }}
                    onClick={() => {
                      setCurrentSermon(sermon);
                      setIsPlaying(true);
                    }}
                  >
                    <div style={{ flex: '0.5', height: '80px', position: 'relative' }}>
                      <img
                        src={getFullUrl(sermon.thumbnailUrl || '/bible.JPG')}
                        alt={sermon.title}
                        style={{
                          height: '100%',
                          width: 'auto',
                          aspectRatio: '16/9',
                          objectFit: 'cover',
                          borderRadius: '8px'
                        }}
                      />
                      <div style={{
                        position: 'absolute',
                        bottom: '8px',
                        right: '8px',
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.8em'
                      }}>
                        {sermon.duration || '—'}
                      </div>
                    </div>
                    <div style={{ flex: '1', padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <div style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <div style={{ flex: 1, marginRight: '8px' }}>
                            <h4 className="video-title" style={{ fontSize: '0.95em', fontWeight: '600', margin: '0 0 4px 0' }}>
                              {sermon.title}
                            </h4>
                            <p style={{ margin: '0', fontSize: '0.8em', color: 'var(--ion-color-medium)' }}>
                              {sermon.speaker}
                            </p>
                          </div>
                          <IonButton
                            fill="clear"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeSavedSermon(sermon.id);
                            }}
                            style={{
                              margin: '0',
                              padding: '6px',
                              minWidth: '44px',
                              height: '44px',
                              '--color': '#ef4444',
                              '--padding-start': '6px',
                              '--padding-end': '6px',
                              alignSelf: 'flex-start'
                            }}
                          >
                            <IonIcon icon={trash} style={{ fontSize: '1.8em' }} />
                          </IonButton>
                        </div>
                        <p style={{ margin: '0', fontSize: '0.8em', color: 'var(--ion-color-medium)' }}>
                          {formatDate(sermon.date)} • Saved {formatDate(sermon.savedAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {activeTab === 'podcasts' && (
                // Podcasts List - Same layout as Tab4.tsx
                (currentContent as SavedPodcast[]).map((podcast) => {
                  // Safety check for podcast ID
                  if (!podcast.id || podcast.id === 'undefined') {
                    console.warn('Podcast in favorites list has invalid ID:', podcast);
                    return null;
                  }
                  return (
                  <div
                    key={podcast.id}
                    className="podcast-item"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: 'var(--ion-background-color)',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: 'none',
                      maxWidth: '600px'
                    }}
                    onClick={() => {
                      const podcastForPlayer = {
                        ...podcast,
                        viewCount: (podcast as any).viewCount || '0'
                      };
                      setCurrentMedia(podcastForPlayer);
                      setIsPlaying(true);
                      history.push('/podcast-player', { from: 'saved' });
                    }}
                  >
                    <div style={{ flex: '0.5', height: '80px', position: 'relative' }}>
                      <img
                        src={getFullUrl(podcast.thumbnailUrl || '/bible.JPG')}
                        alt={podcast.title}
                        style={{
                          height: '100%',
                          width: 'auto',
                          aspectRatio: '16/9',
                          objectFit: 'cover',
                          borderRadius: '8px'
                        }}
                      />
                      <div style={{
                        position: 'absolute',
                        bottom: '8px',
                        right: '8px',
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.8em'
                      }}>
                        {podcast.duration}
                      </div>
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        left: '8px',
                        background: podcast.isLive ? 'var(--ion-color-danger)' : 'var(--ion-color-primary)',
                        color: 'white',
                        padding: '1px 4px',
                        borderRadius: '4px',
                        fontSize: '0.6em',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        backdropFilter: 'blur(10px)'
                      }}>
                        {podcast.isLive ? 'LIVE' : 'PODCAST'}
                      </div>
                    </div>
                    <div style={{ flex: '1', padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <div style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <div style={{ flex: 1, marginRight: '8px' }}>
                            <h4 className="podcast-title" style={{ fontSize: '0.95em', fontWeight: '600', margin: '0 0 4px 0' }}>
                              {podcast.title}
                            </h4>
                            <p style={{ margin: '0', fontSize: '0.8em', color: 'var(--ion-color-medium)' }}>
                              {podcast.speaker || 'Dove Ministries Africa'}
                            </p>
                          </div>
                          <IonButton
                            fill="clear"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Remove podcast button clicked, ID:', podcast.id);
                              removeSavedPodcast(podcast.id);
                            }}
                            style={{
                              margin: '0',
                              padding: '6px',
                              minWidth: '44px',
                              height: '44px',
                              '--color': '#ef4444',
                              '--padding-start': '6px',
                              '--padding-end': '6px',
                              alignSelf: 'flex-start'
                            }}
                          >
                            <IonIcon icon={trash} style={{ fontSize: '1.8em' }} />
                          </IonButton>
                        </div>
                        <p style={{ margin: '0', fontSize: '0.8em', color: 'var(--ion-color-medium)' }}>
                          {formatDate(podcast.publishedAt)} • Saved {formatDate(podcast.savedAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                  );
                })
              )}
              {activeTab === 'devotions' && (
                // Devotions List
                (currentContent as SavedDevotion[]).map((devotion) => (
                  <div
                    key={devotion.id}
                    className="devotion-card"
                    style={{
                      backgroundColor: 'var(--ion-background-color)',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: 'none',
                      maxWidth: '600px'
                    }}
                    onClick={() => history.push(`/full-devotion?id=${devotion.id}`)}
                  >
                    <div style={{ position: 'relative' }}>
                      <img
                        src={getFullUrl(devotion.thumbnailUrl || '/hero-evangelism.jpg')}
                        alt={devotion.title}
                        style={{
                          width: '100%',
                          height: '120px',
                          objectFit: 'cover'
                        }}
                      />
                      <div style={{
                        position: 'absolute',
                        bottom: '8px',
                        right: '8px',
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.8em'
                      }}>
                        Day {devotion.day}
                      </div>
                    </div>
                    <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <div style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <div style={{ flex: 1, marginRight: '8px' }}>
                            <h4 className="devotion-title" style={{ fontSize: '0.95em', fontWeight: '600', margin: '0 0 4px 0' }}>
                              {devotion.title}
                            </h4>
                            <p style={{ margin: '0', fontSize: '0.8em', color: 'var(--ion-color-medium)' }}>
                              {formatDate(devotion.date)}
                            </p>
                          </div>
                          <IonButton
                            fill="clear"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeSavedDevotion(devotion.id);
                            }}
                            style={{
                              margin: '0',
                              padding: '6px',
                              minWidth: '44px',
                              height: '44px',
                              '--color': '#ef4444',
                              '--padding-start': '6px',
                              '--padding-end': '6px',
                              alignSelf: 'flex-start'
                            }}
                          >
                            <IonIcon icon={trash} style={{ fontSize: '1.8em' }} />
                          </IonButton>
                        </div>
                        <p style={{ margin: '0', fontSize: '0.8em', color: 'var(--ion-color-medium)' }}>
                          {devotion.content.substring(0, 80)}...
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Footer Info */}
          {(totalSermons > 0 || totalPodcasts > 0) && (
            <div style={{
              marginTop: '32px',
              padding: '20px',
              backgroundColor: 'var(--ion-color-light)',
              borderRadius: '12px',
              textAlign: 'center',
              maxWidth: '460px',
              marginLeft: 'auto',
              marginRight: 'auto'
            }}>
              <IonIcon
                icon={heart}
                style={{
                  fontSize: '2em',
                  color: 'var(--ion-color-primary)',
                  marginBottom: '12px'
                }}
              />
              <h4 style={{
                margin: '0 0 8px 0',
                fontSize: '1em',
                fontWeight: '600',
                color: 'var(--ion-text-color)'
              }}>
                Your Favorite Content
              </h4>
              <p style={{
                margin: '0',
                fontSize: '0.9em',
                color: 'var(--ion-text-color)',
                opacity: 0.7,
                lineHeight: '1.4'
              }}>
                You have {totalSermons} favorite sermon{totalSermons !== 1 ? 's' : ''} and {totalPodcasts} favorite podcast{totalPodcasts !== 1 ? 's' : ''}.
                Access them anytime for offline listening.
              </p>
            </div>
          )}
        </div>

        {/* Popover */}
        <IonPopover isOpen={showPopover} event={popoverEvent} onDidDismiss={() => setShowPopover(false)} side="bottom" alignment="center">
          <div style={{
            background: 'linear-gradient(180deg, rgba(13, 128, 163, 0.1) 0%, rgba(13, 128, 163, 0.3) 50%, rgba(13, 128, 163, 0.1) 100%)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '2px solid white',
            borderRadius: '8px',
            overflow: 'hidden',
            minWidth: '120px',
            padding: '2px 0'
          }}>
            <IonList style={{ background: 'transparent', padding: '0' }}>
              <IonItem button style={{ '--background-hover': 'rgba(255,255,255,0.1)', '--padding-start': '8px', '--inner-padding-end': '8px', minHeight: '32px' }} onClick={async () => {
                if (currentSermon) {
                  const shareData = {
                    title: currentSermon.title,
                    text: currentSermon.description,
                    url: window.location.href
                  };

                  try {
                    if (navigator.share) {
                      await navigator.share(shareData);
                    } else {
                      // Fallback: copy to clipboard
                      const textToCopy = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
                      await navigator.clipboard.writeText(textToCopy);
                      alert('Sermon details copied to clipboard!');
                    }
                  } catch (error) {
                    console.error('Error sharing:', error);
                    alert('Failed to share sermon. Please try again.');
                  }
                }
                setShowPopover(false);
              }}>
                <IonIcon icon="share" slot="start" style={{ fontSize: '1em' }} />
                <IonLabel style={{ fontSize: '0.85em' }}>Share</IonLabel>
              </IonItem>
            </IonList>
          </div>
        </IonPopover>

        {/* Success Alert */}
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="Success"
          message={alertMessage}
          buttons={['OK']}
        />
      </IonContent>
    </IonPage>
  );
};

export default Saved;