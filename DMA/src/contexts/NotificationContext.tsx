import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { API_BASE_URL } from '../services/api';
import { useSocket } from './SocketContext';

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
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const socketContext = useSocket();
  const { onNotification, joinUserRoom } = socketContext || {};

  const getNotifId = (n: Notification) => n._id || n.id || '';

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
    if (Capacitor.isNativePlatform()) {
      try {
        const status = await LocalNotifications.checkPermissions();
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
  }, []);

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
