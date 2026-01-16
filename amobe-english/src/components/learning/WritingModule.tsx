import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  PenTool,
  FileText,
  Mail,
  BookOpen,
  Save,
  RefreshCw,
  Send,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Lightbulb,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useGemini } from '../../hooks/useGemini';
import Button from '../common/Button';
import Card from '../common/Card';
import LoadingSpinner from '../common/LoadingSpinner';
import { WritingPrompt, WritingFeedback } from '../../types/learning';

type WritingType = 'diary' | 'email' | 'essay';

interface CorrectionHighlight {
  type: 'grammar' | 'expression' | 'spelling';
  original: string;
  suggestion: string;
  explanation: string;
  start: number;
  end: number;
}

const STORAGE_KEY_PREFIX = 'amobe_writing_';

const WritingModule: React.FC = () => {
  const { state } = useApp();
  const { generateJSON } = useGemini();

  const [selectedType, setSelectedType] = useState<WritingType | null>(null);
  const [prompt, setPrompt] = useState<WritingPrompt | null>(null);
  const [text, setText] = useState('');
  const [feedback, setFeedback] = useState<WritingFeedback | null>(null);
  const [corrections, setCorrections] = useState<CorrectionHighlight[]>([]);
  const [selectedCorrection, setSelectedCorrection] = useState<CorrectionHighlight | null>(null);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [isGettingFeedback, setIsGettingFeedback] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const writingTypes = [
    {
      type: 'diary' as WritingType,
      icon: BookOpen,
      title: '일기',
      description: '오늘 있었던 일이나 감정을 영어로 표현해보세요.',
    },
    {
      type: 'email' as WritingType,
      icon: Mail,
      title: '이메일',
      description: '비즈니스 또는 일상적인 이메일을 작성해보세요.',
    },
    {
      type: 'essay' as WritingType,
      icon: FileText,
      title: '에세이',
      description: '주어진 주제에 대한 의견을 논리적으로 전개해보세요.',
    },
  ];

  // Load saved text from localStorage
  useEffect(() => {
    if (selectedType && prompt) {
      const savedData = localStorage.getItem(`${STORAGE_KEY_PREFIX}${prompt.id}`);
      if (savedData) {
        try {
          const { text: savedText, timestamp } = JSON.parse(savedData);
          setText(savedText);
          setLastSaved(new Date(timestamp));
        } catch (e) {
          console.error('Failed to load saved text:', e);
        }
      }
    }
  }, [selectedType, prompt]);

  // Auto-save to localStorage
  useEffect(() => {
    if (!prompt || !text.trim()) return;

    const timeoutId = setTimeout(() => {
      localStorage.setItem(
        `${STORAGE_KEY_PREFIX}${prompt.id}`,
        JSON.stringify({ text, timestamp: new Date().toISOString() })
      );
      setLastSaved(new Date());
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [text, prompt]);

  const wordCount = useMemo(() => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  }, [text]);

  const charCount = useMemo(() => {
    return text.length;
  }, [text]);

  const generateWritingPrompt = useCallback(
    async (type: WritingType) => {
      setIsGeneratingPrompt(true);
      setSelectedType(type);
      setText('');
      setFeedback(null);
      setCorrections([]);

      const level = state.userProfile?.level || 'intermediate';
      const typeKorean = type === 'diary' ? '일기' : type === 'email' ? '이메일' : '에세이';

      const promptText = `Generate a writing prompt for Korean English learners.
Type: ${type}
Level: ${level}

Return JSON:
{
  "id": "unique-id-${Date.now()}",
  "type": "${type}",
  "topic": "Topic in English",
  "guide": "Detailed writing guide in Korean (what to include, structure suggestions, useful expressions)",
  "level": "${level}"
}

For ${typeKorean}:
${type === 'diary' ? 'Topics about daily life, feelings, special events, goals' : ''}
${type === 'email' ? 'Scenarios like job application, inquiry, complaint, thank you, invitation' : ''}
${type === 'essay' ? 'Argumentative topics about technology, environment, education, society' : ''}

Make the guide specific and helpful with:
- Suggested structure
- Key phrases to use
- Common mistakes to avoid
- Word count recommendation`;

      try {
        const result = await generateJSON<WritingPrompt>(
          promptText,
          'You are an English writing teacher for Korean students. Create engaging and level-appropriate writing prompts.'
        );
        if (result) {
          setPrompt(result);
        }
      } catch (error) {
        console.error('Failed to generate prompt:', error);
      } finally {
        setIsGeneratingPrompt(false);
      }
    },
    [generateJSON, state.userProfile?.level]
  );

  const getFeedback = useCallback(async () => {
    if (!text.trim() || !prompt) return;

    setIsGettingFeedback(true);
    setFeedback(null);
    setCorrections([]);

    const feedbackPrompt = `Analyze and correct this English writing from a Korean learner.

Writing Type: ${prompt.type}
Topic: ${prompt.topic}
User's Level: ${prompt.level}

User's Text:
"""
${text}
"""

Provide comprehensive feedback. Return JSON:
{
  "original": "${text.replace(/"/g, '\\"').replace(/\n/g, '\\n')}",
  "corrected": "The fully corrected version of the text",
  "errors": [
    {
      "type": "grammar" | "expression" | "spelling",
      "original": "the incorrect part exactly as written",
      "suggestion": "the corrected version",
      "explanation": "Korean explanation of why this is wrong and how to fix it",
      "position": { "start": number, "end": number }
    }
  ],
  "overallScore": number (0-100)
}

Error types:
- grammar: grammatical errors (tense, agreement, articles, etc.)
- expression: awkward or unnatural expressions that could be improved
- spelling: spelling mistakes

Be thorough but encouraging. Explain each correction in Korean.
The position.start and position.end should be character indices in the original text.`;

    try {
      const result = await generateJSON<WritingFeedback>(
        feedbackPrompt,
        'You are a professional English writing tutor specializing in helping Korean learners. Provide detailed, constructive feedback.'
      );

      if (result) {
        setFeedback(result);

        // Convert errors to highlights
        const highlights: CorrectionHighlight[] = result.errors.map((error) => ({
          type: error.type,
          original: error.original,
          suggestion: error.suggestion,
          explanation: error.explanation,
          start: error.position.start,
          end: error.position.end,
        }));
        setCorrections(highlights);
        setShowComparison(true);
      }
    } catch (error) {
      console.error('Failed to get feedback:', error);
    } finally {
      setIsGettingFeedback(false);
    }
  }, [text, prompt, generateJSON]);

  const renderHighlightedText = useCallback(
    (originalText: string, highlights: CorrectionHighlight[]) => {
      if (highlights.length === 0) {
        return <span>{originalText}</span>;
      }

      // Sort highlights by start position
      const sortedHighlights = [...highlights].sort((a, b) => a.start - b.start);
      const elements: React.ReactNode[] = [];
      let lastIndex = 0;

      sortedHighlights.forEach((highlight, idx) => {
        // Add text before this highlight
        if (highlight.start > lastIndex) {
          elements.push(
            <span key={`text-${idx}`}>{originalText.slice(lastIndex, highlight.start)}</span>
          );
        }

        // Add highlighted text
        const highlightClass =
          highlight.type === 'grammar'
            ? 'bg-red-100 dark:bg-red-900/30 border-b-2 border-red-500 cursor-pointer'
            : highlight.type === 'expression'
              ? 'bg-green-100 dark:bg-green-900/30 border-b-2 border-green-500 cursor-pointer'
              : 'bg-yellow-100 dark:bg-yellow-900/30 border-b-2 border-yellow-500 cursor-pointer';

        elements.push(
          <span
            key={`highlight-${idx}`}
            className={`${highlightClass} px-0.5 rounded transition-colors hover:opacity-80`}
            onClick={() => setSelectedCorrection(highlight)}
            title={`${highlight.type}: ${highlight.suggestion}`}
          >
            {highlight.original}
          </span>
        );

        lastIndex = highlight.end;
      });

      // Add remaining text
      if (lastIndex < originalText.length) {
        elements.push(<span key="text-end">{originalText.slice(lastIndex)}</span>);
      }

      return <>{elements}</>;
    },
    []
  );

  const handleReset = useCallback(() => {
    setSelectedType(null);
    setPrompt(null);
    setText('');
    setFeedback(null);
    setCorrections([]);
    setSelectedCorrection(null);
    setShowComparison(false);
  }, []);

  if (!selectedType) {
    return (
      <Card className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <PenTool className="w-16 h-16 mx-auto text-blue-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            영작문 학습
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            작문 유형을 선택하고 AI 첨삭을 받아보세요.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {writingTypes.map(({ type, icon: Icon, title, description }) => (
            <button
              key={type}
              className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left group"
              onClick={() => generateWritingPrompt(type)}
            >
              <Icon className="w-10 h-10 text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                {title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
            </button>
          ))}
        </div>
      </Card>
    );
  }

  if (isGeneratingPrompt) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="작문 주제를 생성하고 있습니다..." />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`p-3 rounded-lg ${
                selectedType === 'diary'
                  ? 'bg-purple-100 dark:bg-purple-900/30'
                  : selectedType === 'email'
                    ? 'bg-blue-100 dark:bg-blue-900/30'
                    : 'bg-green-100 dark:bg-green-900/30'
              }`}
            >
              {selectedType === 'diary' && <BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />}
              {selectedType === 'email' && <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
              {selectedType === 'essay' && <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                {selectedType === 'diary' ? '일기' : selectedType === 'email' ? '이메일' : '에세이'} 작성
              </h2>
              {prompt && (
                <p className="text-gray-600 dark:text-gray-400">{prompt.topic}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateWritingPrompt(selectedType)}
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              새 주제
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <X className="w-4 h-4 mr-1" />
              유형 변경
            </Button>
          </div>
        </div>
      </Card>

      {/* Writing Guide */}
      {prompt && (
        <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                작성 가이드
              </h3>
              <p className="text-yellow-700 dark:text-yellow-300 whitespace-pre-line text-sm">
                {prompt.guide}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Main Content Area */}
      <div className={`grid ${showComparison && feedback ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'} gap-6`}>
        {/* Writing Editor */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 dark:text-white">
              {feedback ? '원본' : '작성하기'}
            </h3>
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span>{wordCount} 단어</span>
              <span>{charCount} 글자</span>
              {lastSaved && (
                <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <Save className="w-3 h-3" />
                  자동 저장됨
                </span>
              )}
            </div>
          </div>

          {feedback ? (
            <div className="min-h-[300px] p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {renderHighlightedText(text, corrections)}
              </p>
            </div>
          ) : (
            <textarea
              className="w-full min-h-[300px] p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="영어로 작성해보세요..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          )}

          {/* Legend */}
          {feedback && corrections.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-4 h-1 bg-red-500 rounded"></span>
                <span className="text-gray-600 dark:text-gray-400">문법 오류</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-1 bg-green-500 rounded"></span>
                <span className="text-gray-600 dark:text-gray-400">표현 개선</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-1 bg-yellow-500 rounded"></span>
                <span className="text-gray-600 dark:text-gray-400">철자 오류</span>
              </div>
            </div>
          )}

          {!feedback && (
            <div className="mt-4 flex justify-end">
              <Button
                onClick={getFeedback}
                loading={isGettingFeedback}
                disabled={wordCount < 5}
              >
                <Send className="w-4 h-4 mr-2" />
                첨삭 받기
              </Button>
            </div>
          )}
        </Card>

        {/* Corrected Version */}
        {showComparison && feedback && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 dark:text-white">
                교정본
              </h3>
              <div className="flex items-center gap-2">
                <span
                  className={`text-lg font-bold ${
                    feedback.overallScore >= 80
                      ? 'text-green-600'
                      : feedback.overallScore >= 60
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  }`}
                >
                  {feedback.overallScore}점
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowComparison(!showComparison)}
                >
                  {showComparison ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="min-h-[300px] p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {feedback.corrected}
              </p>
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setText(feedback.corrected);
                  setFeedback(null);
                  setCorrections([]);
                  setShowComparison(false);
                }}
              >
                교정본으로 수정하기
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setFeedback(null);
                  setCorrections([]);
                  setShowComparison(false);
                }}
              >
                다시 작성하기
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Correction Details */}
      {feedback && corrections.length > 0 && (
        <Card>
          <h3 className="font-semibold text-gray-800 dark:text-white mb-4">
            교정 내용 ({corrections.length}개)
          </h3>
          <div className="space-y-4">
            {corrections.map((correction, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border ${
                  selectedCorrection === correction
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                } cursor-pointer transition-colors`}
                onClick={() =>
                  setSelectedCorrection(selectedCorrection === correction ? null : correction)
                }
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        correction.type === 'grammar'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : correction.type === 'expression'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}
                    >
                      {correction.type === 'grammar'
                        ? '문법'
                        : correction.type === 'expression'
                          ? '표현'
                          : '철자'}
                    </span>
                  </div>
                  {correction.type === 'grammar' ? (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <span className="text-red-600 dark:text-red-400 line-through">
                    {correction.original}
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    {correction.suggestion}
                  </span>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {correction.explanation}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Score Summary */}
      {feedback && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              작문 평가 결과
            </h3>
            <div className="flex justify-center items-center gap-8">
              <div>
                <div
                  className={`text-5xl font-bold ${
                    feedback.overallScore >= 80
                      ? 'text-green-600'
                      : feedback.overallScore >= 60
                        ? 'text-yellow-600'
                        : 'text-red-600'
                  }`}
                >
                  {feedback.overallScore}
                </div>
                <div className="text-gray-500 dark:text-gray-400 text-sm mt-1">종합 점수</div>
              </div>
              <div className="h-16 w-px bg-gray-300 dark:bg-gray-600"></div>
              <div className="text-left">
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                  <span className="text-gray-600 dark:text-gray-400">
                    문법 오류: {corrections.filter((c) => c.type === 'grammar').length}개
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm mt-1">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  <span className="text-gray-600 dark:text-gray-400">
                    표현 개선: {corrections.filter((c) => c.type === 'expression').length}개
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm mt-1">
                  <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                  <span className="text-gray-600 dark:text-gray-400">
                    철자 오류: {corrections.filter((c) => c.type === 'spelling').length}개
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-center gap-3">
              <Button onClick={() => generateWritingPrompt(selectedType)}>
                <RefreshCw className="w-4 h-4 mr-2" />
                새 주제로 작성하기
              </Button>
              <Button variant="outline" onClick={handleReset}>
                유형 변경
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default WritingModule;
