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



const Tab3: React.FC = () => {
  const history = useHistory();
  const [allDevotions, setAllDevotions] = useState<Devotion[]>([]);
  const [devotionsLoading, setDevotionsLoading] = useState<boolean>(false);
  const [savedDevotions, setSavedDevotions] = useState<any[]>([]);

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

        {/* TODAY'S DEVOTION - LIKE HOME PAGE */}
        {todaysDevotion && (
          <section className="section-padding">
            <div className="section-head">
              <div className="section-title">
                <IonIcon icon={heart} />
                <h2>Today's Devotion</h2>
              </div>
            </div>

            <article className="devotion-card" role="article" aria-labelledby="devotion-title">
              <div
                className="devotion-media"
                aria-hidden
                style={{
                  backgroundImage: `url(${todaysDevotion.thumbnailUrl && todaysDevotion.thumbnailUrl.trim() ? (todaysDevotion.thumbnailUrl.startsWith('/uploads/') ? `http://localhost:5000${todaysDevotion.thumbnailUrl}` : todaysDevotion.thumbnailUrl) : '/hero-evangelism.jpg'})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
              >
                {/* subtle background image + blur handled by CSS */}
              </div>

              <div className="devotion-content">
                <div className="devotion-top">
                  <div className="devotion-label">
                    <IonIcon icon={book} />
                    <span>Daily Devotion</span>
                  </div>

                  <div className="devotion-date" aria-hidden>
                    <IonIcon icon={time} />
                    <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>

                <div id="devotion-title" className="devotion-verse">
                  <h3>{todaysDevotion.title}</h3>
                  <p className="verse-text">"{todaysDevotion.content}"</p>
                  <p className="verse-text" style={{ fontSize: '0.9em', opacity: 0.8, marginTop: '8px' }}>
                    {todaysDevotion.scripture}
                  </p>
                </div>

                <div className="devotion-bottom">
                  <p className="devotion-summary">
                    {todaysDevotion.reflection}
                  </p>

                  <div className="devotion-cta">
                    <IonButton
                      fill="outline"
                      size="default"
                      className="cta-btn"
                      aria-label="Read full devotion"
                      onClick={() => {
                        const devotionId = todaysDevotion.id;
                        console.log('Button clicked, navigating to:', `/full-devotion?id=${devotionId}`);
                        history.push(`/full-devotion?id=${devotionId}`);
                      }}
                    >
                      Read Full Devotion
                      <IonIcon icon={book} slot="end" />
                    </IonButton>
                  </div>
                </div>
              </div>
            </article>
          </section>
        )}

        <div style={{
          padding: '20px',
          maxWidth: '500px',
          margin: '0 auto',
          paddingTop: '20px'
        }}>


          {/* Devotions List */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{
              margin: '0 0 16px 0',
              fontSize: '1.4em',
              fontWeight: '600',
              color: 'var(--ion-text-color)'
            }}>
              All Devotions
            </h2>

            {allDevotions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {allDevotions.map(d => (
                  <div
                    key={d.id}
                    style={{
                      backgroundColor: 'transparent',
                      borderRadius: '16px',
                      border: '1px solid var(--ion-card-border-color, rgba(0,0,0,0.1))',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out'
                    }}
                    onClick={() => history.push(`/full-devotion?id=${d.id}`)}
                  >
                    <div style={{ padding: '10px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                      {/* Thumbnail on the left */}
                      <div style={{
                        width: '90px',
                        height: '140px',
                        borderRadius: '12px 0 0 12px',
                        overflow: 'hidden',
                        flexShrink: 0,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
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
                      </div>

                      {/* Details on the right */}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', minHeight: '70px' }}>
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
