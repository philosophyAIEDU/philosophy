// TED 영상 관련 타입 정의

export interface TedVideo {
  id: string;
  title: string;
  speaker: string;
  description: string;
  duration: number; // seconds
  thumbnailUrl: string;
  videoUrl: string; // YouTube embed URL
  youtubeId: string;
  tags: string[];
  level: 'beginner' | 'intermediate' | 'advanced';
  views?: number;
  publishedAt: string;
}

export interface Subtitle {
  id: string;
  startTime: number; // seconds
  endTime: number;
  text: string;
  translation?: string; // Korean translation
}

export interface TedTranscript {
  videoId: string;
  language: string;
  subtitles: Subtitle[];
  fullText: string;
}

export interface TedVocabulary {
  word: string;
  pronunciation: string;
  meaning: string;
  meaningKo: string;
  partOfSpeech: string;
  exampleFromVideo: string;
  timestamp: number; // where it appears in video
  level: 'beginner' | 'intermediate' | 'advanced';
}

export interface TedQuiz {
  id: string;
  videoId: string;
  type: 'listening' | 'reading' | 'vocabulary' | 'comprehension';
  question: string;
  questionKo?: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  explanationKo?: string;
  relatedTimestamp?: number;
}

export interface TedLearningSession {
  id: string;
  videoId: string;
  startedAt: Date;
  completedAt?: Date;
  progress: number; // 0-100
  listeningScore?: number;
  readingScore?: number;
  vocabularyLearned: string[];
  notes: string[];
}

export interface TedStudyMode {
  mode: 'watch' | 'dictation' | 'shadowing' | 'quiz' | 'vocabulary';
  videoId: string;
  currentTime: number;
  isPlaying: boolean;
  playbackSpeed: number;
  showSubtitles: boolean;
  showTranslation: boolean;
}
