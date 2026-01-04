import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardContent, IonBadge, IonIcon, IonButton, IonChip, IonLabel, IonGrid, IonRow, IonCol, IonRefresher, IonRefresherContent } from '@ionic/react';
import { useState, useEffect } from 'react';
import { book, heart, flame, play, arrowForward, calendar, time, chevronBack } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import './Tab3.css';

interface Devotion {
  id?: string;
  title: string;
  scripture: string;
  content: string;
  reflection: string;
  prayer: string;
  date: string;
  category: string;
  day: number;
  week: number;
}

interface DevotionCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  totalDays: number;
  currentDay: number;
}

const generateDailyDevotions = (): Devotion[] => {
  const today = new Date();
  const devotions: Devotion[] = [];

  const series = [
    {
      id: 'faith-foundation',
      devotions: [
        {
          title: 'The Foundation of Faith',
          scripture: 'Hebrews 11:1',
          content: 'Now faith is confidence in what we hope for and assurance about what we do not see.',
          reflection: 'Faith is the cornerstone of our relationship with God.',
          prayer: 'Lord, increase my faith and help me trust You completely.'
        }
      ]
    },
    {
      id: 'love-relationships',
      devotions: [
        {
          title: 'God\'s Love for Us',
          scripture: 'Romans 5:8',
          content: 'But God demonstrates his own love for us in this: While we were still sinners, Christ died for us.',
          reflection: 'God loved us unconditionally even when we were sinners.',
          prayer: 'Thank You Lord for loving me unconditionally.'
        }
      ]
    },
    {
      id: 'spiritual-growth',
      devotions: [
        {
          title: 'Growing in Spiritual Maturity',
          scripture: 'Ephesians 4:15',
          content: 'Speaking the truth in love, we will grow to become mature in Christ.',
          reflection: 'Spiritual growth happens as we become more like Christ.',
          prayer: 'Help me to grow spiritually and become more like Jesus.'
        }
      ]
    }
  ];

  let dayCounter = 1;
  series.forEach((s, seriesIndex) => {
    s.devotions.forEach((d, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - dayCounter + 1);
      devotions.push({
        ...d,
        category: s.id,
        day: i + 1,
        week: seriesIndex + 1,
        date: date.toISOString().split('T')[0]
      });
      dayCounter++;
    });
  });

  return devotions;
};

const getDevotionCategories = (devotions: Devotion[]): DevotionCategory[] => {
  const categories = ['faith-foundation', 'love-relationships', 'spiritual-growth'];
  return categories.map(id => {
    const categoryDevotions = devotions.filter(d => d.category === id);
    const maxDay = Math.max(...categoryDevotions.map(d => d.day), 0);
    return {
      id,
      name: id === 'faith-foundation' ? 'Faith Foundation' :
            id === 'love-relationships' ? 'Love & Relationships' : 'Spiritual Growth',
      icon: id === 'spiritual-growth' ? 'flame' : 'heart',
      color: id === 'faith-foundation' ? 'primary' :
             id === 'love-relationships' ? 'danger' : 'warning',
      totalDays: maxDay,
      currentDay: 1 // Can be improved to track user progress
    };
  });
};

