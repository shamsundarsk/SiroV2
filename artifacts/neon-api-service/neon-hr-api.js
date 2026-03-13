const { Pool } = require('pg');

/**
 * Neon Database HR API Service
 * 
 * This service provides direct access to employee data stored in Neon PostgreSQL
 * for integration with your existing HR website.
 * 
 * Usage: Provide your Neon database connection string and call the methods below.
 */

class NeonHRService {
  constructor(databaseUrl) {
    this.pool = new Pool({
      connectionString: databaseUrl,
      ssl: {
        rejectUnauthorized: false
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    this.pool.on('error', (err) => {
      console.error('Database connection error:', err);
    });
  }

  /**
   * Test database connection
   */
  async testConnection() {
    try {
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW() as current_time');
      client.release();
      return {
        success: true,
        message: 'Database connected successfully',
        timestamp: result.rows[0].current_time
      };
    } catch (error) {
      return {
        success: false,
        message: 'Database connection failed',
        error: error.message
      };
    }
  }

  /**
   * Get all employees for a specific company
   */
  async getEmployees(firmName) {
    try {
      const query = `
        SELECT 
          u.id,
          u.name,
          u.email,
          u.role,
          u.firm_name,
          u.onboarded,
          u.created_at,
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
      `;
      
      const result = await this.pool.query(query, [firmName]);
      
      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        email: row.email,
        mobile: row.mobile,
        role: row.role,
        firmName: row.firm_name,
        onboarded: row.onboarded,
        createdAt: row.created_at,
        totalTimeToday: parseInt(row.total_time_today) || 0, // seconds
        isActive: row.is_active, // has running timer
        taskCount: parseInt(row.task_count) || 0,
        completedTasks: parseInt(row.completed_tasks) || 0
      }));
    } catch (error) {
      throw new Error(`Failed to fetch employees: ${error.message}`);
    }
  }

  /**
   * Get procrastination reports for a company
   */
  async getProcrastinationReports(firmName, options = {}) {
    try {
      let query = 'SELECT * FROM procrastination_reports WHERE firm_name = $1';
      const params = [firmName];
      
      // Optional date filtering
      if (options.startDate) {
        query += ` AND timestamp >= $${params.length + 1}`;
        params.push(parseInt(options.startDate));
      }
      if (options.endDate) {
        query += ` AND timestamp <= $${params.length + 1}`;
        params.push(parseInt(options.endDate));
      }
      
      // Optional limit
      if (options.limit) {
        query += ` ORDER BY timestamp DESC LIMIT $${params.length + 1}`;
        params.push(parseInt(options.limit));
      } else {
        query += ' ORDER BY timestamp DESC';
      }
      
      const result = await this.pool.query(query, params);
      
      return result.rows.map(row => ({
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
    } catch (error) {
      throw new Error(`Failed to fetch procrastination reports: ${error.message}`);
    }
  }

  /**
   * Get time entries for a specific employee
   */
  async getEmployeeTimeEntries(employeeId, options = {}) {
    try {
      let query = `
        SELECT te.*, p.name as project_name, p.color as project_color
        FROM time_entries te
        LEFT JOIN projects p ON te.project_id = p.id
        WHERE te.user_id = $1
      `;
      const params = [employeeId];
      
      if (options.startDate) {
        query += ` AND te.start_time >= $${params.length + 1}`;
        params.push(parseInt(options.startDate));
      }
      if (options.endDate) {
        query += ` AND te.start_time <= $${params.length + 1}`;
        params.push(parseInt(options.endDate));
      }
      
      query += ' ORDER BY te.start_time DESC';
      
      if (options.limit) {
        query += ` LIMIT $${params.length + 1}`;
        params.push(parseInt(options.limit));
      }
      
      const result = await this.pool.query(query, params);
      
      return result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        projectId: row.project_id,
        projectName: row.project_name,
        projectColor: row.project_color,
        category: row.category,
        description: row.description,
        startTime: row.start_time,
        endTime: row.end_time,
        duration: row.duration, // seconds
        createdAt: row.created_at
      }));
    } catch (error) {
      throw new Error(`Failed to fetch time entries: ${error.message}`);
    }
  }

