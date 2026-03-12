import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";

const SCREEN_LABELS: Record<string, string> = {
  "(tabs)/index": "Timer",
  "(tabs)/reports": "Reports",
  "(tabs)/tasks": "Tasks",
  "(tabs)/chat": "Chat",
  "(tabs)/monitor": "Monitor",
};

function NotificationBanner({
  message,
  onDismiss,
  isDark,
}: {
  message: string;
  onDismiss: () => void;
  isDark: boolean;
}) {
  const slideAnim = useRef(new Animated.Value(-80)).current;
  const theme = isDark ? Colors.dark : Colors.light;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.notifBanner,
        {
          backgroundColor: Colors.warning,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Feather name="bell" size={16} color="#fff" />
      <Text style={styles.notifText} numberOfLines={2}>
        {message}
      </Text>
      <Pressable onPress={onDismiss}>
        <Feather name="x" size={16} color="#fff" />
      </Pressable>
    </Animated.View>
  );
}

function UsageBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const mins = Math.floor(value / 60000);
  const secs = Math.floor((value % 60000) / 1000);

  return (
    <View style={styles.usageBarRow}>
      <View style={styles.usageBarTop}>
        <Text style={[styles.usageBarLabel, { color: theme.text }]}>{label}</Text>
        <Text style={[styles.usageBarTime, { color: color }]}>
          {mins}m {secs}s
        </Text>
      </View>
      <View style={[styles.usageBarBg, { backgroundColor: theme.surfaceSecondary }]}>
        <View
          style={[styles.usageBarFill, { width: `${pct * 100}%` as any, backgroundColor: color }]}
        />
      </View>
    </View>
  );
}

