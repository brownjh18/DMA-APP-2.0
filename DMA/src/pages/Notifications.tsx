import React, { useState, useMemo } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButton,
  IonIcon,
  IonContent,
  IonTitle,
  IonText,
  IonAlert,
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
  checkmarkDone,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';
import { usePlayer } from '../contexts/PlayerContext';
import { apiService } from '../services/api';
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
    case 'ministry':
      return '/dove.png';
    default:
      return '/Bible.JPG';
  }
}

function getNotificationThumbnailUrl(notification: any) {
  if (!notification) return undefined;
  const fields = [
    notification.thumbnailUrl,
    notification.data?.thumbnailUrl,
    notification.data?.sermon?.thumbnailUrl,
    notification.data?.podcast?.thumbnailUrl,
    notification.data?.devotion?.thumbnailUrl,
    notification.data?.event?.thumbnailUrl,
    notification.data?.event?.imageUrl,
    notification.data?.ministry?.imageUrl,
    notification.data?.ministry?.thumbnailUrl,
    notification.data?.thumbnail,
    notification.thumbnail,
  ];
  for (const value of fields) {
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }
  return undefined;
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
  onClick,
  onDelete,
}: {
  notification: any;
  onClick: () => void;
  onDelete: () => void;
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const typeMeta = getTypeMeta(notification.type, notification.contentType || notification.data?.contentType);
  const isUnread = !notification.read;
  const thumbFromData = normalizeThumbUrl(getNotificationThumbnailUrl(notification));
  const thumbnailUrl = thumbFromData || getDefaultThumb(notification.type);

  return (
    <>
      <div
        className={`am-card notif-row ${isUnread ? 'unread' : 'read'}`}
        onClick={onClick}
        style={{
          background: isUnread ? 'rgba(99,102,241,0.08)' : '#fff',
          borderLeft: isUnread ? '3px solid #6366f1' : '3px solid #e5e7eb',
        }}
      >
        <div className="notif-icon">
          <IonIcon icon={typeMeta.icon} style={{ color: typeMeta.color, fontSize: '22px' }} />
        </div>
        <div className="am-content">
          <p
            className="am-title"
            style={{
              whiteSpace: 'normal',
              lineHeight: '1.4',
              fontWeight: isUnread ? 700 : 500,
              color: isUnread ? '#1f2937' : '#6b7280',
            }}
          >
            {notification.title}
          </p>
          <p
            className="am-subtitle"
            style={{
              whiteSpace: 'normal',
              lineHeight: '1.3',
              color: isUnread ? '#374151' : '#9ca3af',
            }}
          >
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
            <img
              src={thumbnailUrl}
              alt=""
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
        <button
          className="notif-delete-btn"
          onClick={(e) => {
            e.stopPropagation();
            setShowDeleteConfirm(true);
          }}
          aria-label="Delete notification"
        >
          <IonIcon icon={trash} style={{ fontSize: '16px', color: '#9ca3af' }} />
        </button>
      </div>
      <IonAlert
        isOpen={showDeleteConfirm}
        onDidDismiss={() => setShowDeleteConfirm(false)}
        header="Delete Notification"
        message="Are you sure you want to delete this notification?"
        buttons={[
          { text: 'Cancel', role: 'cancel' },
          {
            text: 'Delete',
            role: 'destructive',
            handler: onDelete,
          },
        ]}
      />
    </>
  );
}

