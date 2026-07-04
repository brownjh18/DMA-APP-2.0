import React, { useEffect, useContext, useMemo, useState } from 'react';
import {
  IonAlert,
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonLoading,
  IonPage,
  IonTitle,
  IonToolbar
} from '@ionic/react';
import {
  arrowBack,
  book,
  heart,
  personCircleOutline,
  playCircle,
  radio,
  trash
} from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import { AuthContext } from '../App';
import { apiService } from '../services/api';

interface SavedSermon {
  id: string;
  title: string;
  speaker: string;
  date: string;
  duration?: string;
}

interface SavedPodcast {
  id: string;
  title: string;
  speaker?: string;
  publishedAt: string;
  duration?: string;
  isLive?: boolean;
}

interface SavedDevotion {
  id: string;
  title: string;
  date: string;
  day?: number;
}

const MyFavorites: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [savedSermons, setSavedSermons] = useState<SavedSermon[]>([]);
  const [savedPodcasts, setSavedPodcasts] = useState<SavedPodcast[]>([]);
  const [savedDevotions, setSavedDevotions] = useState<SavedDevotion[]>([]);
  const [activeTab, setActiveTab] = useState<'sermons' | 'podcasts' | 'devotions'>('sermons');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const history = useHistory();
  const location = useLocation();
  const { isLoggedIn, user, isAuthChecking } = useContext(AuthContext);

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
    const handleStorage = (e: StorageEvent) => {
      if (isLoggedIn && (e.key === 'savedSermons' || e.key === 'savedPodcasts' || e.key === 'savedDevotions')) {
        loadSavedContent();
      }
    };

    window.addEventListener('savedItemsChanged', handleSavedItemsChanged as EventListener);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('savedItemsChanged', handleSavedItemsChanged as EventListener);
      window.removeEventListener('storage', handleStorage);
    };
  }, [isLoggedIn]);

  const loadSavedContent = async () => {
    setLoading(true);
    try {
      const [sermons, podcasts, devotions] = await Promise.all([
        apiService.getSavedSermons(),
        apiService.getSavedPodcasts(),
        apiService.getSavedDevotions()
      ]);
      setSavedSermons(sermons);
      setSavedPodcasts(podcasts);
      setSavedDevotions(devotions);
    } catch (error) {
      console.error('Failed to load saved content:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

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

  const activeCount = useMemo(() => {
    if (activeTab === 'sermons') return savedSermons.length;
    if (activeTab === 'podcasts') return savedPodcasts.length;
    return savedDevotions.length;
  }, [activeTab, savedSermons.length, savedPodcasts.length, savedDevotions.length]);

  const renderEmpty = () => (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--ion-text-color)', opacity: 0.7 }}>
      <IonIcon
        icon={activeTab === 'sermons' ? playCircle : activeTab === 'podcasts' ? radio : book}
        style={{ fontSize: '3em', color: 'var(--ion-color-medium)', marginBottom: '16px' }}
      />
      <h3>No favorite {activeTab} found</h3>
      <p>You haven't favorited any {activeTab} yet. Use the heart button on content to add them here.</p>
    </div>
  );





  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <IonButton fill="clear" slot="start" onClick={() => history.goBack()} style={{ marginLeft: '4px' }}>
            <IonIcon icon={arrowBack} />
          </IonButton>
          <IonTitle className="title-ios">My Favorites</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
        <div style={{ padding: '16px', maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px', padding: '20px 0' }}>
            <IonIcon icon={heart} style={{ fontSize: '3em', color: 'var(--ion-color-primary)', marginBottom: '12px' }} />
            <h1 style={{ margin: '0 0 8px 0', fontSize: '1.8em', fontWeight: '700', color: 'var(--ion-text-color)' }}>
              My Favorites
            </h1>
            <p style={{ margin: 0, color: 'var(--ion-text-color)', opacity: 0.7, fontSize: '1em' }}>
              Access your favorite sermons, podcasts, and devotions
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '4px',
              background: 'var(--ion-item-background)',
              padding: '4px',
              borderRadius: '12px',
              border: '1px solid var(--ion-color-primary)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              marginBottom: '20px'
            }}
          >
            <div
              onClick={() => setActiveTab('sermons')}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: '10px',
                fontSize: '0.85em',
                fontWeight: '600',
                cursor: 'pointer',
                backgroundColor: activeTab === 'sermons' ? 'var(--ion-color-primary)' : 'transparent',
                color: activeTab === 'sermons' ? 'white' : 'var(--ion-text-color)',
                textAlign: 'center'
              }}
            >
              Sermons ({savedSermons.length})
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
                backgroundColor: activeTab === 'podcasts' ? 'var(--ion-color-primary)' : 'transparent',
                color: activeTab === 'podcasts' ? 'white' : 'var(--ion-text-color)',
                textAlign: 'center'
              }}
            >
              Podcasts ({savedPodcasts.length})
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
                backgroundColor: activeTab === 'devotions' ? 'var(--ion-color-primary)' : 'transparent',
                color: activeTab === 'devotions' ? 'white' : 'var(--ion-text-color)',
                textAlign: 'center'
              }}
            >
              Devotions ({savedDevotions.length})
            </div>
          </div>

          {activeTab === 'sermons' && (
            savedSermons.length === 0 ? (
              renderEmpty()
            ) : (
              savedSermons.map((sermon) => (
                <IonItem
                  key={sermon.id}
                  lines="none"
                  style={{
                    marginBottom: '12px',
                    borderRadius: '12px',
                    '--background': 'var(--ion-background-color)',
                    border: '1px solid var(--ion-color-step-200)'
                  }}
                >
                  <IonLabel>
                    <h2 style={{ marginBottom: '4px' }}>{sermon.title}</h2>
                    <p>{sermon.speaker} • {formatDate(sermon.date)} • {sermon.duration || '—'}</p>
                  </IonLabel>
                  <IonButton fill="clear" color="danger" onClick={() => removeSavedSermon(sermon.id)}>
                    <IonIcon icon={trash} />
                  </IonButton>
                </IonItem>
              ))
            )
          )}

          {activeTab === 'podcasts' && (
            savedPodcasts.length === 0 ? (
              renderEmpty()
            ) : (
              savedPodcasts.map((podcast) => (
                <IonItem
                  key={podcast.id}
                  lines="none"
                  style={{
                    marginBottom: '12px',
                    borderRadius: '12px',
                    '--background': 'var(--ion-background-color)',
                    border: '1px solid var(--ion-color-step-200)'
                  }}
                >
                  <IonLabel>
                    <h2 style={{ marginBottom: '4px' }}>{podcast.title}</h2>
                    <p>{podcast.speaker || 'Dove Ministries Africa'} • {formatDate(podcast.publishedAt)} • {podcast.duration || '—'}</p>
                  </IonLabel>
                  <IonButton fill="clear" color="danger" onClick={() => removeSavedPodcast(podcast.id)}>
                    <IonIcon icon={trash} />
                  </IonButton>
                </IonItem>
              ))
            )
          )}

          {activeTab === 'devotions' && (
            savedDevotions.length === 0 ? (
              renderEmpty()
            ) : (
              savedDevotions.map((devotion) => (
                <IonItem
                  key={devotion.id}
                  lines="none"
                  style={{
                    marginBottom: '12px',
                    borderRadius: '12px',
                    '--background': 'var(--ion-background-color)',
                    border: '1px solid var(--ion-color-step-200)'
                  }}
                >
                  <IonLabel>
                    <h2 style={{ marginBottom: '4px' }}>{devotion.title}</h2>
                    <p>{formatDate(devotion.date)} • Day {devotion.day || 1}</p>
                  </IonLabel>
                  <IonButton fill="clear" color="danger" onClick={() => removeSavedDevotion(devotion.id)}>
                    <IonIcon icon={trash} />
                  </IonButton>
                </IonItem>
              ))
            )
          )}

          <div style={{ marginTop: '32px', textAlign: 'center', color: 'var(--ion-text-color)', opacity: 0.7 }}>
            {activeCount > 0 && (
              <p style={{ margin: 0 }}>
                You have {savedSermons.length} favorite sermon{savedSermons.length !== 1 ? 's' : ''},{' '}
                {savedPodcasts.length} favorite podcast{savedPodcasts.length !== 1 ? 's' : ''}, and{' '}
                {savedDevotions.length} favorite devotion{savedDevotions.length !== 1 ? 's' : ''}.
              </p>
            )}
          </div>
        </div>

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

export default MyFavorites;