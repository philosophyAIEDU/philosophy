import React, { useState, useMemo } from 'react';
import { Play, Clock, Heart, Search, BookOpen, Headphones, Star, FileText } from 'lucide-react';
import tedService from '../../services/tedService';
import type { TedVideo } from '../../types/ted';
import { TranscriptViewer } from './TranscriptViewer';

interface TedBrowserProps {
  onSelectVideo: (video: TedVideo) => void;
}

export const TedBrowser: React.FC<TedBrowserProps> = ({ onSelectVideo }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [transcriptVideo, setTranscriptVideo] = useState<TedVideo | null>(null);

  const handleViewTranscript = (e: React.MouseEvent, video: TedVideo) => {
    e.stopPropagation();
    setTranscriptVideo(video);
  };

  const allVideos = tedService.getAllVideos();
  const allTags = tedService.getAllTags();
  const favorites = tedService.getFavorites();

  const filteredVideos = useMemo(() => {
    let videos = allVideos;

    // Search filter
    if (searchQuery) {
      videos = tedService.searchVideos(searchQuery);
    }

    // Level filter
    if (selectedLevel !== 'all') {
      videos = videos.filter(v => v.level === selectedLevel);
    }

    // Tag filter
    if (selectedTag !== 'all') {
      videos = videos.filter(v => v.tags.includes(selectedTag));
    }

    // Favorites filter
    if (showFavoritesOnly) {
      videos = videos.filter(v => favorites.includes(v.id));
    }

    return videos;
  }, [allVideos, searchQuery, selectedLevel, selectedTag, showFavoritesOnly, favorites]);

  const toggleFavorite = (e: React.MouseEvent, videoId: string) => {
    e.stopPropagation();
    if (tedService.isFavorite(videoId)) {
      tedService.removeFavorite(videoId);
    } else {
      tedService.addFavorite(videoId);
    }
    // Force re-render
    setShowFavoritesOnly(prev => prev);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'intermediate': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'advanced': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getLevelText = (level: string) => {
    switch (level) {
      case 'beginner': return '초급';
      case 'intermediate': return '중급';
      case 'advanced': return '고급';
      default: return level;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-xl">
              <Play className="w-6 h-6 text-red-400" />
            </div>
            TED 영상으로 배우기
          </h1>
          <p className="text-slate-400 mt-1">
            세계적인 강연으로 영어 실력을 키워보세요
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-sm">{filteredVideos.length}개 영상</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="제목, 연사, 주제로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            {/* Level Filter */}
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
            >
              <option value="all">모든 레벨</option>
              <option value="beginner">초급</option>
              <option value="intermediate">중급</option>
              <option value="advanced">고급</option>
            </select>

            {/* Tag Filter */}
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
            >
              <option value="all">모든 주제</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>

            {/* Favorites Toggle */}
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`px-4 py-3 rounded-xl border transition-all flex items-center gap-2 ${
                showFavoritesOnly
                  ? 'bg-red-500/20 border-red-500/50 text-red-400'
                  : 'bg-slate-900/50 border-slate-600/50 text-slate-400 hover:text-white'
              }`}
            >
              <Heart className={`w-5 h-5 ${showFavoritesOnly ? 'fill-red-400' : ''}`} />
              <span className="hidden md:inline">즐겨찾기</span>
            </button>
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVideos.map((video) => (
          <div
            key={video.id}
            onClick={() => onSelectVideo(video)}
            className="group bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all cursor-pointer"
          >
            {/* Thumbnail */}
            <div className="relative aspect-video bg-slate-900">
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;
                }}
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

              {/* Play Button */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                  <Play className="w-8 h-8 text-white ml-1" />
                </div>
              </div>

              {/* Duration */}
              <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/70 rounded text-white text-sm flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {tedService.formatDuration(video.duration)}
              </div>

              {/* Favorite Button */}
              <button
                onClick={(e) => toggleFavorite(e, video.id)}
                className="absolute top-3 right-3 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
              >
                <Heart className={`w-5 h-5 ${tedService.isFavorite(video.id) ? 'fill-red-500 text-red-500' : 'text-white'}`} />
              </button>

              {/* Level Badge */}
              <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium border ${getLevelColor(video.level)}`}>
                {getLevelText(video.level)}
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                {video.title}
              </h3>
              <p className="text-sm text-slate-400 mt-1">{video.speaker}</p>
              <p className="text-sm text-slate-500 mt-2 line-clamp-2">{video.description}</p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mt-3">
                {video.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="px-2 py-1 bg-slate-700/50 rounded-full text-xs text-slate-400">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Study Options */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700/50">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-slate-500 text-xs">
                    <Headphones className="w-4 h-4" />
                    <span>듣기</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-500 text-xs">
                    <BookOpen className="w-4 h-4" />
                    <span>읽기</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-500 text-xs">
                    <Star className="w-4 h-4" />
                    <span>단어</span>
                  </div>
                </div>
                {/* Transcript Button */}
                <button
                  onClick={(e) => handleViewTranscript(e, video)}
                  className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-400 text-xs transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>대본</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredVideos.length === 0 && (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-10 h-10 text-slate-600" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">검색 결과가 없습니다</h3>
          <p className="text-slate-400">다른 검색어나 필터를 시도해보세요</p>
        </div>
      )}

      {/* Transcript Viewer Modal */}
      {transcriptVideo && (
        <TranscriptViewer
          video={transcriptVideo}
          onClose={() => setTranscriptVideo(null)}
        />
      )}
    </div>
  );
};

export default TedBrowser;
