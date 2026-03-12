import { Router } from "express";
import type { Request, Response } from "express";

const router = Router();

// In-memory storage for demo (replace with database in production)
let users: any[] = [];
let projects: any[] = [
  { id: "1", name: "Default Project", color: "#3B82F6", createdAt: Date.now() }
];
let timeEntries: any[] = [];
let runningTimers: any[] = [];
let tasks: any[] = [];
let settings: any[] = [];

// Helper function to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// User Profile Routes
router.get("/profile/:userId", (req: Request, res: Response) => {
  const { userId } = req.params;
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  
  res.json(user);
});

router.post("/profile", (req: Request, res: Response) => {
  const { name, email, role, firmName } = req.body;
  
  const newUser = {
    id: generateId(),
    name,
    email,
    role,
    firmName,
    onboarded: true,
    createdAt: Date.now()
  };
  
  users.push(newUser);
  res.status(201).json(newUser);
});

router.put("/profile/:userId", (req: Request, res: Response) => {
  const { userId } = req.params;
  const updates = req.body;
  
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({ error: "User not found" });
  }
  
  users[userIndex] = { ...users[userIndex], ...updates };
  res.json(users[userIndex]);
});

// Projects Routes
router.get("/projects/:userId", (req: Request, res: Response) => {
  res.json(projects);
});

router.post("/projects", (req: Request, res: Response) => {
  const { name, color } = req.body;
  
  const newProject = {
    id: generateId(),
    name,
    color,
    createdAt: Date.now()
  };
  
  projects.push(newProject);
  res.status(201).json(newProject);
});

router.delete("/projects/:projectId", (req: Request, res: Response) => {
  const { projectId } = req.params;
  
  projects = projects.filter(p => p.id !== projectId);
  res.json({ success: true });
});

// Timer Routes
router.get("/timer/:userId", (req: Request, res: Response) => {
  const { userId } = req.params;
  const runningTimer = runningTimers.find(t => t.userId === userId);
  
  res.json(runningTimer || null);
});

router.post("/timer/start", (req: Request, res: Response) => {
  const { userId, projectId, category, description } = req.body;
  
  // Stop any existing timer for this user
  runningTimers = runningTimers.filter(t => t.userId !== userId);
  
  const newTimer = {
    id: generateId(),
    userId,
    projectId,
    category,
    description,
    startTime: Date.now()
  };
  
  runningTimers.push(newTimer);
  res.status(201).json(newTimer);
});

router.post("/timer/stop", (req: Request, res: Response) => {
  const { userId } = req.body;
  
  const timerIndex = runningTimers.findIndex(t => t.userId === userId);
  if (timerIndex === -1) {
    return res.status(404).json({ error: "No running timer found" });
  }
  
  const timer = runningTimers[timerIndex];
  const endTime = Date.now();
  const duration = Math.floor((endTime - timer.startTime) / 1000);
  
  // Create time entry
  const timeEntry = {
    id: generateId(),
    userId,
    projectId: timer.projectId,
    category: timer.category,
    description: timer.description,
    startTime: timer.startTime,
    endTime,
    duration
  };
  
  timeEntries.push(timeEntry);
  runningTimers.splice(timerIndex, 1);
  
  res.json(timeEntry);
});

// Time Entries Routes
router.get("/entries/:userId", (req: Request, res: Response) => {
  const { userId } = req.params;
  const userEntries = timeEntries.filter(e => e.userId === userId);
  
  res.json(userEntries);
});

router.post("/entries", (req: Request, res: Response) => {
  const { userId, projectId, category, description, startTime, endTime, duration } = req.body;
  
  const newEntry = {
    id: generateId(),
    userId,
    projectId,
    category,
    description,
    startTime,
    endTime,
    duration
  };
  
  timeEntries.push(newEntry);
  res.status(201).json(newEntry);
});

router.put("/entries/:entryId", (req: Request, res: Response) => {
  const { entryId } = req.params;
  const updates = req.body;
  
  const entryIndex = timeEntries.findIndex(e => e.id === entryId);
  if (entryIndex === -1) {
    return res.status(404).json({ error: "Time entry not found" });
  }
  
  timeEntries[entryIndex] = { ...timeEntries[entryIndex], ...updates };
  res.json(timeEntries[entryIndex]);
});

