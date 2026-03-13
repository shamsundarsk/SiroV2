# 🗄️ Neon HR API Service

## Direct Database Integration for Your HR Website

This service provides clean API endpoints to access employee data directly from your Neon PostgreSQL database. No mockup websites - just the API your existing HR website needs.

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
cd artifacts/neon-api-service
npm install
```

### 2. Configure Database URL
Set your Neon database connection string:
```bash
export DATABASE_URL="postgresql://neondb_owner:npg_wD7HCEosz8Zx@ep-fancy-salad-adcbugax-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

### 3. Start API Server
```bash
npm start
```

The API will be available at: `http://localhost:3002`

## 📊 API Endpoints

### Health Check
```http
GET /api/health
```
Returns database connection status.

### Companies
```http
GET /api/companies
```
Returns all companies with employee counts.

### Employees
```http
GET /api/employees/:firmName
```
Returns all employees for a specific company with real-time data:
- Current work status (active/idle)
- Hours worked today
- Task completion rates
- Profile information

### Analytics
```http
GET /api/analytics/:firmName
```
Returns company analytics:
- Total/active employees
- Daily productivity stats
- Procrastination alert statistics
- Weekly productivity trends

### Procrastination Reports
```http
GET /api/procrastination-reports/:firmName?startDate=123456789&endDate=123456789&limit=10
```
Returns AI voice agent procrastination reports with optional filtering.

### Employee Time Entries
```http
GET /api/time-entries/:employeeId?startDate=123456789&endDate=123456789&limit=10
```
Returns time tracking entries for a specific employee.

### Employee Tasks
```http
GET /api/tasks/:employeeId?completed=true&limit=10
```
Returns tasks for a specific employee.

## 💻 Integration Examples

### JavaScript/Fetch
```javascript
// Get employees for your company
const response = await fetch('http://localhost:3002/api/employees/Your Company Name');
const employees = await response.json();

// Get procrastination reports
const reports = await fetch('http://localhost:3002/api/procrastination-reports/Your Company Name?limit=20');
const alertData = await reports.json();
```

### PHP/cURL
```php
// Get company analytics
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://localhost:3002/api/analytics/Your Company Name');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$analytics = json_decode(curl_exec($ch), true);
curl_close($ch);
```

### Python/Requests
```python
import requests

# Get employees
response = requests.get('http://localhost:3002/api/employees/Your Company Name')
employees = response.json()

# Get procrastination reports
reports = requests.get('http://localhost:3002/api/procrastination-reports/Your Company Name')
alert_data = reports.json()
```

## 🔧 Direct Database Usage

If you prefer to use the service directly in your code:

```javascript
const NeonHRService = require('./neon-hr-api');

const hrService = new NeonHRService('your-neon-database-url');

// Get employees
const employees = await hrService.getEmployees('Your Company Name');

// Get analytics
const analytics = await hrService.getCompanyAnalytics('Your Company Name');

// Get procrastination reports
const reports = await hrService.getProcrastinationReports('Your Company Name', {
  startDate: Date.now() - 86400000, // Last 24 hours
  limit: 50
});
```

## 🧪 Testing

Test the API service:
```bash
npm test
```

This will run example queries and show you the data structure.

## 📋 Data Formats

### Employee Object
```json
{
  "id": "user123",
  "name": "John Doe",
  "email": "john@company.com",
  "role": "firm_worker",
  "firmName": "Your Company",
  "onboarded": true,
  "createdAt": 1640995200000,
  "totalTimeToday": 28800,
  "isActive": true,
  "taskCount": 5,
  "completedTasks": 3
}
```

### Procrastination Report Object
```json
{
  "id": "report123",
  "employeeId": "user123",
  "employeeName": "John Doe",
  "firmName": "Your Company",
  "timestamp": 1640995200000,
  "event": "procrastination_detected",
  "details": {
    "appLeft": "WorkTrack",
    "appOpened": "Instagram",
    "timeWasted": "3 minutes 15 seconds",
    "aiAgentCalled": true,
    "callDuration": "45 seconds",
    "employeeResponse": "Returned to work",
    "productivityImpact": "Medium"
  },
  "location": "Office",
  "deviceInfo": {
    "platform": "Mobile",
    "appVersion": "1.0.0"
  }
}
```

## 🔐 Security Notes

- Database connection uses SSL encryption
- No sensitive data is exposed in API responses
- Consider adding authentication for production use
- Rate limiting recommended for production deployment

## 🚀 Production Deployment

1. **Environment Variables**: Use proper env vars for database URL
2. **Authentication**: Add API key or JWT authentication
3. **Rate Limiting**: Implement request rate limiting
4. **CORS**: Configure CORS for your domain
5. **Monitoring**: Add error tracking and performance monitoring

## ✅ What You Get

- ✅ **Direct Database Access**: No API server dependency
- ✅ **Real-time Data**: Live employee status and metrics
- ✅ **Clean API**: RESTful endpoints for easy integration
- ✅ **Flexible Queries**: Optional filtering and pagination
- ✅ **Production Ready**: SSL, error handling, graceful shutdown

Your existing HR website can now access all employee data directly from the Neon database!