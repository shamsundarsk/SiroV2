import { AppState, AppStateStatus } from 'react-native';
import * as Application from 'expo-application';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppUsageSession {
  appName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

interface ScreenTimeData {
  date: string;
  totalScreenTime: number;
  appSessions: AppUsageSession[];
  unlockCount: number;
  firstUnlock?: number;
  lastActivity?: number;
}

class ScreenTimeService {
  private currentSession: AppUsageSession | null = null;
  private appStateListener: any = null;
  private dailyData: ScreenTimeData | null = null;
  private isTracking = false;

  async initialize(): Promise<boolean> {
    try {
      await this.loadTodayData();
      this.startTracking();
      return true;
    } catch (error) {
      console.error('Failed to initialize screen time tracking:', error);
      return false;
    }
  }

  private async loadTodayData(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const storageKey = `screentime_${today}`;
    
    try {
      const stored = await AsyncStorage.getItem(storageKey);
      if (stored) {
        this.dailyData = JSON.parse(stored);
      } else {
        this.dailyData = {
          date: today,
          totalScreenTime: 0,
          appSessions: [],
          unlockCount: 0,
          firstUnlock: Date.now(),
          lastActivity: Date.now()
        };
      }
    } catch (error) {
      console.error('Failed to load screen time data:', error);
      this.dailyData = {
        date: today,
        totalScreenTime: 0,
        appSessions: [],
        unlockCount: 0,
        firstUnlock: Date.now(),
        lastActivity: Date.now()
      };
    }
  }

  private async saveTodayData(): Promise<void> {
    if (!this.dailyData) return;
    
    const storageKey = `screentime_${this.dailyData.date}`;
    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(this.dailyData));
    } catch (error) {
      console.error('Failed to save screen time data:', error);
    }
  }

  private startTracking(): void {
    if (this.isTracking) return;
    
    this.isTracking = true;
    
    // Start session when app becomes active
    this.startSession();
    
    // Listen for app state changes
    this.appStateListener = AppState.addEventListener('change', this.handleAppStateChange.bind(this));
  }

  private handleAppStateChange(nextAppState: AppStateStatus): void {
    if (nextAppState === 'active') {
      // App came to foreground
      this.startSession();
      this.incrementUnlockCount();
    } else if (nextAppState === 'background' || nextAppState === 'inactive') {
      // App went to background
      this.endSession();
    }
  }

  private async startSession(): Promise<void> {
    if (this.currentSession) {
      // End previous session first
      this.endSession();
    }

    const appName = await this.getCurrentAppName();
    this.currentSession = {
      appName,
      startTime: Date.now()
    };

    console.log(`📱 Started session: ${appName}`);
  }

  private endSession(): void {
    if (!this.currentSession || !this.dailyData) return;

    const endTime = Date.now();
    const duration = endTime - this.currentSession.startTime;
    
    // Only count sessions longer than 1 second
    if (duration > 1000) {
      const completedSession: AppUsageSession = {
        ...this.currentSession,
        endTime,
        duration
      };

      this.dailyData.appSessions.push(completedSession);
      this.dailyData.totalScreenTime += duration;
      this.dailyData.lastActivity = endTime;

      console.log(`📱 Ended session: ${completedSession.appName} (${Math.round(duration/1000)}s)`);
      
      this.saveTodayData();
    }

    this.currentSession = null;
  }

  private async getCurrentAppName(): Promise<string> {
    try {
      const appName = await Application.getApplicationNameAsync();
      return appName || 'WorkTrack';
    } catch (error) {
      return 'WorkTrack';
    }
  }

  private incrementUnlockCount(): void {
    if (!this.dailyData) return;
    
    this.dailyData.unlockCount++;
    this.saveTodayData();
  }

  async getTodayScreenTime(): Promise<ScreenTimeData | null> {
    // Make sure we have current session data
    if (this.currentSession && this.dailyData) {
      const currentDuration = Date.now() - this.currentSession.startTime;
      return {
        ...this.dailyData,
        totalScreenTime: this.dailyData.totalScreenTime + currentDuration
      };
    }
    
    return this.dailyData;
  }

  async getAppUsageBreakdown(): Promise<{ appName: string; totalTime: number; sessions: number }[]> {
    if (!this.dailyData) return [];

    const breakdown = new Map<string, { totalTime: number; sessions: number }>();
    
    // Add completed sessions
    this.dailyData.appSessions.forEach(session => {
      if (session.duration) {
        const existing = breakdown.get(session.appName) || { totalTime: 0, sessions: 0 };
        breakdown.set(session.appName, {
          totalTime: existing.totalTime + session.duration,
          sessions: existing.sessions + 1
        });
      }
    });

    // Add current session if active
    if (this.currentSession) {
      const currentDuration = Date.now() - this.currentSession.startTime;
      const existing = breakdown.get(this.currentSession.appName) || { totalTime: 0, sessions: 0 };
      breakdown.set(this.currentSession.appName, {
        totalTime: existing.totalTime + currentDuration,
        sessions: existing.sessions + 1
      });
    }

    return Array.from(breakdown.entries()).map(([appName, data]) => ({
      appName,
      ...data
    })).sort((a, b) => b.totalTime - a.totalTime);
  }

  async getWeeklyScreenTime(): Promise<ScreenTimeData[]> {
    const weekData: ScreenTimeData[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      try {
        const stored = await AsyncStorage.getItem(`screentime_${dateStr}`);
        if (stored) {
          weekData.push(JSON.parse(stored));
        } else {
          weekData.push({
            date: dateStr,
            totalScreenTime: 0,
            appSessions: [],
            unlockCount: 0
          });
        }
      } catch (error) {
        weekData.push({
          date: dateStr,
          totalScreenTime: 0,
          appSessions: [],
          unlockCount: 0
        });
      }
    }
    
    return weekData;
  }

  stop(): void {
    if (this.appStateListener) {
      this.appStateListener.remove();
      this.appStateListener = null;
    }
    
    this.endSession();
    this.isTracking = false;
  }

  // Simulate other apps for demo purposes (since we can't actually track other apps)
  async generateRealisticAppUsage(): Promise<{ appName: string; totalTime: number; category: string; icon: string }[]> {
    const baseApps = [
      { appName: 'Instagram', category: 'social', icon: 'instagram' },
      { appName: 'WhatsApp', category: 'social', icon: 'message-circle' },
      { appName: 'YouTube', category: 'entertainment', icon: 'youtube' },
      { appName: 'Safari', category: 'productivity', icon: 'globe' },
      { appName: 'Messages', category: 'social', icon: 'mail' },
      { appName: 'Spotify', category: 'entertainment', icon: 'music' },
    ];

    // Get actual WorkTrack usage
    const worktrackUsage = await this.getTodayScreenTime();
    const worktrackTime = worktrackUsage?.totalScreenTime || 0;

    // Generate realistic usage for other apps based on WorkTrack usage
    const otherApps = baseApps.map(app => {
      // Generate usage between 10% and 150% of WorkTrack time
      const factor = 0.1 + Math.random() * 1.4;
      const totalTime = Math.floor(worktrackTime * factor);
      
      return {
        ...app,
        totalTime: Math.max(totalTime, 60000) // At least 1 minute
      };
    });

    // Add WorkTrack to the list
    const allApps = [
      {
        appName: 'WorkTrack',
        totalTime: worktrackTime,
        category: 'productivity',
        icon: 'clock'
      },
      ...otherApps
    ];

    return allApps.sort((a, b) => b.totalTime - a.totalTime);
  }
}

export default new ScreenTimeService();