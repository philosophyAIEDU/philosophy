export interface GeminiConfig {
  model: string;
  systemInstruction?: string;
  generationConfig?: GenerationConfig;
}

export interface GenerationConfig {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
  responseMimeType?: string;
  responseModalities?: string;
}

export interface GeminiError {
  status?: number;
  message: string;
  details?: unknown;
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: MessagePart[];
}

export interface MessagePart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

export interface AudioConfig {
  sampleRate?: number;
  channelCount?: number;
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
}

export const GEMINI_MODELS = {
  TEXT: 'models/gemini-3-flash-preview',
  TTS: 'models/gemini-2.5-flash-preview-tts',
  AUDIO: 'models/gemini-2.5-flash-native-audio-preview-12-2025',
} as const;
