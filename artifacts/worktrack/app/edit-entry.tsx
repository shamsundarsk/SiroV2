import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
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
import { TaskCategory, useApp } from "@/context/AppContext";

const CATEGORIES: TaskCategory[] = [
  "Design", "Development", "Testing", "Meeting", "Research", "Other",
];

export default function EditEntryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { timeEntries, projects, updateTimeEntry } = useApp();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  const entry = timeEntries.find((e) => e.id === id);

  const [selectedProject, setSelectedProject] = useState(entry?.projectId || "");
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory>(
    entry?.category || "Development"
  );
  const [description, setDescription] = useState(entry?.description || "");
  const [hours, setHours] = useState(
    entry ? String(Math.floor(entry.duration / 3600)) : "1"
  );
  const [minutes, setMinutes] = useState(
    entry ? String(Math.floor((entry.duration % 3600) / 60)) : "0"
  );

  if (!entry) {
    return (
      <View style={[styles.container, { backgroundColor: theme.surface }]}>
        <Text style={{ color: theme.textSecondary, textAlign: "center", marginTop: 40 }}>
          Entry not found
        </Text>
      </View>
    );
  }

  const handleSave = () => {
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    const durationSecs = h * 3600 + m * 60;
    if (durationSecs <= 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateTimeEntry(id!, {
      projectId: selectedProject,
      category: selectedCategory,
      description,
      duration: durationSecs,
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
        <Text style={[styles.title, { color: theme.text }]}>Edit Entry</Text>
        <Pressable onPress={() => router.back()}>
          <Feather name="x" size={22} color={theme.textSecondary} />
        </Pressable>
      </View>

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

      <Text style={[styles.label, { color: theme.textSecondary }]}>CATEGORY</Text>
      <View style={styles.categoryGrid}>
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat}
            style={[
              styles.categoryBtn,
              {
                backgroundColor: selectedCategory === cat ? Colors.primary : theme.surfaceSecondary,
                borderColor: selectedCategory === cat ? Colors.primary : theme.border,
              },
            ]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text style={[styles.categoryBtnText, { color: selectedCategory === cat ? "#fff" : theme.textSecondary }]}>
              {cat}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={[styles.label, { color: theme.textSecondary }]}>DURATION</Text>
      <View style={styles.durationRow}>
        <View style={styles.durationField}>
          <TextInput
            style={[styles.durationInput, { backgroundColor: theme.surfaceSecondary, color: theme.text, borderColor: theme.border }]}
            value={hours}
            onChangeText={setHours}
            keyboardType="number-pad"
            maxLength={2}
          />
          <Text style={[styles.durationUnit, { color: theme.textSecondary }]}>hours</Text>
        </View>
        <Text style={[styles.durationSep, { color: theme.textSecondary }]}>:</Text>
        <View style={styles.durationField}>
          <TextInput
            style={[styles.durationInput, { backgroundColor: theme.surfaceSecondary, color: theme.text, borderColor: theme.border }]}
            value={minutes}
            onChangeText={setMinutes}
            keyboardType="number-pad"
            maxLength={2}
          />
          <Text style={[styles.durationUnit, { color: theme.textSecondary }]}>minutes</Text>
        </View>
      </View>

      <Text style={[styles.label, { color: theme.textSecondary }]}>DESCRIPTION</Text>
      <TextInput
        style={[styles.textArea, { backgroundColor: theme.surfaceSecondary, color: theme.text, borderColor: theme.border }]}
        value={description}
        onChangeText={setDescription}
        placeholder="What did you work on?"
        placeholderTextColor={theme.textTertiary}
        multiline
        numberOfLines={3}
      />

      <Pressable style={[styles.saveBtn, { backgroundColor: Colors.primary }]} onPress={handleSave}>
        <Text style={styles.saveBtnText}>Save Changes</Text>
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
  selectorList: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  selectorItem: { flexDirection: "row", alignItems: "center", gap: 10, padding: 13 },
  colorDot: { width: 10, height: 10, borderRadius: 5 },
  selectorText: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  categoryBtnText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  durationRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  durationField: { flex: 1, alignItems: "center", gap: 6 },
  durationInput: {
    width: "100%",
    textAlign: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  durationUnit: { fontSize: 12, fontFamily: "Inter_400Regular" },
  durationSep: { fontSize: 28, fontFamily: "Inter_700Bold", paddingBottom: 24 },
  textArea: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    minHeight: 80,
    textAlignVertical: "top",
  },
  saveBtn: { padding: 16, borderRadius: 14, alignItems: "center", marginTop: 24 },
  saveBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
});
