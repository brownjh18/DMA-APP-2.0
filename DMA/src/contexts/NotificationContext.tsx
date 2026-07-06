import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import apiService from '../services/api';

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
  refreshNotifications: () => Promise<void>;
}

interface CachedContent {
  sermons: string[];
  podcasts: string[];
  devotions: string[];
  events: string[];
  lastCheck: string;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Polling interval in milliseconds (1 minute)
const POLLING_INTERVAL = 60 * 1000;

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [cachedContent, setCachedContent] = useState<CachedContent>({
    sermons: [],
    podcasts: [],
    devotions: [],
    events: [],
    lastCheck: new Date().toISOString()
  });
  const pollingIntervalRef = useRef<number | null>(null);

  // Load notifications and cache from localStorage on mount
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

    const savedCache = localStorage.getItem('contentCache');
    if (savedCache) {
      try {
        const parsed = JSON.parse(savedCache);
        setCachedContent(parsed);
      } catch (e) {
        console.error('Failed to parse saved cache:', e);
      }
    }
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    try {
      const serialized = JSON.stringify(notifications);
      // Limit stored notifications to avoid quota issues (keep last 30)
      const trimmed = notifications.length > 30 ? notifications.slice(0, 30) : notifications;
      localStorage.setItem('notifications', JSON.stringify(trimmed));
    } catch (e) {
      console.warn('Failed to save notifications to localStorage:', e);
      // If storage is full, clear old notifications
      try {
        localStorage.removeItem('notifications');
      } catch (_) {}
    }
  }, [notifications]);

  // Save cache to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('contentCache', JSON.stringify(cachedContent));
    } catch (e) {
      console.warn('Failed to save content cache to localStorage:', e);
    }
  }, [cachedContent]);

  // Show local notification on device
  const showLocalNotification = useCallback(async (title: string, body: string, data?: any) => {
    if (Capacitor.isNativePlatform()) {
      try {
        // Check if we have permission
        const status = await LocalNotifications.checkPermissions();
        if (status.display !== 'granted') {
          console.log('Notification permission not granted, skipping device notification');
          return;
        }

        await LocalNotifications.schedule({
          notifications: [{
            title: title,
            body: body,
            id: Date.now() + Math.random(),
            iconColor: '#6366f1',
            smallIcon: 'res://icon',
            extra: data || {},
            channelId: 'dma-notifications',
            actionTypeId: 'notification-open',
          }],
        });
        console.log('Device notification scheduled:', title);
      } catch (error) {
        console.error('Failed to show device notification:', error);
      }
    }
  }, []);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep last 50 notifications

    // Show local notification
    showLocalNotification(notification.title, notification.message, notification.data);
  }, [showLocalNotification]);

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

  // Poll for new content from the server
  const refreshNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token, skipping notification poll');
        return;
      }

      const now = new Date();
      const lastCheck = cachedContent.lastCheck ? new Date(cachedContent.lastCheck) : null;
      
      // Format date for API query (last 24 hours or since last check)
      const sinceDate = lastCheck ? lastCheck.toISOString() : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      // Fetch new content from server
      const [sermonsRes, podcastsRes, devotionsRes, eventsRes] = await Promise.allSettled([
        apiService.getSermons({ limit: 10, since: sinceDate }),
        apiService.getPodcasts({ limit: 10, since: sinceDate }),
        apiService.getDevotions({ limit: 10, since: sinceDate }),
        apiService.getEvents({ limit: 10, since: sinceDate }),
      ]);

      const newSermonIds: string[] = [];
      const newPodcastIds: string[] = [];
      const newDevotionIds: string[] = [];
      const newEventIds: string[] = [];

      // Check for new sermons
      if (sermonsRes.status === 'fulfilled' && sermonsRes.value?.sermons) {
        const sermons = sermonsRes.value.sermons;
        sermons.forEach((sermon: any) => {
          if (!cachedContent.sermons.includes(sermon._id)) {
            newSermonIds.push(sermon._id);
addNotification({
               title: 'New Sermon Available',
               message: sermon.title || 'A new sermon has been added',
               type: 'sermon',
               data: { sermonId: sermon._id, type: 'sermon', thumbnailUrl: sermon.thumbnailUrl || sermon.thumbnail },
             });
          }
        });
      }

      // Check for new podcasts
      if (podcastsRes.status === 'fulfilled' && podcastsRes.value?.podcasts) {
        const podcasts = podcastsRes.value.podcasts;
        podcasts.forEach((podcast: any) => {
          if (!cachedContent.podcasts.includes(podcast._id)) {
            newPodcastIds.push(podcast._id);
addNotification({
               title: 'New Podcast Episode',
               message: podcast.title || 'A new podcast episode is available',
               type: 'podcast',
               data: { podcastId: podcast._id, type: 'podcast', thumbnailUrl: podcast.thumbnailUrl || podcast.thumbnail },
             } as any);
          }
        });
      }

      // Check for new devotions
      if (devotionsRes.status === 'fulfilled' && devotionsRes.value?.devotions) {
        const devotions = devotionsRes.value.devotions;
        devotions.forEach((devotion: any) => {
          if (!cachedContent.devotions.includes(devotion._id)) {
            newDevotionIds.push(devotion._id);
addNotification({
               title: 'New Daily Devotion',
               message: devotion.title || 'A new devotion is available for today',
               type: 'devotion',
               data: { devotionId: devotion._id, type: 'devotion', thumbnailUrl: devotion.thumbnailUrl || devotion.thumbnail },
             } as any);
          }
        });
      }

      // Check for new events
      if (eventsRes.status === 'fulfilled' && eventsRes.value?.events) {
        const events = eventsRes.value.events;
        events.forEach((event: any) => {
          if (!cachedContent.events.includes(event._id)) {
            newEventIds.push(event._id);
addNotification({
               title: 'Upcoming Event',
               message: event.title || 'A new event has been scheduled',
               type: 'event',
               data: { eventId: event._id, type: 'event', thumbnailUrl: event.imageUrl || event.thumbnail },
             } as any);
          }
        });
      }

      // Update cache with new content IDs
      if (newSermonIds.length > 0 || newPodcastIds.length > 0 || 
          newDevotionIds.length > 0 || newEventIds.length > 0) {
        setCachedContent({
          sermons: [...new Set([...cachedContent.sermons, ...newSermonIds])].slice(-100),
          podcasts: [...new Set([...cachedContent.podcasts, ...newPodcastIds])].slice(-100),
          devotions: [...new Set([...cachedContent.devotions, ...newDevotionIds])].slice(-100),
          events: [...new Set([...cachedContent.events, ...newEventIds])].slice(-100),
          lastCheck: now.toISOString(),
        });
        
        console.log(`Notification poll complete: ${newSermonIds.length} sermons, ${newPodcastIds.length} podcasts, ${newDevotionIds.length} devotions, ${newEventIds.length} events found`);
      } else {
        // Update last check time even if no new content
        setCachedContent(prev => ({
          ...prev,
          lastCheck: now.toISOString(),
        }));
      }
    } catch (error) {
      console.error('Error polling for notifications:', error);
    }
  }, [cachedContent, addNotification]);

  // Set up polling interval
  useEffect(() => {
    // Run initial poll after a short delay
    const initialPollTimeout = setTimeout(() => {
      refreshNotifications();
    }, 3000);

    // Set up periodic polling
    pollingIntervalRef.current = window.setInterval(() => {
      refreshNotifications();
    }, POLLING_INTERVAL);

    return () => {
      clearTimeout(initialPollTimeout);
      if (pollingIntervalRef.current) {
        window.clearInterval(pollingIntervalRef.current);
      }
    };
  }, [refreshNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

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