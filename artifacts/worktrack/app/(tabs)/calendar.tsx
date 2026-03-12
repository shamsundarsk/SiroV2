import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState, useEffect } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import Colors from "@/constants/colors";
import { formatDurationHM, useApp, Task } from "@/context/AppContext";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function CalendarScreen() {
  const { timeEntries, tasks, projects, runningTimer, addTask, updateTask, deleteTask } = useApp();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState<Task["priority"]>("medium");
  const [selectedProject, setSelectedProject] = useState(projects[0]?.id || "");
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Real-time timer updates
  useEffect(() => {
    if (!runningTimer) return;
    
    const interval = setInterval(() => {
      // Force re-render to update running timer displays
      setCurrentDate(prev => new Date(prev));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [runningTimer]);

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
    
    // Add running timer if it's in current month
    if (runningTimer) {
      const runningDate = new Date(runningTimer.startTime);
      if (runningDate.getFullYear() === year && runningDate.getMonth() === month) {
        const day = runningDate.getDate();
        if (!map[day]) map[day] = { total: 0, projects: new Set() };
        const runningDuration = Math.floor((Date.now() - runningTimer.startTime) / 1000);
        map[day].total += runningDuration;
        map[day].projects.add(runningTimer.projectId);
      }
    }
    
    return map;
  }, [timeEntries, year, month, runningTimer]);

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
    const entries = timeEntries.filter((e) => {
      const d = new Date(e.startTime);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === selectedDay;
    });
    
    // Add running timer as a virtual entry if it's on the selected day
    if (runningTimer) {
      const runningDate = new Date(runningTimer.startTime);
      if (
        runningDate.getFullYear() === year &&
        runningDate.getMonth() === month &&
        runningDate.getDate() === selectedDay
      ) {
        const runningDuration = Math.floor((Date.now() - runningTimer.startTime) / 1000);
        const virtualEntry = {
          id: 'running-timer',
          projectId: runningTimer.projectId,
          category: runningTimer.category,
          description: runningTimer.description,
          startTime: runningTimer.startTime,
          endTime: Date.now(),
          duration: runningDuration,
          isRunning: true,
        };
        return [virtualEntry, ...entries];
      }
    }
    
    return entries;
  }, [timeEntries, year, month, selectedDay, runningTimer]);

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

  const openTaskModal = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setTaskTitle(task.title);
      setTaskDescription(task.description);
      setTaskPriority(task.priority);
      setSelectedProject(task.projectId);
    } else {
      setEditingTask(null);
      setTaskTitle("");
      setTaskDescription("");
      setTaskPriority("medium");
      setSelectedProject(projects[0]?.id || "");
    }
    setShowTaskModal(true);
  };

  const closeTaskModal = () => {
    setShowTaskModal(false);
    setEditingTask(null);
    setTaskTitle("");
    setTaskDescription("");
    setTaskPriority("medium");
  };

  const handleSaveTask = () => {
    if (!taskTitle.trim() || !selectedDay) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const dueDate = new Date(year, month, selectedDay).getTime();
    
    if (editingTask) {
      updateTask(editingTask.id, {
        title: taskTitle.trim(),
        description: taskDescription,
        priority: taskPriority,
        projectId: selectedProject,
        dueDate,
      });
    } else {
      addTask({
        title: taskTitle.trim(),
        description: taskDescription,
        projectId: selectedProject,
        assignee: "You",
        dueDate,
        completed: false,
        priority: taskPriority,
      });
    }
    
    closeTaskModal();
  };

  const handleDeleteTask = (task: Task) => {
    Alert.alert(
      "Delete Task",
      "Are you sure you want to delete this task?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            deleteTask(task.id);
          },
        },
      ]
    );
  };

  const handleToggleTask = (task: Task) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateTask(task.id, { completed: !task.completed });
  };

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
            <Text style={[styles.screenTitle, { color: theme.text }]}>Calendar</Text>
            <Text style={[styles.screenSubtitle, { color: theme.textSecondary }]}>
              Time entries & tasks
            </Text>
          </View>
          {selectedDay && (
            <Pressable
              style={[styles.addTaskBtn, { backgroundColor: Colors.primary }]}
              onPress={() => openTaskModal()}
            >
              <Feather name="plus" size={18} color="#fff" />
              <Text style={styles.addTaskBtnText}>Add Task</Text>
            </Pressable>
          )}
        </View>

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
              const isRunning = (entry as any).isRunning;
              return (
                <View
                  key={entry.id}
                  style={[styles.entryRow, { backgroundColor: theme.surface, borderColor: theme.border }]}
                >
                  <View style={[styles.entryColorBar, { backgroundColor: proj?.color || Colors.primary }]} />
                  <View style={styles.entryContent}>
                    <View style={styles.entryTop}>
                      <Text style={[styles.entryProject, { color: theme.text }]}>
                        {proj?.name}
                        {isRunning && (
                          <Text style={{ color: Colors.accent, fontSize: 12 }}> • RUNNING</Text>
                        )}
                      </Text>
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
              const priorityColor = task.priority === "high" ? Colors.danger : 
                                 task.priority === "medium" ? Colors.warning : Colors.accent;
              return (
                <Pressable
                  key={task.id}
                  style={[styles.taskRow, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  onPress={() => openTaskModal(task)}
                >
                  <Pressable
                    style={[styles.taskCheckbox, { borderColor: theme.border }]}
                    onPress={() => handleToggleTask(task)}
                  >
                    {task.completed && (
                      <Feather name="check" size={14} color={Colors.accent} />
                    )}
                  </Pressable>
                  <View style={styles.taskContent}>
                    <Text style={[styles.taskTitle, { color: theme.text }, task.completed && styles.taskDone]}>
                      {task.title}
                    </Text>
                    {task.description && (
                      <Text style={[styles.taskDescription, { color: theme.textSecondary }]}>
                        {task.description}
                      </Text>
                    )}
                    {proj && (
                      <Text style={[styles.taskProject, { color: theme.textSecondary }]}>
                        {proj.name}
                      </Text>
                    )}
                  </View>
                  <View style={styles.taskActions}>
                    <View style={[styles.priorityBadge, { backgroundColor: priorityColor + "22" }]}>
                      <Text style={[styles.priorityText, { color: priorityColor }]}>
                        {task.priority.toUpperCase()}
                      </Text>
                    </View>
                    <Pressable
                      style={styles.deleteTaskBtn}
                      onPress={() => handleDeleteTask(task)}
                    >
                      <Feather name="trash-2" size={14} color={theme.textTertiary} />
                    </Pressable>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Task Creation/Edit Modal */}
      <Modal
        visible={showTaskModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {editingTask ? "Edit Task" : "New Task"}
            </Text>
            <Pressable onPress={closeTaskModal}>
              <Feather name="x" size={22} color={theme.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>TITLE</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              value={taskTitle}
              onChangeText={setTaskTitle}
              placeholder="What needs to be done?"
              placeholderTextColor={theme.textTertiary}
              autoFocus
            />

            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>DESCRIPTION</Text>
            <TextInput
              style={[styles.modalTextArea, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              value={taskDescription}
              onChangeText={setTaskDescription}
              placeholder="Add details..."
              placeholderTextColor={theme.textTertiary}
              multiline
              numberOfLines={3}
            />

            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>PROJECT</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.projectSelector}>
              {projects.map((project) => (
                <Pressable
                  key={project.id}
                  style={[
                    styles.projectOption,
                    { backgroundColor: project.color + "22", borderColor: selectedProject === project.id ? project.color : "transparent" }
                  ]}
                  onPress={() => setSelectedProject(project.id)}
                >
                  <View style={[styles.projectDot, { backgroundColor: project.color }]} />
                  <Text style={[styles.projectName, { color: theme.text }]}>{project.name}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>PRIORITY</Text>
            <View style={styles.prioritySelector}>
              {(["high", "medium", "low"] as Task["priority"][]).map((priority) => {
                const priorityColor = priority === "high" ? Colors.danger : 
                                   priority === "medium" ? Colors.warning : Colors.accent;
                return (
                  <Pressable
                    key={priority}
                    style={[
                      styles.priorityOption,
                      { 
                        backgroundColor: taskPriority === priority ? priorityColor + "22" : theme.surface,
                        borderColor: taskPriority === priority ? priorityColor : theme.border
                      }
                    ]}
                    onPress={() => setTaskPriority(priority)}
                  >
                    <Text style={[styles.priorityOptionText, { color: taskPriority === priority ? priorityColor : theme.text }]}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {selectedDay && (
              <View style={[styles.dueDateInfo, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Feather name="calendar" size={16} color={Colors.primary} />
                <Text style={[styles.dueDateText, { color: theme.text }]}>
                  Due: {MONTHS[month]} {selectedDay}, {year}
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={[styles.modalFooter, { borderTopColor: theme.border }]}>
            <Pressable
              style={[styles.modalBtn, styles.cancelBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={closeTaskModal}
            >
              <Text style={[styles.cancelBtnText, { color: theme.text }]}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.modalBtn, styles.saveBtn, { backgroundColor: taskTitle.trim() ? Colors.primary : theme.surfaceSecondary }]}
              onPress={handleSaveTask}
              disabled={!taskTitle.trim()}
            >
              <Text style={[styles.saveBtnText, { color: taskTitle.trim() ? "#fff" : theme.textTertiary }]}>
                {editingTask ? "Update" : "Create"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  taskCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  taskContent: { flex: 1 },
  taskTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  taskDescription: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 2 },
  taskProject: { fontSize: 11, fontFamily: "Inter_400Regular" },
  taskDone: { textDecorationLine: "line-through", opacity: 0.6 },
  taskActions: { alignItems: "flex-end", gap: 8 },
  deleteTaskBtn: { padding: 4 },
  priorityBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  priorityText: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 0.3 },
  
  // Header styles
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  addTaskBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addTaskBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  
  // Modal styles
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  modalContent: { flex: 1, padding: 20 },
  fieldLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 16,
  },
  modalInput: {
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    borderWidth: 1,
  },
  modalTextArea: {
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    borderWidth: 1,
    minHeight: 80,
    textAlignVertical: "top",
  },
  projectSelector: { flexDirection: "row", gap: 8 },
  projectOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    marginRight: 8,
  },
  projectDot: { width: 8, height: 8, borderRadius: 4 },
  projectName: { fontSize: 13, fontFamily: "Inter_500Medium" },
  prioritySelector: { flexDirection: "row", gap: 8 },
  priorityOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  priorityOptionText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  dueDateInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  dueDateText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelBtn: { borderWidth: 1 },
  saveBtn: {},
  cancelBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  saveBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  taskProject: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  priorityText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
});
