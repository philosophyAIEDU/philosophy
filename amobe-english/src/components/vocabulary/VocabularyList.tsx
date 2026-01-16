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
  Check,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import Button from '../common/Button';
import Card from '../common/Card';
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
      new: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      reviewing: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    };
    const labels = {
      new: '새로운',
      reviewing: '복습중',
      completed: '완료',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getLevelBadge = (level: UserLevel) => {
    const styles = {
      beginner: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      intermediate: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      advanced: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    };
    const labels = {
      beginner: '초급',
      intermediate: '중급',
      advanced: '고급',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[level]}`}>
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
      <Card className="text-center py-12">
        <BookOpen className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
          저장된 단어가 없습니다
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          학습 중 새로운 단어를 저장해보세요!
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            내 단어장
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            총 {vocabulary.length}개 단어
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'list' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <BookOpen size={16} className="mr-1" />
            목록
          </Button>
          <Button
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
              variant="secondary"
              size="sm"
              onClick={() => onStartQuiz(filteredVocabulary)}
              disabled={filteredVocabulary.length === 0}
            >
              <Brain size={16} className="mr-1" />
              퀴즈 모드
            </Button>
          )}
        </div>
      </div>

      {/* Today's Review Section */}
      {todayReviewWords.length > 0 && viewMode === 'list' && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                오늘 복습할 단어
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {todayReviewWords.length}개의 단어가 복습을 기다리고 있어요
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {todayReviewWords.slice(0, 5).map((item) => (
              <span
                key={item.id}
                className="px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg text-sm font-medium text-gray-800 dark:text-gray-200 shadow-sm"
              >
                {item.word}
              </span>
            ))}
            {todayReviewWords.length > 5 && (
              <span className="px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400">
                +{todayReviewWords.length - 5}개 더
              </span>
            )}
          </div>
          <Button
            variant="primary"
            size="sm"
            className="mt-4"
            onClick={() => {
              setViewMode('flashcard');
              setCurrentFlashcardIndex(0);
            }}
          >
            <Sparkles size={16} className="mr-1" />
            복습 시작하기
          </Button>
        </Card>
      )}

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="단어 또는 의미로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex-shrink-0"
          >
            <Filter size={18} className="mr-1" />
            필터
            {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Button>
        </div>

        {showFilters && (
          <div className="flex gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-sm text-gray-600 dark:text-gray-400 self-center">
              레벨:
            </span>
            {(['all', 'beginner', 'intermediate', 'advanced'] as const).map(
              (level) => (
                <button
                  key={level}
                  onClick={() => setLevelFilter(level)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    levelFilter === level
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  {level === 'all'
                    ? '전체'
                    : level === 'beginner'
                    ? '초급'
                    : level === 'intermediate'
                    ? '중급'
                    : '고급'}
                </button>
              )
            )}
          </div>
        )}
      </div>

      {/* Flashcard View */}
      {viewMode === 'flashcard' && filteredVocabulary.length > 0 && (
        <div className="flex flex-col items-center">
          <div
            className="w-full max-w-md h-64 perspective-1000 cursor-pointer"
            onClick={() => setIsFlashcardFlipped(!isFlashcardFlipped)}
          >
            <div
              className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
                isFlashcardFlipped ? 'rotate-y-180' : ''
              }`}
              style={{
                transformStyle: 'preserve-3d',
                transform: isFlashcardFlipped ? 'rotateY(180deg)' : 'rotateY(0)',
              }}
            >
              {/* Front */}
              <Card
                className="absolute w-full h-full flex flex-col items-center justify-center backface-hidden"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    speakWord(filteredVocabulary[currentFlashcardIndex].word);
                  }}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-blue-500 transition-colors"
                >
                  <Volume2 size={20} />
                </button>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {filteredVocabulary[currentFlashcardIndex].word}
                </p>
                {filteredVocabulary[currentFlashcardIndex].pronunciation && (
                  <p className="text-gray-500 dark:text-gray-400">
                    [{filteredVocabulary[currentFlashcardIndex].pronunciation}]
                  </p>
                )}
                <p className="text-sm text-gray-400 mt-4">클릭하여 뒤집기</p>
              </Card>

              {/* Back */}
              <Card
                className="absolute w-full h-full flex flex-col items-center justify-center"
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
              >
                <p className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  {filteredVocabulary[currentFlashcardIndex].meaning}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-center px-4 italic">
                  "{filteredVocabulary[currentFlashcardIndex].example}"
                </p>
              </Card>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-6">
            <Button variant="outline" onClick={handleFlashcardPrev}>
              이전
            </Button>
            <span className="text-gray-600 dark:text-gray-400">
              {currentFlashcardIndex + 1} / {filteredVocabulary.length}
            </span>
            <Button variant="outline" onClick={handleFlashcardNext}>
              다음
            </Button>
          </div>

          <div className="flex gap-2 mt-4">
            <Button variant="danger" size="sm">
              <span className="mr-1">X</span> 모르겠어요
            </Button>
            <Button variant="secondary" size="sm">
              <span className="mr-1">~</span> 애매해요
            </Button>
            <Button variant="primary" size="sm">
              <Check size={16} className="mr-1" /> 알아요!
            </Button>
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {filteredVocabulary.length === 0 ? (
            <Card className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                검색 결과가 없습니다
              </p>
            </Card>
          ) : (
            filteredVocabulary.map((item) => (
              <Card
                key={item.id}
                className="hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {item.word}
                      </h3>
                      <button
                        onClick={() => speakWord(item.word)}
                        className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                      >
                        <Volume2 size={18} />
                      </button>
                      {getStatusBadge(getReviewStatus(item))}
                      {getLevelBadge(item.level)}
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-2">
                      {item.meaning}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm italic">
                      "{item.example}"
                    </p>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          숙달도:
                        </span>
                        {renderMasteryStars(item.masteryLevel)}
                      </div>
                      <span className="text-xs text-gray-400">
                        복습 {item.reviewCount}회
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Stats Summary */}
      <Card className="bg-gray-50 dark:bg-gray-800/50">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {vocabulary.filter((v) => getReviewStatus(v) === 'new').length}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">새로운</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {vocabulary.filter((v) => getReviewStatus(v) === 'reviewing').length}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">복습중</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {vocabulary.filter((v) => getReviewStatus(v) === 'completed').length}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">완료</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {todayReviewWords.length}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">오늘 복습</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default VocabularyList;
