import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButtons, IonBackButton, IonIcon, IonButton, IonChip } from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import { heart, people, book, radio, chatbubble, musicalNotes, mail, call, location } from 'ionicons/icons';
import './MinistryDetail.css';

const MinistryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();

  const ministries = [
    {
      id: 'married-couples',
      name: 'Married Couples Ministry',
      icon: heart,
      description: 'Supporting and strengthening marriages through biblical teachings, counseling, and fellowship.',
      leader: 'Pastor Daniel & Erica Kaggwa',
      activities: ['Marriage Enrichment Seminars', 'Couples Retreats', 'Pre-marital Counseling', 'Family Bible Studies'],
      color: '#ef4444',
      bgColor: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
      longDescription: 'The Married Couples Ministry is dedicated to building strong, Christ-centered marriages and families. We provide biblical teachings, counseling, and fellowship opportunities for couples at all stages of their marriage journey. Our ministry focuses on helping couples grow spiritually together, resolve conflicts biblically, and build lasting relationships that honor God.',
      meetingInfo: 'Weekly meetings every Wednesday at 6:00 PM',
      contact: {
        email: 'marriedcouples@doveministriesafrica.org',
        phone: '+256 772824677'
      }
    },
    {
      id: 'youth',
      name: 'Youth Ministry',
      icon: people,
      description: 'Empowering young people to discover their purpose and live for Christ in today\'s world.',
      leader: 'Youth Pastor',
      activities: ['Weekly Youth Services', 'Leadership Training', 'Community Outreach', 'Sports & Recreation'],
      color: '#f59e0b',
      bgColor: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
      longDescription: 'Our Youth Ministry is designed to help young people navigate the challenges of adolescence while growing in their faith. We provide a safe, supportive environment where teens can ask questions, build friendships, and discover God\'s purpose for their lives. Through worship, Bible study, and service projects, we equip the next generation to be bold followers of Christ.',
      meetingInfo: 'Sunday Youth Service at 2:00 PM, Wednesday Bible Study at 5:00 PM',
      contact: {
        email: 'youth@doveministriesafrica.org',
        phone: '+256 700116734'
      }
    },
    {
      id: 'children',
      name: 'Children Ministry',
      icon: book,
      description: 'Nurturing children in faith through age-appropriate teaching and fun activities.',
      leader: 'Children\'s Ministry Coordinator',
      activities: ['Sunday School', 'Vacation Bible School', 'Children\'s Church', 'Holiday Programs'],
      color: '#06b6d4',
      bgColor: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
      longDescription: 'The Children\'s Ministry creates a loving, engaging environment where children can learn about Jesus in age-appropriate ways. We believe that faith formation begins early, and we are committed to helping children develop a personal relationship with Jesus Christ. Our programs combine biblical teaching with creative activities, music, and play to make learning about God fun and memorable.',
      meetingInfo: 'Sunday School during both services, Children\'s Church during second service',
      contact: {
        email: 'children@doveministriesafrica.org',
        phone: '+256 772824677'
      }
    },
    {
      id: 'evangelism',
      name: 'Evangelism Ministry',
      icon: radio,
      description: 'Reaching out to the community with the message of salvation and hope.',
      leader: 'Evangelism Director',
      activities: ['Door-to-Door Outreach', 'Community Events', 'Prison Ministry', 'Hospital Visitation'],
      color: '#8b5cf6',
      bgColor: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
      longDescription: 'The Evangelism Ministry is passionate about sharing the gospel of Jesus Christ with our community and beyond. We believe that every person deserves to hear the good news of salvation, and we are committed to reaching out with love, compassion, and boldness. Our ministry includes various outreach programs designed to meet people where they are and introduce them to Jesus Christ.',
      meetingInfo: 'Monthly Evangelism Training on first Saturday at 10:00 AM',
      contact: {
        email: 'evangelism@doveministriesafrica.org',
        phone: '+256 700116734'
      }
    },
    {
      id: 'intercessions',
      name: 'Intercessions Ministry',
      icon: chatbubble,
      description: 'Dedicated to prayer and interceding for the church, community, and the world.',
      leader: 'Prayer Coordinator',
      color: '#10b981',
      bgColor: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
      activities: ['24/7 Prayer Chain', 'Prayer Meetings', 'Prayer Walking', 'Intercessory Prayer Groups'],
      longDescription: 'The Intercessions Ministry believes in the power of prayer and is committed to lifting up the needs of our church, community, and world before God. We maintain a 24/7 prayer chain and organize various prayer meetings and events. Our ministry teaches people how to pray effectively and encourages a lifestyle of prayer and intercession.',
      meetingInfo: 'Monday Prayer Service at 5:00 PM, Wednesday Prayer Meeting at 8:00 PM',
      contact: {
        email: 'prayer@doveministriesafrica.org',
        phone: '+256 772824677'
      }
    },
    {
      id: 'worship',
      name: 'Worship Ministry',
      icon: musicalNotes,
      description: 'Leading the congregation in worship through music, dance, and creative arts.',
      leader: 'Worship Leader',
      activities: ['Sunday Services', 'Special Events', 'Worship Team Training', 'Music Production'],
      color: '#ec4899',
      bgColor: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
      longDescription: 'The Worship Ministry creates an atmosphere where people can encounter God through music, dance, and creative arts. We believe that worship is not just about singing songs, but about expressing love and adoration to God in various forms. Our team leads worship during services and special events, and we also provide training for those interested in developing their musical and artistic gifts for ministry.',
      meetingInfo: 'Worship Team Practice every Thursday at 7:00 PM',
      contact: {
        email: 'worship@doveministriesafrica.org',
        phone: '+256 700116734'
      }
    }
  ];

  const ministry = ministries.find(m => m.id === id);

  if (!ministry) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/ministries" />
            </IonButtons>
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
          <IonButtons slot="start">
            <IonBackButton defaultHref="/ministries" />
          </IonButtons>
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

          {/* Activities Section */}
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
              Our Activities
            </h2>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              {ministry.activities.map((activity, index) => (
                <IonChip
                  key={index}
                  style={{
                    backgroundColor: `${ministry.color}15`,
                    color: ministry.color,
                    border: `1px solid ${ministry.color}20`,
                    fontSize: '0.85em',
                    fontWeight: '500'
                  }}
                >
                  {activity}
                </IonChip>
              ))}
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
                margin: '0',
                fontSize: '0.95em',
                lineHeight: '1.6',
                color: 'var(--ion-text-color)'
              }}>
                {ministry.meetingInfo}
              </p>
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
                  <p style={{ margin: '0 0 4px 0', fontSize: '0.9em', color: 'var(--ion-color-medium)' }}>Phone</p>
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