router.delete("/entries/:entryId", (req: Request, res: Response) => {
  const { entryId } = req.params;
  
  timeEntries = timeEntries.filter(e => e.id !== entryId);
  res.json({ success: true });
});

// Tasks Routes
router.get("/tasks/:userId", (req: Request, res: Response) => {
  const { userId } = req.params;
  const userTasks = tasks.filter(t => t.userId === userId);
  
  res.json(userTasks);
});

router.post("/tasks", (req: Request, res: Response) => {
  const { userId, title, description, projectId, assignee, dueDate, priority } = req.body;
  
  const newTask = {
    id: generateId(),
    userId,
    title,
    description,
    projectId,
    assignee,
    dueDate,
    completed: false,
    priority,
    createdAt: Date.now()
  };
  
  tasks.push(newTask);
  res.status(201).json(newTask);
});

router.put("/tasks/:taskId", (req: Request, res: Response) => {
  const { taskId } = req.params;
  const updates = req.body;
  
  const taskIndex = tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) {
    return res.status(404).json({ error: "Task not found" });
  }
  
  tasks[taskIndex] = { ...tasks[taskIndex], ...updates };
  res.json(tasks[taskIndex]);
});

router.delete("/tasks/:taskId", (req: Request, res: Response) => {
  const { taskId } = req.params;
  
  tasks = tasks.filter(t => t.id !== taskId);
  res.json({ success: true });
});

// Settings Routes
router.get("/settings/:userId", (req: Request, res: Response) => {
  const { userId } = req.params;
  const userSettings = settings.find(s => s.userId === userId);
  
  const defaultSettings = {
    notificationsEnabled: true,
    taskReminderMinutes: 15,
    voiceAgentEnabled: false,
    voiceAgentDelayMinutes: 5,
    monitoringEnabled: true,
    idleAlertMinutes: 20
  };
  
  res.json(userSettings || defaultSettings);
});

router.put("/settings/:userId", (req: Request, res: Response) => {
  const { userId } = req.params;
  const updates = req.body;
  
  const settingsIndex = settings.findIndex(s => s.userId === userId);
  
  if (settingsIndex === -1) {
    const newSettings = { userId, ...updates };
    settings.push(newSettings);
    res.json(newSettings);
  } else {
    settings[settingsIndex] = { ...settings[settingsIndex], ...updates };
    res.json(settings[settingsIndex]);
  }
});

// Reports Routes
router.get("/reports/:userId", (req: Request, res: Response) => {
  const { userId } = req.params;
  const { startDate, endDate, projectId } = req.query;
  
  let userEntries = timeEntries.filter(e => e.userId === userId);
  
  // Filter by date range if provided
  if (startDate) {
    userEntries = userEntries.filter(e => e.startTime >= parseInt(startDate as string));
  }
  if (endDate) {
    userEntries = userEntries.filter(e => e.startTime <= parseInt(endDate as string));
  }
  
  // Filter by project if provided
  if (projectId) {
    userEntries = userEntries.filter(e => e.projectId === projectId);
  }
  
  // Calculate totals
  const totalDuration = userEntries.reduce((sum, e) => sum + e.duration, 0);
  const totalEntries = userEntries.length;
  
  // Group by project
  const projectTotals = userEntries.reduce((acc, entry) => {
    if (!acc[entry.projectId]) {
      acc[entry.projectId] = 0;
    }
    acc[entry.projectId] += entry.duration;
    return acc;
  }, {} as Record<string, number>);
  
  // Group by category
  const categoryTotals = userEntries.reduce((acc, entry) => {
    if (!acc[entry.category]) {
      acc[entry.category] = 0;
    }
    acc[entry.category] += entry.duration;
    return acc;
  }, {} as Record<string, number>);
  
  res.json({
    entries: userEntries,
    summary: {
      totalDuration,
      totalEntries,
      projectTotals,
      categoryTotals
    }
  });
});

// Sync endpoint for mobile app
router.post("/sync", (req: Request, res: Response) => {
  const { userId, data } = req.body;
  
  // This would handle syncing data from mobile app
  // For now, just return success
  res.json({ success: true, timestamp: Date.now() });
});

export default router;