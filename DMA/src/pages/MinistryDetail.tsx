import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonIcon, IonButton, IonChip, IonLoading } from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { heart, people, book, radio, chatbubble, musicalNotes, mail, call, location, informationCircle } from 'ionicons/icons';
import './MinistryDetail.css';

const MinistryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const [ministry, setMinistry] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('MinistryDetail component mounted, fetching ministry with id:', id);
    fetchMinistry();
  }, [id]);

  const fetchMinistry = async () => {
    try {
      console.log('Fetching ministry by id:', id);
      const response = await fetch(`/api/ministries/${id}`);
      if (response.ok) {
        const foundMinistry = await response.json();
        console.log('Found ministry:', foundMinistry);
        // Transform to match frontend structure
        const transformedMinistry = {
          id: foundMinistry.ministry._id,
          category: foundMinistry.ministry.category,
          name: foundMinistry.ministry.name,
          icon: getIconForCategory(foundMinistry.ministry.category),
          description: foundMinistry.ministry.description,
          leader: foundMinistry.ministry.leader,
          activities: foundMinistry.ministry.activities || [],
          color: getColorForCategory(foundMinistry.ministry.category),
          bgColor: getBgColorForCategory(foundMinistry.ministry.category),
          longDescription: foundMinistry.ministry.description, // Use description as longDescription for now
          meetingInfo: foundMinistry.ministry.meetingSchedule || 'Meeting schedule not specified',
          endTime: foundMinistry.ministry.endTime || '',
          contact: {
            email: foundMinistry.ministry.contactEmail || 'info@doveministriesafrica.org',
            phone: foundMinistry.ministry.contactPhone || '+256 772824677'
          }
        };
        setMinistry(transformedMinistry);
      } else {
        console.error('Failed to fetch ministry:', response.status);
      }
    } catch (error) {
      console.error('Error fetching ministry:', error);
    } finally {
      setLoading(false);
    }
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

  const getColorForCategory = (category: string) => {
    const colorMap: { [key: string]: string } = {
      'married-couples': '#ef4444',
      'youth': '#f59e0b',
      'children': '#06b6d4',
      'evangelism': '#8b5cf6',
      'intercessions': '#10b981',
      'worship': '#ec4899'
    };
    return colorMap[category] || '#3b82f6';
  };

  const getBgColorForCategory = (category: string) => {
    const bgMap: { [key: string]: string } = {
      'married-couples': 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
      'youth': 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
      'children': 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
      'evangelism': 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
      'intercessions': 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
      'worship': 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)'
    };
    return bgMap[category] || 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)';
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Loading...</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonLoading isOpen={loading} message="Loading ministry details..." />
        </IonContent>
      </IonPage>
    );
  }

  if (!ministry) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Ministry Not Found</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <p>Ministry not found.</p>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{ministry.name}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="content-ios">
        <div style={{
          padding: '20px',
          maxWidth: '400px',
          margin: '0 auto',
          paddingTop: '20px'
        }}>
          {/* Thumbnail */}
          {ministry.imageUrl && (
            <div style={{
              width: '100%',
              height: '200px',
              borderRadius: '12px',
              overflow: 'hidden',
              marginBottom: '24px',
              backgroundColor: 'rgba(0,0,0,0.05)'
            }}>
              <img
                src={ministry.imageUrl}
                alt={`${ministry.name} thumbnail`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </div>
          )}

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <IonIcon
              icon={ministry.icon}
              style={{
                fontSize: '3em',
                color: ministry.color,
                marginBottom: '16px'
              }}
            />
            <h1 style={{
              margin: '0 0 8px 0',
              fontSize: '1.8em',
              fontWeight: '700',
              color: 'var(--ion-text-color)'
            }}>
              {ministry.name}
            </h1>
            <p style={{
              margin: '0',
              color: 'var(--ion-text-color)',
              opacity: 0.7,
              fontSize: '1em'
            }}>
              {ministry.description}
            </p>
          </div>

          {/* About Section */}
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
              About This Ministry
            </h2>
            <p style={{
              margin: '0 0 20px 0',
              color: 'var(--ion-text-color)',
              lineHeight: '1.6',
              fontSize: '0.95em'
            }}>
              {ministry.longDescription}
            </p>

            {/* Ministry Leader */}
            <div style={{
              backgroundColor: 'rgba(0,0,0,0.08)',
              padding: '16px',
              borderRadius: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <IonIcon icon={people} style={{
                  color: ministry.color,
                  fontSize: '1.2em',
                  marginRight: '8px'
                }} />
                <span style={{
                  fontSize: '0.9em',
                  color: 'var(--ion-color-medium)',
                  fontWeight: '500'
                }}>
                  Ministry Leader
                </span>
              </div>
              <p style={{
                margin: '0',
                fontSize: '1em',
                color: 'var(--ion-text-color)',
                fontWeight: '600'
              }}>
                {ministry.leader}
              </p>
            </div>
          </div>


          {/* Meeting Information */}
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
              When We Meet
            </h2>
            <div style={{
              backgroundColor: 'rgba(245, 158, 11, 0.05)',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid rgba(245, 158, 11, 0.1)'
            }}>
              <p style={{
                margin: '0 0 8px 0',
                fontSize: '0.95em',
                lineHeight: '1.6',
                color: 'var(--ion-text-color)'
              }}>
                {ministry.meetingInfo}
              </p>
              {ministry.endTime && (
                <p style={{
                  margin: '0',
                  fontSize: '0.9em',
                  color: 'var(--ion-color-medium)',
                  fontStyle: 'italic'
                }}>
                  Ends at: {ministry.endTime}
                </p>
              )}
            </div>
          </div>

          {/* Contact Information */}
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
              Get Involved
            </h2>
            <p style={{
              margin: '0 0 20px 0',
              color: 'var(--ion-text-color)',
              lineHeight: '1.6',
              fontSize: '0.95em'
            }}>
              Interested in joining this ministry? We'd love to have you!
            </p>

            {/* Email Contact */}
            <div style={{
              borderRadius: '8px',
              border: '1px solid var(--ion-color-step-300)',
              marginBottom: '12px',
              overflow: 'hidden'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px'
              }}>
                <IonIcon icon={mail} slot="start" style={{ color: 'var(--ion-color-primary)', marginRight: '12px' }} />
                <div>
                  <p style={{ margin: '0 0 4px 0', fontSize: '0.9em', color: 'var(--ion-color-medium)' }}>Email</p>
                  <p style={{ margin: 0, fontSize: '0.95em', color: 'var(--ion-text-color)', fontWeight: '500' }}>
                    {ministry.contact.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Phone Contact */}
            <div style={{
              borderRadius: '8px',
              border: '1px solid var(--ion-color-step-300)',
              marginBottom: '20px',
              overflow: 'hidden'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px'
              }}>
                <IonIcon icon={call} slot="start" style={{ color: 'var(--ion-color-primary)', marginRight: '12px' }} />
                <div>
                  <p style={{ margin: '0 0 4px 0', fontSize: '0.9em', color: 'var(--ion-color-medium)' }}>Phone Number</p>
                  <p style={{ margin: 0, fontSize: '0.95em', color: 'var(--ion-text-color)', fontWeight: '500' }}>
                    {ministry.contact.phone}
                  </p>
                </div>
              </div>
            </div>

            <IonButton
              expand="block"
              style={{
                height: '44px',
                borderRadius: '8px',
                fontWeight: '600',
                backgroundColor: 'var(--ion-color-primary)',
                '--border-radius': '8px'
              }}
              onClick={() => window.location.href = `tel:${ministry.contact.phone}`}
            >
              <IonIcon icon={call} slot="start" />
              Call Ministry Leader
            </IonButton>
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

export default MinistryDetail;