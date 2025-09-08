import { supabase } from '@/integrations/supabase/client';
import { pushNotificationService, PushNotificationData } from './pushNotificationService';

export interface UserNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'general' | 'loyalty' | 'order' | 'delivery' | 'payment';
  is_read: boolean;
  action_url?: string;
  created_at: string;
  read_at?: string;
}

export class NotificationService {
  // Get user notifications
  static async getUserNotifications(userId: string, limit: number = 10): Promise<UserNotification[]> {
    try {
      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching user notifications:', error);
        return [];
      }

      return (data || []) as UserNotification[];
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      return [];
    }
  }

  // Get unread notifications count
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('user_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Error fetching unread count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  // Mark all notifications as read
  static async markAllAsRead(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('user_notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return 0;
    }
  }

  // Create loyalty program notification
  static async createLoyaltyNotification(
    userId: string,
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    actionUrl?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_notifications')
        .insert({
          user_id: userId,
          title,
          message,
          type,
          category: 'loyalty',
          action_url: actionUrl
        });

      if (error) {
        console.error('Error creating loyalty notification:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error creating loyalty notification:', error);
      return false;
    }
  }

  // Notify user when redemption becomes available
  static async notifyRedemptionAvailable(userId: string): Promise<boolean> {
    return this.createLoyaltyNotification(
      userId,
      '🎉 Points Redemption is Now Available!',
      'Great news! You can now redeem your accumulated points for discounts on purchases. Check your wallet to see your available balance and start redeeming!',
      'success',
      '/shop' // Redirect to shop where they can use points
    );
  }

  // Notify user about points earned
  static async notifyPointsEarned(userId: string, points: number, reason: string): Promise<boolean> {
    return this.createLoyaltyNotification(
      userId,
      `🎉 You earned ${points} points!`,
      `Congratulations! You've earned ${points} points for ${reason}. Keep earning more points and you'll be able to redeem them soon!`,
      'success'
    );
  }

  // Notify user about milestone achievements
  static async notifyMilestone(userId: string, milestone: string, points: number): Promise<boolean> {
    return this.createLoyaltyNotification(
      userId,
      `🏆 Milestone Achieved: ${milestone}!`,
      `You've reached ${milestone} with ${points} points! You're building up a great balance for when redemption launches.`,
      'success'
    );
  }

  // Notify vendors when subscription becomes available
  static async notifyVendorSubscriptionAvailable(vendorId: string): Promise<boolean> {
    return this.createLoyaltyNotification(
      vendorId,
      '🚀 Vendor Subscriptions Now Available!',
      'Great news! Vendor subscriptions are now active. Upgrade to Premium to unlock advanced features, lower commission rates, and priority support!',
      'success',
      '/vendor-dashboard' // Redirect to vendor dashboard
    );
  }

  // Notify vendors about subscription benefits
  static async notifyVendorSubscriptionBenefits(vendorId: string): Promise<boolean> {
    return this.createLoyaltyNotification(
      vendorId,
      '💎 Premium Vendor Benefits Coming Soon!',
      'Get ready for exclusive vendor benefits including lower commission rates, priority support, and advanced analytics. Stay tuned!',
      'info'
    );
  }

  // Notify customers when premium plans become available
  static async notifyCustomerPremiumAvailable(userId: string): Promise<boolean> {
    return this.createLoyaltyNotification(
      userId,
      '🌟 Customer Premium Plans Now Available!',
      'Great news! Premium customer plans are now active. Upgrade to unlock exclusive benefits, faster delivery, and premium support!',
      'success',
      '/shop' // Redirect to shop where they can see premium options
    );
  }

  // Notify customers about premium benefits
  static async notifyCustomerPremiumBenefits(userId: string): Promise<boolean> {
    return this.createLoyaltyNotification(
      userId,
      '💫 Premium Customer Benefits Coming Soon!',
      'Get ready for exclusive customer benefits including faster delivery, premium support, exclusive deals, and enhanced shopping experience. Stay tuned!',
      'info'
    );
  }

  // ===== PUSH NOTIFICATION METHODS =====

  // Send push notification to user
  static async sendPushNotification(userId: string, notification: PushNotificationData) {
    try {
      // Create in-app notification
      await this.createLoyaltyNotification(
        userId,
        notification.title,
        notification.body,
        'info',
        notification.click_action
      );

      // Send push notification
      await pushNotificationService.sendToUser(userId, notification);
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  // Send order update notification
  static async notifyOrderUpdate(userId: string, orderNumber: string, status: string) {
    const notification: PushNotificationData = {
      title: 'Order Update 📦',
      body: `Your order #${orderNumber} has been ${status.toLowerCase()}`,
      data: {
        action_type: 'order_update',
        order_number: orderNumber,
        status: status
      },
      click_action: '/orders'
    };

    await this.sendPushNotification(userId, notification);
  }

  // Send payment success notification
  static async notifyPaymentSuccess(userId: string, amount: number, method: string) {
    const notification: PushNotificationData = {
      title: 'Payment Successful! 💰',
      body: `Your ${method} payment of ${amount} KES was successful`,
      data: {
        action_type: 'payment_success',
        amount: amount,
        method: method
      },
      click_action: '/wallet'
    };

    await this.sendPushNotification(userId, notification);
  }

  // Send new message notification
  static async notifyNewMessage(userId: string, senderName: string) {
    const notification: PushNotificationData = {
      title: 'New Message 💬',
      body: `${senderName} sent you a message`,
      data: {
        action_type: 'new_message',
        sender_name: senderName
      },
      click_action: '/chat'
    };

    await this.sendPushNotification(userId, notification);
  }

  // Send points earned notification
  static async notifyPointsEarnedPush(userId: string, points: number, reason: string) {
    const notification: PushNotificationData = {
      title: 'Points Earned! 🎉',
      body: `You earned ${points} points for ${reason}. Keep earning to unlock rewards!`,
      data: {
        action_type: 'points_earned',
        points: points,
        reason: reason
      },
      click_action: '/wallet'
    };

    await this.sendPushNotification(userId, notification);
  }

  // Send vendor order notification
  static async notifyVendorNewOrder(vendorId: string, orderNumber: string, total: number) {
    const notification: PushNotificationData = {
      title: 'New Order! 🛍️',
      body: `You received a new order #${orderNumber} worth ${total} KES`,
      data: {
        action_type: 'vendor_order',
        order_number: orderNumber,
        total: total
      },
      click_action: '/vendor-dashboard?section=orders'
    };

    await this.sendPushNotification(vendorId, notification);
  }

  // Send promotional notification
  static async sendPromotionalNotification(userIds: string[], title: string, message: string, actionUrl?: string) {
    const notification: PushNotificationData = {
      title,
      body: message,
      data: {
        action_type: 'promotional',
        action_url: actionUrl
      },
      click_action: actionUrl || '/'
    };

    await pushNotificationService.sendToUsers(userIds, notification);
  }

  // Send custom notification with full control
  static async sendCustomNotification(
    userId: string, 
    notification: {
      title: string;
      body: string;
      icon?: string;
      badge?: string;
      image?: string;
      tag?: string;
      requireInteraction?: boolean;
      silent?: boolean;
      data?: Record<string, unknown>;
      click_action?: string;
    }
  ) {
    const pushNotification: PushNotificationData = {
      title: notification.title,
      body: notification.body,
      icon: notification.icon,
      badge: notification.badge,
      image: notification.image,
      tag: notification.tag,
      requireInteraction: notification.requireInteraction,
      silent: notification.silent,
      data: notification.data,
      click_action: notification.click_action
    };

    await this.sendPushNotification(userId, pushNotification);
  }

  // Send notification to multiple users with filtering
  static async sendBulkNotification(
    userIds: string[],
    notification: PushNotificationData,
    options?: {
      excludeInactiveUsers?: boolean;
      excludeUnsubscribedUsers?: boolean;
      userFilter?: (userId: string) => Promise<boolean>;
    }
  ) {
    let filteredUserIds = userIds;

    // Apply filters if provided
    if (options?.userFilter) {
      const validUsers = [];
      for (const userId of filteredUserIds) {
        if (await options.userFilter(userId)) {
          validUsers.push(userId);
        }
      }
      filteredUserIds = validUsers;
    }

    await pushNotificationService.sendToUsers(filteredUserIds, notification);
  }

  // Send notification based on user preferences
  static async sendPreferenceBasedNotification(
    userId: string,
    notification: PushNotificationData,
    category: 'marketing' | 'order' | 'payment' | 'chat' | 'system'
  ) {
    // Check user preferences (you'll need to implement this)
    const userPrefs = await this.getUserNotificationPreferences(userId);
    
    if (userPrefs[category]) {
      await this.sendPushNotification(userId, notification);
    } else {
      // Only send in-app notification if push is disabled
      await this.createLoyaltyNotification(
        userId,
        notification.title,
        notification.body,
        'info',
        notification.click_action
      );
    }
  }

  // Get user notification preferences (placeholder)
  static async getUserNotificationPreferences(userId: string) {
    // This should query your user preferences table
    // For now, return default preferences
    return {
      marketing: true,
      order: true,
      payment: true,
      chat: true,
      system: true
    };
  }

  // Send notification with different priorities
  static async sendPriorityNotification(
    userId: string,
    notification: PushNotificationData,
    priority: 'low' | 'normal' | 'high' | 'urgent'
  ) {
    const priorityNotification: PushNotificationData = {
      ...notification,
      data: {
        ...notification.data,
        priority: priority
      },
      requireInteraction: priority === 'urgent',
      silent: priority === 'low'
    };

    await this.sendPushNotification(userId, priorityNotification);
  }

  // Send notification to users based on criteria
  static async sendTargetedNotification(
    criteria: {
      userType?: 'customer' | 'vendor' | 'admin';
      location?: string;
      lastActive?: Date;
      subscriptionType?: string;
      customFilter?: (userId: string) => Promise<boolean>;
    },
    notification: PushNotificationData
  ) {
    // Get users based on criteria
    let userIds = await this.getUsersByCriteria(criteria);
    
    if (criteria.customFilter) {
      const filteredUsers = [];
      for (const userId of userIds) {
        if (await criteria.customFilter(userId)) {
          filteredUsers.push(userId);
        }
      }
      userIds = filteredUsers;
    }

    await pushNotificationService.sendToUsers(userIds, notification);
  }

  // Get users by criteria (placeholder)
  static async getUsersByCriteria(criteria: {
    userType?: 'customer' | 'vendor' | 'admin';
    location?: string;
    lastActive?: Date;
    subscriptionType?: string;
    customFilter?: (userId: string) => Promise<boolean>;
  }): Promise<string[]> {
    // This should query your users table based on criteria
    // For now, return empty array
    return [];
  }
}
