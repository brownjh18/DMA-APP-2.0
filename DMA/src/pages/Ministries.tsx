import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardContent, IonIcon, IonRouterLink, IonButton, IonLoading, IonRefresher, IonRefresherContent } from '@ionic/react';
import { heart, people, book, radio, chatbubble, musicalNotes, informationCircle, arrowBack } from 'ionicons/icons';
import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import './Ministries.css';

const Ministries: React.FC = () => {
  const [ministries, setMinistries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const history = useHistory();

  useEffect(() => {
    console.log('Ministries component mounted, fetching data from API');
    fetchMinistries();
  }, []);

  const fetchMinistries = async () => {
    try {
      console.log('Fetching ministries from /api/ministries');
      const response = await fetch('/api/ministries?active=true');
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched ministries data:', data);
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
        console.error('Failed to fetch ministries:', response.status);
        // Fallback to hardcoded if API fails
        setMinistries(hardcodedMinistries);
      }
    } catch (error) {
      console.error('Error fetching ministries:', error);
      // Fallback to hardcoded if API fails
      setMinistries(hardcodedMinistries);
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

  // Keep hardcoded ministries as fallback
  const hardcodedMinistries = [
    {
      id: 'married-couples',
      name: 'Married Couples Ministry',
      icon: heart,
      description: 'Supporting and strengthening marriages through biblical teachings.',
      image: 'hero-marriedcouples.jpg'
    },
    {
      id: 'youth',
      name: 'Youth Ministry',
      icon: people,
      description: 'Empowering young people to discover their purpose and live for Christ.',
      image: 'hero-youth.jpg'
    },
    {
      id: 'children',
      name: 'Children Ministry',
      icon: book,
      description: 'Nurturing children in faith through age-appropriate teaching.',
      image: 'hero-children.jpg'
    },
    {
      id: 'evangelism',
      name: 'Evangelism Ministry',
      icon: radio,
      description: 'Reaching out to the community with the message of salvation.',
      image: 'hero-evangelism.jpg'
    },
    {
      id: 'intercessions',
      name: 'Intercessions Ministry',
      icon: chatbubble,
      description: 'Dedicated to prayer and interceding for the church and community.',
      image: 'hero-intercessions.jpg'
    },
    {
      id: 'worship',
      name: 'Worship Ministry',
      icon: musicalNotes,
      description: 'Leading the congregation in worship through music and arts.',
      image: 'hero-worship.jpg'
    }
  ];

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          
          <IonTitle className="title-ios">Ministries</IonTitle>
        </IonToolbar>
      </IonHeader>

      {/* Back Button */}
      <div
        onClick={() => history.goBack()}
        style={{
          position: 'absolute',
          top: 'calc(var(--ion-safe-area-top) - -5px)',
          left: 20,
          width: 45,
          height: 45,
          borderRadius: 25,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)',
          boxShadow: '0 6px 16px rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 999,
          transition: 'transform 0.2s ease'
        }}
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
            color: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? '#ffffff' : '#000000',
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
                color: 'var(--ion-color-primary)',
                marginBottom: '16px'
              }}
            />
            <h1 style={{
              margin: '0 0 8px 0',
              fontSize: '1.8em',
              fontWeight: '700',
              color: 'var(--ion-text-color)'
            }}>
              Our Ministries
            </h1>
            <p style={{
              margin: '0',
              color: 'var(--ion-text-color)',
              opacity: 0.7,
              fontSize: '1em'
            }}>
              Discover your calling and serve in community
            </p>
          </div>

          {/* Introduction */}
          <div style={{
            backgroundColor: 'rgba(0,0,0,0.05)',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '32px'
          }}>
            <p style={{
              margin: '0 0 16px 0',
              color: 'var(--ion-text-color)',
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
              color: 'var(--ion-color-medium)'
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
              color: 'var(--ion-text-color)'
            }}>
              Ministries
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {ministries.map((ministry) => (
                <div key={ministry.id} style={{
                  backgroundColor: 'rgba(0,0,0,0.05)',
                  borderRadius: '12px',
                  border: '1px solid rgba(0,0,0,0.1)',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '120px',
                    backgroundImage: `url(${ministry.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }} />
                  <div style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <IonIcon icon={ministry.icon} style={{ color: 'var(--ion-color-primary)', fontSize: '1.2em' }} />
                      <span style={{ fontWeight: '600', color: 'var(--ion-text-color)', fontSize: '0.9em' }}>
                        {ministry.name.split(' ')[0]} Ministry
                      </span>
                    </div>
                    <h3 style={{
                      margin: '0 0 8px 0',
                      fontSize: '1.1em',
                      fontWeight: '600',
                      color: 'var(--ion-text-color)'
                    }}>
                      {ministry.name}
                    </h3>
                    <p style={{
                      margin: '0 0 12px 0',
                      color: 'var(--ion-color-medium)',
                      fontSize: '0.9em',
                      lineHeight: '1.4'
                    }}>
                      {ministry.description}
                    </p>
                    {ministry.leader && (
                      <div style={{
                        margin: '0 0 8px 0',
                        fontSize: '0.8em',
                        color: 'var(--ion-color-medium)'
                      }}>
                        <strong>Leader:</strong> {ministry.leader}
                      </div>
                    )}
                    {ministry.meetingSchedule && (
                      <div style={{
                        margin: '0 0 8px 0',
                        fontSize: '0.8em',
                        color: 'var(--ion-color-medium)'
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
                        backgroundColor: 'var(--ion-color-primary)',
                        '--border-radius': '8px'
                      }}>
                      <IonIcon icon={ministry.icon} slot="start" />
                      Learn More
                    </IonButton>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Get Involved */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{
              margin: '0 0 16px 0',
              fontSize: '1.4em',
              fontWeight: '600',
              color: 'var(--ion-text-color)'
            }}>
              Get Involved
            </h2>

            <div style={{
              backgroundColor: 'rgba(0,0,0,0.05)',
              padding: '20px',
              borderRadius: '12px'
            }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1em' }}>Discover Your Calling</h3>
              <p style={{
                margin: '0 0 20px 0',
                color: 'var(--ion-text-color)',
                lineHeight: '1.5',
                fontSize: '0.9em'
              }}>
                God has given each of us unique gifts and talents. Find your place in ministry
                and make a difference in the Kingdom.
              </p>

              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '1em' }}>Contact Information</h4>
                <p style={{ margin: '0 0 4px 0', fontSize: '0.9em', color: 'var(--ion-color-medium)' }}>
                  <strong>Email:</strong> thesignofthedoveministries@gmail.com
                </p>
                <p style={{ margin: '0', fontSize: '0.9em', color: 'var(--ion-color-medium)' }}>
                  <strong>Phone:</strong> +256 772824677 | +256 700116734
                </p>
              </div>

              <IonButton onClick={() => history.push('/tab5')} style={{
                height: '44px',
                borderRadius: '8px',
                fontWeight: '600',
                backgroundColor: 'var(--ion-color-primary)',
                '--border-radius': '8px'
              }}>
                <IonIcon icon={people} slot="start" />
                Join a Ministry
              </IonButton>
            </div>
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

        <IonLoading isOpen={loading} message="Loading ministries..." />
      </IonContent>
    </IonPage>
  );
};

export default Ministries;