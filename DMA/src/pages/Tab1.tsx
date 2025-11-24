import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
  IonRouterLink,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonButtons,
  IonMenuButton,
  IonButton,
  IonChip,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonSkeletonText,
  IonText,
} from '@ionic/react';
import {
  playCircle,
  book,
  calendar,
  time,
  heart,
  newspaper,
  informationCircle,
  location,
  people,
} from 'ionicons/icons';
import { useState, useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { fetchRecentSermons, YouTubeVideo } from '../services/youtubeService';
import './Tab1.css';

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

const DEFAULT_PROGRAMS = [
  { day: 'Mon', program: 'Enough is Enough Prayer Service', time: '5:00PM - 7:00PM', color: '#ff6b6b' },
  { day: 'Tue', program: 'New Believers Class', time: '4:00PM - 5:00PM', color: '#4ecdc4' },
  { day: 'Wed', program: 'Intercessions & Bible Study', time: '8:00AM - 8:00PM', color: '#45b7d1' },
  { day: 'Thu', program: 'Worship Team Fellowship', time: '7:00PM - 9:00PM', color: '#f9ca24' },
  { day: 'Fri', program: "Eagle's Friday Prayer Service", time: '6:00PM - 8:00PM', color: '#f0932b' },
  { day: 'Sat', program: 'Worship Team Fellowship', time: '6:00PM - 9:00PM', color: '#eb4d4b' },
  { day: 'Sun', program: 'Sunday Services', time: '7:30AM - 1:30PM', color: '#6c5ce7' },
];

const DEFAULT_EVENTS = [
  {
    title: 'Transformation Conference',
    date: 'Nov 17-23, 2025',
    time: '9:00 AM - 4:00 PM',
    location: 'Kyazanga',
    type: 'Conference',
    color: '#667eea',
  },
  {
    title: '20th Anniversary Celebration',
    date: 'Dec 1-4, 2025',
    time: '9:00 AM - 6:00 PM',
    location: 'Zana',
    type: 'Celebration',
    color: '#28a745',
  },
  {
    title: 'Sunday Special Service',
    date: 'Nov 2025',
    time: '4:00 PM - 7:00 PM',
    location: 'Zana',
    type: 'Service',
    color: '#dc3545',
  },
];

const Tab1: React.FC = () => {
  const [latestVideos, setLatestVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const infiniteScrollRef = useRef<HTMLIonInfiniteScrollElement | null>(null);
  const history = useHistory();
  const [allDevotions, setAllDevotions] = useState<Devotion[]>([]);

  useEffect(() => {
    setAllDevotions(generateDailyDevotions());
    void loadLatestContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadLatestContent = async () => {
    console.log('Loading latest sermons...');
    setLoading(true);
    try {
      const result = await fetchRecentSermons(10);
      console.log('Fetched sermons result:', result);
      setLatestVideos(result.videos || []);
      setNextPageToken(result.nextPageToken);
      console.log('Sermons loaded successfully:', result.videos?.length || 0, 'videos');
    } catch (error) {
      console.error('Error loading latest content:', error);
      setLatestVideos([]); // Ensure empty array on error
    } finally {
      setLoading(false);
    }
  };

  const loadMoreVideos = async (event?: CustomEvent<void>) => {
    // if no token or already loading, complete and return
    (event?.target as HTMLIonInfiniteScrollElement | undefined)?.complete?.();
    if (!nextPageToken || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const result = await fetchRecentSermons(10, nextPageToken);
      setLatestVideos((prev) => [...prev, ...(result.videos || [])]);
      setNextPageToken(result.nextPageToken);
    } catch (error) {
      console.error('Error loading more videos:', error);
    } finally {
      setIsLoadingMore(false);
      (event?.target as HTMLIonInfiniteScrollElement | undefined)?.complete?.();
    }
  };

  const handleVideoClick = (video: YouTubeVideo) => {
    history.push(`/tab2?videoId=${video.id}`);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatViews = (v?: number | string) => {
    if (!v) return '—';
    const n = typeof v === 'string' ? Number(v) : v;
    if (Number.isNaN(n)) return '—';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return `${n}`;
  };

  const todaysDevotion = allDevotions.find(d => d.date === new Date().toISOString().split('T')[0]);

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <IonTitle className="title-ios">Home</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
        {/* FOR YOU - DEVOTION */}
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

                  <IonRouterLink routerLink={`/full-devotion?category=${todaysDevotion.category}&day=${todaysDevotion.day}`} className="devotion-cta">
                    <IonButton fill="outline" size="default" className="cta-btn" aria-label="Read full devotion">
                      Read Full Devotion
                      <IonIcon icon={book} slot="end" />
                    </IonButton>
                  </IonRouterLink>
                </div>
              </div>
            </article>
          </section>
        )}

        {/* LATEST SERMONS */}
        <section className="section-padding sermons-section">
          <div className="section-head">
            <div className="section-title">
              <IonIcon icon={playCircle} />
              <h2>Latest Sermons</h2>
            </div>
            <IonRouterLink routerLink="/tab2" className="view-all-link" aria-label="View all sermons">
              View All
            </IonRouterLink>
          </div>

          <div className="sermons-row" role="list">
            {loading ? (
              // show 3 skeleton cards while initial load
              [0, 1, 2].map((n) => (
                <div key={n} className="sermon-card skeleton" role="listitem" aria-hidden>
                  <IonSkeletonText animated style={{ width: '100%', height: '140px', borderRadius: 12 }} />
                  <div className="sermon-info">
                    <IonSkeletonText animated style={{ width: '70%', height: 14 }} />
                    <IonSkeletonText animated style={{ width: '40%', height: 12, marginTop: 8 }} />
                  </div>
                </div>
              ))
            ) : (
              <>
                <div className="sermon-scroll" aria-label="Latest sermons">
                  {latestVideos.map((video) => (
                    <button
                      key={video.id}
                      className="sermon-card"
                      onClick={() => handleVideoClick(video)}
                      aria-label={`Open sermon ${video.title}`}
                    >
                      <div className="sermon-thumb-wrap">
                        <img src={video.thumbnailUrl} alt={video.title} className="sermon-thumb" />
                        <div className="sermon-duration">{video.duration}</div>
                        <div className="sermon-play-overlay">
                          <IonIcon icon={playCircle} />
                        </div>
                      </div>

                      <div className="sermon-info">
                        <h4 className="sermon-title">{video.title.length > 60 ? video.title.substring(0, 60) + '…' : video.title}</h4>
                        <div className="sermon-meta">
                          <span>{formatDate(video.publishedAt)}</span>
                          <span aria-hidden>•</span>
                          <span>{formatViews(video.viewCount)}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <IonInfiniteScroll
                  ref={infiniteScrollRef}
                  onIonInfinite={(e) => void loadMoreVideos(e)}
                  threshold="100px"
                  disabled={!nextPageToken || isLoadingMore}
                >
                  <IonInfiniteScrollContent loadingText={isLoadingMore ? 'Loading more sermons...' : 'No more sermons'} />
                </IonInfiniteScroll>
              </>
            )}
          </div>
        </section>

        {/* WEEKLY PROGRAMS */}
        <section className="section-padding programs-section">
          <div className="section-head">
            <div className="section-title">
              <IonIcon icon={time} />
              <h2>Weekly Programs</h2>
            </div>
          </div>

          <div className="programs-row" role="list">
            {DEFAULT_PROGRAMS.map((p, idx) => (
              <div key={idx} className="program-card" role="listitem">
                <div className="program-badge" style={{ background: p.color }}>
                  <strong>{p.day}</strong>
                </div>
                <div className="program-body">
                  <div className="program-name">{p.program}</div>
                  <div className="program-time">{p.time}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* UPDATES */}
        <section className="section-padding">
          <div className="section-head">
            <div className="section-title">
              <IonIcon icon={newspaper} />
              <h2>Updates</h2>
            </div>
          </div>

          <div className="devotions-row" role="list">
            <article className="devotion-card-small" role="article" onClick={() => history.push('/events')}>
              <div className="devotion-media-small" style={{ backgroundImage: 'url(/public/event.jpg)' }} aria-hidden />
              <div className="devotion-content-small">
                <div className="devotion-top">
                  <div className="devotion-label">
                    <IonIcon icon={calendar} />
                    <span>Event</span>
                  </div>
                </div>
                <div className="devotion-verse">
                  <h3>Transformation Conference 2025</h3>
                  <p className="verse-text">Nov 17-23 • Kyazanga</p>
                </div>
              </div>
            </article>

            <article className="devotion-card-small" role="article">
              <div className="devotion-media-small" style={{ backgroundImage: 'url(/public/youth.jpg)' }} aria-hidden />
              <div className="devotion-content-small">
                <div className="devotion-top">
                  <div className="devotion-label">
                    <IonIcon icon={people} />
                    <span>Ministry</span>
                  </div>
                </div>
                <div className="devotion-verse">
                  <h3>New Youth Ministry Program</h3>
                  <p className="verse-text">Launching Soon</p>
                </div>
              </div>
            </article>

            <article className="devotion-card-small" role="article">
              <div className="devotion-media-small" style={{ backgroundImage: 'url(/public/prayer.jpg)' }} aria-hidden />
              <div className="devotion-content-small">
                <div className="devotion-top">
                  <div className="devotion-label">
                    <IonIcon icon={heart} />
                    <span>Feature</span>
                  </div>
                </div>
                <div className="devotion-verse">
                  <h3>Prayer Request Feature</h3>
                  <p className="verse-text">Available Now</p>
                </div>
              </div>
            </article>
          </div>
        </section>

        {/* UPCOMING EVENTS */}
        <section className="section-padding">
          <div className="section-head">
            <div className="section-title">
              <IonIcon icon={calendar} />
              <h2>Upcoming Events</h2>
            </div>

            <IonRouterLink routerLink="/events" className="view-all-link">
              View All
            </IonRouterLink>
          </div>

          <div className="devotions-row" role="list">
            {DEFAULT_EVENTS.map((ev, i) => {
              const imageMap: { [key: string]: string } = {
                'Conference': 'event.jpg',
                'Celebration': '20th.jpg',
                'Service': 'Sunday Stream.jpg'
              };
              const imageName = imageMap[ev.type] || 'event.jpg';

              return (
                <article key={i} className="devotion-card-small" role="article" onClick={() => history.push('/events')}>
                  <div className="devotion-media-small" style={{ backgroundImage: `url(/public/${imageName})` }} aria-hidden />
                  <div className="devotion-content-small">
                    <div className="devotion-top">
                      <div className="devotion-label">
                        <IonIcon icon={calendar} />
                        <span>{ev.type}</span>
                      </div>
                    </div>
                    <div className="devotion-verse">
                      <h3>{ev.title}</h3>
                      <p className="verse-text">{ev.date} • {ev.location}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* ABOUT DMA */}
        <div style={{
          padding: '20px',
          maxWidth: '400px',
          margin: '20px auto'
        }}>
          <div style={{
            backgroundColor: 'var(--ion-background-color)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            border: '1px solid var(--ion-color-step-200)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <IonIcon
                icon={informationCircle}
                style={{
                  fontSize: '2.5em',
                  color: 'var(--ion-color-primary)',
                  marginBottom: '12px'
                }}
              />
              <h2 style={{
                margin: '0 0 8px 0',
                fontSize: '1.5em',
                fontWeight: '700',
                color: 'var(--ion-text-color)'
              }}>
                About DMA
              </h2>
            </div>

            <p style={{
              margin: '0 0 20px 0',
              color: 'var(--ion-color-medium)',
              lineHeight: '1.6',
              fontSize: '0.95em',
              textAlign: 'center'
            }}>
              Transforming lives through faith, community, and service across Africa since 2005.
            </p>

            <div style={{
              display: 'flex',
              justifyContent: 'space-around',
              marginBottom: '24px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '1.5em',
                  fontWeight: '700',
                  color: 'var(--ion-color-primary)',
                  marginBottom: '4px'
                }}>
                  50+
                </div>
                <div style={{
                  fontSize: '0.8em',
                  color: 'var(--ion-color-medium)'
                }}>
                  Churches
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '1.5em',
                  fontWeight: '700',
                  color: 'var(--ion-color-primary)',
                  marginBottom: '4px'
                }}>
                  10K+
                </div>
                <div style={{
                  fontSize: '0.8em',
                  color: 'var(--ion-color-medium)'
                }}>
                  Members
                </div>
              </div>
            </div>

            <IonRouterLink routerLink="/tab5">
              <IonButton style={{
                width: '100%',
                height: '44px',
                borderRadius: '8px',
                fontWeight: '600',
                backgroundColor: 'var(--ion-color-primary)',
                '--border-radius': '8px'
              }}>
                <IonIcon icon={informationCircle} slot="start" />
                Learn More
              </IonButton>
            </IonRouterLink>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Tab1;
