import React, { useState } from 'react';
import {
  ArrowLeft, RotateCcw, Check, X, Volume2,
  ChevronRight, ChevronLeft, Lightbulb, Eye,
  BookOpen, Headphones, Mic, Trophy, Star
} from 'lucide-react';
import tedService from '../../services/tedService';
import type { TedVideo, Subtitle, TedQuiz, TedVocabulary } from '../../types/ted';

type StudyMode = 'dictation' | 'shadowing' | 'quiz' | 'vocabulary';

interface TedStudyModeProps {
  video: TedVideo;
  mode: StudyMode;
  onBack: () => void;
  onComplete: (score: number) => void;
}

export const TedStudyMode: React.FC<TedStudyModeProps> = ({ video, mode, onBack, onComplete }) => {
  const transcript = tedService.getTranscript(video.id);
  const quizzes = tedService.getQuizzes(video.id);
  const vocabulary = tedService.getVocabulary(video.id);

  // Common state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Dictation state
  const [userInput, setUserInput] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // Quiz state
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  // Vocabulary state
  const [showMeaning, setShowMeaning] = useState(false);
  const [learnedWords, setLearnedWords] = useState<Set<string>>(new Set());

  // Get current item based on mode
  const getCurrentItems = () => {
    switch (mode) {
      case 'dictation':
      case 'shadowing':
        return transcript?.subtitles || [];
      case 'quiz':
        return quizzes;
      case 'vocabulary':
        return vocabulary;
      default:
        return [];
    }
  };

  const items = getCurrentItems();
  const currentItem = items[currentIndex];
  const progress = items.length > 0 ? ((currentIndex + 1) / items.length) * 100 : 0;

  const getModeTitle = () => {
    switch (mode) {
      case 'dictation': return '받아쓰기';
      case 'shadowing': return '쉐도잉';
      case 'quiz': return '퀴즈';
      case 'vocabulary': return '단어 학습';
    }
  };

  const getModeIcon = () => {
    switch (mode) {
      case 'dictation': return <Headphones className="w-6 h-6" />;
      case 'shadowing': return <Mic className="w-6 h-6" />;
      case 'quiz': return <BookOpen className="w-6 h-6" />;
      case 'vocabulary': return <Star className="w-6 h-6" />;
    }
  };

  // Dictation: Check answer
  const checkDictation = () => {
    if (!currentItem) return;
    const subtitle = currentItem as Subtitle;
    const correct = userInput.toLowerCase().trim() === subtitle.text.toLowerCase().trim();
    setIsCorrect(correct);
    setShowAnswer(true);
    setTotalAttempts(prev => prev + 1);
    if (correct) setScore(prev => prev + 1);
  };

  // Quiz: Submit answer
  const submitQuizAnswer = (answerIndex: number) => {
    if (selectedAnswer !== null) return;
    const quiz = currentItem as TedQuiz;
    setSelectedAnswer(answerIndex);
    setShowExplanation(true);
    setTotalAttempts(prev => prev + 1);
    if (answerIndex === quiz.correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  // Vocabulary: Mark as learned
  const markAsLearned = (word: string) => {
    setLearnedWords(prev => new Set(prev).add(word));
    setScore(prev => prev + 1);
    setTotalAttempts(prev => prev + 1);
  };

  // Navigation
  const goNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(prev => prev + 1);
      resetState();
    } else {
      setIsCompleted(true);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      resetState();
    }
  };

  const resetState = () => {
    setUserInput('');
    setShowAnswer(false);
    setIsCorrect(null);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setShowMeaning(false);
  };

  const handleComplete = () => {
    const finalScore = totalAttempts > 0 ? Math.round((score / totalAttempts) * 100) : 0;
    onComplete(finalScore);
  };

  // Completed Screen
  if (isCompleted) {
    const finalScore = totalAttempts > 0 ? Math.round((score / totalAttempts) * 100) : 0;
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">학습 완료!</h2>
          <p className="text-slate-400 mb-6">{video.title}</p>

          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 mb-6 inline-block">
            <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2">
              {finalScore}%
            </div>
            <p className="text-slate-400">
              {score} / {totalAttempts} 정답
            </p>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => {
                setCurrentIndex(0);
                setScore(0);
                setTotalAttempts(0);
                setIsCompleted(false);
                resetState();
              }}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              다시 하기
            </button>
            <button
              onClick={handleComplete}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl transition-all flex items-center gap-2"
            >
              완료
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>뒤로</span>
        </button>
        <div className="flex items-center gap-3 text-white">
          <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
            {getModeIcon()}
          </div>
          <span className="font-medium">{getModeTitle()}</span>
        </div>
        <div className="text-slate-400">
          {currentIndex + 1} / {items.length}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Main Content */}
      <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-8">
        {/* Dictation Mode */}
        {mode === 'dictation' && currentItem && (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-slate-400 mb-4">다음 문장을 듣고 영어로 받아쓰세요</p>

              {/* Audio Play Button */}
              <button className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 hover:scale-105 transition-transform">
                <Volume2 className="w-10 h-10 text-white" />
              </button>

              {/* Korean Translation Hint */}
              <p className="text-slate-500 text-sm mb-6">
                힌트: {(currentItem as Subtitle).translation}
              </p>
            </div>

            {/* Input */}
            <div>
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="들은 내용을 영어로 입력하세요..."
                className="w-full p-4 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 min-h-32 resize-none"
                disabled={showAnswer}
              />
            </div>

            {/* Answer */}
            {showAnswer && (
              <div className={`p-4 rounded-xl ${isCorrect ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {isCorrect ? (
                    <Check className="w-5 h-5 text-green-400" />
                  ) : (
                    <X className="w-5 h-5 text-red-400" />
                  )}
                  <span className={isCorrect ? 'text-green-400' : 'text-red-400'}>
                    {isCorrect ? '정답입니다!' : '오답입니다'}
                  </span>
                </div>
                <p className="text-white font-medium">{(currentItem as Subtitle).text}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center gap-4">
              {!showAnswer ? (
                <>
                  <button
                    onClick={() => setShowAnswer(true)}
                    className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors flex items-center gap-2"
                  >
                    <Eye className="w-5 h-5" />
                    정답 보기
                  </button>
                  <button
                    onClick={checkDictation}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl transition-all flex items-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    확인
                  </button>
                </>
              ) : (
                <button
                  onClick={goNext}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl transition-all flex items-center gap-2"
                >
                  다음
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Shadowing Mode */}
        {mode === 'shadowing' && currentItem && (
          <div className="space-y-6 text-center">
            <p className="text-slate-400 mb-4">문장을 듣고 따라 말해보세요</p>

            {/* Audio Play Button */}
            <button className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto hover:scale-105 transition-transform">
              <Volume2 className="w-12 h-12 text-white" />
            </button>

            {/* Sentence Display */}
            <div className="bg-slate-900/50 rounded-xl p-6">
              <p className="text-2xl text-white font-medium mb-3">
                {(currentItem as Subtitle).text}
              </p>
              <p className="text-slate-400">
                {(currentItem as Subtitle).translation}
              </p>
            </div>

            {/* Recording Button */}
            <div className="flex justify-center gap-4">
              <button className="px-6 py-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors flex items-center gap-2">
                <Mic className="w-5 h-5" />
                녹음하기
              </button>
            </div>

            {/* Navigation */}
            <div className="flex justify-center gap-4 pt-4">
              <button
                onClick={goPrev}
                disabled={currentIndex === 0}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-colors flex items-center gap-2"
              >
                <ChevronLeft className="w-5 h-5" />
                이전
              </button>
              <button
                onClick={goNext}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl transition-all flex items-center gap-2"
              >
                다음
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Quiz Mode */}
        {mode === 'quiz' && currentItem && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <span className="inline-block px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm mb-4">
                {(currentItem as TedQuiz).type === 'listening' && '듣기'}
                {(currentItem as TedQuiz).type === 'vocabulary' && '어휘'}
                {(currentItem as TedQuiz).type === 'comprehension' && '내용 이해'}
              </span>
              <h3 className="text-xl text-white font-medium">
                {(currentItem as TedQuiz).question}
              </h3>
              {(currentItem as TedQuiz).questionKo && (
                <p className="text-slate-400 mt-2">{(currentItem as TedQuiz).questionKo}</p>
              )}
            </div>

            {/* Options */}
            <div className="space-y-3">
              {(currentItem as TedQuiz).options.map((option, index) => {
                const quiz = currentItem as TedQuiz;
                const isSelected = selectedAnswer === index;
                const isCorrectAnswer = index === quiz.correctAnswer;

                let buttonClass = 'w-full p-4 rounded-xl border text-left transition-all ';
                if (selectedAnswer === null) {
                  buttonClass += 'bg-slate-700/50 border-slate-600/50 hover:border-blue-500/50 hover:bg-slate-700';
                } else if (isCorrectAnswer) {
                  buttonClass += 'bg-green-500/20 border-green-500/50 text-green-400';
                } else if (isSelected && !isCorrectAnswer) {
                  buttonClass += 'bg-red-500/20 border-red-500/50 text-red-400';
                } else {
                  buttonClass += 'bg-slate-700/50 border-slate-600/50 opacity-50';
                }

                return (
                  <button
                    key={index}
                    onClick={() => submitQuizAnswer(index)}
                    disabled={selectedAnswer !== null}
                    className={buttonClass}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 flex items-center justify-center bg-slate-600/50 rounded-lg text-sm font-medium">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="text-white">{option}</span>
                      {selectedAnswer !== null && isCorrectAnswer && (
                        <Check className="w-5 h-5 text-green-400 ml-auto" />
                      )}
                      {isSelected && !isCorrectAnswer && (
                        <X className="w-5 h-5 text-red-400 ml-auto" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Explanation */}
            {showExplanation && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-blue-400 font-medium mb-1">해설</p>
                    <p className="text-slate-300">{(currentItem as TedQuiz).explanation}</p>
                    {(currentItem as TedQuiz).explanationKo && (
                      <p className="text-slate-400 mt-1">{(currentItem as TedQuiz).explanationKo}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Next Button */}
            {selectedAnswer !== null && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={goNext}
                  className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white rounded-xl transition-all flex items-center gap-2"
                >
                  다음 문제
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Vocabulary Mode */}
        {mode === 'vocabulary' && currentItem && (
          <div className="space-y-6 text-center">
            <div className="bg-slate-900/50 rounded-xl p-8">
              <h3 className="text-4xl text-white font-bold mb-2">
                {(currentItem as TedVocabulary).word}
              </h3>
              <p className="text-slate-400">{(currentItem as TedVocabulary).pronunciation}</p>
              <span className="inline-block px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm mt-3">
                {(currentItem as TedVocabulary).partOfSpeech}
              </span>
            </div>

            {/* Show/Hide Meaning */}
            {!showMeaning ? (
              <button
                onClick={() => setShowMeaning(true)}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors flex items-center gap-2 mx-auto"
              >
                <Eye className="w-5 h-5" />
                뜻 보기
              </button>
            ) : (
              <div className="space-y-4">
                <div className="bg-slate-900/50 rounded-xl p-6">
                  <p className="text-xl text-white mb-2">{(currentItem as TedVocabulary).meaning}</p>
                  <p className="text-blue-400">{(currentItem as TedVocabulary).meaningKo}</p>
                </div>

                <div className="bg-slate-900/50 rounded-xl p-4">
                  <p className="text-slate-400 text-sm mb-1">영상에서 사용된 예문</p>
                  <p className="text-white italic">"{(currentItem as TedVocabulary).exampleFromVideo}"</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 pt-4">
              <button
                onClick={goPrev}
                disabled={currentIndex === 0}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-colors flex items-center gap-2"
              >
                <ChevronLeft className="w-5 h-5" />
                이전
              </button>
              {showMeaning && !learnedWords.has((currentItem as TedVocabulary).word) && (
                <button
                  onClick={() => markAsLearned((currentItem as TedVocabulary).word)}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl transition-all flex items-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  학습 완료
                </button>
              )}
              <button
                onClick={goNext}
                className="px-6 py-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white rounded-xl transition-all flex items-center gap-2"
              >
                다음
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* No Items */}
        {items.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400">
              이 영상에 대한 {getModeTitle()} 데이터가 아직 없습니다.
            </p>
            <button
              onClick={onBack}
              className="mt-4 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
            >
              뒤로 가기
            </button>
          </div>
        )}
      </div>

      {/* Score Display */}
      <div className="flex justify-center">
        <div className="bg-slate-800/50 rounded-xl px-6 py-3 border border-slate-700/50">
          <span className="text-slate-400">현재 점수: </span>
          <span className="text-white font-bold">{score}</span>
          <span className="text-slate-400"> / {totalAttempts}</span>
        </div>
      </div>
    </div>
  );
};

export default TedStudyMode;
