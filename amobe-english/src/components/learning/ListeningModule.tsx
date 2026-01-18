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
    <div className="min-h-screen p-4 md:p-6 lg:p-8 animate-fade-in text-white">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-accent-blue/10 text-accent-blue border border-accent-blue/20 rounded-full">
            <Headphones className="w-4 h-4" />
            <span className="font-medium">Listening Practice</span>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-navy-card rounded-2xl border border-gray-700 overflow-hidden shadow-xl">
          <div className="bg-gradient-to-r from-accent-blue/20 to-accent-blue/10 p-6 border-b border-gray-700">
            <h2 className="text-2xl font-serif font-bold text-white mb-2">Dictation Practice</h2>
            <p className="text-gray-400">
              Listen to the audio and type what you hear.
              {userLevel === 'beginner' && ' (Beginner - Simple Sentences)'}
              {userLevel === 'intermediate' && ' (Intermediate - Daily Conversation)'}
              {userLevel === 'advanced' && ' (Advanced - Complex Expressions)'}
            </p>
          </div>

          <div className="p-6 space-y-8">
            {/* Loading State */}
            {(isLoading || isGenerating) && (
              <div className="flex flex-col items-center justify-center py-12">
                <LoadingSpinner size="lg" text="Generating content..." />
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-900/20 border border-red-800 rounded-xl p-4">
                <div className="flex items-center gap-2 text-red-400">
                  <XCircle className="w-5 h-5" />
                  <span className="font-medium">An error occurred</span>
                </div>
                <p className="text-red-300 mt-2 text-sm">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateContent}
                  className="mt-3 border-red-700 text-red-300 hover:bg-red-900/50"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </div>
            )}

            {/* Content Ready */}
            {currentContent && !isLoading && !isGenerating && (
              <>
                {/* Audio Controls */}
                <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700">
                  <div className="flex flex-col items-center gap-6">
                    {/* Play/Pause Button */}
                    <div className="flex items-center gap-6">
                      <button
                        onClick={() => setIsMuted(!isMuted)}
                        className={`p-3 rounded-full transition-colors ${isMuted
                          ? 'bg-gray-700 text-gray-500'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        title={isMuted ? 'Unmute' : 'Mute'}
                      >
                        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                      </button>

                      <button
                        onClick={handlePlay}
                        disabled={isMuted}
                        className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-105 active:scale-95 ${isMuted
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          : isPlaying
                            ? 'bg-accent-blue text-white shadow-accent-blue/40'
                            : 'bg-accent-blue/90 text-white hover:bg-accent-blue shadow-accent-blue/30'
                          }`}
                      >
                        {isPlaying ? (
                          <Pause className="w-10 h-10" />
                        ) : (
                          <Play className="w-10 h-10 ml-1" />
                        )}
                      </button>

                      <button
                        onClick={handleReplay}
                        disabled={isMuted}
                        className={`p-3 rounded-full transition-colors ${isMuted
                          ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        title="Replay"
                      >
                        <RotateCcw className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Speed Control */}
                    <div className="flex items-center gap-3 bg-gray-900/50 p-1.5 rounded-lg border border-gray-700">
                      <div className="flex items-center gap-2 px-2">
                        <Gauge className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Speed</span>
                      </div>
                      <div className="flex gap-1">
                        {speedButtons.map((btn) => (
                          <button
                            key={btn.value}
                            onClick={() => handleSpeedChange(btn.value)}
                            className={`px-3 py-1 text-xs font-bold rounded hover:bg-gray-700 transition-colors ${playbackSpeed === btn.value
                              ? 'bg-accent-blue text-white shadow-sm'
                              : 'text-gray-400 hover:text-white'
                              }`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Attempts Counter */}
                    <p className="text-xs text-gray-500 font-mono">
                      ATTEMPTS: {attemptsCount}
                    </p>
                  </div>
                </div>

                {/* Hint Section */}
                {showHint && (
                  <div className="bg-yellow-900/10 border border-yellow-700/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-yellow-500 mb-2">
                      <Lightbulb className="w-5 h-5" />
                      <span className="font-medium font-serif">Hint</span>
                    </div>
                    <p className="text-yellow-200/80 font-mono tracking-widest">{getHint()}</p>
                  </div>
                )}

                {/* Input Section */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-400 ml-1">
                    Type what you hear
                  </label>
                  <textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Type the English sentence you heard..."
                    rows={3}
                    disabled={result?.isCorrect}
                    className="w-full px-5 py-4 bg-gray-800/50 border border-gray-600 rounded-xl focus:ring-2 focus:ring-accent-blue focus:border-accent-blue transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed text-white placeholder-gray-500 text-lg"
                  />

                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={handleSubmit}
                      disabled={!userInput.trim() || result?.isCorrect}
                      className="flex-1 sm:flex-none bg-accent-blue hover:bg-blue-600 text-white"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Submit Answer
                    </Button>

                    {!showHint && !result?.isCorrect && (
                      <Button
                        variant="outline"
                        onClick={() => setShowHint(true)}
                        className="border-gray-600 text-gray-300 hover:bg-gray-800"
                      >
                        <Lightbulb className="w-4 h-4 mr-2" />
                        Show Hint
                      </Button>
                    )}

                    <Button
                      variant="secondary"
                      onClick={handleNextContent}
                      className="bg-gray-700 text-white hover:bg-gray-600"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      New Sentence
                    </Button>
                  </div>
                </div>

                {/* Result Section */}
                {result && (
                  <div
                    className={`rounded-xl p-6 border ${result.isCorrect
                      ? 'bg-green-900/10 border-green-800/30'
                      : 'bg-red-900/10 border-red-800/30'
                      }`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      {result.isCorrect ? (
                        <>
                          <div className="p-2 bg-green-500/20 rounded-full">
                            <CheckCircle className="w-6 h-6 text-green-400" />
                          </div>
                          <div>
                            <span className="text-lg font-bold text-green-400 block">Correct!</span>
                            <span className="text-sm text-green-400/70">Great job listening.</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="p-2 bg-red-500/20 rounded-full">
                            <XCircle className="w-6 h-6 text-red-400" />
                          </div>
                          <div>
                            <span className="text-lg font-bold text-red-400 block">Try Again</span>
                            <span className="text-sm text-red-400/70">Accuracy: {Math.round(result.accuracy)}%</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Highlighted Words */}
                    <div className="space-y-4">
                      <div className="bg-black/20 rounded-lg p-4">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Your Answer:</p>
                        <div className="flex flex-wrap gap-1.5 text-lg">
                          {result.highlights.map((highlight, index) => (
                            <span
                              key={index}
                              className={`px-1.5 rounded ${highlight.isCorrect
                                ? 'text-green-300'
                                : 'text-red-300 bg-red-900/30 line-through decoration-red-400/50'
                                }`}
                            >
                              {highlight.word}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="bg-black/20 rounded-lg p-4">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Correct Answer:</p>
                        <p className="text-lg text-white font-medium">
                          {result.correctAnswer}
                        </p>
                      </div>
                    </div>

                    {result.isCorrect && (
                      <Button
                        onClick={handleNextContent}
                        className="mt-6 w-full bg-green-600 hover:bg-green-500 text-white border-none py-3"
                      >
                        Next Sentence
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Tips Card */}
        <div className="bg-navy-card rounded-2xl p-6 border border-gray-700 shadow-lg">
          <h3 className="font-serif font-bold text-white mb-4 border-b border-gray-700 pb-2">Learning Tips</h3>
          <ul className="space-y-3 text-sm text-gray-400">
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-blue mt-2 flex-shrink-0" />
              <span>Start with a slower speed (0.75x) and gradually increase it.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-blue mt-2 flex-shrink-0" />
              <span>Listen multiple times to catch key words first.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-blue mt-2 flex-shrink-0" />
              <span>Pay attention to red highlighted words to identify specific errors.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-blue mt-2 flex-shrink-0" />
              <span>Use hints if you're stuck, but try to solve it yourself first!</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ListeningModule;
