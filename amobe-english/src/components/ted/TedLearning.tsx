import React, { useState } from 'react';
import { TedBrowser } from './TedBrowser';
import { TedPlayer } from './TedPlayer';
import { TedStudyMode } from './TedStudyMode';
import type { TedVideo } from '../../types/ted';
import tedService from '../../services/tedService';

type ViewMode = 'browse' | 'watch' | 'study';
type StudyMode = 'dictation' | 'shadowing' | 'quiz' | 'vocabulary';

export const TedLearning: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('browse');
  const [selectedVideo, setSelectedVideo] = useState<TedVideo | null>(null);
  const [studyMode, setStudyMode] = useState<StudyMode | null>(null);

  const handleSelectVideo = (video: TedVideo) => {
    setSelectedVideo(video);
    setViewMode('watch');
    tedService.addToHistory(video.id, 0);
  };

  const handleBackToBrowse = () => {
    setViewMode('browse');
    setSelectedVideo(null);
    setStudyMode(null);
  };

  const handleBackToWatch = () => {
    setViewMode('watch');
    setStudyMode(null);
  };

  const handleStartStudy = (mode: StudyMode) => {
    setStudyMode(mode);
    setViewMode('study');
  };

  const handleStudyComplete = (score: number) => {
    // Save progress
    if (selectedVideo) {
      tedService.addToHistory(selectedVideo.id, score);
    }
    // Return to video player
    setViewMode('watch');
    setStudyMode(null);
  };

  return (
    <div className="p-6">
      {viewMode === 'browse' && (
        <TedBrowser onSelectVideo={handleSelectVideo} />
      )}

      {viewMode === 'watch' && selectedVideo && (
        <TedPlayer
          video={selectedVideo}
          onBack={handleBackToBrowse}
          onStartStudy={handleStartStudy}
        />
      )}

      {viewMode === 'study' && selectedVideo && studyMode && (
        <TedStudyMode
          video={selectedVideo}
          mode={studyMode}
          onBack={handleBackToWatch}
          onComplete={handleStudyComplete}
        />
      )}
    </div>
  );
};

export default TedLearning;
