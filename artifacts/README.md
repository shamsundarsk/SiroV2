# WorkTrack - Complete Time Tracking Solution

## Overview
WorkTrack is a comprehensive time tracking solution with mobile app and web dashboard integration.

### Components
1. **Mobile App** (`worktrack/`) - React Native/Expo app for employees
2. **API Server** (`api-server/`) - Node.js/Express backend for data sync
3. **Web Dashboard** (`web-dashboard/`) - HTML/JS HR dashboard

## Quick Start

### 1. Start API Server
```bash
cd artifacts/api-server
npm install
npm run dev
```
Server runs on http://localhost:3000

### 2. Start Mobile App
```bash
cd artifacts/worktrack
npm install
npx expo start
```
Scan QR code with Expo Go app

### 3. Open Web Dashboard
Open `artifacts/web-dashboard/index.html` in browser

## Features

### Mobile App
- User onboarding (firm worker/freelancer)
- Project management
- Time tracking with timer
- Task management integrated with calendar
- Settings with sync and logout
- Automatic data sync to API

### API Server
- Real user data (no mock data)
- Complete REST API
- Data sync endpoint
- HR dashboard endpoints
- User authentication ready

### Web Dashboard
- Real-time team monitoring
- Worker productivity stats
- Task completion tracking
- Active/idle status

## Data Flow
1. Employee uses mobile app
2. Data auto-syncs to API server
3. HR views real data on web dashboard

## Next Steps
- Add proper authentication
- Implement database storage
- Add more HR analytics
- Deploy to production