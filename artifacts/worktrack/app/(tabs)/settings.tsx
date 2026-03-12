import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
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
import { UserRole, useApp } from "@/context/AppContext";

const MINUTE_OPTIONS = [5, 10, 15, 20, 30, 45, 60];
const VOICE_DELAY_OPTIONS = [1, 2, 5, 10, 15];
const IDLE_ALERT_OPTIONS = [10, 15, 20, 30, 60];

function SectionHeader({ title, color }: { title: string; color?: string }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  return (
    <Text style={[styles.sectionHeader, { color: color || theme.textSecondary }]}>{title}</Text>
  );
}

function ToggleRow({
  icon,
  iconColor,
  title,
  subtitle,
  value,
  onToggle,
}: {
  icon: string;
  iconColor: string;
  title: string;
  subtitle: string;
  value: boolean;
  onToggle: () => void;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;

  return (
    <Pressable
      style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.border }]}
      onPress={() => { Haptics.selectionAsync(); onToggle(); }}
    >
      <View style={[styles.rowIcon, { backgroundColor: iconColor + "18" }]}>
        <Feather name={icon as any} size={18} color={iconColor} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.rowSub, { color: theme.textSecondary }]}>{subtitle}</Text>
      </View>
      <View style={[styles.toggle, { backgroundColor: value ? Colors.primary : theme.surfaceSecondary }]}>
        <View style={[styles.toggleThumb, { transform: [{ translateX: value ? 20 : 2 }] }]} />
      </View>
    </Pressable>
  );
}

