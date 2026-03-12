import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
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
import { Task, useApp } from "@/context/AppContext";

const PRIORITY_COLORS: Record<Task["priority"], string> = {
  high: Colors.danger,
  medium: Colors.warning,
  low: Colors.accent,
};

const PRIORITY_LABELS: Record<Task["priority"], string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export default function TasksScreen() {
  const { tasks, projects, updateTask, deleteTask } = useApp();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<"all" | "active" | "done">("active");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const filteredTasks = useMemo(() => {
    if (filter === "all") return tasks;
    if (filter === "active") return tasks.filter((t) => !t.completed);
    return tasks.filter((t) => t.completed);
  }, [tasks, filter]);

  const activeCnt = tasks.filter((t) => !t.completed).length;
  const doneCnt = tasks.filter((t) => t.completed).length;

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
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.screenTitle, { color: theme.text }]}>Tasks</Text>
            <Text style={[styles.screenSubtitle, { color: theme.textSecondary }]}>
              {activeCnt} active · {doneCnt} done
            </Text>
          </View>
          <Pressable
            style={[styles.addBtn, { backgroundColor: Colors.primary }]}
            onPress={() => router.push("/new-task")}
          >
            <Feather name="plus" size={22} color="#fff" />
          </Pressable>
        </View>

        <View style={[styles.tabRow, { backgroundColor: theme.surfaceSecondary }]}>
          {(["active", "all", "done"] as const).map((f) => (
            <Pressable
              key={f}
              style={[
                styles.tabBtn,
                filter === f && {
                  backgroundColor: theme.surface,
                  shadowColor: "#000",
                  shadowOpacity: 0.06,
                  shadowRadius: 3,
                  elevation: 2,
                },
              ]}
              onPress={() => setFilter(f)}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: filter === f ? theme.text : theme.textSecondary },
                ]}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {filteredTasks.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Feather name="check-square" size={32} color={theme.textTertiary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              {filter === "done" ? "No completed tasks" : "No tasks yet"}
            </Text>
            {filter !== "done" && (
              <Pressable
                style={[styles.emptyBtn, { backgroundColor: Colors.primary }]}
                onPress={() => router.push("/new-task")}
              >
                <Text style={styles.emptyBtnText}>Add Task</Text>
              </Pressable>
            )}
          </View>
        ) : (
          filteredTasks.map((task) => {
            const proj = projects.find((p) => p.id === task.projectId);
            return (
              <View
                key={task.id}
                style={[
                  styles.taskCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                  task.completed && { opacity: 0.6 },
                ]}
              >
                <Pressable
                  style={[
                    styles.checkbox,
                    {
                      borderColor: task.completed ? Colors.accent : theme.border,
                      backgroundColor: task.completed ? Colors.accent : "transparent",
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    updateTask(task.id, { completed: !task.completed });
                  }}
                >
                  {task.completed && <Feather name="check" size={12} color="#fff" />}
                </Pressable>

                <View style={styles.taskContent}>
                  <View style={styles.taskTop}>
                    <Text
                      style={[
                        styles.taskTitle,
                        { color: theme.text },
                        task.completed && styles.taskDone,
                      ]}
                      numberOfLines={2}
                    >
                      {task.title}
                    </Text>
                    <View
                      style={[
                        styles.priorityBadge,
                        { backgroundColor: PRIORITY_COLORS[task.priority] + "22" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.priorityText,
                          { color: PRIORITY_COLORS[task.priority] },
                        ]}
                      >
                        {PRIORITY_LABELS[task.priority]}
                      </Text>
                    </View>
                  </View>

                  {task.description ? (
                    <Text
                      style={[styles.taskDesc, { color: theme.textSecondary }]}
                      numberOfLines={2}
                    >
                      {task.description}
                    </Text>
                  ) : null}

                  <View style={styles.taskMeta}>
                    {proj && (
                      <View style={styles.taskMetaItem}>
                        <View style={[styles.colorDot, { backgroundColor: proj.color }]} />
                        <Text style={[styles.taskMetaText, { color: theme.textSecondary }]}>
                          {proj.name}
                        </Text>
                      </View>
                    )}
                    {task.assignee && (
                      <View style={styles.taskMetaItem}>
                        <Feather name="user" size={11} color={theme.textTertiary} />
                        <Text style={[styles.taskMetaText, { color: theme.textSecondary }]}>
                          {task.assignee}
                        </Text>
                      </View>
                    )}
                    {task.dueDate && (
                      <View style={styles.taskMetaItem}>
                        <Feather name="calendar" size={11} color={theme.textTertiary} />
                        <Text style={[styles.taskMetaText, { color: theme.textSecondary }]}>
                          {new Date(task.dueDate).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                          })}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <Pressable
                  style={styles.deleteBtn}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    deleteTask(task.id);
                  }}
                >
                  <Feather name="trash-2" size={15} color={Colors.danger} />
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  screenTitle: { fontSize: 28, fontFamily: "Inter_700Bold", marginBottom: 4 },
  screenSubtitle: { fontSize: 14, fontFamily: "Inter_400Regular" },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  tabRow: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: "center" },
  tabText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  emptyState: {
    alignItems: "center",
    gap: 12,
    padding: 40,
    borderRadius: 16,
    borderWidth: 1,
  },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  emptyBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  emptyBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  taskCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  taskContent: { flex: 1, gap: 4 },
  taskTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  taskTitle: { flex: 1, fontSize: 15, fontFamily: "Inter_600SemiBold" },
  taskDone: { textDecorationLine: "line-through" },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  priorityText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  taskDesc: { fontSize: 13, fontFamily: "Inter_400Regular" },
  taskMeta: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 4 },
  taskMetaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  colorDot: { width: 8, height: 8, borderRadius: 4 },
  taskMetaText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  deleteBtn: { padding: 4 },
});
