import { useState, useCallback } from 'react';
import audioService from '../services/audioService';

interface UseAudioRecordingResult {
  isRecording: boolean;
  hasPermission: boolean;
  error: string | null;
  requestPermission: () => Promise<boolean>;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  playAudio: (blob: Blob) => HTMLAudioElement;
  stopAllAudio: () => void;
}

export function useAudioRecording(): UseAudioRecordingResult {
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    setError(null);
    try {
      const granted = await audioService.requestMicrophonePermission();
      setHasPermission(granted);
      if (!granted) {
        setError('마이크 권한이 거부되었습니다. 설정에서 권한을 허용해주세요.');
      }
      return granted;
    } catch (err) {
      setError('마이크 권한 요청 중 오류가 발생했습니다.');
      return false;
    }
  }, []);

  const startRecording = useCallback(async (): Promise<void> => {
    setError(null);
    try {
      await audioService.startRecording();
      setIsRecording(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '녹음을 시작할 수 없습니다.');
      setIsRecording(false);
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    try {
      const blob = await audioService.stopRecording();
      setIsRecording(false);
      return blob;
    } catch (err) {
      setError(err instanceof Error ? err.message : '녹음을 중지할 수 없습니다.');
      setIsRecording(false);
      return null;
    }
  }, []);

  const playAudio = useCallback((blob: Blob): HTMLAudioElement => {
    return audioService.playAudio(blob);
  }, []);

  const stopAllAudio = useCallback(() => {
    audioService.stopAllAudio();
  }, []);

  return {
    isRecording,
    hasPermission,
    error,
    requestPermission,
    startRecording,
    stopRecording,
    playAudio,
    stopAllAudio,
  };
}
