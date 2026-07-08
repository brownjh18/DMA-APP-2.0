import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonIcon, IonButton, IonButtons, IonText, IonLoading } from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { heart, people, book, radio, chatbubble, musicalNotes, mail, call, informationCircle, arrowBack, calendar, time, share } from 'ionicons/icons';
import { BACKEND_BASE_URL, apiService } from '../services/api';
import { useSettings } from '../contexts/SettingsContext';
import './MinistryDetail.css';

const getFullUrl = (url: string) => {
  if (url && url.startsWith('/uploads/')) {
    return `${BACKEND_BASE_URL}${url}`;
  }
  return url;
};

const MinistryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const { isDarkMode } = useSettings();
  const [ministry, setMinistry] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMinistry();
  }, [id]);

  const handleShare = useCallback(async () => {
    const shareUrl = `${window.location.origin}/ministry/${id}`;
    const shareData = {
      title: ministry?.name || 'Ministry at Dove Ministries Africa',
      text: ministry?.name ? `Check out this ministry: ${ministry.name}` : 'Check out this ministry.',
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        alert('Ministry link copied to clipboard');
      } else {
        window.prompt('Copy this ministry link', shareUrl);
      }
    } catch (error) {
      console.error('Share failed', error);
    }
  }, [id, ministry?.name]);

  const fetchMinistry = async () => {
    try {
      const foundMinistry = await apiService.getMinistry(id);
      if (foundMinistry && foundMinistry.ministry) {
        const m = foundMinistry.ministry;
        setMinistry({
          id: m._id,
          category: m.category,
          name: m.name,
          icon: getIconForCategory(m.category),
          color: getColorForCategory(m.category),
          description: m.description,
          leader: m.leader,
          meetingInfo: m.meetingSchedule || 'Meeting schedule not specified',
          endTime: m.endTime || '',
          imageUrl: m.imageUrl,
          contact: {
            email: m.contactEmail || 'info@doveministriesafrica.org',
            phone: m.contactPhone || '+256 772824677'
          }
        });
      }
    } catch (error) { /* ignore */ }
    finally { setLoading(false); }
  };

  const getIconForCategory = (category: string) => {
    const iconMap: { [key: string]: any } = {
      'married-couples': heart, 'youth': people, 'children': book,
      'evangelism': radio, 'intercessions': chatbubble, 'worship': musicalNotes
    };
    return iconMap[category] || people;
  };

  const getColorForCategory = (category: string) => {
    const colorMap: { [key: string]: string } = {
      'married-couples': '#ef4444', 'youth': '#f59e0b', 'children': '#06b6d4',
      'evangelism': '#8b5cf6', 'intercessions': '#10b981', 'worship': '#ec4899'
    };
    return colorMap[category] || '#3b82f6';
  };

  const getGradientForCategory = (category: string) => {
    const gradients: { [key: string]: string } = {
      'married-couples': 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
      'youth': 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
      'children': 'linear-gradient(135deg, #06b6d4 0%, #0ea5e9 100%)',
      'evangelism': 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
      'intercessions': 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
      'worship': 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)'
    };
    return gradients[category] || 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)';
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader translucent>
          <div className="floating-back-btn" onClick={() => history.goBack()}>
            <IonIcon icon={arrowBack} style={{ color: isDarkMode ? '#ffffff' : '#000000', fontSize: '20px' }} />
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
          <div className="floating-back-btn" onClick={() => history.goBack()}>
            <IonIcon icon={arrowBack} style={{ color: isDarkMode ? '#ffffff' : '#000000', fontSize: '20px' }} />
          </div>
          <IonToolbar className="toolbar-ios">
            <IonTitle className="title-ios">Ministry Not Found</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="md-empty">
            <IonIcon icon={informationCircle} className="md-empty-icon" />
            <h2 className="md-empty-title">Ministry Not Found</h2>
            <p className="md-empty-text">The ministry you're looking for doesn't exist.</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <IonButton fill="clear" slot="start" onClick={() => history.goBack()} style={{ marginLeft: '4px' }}>
            <IonIcon icon={arrowBack} style={{ fontSize: '22px' }} />
          </IonButton>
          <IonTitle className="title-ios" style={{ textAlign: 'left', marginLeft: '-16px' }}>Ministry Details</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
        <div className="md-page">
          {/* Hero Banner */}
          {ministry.imageUrl ? (
            <div className="md-hero">
              <div
                className="md-hero-image"
                style={{ backgroundImage: `url(${getFullUrl(ministry.imageUrl)})` }}
                onError={(e: any) => {
                  const target = e.currentTarget;
                  if (!target.dataset['triedDove']) {
                    target.dataset['triedDove'] = 'true';
                    target.style.backgroundImage = 'url(/dove.png)';
                  }
                }}
              >
                <div className="md-hero-gradient" />
                <div className="md-hero-overlay">
                  <span className="md-hero-badge" style={{ background: ministry.color + '33', color: ministry.color, borderColor: ministry.color + '44' }}>
                    {ministry.category || 'Ministry'}
                  </span>
                  <h1 className="md-hero-title">{ministry.name}</h1>
                </div>
              </div>
            </div>
          ) : (
            <div className="md-hero md-hero-gradient-only" style={{ background: getGradientForCategory(ministry.category) }}>
              <div className="md-hero-overlay">
                <span className="md-hero-badge" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}>
                  {ministry.category || 'Ministry'}
                </span>
                <h1 className="md-hero-title">{ministry.name}</h1>
              </div>
            </div>
          )}

          {/* Stat Pills */}
          <div className="md-stats">
            <div className="md-stat-pill">
              <div className="md-stat-dot" style={{ background: ministry.color }} />
              <div>
                <div className="md-stat-num" style={{ fontSize: '13px' }}>{ministry.leader || 'TBD'}</div>
                <div className="md-stat-txt">Leader</div>
              </div>
            </div>
            <div className="md-stat-pill">
              <div className="md-stat-dot" style={{ background: '#f59e0b' }} />
              <div>
                <div className="md-stat-num" style={{ fontSize: '13px' }}>{ministry.meetingInfo}</div>
                <div className="md-stat-txt">Schedule</div>
              </div>
            </div>
          </div>

          <div className="md-section">
            <div className="af-card md-share-card">
              <button type="button" className="md-share-btn" onClick={handleShare}>
                <IonIcon icon={share} />
                Share this ministry
              </button>
            </div>
          </div>

          {/* About */}
          <div className="md-section">
            <h3 className="md-section-title">About This Ministry</h3>
            <div className="af-card">
              <p className="md-description">{ministry.description}</p>
            </div>
          </div>

          {/* Meeting Info */}
          <div className="md-section">
            <h3 className="md-section-title">When We Meet</h3>
            <div className="af-card">
              <div className="md-info-row">
                <div className="md-info-icon" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(245, 158, 11, 0.06))' }}>
                  <IonIcon icon={calendar} style={{ color: '#f59e0b', fontSize: '18px' }} />
                </div>
                <div>
                  <span className="md-info-label">Schedule</span>
                  <span className="md-info-value">{ministry.meetingInfo}</span>
                </div>
              </div>
              {ministry.endTime && (
                <div className="md-info-row">
                  <div className="md-info-icon" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(99, 102, 241, 0.06))' }}>
                    <IonIcon icon={time} style={{ color: '#6366f1', fontSize: '18px' }} />
                  </div>
                  <div>
                    <span className="md-info-label">Ends At</span>
                    <span className="md-info-value">{ministry.endTime}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contact */}
          <div className="md-section">
            <h3 className="md-section-title">Contact Information</h3>
            <div className="af-card">
              <div className="md-info-row">
                <div className="md-info-icon" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(16, 185, 129, 0.06))' }}>
                  <IonIcon icon={mail} style={{ color: '#10b981', fontSize: '18px' }} />
                </div>
                <div>
                  <span className="md-info-label">Email</span>
                  <span className="md-info-value">{ministry.contact.email}</span>
                </div>
              </div>
              <div className="md-info-row">
                <div className="md-info-icon" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(139, 92, 246, 0.06))' }}>
                  <IonIcon icon={call} style={{ color: '#8b5cf6', fontSize: '18px' }} />
                </div>
                <div>
                  <span className="md-info-label">Phone</span>
                  <span className="md-info-value">{ministry.contact.phone}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="md-section">
            <button className="af-submit md-call-btn" onClick={() => window.location.href = `tel:${ministry.contact.phone}`}>
              <IonIcon icon={call} style={{ marginRight: '8px' }} />
              Call Ministry Leader
            </button>
          </div>

          {/* Footer */}
          <div className="md-footer">
            <IonText>Dove Ministries Africa</IonText>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default MinistryDetail;
