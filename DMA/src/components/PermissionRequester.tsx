import React, { useState, useEffect } from 'react';
import {
  IonAlert,
  IonButton,
  IonIcon,
  IonText
} from '@ionic/react';
import {
  notifications,
  folderOpen,
  mic,
  checkmarkCircle,
  closeCircle,
  settings
} from 'ionicons/icons';

interface PermissionStatus {
  notifications: 'pending' | 'granted' | 'denied';
  storage: 'pending' | 'granted' | 'denied';
  microphone: 'pending' | 'granted' | 'denied';
}

interface PermissionRequesterProps {
  onPermissionsReady: () => void;
}

const PermissionRequester: React.FC<PermissionRequesterProps> = ({ onPermissionsReady }) => {
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [currentPermission, setCurrentPermission] = useState<'notifications' | 'storage' | 'microphone' | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>({
    notifications: 'pending',
    storage: 'pending',
    microphone: 'pending'
  });
  const [showDeniedAlert, setShowDeniedAlert] = useState(false);
  const [deniedPermission, setDeniedPermission] = useState<string>('');

  useEffect(() => {
    // Check if this is the first time the app is opened
    const hasRequestedPermissions = localStorage.getItem('permissionsRequested');
    
    if (!hasRequestedPermissions) {
      // Small delay to ensure app is ready
      setTimeout(() => {
        setShowPermissionDialog(true);
        requestNextPermission();
      }, 500);
    } else {
      // Permissions were already requested, just notify parent
      onPermissionsReady();
    }
  }, []);

  const requestNextPermission = () => {
    if (permissionStatus.notifications === 'pending') {
      setCurrentPermission('notifications');
    } else if (permissionStatus.storage === 'pending') {
      setCurrentPermission('storage');
    } else if (permissionStatus.microphone === 'pending') {
      setCurrentPermission('microphone');
    } else {
      // All permissions processed
      finishPermissionRequest();
    }
  };

  const handlePermissionRequest = async () => {
    if (!currentPermission) return;

    try {
      let granted = false;

      switch (currentPermission) {
        case 'notifications':
          granted = await requestNotificationPermission();
          break;
        case 'storage':
          granted = await requestStoragePermission();
          break;
        case 'microphone':
          granted = await requestMicrophonePermission();
          break;
      }

      setPermissionStatus(prev => ({
        ...prev,
        [currentPermission]: granted ? 'granted' : 'denied'
      }));

      if (!granted) {
        setDeniedPermission(currentPermission);
        setShowDeniedAlert(true);
      }
    } catch (error) {
      console.error(`Error requesting ${currentPermission} permission:`, error);
      setPermissionStatus(prev => ({
        ...prev,
        [currentPermission]: 'denied'
      }));
    }

    // Move to next permission after a short delay
    setTimeout(() => {
      setCurrentPermission(null);
      requestNextPermission();
    }, 300);
  };

  const requestNotificationPermission = async (): Promise<boolean> => {
    try {
      // For Capacitor apps, use the LocalNotifications plugin
      if ((window as any).Capacitor?.isNativePlatform()) {
        const { LocalNotifications } = (window as any).Plugins || (window as any).Capacitor?.Plugins;
        if (LocalNotifications) {
          // Check if notifications are enabled
          const status = await LocalNotifications.checkPermissions();
          if (status.display === 'granted') {
            return true;
          }
          // Request permission
          const result = await LocalNotifications.requestPermissions();
          return result.display === 'granted';
        }
      }
      
      // For web, use Notification API
      if ('Notification' in window) {
        const result = await Notification.requestPermission();
        return result === 'granted';
      }
      
      return true;
    } catch (error) {
      console.error('Notification permission error:', error);
      return false;
    }
  };

  const requestStoragePermission = async (): Promise<boolean> => {
    try {
      // Storage permission is typically granted by default in Android apps
      // But we can check if we can access the filesystem
      if ((window as any).Capacitor?.isNativePlatform()) {
        // On native, storage is usually available
        return true;
      }
      
      // On web, we can try to use the File System Access API if available
      if ('showOpenFilePicker' in window) {
        return true;
      }
      
      return true; // Assume granted for most cases
    } catch (error) {
      console.error('Storage permission error:', error);
      return false;
    }
  };

  const requestMicrophonePermission = async (): Promise<boolean> => {
    try {
      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('mediaDevices API not available. This may be due to:');
        console.warn('- Not using HTTPS (required for microphone access)');
        console.warn('- Using an older browser');
        console.warn('- Running in an insecure context');
        
        // On native platform, we assume permission is granted since we requested it in MainActivity
        if ((window as any).Capacitor?.isNativePlatform()) {
          return true;
        }
        
        return false;
      }

      if ((window as any).Capacitor?.isNativePlatform()) {
        // On native, we've already requested in MainActivity
        // Just verify we can access the microphone
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        return true;
      }
      
      // On web, request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Microphone permission error:', error);
      return false;
    }
  };

  const finishPermissionRequest = () => {
    localStorage.setItem('permissionsRequested', 'true');
    setShowPermissionDialog(false);
    onPermissionsReady();
  };

  const openAppSettings = () => {
    if ((window as any).Capacitor?.isNativePlatform()) {
      const plugins = (window as any).Plugins || (window as any).Capacitor?.Plugins;
      if (plugins?.AppLauncher) {
        plugins.AppLauncher.openSettings({ action: 'application_settings' });
        return;
      }
    }
    
    // Fallback for web
    setShowDeniedAlert(false);
  };

  const getPermissionInfo = (permission: string) => {
    switch (permission) {
      case 'notifications':
        return {
          icon: notifications,
          title: 'Notifications',
          description: 'Allow notifications to receive important updates, prayer requests, and event reminders.',
          color: '#6366f1'
        };
      case 'storage':
        return {
          icon: folderOpen,
          title: 'Storage',
          description: 'Allow storage access to save offline content, cache media, and store app data.',
          color: '#10b981'
        };
      case 'microphone':
        return {
          icon: mic,
          title: 'Microphone',
          description: 'Allow microphone access to record audio for podcasts, live broadcasts, and voice messages.',
          color: '#f59e0b'
        };
      default:
        return {
          icon: settings,
          title: 'Permission',
          description: 'This permission is required for the app to function properly.',
          color: '#6b7280'
        };
    }
  };

  if (!showPermissionDialog || !currentPermission) {
    return null;
  }

  const permissionInfo = getPermissionInfo(currentPermission);

  return (
    <>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px'
      }}>
        <div style={{
          background: 'var(--ion-card-background)',
          borderRadius: '24px',
          padding: '28px',
          maxWidth: '360px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          animation: 'slideUp 0.3s ease-out'
        }}>
          {/* Icon */}
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: `${permissionInfo.color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto'
          }}>
            <IonIcon icon={permissionInfo.icon} style={{ fontSize: '32px', color: permissionInfo.color }} />
          </div>

          {/* Title */}
          <h2 style={{
            margin: '0 0 8px 0',
            fontSize: '20px',
            fontWeight: '700',
            color: 'var(--ion-text-color)',
            textAlign: 'center'
          }}>
            {permissionInfo.title} Permission
          </h2>

          {/* Description */}
          <p style={{
            margin: '0 0 24px 0',
            fontSize: '14px',
            color: 'var(--ion-text-color)',
            opacity: 0.7,
            lineHeight: 1.5,
            textAlign: 'center'
          }}>
            {permissionInfo.description}
          </p>

          {/* Progress indicators */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '24px'
          }}>
            {(['notifications', 'storage', 'microphone'] as const).map((perm) => (
              <div key={perm} style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: permissionStatus[perm] === 'granted' 
                  ? '#10b981' 
                  : permissionStatus[perm] === 'denied'
                  ? '#ef4444'
                  : perm === currentPermission
                  ? permissionInfo.color
                  : 'var(--ion-color-step-200)'
              }} />
            ))}
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <IonButton
              expand="block"
              fill="outline"
              onClick={() => {
                setPermissionStatus(prev => ({
                  ...prev,
                  [currentPermission]: 'denied'
                }));
                setCurrentPermission(null);
                requestNextPermission();
              }}
              style={{
                flex: 1,
                height: '48px',
                borderRadius: '14px',
                '--border-color': 'rgba(0,0,0,0.1)',
                '--color': 'var(--ion-text-color)',
                fontWeight: '600'
              }}
            >
              Skip
            </IonButton>
            <IonButton
              expand="block"
              onClick={handlePermissionRequest}
              style={{
                flex: 1,
                height: '48px',
                borderRadius: '14px',
                background: `linear-gradient(135deg, ${permissionInfo.color} 0%, ${permissionInfo.color}dd 100%)`,
                fontWeight: '700'
              }}
            >
              Allow
            </IonButton>
          </div>
        </div>
      </div>

      {/* Denied Alert */}
      <IonAlert
        isOpen={showDeniedAlert}
        onDidDismiss={() => setShowDeniedAlert(false)}
        header={`${deniedPermission.charAt(0).toUpperCase() + deniedPermission.slice(1)} Permission Denied`}
        message={`This permission is important for the app's functionality. You can enable it later in Settings.
        
Would you like to open Settings now?`}
        buttons={[
          {
            text: 'Not Now',
            role: 'cancel',
            handler: () => {
              setShowDeniedAlert(false);
            }
          },
          {
            text: 'Open Settings',
            handler: openAppSettings
          }
        ]}
      />

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};

export default PermissionRequester;