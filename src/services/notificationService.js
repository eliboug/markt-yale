import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// Configure how notifications should behave (iOS-optimized)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true, // Enable badge for iOS
  }),
});

// iOS-specific notification categories for better interaction
if (Platform.OS === 'ios') {
  Notifications.setNotificationCategoryAsync('message', [
    {
      identifier: 'reply',
      buttonTitle: 'Reply',
      options: {
        opensAppToForeground: true,
      },
    },
    {
      identifier: 'mark_read',
      buttonTitle: 'Mark as Read',
      options: {
        opensAppToForeground: false,
      },
    },
  ]);
}

export const notificationService = {
  async registerForPushNotifications() {
    let token;

    // Check if device supports push notifications
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4285f4',
      });
    }

    // Request permissions with iOS-specific options
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowDisplayInCarPlay: false,
          allowCriticalAlerts: false,
          provideAppNotificationSettings: false,
          allowProvisional: false,
          allowAnnouncements: false,
        },
      });
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      throw new Error('Failed to get push token for push notification!');
    }

    // Get the token
    token = (await Notifications.getExpoPushTokenAsync()).data;
    
    return token;
  },

  async savePushToken(userId, token) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        pushToken: token,
        pushTokenUpdatedAt: new Date()
      });
    } catch (error) {
      console.error('Error saving push token:', error);
      throw error;
    }
  },

  async initializePushNotifications(userId) {
    try {
      const token = await this.registerForPushNotifications();
      await this.savePushToken(userId, token);
      console.log('Push notifications initialized successfully');
      return token;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      throw error;
    }
  },

  async setupiOSPushNotifications(userId) {
    if (Platform.OS !== 'ios') {
      return null;
    }

    try {
      // Check current permission status
      const { status: currentStatus } = await Notifications.getPermissionsAsync();
      
      if (currentStatus === 'denied') {
        throw new Error('Push notifications are disabled. Please enable them in Settings.');
      }

      // Request permissions if not granted
      if (currentStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowDisplayInCarPlay: false,
            allowCriticalAlerts: false,
            provideAppNotificationSettings: false,
            allowProvisional: false,
            allowAnnouncements: false,
          },
        });

        if (status !== 'granted') {
          throw new Error('Push notification permission not granted');
        }
      }

      // Get and save push token
      const token = await this.registerForPushNotifications();
      await this.savePushToken(userId, token);
      
      console.log('iOS push notifications setup complete');
      return token;
    } catch (error) {
      console.error('iOS push notification setup failed:', error);
      throw error;
    }
  },

  // Send a local notification (iOS-optimized)
  async scheduleLocalNotification(title, body, data = {}) {
    try {
      const notificationContent = {
        title,
        body,
        data,
        sound: true,
        badge: 1,
      };

      // Add iOS-specific properties
      if (Platform.OS === 'ios') {
        notificationContent.categoryIdentifier = data.type === 'message' ? 'message' : undefined;
        notificationContent.threadIdentifier = data.chatId || 'general';
      }

      await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Error scheduling local notification:', error);
      throw error;
    }
  },

  // Listen for notification responses (when user taps notification)
  addNotificationResponseListener(listener) {
    return Notifications.addNotificationResponseReceivedListener(listener);
  },

  // Listen for notifications while app is in foreground
  addNotificationReceivedListener(listener) {
    return Notifications.addNotificationReceivedListener(listener);
  },

  // Remove listeners
  removeNotificationSubscription(subscription) {
    if (subscription) {
      subscription.remove();
    }
  },

  // Handle notification when received
  handleNotificationReceived(notification) {
    const { title, body, data } = notification.request.content;
    
    console.log('Notification received:', { title, body, data });
    
    // You can customize behavior based on notification type
    if (data?.type === 'new_message') {
      // Handle new message notification
      console.log('New message notification received');
    }
  },

  // Handle notification when user taps it
  handleNotificationResponse(response) {
    const { data } = response.notification.request.content;
    
    console.log('Notification response:', response);
    
    // Navigate to appropriate screen based on notification data
    if (data?.type === 'new_message' && data?.chatId) {
      // You would typically navigate to the chat room here
      // This would be handled in the main App component
      return {
        action: 'navigate',
        screen: 'ChatRoom',
        params: {
          chatId: data.chatId,
          chatTitle: data.chatTitle || 'Chat'
        }
      };
    }
    
    return null;
  }
};
