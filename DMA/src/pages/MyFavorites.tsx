// @ts-nocheck
import React, { useEffect, useContext, useMemo, useState, useCallback } from 'react';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonTitle,
  IonToolbar,
  IonAlert,
  IonText
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { AuthContext } from '../App';
import { apiService, BACKEND_BASE_URL } from '../services/api';
import { usePlayer } from '../contexts/PlayerContext';
import VideoPlayer from '../components/VideoPlayer';
import {
  arrowBack,
  book,
  playCircle,
  radio,
  trash,
  chevronForward,
  share,
  close,
  heart,
  heartOutline
} from 'ionicons/icons';
import { useSettings } from '../contexts/SettingsContext';
import { parseDurationToSeconds, formatRemainingTime } from '../utils/mediaUtils';
import './MyFavorites.css';

const getFullUrl = (url: string) => {
  if (url && url.startsWith('/uploads/')) {
    return `${BACKEND_BASE_URL}${url}`;
  }
  return url;
};

const getThumbnailUrl = (url?: string) => {
  if (!url || !url.trim()) return '/bible.JPG';
  return getFullUrl(url);
};

const getSermonFullThumbnailUrl = (sermon: any) => {
  if (sermon.thumbnailUrl) {
    const url = getFullUrl(sermon.thumbnailUrl);
    if (url && !url.includes('undefined') && !url.includes('null')) {
      return url;
    }
  }
  return '/bible.JPG';
};

const getSermonVideoUrl = (sermon: any) => {
  const videoUrl = sermon.videoUrl || sermon.streamUrl || sermon.url || '';
  return getFullUrl(videoUrl);
};

interface SavedSermon {
  id: string;
  title: string;
  speaker: string;
  date: string;
  duration?: string;
  thumbnailUrl?: string;
  viewCount?: string;
  description?: string;
  videoUrl?: string;
  streamUrl?: string;
}

interface SavedPodcast {
  id: string;
  title: string;
  speaker?: string;
  publishedAt: string;
  duration?: string;
  isLive?: boolean;
  thumbnailUrl?: string;
  viewCount?: string;
}

interface SavedDevotion {
  id: string;
  title: string;
  scripture?: string;
  content?: string;
  reflection?: string;
  date: string;
  day?: number;
  thumbnailUrl?: string;
}

type ActiveTab = 'sermons' | 'podcasts' | 'devotions';

