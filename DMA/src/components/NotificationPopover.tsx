import React from 'react';
import {
  IonIcon,
  IonButton,
  IonBadge,
  IonList,
  IonItem,
  IonLabel,
  IonText,
  IonPopover,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons
} from '@ionic/react';
import {
  notifications as notificationsIcon,
  close,
  playCircle,
  calendar,
  book,
  radio,
  people,
  newspaper,
  checkmarkDone,
  trash
} from 'ionicons/icons';
import { useNotifications, NotificationItem } from '../contexts/NotificationContext';

const NotificationPopover: React.FC = () => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    isOpen,
    setIsOpen
  } = useNotifications();

  const getIconForType = (type: NotificationItem['type']) => {
    switch (type) {
      case 'sermon': return playCircle;
      case 'event': return calendar;
      case 'devotion': return book;
      case 'podcast': return radio;
      case 'ministry': return people;
      case 'news': return newspaper;
      default: return notificationsIcon;
    }
  };

  const getColorForType = (type: NotificationItem['type']) => {
    switch (type) {
      case 'sermon': return '#667eea';
      case 'event': return '#f0932b';
      case 'devotion': return '#6c5ce7';
      case 'podcast': return '#a29bfe';
      case 'ministry': return '#fd79a8';
      case 'news': return '#00b894';
      default: return '#636e72';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <>
      {/* Notification Bell Button */}
      <div style={{
        position: 'fixed',
        top: '50px', // Position below the status bar/safe area
        right: '10px',
        zIndex: 1000
      }}>
        <IonButton
          fill="clear"
          onClick={() => setIsOpen(true)}
          style={{
            position: 'relative',
            '--padding-start': '12px',
            '--padding-end': '12px',
            '--padding-top': '8px',
            '--padding-bottom': '8px',
            background: 'rgba(var(--ion-background-color-rgb), 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '50%',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}
        >
          <IonIcon
            icon={notificationsIcon}
            style={{
              fontSize: '20px',
              color: 'var(--ion-text-color)'
            }}
          />
          {unreadCount > 0 && (
            <IonBadge
              style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                background: '#ef4444',
                color: 'white',
                fontSize: '10px',
                minWidth: '18px',
                height: '18px',
                borderRadius: '9px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold'
              }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </IonBadge>
          )}
        </IonButton>
      </div>

      {/* Notification Popover */}
      <IonPopover
        isOpen={isOpen}
        onDidDismiss={() => setIsOpen(false)}
        style={{
          '--width': '350px',
          '--max-height': '500px'
        }}
      >
        <IonHeader>
          <IonToolbar>
            <IonTitle>Notifications</IonTitle>
            <IonButtons slot="end">
              {notifications.length > 0 && (
                <IonButton
                  fill="clear"
                  size="small"
                  onClick={markAllAsRead}
                  style={{ fontSize: '12px' }}
                >
                  <IonIcon icon={checkmarkDone} slot="start" />
                  Mark all read
                </IonButton>
              )}
              <IonButton
                fill="clear"
                onClick={() => setIsOpen(false)}
              >
                <IonIcon icon={close} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonContent>
          {notifications.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: 'var(--ion-color-medium)'
            }}>
              <IonIcon
                icon={notificationsIcon}
                style={{
                  fontSize: '3em',
                  marginBottom: '16px',
                  opacity: 0.5
                }}
              />
              <p>No notifications yet</p>
              <p style={{ fontSize: '0.9em', marginTop: '8px' }}>
                New content will appear here
              </p>
            </div>
          ) : (
            <IonList style={{ padding: 0 }}>
              {notifications.map((notification) => (
                <IonItem
                  key={notification.id}
                  style={{
                    '--padding-start': '16px',
                    '--padding-end': '16px',
                    '--padding-top': '12px',
                    '--padding-bottom': '12px',
                    background: notification.read ? 'transparent' : 'rgba(var(--ion-color-primary-rgb), 0.05)',
                    borderLeft: notification.read ? 'none' : `3px solid ${getColorForType(notification.type)}`
                  }}
                  button
                  onClick={() => {
                    if (!notification.read) {
                      markAsRead(notification.id);
                    }
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    width: '100%'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: getColorForType(notification.type),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <IonIcon
                        icon={getIconForType(notification.type)}
                        style={{
                          fontSize: '16px',
                          color: 'white'
                        }}
                      />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <IonLabel style={{
                        fontWeight: notification.read ? 'normal' : '600',
                        marginBottom: '4px'
                      }}>
                        {notification.title}
                      </IonLabel>
                      <IonText
                        color="medium"
                        style={{
                          fontSize: '0.9em',
                          lineHeight: '1.4',
                          display: 'block',
                          marginBottom: '4px'
                        }}
                      >
                        {notification.message}
                      </IonText>
                      <IonText
                        color="medium"
                        style={{
                          fontSize: '0.8em'
                        }}
                      >
                        {formatTime(notification.timestamp)}
                      </IonText>
                    </div>

                    <IonButton
                      fill="clear"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearNotification(notification.id);
                      }}
                      style={{
                        '--padding-start': '8px',
                        '--padding-end': '8px',
                        flexShrink: 0
                      }}
                    >
                      <IonIcon
                        icon={trash}
                        style={{
                          fontSize: '16px',
                          color: 'var(--ion-color-danger)'
                        }}
                      />
                    </IonButton>
                  </div>
                </IonItem>
              ))}

              {notifications.length > 0 && (
                <div style={{
                  padding: '16px',
                  textAlign: 'center',
                  borderTop: '1px solid var(--ion-color-step-200)'
                }}>
                  <IonButton
                    fill="clear"
                    size="small"
                    onClick={clearAllNotifications}
                    style={{
                      color: 'var(--ion-color-danger)',
                      fontSize: '0.9em'
                    }}
                  >
                    <IonIcon icon={trash} slot="start" />
                    Clear all notifications
                  </IonButton>
                </div>
              )}
            </IonList>
          )}
        </IonContent>
      </IonPopover>
    </>
  );
};

export default NotificationPopover;