const Notifications: React.FC = () => {
  const history = useHistory();
  const {
    notifications: notifList,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  } = useNotifications();
  const { setCurrentSermon, setIsPlaying, setCurrentMedia } = usePlayer();

  const [filterType, setFilterType] = useState<string>('all');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

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
      if (filterType !== 'all') {
        const t = n.type || n.contentType || '';
        if (filterType === 'other') {
          if (['sermon', 'podcast', 'devotion', 'event', 'ministry'].includes(t)) return false;
        } else if (t !== filterType) {
          return false;
        }
      }
      return true;
    });
  }, [notifList, filterType]);

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

  const getNotifId = (n: any) => n._id || n.id;

  async function handleClick(n: any) {
    markAsRead(getNotifId(n));
    const { type, contentId, sermonId, podcastId, devotionId, eventId, ministryId, prayerId, url } =
      n.data || { type: n.contentType || n.type, contentId: n.contentId };
    const targetId = contentId || sermonId || podcastId || devotionId || eventId || ministryId || prayerId;
    try {
      switch (type) {
        case 'sermon':
          if (targetId) {
            const sRes = await apiService.getSermon(targetId);
            const sermonData = (sRes as any).sermon || sRes;
            setCurrentSermon({
              id: sermonData._id || sermonData.id,
              title: sermonData.title,
              description: sermonData.description || '',
              thumbnailUrl: sermonData.thumbnailUrl || sermonData.thumbnail || '/Bible.JPG',
              publishedAt: sermonData.date || sermonData.createdAt || new Date().toISOString(),
              duration: sermonData.duration || '00:00',
              viewCount: (sermonData.viewCount || 0).toString(),
            } as any);
            history.push(`/tab2?videoId=${targetId}`);
          }
          break;
        case 'podcast':
          if (targetId) {
            const pdRes = await apiService.getPodcast(targetId);
            const pd = (pdRes as any).podcast || pdRes;
            setCurrentMedia({
              id: pd._id || pd.id,
              title: pd.title,
              description: pd.description || '',
              thumbnailUrl: pd.thumbnailUrl || pd.thumbnail || '/Bible.JPG',
              publishedAt: pd.publishedAt || new Date().toISOString(),
              duration: pd.duration || '00:00',
              audioUrl: pd.audioUrl || '',
              viewCount: '0',
            });
            setIsPlaying(true);
            history.push(`/podcast-player?id=${targetId}`);
          }
          break;
        case 'devotion':
          if (targetId) history.push(`/full-devotion?id=${targetId}`);
          break;
        case 'event':
          if (targetId) history.push(`/event/${targetId}`);
          break;
        case 'ministry':
          if (targetId) history.push(`/ministry/${targetId}`);
          break;
        case 'prayer':
          history.push('/prayer');
          break;
        default:
          if (url) history.push(url);
          else history.push('/tab1');
      }
    } catch {
      if (url) history.push(url);
      else history.push('/tab1');
    }
  }

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="toolbar-ios">
          <IonButton fill="clear" slot="start" onClick={() => history.goBack()} style={{ marginLeft: '4px' }}>
            <IonIcon icon={arrowBack} style={{ fontSize: '22px' }} />
          </IonButton>
          <IonTitle className="title-ios" style={{ textAlign: 'left', marginLeft: '-16px' }}>
            Notifications
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="content-ios">
        <div className="am-page">
          {/* Filter Actions */}
          <div className="am-section">
            <div className="am-section-header">
              <h2 className="am-section-title">
                Notifications
                {unreadCount > 0 && (
                  <span
                    style={{
                      marginLeft: '8px',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#6366f1',
                    }}
                  >
                    {unreadCount} unread
                  </span>
                )}
              </h2>
              {notifList.length > 0 && (
                <div className="notif-action-row">
                  {unreadCount > 0 && (
                    <button
                      className="am-action-chip"
                      onClick={markAllAsRead}
                      style={{ '--chip-color': '#6366f1' } as React.CSSProperties}
                    >
                      <div className="am-action-icon">
                        <IonIcon icon={checkmarkDone} />
                      </div>
                      <span>Read all</span>
                    </button>
                  )}
                  <button
                    className="am-action-chip"
                    onClick={() => setShowClearConfirm(true)}
                    style={{ '--chip-color': '#ef4444' } as React.CSSProperties}
                  >
                    <div className="am-action-icon">
                      <IonIcon icon={trash} />
                    </div>
                    <span>Clear all</span>
                  </button>
                </div>
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
                  {filterType !== 'all'
                    ? `No ${filterType} notifications`
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
                            key={getNotifId(n)}
                            notification={n}
                            onClick={() => handleClick(n)}
                            onDelete={() => removeNotification(getNotifId(n))}
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

      <IonAlert
        isOpen={showClearConfirm}
        onDidDismiss={() => setShowClearConfirm(false)}
        header="Clear All Notifications"
        message="Are you sure you want to delete all notifications? This cannot be undone."
        buttons={[
          { text: 'Cancel', role: 'cancel' },
          {
            text: 'Clear All',
            role: 'destructive',
            handler: clearAll,
          },
        ]}
      />
    </IonPage>
  );
};

export default Notifications;
