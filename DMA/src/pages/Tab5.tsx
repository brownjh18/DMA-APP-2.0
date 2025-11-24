import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardContent, IonButtons, IonBackButton, IonIcon, IonButton, IonText } from '@ionic/react';
import { call, mail, location, time, people, heart, book, radio, calendar, cash, chatbubble, camera, informationCircle } from 'ionicons/icons';
import './Tab5.css';

const Tab5: React.FC = () => {
  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tab1" />
          </IonButtons>
          <IonTitle className="title-ios">About & Contact</IonTitle>
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
              icon={informationCircle}
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
              About Dove Ministries
            </h1>
            <p style={{
              margin: '0',
              color: 'var(--ion-text-color)',
              opacity: 0.7,
              fontSize: '1em'
            }}>
              Transforming lives through faith and community
            </p>
          </div>

          {/* About Section */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{
              margin: '0 0 16px 0',
              fontSize: '1.4em',
              fontWeight: '600',
              color: 'var(--ion-text-color)'
            }}>
              Our Mission
            </h2>
            <div style={{
              backgroundColor: 'rgba(0,0,0,0.05)',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '16px'
            }}>
              <p style={{
                margin: '0 0 16px 0',
                color: 'var(--ion-text-color)',
                lineHeight: '1.5'
              }}>
                Transforming lives through faith, community, and service across Africa.
                Founded in 2005 by Pastor Daniel and Erica Kaggwa.
              </p>
              <p style={{
                margin: '0',
                fontSize: '0.9em',
                fontStyle: 'italic',
                textAlign: 'center',
                color: 'var(--ion-color-medium)'
              }}>
                "To take the gospel of Jesus Christ to the lost and assimilate them
                into a church community where they may grow spiritually."
                <br />
                <span style={{ fontSize: '0.8em' }}>- Our Mission</span>
              </p>
            </div>
          </div>

          {/* Meet Our Founders */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{
              margin: '0 0 16px 0',
              fontSize: '1.4em',
              fontWeight: '600',
              color: 'var(--ion-text-color)'
            }}>
              Meet Our Founders
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Pastor Daniel */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                backgroundColor: 'rgba(0,0,0,0.05)',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid rgba(0,0,0,0.1)'
              }}>
                <img src="/pastor.jpg" alt="Pastor Daniel Kaggwa" style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid var(--ion-color-primary)'
                }} />
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2em', fontWeight: '600', color: 'var(--ion-text-color)' }}>Pastor Daniel Kaggwa</h3>
                  <p style={{ margin: '0', color: 'var(--ion-color-medium)', fontSize: '0.9em' }}>Co-Founder & Senior Pastor</p>
                </div>
              </div>
              {/* Erica Kaggwa */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                backgroundColor: 'rgba(0,0,0,0.05)',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid rgba(0,0,0,0.1)'
              }}>
                <img src="/mommy-erica.jpg" alt="Erica Kaggwa" style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid var(--ion-color-primary)'
                }} />
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2em', fontWeight: '600', color: 'var(--ion-text-color)' }}>Erica Kaggwa</h3>
                  <p style={{ margin: '0', color: 'var(--ion-color-medium)', fontSize: '0.9em' }}>Co-Founder & Ministry Leader</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{
              margin: '0 0 16px 0',
              fontSize: '1.4em',
              fontWeight: '600',
              color: 'var(--ion-text-color)'
            }}>
              Get In Touch
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Phone */}
              <div style={{
                backgroundColor: 'rgba(0,0,0,0.05)',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <IonIcon icon={call} style={{ color: '#10b981', fontSize: '1.5em' }} />
                  <span style={{ fontWeight: '600', color: 'var(--ion-text-color)' }}>Call Us</span>
                </div>
                <p style={{ margin: '0', color: 'var(--ion-color-medium)', fontSize: '0.9em' }}>+256 772824677</p>
                <p style={{ margin: '0', color: 'var(--ion-color-medium)', fontSize: '0.9em' }}>+256 700116734</p>
              </div>

              {/* Email */}
              <div style={{
                backgroundColor: 'rgba(0,0,0,0.05)',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <IonIcon icon={mail} style={{ color: '#f59e0b', fontSize: '1.5em' }} />
                  <span style={{ fontWeight: '600', color: 'var(--ion-text-color)' }}>Email Us</span>
                </div>
                <p style={{ margin: '0', color: 'var(--ion-color-medium)', fontSize: '0.9em' }}>thesignofthedove</p>
                <p style={{ margin: '0', color: 'var(--ion-color-medium)', fontSize: '0.9em' }}>ministries@gmail.com</p>
              </div>

              {/* Location */}
              <div style={{
                backgroundColor: 'rgba(0,0,0,0.05)',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <IonIcon icon={location} style={{ color: '#8b5cf6', fontSize: '1.5em' }} />
                  <span style={{ fontWeight: '600', color: 'var(--ion-text-color)' }}>Visit Us</span>
                </div>
                <p style={{ margin: '0', color: 'var(--ion-color-medium)', fontSize: '0.9em' }}>Nfuufu Zone</p>
                <p style={{ margin: '0', color: 'var(--ion-color-medium)', fontSize: '0.9em' }}>Zzana-Bunamwaya, Kampala</p>
              </div>

              {/* Hours */}
              <div style={{
                backgroundColor: 'rgba(0,0,0,0.05)',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <IonIcon icon={time} style={{ color: '#06b6d4', fontSize: '1.5em' }} />
                  <span style={{ fontWeight: '600', color: 'var(--ion-text-color)' }}>Office Hours</span>
                </div>
                <p style={{ margin: '0', color: 'var(--ion-color-medium)', fontSize: '0.9em' }}>Mon-Fri: 9AM-5PM</p>
                <p style={{ margin: '0', color: 'var(--ion-color-medium)', fontSize: '0.9em' }}>Sat: 10AM-2PM</p>
              </div>
            </div>
          </div>

          {/* Our Story */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{
              margin: '0 0 16px 0',
              fontSize: '1.4em',
              fontWeight: '600',
              color: 'var(--ion-text-color)'
            }}>
              Our Story
            </h2>
            <div style={{
              backgroundColor: 'rgba(0,0,0,0.05)',
              padding: '20px',
              borderRadius: '12px'
            }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1em' }}>Founded in 2005</h3>
              <p style={{
                margin: '0 0 20px 0',
                color: 'var(--ion-text-color)',
                lineHeight: '1.5',
                fontSize: '0.9em'
              }}>
                Dove Ministries Africa was founded by Pastor Daniel and Erica Kaggwa,
                under the spiritual guidance of Apostle Harry and Deborah Stackhouse,
                with a vision to transform lives through faith.
              </p>

              <h4 style={{ margin: '0 0 12px 0', fontSize: '1em' }}>Our Impact</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{
                  backgroundColor: 'rgba(0,0,0,0.08)',
                  padding: '16px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.5em', fontWeight: '700', color: 'var(--ion-color-primary)' }}>19+</div>
                  <div style={{ fontSize: '0.8em', color: 'var(--ion-color-medium)' }}>Years of Ministry</div>
                </div>
                <div style={{
                  backgroundColor: 'rgba(0,0,0,0.08)',
                  padding: '16px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.5em', fontWeight: '700', color: 'var(--ion-color-primary)' }}>1000+</div>
                  <div style={{ fontSize: '0.8em', color: 'var(--ion-color-medium)' }}>Lives Transformed</div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <IonText style={{
              color: 'var(--ion-text-color)',
              opacity: 0.6,
              fontSize: '0.8em'
            }}>
              Dove Ministries Africa
            </IonText>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Tab5;