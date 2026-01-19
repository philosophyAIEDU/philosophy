import React, { useState } from 'react';
import { X, FileText, Languages, Copy, Check, Search } from 'lucide-react';
import tedService from '../../services/tedService';
import type { TedVideo } from '../../types/ted';

interface TranscriptViewerProps {
  video: TedVideo;
  onClose: () => void;
}

export const TranscriptViewer: React.FC<TranscriptViewerProps> = ({ video, onClose }) => {
  const [showTranslation, setShowTranslation] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const transcript = tedService.getTranscript(video.id);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopyAll = () => {
    if (!transcript) return;

    let textToCopy = transcript.subtitles.map(sub => {
      let line = `[${formatTime(sub.startTime)}] ${sub.text}`;
      if (showTranslation && sub.translation) {
        line += `\n${sub.translation}`;
      }
      return line;
    }).join('\n\n');

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredSubtitles = transcript?.subtitles.filter(sub => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return sub.text.toLowerCase().includes(query) ||
           (sub.translation && sub.translation.toLowerCase().includes(query));
  }) || [];

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase()
        ? <mark key={i} className="bg-yellow-500/50 text-white rounded px-0.5">{part}</mark>
        : part
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl border border-slate-700/50 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-xl">
              <FileText className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">대본 보기</h2>
              <p className="text-sm text-slate-400">{video.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 border-b border-slate-700/50">
          {/* Search */}
          <div className="relative flex-1 w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="대본 내 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Translation Toggle */}
            <button
              onClick={() => setShowTranslation(!showTranslation)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm ${
                showTranslation
                  ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                  : 'bg-slate-800/50 border-slate-600/50 text-slate-400 hover:text-white'
              }`}
            >
              <Languages className="w-4 h-4" />
              <span>번역</span>
            </button>

            {/* Copy Button */}
            <button
              onClick={handleCopyAll}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-slate-400 hover:text-white transition-colors text-sm"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">복사됨</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>전체 복사</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!transcript ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-slate-600" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">대본이 없습니다</h3>
              <p className="text-slate-400">이 영상의 대본은 아직 준비되지 않았습니다.</p>
            </div>
          ) : filteredSubtitles.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-slate-600" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">검색 결과가 없습니다</h3>
              <p className="text-slate-400">다른 검색어를 시도해보세요.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSubtitles.map((subtitle) => (
                <div
                  key={subtitle.id}
                  className="p-4 bg-slate-800/30 rounded-xl hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <span className="text-xs text-slate-500 font-mono min-w-16 mt-1">
                      {formatTime(subtitle.startTime)}
                    </span>
                    <div className="flex-1">
                      <p className="text-white leading-relaxed">
                        {highlightText(subtitle.text, searchQuery)}
                      </p>
                      {showTranslation && subtitle.translation && (
                        <p className="text-slate-400 text-sm mt-2">
                          {highlightText(subtitle.translation, searchQuery)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-700/50 bg-slate-800/30">
          <div className="text-sm text-slate-400">
            {transcript ? (
              <>
                총 {transcript.subtitles.length}개 문장
                {searchQuery && ` · 검색 결과 ${filteredSubtitles.length}개`}
              </>
            ) : (
              '대본 없음'
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-white rounded-lg transition-colors text-sm"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default TranscriptViewer;
