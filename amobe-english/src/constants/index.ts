// Application Constants

// Storage Keys
export const STORAGE_KEYS = {
  APP_DATA: 'amobe-english',
  WRITING_PREFIX: 'amobe_writing_',
  THEME: 'amobe-theme',
} as const;

// API Models
export const GEMINI_MODELS = {
  TEXT: 'models/gemini-3-flash-preview',
  TTS: 'models/gemini-2.5-flash-preview-tts',
  AUDIO: 'models/gemini-2.5-flash-native-audio-preview-12-2025',
} as const;

// Animation Durations (in ms)
export const ANIMATION = {
  FAST: 150,
  DEFAULT: 300,
  SLOW: 500,
  VERY_SLOW: 1000,
} as const;

// Playback Speeds
export const PLAYBACK_SPEEDS = [0.75, 1, 1.25] as const;
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];

// User Levels
export const USER_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export type UserLevel = (typeof USER_LEVELS)[number];

// Module Types
export const MODULE_TYPES = [
  'listening',
  'reading',
  'writing',
  'speaking',
  'vocabulary',
  'progress',
] as const;
export type ModuleType = (typeof MODULE_TYPES)[number];

// Learning Goals
export const LEARNING_GOALS = ['daily', 'business', 'exam'] as const;
export type LearningGoal = (typeof LEARNING_GOALS)[number];

// Writing Types
export const WRITING_TYPES = ['diary', 'email', 'essay'] as const;
export type WritingType = (typeof WRITING_TYPES)[number];

// Default Values
export const DEFAULTS = {
  DAILY_GOAL_MINUTES: 30,
  TTS_SPEED: 1.0,
  AUTO_SAVE_DELAY: 1000,
  MIN_WORD_COUNT: 5,
  ACCURACY_THRESHOLD: 90,
} as const;

// Colors (matching Tailwind config)
export const COLORS = {
  primary: {
    dark: '#111827',
    card: '#1F2937',
  },
  accent: {
    blue: '#3B82F6',
    green: '#10B981',
    yellow: '#FACC15',
    red: '#EF4444',
    purple: '#8B5CF6',
    pink: '#EC4899',
  },
} as const;

// Module Colors Mapping
export const MODULE_COLORS: Record<string, keyof typeof COLORS.accent> = {
  listening: 'blue',
  reading: 'green',
  writing: 'yellow',
  speaking: 'red',
  vocabulary: 'purple',
  progress: 'pink',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  API_KEY_INVALID: 'API Key is not valid. Please check and try again.',
  API_QUOTA_EXCEEDED: 'API quota exceeded. Please try again later.',
  RATE_LIMIT: 'Too many requests. Please wait a moment.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNKNOWN_ERROR: 'An unexpected error occurred.',
  TTS_NOT_SUPPORTED: 'Text-to-speech is not supported in this browser.',
  MICROPHONE_NOT_ALLOWED: 'Microphone access was denied.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  API_KEY_SAVED: 'API Key saved successfully!',
  PROGRESS_SAVED: 'Progress saved!',
  VOCABULARY_ADDED: 'Word added to vocabulary!',
} as const;

// Navigation Items
export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', path: '/', icon: 'Home' },
  { id: 'listening', label: 'Listening', path: '/listening', icon: 'Headphones' },
  { id: 'reading', label: 'Reading', path: '/reading', icon: 'Book' },
  { id: 'writing', label: 'Writing', path: '/writing', icon: 'PenTool' },
  { id: 'speaking', label: 'Speaking', path: '/speaking', icon: 'Mic' },
  { id: 'vocabulary', label: 'Vocabulary', path: '/vocabulary', icon: 'BookOpen' },
  { id: 'progress', label: 'Progress', path: '/progress', icon: 'BarChart2' },
] as const;

// Level-based Content Prompts
export const LEVEL_CONTENT_PROMPTS: Record<UserLevel, string> = {
  beginner: `Generate a simple English sentence (5-8 words) for a beginner learner.
Topics: daily greetings, basic introductions, simple questions.
Example level: "Hello, how are you today?" or "My name is John."
Return only the sentence, nothing else.`,
  intermediate: `Generate an intermediate English sentence (10-15 words) for practice.
Topics: travel, work, hobbies, current events.
Example level: "I usually take the bus to work, but today I decided to walk."
Return only the sentence, nothing else.`,
  advanced: `Generate an advanced English sentence (15-25 words) with complex grammar.
Topics: business, technology, science, philosophy.
Example level: "Despite the challenging economic conditions, the company managed to exceed its quarterly targets."
Return only the sentence, nothing else.`,
};
