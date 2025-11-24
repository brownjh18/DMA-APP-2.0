import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardContent, IonBadge, IonIcon, IonButton, IonButtons, IonBackButton, IonChip, IonLabel, IonGrid, IonRow, IonCol } from '@ionic/react';
import { useState, useEffect } from 'react';
import { book, heart, flame, play, arrowForward, calendar, time } from 'ionicons/icons';
import './Tab3.css';

interface Devotion {
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

const devotionCategories: DevotionCategory[] = [
  { id: 'faith-foundation', name: 'Faith Foundation', icon: 'heart', color: 'primary', totalDays: 7, currentDay: 1 },
  { id: 'love-relationships', name: 'Love & Relationships', icon: 'heart', color: 'danger', totalDays: 7, currentDay: 1 },
  { id: 'spiritual-growth', name: 'Spiritual Growth', icon: 'flame', color: 'warning', totalDays: 7, currentDay: 1 }
];

const Tab3: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [allDevotions, setAllDevotions] = useState<Devotion[]>([]);

  useEffect(() => {
    setAllDevotions(generateDailyDevotions());
  }, []);

  const filteredDevotions = selectedCategory === 'all'
    ? allDevotions
    : allDevotions.filter(d => d.category === selectedCategory);

  const todaysDevotion = allDevotions.find(d => d.date === new Date().toISOString().split('T')[0]);

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tab1" />
          </IonButtons>
          <IonTitle className="title-ios">Devotions</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
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
                    <IonButton fill="outline" size="default" className="cta-btn" aria-label="Read full devotion" routerLink={`/full-devotion?category=${todaysDevotion.category}&day=${todaysDevotion.day}`}>
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
                  365
                </div>
                <div style={{
                  fontSize: '0.9em',
                  color: 'var(--ion-color-medium)'
                }}>
                  Days
                </div>
              </div>
              <div>
                <div style={{
                  fontSize: '1.8em',
                  fontWeight: '700',
                  color: 'var(--ion-color-primary)',
                  marginBottom: '4px'
                }}>
                  3
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
                  21
                </div>
                <div style={{
                  fontSize: '0.9em',
                  color: 'var(--ion-color-medium)'
                }}>
                  Devotions
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
                    onClick={() => window.location.href = `/full-devotion?category=${d.category}&day=${d.day}`}
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
                        margin: '0 0 16px 0',
                        color: 'var(--ion-color-medium)',
                        fontSize: '0.9em',
                        lineHeight: '1.4'
                      }}>
                        {d.content.substring(0, 120)}...
                      </p>

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
