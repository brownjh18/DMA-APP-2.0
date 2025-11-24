import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardContent, IonButtons, IonBackButton, IonIcon, IonRouterLink, IonButton } from '@ionic/react';
import { heart, people, book, radio, chatbubble, musicalNotes, informationCircle } from 'ionicons/icons';
import './Ministries.css';

const Ministries: React.FC = () => {
  const ministries = [
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
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tab1" />
          </IonButtons>
          <IonTitle className="title-ios">Ministries</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
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
                    backgroundImage: `url(/public/${ministry.image})`,
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
                      margin: '0 0 16px 0',
                      color: 'var(--ion-color-medium)',
                      fontSize: '0.9em',
                      lineHeight: '1.4'
                    }}>
                      {ministry.description}
                    </p>
                    <IonRouterLink routerLink={`/ministry/${ministry.id}`}>
                      <IonButton style={{
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
                    </IonRouterLink>
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

              <IonButton routerLink="/tab5" style={{
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
      </IonContent>
    </IonPage>
  );
};

export default Ministries;