import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardContent, IonBadge, IonIcon, IonButton, IonGrid, IonRow, IonCol } from '@ionic/react';
import { useState, useEffect, useContext } from 'react';
import { book, heart, flame, play, arrowForward, calendar, time, arrowBack } from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import { apiService } from '../services/api';
import { AuthContext } from '../App';
import './Tab3.css';

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


const FullDevotion: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const { isLoggedIn } = useContext(AuthContext);
  const [devotion, setDevotion] = useState<Devotion | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Check if devotion is already saved on mount and when devotion changes
  useEffect(() => {
    if (!devotion?.id) return;
    
    const checkSavedStatus = () => {
      try {
        const savedDevotions = JSON.parse(localStorage.getItem('savedDevotions') || '[]');
        const alreadySaved = savedDevotions.some((d: any) => d.id === devotion.id);
        setIsSaved(alreadySaved);
      } catch (error) {
        console.error('Error checking saved status:', error);
      }
    };
    
    checkSavedStatus();
    
    // Listen for storage changes (cross-tab communication)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'savedDevotions') {
        checkSavedStatus();
      }
    };
    
    // Listen for savedItemsChanged events from other pages
    const handleSavedItemsChange = () => {
      checkSavedStatus();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('savedItemsChanged', handleSavedItemsChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('savedItemsChanged', handleSavedItemsChange);
    };
  }, [devotion?.id]);

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
            date: new Date(apiDevotion.createdAt).toISOString().split('T')[0],
            day: apiDevotion.day || 1,
            week: 1,
            thumbnailUrl: apiDevotion.thumbnailUrl
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

      <IonContent fullscreen className="content-ios ios18-style" style={{ backgroundColor: 'var(--ion-background-color)' }}>
        {/* iOS 18 STYLE HEADER */}
        <div className="ios18-header" style={{
          backgroundImage: `url(${devotion.thumbnailUrl ? (devotion.thumbnailUrl.startsWith('/uploads/') ? `http://localhost:5000${devotion.thumbnailUrl}` : devotion.thumbnailUrl) : '/hero-evangelism.jpg'})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          position: 'relative',
          minHeight: '150px'
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
          <div className="ios18-header-content" style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 30px' }}>
            <div className="details" style={{ textAlign: 'center' }}>
              <h1 className="ios18-title" style={{ color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.5)', fontSize: '1.5em', margin: 0 }}>{devotion.title}</h1>
              <div className="ios18-meta" style={{ display: 'flex', justifyContent: 'center', gap: '25px', marginTop: '20px', fontSize: '0.9em' }}>
                <div className="ios18-meta-item" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <IonIcon icon={calendar} style={{ color: 'white', fontSize: '1em' }} />
                  <span style={{ color: 'white' }}>{formatDate(devotion.date)}</span>
                </div>
                <div className="ios18-meta-item" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <IonIcon icon={time} style={{ color: 'white', fontSize: '1em' }} />
                  <span style={{ color: 'white' }}>5 min read</span>
                </div>
              </div>
            </div>
            <div className="ios18-action-buttons" style={{ display: 'flex', gap: '20px', marginTop: '30px' }}>
              <button
                className="ios18-action-btn ios18-save-btn"
                style={{ 
                  borderRadius: '50%', 
                  width: '50px', 
                  height: '50px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  backgroundColor: isSaved ? 'rgba(255, 100, 100, 0.3)' : 'rgba(255,255,255,0.1)', 
                  border: '1px solid rgba(255,255,255,0.2)', 
                  backdropFilter: 'blur(10px)', 
                  WebkitBackdropFilter: 'blur(10px)', 
                  cursor: 'pointer' 
                }}
                onClick={async () => {
                  if (!devotion) return;
                  
                  if (!isLoggedIn) {
                    alert('Please sign in to save devotions to your list.');
                    history.push('/signin');
                    return;
                  }
                  
                  if (isSaving) return;
                  
                  setIsSaving(true);
                  
                  try {
                    // Save to server
                    const response = await apiService.saveDevotion(devotion.id!);
                    
                    // Update localStorage
                    const savedDevotions = JSON.parse(localStorage.getItem('savedDevotions') || '[]');
                    
                    if (response.saved) {
                      // Add to saved devotions
                      const savedDevotion = {
                        id: devotion.id,
                        title: devotion.title,
                        scripture: devotion.scripture,
                        content: devotion.content,
                        reflection: devotion.reflection,
                        prayer: devotion.prayer,
                        date: devotion.date,
                        day: devotion.day,
                        week: devotion.week,
                        thumbnailUrl: devotion.thumbnailUrl,
                        savedAt: new Date().toISOString()
                      };
                      // Check if not already in the list
                      if (!savedDevotions.some((d: any) => d.id === devotion.id)) {
                        savedDevotions.push(savedDevotion);
                      }
                      setIsSaved(true);
                      alert(`"${devotion.title}" has been saved to your list!`);
                    } else {
                      // Remove from saved devotions
                      const updated = savedDevotions.filter((d: any) => d.id !== devotion.id);
                      localStorage.setItem('savedDevotions', JSON.stringify(updated));
                      setIsSaved(false);
                      alert(`"${devotion.title}" has been removed from your saved list.`);
                    }
                    
                    localStorage.setItem('savedDevotions', JSON.stringify(savedDevotions));
                    
                    // Dispatch event to notify other pages
                    window.dispatchEvent(new Event('savedItemsChanged'));
                  } catch (error) {
                    console.error('Error saving devotion:', error);
                    alert('Failed to save devotion. Please try again.');
                  } finally {
                    setIsSaving(false);
                  }
                }}
              >
                <IonIcon icon={heart} style={{ color: isSaved ? '#ff6b6b' : 'white', fontSize: '1.3em' }} />
              </button>
              <button
                className="ios18-action-btn ios18-share-btn"
                style={{ borderRadius: '50%', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', cursor: 'pointer' }}
                onClick={async () => {
                  if (!devotion) return;

                  const shareData = {
                    title: devotion.title,
                    text: devotion.content.substring(0, 100) + '...',
                    url: `${window.location.origin}/full-devotion?id=${devotion.id}`
                  };

                  try {
                    if (navigator.share) {
                      await navigator.share(shareData);
                    } else {
                      // Fallback: copy to clipboard
                      const textToCopy = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
                      await navigator.clipboard.writeText(textToCopy);
                      alert('Devotion details copied to clipboard!');
                    }
                  } catch (error) {
                    console.error('Error sharing:', error);
                    alert('Failed to share devotion. Please try again.');
                  }
                }}
              >
                <IonIcon icon={arrowForward} style={{ color: 'white', fontSize: '1.3em' }} />
              </button>
            </div>
          </div>
        </div>

        {/* iOS 18 CONTENT CARDS */}
        <div className="ios18-content" style={{ backgroundColor: 'var(--ion-background-color)', padding: '20px' }}>

          {/* SCRIPTURE CARD */}
          <div style={{
            backgroundColor: 'transparent',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'var(--ion-color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <IonIcon icon={book} style={{ color: 'white', fontSize: '1.2em' }} />
              </div>
              <h2 style={{
                margin: 0,
                fontSize: '1em',
                fontWeight: '600',
                color: 'var(--ion-text-color)'
              }}>Scripture</h2>
            </div>
            <div>
              <p style={{
                fontSize: '0.9em',
                lineHeight: '1.6',
                color: 'var(--ion-text-color)',
                marginBottom: '16px'
              }}>{devotion.content}</p>
              <div style={{
                fontStyle: 'italic',
                color: 'var(--ion-color-primary)',
                fontWeight: '500',
                fontSize: '0.8em'
              }}>
                {devotion.scripture}
              </div>
            </div>
          </div>

          {/* REFLECTION CARD */}
          <div style={{
            backgroundColor: 'transparent',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'var(--ion-color-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <IonIcon icon={heart} style={{ color: 'white', fontSize: '1.2em' }} />
              </div>
              <h2 style={{
                margin: 0,
                fontSize: '1em',
                fontWeight: '600',
                color: 'var(--ion-text-color)'
              }}>Reflection</h2>
            </div>
            <div>
              <p style={{
                fontSize: '0.9em',
                lineHeight: '1.6',
                color: 'var(--ion-text-color)'
              }}>{devotion.reflection}</p>
            </div>
          </div>

          {/* PRAYER CARD */}
          <div style={{
            backgroundColor: 'transparent',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'var(--ion-color-tertiary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <IonIcon icon={play} style={{ color: 'white', fontSize: '1.2em' }} />
              </div>
              <h2 style={{
                margin: 0,
                fontSize: '1em',
                fontWeight: '600',
                color: 'var(--ion-text-color)'
              }}>Prayer</h2>
            </div>
            <div>
              <p style={{
                fontSize: '0.9em',
                lineHeight: '1.6',
                color: 'var(--ion-text-color)'
              }}>{devotion.prayer}</p>
            </div>
          </div>

        </div>

      </IonContent>
    </IonPage>
  );
};

export default FullDevotion;