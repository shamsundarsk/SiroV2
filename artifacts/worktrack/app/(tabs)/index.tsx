import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
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
import {
  TaskCategory,
  formatTimerDuration,
  formatTime,
  isToday,
  useApp,
} from "@/context/AppContext";

const CATEGORIES: TaskCategory[] = [
  "Design",
  "Development",
  "Testing",
  "Meeting",
  "Research",
  "Other",
];

const CATEGORY_ICONS: Record<TaskCategory, string> = {
  Design: "pen-tool",
  Development: "code",
  Testing: "check-circle",
  Meeting: "users",
  Research: "search",
  Other: "more-horizontal",
};

export default function TimerScreen() {
  const {
    projects,
    timeEntries,
    runningTimer,
    startTimer,
    stopTimer,
    deleteTimeEntry,
  } = useApp();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  const [selectedProject, setSelectedProject] = useState(projects[0]?.id || "");
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory>("Development");
  const [description, setDescription] = useState("");
  const [showProjects, setShowProjects] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const buttonScale = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const todayEntries = timeEntries.filter((e) => isToday(e.startTime));
  const selectedProjectObj = projects.find((p) => p.id === selectedProject);

  useEffect(() => {
    if (!runningTimer) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - runningTimer.startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [runningTimer]);

  useEffect(() => {
    if (!runningTimer) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [runningTimer]);

  const handleStart = () => {
    if (!selectedProject) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Animated.sequence([
      Animated.timing(buttonScale, { toValue: 0.93, duration: 100, useNativeDriver: true }),
      Animated.timing(buttonScale, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
    startTimer(selectedProject, selectedCategory, description);
    setDescription("");
  };

  const handleStop = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    stopTimer();
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const runningProject = runningTimer
    ? projects.find((p) => p.id === runningTimer.projectId)
    : null;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: topPad + 16,
          paddingBottom: bottomPad + 140,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.screenTitle, { color: theme.text }]}>Time Tracker</Text>
        <Text style={[styles.screenSubtitle, { color: theme.textSecondary }]}>
          Track your work hours
        </Text>

        {runningTimer ? (
          <View style={[styles.activeTimerCard, { backgroundColor: runningProject?.color || Colors.primary }]}>
            <View style={styles.activeTimerTop}>
              <View style={styles.activeTimerInfo}>
                <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]} />
                <View>
                  <Text style={styles.activeTimerProject}>{runningProject?.name || "Project"}</Text>
                  <Text style={styles.activeTimerCategory}>{runningTimer.category}</Text>
                </View>
              </View>
              <Pressable
                style={styles.expandBtn}
                onPress={() => router.push("/timer-running")}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="maximize-2" size={16} color="rgba(255,255,255,0.8)" />
              </Pressable>
            </View>

            <View style={styles.activeTimerHeader}>
              <Text style={styles.activeTimerElapsed}>{formatTimerDuration(elapsed)}</Text>
              <View style={styles.liveIndicator}>
                <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnim }] }]} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>
            {runningTimer.description ? (
              <Text style={styles.activeTimerDesc}>{runningTimer.description}</Text>
            ) : null}

            <Pressable style={styles.stopBtnLarge} onPress={handleStop}>
              <Feather name="square" size={22} color={runningProject?.color || Colors.primary} />
              <Text style={[styles.stopBtnText, { color: runningProject?.color || Colors.primary }]}>
                Stop Timer
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>PROJECT</Text>
            <Pressable
              style={[styles.selector, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
              onPress={() => setShowProjects(!showProjects)}
            >
              {selectedProjectObj && (
                <View style={[styles.colorDot, { backgroundColor: selectedProjectObj.color }]} />
              )}
              <Text style={[styles.selectorText, { color: theme.text }]}>
                {selectedProjectObj?.name || "Select project"}
              </Text>
              <Feather
                name={showProjects ? "chevron-up" : "chevron-down"}
                size={18}
                color={theme.textSecondary}
              />
            </Pressable>

            {showProjects && (
              <View style={[styles.dropdown, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                {projects.map((p) => (
                  <Pressable
                    key={p.id}
                    style={[
                      styles.dropdownItem,
                      selectedProject === p.id && { backgroundColor: theme.surfaceSecondary },
                    ]}
                    onPress={() => {
                      setSelectedProject(p.id);
                      setShowProjects(false);
                    }}
                  >
                    <View style={[styles.colorDot, { backgroundColor: p.color }]} />
                    <Text style={[styles.dropdownText, { color: theme.text }]}>{p.name}</Text>
                    {selectedProject === p.id && (
                      <Feather name="check" size={16} color={Colors.primary} />
                    )}
                  </Pressable>
                ))}
                <Pressable
                  style={styles.dropdownItem}
                  onPress={() => {
                    setShowProjects(false);
                    router.push("/new-project");
                  }}
                >
                  <Feather name="plus" size={16} color={Colors.primary} />
                  <Text style={[styles.dropdownText, { color: Colors.primary }]}>New Project</Text>
                </Pressable>
              </View>
            )}

            <Text style={[styles.label, { color: theme.textSecondary, marginTop: 16 }]}>CATEGORY</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesScroll}
            >
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  style={[
                    styles.categoryChip,
                    selectedCategory === cat
                      ? { backgroundColor: Colors.primary }
                      : {
                          backgroundColor: theme.surfaceSecondary,
                          borderColor: theme.border,
                          borderWidth: 1,
                        },
                  ]}
                  onPress={() => {
                    setSelectedCategory(cat);
                    Haptics.selectionAsync();
                  }}
                >
                  <Feather
                    name={CATEGORY_ICONS[cat] as any}
                    size={13}
                    color={selectedCategory === cat ? "#fff" : theme.textSecondary}
                  />
                  <Text
                    style={[
                      styles.categoryText,
                      { color: selectedCategory === cat ? "#fff" : theme.textSecondary },
                    ]}
                  >
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={[styles.label, { color: theme.textSecondary, marginTop: 16 }]}>
              DESCRIPTION (optional)
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.surfaceSecondary,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              placeholder="What are you working on?"
              placeholderTextColor={theme.textTertiary}
              value={description}
              onChangeText={setDescription}
            />
          </View>
        )}

        {!runningTimer && (
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <Pressable
              onPress={handleStart}
              style={styles.startBtnWrapper}
              disabled={!selectedProject}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.primaryDark]}
                style={[styles.startBtn, !selectedProject && styles.startBtnDisabled]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Feather name="play" size={28} color="#fff" />
                <Text style={styles.startBtnText}>Start Timer</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Today</Text>
          <Pressable onPress={() => router.push("/new-entry")}>
            <Text style={[styles.addManual, { color: Colors.primary }]}>+ Manual entry</Text>
          </Pressable>
        </View>

        {todayEntries.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Feather name="clock" size={32} color={theme.textTertiary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No entries yet today</Text>
          </View>
        ) : (
          todayEntries.map((entry) => {
            const proj = projects.find((p) => p.id === entry.projectId);
            return (
              <View
                key={entry.id}
                style={[styles.entryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <View style={[styles.entryColorBar, { backgroundColor: proj?.color || Colors.primary }]} />
                <View style={styles.entryContent}>
                  <View style={styles.entryTop}>
                    <Text style={[styles.entryProject, { color: theme.text }]}>{proj?.name}</Text>
                    <Text style={[styles.entryDuration, { color: Colors.primary }]}>
                      {formatDuration(entry.duration)}
                    </Text>
                  </View>
                  <View style={styles.entryBottom}>
                    <View style={[styles.categoryBadge, { backgroundColor: theme.surfaceSecondary }]}>
                      <Text style={[styles.categoryBadgeText, { color: theme.textSecondary }]}>
                        {entry.category}
                      </Text>
                    </View>
                    {entry.description ? (
                      <Text
                        style={[styles.entryDesc, { color: theme.textSecondary }]}
                        numberOfLines={1}
                      >
                        {entry.description}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={[styles.entryTime, { color: theme.textTertiary }]}>
                    {formatTime(entry.startTime)} – {formatTime(entry.endTime)}
                  </Text>
                </View>
                <Pressable
                  style={styles.deleteBtn}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    deleteTimeEntry(entry.id);
                  }}
                >
                  <Feather name="trash-2" size={16} color={Colors.danger} />
                </Pressable>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  screenTitle: { fontSize: 28, fontFamily: "Inter_700Bold", marginBottom: 4 },
  screenSubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 20 },
  activeTimerCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    gap: 8,
  },
  activeTimerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  activeTimerInfo: { flexDirection: "row", alignItems: "center", gap: 10 },
  liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#fff" },
  activeTimerProject: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  activeTimerCategory: { color: "rgba(255,255,255,0.75)", fontSize: 12, fontFamily: "Inter_400Regular" },
  expandBtn: { padding: 4 },
  activeTimerElapsed: {
    color: "#fff",
    fontSize: 42,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    marginVertical: 8,
  },
  activeTimerHeader: {
    alignItems: "center",
    gap: 8,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
  },
  liveText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
  },
  activeTimerDesc: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  stopBtnLarge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 8,
  },
  stopBtnText: { fontSize: 17, fontFamily: "Inter_700Bold" },
  card: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 16 },
  label: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, marginBottom: 8 },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  selectorText: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium" },
  colorDot: { width: 10, height: 10, borderRadius: 5 },
  dropdown: { marginTop: 6, borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  dropdownItem: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12 },
  dropdownText: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  categoriesScroll: { marginHorizontal: -4 },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  categoryText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  input: { padding: 12, borderRadius: 10, borderWidth: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  startBtnWrapper: { marginVertical: 8 },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 18,
    borderRadius: 16,
  },
  startBtnDisabled: { opacity: 0.5 },
  startBtnText: { color: "#fff", fontSize: 18, fontFamily: "Inter_700Bold" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  addManual: { fontSize: 14, fontFamily: "Inter_500Medium" },
  emptyState: {
    alignItems: "center",
    gap: 8,
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
  },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  entryCard: {
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
  entryBottom: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  categoryBadgeText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  entryDesc: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular" },
  entryTime: { fontSize: 11, fontFamily: "Inter_400Regular" },
  deleteBtn: { padding: 12, justifyContent: "center" },
});
