import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState, AppStateStatus } from "react-native";

export type TaskCategory =
  | "Design"
  | "Development"
  | "Testing"
  | "Meeting"
  | "Research"
  | "Other";

export interface Project {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

export interface TimeEntry {
  id: string;
  projectId: string;
  category: TaskCategory;
  description: string;
  startTime: number;
  endTime: number;
  duration: number;
}

export interface RunningTimer {
  projectId: string;
  category: TaskCategory;
  description: string;
  startTime: number;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  authorName: string;
  authorId: string;
  text: string;
  timestamp: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  assignee: string;
  dueDate: number | null;
  completed: boolean;
  priority: "low" | "medium" | "high";
  createdAt: number;
}

export interface ScreenTimeRecord {
  screen: string;
  totalTime: number;
  sessions: { start: number; end: number }[];
  date: string;
}

export interface AppUsageRecord {
  appName: string;
  totalTime: number;
  date: string;
}

const STORAGE_KEYS = {
  PROJECTS: "worktrack:projects",
  TIME_ENTRIES: "worktrack:time_entries",
  RUNNING_TIMER: "worktrack:running_timer",
  CHAT_MESSAGES: "worktrack:chat_messages",
  TASKS: "worktrack:tasks",
  CURRENT_USER: "worktrack:current_user",
  SCREEN_TIME: "worktrack:screen_time",
  APP_USAGE: "worktrack:app_usage",
  NOTIFICATIONS: "worktrack:notifications",
};

const DEFAULT_PROJECTS: Project[] = [
  { id: "p1", name: "Website Redesign", color: "#3B82F6", createdAt: Date.now() },
  { id: "p2", name: "Mobile App", color: "#10B981", createdAt: Date.now() },
  { id: "p3", name: "Marketing Campaign", color: "#8B5CF6", createdAt: Date.now() },
];

const DEFAULT_USER = {
  id: "user_" + Date.now().toString(36),
  name: "Alex Johnson",
};

interface AppContextValue {
  projects: Project[];
  timeEntries: TimeEntry[];
  runningTimer: RunningTimer | null;
  chatMessages: ChatMessage[];
  tasks: Task[];
  currentUser: { id: string; name: string };
  screenTimeRecords: ScreenTimeRecord[];
  appUsageRecords: AppUsageRecord[];
  notifications: string[];

  addProject: (project: Omit<Project, "id" | "createdAt">) => void;
  deleteProject: (id: string) => void;

  startTimer: (
    projectId: string,
    category: TaskCategory,
    description: string
  ) => void;
  stopTimer: () => void;
  addManualEntry: (entry: Omit<TimeEntry, "id">) => void;
  updateTimeEntry: (id: string, updates: Partial<TimeEntry>) => void;
  deleteTimeEntry: (id: string) => void;

  sendMessage: (roomId: string, text: string) => void;

  addTask: (task: Omit<Task, "id" | "createdAt">) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;

