import React, { useState, useEffect } from 'react';
import {
  BarChart3, Clock, BookOpen, MessageSquare,
  Play, Trophy, Calendar, TrendingUp
} from 'lucide-react';
import tedService from '../../services/tedService';
import type { TedVideo } from '../../types/ted';

interface HistoryItem {
  videoId: string;
  watchedAt: string;
  progress: number;
}

export const LearningProgress: React.FC = () => {
  const [stats, setStats] = useState({
    videosWatched: 0,
    savedWordsCount: 0,
    savedSentencesCount: 0,
    totalStudyTimeMinutes: 0,
    recentHistory: [] as HistoryItem[]
  });
  const [videos, setVideos] = useState<Record<string, TedVideo>>({});

  useEffect(() => {
    const loadStats = () => {
      const learningStats = tedService.getLearningStats();
      setStats(learningStats);

      // Load video details for history
      const videoMap: Record<string, TedVideo> = {};
      learningStats.recentHistory.forEach((h: HistoryItem) => {
        const video = tedService.getVideoById(h.videoId);
        if (video) {
          videoMap[h.videoId] = video;
        }
      });
      setVideos(videoMap);
    };
    loadStats();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return '오늘';
    } else if (diffDays === 1) {
      return '어제';
    } else if (diffDays < 7) {
      return `${diffDays}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    }
  };

  const getStudyLevel = () => {
    const { videosWatched, savedWordsCount } = stats;
    const totalScore = videosWatched * 10 + savedWordsCount * 2;

    if (totalScore >= 100) return { level: '마스터', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    if (totalScore >= 50) return { level: '고급', color: 'text-purple-400', bg: 'bg-purple-500/20' };
    if (totalScore >= 20) return { level: '중급', color: 'text-blue-400', bg: 'bg-blue-500/20' };
    return { level: '초급', color: 'text-green-400', bg: 'bg-green-500/20' };
  };

  const studyLevel = getStudyLevel();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-xl">
            <BarChart3 className="w-6 h-6 text-blue-400" />
          </div>
          학습 현황
        </h1>
        <p className="text-slate-400 mt-1">
          나의 영어 학습 진행 상황을 확인하세요
        </p>
      </div>

      {/* Level Card */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl p-6 border border-slate-700/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm mb-1">현재 레벨</p>
            <div className="flex items-center gap-3">
              <div className={`p-3 ${studyLevel.bg} rounded-xl`}>
                <Trophy className={`w-8 h-8 ${studyLevel.color}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${studyLevel.color}`}>{studyLevel.level}</p>
                <p className="text-xs text-slate-500">꾸준히 학습하세요!</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-slate-400 text-sm">총 학습 시간</p>
            <p className="text-3xl font-bold text-white">
              {stats.totalStudyTimeMinutes}
              <span className="text-sm text-slate-400 ml-1">분</span>
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <Play className="w-5 h-5 text-red-400" />
            <span className="text-sm text-slate-400">시청 영상</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.videosWatched}</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-blue-400" />
            <span className="text-sm text-slate-400">저장 단어</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.savedWordsCount}</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-5 h-5 text-green-400" />
            <span className="text-sm text-slate-400">저장 문장</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.savedSentencesCount}</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-purple-400" />
            <span className="text-sm text-slate-400">학습 시간</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalStudyTimeMinutes}<span className="text-sm text-slate-400">분</span></p>
        </div>
      </div>

      {/* Recent History */}
      <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
        <div className="p-4 border-b border-slate-700/50">
          <h3 className="font-medium text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-400" />
            최근 학습 기록
          </h3>
        </div>
        <div className="divide-y divide-slate-700/50">
          {stats.recentHistory.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>아직 학습 기록이 없습니다</p>
              <p className="text-sm mt-1">TED 영상을 시청하고 학습을 시작하세요</p>
            </div>
          ) : (
            stats.recentHistory.map((history, idx) => {
              const video = videos[history.videoId];
              if (!video) return null;

              return (
                <div
                  key={`${history.videoId}-${idx}`}
                  className="p-4 hover:bg-slate-700/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-20 h-12 object-cover rounded-lg flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{video.title}</p>
                      <p className="text-sm text-slate-400">{video.speaker}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm text-slate-400">{formatDate(history.watchedAt)}</p>
                      {history.progress > 0 && (
                        <p className="text-xs text-green-400">점수: {history.progress}%</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-4 border border-blue-500/20">
        <h4 className="font-medium text-blue-400 mb-2">학습 팁</h4>
        <ul className="text-sm text-slate-300 space-y-1">
          <li>• 매일 최소 1개의 TED 영상을 시청하세요</li>
          <li>• 모르는 단어는 저장하고 반복 학습하세요</li>
          <li>• 쉐도잉으로 발음과 억양을 연습하세요</li>
          <li>• 받아쓰기로 듣기 실력을 향상시키세요</li>
        </ul>
      </div>
    </div>
  );
};

export default LearningProgress;
