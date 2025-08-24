import { supabase } from '@/integrations/supabase/client';

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

      if (error) throw error;
      return data || [];
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

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('mark_notification_read', {
        notification_id: notificationId
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  // Mark all notifications as read
  static async markAllAsRead(): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('mark_all_notifications_read');

      if (error) throw error;
      return data || 0;
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

      if (error) throw error;
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
}
