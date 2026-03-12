import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState, useEffect } from "react";
import {
  Dimensions,
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
import {
  formatDurationHM,
  getWeekStart,
  isToday,
  useApp,
} from "@/context/AppContext";

const { width: SCREEN_W } = Dimensions.get("window");
const BAR_CHART_W = SCREEN_W - 56;

type ReportView = "daily" | "weekly" | "summary";

export default function ReportsScreen() {
  const { timeEntries, projects, deleteTimeEntry, updateTimeEntry, runningTimer } = useApp();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const [view, setView] = useState<ReportView>("daily");
  const [, forceUpdate] = useState({});

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const todayEntries = useMemo(
    () => timeEntries.filter((e) => isToday(e.startTime)),
    [timeEntries]
  );

  const todayTotal = useMemo(
    () => todayEntries.reduce((s, e) => s + e.duration, 0),
    [todayEntries]
  );

  // Include running timer in today's total
  // Include running timer in today's total
  const runningTimerDuration = useMemo(() => {
    if (!runningTimer) return 0;
    return Math.floor((Date.now() - runningTimer.startTime) / 1000);
  }, [runningTimer]);

  // Real-time timer updates
  useEffect(() => {
    if (!runningTimer) return;
    
    const interval = setInterval(() => {
      // Force re-render to update running timer displays
      forceUpdate({});
    }, 1000);
    
    return () => clearInterval(interval);
  }, [runningTimer]);

  const todayTotalWithRunning = todayTotal + runningTimerDuration;

  const weekStart = useMemo(() => getWeekStart(new Date()), []);

  const weeklyData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });

    return days.map((day) => {
      const label = day.toLocaleDateString([], { weekday: "short" });
      const dayStart = new Date(day).setHours(0, 0, 0, 0);
      const dayEnd = new Date(day).setHours(23, 59, 59, 999);
      let total = timeEntries
        .filter((e) => e.startTime >= dayStart && e.startTime <= dayEnd)
        .reduce((s, e) => s + e.duration, 0);
      
      // Add running timer if it's today
      const isCurrentDay = day.toDateString() === new Date().toDateString();
      if (isCurrentDay && runningTimer) {
        total += Math.floor((Date.now() - runningTimer.startTime) / 1000);
      }
      
      return { label, total, isCurrentDay };
    });
  }, [weekStart, timeEntries, runningTimer]);

  const maxWeekly = Math.max(...weeklyData.map((d) => d.total), 1);

  const projectSummary = useMemo(() => {
    const map: Record<string, number> = {};
    timeEntries.forEach((e) => {
      map[e.projectId] = (map[e.projectId] || 0) + e.duration;
    });
    
    // Add running timer to project summary
    if (runningTimer) {
      const runningDuration = Math.floor((Date.now() - runningTimer.startTime) / 1000);
      map[runningTimer.projectId] = (map[runningTimer.projectId] || 0) + runningDuration;
    }
    
    return Object.entries(map)
      .map(([id, total]) => ({
        project: projects.find((p) => p.id === id),
        total,
      }))
      .filter((x) => x.project)
      .sort((a, b) => b.total - a.total);
  }, [timeEntries, projects, runningTimer]);

  const totalAllTime = projectSummary.reduce((s, x) => s + x.total, 0);

  const tabs: { key: ReportView; label: string }[] = [
    { key: "daily", label: "Today" },
    { key: "weekly", label: "Weekly" },
    { key: "summary", label: "Summary" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: topPad + 16,
          paddingBottom: bottomPad + 100,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.screenTitle, { color: theme.text }]}>Reports</Text>
        <Text style={[styles.screenSubtitle, { color: theme.textSecondary }]}>
          Your work analytics
        </Text>

        <View style={[styles.tabRow, { backgroundColor: theme.surfaceSecondary }]}>
          {tabs.map((t) => (
            <Pressable
              key={t.key}
              style={[
                styles.tabBtn,
                view === t.key && {
                  backgroundColor: theme.surface,
                  shadowColor: "#000",
                  shadowOpacity: 0.08,
                  shadowRadius: 4,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 2,
                },
              ]}
              onPress={() => setView(t.key)}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: view === t.key ? theme.text : theme.textSecondary },
                ]}
              >
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {view === "daily" && (
          <>
            <View style={[styles.statCard, { backgroundColor: Colors.primary }]}>
              <Text style={styles.statLabel}>Today's Total</Text>
              <Text style={styles.statValue}>{formatDurationHM(todayTotalWithRunning)}</Text>
              <Text style={styles.statSub}>{todayEntries.length} entries</Text>
            </View>

            {todayEntries.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Feather name="calendar" size={32} color={theme.textTertiary} />
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  No time entries for today
                </Text>
              </View>
            ) : (
              todayEntries.map((entry) => {
                const proj = projects.find((p) => p.id === entry.projectId);
                return (
                  <View
                    key={entry.id}
                    style={[styles.entryRow, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  >
                    <View style={[styles.entryColorBar, { backgroundColor: proj?.color || Colors.primary }]} />
                    <View style={styles.entryContent}>
                      <View style={styles.entryTop}>
                        <Text style={[styles.entryProject, { color: theme.text }]}>{proj?.name}</Text>
                        <Text style={[styles.entryDuration, { color: Colors.primary }]}>
                          {formatDurationHM(entry.duration)}
                        </Text>
                      </View>
                      <View style={styles.entryBottom}>
                        <View style={[styles.badge, { backgroundColor: theme.surfaceSecondary }]}>
                          <Text style={[styles.badgeText, { color: theme.textSecondary }]}>
                            {entry.category}
                          </Text>
                        </View>
                        {entry.description ? (
                          <Text style={[styles.entryDesc, { color: theme.textSecondary }]} numberOfLines={1}>
                            {entry.description}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                    <Pressable
                      style={styles.deleteBtn}
                      onPress={() => deleteTimeEntry(entry.id)}
                    >
                      <Feather name="trash-2" size={15} color={Colors.danger} />
                    </Pressable>
                  </View>
                );
              })
            )}
          </>
        )}

        {view === "weekly" && (
          <>
            <View style={[styles.chartCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.chartTitle, { color: theme.text }]}>Hours This Week</Text>
              <View style={styles.barChart}>
                {weeklyData.map((day, i) => {
                  const barH = Math.max((day.total / maxWeekly) * 120, day.total > 0 ? 8 : 0);
                  return (
                    <View key={i} style={styles.barWrapper}>
                      <Text style={[styles.barValue, { color: theme.textSecondary }]}>
                        {day.total > 0 ? `${Math.floor(day.total / 3600)}h` : ""}
                      </Text>
                      <View style={[styles.barBg, { backgroundColor: theme.surfaceSecondary }]}>
                        <View
                          style={[
                            styles.bar,
                            {
                              height: barH,
                              backgroundColor: day.isCurrentDay ? Colors.primary : Colors.primary + "80",
                            },
                          ]}
                        />
                      </View>
                      <Text
                        style={[
                          styles.barLabel,
                          { color: day.isCurrentDay ? Colors.primary : theme.textTertiary },
                        ]}
                      >
                        {day.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Week Total</Text>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {formatDurationHM(weeklyData.reduce((s, d) => s + d.total, 0))}
              </Text>
            </View>
          </>
        )}

        {view === "summary" && (
          <>
            <View style={[styles.statCard, { backgroundColor: Colors.accent }]}>
              <Text style={styles.statLabel}>All Time Total</Text>
              <Text style={styles.statValue}>{formatDurationHM(totalAllTime)}</Text>
            </View>

            {projectSummary.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Feather name="pie-chart" size={32} color={theme.textTertiary} />
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  No data yet
                </Text>
              </View>
            ) : (
              projectSummary.map(({ project, total }) => {
                const pct = totalAllTime > 0 ? total / totalAllTime : 0;
                return (
                  <View
                    key={project!.id}
                    style={[styles.summaryRow, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  >
                    <View style={styles.summaryTop}>
                      <View style={styles.summaryLeft}>
                        <View style={[styles.colorDot, { backgroundColor: project!.color }]} />
                        <Text style={[styles.summaryProject, { color: theme.text }]}>
                          {project!.name}
                        </Text>
                      </View>
                      <Text style={[styles.summaryDuration, { color: Colors.primary }]}>
                        {formatDurationHM(total)}
                      </Text>
                    </View>
                    <View style={[styles.progressBg, { backgroundColor: theme.surfaceSecondary }]}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${pct * 100}%` as any, backgroundColor: project!.color },
                        ]}
                      />
                    </View>
                    <Text style={[styles.pctText, { color: theme.textSecondary }]}>
                      {Math.round(pct * 100)}%
                    </Text>
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  screenTitle: { fontSize: 28, fontFamily: "Inter_700Bold", marginBottom: 4 },
  screenSubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 20 },
  tabRow: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: "center" },
  tabText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  statCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "transparent",
  },
  statLabel: { color: "rgba(255,255,255,0.8)", fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 6 },
  statValue: { color: "#fff", fontSize: 32, fontFamily: "Inter_700Bold" },
  statSub: { color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 4 },
  emptyState: {
    alignItems: "center",
    gap: 8,
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
  },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  entryRow: {
    flexDirection: "row",
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    overflow: "hidden",
  },
  entryColorBar: { width: 4 },
  entryContent: { flex: 1, padding: 12 },
  entryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  entryProject: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  entryDuration: { fontSize: 15, fontFamily: "Inter_700Bold" },
  entryBottom: { flexDirection: "row", alignItems: "center", gap: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  entryDesc: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular" },
  deleteBtn: { padding: 12, justifyContent: "center" },
  chartCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  chartTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", marginBottom: 16 },
  barChart: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    height: 160,
  },
  barWrapper: { alignItems: "center", gap: 4 },
  barValue: { fontSize: 10, fontFamily: "Inter_500Medium", height: 16 },
  barBg: {
    width: 32,
    height: 120,
    borderRadius: 6,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  bar: { width: "100%", borderRadius: 6 },
  barLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  summaryRow: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 10,
    gap: 8,
  },
  summaryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  colorDot: { width: 10, height: 10, borderRadius: 5 },
  summaryProject: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  summaryDuration: { fontSize: 15, fontFamily: "Inter_700Bold" },
  progressBg: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  pctText: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "right" },
});
