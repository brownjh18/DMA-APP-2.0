import React, { useState, useEffect } from 'react';
import { IonToast, IonIcon, IonButton } from '@ionic/react';
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
      setToastMessage('Welcome back online! Syncing your data...');
      setToastColor('success');
      setShowToast(true);
      
      // Trigger data synchronization
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('syncOfflineData'));
      }, 1000);
    }
  }, [isOnline, wasOffline]);

  const handleSyncNow = () => {
    setShowToast(false);
    window.dispatchEvent(new CustomEvent('syncOfflineData'));
    setToastMessage('Syncing data...');
    setToastColor('success');
    setShowToast(true);
  };

  const getStatusIcon = () => {
    if (!isOnline) return cloudOffline;
    if (lastOnlineTime && Date.now() - lastOnlineTime < 10000) return cloudDone; // Recently connected
    return wifi;
  };

  const getStatusMessage = () => {
    if (!isOnline) return 'Offline Mode';
    if (lastOnlineTime && Date.now() - lastOnlineTime < 10000) return 'Back Online';
    return 'Online';
  };

  return (
    <>
      {/* Offline Banner */}
      {!isOnline && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
            color: 'white',
            padding: '8px 16px',
            textAlign: 'center',
            zIndex: 9999,
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <IonIcon icon={cloudOffline} />
          <span>You're offline. Using cached data.</span>
          <IonButton 
            size="small" 
            fill="clear" 
            style={{ color: 'white', marginLeft: '8px' }}
            onClick={handleSyncNow}
          >
            <IonIcon icon={refresh} slot="icon-only" />
          </IonButton>
        </div>
      )}

      {/* Recently Back Online Banner */}
      {isOnline && lastOnlineTime && Date.now() - lastOnlineTime < 10000 && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(135deg, #2ecc71, #27ae60)',
            color: 'white',
            padding: '8px 16px',
            textAlign: 'center',
            zIndex: 9999,
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <IonIcon icon={cloudDone} />
          <span>Welcome back! Syncing your data...</span>
        </div>
      )}

      {/* Status Toast */}
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={4000}
        position="top"
        color={toastColor}
        buttons={[
          {
            text: 'Sync Now',
            icon: refresh,
            handler: handleSyncNow
          },
          {
            text: 'Dismiss',
            role: 'cancel'
          }
        ]}
      />
    </>
  );
};

export default OfflineIndicator;