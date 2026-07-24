import React, { useEffect, useContext, useMemo, useState } from 'react';
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
import { usePlayer } from '../contexts/PlayerContext';
import { isPodcast } from '../utils/mediaUtils';
import VideoPlayer from '../components/VideoPlayer';
import { apiService, BACKEND_BASE_URL } from '../services/api';
import {
  arrowBack,
  book,
  heart,
  play,
  pause,
  close,
  playCircle,
  radio,
  trash,
  chevronForward
} from 'ionicons/icons';
import { useSettings } from '../contexts/SettingsContext';
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

interface SavedSermon {
  id: string;
  title: string;
  speaker: string;
  date: string;
  duration?: string;
  thumbnailUrl?: string;
  viewCount?: string;
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

  const [loading, setLoading] = useState(true);
  const [savedSermons, setSavedSermons] = useState<SavedSermon[]>([]);
  const [savedPodcasts, setSavedPodcasts] = useState<SavedPodcast[]>([]);
  const [savedDevotions, setSavedDevotions] = useState<SavedDevotion[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('sermons');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [itemToDelete, setItemToDelete] = useState<{ type: ActiveTab; id: string } | null>(null);
  const [selectedSermon, setSelectedSermon] = useState<any>(null);
  const [selectedPodcast, setSelectedPodcast] = useState<any>(null);
  const [selectedMediaType, setSelectedMediaType] = useState<'sermon' | 'podcast' | null>(null);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [playerError, setPlayerError] = useState('');

  const { currentMedia, isPlaying, setCurrentMedia, setIsPlaying, clearPlayer } = usePlayer();

  const totalCount = savedSermons.length + savedPodcasts.length + savedDevotions.length;

  const inlineSermon = selectedMediaType === 'sermon'
    ? selectedSermon
    : !selectedMediaType && currentMedia && !isPodcast(currentMedia)
      ? currentMedia
      : null;

  const inlinePodcast = selectedMediaType === 'podcast'
    ? selectedPodcast
    : !selectedMediaType && currentMedia && isPodcast(currentMedia)
      ? currentMedia
      : null;

  const showSermonPlayerCard = Boolean(inlineSermon);
  const showPodcastPlayerCard = Boolean(inlinePodcast);

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

  useEffect(() => {
    if (!currentMedia) {
      setSelectedMediaType(null);
      setSelectedSermon(null);
      setSelectedPodcast(null);
      setPlayerError('');
    }
  }, [currentMedia]);

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
        viewCount: s.viewCount?.toString() || '0'
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

  const handleClosePlayer = () => {
    setSelectedMediaType(null);
    setSelectedSermon(null);
    setSelectedPodcast(null);
    setPlayerError('');
    clearPlayer();
  };

  const handleOpenSermonPlayer = async (id: string) => {
    if (selectedMediaType === 'sermon' && selectedSermon?.id === id) return;
    setPlayerLoading(true);
    setPlayerError('');
    setSelectedMediaType('sermon');
    setSelectedPodcast(null);

    try {
      const response = await apiService.getSermon(id);
      const sermonData = response.sermon || response;
      const formattedSermon = {
        id: sermonData._id || sermonData.id,
        title: sermonData.title || 'Sermon',
        description: sermonData.description || sermonData.summary || '',
        thumbnailUrl: sermonData.thumbnailUrl || sermonData.thumbnail || '',
        publishedAt: sermonData.publishedAt || sermonData.date || new Date().toISOString(),
        duration: sermonData.duration || sermonData.length || '00:00',
        viewCount: sermonData.viewCount?.toString() || '0',
        videoUrl: sermonData.videoUrl || sermonData.streamUrl || sermonData.video || '',
        streamUrl: sermonData.streamUrl || sermonData.videoUrl || '',
        speaker: sermonData.speaker || 'Dove Ministries Africa'
      };
      setSelectedSermon(formattedSermon);
      setCurrentMedia(formattedSermon);
      setIsPlaying(true);
    } catch (error) {
      console.error('Failed to open sermon player:', error);
      setPlayerError('Unable to load sermon player.');
    } finally {
      setPlayerLoading(false);
    }
  };

  const handleOpenPodcastPlayer = async (id: string) => {
    if (selectedMediaType === 'podcast' && selectedPodcast?.id === id) return;
    setPlayerLoading(true);
    setPlayerError('');
    setSelectedMediaType('podcast');
    setSelectedSermon(null);

    try {
      const response = await apiService.getPodcast(id);
      const podcastData = response.podcast || response;
      const formattedPodcast = {
        id: podcastData._id || podcastData.id,
        title: podcastData.title || 'Podcast',
        description: podcastData.description || '',
        thumbnailUrl: podcastData.thumbnailUrl || podcastData.thumbnail || '',
        publishedAt: podcastData.publishedAt || podcastData.date || new Date().toISOString(),
        duration: podcastData.duration || '00:00',
        viewCount: podcastData.viewCount?.toString() || '0',
        audioUrl: podcastData.audioUrl || podcastData.audioFile || '',
        speaker: podcastData.speaker || 'Dove Ministries Africa',
        isLive: podcastData.isLive || false
      };
      setSelectedPodcast(formattedPodcast);
      setCurrentMedia(formattedPodcast);
      setIsPlaying(true);
    } catch (error) {
      console.error('Failed to open podcast player:', error);
      setPlayerError('Unable to load podcast player.');
    } finally {
      setPlayerLoading(false);
    }
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
          <IonTitle className="title-ios" style={{ textAlign: 'left', marginLeft: '-16px' }}>My Favorites</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
        <div className="fav-page">

          {/* Content Type Tabs */}
          {showSermonPlayerCard && inlineSermon && (
            <div className="fav-player-card">
              <div className="fav-player-card-header">
                <div>
                  <p className="fav-player-label">Now playing</p>
                  <h2 className="fav-player-title">{inlineSermon.title}</h2>
                  <p className="fav-player-meta">{inlineSermon.speaker} • {new Date(inlineSermon.publishedAt).toLocaleDateString()}</p>
                </div>
                <IonButton fill="clear" onClick={handleClosePlayer} className="fav-player-close-button">
                  <IonIcon icon={close} />
                </IonButton>
              </div>
              {playerLoading ? (
                <div className="fav-player-loading">Loading sermon player...</div>
              ) : playerError ? (
                <div className="fav-player-error">{playerError}</div>
              ) : (
                <div className="fav-player-video-wrap">
                  <VideoPlayer
                    url={getFullUrl(inlineSermon.videoUrl || inlineSermon.streamUrl || '')}
                    title={inlineSermon.title}
                    playing={isPlaying}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    fullScreen={false}
                    startTime={0}
                    onTimeUpdate={(time) => {
                      /* persist play position */
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {showPodcastPlayerCard && inlinePodcast && (
            <div className="fav-player-card fav-podcast-card">
              <div className="fav-player-card-header">
                <div>
                  <p className="fav-player-label">Podcast player</p>
                  <h2 className="fav-player-title">{inlinePodcast.title}</h2>
                  <p className="fav-player-meta">{inlinePodcast.speaker} • {new Date(inlinePodcast.publishedAt).toLocaleDateString()}</p>
                </div>
                <div className="fav-player-actions">
                  <IonButton fill="clear" onClick={() => setIsPlaying(!isPlaying)}>
                    <IonIcon icon={isPlaying ? pause : play} />
                  </IonButton>
                  <IonButton fill="clear" onClick={handleClosePlayer} className="fav-player-close-button">
                    <IonIcon icon={close} />
                  </IonButton>
                </div>
              </div>
              {playerLoading ? (
                <div className="fav-player-loading">Loading podcast player...</div>
              ) : playerError ? (
                <div className="fav-player-error">{playerError}</div>
              ) : (
                <div className="fav-player-podcast-body">
                  <div className="fav-player-thumbnail">
                    <img src={getFullUrl(inlinePodcast.thumbnailUrl)} alt={inlinePodcast.title} onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      if (!target.dataset['tried']) {
                        target.dataset['tried'] = 'true';
                        target.src = '/bible.JPG';
                      }
                    }} />
                  </div>
                  <div className="fav-player-podcast-info">
                    <p className="fav-player-description">{inlinePodcast.description || 'Play this podcast from your favorites.'}</p>
                    <p className="fav-player-duration">Duration: {inlinePodcast.duration}</p>
                  </div>
                </div>
              )}
            </div>
          )}

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
                    return (
                      <div
                        key={s.id}
                        className="fav-media-list-item"
                        onClick={() => handleOpenSermonPlayer(s.id)}
                      >
                        <div className="fav-media-thumb">
                          <img
                            src={getThumbnailUrl(s.thumbnailUrl)}
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
                        onClick={() => handleOpenPodcastPlayer(p.id)}
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