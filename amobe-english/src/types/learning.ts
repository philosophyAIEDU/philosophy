export type UserLevel = 'beginner' | 'intermediate' | 'advanced';
export type LearningGoal = 'daily' | 'business' | 'exam';
export type ModuleType = 'listening' | 'reading' | 'writing' | 'speaking' | 'vocabulary' | 'progress';

export interface ListeningContent {
  id: string;
  text: string;
  level: UserLevel;
  audioUrl?: string;
  duration?: number;
}

export interface ReadingContent {
  id: string;
  title: string;
  content: string;
  level: UserLevel;
  vocabulary: VocabularyItem[];
  questions: ReadingQuestion[];
}

export interface ReadingQuestion {
  id: string;
  question: string;
  type: 'multiple' | 'open';
  options?: string[];
  answer?: string;
}

export interface WritingPrompt {
  id: string;
  type: 'diary' | 'email' | 'essay';
  topic: string;
  guide: string;
  level: UserLevel;
}

export interface WritingFeedback {
  original: string;
  corrected: string;
  errors: WritingError[];
  overallScore: number;
}

export interface WritingError {
  type: 'grammar' | 'expression' | 'spelling';
  original: string;
  suggestion: string;
  explanation: string;
  position: { start: number; end: number };
}

export interface SpeakingScenario {
  id: string;
  name: string;
  description: string;
  level: UserLevel;
  systemPrompt: string;
}

export interface SpeakingSession {
  id: string;
  scenario: string;
  transcript: TranscriptEntry[];
  feedback?: SpeakingFeedback;
  startTime: Date;
  endTime?: Date;
}

export interface TranscriptEntry {
  role: 'user' | 'ai';
  text: string;
  timestamp: number;
  audioUrl?: string;
}

export interface SpeakingFeedback {
  pronunciation: number;
  fluency: number;
  grammar: number;
  vocabulary: number;
  suggestions: string[];
}

export interface VocabularyItem {
  id: string;
  word: string;
  meaning: string;
  example: string;
  pronunciation?: string;
  level: UserLevel;
  addedDate: string;
  nextReview: string;
  reviewCount: number;
  masteryLevel: number; // 0-5
}

export interface UserProgress {
  totalMinutes: number;
  streakDays: number;
  lastStudyDate: string;
  moduleStats: {
    listening: ModuleStats;
    reading: ModuleStats;
    writing: ModuleStats;
    speaking: ModuleStats;
  };
  currentLevel: UserLevel;
  levelProgress: number; // 0-100
  weeklyData: WeeklyData[];
}

export interface ModuleStats {
  count: number;
  minutes: number;
  lastAccessed?: string;
}

export interface WeeklyData {
  day: string;
  minutes: number;
}

export interface LearningSession {
  id: string;
  module: ModuleType;
  startTime: Date;
  endTime?: Date;
  completed: boolean;
  score?: number;
}

export interface DailyPlan {
  listening: string;
  reading: string;
  writing: string;
  speaking: string;
}
