import { supabase } from '@/integrations/supabase/client';

export interface PushNotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  data?: Record<string, any>;
  click_action?: string;
}

class PushNotificationService {
  private static instance: PushNotificationService;
  private currentUserId?: string;

  private constructor() {}

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  // Initialize the service with user ID
  async initialize(userId?: string) {
    this.currentUserId = userId;
    
    // For web, we'll use the Web Push API
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
        
        // Request notification permission
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          await this.saveTokenToDatabase();
        }
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  // Save token to database
  private async saveTokenToDatabase() {
    if (!this.currentUserId) return;

    try {
      // For web, we'll store subscription info
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        const { error } = await supabase
          .from('notification_tokens')
          .upsert({
            user_id: this.currentUserId,
            token: JSON.stringify(subscription),
            platform: 'web',
            is_active: true
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving token to database:', error);
    }
  }

  // Send notification to a specific user
  async sendToUser(userId: string, notification: PushNotificationData) {
    try {
      const { data, error } = await supabase.functions.invoke('push-notifications', {
        body: {
          action: 'send-to-user',
          userId: userId,
          notification: notification
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error sending notification to user:', error);
      throw error;
    }
  }

  // Send notification to multiple users
  async sendToUsers(userIds: string[], notification: PushNotificationData) {
    try {
      const { data, error } = await supabase.functions.invoke('push-notifications', {
        body: {
          action: 'send',
          tokens: userIds, // This will be converted to tokens in the function
          notification: notification
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error sending notification to users:', error);
      throw error;
    }
  }

  // Send notification to a specific token
  async sendToToken(token: string, notification: PushNotificationData) {
    try {
      const { data, error } = await supabase.functions.invoke('push-notifications', {
        body: {
          action: 'send',
          tokens: [token],
          notification: notification
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error sending notification to token:', error);
      throw error;
    }
  }

  // Update user ID
  updateUserId(userId: string) {
    this.currentUserId = userId;
  }

  // Remove token when user logs out
  async removeToken() {
    if (!this.currentUserId) return;

    try {
      const { error } = await supabase
        .from('notification_tokens')
        .update({ is_active: false })
        .eq('user_id', this.currentUserId)
        .eq('platform', 'web');

      if (error) throw error;
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }
}

export const pushNotificationService = PushNotificationService.getInstance();
