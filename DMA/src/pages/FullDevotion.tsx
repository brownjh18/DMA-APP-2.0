import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardContent, IonBadge, IonIcon, IonButton, IonButtons, IonBackButton, IonGrid, IonRow, IonCol } from '@ionic/react';
import { useState, useEffect } from 'react';
import { book, heart, flame, play, arrowForward, calendar, time } from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
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
          reflection: 'Faith is the cornerstone of our relationship with God. It is the confident assurance that what we hope for will come to pass, and the conviction of things not yet seen. This faith is not blind; it is rooted in the character and promises of God. When we face uncertainties in life, our faith reminds us that God is in control and His plans are perfect.',
          prayer: 'Lord, increase my faith and help me trust You completely. Strengthen my confidence in Your promises and help me see Your hand at work in my life. Amen.'
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
          reflection: 'God\'s love is unconditional and everlasting. It reaches out to every person regardless of their background or circumstances. His love is not based on our performance or worthiness, but on His character and choice. This love is so profound that Christ died for us while we were still sinners, showing that His love is proactive and sacrificial.',
          prayer: 'Thank You Lord for loving me unconditionally. Help me to understand the depth of Your love and to extend that same love to others. Amen.'
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
          reflection: 'Spiritual growth happens as we become more like Christ. It involves speaking truth with love, building up the body of Christ, and maturing in our faith. This growth is intentional and requires commitment, but it leads to greater freedom and effectiveness in our Christian walk.',
          prayer: 'Help me to grow spiritually and become more like Jesus. Give me wisdom to speak truth in love and to contribute to the growth of Your church. Amen.'
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

const FullDevotion: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const [devotion, setDevotion] = useState<Devotion | null>(null);

  useEffect(() => {
    const allDevotions = generateDailyDevotions();
    const urlParams = new URLSearchParams(location.search);
    const category = urlParams.get('category');
    const day = urlParams.get('day');

    let selectedDevotion;

    if (category && day) {
      // Find devotion by category and day
      selectedDevotion = allDevotions.find(d => d.category === category && d.day === parseInt(day));
    }

    // Fallback to today's devotion if no specific devotion found
    if (!selectedDevotion) {
      selectedDevotion = allDevotions.find(d => d.date === new Date().toISOString().split('T')[0]);
    }

    setDevotion(selectedDevotion || allDevotions[0]);
  }, [location.search]);

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const getCategoryInfo = (category: string) => {
    const categories: { [key: string]: { name: string; color: string; icon: string } } = {
      'faith-foundation': { name: 'Faith Foundation', color: '#667eea', icon: 'heart' },
      'love-relationships': { name: 'Love & Relationships', color: '#ef4444', icon: 'heart' },
      'spiritual-growth': { name: 'Spiritual Growth', color: '#f59e0b', icon: 'flame' }
    };
    return categories[category] || categories['faith-foundation'];
  };

  if (!devotion) {
    return (
      <IonPage>
        <IonHeader translucent>
          <IonToolbar className="toolbar-ios">
            <IonButtons slot="start">
              <IonBackButton defaultHref="/tab3" />
            </IonButtons>
            <IonTitle className="title-ios">Devotion</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen className="content-ios">
          <div style={{ textAlign: 'center', padding: '50px 20px' }}>
            <IonIcon icon={book} style={{ fontSize: '48px', color: '#9ca3af', marginBottom: '16px' }} />
            <h3>Loading devotion...</h3>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  const categoryInfo = getCategoryInfo(devotion.category);

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tab3" />
          </IonButtons>
          <IonTitle className="title-ios">Full Devotion</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios ios18-style">
        {/* iOS 18 STYLE HEADER */}
        <div className="ios18-header">
          <div className="ios18-header-content">
            <div className="ios18-category-chip">
              <IonIcon icon={categoryInfo.icon === 'flame' ? flame : heart} />
              <span>{categoryInfo.name}</span>
            </div>
            <h1 className="ios18-title">{devotion.title}</h1>
            <div className="ios18-meta">
              <div className="ios18-meta-item">
                <IonIcon icon={calendar} />
                <span>{formatDate(devotion.date)}</span>
              </div>
              <div className="ios18-meta-item">
                <IonIcon icon={time} />
                <span>5 min read</span>
              </div>
            </div>
          </div>
        </div>

        {/* iOS 18 CONTENT CARDS */}
        <div className="ios18-content">

          {/* SCRIPTURE CARD */}
          <div className="ios18-card scripture-card">
            <div className="ios18-card-header">
              <div className="ios18-icon-circle scripture-icon">
                <IonIcon icon={book} />
              </div>
              <h2 className="ios18-card-title">Scripture</h2>
            </div>
            <div className="ios18-card-content">
              <p className="ios18-scripture-text">"{devotion.content}"</p>
              <div className="ios18-scripture-ref">
                <span>{devotion.scripture}</span>
              </div>
            </div>
          </div>

          {/* REFLECTION CARD */}
          <div className="ios18-card reflection-card">
            <div className="ios18-card-header">
              <div className="ios18-icon-circle reflection-icon">
                <IonIcon icon={heart} />
              </div>
              <h2 className="ios18-card-title">Reflection</h2>
            </div>
            <div className="ios18-card-content">
              <p className="ios18-reflection-text">{devotion.reflection}</p>
            </div>
          </div>

          {/* PRAYER CARD */}
          <div className="ios18-card prayer-card">
            <div className="ios18-card-header">
              <div className="ios18-icon-circle prayer-icon">
                <IonIcon icon={play} />
              </div>
              <h2 className="ios18-card-title">Prayer</h2>
            </div>
            <div className="ios18-card-content">
              <p className="ios18-prayer-text">{devotion.prayer}</p>
            </div>
          </div>

          <div className="ios18-action-buttons">
            <button className="ios18-action-btn ios18-save-btn">
              <IonIcon icon={heart} />
              <span>Save</span>
            </button>
            <button className="ios18-action-btn ios18-share-btn">
              <IonIcon icon={arrowForward} />
              <span>Share</span>
            </button>
          </div>

        </div>

      </IonContent>
    </IonPage>
  );
};

export default FullDevotion;