const Notification = require('../models/Notification');
const User = require('../models/User');

class NotificationService {
  // Create notifications for all users when new content is added
  async createContentNotification(contentType, contentId, title, message, contentData = {}) {
    try {
      console.log(`Creating ${contentType} notifications for all users`);

      // Get all users (excluding demo users and admins for now, or include them based on preference)
      const users = await User.find({
        // You can filter users here if needed, e.g., only active users
        // role: { $ne: 'admin' } // Uncomment to exclude admins
      });

      console.log(`Found ${users.length} users to notify`);

      // Create notifications for each user
      const notifications = users.map(user => ({
        userId: user._id,
        type: contentType,
        contentId: contentId,
        title: title,
        message: message,
        data: contentData
      }));

      // Bulk insert notifications
      if (notifications.length > 0) {
        const createdNotifications = await Notification.insertMany(notifications);
        console.log(`Created ${createdNotifications.length} notifications for ${contentType}: ${title}`);
        return createdNotifications;
      }

      return [];
    } catch (error) {
      console.error('Error creating content notifications:', error);
      throw error;
    }
  }

  // Create notification for specific users
  async createUserNotification(userIds, contentType, contentId, title, message, contentData = {}) {
    try {
      console.log(`Creating ${contentType} notifications for ${userIds.length} specific users`);

      const notifications = userIds.map(userId => ({
        userId: userId,
        type: contentType,
        contentId: contentId,
        title: title,
        message: message,
        data: contentData
      }));

      if (notifications.length > 0) {
        const createdNotifications = await Notification.insertMany(notifications);
        console.log(`Created ${createdNotifications.length} notifications for ${contentType}: ${title}`);
        return createdNotifications;
      }

      return [];
    } catch (error) {
      console.error('Error creating user notifications:', error);
      throw error;
    }
  }

  // Get notifications for a user
  async getUserNotifications(userId, limit = 50) {
    try {
      return await Notification.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit);
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    try {
      return await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        { isRead: true },
        { new: true }
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId) {
    try {
      return await Notification.updateMany(
        { userId, isRead: false },
        { isRead: true }
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Get unread count for a user
  async getUnreadCount(userId) {
    try {
      return await Notification.countDocuments({ userId, isRead: false });
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  // Delete notification
  async deleteNotification(notificationId, userId) {
    try {
      return await Notification.findOneAndDelete({ _id: notificationId, userId });
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();