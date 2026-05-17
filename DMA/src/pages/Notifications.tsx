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
  checkmarkCircle,
  trash,
  notifications as notificationsIcon,
  playCircle,
  book,
  calendar,
  radio,
  chatbubble,
  informationCircle,
  chevronForward
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
      return { icon: playCircle, label: 'Sermon', badgeClass: 'type-sermon', mediaClass: 'th-sermon' };
    case 'podcast':
      return { icon: radio, label: 'Podcast', badgeClass: 'type-podcast', mediaClass: 'th-podcast' };
    case 'devotion':
      return { icon: book, label: 'Devotion', badgeClass: 'type-devotion', mediaClass: 'th-devotion' };
    case 'event':
      return { icon: calendar, label: 'Event', badgeClass: 'type-event', mediaClass: 'th-event' };
    case 'prayer':
      return { icon: chatbubble, label: 'Prayer', badgeClass: 'type-prayer', mediaClass: 'th-prayer' };
    default:
      return { icon: informationCircle, label: 'General', badgeClass: 'type-general', mediaClass: 'th-general' };
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
  onMarkRead,
  onRemove
}: {
  notification: any;
  onClick: () => void;
  onMarkRead: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const typeMeta = getTypeMeta(notification.type, notification.data?.contentType);
  const thumbRaw =
    notification.data?.thumbnailUrl ?? notification.data?.thumbnail;
  const thumb =
    normalizeThumbUrl(thumbRaw) || getDefaultThumb(notification.type);
  const isUnread = !notification.read;

  return (
    <div
      className={`yt-notif-row ${isUnread ? 'unread' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onClick();
      }}
    >
      {isUnread ? <div className="yt-unread-dot" /> : <div className="yt-unread-dot yt-dot-muted" />}

      <div className="yt-left">
        <div className="yt-type-avatar" aria-hidden="true">
          <IonIcon icon={typeMeta.icon} />
        </div>
      </div>

      <div className="yt-main">
        <div className="yt-title-line">
          <span className="yt-title">{notification.title}</span>
          <span className={`yt-badge ${typeMeta.badgeClass}`}>{typeMeta.label}</span>
        </div>
        <div className="yt-message">{notification.message}</div>

        <div className="yt-meta">
          <span className="yt-time">{formatTime(notification.createdAt)}</span>

          {isUnread && (
            <span className="yt-actions">
              <button
                className="yt-meta-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkRead(notification.id);
                }}
                title="Mark read"
              >
                <IonIcon icon={checkmarkCircle} />
              </button>
              <button
                className="yt-meta-btn danger"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(notification.id);
                }}
                title="Delete"
              >
                <IonIcon icon={trash} />
              </button>
            </span>
          )}

          {thumb && (
            <span className="yt-chevron" aria-hidden="true">
              <IonIcon icon={chevronForward} />
            </span>
          )}
        </div>
      </div>

      {thumb && (
        <div className="yt-thumb" aria-hidden="true">
          <img
            src={thumb}
            alt=""
            loading="lazy"
            decoding="async"
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              const fallback = getDefaultThumb(notification.type);
              if (!img.dataset.retried) {
                img.dataset.retried = 'true';
                img.src = fallback;
              }
            }}
          />
        </div>
      )}
    </div>
  );
}

function SectionHeader({ label }: { label: string }) {
  return <div className="yt-section-header">{label}</div>;
}

const Notifications: React.FC = () => {
  const history = useHistory();
  const { notifications: notifList, unreadCount, markAsRead, markAllAsRead, removeNotification, clearAll } =
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

          <IonTitle style={{ fontSize: '18px' }}>Notifications</IonTitle>

          <div slot="end" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {unreadCount > 0 && <IonChip color="primary" className="yt-unread-chip">{unreadCount} new</IonChip>}
            <IonButton fill="clear" size="small" onClick={markAllAsRead} title="Mark all read">
              <IonIcon icon={checkmarkCircle} />
            </IonButton>
            <IonButton fill="clear" size="small" color="danger" onClick={clearAll} title="Clear all">
              <IonIcon icon={trash} />
            </IonButton>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <div className="yt-card">
          <div className="yt-toolbar">
            <div className="yt-filter-row">
              <button
                className={`yt-filter-btn ${!filterUnread ? 'active' : ''}`}
                onClick={() => setFilterUnread(false)}
              >
                All ({notifList.length})
              </button>
              <button
                className={`yt-filter-btn ${filterUnread ? 'active' : ''}`}
                onClick={() => setFilterUnread(true)}
              >
                Unread ({unreadCount})
              </button>
            </div>
          </div>


          <div className="yt-list">
            {sections.Today.length > 0 && (
              <>
                <SectionHeader label="Today" />
                {sections.Today.map((n: any) => (
                  <NotifRow
                    key={n.id}
                    notification={n}
                    onClick={() => handleClick(n)}
                    onMarkRead={markAsRead}
                    onRemove={removeNotification}
                  />
                ))}
              </>
            )}

            {sections.Yesterday.length > 0 && (
              <>
                <SectionHeader label="Yesterday" />
                {sections.Yesterday.map((n: any) => (
                  <NotifRow
                    key={n.id}
                    notification={n}
                    onClick={() => handleClick(n)}
                    onMarkRead={markAsRead}
                    onRemove={removeNotification}
                  />
                ))}
              </>
            )}

            {sections['This week'].length > 0 && (
              <>
                <SectionHeader label="This week" />
                {sections['This week'].map((n: any) => (
                  <NotifRow
                    key={n.id}
                    notification={n}
                    onClick={() => handleClick(n)}
                    onMarkRead={markAsRead}
                    onRemove={removeNotification}
                  />
                ))}
              </>
            )}

            {sections.Earlier.length > 0 && (
              <>
                <SectionHeader label="Earlier" />
                {sections.Earlier.map((n: any) => (
                  <NotifRow
                    key={n.id}
                    notification={n}
                    onClick={() => handleClick(n)}
                    onMarkRead={markAsRead}
                    onRemove={removeNotification}
                  />
                ))}
              </>
            )}
          </div>
        </div>
      </IonContent>

      <style>{`
        .notifications-page { --ion-background-color: transparent; }

        /* YouTube-ish container */
        .yt-card{
          max-width: 720px;
          margin: 10px auto;
          background: var(--yt-card-bg, rgba(255,255,255,0.98));
          border-radius: 18px;
          box-shadow: var(--yt-card-shadow, 0 10px 38px rgba(16,24,40,0.08));
          overflow: hidden;
        }

        /* Header toolbar */
        .yt-toolbar{
          padding: 12px 14px 4px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .yt-filter-row{
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .yt-filter-btn{
          border: 1px solid var(--yt-border-color, rgba(0,0,0,0.07));
          background: var(--yt-btn-bg, #fff);
          border-radius: 999px;
          padding: 8px 14px;
          font-weight: 700;
          font-size: 12px;
          color: var(--yt-text-secondary, rgba(0,0,0,0.70));
          cursor: pointer;
        }
        .yt-filter-btn.active{
          background: var(--yt-active-bg, #111827);
          border-color: var(--yt-active-border, #111827);
          color: var(--yt-active-text, #fff);
        }


        /* Sections */
        .yt-section-header{
          padding: 10px 16px 8px;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: .06em;
          color: var(--yt-section-text, rgba(0,0,0,0.55));
          text-transform: uppercase;
          background: var(--yt-section-bg, #fafafa);
          border-top: 1px solid var(--yt-border-color, rgba(0,0,0,0.04));
          position: sticky;
          top: 0;
          z-index: 1;
        }

        /* Notification rows (compact, like YouTube) */
        .yt-list{ padding: 0; }
        .yt-notif-row{
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border-bottom: 1px solid var(--yt-border-color, rgba(0,0,0,0.04));
          cursor: pointer;
          background: var(--yt-row-bg, #fff);
          position: relative;
        }
        .yt-notif-row:hover{ background: var(--yt-row-hover, rgba(0,0,0,0.02)); }
        .yt-notif-row:focus-visible{ outline: 2px solid var(--primary-color, #2563eb); outline-offset: -2px; }

        .yt-unread-dot{
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: var(--primary-color, #2563eb);
          flex-shrink: 0;
        }
        .yt-dot-muted{ background: transparent; border: 1px solid var(--yt-dot-muted-border, rgba(0,0,0,0.15)); }

        .yt-left{ display:flex; align-items:center; justify-content:center; }
        .yt-type-avatar{
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display:flex;
          align-items:center;
          justify-content:center;
          color: var(--yt-avatar-color, #111827);
          background: var(--yt-avatar-bg, #f3f4f6);
          border: 1px solid var(--yt-border-color, rgba(0,0,0,0.06));
        }

        .yt-main{ flex: 1; min-width: 0; display:flex; flex-direction:column; gap: 4px; }

        .yt-title-line{ display:flex; align-items:center; gap: 8px; min-width: 0; }
        .yt-title{
          font-size: 14px;
          font-weight: 900;
          color: var(--yt-title-color, rgba(0,0,0,0.86));
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .yt-notif-row.unread .yt-title{ color: var(--yt-title-unread, rgba(0,0,0,0.95)); }

        .yt-badge{
          flex-shrink: 0;
          font-size: 11px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 999px;
          border: 1px solid var(--yt-badge-border, rgba(0,0,0,0.06));
        }
        .yt-badge.type-sermon{ background: rgba(245,158,11,0.18); color: #92400e; }
        .yt-badge.type-podcast{ background: rgba(99,102,241,0.18); color: #3730a3; }
        .yt-badge.type-devotion{ background: rgba(59,130,246,0.14); color: #1e40af; }
        .yt-badge.type-event{ background: rgba(16,185,129,0.14); color: #065f46; }
        .yt-badge.type-prayer{ background: rgba(236,72,153,0.14); color: #9d174d; }
        .yt-badge.type-general{ background: rgba(107,114,128,0.14); color: #374151; }

        .yt-message{
          font-size: 12.5px;
          color: var(--yt-message-color, rgba(0,0,0,0.62));
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .yt-meta{
          display:flex;
          align-items:center;
          gap: 10px;
        }
        .yt-time{
          font-size: 11px;
          font-weight: 700;
          color: var(--yt-time-color, rgba(0,0,0,0.50));
        }
        .yt-actions{ display:flex; gap: 6px; align-items:center; }
        .yt-meta-btn{
          border: none;
          background: var(--yt-btn-bg-secondary, rgba(0,0,0,0.04));
          border-radius: 10px;
          width: 30px;
          height: 30px;
          display:flex;
          align-items:center;
          justify-content:center;
          cursor: pointer;
          color: var(--yt-icon-color, rgba(0,0,0,0.65));
        }
        .yt-meta-btn:hover{ background: var(--yt-btn-hover, rgba(0,0,0,0.07)); }
        .yt-meta-btn.danger{ color: #ef4444; }

        .yt-chevron{
          margin-left: auto;
          color: var(--yt-chevron-color, rgba(0,0,0,0.45));
          display:flex;
          align-items:center;
          justify-content:center;
          width: 26px;
          height: 26px;
          border-radius: 13px;
          background: var(--yt-chevron-bg, rgba(0,0,0,0.03));
        }

        .yt-thumb{
          width: 56px;
          height: 56px;
          border-radius: 16px;
          overflow:hidden;
          background:var(--yt-thumb-bg, #f3f4f6);
          border: 1px solid var(--yt-border-color, rgba(0,0,0,0.05));
          flex-shrink: 0;
        }
        .yt-thumb img{
          width:100%;
          height:100%;
          object-fit: cover;
          object-position: center;
          display:block;
          background:var(--yt-thumb-bg, #f3f4f6);
        }

        .yt-empty{
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          height: calc(100vh - 200px);
          gap: 12px;
          text-align: center;
          padding: 24px;
        }
        .yt-empty-icon{
          width: 86px; height: 86px;
          border-radius: 50%;
          background: var(--yt-empty-icon-bg, #f3f4f6);
          display:flex; align-items:center; justify-content:center;
          font-size: 36px;
          color: var(--yt-empty-icon-color, rgba(0,0,0,0.55));
        }
        .yt-empty h2{ margin:0; font-size:20px; font-weight:900; color: var(--yt-empty-title, rgba(0,0,0,0.86)); }
        .yt-empty p{ margin:0; font-size:14px; color: var(--yt-empty-text, rgba(0,0,0,0.60)); }

        /* responsive */
        @media (max-width: 480px){
          .yt-thumb{ width: 48px; height: 48px; border-radius: 14px; }
          .yt-type-avatar{ width: 40px; height: 40px; border-radius: 12px; }
          .yt-notif-row{ padding: 11px 12px; gap: 10px; }
          .yt-title{ font-size: 13px; }
          .yt-message{ font-size: 12px; }
        }

        /* Dark mode styles */
        [data-theme="dark"] .yt-card,
        @media (prefers-color-scheme: dark) :root:not([data-theme="light"]) .yt-card {
          --yt-card-bg: rgba(30, 41, 59, 0.98);
          --yt-card-shadow: 0 10px 38px rgba(0, 0, 0, 0.3);
        }

        [data-theme="dark"] .yt-filter-btn,
        @media (prefers-color-scheme: dark) :root:not([data-theme="light"]) .yt-filter-btn {
          --yt-border-color: rgba(255, 255, 255, 0.1);
          --yt-btn-bg: #1e293b;
          --yt-text-secondary: rgba(241, 245, 249, 0.7);
        }

        [data-theme="dark"] .yt-filter-btn.active,
        @media (prefers-color-scheme: dark) :root:not([data-theme="light"]) .yt-filter-btn.active {
          --yt-active-bg: #6366f1;
          --yt-active-border: #6366f1;
          --yt-active-text: #fff;
        }

        [data-theme="dark"] .yt-section-header,
        @media (prefers-color-scheme: dark) :root:not([data-theme="light"]) .yt-section-header {
          --yt-section-text: rgba(241, 245, 249, 0.6);
          --yt-section-bg: #1a1f2c;
          --yt-border-color: rgba(255, 255, 255, 0.08);
        }

        [data-theme="dark"] .yt-notif-row,
        @media (prefers-color-scheme: dark) :root:not([data-theme="light"]) .yt-notif-row {
          --yt-row-bg: #1e293b;
          --yt-row-hover: rgba(255, 255, 255, 0.03);
        }

        [data-theme="dark"] .yt-notif-row:hover,
        @media (prefers-color-scheme: dark) :root:not([data-theme="light"]) .yt-notif-row:hover {
          --yt-row-bg: rgba(255, 255, 255, 0.05);
        }

        [data-theme="dark"] .yt-dot-muted,
        @media (prefers-color-scheme: dark) :root:not([data-theme="light"]) .yt-dot-muted {
          --yt-dot-muted-border: rgba(255, 255, 255, 0.2);
        }

        [data-theme="dark"] .yt-type-avatar,
        @media (prefers-color-scheme: dark) :root:not([data-theme="light"]) .yt-type-avatar {
          --yt-avatar-color: #f1f5f9;
          --yt-avatar-bg: #334155;
          --yt-border-color: rgba(255, 255, 255, 0.1);
        }

        [data-theme="dark"] .yt-title,
        @media (prefers-color-scheme: dark) :root:not([data-theme="light"]) .yt-title {
          --yt-title-color: rgba(241, 245, 249, 0.86);
          --yt-title-unread: rgba(241, 245, 249, 0.95);
        }

        [data-theme="dark"] .yt-message,
        @media (prefers-color-scheme: dark) :root:not([data-theme="light"]) .yt-message {
          --yt-message-color: rgba(241, 245, 249, 0.62);
        }

        [data-theme="dark"] .yt-time,
        @media (prefers-color-scheme: dark) :root:not([data-theme="light"]) .yt-time {
          --yt-time-color: rgba(241, 245, 249, 0.5);
        }

        [data-theme="dark"] .yt-meta-btn,
        @media (prefers-color-scheme: dark) :root:not([data-theme="light"]) .yt-meta-btn {
          --yt-btn-bg-secondary: rgba(255, 255, 255, 0.1);
          --yt-btn-hover: rgba(255, 255, 255, 0.15);
          --yt-icon-color: rgba(241, 245, 249, 0.65);
        }

        [data-theme="dark"] .yt-chevron,
        @media (prefers-color-scheme: dark) :root:not([data-theme="light"]) .yt-chevron {
          --yt-chevron-color: rgba(241, 245, 249, 0.45);
          --yt-chevron-bg: rgba(255, 255, 255, 0.05);
        }

        [data-theme="dark"] .yt-thumb,
        @media (prefers-color-scheme: dark) :root:not([data-theme="light"]) .yt-thumb {
          --yt-thumb-bg: #334155;
          --yt-border-color: rgba(255, 255, 255, 0.1);
        }

        [data-theme="dark"] .yt-empty-icon,
        @media (prefers-color-scheme: dark) :root:not([data-theme="light"]) .yt-empty-icon {
          --yt-empty-icon-bg: #334155;
          --yt-empty-icon-color: rgba(241, 245, 249, 0.55);
        }

        [data-theme="dark"] .yt-empty h2,
        @media (prefers-color-scheme: dark) :root:not([data-theme="light"]) .yt-empty h2 {
          --yt-empty-title: rgba(241, 245, 249, 0.86);
        }

        [data-theme="dark"] .yt-empty p,
        @media (prefers-color-scheme: dark) :root:not([data-theme="light"]) .yt-empty p {
          --yt-empty-text: rgba(241, 245, 249, 0.6);
        }
      `}</style>
    </IonPage>
  );
};

export default Notifications;
