import { Platform } from 'react-native';
import { supabase } from './supabase';

// Conditional import for expo-notifications
let Notifications: any = null;
let isExpoGo = true; // Default to true to avoid errors in Expo Go

// Only try to import if not in Expo Go
if (__DEV__) {
  try {
    // Check if we're in Expo Go by looking for Expo Go specific globals
    if (typeof global !== 'undefined' && global.expo) {
      isExpoGo = true;
      console.log('⚠️ Detected Expo Go - push notifications disabled');
    } else {
      Notifications = require('expo-notifications');
      isExpoGo = false;
    }
  } catch (error) {
    isExpoGo = true;
    console.log('⚠️ expo-notifications not available');
  }
}

// Notification handler configuration (only if available)
if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export class NotificationService {
  private static instance: NotificationService;
  private expoPushToken: string | null = null;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Request notification permissions
  async requestPermissions(): Promise<boolean> {
    if (!Notifications || isExpoGo) {
      console.log('⚠️ Notifications not available in Expo Go');
      return false;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('❌ Notification permission denied');
        return false;
      }

      console.log('✅ Notification permissions granted');
      return true;
    } catch (error) {
      console.error('❌ Error requesting notification permissions:', error);
      return false;
    }
  }

  // Register for push notifications and get token
  async registerForPushNotifications(): Promise<string | null> {
    if (!Notifications || isExpoGo) {
      console.log('⚠️ Push notifications not available in Expo Go');
      return null;
    }

    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      // Get the push token
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'c3093a8d-3f0d-448b-b84a-ba1cad7c4775', // From app.json
      });

      this.expoPushToken = token.data;
      console.log('📱 Expo push token:', this.expoPushToken);

      // Save token to user profile in Supabase
      await this.saveTokenToDatabase(this.expoPushToken || '');

      return this.expoPushToken;
    } catch (error) {
      console.error('❌ Error registering for push notifications:', error);
      return null;
    }
  }

  // Save push token to user profile
  private async saveTokenToDatabase(token: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if push_token column exists first
      const { data: columnExists, error: columnError } = await supabase
        .from('profiles')
        .select('push_token')
        .limit(1);

      if (columnError && columnError.code === 'PGRST204') {
        console.log('⚠️ push_token column does not exist, skipping token save');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ push_token: token })
        .eq('id', user.id);

      if (error) {
        console.error('❌ Error saving push token:', error);
      } else {
        console.log('✅ Push token saved to database');
      }
    } catch (error) {
      console.error('❌ Error in saveTokenToDatabase:', error);
    }
  }

  // Send local notification
  async sendLocalNotification(title: string, body: string, data?: any) {
    if (!Notifications || isExpoGo) {
      console.log('⚠️ Local notifications not available in Expo Go');
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: 'default',
        },
        trigger: null, // Show immediately
      });
      console.log('✅ Local notification sent:', title);
    } catch (error) {
      console.error('❌ Error sending local notification:', error);
    }
  }

  // Send push notification to specific user
  async sendPushNotification(
    recipientUserId: string,
    title: string,
    body: string,
    data?: any
  ) {
    try {
      // Get recipient's push token
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('push_token')
        .eq('id', recipientUserId)
        .single();

      if (error) {
        if (error.code === 'PGRST204') {
          console.log('⚠️ push_token column does not exist, skipping push notification');
          return;
        }
        console.log('⚠️ Error fetching user profile:', error);
        return;
      }

      if (!profile?.push_token) {
        console.log('⚠️ No push token found for user:', recipientUserId);
        return;
      }

      // Send push notification via Expo
      const message = {
        to: profile.push_token,
        sound: 'default',
        title,
        body,
        data: data || {},
      };

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (response.ok) {
        console.log('✅ Push notification sent successfully');
      } else {
        console.error('❌ Failed to send push notification:', response.status);
      }
    } catch (error) {
      console.error('❌ Error sending push notification:', error);
    }
  }

  // Handle new message notification
  async handleNewMessage(message: any) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || message.receiver_id !== user.id) {
        return; // Not for current user
      }

      // Get sender's profile
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', message.sender_id)
        .single();

      const senderName = senderProfile 
        ? `${senderProfile.first_name} ${senderProfile.last_name}`
        : 'Bilinmeyen Kullanıcı';

      // Send local notification
      await this.sendLocalNotification(
        'Yeni Mesaj',
        `${senderName}: ${message.content}`,
        {
          type: 'message',
          conversationId: message.conversation_id,
          senderId: message.sender_id,
        }
      );

      console.log('📱 New message notification sent');
    } catch (error) {
      console.error('❌ Error handling new message notification:', error);
    }
  }

  // Clear all notifications
  async clearAllNotifications() {
    if (!Notifications || isExpoGo) {
      console.log('⚠️ Clear notifications not available in Expo Go');
      return;
    }

    try {
      await Notifications.dismissAllNotificationsAsync();
      console.log('✅ All notifications cleared');
    } catch (error) {
      console.error('❌ Error clearing notifications:', error);
    }
  }

  // Get notification token
  getToken(): string | null {
    return this.expoPushToken;
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();
