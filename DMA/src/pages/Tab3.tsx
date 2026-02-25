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

        {/* TODAY'S DEVOTION - Modern Design */}
        {todaysDevotion && (
          <section className="section-padding">
            <div className="section-head">
              <div className="section-title">
                <IonIcon icon={heart} style={{ color: '#ff6b6b' }} />
                <h2>Today's Devotion</h2>
              </div>
            </div>

            {/* Modern Devotion Card */}
            <div 
              className="modern-devotion-card"
              onClick={() => {
                const devotionId = todaysDevotion.id;
                history.push(`/full-devotion?id=${devotionId}`);
              }}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '24px',
                overflow: 'hidden',
                cursor: 'pointer',
                position: 'relative',
                boxShadow: '0 10px 40px rgba(102, 126, 234, 0.3)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 15px 50px rgba(102, 126, 234, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 40px rgba(102, 126, 234, 0.3)';
              }}
            >
              {/* Background Image with Overlay */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundImage: `url('${getDevotionThumbnail(todaysDevotion.thumbnailUrl)}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  opacity: 0.3,
                  filter: 'blur(2px)',
                }}
              />
              
              {/* Content */}
              <div style={{
                position: 'relative',
                zIndex: 2,
                padding: '20px',
                color: 'white',
              }}>
                {/* Header with Scripture Reference */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                }}>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}>
                    <IonIcon icon={book} style={{ fontSize: '14px' }} />
                    <span>{todaysDevotion.scripture}</span>
                  </div>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '22px',
                    background: 'rgba(255, 255, 255, 0.25)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                  }}>
                    <IonIcon icon={book} style={{ fontSize: '20px' }} />
                  </div>
                </div>

                {/* Title and Scripture */}
                <h3 style={{
                  margin: '0 0 12px 0',
                  fontSize: '22px',
                  fontWeight: '800',
                  lineHeight: '1.3',
                  textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}>
                  {todaysDevotion.title}
                </h3>
                
                <p style={{
                  margin: '0 0 12px 0',
                  fontSize: '15px',
                  fontStyle: 'italic',
                  opacity: 0.95,
                  lineHeight: '1.5',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  "{todaysDevotion.content}"
                </p>

                {/* Read More Button */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                }}>
                </div>
              </div>

              {/* Decorative Elements */}
              <div style={{
                position: 'absolute',
                top: '-50px',
                right: '-50px',
                width: '150px',
                height: '150px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '50%',
              }} />
              <div style={{
                position: 'absolute',
                bottom: '-30px',
                left: '-30px',
                width: '100px',
                height: '100px',
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '50%',
              }} />
            </div>
          </section>
        )}

        <div style={{
          padding: '20px'
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
