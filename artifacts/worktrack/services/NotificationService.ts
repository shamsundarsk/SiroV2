import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface NotificationData {
  taskId?: string;
  type: 'task_reminder' | 'task_due' | 'idle_alert' | 'voice_agent';
  title: string;
  body: string;
}

class NotificationService {
  private expoPushToken: string | null = null;

  async initialize(): Promise<boolean> {
    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Notification permission denied');
        return false;
      }

      // Get push token for remote notifications
      if (Device.isDevice) {
        try {
          // For development, we'll skip the push token since it requires a valid Expo project
          console.log('Skipping push token in development mode');
          this.expoPushToken = null;
        } catch (error) {
          console.log('Failed to get push token:', error);
        }
      }

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('worktrack', {
          name: 'WorkTrack Notifications',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#3B82F6',
          sound: 'default',
        });
      }

      return true;
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      return false;
    }
  }

  async scheduleTaskReminder(
    taskTitle: string,
    taskId: string,
    dueDate: number,
    reminderMinutes: number
  ): Promise<string | null> {
    try {
      const reminderTime = new Date(dueDate - reminderMinutes * 60 * 1000);
      
      // Don't schedule if reminder time is in the past
      if (reminderTime.getTime() <= Date.now()) {
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '📋 Task Reminder',
          body: `"${taskTitle}" is due in ${reminderMinutes} minutes`,
          data: {
            taskId,
            type: 'task_reminder',
          } as NotificationData,
          sound: 'default',
        },
        trigger: {
          date: reminderTime,
        },
      });

      return notificationId;
    } catch (error) {
      console.error('Failed to schedule task reminder:', error);
      return null;
    }
  }

  async scheduleTaskDueNotification(
    taskTitle: string,
    taskId: string,
    dueDate: number
  ): Promise<string | null> {
    try {
      const dueTime = new Date(dueDate);
      
      // Don't schedule if due time is in the past
      if (dueTime.getTime() <= Date.now()) {
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Task Due Now',
          body: `"${taskTitle}" is due now!`,
          data: {
            taskId,
            type: 'task_due',
          } as NotificationData,
          sound: 'default',
        },
        trigger: {
          date: dueTime,
        },
      });

      return notificationId;
    } catch (error) {
      console.error('Failed to schedule task due notification:', error);
      return null;
    }
  }

  async sendIdleAlert(idleMinutes: number): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '💤 Idle Alert',
          body: `You've been idle for ${idleMinutes} minutes. Time to get back to work!`,
          data: {
            type: 'idle_alert',
          } as NotificationData,
          sound: 'default',
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Failed to send idle alert:', error);
    }
  }

  async sendVoiceAgentAlert(): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📞 Voice Agent Alert',
          body: 'You left the app with a running timer. Tap to return and stay focused!',
          data: {
            type: 'voice_agent',
          } as NotificationData,
          sound: 'default',
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Failed to send voice agent alert:', error);
    }
  }

  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
    }
  }

  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to get scheduled notifications:', error);
      return [];
    }
  }

  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }

  // Add notification listener
  addNotificationReceivedListener(
    listener: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(listener);
  }

  // Add notification response listener (when user taps notification)
  addNotificationResponseReceivedListener(
    listener: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }
}

export default new NotificationService();