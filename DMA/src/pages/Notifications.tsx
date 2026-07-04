import React, { useState, useMemo } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButton,
  IonIcon,
  IonChip,
  IonContent,
  IonTitle
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
  informationCircle,
  chevronForward,
  ellipsisVertical
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';
import { usePlayer } from '../contexts/PlayerContext';
import { apiService } from '../services/api';
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
      return { icon: playCircle, label: 'Sermon', badgeClass: 'type-sermon', color: '#6366f1' };
    case 'podcast':
      return { icon: radio, label: 'Podcast', badgeClass: 'type-podcast', color: '#f59e0b' };
    case 'devotion':
      return { icon: book, label: 'Devotion', badgeClass: 'type-devotion', color: '#10b981' };
    case 'event':
      return { icon: calendar, label: 'Event', badgeClass: 'type-event', color: '#ec4899' };
    case 'prayer':
      return { icon: chatbubble, label: 'Prayer', badgeClass: 'type-prayer', color: '#3b82f6' };
    default:
      return { icon: informationCircle, label: 'General', badgeClass: 'type-general', color: '#6b7280' };
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

/**
 * Thumbnails coming from the backend may be:
 * - absolute URLs
 * - already-rooted paths: "/uploads/x.jpg"
 * - relative-ish paths: "uploads/x.jpg" or "assets/x.jpg"
 * Normalize so <img src> always points to a valid URL.
 */
function normalizeThumbUrl(url?: unknown) {
  if (typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/')) return trimmed;

  // Treat other strings as relative to the site root
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
  const day = startThisWeek.getDay(); // 0=Sun..6=Sat
  const diffToMonday = (day + 6) % 7; // monday as start
  startThisWeek.setDate(startThisWeek.getDate() - diffToMonday);

  if (d >= startThisWeek) return 'This week';
  return 'Earlier';
}

function NotifRow({
  notification,
  onClick,
  onRemove
}: {
  notification: any;
  onClick: () => void;
  onRemove: (id: string) => void;
}) {
  const typeMeta = getTypeMeta(notification.type, notification.data?.contentType);
  const isUnread = !notification.read;
  const thumbFromData = normalizeThumbUrl(notification.data?.thumbnailUrl);
  const thumbnailUrl = thumbFromData || getDefaultThumb(notification.type);

  return (
    <div className={`notif-row ${isUnread ? 'unread' : ''}`} onClick={onClick}>
      <div className="notif-icon">
        <IonIcon icon={typeMeta.icon} style={{ color: typeMeta.color }} />
      </div>
      <div className="notif-body">
        <p className="notif-message">
          <span className="notif-title">{notification.title}:</span> {notification.message}
        </p>
        <span className="notif-time">{formatTime(notification.createdAt)}</span>
      </div>
      <div className="notif-thumbnail">
        {thumbnailUrl && <img src={thumbnailUrl} alt="Notification thumbnail" />}
      </div>
    </div>
  );
}

function SectionHeader({
  label,
  unreadCount,
  filterUnread,
  onSetFilter,
  onClearAll,
  showClear
}: {
  label: string;
  unreadCount: number;
  filterUnread: boolean;
  onSetFilter: (filter: boolean) => void;
  onClearAll: () => void;
  showClear: boolean;
}) {
  return (
    <div className="section-divider">
      <div className="section-header-left">
        <span className="section-label">{label}</span>
        {unreadCount > 0 && <IonChip className="notif-count-chip">{unreadCount}</IonChip>}
      </div>
      <div className="notif-filters">
        <button
          className={`filter-button ${!filterUnread ? 'filter-active' : ''}`}
          onClick={() => onSetFilter(false)}
        >
          All
        </button>
        <button
          className={`filter-button ${filterUnread ? 'filter-active' : ''}`}
          onClick={() => onSetFilter(true)}
        >
          Unread
        </button>
        {showClear && (
          <button className="filter-button clear-button" onClick={onClearAll}>
            <IonIcon icon={trash} />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

const Notifications: React.FC = () => {
  const history = useHistory();
  const { notifications: notifList, unreadCount, markAsRead, removeNotification, clearAll } =
    useNotifications();
  const { setCurrentSermon, setIsPlaying, setCurrentMedia } = usePlayer();

  const [filterUnread, setFilterUnread] = useState(false);

  const filtered = useMemo(() => {
    return notifList.filter((n: any) => {
      if (filterUnread && n.read) return false;
      return true;
    });
  }, [notifList, filterUnread]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a: any, b: any) => {
      const ra = a.read ? 1 : 0;
      const rb = b.read ? 1 : 0;
      if (ra !== rb) return ra - rb; // unread first
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

  if (sorted.length === 0) {
    return (
      <IonPage className="notifications-page">
        <IonHeader translucent>
          <IonToolbar>
            <IonButton fill="clear" slot="start" onClick={() => history.goBack()}>
              <IonIcon icon={arrowBack} />
            </IonButton>
            <IonTitle>Notifications</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen>
          <div className="yt-empty">
            <div className="yt-empty-icon">
              <IonIcon icon={notificationsIcon} />
            </div>
            <h2>All caught up</h2>
            <p>No notifications yet. New content will appear here.</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage className="notifications-page">
      <IonHeader translucent>
        <IonToolbar>
          <IonButton fill="clear" slot="start" onClick={() => history.goBack()}>
            <IonIcon icon={arrowBack} />
          </IonButton>

          <IonTitle>Notifications</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="notifications-page">
        <div className="notif-container">
          {Object.entries(sections).map(([label, notifs]) =>
            notifs.length > 0 ? (
              <div key={label} className="notif-section">
                <SectionHeader
                  label={label}
                  unreadCount={label === 'Today' ? unreadCount : 0}
                  filterUnread={filterUnread}
                  onSetFilter={setFilterUnread}
                  onClearAll={clearAll}
                  showClear={notifList.length > 0 && label === 'Today'}
                />
                <div className="notif-list">
                  {notifs.map((n: any) => (
                    <NotifRow
                      key={n.id}
                      notification={n}
                      onClick={() => handleClick(n)}
                      onRemove={removeNotification}
                    />
                  ))}
                </div>
              </div>
            ) : null
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Notifications;