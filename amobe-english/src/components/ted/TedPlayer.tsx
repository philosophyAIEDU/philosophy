import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowLeft, Play, Pause, Volume2, VolumeX, Settings,
  Subtitles, Languages, RotateCcw, FastForward, Rewind,
  Bookmark, Share2, Maximize
} from 'lucide-react';
import tedService from '../../services/tedService';
import type { TedVideo, Subtitle } from '../../types/ted';

interface TedPlayerProps {
  video: TedVideo;
  onBack: () => void;
  onStartStudy: (mode: 'dictation' | 'shadowing' | 'quiz' | 'vocabulary') => void;
}

export const TedPlayer: React.FC<TedPlayerProps> = ({ video, onBack, onStartStudy }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const duration = video.duration;
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [currentSubtitle, setCurrentSubtitle] = useState<Subtitle | null>(null);

  const playerRef = useRef<HTMLIFrameElement>(null);
  const transcript = tedService.getTranscript(video.id);

  // Update subtitle based on current time
  useEffect(() => {
    if (transcript) {
      const subtitle = tedService.getSubtitleAtTime(video.id, currentTime);
      setCurrentSubtitle(subtitle || null);
    }
  }, [currentTime, video.id, transcript]);

  // Simulate time update (in real app, would use YouTube API)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= duration) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000 / playbackSpeed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration, playbackSpeed]);

  const togglePlay = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const seekTo = useCallback((time: number) => {
    setCurrentTime(Math.max(0, Math.min(time, duration)));
  }, [duration]);

  const skipForward = useCallback(() => {
    seekTo(currentTime + 10);
  }, [currentTime, seekTo]);

  const skipBackward = useCallback(() => {
    seekTo(currentTime - 10);
  }, [currentTime, seekTo]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = (currentTime / duration) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>목록으로</span>
        </button>
        <div className="flex items-center gap-3">
          <button className="p-2 text-slate-400 hover:text-white transition-colors">
            <Bookmark className="w-5 h-5" />
          </button>
          <button className="p-2 text-slate-400 hover:text-white transition-colors">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Video Player */}
      <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden">
        {/* Video Container */}
        <div className="relative aspect-video bg-black">
          <iframe
            ref={playerRef}
            src={`${video.videoUrl}?enablejsapi=1&rel=0`}
            title={video.title}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />

          {/* Subtitle Overlay */}
          {showSubtitles && currentSubtitle && (
            <div className="absolute bottom-20 left-0 right-0 px-8 text-center">
              <div className="inline-block bg-black/80 rounded-lg px-6 py-3 max-w-3xl">
                <p className="text-white text-lg md:text-xl font-medium">
                  {currentSubtitle.text}
                </p>
                {showTranslation && currentSubtitle.translation && (
                  <p className="text-blue-300 text-sm md:text-base mt-1">
                    {currentSubtitle.translation}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Custom Controls Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
            {/* Progress Bar */}
            <div
              className="relative h-1 bg-slate-600 rounded-full cursor-pointer mb-4 group"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                seekTo(percent * duration);
              }}
            >
              <div
                className="absolute h-full bg-red-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
              <div
                className="absolute h-3 w-3 bg-red-500 rounded-full -top-1 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `${progressPercent}%`, transform: 'translateX(-50%)' }}
              />
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Play/Pause */}
                <button onClick={togglePlay} className="text-white hover:text-red-400 transition-colors">
                  {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
                </button>

                {/* Skip Buttons */}
                <button onClick={skipBackward} className="text-white hover:text-red-400 transition-colors">
                  <Rewind className="w-6 h-6" />
                </button>
                <button onClick={skipForward} className="text-white hover:text-red-400 transition-colors">
                  <FastForward className="w-6 h-6" />
                </button>

                {/* Volume */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="text-white hover:text-red-400 transition-colors"
                  >
                    {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      setVolume(parseFloat(e.target.value));
                      setIsMuted(false);
                    }}
                    className="w-20 accent-red-500"
                  />
                </div>

                {/* Time */}
                <span className="text-white text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center gap-4">
                {/* Subtitles Toggle */}
                <button
                  onClick={() => setShowSubtitles(!showSubtitles)}
                  className={`transition-colors ${showSubtitles ? 'text-red-400' : 'text-white hover:text-red-400'}`}
                >
                  <Subtitles className="w-6 h-6" />
                </button>

                {/* Translation Toggle */}
                <button
                  onClick={() => setShowTranslation(!showTranslation)}
                  className={`transition-colors ${showTranslation ? 'text-blue-400' : 'text-white hover:text-blue-400'}`}
                >
                  <Languages className="w-6 h-6" />
                </button>

                {/* Speed */}
                <div className="relative">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="text-white hover:text-red-400 transition-colors flex items-center gap-1"
                  >
                    <Settings className="w-6 h-6" />
                    <span className="text-sm">{playbackSpeed}x</span>
                  </button>
                  {showSettings && (
                    <div className="absolute bottom-full right-0 mb-2 bg-slate-800 rounded-lg border border-slate-700 py-2 min-w-32">
                      {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                        <button
                          key={speed}
                          onClick={() => {
                            setPlaybackSpeed(speed);
                            setShowSettings(false);
                          }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-700 ${
                            playbackSpeed === speed ? 'text-red-400' : 'text-white'
                          }`}
                        >
                          {speed}x {speed === 1 && '(기본)'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Fullscreen */}
                <button className="text-white hover:text-red-400 transition-colors">
                  <Maximize className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Info & Study Options */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Info */}
        <div className="lg:col-span-2 bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6">
          <h1 className="text-2xl font-bold text-white">{video.title}</h1>
          <p className="text-red-400 font-medium mt-2">{video.speaker}</p>
          <p className="text-slate-400 mt-4">{video.description}</p>

          <div className="flex flex-wrap gap-2 mt-4">
            {video.tags.map(tag => (
              <span key={tag} className="px-3 py-1 bg-slate-700/50 rounded-full text-sm text-slate-300">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Study Options */}
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">학습 모드</h2>
          <div className="space-y-3">
            <button
              onClick={() => onStartStudy('dictation')}
              className="w-full p-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl text-left hover:border-blue-500/60 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Subtitles className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium text-white group-hover:text-blue-400 transition-colors">
                    받아쓰기
                  </h3>
                  <p className="text-sm text-slate-400">듣고 영어로 받아쓰기</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => onStartStudy('shadowing')}
              className="w-full p-4 bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-xl text-left hover:border-green-500/60 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Volume2 className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="font-medium text-white group-hover:text-green-400 transition-colors">
                    쉐도잉
                  </h3>
                  <p className="text-sm text-slate-400">따라 말하며 발음 연습</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => onStartStudy('quiz')}
              className="w-full p-4 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 rounded-xl text-left hover:border-yellow-500/60 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <RotateCcw className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <h3 className="font-medium text-white group-hover:text-yellow-400 transition-colors">
                    퀴즈
                  </h3>
                  <p className="text-sm text-slate-400">내용 이해도 테스트</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => onStartStudy('vocabulary')}
              className="w-full p-4 bg-gradient-to-r from-pink-600/20 to-rose-600/20 border border-pink-500/30 rounded-xl text-left hover:border-pink-500/60 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-500/20 rounded-lg">
                  <Bookmark className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <h3 className="font-medium text-white group-hover:text-pink-400 transition-colors">
                    단어 학습
                  </h3>
                  <p className="text-sm text-slate-400">핵심 어휘 학습</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Transcript Section */}
      {transcript && (
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Subtitles className="w-5 h-5 text-blue-400" />
            스크립트
          </h2>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-4">
            {transcript.subtitles.map((subtitle) => (
              <div
                key={subtitle.id}
                onClick={() => seekTo(subtitle.startTime)}
                className={`p-3 rounded-lg cursor-pointer transition-all ${
                  currentSubtitle?.id === subtitle.id
                    ? 'bg-blue-500/20 border border-blue-500/30'
                    : 'hover:bg-slate-700/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xs text-slate-500 font-mono min-w-16">
                    {formatTime(subtitle.startTime)}
                  </span>
                  <div>
                    <p className={`${currentSubtitle?.id === subtitle.id ? 'text-white' : 'text-slate-300'}`}>
                      {subtitle.text}
                    </p>
                    {subtitle.translation && (
                      <p className="text-sm text-slate-500 mt-1">{subtitle.translation}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TedPlayer;
