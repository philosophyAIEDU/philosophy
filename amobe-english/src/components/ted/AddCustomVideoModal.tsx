import React, { useState } from 'react';
import { X, Link2, Loader2, Youtube, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import tedService, { extractYoutubeId, createVideoFromYoutubeId } from '../../services/tedService';
import type { TedVideo } from '../../types/ted';
import geminiService from '../../services/geminiService';

interface AddCustomVideoModalProps {
  onClose: () => void;
  onVideoAdded: (video: TedVideo) => void;
}

type Step = 'input' | 'preview' | 'details';

export const AddCustomVideoModal: React.FC<AddCustomVideoModalProps> = ({ onClose, onVideoAdded }) => {
  const [step, setStep] = useState<Step>('input');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeId, setYoutubeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // 영상 정보 폼
  const [title, setTitle] = useState('');
  const [speaker, setSpeaker] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState<TedVideo['level']>('intermediate');
  const [tags, setTags] = useState('');

  const handleUrlSubmit = () => {
    setError(null);
    const id = extractYoutubeId(youtubeUrl.trim());

    if (!id) {
      setError('올바른 유튜브 링크를 입력해주세요.');
      return;
    }

    // 중복 체크
    const existing = tedService.getVideoByYoutubeId(id);
    if (existing) {
      setError('이미 등록된 영상입니다.');
      return;
    }

    setYoutubeId(id);
    setStep('preview');
  };

  const handleAIGenerate = async () => {
    if (!youtubeId) return;

    setIsGenerating(true);
    setError(null);

    try {
      const result = await geminiService.generateJSON<{
        title: string;
        speaker: string;
        description: string;
        tags: string[];
        level: string;
      }>(
        `This is a TED Talk or educational video on YouTube. The YouTube video ID is: ${youtubeId}.

Based on common TED Talk patterns and the video ID, suggest realistic metadata for this video.
If you cannot determine the actual content, provide generic but appropriate placeholder information.

Return ONLY valid JSON in this exact format:
{
  "title": "Suggested video title (in English)",
  "speaker": "Speaker name (or 'Unknown Speaker' if unsure)",
  "description": "Brief description of the video topic (1-2 sentences in English)",
  "tags": ["tag1", "tag2", "tag3"],
  "level": "beginner" or "intermediate" or "advanced"
}`,
        'Respond with ONLY valid JSON, no markdown or code blocks.'
      );

      if (result) {
        setTitle(result.title || '');
        setSpeaker(result.speaker || '');
        setDescription(result.description || '');
        setTags(result.tags?.join(', ') || '');
        setLevel((result.level as TedVideo['level']) || 'intermediate');
      }
    } catch (err) {
      console.error('AI generation error:', err);
      setError('AI 생성에 실패했습니다. 직접 입력해주세요.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmPreview = () => {
    setStep('details');
  };

  const handleAddVideo = () => {
    if (!youtubeId || !title.trim() || !speaker.trim()) {
      setError('제목과 연사는 필수 입력 항목입니다.');
      return;
    }

    setIsLoading(true);

    try {
      const videoData = createVideoFromYoutubeId(youtubeId, {
        title: title.trim(),
        speaker: speaker.trim(),
        description: description.trim(),
        level,
        tags: tags.split(',').map(t => t.trim().toLowerCase()).filter(t => t)
      });

      const newVideo = tedService.addCustomVideo(videoData);
      onVideoAdded(newVideo);
      onClose();
    } catch (err) {
      setError('영상 추가에 실패했습니다.');
      setIsLoading(false);
    }
  };

  const getLevelColor = (l: string) => {
    switch (l) {
      case 'beginner': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'intermediate': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'advanced': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-slate-900 rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-xl">
              <Youtube className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">나만의 TED 영상 추가</h2>
              <p className="text-sm text-slate-400">유튜브 링크로 학습할 영상을 추가하세요</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 py-4 px-6 border-b border-slate-700/50 bg-slate-800/30">
          {[
            { id: 'input', label: '링크 입력' },
            { id: 'preview', label: '미리보기' },
            { id: 'details', label: '정보 입력' }
          ].map((s, i) => (
            <React.Fragment key={s.id}>
              <div className={`flex items-center gap-2 ${step === s.id ? 'text-purple-400' : 'text-slate-500'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === s.id ? 'bg-purple-500/20 border border-purple-500/50' : 'bg-slate-700/50'
                }`}>
                  {i + 1}
                </div>
                <span className="hidden sm:inline text-sm">{s.label}</span>
              </div>
              {i < 2 && <div className="w-8 h-px bg-slate-700" />}
            </React.Fragment>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: URL Input */}
          {step === 'input' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  유튜브 링크 또는 영상 ID
                </label>
                <div className="relative">
                  <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... 또는 youtu.be/..."
                    className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
              </div>

              <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                <p className="text-sm text-slate-400 mb-2">지원하는 링크 형식:</p>
                <ul className="text-xs text-slate-500 space-y-1">
                  <li>• https://www.youtube.com/watch?v=VIDEO_ID</li>
                  <li>• https://youtu.be/VIDEO_ID</li>
                  <li>• VIDEO_ID (11자리 코드)</li>
                </ul>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                onClick={handleUrlSubmit}
                disabled={!youtubeUrl.trim()}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white font-medium rounded-xl transition-all"
              >
                다음
              </button>
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 'preview' && youtubeId && (
            <div className="space-y-4">
              <div className="aspect-video bg-slate-800 rounded-xl overflow-hidden">
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              <div className="flex items-center justify-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
                <CheckCircle className="w-4 h-4" />
                영상을 확인했습니다. 학습 정보를 입력해주세요.
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('input')}
                  className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors"
                >
                  이전
                </button>
                <button
                  onClick={handleConfirmPreview}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium rounded-xl transition-all"
                >
                  다음
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Details Form */}
          {step === 'details' && (
            <div className="space-y-4">
              {/* Thumbnail Preview */}
              {youtubeId && (
                <div className="flex gap-4 items-start bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                  <img
                    src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
                    alt="Video thumbnail"
                    className="w-32 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-slate-400">선택한 영상</p>
                    <p className="text-white font-medium mt-1">{title || '제목을 입력해주세요'}</p>
                    <p className="text-sm text-slate-500">{speaker || '연사를 입력해주세요'}</p>
                  </div>
                </div>
              )}

              {/* AI Generate Button */}
              <button
                onClick={handleAIGenerate}
                disabled={isGenerating}
                className="w-full py-3 bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 hover:from-emerald-600/30 hover:to-cyan-600/30 border border-emerald-500/30 text-emerald-400 font-medium rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    AI가 정보를 생성 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    AI로 정보 자동 생성
                  </>
                )}
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    제목 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="영상 제목"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    연사 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={speaker}
                    onChange={(e) => setSpeaker(e.target.value)}
                    placeholder="연사 이름"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  설명
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="영상에 대한 간단한 설명"
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    난이도
                  </label>
                  <div className="flex gap-2">
                    {(['beginner', 'intermediate', 'advanced'] as const).map((l) => (
                      <button
                        key={l}
                        onClick={() => setLevel(l)}
                        className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                          level === l ? getLevelColor(l) : 'bg-slate-800/50 border-slate-600/50 text-slate-400 hover:text-white'
                        }`}
                      >
                        {l === 'beginner' ? '초급' : l === 'intermediate' ? '중급' : '고급'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    태그 (쉼표로 구분)
                  </label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="예: motivation, success, life"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('preview')}
                  className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors"
                >
                  이전
                </button>
                <button
                  onClick={handleAddVideo}
                  disabled={isLoading || !title.trim() || !speaker.trim()}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      추가 중...
                    </>
                  ) : (
                    '영상 추가하기'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddCustomVideoModal;
