import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardContent, IonBadge, IonIcon, IonButton, IonChip, IonLabel, IonGrid, IonRow, IonCol, IonRefresher, IonRefresherContent } from '@ionic/react';
import { useState, useEffect } from 'react';
import { book, heart, heartOutline, flame, play, arrowForward, calendar, time, chevronBack } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import './Tab3.css';
import { apiService, BACKEND_BASE_URL } from '../services/api';

interface Devotion {
  id?: string;
  title: string;
  scripture: string;
  content: string;
  reflection: string;
  prayer: string;
  date: string;
  day: number;
  week: number;
  thumbnailUrl?: string;
}

// Helper function to get devotion thumbnail with multiple fallbacks
const getDevotionThumbnail = (thumbnailUrl?: string): string => {
  // Check if thumbnailUrl is missing, empty, or is the old default
  if (!thumbnailUrl || !thumbnailUrl.trim() || thumbnailUrl === '/dove.png') {
    return '/hero-evangelism.jpg'; // Primary fallback for devotions
  }
  if (thumbnailUrl.startsWith('/uploads/')) {
    return `${BACKEND_BASE_URL}${thumbnailUrl}`;
  }
  // Handle Cloudinary URLs
  if (thumbnailUrl.includes('cloudinary.com')) {
    return thumbnailUrl;
  }
  return thumbnailUrl;
};



