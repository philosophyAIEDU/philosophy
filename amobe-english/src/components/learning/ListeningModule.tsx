import React, { useState, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  ChevronLeft,
  CheckCircle,
  XCircle,
  Lightbulb,
  RefreshCw,
  Send,
  Headphones,
  Gauge,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { useGemini } from '../../hooks/useGemini';
import Button from '../common/Button';
import Card from '../common/Card';
import LoadingSpinner from '../common/LoadingSpinner';
import { UserLevel, ListeningContent } from '../../types/learning';

interface DictationResult {
  isCorrect: boolean;
  userAnswer: string;
  correctAnswer: string;
  accuracy: number;
  highlights: HighlightedWord[];
}

interface HighlightedWord {
  word: string;
  isCorrect: boolean;
  expected?: string;
}

type PlaybackSpeed = 0.75 | 1 | 1.25;

const levelContentPrompts: Record<UserLevel, string> = {
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

const ListeningModule: React.FC = () => {
  const navigate = useNavigate();
  const { state, updateProgress } = useApp();
  const { generateText, speakText, stopSpeaking, isLoading, error, clearError } = useGemini();

  const [currentContent, setCurrentContent] = useState<ListeningContent | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1);
  const [userInput, setUserInput] = useState('');
  const [result, setResult] = useState<DictationResult | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [attemptsCount, setAttemptsCount] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  const userLevel = state.userProfile?.level || 'beginner';

  const generateContent = useCallback(async () => {
    setIsGenerating(true);
    setResult(null);
    setUserInput('');
    setShowHint(false);
    setAttemptsCount(0);
    clearError();

    const prompt = levelContentPrompts[userLevel];
    const text = await generateText(prompt, 'You are an English language teacher creating practice sentences.');

    if (text) {
      const content: ListeningContent = {
        id: Date.now().toString(),
        text: text.trim().replace(/['"]/g, ''),
        level: userLevel,
      };
      setCurrentContent(content);
    }
    setIsGenerating(false);
  }, [userLevel, generateText, clearError]);

  useEffect(() => {
    generateContent();
  }, []);

  const handlePlay = useCallback(() => {
    if (!currentContent || isMuted) return;

    if (isPlaying) {
      stopSpeaking();
      setIsPlaying(false);
    } else {
      speakText(currentContent.text, playbackSpeed);
      setIsPlaying(true);
      // Auto-stop after estimated duration
      const estimatedDuration = (currentContent.text.split(' ').length / 2.5) * 1000 / playbackSpeed;
      setTimeout(() => setIsPlaying(false), estimatedDuration + 500);
    }
  }, [currentContent, isPlaying, isMuted, playbackSpeed, speakText, stopSpeaking]);

  const handleReplay = useCallback(() => {
    if (!currentContent || isMuted) return;
    stopSpeaking();
    setIsPlaying(false);
    setTimeout(() => {
      speakText(currentContent.text, playbackSpeed);
      setIsPlaying(true);
      const estimatedDuration = (currentContent.text.split(' ').length / 2.5) * 1000 / playbackSpeed;
      setTimeout(() => setIsPlaying(false), estimatedDuration + 500);
    }, 100);
  }, [currentContent, isMuted, playbackSpeed, speakText, stopSpeaking]);

  const handleSpeedChange = (speed: PlaybackSpeed) => {
    setPlaybackSpeed(speed);
    if (isPlaying) {
      stopSpeaking();
      setIsPlaying(false);
    }
  };

  const compareAnswers = (userAnswer: string, correctAnswer: string): DictationResult => {
    const normalize = (str: string) =>
      str.toLowerCase().replace(/[^\w\s]/g, '').trim().split(/\s+/);

    const userWords = normalize(userAnswer);
    const correctWords = normalize(correctAnswer);

    const highlights: HighlightedWord[] = [];
    let correctCount = 0;

    const maxLength = Math.max(userWords.length, correctWords.length);

    for (let i = 0; i < maxLength; i++) {
      const userWord = userWords[i] || '';
      const correctWord = correctWords[i] || '';

      if (userWord.toLowerCase() === correctWord.toLowerCase()) {
        highlights.push({ word: userWord || correctWord, isCorrect: true });
        correctCount++;
      } else if (userWord) {
        highlights.push({ word: userWord, isCorrect: false, expected: correctWord });
      } else {
        highlights.push({ word: correctWord, isCorrect: false, expected: correctWord });
      }
    }

    const accuracy = correctWords.length > 0 ? (correctCount / correctWords.length) * 100 : 0;
    const isCorrect = accuracy >= 90;

    return {
      isCorrect,
      userAnswer,
      correctAnswer,
      accuracy,
      highlights,
    };
  };

  const handleSubmit = () => {
    if (!currentContent || !userInput.trim()) return;

    const dictationResult = compareAnswers(userInput, currentContent.text);
    setResult(dictationResult);
    setAttemptsCount((prev) => prev + 1);

    // Update progress
    if (dictationResult.isCorrect) {
      updateProgress({
        moduleStats: {
          ...state.progress.moduleStats,
          listening: {
            ...state.progress.moduleStats.listening,
            count: state.progress.moduleStats.listening.count + 1,
            minutes: state.progress.moduleStats.listening.minutes + 2,
            lastAccessed: new Date().toISOString(),
          },
        },
      });
    }
  };

  const handleNextContent = () => {
    generateContent();
  };

  const getHint = () => {
    if (!currentContent) return '';
    const words = currentContent.text.split(' ');
    return words.map((word: string, index: number) => {
      if (index === 0) return word;
      return word[0] + '_'.repeat(Math.max(word.length - 1, 0));
    }).join(' ');
  };

  const speedButtons: { value: PlaybackSpeed; label: string }[] = [
    { value: 0.75, label: '0.75x' },
    { value: 1, label: '1x' },
    { value: 1.25, label: '1.25x' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>돌아가기</span>
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full">
            <Headphones className="w-4 h-4" />
            <span className="font-medium">듣기 연습</span>
          </div>
        </div>

        {/* Main Content Card */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
            <h2 className="text-xl font-bold mb-2">받아쓰기 연습</h2>
            <p className="opacity-90">
              음성을 듣고 들은 내용을 입력해보세요.
              {userLevel === 'beginner' && ' (초급 - 간단한 문장)'}
              {userLevel === 'intermediate' && ' (중급 - 일상 대화)'}
              {userLevel === 'advanced' && ' (고급 - 복잡한 문장)'}
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Loading State */}
            {(isLoading || isGenerating) && (
              <div className="flex flex-col items-center justify-center py-12">
                <LoadingSpinner size="lg" text="콘텐츠 생성 중..." />
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-red-800">
                  <XCircle className="w-5 h-5" />
                  <span className="font-medium">오류가 발생했습니다</span>
                </div>
                <p className="text-red-600 mt-2 text-sm">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateContent}
                  className="mt-3"
                >
                  다시 시도
                </Button>
              </div>
            )}

            {/* Content Ready */}
            {currentContent && !isLoading && !isGenerating && (
              <>
                {/* Audio Controls */}
                <div className="bg-gray-100 rounded-2xl p-6">
                  <div className="flex flex-col items-center gap-4">
                    {/* Play/Pause Button */}
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setIsMuted(!isMuted)}
                        className={`p-3 rounded-full transition-colors ${
                          isMuted
                            ? 'bg-gray-200 text-gray-500'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                        title={isMuted ? '음소거 해제' : '음소거'}
                      >
                        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                      </button>

                      <button
                        onClick={handlePlay}
                        disabled={isMuted}
                        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                          isMuted
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : isPlaying
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                      >
                        {isPlaying ? (
                          <Pause className="w-8 h-8" />
                        ) : (
                          <Play className="w-8 h-8 ml-1" />
                        )}
                      </button>

                      <button
                        onClick={handleReplay}
                        disabled={isMuted}
                        className={`p-3 rounded-full transition-colors ${
                          isMuted
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                        title="다시 듣기"
                      >
                        <RotateCcw className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Speed Control */}
                    <div className="flex items-center gap-2">
                      <Gauge className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-500 mr-2">재생 속도:</span>
                      <div className="flex gap-1">
                        {speedButtons.map((btn) => (
                          <button
                            key={btn.value}
                            onClick={() => handleSpeedChange(btn.value)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                              playbackSpeed === btn.value
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Attempts Counter */}
                    <p className="text-sm text-gray-500">
                      시도 횟수: {attemptsCount}회
                    </p>
                  </div>
                </div>

                {/* Hint Section */}
                {showHint && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-yellow-800 mb-2">
                      <Lightbulb className="w-5 h-5" />
                      <span className="font-medium">힌트</span>
                    </div>
                    <p className="text-yellow-700 font-mono">{getHint()}</p>
                  </div>
                )}

                {/* Input Section */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">
                    들은 내용을 입력하세요
                  </label>
                  <textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="영어로 받아쓴 내용을 입력하세요..."
                    rows={3}
                    disabled={result?.isCorrect}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />

                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={handleSubmit}
                      disabled={!userInput.trim() || result?.isCorrect}
                      className="flex-1 sm:flex-none"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      제출하기
                    </Button>

                    {!showHint && !result?.isCorrect && (
                      <Button
                        variant="outline"
                        onClick={() => setShowHint(true)}
                      >
                        <Lightbulb className="w-4 h-4 mr-2" />
                        힌트 보기
                      </Button>
                    )}

                    <Button
                      variant="secondary"
                      onClick={handleNextContent}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      새 문장
                    </Button>
                  </div>
                </div>

                {/* Result Section */}
                {result && (
                  <div
                    className={`rounded-xl p-6 ${
                      result.isCorrect
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-red-50 border border-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      {result.isCorrect ? (
                        <>
                          <CheckCircle className="w-6 h-6 text-green-600" />
                          <span className="text-lg font-bold text-green-800">정답입니다!</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-6 h-6 text-red-600" />
                          <span className="text-lg font-bold text-red-800">
                            다시 시도해보세요 (정확도: {Math.round(result.accuracy)}%)
                          </span>
                        </>
                      )}
                    </div>

                    {/* Highlighted Words */}
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">내 답안:</p>
                        <div className="flex flex-wrap gap-1">
                          {result.highlights.map((highlight, index) => (
                            <span
                              key={index}
                              className={`px-2 py-1 rounded ${
                                highlight.isCorrect
                                  ? 'bg-green-200 text-green-800'
                                  : 'bg-red-200 text-red-800 line-through'
                              }`}
                            >
                              {highlight.word}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">정답:</p>
                        <p className="px-4 py-3 bg-white rounded-lg text-gray-800 font-medium">
                          {result.correctAnswer}
                        </p>
                      </div>
                    </div>

                    {result.isCorrect && (
                      <Button
                        onClick={handleNextContent}
                        className="mt-4 w-full sm:w-auto"
                      >
                        다음 문장으로
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </Card>

        {/* Tips Card */}
        <Card>
          <div className="p-6">
            <h3 className="font-semibold text-gray-900 mb-3">학습 팁</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">&#8226;</span>
                <span>처음에는 느린 속도(0.75x)로 시작하여 점차 빠르게 연습하세요.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">&#8226;</span>
                <span>여러 번 듣고 핵심 단어를 먼저 파악해보세요.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">&#8226;</span>
                <span>틀린 부분은 빨간색으로 표시되니 집중적으로 복습하세요.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">&#8226;</span>
                <span>힌트를 활용하되, 스스로 맞추려고 노력해보세요.</span>
              </li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ListeningModule;
