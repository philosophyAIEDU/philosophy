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
            ? 'bg-red-900/40 border-b-2 border-red-500/50 text-red-100 cursor-pointer'
            : highlight.type === 'expression'
              ? 'bg-green-900/40 border-b-2 border-green-500/50 text-green-100 cursor-pointer'
              : 'bg-yellow-900/40 border-b-2 border-yellow-500/50 text-yellow-100 cursor-pointer';

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
      <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8 animate-fade-in text-white">
        <div className="bg-navy-card rounded-2xl border border-gray-700 p-12 text-center shadow-xl mb-8">
          <div className="w-20 h-20 bg-accent-yellow/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <PenTool className="w-10 h-10 text-accent-yellow" />
          </div>
          <h2 className="text-3xl font-serif font-bold text-white mb-4">
            Writing Practice
          </h2>
          <p className="text-gray-400 max-w-lg mx-auto text-lg leading-relaxed">
            Choose a writing type and get AI-powered feedback and corrections.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {writingTypes.map(({ type, icon: Icon, title, description }) => (
            <button
              key={type}
              className="p-8 bg-navy-card border border-gray-700 rounded-2xl hover:border-accent-yellow hover:bg-gray-800/50 transition-all text-left group shadow-lg flex flex-col items-start gap-4"
              onClick={() => generateWritingPrompt(type)}
            >
              <div className="p-3 bg-gray-900 rounded-xl group-hover:bg-accent-yellow/20 transition-colors">
                <Icon className="w-8 h-8 text-accent-yellow group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <h3 className="text-xl font-serif font-bold text-white mb-2 group-hover:text-accent-yellow transition-colors">
                  {title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (isGeneratingPrompt) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-white">
        <LoadingSpinner size="lg" text="Generating writing topic..." />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4 animate-fade-in text-white">
      {/* Header */}
      <div className="bg-navy-card rounded-2xl border border-gray-700 p-6 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <div
            className={`p-3 rounded-xl bg-gray-800 border border-gray-700`}
          >
            {selectedType === 'diary' && <BookOpen className="w-6 h-6 text-accent-yellow" />}
            {selectedType === 'email' && <Mail className="w-6 h-6 text-accent-yellow" />}
            {selectedType === 'essay' && <FileText className="w-6 h-6 text-accent-yellow" />}
          </div>
          <div>
            <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
              {selectedType === 'diary' ? 'Diary' : selectedType === 'email' ? 'Email' : 'Essay'} Writing
            </h2>
            {prompt && (
              <p className="text-gray-400 text-sm max-w-2xl truncate">{prompt.topic}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            className="text-gray-300 border-gray-600 hover:text-white hover:bg-gray-800"
            variant="outline"
            size="sm"
            onClick={() => generateWritingPrompt(selectedType!)}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            New Topic
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="text-gray-300 border-gray-600 hover:text-white hover:bg-gray-800"
          >
            <X className="w-4 h-4 mr-2" />
            Change Type
          </Button>
        </div>
      </div>

      {/* Writing Guide */}
      {prompt && (
        <div className="bg-yellow-900/10 border border-yellow-700/30 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-yellow-900/20 rounded-lg">
              <Lightbulb className="w-6 h-6 text-yellow-500 flex-shrink-0" />
            </div>
            <div>
              <h3 className="font-bold text-yellow-500 mb-2 font-serif text-lg">
                Writing Guide
              </h3>
              <p className="text-gray-300 whitespace-pre-line text-sm leading-relaxed">
                {prompt.guide}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className={`grid ${showComparison && feedback ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'} gap-6`}>
        {/* Writing Editor */}
        <div className="bg-navy-card rounded-2xl border border-gray-700 shadow-xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/30">
            <h3 className="font-bold text-white flex items-center gap-2">
              <PenTool className="w-4 h-4 text-accent-yellow" />
              {feedback ? 'Original Text' : 'Your Writing'}
            </h3>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span className="font-mono">{wordCount} words</span>
              <span className="font-mono">{charCount} chars</span>
              {lastSaved && (
                <span className="flex items-center gap-1 text-accent-green">
                  <Save className="w-3 h-3" />
                  Saved
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 p-0">
            {feedback ? (
              <div className="min-h-[400px] p-6 bg-navy-card">
                <p className="text-gray-300 whitespace-pre-wrap leading-loose text-lg font-serif">
                  {renderHighlightedText(text, corrections)}
                </p>
              </div>
            ) : (
              <textarea
                className="w-full min-h-[400px] p-6 bg-navy-card text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-0 resize-none text-lg leading-relaxed font-serif"
                placeholder="Start writing here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                autoFocus
              />
            )}
          </div>

          <div className="p-4 border-t border-gray-800 bg-gray-900/30">
            {/* Legend */}
            {feedback && corrections.length > 0 ? (
              <div className="flex flex-wrap gap-4 text-xs uppercase tracking-wider font-bold">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-red-500 rounded-full shadow shadow-red-500/50"></span>
                  <span className="text-gray-400">Grammar</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full shadow shadow-green-500/50"></span>
                  <span className="text-gray-400">Expression</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-yellow-500 rounded-full shadow shadow-yellow-500/50"></span>
                  <span className="text-gray-400">Spelling</span>
                </div>
              </div>
            ) : (
              <div className="flex justify-end">
                <Button
                  onClick={getFeedback}
                  loading={isGettingFeedback}
                  disabled={wordCount < 5}
                  className="bg-accent-yellow hover:bg-yellow-500 text-black font-bold px-8"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Get Corrections
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Corrected Version */}
        {showComparison && feedback && (
          <div className="bg-navy-card rounded-2xl border border-gray-700 shadow-xl overflow-hidden flex flex-col h-full animate-slide-in-right">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-green-900/10">
              <h3 className="font-bold text-white flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-accent-green" />
                Corrected Version
              </h3>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xl font-bold font-mono ${feedback.overallScore >= 80
                    ? 'text-accent-green'
                    : feedback.overallScore >= 60
                      ? 'text-yellow-400'
                      : 'text-red-400'
                    }`}
                >
                  {feedback.overallScore}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowComparison(!showComparison)}
                  className="text-gray-400 hover:text-white"
                >
                  {showComparison ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="flex-1 p-6 bg-green-900/5">
              <p className="text-gray-200 whitespace-pre-wrap leading-loose text-lg font-serif">
                {feedback.corrected}
              </p>
            </div>

            <div className="p-4 border-t border-gray-800 bg-gray-900/30 flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-gray-600 text-gray-300 hover:text-white hover:bg-gray-800"
                onClick={() => {
                  setText(feedback.corrected);
                  setFeedback(null);
                  setCorrections([]);
                  setShowComparison(false);
                }}
              >
                Use Corrected Text
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-gray-600 text-gray-300 hover:text-white hover:bg-gray-800"
                onClick={() => {
                  setFeedback(null);
                  setCorrections([]);
                  setShowComparison(false);
                }}
              >
                Edit Again
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Correction Details */}
      {feedback && corrections.length > 0 && (
        <div className="bg-navy-card rounded-2xl border border-gray-700 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <h3 className="font-serif font-bold text-white text-xl">
              Correction Details <span className="text-gray-500 ml-2 text-base font-sans">({corrections.length} items)</span>
            </h3>
          </div>
          <div className="divide-y divide-gray-800">
            {corrections.map((correction, idx) => (
              <div
                key={idx}
                className={`p-6 transition-colors ${selectedCorrection === correction
                  ? 'bg-gray-800/80'
                  : 'hover:bg-gray-800/30 cursor-pointer'
                  }`}
                onClick={() =>
                  setSelectedCorrection(selectedCorrection === correction ? null : correction)
                }
              >
                <div className="flex items-start justify-between mb-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${correction.type === 'grammar'
                      ? 'bg-red-900/30 text-red-400 border border-red-800/50'
                      : correction.type === 'expression'
                        ? 'bg-green-900/30 text-green-400 border border-green-800/50'
                        : 'bg-yellow-900/30 text-yellow-400 border border-yellow-800/50'
                      }`}
                  >
                    {correction.type}
                  </span>
                  {correction.type === 'grammar' ? (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4 p-4 bg-gray-900/50 rounded-xl">
                  <span className="text-red-400 line-through decoration-red-500/50 decoration-2">
                    {correction.original}
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-500 rotate-90 md:rotate-0" />
                  <span className="text-green-400 font-bold bg-green-900/20 px-2 py-1 rounded">
                    {correction.suggestion}
                  </span>
                </div>

                <p className="text-gray-300 text-sm leading-relaxed">
                  {correction.explanation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Score Summary */}
      {feedback && (
        <div className="bg-gradient-to-r from-gray-900 to-navy-card border border-gray-700 rounded-2xl p-8 text-center shadow-xl">
          <h3 className="text-2xl font-serif font-bold text-white mb-8">
            Analysis Summary
          </h3>
          <div className="flex flex-col md:flex-row justify-center items-center gap-12">
            <div className="relative group">
              <div className="absolute inset-0 bg-accent-yellow/20 blur-xl rounded-full opacity-50 group-hover:opacity-80 transition-opacity"></div>
              <div
                className={`relative text-6xl font-black font-mono tracking-tighter ${feedback.overallScore >= 80
                  ? 'text-accent-green'
                  : feedback.overallScore >= 60
                    ? 'text-accent-yellow'
                    : 'text-red-400'
                  }`}
              >
                {feedback.overallScore}
              </div>
              <div className="text-gray-400 text-sm mt-2 uppercase tracking-widest font-bold">Overall Score</div>
            </div>

            <div className="h-px w-full md:w-px md:h-24 bg-gray-700"></div>

            <div className="text-left space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 shadow-lg shadow-red-500/50"></div>
                <span className="text-gray-300 text-lg">
                  Grammar: <span className="font-bold text-white">{corrections.filter((c) => c.type === 'grammar').length}</span>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-lg shadow-green-500/50"></div>
                <span className="text-gray-300 text-lg">
                  Expression: <span className="font-bold text-white">{corrections.filter((c) => c.type === 'expression').length}</span>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/50"></div>
                <span className="text-gray-300 text-lg">
                  Spelling: <span className="font-bold text-white">{corrections.filter((c) => c.type === 'spelling').length}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col md:flex-row justify-center gap-4">
            <Button
              onClick={() => generateWritingPrompt(selectedType!)}
              className="bg-accent-yellow hover:bg-yellow-500 text-black font-bold py-3 px-8 text-lg"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              New Topic
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              className="border-gray-600 text-gray-300 hover:text-white hover:bg-gray-800 py-3 px-8 text-lg"
            >
              Change Type
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WritingModule;
