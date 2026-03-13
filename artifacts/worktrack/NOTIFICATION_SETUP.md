# WorkTrack Notification Setup

## Installation

1. **Install Dependencies**
```bash
cd artifacts/worktrack
npm install
# or
yarn install
```

2. **Install Expo Notifications**
The `expo-notifications` package is already added to package.json. If you need to install it manually:
```bash
npx expo install expo-notifications
```

## Configuration

### 1. App Configuration (app.json)
The app.json is already configured with:
- Notification plugin
- iOS background modes
- Android permissions

### 2. Notification Permissions

#### iOS
- Permissions are requested automatically during onboarding
- Users can grant/deny in the permission dialog
- If denied, users can enable in Settings > WorkTrack > Notifications

#### Android
- Permissions are requested automatically during onboarding
- Users can grant/deny in the permission dialog
- If denied, users can enable in Settings > Apps > WorkTrack > Notifications

## Features

### 1. Task Notifications
- **Task Reminder**: Sent X minutes before task due date
- **Task Due**: Sent when task is due
- Configurable reminder time in settings (5-60 minutes)

### 2. Idle Alerts
- Sent when user is away from app for configured time
- Configurable idle time in settings (10-60 minutes)
- Only sent if timer is running

### 3. Voice Agent Alerts
- Sent when user leaves app with running timer
- Configurable delay in settings (1-15 minutes)
- Helps prevent procrastination

## Usage

### 1. During Onboarding
- User is asked to enable notifications
- Permission request happens automatically
- If granted, notifications work immediately

### 2. In Settings
- Toggle notifications on/off
- Configure reminder times
- Re-request permissions if denied

### 3. Automatic Triggers
- Task creation with due date → schedules notifications
- Timer running + app backgrounded → voice agent alert
- Extended idle time → idle alert

## Testing

### 1. Test Component
Use the `NotificationTest` component in development:
```tsx
import NotificationTest from './components/NotificationTest';

// Add to any screen for testing
<NotificationTest />
```

### 2. Manual Testing
1. Create a task with due date in 1 minute
2. Set reminder to 0 minutes
3. Wait for notification
4. Check notification appears and tapping opens app

### 3. Background Testing
1. Start a timer
2. Background the app
3. Wait for voice agent delay time
4. Check notification appears

## Troubleshooting

### 1. Notifications Not Appearing
- Check device notification settings
- Ensure app has notification permissions
- Check Do Not Disturb is off
- Verify notification channel settings (Android)

### 2. Permission Denied
- Go to device Settings > Apps > WorkTrack > Notifications
- Enable notifications manually
- Restart app and try again

### 3. iOS Simulator
- Push notifications don't work in iOS Simulator
- Test on physical device only
- Use Expo Go app for testing

### 4. Android Emulator
- Ensure Google Play Services are installed
- Use emulator with Play Store support
- Test on physical device for best results

## Production Considerations

### 1. Push Notification Service
- Current setup uses Expo's push notification service
- For production, consider:
  - Firebase Cloud Messaging (FCM)
  - Apple Push Notification Service (APNs)
  - Custom push notification server

### 2. Notification Scheduling
- Local notifications work offline
- For server-triggered notifications, implement push service
- Consider timezone handling for scheduled notifications

### 3. Analytics
- Track notification delivery rates
- Monitor user engagement with notifications
- A/B test notification content and timing

## Code Structure

```
services/
  NotificationService.ts     # Main notification service
context/
  AppContext.tsx            # Notification state management
app/
  onboarding.tsx           # Permission request
  (tabs)/settings.tsx      # Notification settings
components/
  NotificationTest.tsx     # Testing component
```

## API Integration

Notifications are automatically triggered by:
- Task creation (schedules reminders)
- Timer events (idle alerts, voice agent)
- App state changes (background/foreground)

All notification preferences sync to API server for HR dashboard visibility.