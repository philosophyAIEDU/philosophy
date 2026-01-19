import { GoogleGenerativeAI, GenerativeModel, ChatSession } from '@google/generative-ai';
import { GEMINI_MODELS, GeminiConfig } from '../types/api';

class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private apiKey: string = '';
  private audioCache: Map<string, string> = new Map(); // Cache for TTS audio URLs

  initialize(apiKey: string): void {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.apiKey = apiKey;
  }

  isInitialized(): boolean {
    return this.genAI !== null;
  }

  private getModel(config: GeminiConfig): GenerativeModel {
    if (!this.genAI) {
      throw new Error('Gemini API가 초기화되지 않았습니다. API Key를 먼저 설정해주세요.');
    }

    return this.genAI.getGenerativeModel({
      model: config.model,
      systemInstruction: config.systemInstruction,
      generationConfig: config.generationConfig,
    });
  }

  // Text generation
  async generateText(
    prompt: string,
    systemInstruction?: string,
    model: string = GEMINI_MODELS.TEXT
  ): Promise<string> {
    const generativeModel = this.getModel({
      model,
      systemInstruction,
    });

    const result = await generativeModel.generateContent(prompt);
    return result.response.text();
  }

  // Structured JSON output
  async generateJSON<T>(
    prompt: string,
    systemInstruction: string,
    model: string = GEMINI_MODELS.TEXT
  ): Promise<T> {
    const generativeModel = this.getModel({
      model,
      systemInstruction,
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const result = await generativeModel.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text) as T;
  }

  // TTS - Generate audio from text using Gemini TTS API
  async generateTTS(text: string, voice: string = 'Kore'): Promise<string> {
    if (!this.apiKey) {
      throw new Error('API Key가 설정되지 않았습니다.');
    }

    // Check cache first
    const cacheKey = `${text}-${voice}`;
    if (this.audioCache.has(cacheKey)) {
      return this.audioCache.get(cacheKey)!;
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `Say in a natural, clear voice: ${text}` }]
          }],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: voice
                }
              }
            }
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'TTS 생성 실패');
    }

    const data = await response.json();

    // Extract audio data from response
    const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    const mimeType = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType || 'audio/mp3';

    if (!audioData) {
      throw new Error('TTS 응답에서 오디오 데이터를 찾을 수 없습니다.');
    }

    // Convert base64 to blob URL
    const audioBlob = this.base64ToBlob(audioData, mimeType);
    const audioUrl = URL.createObjectURL(audioBlob);

    // Cache the result
    this.audioCache.set(cacheKey, audioUrl);

    return audioUrl;
  }

  private base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  // Play TTS audio
  async playTTS(text: string, voice: string = 'Kore'): Promise<HTMLAudioElement> {
    const audioUrl = await this.generateTTS(text, voice);
    const audio = new Audio(audioUrl);
    audio.play();
    return audio;
  }

  // Fallback TTS using Web Speech API
  speakText(text: string, rate: number = 1.0, lang: string = 'en-US'): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = rate;
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn('Web Speech API가 지원되지 않습니다.');
    }
  }

  stopSpeaking(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  // Clear TTS cache
  clearTTSCache(): void {
    this.audioCache.forEach(url => URL.revokeObjectURL(url));
    this.audioCache.clear();
  }

  // Start chat session for conversation
  startChat(systemInstruction: string, model: string = GEMINI_MODELS.TEXT): ChatSession {
    const generativeModel = this.getModel({
      model,
      systemInstruction,
    });

    return generativeModel.startChat();
  }

  // Start audio session for speaking practice
  async startAudioSession(
    systemInstruction: string,
    model: string = GEMINI_MODELS.AUDIO
  ): Promise<ChatSession> {
    const generativeModel = this.getModel({
      model,
      systemInstruction,
      generationConfig: {
        responseModalities: 'audio',
      } as any,
    });

    return generativeModel.startChat();
  }

  // Validate API key
  async validateApiKey(): Promise<boolean> {
    try {
      const model = this.getModel({ model: GEMINI_MODELS.TEXT });
      await model.generateContent('Hello');
      return true;
    } catch (error) {
      console.error('API Key 검증 실패:', error);
      return false;
    }
  }

  // Error handling helper
  handleError(error: unknown): string {
    if (error instanceof Error) {
      if (error.message.includes('API key not valid')) {
        return 'API Key가 유효하지 않습니다. 다시 확인해주세요.';
      }
      if (error.message.includes('quota')) {
        return 'API 할당량을 초과했습니다. 잠시 후 다시 시도해주세요.';
      }
      if (error.message.includes('429')) {
        return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
      }
      return error.message;
    }
    return '알 수 없는 오류가 발생했습니다.';
  }
}

export default new GeminiService();
