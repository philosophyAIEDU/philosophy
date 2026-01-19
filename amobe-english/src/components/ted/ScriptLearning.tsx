import React, { useState, useEffect } from 'react';
import {
  X, BookOpen, Headphones, Mic, PenTool, MessageSquare,
  Pause, SkipBack, SkipForward, Volume2, Check,
  ChevronLeft, ChevronRight, Sparkles, Loader2, Eye, EyeOff,
  CheckCircle2, Circle, Lightbulb, RefreshCw
} from 'lucide-react';
import tedService from '../../services/tedService';
import geminiService from '../../services/geminiService';
import type { TedVideo, TedTranscript, Subtitle, TedVocabulary, TedQuiz } from '../../types/ted';

interface ScriptLearningProps {
  video: TedVideo;
  onClose: () => void;
}

type LearningStep = 'preview' | 'listen' | 'script' | 'shadowing' | 'practice';

interface LearningProgress {
  preview: boolean;
  listen: boolean;
  script: boolean;
  shadowing: boolean;
  practice: boolean;
}

const LEARNING_STEPS: { id: LearningStep; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'preview', label: '미리보기', icon: <BookOpen className="w-4 h-4" />, description: '핵심 어휘를 먼저 학습합니다' },
  { id: 'listen', label: '1차 청취', icon: <Headphones className="w-4 h-4" />, description: '자막 없이 전체 흐름을 파악합니다' },
  { id: 'script', label: '스크립트', icon: <PenTool className="w-4 h-4" />, description: '문장을 분석하고 표현을 학습합니다' },
  { id: 'shadowing', label: '쉐도잉', icon: <Mic className="w-4 h-4" />, description: '원어민 발음을 따라 말합니다' },
  { id: 'practice', label: '실전연습', icon: <MessageSquare className="w-4 h-4" />, description: '받아쓰기와 요약으로 마무리합니다' },
];

