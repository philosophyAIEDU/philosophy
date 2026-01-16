import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Square, MessageCircle, Volume2, CheckCircle, AlertCircle } from 'lucide-react';
import { ChatSession } from '@google/generative-ai';
import { useApp } from '../../contexts/AppContext';
import { useGemini } from '../../hooks/useGemini';
import { useAudioRecording } from '../../hooks/useAudioRecording';
import geminiService from '../../services/geminiService';
import Button from '../common/Button';
import Card from '../common/Card';
import LoadingSpinner from '../common/LoadingSpinner';
import { UserLevel, TranscriptEntry, SpeakingFeedback } from '../../types/learning';

type ConversationPhase = 'setup' | 'permission' | 'conversation' | 'feedback';

interface Scenario {
  id: string;
  name: string;
  nameKo: string;
  description: string;
  systemPrompt: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'cafe',
    name: 'Cafe Order',
    nameKo: '카페 주문',
    description: '카페에서 음료를 주문하는 상황입니다.',
    systemPrompt: `You are a friendly barista at a coffee shop. Engage in natural conversation with the customer who is ordering drinks.
    Start by greeting them warmly and asking what they would like to order.
    Be patient, helpful, and make suggestions when appropriate.
    Keep responses concise and natural (1-3 sentences).
    Respond in English only.`,
  },
  {
    id: 'airport',
    name: 'Airport',
    nameKo: '공항',
    description: '공항에서 체크인하고 게이트를 찾는 상황입니다.',
    systemPrompt: `You are an airline check-in agent at an international airport. Help passengers check in for their flights.
    Start by asking for their booking reference or passport.
    Guide them through the check-in process, ask about luggage, and provide gate information.
    Keep responses concise and professional (1-3 sentences).
    Respond in English only.`,
  },
  {
    id: 'restaurant',
    name: 'Restaurant',
    nameKo: '레스토랑',
    description: '레스토랑에서 음식을 주문하는 상황입니다.',
    systemPrompt: `You are a server at an upscale restaurant. Welcome guests and help them with their orders.
    Start by greeting them and asking if they have a reservation or are ready to be seated.
    Explain specials, take orders, and be attentive to their needs.
    Keep responses concise and courteous (1-3 sentences).
    Respond in English only.`,
  },
  {
    id: 'business',
    name: 'Business Meeting',
    nameKo: '비즈니스 미팅',
    description: '비즈니스 미팅에서 자기소개와 회의 진행 상황입니다.',
    systemPrompt: `You are a business professional in a meeting. Engage in professional business conversation.
    Start by introducing yourself and your role, then ask about the meeting agenda.
    Discuss business topics professionally, ask clarifying questions, and provide thoughtful responses.
    Keep responses concise and professional (1-3 sentences).
    Respond in English only.`,
  },
];

const DIFFICULTY_LEVELS: { value: UserLevel; label: string; description: string }[] = [
  { value: 'beginner', label: '초급', description: '간단한 문장과 천천히 대화' },
  { value: 'intermediate', label: '중급', description: '자연스러운 속도와 다양한 표현' },
  { value: 'advanced', label: '고급', description: '빠른 속도와 복잡한 표현' },
];

