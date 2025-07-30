import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase.config';

// Configure how notifications should behave
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

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

    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
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
      return token;
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      throw error;
    }
  },

  // Send a local notification (for testing)
  async scheduleLocalNotification(title, body, data = {}) {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: null, // Show immediately
      });
      return notificationId;
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
