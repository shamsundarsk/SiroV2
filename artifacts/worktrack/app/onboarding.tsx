import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { UserRole, useApp } from "@/context/AppContext";

const { width: SCREEN_W } = Dimensions.get("window");

type Step = 0 | 1 | 2 | 3;

export default function OnboardingScreen() {
  const { completeOnboarding, updateSettings, requestNotificationPermissions } = useApp();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<Step>(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [role, setRole] = useState<UserRole>("freelancer");
  const [firmName, setFirmName] = useState("");
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [monitorEnabled, setMonitorEnabled] = useState(true);
  const [idleMinutes, setIdleMinutes] = useState("20");
  const [voiceDelay, setVoiceDelay] = useState("5");

  const slideAnim = useRef(new Animated.Value(0)).current;

  const goNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: -30, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start();
    setStep((s) => Math.min(s + 1, 3) as Step);
  };

  const goPrev = () => {
    setStep((s) => Math.max(s - 1, 0) as Step);
  };

  const handleFinish = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Request notification permissions if notifications are enabled
    if (notifEnabled) {
      const permissionGranted = await requestNotificationPermissions();
      if (!permissionGranted) {
        // User denied permissions, but continue with onboarding
        console.log('Notification permissions denied');
      }
    }
    
    completeOnboarding({ name, email, mobile, role, firmName });
    updateSettings({
      notificationsEnabled: notifEnabled,
      voiceAgentEnabled: voiceEnabled,
      monitoringEnabled: monitorEnabled,
      idleAlertMinutes: parseInt(idleMinutes) || 20,
      voiceAgentDelayMinutes: parseInt(voiceDelay) || 5,
    });
    router.replace("/(tabs)");
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const STEPS = [
    { title: "Welcome to WorkTrack", subtitle: "Your professional time tracking companion" },
    { title: "Your Profile", subtitle: "Tell us about yourself" },
    { title: "Your Role", subtitle: "How do you work?" },
    { title: "Permissions & Settings", subtitle: "Customize your experience" },
  ];

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient
        colors={isDark ? ["#0A0F1E", "#111827"] : ["#EFF6FF", "#F8FAFC"]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.progressRow, { paddingTop: topPad + 16 }]}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.progressDot,
              {
                backgroundColor:
                  i === step
                    ? Colors.primary
                    : i < step
                    ? Colors.primary + "60"
                    : theme.border,
                width: i === step ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 20 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>
          <Text style={[styles.stepLabel, { color: theme.textSecondary }]}>
            Step {step + 1} of 4
          </Text>
          <Text style={[styles.title, { color: theme.text }]}>{STEPS[step].title}</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {STEPS[step].subtitle}
          </Text>
        </Animated.View>

        {step === 0 && (
          <View style={styles.welcomeContent}>
            <View style={[styles.featureCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {[
                { icon: "clock", title: "Track Time", desc: "Start/stop timer for any project" },
                { icon: "bar-chart-2", title: "View Reports", desc: "Daily, weekly & project summaries" },
                { icon: "activity", title: "Monitor Usage", desc: "See how your time is spent" },
                { icon: "users", title: "Team Chat", desc: "Collaborate with your team" },
              ].map((f, index) => (
                <View key={f.icon} style={[styles.featureRow, index < 3 && { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
                  <View style={[styles.featureIcon, { backgroundColor: Colors.primary + "18" }]}>
                    <Feather name={f.icon as any} size={20} color={Colors.primary} />
                  </View>
                  <View style={styles.featureTextContainer}>
                    <Text style={[styles.featureTitle, { color: theme.text }]}>{f.title}</Text>
                    <Text style={[styles.featureDesc, { color: theme.textSecondary }]}>{f.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {step === 1 && (
          <View style={styles.formContent}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>FULL NAME *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Alex Johnson"
              placeholderTextColor={theme.textTertiary}
              autoCapitalize="words"
              autoFocus
            />

            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>EMAIL ADDRESS *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={theme.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>MOBILE NUMBER *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              value={mobile}
              onChangeText={setMobile}
              placeholder="+1 (555) 123-4567"
              placeholderTextColor={theme.textTertiary}
              keyboardType="phone-pad"
              autoCapitalize="none"
            />
          </View>
        )}

        {step === 2 && (
          <View style={styles.formContent}>
            <Pressable
              style={[
                styles.roleCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: role === "freelancer" ? Colors.primary : theme.border,
                  borderWidth: 2,
                  shadowColor: role === "freelancer" ? Colors.primary : "transparent",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: role === "freelancer" ? 0.15 : 0,
                  shadowRadius: 8,
                  elevation: role === "freelancer" ? 4 : 0,
                },
              ]}
              onPress={() => setRole("freelancer")}
            >
              <View style={[styles.roleIcon, { backgroundColor: Colors.accent + "22" }]}>
                <Feather name="user" size={24} color={Colors.accent} />
              </View>
              <View style={styles.roleText}>
                <Text style={[styles.roleTitle, { color: theme.text }]}>Freelancer</Text>
                <Text style={[styles.roleDesc, { color: theme.textSecondary }]}>
                  I work independently for multiple clients
                </Text>
              </View>
              {role === "freelancer" && (
                <View style={[styles.roleCheck, { backgroundColor: Colors.primary }]}>
                  <Feather name="check" size={16} color="#fff" />
                </View>
              )}
            </Pressable>

            <Pressable
              style={[
                styles.roleCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: role === "firm_worker" ? Colors.primary : theme.border,
                  borderWidth: 2,
                  shadowColor: role === "firm_worker" ? Colors.primary : "transparent",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: role === "firm_worker" ? 0.15 : 0,
                  shadowRadius: 8,
                  elevation: role === "firm_worker" ? 4 : 0,
                },
              ]}
              onPress={() => setRole("firm_worker")}
            >
              <View style={[styles.roleIcon, { backgroundColor: Colors.purple + "22" }]}>
                <Feather name="briefcase" size={24} color={Colors.purple} />
              </View>
              <View style={styles.roleText}>
                <Text style={[styles.roleTitle, { color: theme.text }]}>Firm Worker</Text>
                <Text style={[styles.roleDesc, { color: theme.textSecondary }]}>
                  I work for a company or agency
                </Text>
              </View>
              {role === "firm_worker" && (
                <View style={[styles.roleCheck, { backgroundColor: Colors.primary }]}>
                  <Feather name="check" size={16} color="#fff" />
                </View>
              )}
            </Pressable>

            {role === "firm_worker" && (
              <>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                  COMPANY / FIRM NAME
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                  value={firmName}
                  onChangeText={setFirmName}
                  placeholder="e.g. Acme Corp"
                  placeholderTextColor={theme.textTertiary}
                />
                <View style={[styles.hrNote, { backgroundColor: Colors.primary + "12", borderColor: Colors.primary + "30" }]}>
                  <Feather name="info" size={14} color={Colors.primary} />
                  <Text style={[styles.hrNoteText, { color: Colors.primary }]}>
                    Your time reports will sync to your HR dashboard
                  </Text>
                </View>
              </>
            )}
          </View>
        )}

        {step === 3 && (
          <View style={styles.formContent}>
            {[
              {
                key: "notif",
                icon: "bell",
                title: "Notifications",
                desc: "Alerts for tasks and idle time",
                value: notifEnabled,
                toggle: () => setNotifEnabled(!notifEnabled),
                color: Colors.warning,
              },
              {
                key: "voice",
                icon: "phone-call",
                title: "Voice Agent Calls",
                desc: "AI calls when you leave timer running",
                value: voiceEnabled,
                toggle: () => setVoiceEnabled(!voiceEnabled),
                color: Colors.primary,
              },
              {
                key: "monitor",
                icon: "eye",
                title: "App Monitoring",
                desc: "Track screen time & app usage",
                value: monitorEnabled,
                toggle: () => setMonitorEnabled(!monitorEnabled),
                color: Colors.purple,
              },
            ].map((item) => (
              <View key={item.key} style={[styles.permCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={[styles.permIcon, { backgroundColor: item.color + "18" }]}>
                  <Feather name={item.icon as any} size={20} color={item.color} />
                </View>
                <View style={styles.permText}>
                  <Text style={[styles.permTitle, { color: theme.text }]}>{item.title}</Text>
                  <Text style={[styles.permDesc, { color: theme.textSecondary }]}>{item.desc}</Text>
                </View>
                <Pressable
                  style={[
                    styles.toggle,
                    { backgroundColor: item.value ? Colors.primary : theme.surfaceSecondary },
                  ]}
                  onPress={() => { Haptics.selectionAsync(); item.toggle(); }}
                >
                  <View
                    style={[
                      styles.toggleThumb,
                      { transform: [{ translateX: item.value ? 20 : 2 }] },
                    ]}
                  />
                </Pressable>
              </View>
            ))}

            {voiceEnabled && (
              <>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                  CALL AFTER (MINUTES OF INACTIVITY)
                </Text>
                <View style={styles.minuteRow}>
                  {["2", "5", "10", "15"].map((m) => (
                    <Pressable
                      key={m}
                      style={[
                        styles.minuteBtn,
                        {
                          backgroundColor: voiceDelay === m ? Colors.primary : theme.surface,
                          borderColor: voiceDelay === m ? Colors.primary : theme.border,
                        },
                      ]}
                      onPress={() => setVoiceDelay(m)}
                    >
                      <Text style={[styles.minuteBtnText, { color: voiceDelay === m ? "#fff" : theme.text }]}>
                        {m}m
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            {notifEnabled && (
              <>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                  IDLE ALERT AFTER (MINUTES)
                </Text>
                <View style={styles.minuteRow}>
                  {["10", "15", "20", "30"].map((m) => (
                    <Pressable
                      key={m}
                      style={[
                        styles.minuteBtn,
                        {
                          backgroundColor: idleMinutes === m ? Colors.primary : theme.surface,
                          borderColor: idleMinutes === m ? Colors.primary : theme.border,
                        },
                      ]}
                      onPress={() => setIdleMinutes(m)}
                    >
                      <Text style={[styles.minuteBtnText, { color: idleMinutes === m ? "#fff" : theme.text }]}>
                        {m}m
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}
          </View>
        )}

        <View style={styles.buttonRow}>
          {step > 0 ? (
            <Pressable
              style={[styles.backBtn, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
              onPress={goPrev}
            >
              <Feather name="arrow-left" size={18} color={theme.text} />
            </Pressable>
          ) : (
            <View style={styles.backBtnPlaceholder} />
          )}

          {step < 3 ? (
            <Pressable
              style={[
                styles.nextBtn,
                step === 1 && (!name.trim() || !email.trim() || !mobile.trim()) && { opacity: 0.5 },
              ]}
              onPress={goNext}
              disabled={step === 1 && (!name.trim() || !email.trim() || !mobile.trim())}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.primaryDark]}
                style={styles.nextBtnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.nextBtnText}>
                  {step === 0 ? "Get Started" : "Continue"}
                </Text>
                <Feather name="arrow-right" size={18} color="#fff" />
              </LinearGradient>
            </Pressable>
          ) : (
            <Pressable style={styles.nextBtn} onPress={handleFinish}>
              <LinearGradient
                colors={[Colors.accent, "#059669"]}
                style={styles.nextBtnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Feather name="check" size={18} color="#fff" />
                <Text style={styles.nextBtnText}>Start Tracking</Text>
              </LinearGradient>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  progressRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  progressDot: { height: 8, borderRadius: 4 },
  content: { paddingHorizontal: 24, paddingTop: 16 },
  stepLabel: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 8 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", marginBottom: 6 },
  subtitle: { fontSize: 15, fontFamily: "Inter_400Regular", marginBottom: 28 },
  welcomeContent: { gap: 16 },
  featureCard: { 
    borderRadius: 20, 
    padding: 0, 
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featureRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 16, 
    padding: 20,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureIcon: { 
    width: 44, 
    height: 44, 
    borderRadius: 14, 
    alignItems: "center", 
    justifyContent: "center",
  },
  featureTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  featureDesc: { fontSize: 12, fontFamily: "Inter_400Regular" },
  formContent: { gap: 12 },
  fieldLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, marginTop: 8 },
  input: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 16,
  },
  roleIcon: { width: 50, height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  roleText: { flex: 1 },
  roleTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  roleDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  roleCheck: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  hrNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  hrNoteText: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium" },
  permCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  permIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  permText: { flex: 1 },
  permTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  permDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  toggle: {
    width: 46,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#fff",
  },
  minuteRow: { flexDirection: "row", gap: 8 },
  minuteBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  minuteBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  buttonRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 32 },
  backBtn: {
    width: 54,
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnPlaceholder: {
    width: 54,
    height: 54,
  },
  nextBtn: { 
    flex: 1,
    borderRadius: 16, 
    overflow: "hidden",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  nextBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  nextBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
});
