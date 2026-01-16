import { GoogleGenerativeAI, GenerativeModel, ChatSession } from '@google/generative-ai';
import { GEMINI_MODELS, GeminiConfig } from '../types/api';

class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;

  initialize(apiKey: string): void {
    this.genAI = new GoogleGenerativeAI(apiKey);
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

  // TTS - Generate audio from text
  async generateTTS(text: string): Promise<Blob> {
    const generativeModel = this.getModel({
      model: GEMINI_MODELS.TTS,
    });

    const result = await generativeModel.generateContent({
      contents: [{ role: 'user', parts: [{ text }] }],
    });

    // Get audio data from response
    const response = result.response;
    const audioData = (response as any).audio;

    if (audioData) {
      return new Blob([audioData], { type: 'audio/mp3' });
    }

    throw new Error('TTS 응답에서 오디오 데이터를 찾을 수 없습니다.');
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