function ChipRow({
  options,
  selected,
  onSelect,
  suffix,
}: {
  options: number[];
  selected: number;
  onSelect: (v: number) => void;
  suffix?: string;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  return (
    <View style={styles.chipRow}>
      {options.map((o) => (
        <Pressable
          key={o}
          style={[
            styles.chip,
            {
              backgroundColor: selected === o ? Colors.primary : theme.surface,
              borderColor: selected === o ? Colors.primary : theme.border,
            },
          ]}
          onPress={() => { Haptics.selectionAsync(); onSelect(o); }}
        >
          <Text style={[styles.chipText, { color: selected === o ? "#fff" : theme.text }]}>
            {o}{suffix}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function SettingsScreen() {
  const { settings, updateSettings, userProfile } = useApp();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const roleLabel = userProfile?.role === "firm_worker" ? "Firm Worker" : "Freelancer";
  const roleIcon = userProfile?.role === "firm_worker" ? "briefcase" : "user";

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Text style={[styles.screenTitle, { color: theme.text }]}>Settings</Text>
        <Text style={[styles.screenSubtitle, { color: theme.textSecondary }]}>
          Configure your WorkTrack experience
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: bottomPad + 20, gap: 6 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.profileCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.profileAvatar, { backgroundColor: Colors.primary }]}>
            <Text style={styles.profileAvatarText}>
              {(userProfile?.name || "U").charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: theme.text }]}>{userProfile?.name || "Worker"}</Text>
            <Text style={[styles.profileEmail, { color: theme.textSecondary }]}>{userProfile?.email || ""}</Text>
            <View style={[styles.roleBadge, { backgroundColor: Colors.primary + "18" }]}>
              <Feather name={roleIcon as any} size={11} color={Colors.primary} />
              <Text style={[styles.roleBadgeText, { color: Colors.primary }]}>{roleLabel}</Text>
              {userProfile?.role === "firm_worker" && userProfile.firmName && (
                <Text style={[styles.roleBadgeText, { color: Colors.primary }]}>
                  · {userProfile.firmName}
                </Text>
              )}
            </View>
          </View>
        </View>

        <SectionHeader title="NOTIFICATIONS" />

        <ToggleRow
          icon="bell"
          iconColor={Colors.warning}
          title="Notifications"
          subtitle="Task reminders and idle alerts"
          value={settings.notificationsEnabled}
          onToggle={() => updateSettings({ notificationsEnabled: !settings.notificationsEnabled })}
        />

        {settings.notificationsEnabled && (
          <>
            <Text style={[styles.subLabel, { color: theme.textSecondary }]}>
              Idle alert after (minutes)
            </Text>
            <ChipRow
              options={IDLE_ALERT_OPTIONS}
              selected={settings.idleAlertMinutes}
              onSelect={(v) => updateSettings({ idleAlertMinutes: v })}
              suffix="m"
            />

            <Text style={[styles.subLabel, { color: theme.textSecondary }]}>
              Task reminder before due (minutes)
            </Text>
            <ChipRow
              options={MINUTE_OPTIONS}
              selected={settings.taskReminderMinutes}
              onSelect={(v) => updateSettings({ taskReminderMinutes: v })}
              suffix="m"
            />
          </>
        )}

        <SectionHeader title="VOICE AGENT" />

        <ToggleRow
          icon="phone-call"
          iconColor={Colors.primary}
          title="Voice Agent Calls"
          subtitle="AI calls you when you're procrastinating"
          value={settings.voiceAgentEnabled}
          onToggle={() => updateSettings({ voiceAgentEnabled: !settings.voiceAgentEnabled })}
        />

        {settings.voiceAgentEnabled && (
          <>
            <Text style={[styles.subLabel, { color: theme.textSecondary }]}>
              Call after leaving app (minutes)
            </Text>
            <ChipRow
              options={VOICE_DELAY_OPTIONS}
              selected={settings.voiceAgentDelayMinutes}
              onSelect={(v) => updateSettings({ voiceAgentDelayMinutes: v })}
              suffix="m"
            />

            <View style={[styles.infoBox, { backgroundColor: Colors.primary + "10", borderColor: Colors.primary + "30" }]}>
              <Feather name="info" size={14} color={Colors.primary} />
              <Text style={[styles.infoText, { color: Colors.primary }]}>
                When you leave the app with a running timer, the AI agent will alert you after {settings.voiceAgentDelayMinutes} minute{settings.voiceAgentDelayMinutes > 1 ? "s" : ""} to stop procrastinating.
              </Text>
            </View>
          </>
        )}

        <SectionHeader title="MONITORING" />

        <ToggleRow
          icon="activity"
          iconColor={Colors.purple}
          title="App Usage Monitoring"
          subtitle="Track screen time and app usage"
          value={settings.monitoringEnabled}
          onToggle={() => updateSettings({ monitoringEnabled: !settings.monitoringEnabled })}
        />

        {userProfile?.role === "firm_worker" && (
          <>
            <SectionHeader title="HR INTEGRATION" color={Colors.purple} />

            <View style={[styles.hrCard, { backgroundColor: theme.surface, borderColor: Colors.purple + "40" }]}>
              <View style={[styles.hrHeader, { borderBottomColor: theme.border }]}>
                <View style={[styles.hrIcon, { backgroundColor: Colors.purple + "18" }]}>
                  <Feather name="briefcase" size={18} color={Colors.purple} />
                </View>
                <View>
                  <Text style={[styles.hrTitle, { color: theme.text }]}>HR Dashboard Sync</Text>
                  <Text style={[styles.hrSub, { color: theme.textSecondary }]}>
                    {userProfile.firmName || "Your Company"}
                  </Text>
                </View>
                <View style={[styles.syncBadge, { backgroundColor: Colors.accent + "20" }]}>
                  <View style={[styles.syncDot, { backgroundColor: Colors.accent }]} />
                  <Text style={[styles.syncText, { color: Colors.accent }]}>Ready</Text>
                </View>
              </View>
              <Text style={[styles.hrBody, { color: theme.textSecondary }]}>
                Your time reports and productivity data will be available for your HR team to review. This helps with payroll, project tracking, and performance reviews.
              </Text>
              <Pressable
                style={[styles.syncBtn, { backgroundColor: Colors.purple }]}
                onPress={() => Alert.alert("HR Sync", "Your data has been queued for sync to the HR dashboard. This feature will be fully active once connected to your company's HR system.")}
              >
                <Feather name="upload-cloud" size={16} color="#fff" />
                <Text style={styles.syncBtnText}>Sync Reports to HR</Text>
              </Pressable>
            </View>
          </>
        )}

        <SectionHeader title="ABOUT" />
        <View style={[styles.aboutCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.aboutTitle, { color: theme.text }]}>WorkTrack</Text>
          <Text style={[styles.aboutVersion, { color: theme.textSecondary }]}>Version 1.0.0</Text>
          <Text style={[styles.aboutDesc, { color: theme.textTertiary }]}>
            Professional time tracking for individuals and teams. Your data stays private on your device.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  screenTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  screenSubtitle: { fontSize: 13, fontFamily: "Inter_400Regular" },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  profileAvatarText: { color: "#fff", fontSize: 20, fontFamily: "Inter_700Bold" },
  profileInfo: { flex: 1, gap: 2 },
  profileName: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  profileEmail: { fontSize: 13, fontFamily: "Inter_400Regular" },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
  },
  roleBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  sectionHeader: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    marginTop: 10,
    marginBottom: 4,
    marginLeft: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 4,
  },
  rowIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  rowSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  toggle: { width: 46, height: 26, borderRadius: 13, justifyContent: "center" },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#fff" },
  subLabel: { fontSize: 12, fontFamily: "Inter_500Medium", marginLeft: 4, marginTop: 6, marginBottom: 2 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  chipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
  },
  infoText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  hrCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 4,
  },
  hrHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderBottomWidth: 1,
  },
  hrIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  hrTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  hrSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  syncBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: "auto",
  },
  syncDot: { width: 6, height: 6, borderRadius: 3 },
  syncText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  hrBody: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19, padding: 14 },
  syncBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    margin: 14,
    marginTop: 0,
    padding: 12,
    borderRadius: 12,
  },
  syncBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  aboutCard: { borderRadius: 14, borderWidth: 1, padding: 16, alignItems: "center", gap: 4 },
  aboutTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  aboutVersion: { fontSize: 13, fontFamily: "Inter_500Medium" },
  aboutDesc: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 18, marginTop: 4 },
});
