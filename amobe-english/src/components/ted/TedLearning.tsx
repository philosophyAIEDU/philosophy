import React, { useState } from 'react';
import { TedBrowser } from './TedBrowser';
import { TedPlayer } from './TedPlayer';
import type { TedVideo } from '../../types/ted';
import tedService from '../../services/tedService';

type ViewMode = 'browse' | 'watch';

export const TedLearning: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('browse');
  const [selectedVideo, setSelectedVideo] = useState<TedVideo | null>(null);

  const handleSelectVideo = (video: TedVideo) => {
    setSelectedVideo(video);
    setViewMode('watch');
    tedService.addToHistory(video.id, 0);
  };

  const handleBackToBrowse = () => {
    setViewMode('browse');
    setSelectedVideo(null);
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
        />
      )}
    </div>
  );
};

export default TedLearning;