const SpeakingModule: React.FC = () => {
  const { state, updateProgress } = useApp();
  const { isLoading, error: geminiError, generateJSON, speakText, stopSpeaking, clearError } = useGemini();
  const {
    isRecording,
    hasPermission,
    error: audioError,
    requestPermission,
    startRecording,
    stopRecording,
  } = useAudioRecording();

  const [phase, setPhase] = useState<ConversationPhase>('setup');
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [difficulty, setDifficulty] = useState<UserLevel>('beginner');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [feedback, setFeedback] = useState<SpeakingFeedback | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [_isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState<number | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');

  const chatSessionRef = useRef<ChatSession | null>(null);
  const conversationStartTimeRef = useRef<Date | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcript]);

  const handleRequestPermission = async () => {
    setPermissionStatus('requesting');
    const granted = await requestPermission();
    setPermissionStatus(granted ? 'granted' : 'denied');
    if (granted) {
      setTimeout(() => setPhase('conversation'), 500);
    }
  };

  const startConversation = async () => {
    if (!selectedScenario) return;

    clearError();
    setPhase('permission');

    if (hasPermission) {
      setPermissionStatus('granted');
      setTimeout(() => startChatSession(), 500);
    }
  };

  const startChatSession = async () => {
    if (!selectedScenario) return;

    setPhase('conversation');
    conversationStartTimeRef.current = new Date();

    const levelPrompt = difficulty === 'beginner'
      ? 'Use simple vocabulary and speak slowly. Keep sentences short.'
      : difficulty === 'intermediate'
      ? 'Use moderate vocabulary and natural pace.'
      : 'Use advanced vocabulary and natural conversational pace with idioms.';

    const systemInstruction = `${selectedScenario.systemPrompt}\n\nDifficulty level: ${difficulty}. ${levelPrompt}`;

    try {
      chatSessionRef.current = geminiService.startChat(systemInstruction);

      // Get initial AI greeting
      const response = await chatSessionRef.current.sendMessage('Start the conversation with a greeting.');
      const aiText = response.response.text();

      setTranscript([{
        role: 'ai',
        text: aiText,
        timestamp: Date.now(),
      }]);

      // Auto-play AI greeting
      speakText(aiText, difficulty === 'beginner' ? 0.8 : difficulty === 'intermediate' ? 1.0 : 1.1);
    } catch (err) {
      console.error('Failed to start chat session:', err);
    }
  };

  const handleStartRecording = async () => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) return;
    }
    await startRecording();
  };

  const handleStopRecording = async () => {
    const audioBlob = await stopRecording();
    if (!audioBlob || !chatSessionRef.current) return;

    setIsProcessing(true);

    try {
      // Convert audio blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
      });
      reader.readAsDataURL(audioBlob);
      const base64Audio = await base64Promise;

      // Send audio to Gemini for transcription and response
      const response = await chatSessionRef.current.sendMessage([
        {
          inlineData: {
            mimeType: 'audio/webm',
            data: base64Audio,
          },
        },
        { text: 'Please respond to what the user said. First, transcribe what they said in square brackets [like this], then provide your natural response.' },
      ]);

      const fullResponse = response.response.text();

      // Parse transcription and AI response
      const transcriptionMatch = fullResponse.match(/\[(.*?)\]/);
      const userText = transcriptionMatch ? transcriptionMatch[1] : 'Unable to transcribe';
      const aiText = fullResponse.replace(/\[.*?\]/, '').trim();

      // Add user message
      setTranscript(prev => [...prev, {
        role: 'user',
        text: userText,
        timestamp: Date.now(),
      }]);

      // Add AI response
      setTimeout(() => {
        setTranscript(prev => [...prev, {
          role: 'ai',
          text: aiText,
          timestamp: Date.now(),
        }]);

        // Auto-play AI response
        speakText(aiText, difficulty === 'beginner' ? 0.8 : difficulty === 'intermediate' ? 1.0 : 1.1);
      }, 300);

    } catch (err) {
      console.error('Error processing recording:', err);
      setTranscript(prev => [...prev, {
        role: 'user',
        text: '(녹음 처리 중 오류 발생)',
        timestamp: Date.now(),
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const playAiMessage = (text: string, index: number) => {
    stopSpeaking();
    setIsPlayingAudio(true);
    setCurrentPlayingIndex(index);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = difficulty === 'beginner' ? 0.8 : difficulty === 'intermediate' ? 1.0 : 1.1;
    utterance.onend = () => {
      setIsPlayingAudio(false);
      setCurrentPlayingIndex(null);
    };
    window.speechSynthesis.speak(utterance);
  };

  const endConversation = async () => {
    stopSpeaking();
    setIsProcessing(true);

    if (conversationStartTimeRef.current) {
      const endTime = new Date();
      const durationMinutes = Math.round(
        (endTime.getTime() - conversationStartTimeRef.current.getTime()) / 60000
      );

      // Update progress
      updateProgress({
        totalMinutes: state.progress.totalMinutes + durationMinutes,
        moduleStats: {
          ...state.progress.moduleStats,
          speaking: {
            count: state.progress.moduleStats.speaking.count + 1,
            minutes: state.progress.moduleStats.speaking.minutes + durationMinutes,
            lastAccessed: endTime.toISOString(),
          },
        },
      });
    }

    // Generate feedback
    try {
      const conversationText = transcript
        .map(entry => `${entry.role === 'user' ? 'User' : 'AI'}: ${entry.text}`)
        .join('\n');

      const feedbackResult = await generateJSON<SpeakingFeedback>(
        `Analyze this English conversation and provide feedback:

${conversationText}

Difficulty level: ${difficulty}

Provide scores from 0-100 for:
- pronunciation: How well would the user be understood by native speakers
- fluency: How smooth and natural was the conversation flow
- grammar: How grammatically correct were the user's sentences
- vocabulary: How appropriate and varied was the vocabulary used

Also provide 3-5 specific suggestions for improvement in Korean.`,
        `You are an English language assessment expert. Analyze conversations and provide detailed, constructive feedback.
Return a JSON object with this exact structure:
{
  "pronunciation": number,
  "fluency": number,
  "grammar": number,
  "vocabulary": number,
  "suggestions": ["suggestion1 in Korean", "suggestion2 in Korean", ...]
}`
      );

      if (feedbackResult) {
        setFeedback(feedbackResult);
      }
    } catch (err) {
      console.error('Error generating feedback:', err);
      // Set default feedback on error
      setFeedback({
        pronunciation: 70,
        fluency: 70,
        grammar: 70,
        vocabulary: 70,
        suggestions: ['더 많은 연습을 통해 자신감을 키워보세요.'],
      });
    }

    setPhase('feedback');
    setIsProcessing(false);
    chatSessionRef.current = null;
  };

  const resetModule = () => {
    setPhase('setup');
    setSelectedScenario(null);
    setDifficulty('beginner');
    setTranscript([]);
    setFeedback(null);
    setPermissionStatus('idle');
    chatSessionRef.current = null;
    conversationStartTimeRef.current = null;
    clearError();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return '훌륭함';
    if (score >= 80) return '좋음';
    if (score >= 70) return '보통';
    if (score >= 60) return '노력 필요';
    return '더 연습 필요';
  };

  // Setup Phase
  if (phase === 'setup') {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">회화 연습</h1>
          <p className="text-gray-600">실전 상황에서 영어로 대화해보세요</p>
        </div>

        {/* Scenario Selection */}
        <Card>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-600" />
              시나리오 선택
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SCENARIOS.map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={() => setSelectedScenario(scenario)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    selectedScenario?.id === scenario.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <h3 className="font-semibold text-gray-900">{scenario.nameKo}</h3>
                  <p className="text-sm text-gray-500 mt-1">{scenario.description}</p>
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Difficulty Selection */}
        <Card>
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">난이도 선택</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              {DIFFICULTY_LEVELS.map((level) => (
                <button
                  key={level.value}
                  onClick={() => setDifficulty(level.value)}
                  className={`flex-1 p-4 rounded-lg border-2 text-left transition-all ${
                    difficulty === level.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <h3 className="font-semibold text-gray-900">{level.label}</h3>
                  <p className="text-sm text-gray-500 mt-1">{level.description}</p>
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Start Button */}
        <div className="text-center">
          <Button
            size="lg"
            onClick={startConversation}
            disabled={!selectedScenario || isLoading}
            className="px-12"
          >
            대화 시작
          </Button>
        </div>
      </div>
    );
  }

  // Permission Phase
  if (phase === 'permission') {
    return (
      <div className="max-w-md mx-auto p-6">
        <Card className="text-center">
          <div className="py-8">
            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 ${
              permissionStatus === 'granted'
                ? 'bg-green-100'
                : permissionStatus === 'denied'
                ? 'bg-red-100'
                : 'bg-blue-100'
            }`}>
              {permissionStatus === 'granted' ? (
                <CheckCircle className="h-10 w-10 text-green-600" />
              ) : permissionStatus === 'denied' ? (
                <AlertCircle className="h-10 w-10 text-red-600" />
              ) : permissionStatus === 'requesting' ? (
                <LoadingSpinner size="lg" />
              ) : (
                <Mic className="h-10 w-10 text-blue-600" />
              )}
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {permissionStatus === 'granted'
                ? '마이크 권한 허용됨'
                : permissionStatus === 'denied'
                ? '마이크 권한 거부됨'
                : '마이크 권한 필요'}
            </h2>

            <p className="text-gray-600 mb-6">
              {permissionStatus === 'granted'
                ? '대화를 시작합니다...'
                : permissionStatus === 'denied'
                ? '브라우저 설정에서 마이크 권한을 허용해주세요.'
                : '회화 연습을 위해 마이크 접근 권한이 필요합니다.'}
            </p>

            {permissionStatus !== 'granted' && permissionStatus !== 'requesting' && (
              <div className="space-y-3">
                <Button
                  onClick={handleRequestPermission}
                  className="w-full"
                >
                  {permissionStatus === 'denied' ? '다시 시도' : '권한 허용하기'}
                </Button>
                <Button
                  variant="outline"
                  onClick={resetModule}
                  className="w-full"
                >
                  취소
                </Button>
              </div>
            )}

            {audioError && (
              <p className="mt-4 text-sm text-red-600">{audioError}</p>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // Conversation Phase
  if (phase === 'conversation') {
    return (
      <div className="max-w-2xl mx-auto p-6 flex flex-col h-[calc(100vh-120px)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {selectedScenario?.nameKo}
            </h2>
            <p className="text-sm text-gray-500">
              {DIFFICULTY_LEVELS.find(d => d.value === difficulty)?.label}
            </p>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={endConversation}
            disabled={isProcessing}
          >
            <Square className="h-4 w-4 mr-2" />
            대화 종료
          </Button>
        </div>

        {/* Messages */}
        <Card className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {transcript.map((entry, index) => (
              <div
                key={index}
                className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    entry.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                  }`}
                >
                  <p className="text-sm">{entry.text}</p>
                  {entry.role === 'ai' && (
                    <button
                      onClick={() => playAiMessage(entry.text, index)}
                      className={`mt-2 flex items-center gap-1 text-xs ${
                        currentPlayingIndex === index
                          ? 'text-blue-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Volume2 className={`h-3 w-3 ${currentPlayingIndex === index ? 'animate-pulse' : ''}`} />
                      {currentPlayingIndex === index ? '재생 중...' : '다시 듣기'}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </Card>

        {/* Recording Controls */}
        <div className="mt-4 flex flex-col items-center gap-4">
          {isRecording && (
            <div className="flex items-center gap-2 text-red-600">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="text-sm font-medium">녹음 중...</span>
            </div>
          )}

          <button
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            disabled={isProcessing}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
              isRecording
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : isProcessing
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isRecording ? (
              <MicOff className="h-8 w-8" />
            ) : (
              <Mic className="h-8 w-8" />
            )}
          </button>

          <p className="text-sm text-gray-500">
            {isRecording ? '버튼을 눌러 녹음 중지' : '버튼을 눌러 말하기'}
          </p>
        </div>

        {(geminiError || audioError) && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm text-center">
            {geminiError || audioError}
          </div>
        )}
      </div>
    );
  }

  // Feedback Phase
  if (phase === 'feedback') {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">대화 완료!</h1>
          <p className="text-gray-600">회화 연습 결과를 확인해보세요</p>
        </div>

        {isProcessing ? (
          <Card className="text-center py-12">
            <LoadingSpinner size="lg" text="피드백 생성 중..." />
          </Card>
        ) : feedback ? (
          <>
            {/* Scores */}
            <Card>
              <h2 className="text-xl font-semibold text-gray-800 mb-6">평가 점수</h2>
              <div className="grid grid-cols-2 gap-6">
                {[
                  { label: '발음', key: 'pronunciation' as const, icon: '🎯' },
                  { label: '유창성', key: 'fluency' as const, icon: '💬' },
                  { label: '문법', key: 'grammar' as const, icon: '📝' },
                  { label: '어휘', key: 'vocabulary' as const, icon: '📚' },
                ].map((item) => (
                  <div key={item.key} className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl mb-2">{item.icon}</div>
                    <div className={`text-3xl font-bold ${getScoreColor(feedback[item.key])}`}>
                      {feedback[item.key]}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">{item.label}</div>
                    <div className={`text-xs ${getScoreColor(feedback[item.key])}`}>
                      {getScoreLabel(feedback[item.key])}
                    </div>
                  </div>
                ))}
              </div>

              {/* Overall Score */}
              <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                <p className="text-sm text-gray-500 mb-2">종합 점수</p>
                <div className={`text-5xl font-bold ${getScoreColor(
                  Math.round((feedback.pronunciation + feedback.fluency + feedback.grammar + feedback.vocabulary) / 4)
                )}`}>
                  {Math.round((feedback.pronunciation + feedback.fluency + feedback.grammar + feedback.vocabulary) / 4)}
                </div>
              </div>
            </Card>

            {/* Suggestions */}
            <Card>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">개선 제안</h2>
              <ul className="space-y-3">
                {feedback.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <span className="text-gray-700">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Conversation Review */}
            <Card>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">대화 내용</h2>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {transcript.map((entry, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      entry.role === 'user' ? 'bg-blue-50 ml-8' : 'bg-gray-50 mr-8'
                    }`}
                  >
                    <p className="text-xs text-gray-500 mb-1">
                      {entry.role === 'user' ? '나' : 'AI'}
                    </p>
                    <p className="text-sm text-gray-700">{entry.text}</p>
                  </div>
                ))}
              </div>
            </Card>
          </>
        ) : (
          <Card className="text-center py-12">
            <p className="text-gray-600">피드백을 불러올 수 없습니다.</p>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Button onClick={resetModule} variant="outline" size="lg">
            시나리오 선택으로
          </Button>
          <Button
            onClick={() => {
              setPhase('permission');
              setTranscript([]);
              setFeedback(null);
              setTimeout(() => startChatSession(), 100);
            }}
            size="lg"
          >
            다시 연습하기
          </Button>
        </div>
      </div>
    );
  }

  return null;
};

export default SpeakingModule;
