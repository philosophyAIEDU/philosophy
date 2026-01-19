import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Trash2,
  Star,
  BookOpen,
  Brain,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Volume2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import Button from '../common/Button';

import { VocabularyItem, UserLevel } from '../../types/learning';

type ReviewStatus = 'new' | 'reviewing' | 'completed';
type ViewMode = 'list' | 'flashcard';

interface VocabularyListProps {
  onStartQuiz?: (words: VocabularyItem[]) => void;
}

const VocabularyList: React.FC<VocabularyListProps> = ({ onStartQuiz }) => {
  const { state, removeFromVocabulary } = useApp();
  const { vocabulary } = state;

  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<UserLevel | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [isFlashcardFlipped, setIsFlashcardFlipped] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const getReviewStatus = (item: VocabularyItem): ReviewStatus => {
    if (item.reviewCount === 0) return 'new';
    if (item.masteryLevel >= 5) return 'completed';
    return 'reviewing';
  };

  const getStatusBadge = (status: ReviewStatus) => {
    const styles = {
      new: 'bg-blue-900/30 text-blue-400 border border-blue-800/50',
      reviewing: 'bg-yellow-900/30 text-yellow-400 border border-yellow-800/50',
      completed: 'bg-green-900/30 text-green-400 border border-green-800/50',
    };
    const labels = {
      new: '새 단어',
      reviewing: '복습 중',
      completed: '완료',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getLevelBadge = (level: UserLevel) => {
    const styles = {
      beginner: 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/50',
      intermediate: 'bg-orange-900/30 text-orange-400 border border-orange-800/50',
      advanced: 'bg-purple-900/30 text-purple-400 border border-purple-800/50',
    };
    const labels = {
      beginner: '초급',
      intermediate: '중급',
      advanced: '고급',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${styles[level]}`}>
        {labels[level]}
      </span>
    );
  };

  const renderMasteryStars = (level: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            className={
              star <= level
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300 dark:text-gray-600'
            }
          />
        ))}
      </div>
    );
  };

  const filteredVocabulary = useMemo(() => {
    return vocabulary.filter((item) => {
      const matchesSearch =
        searchQuery === '' ||
        item.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.meaning.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLevel = levelFilter === 'all' || item.level === levelFilter;
      return matchesSearch && matchesLevel;
    });
  }, [vocabulary, searchQuery, levelFilter]);

  const todayReviewWords = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return vocabulary.filter((item) => {
      const nextReview = item.nextReview.split('T')[0];
      return nextReview <= today && item.masteryLevel < 5;
    });
  }, [vocabulary]);

  const handleDelete = (id: string) => {
    if (window.confirm('이 단어를 삭제하시겠습니까?')) {
      removeFromVocabulary(id);
    }
  };

  const handleFlashcardNext = () => {
    setIsFlashcardFlipped(false);
    setCurrentFlashcardIndex((prev) =>
      prev < filteredVocabulary.length - 1 ? prev + 1 : 0
    );
  };

  const handleFlashcardPrev = () => {
    setIsFlashcardFlipped(false);
    setCurrentFlashcardIndex((prev) =>
      prev > 0 ? prev - 1 : filteredVocabulary.length - 1
    );
  };

  const speakWord = (word: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      speechSynthesis.speak(utterance);
    }
  };

  if (vocabulary.length === 0) {
    return (
      <div className="bg-navy-card rounded-2xl border border-gray-700 p-12 text-center shadow-xl">
        <BookOpen className="w-16 h-16 mx-auto text-gray-600 mb-4" />
        <h3 className="text-xl font-serif font-bold text-white mb-2">
          저장된 단어가 없습니다
        </h3>
        <p className="text-gray-400">
          학습을 시작하고 단어를 저장하여 나만의 단어장을 만들어보세요!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-white mb-1">
            내 단어장
          </h2>
          <p className="text-gray-400 flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            총 {vocabulary.length}개 단어
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            className={viewMode === 'list' ? 'bg-accent-blue text-white' : 'border-gray-600 text-gray-300 hover:text-white'}
            variant={viewMode === 'list' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <BookOpen size={16} className="mr-1" />
            목록
          </Button>
          <Button
            className={viewMode === 'flashcard' ? 'bg-accent-blue text-white' : 'border-gray-600 text-gray-300 hover:text-white'}
            variant={viewMode === 'flashcard' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => {
              setViewMode('flashcard');
              setCurrentFlashcardIndex(0);
              setIsFlashcardFlipped(false);
            }}
          >
            <RotateCcw size={16} className="mr-1" />
            플래시카드
          </Button>
          {onStartQuiz && (
            <Button
              className="bg-accent-yellow hover:bg-yellow-500 text-black border-none"
              size="sm"
              onClick={() => onStartQuiz(filteredVocabulary)}
              disabled={filteredVocabulary.length === 0}
            >
              <Brain size={16} className="mr-1" />
              퀴즈 시작
            </Button>
          )}
        </div>
      </div>

      {/* Today's Review Section */}
      {todayReviewWords.length > 0 && viewMode === 'list' && (
        <div className="bg-gradient-to-r from-blue-900/20 to-indigo-900/20 rounded-2xl border border-blue-500/30 p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <Clock className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-blue-100 text-lg">
                오늘의 복습
              </h3>
              <p className="text-blue-300/80">
                {todayReviewWords.length}개의 단어가 복습 대기 중입니다
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {todayReviewWords.slice(0, 5).map((item) => (
              <span
                key={item.id}
                className="px-3 py-1.5 bg-navy-card border border-blue-500/30 rounded-lg text-sm font-medium text-blue-100"
              >
                {item.word}
              </span>
            ))}
            {todayReviewWords.length > 5 && (
              <span className="px-3 py-1.5 text-sm text-blue-400 flex items-center">
                +{todayReviewWords.length - 5}개 더
              </span>
            )}
          </div>
          <Button
            className="bg-blue-600 hover:bg-blue-500 text-white border-none"
            size="sm"
            onClick={() => {
              setViewMode('flashcard');
              setCurrentFlashcardIndex(0);
            }}
          >
            <Sparkles size={16} className="mr-1" />
            복습 시작하기
          </Button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              size={20}
            />
            <input
              type="text"
              placeholder="단어 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-700 rounded-xl bg-navy-card text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex-shrink-0 border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            <Filter size={18} className="mr-1" />
            필터
            {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Button>
        </div>

        {showFilters && (
          <div className="flex gap-2 p-4 bg-gray-900/50 border border-gray-800 rounded-xl animate-fade-in">
            <span className="text-sm text-gray-400 self-center font-medium mr-2">
              레벨:
            </span>
            {(['all', 'beginner', 'intermediate', 'advanced'] as const).map(
              (level) => (
                <button
                  key={level}
                  onClick={() => setLevelFilter(level)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${levelFilter === level
                    ? 'bg-accent-blue text-white shadow-lg shadow-blue-500/20'
                    : 'bg-navy-card text-gray-400 hover:bg-gray-800 hover:text-white border border-gray-700'
                    }`}
                >
                  {level === 'all'
                    ? '전체'
                    : level === 'beginner' ? '초급' : level === 'intermediate' ? '중급' : '고급'}
                </button>
              )
            )}
          </div>
        )}
      </div>

      {/* Flashcard View */}
      {viewMode === 'flashcard' && filteredVocabulary.length > 0 && (
        <div className="flex flex-col items-center py-8">
          <div
            className="w-full max-w-md h-80 perspective-1000 cursor-pointer group"
            onClick={() => setIsFlashcardFlipped(!isFlashcardFlipped)}
          >
            <div
              className={`relative w-full h-full transition-all duration-700 transform-style-3d ${isFlashcardFlipped ? 'rotate-y-180' : ''
                }`}
              style={{
                transformStyle: 'preserve-3d',
                transform: isFlashcardFlipped ? 'rotateY(180deg)' : 'rotateY(0)',
              }}
            >
              {/* Front */}
              <div
                className="absolute w-full h-full flex flex-col items-center justify-center backface-hidden bg-navy-card border border-gray-700 rounded-2xl shadow-2xl p-8"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <div className="absolute top-4 left-4">
                  <span className="text-gray-500 text-sm uppercase tracking-widest font-bold">앞면</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    speakWord(filteredVocabulary[currentFlashcardIndex].word);
                  }}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-accent-blue transition-colors rounded-full hover:bg-gray-800"
                >
                  <Volume2 size={24} />
                </button>

                <h3 className="text-4xl font-serif font-bold text-white mb-4 text-center">
                  {filteredVocabulary[currentFlashcardIndex].word}
                </h3>

                {filteredVocabulary[currentFlashcardIndex].pronunciation && (
                  <p className="text-gray-400 font-mono text-lg bg-gray-900 px-3 py-1 rounded-lg">
                    /{filteredVocabulary[currentFlashcardIndex].pronunciation}/
                  </p>
                )}

                <p className="text-sm text-gray-600 mt-8 animate-pulse">클릭하여 뒤집기</p>
              </div>

              {/* Back */}
              <div
                className="absolute w-full h-full flex flex-col items-center justify-center bg-gray-800 border border-gray-600 rounded-2xl shadow-2xl p-8"
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
              >
                <div className="absolute top-4 left-4">
                  <span className="text-gray-500 text-sm uppercase tracking-widest font-bold">뒷면</span>
                </div>
                <p className="text-3xl font-medium text-white mb-6 text-center">
                  {filteredVocabulary[currentFlashcardIndex].meaning}
                </p>
                <div className="w-12 h-1 bg-accent-blue rounded-full mb-6"></div>
                <p className="text-gray-300 text-center text-lg italic leading-relaxed">
                  "{filteredVocabulary[currentFlashcardIndex].example}"
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 mt-8">
            <Button
              variant="outline"
              onClick={handleFlashcardPrev}
              className="border-gray-600 text-gray-300 hover:text-white hover:bg-gray-800 rounded-full w-12 h-12 p-0 flex items-center justify-center"
            >
              <ChevronDown className="rotate-90" size={24} />
            </Button>
            <span className="text-gray-400 font-mono text-lg">
              {currentFlashcardIndex + 1} <span className="text-gray-600">/</span> {filteredVocabulary.length}
            </span>
            <Button
              variant="outline"
              onClick={handleFlashcardNext}
              className="border-gray-600 text-gray-300 hover:text-white hover:bg-gray-800 rounded-full w-12 h-12 p-0 flex items-center justify-center"
            >
              <ChevronDown className="-rotate-90" size={24} />
            </Button>
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="grid grid-cols-1 gap-4">
          {filteredVocabulary.length === 0 ? (
            <div className="bg-navy-card rounded-2xl border border-gray-700 p-8 text-center">
              <p className="text-gray-400">
                검색 결과가 없습니다.
              </p>
            </div>
          ) : (
            filteredVocabulary.map((item) => (
              <div
                key={item.id}
                className="group bg-navy-card rounded-xl border border-gray-700 p-6 hover:border-gray-500 transition-all hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-xl font-serif font-bold text-white">
                        {item.word}
                      </h3>
                      <button
                        onClick={() => speakWord(item.word)}
                        className="p-1.5 text-gray-400 hover:text-accent-blue hover:bg-gray-800 rounded-full transition-colors"
                      >
                        <Volume2 size={16} />
                      </button>
                      {getStatusBadge(getReviewStatus(item))}
                      {getLevelBadge(item.level)}
                    </div>

                    <p className="text-gray-200 text-lg font-medium">
                      {item.meaning}
                    </p>

                    <div className="pl-4 border-l-2 border-gray-700">
                      <p className="text-gray-400 text-sm italic leading-relaxed">
                        "{item.example}"
                      </p>
                    </div>

                    <div className="flex items-center gap-6 pt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          숙련도
                        </span>
                        {renderMasteryStars(item.masteryLevel)}
                      </div>
                      <span className="text-xs text-gray-500">
                        {item.reviewCount}회 복습
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-900/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="단어 삭제"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Stats Summary */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center divide-x divide-gray-800">
          <div>
            <p className="text-3xl font-bold text-blue-400 mb-1">
              {vocabulary.filter((v) => getReviewStatus(v) === 'new').length}
            </p>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">새 단어</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-yellow-400 mb-1">
              {vocabulary.filter((v) => getReviewStatus(v) === 'reviewing').length}
            </p>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">복습 중</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-green-400 mb-1">
              {vocabulary.filter((v) => getReviewStatus(v) === 'completed').length}
            </p>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">완료</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-purple-400 mb-1">
              {todayReviewWords.length}
            </p>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">복습 예정</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VocabularyList;
