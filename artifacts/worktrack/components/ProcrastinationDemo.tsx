import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/context/AppContext';
import NotificationService from '../services/SimpleNotificationService';

const API_BASE_URL = "http://192.168.67.85:3000/api/worktrack";

export default function ProcrastinationDemo() {
  const { userProfile, runningTimer, settings, syncToAPI } = useApp();
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStep, setSimulationStep] = useState(0);
  const [showInstagramModal, setShowInstagramModal] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const simulationSteps = [
    "🏃‍♂️ Leaving WorkTrack app...",
    "📱 Opening Instagram...",
    "📸 Scrolling through posts...",
    "⏰ AI Agent detecting procrastination...",
    "📞 Calling employee...",
    "📊 Sending report to HR..."
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  const startProcrastinationDemo = async () => {
    if (!runningTimer) {
      Alert.alert(
        "No Timer Running", 
        "Please start a timer first to simulate procrastination detection.",
        [{ text: "OK" }]
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsSimulating(true);
    setSimulationStep(0);

    // Step 1: Leaving app
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSimulationStep(1);

    // Step 2: Opening Instagram
    await new Promise(resolve => setTimeout(resolve, 1500));
    setShowInstagramModal(true);
    setSimulationStep(2);

    // Step 3: Scrolling (simulate time passing)
    await new Promise(resolve => setTimeout(resolve, 2000));
    setSimulationStep(3);

    // Step 4: AI Detection
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSimulationStep(4);

    // Step 5: Voice Agent Call
    await triggerVoiceAgentCall();
    setSimulationStep(5);

    // Step 6: HR Report
    await sendHRReport();
    setSimulationStep(6);

    // Complete simulation
    await new Promise(resolve => setTimeout(resolve, 2000));
    setShowInstagramModal(false);
    setIsSimulating(false);
    setSimulationStep(0);

    Alert.alert(
      "🎯 Demo Complete!",
      "The AI agent detected procrastination, sent a voice alert, and reported to HR. Check the API server console for the HR report data.",
      [{ text: "Awesome!" }]
    );
  };

  const triggerVoiceAgentCall = async () => {
    // Send voice agent notification immediately for demo
    await NotificationService.sendVoiceAgentAlert();
    
    console.log('🤖 Voice Agent Alert Sent!');
    console.log('📞 In real scenario, this would trigger a phone call to the employee');
    console.log('💬 Message: "Hi! I noticed you left WorkTrack with a timer running. Time to get back to work!"');
    
    // Simulate countdown for "call" - shorter for demo
    setCountdown(5);
    
    // Wait for countdown
    await new Promise(resolve => setTimeout(resolve, 5000));
  };

  const sendHRReport = async () => {
    if (!userProfile) return;

    try {
      const procrastinationReport = {
        employeeId: userProfile.id,
        employeeName: userProfile.name,
        firmName: userProfile.firmName,
        timestamp: Date.now(),
        event: "procrastination_detected",
        details: {
          timerRunning: true,
          appLeft: "WorkTrack",
          appOpened: "Instagram",
          timeWasted: "3 minutes 15 seconds",
          aiAgentCalled: true,
          callDuration: "45 seconds",
          employeeResponse: "Returned to work",
          productivityImpact: "Medium"
        },
        location: "Office/Remote",
        deviceInfo: {
          platform: "Mobile",
          appVersion: "1.0.0"
        }
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      // Send to API server
      const response = await fetch(`${API_BASE_URL}/procrastination-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(procrastinationReport),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log('📊 HR Report sent successfully');
        // Also sync regular data
        await syncToAPI();
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.log('HR report failed (API server may be offline):', error.message);
      // Continue with demo even if API fails
    }
  };

  const InstagramModal = () => (
    <Modal visible={showInstagramModal} animationType="slide">
      <LinearGradient
        colors={['#833AB4', '#FD1D1D', '#FCB045']}
        style={styles.instagramContainer}
      >
        <View style={styles.instagramHeader}>
          <Feather name="camera" size={24} color="#fff" />
          <Text style={styles.instagramTitle}>Instagram</Text>
          <Feather name="send" size={24} color="#fff" />
        </View>

        <View style={styles.instagramContent}>
          <View style={styles.instagramPost}>
            <View style={styles.postHeader}>
              <View style={styles.avatar} />
              <Text style={styles.username}>@friend_account</Text>
            </View>
            <View style={styles.postImage}>
              <Text style={styles.postImageText}>📸 Vacation Photo</Text>
            </View>
            <View style={styles.postActions}>
              <Feather name="heart" size={20} color="#fff" />
              <Feather name="message-circle" size={20} color="#fff" />
              <Feather name="send" size={20} color="#fff" />
            </View>
          </View>

          {countdown > 0 && (
            <View style={styles.callOverlay}>
              <View style={styles.callBox}>
                <Feather name="phone" size={40} color={Colors.primary} />
                <Text style={styles.callText}>🤖 AI Voice Agent</Text>
                <Text style={styles.callCountdown}>{countdown}s</Text>
                <Text style={styles.callMessage}>
                  "Hi! I noticed you left WorkTrack with a timer running. 
                  Time to get back to work! 💪"
                </Text>
                <Text style={styles.callNote}>
                  📞 In production: Real phone call would be made
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.simulationStatus}>
          <Text style={styles.simulationText}>
            {simulationSteps[simulationStep]}
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${((simulationStep + 1) / simulationSteps.length) * 100}%` }
              ]} 
            />
          </View>
        </View>
      </LinearGradient>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Feather name="zap" size={24} color={Colors.warning} />
        <Text style={styles.title}>Procrastination Demo</Text>
      </View>

      <Text style={styles.description}>
        Test the AI voice agent by simulating leaving the app to use Instagram while a timer is running.
      </Text>

      <View style={styles.features}>
        <View style={styles.feature}>
          <Feather name="eye" size={16} color={Colors.primary} />
          <Text style={styles.featureText}>AI detects app switching</Text>
        </View>
        <View style={styles.feature}>
          <Feather name="phone" size={16} color={Colors.primary} />
          <Text style={styles.featureText}>Voice agent calls employee</Text>
        </View>
        <View style={styles.feature}>
          <Feather name="bar-chart" size={16} color={Colors.primary} />
          <Text style={styles.featureText}>Report sent to HR dashboard</Text>
        </View>
      </View>

      <Pressable
        style={[
          styles.demoButton,
          { opacity: isSimulating ? 0.6 : 1 }
        ]}
        onPress={startProcrastinationDemo}
        disabled={isSimulating}
      >
        <LinearGradient
          colors={isSimulating ? ['#666', '#444'] : [Colors.warning, '#FF6B35']}
          style={styles.buttonGradient}
        >
          {isSimulating ? (
            <>
              <Feather name="loader" size={20} color="#fff" />
              <Text style={styles.buttonText}>Running Demo...</Text>
            </>
          ) : (
            <>
              <Feather name="play" size={20} color="#fff" />
              <Text style={styles.buttonText}>Start Procrastination Demo</Text>
            </>
          )}
        </LinearGradient>
      </Pressable>

      {runningTimer ? (
        <View style={styles.timerStatus}>
          <Feather name="clock" size={16} color={Colors.accent} />
          <Text style={styles.timerText}>Timer running - Ready for demo!</Text>
        </View>
      ) : (
        <View style={styles.timerStatus}>
          <Feather name="alert-circle" size={16} color={Colors.error} />
          <Text style={[styles.timerText, { color: Colors.error }]}>
            Start a timer first to enable demo
          </Text>
        </View>
      )}

      <InstagramModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.warning,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  features: {
    gap: 8,
    marginBottom: 20,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 13,
    color: '#555',
  },
  demoButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  timerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 13,
    color: Colors.accent,
    fontWeight: '500',
  },
  instagramContainer: {
    flex: 1,
  },
  instagramHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 60,
  },
  instagramTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  instagramContent: {
    flex: 1,
    padding: 16,
  },
  instagramPost: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  username: {
    color: '#fff',
    fontWeight: '600',
  },
  postImage: {
    height: 200,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  postImageText: {
    color: '#fff',
    fontSize: 16,
  },
  postActions: {
    flexDirection: 'row',
    gap: 16,
  },
  callOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  callBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    maxWidth: 300,
  },
  callText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
  },
  callCountdown: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.warning,
  },
  callMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  callNote: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  simulationStatus: {
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  simulationText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
  },
});