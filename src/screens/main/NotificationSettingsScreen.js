import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../../utils/AuthContext';
import { notificationService } from '../../services/notificationService';

const NotificationSettingsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    messageNotifications: true,
    savedItemSoldNotifications: true,
    pushNotificationsEnabled: true,
  });
  const [pushPermissionStatus, setPushPermissionStatus] = useState('unknown');

  useEffect(() => {
    loadNotificationSettings();
    checkPushPermissions();
  }, []);

  const checkPushPermissions = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setPushPermissionStatus(status);
    } catch (error) {
      console.error('Error checking push permissions:', error);
      setPushPermissionStatus('unavailable');
    }
  };

  const loadNotificationSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(`notificationSettings_${user.uid}`);
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveNotificationSettings = async (newSettings) => {
    try {
      setSaving(true);
      await AsyncStorage.setItem(
        `notificationSettings_${user.uid}`,
        JSON.stringify(newSettings)
      );
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving notification settings:', error);
      Alert.alert('Error', 'Failed to save notification settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleSetting = (key) => {
    const newSettings = {
      ...settings,
      [key]: !settings[key],
    };
    saveNotificationSettings(newSettings);
  };

  const renderSettingItem = (title, subtitle, key, icon) => (
    <View style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={24} color="#4285f4" />
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          <Text style={styles.settingSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <Switch
        value={settings[key]}
        onValueChange={() => toggleSetting(key)}
        trackColor={{ false: '#e2e8f0', true: '#4285f4' }}
        thumbColor={settings[key] ? '#ffffff' : '#ffffff'}
        disabled={saving}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4285f4" />
        <Text style={styles.loadingText}>Loading notification settings...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notification Settings</Text>
        <Text style={styles.headerSubtitle}>Manage your notification preferences</Text>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Push Notifications Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Push Notifications</Text>
          
          {/* Permission Status Info */}
          <View style={styles.permissionStatus}>
            <View style={styles.permissionStatusIcon}>
              <Ionicons 
                name={pushPermissionStatus === 'granted' ? 'checkmark-circle' : 
                      pushPermissionStatus === 'denied' ? 'close-circle' : 'help-circle'} 
                size={20} 
                color={pushPermissionStatus === 'granted' ? '#10b981' : 
                       pushPermissionStatus === 'denied' ? '#ef4444' : '#f59e0b'} 
              />
            </View>
            <Text style={styles.permissionStatusText}>
              {pushPermissionStatus === 'granted' ? 'Push notifications are enabled' :
               pushPermissionStatus === 'denied' ? 'Push notifications are disabled in device settings' :
               pushPermissionStatus === 'undetermined' ? 'Push notification permission not requested yet' :
               'Checking push notification status...'}
            </Text>
          </View>
          
          {renderSettingItem(
            'App Notification Preferences',
            pushPermissionStatus === 'granted' ? 
              'Control which notifications you receive' :
              'Enable device permissions first to receive notifications',
            'pushNotificationsEnabled',
            'notifications'
          )}
        </View>

        {/* Message Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Messages</Text>
          {renderSettingItem(
            'New Message Notifications',
            'Get notified when you receive new messages',
            'messageNotifications',
            'chatbubble'
          )}
        </View>

        {/* Saved Items Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Saved Items</Text>
          {renderSettingItem(
            'Saved Item Sold Notifications',
            'Get notified when an item you saved gets sold',
            'savedItemSoldNotifications',
            'heart'
          )}
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={20} color="#6b7280" />
            <Text style={styles.infoText}>
              You can change these settings anytime. Some notifications may still appear in the app even if push notifications are disabled.
            </Text>
          </View>
        </View>

        {/* iPhone Setup Button */}
        {Platform.OS === 'ios' && pushPermissionStatus !== 'granted' && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.setupButton}
              onPress={async () => {
                try {
                  await notificationService.setupiOSPushNotifications(user.uid);
                  await checkPushPermissions(); // Refresh permission status
                  Alert.alert(
                    'Success!', 
                    'Push notifications are now enabled for iPhone. You can test them below.'
                  );
                } catch (error) {
                  console.error('Error setting up iOS notifications:', error);
                  Alert.alert(
                    'Setup Failed',
                    error.message || 'Failed to setup push notifications. Please check your device settings.',
                    [
                      { text: 'Cancel' },
                      { text: 'Open Settings', onPress: () => Notifications.openSettingsAsync() }
                    ]
                  );
                }
              }}
            >
              <Ionicons name="phone-portrait" size={20} color="#ffffff" />
              <Text style={styles.setupButtonText}>Setup iPhone Notifications</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Test Notification Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.testButton}
            onPress={async () => {
              if (pushPermissionStatus === 'granted') {
                try {
                  await notificationService.scheduleLocalNotification(
                    'Test Notification',
                    'This is how Markt notifications will appear on your iPhone!',
                    { test: true, type: 'test' }
                  );
                  Alert.alert('Success', 'Test notification sent! Check your notification panel and lock screen.');
                } catch (error) {
                  console.error('Error sending test notification:', error);
                  Alert.alert('Error', 'Failed to send test notification.');
                }
              } else {
                Alert.alert(
                  'Permission Required',
                  Platform.OS === 'ios' ? 
                    'Please use the "Setup iPhone Notifications" button above first.' :
                    'Please enable push notifications in your device settings first.',
                  [
                    { text: 'Cancel' },
                    { text: 'Open Settings', onPress: () => Notifications.openSettingsAsync() }
                  ]
                );
              }
            }}
          >
            <Ionicons name="send" size={20} color="#4285f4" />
            <Text style={styles.testButtonText}>Test Notification</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {saving && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator size="small" color="#4285f4" />
          <Text style={styles.savingText}>Saving...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a365d',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  scrollContainer: {
    flex: 1,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a365d',
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 8,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a365d',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoSection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4285f4',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  setupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4285f4',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 12,
  },
  setupButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  testButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#4285f4',
    fontWeight: '500',
  },
  permissionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  permissionStatusIcon: {
    marginRight: 8,
  },
  permissionStatusText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 18,
  },
  savingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  savingText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#4285f4',
    fontWeight: '500',
  },
});

export default NotificationSettingsScreen;
