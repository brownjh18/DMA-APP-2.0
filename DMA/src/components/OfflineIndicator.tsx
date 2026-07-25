import React, { useState, useEffect } from 'react';
import { IonIcon } from '@ionic/react';
import { cloudOffline, wifi } from 'ionicons/icons';
import { useNetwork } from '../contexts/NetworkContext';

const OfflineIndicator: React.FC = () => {
  const { isOnline } = useNetwork();
  const [isVisible, setIsVisible] = useState(false);
  const [status, setStatus] = useState<'online' | 'offline'>('online');
  const [wasOnline, setWasOnline] = useState<boolean | null>(null);

  useEffect(() => {
    // Only show indicator when connection status changes
    if (wasOnline === null) {
      // Initial load - don't show
      setWasOnline(isOnline);
      return;
    }

    if (isOnline !== wasOnline) {
      // Connection status changed - show indicator
      setStatus(isOnline ? 'online' : 'offline');
      setIsVisible(true);
      setWasOnline(isOnline);

      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOnline]);

  // Don't render anything if not visible
  if (!isVisible) return null;

  return (
    <>
      {/* Connection Status Badge - Centered at Bottom (above bottom nav) */}
      <div
        style={{
          position: 'fixed',
          bottom: '70px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9998,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          background: status === 'online'
            ? 'linear-gradient(135deg, rgba(46, 204, 113, 0.95), rgba(39, 174, 96, 0.95))'
            : 'linear-gradient(135deg, rgba(255, 107, 107, 0.95), rgba(238, 90, 36, 0.95))',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '13px',
          fontWeight: '600',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          animation: 'slideUp 0.3s ease-out, pulse 2s ease-in-out infinite',
        }}
      >
        <IonIcon 
          icon={status === 'online' ? wifi : cloudOffline} 
          style={{ fontSize: '14px' }} 
        />
        <span>{status === 'online' ? 'Back Online' : 'Offline - Check Connection'}</span>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        
        @keyframes pulse {
          0% { transform: translateX(-50%) scale(1); }
          50% { transform: translateX(-50%) scale(1.03); }
          100% { transform: translateX(-50%) scale(1); }
        }
      `}</style>
    </>
  );
};

export default OfflineIndicator;
