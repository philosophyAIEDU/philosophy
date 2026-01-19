import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Play, Pause, Volume2,
  Bookmark, BookmarkCheck, BookOpen, Mic,
  PenTool, MessageSquare, ChevronLeft, ChevronRight,
  Sparkles, Loader2 as LoaderIcon, Eye, EyeOff, CheckCircle2, Circle,
  Lightbulb, SkipBack, SkipForward, Check, RefreshCw
} from 'lucide-react';
import tedService from '../../services/tedService';
import geminiService from '../../services/geminiService';
import type { TedVideo, TedTranscript, Subtitle, TedVocabulary, TedQuiz } from '../../types/ted';

interface TedPlayerProps {
  video: TedVideo;
  onBack: () => void;
}

type LearningStep = 'watch' | 'preview' | 'script' | 'shadowing' | 'practice';

const LEARNING_STEPS: { id: LearningStep; label: string; icon: React.ReactNode }[] = [
  { id: 'watch', label: '영상보기', icon: <Play className="w-4 h-4" /> },
  { id: 'preview', label: '어휘학습', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'script', label: '스크립트', icon: <PenTool className="w-4 h-4" /> },
  { id: 'shadowing', label: '쉐도잉', icon: <Mic className="w-4 h-4" /> },
  { id: 'practice', label: '받아쓰기', icon: <MessageSquare className="w-4 h-4" /> },
];

