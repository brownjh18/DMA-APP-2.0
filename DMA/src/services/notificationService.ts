import { AppNotification } from '../types/notification';

export class NotificationService {
  private notifications: AppNotification[] = [];
  private subscribers: ((notifications: AppNotification[]) => void)[] = [];

  constructor() {
    // Load notifications from localStorage on initialization
    this.loadNotifications();
  }

  private loadNotifications() {
    try {
      const saved = localStorage.getItem('app-notifications');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          this.notifications = parsed;
        } else {
          console.warn('Invalid notifications data in localStorage, resetting to empty array');
          this.notifications = [];
        }
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      this.notifications = [];
    }
  }

  private saveNotifications() {
    try {
      localStorage.setItem('app-notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }

  private notifySubscribers() {
    this.subscribers.forEach(subscriber => {
      try {
        subscriber([...this.notifications]);
      } catch (error) {
        console.error('Error notifying subscriber:', error);
      }
    });
  }

  subscribe(callback: (notifications: AppNotification[]) => void): () => void {
    this.subscribers.push(callback);
    // Immediately call with current notifications
    callback([...this.notifications]);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  getNotifications(): AppNotification[] {
    return [...this.notifications];
  }

  addNotification(notification: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>): AppNotification {
    const newNotification: AppNotification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      isRead: false
    };

    this.notifications.unshift(newNotification);
    this.saveNotifications();
    this.notifySubscribers();

    return newNotification;
  }

  markAsRead(notificationId: string): void {
    const index = this.notifications.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      this.notifications[index].isRead = true;
      this.saveNotifications();
      this.notifySubscribers();
    }
  }

  markAllAsRead(): void {
    this.notifications.forEach(n => n.isRead = true);
    this.saveNotifications();
    this.notifySubscribers();
  }

  removeNotification(notificationId: string): void {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.saveNotifications();
    this.notifySubscribers();
  }

  clearAll(): void {
    this.notifications = [];
    this.saveNotifications();
    this.notifySubscribers();
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }
}

export const notificationService = new NotificationService();