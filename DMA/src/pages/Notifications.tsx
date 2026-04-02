import React from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonButton,
  IonText,
  IonNote,
} from '@ionic/react';
import { arrowBack, checkmarkCircle, trash } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';

const Notifications: React.FC = () => {
  const history = useHistory();
  const { notifications: notifList, unreadCount, markAsRead, markAllAsRead, removeNotification, clearAll } = useNotifications();

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

  const handleNotificationClick = (notification: typeof notifList[0]) => {
    markAsRead(notification.id);
    if (notification.data?.url) {
      history.push(notification.data.url);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButton fill="clear" slot="start" onClick={() => history.goBack()}>
            <IonIcon icon={arrowBack} />
          </IonButton>
          <IonTitle>Notifications</IonTitle>
          {unreadCount > 0 && (
            <IonButton fill="clear" slot="end" onClick={markAllAsRead}>
              <IonIcon icon={checkmarkCircle} slot="start" />
              Mark all read
            </IonButton>
          )}
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {notifList.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '80%',
            padding: '40px',
            textAlign: 'center',
          }}>
            <IonIcon
              icon="notifications"
              style={{
                fontSize: '64px',
                color: 'var(--ion-color-medium)',
                opacity: 0.3,
                marginBottom: '20px',
              }}
            />
            <h2 style={{ margin: '0 0 8px 0', color: 'var(--ion-text-color)' }}>No Notifications</h2>
            <p style={{ margin: 0, color: 'var(--ion-color-medium)', fontSize: '14px' }}>
              You don't have any notifications yet. They'll appear here when you get new updates.
            </p>
          </div>
        ) : (
          <>
            <div style={{
              padding: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid var(--ion-color-step-200)',
            }}>
              <IonText color="medium" style={{ fontSize: '14px' }}>
                {unreadCount} unread out of {notifList.length} total
              </IonText>
              <IonButton fill="clear" size="small" color="danger" onClick={clearAll}>
                <IonIcon icon={trash} slot="start" />
                Clear all
              </IonButton>
            </div>

            <IonList>
              {notifList.map((notification) => (
                <IonItem
                  key={notification.id}
                  button
                  onClick={() => handleNotificationClick(notification)}
                  style={{
                    background: !notification.read ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                    borderLeft: !notification.read ? `3px solid ${getTypeColor(notification.type)}` : 'none',
                    '--padding-start': '16px',
                    '--padding-end': '16px',
                    '--inner-padding-end': '8px',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: `${getTypeColor(notification.type)}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '12px',
                      flexShrink: 0,
                    }}
                    slot="start"
                  >
                    <IonIcon
                      icon={getTypeIcon(notification.type)}
                      style={{ color: getTypeColor(notification.type), fontSize: '20px' }}
                    />
                  </div>
                  <IonLabel>
                    <h3 style={{
                      fontWeight: !notification.read ? '700' : '600',
                      fontSize: '15px',
                      marginBottom: '2px',
                    }}>
                      {notification.title}
                      {!notification.read && (
                        <span style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: '#6366f1',
                          display: 'inline-block',
                          marginLeft: '8px',
                        }} />
                      )}
                    </h3>
                    <p style={{
                      fontSize: '13px',
                      color: 'var(--ion-color-medium)',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {notification.message}
                    </p>
                    <IonNote style={{ fontSize: '12px', marginTop: '4px' }}>
                      {formatTime(notification.createdAt)}
                    </IonNote>
                  </IonLabel>
                  <IonButton
                    fill="clear"
                    size="small"
                    slot="end"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNotification(notification.id);
                    }}
                    style={{ '--color': 'var(--ion-color-medium)' }}
                  >
                    <IonIcon icon={trash} slot="icon-only" style={{ fontSize: '18px' }} />
                  </IonButton>
                </IonItem>
              ))}
            </IonList>
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Notifications;