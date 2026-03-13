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
import { Alert, AppState, AppStateStatus } from "react-native";
import NotificationService from "../services/SimpleNotificationService";
// import ScreenTimeService from "../services/ScreenTimeService"; // Temporarily disabled

export type TaskCategory =
  | "Design"
  | "Development"
  | "Testing"
  | "Meeting"
  | "Research"
  | "Other";

export type UserRole = "firm_worker" | "freelancer";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: UserRole;
  firmName: string;
  onboarded: boolean;
}

export interface AppSettings {
  notificationsEnabled: boolean;
  taskReminderMinutes: number;
  voiceAgentEnabled: boolean;
  voiceAgentDelayMinutes: number;
  monitoringEnabled: boolean;
  idleAlertMinutes: number;
}

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
  icon: string;
  totalTime: number;
  date: string;
  category: "social" | "entertainment" | "productivity" | "other";
}

const API_BASE_URL = "http://192.168.67.85:3000/api/worktrack";

const STORAGE_KEYS = {
  PROJECTS: "worktrack:projects",
  TIME_ENTRIES: "worktrack:time_entries",
  RUNNING_TIMER: "worktrack:running_timer",
  TASKS: "worktrack:tasks",
  USER_PROFILE: "worktrack:user_profile",
  SETTINGS: "worktrack:settings",
  SCREEN_TIME: "worktrack:screen_time",
  APP_USAGE: "worktrack:app_usage",
  NOTIFICATIONS: "worktrack:notifications",
};

const DEFAULT_PROJECTS: Project[] = [
  { id: "p1", name: "Website Redesign", color: "#3B82F6", createdAt: Date.now() },
  { id: "p2", name: "Mobile App", color: "#10B981", createdAt: Date.now() },
  { id: "p3", name: "Marketing Campaign", color: "#8B5CF6", createdAt: Date.now() },
];

const DEFAULT_SETTINGS: AppSettings = {
  notificationsEnabled: true,
  taskReminderMinutes: 30,
  voiceAgentEnabled: true,
  voiceAgentDelayMinutes: 10, // 10 seconds for demo
  monitoringEnabled: true,
  idleAlertMinutes: 20,
};

const SIMULATED_APPS: Omit<AppUsageRecord, "totalTime" | "date">[] = [
  { appName: "Instagram", icon: "instagram", category: "social" },
  { appName: "YouTube", icon: "youtube", category: "entertainment" },
  { appName: "WhatsApp", icon: "message-circle", category: "social" },
  { appName: "Twitter / X", icon: "twitter", category: "social" },
  { appName: "Netflix", icon: "film", category: "entertainment" },
  { appName: "Spotify", icon: "music", category: "entertainment" },
  { appName: "Safari / Chrome", icon: "globe", category: "productivity" },
  { appName: "Messages", icon: "mail", category: "social" },
];

interface AppContextValue {
  userProfile: UserProfile | null;
  settings: AppSettings;
  projects: Project[];
  timeEntries: TimeEntry[];
  runningTimer: RunningTimer | null;
  tasks: Task[];
  screenTimeRecords: ScreenTimeRecord[];
  appUsageRecords: AppUsageRecord[];
  notifications: string[];
  voiceAgentActive: boolean;
  notificationsEnabled: boolean;

  completeOnboarding: (profile: Omit<UserProfile, "id" | "onboarded">) => void;
  updateSettings: (updates: Partial<AppSettings>) => void;

  addProject: (project: Omit<Project, "id" | "createdAt">) => void;
  deleteProject: (id: string) => void;

  startTimer: (projectId: string, category: TaskCategory, description: string) => void;
  stopTimer: () => void;
  addManualEntry: (entry: Omit<TimeEntry, "id">) => void;
  updateTimeEntry: (id: string, updates: Partial<TimeEntry>) => void;
  deleteTimeEntry: (id: string) => void;

  addTask: (task: Omit<Task, "id" | "createdAt">) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;

  recordScreenTime: (screen: string, durationMs: number) => void;
  dismissNotification: (idx: number) => void;
  dismissVoiceAgent: () => void;
  
