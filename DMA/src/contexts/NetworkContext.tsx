import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Network } from '@capacitor/network';

interface NetworkStatus {
  connected: boolean;
  connectionType: 'wifi' | 'cellular' | 'ethernet' | 'unknown' | 'none';
}

interface NetworkContextType {
  isOnline: boolean;
  networkStatus: string;
  connectionType: string;
  isOfflineMode: boolean;
  setOfflineMode: (offline: boolean) => void;
  lastOnlineTime: number | null;
  checkConnectivity: () => Promise<boolean>;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};

interface NetworkProviderProps {
  children: ReactNode;
}

export const NetworkProvider: React.FC<NetworkProviderProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [networkStatus, setNetworkStatus] = useState('online');
  const [connectionType, setConnectionType] = useState('unknown');
  const [isOfflineMode, setOfflineMode] = useState(false);
  const [lastOnlineTime, setLastOnlineTime] = useState<number | null>(null);

  const checkConnectivity = async (): Promise<boolean> => {
    try {
      const status = await Network.getStatus();
      return status.connected;
    } catch (error) {
      console.warn('Error checking network status:', error);
      return navigator.onLine;
    }
  };

  useEffect(() => {
    const updateNetworkStatus = async () => {
      try {
        const status = await Network.getStatus();
        const wasOffline = !isOnline;
        
        setIsOnline(status.connected);
        setNetworkStatus(status.connected ? 'online' : 'offline');
        setConnectionType(status.connectionType);
        
        if (status.connected && wasOffline) {
          console.log('🔄 Network: Back online');
          setLastOnlineTime(Date.now());
          // Trigger data synchronization
          window.dispatchEvent(new CustomEvent('networkBackOnline'));
        } else if (!status.connected && !wasOffline) {
          console.log('📱 Network: Gone offline');
        }
      } catch (error) {
        console.warn('Error getting network status:', error);
        // Fallback to browser's online/offline events
        setIsOnline(navigator.onLine);
        setNetworkStatus(navigator.onLine ? 'online' : 'offline');
      }
    };

    // Check initial status
    updateNetworkStatus();

    // Listen for Capacitor network changes
    let networkListener: any;
    Network.addListener('networkStatusChange', (status: NetworkStatus) => {
      console.log('Network status changed', status);
      setIsOnline(status.connected);
      setNetworkStatus(status.connected ? 'online' : 'offline');
      setConnectionType(status.connectionType);
      
      if (status.connected) {
        setLastOnlineTime(Date.now());
        window.dispatchEvent(new CustomEvent('networkBackOnline'));
      }
    }).then((listener) => {
      networkListener = listener;
    });

    // Fallback to browser events
    const handleOnline = () => {
      console.log('🌐 Browser: Back online');
      setIsOnline(true);
      setNetworkStatus('online');
      setLastOnlineTime(Date.now());
      window.dispatchEvent(new CustomEvent('networkBackOnline'));
    };

    const handleOffline = () => {
      console.log('📵 Browser: Gone offline');
      setIsOnline(false);
      setNetworkStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      if (networkListener && networkListener.remove) {
        networkListener.remove();
      }
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOnline]);

  const value: NetworkContextType = {
    isOnline,
    networkStatus,
    connectionType,
    isOfflineMode,
    setOfflineMode,
    lastOnlineTime,
    checkConnectivity
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
};