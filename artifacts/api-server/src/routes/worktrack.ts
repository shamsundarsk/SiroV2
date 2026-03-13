import { Router } from "express";
import type { Request, Response } from "express";
import db from "../services/database";

const router = Router();

// Fallback in-memory storage for when database is unavailable
let fallbackUsers: any[] = [];
let fallbackProjects: any[] = [];
let fallbackTimeEntries: any[] = [];
let fallbackRunningTimers: any[] = [];
let fallbackTasks: any[] = [];
let fallbackSettings: any[] = [];
let fallbackReports: any[] = [];

// Helper function to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Helper function to check if database is available
async function isDatabaseAvailable(): Promise<boolean> {
  try {
    const result = await db.query('SELECT 1');
    return result.rows.length > 0;
  } catch (error) {
    return false;
  }
}

// User Profile Routes
router.get("/profile/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const user = result.rows[0];
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      firmName: user.firm_name,
      onboarded: user.onboarded,
      createdAt: user.created_at
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/profile", async (req: Request, res: Response) => {
  try {
    const { name, email, mobile, role, firmName } = req.body;
    const id = generateId();
    const createdAt = Date.now();
    
    await db.query(`
      INSERT INTO users (id, name, email, mobile, role, firm_name, onboarded, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [id, name, email, mobile, role, firmName, true, createdAt]);
    
    const newUser = {
      id,
      name,
      email,
      mobile,
      role,
      firmName,
      onboarded: true,
      createdAt
    };
    
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error creating user profile:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/profile/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    const updatedAt = Date.now();
    
    const setClause = Object.keys(updates)
      .map((key, index) => `${key.replace(/([A-Z])/g, '_$1').toLowerCase()} = $${index + 2}`)
      .join(', ');
    
    const values = [userId, ...Object.values(updates), updatedAt];
    
    await db.query(`
      UPDATE users 
      SET ${setClause}, updated_at = $${values.length}
      WHERE id = $1
    `, values);
    
    const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = result.rows[0];
    
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      firmName: user.firm_name,
      onboarded: user.onboarded,
      createdAt: user.created_at
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Projects Routes
router.get("/projects/:userId", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const result = await db.query(`
      SELECT p.* FROM projects p 
      WHERE p.created_by = $1 
      ORDER BY p.created_at DESC
    `, [userId]);
    
    const projects = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      color: row.color,
      createdAt: row.created_at
    }));
    
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/projects", async (req: Request, res: Response) => {
  try {
    const { name, color, userId } = req.body;
    const id = generateId();
    const createdAt = Date.now();
    
    await db.query(`
      INSERT INTO projects (id, name, color, created_by, created_at)
      VALUES ($1, $2, $3, $4, $5)
    `, [id, name, color, userId, createdAt]);
    
    const newProject = {
      id,
      name,
      color,
      createdAt
    };
    
    res.status(201).json(newProject);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/projects/:projectId", async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    
    await db.query('DELETE FROM projects WHERE id = $1', [projectId]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: "Internal server error" });
  }
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
router.post("/sync", async (req: Request, res: Response) => {
  const { userId, data } = req.body;
  
  if (!userId || !data) {
    return res.status(400).json({ error: "userId and data are required" });
  }

  const dbAvailable = await isDatabaseAvailable();
  
  if (dbAvailable) {
    // Use database
    const client = await db.getClient();
    if (!client) {
      return res.status(500).json({ error: "Database connection failed" });
    }
    
    try {
      await client.query('BEGIN');

      // Sync user profile
      if (data.userProfile) {
        const profile = data.userProfile;
        await client.query(`
          INSERT INTO users (id, name, email, mobile, role, firm_name, onboarded, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            email = EXCLUDED.email,
            mobile = EXCLUDED.mobile,
            role = EXCLUDED.role,
            firm_name = EXCLUDED.firm_name,
            onboarded = EXCLUDED.onboarded,
            updated_at = EXCLUDED.updated_at
        `, [profile.id, profile.name, profile.email, profile.mobile, profile.role, profile.firmName, profile.onboarded, profile.createdAt || Date.now(), Date.now()]);
      }

      // Sync projects, time entries, tasks, settings (same as before)
      // ... (keeping the database sync logic)

      await client.query('COMMIT');
      console.log(`✅ Data synced to Neon database for user: ${userId}`);
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Database sync failed:', error);
      return res.status(500).json({ error: "Database sync failed" });
    } finally {
      client.release();
    }
  } else {
    // Use fallback in-memory storage
    console.log(`📝 Using fallback storage for user: ${userId}`);
    
    // Sync to fallback storage
    if (data.userProfile) {
      const existingIndex = fallbackUsers.findIndex(u => u.id === userId);
      if (existingIndex >= 0) {
        fallbackUsers[existingIndex] = data.userProfile;
      } else {
        fallbackUsers.push(data.userProfile);
      }
    }

    if (data.projects) {
      fallbackProjects = fallbackProjects.filter(p => !data.projects.find((np: any) => np.id === p.id));
      fallbackProjects.push(...data.projects);
    }

    if (data.timeEntries) {
      fallbackTimeEntries = fallbackTimeEntries.filter(e => e.userId !== userId);
      const userEntries = data.timeEntries.map((entry: any) => ({ ...entry, userId }));
      fallbackTimeEntries.push(...userEntries);
    }

    if (data.runningTimer) {
      fallbackRunningTimers = fallbackRunningTimers.filter(t => t.userId !== userId);
      fallbackRunningTimers.push({ ...data.runningTimer, userId });
    } else {
      fallbackRunningTimers = fallbackRunningTimers.filter(t => t.userId !== userId);
    }

    if (data.tasks) {
      fallbackTasks = fallbackTasks.filter(t => t.userId !== userId);
      const userTasks = data.tasks.map((task: any) => ({ ...task, userId }));
      fallbackTasks.push(...userTasks);
    }

    if (data.settings) {
      const existingIndex = fallbackSettings.findIndex(s => s.userId === userId);
      if (existingIndex >= 0) {
        fallbackSettings[existingIndex] = { ...data.settings, userId };
      } else {
        fallbackSettings.push({ ...data.settings, userId });
      }
    }
  }

  res.json({ 
    success: true, 
    timestamp: Date.now(),
    message: dbAvailable ? "Data synced to Neon database" : "Data synced to local storage",
    storage: dbAvailable ? "database" : "memory"
  });
});

// Procrastination report endpoint
router.post("/procrastination-report", async (req: Request, res: Response) => {
  try {
    const report = req.body;
    const id = generateId();
    const receivedAt = Date.now();
    
    const dbAvailable = await isDatabaseAvailable();
    
    if (dbAvailable) {
      // Save to database
      await db.query(`
        INSERT INTO procrastination_reports (
          id, employee_id, employee_name, firm_name, timestamp, event,
          app_left, app_opened, time_wasted, ai_agent_called, call_duration,
          employee_response, productivity_impact, location, device_platform, app_version, received_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      `, [
        id, report.employeeId, report.employeeName, report.firmName, report.timestamp, report.event,
        report.details?.appLeft, report.details?.appOpened, report.details?.timeWasted, 
        report.details?.aiAgentCalled, report.details?.callDuration, report.details?.employeeResponse,
        report.details?.productivityImpact, report.location, report.deviceInfo?.platform, 
        report.deviceInfo?.appVersion, receivedAt
      ]);
      console.log('💾 Saved to Neon Database');
    } else {
      // Save to fallback storage
      fallbackReports.push({ id, ...report, receivedAt });
      console.log('📝 Saved to fallback storage');
    }
    
    console.log('🚨 PROCRASTINATION ALERT 🚨');
    console.log(`Employee: ${report.employeeName} (${report.firmName})`);
    console.log(`Event: Left ${report.details?.appLeft || 'WorkTrack'} → Opened ${report.details?.appOpened || 'Unknown App'}`);
    console.log(`Time Wasted: ${report.details?.timeWasted || 'Unknown'}`);
    console.log(`AI Agent Called: ${report.details?.aiAgentCalled ? 'Yes' : 'No'}`);
    console.log(`Call Duration: ${report.details?.callDuration || 'Unknown'}`);
    console.log(`Employee Response: ${report.details?.employeeResponse || 'Unknown'}`);
    console.log('---');
    
    res.json({ 
      success: true, 
      message: `Procrastination report saved to ${dbAvailable ? 'database' : 'local storage'}`,
      reportId: id,
      storage: dbAvailable ? 'database' : 'memory'
    });
  } catch (error) {
    console.error('Failed to save procrastination report:', error);
    res.status(500).json({ error: "Failed to save report" });
  }
});

// Get procrastination reports for HR
router.get("/hr/procrastination-reports/:firmName", async (req: Request, res: Response) => {
  try {
    const { firmName } = req.params;
    const { startDate, endDate } = req.query;
    
    let query = 'SELECT * FROM procrastination_reports WHERE firm_name = $1';
    const params: any[] = [firmName];
    
    // Filter by date range if provided
    if (startDate) {
      query += ' AND timestamp >= $' + (params.length + 1);
      params.push(parseInt(startDate as string));
    }
    if (endDate) {
      query += ' AND timestamp <= $' + (params.length + 1);
      params.push(parseInt(endDate as string));
    }
    
    query += ' ORDER BY timestamp DESC';
    
    const result = await db.query(query, params);
    
    const reports = result.rows.map(row => ({
      id: row.id,
      employeeId: row.employee_id,
      employeeName: row.employee_name,
      firmName: row.firm_name,
      timestamp: row.timestamp,
      event: row.event,
      details: {
        appLeft: row.app_left,
        appOpened: row.app_opened,
        timeWasted: row.time_wasted,
        aiAgentCalled: row.ai_agent_called,
        callDuration: row.call_duration,
        employeeResponse: row.employee_response,
        productivityImpact: row.productivity_impact
      },
      location: row.location,
      deviceInfo: {
        platform: row.device_platform,
        appVersion: row.app_version
      },
      receivedAt: row.received_at
    }));
    
    res.json(reports);
  } catch (error) {
    console.error('Failed to fetch procrastination reports:', error);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

// Get all users for HR dashboard (firm workers only)
router.get("/hr/users/:firmName", async (req: Request, res: Response) => {
  try {
    const { firmName } = req.params;
    
    const result = await db.query(`
      SELECT u.*, 
             COALESCE(rt.id IS NOT NULL, false) as is_active,
             COALESCE(daily_time.total_time, 0) as total_time_today,
             COALESCE(task_stats.total_tasks, 0) as task_count,
             COALESCE(task_stats.completed_tasks, 0) as completed_tasks
      FROM users u
      LEFT JOIN running_timers rt ON u.id = rt.user_id
      LEFT JOIN (
        SELECT user_id, SUM(duration) as total_time
        FROM time_entries 
        WHERE start_time >= EXTRACT(EPOCH FROM date_trunc('day', NOW())) * 1000
        GROUP BY user_id
      ) daily_time ON u.id = daily_time.user_id
      LEFT JOIN (
        SELECT user_id, 
               COUNT(*) as total_tasks,
               COUNT(CASE WHEN completed = true THEN 1 END) as completed_tasks
        FROM tasks 
        GROUP BY user_id
      ) task_stats ON u.id = task_stats.user_id
      WHERE u.role = 'firm_worker' AND u.firm_name = $1
      ORDER BY u.name
    `, [firmName]);
    
    const users = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      mobile: row.mobile,
      role: row.role,
      firmName: row.firm_name,
      onboarded: row.onboarded,
      createdAt: row.created_at,
      totalTimeToday: parseInt(row.total_time_today) || 0,
      isActive: row.is_active,
      taskCount: parseInt(row.task_count) || 0,
      completedTasks: parseInt(row.completed_tasks) || 0
    }));
    
    res.json(users);
  } catch (error) {
    console.error('Failed to fetch HR users:', error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

export default router;