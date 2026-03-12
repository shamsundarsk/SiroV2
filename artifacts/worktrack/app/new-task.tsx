import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
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
import { Task, useApp } from "@/context/AppContext";

const PRIORITIES: Task["priority"][] = ["high", "medium", "low"];
const PRIORITY_COLORS: Record<Task["priority"], string> = {
  high: Colors.danger,
  medium: Colors.warning,
  low: Colors.accent,
};

export default function NewTaskScreen() {
  const { projects, userProfile, addTask } = useApp();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedProject, setSelectedProject] = useState(projects[0]?.id || "");
  const [priority, setPriority] = useState<Task["priority"]>("medium");
  const [assignee, setAssignee] = useState(userProfile?.name || "");

  const handleSave = () => {
    if (!title.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addTask({
      title: title.trim(),
      description,
      projectId: selectedProject,
      assignee,
      dueDate: null,
      completed: false,
      priority,
    });
    router.back();
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.surface }]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>New Task</Text>
        <Pressable onPress={() => router.back()}>
          <Feather name="x" size={22} color={theme.textSecondary} />
        </Pressable>
      </View>

      <Text style={[styles.label, { color: theme.textSecondary }]}>TITLE</Text>
      <TextInput
        style={[styles.input, { backgroundColor: theme.surfaceSecondary, color: theme.text, borderColor: theme.border }]}
        value={title}
        onChangeText={setTitle}
        placeholder="What needs to be done?"
        placeholderTextColor={theme.textTertiary}
        autoFocus
      />

      <Text style={[styles.label, { color: theme.textSecondary }]}>DESCRIPTION</Text>
      <TextInput
        style={[styles.textArea, { backgroundColor: theme.surfaceSecondary, color: theme.text, borderColor: theme.border }]}
        value={description}
        onChangeText={setDescription}
        placeholder="Additional details..."
        placeholderTextColor={theme.textTertiary}
        multiline
        numberOfLines={3}
      />

      <Text style={[styles.label, { color: theme.textSecondary }]}>PROJECT</Text>
      <View style={[styles.selectorList, { borderColor: theme.border }]}>
        {projects.map((p) => (
          <Pressable
            key={p.id}
            style={[
              styles.selectorItem,
              selectedProject === p.id && { backgroundColor: Colors.primary + "18" },
            ]}
            onPress={() => setSelectedProject(p.id)}
          >
            <View style={[styles.colorDot, { backgroundColor: p.color }]} />
            <Text style={[styles.selectorText, { color: theme.text }]}>{p.name}</Text>
            {selectedProject === p.id && (
              <Feather name="check" size={16} color={Colors.primary} />
            )}
          </Pressable>
        ))}
      </View>

      <Text style={[styles.label, { color: theme.textSecondary }]}>PRIORITY</Text>
      <View style={styles.priorityRow}>
        {PRIORITIES.map((p) => (
          <Pressable
            key={p}
            style={[
              styles.priorityBtn,
              {
                backgroundColor:
                  priority === p
                    ? PRIORITY_COLORS[p] + "22"
                    : theme.surfaceSecondary,
                borderColor:
                  priority === p ? PRIORITY_COLORS[p] : theme.border,
                borderWidth: 1.5,
              },
            ]}
            onPress={() => setPriority(p)}
          >
            <Text
              style={[
                styles.priorityBtnText,
                { color: priority === p ? PRIORITY_COLORS[p] : theme.textSecondary },
              ]}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={[styles.label, { color: theme.textSecondary }]}>ASSIGNEE</Text>
      <TextInput
        style={[styles.input, { backgroundColor: theme.surfaceSecondary, color: theme.text, borderColor: theme.border }]}
        value={assignee}
        onChangeText={setAssignee}
        placeholder="Who is this for?"
        placeholderTextColor={theme.textTertiary}
      />

      <Pressable
        style={[styles.saveBtn, { backgroundColor: Colors.primary, opacity: !title.trim() ? 0.5 : 1 }]}
        onPress={handleSave}
        disabled={!title.trim()}
      >
        <Text style={styles.saveBtnText}>Create Task</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  title: { fontSize: 22, fontFamily: "Inter_700Bold" },
  label: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, marginBottom: 8, marginTop: 16 },
  input: { padding: 14, borderRadius: 12, borderWidth: 1, fontSize: 16, fontFamily: "Inter_400Regular" },
  textArea: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    minHeight: 80,
    textAlignVertical: "top",
  },
  selectorList: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  selectorItem: { flexDirection: "row", alignItems: "center", gap: 10, padding: 13 },
  colorDot: { width: 10, height: 10, borderRadius: 5 },
  selectorText: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  priorityRow: { flexDirection: "row", gap: 10 },
  priorityBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  priorityBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  saveBtn: { padding: 16, borderRadius: 14, alignItems: "center", marginTop: 24 },
  saveBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
});
