# WorkTrack API Documentation

## Base URL
```
http://localhost:3000/api/worktrack
```

## Authentication
Currently, the API uses userId-based authentication. In production, implement proper JWT or session-based authentication.

## Endpoints

### User Profile

#### Get User Profile
```http
GET /profile/:userId
```

#### Create User Profile
```http
POST /profile
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "role": "freelancer", // or "firm_worker"
  "firmName": "Optional Company Name"
}
```

#### Update User Profile
```http
PUT /profile/:userId
Content-Type: application/json

{
  "name": "Updated Name",
  "email": "updated@example.com"
}
```

### Projects

#### Get User Projects
```http
GET /projects/:userId
```

#### Create Project
```http
POST /projects
Content-Type: application/json

{
  "name": "Project Name",
  "color": "#3B82F6"
}
```

#### Delete Project
```http
DELETE /projects/:projectId
```

### Timer Management

#### Get Running Timer
```http
GET /timer/:userId
```

#### Start Timer
```http
POST /timer/start
Content-Type: application/json

{
  "userId": "user123",
  "projectId": "project456",
  "category": "Development", // Design, Development, Testing, Meeting, Research, Other
  "description": "Working on feature X"
}
```

#### Stop Timer
```http
POST /timer/stop
Content-Type: application/json

{
  "userId": "user123"
}
```

### Time Entries

#### Get Time Entries
```http
GET /entries/:userId
```

#### Create Manual Time Entry
```http
POST /entries
Content-Type: application/json

{
  "userId": "user123",
  "projectId": "project456",
  "category": "Development",
  "description": "Manual entry",
  "startTime": 1640995200000,
  "endTime": 1640998800000,
  "duration": 3600
}
```

#### Update Time Entry
```http
PUT /entries/:entryId
Content-Type: application/json

{
  "description": "Updated description",
  "duration": 7200
}
```

#### Delete Time Entry
```http
DELETE /entries/:entryId
```

### Tasks

#### Get User Tasks
```http
GET /tasks/:userId
```

#### Create Task
```http
POST /tasks
Content-Type: application/json

{
  "userId": "user123",
  "title": "Task Title",
  "description": "Task description",
  "projectId": "project456",
  "assignee": "John Doe",
  "dueDate": 1640995200000, // optional timestamp
  "priority": "high" // low, medium, high
}
```

#### Update Task
```http
PUT /tasks/:taskId
Content-Type: application/json

{
  "completed": true,
  "priority": "low"
}
```

#### Delete Task
```http
DELETE /tasks/:taskId
```

### Settings

#### Get User Settings
```http
GET /settings/:userId
```

#### Update User Settings
```http
PUT /settings/:userId
Content-Type: application/json

{
  "notificationsEnabled": true,
  "taskReminderMinutes": 15,
  "voiceAgentEnabled": false,
  "voiceAgentDelayMinutes": 5,
  "monitoringEnabled": true,
  "idleAlertMinutes": 20
}
```

### Reports

#### Get Reports Data
```http
GET /reports/:userId?startDate=1640995200000&endDate=1641081600000&projectId=project456
```

Query Parameters:
- `startDate` (optional): Filter entries from this timestamp
- `endDate` (optional): Filter entries until this timestamp  
- `projectId` (optional): Filter entries for specific project

Response:
```json
{
  "entries": [...],
  "summary": {
    "totalDuration": 28800,
    "totalEntries": 12,
    "projectTotals": {
      "project456": 14400,
      "project789": 14400
    },
    "categoryTotals": {
      "Development": 21600,
      "Meeting": 7200
    }
  }
}
```

### Data Sync

#### Sync Mobile Data
```http
POST /sync
Content-Type: application/json

{
  "userId": "user123",
  "data": {
    // Mobile app data to sync
  }
}
```

## Data Models

### User Profile
```typescript
interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "freelancer" | "firm_worker";
  firmName: string;
  onboarded: boolean;
  createdAt: number;
}
```

### Project
```typescript
interface Project {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}
```

### Time Entry
```typescript
interface TimeEntry {
  id: string;
  userId: string;
  projectId: string;
  category: "Design" | "Development" | "Testing" | "Meeting" | "Research" | "Other";
  description: string;
  startTime: number;
  endTime: number;
  duration: number; // in seconds
}
```

### Running Timer
```typescript
interface RunningTimer {
  id: string;
  userId: string;
  projectId: string;
  category: string;
  description: string;
  startTime: number;
}
```

### Task
```typescript
interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  projectId: string;
  assignee: string;
  dueDate: number | null;
  completed: boolean;
  priority: "low" | "medium" | "high";
  createdAt: number;
}
```

## Error Responses

All endpoints return appropriate HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

Error response format:
```json
{
  "error": "Error message description"
}
```

## Development

To start the API server:

```bash
cd artifacts/api-server
npm run dev
```

The server will start on the port specified in the `PORT` environment variable.

## Production Considerations

1. **Database**: Replace in-memory storage with a proper database (PostgreSQL, MongoDB, etc.)
2. **Authentication**: Implement JWT or session-based authentication
3. **Validation**: Add request validation using libraries like Joi or Zod
4. **Rate Limiting**: Implement rate limiting for API endpoints
5. **Logging**: Add proper logging with libraries like Winston
6. **Error Handling**: Implement comprehensive error handling middleware
7. **CORS**: Configure CORS properly for production domains
8. **Environment Variables**: Use environment variables for configuration
9. **Testing**: Add unit and integration tests
10. **Documentation**: Consider using Swagger/OpenAPI for interactive documentation