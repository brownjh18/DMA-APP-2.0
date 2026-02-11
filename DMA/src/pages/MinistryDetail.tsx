import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonIcon, IonCard, IonCardContent, IonButton, IonButtons, IonText, IonLoading } from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { heart, people, book, radio, chatbubble, musicalNotes, mail, call, location, informationCircle, arrowBack, calendar, time } from 'ionicons/icons';
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
          imageUrl: foundMinistry.ministry.imageUrl,
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
        <IonHeader translucent>
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
          <IonToolbar className="toolbar-ios">
            <IonTitle className="title-ios">Loading...</IonTitle>
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
        <IonHeader translucent>
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
          <IonToolbar className="toolbar-ios">
            <IonTitle className="title-ios">Ministry Not Found</IonTitle>
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
      <IonHeader translucent>
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
        <IonToolbar className="toolbar-ios">
          <IonTitle className="title-ios">Ministry Details</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="content-ios">
        <div style={{ padding: '20px' }}>
          {/* Ministry Image */}
          {ministry.imageUrl && (
            <div style={{
              width: '100%',
              height: '200px',
              backgroundImage: `url(${ministry.imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: '12px',
              marginBottom: '20px'
            }} />
          )}

          {/* Ministry Title and Category */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <IonIcon icon={ministry.icon} style={{ color: 'var(--ion-color-primary)', fontSize: '1.5em' }} />
              <span style={{
                fontWeight: '600',
                backgroundColor: 'var(--ion-color-primary)',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '16px',
                fontSize: '0.85em'
              }}>
                {ministry.category || 'Ministry'}
              </span>
            </div>
            <h1 style={{
              margin: '0 0 12px 0',
              fontSize: '1.8em',
              fontWeight: '700',
              color: 'var(--ion-text-color)'
            }}>
              {ministry.name}
            </h1>
          </div>

          {/* Ministry Details Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
            {/* About Ministry */}
            <IonCard style={{ margin: '0', borderRadius: '12px' }}>
              <IonCardContent style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <IonIcon icon={informationCircle} style={{ color: 'var(--ion-color-primary)' }} />
                  <span style={{ fontWeight: '600', color: 'var(--ion-text-color)' }}>About This Ministry</span>
                </div>
                <p style={{ margin: '0', color: 'var(--ion-text-color)', fontSize: '1.1em' }}>
                  {ministry.longDescription}
                </p>
              </IonCardContent>
            </IonCard>

            {/* Ministry Leader */}
            <IonCard style={{ margin: '0', borderRadius: '12px' }}>
              <IonCardContent style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <IonIcon icon={people} style={{ color: 'var(--ion-color-primary)' }} />
                  <span style={{ fontWeight: '600', color: 'var(--ion-text-color)' }}>Ministry Leader</span>
                </div>
                <p style={{ margin: '0', color: 'var(--ion-text-color)', fontSize: '1.1em' }}>
                  {ministry.leader}
                </p>
              </IonCardContent>
            </IonCard>

            {/* Meeting Information */}
            <IonCard style={{ margin: '0', borderRadius: '12px' }}>
              <IonCardContent style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <IonIcon icon={calendar} style={{ color: 'var(--ion-color-primary)' }} />
                  <span style={{ fontWeight: '600', color: 'var(--ion-text-color)' }}>When We Meet</span>
                </div>
                <p style={{ margin: '0 0 4px 0', color: 'var(--ion-text-color)', fontSize: '1.1em' }}>
                  {ministry.meetingInfo}
                </p>
                {ministry.endTime && (
                  <p style={{ margin: '0', color: 'var(--ion-color-medium)' }}>
                    <IonIcon icon={time} style={{ marginRight: '8px' }} />
                    Ends at: {ministry.endTime}
                  </p>
                )}
              </IonCardContent>
            </IonCard>

            {/* Contact Information */}
            <IonCard style={{ margin: '0', borderRadius: '12px' }}>
              <IonCardContent style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <IonIcon icon={mail} style={{ color: 'var(--ion-color-primary)' }} />
                  <span style={{ fontWeight: '600', color: 'var(--ion-text-color)' }}>Contact Information</span>
                </div>
                <p style={{ margin: '0 0 8px 0', color: 'var(--ion-text-color)' }}>
                  <strong>Email:</strong> {ministry.contact.email}
                </p>
                <p style={{ margin: '0', color: 'var(--ion-text-color)' }}>
                  <strong>Phone:</strong> {ministry.contact.phone}
                </p>
              </IonCardContent>
            </IonCard>
          </div>

          {/* Call Button */}
          <div style={{ marginBottom: '24px' }}>
            <IonButton
              expand="block"
              onClick={() => window.location.href = `tel:${ministry.contact.phone}`}
              style={{
                height: '48px',
                borderRadius: '24px',
                fontWeight: '600',
                backgroundColor: 'var(--ion-color-primary)',
                '--border-radius': '24px'
              }}
            >
              <IonIcon icon={call} slot="start" />
              Call Ministry Leader
            </IonButton>
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <IonText style={{
              color: 'var(--ion-text-color)',
              opacity: 0.6,
              fontSize: '0.9em'
            }}>
              Dove Ministries Africa
            </IonText>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default MinistryDetail;