const Tab3: React.FC = () => {
  const history = useHistory();
  const [allDevotions, setAllDevotions] = useState<Devotion[]>([]);
  const [devotionsLoading, setDevotionsLoading] = useState<boolean>(false);
  const [savedDevotions, setSavedDevotions] = useState<any[]>([]);

  // Clear all caches on page load/refresh
  useEffect(() => {
    console.log('🔄 Tab3: Clearing caches on page load/refresh');
    apiService.clearCacheByType('devotions');
  }, []);

  const fetchDevotions = async (forceRefresh: boolean = false) => {
    if (devotionsLoading && !forceRefresh) return; // Prevent multiple calls if already loaded

    try {
      setDevotionsLoading(true);
      console.log('Loading devotions from API...');
      const data = await apiService.getDevotions({ published: true, limit: 100 }, forceRefresh);
      
      // Sort devotions by createdAt (oldest first) to assign chronological day numbers
      const chronologicalDevotions = [...(data.devotions || [])].sort((a: any, b: any) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      // Create a map of devotion IDs to their chronological day numbers
      const dayNumberMap = new Map();
      chronologicalDevotions.forEach((devotion: any, index: number) => {
        dayNumberMap.set(devotion._id || devotion.id, index + 1);
      });

      // Devotions are already sorted by createdAt (newest first) from API
      const displayDevotions = data.devotions || [];

      const formattedDevotions: Devotion[] = displayDevotions.map((devotion: any) => ({
        id: devotion._id || devotion.id,
        title: devotion.title,
        scripture: devotion.scripture,
        content: devotion.content,
        reflection: devotion.reflection,
        prayer: devotion.prayer,
        date: new Date(devotion.createdAt).toISOString().split('T')[0],
        day: dayNumberMap.get(devotion._id || devotion.id) || 1, // Use chronological day number
        week: 1, // Default week
        thumbnailUrl: devotion.thumbnailUrl
      }));
      setAllDevotions(formattedDevotions);
      console.log('Fetched devotions from DB:', formattedDevotions.length);
    } catch (error) {
      console.error('Error fetching devotions from DB:', error);
      setAllDevotions([]);
    } finally {
      setDevotionsLoading(false);
    }
  };

  useEffect(() => {
    fetchDevotions();
    // Load saved devotions from localStorage
    const saved = JSON.parse(localStorage.getItem('savedDevotions') || '[]');
    setSavedDevotions(saved);
    
    // Add focus listener to refresh when returning from FullDevotion
    const handleFocus = () => {
      const updated = JSON.parse(localStorage.getItem('savedDevotions') || '[]');
      setSavedDevotions(updated);
    };
    
    // Listen for saved items changed events from other pages
    const handleSavedItemsChange = () => {
      const updated = JSON.parse(localStorage.getItem('savedDevotions') || '[]');
      setSavedDevotions(updated);
    };
    
    // Listen for storage changes (cross-tab communication)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'savedDevotions') {
        const updated = JSON.parse(localStorage.getItem('savedDevotions') || '[]');
        setSavedDevotions(updated);
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

  // Check for refresh flags from admin operations
  useEffect(() => {
    const needsRefresh = sessionStorage.getItem('devotionsNeedRefresh');
    if (needsRefresh === 'true') {
      sessionStorage.removeItem('devotionsNeedRefresh');
      fetchDevotions(true); // Force refresh
    }
  }, []);

  const handleRefresh = async (event: CustomEvent) => {
    await fetchDevotions();
    event.detail.complete();
  };

  const isDevotionSaved = (devotionId: string) => {
    return savedDevotions.some(d => d.id === devotionId);
  };

  const toggleSaveDevotion = (devotion: Devotion, event: React.MouseEvent) => {
    event.stopPropagation();
    const devotionId = devotion.id || '';
    
    if (isDevotionSaved(devotionId)) {
      // Unsave
      const updated = savedDevotions.filter(d => d.id !== devotionId);
      setSavedDevotions(updated);
      localStorage.setItem('savedDevotions', JSON.stringify(updated));
      
      // Also save/unsave from server (toggle endpoint)
      apiService.saveDevotion(devotionId).catch(console.warn);
    } else {
      // Save
      const devotionToSave = {
        id: devotionId,
        title: devotion.title,
        scripture: devotion.scripture,
        content: devotion.content,
        reflection: devotion.reflection,
        prayer: devotion.prayer,
        date: devotion.date,
        thumbnailUrl: devotion.thumbnailUrl || '',
        savedAt: new Date().toISOString()
      };
      
      const updated = [...savedDevotions, devotionToSave];
      setSavedDevotions(updated);
      localStorage.setItem('savedDevotions', JSON.stringify(updated));
      
      // Also save to server
      apiService.saveDevotion(devotionId).catch(console.warn);
    }
    
    // Dispatch event to notify other pages
    window.dispatchEvent(new Event('savedItemsChanged'));
  };

  const todaysDevotion = allDevotions[0]; // Always show the latest devotion uploaded

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Devotions</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        {/* TODAY'S DEVOTION - Hero Card */}
        {todaysDevotion && (
          <section className="section-padding">
            <div className="section-head">
              <div className="section-title">
                <IonIcon icon={book} style={{ color: '#667eea' }} />
                <h2>Today's Devotion</h2>
              </div>
            </div>

            <div
              className="devotion-hero"
              onClick={() => history.push(`/full-devotion?id=${todaysDevotion.id}`)}
            >
              <img
                className="devotion-hero-bg"
                src={getDevotionThumbnail(todaysDevotion.thumbnailUrl)}
                alt={todaysDevotion.title}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/hero-evangelism.jpg';
                }}
              />
              <div className="devotion-hero-overlay" />

              <div className="devotion-hero-badge">
                <IonIcon icon={book} />
                <span>{todaysDevotion.scripture}</span>
              </div>

              <div className="devotion-hero-panel">
                <div className="devotion-hero-accent" />
                <div className="devotion-hero-meta">
                  <span className="devotion-hero-date">
                    <IonIcon icon={calendar} />
                    {formatDate(todaysDevotion.date)}
                  </span>
                  <div className="devotion-hero-sep" />
                  <span className="devotion-hero-daylabel">Day {todaysDevotion.day}</span>
                </div>
                <h3 className="devotion-hero-title">{todaysDevotion.title}</h3>
                <p className="devotion-hero-preview">{todaysDevotion.content}</p>
                <span className="devotion-hero-cta">
                  Begin Reading <IonIcon icon={arrowForward} />
                </span>
              </div>
            </div>
          </section>
        )}

        <div className="todays-text-area" style={{
          padding: '20px'
        }}>


          <div style={{ marginBottom: '32px' }}>
            <h2 style={{
              margin: '0 0 16px 0',
              fontSize: '1.4em',
              fontWeight: '600',
              color: 'var(--ion-text-color)',
            }}>
              All Devotions
            </h2>

            {allDevotions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {allDevotions.map(d => (
                  <div
                    key={d.id}
                    className="devotion-list-item"
                    onClick={() => history.push(`/full-devotion?id=${d.id}`)}
                  >
                    <div style={{ padding: '10px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                      {/* Thumbnail on the left */}
                       <div style={{
                         width: '90px',
                         height: '150px',
                         borderRadius: '12px 0 0 12px',
                         overflow: 'hidden',
                         flexShrink: 0,
                         boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                         position: 'relative'
                       }}>
                        <img
                          src={getDevotionThumbnail(d.thumbnailUrl)}
                          alt="Devotion thumbnail"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                          onError={(e) => {
                            const target = e.currentTarget;
                            // Try hero-evangelism.jpg first as devotion-specific fallback
                            if (!target.dataset['triedHero']) {
                              target.dataset['triedHero'] = 'true';
                              target.src = '/hero-evangelism.jpg';
                            } else {
                              // Use SVG placeholder as final fallback
                              target.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="90" height="140" viewBox="0 0 90 140"><rect fill="%23f5f5f5" width="90" height="140"/><text x="45" y="70" text-anchor="middle" dy=".3em" fill="%23999" font-size="10">Devotion</text></svg>');
                            }
                          }}
                        />
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
                          <IonButton
                            fill="clear"
                            size="small"
                            onClick={(e) => toggleSaveDevotion(d, e)}
                            style={{
                              margin: '0',
                              padding: '4px',
                              minWidth: '36px',
                              height: '36px',
                              '--color': isDevotionSaved(d.id || '') ? '#ef4444' : 'var(--ion-color-medium)',
                            }}
                          >
                            <IonIcon icon={isDevotionSaved(d.id || '') ? heart : heartOutline} style={{ fontSize: '1.2em' }} />
                          </IonButton>
                        </div>

                        {/* Content */}
                        <div className="devotion-content-text" style={{
                          margin: '0',
                          fontSize: '0.8em',
                          lineHeight: '1.4',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {d.content}
                        </div>

                        <div style={{ marginTop: '2px' }}></div>

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
            <p style={{
              color: 'var(--ion-text-color)',
              opacity: 0.6,
              fontSize: '0.8em',
              margin: '0'
            }}>
              Dove Ministries Africa
            </p>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Tab3;