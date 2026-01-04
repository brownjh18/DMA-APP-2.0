export interface AppNotification {
  id: string;
  timestamp: number;
  isRead: boolean;
  title: string;
  message: string;
  category: string;
  url?: string;
}