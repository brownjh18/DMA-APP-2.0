import React, { useState, useEffect } from 'react';
import { IonToast, IonIcon, IonButton, IonSpinner } from '@ionic/react';
import { cloudOffline, refresh, wifi, cloudDone, sync, close } from 'ionicons/icons';
import { useNetwork } from '../contexts/NetworkContext';

const OfflineIndicator: React.FC = () => {
  const { isOnline, networkStatus, lastOnlineTime } = useNetwork();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'warning' | 'danger'>('danger');
  const [wasOffline, setWasOffline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

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
      setIsSyncing(true);
      setToastMessage('Welcome back! Syncing your data...');
      setToastColor('success');
      setShowToast(true);
      
      // Trigger data synchronization
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('syncOfflineData'));
      }, 1000);
      
      // Stop syncing indicator after 2 seconds
      setTimeout(() => {
        setIsSyncing(false);
      }, 2000);
    }
  }, [isOnline, wasOffline]);

  const handleSyncNow = () => {
    setShowToast(false);
    setIsSyncing(true);
    setToastMessage('Syncing data...');
    setToastColor('success');
    setShowToast(true);
    
    window.dispatchEvent(new CustomEvent('syncOfflineData'));
    
    // Stop syncing indicator after 2 seconds
    setTimeout(() => {
      setIsSyncing(false);
    }, 2000);
  };

  const getStatusIcon = () => {
    if (!isOnline) return cloudOffline;
    if (lastOnlineTime && Date.now() - lastOnlineTime < 10000) return cloudDone;
    return wifi;
  };

  const getStatusMessage = () => {
    if (!isOnline) return 'Offline Mode';
    if (lastOnlineTime && Date.now() - lastOnlineTime < 10000) return 'Back Online';
    return 'Online';
  };

  return (
    <>
      {/* Offline Banner - Modern Style */}
      {!isOnline && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
            color: 'white',
            padding: '12px 20px',
            textAlign: 'center',
            zIndex: 9999,
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            boxShadow: '0 4px 20px rgba(255, 107, 107, 0.4)',
          }}
        >
          <IonIcon icon={cloudOffline} style={{ fontSize: '18px' }} />
          <span style={{ flex: 1 }}>You're offline. Using cached data.</span>
          <IonButton 
            size="small" 
            fill="solid"
            style={{
              '--background': 'rgba(255,255,255,0.25)',
              '--border-radius': '20px',
              height: '32px',
              margin: 0,
            }}
            onClick={handleSyncNow}
          >
            <IonIcon icon={refresh} slot="start" style={{ fontSize: '14px' }} />
            <span style={{ fontSize: '12px' }}>Retry</span>
          </IonButton>
        </div>
      )}

      {/* Syncing Indicator - Modern Floating Style */}
      {isOnline && lastOnlineTime && Date.now() - lastOnlineTime < 10000 && (
        <div 
          style={{
            position: 'fixed',
            bottom: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '20px',
            zIndex: 9999,
            fontSize: '12px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 16px rgba(46, 204, 113, 0.4)',
            animation: 'slideUp 0.3s ease-out',
            maxWidth: '90%',
            minWidth: '120px',
          }}
        >
          {isSyncing ? (
            <IonSpinner name="crescent" style={{ width: '14px', height: '14px', color: 'white' }} />
          ) : (
            <IonIcon icon={cloudDone} style={{ fontSize: '14px' }} />
          )}
          <span style={{ flex: 1, whiteSpace: 'nowrap' }}>
            {isSyncing ? 'Syncing...' : 'Synced!'}
          </span>
          <IonButton 
            fill="clear" 
            size="small"
            style={{ 
              color: 'white', 
              margin: 0,
              padding: '2px 4px',
              minWidth: 'auto',
              '--padding-start': '4px',
              '--padding-end': '4px',
            }}
            onClick={() => {
              setIsSyncing(false);
            }}
          >
            <IonIcon icon={close} style={{ fontSize: '12px' }} />
          </IonButton>
        </div>
      )}

      {/* Auto-hide syncing indicator after 2 seconds */}
      {isSyncing && (
        <style>{`
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
        `}</style>
      )}

      {/* Connection Status Badge - Centered in Header */}
      <div
        style={{
          position: 'fixed',
          top: 'calc(var(--ion-safe-area-top) + 13px)',
          left: '75%',
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
        }}
      >
        <IonIcon 
          icon={isOnline ? wifi : cloudOffline} 
          style={{ fontSize: '12px' }} 
        />
        <span>{isOnline ? 'Online' : 'Offline'}</span>
      </div>

      {/* Status Toast - Bottom Position */}
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => {
          setShowToast(false);
          setIsSyncing(false);
        }}
        message={toastMessage}
        duration={isSyncing ? 5000 : 3000}
        position="bottom"
        color={toastColor}
        buttons={[
          {
            text: 'Sync Now',
            icon: refresh,
            handler: handleSyncNow,
            side: 'start'
          },
          {
            text: 'Dismiss',
            role: 'cancel',
            side: 'end'
          }
        ]}
        style={{
          '--border-radius': '16px',
          '--box-shadow': '0 8px 32px rgba(0,0,0,0.2)',
        }}
      />

      {/* CSS Animation */}
      <style>{`
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
