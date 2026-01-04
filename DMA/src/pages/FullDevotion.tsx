import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardContent, IonBadge, IonIcon, IonButton, IonGrid, IonRow, IonCol } from '@ionic/react';
import { useState, useEffect } from 'react';
import { book, heart, flame, play, arrowForward, calendar, time, arrowBack } from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import { apiService } from '../services/api';
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


const FullDevotion: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const [devotion, setDevotion] = useState<Devotion | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const id = urlParams.get('id');

    console.log('FullDevotion: URL params - id:', id);

    if (id) {
      // Fetch specific devotion by ID
      const fetchDevotion = async () => {
        try {
          const data = await apiService.getDevotion(id);
          const apiDevotion = data.devotion;

          const formattedDevotion = {
            id: apiDevotion._id || apiDevotion.id,
            title: apiDevotion.title,
            scripture: apiDevotion.scripture,
            content: apiDevotion.content,
            reflection: apiDevotion.reflection,
            prayer: apiDevotion.prayer,
            date: new Date(apiDevotion.date).toISOString().split('T')[0],
            category: apiDevotion.category,
            day: apiDevotion.day || 1,
            week: 1
          };
          setDevotion(formattedDevotion);
          console.log('Fetched devotion by ID:', formattedDevotion.title);
        } catch (error) {
          console.error('Failed to fetch devotion by ID:', error);
          setDevotion(null);
        }
      };

      fetchDevotion();
    } else {
      // No valid parameters
      console.log('No valid devotion ID provided');
      setDevotion(null);
    }
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
            
            <IonTitle className="title-ios">Full Devotion</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen className="content-ios">
          <div style={{ textAlign: 'center', padding: '50px 20px' }}>
            <IonIcon icon={book} style={{ fontSize: '48px', color: '#9ca3af', marginBottom: '16px' }} />
            <h3>Loading devotion...</h3>
            <p style={{ color: '#666', marginTop: '20px' }}>
              If this message persists, the requested devotion could not be found.
            </p>
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
              <p className="ios18-scripture-text">{devotion.content}</p>
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