import React, { useState } from 'react';
import { IonIcon, IonBadge, IonPopover, IonList, IonItem, IonLabel, IonText, IonButton, IonAvatar } from '@ionic/react';
import { notifications, checkmarkCircle, trash, openOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';

const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications: notifList, unreadCount, markAsRead, markAllAsRead, removeNotification, clearAll } = useNotifications();
  const history = useHistory();

  const handleNotificationClick = (notification: typeof notifList[0]) => {
    markAsRead(notification.id);
    setIsOpen(false);
    if (notification.data?.url) {
      history.push(notification.data.url);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sermon': return 'play-circle';
      case 'devotion': return 'book';
      case 'event': return 'calendar';
      case 'prayer': return 'chatbubble';
      default: return 'information-circle';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'sermon': return '#6366f1';
      case 'devotion': return '#8b5cf6';
      case 'event': return '#f59e0b';
      case 'prayer': return '#10b981';
      default: return '#64748b';
    }
  };

  return (
    <>
      <style>{`
        .notification-bell-container {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        
        .notification-bell-button {
          --padding-start: 8px;
          --padding-end: 8px;
          --border-radius: 50%;
          width: 40px;
          height: 40px;
          position: relative;
        }
        
        .notification-bell-button ion-icon {
          font-size: 22px;
        }
        
        .notification-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          font-size: 11px;
          font-weight: 700;
          border-radius: 9px;
          background: #ef4444;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }
        
        .notification-popover {
          --max-width: 360px;
          --min-width: 300px;
          --max-height: 400px;
        }
        
        .notification-popover-content {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        
        .notification-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-bottom: 1px solid var(--ion-color-step-200);
        }
        
        .notification-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }
        
        .notification-list {
          flex: 1;
          overflow-y: auto;
          padding: 8px 0;
        }
        
        .notification-item {
          --padding-start: 12px;
          --padding-end: 12px;
          cursor: pointer;
          transition: background 0.2s ease;
          border-bottom: 1px solid var(--ion-color-step-100);
        }
        
        .notification-item:hover {
          background: var(--ion-color-step-50);
        }
        
        .notification-item.unread {
          background: rgba(99, 102, 241, 0.05);
        }
        
        .notification-item-content {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }
        
        .notification-type-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        
        .notification-text {
          flex: 1;
          min-width: 0;
        }
        
        .notification-title {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .notification-message {
          font-size: 13px;
          color: var(--ion-color-medium);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .notification-time {
          font-size: 11px;
          color: var(--ion-color-medium);
          margin-top: 4px;
        }
        
        .notification-actions {
          display: flex;
          gap: 8px;
          padding: 8px 16px;
          border-top: 1px solid var(--ion-color-step-200);
        }
        
        .empty-notifications {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          color: var(--ion-color-medium);
        }
        
        .empty-notifications ion-icon {
          font-size: 48px;
          margin-bottom: 16px;
          opacity: 0.5;
        }
        
        .notification-footer {
          padding: 8px 16px;
          border-top: 1px solid var(--ion-color-step-200);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        @media (prefers-color-scheme: dark) {
          .notification-item.unread {
            background: rgba(99, 102, 241, 0.1);
          }
        }
      `}</style>

      <div className="notification-bell-container">
        <IonButton
          className="notification-bell-button"
          fill="clear"
          onClick={() => setIsOpen(true)}
        >
          <IonIcon icon={notifications} />
          {unreadCount > 0 && (
            <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
          )}
        </IonButton>

        <IonPopover
          isOpen={isOpen}
          onDidDismiss={() => setIsOpen(false)}
          className="notification-popover"
          event={undefined}
        >
          <div className="notification-popover-content">
            <div className="notification-header">
              <h3>Notifications</h3>
              {unreadCount > 0 && (
                <IonButton fill="clear" size="small" onClick={markAllAsRead}>
                  <IonIcon icon={checkmarkCircle} slot="start" />
                  Mark all read
                </IonButton>
              )}
            </div>

            <div className="notification-list">
              {notifList.length === 0 ? (
                <div className="empty-notifications">
                  <IonIcon icon={notifications} />
                  <p>No notifications yet</p>
                </div>
              ) : (
                notifList.map((notification) => (
                  <div
                    key={notification.id}
                    className={`notification-item ${!notification.read ? 'unread' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notification-item-content">
                      <div
                        className="notification-type-icon"
                        style={{ background: `${getTypeColor(notification.type)}20` }}
                      >
                        <IonIcon
                          icon={getTypeIcon(notification.type)}
                          style={{ color: getTypeColor(notification.type), fontSize: '18px' }}
                        />
                      </div>
                      <div className="notification-text">
                        <div className="notification-title">{notification.title}</div>
                        <div className="notification-message">{notification.message}</div>
                        <div className="notification-time">{formatTime(notification.createdAt)}</div>
                      </div>
                      <IonButton
                        fill="clear"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notification.id);
                        }}
                        style={{ '--color': 'var(--ion-color-medium)', minWidth: '32px' }}
                      >
                        <IonIcon icon={trash} slot="icon-only" style={{ fontSize: '16px' }} />
                      </IonButton>
                    </div>
                  </div>
                ))
              )}
            </div>

            {notifList.length > 0 && (
              <div className="notification-footer">
                <IonText color="medium" style={{ fontSize: '12px' }}>
                  {unreadCount} unread
                </IonText>
                <IonButton fill="clear" size="small" color="danger" onClick={clearAll}>
                  Clear all
                </IonButton>
              </div>
            )}
          </div>
        </IonPopover>
      </div>
    </>
  );
};

export default NotificationBell;