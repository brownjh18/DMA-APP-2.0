import React, { useState, useEffect, useCallback } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonIcon,
  IonButton,
  IonButtons,
  IonText,
  IonLoading
} from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import {
  calendar,
  location,
  time,
  people,
  informationCircle,
  share,
  heart,
  arrowBack,
  play,
  close,
  videocam
} from 'ionicons/icons';
import { BACKEND_BASE_URL, apiService } from '../services/api';
import { useSettings } from '../contexts/SettingsContext';
import './EventDetail.css';

const getFullUrl = (url: string) => {
  if (url && url.startsWith('/uploads/')) {
    return `${BACKEND_BASE_URL}${url}`;
  }
  return url;
};

const EventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const { isDarkMode } = useSettings();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadEvent = async () => {
      try {
        const data = await apiService.getEvent(id);
        if (isMounted) {
          if (data && data.event) {
            setEvent(data.event);
          } else {
            if (isMounted) history.push('/events');
          }
        }
      } catch (error) {
        if (isMounted) history.push('/events');
      }
      if (isMounted) setLoading(false);
    };
    loadEvent();
    return () => { isMounted = false; };
  }, [id]);

  const reloadEvent = async () => {
    try {
      const data = await apiService.getEvent(id);
      if (data && data.event) setEvent(data.event);
    } catch (error) { /* ignore */ }
  };

  const handleShare = useCallback(async () => {
    const shareUrl = `${window.location.origin}/event/${id}`;
    const shareData = {
      title: event?.title || 'Event at Dove Ministries Africa',
      text: event?.title ? `Check out this event: ${event.title}` : 'Check out this event.',
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        alert('Event link copied to clipboard');
      } else {
        window.prompt('Copy this event link', shareUrl);
      }
    } catch (error) {
      console.error('Share failed', error);
    }
  }, [event?.title, id]);

  const handleRegister = async () => {
    if (!event || !event.registrationRequired) return;
    try {
      const response = await fetch(`/api/events/${id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Guest User', email: 'guest@example.com', phone: '' })
      });
      if (response.ok) { setIsRegistered(true); reloadEvent(); }
    } catch (error) { /* ignore */ }
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatEventTime = (timeString: string) => {
    if (!timeString) return 'TBD';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <IonPage>
        <IonLoading isOpen={loading} message="Loading event..." duration={10000} backdropDismiss showBackdrop />
      </IonPage>
    );
  }

  if (!event) {
    return (
      <IonPage>
        <IonHeader translucent>
          <div className="floating-back-btn" onClick={() => history.goBack()}>
            <IonIcon icon={arrowBack} style={{ color: isDarkMode ? '#ffffff' : '#000000', fontSize: '20px' }} />
          </div>
          <IonToolbar className="toolbar-ios">
            <IonTitle className="title-ios">Event Not Found</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen className="content-ios">
          <div className="af-page">
            <div className="ed-empty">
              <IonIcon icon={informationCircle} className="ed-empty-icon" />
              <h2 className="ed-empty-title">Event Not Found</h2>
              <p className="ed-empty-text">The event you're looking for doesn't exist or has been removed.</p>
            </div>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  const hasMedia = event.videoUrl || event.imageUrl;

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <IonButton fill="clear" slot="start" onClick={() => history.goBack()} style={{ marginLeft: '4px' }}>
            <IonIcon icon={arrowBack} style={{ fontSize: '22px' }} />
          </IonButton>
          <IonTitle className="title-ios" style={{ textAlign: 'left', marginLeft: '-16px' }}>Event Details</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
        <div className="ed-page">
          {/* Hero Banner */}
          {hasMedia ? (
            <div className="ed-hero">
              {event.videoUrl && showVideo ? (
                <div className="ed-hero-video-wrap">
                  <video src={event.videoUrl} controls autoPlay className="ed-hero-video" />
                  <div className="ed-video-close" onClick={() => setShowVideo(false)}>
                    <IonIcon icon={close} style={{ color: '#fff', fontSize: '18px' }} />
                  </div>
                </div>
              ) : (
                <div
                  className="ed-hero-image"
                  style={{ backgroundImage: `url(${getFullUrl(event.imageUrl || event.videoThumbnailUrl || '')})` }}
                  onClick={() => event.videoUrl && setShowVideo(true)}
                >
                  <div className="ed-hero-gradient" />
                  {event.videoUrl && (
                    <div className="ed-play-btn" onClick={(e) => { e.stopPropagation(); setShowVideo(true); }}>
                      <IonIcon icon={play} style={{ color: '#fff', fontSize: '28px', marginLeft: '3px', position: 'relative', zIndex: 1 }} />
                    </div>
                  )}
                  <div className="ed-hero-overlay">
                    <span className="ed-hero-badge">{event.category || 'Event'}</span>
                    <h1 className="ed-hero-title">{event.title}</h1>
                    <div className="ed-hero-meta">
                      <IonIcon icon={calendar} />
                      <span>{formatEventDate(event.date)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="ed-hero ed-hero-gradient-only">
              <div className="ed-hero-overlay">
                <span className="ed-hero-badge">{event.category || 'Event'}</span>
                <h1 className="ed-hero-title">{event.title}</h1>
                <div className="ed-hero-meta">
                  <IonIcon icon={calendar} />
                  <span>{formatEventDate(event.date)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Stat Pills */}
          <div className="ed-stats">
            <div className="ed-stat-pill">
              <div className="ed-stat-dot" style={{ background: '#f59e0b' }} />
              <div>
                <div className="ed-stat-num">{formatEventTime(event.time)}</div>
                <div className="ed-stat-txt">Time</div>
              </div>
            </div>
            <div className="ed-stat-pill">
              <div className="ed-stat-dot" style={{ background: '#10b981' }} />
              <div>
                <div className="ed-stat-num" style={{ fontSize: '13px' }}>{event.location || 'TBD'}</div>
                <div className="ed-stat-txt">Location</div>
              </div>
            </div>
            {event.registrationRequired && (
              <div className="ed-stat-pill">
                <div className="ed-stat-dot" style={{ background: '#8b5cf6' }} />
                <div>
                  <div className="ed-stat-num">{event.currentAttendees || 0}/{event.maxAttendees || '∞'}</div>
                  <div className="ed-stat-txt">Attendees</div>
                </div>
              </div>
            )}
          </div>

          <div className="ed-section">
            <div className="af-card ed-share-card">
              <button type="button" className="ed-share-btn" onClick={handleShare}>
                <IonIcon icon={share} />
                Share this event
              </button>
            </div>
          </div>

          {/* Registration Progress */}
          {event.registrationRequired && event.maxAttendees && (
            <div className="ed-section">
              <h3 className="ed-section-title">Registration</h3>
              <div className="af-card">
                <div className="ed-progress-header">
                  <span className="ed-progress-label">{event.currentAttendees || 0} registered</span>
                  <span className="ed-progress-label">{event.maxAttendees} spots</span>
                </div>
                <div className="ed-progress-track">
                  <div
                    className="ed-progress-fill"
                    style={{ width: `${Math.min(((event.currentAttendees || 0) / event.maxAttendees) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* About */}
          <div className="ed-section">
            <h3 className="ed-section-title">About This Event</h3>
            <div className="af-card">
              {event.description.split('\n').filter((p: string) => p.trim()).map((paragraph: string, index: number) => (
                <p key={index} className="ed-description">{paragraph.trim()}</p>
              ))}
            </div>
          </div>

          {/* Speaker */}
          {event.speaker && (
            <div className="ed-section">
              <h3 className="ed-section-title">Speaker / Organizer</h3>
              <div className="af-card ed-speaker-card">
                <div className="ed-speaker-avatar">
                  <IonIcon icon={people} style={{ color: '#6366f1', fontSize: '24px' }} />
                </div>
                <div className="ed-speaker-info">
                  <span className="ed-speaker-name">{event.speaker}</span>
                  <span className="ed-speaker-role">Speaker</span>
                </div>
              </div>
            </div>
          )}

          {/* Contact */}
          {(event.contactEmail || event.contactPhone) && (
            <div className="ed-section">
              <h3 className="ed-section-title">Contact Information</h3>
              <div className="af-card">
                {event.contactEmail && (
                  <div className="ed-contact-row">
                    <IonIcon icon={informationCircle} style={{ color: '#6366f1' }} />
                    <div>
                      <span className="ed-contact-label">Email</span>
                      <span className="ed-contact-value">{event.contactEmail}</span>
                    </div>
                  </div>
                )}
                {event.contactPhone && (
                  <div className="ed-contact-row">
                    <IonIcon icon={people} style={{ color: '#6366f1' }} />
                    <div>
                      <span className="ed-contact-label">Phone</span>
                      <span className="ed-contact-value">{event.contactPhone}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Button */}
          {event.registrationRequired && (
            <div className="ed-section">
              <button
                className="af-submit ed-register-btn"
                onClick={handleRegister}
                disabled={isRegistered || (event.maxAttendees && event.currentAttendees >= event.maxAttendees)}
                style={isRegistered ? { background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 16px rgba(16,185,129,0.3)' } : {}}
              >
                <IonIcon icon={isRegistered ? heart : people} style={{ marginRight: '8px' }} />
                {isRegistered ? 'Registered' :
                 event.maxAttendees && event.currentAttendees >= event.maxAttendees ? 'Event Full' :
                 'Register for Event'}
              </button>
            </div>
          )}

          {/* Footer */}
          <div className="ed-footer">
            <IonText>Dove Ministries Africa</IonText>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default EventDetail;