export default function MonitorScreen() {
  const { screenTimeRecords, appUsageRecords, notifications, dismissNotification, recordScreenTime } = useApp();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const today = new Date().toISOString().split("T")[0];
  const todayScreenTime = screenTimeRecords.filter((r) => r.date === today);
  const maxScreenTime = Math.max(...todayScreenTime.map((r) => r.totalTime), 1);

  const sessionStart = useRef<number>(Date.now());
  useEffect(() => {
    sessionStart.current = Date.now();
    return () => {
      const elapsed = Date.now() - sessionStart.current;
      recordScreenTime("(tabs)/monitor", elapsed);
    };
  }, []);

  const totalTrackedMs = todayScreenTime.reduce((s, r) => s + r.totalTime, 0);
  const totalMins = Math.floor(totalTrackedMs / 60000);

  const SCREEN_COLORS = [Colors.primary, Colors.accent, Colors.purple, Colors.warning, Colors.danger];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {notifications.map((msg, idx) => (
        <NotificationBanner
          key={idx}
          message={msg}
          onDismiss={() => dismissNotification(idx)}
          isDark={isDark}
        />
      ))}

      <ScrollView
        contentContainerStyle={{
          paddingTop: topPad + 16,
          paddingBottom: bottomPad + 100,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.screenTitle, { color: theme.text }]}>Monitor</Text>
        <Text style={[styles.screenSubtitle, { color: theme.textSecondary }]}>
          Screen time & app usage
        </Text>

        <View style={[styles.totalCard, { backgroundColor: Colors.purple }]}>
          <Feather name="activity" size={20} color="rgba(255,255,255,0.8)" />
          <View>
            <Text style={styles.totalLabel}>Total Screen Time Today</Text>
            <Text style={styles.totalValue}>{totalMins} min</Text>
          </View>
        </View>

        <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.infoCardHeader}>
            <Feather name="monitor" size={16} color={Colors.primary} />
            <Text style={[styles.infoCardTitle, { color: theme.text }]}>Screen Time Breakdown</Text>
          </View>
          {todayScreenTime.length === 0 ? (
            <Text style={[styles.emptyInfo, { color: theme.textSecondary }]}>
              No data collected yet. Navigate between tabs to start tracking.
            </Text>
          ) : (
            todayScreenTime.map((record, idx) => (
              <UsageBar
                key={record.screen}
                label={SCREEN_LABELS[record.screen] || record.screen}
                value={record.totalTime}
                max={maxScreenTime}
                color={SCREEN_COLORS[idx % SCREEN_COLORS.length]}
              />
            ))
          )}
        </View>

        <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.infoCardHeader}>
            <Feather name="cpu" size={16} color={Colors.accent} />
            <Text style={[styles.infoCardTitle, { color: theme.text }]}>App Background Usage</Text>
          </View>
          {appUsageRecords.filter((r) => r.date === today).length === 0 ? (
            <Text style={[styles.emptyInfo, { color: theme.textSecondary }]}>
              No background time logged today.
            </Text>
          ) : (
            appUsageRecords
              .filter((r) => r.date === today)
              .map((record, idx) => {
                const mins = Math.floor(record.totalTime / 60000);
                return (
                  <View key={idx} style={styles.appUsageRow}>
                    <View style={[styles.appIcon, { backgroundColor: Colors.projects[idx % Colors.projects.length] + "22" }]}>
                      <Feather
                        name="smartphone"
                        size={14}
                        color={Colors.projects[idx % Colors.projects.length]}
                      />
                    </View>
                    <Text style={[styles.appName, { color: theme.text }]}>{record.appName}</Text>
                    <Text style={[styles.appTime, { color: theme.textSecondary }]}>{mins}m</Text>
                  </View>
                );
              })
          )}
        </View>

        <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.infoCardHeader}>
            <Feather name="bell" size={16} color={Colors.warning} />
            <Text style={[styles.infoCardTitle, { color: theme.text }]}>AI Alerts</Text>
          </View>
          <Text style={[styles.alertDescription, { color: theme.textSecondary }]}>
            Productivity alerts fire when you spend more than 20 minutes on any single non-work screen.
          </Text>
          {notifications.length === 0 ? (
            <View style={[styles.alertGood, { backgroundColor: Colors.accent + "22" }]}>
              <Feather name="check-circle" size={14} color={Colors.accent} />
              <Text style={[styles.alertGoodText, { color: Colors.accent }]}>
                All clear — no alerts today
              </Text>
            </View>
          ) : (
            <View style={[styles.alertCount, { backgroundColor: Colors.warning + "22" }]}>
              <Feather name="alert-triangle" size={14} color={Colors.warning} />
              <Text style={[styles.alertCountText, { color: Colors.warning }]}>
                {notifications.length} active alert{notifications.length !== 1 ? "s" : ""}
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.infoCardHeader}>
            <Feather name="shield" size={16} color={Colors.primary} />
            <Text style={[styles.infoCardTitle, { color: theme.text }]}>HR Integration Ready</Text>
          </View>
          <Text style={[styles.alertDescription, { color: theme.textSecondary }]}>
            Monitoring data is recorded locally and ready to sync with your HR dashboard. Screen time, app usage, and productivity alerts are all logged per worker.
          </Text>
          <View style={[styles.hrBadge, { backgroundColor: Colors.primary + "15" }]}>
            <Feather name="cloud" size={13} color={Colors.primary} />
            <Text style={[styles.hrBadgeText, { color: Colors.primary }]}>
              Connect HR Portal to sync data
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  notifBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 999,
  },
  notifText: {
    flex: 1,
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  screenTitle: { fontSize: 28, fontFamily: "Inter_700Bold", marginBottom: 4 },
  screenSubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 20 },
  totalCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  totalLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  totalValue: { color: "#fff", fontSize: 28, fontFamily: "Inter_700Bold" },
  infoCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 14,
    gap: 12,
  },
  infoCardHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoCardTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  emptyInfo: { fontSize: 13, fontFamily: "Inter_400Regular" },
  usageBarRow: { gap: 6 },
  usageBarTop: { flexDirection: "row", justifyContent: "space-between" },
  usageBarLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  usageBarTime: { fontSize: 13, fontFamily: "Inter_700Bold" },
  usageBarBg: { height: 8, borderRadius: 4, overflow: "hidden" },
  usageBarFill: { height: "100%", borderRadius: 4 },
  appUsageRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  appIcon: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  appName: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  appTime: { fontSize: 13, fontFamily: "Inter_400Regular" },
  alertDescription: { fontSize: 13, fontFamily: "Inter_400Regular" },
  alertGood: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 8,
  },
  alertGoodText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  alertCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 8,
  },
  alertCountText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  hrBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 8,
  },
  hrBadgeText: { fontSize: 13, fontFamily: "Inter_500Medium" },
});
