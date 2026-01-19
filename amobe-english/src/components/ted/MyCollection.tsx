import React, { useState, useEffect } from 'react';
import {
  BookOpen, Volume2, Trash2, Search,
  MessageSquare, Play, Pause
} from 'lucide-react';
import tedService, { SavedWord, SavedSentence } from '../../services/tedService';

type TabType = 'words' | 'sentences';

export const MyCollection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('words');
  const [savedWords, setSavedWords] = useState<SavedWord[]>([]);
  const [savedSentences, setSavedSentences] = useState<SavedSentence[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    loadData();
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    return () => window.speechSynthesis.cancel();
  }, []);

  const loadData = () => {
    setSavedWords(tedService.getSavedWords());
    setSavedSentences(tedService.getSavedSentences());
  };

  const speakText = (text: string, rate: number = 0.9) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = rate;

    const preferredVoices = voices.filter(v =>
      v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Microsoft') || v.name.includes('Samantha'))
    );
    if (preferredVoices.length > 0) {
      utterance.voice = preferredVoices[0];
    }

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    setTimeout(() => window.speechSynthesis.speak(utterance), 100);
  };

  const handleRemoveWord = (word: string, videoId: string) => {
    tedService.removeSavedWord(word, videoId);
    loadData();
  };

  const handleRemoveSentence = (text: string, videoId: string) => {
    tedService.removeSavedSentence(text, videoId);
    loadData();
  };

  const filteredWords = savedWords.filter(w =>
    w.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.meaningKo.includes(searchQuery)
  );

  const filteredSentences = savedSentences.filter(s =>
    s.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.translation.includes(searchQuery)
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-xl">
            <BookOpen className="w-6 h-6 text-purple-400" />
          </div>
          나의 학습 모음
        </h1>
        <p className="text-slate-400 mt-1">
          저장한 단어와 문장을 복습하세요
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="text-3xl font-bold text-blue-400">{savedWords.length}</div>
          <div className="text-sm text-slate-400">저장된 단어</div>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="text-3xl font-bold text-green-400">{savedSentences.length}</div>
          <div className="text-sm text-slate-400">저장된 문장</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-800/50 rounded-xl">
        <button
          onClick={() => setActiveTab('words')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'words'
              ? 'bg-blue-500 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          단어 ({savedWords.length})
        </button>
        <button
          onClick={() => setActiveTab('sentences')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'sentences'
              ? 'bg-green-500 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          문장 ({savedSentences.length})
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
        />
      </div>

      {/* Content */}
      {activeTab === 'words' ? (
        <div className="space-y-3">
          {filteredWords.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>저장된 단어가 없습니다</p>
              <p className="text-sm mt-1">학습 중 단어를 저장해보세요</p>
            </div>
          ) : (
            filteredWords.map((word, idx) => (
              <div
                key={`${word.word}-${word.videoId}-${idx}`}
                className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 hover:border-blue-500/30 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <button
                        onClick={() => speakText(word.word)}
                        className="flex items-center gap-2 hover:text-blue-400 transition-colors"
                      >
                        {isPlaying ? (
                          <Pause className="w-4 h-4 text-blue-400" />
                        ) : (
                          <Volume2 className="w-4 h-4 text-blue-400" />
                        )}
                        <span className="text-lg font-semibold text-white">{word.word}</span>
                      </button>
                      {word.pronunciation && (
                        <span className="text-xs text-slate-500">{word.pronunciation}</span>
                      )}
                    </div>
                    {word.meaning && (
                      <p className="text-sm text-blue-400 mb-1">{word.meaning}</p>
                    )}
                    <p className="text-sm text-slate-400">{word.meaningKo}</p>
                    <p className="text-xs text-slate-500 mt-2">
                      {word.videoTitle}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveWord(word.word, word.videoId)}
                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSentences.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>저장된 문장이 없습니다</p>
              <p className="text-sm mt-1">학습 중 문장을 저장해보세요</p>
            </div>
          ) : (
            filteredSentences.map((sentence, idx) => (
              <div
                key={`${sentence.text.slice(0, 20)}-${sentence.videoId}-${idx}`}
                className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 hover:border-green-500/30 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-2">
                      <button
                        onClick={() => speakText(sentence.text)}
                        className="p-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-green-400 flex-shrink-0"
                      >
                        {isPlaying ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </button>
                      <div>
                        <p className="text-white leading-relaxed">{sentence.text}</p>
                        <p className="text-sm text-slate-400 mt-1">{sentence.translation}</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">
                      {sentence.videoTitle}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveSentence(sentence.text, sentence.videoId)}
                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default MyCollection;
