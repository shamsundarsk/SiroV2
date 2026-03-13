// Simple API test script
const API_BASE = 'http://localhost:3000/api/worktrack';

async function testAPI() {
  console.log('🧪 Testing WorkTrack API...\n');

  try {
    // Test 1: Create a user profile
    console.log('1. Creating user profile...');
    const userResponse = await fetch(`${API_BASE}/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        role: 'firm_worker',
        firmName: 'Test Company'
      })
    });
    const user = await userResponse.json();
    console.log('✅ User created:', user.name, user.id);

    // Test 2: Create a project
    console.log('\n2. Creating project...');
    const projectResponse = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Project',
        color: '#3B82F6'
      })
    });
    const project = await projectResponse.json();
    console.log('✅ Project created:', project.name, project.id);

    // Test 3: Start timer
    console.log('\n3. Starting timer...');
    const timerResponse = await fetch(`${API_BASE}/timer/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        projectId: project.id,
        category: 'Development',
        description: 'Testing API'
      })
    });
    const timer = await timerResponse.json();
    console.log('✅ Timer started:', timer.description);

    // Test 4: Stop timer
    console.log('\n4. Stopping timer...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    const stopResponse = await fetch(`${API_BASE}/timer/stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id })
    });
    const entry = await stopResponse.json();
    console.log('✅ Timer stopped, entry created:', entry.duration, 'seconds');

    // Test 5: Sync data
    console.log('\n5. Testing sync endpoint...');
    const syncResponse = await fetch(`${API_BASE}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        data: {
          userProfile: user,
          projects: [project],
          timeEntries: [entry],
          runningTimer: null,
          tasks: [],
          settings: {
            notificationsEnabled: true,
            taskReminderMinutes: 15
          }
        }
      })
    });
    const syncResult = await syncResponse.json();
    console.log('✅ Data synced:', syncResult.message);

    // Test 6: Get dashboard data
    console.log('\n6. Getting dashboard data...');
    const dashboardResponse = await fetch(`${API_BASE}/dashboard/${user.id}`);
    const dashboard = await dashboardResponse.json();
    console.log('✅ Dashboard data retrieved:', {
      user: dashboard.user.name,
      projects: dashboard.projects.length,
      entries: dashboard.timeEntries.length
    });

    console.log('\n🎉 All API tests passed!');

  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

// Run the test
testAPI();