export const TedPlayer: React.FC<TedPlayerProps> = ({ video, onBack }) => {
  const [currentStep, setCurrentStep] = useState<LearningStep>('watch');
  const [transcript, setTranscript] = useState<TedTranscript | undefined>(
    tedService.getTranscript(video.id)
  );
  const [vocabulary, setVocabulary] = useState<TedVocabulary[]>(
    tedService.getVocabulary(video.id)
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Learning states
  const [learnedWords, setLearnedWords] = useState<Set<string>>(new Set());
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const [shadowingIndex, setShadowingIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [dictationIndex, setDictationIndex] = useState(0);
  const [dictationInput, setDictationInput] = useState('');
  const [showDictationAnswer, setShowDictationAnswer] = useState(false);

  // TTS audio element
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [ttsLoading, setTtsLoading] = useState(false);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
      }
    };
  }, [currentAudio]);

  // Add to history
  useEffect(() => {
    tedService.addToHistory(video.id, 0);
  }, [video.id]);

  const generateContent = async () => {
    if (!geminiService.isInitialized()) {
      setError('API Key가 설정되지 않았습니다.');
      return;
    }
    setIsGenerating(true);
    setError(null);

    try {
      // Generate transcript
      const transcriptResult = await geminiService.generateJSON<{
        subtitles: Subtitle[];
        fullText: string;
      }>(`Generate a TED Talk transcript for: "${video.title}" by ${video.speaker}. Description: ${video.description}. Duration: ${Math.floor(video.duration / 60)} minutes. Create 15-20 sentences.`,
        `Return ONLY valid JSON: {"subtitles": [{"id": "s1", "startTime": 0, "endTime": 8, "text": "English sentence", "translation": "한글 번역"}], "fullText": "..."}`
      );

      const newTranscript: TedTranscript = {
        videoId: video.id,
        language: 'en',
        subtitles: transcriptResult.subtitles,
        fullText: transcriptResult.fullText
      };
      tedService.addTranscript(newTranscript);
      setTranscript(newTranscript);

      // Generate vocabulary
      const vocabResult = await geminiService.generateJSON<TedVocabulary[]>(
        `Extract 8-10 key vocabulary words from TED talk "${video.title}" about ${video.tags.join(', ')}`,
        `Return ONLY valid JSON array: [{"word": "...", "pronunciation": "/.../ ", "meaning": "...", "meaningKo": "...", "partOfSpeech": "...", "exampleFromVideo": "...", "timestamp": 0, "level": "intermediate"}]`
      );
      vocabResult.forEach(v => tedService.addVocabulary(video.id, v));
      setVocabulary(vocabResult);

      // Generate quizzes
      const quizResult = await geminiService.generateJSON<TedQuiz[]>(
        `Create 5 quiz questions for TED talk "${video.title}"`,
        `Return ONLY valid JSON array: [{"id": "q1", "videoId": "${video.id}", "type": "comprehension", "question": "...", "questionKo": "...", "options": ["A","B","C","D"], "correctAnswer": 0, "explanation": "...", "explanationKo": "..."}]`
      );
      quizResult.forEach(q => tedService.addQuiz(q));

    } catch (err) {
      setError(geminiService.handleError(err));
    } finally {
      setIsGenerating(false);
    }
  };

  const speakText = async (text: string, rate: number = 1.0) => {
    // Stop current audio if playing
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.src = '';
      setCurrentAudio(null);
    }

    if (isPlaying) {
      setIsPlaying(false);
      return;
    }

    setTtsLoading(true);
    setIsPlaying(true);

    try {
      // Use Gemini TTS API
      const audioUrl = await geminiService.generateTTS(text, 'Kore');
      const audio = new Audio(audioUrl);

      // Adjust playback rate
      audio.playbackRate = rate;

      audio.onended = () => {
        setIsPlaying(false);
        setCurrentAudio(null);
      };

      audio.onerror = () => {
        setIsPlaying(false);
        setTtsLoading(false);
        setCurrentAudio(null);
        console.error('Audio playback error');
      };

      setCurrentAudio(audio);
      setTtsLoading(false);
      await audio.play();
    } catch (error) {
      console.error('TTS error:', error);
      setTtsLoading(false);
      setIsPlaying(false);

      // Fallback to Web Speech API
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = rate;
        utterance.onstart = () => setIsPlaying(true);
        utterance.onend = () => setIsPlaying(false);
        utterance.onerror = () => setIsPlaying(false);
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  const needsContent = !transcript || vocabulary.length === 0;

  const renderWatchStep = () => (
    <div className="space-y-6">
      {/* Video */}
      <div className="aspect-video bg-black rounded-xl overflow-hidden">
        <iframe
          src={`${video.videoUrl}?rel=0&modestbranding=1`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      {/* Video Info */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
        <h1 className="text-xl font-bold text-white">{video.title}</h1>
        <p className="text-red-400 font-medium mt-1">{video.speaker}</p>
        <p className="text-slate-400 text-sm mt-2">{video.description}</p>
        <div className="flex flex-wrap gap-2 mt-3">
          {video.tags.map(tag => (
            <span key={tag} className="px-2 py-1 bg-slate-700/50 rounded-full text-xs text-slate-300">{tag}</span>
          ))}
        </div>
      </div>

      {/* Start Learning Button */}
      {needsContent ? (
        <div className="text-center py-8">
          <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">학습 자료 생성</h3>
          <p className="text-slate-400 mb-4">AI가 이 영상에 맞는 학습 자료를 생성합니다.</p>
          {!isGenerating ? (
            <button
              onClick={generateContent}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-medium rounded-xl"
            >
              <Sparkles className="w-5 h-5" />
              학습 자료 생성하기
            </button>
          ) : (
            <div className="flex items-center justify-center gap-2 text-purple-400">
              <LoaderIcon className="w-5 h-5 animate-spin" />
              생성 중...
            </div>
          )}
        </div>
      ) : (
        <div className="text-center">
          <button
            onClick={() => setCurrentStep('preview')}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold text-lg rounded-xl shadow-lg"
          >
            <BookOpen className="w-6 h-6" />
            학습 시작하기
          </button>
        </div>
      )}
    </div>
  );

  const handleSaveWord = (vocab: TedVocabulary) => {
    const isSaved = tedService.isWordSaved(vocab.word, video.id);
    if (isSaved) {
      tedService.removeSavedWord(vocab.word, video.id);
    } else {
      tedService.saveWord({
        word: vocab.word,
        pronunciation: vocab.pronunciation,
        meaning: vocab.meaning,
        meaningKo: vocab.meaningKo,
        videoId: video.id,
        videoTitle: video.title,
        savedAt: new Date().toISOString()
      });
    }
    // Force re-render
    setLearnedWords(prev => new Set(prev));
  };

  const handleSaveSentence = (sentence: Subtitle) => {
    const isSaved = tedService.isSentenceSaved(sentence.text, video.id);
    if (isSaved) {
      tedService.removeSavedSentence(sentence.text, video.id);
    } else {
      tedService.saveSentence({
        text: sentence.text,
        translation: sentence.translation || '',
        videoId: video.id,
        videoTitle: video.title,
        savedAt: new Date().toISOString()
      });
    }
    // Force re-render
    setCurrentSentenceIndex(prev => prev);
  };

  const renderPreviewStep = () => (
    <div className="space-y-6">
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-400 mb-1">어휘 학습</h4>
            <p className="text-sm text-slate-300">영상에 나오는 핵심 어휘를 먼저 익혀보세요. 북마크 버튼으로 저장하세요.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        {vocabulary.map((vocab, idx) => {
          const isSaved = tedService.isWordSaved(vocab.word, video.id);
          return (
            <div
              key={idx}
              className={`p-4 rounded-xl border transition-all ${
                learnedWords.has(vocab.word)
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-slate-800/50 border-slate-700/50'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <button onClick={() => speakText(vocab.word)} className="flex items-center gap-2 hover:text-blue-400">
                      <Volume2 className="w-4 h-4 text-blue-400" />
                      <span className="text-lg font-semibold text-white">{vocab.word}</span>
                    </button>
                    <span className="text-xs text-slate-500">{vocab.pronunciation}</span>
                    <span className="px-2 py-0.5 bg-slate-700/50 rounded text-xs text-slate-400">{vocab.partOfSpeech}</span>
                  </div>
                  <p className="text-sm text-blue-400 mb-1">{vocab.meaning}</p>
                  <p className="text-sm text-slate-400">{vocab.meaningKo}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleSaveWord(vocab)}
                    className={`p-2 rounded-lg transition-all ${isSaved ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-700/50 text-slate-400 hover:text-yellow-400'}`}
                    title={isSaved ? '저장됨' : '저장하기'}
                  >
                    {isSaved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => {
                      setLearnedWords(prev => {
                        const newSet = new Set(prev);
                        if (newSet.has(vocab.word)) newSet.delete(vocab.word);
                        else newSet.add(vocab.word);
                        return newSet;
                      });
                    }}
                    className={`p-2 rounded-lg ${learnedWords.has(vocab.word) ? 'bg-green-500/20 text-green-400' : 'bg-slate-700/50 text-slate-400'}`}
                    title={learnedWords.has(vocab.word) ? '학습 완료' : '학습 완료 표시'}
                  >
                    {learnedWords.has(vocab.word) ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center">
        <button
          onClick={() => setCurrentStep('script')}
          className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl"
        >
          다음: 스크립트 학습 →
        </button>
      </div>
    </div>
  );

  const renderScriptStep = () => {
    if (!transcript) return null;
    const currentSentence = transcript.subtitles[currentSentenceIndex];
    const isSentenceSaved = tedService.isSentenceSaved(currentSentence.text, video.id);

    return (
      <div className="space-y-6">
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-green-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-400 mb-1">스크립트 학습</h4>
              <p className="text-sm text-slate-300">문장을 하나씩 읽으며 의미를 파악하세요. 북마크 버튼으로 문장을 저장하세요.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-slate-400">
          <span>문장 {currentSentenceIndex + 1} / {transcript.subtitles.length}</span>
          <div className="flex gap-2">
            <button onClick={() => setCurrentSentenceIndex(Math.max(0, currentSentenceIndex - 1))} disabled={currentSentenceIndex === 0} className="p-1 hover:bg-slate-700/50 rounded disabled:opacity-30">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => setCurrentSentenceIndex(Math.min(transcript.subtitles.length - 1, currentSentenceIndex + 1))} disabled={currentSentenceIndex === transcript.subtitles.length - 1} className="p-1 hover:bg-slate-700/50 rounded disabled:opacity-30">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="bg-slate-800/70 rounded-2xl p-6 border border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button onClick={() => speakText(currentSentence.text)} disabled={ttsLoading} className="p-3 bg-blue-500/20 hover:bg-blue-500/30 rounded-xl text-blue-400 disabled:opacity-50">
                {ttsLoading ? <LoaderIcon className="w-5 h-5 animate-spin" /> : isPlaying ? <Pause className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <span className="text-sm text-slate-400">{ttsLoading ? '로딩 중...' : isPlaying ? '재생 중...' : '클릭해서 듣기'}</span>
            </div>
            <button
              onClick={() => handleSaveSentence(currentSentence)}
              className={`p-2 rounded-lg transition-all ${isSentenceSaved ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-700/50 text-slate-400 hover:text-yellow-400'}`}
              title={isSentenceSaved ? '저장됨' : '문장 저장'}
            >
              {isSentenceSaved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-xl text-white leading-relaxed mb-4">{currentSentence.text}</p>
          <button onClick={() => setShowTranslation(!showTranslation)} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-3">
            {showTranslation ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showTranslation ? '번역 숨기기' : '번역 보기'}
          </button>
          {showTranslation && currentSentence.translation && (
            <p className="text-slate-400 bg-slate-700/30 rounded-lg p-3">{currentSentence.translation}</p>
          )}
        </div>

        <div className="bg-slate-800/30 rounded-xl p-4 max-h-48 overflow-y-auto">
          <div className="space-y-2">
            {transcript.subtitles.map((sub, idx) => {
              const saved = tedService.isSentenceSaved(sub.text, video.id);
              return (
                <div
                  key={sub.id}
                  onClick={() => setCurrentSentenceIndex(idx)}
                  className={`p-2 rounded-lg cursor-pointer text-sm flex items-center justify-between ${idx === currentSentenceIndex ? 'bg-blue-500/20 text-white' : 'text-slate-400 hover:bg-slate-700/50'}`}
                >
                  <span>{sub.text}</span>
                  {saved && <BookmarkCheck className="w-4 h-4 text-yellow-400 flex-shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-center">
          <button onClick={() => setCurrentStep('shadowing')} className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl">
            다음: 쉐도잉 →
          </button>
        </div>
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
              <h4 className="font-medium text-purple-400 mb-1">쉐도잉</h4>
              <p className="text-sm text-slate-300">스피커 버튼을 눌러 듣고, 바로 따라 말해보세요.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">문장 {shadowingIndex + 1} / {transcript.subtitles.length}</span>
          <div className="flex-1 mx-4 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500" style={{ width: `${((shadowingIndex + 1) / transcript.subtitles.length) * 100}%` }} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-2xl p-8 border border-purple-500/20">
          <p className="text-2xl text-white text-center leading-relaxed mb-4">{currentSentence.text}</p>
          <p className="text-center text-slate-400 mb-6">{currentSentence.translation}</p>
          <div className="flex items-center justify-center gap-4">
            <button onClick={() => speakText(currentSentence.text, 0.7)} disabled={ttsLoading || isPlaying} className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-slate-300 disabled:opacity-50">느리게</button>
            <button onClick={() => speakText(currentSentence.text, 1.0)} disabled={ttsLoading} className={`px-6 py-3 rounded-xl text-white font-medium ${ttsLoading || isPlaying ? 'bg-purple-600' : 'bg-purple-500 hover:bg-purple-600'} disabled:opacity-70`}>
              {ttsLoading ? <LoaderIcon className="w-5 h-5 inline mr-2 animate-spin" /> : isPlaying ? <Pause className="w-5 h-5 inline mr-2" /> : <Volume2 className="w-5 h-5 inline mr-2" />}
              {ttsLoading ? '로딩 중...' : isPlaying ? '재생 중...' : '듣고 따라하기'}
            </button>
            <button onClick={() => speakText(currentSentence.text, 1.2)} disabled={ttsLoading || isPlaying} className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-slate-300 disabled:opacity-50">빠르게</button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button onClick={() => setShadowingIndex(Math.max(0, shadowingIndex - 1))} disabled={shadowingIndex === 0} className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 rounded-lg text-slate-300 disabled:opacity-30">
            <SkipBack className="w-4 h-4" />이전
          </button>
          {shadowingIndex < transcript.subtitles.length - 1 ? (
            <button onClick={() => setShadowingIndex(shadowingIndex + 1)} className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white">
              다음<SkipForward className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={() => setCurrentStep('practice')} className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl">
              다음: 받아쓰기 →
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
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-400 mb-1">받아쓰기</h4>
              <p className="text-sm text-slate-300">스피커 버튼을 눌러 듣고, 들리는 대로 영어로 적어보세요.</p>
            </div>
          </div>
        </div>

        <div className="text-sm text-slate-400 text-center">문장 {dictationIndex + 1} / {transcript.subtitles.length}</div>

        <div className="bg-slate-800/70 rounded-2xl p-6">
          <div className="flex items-center justify-center gap-4 mb-6">
            <button onClick={() => speakText(dictationSentence.text, 0.8)} disabled={ttsLoading} className={`p-4 rounded-xl ${ttsLoading || isPlaying ? 'bg-blue-500 text-white' : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'} disabled:opacity-70`}>
              {ttsLoading ? <LoaderIcon className="w-6 h-6 animate-spin" /> : isPlaying ? <Pause className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
            </button>
            <span className="text-slate-400">{ttsLoading ? '로딩 중...' : isPlaying ? '재생 중...' : '클릭해서 듣기'}</span>
          </div>
          <textarea
            value={dictationInput}
            onChange={(e) => setDictationInput(e.target.value)}
            placeholder="들리는 대로 영어로 적어보세요..."
            className="w-full h-24 p-4 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 resize-none"
          />
          <div className="flex items-center justify-between mt-4">
            <button onClick={() => setShowDictationAnswer(!showDictationAnswer)} className="text-sm text-slate-400 hover:text-white">
              {showDictationAnswer ? '정답 숨기기' : '정답 보기'}
            </button>
            <button
              onClick={() => {
                setDictationInput('');
                setShowDictationAnswer(false);
                if (dictationIndex < transcript.subtitles.length - 1) setDictationIndex(dictationIndex + 1);
              }}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white"
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

        <div className="flex justify-center">
          <button onClick={() => setCurrentStep('watch')} className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl">
            <Check className="w-5 h-5 inline mr-2" />학습 완료!
          </button>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (isGenerating) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <LoaderIcon className="w-12 h-12 text-purple-400 animate-spin mb-4" />
          <p className="text-white font-medium">AI가 학습 자료를 생성하고 있습니다...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-16">
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 mb-4">{error}</div>
          <button onClick={() => setError(null)} className="flex items-center gap-2 mx-auto text-slate-400 hover:text-white">
            <RefreshCw className="w-4 h-4" />다시 시도
          </button>
        </div>
      );
    }

    switch (currentStep) {
      case 'watch': return renderWatchStep();
      case 'preview': return renderPreviewStep();
      case 'script': return renderScriptStep();
      case 'shadowing': return renderShadowingStep();
      case 'practice': return renderPracticeStep();
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
          <span>목록으로</span>
        </button>
      </div>

      {/* Step Tabs */}
      <div className="flex gap-1 p-1 bg-slate-800/50 rounded-xl overflow-x-auto">
        {LEARNING_STEPS.map((step) => (
          <button
            key={step.id}
            onClick={() => {
              if (step.id === 'watch' || !needsContent) setCurrentStep(step.id);
            }}
            disabled={step.id !== 'watch' && needsContent}
            className={`flex-1 min-w-[80px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              currentStep === step.id
                ? 'bg-slate-700 text-white'
                : needsContent && step.id !== 'watch'
                ? 'text-slate-600 cursor-not-allowed'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            {step.icon}
            <span className="hidden sm:inline">{step.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {renderContent()}
    </div>
  );
};

export default TedPlayer;
