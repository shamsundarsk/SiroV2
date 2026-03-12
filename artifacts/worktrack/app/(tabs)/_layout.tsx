import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import * as Haptics from "expo-haptics";
import { router, Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { formatDuration, useApp } from "@/context/AppContext";

function FloatingTimerBar() {
  const { runningTimer, stopTimer, projects } = useApp();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const [elapsed, setElapsed] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(80)).current;

  useEffect(() => {
    if (!runningTimer) {
      Animated.timing(slideAnim, { toValue: 80, duration: 250, useNativeDriver: true }).start();
      return;
    }
    Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }).start();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - runningTimer.startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [runningTimer]);

  useEffect(() => {
    if (!runningTimer) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.4, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [runningTimer]);

  if (!runningTimer) return null;

  const project = projects.find((p) => p.id === runningTimer.projectId);
  const tabBarHeight = Platform.OS === "web" ? 84 : 49;
  const bottomOffset = tabBarHeight + (Platform.OS === "web" ? 0 : insets.bottom) + 8;

  const handleStop = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    stopTimer();
  };

  return (
    <Animated.View
      style={[
        styles.floatingBar,
        {
          bottom: bottomOffset,
          transform: [{ translateY: slideAnim }],
        },
      ]}
      pointerEvents="box-none"
    >
      <Pressable
        style={[styles.floatingBarInner, { backgroundColor: project?.color || Colors.primary }]}
        onPress={() => router.push("/timer-running")}
        activeOpacity={0.95}
      >
        <View style={styles.floatingBarLeft}>
          <Animated.View style={[styles.liveIndicator, { transform: [{ scale: pulseAnim }] }]} />
          <View>
            <Text style={styles.floatingProject} numberOfLines={1}>
              {project?.name || "Timer Running"}
            </Text>
            <Text style={styles.floatingCategory}>{runningTimer.category}</Text>
          </View>
        </View>

        <Text style={styles.floatingTime}>{formatDuration(elapsed)}</Text>

        <Pressable
          style={styles.floatingStopBtn}
          onPress={handleStop}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <View style={styles.stopIcon}>
            <Feather name="square" size={14} color={project?.color || Colors.primary} />
          </View>
          <Text style={styles.stopLabel}>Stop</Text>
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

function NativeTabLayout() {
  return (
    <>
      <NativeTabs>
        <NativeTabs.Trigger name="index">
          <Icon sf={{ default: "timer", selected: "timer.fill" }} />
          <Label>Timer</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="reports">
          <Icon sf={{ default: "chart.bar", selected: "chart.bar.fill" }} />
          <Label>Reports</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="tasks">
          <Icon sf={{ default: "checkmark.square", selected: "checkmark.square.fill" }} />
          <Label>Tasks</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="chat">
          <Icon sf={{ default: "bubble.left.and.bubble.right", selected: "bubble.left.and.bubble.right.fill" }} />
          <Label>Chat</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="monitor">
          <Icon sf={{ default: "eye", selected: "eye.fill" }} />
          <Label>Monitor</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="calendar">
          <Icon sf={{ default: "calendar", selected: "calendar.fill" }} />
          <Label>Calendar</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="settings">
          <Icon sf={{ default: "gearshape", selected: "gearshape.fill" }} />
          <Label>Settings</Label>
        </NativeTabs.Trigger>
      </NativeTabs>
      <FloatingTimerBar />
    </>
  );
}

function ClassicTabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const theme = isDark ? Colors.dark : Colors.light;

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: theme.tabIconDefault,
          tabBarStyle: {
            position: "absolute",
            backgroundColor: isIOS ? "transparent" : theme.surface,
            borderTopWidth: isWeb ? 1 : 0,
            borderTopColor: theme.border,
            elevation: 0,
            ...(isWeb ? { height: 84 } : {}),
          },
          tabBarBackground: () =>
            isIOS ? (
              <BlurView
                intensity={100}
                tint={isDark ? "dark" : "light"}
                style={StyleSheet.absoluteFill}
              />
            ) : isWeb ? (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.surface }]} />
            ) : null,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Timer",
            tabBarIcon: ({ color }) =>
              isIOS ? (
                <SymbolView name="timer" tintColor={color} size={24} />
              ) : (
                <Feather name="clock" size={22} color={color} />
              ),
          }}
        />
        <Tabs.Screen
          name="reports"
          options={{
            title: "Reports",
            tabBarIcon: ({ color }) =>
              isIOS ? (
                <SymbolView name="chart.bar.fill" tintColor={color} size={24} />
              ) : (
                <Feather name="bar-chart-2" size={22} color={color} />
              ),
          }}
        />
        <Tabs.Screen
          name="tasks"
          options={{
            title: "Tasks",
            tabBarIcon: ({ color }) =>
              isIOS ? (
                <SymbolView name="checkmark.square" tintColor={color} size={24} />
              ) : (
                <Feather name="check-square" size={22} color={color} />
              ),
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: "Chat",
            tabBarIcon: ({ color }) =>
              isIOS ? (
                <SymbolView name="bubble.left.and.bubble.right" tintColor={color} size={24} />
              ) : (
                <Feather name="message-circle" size={22} color={color} />
              ),
          }}
        />
        <Tabs.Screen
          name="monitor"
          options={{
            title: "Monitor",
            tabBarIcon: ({ color }) =>
              isIOS ? (
                <SymbolView name="eye" tintColor={color} size={24} />
              ) : (
                <Feather name="activity" size={22} color={color} />
              ),
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            title: "Calendar",
            tabBarIcon: ({ color }) =>
              isIOS ? (
                <SymbolView name="calendar" tintColor={color} size={24} />
              ) : (
                <Feather name="calendar" size={22} color={color} />
              ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color }) =>
              isIOS ? (
                <SymbolView name="gearshape" tintColor={color} size={24} />
              ) : (
                <Feather name="settings" size={22} color={color} />
              ),
          }}
        />
      </Tabs>
      <FloatingTimerBar />
    </View>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}

const styles = StyleSheet.create({
  floatingBar: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 999,
  },
  floatingBarInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  floatingBarLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  liveIndicator: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#fff" },
  floatingProject: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    maxWidth: 120,
  },
  floatingCategory: { color: "rgba(255,255,255,0.75)", fontSize: 11, fontFamily: "Inter_400Regular" },
  floatingTime: { color: "#fff", fontSize: 18, fontFamily: "Inter_700Bold", marginRight: 12 },
  floatingStopBtn: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  stopIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  stopLabel: { color: "rgba(255,255,255,0.9)", fontSize: 10, fontFamily: "Inter_600SemiBold" },
});
