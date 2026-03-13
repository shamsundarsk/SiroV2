import React from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import NotificationService from '../services/NotificationService';
import Colors from '@/constants/colors';

export default function NotificationTest() {
  const testTaskReminder = async () => {
    const notificationId = await NotificationService.scheduleTaskReminder(
      'Test Task',
      'test-task-id',
      Date.now() + 10000, // 10 seconds from now
      0 // 0 minutes before (immediate)
    );
    
    if (notificationId) {
      Alert.alert('Success', 'Task reminder scheduled for 10 seconds from now');
    } else {
      Alert.alert('Error', 'Failed to schedule notification');
    }
  };

  const testIdleAlert = async () => {
    await NotificationService.sendIdleAlert(5);
    Alert.alert('Success', 'Idle alert sent immediately');
  };

  const testVoiceAgent = async () => {
    await NotificationService.sendVoiceAgentAlert();
    Alert.alert('Success', 'Voice agent alert sent immediately');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notification Tests</Text>
      
      <Pressable style={styles.button} onPress={testTaskReminder}>
        <Feather name="clock" size={16} color="#fff" />
        <Text style={styles.buttonText}>Test Task Reminder (10s)</Text>
      </Pressable>

      <Pressable style={styles.button} onPress={testIdleAlert}>
        <Feather name="moon" size={16} color="#fff" />
        <Text style={styles.buttonText}>Test Idle Alert</Text>
      </Pressable>

      <Pressable style={styles.button} onPress={testVoiceAgent}>
        <Feather name="phone" size={16} color="#fff" />
        <Text style={styles.buttonText}>Test Voice Agent Alert</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: Colors.primary,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});