  syncToAPI: () => Promise<void>;
  logout: () => void;
  requestNotificationPermissions: () => Promise<boolean>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function generateSimulatedAppUsage(): AppUsageRecord[] {
  const today = todayStr();
  return SIMULATED_APPS.slice(0, 4 + Math.floor(Math.random() * 4)).map((app) => ({
    ...app,
    totalTime: Math.floor(Math.random() * 45 + 5) * 60 * 1000,
    date: today,
  }));
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [projects, setProjects] = useState<Project[]>(DEFAULT_PROJECTS);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [runningTimer, setRunningTimer] = useState<RunningTimer | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [screenTimeRecords, setScreenTimeRecords] = useState<ScreenTimeRecord[]>([]);
  const [appUsageRecords, setAppUsageRecords] = useState<AppUsageRecord[]>([]);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [voiceAgentActive, setVoiceAgentActive] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const appBgStartRef = useRef<number | null>(null);
  const voiceAgentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runningTimerRef = useRef<RunningTimer | null>(null);
  const settingsRef = useRef<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    runningTimerRef.current = runningTimer;
  }, [runningTimer]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    loadAll();
    initializeNotifications();
    // initializeScreenTimeTracking(); // Temporarily disabled
  }, []);

  async function loadAll() {
    try {
      const [
        profileRaw,
        settingsRaw,
        projRaw,
        entriesRaw,
        timerRaw,
        tasksRaw,
        screenRaw,
        appUsageRaw,
        notifRaw,
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE),
        AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
        AsyncStorage.getItem(STORAGE_KEYS.PROJECTS),
        AsyncStorage.getItem(STORAGE_KEYS.TIME_ENTRIES),
        AsyncStorage.getItem(STORAGE_KEYS.RUNNING_TIMER),
        AsyncStorage.getItem(STORAGE_KEYS.TASKS),
        AsyncStorage.getItem(STORAGE_KEYS.SCREEN_TIME),
        AsyncStorage.getItem(STORAGE_KEYS.APP_USAGE),
        AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS),
      ]);
      if (profileRaw) setUserProfile(JSON.parse(profileRaw));
      if (settingsRaw) {
        const s = JSON.parse(settingsRaw);
        setSettings(s);
        settingsRef.current = s;
      }
      if (projRaw) setProjects(JSON.parse(projRaw));
      if (entriesRaw) setTimeEntries(JSON.parse(entriesRaw));
      if (timerRaw) {
        const t = JSON.parse(timerRaw);
        setRunningTimer(t);
        runningTimerRef.current = t;
      }
      if (tasksRaw) setTasks(JSON.parse(tasksRaw));
      if (screenRaw) setScreenTimeRecords(JSON.parse(screenRaw));
      if (appUsageRaw) {
        const usage: AppUsageRecord[] = JSON.parse(appUsageRaw);
        const today = todayStr();
        const hasToday = usage.some((r) => r.date === today);
        if (!hasToday) {
          const simulated = generateSimulatedAppUsage();
          const combined = [...usage, ...simulated];
          setAppUsageRecords(combined);
          AsyncStorage.setItem(STORAGE_KEYS.APP_USAGE, JSON.stringify(combined));
        } else {
          setAppUsageRecords(usage);
        }
      } else {
        const simulated = generateSimulatedAppUsage();
        setAppUsageRecords(simulated);
        AsyncStorage.setItem(STORAGE_KEYS.APP_USAGE, JSON.stringify(simulated));
      }
      if (notifRaw) setNotifications(JSON.parse(notifRaw));
    } catch {}
    setLoaded(true);
  }

  async function initializeNotifications() {
    const enabled = await NotificationService.initialize();
    setNotificationsEnabled(enabled);

    // Set up notification listeners
    const notificationListener = NotificationService.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
      }
    );

    const responseListener = NotificationService.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification response:', response);
        
        // Simply log the response - the app should automatically come to foreground
        // The blank screen issue might be due to the app state, so we'll just ensure
        // the app is properly focused without additional navigation
        console.log('Notification tapped - app should be in foreground now');
      }
    );

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }

  const persist = useCallback(async (key: string, value: unknown) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }, []);

  const completeOnboarding = useCallback(
    async (profile: Omit<UserProfile, "id" | "onboarded">) => {
      const newProfile: UserProfile = {
        ...profile,
        id: genId(),
        onboarded: true,
      };
      setUserProfile(newProfile);
      persist(STORAGE_KEYS.USER_PROFILE, newProfile);
      
      // Auto-sync after onboarding completion
      try {
        const syncData = {
          userProfile: newProfile,
          settings,
          projects,
          timeEntries,
          runningTimer,
          tasks
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        await fetch(`${API_BASE_URL}/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: newProfile.id,
            data: syncData
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        console.log('Onboarding data synced successfully');
      } catch (error) {
        console.log('Auto-sync after onboarding failed (API server may be offline)');
      }
    },
    [persist, settings, projects, timeEntries, runningTimer, tasks]
  );

  const updateSettings = useCallback(
    (updates: Partial<AppSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...updates };
        settingsRef.current = next;
        persist(STORAGE_KEYS.SETTINGS, next);
        return next;
      });
    },
    [persist]
  );

  const addProject = useCallback(
    (project: Omit<Project, "id" | "createdAt">) => {
      const newProj: Project = { ...project, id: genId(), createdAt: Date.now() };
      setProjects((prev) => {
        const next = [...prev, newProj];
        persist(STORAGE_KEYS.PROJECTS, next);
        
        // Sync to API with userId
        if (userProfile) {
          setTimeout(async () => {
            try {
              await fetch(`${API_BASE_URL}/projects`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  ...project,
                  userId: userProfile.id
                })
              });
            } catch (error) {
              console.log('Failed to sync project to API:', error);
            }
          }, 100);
        }
        
        return next;
      });
    },
    [persist, userProfile]
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
    async (projectId: string, category: TaskCategory, description: string) => {
      const timer: RunningTimer = { projectId, category, description, startTime: Date.now() };
      setRunningTimer(timer);
      runningTimerRef.current = timer;
      persist(STORAGE_KEYS.RUNNING_TIMER, timer);
      
      // Auto-sync when timer starts
      if (userProfile) {
        try {
          const syncData = {
            userProfile,
            settings,
            projects,
            timeEntries,
            runningTimer: timer,
            tasks
          };

          await fetch(`${API_BASE_URL}/sync`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: userProfile.id,
              data: syncData
            })
          });
        } catch (error) {
          console.log('Auto-sync after timer start failed:', error);
        }
      }
    },
    [persist, userProfile, settings, projects, timeEntries, tasks]
  );

  const stopTimer = useCallback(async () => {
    if (voiceAgentTimerRef.current) {
      clearTimeout(voiceAgentTimerRef.current);
      voiceAgentTimerRef.current = null;
    }
    setVoiceAgentActive(false);

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
        
        // Auto-sync when timer stops
        if (userProfile) {
          setTimeout(async () => {
            try {
              const syncData = {
                userProfile,
                settings,
                projects,
                timeEntries: next,
                runningTimer: null,
                tasks
              };

              await fetch(`${API_BASE_URL}/sync`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  userId: userProfile.id,
                  data: syncData
                })
              });
            } catch (error) {
              console.log('Auto-sync after timer stop failed:', error);
            }
          }, 100);
        }
        
        return next;
      });
      persist(STORAGE_KEYS.RUNNING_TIMER, null);
      runningTimerRef.current = null;
      return null;
    });
  }, [persist, userProfile, settings, projects, tasks]);

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

  const addTask = useCallback(
    async (task: Omit<Task, "id" | "createdAt">) => {
      const newTask: Task = { ...task, id: genId(), createdAt: Date.now() };
      setTasks((prev) => {
        const next = [newTask, ...prev];
        persist(STORAGE_KEYS.TASKS, next);
        
        // Schedule notifications for task if it has a due date
        if (newTask.dueDate && settings.notificationsEnabled && notificationsEnabled) {
          // Schedule reminder notification
          NotificationService.scheduleTaskReminder(
            newTask.title,
            newTask.id,
            newTask.dueDate,
            settings.taskReminderMinutes
          );
          
          // Schedule due notification
          NotificationService.scheduleTaskDueNotification(
            newTask.title,
            newTask.id,
            newTask.dueDate
          );
        }
        
        // Auto-sync when task is created
        if (userProfile) {
          setTimeout(async () => {
            try {
              const syncData = {
                userProfile,
                settings,
                projects,
                timeEntries,
                runningTimer,
                tasks: next
              };

              await fetch(`${API_BASE_URL}/sync`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  userId: userProfile.id,
                  data: syncData
                })
              });
            } catch (error) {
              console.log('Auto-sync after task creation failed:', error);
            }
          }, 100);
        }
        
        return next;
      });
    },
    [persist, userProfile, settings, projects, timeEntries, runningTimer, notificationsEnabled]
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
      const s = settingsRef.current;
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
          next = [...prev, { screen, totalTime: durationMs, sessions: [], date: today }];
        }
        persist(STORAGE_KEYS.SCREEN_TIME, next);
        return next;
      });

      if (s.notificationsEnabled && durationMs > s.idleAlertMinutes * 60 * 1000) {
        const msg = `Idle alert: ${Math.floor(durationMs / 60000)} min spent away. Time to get back to work!`;
        setNotifications((prev) => {
          const next = [...prev, msg];
          persist(STORAGE_KEYS.NOTIFICATIONS, next);
          return next;
        });
        
        // Send push notification for idle alert
        if (notificationsEnabled) {
          NotificationService.sendIdleAlert(Math.floor(durationMs / 60000));
        }
      }
    },
    [persist]
  );

  const dismissNotification = useCallback(
    (idx: number) => {
      setNotifications((prev) => {
        const next = prev.filter((_, i) => i !== idx);
        persist(STORAGE_KEYS.NOTIFICATIONS, next);
        return next;
      });
    },
    [persist]
  );

  const dismissVoiceAgent = useCallback(() => {
    setVoiceAgentActive(false);
    if (voiceAgentTimerRef.current) {
      clearTimeout(voiceAgentTimerRef.current);
      voiceAgentTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      const s = settingsRef.current;
      const timer = runningTimerRef.current;

      if (appStateRef.current === "active" && nextState !== "active") {
        appBgStartRef.current = Date.now();

        if (timer && s.voiceAgentEnabled) {
          const delayMs = s.voiceAgentDelayMinutes * 1000; // Changed to seconds for demo
          voiceAgentTimerRef.current = setTimeout(() => {
            setVoiceAgentActive(true);
            // Send voice agent notification immediately when backgrounded with timer
            if (notificationsEnabled) {
              NotificationService.sendVoiceAgentAlert();
            }
            console.log('🤖 Voice Agent Activated - Employee left app with running timer!');
          }, delayMs);
        }
      }

      if (appStateRef.current !== "active" && nextState === "active") {
        if (voiceAgentTimerRef.current) {
          clearTimeout(voiceAgentTimerRef.current);
          voiceAgentTimerRef.current = null;
        }

        if (appBgStartRef.current) {
          const bgTime = Date.now() - appBgStartRef.current;
          const today = todayStr();

          setAppUsageRecords((prev) => {
            const existing = prev.find((r) => r.appName === "Other Apps" && r.date === today);
            let next: AppUsageRecord[];
            if (existing) {
              next = prev.map((r) =>
                r.appName === "Other Apps" && r.date === today
                  ? { ...r, totalTime: r.totalTime + bgTime }
                  : r
              );
            } else {
              next = [
                ...prev,
                {
                  appName: "Other Apps",
                  icon: "smartphone",
                  totalTime: bgTime,
                  date: today,
                  category: "other",
                },
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

  const syncToAPI = useCallback(async () => {
    if (!userProfile) return;
    
    try {
      const syncData = {
        userProfile,
        settings,
        projects,
        timeEntries,
        runningTimer,
        tasks
      };

      const response = await fetch(`${API_BASE_URL}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userProfile.id,
          data: syncData
        }),
        timeout: 5000 // 5 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('Data synced to API successfully');
    } catch (error) {
      console.log('Sync failed (API server may be offline):', error.message);
      // Don't show error to user - sync will retry later
    }
  }, [userProfile, settings, projects, timeEntries, runningTimer, tasks]);

  const logout = useCallback(async () => {
    try {
      // Clear all local storage
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.USER_PROFILE),
        AsyncStorage.removeItem(STORAGE_KEYS.SETTINGS),
        AsyncStorage.removeItem(STORAGE_KEYS.PROJECTS),
        AsyncStorage.removeItem(STORAGE_KEYS.TIME_ENTRIES),
        AsyncStorage.removeItem(STORAGE_KEYS.RUNNING_TIMER),
        AsyncStorage.removeItem(STORAGE_KEYS.TASKS),
        AsyncStorage.removeItem(STORAGE_KEYS.SCREEN_TIME),
        AsyncStorage.removeItem(STORAGE_KEYS.APP_USAGE),
        AsyncStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS),
      ]);

      // Reset all state
      setUserProfile(null);
      setSettings(DEFAULT_SETTINGS);
      setProjects([]);
      setTimeEntries([]);
      setRunningTimer(null);
      setTasks([]);
      setScreenTimeRecords([]);
      setAppUsageRecords([]);
      setNotifications([]);
      setVoiceAgentActive(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, []);

  const requestNotificationPermissions = useCallback(async (): Promise<boolean> => {
    const enabled = await NotificationService.initialize();
    setNotificationsEnabled(enabled);
    return enabled;
  }, []);

  // async function initializeScreenTimeTracking() {
  //   // Temporarily disabled - will re-enable after fixing package issues
  // }

  const value = useMemo(
    () => ({
      userProfile,
      settings,
      projects,
      timeEntries,
      runningTimer,
      tasks,
      screenTimeRecords,
      appUsageRecords,
      notifications,
      voiceAgentActive,
      notificationsEnabled,
      completeOnboarding,
      updateSettings,
      addProject,
      deleteProject,
      startTimer,
      stopTimer,
      addManualEntry,
      updateTimeEntry,
      deleteTimeEntry,
      addTask,
      updateTask,
      deleteTask,
      recordScreenTime,
      dismissNotification,
      dismissVoiceAgent,
      syncToAPI,
      logout,
      requestNotificationPermissions,
    }),
    [
      userProfile, settings, projects, timeEntries, runningTimer,
      tasks, screenTimeRecords, appUsageRecords, notifications, voiceAgentActive, notificationsEnabled,
      completeOnboarding, updateSettings, addProject, deleteProject, startTimer,
      stopTimer, addManualEntry, updateTimeEntry, deleteTimeEntry,
      addTask, updateTask, deleteTask, recordScreenTime, dismissNotification, dismissVoiceAgent,
      syncToAPI, logout, requestNotificationPermissions,
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

export function formatTimerDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
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
