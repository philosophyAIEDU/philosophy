import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  BookOpen,
  Volume2,
  Bookmark,
  BookmarkCheck,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  X,
  Send,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useGemini } from '../../hooks/useGemini';
import Button from '../common/Button';

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
          className={`cursor-pointer hover:bg-yellow-200 dark:hover:bg-yellow-800 rounded px-0.5 transition-colors ${isSaved ? 'bg-green-100 dark:bg-green-900/30' : ''
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
      <div className="flex items-center justify-center min-h-[400px] text-white">
        <LoadingSpinner size="lg" text="Generating reading material..." />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8 animate-fade-in text-white">
        <div className="bg-navy-card rounded-2xl border border-gray-700 p-12 text-center shadow-xl">
          <div className="w-20 h-20 bg-accent-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-accent-green" />
          </div>
          <h2 className="text-3xl font-serif font-bold text-white mb-4">
            Reading Practice
          </h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto text-lg leading-relaxed">
            Read AI-generated English articles tailored to your level.
            <br />
            Click on any word to translate and save it to your vocabulary.
          </p>
          <Button
            onClick={generateReadingContent}
            size="lg"
            className="bg-accent-green hover:bg-green-600 text-white border-none py-6 px-8 text-lg rounded-xl shadow-lg shadow-accent-green/20"
          >
            <BookOpen className="w-6 h-6 mr-3" />
            Generate New Article
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 animate-fade-in text-white">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header with Back Button */}
        <button
          onClick={() => { setContent(null); }}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
        >
          <div className="p-1 rounded-full group-hover:bg-gray-800 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </div>
          <span>Back to Selection</span>
        </button>

        {/* content Card */}
        <div className="bg-navy-card rounded-2xl border border-gray-700 shadow-xl overflow-hidden">
          {/* Article Header */}
          <div className="border-b border-gray-700 bg-gray-900/40 p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`
                            px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase
                            ${content.level === 'beginner'
                        ? 'bg-green-900/30 text-green-400 border border-green-800/50'
                        : content.level === 'intermediate'
                          ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-800/50'
                          : 'bg-red-900/30 text-red-400 border border-red-800/50'
                      }
                        `}
                  >
                    {content.level.charAt(0).toUpperCase() + content.level.slice(1)}
                  </span>
                  <span className="text-gray-500 text-sm flex items-center gap-1">
                    <BookOpen className="w-3 h-3" /> Article
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-serif font-bold text-white leading-tight">
                  {content.title}
                </h1>
              </div>

              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => handlePronounce(content.content)}
                  className="p-2.5 rounded-lg bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 border border-gray-600 transition-all active:scale-95"
                  title="Listen to article"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
                <button
                  onClick={analyzeDifficulty}
                  className={`p-2.5 rounded-lg bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 border border-gray-600 transition-all active:scale-95 ${isAnalyzing ? 'animate-pulse' : ''}`}
                  title="Analyze Difficulty"
                >
                  <BarChart3 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Difficulty Analysis Result */}
            {difficultyAnalysis && (
              <div className="mt-6 p-5 bg-gray-800/60 rounded-xl border border-gray-700 backdrop-blur-sm animate-fade-in">
                <div className="flex items-center justify-between mb-4 border-b border-gray-700 pb-2">
                  <h3 className="font-bold text-gray-200 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-accent-green" />
                    Analysis Result
                  </h3>
                  <span className="text-2xl font-bold text-accent-green">{difficultyAnalysis.score}<span className="text-sm text-gray-500 font-normal">/100</span></span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-gray-900/50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Avg Word Length</p>
                    <p className="text-lg font-mono text-white">{difficultyAnalysis.averageWordLength.toFixed(1)}</p>
                  </div>
                  <div className="bg-gray-900/50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Sentences</p>
                    <p className="text-lg font-mono text-white">{difficultyAnalysis.sentenceCount}</p>
                  </div>
                  <div className="bg-gray-900/50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Complex Words</p>
                    <p className="text-lg font-mono text-white">{difficultyAnalysis.complexWordsCount}</p>
                  </div>
                </div>

                {difficultyAnalysis.suggestions.length > 0 && (
                  <div className="space-y-1">
                    {difficultyAnalysis.suggestions.map((suggestion, idx) => (
                      <p key={idx} className="text-sm text-gray-400 flex items-start gap-2">
                        <span className="text-accent-green mt-1">•</span>
                        {suggestion}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Article Content */}
          <div className="p-6 md:p-8 bg-navy-card">
            <div className="prose prose-lg prose-invert max-w-none prose-p:leading-8 prose-p:text-gray-300">
              <p className="text-lg md:text-xl font-light font-sans text-gray-200">
                {renderContent}
              </p>
            </div>
          </div>
        </div>

        {/* Word Popup */}
        {wordPopup && (
          <div
            className="fixed z-50 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl p-4 max-w-xs animate-fade-in"
            style={{
              left: Math.min(wordPopup.position.x, window.innerWidth - 320),
              top: wordPopup.position.y,
            }}
          >
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700 transition-colors"
              onClick={() => setWordPopup(null)}
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-3 pr-6">
              <h4 className="font-serif font-bold text-xl text-white">
                {wordPopup.word}
              </h4>
              <button
                className="text-accent-green hover:text-green-300 p-1 rounded-full hover:bg-green-900/30 transition-colors"
                onClick={() => handlePronounce(wordPopup.word)}
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            {isLookingUpWord ? (
              <div className="flex justify-center py-4">
                <LoadingSpinner size="sm" />
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Meaning</span>
                  <p className="text-gray-200 font-medium">
                    {wordPopup.meaning}
                  </p>
                </div>

                {wordPopup.example && (
                  <div>
                    <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Example</span>
                    <p className="text-sm text-gray-400 italic leading-snug">
                      "{wordPopup.example}"
                    </p>
                  </div>
                )}

                <Button
                  size="sm"
                  variant={savedWords.has(wordPopup.word.toLowerCase()) ? 'secondary' : 'primary'}
                  onClick={handleSaveWord}
                  disabled={savedWords.has(wordPopup.word.toLowerCase())}
                  className={`w-full mt-2 ${savedWords.has(wordPopup.word.toLowerCase())
                    ? 'bg-gray-700 text-gray-300 border-none'
                    : 'bg-accent-green hover:bg-green-600 text-white border-none'
                    }`}
                >
                  {savedWords.has(wordPopup.word.toLowerCase()) ? (
                    <>
                      <BookmarkCheck className="w-4 h-4 mr-1" />
                      Saved to Vocabulary
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-4 h-4 mr-1" />
                      Save Word
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Two Column Layout for Vocab and Questions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Vocabulary List */}
          {content.vocabulary.length > 0 && (
            <div className="lg:col-span-1 space-y-4">
              <h3 className="font-serif font-bold text-xl text-white flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-accent-green" />
                Key Vocabulary
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {content.vocabulary.map((vocab) => (
                  <div
                    key={vocab.id}
                    className={`p-4 rounded-xl border transition-all ${savedWords.has(vocab.word.toLowerCase())
                      ? 'border-green-500/30 bg-green-900/10'
                      : 'border-gray-700 bg-navy-card hover:border-gray-600'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-lg text-white font-serif">
                        {vocab.word}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
                          onClick={() => handlePronounce(vocab.word)}
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                        {!savedWords.has(vocab.word.toLowerCase()) && (
                          <button
                            className="p-1.5 text-gray-400 hover:text-accent-green hover:bg-gray-700 rounded-full transition-colors"
                            onClick={() => {
                              addToVocabulary(vocab);
                              setSavedWords((prev) => new Set([...prev, vocab.word.toLowerCase()]));
                            }}
                          >
                            <Bookmark className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm">{vocab.meaning}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comprehension Questions */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-serif font-bold text-xl text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-accent-green" />
              Comprehension Check
            </h3>

            <div className="bg-navy-card rounded-2xl border border-gray-700 p-6 space-y-8">
              {content.questions.map((question, qIndex) => (
                <div key={question.id} className="border-b border-gray-800 pb-8 last:border-0 last:pb-0">
                  <p className="font-medium text-lg text-gray-200 mb-4 flex gap-3">
                    <span className="text-accent-green font-bold">{qIndex + 1}.</span>
                    {question.question}
                  </p>

                  {question.type === 'multiple' && question.options ? (
                    <div className="grid grid-cols-1 gap-2">
                      {question.options.map((option, oIndex) => (
                        <label
                          key={oIndex}
                          className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all group ${answers[question.id] === option
                            ? 'border-accent-green bg-green-900/10'
                            : 'border-gray-700 bg-gray-800/30 hover:bg-gray-800 hover:border-gray-600'
                            } ${showResults && results[question.id]
                              ? option === question.answer
                                ? 'border-green-500 bg-green-900/20'
                                : answers[question.id] === option
                                  ? 'border-red-500 bg-red-900/20'
                                  : ''
                              : ''
                            }`}
                        >
                          <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center transition-colors ${answers[question.id] === option ? 'border-accent-green' : 'border-gray-600 group-hover:border-gray-500'
                            }`}>
                            {answers[question.id] === option && <div className="w-2.5 h-2.5 rounded-full bg-accent-green" />}
                          </div>
                          <input
                            type="radio"
                            name={question.id}
                            value={option}
                            checked={answers[question.id] === option}
                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                            disabled={showResults}
                            className="hidden"
                          />
                          <span className="text-gray-300">{option}</span>
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
                      className="w-full p-4 border border-gray-700 rounded-xl bg-gray-900/50 text-white placeholder-gray-600 focus:ring-2 focus:ring-accent-green focus:border-transparent resize-none transition-all"
                      rows={3}
                      placeholder="Type your answer in English..."
                      value={answers[question.id] || ''}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      disabled={showResults}
                    />
                  )}

                  {showResults && results[question.id] && (
                    <div
                      className={`mt-4 p-4 rounded-xl ${results[question.id].isCorrect
                        ? 'bg-green-900/20 border border-green-800'
                        : 'bg-red-900/20 border border-red-800'
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        {results[question.id].isCorrect ? (
                          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                        )}
                        <div>
                          <p className={`font-bold mb-1 ${results[question.id].isCorrect ? 'text-green-400' : 'text-red-400'
                            }`}>
                            {results[question.id].isCorrect ? 'Correct' : 'Incorrect'}
                          </p>
                          <p className="text-sm text-gray-300">
                            {results[question.id].feedback}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <div className="pt-6 flex items-center justify-between border-t border-gray-800">
                {!showResults ? (
                  <Button
                    onClick={handleSubmitAnswers}
                    loading={isCheckingAnswers}
                    disabled={Object.keys(answers).length === 0}
                    className="bg-accent-green hover:bg-green-600 text-white w-full md:w-auto py-3 px-8 text-lg"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Submit Answers
                  </Button>
                ) : (
                  <div className="flex flex-col md:flex-row items-center gap-4 w-full">
                    <div className="text-xl font-bold bg-gray-800 px-6 py-3 rounded-xl border border-gray-700 w-full md:w-auto text-center">
                      Score:{' '}
                      <span
                        className={
                          calculateScore >= 70
                            ? 'text-green-400'
                            : calculateScore >= 40
                              ? 'text-yellow-400'
                              : 'text-red-400'
                        }
                      >
                        {calculateScore}
                      </span>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto ml-auto">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setAnswers({});
                          setResults({});
                          setShowResults(false);
                        }}
                        className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                      >
                        Rewrite
                      </Button>
                      <Button
                        onClick={generateReadingContent}
                        className="flex-1 bg-accent-green hover:bg-green-600 text-white"
                      >
                        <ChevronRight className="w-4 h-4 mr-1" />
                        Next Article
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReadingModule;
