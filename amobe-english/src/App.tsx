import { Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from './contexts/AppContext';
import { MainLayout } from './components/layout';
import ApiKeySetup from './components/auth/ApiKeySetup';
import {
  LearningDashboard,
  ListeningModule,
  ReadingModule,
  WritingModule,
  SpeakingModule
} from './components/learning';
import VocabularyList from './components/vocabulary/VocabularyList';
import ProgressTracker from './components/progress/ProgressTracker';
import { LoadingSpinner } from './components/common';

function App() {
  const { state } = useApp();

  // Show loading while checking API key
  if (state.isLoading) {
    return <LoadingSpinner fullScreen text="로딩 중..." />;
  }

  // Show API key setup if not configured
  if (!state.isApiKeyValid) {
    return <ApiKeySetup />;
  }

  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<LearningDashboard />} />
        <Route path="/listening" element={<ListeningModule />} />
        <Route path="/reading" element={<ReadingModule />} />
        <Route path="/writing" element={<WritingModule />} />
        <Route path="/speaking" element={<SpeakingModule />} />
        <Route path="/vocabulary" element={<VocabularyList />} />
        <Route path="/progress" element={<ProgressTracker />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MainLayout>
  );
}

export default App;
