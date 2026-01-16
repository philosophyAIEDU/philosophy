import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  BookOpen,
  Volume2,
  Bookmark,
  BookmarkCheck,
  CheckCircle,
  XCircle,
  ChevronRight,
  RefreshCw,
  BarChart3,
  X,
  Send,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useGemini } from '../../hooks/useGemini';
import Button from '../common/Button';
import Card from '../common/Card';
import LoadingSpinner from '../common/LoadingSpinner';
import { ReadingContent, VocabularyItem, UserLevel } from '../../types/learning';

interface WordPopupState {
  word: string;
  meaning: string;
  example: string;
  position: { x: number; y: number };
}

interface DifficultyAnalysis {
  level: UserLevel;
  score: number;
  averageWordLength: number;
  uniqueWordsRatio: number;
  sentenceCount: number;
  complexWordsCount: number;
  suggestions: string[];
}

interface AnswerState {
  [questionId: string]: string;
}

interface ResultState {
  [questionId: string]: {
    isCorrect: boolean;
    feedback: string;
  };
}

const ReadingModule: React.FC = () => {
  const { state, addToVocabulary } = useApp();
  const { generateJSON, speakText } = useGemini();

  const [content, setContent] = useState<ReadingContent | null>(null);
  const [wordPopup, setWordPopup] = useState<WordPopupState | null>(null);
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());
  const [answers, setAnswers] = useState<AnswerState>({});
  const [results, setResults] = useState<ResultState>({});
  const [showResults, setShowResults] = useState(false);
  const [difficultyAnalysis, setDifficultyAnalysis] = useState<DifficultyAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [isCheckingAnswers, setIsCheckingAnswers] = useState(false);
  const [isLookingUpWord, setIsLookingUpWord] = useState(false);

  // Initialize saved words from vocabulary
  useEffect(() => {
    const vocabWords = new Set(state.vocabulary.map((v) => v.word.toLowerCase()));
    setSavedWords(vocabWords);
  }, [state.vocabulary]);

  const generateReadingContent = useCallback(async () => {
    setIsGeneratingContent(true);
    setContent(null);
    setAnswers({});
    setResults({});
    setShowResults(false);
    setDifficultyAnalysis(null);

    const level = state.userProfile?.level || 'intermediate';
    const prompt = `Generate a reading passage for English learners at ${level} level.

Return JSON with this exact structure:
{
  "id": "unique-id",
  "title": "Article title in English",
  "content": "2-3 paragraphs of engaging content (150-250 words for beginner, 250-400 for intermediate, 400-600 for advanced)",
  "level": "${level}",
  "vocabulary": [
    {
      "id": "vocab-1",
      "word": "example",
      "meaning": "Korean meaning",
      "example": "Example sentence using the word",
      "level": "${level}",
      "addedDate": "${new Date().toISOString()}",
      "nextReview": "${new Date().toISOString()}",
      "reviewCount": 0,
      "masteryLevel": 0
    }
  ],
  "questions": [
    {
      "id": "q1",
      "question": "Multiple choice question?",
      "type": "multiple",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "Correct option text"
    },
    {
      "id": "q2",
      "question": "Open-ended question requiring short answer?",
      "type": "open",
      "answer": "Expected answer or key points"
    },
    {
      "id": "q3",
      "question": "Another multiple choice question?",
      "type": "multiple",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "Correct option text"
    }
  ]
}

Topics: technology, culture, environment, health, travel, science, history
Include 5-8 vocabulary words with Korean meanings.
Include 2 multiple choice and 1 open-ended question.`;

    const systemInstruction = `You are an English learning content generator. Create engaging, educational content appropriate for Korean learners. All vocabulary meanings should be in Korean. Questions should test comprehension of the passage.`;

    try {
      const result = await generateJSON<ReadingContent>(prompt, systemInstruction);
      if (result) {
        setContent(result);
      }
    } catch (error) {
      console.error('Failed to generate content:', error);
    } finally {
      setIsGeneratingContent(false);
    }
  }, [generateJSON, state.userProfile?.level]);

  const handleWordClick = useCallback(
    async (event: React.MouseEvent, word: string) => {
      const cleanWord = word.replace(/[^a-zA-Z'-]/g, '').toLowerCase();
      if (!cleanWord || cleanWord.length < 2) return;

      const rect = (event.target as HTMLElement).getBoundingClientRect();
      setWordPopup({
        word: cleanWord,
        meaning: '조회 중...',
        example: '',
        position: {
          x: rect.left + window.scrollX,
          y: rect.bottom + window.scrollY + 8,
        },
      });
      setIsLookingUpWord(true);

      // Check if word exists in content vocabulary
      const vocabItem = content?.vocabulary.find(
        (v) => v.word.toLowerCase() === cleanWord
      );

      if (vocabItem) {
        setWordPopup((prev) =>
          prev
            ? {
                ...prev,
                meaning: vocabItem.meaning,
                example: vocabItem.example,
              }
            : null
        );
        setIsLookingUpWord(false);
        return;
      }

      // Look up word meaning via Gemini
      const prompt = `Translate the English word "${cleanWord}" to Korean and provide a simple example sentence.
Return JSON: {"meaning": "Korean meaning", "example": "Example sentence in English"}`;

      try {
        const result = await generateJSON<{ meaning: string; example: string }>(
          prompt,
          'You are a dictionary. Provide accurate Korean translations for English words.'
        );
        if (result) {
          setWordPopup((prev) =>
            prev
              ? {
                  ...prev,
                  meaning: result.meaning,
                  example: result.example,
                }
              : null
          );
        }
      } catch (error) {
        setWordPopup((prev) =>
          prev
            ? {
                ...prev,
                meaning: '의미를 찾을 수 없습니다',
                example: '',
              }
            : null
        );
      } finally {
        setIsLookingUpWord(false);
      }
    },
    [content?.vocabulary, generateJSON]
  );

  const handleSaveWord = useCallback(() => {
    if (!wordPopup) return;

    const newVocab: VocabularyItem = {
      id: `vocab-${Date.now()}`,
      word: wordPopup.word,
      meaning: wordPopup.meaning,
      example: wordPopup.example,
      level: state.userProfile?.level || 'intermediate',
      addedDate: new Date().toISOString(),
      nextReview: new Date().toISOString(),
      reviewCount: 0,
      masteryLevel: 0,
    };

    addToVocabulary(newVocab);
    setSavedWords((prev) => new Set([...prev, wordPopup.word.toLowerCase()]));
    setWordPopup(null);
  }, [wordPopup, state.userProfile?.level, addToVocabulary]);

  const handlePronounce = useCallback(
    (text: string) => {
      speakText(text, state.userProfile?.preferences?.ttsSpeed || 1.0);
    },
    [speakText, state.userProfile?.preferences?.ttsSpeed]
  );

  const handleAnswerChange = useCallback((questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  }, []);

  const handleSubmitAnswers = useCallback(async () => {
    if (!content) return;

    setIsCheckingAnswers(true);
    const newResults: ResultState = {};

    for (const question of content.questions) {
      const userAnswer = answers[question.id];
      if (!userAnswer) {
        newResults[question.id] = {
          isCorrect: false,
          feedback: '답변을 입력해주세요.',
        };
        continue;
      }

      if (question.type === 'multiple') {
        const isCorrect = userAnswer === question.answer;
        newResults[question.id] = {
          isCorrect,
          feedback: isCorrect
            ? '정답입니다!'
            : `오답입니다. 정답: ${question.answer}`,
        };
      } else {
        // Open-ended question - use AI to evaluate
        const prompt = `Evaluate this answer for the question about the reading passage.
Question: ${question.question}
Expected answer/key points: ${question.answer}
User's answer: ${userAnswer}

Return JSON: {"isCorrect": boolean, "feedback": "Korean feedback explaining why the answer is correct/incorrect and what could be improved"}`;

        try {
          const result = await generateJSON<{ isCorrect: boolean; feedback: string }>(
            prompt,
            'You are an English teacher evaluating student answers. Be encouraging but accurate.'
          );
          if (result) {
            newResults[question.id] = result;
          }
        } catch (error) {
          newResults[question.id] = {
            isCorrect: false,
            feedback: '답변 평가 중 오류가 발생했습니다.',
          };
        }
      }
    }

    setResults(newResults);
    setShowResults(true);
    setIsCheckingAnswers(false);
  }, [content, answers, generateJSON]);

  const analyzeDifficulty = useCallback(async () => {
    if (!content) return;

    setIsAnalyzing(true);

    const prompt = `Analyze the difficulty of this English text for Korean learners:

Title: ${content.title}
Content: ${content.content}

Return JSON with this structure:
{
  "level": "beginner" | "intermediate" | "advanced",
  "score": number (1-100, where 100 is most difficult),
  "averageWordLength": number,
  "uniqueWordsRatio": number (0-1),
  "sentenceCount": number,
  "complexWordsCount": number,
  "suggestions": ["Korean suggestion 1", "Korean suggestion 2"]
}

Consider: vocabulary complexity, sentence structure, topic familiarity, grammar patterns.`;

    try {
      const result = await generateJSON<DifficultyAnalysis>(
        prompt,
        'You are an English education expert analyzing text difficulty for Korean learners.'
      );
      if (result) {
        setDifficultyAnalysis(result);
      }
    } catch (error) {
      console.error('Failed to analyze difficulty:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [content, generateJSON]);

  const renderContent = useMemo(() => {
    if (!content) return null;

    const words = content.content.split(/(\s+)/);
    return words.map((word, index) => {
      const cleanWord = word.replace(/[^a-zA-Z'-]/g, '').toLowerCase();
      const isWord = /[a-zA-Z]/.test(word);
      const isSaved = savedWords.has(cleanWord);

      if (!isWord) {
        return <span key={index}>{word}</span>;
      }

      return (
        <span
          key={index}
          className={`cursor-pointer hover:bg-yellow-200 dark:hover:bg-yellow-800 rounded px-0.5 transition-colors ${
            isSaved ? 'bg-green-100 dark:bg-green-900/30' : ''
          }`}
          onClick={(e) => handleWordClick(e, word)}
        >
          {word}
        </span>
      );
    });
  }, [content, savedWords, handleWordClick]);

  const calculateScore = useMemo(() => {
    if (!showResults || !content) return 0;
    const correctCount = Object.values(results).filter((r) => r.isCorrect).length;
    return Math.round((correctCount / content.questions.length) * 100);
  }, [showResults, results, content]);

  if (isGeneratingContent) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="읽기 자료를 생성하고 있습니다..." />
      </div>
    );
  }

  if (!content) {
    return (
      <Card className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 mx-auto text-blue-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            읽기 학습
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            AI가 생성한 영어 지문을 읽고 이해력을 테스트해보세요.
            <br />
            단어를 클릭하면 뜻을 확인하고 단어장에 저장할 수 있습니다.
          </p>
          <Button onClick={generateReadingContent} size="lg">
            <BookOpen className="w-5 h-5 mr-2" />
            읽기 자료 생성하기
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title and Controls */}
      <Card>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              {content.title}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  content.level === 'beginner'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : content.level === 'intermediate'
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}
              >
                {content.level === 'beginner'
                  ? '초급'
                  : content.level === 'intermediate'
                    ? '중급'
                    : '고급'}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePronounce(content.content)}
            >
              <Volume2 className="w-4 h-4 mr-1" />
              듣기
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={analyzeDifficulty}
              loading={isAnalyzing}
            >
              <BarChart3 className="w-4 h-4 mr-1" />
              난이도 분석
            </Button>
            <Button variant="outline" size="sm" onClick={generateReadingContent}>
              <RefreshCw className="w-4 h-4 mr-1" />
              새 지문
            </Button>
          </div>
        </div>

        {/* Difficulty Analysis */}
        {difficultyAnalysis && (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-3">
              난이도 분석 결과
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">난이도 점수</p>
                <p className="text-xl font-bold text-blue-600">{difficultyAnalysis.score}/100</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">평균 단어 길이</p>
                <p className="text-xl font-bold text-blue-600">
                  {difficultyAnalysis.averageWordLength.toFixed(1)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">문장 수</p>
                <p className="text-xl font-bold text-blue-600">{difficultyAnalysis.sentenceCount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">복잡한 단어</p>
                <p className="text-xl font-bold text-blue-600">{difficultyAnalysis.complexWordsCount}개</p>
              </div>
            </div>
            {difficultyAnalysis.suggestions.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">학습 제안</p>
                <ul className="text-sm text-gray-700 dark:text-gray-300 list-disc list-inside">
                  {difficultyAnalysis.suggestions.map((suggestion, idx) => (
                    <li key={idx}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Reading Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
            {renderContent}
          </p>
        </div>

        {/* Word Popup */}
        {wordPopup && (
          <div
            className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-4 max-w-xs"
            style={{
              left: Math.min(wordPopup.position.x, window.innerWidth - 320),
              top: wordPopup.position.y,
            }}
          >
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              onClick={() => setWordPopup(null)}
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-bold text-lg text-gray-800 dark:text-white">
                {wordPopup.word}
              </h4>
              <button
                className="text-blue-500 hover:text-blue-700"
                onClick={() => handlePronounce(wordPopup.word)}
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
            {isLookingUpWord ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  {wordPopup.meaning}
                </p>
                {wordPopup.example && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic mb-3">
                    "{wordPopup.example}"
                  </p>
                )}
                <Button
                  size="sm"
                  variant={savedWords.has(wordPopup.word.toLowerCase()) ? 'secondary' : 'primary'}
                  onClick={handleSaveWord}
                  disabled={savedWords.has(wordPopup.word.toLowerCase())}
                  className="w-full"
                >
                  {savedWords.has(wordPopup.word.toLowerCase()) ? (
                    <>
                      <BookmarkCheck className="w-4 h-4 mr-1" />
                      저장됨
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-4 h-4 mr-1" />
                      단어장에 저장
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        )}
      </Card>

      {/* Vocabulary List */}
      {content.vocabulary.length > 0 && (
        <Card>
          <h3 className="font-semibold text-gray-800 dark:text-white mb-4">
            주요 단어 ({content.vocabulary.length}개)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {content.vocabulary.map((vocab) => (
              <div
                key={vocab.id}
                className={`p-3 rounded-lg border ${
                  savedWords.has(vocab.word.toLowerCase())
                    ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800 dark:text-white">
                      {vocab.word}
                    </span>
                    <button
                      className="text-blue-500 hover:text-blue-700"
                      onClick={() => handlePronounce(vocab.word)}
                    >
                      <Volume2 className="w-3 h-3" />
                    </button>
                  </div>
                  {!savedWords.has(vocab.word.toLowerCase()) && (
                    <button
                      className="text-gray-400 hover:text-blue-500"
                      onClick={() => {
                        addToVocabulary(vocab);
                        setSavedWords((prev) => new Set([...prev, vocab.word.toLowerCase()]));
                      }}
                    >
                      <Bookmark className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{vocab.meaning}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Comprehension Questions */}
      <Card>
        <h3 className="font-semibold text-gray-800 dark:text-white mb-4">
          이해력 테스트
        </h3>
        <div className="space-y-6">
          {content.questions.map((question, qIndex) => (
            <div key={question.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
              <p className="font-medium text-gray-800 dark:text-white mb-3">
                {qIndex + 1}. {question.question}
              </p>

              {question.type === 'multiple' && question.options ? (
                <div className="space-y-2">
                  {question.options.map((option, oIndex) => (
                    <label
                      key={oIndex}
                      className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                        answers[question.id] === option
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                      } ${
                        showResults && results[question.id]
                          ? option === question.answer
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                            : answers[question.id] === option
                              ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                              : ''
                          : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name={question.id}
                        value={option}
                        checked={answers[question.id] === option}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        disabled={showResults}
                        className="mr-3"
                      />
                      <span className="text-gray-700 dark:text-gray-300">{option}</span>
                      {showResults && option === question.answer && (
                        <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />
                      )}
                      {showResults &&
                        answers[question.id] === option &&
                        option !== question.answer && (
                          <XCircle className="w-5 h-5 text-red-500 ml-auto" />
                        )}
                    </label>
                  ))}
                </div>
              ) : (
                <textarea
                  className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="답변을 영어로 작성해주세요..."
                  value={answers[question.id] || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  disabled={showResults}
                />
              )}

              {showResults && results[question.id] && (
                <div
                  className={`mt-3 p-3 rounded-lg ${
                    results[question.id].isCorrect
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {results[question.id].isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span
                      className={
                        results[question.id].isCorrect
                          ? 'text-green-700 dark:text-green-400'
                          : 'text-red-700 dark:text-red-400'
                      }
                    >
                      {results[question.id].feedback}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          {!showResults ? (
            <Button
              onClick={handleSubmitAnswers}
              loading={isCheckingAnswers}
              disabled={Object.keys(answers).length === 0}
            >
              <Send className="w-4 h-4 mr-2" />
              답안 제출
            </Button>
          ) : (
            <div className="flex items-center gap-4">
              <div className="text-lg font-semibold">
                점수:{' '}
                <span
                  className={
                    calculateScore >= 70
                      ? 'text-green-600'
                      : calculateScore >= 40
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  }
                >
                  {calculateScore}점
                </span>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setAnswers({});
                  setResults({});
                  setShowResults(false);
                }}
              >
                다시 풀기
              </Button>
              <Button onClick={generateReadingContent}>
                <ChevronRight className="w-4 h-4 mr-1" />
                다음 지문
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ReadingModule;
