import React, { useState, useMemo } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButton,
  IonIcon,
  IonContent,
  IonTitle,
  IonText
} from '@ionic/react';
import {
  arrowBack,
  trash,
  notifications as notificationsIcon,
  playCircle,
  book,
  calendar,
  radio,
  chatbubble,
  informationCircle
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';
import { usePlayer } from '../contexts/PlayerContext';
import { apiService, BACKEND_BASE_URL } from '../services/api';
import './AdminManager.css';
import './Notifications.css';

/* eslint-disable @typescript-eslint/no-explicit-any */

function formatTime(dateString: string) {
  const d = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffHours < 48) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getTypeMeta(type: string, contentType?: string) {
  const t = (contentType || type) as string;
  switch (t) {
    case 'sermon':
      return { icon: playCircle, label: 'Sermon', color: '#6366f1' };
    case 'podcast':
      return { icon: radio, label: 'Podcast', color: '#f59e0b' };
    case 'devotion':
      return { icon: book, label: 'Devotion', color: '#10b981' };
    case 'event':
      return { icon: calendar, label: 'Event', color: '#ec4899' };
    case 'prayer':
      return { icon: chatbubble, label: 'Prayer', color: '#3b82f6' };
    default:
      return { icon: informationCircle, label: 'General', color: '#6b7280' };
  }
}

function getDefaultThumb(type: string) {
  switch (type) {
    case 'sermon':
      return '/Bible.JPG';
    case 'podcast':
      return '/Bible.JPG';
    case 'devotion':
      return '/hero-evangelism.jpg';
    case 'event':
      return '/dove.png';
    default:
      return '/Bible.JPG';
  }
}

function normalizeThumbUrl(url?: unknown) {
  if (typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/')) return trimmed;
  return `/${trimmed}`;
}

function getYouTubeSectionLabel(createdAt: string) {
  const d = new Date(createdAt);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startYesterday = new Date(startToday);
  startYesterday.setDate(startYesterday.getDate() - 1);

  if (d >= startToday) return 'Today';
  if (d >= startYesterday && d < startToday) return 'Yesterday';

  const startThisWeek = new Date(startToday);
  const day = startThisWeek.getDay();
  const diffToMonday = (day + 6) % 7;
  startThisWeek.setDate(startThisWeek.getDate() - diffToMonday);

  if (d >= startThisWeek) return 'This week';
  return 'Earlier';
}

function NotifRow({
  notification,
  onClick
}: {
  notification: any;
  onClick: () => void;
}) {
  const typeMeta = getTypeMeta(notification.type, notification.data?.contentType);
  const isUnread = !notification.read;
  const thumbFromData = normalizeThumbUrl(notification.data?.thumbnailUrl);
  const thumbnailUrl = thumbFromData || getDefaultThumb(notification.type);

  return (
    <div className={`am-card notif-row ${isUnread ? 'unread' : ''}`} onClick={onClick}>
      <div className={`am-accent ${isUnread ? 'blue' : 'green'}`} />
      <div className="notif-icon">
        <IonIcon icon={typeMeta.icon} style={{ color: typeMeta.color, fontSize: '22px' }} />
      </div>
      <div className="am-content">
        <p className="am-title" style={{ whiteSpace: 'normal', lineHeight: '1.4' }}>
          {notification.title}
        </p>
        <p className="am-subtitle" style={{ whiteSpace: 'normal', lineHeight: '1.3' }}>
          {notification.message}
        </p>
        <div className="am-meta">
          <span className="am-meta-item">
            {formatTime(notification.createdAt)}
          </span>
          <span className="am-meta-item" style={{ color: typeMeta.color }}>
            {typeMeta.label}
          </span>
        </div>
      </div>
      {thumbnailUrl && (
        <div className="notif-thumbnail">
          <img src={thumbnailUrl} alt="" />
        </div>
      )}
    </div>
  );
}

const Notifications: React.FC = () => {
  const history = useHistory();
  const { notifications: notifList, unreadCount, markAsRead, removeNotification, clearAll } =
    useNotifications();
  const { setCurrentSermon, setIsPlaying, setCurrentMedia } = usePlayer();

  const [filterUnread, setFilterUnread] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');

  const typeFilters = [
    { value: 'all', label: 'All' },
    { value: 'sermon', label: 'Sermons' },
    { value: 'podcast', label: 'Podcasts' },
    { value: 'devotion', label: 'Devotions' },
    { value: 'event', label: 'Events' },
    { value: 'ministry', label: 'Ministry' },
    { value: 'other', label: 'Others' },
  ];

  const filtered = useMemo(() => {
    return notifList.filter((n: any) => {
      if (filterUnread && n.read) return false;
      if (filterType !== 'all') {
        const t = n.type || n.data?.type || '';
        if (filterType === 'other') {
          if (['sermon', 'podcast', 'devotion', 'event', 'ministry'].includes(t)) return false;
        } else if (t !== filterType) {
          return false;
        }
      }
      return true;
    });
  }, [notifList, filterUnread, filterType]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a: any, b: any) => {
      const ra = a.read ? 1 : 0;
      const rb = b.read ? 1 : 0;
      if (ra !== rb) return ra - rb;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [filtered]);

  const sections = useMemo(() => {
    const out: Record<string, any[]> = { Today: [], Yesterday: [], 'This week': [], Earlier: [] };
    for (const n of sorted) {
      const label = getYouTubeSectionLabel(n.createdAt);
      out[label] = out[label] || [];
      out[label].push(n);
    }
    return out;
  }, [sorted]);

  const totalUnread = notifList.filter((n: any) => !n.read).length;

  async function handleClick(n: any) {
    markAsRead(n.id);
    const { type, sermonId, podcastId, devotionId, eventId, ministryId, prayerId, url } = n.data || {};
    try {
      switch (type) {
        case 'sermon':
          if (sermonId) {
            const sRes = await apiService.getSermon(sermonId);
            const sermonData = (sRes as any).sermon || sRes;
            setCurrentSermon({
              id: sermonData._id || sermonData.id,
              title: sermonData.title,
              description: sermonData.description || '',
              thumbnailUrl: sermonData.thumbnailUrl || sermonData.thumbnail || '/Bible.JPG',
              publishedAt: sermonData.date || sermonData.createdAt || new Date().toISOString(),
              duration: sermonData.duration || '00:00',
              viewCount: (sermonData.viewCount || 0).toString()
            } as any);
            history.push(`/tab2?videoId=${sermonId}`);
          }
          break;
        case 'podcast':
          if (podcastId) {
            const pdRes = await apiService.getPodcast(podcastId);
            const pd = (pdRes as any).podcast || pdRes;
            setCurrentMedia({
              id: pd._id || pd.id,
              title: pd.title,
              description: pd.description || '',
              thumbnailUrl: pd.thumbnailUrl || pd.thumbnail || '/Bible.JPG',
              publishedAt: pd.publishedAt || new Date().toISOString(),
              duration: pd.duration || '00:00',
              audioUrl: pd.audioUrl || '',
              viewCount: '0'
            });
            setIsPlaying(true);
            history.push('/podcast-player');
          }
          break;
        case 'devotion':
          if (devotionId) history.push(`/full-devotion?id=${devotionId}`);
          break;
        case 'event':
          if (eventId) history.push(`/event-detail?id=${eventId}`);
          break;
        case 'ministry':
          if (ministryId) history.push(`/ministry-detail?id=${ministryId}`);
          break;
        case 'prayer':
          if (prayerId) history.push('/prayer-request');
          break;
        default:
          if (url) history.push(url);
          else history.push('/tab1');
      }
    } catch {
      history.push('/tab1');
    }
  }

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <IonButton fill="clear" slot="start" onClick={() => history.goBack()} style={{ marginLeft: '4px' }}>
            <IonIcon icon={arrowBack} style={{ fontSize: '22px' }} />
          </IonButton>
          <IonTitle className="title-ios" style={{ textAlign: 'left', marginLeft: '-16px' }}>Notifications</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
        <div className="am-page">

          {/* Filter Actions */}
          <div className="am-section">
            <div className="am-section-header">
              <h2 className="am-section-title">Notifications</h2>
              {notifList.length > 0 && (
                <button
                  className="am-action-chip"
                  onClick={clearAll}
                  style={{ '--chip-color': '#ef4444' } as React.CSSProperties}
                >
                  <div className="am-action-icon">
                    <IonIcon icon={trash} />
                  </div>
                  <span>Clear all</span>
                </button>
              )}
            </div>
            <div className="notif-filters-scroll">
              <div className="notif-filters-bar">
                {typeFilters.map((f) => (
                  <button
                    key={f.value}
                    className={`notif-filter-btn ${filterType === f.value ? 'active' : ''}`}
                    onClick={() => setFilterType(f.value)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Notification List */}
          <div className="am-section">
            {sorted.length === 0 ? (
              <div className="am-empty">
                <IonIcon icon={notificationsIcon} />
                <p className="am-empty-title">All caught up</p>
                <p className="am-empty-text">
                  {filterUnread
                    ? 'No unread notifications'
                    : 'No notifications yet. New content will appear here.'}
                </p>
              </div>
            ) : (
              <>
                {Object.entries(sections).map(([label, notifs]) =>
                  notifs.length > 0 ? (
                    <div key={label} className="notif-section">
                      <div className="notif-section-header">
                        <span className="notif-section-label">{label}</span>
                        <span className="am-stat-txt">{notifs.length}</span>
                      </div>
                      <div className="am-list">
                        {notifs.map((n: any) => (
                          <NotifRow
                            key={n.id}
                            notification={n}
                            onClick={() => handleClick(n)}
                          />
                        ))}
                      </div>
                    </div>
                  ) : null
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="am-footer">
            <IonText>Dove Church &bull; Admin Panel v2.0</IonText>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Notifications;