const Tab3: React.FC = () => {
  const history = useHistory();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [allDevotions, setAllDevotions] = useState<Devotion[]>([]);
  const [devotionCategories, setDevotionCategories] = useState<DevotionCategory[]>([]);
  const [devotionsLoading, setDevotionsLoading] = useState<boolean>(false);

  const fetchDevotions = async () => {
    if (devotionsLoading || allDevotions.length > 0) return; // Prevent multiple calls if already loaded

    try {
      setDevotionsLoading(true);
      console.log('Loading devotions from API...');
      const response = await fetch('/api/devotions?published=true&limit=100');
      if (response.ok) {
        const data = await response.json();
        // Sort devotions by date (oldest first) to assign chronological day numbers
        const chronologicalDevotions = [...data.devotions].sort((a: any, b: any) =>
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        // Create a map of devotion IDs to their chronological day numbers
        const dayNumberMap = new Map();
        chronologicalDevotions.forEach((devotion: any, index: number) => {
          dayNumberMap.set(devotion._id || devotion.id, index + 1);
        });

        // Sort devotions by date (newest first) for display
        const displayDevotions = [...data.devotions].sort((a: any, b: any) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        const formattedDevotions: Devotion[] = displayDevotions.map((devotion: any) => ({
          id: devotion._id || devotion.id,
          title: devotion.title,
          scripture: devotion.scripture,
          content: devotion.content,
          reflection: devotion.reflection,
          prayer: devotion.prayer,
          date: new Date(devotion.date).toISOString().split('T')[0],
          category: devotion.category,
          day: dayNumberMap.get(devotion._id || devotion.id) || 1, // Use chronological day number
          week: 1 // Default week
        }));
        setAllDevotions(formattedDevotions);
        setDevotionCategories(getDevotionCategories(formattedDevotions));
        console.log('Fetched devotions from DB:', formattedDevotions.length);
      } else {
        console.error('Failed to fetch devotions from DB, status:', response.status);
        setAllDevotions([]);
        setDevotionCategories([]);
      }
    } catch (error) {
      console.error('Error fetching devotions from DB:', error);
      setAllDevotions([]);
      setDevotionCategories([]);
    } finally {
      setDevotionsLoading(false);
    }
  };

  useEffect(() => {
    fetchDevotions();
  }, []);

  // Check for refresh flags from admin operations
  useEffect(() => {
    const needsRefresh = sessionStorage.getItem('devotionsNeedRefresh');
    if (needsRefresh === 'true') {
      sessionStorage.removeItem('devotionsNeedRefresh');
      fetchDevotions();
    }
  }, []);

  const handleRefresh = async (event: CustomEvent) => {
    await fetchDevotions();
    event.detail.complete();
  };

  const filteredDevotions = selectedCategory === 'all'
    ? allDevotions
    : allDevotions.filter(d => d.category === selectedCategory);

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
              <div className="devotion-media" aria-hidden>
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
                        const devotionId = todaysDevotion.id || `${todaysDevotion.category}-${todaysDevotion.day}`;
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
          maxWidth: '400px',
          margin: '0 auto',
          paddingTop: '20px'
        }}>
          {/* Quick Stats */}
          <div style={{
            backgroundColor: 'rgba(0,0,0,0.05)',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '24px'
          }}>
            <h2 style={{
              margin: '0 0 16px 0',
              fontSize: '1.4em',
              fontWeight: '600',
              color: 'var(--ion-text-color)'
            }}>
              Devotion Overview
            </h2>
            <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
              <div>
                <div style={{
                  fontSize: '1.8em',
                  fontWeight: '700',
                  color: 'var(--ion-color-primary)',
                  marginBottom: '4px'
                }}>
                  {allDevotions.length}
                </div>
                <div style={{
                  fontSize: '0.9em',
                  color: 'var(--ion-color-medium)'
                }}>
                  Devotions
                </div>
              </div>
              <div>
                <div style={{
                  fontSize: '1.8em',
                  fontWeight: '700',
                  color: 'var(--ion-color-primary)',
                  marginBottom: '4px'
                }}>
                  {new Set(allDevotions.map(d => d.category)).size}
                </div>
                <div style={{
                  fontSize: '0.9em',
                  color: 'var(--ion-color-medium)'
                }}>
                  Series
                </div>
              </div>
              <div>
                <div style={{
                  fontSize: '1.8em',
                  fontWeight: '700',
                  color: 'var(--ion-color-primary)',
                  marginBottom: '4px'
                }}>
                  {Math.max(...allDevotions.map(d => d.day), 0)}
                </div>
                <div style={{
                  fontSize: '0.9em',
                  color: 'var(--ion-color-medium)'
                }}>
                  Max Day
                </div>
              </div>
            </div>
          </div>

          {/* Category Selector */}
          <div style={{
            backgroundColor: 'rgba(0,0,0,0.05)',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '24px'
          }}>
            <h2 style={{
              margin: '0 0 8px 0',
              fontSize: '1.4em',
              fontWeight: '600',
              color: 'var(--ion-text-color)'
            }}>
              Explore Devotions
            </h2>
            <p style={{
              margin: '0 0 16px 0',
              color: 'var(--ion-text-color)',
              opacity: 0.7,
              fontSize: '0.95em'
            }}>
              Choose a series to deepen your spiritual journey
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div
                onClick={() => setSelectedCategory('all')}
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: selectedCategory === 'all' ? '2px solid var(--ion-color-primary)' : '1px solid var(--ion-color-step-300)',
                  backgroundColor: selectedCategory === 'all' ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <IonIcon icon={book} style={{ color: selectedCategory === 'all' ? 'var(--ion-color-primary)' : 'var(--ion-color-medium)' }} />
                <span style={{
                  fontWeight: '500',
                  color: selectedCategory === 'all' ? 'var(--ion-color-primary)' : 'var(--ion-text-color)'
                }}>
                  All Devotions
                </span>
              </div>
              {devotionCategories.map(c => (
                <div
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: selectedCategory === c.id ? '2px solid var(--ion-color-primary)' : '1px solid var(--ion-color-step-300)',
                    backgroundColor: selectedCategory === c.id ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <IonIcon icon={c.icon === 'flame' ? flame : heart} style={{ color: selectedCategory === c.id ? 'var(--ion-color-primary)' : 'var(--ion-color-medium)' }} />
                    <span style={{
                      fontWeight: '500',
                      color: selectedCategory === c.id ? 'var(--ion-color-primary)' : 'var(--ion-text-color)'
                    }}>
                      {c.name}
                    </span>
                  </div>
                  <IonBadge color="primary" style={{
                    fontSize: '0.8em',
                    padding: '2px 6px'
                  }}>
                    {c.currentDay}/{c.totalDays}
                  </IonBadge>
                </div>
              ))}
            </div>
          </div>

          {/* Devotions List */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{
              margin: '0 0 16px 0',
              fontSize: '1.4em',
              fontWeight: '600',
              color: 'var(--ion-text-color)'
            }}>
              {selectedCategory === 'all' ? 'All Devotions' : devotionCategories.find(c => c.id === selectedCategory)?.name}
            </h2>
            <p style={{
              margin: '0 0 20px 0',
              color: 'var(--ion-color-medium)',
              fontSize: '0.9em'
            }}>
              {filteredDevotions.length} devotion{filteredDevotions.length !== 1 ? 's' : ''} available
            </p>

            {filteredDevotions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {filteredDevotions.map(d => (
                  <div
                    key={`${d.category}-${d.day}`}
                    style={{
                      backgroundColor: 'rgba(0,0,0,0.05)',
                      borderRadius: '12px',
                      border: '1px solid rgba(0,0,0,0.1)',
                      overflow: 'hidden',
                      cursor: 'pointer'
                    }}
                    onClick={() => history.push(`/full-devotion?id=${d.id || `${d.category}-${d.day}`}`)}
                  >
                    <div style={{ padding: '16px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '12px'
                      }}>
                        <div style={{
                          backgroundColor: d.category === 'faith-foundation' ? '#667eea' :
                                         d.category === 'love-relationships' ? '#ef4444' : '#f59e0b',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '0.8em',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <IonIcon icon={book} style={{ fontSize: '0.9em' }} />
                          <span>Day {d.day}</span>
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: 'var(--ion-color-medium)',
                          fontSize: '0.9em'
                        }}>
                          <IonIcon icon={time} />
                          <span>{formatDate(d.date)}</span>
                        </div>
                      </div>

                      <h3 style={{
                        margin: '0 0 8px 0',
                        fontSize: '1.1em',
                        fontWeight: '600',
                        color: 'var(--ion-text-color)'
                      }}>
                        {d.title}
                      </h3>
                      <p style={{
                        margin: '0 0 8px 0',
                        fontSize: '0.9em',
                        color: 'var(--ion-color-primary)',
                        fontWeight: '500'
                      }}>
                        {d.scripture}
                      </p>
                      <p style={{
                        margin: '0 0 8px 0',
                        color: 'var(--ion-color-medium)',
                        fontSize: '0.9em',
                        lineHeight: '1.4'
                      }}>
                        {d.content.substring(0, 120)}...
                      </p>

                      {d.reflection && (
                        <p style={{
                          margin: '0 0 16px 0',
                          color: 'var(--ion-color-primary)',
                          fontSize: '0.9em',
                          fontStyle: 'italic',
                          lineHeight: '1.4'
                        }}>
                          "{d.reflection}"
                        </p>
                      )}

                      <div style={{
                        borderTop: '1px solid rgba(0,0,0,0.1)',
                        paddingTop: '12px',
                        display: 'flex',
                        justifyContent: 'flex-end'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: 'var(--ion-color-primary)',
                          fontSize: '0.9em',
                          fontWeight: '500'
                        }}>
                          <span>Read Now</span>
                          <IonIcon icon={arrowForward} />
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
