import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { PushNotifications, PushNotificationSchema, ActionPerformed, Token } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { useHistory } from 'react-router-dom';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'sermon' | 'devotion' | 'event' | 'prayer' | 'general';
  data?: any;
  read: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const history = useHistory();

  // Load notifications from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('notifications');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setNotifications(parsed);
      } catch (e) {
        console.error('Failed to parse saved notifications:', e);
      }
    }
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep last 50 notifications

    // Show local notification
    if (Capacitor.isNativePlatform()) {
      LocalNotifications.schedule({
        notifications: [{
          title: notification.title,
          body: notification.message,
          id: Date.now(),
          iconColor: '#6366f1',
          sound: 'beep.wav',
          smallIcon: 'res://icon',
          extra: notification.data || {},
        }],
      });
    }
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    localStorage.removeItem('notifications');
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Request notification permissions
  const requestNotificationPermission = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return 'granted'; // Web doesn't need permission

    try {
      const permStatus = await PushNotifications.requestPermissions();
      return permStatus.receive;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }, []);

  // Check notification permissions
  const checkNotificationPermission = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return 'granted';

    try {
      const permStatus = await PushNotifications.checkPermissions();
      return permStatus.receive;
    } catch (error) {
      console.error('Error checking notification permission:', error);
      return 'denied';
    }
  }, []);

  // Initialize push notifications for mobile
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const initPushNotifications = async () => {
      try {
        // Check and request permission
        const permStatus = await requestNotificationPermission();
        if (permStatus !== 'granted') {
          console.log('Push notification permission not granted');
          return;
        }

        // Register for push notifications
        await PushNotifications.register();

        // Listen for registration
        PushNotifications.addListener('registration', (token: Token) => {
          console.log('Push registration success, token: ' + token.value);
          // Store token for later use
          localStorage.setItem('pushToken', token.value);
        });

        PushNotifications.addListener('registrationError', (error: any) => {
          console.error('Error on registration: ' + JSON.stringify(error));
        });

        // Listen for incoming notifications
        PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
          console.log('Push notification received:', notification);
          const data = notification.data;
          if (data) {
            addNotification({
              title: data.title || 'New Notification',
              message: data.message || '',
              type: data.type || 'general',
              data: data,
            });
          }
        });

        // Listen for notification tap
        PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
          console.log('Push notification action performed:', notification);
          // Handle navigation based on notification data
          const data = notification.notification.data;
          if (data && data.url) {
            history.push(data.url);
          }
        });
      } catch (error) {
        console.error('Error initializing push notifications:', error);
      }
    };

    initPushNotifications();
  }, [addNotification, requestNotificationPermission, history]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};