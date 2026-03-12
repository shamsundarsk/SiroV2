import { Feather } from "@expo/vector-icons";
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
import { formatDurationHM, useApp } from "@/context/AppContext";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function CalendarScreen() {
  const { timeEntries, tasks, projects } = useApp();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  const entriesByDay = useMemo(() => {
    const map: Record<number, { total: number; projects: Set<string> }> = {};
    timeEntries.forEach((e) => {
      const d = new Date(e.startTime);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!map[day]) map[day] = { total: 0, projects: new Set() };
        map[day].total += e.duration;
        map[day].projects.add(e.projectId);
      }
    });
    return map;
  }, [timeEntries, year, month]);

  const tasksByDay = useMemo(() => {
    const map: Record<number, number> = {};
    tasks.forEach((t) => {
      if (t.dueDate) {
        const d = new Date(t.dueDate);
        if (d.getFullYear() === year && d.getMonth() === month) {
          const day = d.getDate();
          map[day] = (map[day] || 0) + 1;
        }
      }
    });
    return map;
  }, [tasks, year, month]);

  const selectedEntries = useMemo(() => {
    if (!selectedDay) return [];
    return timeEntries.filter((e) => {
      const d = new Date(e.startTime);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === selectedDay;
    });
  }, [timeEntries, year, month, selectedDay]);

  const selectedTasks = useMemo(() => {
    if (!selectedDay) return [];
    return tasks.filter((t) => {
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === selectedDay;
    });
  }, [tasks, year, month, selectedDay]);

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const todayDate = today.getDate();

  const calendarCells = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d);
  }

  const selectedDayTotal = selectedDay && entriesByDay[selectedDay]
    ? entriesByDay[selectedDay].total
    : 0;

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
        <Text style={[styles.screenTitle, { color: theme.text }]}>Calendar</Text>
        <Text style={[styles.screenSubtitle, { color: theme.textSecondary }]}>
          Time entries & due dates
        </Text>

        <View style={[styles.calendarCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.calendarHeader}>
            <Pressable style={styles.navBtn} onPress={prevMonth}>
              <Feather name="chevron-left" size={20} color={theme.text} />
            </Pressable>
            <Text style={[styles.monthTitle, { color: theme.text }]}>
              {MONTHS[month]} {year}
            </Text>
            <Pressable style={styles.navBtn} onPress={nextMonth}>
              <Feather name="chevron-right" size={20} color={theme.text} />
            </Pressable>
          </View>

          <View style={styles.daysRow}>
            {DAYS.map((d) => (
              <Text key={d} style={[styles.dayLabel, { color: theme.textTertiary }]}>{d}</Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {calendarCells.map((day, idx) => {
              if (!day) {
                return <View key={`empty-${idx}`} style={styles.dayCell} />;
              }
              const hasEntries = !!entriesByDay[day];
              const hasTasks = !!tasksByDay[day];
              const isToday = isCurrentMonth && day === todayDate;
              const isSelected = day === selectedDay;
              const projectColors = hasEntries
                ? [...(entriesByDay[day]?.projects || [])].slice(0, 3).map(
                    (pid) => projects.find((p) => p.id === pid)?.color || Colors.primary
                  )
                : [];

              return (
                <Pressable
                  key={day}
                  style={[
                    styles.dayCell,
                    isSelected && { backgroundColor: Colors.primary, borderRadius: 10 },
                    isToday && !isSelected && {
                      borderWidth: 1.5,
                      borderColor: Colors.primary,
                      borderRadius: 10,
                    },
                  ]}
                  onPress={() => setSelectedDay(day)}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      { color: isSelected ? "#fff" : isToday ? Colors.primary : theme.text },
                    ]}
                  >
                    {day}
                  </Text>
                  <View style={styles.daydots}>
                    {projectColors.slice(0, 2).map((c, i) => (
                      <View
                        key={i}
                        style={[
                          styles.dot,
                          { backgroundColor: isSelected ? "rgba(255,255,255,0.7)" : c },
                        ]}
                      />
                    ))}
                    {hasTasks && (
                      <View
                        style={[
                          styles.dot,
                          { backgroundColor: isSelected ? "rgba(255,255,255,0.7)" : Colors.warning },
                        ]}
                      />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {selectedDay && (
          <View>
            <View style={styles.selectedHeader}>
              <Text style={[styles.selectedDate, { color: theme.text }]}>
                {MONTHS[month]} {selectedDay}
              </Text>
              {selectedDayTotal > 0 && (
                <Text style={[styles.selectedTotal, { color: Colors.primary }]}>
                  {formatDurationHM(selectedDayTotal)} tracked
                </Text>
              )}
            </View>

            {selectedEntries.length === 0 && selectedTasks.length === 0 ? (
              <View style={[styles.emptyDay, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Feather name="calendar" size={24} color={theme.textTertiary} />
                <Text style={[styles.emptyDayText, { color: theme.textSecondary }]}>
                  Nothing on this day
                </Text>
              </View>
            ) : null}

            {selectedEntries.map((entry) => {
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
                    <Text style={[styles.entryCategory, { color: theme.textSecondary }]}>
                      {entry.category}
                      {entry.description ? ` · ${entry.description}` : ""}
                    </Text>
                  </View>
                </View>
              );
            })}

            {selectedTasks.map((task) => {
              const proj = projects.find((p) => p.id === task.projectId);
              return (
                <View
                  key={task.id}
                  style={[styles.taskRow, { backgroundColor: theme.surface, borderColor: theme.border }]}
                >
                  <View style={[styles.taskDot, { backgroundColor: Colors.warning }]} />
                  <View style={styles.taskContent}>
                    <Text style={[styles.taskTitle, { color: theme.text }, task.completed && styles.taskDone]}>
                      {task.title}
                    </Text>
                    {proj && (
                      <Text style={[styles.taskProject, { color: theme.textSecondary }]}>
                        {proj.name}
                      </Text>
                    )}
                  </View>
                  <View style={[styles.priorityBadge, { backgroundColor: Colors.warning + "22" }]}>
                    <Text style={[styles.priorityText, { color: Colors.warning }]}>Due</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  screenTitle: { fontSize: 28, fontFamily: "Inter_700Bold", marginBottom: 4 },
  screenSubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 20 },
  calendarCard: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 20 },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  navBtn: { padding: 4 },
  monthTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  daysRow: { flexDirection: "row", marginBottom: 8 },
  dayLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
  },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap" },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 2,
  },
  dayNumber: { fontSize: 14, fontFamily: "Inter_500Medium" },
  daydots: { flexDirection: "row", gap: 2, marginTop: 2, minHeight: 5 },
  dot: { width: 4, height: 4, borderRadius: 2 },
  selectedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  selectedDate: { fontSize: 17, fontFamily: "Inter_700Bold" },
  selectedTotal: { fontSize: 14, fontFamily: "Inter_700Bold" },
  emptyDay: {
    alignItems: "center",
    gap: 8,
    padding: 24,
    borderRadius: 14,
    borderWidth: 1,
  },
  emptyDayText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  entryRow: {
    flexDirection: "row",
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  entryColorBar: { width: 4 },
  entryContent: { flex: 1, padding: 12 },
  entryTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  entryProject: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  entryDuration: { fontSize: 14, fontFamily: "Inter_700Bold" },
  entryCategory: { fontSize: 12, fontFamily: "Inter_400Regular" },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  taskDot: { width: 8, height: 8, borderRadius: 4 },
  taskContent: { flex: 1 },
  taskTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  taskDone: { textDecorationLine: "line-through" },
  taskProject: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  priorityText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
});
