import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { formatDuration, useApp } from "@/context/AppContext";

export default function TimerRunningScreen() {
  const { runningTimer, stopTimer, projects } = useApp();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  const [elapsed, setElapsed] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!runningTimer) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - runningTimer.startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [runningTimer]);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  if (!runningTimer) {
    return (
      <View style={[styles.container, { backgroundColor: theme.surface }]}>
        <Text style={[styles.noTimer, { color: theme.textSecondary }]}>No timer running</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={[styles.close, { color: Colors.primary }]}>Close</Text>
        </Pressable>
      </View>
    );
  }

  const project = projects.find((p) => p.id === runningTimer.projectId);
  const projectColor = project?.color || Colors.primary;

  const handleStop = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    stopTimer();
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.handle} />
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Running Timer</Text>
        <Pressable onPress={() => router.back()}>
          <Feather name="chevron-down" size={22} color={theme.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.timerDisplay}>
        <Animated.View
          style={[
            styles.timerRing,
            { borderColor: projectColor, transform: [{ scale: pulseAnim }] },
          ]}
        >
          <Text style={[styles.timerText, { color: theme.text }]}>
            {formatDuration(elapsed)}
          </Text>
        </Animated.View>

        <View style={[styles.liveDot, { backgroundColor: projectColor }]} />
        <Text style={[styles.liveText, { color: theme.textSecondary }]}>Live</Text>
      </View>

      <View style={[styles.infoCard, { backgroundColor: theme.surfaceSecondary }]}>
        <View style={styles.infoRow}>
          <View style={[styles.colorDot, { backgroundColor: projectColor }]} />
          <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Project</Text>
          <Text style={[styles.infoValue, { color: theme.text }]}>{project?.name}</Text>
        </View>
        <View style={styles.infoDivider} />
        <View style={styles.infoRow}>
          <Feather name="tag" size={14} color={theme.textSecondary} />
          <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Category</Text>
          <Text style={[styles.infoValue, { color: theme.text }]}>{runningTimer.category}</Text>
        </View>
        {runningTimer.description ? (
          <>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Feather name="file-text" size={14} color={theme.textSecondary} />
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Note</Text>
              <Text style={[styles.infoValue, { color: theme.text }]} numberOfLines={2}>
                {runningTimer.description}
              </Text>
            </View>
          </>
        ) : null}
      </View>

      <Pressable onPress={handleStop}>
        <LinearGradient
          colors={[Colors.danger, "#C0392B"]}
          style={styles.stopBtn}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Feather name="square" size={24} color="#fff" />
          <Text style={styles.stopBtnText}>Stop Timer</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: "#ccc",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
  },
  headerTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  timerDisplay: { alignItems: "center", gap: 12, marginBottom: 32 },
  timerRing: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  timerText: { fontSize: 38, fontFamily: "Inter_700Bold" },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  liveText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  infoCard: { borderRadius: 14, padding: 16, marginBottom: 24, gap: 2 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  colorDot: { width: 10, height: 10, borderRadius: 5 },
  infoLabel: { fontSize: 13, fontFamily: "Inter_400Regular", width: 70 },
  infoValue: { flex: 1, fontSize: 14, fontFamily: "Inter_600SemiBold", textAlign: "right" },
  infoDivider: { height: 1, backgroundColor: "rgba(0,0,0,0.05)" },
  stopBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 18,
    borderRadius: 16,
  },
  stopBtnText: { color: "#fff", fontSize: 18, fontFamily: "Inter_700Bold" },
  noTimer: { fontSize: 16, fontFamily: "Inter_400Regular", textAlign: "center", marginBottom: 20 },
  close: { fontSize: 16, fontFamily: "Inter_500Medium", textAlign: "center" },
});
