const express = require('express');
const cors = require('cors');
const NeonHRService = require('./neon-hr-api');

/**
 * Express API Server for HR Website Integration
 * 
 * This creates REST API endpoints that your HR website can call
 * to get employee data directly from Neon database.
 */

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Neon HR Service with your database URL
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_wD7HCEosz8Zx@ep-fancy-salad-adcbugax-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';
const hrService = new NeonHRService(DATABASE_URL);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const result = await hrService.testConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Health check failed',
      error: error.message 
    });
  }
});

// Get all companies
app.get('/api/companies', async (req, res) => {
  try {
    const companies = await hrService.getCompanies();
    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get employees for a specific company
app.get('/api/employees/:firmName', async (req, res) => {
  try {
    const { firmName } = req.params;
    const employees = await hrService.getEmployees(firmName);
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get company analytics
app.get('/api/analytics/:firmName', async (req, res) => {
  try {
    const { firmName } = req.params;
    const analytics = await hrService.getCompanyAnalytics(firmName);
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get procrastination reports
app.get('/api/procrastination-reports/:firmName', async (req, res) => {
  try {
    const { firmName } = req.params;
    const { startDate, endDate, limit } = req.query;
    
    const options = {};
    if (startDate) options.startDate = startDate;
    if (endDate) options.endDate = endDate;
    if (limit) options.limit = limit;
    
    const reports = await hrService.getProcrastinationReports(firmName, options);
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get employee time entries
app.get('/api/time-entries/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate, limit } = req.query;
    
    const options = {};
    if (startDate) options.startDate = startDate;
    if (endDate) options.endDate = endDate;
    if (limit) options.limit = limit;
    
    const timeEntries = await hrService.getEmployeeTimeEntries(employeeId, options);
    res.json(timeEntries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get employee tasks
app.get('/api/tasks/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { completed, limit } = req.query;
    
    const options = {};
    if (completed !== undefined) options.completed = completed === 'true';
    if (limit) options.limit = limit;
    
    const tasks = await hrService.getEmployeeTasks(employeeId, options);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('API Error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 HR API Server running on http://localhost:${PORT}`);
  console.log(`🗄️ Connected to Neon PostgreSQL database`);
  console.log(`📊 API Documentation:`);
  console.log(`   GET /api/health - Database health check`);
  console.log(`   GET /api/companies - List all companies`);
  console.log(`   GET /api/employees/:firmName - Get company employees`);
  console.log(`   GET /api/analytics/:firmName - Get company analytics`);
  console.log(`   GET /api/procrastination-reports/:firmName - Get procrastination reports`);
  console.log(`   GET /api/time-entries/:employeeId - Get employee time entries`);
  console.log(`   GET /api/tasks/:employeeId - Get employee tasks`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await hrService.close();
  process.exit(0);
});