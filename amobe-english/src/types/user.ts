import { UserLevel, LearningGoal, VocabularyItem, UserProgress, LearningSession } from './learning';

export interface UserProfile {
  level: UserLevel;
  goal: LearningGoal;
  name?: string;
  createdAt: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  darkMode: boolean;
  ttsSpeed: number; // 0.5 - 2.0
  autoPlayAudio: boolean;
  dailyGoalMinutes: number;
}

export interface StorageData {
  apiKey?: string;
  userProfile?: UserProfile;
  vocabulary?: VocabularyItem[];
  progress?: UserProgress;
  learningHistory?: LearningSession[];
  settings?: AppSettings;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'ko' | 'en';
  notifications: boolean;
}