export const ScriptLearning: React.FC<ScriptLearningProps> = ({ video, onClose }) => {
  const [currentStep, setCurrentStep] = useState<LearningStep>('preview');
  const [transcript, setTranscript] = useState<TedTranscript | undefined>(
    tedService.getTranscript(video.id)
  );
  const [vocabulary, setVocabulary] = useState<TedVocabulary[]>(
    tedService.getVocabulary(video.id)
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<LearningProgress>({
    preview: false, listen: false, script: false, shadowing: false, practice: false
  });

  // Preview state
  const [learnedWords, setLearnedWords] = useState<Set<string>>(new Set());

  // Script study state
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);

  // Shadowing state
  const [shadowingIndex, setShadowingIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Practice state
  const [practiceMode, setPracticeMode] = useState<'dictation' | 'summary'>('dictation');
  const [dictationInput, setDictationInput] = useState('');
  const [dictationIndex, setDictationIndex] = useState(0);
  const [showDictationAnswer, setShowDictationAnswer] = useState(false);
  const [summaryInput, setSummaryInput] = useState('');
  const [summaryFeedback, setSummaryFeedback] = useState<string | null>(null);
  const [isCheckingSummary, setIsCheckingSummary] = useState(false);

  // TTS voices state
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    loadVoices();

    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const generateContent = async () => {
    if (!geminiService.isInitialized()) {
      setError('API Key가 설정되지 않았습니다. 설정에서 Gemini API Key를 입력해주세요.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Generate transcript
      const transcriptPrompt = `Generate a TED Talk transcript for:
Title: "${video.title}"
Speaker: ${video.speaker}
Description: ${video.description}
Duration: ${Math.floor(video.duration / 60)} minutes

Create an engaging transcript with 15-20 sentences.`;

      const transcriptInstruction = `You are a TED Talk transcript generator.
Return ONLY valid JSON (no markdown):
{
  "subtitles": [
    {"id": "s1", "startTime": 0, "endTime": 8, "text": "English sentence", "translation": "한글 번역"}
  ],
  "fullText": "Full text here"
}
- Each subtitle 5-15 seconds
- Natural speech patterns
- Accurate Korean translations`;

      const transcriptResult = await geminiService.generateJSON<{
        subtitles: Subtitle[];
        fullText: string;
      }>(transcriptPrompt, transcriptInstruction);

      const newTranscript: TedTranscript = {
        videoId: video.id,
        language: 'en',
        subtitles: transcriptResult.subtitles,
        fullText: transcriptResult.fullText
      };
      tedService.addTranscript(newTranscript);
      setTranscript(newTranscript);

      // Generate vocabulary
      const vocabPrompt = `Extract 8-10 key vocabulary words for learning English from a TED talk about "${video.title}" by ${video.speaker}.
Topic: ${video.description}
Tags: ${video.tags.join(', ')}`;

      const vocabInstruction = `Extract important English vocabulary for ESL learners.
Return ONLY valid JSON array (no markdown):
[
  {
    "word": "vulnerability",
    "pronunciation": "/ˌvʌlnərəˈbɪləti/",
    "meaning": "the quality of being open to emotional harm",
    "meaningKo": "취약성, 연약함",
    "partOfSpeech": "noun",
    "exampleFromVideo": "Example sentence using this word",
    "timestamp": 0,
    "level": "intermediate"
  }
]
- Include pronunciation in IPA
- Both English and Korean meanings
- Relevant example sentences
- Mix of beginner/intermediate/advanced words`;

      const vocabResult = await geminiService.generateJSON<TedVocabulary[]>(
        vocabPrompt, vocabInstruction
      );

      vocabResult.forEach(v => tedService.addVocabulary(video.id, v));
      setVocabulary(vocabResult);

      // Generate quizzes
      const quizPrompt = `Create 5 comprehension quiz questions for a TED talk:
Title: "${video.title}"
Speaker: ${video.speaker}
Description: ${video.description}`;

      const quizInstruction = `Create quiz questions for ESL learners.
Return ONLY valid JSON array (no markdown):
[
  {
    "id": "q1",
    "videoId": "${video.id}",
    "type": "comprehension",
    "question": "What is the main message of this talk?",
    "questionKo": "이 강연의 주요 메시지는 무엇인가요?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Explanation in English",
    "explanationKo": "한글 설명"
  }
]
- Create 5 questions
- Mix of comprehension, vocabulary, and listening questions
- Include Korean translations
- Provide clear explanations`;

      const quizResult = await geminiService.generateJSON<TedQuiz[]>(
        quizPrompt, quizInstruction
      );

      quizResult.forEach(q => tedService.addQuiz(q));

    } catch (err) {
      console.error('Content generation error:', err);
      setError(geminiService.handleError(err));
    } finally {
      setIsGenerating(false);
    }
  };

  const markStepComplete = (step: LearningStep) => {
    setProgress(prev => ({ ...prev, [step]: true }));
  };

  const speakText = (text: string, rate: number = 0.9) => {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported');
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = rate;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Try to find an English voice
    const englishVoices = voices.filter(v =>
      v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Microsoft') || v.name.includes('Samantha') || v.name.includes('Daniel'))
    );

    if (englishVoices.length > 0) {
      utterance.voice = englishVoices[0];
    } else {
      // Fallback to any English voice
      const anyEnglish = voices.find(v => v.lang.startsWith('en'));
      if (anyEnglish) {
        utterance.voice = anyEnglish;
      }
    }

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = (e) => {
      console.error('Speech error:', e);
      setIsPlaying(false);
    };

    // Small delay to ensure voices are loaded
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 100);
  };

  const checkSummary = async () => {
    if (!summaryInput.trim() || !geminiService.isInitialized()) return;

    setIsCheckingSummary(true);
    try {
      const prompt = `A student summarized this TED talk:
Original topic: "${video.title}" by ${video.speaker}
Student's summary: "${summaryInput}"

Provide feedback in Korean on:
1. Content accuracy (내용 정확성)
2. Key points covered (핵심 포인트)
3. Grammar/expression tips (문법/표현 조언)
4. Encouragement (격려)

Keep feedback concise and helpful.`;

      const feedback = await geminiService.generateText(prompt);
      setSummaryFeedback(feedback);
    } catch (err) {
      setSummaryFeedback('피드백을 가져오는데 실패했습니다.');
    } finally {
      setIsCheckingSummary(false);
    }
  };

  // Check if we need to generate content
  const needsContent = !transcript || vocabulary.length === 0;

  const renderPreviewStep = () => (
    <div className="space-y-6">
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-400 mb-1">학습 팁</h4>
            <p className="text-sm text-slate-300">
              영상을 보기 전에 핵심 어휘를 먼저 익혀두면 내용 이해가 훨씬 쉬워집니다.
              각 단어를 클릭해서 발음을 들어보고, 뜻을 확인하세요.
            </p>
          </div>
        </div>
      </div>

      {needsContent ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">학습 자료가 필요합니다</h3>
          <p className="text-slate-400 mb-6">AI가 이 영상에 맞는 스크립트, 어휘, 퀴즈를 생성합니다.</p>
          {!isGenerating && (
            <button
              onClick={generateContent}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-medium rounded-xl transition-all shadow-lg shadow-purple-500/25"
            >
              <Sparkles className="w-5 h-5" />
              AI로 학습 자료 생성하기
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {vocabulary.map((vocab, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border transition-all ${
                learnedWords.has(vocab.word)
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <button
                      onClick={() => speakText(vocab.word)}
                      className="flex items-center gap-2 hover:text-blue-400 transition-colors"
                    >
                      <Volume2 className="w-4 h-4 text-blue-400" />
                      <span className="text-lg font-semibold text-white">{vocab.word}</span>
                    </button>
                    <span className="text-xs text-slate-500">{vocab.pronunciation}</span>
                    <span className="px-2 py-0.5 bg-slate-700/50 rounded text-xs text-slate-400">
                      {vocab.partOfSpeech}
                    </span>
                  </div>
                  <p className="text-sm text-blue-400 mb-1">{vocab.meaning}</p>
                  <p className="text-sm text-slate-400">{vocab.meaningKo}</p>
                  <p className="text-xs text-slate-500 mt-2 italic">"{vocab.exampleFromVideo}"</p>
                </div>
                <button
                  onClick={() => {
                    setLearnedWords(prev => {
                      const newSet = new Set(prev);
                      if (newSet.has(vocab.word)) newSet.delete(vocab.word);
                      else newSet.add(vocab.word);
                      return newSet;
                    });
                  }}
                  className={`p-2 rounded-lg transition-colors ${
                    learnedWords.has(vocab.word)
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-slate-700/50 text-slate-400 hover:text-white'
                  }`}
                >
                  {learnedWords.has(vocab.word) ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!needsContent && learnedWords.size >= Math.ceil(vocabulary.length * 0.5) && (
        <div className="flex justify-center">
          <button
            onClick={() => { markStepComplete('preview'); setCurrentStep('listen'); }}
            className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl transition-colors"
          >
            다음 단계로 →
          </button>
        </div>
      )}
    </div>
  );

  const renderListenStep = () => (
    <div className="space-y-6">
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-amber-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-400 mb-1">학습 팁</h4>
            <p className="text-sm text-slate-300">
              자막 없이 영상을 한 번 시청하세요. 모든 것을 이해할 필요는 없습니다.
              전체적인 흐름과 분위기, 연사의 톤을 파악하는 것이 목표입니다.
            </p>
          </div>
        </div>
      </div>

      <div className="aspect-video bg-slate-800 rounded-xl overflow-hidden">
        <iframe
          src={`${video.videoUrl}?rel=0&modestbranding=1`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      <div className="bg-slate-800/50 rounded-xl p-4">
        <h4 className="font-medium text-white mb-3">시청 후 체크리스트</h4>
        <div className="space-y-2 text-sm">
          {[
            '영상의 전체적인 주제를 파악했나요?',
            '연사의 말하는 속도와 톤은 어땠나요?',
            '미리 학습한 어휘가 들렸나요?',
            '인상적인 부분이 있었나요?'
          ].map((item, idx) => (
            <label key={idx} className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input type="checkbox" className="rounded bg-slate-700 border-slate-600" />
              <span>{item}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={() => { markStepComplete('listen'); setCurrentStep('script'); }}
          className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl transition-colors"
        >
          다음 단계로 →
        </button>
      </div>
    </div>
  );

  const renderScriptStep = () => {
    if (!transcript) return (
      <div className="text-center py-12">
        <p className="text-slate-400 mb-4">스크립트가 없습니다.</p>
        {!isGenerating && (
          <button
            onClick={generateContent}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-400 rounded-lg"
          >
            <Sparkles className="w-4 h-4" />
            AI로 스크립트 생성
          </button>
        )}
      </div>
    );

    const currentSentence = transcript.subtitles[currentSentenceIndex];

    return (
      <div className="space-y-6">
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-green-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-400 mb-1">학습 팁</h4>
              <p className="text-sm text-slate-300">
                문장을 하나씩 읽으며 의미를 파악하세요. 스피커 버튼을 눌러 발음을 들어보세요.
              </p>
            </div>
          </div>
        </div>

        {/* Sentence Navigator */}
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span>문장 {currentSentenceIndex + 1} / {transcript.subtitles.length}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentSentenceIndex(Math.max(0, currentSentenceIndex - 1))}
              disabled={currentSentenceIndex === 0}
              className="p-1 hover:bg-slate-700/50 rounded disabled:opacity-30"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentSentenceIndex(Math.min(transcript.subtitles.length - 1, currentSentenceIndex + 1))}
              disabled={currentSentenceIndex === transcript.subtitles.length - 1}
              className="p-1 hover:bg-slate-700/50 rounded disabled:opacity-30"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Current Sentence Card */}
        <div className="bg-slate-800/70 rounded-2xl p-6 border border-slate-700/50">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => speakText(currentSentence.text)}
              className="p-3 bg-blue-500/20 hover:bg-blue-500/30 rounded-xl text-blue-400 transition-colors"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <span className="text-sm text-slate-400">클릭해서 발음 듣기</span>
          </div>

          <p className="text-xl text-white leading-relaxed mb-4">{currentSentence.text}</p>

          <button
            onClick={() => setShowTranslation(!showTranslation)}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-3"
          >
            {showTranslation ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showTranslation ? '번역 숨기기' : '번역 보기'}
          </button>

          {showTranslation && currentSentence.translation && (
            <p className="text-slate-400 bg-slate-700/30 rounded-lg p-3">{currentSentence.translation}</p>
          )}
        </div>

        {/* All Sentences List */}
        <div className="bg-slate-800/30 rounded-xl p-4 max-h-64 overflow-y-auto">
          <h4 className="text-sm font-medium text-slate-400 mb-3">전체 스크립트</h4>
          <div className="space-y-2">
            {transcript.subtitles.map((sub, idx) => (
              <div
                key={sub.id}
                onClick={() => setCurrentSentenceIndex(idx)}
                className={`p-3 rounded-lg cursor-pointer transition-all ${
                  idx === currentSentenceIndex
                    ? 'bg-blue-500/20 border border-blue-500/30'
                    : 'hover:bg-slate-700/50'
                }`}
              >
                <p className={`text-sm ${idx === currentSentenceIndex ? 'text-white' : 'text-slate-400'}`}>
                  {sub.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {currentSentenceIndex >= transcript.subtitles.length - 1 && (
          <div className="flex justify-center">
            <button
              onClick={() => { markStepComplete('script'); setCurrentStep('shadowing'); }}
              className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl transition-colors"
            >
              다음 단계로 →
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderShadowingStep = () => {
    if (!transcript) return null;

    const currentSentence = transcript.subtitles[shadowingIndex];

    return (
      <div className="space-y-6">
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-purple-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-purple-400 mb-1">쉐도잉 방법</h4>
              <p className="text-sm text-slate-300">
                1. 스피커 버튼을 눌러 문장을 듣습니다 → 2. 바로 따라 말합니다 → 3. 억양과 리듬을 모방합니다.
              </p>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">문장 {shadowingIndex + 1} / {transcript.subtitles.length}</span>
          <div className="flex-1 mx-4 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 transition-all"
              style={{ width: `${((shadowingIndex + 1) / transcript.subtitles.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Shadowing Card */}
        <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-2xl p-8 border border-purple-500/20">
          <p className="text-2xl text-white text-center leading-relaxed mb-6">
            {currentSentence.text}
          </p>

          <p className="text-center text-slate-400 mb-6">{currentSentence.translation}</p>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => speakText(currentSentence.text, 0.7)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
            >
              <Volume2 className="w-4 h-4" />
              느리게
            </button>
            <button
              onClick={() => speakText(currentSentence.text, 1.0)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium transition-colors ${
                isPlaying
                  ? 'bg-purple-600'
                  : 'bg-purple-500 hover:bg-purple-600'
              }`}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              {isPlaying ? '재생 중...' : '듣고 따라하기'}
            </button>
            <button
              onClick={() => speakText(currentSentence.text, 1.2)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
            >
              <Volume2 className="w-4 h-4" />
              빠르게
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShadowingIndex(Math.max(0, shadowingIndex - 1))}
            disabled={shadowingIndex === 0}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-slate-300 disabled:opacity-30 transition-colors"
          >
            <SkipBack className="w-4 h-4" />
            이전
          </button>

          {shadowingIndex < transcript.subtitles.length - 1 ? (
            <button
              onClick={() => setShadowingIndex(shadowingIndex + 1)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white transition-colors"
            >
              다음
              <SkipForward className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => { markStepComplete('shadowing'); setCurrentStep('practice'); }}
              className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl transition-colors"
            >
              다음 단계로 →
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderPracticeStep = () => {
    if (!transcript) return null;

    const dictationSentence = transcript.subtitles[dictationIndex];

    return (
      <div className="space-y-6">
        {/* Mode Toggle */}
        <div className="flex gap-2 p-1 bg-slate-800/50 rounded-xl">
          <button
            onClick={() => setPracticeMode('dictation')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors ${
              practiceMode === 'dictation' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <PenTool className="w-4 h-4" />
            받아쓰기
          </button>
          <button
            onClick={() => setPracticeMode('summary')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors ${
              practiceMode === 'summary' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            요약하기
          </button>
        </div>

        {practiceMode === 'dictation' ? (
          <div className="space-y-6">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-blue-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-400 mb-1">받아쓰기 연습</h4>
                  <p className="text-sm text-slate-300">
                    스피커 버튼을 눌러 음성을 듣고, 들리는 대로 영어로 받아쓰세요.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-sm text-slate-400 text-center">
              문장 {dictationIndex + 1} / {transcript.subtitles.length}
            </div>

            <div className="bg-slate-800/70 rounded-2xl p-6">
              <div className="flex items-center justify-center gap-4 mb-6">
                <button
                  onClick={() => speakText(dictationSentence.text, 0.8)}
                  className={`p-4 rounded-xl transition-colors ${
                    isPlaying
                      ? 'bg-blue-500 text-white'
                      : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400'
                  }`}
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                </button>
                <p className="text-slate-400 text-sm">
                  {isPlaying ? '재생 중...' : '클릭해서 듣기'}
                </p>
              </div>

              <textarea
                value={dictationInput}
                onChange={(e) => setDictationInput(e.target.value)}
                placeholder="들리는 대로 영어로 적어보세요..."
                className="w-full h-24 p-4 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 resize-none"
              />

              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={() => setShowDictationAnswer(!showDictationAnswer)}
                  className="text-sm text-slate-400 hover:text-white transition-colors"
                >
                  {showDictationAnswer ? '정답 숨기기' : '정답 보기'}
                </button>
                <button
                  onClick={() => {
                    setDictationInput('');
                    setShowDictationAnswer(false);
                    if (dictationIndex < transcript.subtitles.length - 1) {
                      setDictationIndex(dictationIndex + 1);
                    }
                  }}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white transition-colors"
                >
                  다음 문장
                </button>
              </div>

              {showDictationAnswer && (
                <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                  <p className="text-green-400 text-sm mb-1">정답:</p>
                  <p className="text-white">{dictationSentence.text}</p>
                  <p className="text-slate-400 text-sm mt-2">{dictationSentence.translation}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-orange-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-orange-400 mb-1">요약하기 연습</h4>
                  <p className="text-sm text-slate-300">
                    영상의 핵심 내용을 영어로 요약해보세요. AI가 피드백을 제공합니다.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/70 rounded-2xl p-6">
              <h4 className="font-medium text-white mb-2">"{video.title}"</h4>
              <p className="text-sm text-slate-400 mb-4">by {video.speaker}</p>

              <textarea
                value={summaryInput}
                onChange={(e) => setSummaryInput(e.target.value)}
                placeholder="Write a summary of this TED talk in English... (3-5 sentences)"
                className="w-full h-32 p-4 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 resize-none"
              />

              <div className="flex justify-end mt-4">
                <button
                  onClick={checkSummary}
                  disabled={!summaryInput.trim() || isCheckingSummary}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 rounded-lg text-white transition-colors"
                >
                  {isCheckingSummary ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  AI 피드백 받기
                </button>
              </div>

              {summaryFeedback && (
                <div className="mt-4 p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
                  <h5 className="font-medium text-orange-400 mb-2">AI 피드백</h5>
                  <p className="text-slate-300 text-sm whitespace-pre-wrap">{summaryFeedback}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-center">
          <button
            onClick={() => markStepComplete('practice')}
            className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl transition-colors"
          >
            <Check className="w-5 h-5 inline mr-2" />
            학습 완료!
          </button>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (isGenerating) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin mb-4" />
          <p className="text-white font-medium">AI가 학습 자료를 생성하고 있습니다...</p>
          <p className="text-slate-400 text-sm mt-2">스크립트, 어휘, 퀴즈를 생성 중입니다</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-16">
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 mb-4 max-w-md mx-auto">
            {error}
          </div>
          <button
            onClick={() => setError(null)}
            className="flex items-center gap-2 mx-auto text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            다시 시도
          </button>
        </div>
      );
    }

    switch (currentStep) {
      case 'preview': return renderPreviewStep();
      case 'listen': return renderListenStep();
      case 'script': return renderScriptStep();
      case 'shadowing': return renderShadowingStep();
      case 'practice': return renderPracticeStep();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-4xl max-h-[95vh] bg-slate-900 rounded-2xl border border-slate-700/50 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl">
              <BookOpen className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="font-bold text-white">스크립트 학습</h2>
              <p className="text-xs text-slate-400 truncate max-w-[200px] sm:max-w-none">{video.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Tabs */}
        <div className="flex border-b border-slate-700/50 bg-slate-800/30 overflow-x-auto">
          {LEARNING_STEPS.map((step) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(step.id)}
              className={`flex-1 min-w-[80px] flex flex-col items-center gap-1 px-3 py-3 transition-colors relative ${
                currentStep === step.id
                  ? 'text-white bg-slate-700/50'
                  : progress[step.id]
                  ? 'text-green-400 hover:bg-slate-700/30'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700/30'
              }`}
            >
              <div className="flex items-center gap-1.5">
                {progress[step.id] ? <CheckCircle2 className="w-4 h-4" /> : step.icon}
                <span className="text-xs font-medium whitespace-nowrap">{step.label}</span>
              </div>
              {currentStep === step.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-700/50 bg-slate-800/30">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span>진행률:</span>
            <div className="flex gap-1">
              {LEARNING_STEPS.map(step => (
                <div
                  key={step.id}
                  className={`w-2 h-2 rounded-full ${
                    progress[step.id] ? 'bg-green-500' : 'bg-slate-600'
                  }`}
                />
              ))}
            </div>
            <span>{Object.values(progress).filter(Boolean).length}/5 완료</span>
          </div>

          {needsContent && !isGenerating && (
            <button
              onClick={generateContent}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-400 rounded-lg transition-colors text-sm"
            >
              <Sparkles className="w-4 h-4" />
              AI로 학습자료 생성
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScriptLearning;
