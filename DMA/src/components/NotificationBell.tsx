import React from 'react';
import { IonIcon } from '@ionic/react';
import { notificationsOutline, notifications } from 'ionicons/icons';
import { useNotifications } from '../contexts/NotificationContext';

interface NotificationBellProps {
  onClick?: () => void;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ 
  onClick, 
  size = 'medium',
  showIcon = true 
}) => {
  const { unreadCount } = useNotifications();

  const iconSize = {
    small: '20px',
    medium: '24px',
    large: '28px'
  };

  const badgeSize = {
    small: { width: '16px', height: '16px', fontSize: '9px' },
    medium: { width: '18px', height: '18px', fontSize: '10px' },
    large: { width: '20px', height: '20px', fontSize: '11px' }
  };

  // Don't render anything if there are no unread notifications and we're not showing the icon
  if (!showIcon && unreadCount === 0) return null;

  return (
    <>
      <style>{`
        .notification-bell-container {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          padding: 4px;
          border-radius: 50%;
          transition: background-color 0.2s ease;
        }

        .notification-bell-container:hover {
          background-color: rgba(128, 128, 128, 0.15);
        }

        .notification-bell-container:active {
          background-color: rgba(128, 128, 128, 0.25);
        }

        .notification-badge {
          position: absolute;
          top: 2px;
          right: 2px;
          min-width: ${badgeSize[size].width};
          height: ${badgeSize[size].height};
          padding: 0 4px;
          font-size: ${badgeSize[size].fontSize};
          font-weight: 700;
          border-radius: 10px;
          background: #ef4444;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          pointer-events: none;
          line-height: 1;
        }

        .notification-badge.no-count {
          min-width: 8px;
          height: 8px;
          padding: 0;
          border-radius: 50%;
        }
      `}</style>

      <div 
        className="notification-bell-container" 
        onClick={onClick}
        role="button"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
      >
        {showIcon && (
          <IonIcon 
            icon={unreadCount > 0 ? notifications : notificationsOutline}
            style={{ 
              fontSize: iconSize[size],
              color: 'var(--ion-text-color)',
            }}
          />
        )}
        
        {unreadCount > 0 && (
          <span className={`notification-badge${!showIcon ? ' no-count' : ''}`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </div>
    </>
  );
};

export default NotificationBell;