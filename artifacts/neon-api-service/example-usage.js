const NeonHRService = require('./neon-hr-api');

/**
 * Example usage of Neon HR API Service
 * 
 * Replace the DATABASE_URL with your actual Neon database connection string
 */

// Your Neon database connection string
const DATABASE_URL = 'postgresql://neondb_owner:npg_wD7HCEosz8Zx@ep-fancy-salad-adcbugax-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';

// Initialize the service
const hrService = new NeonHRService(DATABASE_URL);

async function demonstrateAPI() {
  try {
    console.log('🔌 Testing database connection...');
    const connectionTest = await hrService.testConnection();
    console.log('Connection result:', connectionTest);

    if (!connectionTest.success) {
      console.error('❌ Database connection failed');
      return;
    }

    console.log('\n📊 Getting company analytics...');
    const analytics = await hrService.getCompanyAnalytics('Test Company');
    console.log('Analytics:', JSON.stringify(analytics, null, 2));

    console.log('\n👥 Getting employees...');
    const employees = await hrService.getEmployees('Test Company');
    console.log(`Found ${employees.length} employees:`);
    employees.forEach(emp => {
      console.log(`- ${emp.name} (${emp.email}) - ${emp.isActive ? 'Working' : 'Idle'} - ${Math.round(emp.totalTimeToday / 3600)}h today`);
    });

    console.log('\n🚨 Getting procrastination reports...');
    const reports = await hrService.getProcrastinationReports('Test Company', { limit: 5 });
    console.log(`Found ${reports.length} recent reports:`);
    reports.forEach(report => {
      console.log(`- ${report.employeeName}: ${report.details.appLeft} → ${report.details.appOpened} (${report.details.timeWasted})`);
    });

    if (employees.length > 0) {
      const firstEmployee = employees[0];
      
      console.log(`\n⏱️ Getting time entries for ${firstEmployee.name}...`);
      const timeEntries = await hrService.getEmployeeTimeEntries(firstEmployee.id, { limit: 5 });
      console.log(`Found ${timeEntries.length} recent time entries`);

      console.log(`\n📋 Getting tasks for ${firstEmployee.name}...`);
      const tasks = await hrService.getEmployeeTasks(firstEmployee.id, { limit: 5 });
      console.log(`Found ${tasks.length} tasks`);
    }

    console.log('\n🏢 Getting all companies...');
    const companies = await hrService.getCompanies();
    console.log('Companies in database:');
    companies.forEach(company => {
      console.log(`- ${company.firmName}: ${company.employeeCount} employees (${company.activeEmployees} active)`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    // Close the connection
    await hrService.close();
    console.log('\n✅ Database connection closed');
  }
}

// Run the demonstration
demonstrateAPI();