  /**
   * Get tasks for a specific employee
   */
  async getEmployeeTasks(employeeId, options = {}) {
    try {
      let query = `
        SELECT t.*, p.name as project_name, p.color as project_color
        FROM tasks t
        LEFT JOIN projects p ON t.project_id = p.id
        WHERE t.user_id = $1
      `;
      const params = [employeeId];
      
      if (options.completed !== undefined) {
        query += ` AND t.completed = $${params.length + 1}`;
        params.push(options.completed);
      }
      
      query += ' ORDER BY t.created_at DESC';
      
      if (options.limit) {
        query += ` LIMIT $${params.length + 1}`;
        params.push(parseInt(options.limit));
      }
      
      const result = await this.pool.query(query, params);
      
      return result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        title: row.title,
        description: row.description,
        projectId: row.project_id,
        projectName: row.project_name,
        projectColor: row.project_color,
        assignee: row.assignee,
        dueDate: row.due_date,
        completed: row.completed,
        priority: row.priority,
        createdAt: row.created_at
      }));
    } catch (error) {
      throw new Error(`Failed to fetch tasks: ${error.message}`);
    }
  }

  /**
   * Get company analytics and statistics
   */
  async getCompanyAnalytics(firmName) {
    try {
      const [
        totalEmployees,
        activeEmployees,
        todayTimeEntries,
        todayProcrastination,
        weeklyStats
      ] = await Promise.all([
        // Total employees
        this.pool.query('SELECT COUNT(*) as count FROM users WHERE firm_name = $1 AND role = $2', [firmName, 'firm_worker']),
        
        // Active employees (with running timers)
        this.pool.query(`
          SELECT COUNT(DISTINCT u.id) as count 
          FROM users u 
          INNER JOIN running_timers rt ON u.id = rt.user_id 
          WHERE u.firm_name = $1
        `, [firmName]),
        
        // Today's time entries
        this.pool.query(`
          SELECT 
            COUNT(*) as total_entries,
            SUM(duration) as total_duration,
            AVG(duration) as avg_duration
          FROM time_entries te
          INNER JOIN users u ON te.user_id = u.id
          WHERE u.firm_name = $1 
          AND te.start_time >= EXTRACT(EPOCH FROM date_trunc('day', NOW())) * 1000
        `, [firmName]),
        
        // Today's procrastination reports
        this.pool.query(`
          SELECT 
            COUNT(*) as total_reports,
            COUNT(CASE WHEN ai_agent_called = true THEN 1 END) as calls_made,
            AVG(CASE WHEN call_duration ~ '^[0-9]+' THEN CAST(REGEXP_REPLACE(call_duration, '[^0-9]', '', 'g') AS INTEGER) END) as avg_call_duration
          FROM procrastination_reports 
          WHERE firm_name = $1 
          AND timestamp >= EXTRACT(EPOCH FROM date_trunc('day', NOW())) * 1000
        `, [firmName]),
        
        // Weekly productivity stats
        this.pool.query(`
          SELECT 
            DATE_TRUNC('day', TO_TIMESTAMP(start_time / 1000)) as day,
            SUM(duration) as total_duration,
            COUNT(*) as total_entries
          FROM time_entries te
          INNER JOIN users u ON te.user_id = u.id
          WHERE u.firm_name = $1 
          AND te.start_time >= EXTRACT(EPOCH FROM (NOW() - INTERVAL '7 days')) * 1000
          GROUP BY DATE_TRUNC('day', TO_TIMESTAMP(start_time / 1000))
          ORDER BY day
        `, [firmName])
      ]);
      
      return {
        totalEmployees: parseInt(totalEmployees.rows[0].count),
        activeEmployees: parseInt(activeEmployees.rows[0].count),
        todayStats: {
          totalEntries: parseInt(todayTimeEntries.rows[0].total_entries) || 0,
          totalDuration: parseInt(todayTimeEntries.rows[0].total_duration) || 0, // seconds
          avgDuration: parseInt(todayTimeEntries.rows[0].avg_duration) || 0
        },
        procrastinationStats: {
          totalReports: parseInt(todayProcrastination.rows[0].total_reports) || 0,
          callsMade: parseInt(todayProcrastination.rows[0].calls_made) || 0,
          avgCallDuration: parseInt(todayProcrastination.rows[0].avg_call_duration) || 0
        },
        weeklyProductivity: weeklyStats.rows.map(row => ({
          day: row.day,
          totalDuration: parseInt(row.total_duration),
          totalEntries: parseInt(row.total_entries)
        }))
      };
    } catch (error) {
      throw new Error(`Failed to fetch analytics: ${error.message}`);
    }
  }

  /**
   * Get all companies in the database
   */
  async getCompanies() {
    try {
      const result = await this.pool.query(`
        SELECT 
          firm_name,
          COUNT(*) as employee_count,
          COUNT(CASE WHEN rt.id IS NOT NULL THEN 1 END) as active_employees
        FROM users u
        LEFT JOIN running_timers rt ON u.id = rt.user_id
        WHERE u.role = 'firm_worker' AND u.firm_name IS NOT NULL
        GROUP BY firm_name
        ORDER BY firm_name
      `);
      
      return result.rows.map(row => ({
        firmName: row.firm_name,
        employeeCount: parseInt(row.employee_count),
        activeEmployees: parseInt(row.active_employees)
      }));
    } catch (error) {
      throw new Error(`Failed to fetch companies: ${error.message}`);
    }
  }

  /**
   * Close database connection
   */
  async close() {
    await this.pool.end();
  }
}

module.exports = NeonHRService;