  recordScreenTime: (screen: string, durationMs: number) => void;
  dismissNotification: (idx: number) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(DEFAULT_PROJECTS);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [runningTimer, setRunningTimer] = useState<RunningTimer | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentUser] = useState(DEFAULT_USER);
  const [screenTimeRecords, setScreenTimeRecords] = useState<ScreenTimeRecord[]>([]);
  const [appUsageRecords, setAppUsageRecords] = useState<AppUsageRecord[]>([]);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const appBgStartRef = useRef<number | null>(null);
  const idleCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      const [
        projRaw,
        entriesRaw,
        timerRaw,
        chatRaw,
        tasksRaw,
        screenRaw,
        appUsageRaw,
        notifRaw,
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.PROJECTS),
        AsyncStorage.getItem(STORAGE_KEYS.TIME_ENTRIES),
        AsyncStorage.getItem(STORAGE_KEYS.RUNNING_TIMER),
        AsyncStorage.getItem(STORAGE_KEYS.CHAT_MESSAGES),
        AsyncStorage.getItem(STORAGE_KEYS.TASKS),
        AsyncStorage.getItem(STORAGE_KEYS.SCREEN_TIME),
        AsyncStorage.getItem(STORAGE_KEYS.APP_USAGE),
        AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS),
      ]);
      if (projRaw) setProjects(JSON.parse(projRaw));
      if (entriesRaw) setTimeEntries(JSON.parse(entriesRaw));
      if (timerRaw) setRunningTimer(JSON.parse(timerRaw));
      if (chatRaw) setChatMessages(JSON.parse(chatRaw));
      if (tasksRaw) setTasks(JSON.parse(tasksRaw));
      if (screenRaw) setScreenTimeRecords(JSON.parse(screenRaw));
      if (appUsageRaw) setAppUsageRecords(JSON.parse(appUsageRaw));
      if (notifRaw) setNotifications(JSON.parse(notifRaw));
    } catch {}
    setLoaded(true);
  }

  const persist = useCallback(async (key: string, value: unknown) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }, []);

  const addProject = useCallback(
    (project: Omit<Project, "id" | "createdAt">) => {
      const newProj: Project = { ...project, id: genId(), createdAt: Date.now() };
      setProjects((prev) => {
        const next = [...prev, newProj];
        persist(STORAGE_KEYS.PROJECTS, next);
        return next;
      });
    },
    [persist]
  );

  const deleteProject = useCallback(
    (id: string) => {
      setProjects((prev) => {
        const next = prev.filter((p) => p.id !== id);
        persist(STORAGE_KEYS.PROJECTS, next);
        return next;
      });
    },
    [persist]
  );

  const startTimer = useCallback(
    (projectId: string, category: TaskCategory, description: string) => {
      const timer: RunningTimer = {
        projectId,
        category,
        description,
        startTime: Date.now(),
      };
      setRunningTimer(timer);
      persist(STORAGE_KEYS.RUNNING_TIMER, timer);
    },
    [persist]
  );

  const stopTimer = useCallback(() => {
    setRunningTimer((prev) => {
      if (!prev) return null;
      const endTime = Date.now();
      const duration = Math.floor((endTime - prev.startTime) / 1000);
      const entry: TimeEntry = {
        id: genId(),
        projectId: prev.projectId,
        category: prev.category,
        description: prev.description,
        startTime: prev.startTime,
        endTime,
        duration,
      };
      setTimeEntries((entries) => {
        const next = [entry, ...entries];
        persist(STORAGE_KEYS.TIME_ENTRIES, next);
        return next;
      });
      persist(STORAGE_KEYS.RUNNING_TIMER, null);
      return null;
    });
  }, [persist]);

  const addManualEntry = useCallback(
    (entry: Omit<TimeEntry, "id">) => {
      const newEntry: TimeEntry = { ...entry, id: genId() };
      setTimeEntries((prev) => {
        const next = [newEntry, ...prev];
        persist(STORAGE_KEYS.TIME_ENTRIES, next);
        return next;
      });
    },
    [persist]
  );

  const updateTimeEntry = useCallback(
    (id: string, updates: Partial<TimeEntry>) => {
      setTimeEntries((prev) => {
        const next = prev.map((e) => (e.id === id ? { ...e, ...updates } : e));
        persist(STORAGE_KEYS.TIME_ENTRIES, next);
        return next;
      });
    },
    [persist]
  );

  const deleteTimeEntry = useCallback(
    (id: string) => {
      setTimeEntries((prev) => {
        const next = prev.filter((e) => e.id !== id);
        persist(STORAGE_KEYS.TIME_ENTRIES, next);
        return next;
      });
    },
    [persist]
  );

  const sendMessage = useCallback(
    (roomId: string, text: string) => {
      const msg: ChatMessage = {
        id: genId(),
        roomId,
        authorName: currentUser.name,
        authorId: currentUser.id,
        text,
        timestamp: Date.now(),
      };
      setChatMessages((prev) => {
        const next = [...prev, msg];
        persist(STORAGE_KEYS.CHAT_MESSAGES, next);
        return next;
      });
    },
    [currentUser, persist]
  );

  const addTask = useCallback(
    (task: Omit<Task, "id" | "createdAt">) => {
      const newTask: Task = { ...task, id: genId(), createdAt: Date.now() };
      setTasks((prev) => {
        const next = [newTask, ...prev];
        persist(STORAGE_KEYS.TASKS, next);
        return next;
      });
    },
    [persist]
  );

  const updateTask = useCallback(
    (id: string, updates: Partial<Task>) => {
      setTasks((prev) => {
        const next = prev.map((t) => (t.id === id ? { ...t, ...updates } : t));
        persist(STORAGE_KEYS.TASKS, next);
        return next;
      });
    },
    [persist]
  );

  const deleteTask = useCallback(
    (id: string) => {
      setTasks((prev) => {
        const next = prev.filter((t) => t.id !== id);
        persist(STORAGE_KEYS.TASKS, next);
        return next;
      });
    },
    [persist]
  );

  const recordScreenTime = useCallback(
    (screen: string, durationMs: number) => {
      const today = todayStr();
      setScreenTimeRecords((prev) => {
        const existing = prev.find((r) => r.screen === screen && r.date === today);
        let next: ScreenTimeRecord[];
        if (existing) {
          next = prev.map((r) =>
            r.screen === screen && r.date === today
              ? { ...r, totalTime: r.totalTime + durationMs }
              : r
          );
        } else {
          next = [
            ...prev,
            { screen, totalTime: durationMs, sessions: [], date: today },
          ];
        }
        persist(STORAGE_KEYS.SCREEN_TIME, next);
        return next;
      });

      if (durationMs > 20 * 60 * 1000) {
        const msg = `You've spent ${Math.floor(durationMs / 60000)} min on ${screen}. Time to get back to work!`;
        setNotifications((prev) => {
          const next = [...prev, msg];
          persist(STORAGE_KEYS.NOTIFICATIONS, next);
          return next;
        });
      }
    },
    [persist]
  );

  const dismissNotification = useCallback((idx: number) => {
    setNotifications((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      persist(STORAGE_KEYS.NOTIFICATIONS, next);
      return next;
    });
  }, [persist]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (appStateRef.current === "active" && nextState !== "active") {
        appBgStartRef.current = Date.now();
      }
      if (appStateRef.current !== "active" && nextState === "active") {
        if (appBgStartRef.current) {
          const bgTime = Date.now() - appBgStartRef.current;
          const today = todayStr();
          setAppUsageRecords((prev) => {
            const existing = prev.find(
              (r) => r.appName === "Background" && r.date === today
            );
            let next: AppUsageRecord[];
            if (existing) {
              next = prev.map((r) =>
                r.appName === "Background" && r.date === today
                  ? { ...r, totalTime: r.totalTime + bgTime }
                  : r
              );
            } else {
              next = [
                ...prev,
                { appName: "Background", totalTime: bgTime, date: today },
              ];
            }
            persist(STORAGE_KEYS.APP_USAGE, next);
            return next;
          });
          appBgStartRef.current = null;
        }
      }
      appStateRef.current = nextState;
    });
    return () => subscription.remove();
  }, [persist]);

  const value = useMemo(
    () => ({
      projects,
      timeEntries,
      runningTimer,
      chatMessages,
      tasks,
      currentUser,
      screenTimeRecords,
      appUsageRecords,
      notifications,
      addProject,
      deleteProject,
      startTimer,
      stopTimer,
      addManualEntry,
      updateTimeEntry,
      deleteTimeEntry,
      sendMessage,
      addTask,
      updateTask,
      deleteTask,
      recordScreenTime,
      dismissNotification,
    }),
    [
      projects,
      timeEntries,
      runningTimer,
      chatMessages,
      tasks,
      currentUser,
      screenTimeRecords,
      appUsageRecords,
      notifications,
      addProject,
      deleteProject,
      startTimer,
      stopTimer,
      addManualEntry,
      updateTimeEntry,
      deleteTimeEntry,
      sendMessage,
      addTask,
      updateTask,
      deleteTask,
      recordScreenTime,
      dismissNotification,
    ]
  );

  if (!loaded) return null;

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m`;
  if (m > 0) return `${m}m ${s.toString().padStart(2, "0")}s`;
  return `${s}s`;
}

export function formatDurationHM(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function isToday(ts: number): boolean {
  const d = new Date(ts);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
