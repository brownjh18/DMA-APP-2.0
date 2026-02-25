import React, { useState, useEffect } from 'react';
import { IonToast, IonIcon } from '@ionic/react';
import { cloudOffline, refresh, wifi, cloudDone } from 'ionicons/icons';
import { useNetwork } from '../contexts/NetworkContext';

const OfflineIndicator: React.FC = () => {
  const { isOnline, networkStatus, lastOnlineTime } = useNetwork();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'warning' | 'danger'>('danger');
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline && !wasOffline) {
      // Just went offline
      setWasOffline(true);
      setToastMessage('You are now offline. Some features may be limited.');
      setToastColor('warning');
      setShowToast(true);
    } else if (isOnline && wasOffline) {
      // Just came back online
      setWasOffline(false);
      setToastMessage('Welcome back! You are now online.');
      setToastColor('success');
      setShowToast(true);
      
      // Trigger data synchronization
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('syncOfflineData'));
      }, 1000);
    }
  }, [isOnline, wasOffline]);

  return (
    <>
      {/* Connection Status Badge - Centered in Header with Sync Indicator on Left */}
      <div
        style={{
          position: 'fixed',
          top: 'calc(var(--ion-safe-area-top) + 13px)',
          left: !isOnline || (lastOnlineTime && Date.now() - lastOnlineTime < 10000) ? '70%' : '75%',
          transform: 'translateX(-50%)',
          zIndex: 9998,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          background: isOnline 
            ? 'linear-gradient(135deg, rgba(46, 204, 113, 0.9), rgba(39, 174, 96, 0.9))' 
            : 'linear-gradient(135deg, rgba(255, 107, 107, 0.9), rgba(238, 90, 36, 0.9))',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '16px',
          fontSize: '11px',
          fontWeight: '600',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          transition: 'left 0.3s ease',
        }}
      >
        {/* Sync/Reconnect Indicator on the Left */}
        {!isOnline ? (
          // Red reconnect indicator when offline
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              paddingRight: '5px',
              borderRight: '1px solid rgba(255,255,255,0.3)',
              marginRight: '2px',
            }}
          >
            <IonIcon icon={refresh} style={{ fontSize: '9px', animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '9px' }}>Reconnect</span>
          </div>
        ) : lastOnlineTime && Date.now() - lastOnlineTime < 10000 ? (
          // Green synced indicator when recently back online
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              paddingRight: '5px',
              borderRight: '1px solid rgba(255,255,255,0.3)',
              marginRight: '2px',
            }}
          >
            <IonIcon icon={cloudDone} style={{ fontSize: '9px' }} />
            <span style={{ fontSize: '9px' }}>Synced</span>
          </div>
        ) : null}
        <IonIcon 
          icon={isOnline ? wifi : cloudOffline} 
          style={{ fontSize: '12px' }} 
        />
        <span>{isOnline ? 'Online' : 'Offline'}</span>
      </div>

      {/* Status Toast - Below Page Header */}
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => {
          setShowToast(false);
        }}
        message={toastMessage}
        duration={3000}
        position="top"
        color={toastColor}
        buttons={[
          {
            text: 'Dismiss',
            role: 'cancel',
            side: 'end'
          }
        ]}
        style={{
          '--border-radius': '16px',
          '--box-shadow': '0 8px 32px rgba(0,0,0,0.2)',
          'margin-top': 'calc(var(--ion-safe-area-top) + 60px)',
        }}
      />

      {/* CSS Animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.9; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default OfflineIndicator;