const MyFavorites: React.FC = () => {
  const history = useHistory();
  const { isLoggedIn, user, isAuthChecking } = useContext(AuthContext);
  const { isDarkMode } = useSettings();
  const { currentSermon, setCurrentSermon, isPlaying, setIsPlaying, savePlaybackPosition, getPlaybackPosition, getPlaybackPositionById, clearPlayer } = usePlayer();

  const [loading, setLoading] = useState(true);
  const [savedSermons, setSavedSermons] = useState<SavedSermon[]>([]);
  const [savedPodcasts, setSavedPodcasts] = useState<SavedPodcast[]>([]);
  const [savedDevotions, setSavedDevotions] = useState<SavedDevotion[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('sermons');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [itemToDelete, setItemToDelete] = useState<{ type: ActiveTab; id: string } | null>(null);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [selectedSermon, setSelectedSermon] = useState<any>(null);
  const [loadingSermon, setLoadingSermon] = useState(false);
  const totalCount = savedSermons.length + savedPodcasts.length + savedDevotions.length;

  const stats = [
    { label: 'Sermons', value: savedSermons.length, color: '#6366f1' },
    { label: 'Podcasts', value: savedPodcasts.length, color: '#f59e0b' },
    { label: 'Devotions', value: savedDevotions.length, color: '#10b981' },
  ];

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

  const getProgressInfo = (id: string, duration?: string) => {
    if (!duration) return { percent: 0, remaining: '' };
    const total = parseDurationToSeconds(duration);
    if (total <= 0) return { percent: 0, remaining: '' };
    const position = getPlaybackPositionById(id);
    if (position <= 0) return { percent: 0, remaining: '' };
    const percent = Math.min((position / total) * 100, 100);
    const remaining = total - position;
    return { percent, remaining: formatRemainingTime(remaining) };
  };

  const stableOnTimeUpdate = useCallback((time: number) => {
    savePlaybackPosition(time);
  }, []);

  const stableOnPlay = useCallback(() => setIsPlaying(true), []);

  const savedStartTime = useMemo(() => getPlaybackPosition(), [selectedSermon?.id]);

  const videoUrl = useMemo(() => {
    if (!selectedSermon) return '';
    return getSermonVideoUrl(selectedSermon);
  }, [selectedSermon?.id, selectedSermon?.videoUrl, selectedSermon?.streamUrl]);

  useEffect(() => {
    if (isLoggedIn) {
      loadSavedContent();
    } else {
      setLoading(false);
    }

    const handleSavedItemsChanged = () => {
      if (isLoggedIn) {
        loadSavedContent();
      }
    };

    window.addEventListener('savedItemsChanged', handleSavedItemsChanged as EventListener);

    return () => {
      window.removeEventListener('savedItemsChanged', handleSavedItemsChanged as EventListener);
    };
  }, [isLoggedIn]);

  const loadSavedContent = async () => {
    setLoading(true);
    try {
      const [sermonsRes, podcastsRes, devotionsRes] = await Promise.all([
        apiService.getSavedSermons(true),
        apiService.getSavedPodcasts(true),
        apiService.getSavedDevotions(true)
      ]);
      const sermonList = Array.isArray(sermonsRes) ? sermonsRes : (sermonsRes?.savedSermons || sermonsRes?.data || []);
      const podcastList = Array.isArray(podcastsRes) ? podcastsRes : (podcastsRes?.savedPodcasts || podcastsRes?.data || []);
      const devotionList = Array.isArray(devotionsRes) ? devotionsRes : (devotionsRes?.savedDevotions || devotionsRes?.data || []);
      
      setSavedSermons(sermonList.map((s: any) => ({ 
        id: s._id || s.id, 
        title: s.title, 
        speaker: s.speaker || 'Dove Ministries Africa', 
        date: s.date, 
        duration: s.duration,
        thumbnailUrl: s.thumbnailUrl,
        viewCount: s.viewCount?.toString() || '0',
        description: s.description || '',
        videoUrl: s.videoUrl || '',
        streamUrl: s.streamUrl || ''
      })));
      setSavedPodcasts(podcastList.map((p: any) => ({ 
        id: p._id || p.id, 
        title: p.title, 
        speaker: p.speaker || 'Dove Ministries Africa', 
        publishedAt: p.publishedAt || p.date, 
        duration: p.duration, 
        isLive: p.isLive,
        thumbnailUrl: p.thumbnailUrl,
        viewCount: p.viewCount?.toString() || '0'
      })));
      setSavedDevotions(devotionList.map((d: any) => ({ 
        id: d._id || d.id, 
        title: d.title, 
        scripture: d.scripture,
        content: d.content,
        reflection: d.reflection,
        date: d.date, 
        day: d.day,
        thumbnailUrl: d.thumbnailUrl
      })));
    } catch (error) {
      console.error('Failed to load saved content:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeSavedSermon = async (id: string) => {
    const updated = savedSermons.filter(item => item.id !== id);
    setSavedSermons(updated);
    localStorage.setItem('savedSermons', JSON.stringify(updated));
    if (selectedSermon?.id === id) {
      setSelectedSermon(null);
    }
    try {
      await apiService.saveSermon(id);
    } catch (error) {
      console.warn('Failed to update sermon saved state:', error);
    }
    window.dispatchEvent(new Event('savedItemsChanged'));
    setAlertMessage('Sermon removed from favorites');
    setShowAlert(true);
  };

  const removeSavedPodcast = async (id: string) => {
    const updated = savedPodcasts.filter(item => item.id !== id);
    setSavedPodcasts(updated);
    localStorage.setItem('savedPodcasts', JSON.stringify(updated));
    try {
      await apiService.unsavePodcast(id);
    } catch (error) {
      console.warn('Failed to update podcast saved state:', error);
    }
    window.dispatchEvent(new Event('savedItemsChanged'));
    setAlertMessage('Podcast removed from favorites');
    setShowAlert(true);
  };

  const removeSavedDevotion = async (id: string) => {
    const updated = savedDevotions.filter(item => item.id !== id);
    setSavedDevotions(updated);
    localStorage.setItem('savedDevotions', JSON.stringify(updated));
    try {
      await apiService.saveDevotion(id);
    } catch (error) {
      console.warn('Failed to update devotion saved state:', error);
    }
    window.dispatchEvent(new Event('savedItemsChanged'));
    setAlertMessage('Devotion removed from favorites');
    setShowAlert(true);
  };

  const handleDeleteConfirm = () => {
    if (!itemToDelete) return;
    const { type, id } = itemToDelete;
    if (type === 'sermons') removeSavedSermon(id);
    else if (type === 'podcasts') removeSavedPodcast(id);
    else if (type === 'devotions') removeSavedDevotion(id);
    setItemToDelete(null);
  };

  const handleOpenSermon = async (sermon: SavedSermon) => {
    setSelectedSermon(sermon);
    setLoadingSermon(true);

    try {
      const data = await apiService.getSermon(sermon.id);
      const sermonData = data.sermon || data;

      const formattedSermon = {
        id: sermonData._id || sermonData.id,
        title: sermonData.title,
        description: sermonData.description || '',
        thumbnailUrl: sermonData.thumbnailUrl || sermonData.thumbnail || '',
        publishedAt: sermonData.date || sermonData.createdAt || new Date().toISOString(),
        duration: sermonData.duration || '00:00',
        viewCount: sermonData.viewCount?.toString() || '0',
        videoUrl: sermonData.videoUrl || sermonData.streamUrl || '',
        streamUrl: sermonData.streamUrl || '',
        isDatabaseSermon: true,
        isLive: false
      };

      setSelectedSermon(formattedSermon);
      setCurrentSermon(formattedSermon as any);
      setIsPlaying(true);
    } catch (error) {
      console.error('Failed to fetch sermon:', error);
      setSelectedSermon(sermon as any);
      setCurrentSermon(sermon as any);
      setIsPlaying(true);
    } finally {
      setLoadingSermon(false);
    }
  };

  const handleOpenPodcast = (id: string) => {
    history.push(`/full-podcast-player?id=${encodeURIComponent(id)}`);
  };

  const toggleSaveSermon = async (sermon: any) => {
    if (isSermonSaved(sermon.id)) {
      removeSavedSermon(sermon.id);
    } else {
      try {
        await apiService.saveSermon(sermon.id);
        window.dispatchEvent(new Event('savedItemsChanged'));
        setAlertMessage('Sermon saved to favorites');
        setShowAlert(true);
      } catch (error) {
        console.warn('Failed to save sermon:', error);
      }
    }
  };

  const isSermonSaved = (sermonId: string) => {
    return savedSermons.some(s => s.id === sermonId);
  };

  const currentItems = activeTab === 'sermons' ? savedSermons 
    : activeTab === 'podcasts' ? savedPodcasts 
    : savedDevotions;

  const emptyIcons = { sermons: playCircle, podcasts: radio, devotions: book };
  const emptyLabels = { sermons: 'sermons', podcasts: 'podcasts', devotions: 'devotions' };
  const tabIcons = { sermons: playCircle, podcasts: radio, devotions: book };
  const tabLabels = { sermons: 'Sermons', podcasts: 'Podcasts', devotions: 'Devotions' };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <IonButton fill="clear" slot="start" onClick={() => history.goBack()} style={{ marginLeft: '4px' }}>
            <IonIcon icon={arrowBack} style={{ fontSize: '22px' }} />
          </IonButton>
          <IonTitle className="title-ios" style={{ textAlign: 'left', marginLeft: '-28px' }}>My Favorites</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
          {/* Inline Sermon Player (like Tab2) - Sticky */}
          {activeTab === 'sermons' && selectedSermon && (
            <div className="fav-sermon-player">
              {/* Video Player */}
              <div style={{
                width: '100%',
                background: 'black',
                position: 'relative'
              }}>
                {loadingSermon ? (
                  <div style={{ 
                    width: '100%', 
                    aspectRatio: '16/9', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    background: '#000',
                    color: '#fff'
                  }}>
                    Loading sermon...
                  </div>
                ) : (
                  <VideoPlayer
                    key={selectedSermon.id}
                    url={videoUrl}
                    title={selectedSermon.title}
                    playing={isPlaying}
                    startTime={savedStartTime}
                    onPlay={stableOnPlay}
                    onTimeUpdate={stableOnTimeUpdate}
                  />
                )}
              </div>

              {/* Video Details Section (matching Tab2) */}
              <div className="video-details-section">
                <h1 className="video-title-large">{selectedSermon.title}</h1>

                <div className="channel-info-row">
                  <div className="channel-info">
                    <div>
                      <h3 className="channel-name">Dove Ministries Africa</h3>
                      <p className="channel-stats">
                        {selectedSermon.viewCount} views • {formatDate(selectedSermon.publishedAt || selectedSermon.date || new Date().toISOString())}
                      </p>
                    </div>
                  </div>
                  <div className="channel-action-buttons">
                    {/* Share Button */}
                    <div
                      className="channel-action-button"
                      onClick={async () => {
                        const shareUrl = `${window.location.origin}/favorites?sermonId=${selectedSermon.id}`;
                        const shareData = {
                          title: selectedSermon.title,
                          text: selectedSermon.description || '',
                          url: shareUrl
                        };
                        try {
                          if (navigator.share) {
                            await navigator.share(shareData);
                          } else {
                            const textToCopy = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
                            await navigator.clipboard.writeText(textToCopy);
                            alert('Sermon details copied to clipboard!');
                          }
                        } catch (error) {
                          console.error('Error sharing:', error);
                        }
                      }}
                      style={{
                        width: 45, height: 45, borderRadius: 25,
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))',
                        backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 6px 16px rgba(0,0,0,0.25)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', marginLeft: '12px', transition: 'transform 0.2s ease'
                      }}
                    >
                      <IonIcon icon={share} style={{ color: isDarkMode ? '#ffffff' : '#000000', fontSize: '20px' }} />
                    </div>
                    {/* Save Button */}
                    <div
                      className="channel-action-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSaveSermon(selectedSermon);
                      }}
                      style={{
                        width: 45, height: 45, borderRadius: 25,
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))',
                        backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 6px 16px rgba(0,0,0,0.25)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', marginLeft: '12px', transition: 'transform 0.2s ease'
                      }}
                    >
                      <IonIcon
                        icon={isSermonSaved(selectedSermon.id) ? heart : heartOutline}
                        style={{ color: isSermonSaved(selectedSermon.id) ? '#ef4444' : 'var(--text-primary)', fontSize: '20px' }}
                      />
                    </div>
                    {/* Close Button */}
                    <div
                      className="channel-action-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSermon(null);
                        clearPlayer();
                      }}
                      style={{
                        width: 45, height: 45, borderRadius: 25,
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))',
                        backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 6px 16px rgba(0,0,0,0.25)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', marginLeft: '12px', transition: 'transform 0.2s ease'
                      }}
                    >
                      <IonIcon icon={close} style={{ color: 'var(--text-primary)', fontSize: '20px' }} />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="description-section">
                  <p className="description-text">
                    {(() => {
                      const description = selectedSermon.description || 'No description available.';
                      const shouldTruncate = description.length > 150 && !descriptionExpanded;
                      return shouldTruncate ? (
                        <>
                          {description.substring(0, 150)}...
                          <button
                            onClick={() => setDescriptionExpanded(true)}
                            style={{
                              background: 'none', border: 'none', color: 'var(--ion-color-primary)',
                              cursor: 'pointer', fontSize: '0.9em', fontWeight: '600', marginLeft: '4px', padding: '0'
                            }}
                          >
                            Show more
                          </button>
                        </>
                      ) : (
                        <>
                          {description}
                          {description.length > 150 && (
                            <button
                              onClick={() => setDescriptionExpanded(false)}
                              style={{
                                background: 'none', border: 'none', color: 'var(--ion-color-primary)',
                                cursor: 'pointer', fontSize: '0.9em', fontWeight: '600', marginLeft: '4px', padding: '0'
                              }}
                            >
                              Show less
                            </button>
                          )}
                        </>
                      );
                    })()}
                  </p>
                </div>
              </div>
            </div>
          )}

        <div className="fav-page">
          {/* Content Type Tabs */}
          <div className="fav-section">
            <div className="fav-section-header">
              <h2 className="fav-section-title">Browse by Type</h2>
            </div>
            <div className="fav-tabs">
              {(['sermons', 'podcasts', 'devotions'] as ActiveTab[]).map((tab, i) => (
                <button
                  key={i}
                  className={`fav-tab ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  <IonIcon icon={tabIcons[tab]} style={{ fontSize: '16px', marginRight: '6px', verticalAlign: 'middle' }} />
                  {tabLabels[tab]} ({stats[i].value})
                </button>
              ))}
            </div>

            {/* Content List */}
            <div className="fav-module-list">
              {currentItems.length === 0 ? (
                <div className="fav-empty">
                  <div className="fav-empty-icon">
                    <IonIcon icon={emptyIcons[activeTab]} />
                  </div>
                  <h3>No favorite {emptyLabels[activeTab]} yet</h3>
                  <p>Tap the heart icon on any {emptyLabels[activeTab]} to save it here for quick access.</p>
                </div>
              ) : (
                currentItems.map((item) => {
                  const isSermon = activeTab === 'sermons';
                  const isPodcast = activeTab === 'podcasts';
                  const isDevotion = activeTab === 'devotions';
                  
                  if (isSermon) {
                    const s = item as SavedSermon;
                    const isSelected = selectedSermon?.id === s.id;
                    return (
                      <div
                        key={s.id}
                        className={`fav-media-list-item ${isSelected ? 'fav-media-list-item--active' : ''}`}
                        onClick={() => handleOpenSermon(s)}
                      >
                        <div className="fav-media-thumb">
                          <img
                            src={getSermonFullThumbnailUrl(s)}
                            alt={s.title}
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement;
                              if (!target.dataset['tried']) {
                                target.dataset['tried'] = 'true';
                                target.src = '/bible.JPG';
                              }
                            }}
                          />
                          {s.duration && (
                            <div className="fav-media-duration">{s.duration}</div>
                          )}
                          {(() => {
                            const { percent, remaining } = getProgressInfo(s.id, s.duration);
                            if (percent <= 0) return null;
                            return (
                              <>
                                <div className="sermon-progress-wrap">
                                  <div className="sermon-progress-bar" style={{ width: `${percent}%` }} />
                                </div>
                                {remaining && <div className="sermon-remaining">{remaining}</div>}
                              </>
                            );
                          })()}
                        </div>
                        <div className="fav-media-info">
                          <h4 className="fav-media-title">{s.title}</h4>
                          <p className="fav-media-speaker">{s.speaker}</p>
                          <p className="fav-media-meta">{s.viewCount} views • {formatDate(s.date)}</p>
                        </div>
                        <IonButton
                          fill="clear"
                          size="small"
                          className="fav-media-delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            setItemToDelete({ type: 'sermons', id: s.id });
                          }}
                        >
                          <IonIcon icon={trash} />
                        </IonButton>
                      </div>
                    );
                  }

                  if (isPodcast) {
                    const p = item as SavedPodcast;
                    return (
                      <div
                        key={p.id}
                        className="fav-media-list-item"
                        onClick={() => handleOpenPodcast(p.id)}
                      >
                        <div className="fav-media-thumb">
                          <img
                            src={getThumbnailUrl(p.thumbnailUrl)}
                            alt={p.title}
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement;
                              if (!target.dataset['tried']) {
                                target.dataset['tried'] = 'true';
                                target.src = '/bible.JPG';
                              }
                            }}
                          />
                          {p.duration && (
                            <div className="fav-media-duration">{p.duration}</div>
                          )}
                        </div>
                        <div className="fav-media-info">
                          <h4 className="fav-media-title">{p.title}</h4>
                          <p className="fav-media-speaker">{p.speaker}</p>
                          <p className="fav-media-meta">{formatDate(p.publishedAt)}</p>
                        </div>
                        <IonButton
                          fill="clear"
                          size="small"
                          className="fav-media-delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            setItemToDelete({ type: 'podcasts', id: p.id });
                          }}
                        >
                          <IonIcon icon={trash} />
                        </IonButton>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={item.id}
                      className="fav-module-row"
                      onClick={(e) => {
                        e.preventDefault();
                        if (isDevotion) history.push(`/full-devotion?id=${item.id}`);
                      }}
                    >
                      <div className="fav-module-left">
                        <div className="fav-module-icon" style={{ background: '#10b981' }}>
                          <IonIcon icon={book} />
                        </div>
                        <div className="fav-module-text">
                          <span className="fav-module-name">{item.title}</span>
                          <span className="fav-module-detail">Devotion</span>
                        </div>
                      </div>
                      <div className="fav-module-right">
                        <IonIcon icon={chevronForward} className="fav-module-arrow" />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer Summary */}
          {totalCount > 0 && (
            <div className="fav-footer">
              <IonText>
                You have {savedSermons.length} favorite sermon{savedSermons.length !== 1 ? 's' : ''}, 
                {savedPodcasts.length} favorite podcast{savedPodcasts.length !== 1 ? 's' : ''}, and 
                {savedDevotions.length} favorite devotion{savedDevotions.length !== 1 ? 's' : ''}.
              </IonText>
            </div>
          )}

          {/* Alerts */}
          <IonAlert
            isOpen={showAlert}
            onDidDismiss={() => setShowAlert(false)}
            header="Success"
            message={alertMessage}
            buttons={['OK']}
          />

          <IonAlert
            isOpen={!!itemToDelete}
            onDidDismiss={() => setItemToDelete(null)}
            header="Remove Favorite"
            message="Are you sure you want to remove this from your favorites?"
            buttons={[
              { text: 'Cancel', role: 'cancel', handler: () => setItemToDelete(null) },
              { text: 'Remove', role: 'destructive', handler: handleDeleteConfirm }
            ]}
          />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default MyFavorites;
