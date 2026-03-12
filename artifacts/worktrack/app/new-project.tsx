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
import { useApp } from "@/context/AppContext";

export default function NewProjectScreen() {
  const { addProject } = useApp();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState(Colors.projects[0]);

  const handleSave = () => {
    if (!name.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addProject({ name: name.trim(), color: selectedColor });
    router.back();
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.surface }]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>New Project</Text>
        <Pressable onPress={() => router.back()}>
          <Feather name="x" size={22} color={theme.textSecondary} />
        </Pressable>
      </View>

      <Text style={[styles.label, { color: theme.textSecondary }]}>PROJECT NAME</Text>
      <TextInput
        style={[styles.input, { backgroundColor: theme.surfaceSecondary, color: theme.text, borderColor: theme.border }]}
        value={name}
        onChangeText={setName}
        placeholder="e.g. Website Redesign"
        placeholderTextColor={theme.textTertiary}
        autoFocus
      />

      <Text style={[styles.label, { color: theme.textSecondary }]}>COLOR</Text>
      <View style={styles.colorGrid}>
        {Colors.projects.map((color) => (
          <Pressable
            key={color}
            style={[
              styles.colorSwatch,
              { backgroundColor: color },
              selectedColor === color && styles.colorSwatchSelected,
            ]}
            onPress={() => setSelectedColor(color)}
          >
            {selectedColor === color && (
              <Feather name="check" size={18} color="#fff" />
            )}
          </Pressable>
        ))}
      </View>

      <View style={[styles.preview, { backgroundColor: theme.surfaceSecondary }]}>
        <View style={[styles.previewDot, { backgroundColor: selectedColor }]} />
        <Text style={[styles.previewText, { color: theme.text }]}>
          {name || "Project Name"}
        </Text>
      </View>

      <Pressable
        style={[styles.saveBtn, { backgroundColor: Colors.primary, opacity: !name.trim() ? 0.5 : 1 }]}
        onPress={handleSave}
        disabled={!name.trim()}
      >
        <Text style={styles.saveBtnText}>Create Project</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  title: { fontSize: 22, fontFamily: "Inter_700Bold" },
  label: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, marginBottom: 10, marginTop: 16 },
  input: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  colorGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  colorSwatch: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  colorSwatchSelected: {
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  preview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    marginTop: 20,
  },
  previewDot: { width: 12, height: 12, borderRadius: 6 },
  previewText: { fontSize: 15, fontFamily: "Inter_500Medium" },
  saveBtn: { padding: 16, borderRadius: 14, alignItems: "center", marginTop: 24 },
  saveBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
});
