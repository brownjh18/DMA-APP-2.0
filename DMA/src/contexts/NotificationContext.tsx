import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { LocalNotifications, PermissionStatus } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { API_BASE_URL } from '../services/api';
import { useSocket } from './SocketContext';
import { useSettings } from './SettingsContext';

export interface Notification {
  _id?: string;
  id?: string;
  title: string;
  message: string;
  type: 'sermon' | 'podcast' | 'devotion' | 'event' | 'ministry' | 'prayer' | 'general';
  contentType?: string;
  contentId?: string;
  data?: any;
  read: boolean;
  createdAt: string;
}

type NormalizedPermission = 'granted' | 'denied' | 'undetermined';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | '_id' | 'createdAt' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  refreshNotifications: () => Promise<void>;
  hasNewNotification: boolean;
  clearNewNotificationFlag: () => void;
  notificationPermission: NormalizedPermission;
  requestNotificationPermission: () => Promise<NormalizedPermission>;
  revokeNotificationPermission: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const normalizePermission = (state: PermissionStatus['display']): NormalizedPermission => {
  if (state === 'granted') return 'granted';
  if (state === 'denied') return 'denied';
  return 'undetermined';
};

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NormalizedPermission>('undetermined');
  const socketContext = useSocket();
  const { onNotification, joinUserRoom } = socketContext || {};
  const { pushNotifications } = useSettings();

  const getNotifId = (n: Notification) => n._id || n.id || '';

  // Setup notification channel and check permissions on mount (Android)
  useEffect(() => {
    const setupNotifications = async () => {
      if (!Capacitor.isNativePlatform()) return;
      try {
        // Create notification channel for Android
        await LocalNotifications.createChannel({
          id: 'dma-notifications',
          name: 'Dove Church Notifications',
          description: 'Notifications from Dove Church app',
          importance: 4,
          visibility: 1,
          vibration: true,
        });

        // Check current permission status
        const status = await LocalNotifications.checkPermissions();
        setNotificationPermission(normalizePermission(status.display));
      } catch (error) {
        console.warn('Failed to setup notification channel:', error);
      }
    };
    setupNotifications();
  }, []);

  const requestNotificationPermission = useCallback(async (): Promise<NormalizedPermission> => {
    if (!Capacitor.isNativePlatform()) {
      // Web: use the browser Notification API
      if ('Notification' in window) {
        const result = await Notification.requestPermission();
        const normalized = result === 'granted' ? 'granted' : result === 'denied' ? 'denied' : 'undetermined';
        setNotificationPermission(normalized);
        return normalized;
      }
      setNotificationPermission('granted');
      return 'granted';
    }
    try {
      const status = await LocalNotifications.requestPermissions();
      const normalized = normalizePermission(status.display);
      setNotificationPermission(normalized);
      return normalized;
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      return 'denied';
    }
  }, []);

  const revokeNotificationPermission = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) {
      // Web: best-effort — we can't programmatically revoke, but we can update our state
      // The browser won't allow re-prompting once denied; user must change in browser settings
      setNotificationPermission('denied');
      return;
    }
    // On native, permissions can only be revoked via device settings
    // Update local state to reflect disabled intent
    const status = await LocalNotifications.checkPermissions();
    setNotificationPermission(normalizePermission(status.display));
  }, []);

  // Load notifications from API
  const refreshNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/notifications?limit=50`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) return;
      const data = await response.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  // Join user room for real-time notifications
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId && joinUserRoom) {
      joinUserRoom(userId);
    }
  }, [joinUserRoom]);

  // Listen for real-time notifications via Socket.IO
  useEffect(() => {
    if (!onNotification) return;

    onNotification((notif: Notification) => {
      console.log('📥 Real-time notification:', notif);
      setNotifications(prev => [notif, ...prev]);
      setUnreadCount(prev => prev + 1);
      setHasNewNotification(true);
      showLocalNotification(notif.title, notif.message);
    });
  }, [onNotification]);

  const showLocalNotification = useCallback(async (title: string, body: string) => {
    // Respect the push notifications toggle
    if (!pushNotifications) return;

    if (Capacitor.isNativePlatform()) {
      try {
        const status = await LocalNotifications.checkPermissions();
        setNotificationPermission(normalizePermission(status.display));
        if (status.display !== 'granted') return;
        await LocalNotifications.schedule({
          notifications: [{
            title, body,
            id: Date.now() + Math.random(),
            iconColor: '#6366f1',
            smallIcon: 'res://icon',
            channelId: 'dma-notifications',
            actionTypeId: 'notification-open',
          }],
        });
      } catch (error) {
        console.error('Failed to show device notification:', error);
      }
    }
  }, [pushNotifications]);

  const addNotification = useCallback(async (notification: Omit<Notification, 'id' | '_id' | 'createdAt' | 'read'>) => {
    const optimistic: Notification = {
      ...notification,
      _id: `temp_${Date.now()}`,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [optimistic, ...prev]);
    setUnreadCount(prev => prev + 1);
    setHasNewNotification(true);
    showLocalNotification(notification.title, notification.message);
  }, [showLocalNotification]);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications(prev => prev.map(n => getNotifId(n) === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    try {
      await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, []);

  const removeNotification = useCallback(async (id: string) => {
    setNotifications(prev => prev.filter(n => getNotifId(n) !== id));
    try {
      await fetch(`${API_BASE_URL}/notifications/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, []);

  const clearAll = useCallback(async () => {
    setNotifications([]);
    setUnreadCount(0);
    try {
      await fetch(`${API_BASE_URL}/notifications/clear-all`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }, []);

  const clearNewNotificationFlag = useCallback(() => {
    setHasNewNotification(false);
  }, []);

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
        refreshNotifications,
        hasNewNotification,
        clearNewNotificationFlag,
        notificationPermission,
        requestNotificationPermission,
        revokeNotificationPermission,
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
