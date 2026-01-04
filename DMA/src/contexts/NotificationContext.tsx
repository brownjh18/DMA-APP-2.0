import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiService from '../services/api';

export interface NotificationItem {
  id: string;
  type: 'sermon' | 'event' | 'devotion' | 'podcast' | 'ministry' | 'news';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: any; // Additional data like ID, URL, etc.
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  addNotification: (notification: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Load notifications from backend on mount
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        // Try to fetch from backend first
        const response = await apiService.getNotifications();
        if (response && Array.isArray(response)) {
          // Convert backend notification format to frontend format
          const formattedNotifications = response.map((n: any) => ({
            id: n._id,
            type: n.type,
            title: n.title,
            message: n.message,
            timestamp: new Date(n.createdAt),
            read: n.isRead,
            data: {
              url: getUrlForNotification(n)
            }
          }));
          setNotifications(formattedNotifications);
          return;
        }
      } catch (error) {
        console.error('Error fetching notifications from backend:', error);
      }

      // Fallback to localStorage if backend fails
      const savedNotifications = localStorage.getItem('app-notifications-list');
      if (savedNotifications) {
        try {
          const parsed = JSON.parse(savedNotifications);
          const notificationsWithDates = parsed.map((n: any) => ({
            ...n,
            timestamp: new Date(n.timestamp)
          }));
          setNotifications(notificationsWithDates);
        } catch (error) {
          console.error('Error parsing saved notifications:', error);
        }
      }
    };

    loadNotifications();
  }, []);

  // Helper function to generate URLs for notifications
  const getUrlForNotification = (notification: any) => {
    switch (notification.type) {
      case 'sermon':
        return '/tab2';
      case 'devotion':
        return `/full-devotion?id=${notification.contentId}`;
      case 'event':
        return `/event/${notification.contentId}`;
      case 'ministry':
        return `/ministry/${notification.contentId}`;
      case 'podcast':
        return `/podcast-player?id=${notification.contentId}`;
      case 'news':
        return `/news/${notification.contentId}`;
      default:
        return '/tab1';
    }
  };

  // Save notifications to localStorage whenever they change (as backup)
  useEffect(() => {
    localStorage.setItem('app-notifications-list', JSON.stringify(notifications));
  }, [notifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = (notification: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: NotificationItem = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep only latest 50 notifications
  };

  const markAsRead = async (id: string) => {
    try {
      // Update backend first
      await apiService.markNotificationAsRead(id);
    } catch (error) {
      console.error('Error marking notification as read on backend:', error);
    }

    // Update local state regardless of backend success
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = async () => {
    try {
      // Update backend first
      await apiService.markAllNotificationsAsRead();
    } catch (error) {
      console.error('Error marking all notifications as read on backend:', error);
    }

    // Update local state regardless of backend success
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    isOpen,
    setIsOpen
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};