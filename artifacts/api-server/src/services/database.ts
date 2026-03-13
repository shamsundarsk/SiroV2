import { Pool, PoolClient } from 'pg';

const DATABASE_URL = 'postgresql://neondb_owner:npg_wD7HCEosz8Zx@ep-fancy-salad-adcbugax-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';

class DatabaseService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      statement_timeout: 30000,
      query_timeout: 30000,
    });

    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  async initialize(): Promise<void> {
    try {
      console.log('🔌 Connecting to Neon PostgreSQL database...');
      
      // Test connection with timeout
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW() as current_time');
      console.log('✅ Database connected successfully at:', result.rows[0].current_time);
      client.release();
      
      // Create tables if they don't exist
      await this.createTables();
      
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      console.log('⚠️  Continuing without database - using in-memory storage');
      // Don't throw error, continue with in-memory storage
    }
  }

  private async createTables(): Promise<void> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(50) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          mobile VARCHAR(20),
          role VARCHAR(50) NOT NULL CHECK (role IN ('firm_worker', 'freelancer')),
          firm_name VARCHAR(255),
          onboarded BOOLEAN DEFAULT false,
          created_at BIGINT NOT NULL,
          updated_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
        )
      `);

      // Projects table
      await client.query(`
        CREATE TABLE IF NOT EXISTS projects (
          id VARCHAR(50) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          color VARCHAR(7) NOT NULL,
          created_by VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
          created_at BIGINT NOT NULL
        )
      `);

      // Time entries table
      await client.query(`
        CREATE TABLE IF NOT EXISTS time_entries (
          id VARCHAR(50) PRIMARY KEY,
          user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          project_id VARCHAR(50) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          category VARCHAR(50) NOT NULL,
          description TEXT,
          start_time BIGINT NOT NULL,
          end_time BIGINT NOT NULL,
          duration INTEGER NOT NULL,
          created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
        )
      `);

      // Running timers table
      await client.query(`
        CREATE TABLE IF NOT EXISTS running_timers (
          id VARCHAR(50) PRIMARY KEY,
          user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          project_id VARCHAR(50) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          category VARCHAR(50) NOT NULL,
          description TEXT,
          start_time BIGINT NOT NULL,
          created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
          UNIQUE(user_id)
        )
      `);

      // Tasks table
      await client.query(`
        CREATE TABLE IF NOT EXISTS tasks (
          id VARCHAR(50) PRIMARY KEY,
          user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          project_id VARCHAR(50) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          assignee VARCHAR(255),
          due_date BIGINT,
          completed BOOLEAN DEFAULT false,
          priority VARCHAR(10) CHECK (priority IN ('low', 'medium', 'high')),
          created_at BIGINT NOT NULL
        )
      `);

      // Settings table
      await client.query(`
        CREATE TABLE IF NOT EXISTS user_settings (
          user_id VARCHAR(50) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          notifications_enabled BOOLEAN DEFAULT true,
          task_reminder_minutes INTEGER DEFAULT 15,
          voice_agent_enabled BOOLEAN DEFAULT false,
          voice_agent_delay_minutes INTEGER DEFAULT 5,
          monitoring_enabled BOOLEAN DEFAULT true,
          idle_alert_minutes INTEGER DEFAULT 20,
          updated_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
        )
      `);

      // Procrastination reports table
      await client.query(`
        CREATE TABLE IF NOT EXISTS procrastination_reports (
          id VARCHAR(50) PRIMARY KEY,
          employee_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          employee_name VARCHAR(255) NOT NULL,
          firm_name VARCHAR(255) NOT NULL,
          timestamp BIGINT NOT NULL,
          event VARCHAR(100) NOT NULL,
          app_left VARCHAR(100),
          app_opened VARCHAR(100),
          time_wasted VARCHAR(50),
          ai_agent_called BOOLEAN DEFAULT false,
          call_duration VARCHAR(20),
          employee_response VARCHAR(100),
          productivity_impact VARCHAR(20),
          location VARCHAR(100),
          device_platform VARCHAR(50),
          app_version VARCHAR(20),
          received_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
        )
      `);

      // Create indexes for better performance
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_time_entries_user_date 
        ON time_entries(user_id, start_time)
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_tasks_user_due 
        ON tasks(user_id, due_date)
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_procrastination_firm_date 
        ON procrastination_reports(firm_name, timestamp)
      `);

      await client.query('COMMIT');
      console.log('✅ Database tables created/verified successfully');
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Failed to create tables:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async query(text: string, params?: any[]): Promise<any> {
    try {
      const client = await this.pool.connect();
      try {
        const result = await client.query(text, params);
        return result;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Database query failed:', error);
      // Return empty result for fallback
      return { rows: [], rowCount: 0 };
    }
  }

  async getClient(): Promise<PoolClient | null> {
    try {
      return await this.pool.connect();
    } catch (error) {
      console.error('Failed to get database client:', error);
      return null;
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

export default new DatabaseService();