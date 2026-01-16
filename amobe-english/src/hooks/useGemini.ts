import { useState, useCallback } from 'react';
import geminiService from '../services/geminiService';
import { useApp } from '../contexts/AppContext';

interface UseGeminiResult {
  isLoading: boolean;
  error: string | null;
  generateText: (prompt: string, systemInstruction?: string) => Promise<string | null>;
  generateJSON: <T>(prompt: string, systemInstruction: string) => Promise<T | null>;
  speakText: (text: string, rate?: number) => void;
  stopSpeaking: () => void;
  clearError: () => void;
}

export function useGemini(): UseGeminiResult {
  const { state } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateText = useCallback(
    async (prompt: string, systemInstruction?: string): Promise<string | null> => {
      if (!state.isApiKeyValid) {
        setError('API Key가 설정되지 않았습니다.');
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await geminiService.generateText(prompt, systemInstruction);
        return result;
      } catch (err) {
        const errorMessage = geminiService.handleError(err);
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [state.isApiKeyValid]
  );

  const generateJSON = useCallback(
    async <T>(prompt: string, systemInstruction: string): Promise<T | null> => {
      if (!state.isApiKeyValid) {
        setError('API Key가 설정되지 않았습니다.');
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await geminiService.generateJSON<T>(prompt, systemInstruction);
        return result;
      } catch (err) {
        const errorMessage = geminiService.handleError(err);
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [state.isApiKeyValid]
  );

  const speakText = useCallback((text: string, rate: number = 1.0) => {
    geminiService.speakText(text, rate);
  }, []);

  const stopSpeaking = useCallback(() => {
    geminiService.stopSpeaking();
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    generateText,
    generateJSON,
    speakText,
    stopSpeaking,
    clearError,
  };
}
