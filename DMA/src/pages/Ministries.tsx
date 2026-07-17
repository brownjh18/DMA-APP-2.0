import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardContent, IonIcon, IonRouterLink, IonButton, IonSpinner, IonRefresher, IonRefresherContent } from '@ionic/react';
import { heart, people, book, radio, chatbubble, musicalNotes, informationCircle, arrowBack } from 'ionicons/icons';
import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { BACKEND_BASE_URL, apiService } from '../services/api';
import { useSettings } from '../contexts/SettingsContext';
import './Ministries.css';

// Helper function to convert relative URLs to full backend URLs
const getFullUrl = (url: string) => {
  if (url && url.startsWith('/uploads/')) {
    return `${BACKEND_BASE_URL}${url}`;
  }
  return url;
};

const Ministries: React.FC = () => {
  const [ministries, setMinistries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const history = useHistory();
  const { isDarkMode } = useSettings();

  useEffect(() => {
    console.log('Ministries component mounted, fetching data from API');
    fetchMinistries();
  }, []);

  const fetchMinistries = async () => {
    try {
      console.log('Fetching ministries from API...');
      // Use apiService like Tab1 does for consistency
      const data = await apiService.getMinistries({ active: 'all', limit: 100 });
      console.log('Fetched ministries data:', data);
      
      // Only use API data if there are actual ministries in the database
      if (data.ministries && data.ministries.length > 0) {
        // Transform API data to match frontend structure
        const transformedMinistries = data.ministries.map((ministry: any) => ({
          id: ministry._id, // Use database _id as unique identifier
          category: ministry.category, // Keep category for display purposes
          name: ministry.name,
          description: ministry.description,
          icon: getIconForCategory(ministry.category),
          image: ministry.imageUrl || getImageForCategory(ministry.category), // Use API imageUrl or fallback
          leader: ministry.leader,
          meetingSchedule: ministry.meetingSchedule,
          endTime: ministry.endTime
        }));
        setMinistries(transformedMinistries);
        console.log('Transformed ministries:', transformedMinistries);
      } else {
        // No ministries in database, show empty state
        console.log('No ministries in database');
        setMinistries([]);
      }
    } catch (error) {
      console.error('Error fetching ministries:', error);
      setMinistries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (event: CustomEvent) => {
    await fetchMinistries();
    event.detail.complete();
  };

  const getIconForCategory = (category: string) => {
    const iconMap: { [key: string]: any } = {
      'married-couples': heart,
      'youth': people,
      'children': book,
      'evangelism': radio,
      'intercessions': chatbubble,
      'worship': musicalNotes
    };
    return iconMap[category] || people;
  };

  const getImageForCategory = (category: string) => {
    const imageMap: { [key: string]: string } = {
      'married-couples': 'hero-marriedcouples.jpg',
      'youth': 'hero-youth.jpg',
      'children': 'hero-children.jpg',
      'evangelism': 'hero-evangelism.jpg',
      'intercessions': 'hero-intercessions.jpg',
      'worship': 'hero-worship.jpg'
    };
    return imageMap[category] || 'hero-default.jpg';
  };

  // Helper function to get ministry image with fallbacks
  const getMinistryImage = (imageUrl?: string, category?: string): string => {
    if (!imageUrl || !imageUrl.trim()) {
      return getImageForCategory(category || '');
    }
    if (imageUrl.startsWith('/uploads/')) {
      return `${BACKEND_BASE_URL}${imageUrl}`;
    }
    return imageUrl;
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <IonButton fill="clear" slot="start" onClick={() => history.goBack()} style={{ marginLeft: '4px' }}>
            <IonIcon icon={arrowBack} style={{ fontSize: '22px' }} />
          </IonButton>
          <IonTitle className="title-ios" style={{ textAlign: 'left', marginLeft: '-16px' }}>Ministries</IonTitle>
        </IonToolbar>
      </IonHeader>

      {/* Back Button */}
      <div
        className="floating-back-btn"
        onClick={() => history.goBack()}
        onMouseDown={(e) => {
          const target = e.currentTarget as HTMLElement;
          target.style.transform = 'scale(0.8)';
        }}
        onMouseUp={(e) => {
          const target = e.currentTarget as HTMLElement;
          setTimeout(() => {
            target.style.transform = 'scale(1)';
          }, 200);
        }}
        onMouseLeave={(e) => {
          const target = e.currentTarget as HTMLElement;
          target.style.transform = 'scale(1)';
        }}
      >
        <IonIcon
          icon={arrowBack}
          style={{
            color: isDarkMode ? '#ffffff' : '#000000',
            fontSize: '20px',
          }}
        />
      </div>

      <IonContent fullscreen className="content-ios">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>
        <div style={{
          padding: '20px',
          maxWidth: '400px',
          margin: '0 auto',
          paddingTop: '20px'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <IonIcon
              icon={people}
              style={{
                fontSize: '3em',
                color: '#6366f1',
                marginBottom: '16px'
              }}
            />
            <h1 style={{
              margin: '0 0 8px 0',
              fontSize: '1.8em',
              fontWeight: '700',
              color: isDarkMode ? '#ffffff' : '#000000'
            }}>
              Our Ministries
            </h1>
            <p style={{
              margin: '0',
              color: isDarkMode ? '#ffffff' : '#000000',
              opacity: 0.7,
              fontSize: '1em'
            }}>
              Discover your calling and serve in community
            </p>
          </div>

          {/* Introduction */}
          <div className="intro-section-themed">
            <p style={{
              margin: '0 0 16px 0',
              color: isDarkMode ? '#ffffff' : '#000000',
              lineHeight: '1.5'
            }}>
              At Dove Ministries Africa, we believe in the power of community and specialized ministry.
              Each ministry focuses on specific areas of service and spiritual growth.
            </p>
            <p style={{
              margin: '0',
              fontSize: '0.9em',
              fontStyle: 'italic',
              textAlign: 'center',
              color: isDarkMode ? '#92949c' : '#8e8e93'
            }}>
              "Each of you should use whatever gift you have received to serve others..."
              <br />
              <span style={{ fontSize: '0.8em' }}>- 1 Peter 4:10</span>
            </p>
          </div>

          {/* Ministries List */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{
              margin: '0 0 16px 0',
              fontSize: '1.4em',
              fontWeight: '600',
              color: isDarkMode ? '#ffffff' : '#000000'
            }}>
              Ministries
            </h2>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', opacity: 0.6 }}>
                <IonSpinner name="crescent" color="primary" style={{ width: '36px', height: '36px' }} />
                <p style={{ margin: '12px 0 0 0', fontSize: '14px', color: isDarkMode ? '#ffffff' : '#000000' }}>
                  Loading ministries...
                </p>
              </div>
            ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {ministries.map((ministry) => (
                <div key={ministry.id} className="ministry-content-card">
                  <div style={{ height: '120px', position: 'relative', overflow: 'hidden' }}>
                    <img
                      src={getMinistryImage(ministry.image, ministry.category)}
                      alt={ministry.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        const target = e.currentTarget;
                        const cat = ministry.category || '';
                        // Try category-specific fallback first
                        const categoryFallbacks: { [key: string]: string } = {
                          'married-couples': '/dove.png',
                          'youth': '/dove.png',
                          'children': '/dove.png',
                          'evangelism': '/dove.png',
                          'intercessions': '/dove.png',
                          'worship': '/dove.png'
                        };
                        if (!target.dataset['triedFallback']) {
                          target.dataset['triedFallback'] = 'true';
                          target.src = categoryFallbacks[cat] || '/dove.png';
                        } else {
                          // Use SVG placeholder as final fallback
                          target.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="120" viewBox="0 0 300 120"><rect fill="%23f5f5f5" width="300" height="120"/><text x="150" y="60" text-anchor="middle" dy=".3em" fill="%23999" font-size="14">Ministry Image</text></svg>');
                        }
                      }}
                    />
                  </div>
                  <div style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <IonIcon icon={ministry.icon} style={{ color: '#6366f1', fontSize: '1.2em' }} />
                      <span style={{ fontWeight: '600', color: isDarkMode ? '#ffffff' : '#000000', fontSize: '0.9em' }}>
                        {ministry.name.split(' ')[0]} Ministry
                      </span>
                    </div>
                    <h3 style={{
                      margin: '0 0 8px 0',
                      fontSize: '1.1em',
                      fontWeight: '600',
                      color: isDarkMode ? '#ffffff' : '#000000'
                    }}>
                      {ministry.name}
                    </h3>
                    <p style={{
                      margin: '0 0 12px 0',
                      color: isDarkMode ? '#92949c' : '#8e8e93',
                      fontSize: '0.85em',
                      lineHeight: '1.4',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {ministry.description}
                    </p>
                    {ministry.leader && (
                      <div style={{
                        margin: '0 0 8px 0',
                        fontSize: '0.8em',
                        color: isDarkMode ? '#92949c' : '#8e8e93'
                      }}>
                        <strong>Leader:</strong> {ministry.leader}
                      </div>
                    )}
                    {ministry.meetingSchedule && (
                      <div style={{
                        margin: '0 0 8px 0',
                        fontSize: '0.8em',
                        color: isDarkMode ? '#92949c' : '#8e8e93'
                      }}>
                        <strong>Meetings:</strong> {ministry.meetingSchedule}
                        {ministry.endTime && ` (ends ${ministry.endTime})`}
                      </div>
                    )}
                    <IonButton
                      onClick={() => history.push(`/ministry/${ministry.id}`)}
                      style={{
                        width: '100%',
                        height: '44px',
                        borderRadius: '8px',
                        fontWeight: '600',
                        backgroundColor: '#6366f1',
                        '--border-radius': '8px'
                      }}>
                      <IonIcon icon={ministry.icon} slot="start" />
                      Learn More
                    </IonButton>
                  </div>
                </div>
              ))}
            </div>
            )}

          {/* Get Involved */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{
              margin: '0 0 16px 0',
              fontSize: '1.4em',
              fontWeight: '600',
              color: isDarkMode ? '#ffffff' : '#000000'
            }}>
              Get Involved
            </h2>

            <div className="get-involved-themed">
              <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1em' }}>Discover Your Calling</h3>
              <p style={{
                margin: '0 0 20px 0',
                color: isDarkMode ? '#ffffff' : '#000000',
                lineHeight: '1.5',
                fontSize: '0.9em'
              }}>
                God has given each of us unique gifts and talents. Find your place in ministry
                and make a difference in the Kingdom.
              </p>

              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '1em' }}>Contact Information</h4>
                <p style={{ margin: '0 0 4px 0', fontSize: '0.9em', color: isDarkMode ? '#92949c' : '#8e8e93' }}>
                  <strong>Email:</strong> thesignofthedoveministries@gmail.com
                </p>
                <p style={{ margin: '0', fontSize: '0.9em', color: isDarkMode ? '#92949c' : '#8e8e93' }}>
                  <strong>Phone:</strong> +256 772824677 | +256 700116734
                </p>
              </div>

              <IonButton onClick={() => history.push('/tab5')} style={{
                height: '44px',
                borderRadius: '8px',
                fontWeight: '600',
                backgroundColor: '#6366f1',
                '--border-radius': '8px'
              }}>
                <IonIcon icon={people} slot="start" />
                Join a Ministry
              </IonButton>
            </div>
          </div>
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <p style={{
              color: isDarkMode ? '#ffffff' : '#000000',
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

export default Ministries;