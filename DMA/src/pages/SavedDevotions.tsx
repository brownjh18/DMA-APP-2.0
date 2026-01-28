import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardContent, IonBadge, IonIcon, IonButton, IonGrid, IonRow, IonCol, IonRefresher, IonRefresherContent } from '@ionic/react';
import { useState, useEffect } from 'react';
import { book, heart, flame, play, arrowForward, calendar, time, arrowBack, trash } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';

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

const SavedDevotions: React.FC = () => {
  const history = useHistory();
  const [savedDevotions, setSavedDevotions] = useState<SavedDevotion[]>([]);

  useEffect(() => {
    loadSavedDevotions();
    
    // Also reload when the page gains focus (user navigates back)
    const handleFocus = () => {
      loadSavedDevotions();
    };
    
    // Listen for saved items changed events from other pages
    const handleSavedItemsChange = () => {
      loadSavedDevotions();
    };
    
    // Listen for storage changes (cross-tab communication)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'savedDevotions') {
        loadSavedDevotions();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('savedItemsChanged', handleSavedItemsChange);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('savedItemsChanged', handleSavedItemsChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const loadSavedDevotions = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('savedDevotions') || '[]');
      // Sort by saved date (newest first)
      saved.sort((a: SavedDevotion, b: SavedDevotion) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
      setSavedDevotions(saved);
    } catch (error) {
      console.error('Error loading saved devotions:', error);
      setSavedDevotions([]);
    }
  };

  const handleRefresh = (event: CustomEvent) => {
    loadSavedDevotions();
    event.detail.complete();
  };

  const removeSavedDevotion = (devotionId: string) => {
    try {
      const updated = savedDevotions.filter(d => d.id !== devotionId);
      localStorage.setItem('savedDevotions', JSON.stringify(updated));
      setSavedDevotions(updated);
      alert('Devotion removed from saved list.');
    } catch (error) {
      console.error('Error removing saved devotion:', error);
      alert('Failed to remove devotion.');
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const getFullUrl = (url: string) => {
    if (url.startsWith('/uploads/')) {
      return `http://localhost:5000${url}`;
    }
    return url;
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          {/* Back Button */}
          <div
            onClick={() => history.goBack()}
            style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 25,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
            }}
          >
            <IonIcon
              icon={arrowBack}
              style={{
                fontSize: '1.2em',
                color: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? '#ffffff' : '#000000'
              }}
            />
          </div>

          <IonTitle className="title-ios">Saved Devotions</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios ios18-style" style={{ backgroundColor: 'var(--ion-background-color)' }}>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        {savedDevotions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px' }}>
            <IonIcon icon={book} style={{ fontSize: '48px', color: '#9ca3af', marginBottom: '16px' }} />
            <h3>No saved devotions</h3>
            <p style={{ color: '#666', marginTop: '20px' }}>
              You haven't saved any devotions yet. Visit the devotions section to save some.
            </p>
          </div>
        ) : (
          <div style={{ padding: '20px' }}>
            {savedDevotions.map((devotion) => (
              <IonCard key={devotion.id} style={{ marginBottom: '20px', borderRadius: '16px', overflow: 'hidden' }}>
                <IonCardContent style={{ padding: '0' }}>
                  {/* Header with thumbnail */}
                  <div style={{
                    backgroundImage: `url(${devotion.thumbnailUrl ? getFullUrl(devotion.thumbnailUrl) : '/hero-evangelism.jpg'})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    position: 'relative',
                    height: '150px'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(0,0,0,0.4)',
                      backdropFilter: 'blur(2px)'
                    }} />
                    <div style={{ position: 'relative', zIndex: 1, padding: '20px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <h2 style={{ color: 'white', fontSize: '1.2em', margin: '0 0 10px 0', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                          {devotion.title}
                        </h2>
                        <div style={{ display: 'flex', gap: '15px', fontSize: '0.9em' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <IonIcon icon={calendar} style={{ color: 'white' }} />
                            <span style={{ color: 'white' }}>{formatDate(devotion.date)}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <IonIcon icon={time} style={{ color: 'white' }} />
                            <span style={{ color: 'white' }}>5 min read</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <IonButton
                          fill="clear"
                          size="small"
                          onClick={() => history.push(`/full-devotion?id=${devotion.id}`)}
                          style={{ color: 'white', '--color': 'white' }}
                        >
                          Read Full
                          <IonIcon icon={book} slot="end" />
                        </IonButton>
                        <IonButton
                          fill="clear"
                          size="small"
                          onClick={() => removeSavedDevotion(devotion.id)}
                          style={{ color: '#ef4444', '--color': '#ef4444' }}
                        >
                          <IonIcon icon={trash} />
                        </IonButton>
                      </div>
                    </div>
                  </div>

                  {/* Content preview */}
                  <div style={{ padding: '20px' }}>
                    <p style={{ fontSize: '0.9em', lineHeight: '1.6', color: 'var(--ion-text-color)', marginBottom: '16px' }}>
                      {devotion.content.length > 150 ? devotion.content.substring(0, 150) + '...' : devotion.content}
                    </p>
                    <div style={{
                      fontStyle: 'italic',
                      color: 'var(--ion-color-primary)',
                      fontWeight: '500',
                      fontSize: '0.8em'
                    }}>
                      {devotion.scripture}
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            ))}
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default SavedDevotions;