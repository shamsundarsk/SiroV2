import { Alert } from 'react-native';

export interface NotificationData {
  taskId?: string;
  type: 'task_reminder' | 'task_due' | 'idle_alert' | 'voice_agent';
  title: string;
  body: string;
}

class SimpleNotificationService {
  private isEnabled = false;

  async initialize(): Promise<boolean> {
    // For now, just use alerts instead of real notifications
    this.isEnabled = true;
    console.log('📱 Simple notification service initialized (using alerts)');
    return true;
  }

  async scheduleTaskReminder(
    taskTitle: string,
    taskId: string,
    dueDate: number,
    reminderMinutes: number
  ): Promise<string | null> {
    console.log(`📋 Task reminder scheduled: ${taskTitle} in ${reminderMinutes} minutes`);
    
    // For demo, we'll just log this
    setTimeout(() => {
      if (this.isEnabled) {
        Alert.alert(
          '📋 Task Reminder',
          `"${taskTitle}" is due in ${reminderMinutes} minutes`,
          [{ text: 'OK' }]
        );
      }
    }, (dueDate - Date.now() - reminderMinutes * 60 * 1000));
    
    return 'scheduled';
  }

  async scheduleTaskDueNotification(
    taskTitle: string,
    taskId: string,
    dueDate: number
  ): Promise<string | null> {
    console.log(`⏰ Task due notification scheduled: ${taskTitle}`);
    
    setTimeout(() => {
      if (this.isEnabled) {
        Alert.alert(
          '⏰ Task Due Now',
          `"${taskTitle}" is due now!`,
          [{ text: 'OK' }]
        );
      }
    }, dueDate - Date.now());
    
    return 'scheduled';
  }

  async sendIdleAlert(idleMinutes: number): Promise<void> {
    if (!this.isEnabled) return;
    
    console.log(`💤 Idle alert: ${idleMinutes} minutes`);
    Alert.alert(
      '💤 Idle Alert',
      `You've been idle for ${idleMinutes} minutes. Time to get back to work!`,
      [{ text: 'Back to Work!' }]
    );
  }

  async sendVoiceAgentAlert(): Promise<void> {
    if (!this.isEnabled) return;
    
    console.log('📞 Voice Agent Alert sent!');
    Alert.alert(
      '🤖 AI Voice Agent',
      'You left the app with a running timer. Time to get back to work! 💪\n\n(In production: This would be a phone call)',
      [
        { text: 'Ignore', style: 'cancel' },
        { text: 'Back to Work!', style: 'default' }
      ]
    );
  }

  async cancelNotification(notificationId: string): Promise<void> {
    console.log(`Cancelled notification: ${notificationId}`);
  }

  async cancelAllNotifications(): Promise<void> {
    console.log('Cancelled all notifications');
  }

  getExpoPushToken(): string | null {
    return null;
  }

  // Dummy listeners for compatibility
  addNotificationReceivedListener(listener: (notification: any) => void): { remove: () => void } {
    return { remove: () => {} };
  }

  addNotificationResponseReceivedListener(listener: (response: any) => void): { remove: () => void } {
    return { remove: () => {} };
  }
}

export default new SimpleNotificationService();