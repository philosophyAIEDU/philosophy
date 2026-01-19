import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from './contexts/AppContext';
import { MainLayout } from './components/layout';
import ApiKeySetup from './components/auth/ApiKeySetup';
import { LoadingSpinner, ErrorBoundary } from './components/common';

// Lazy load route components for code splitting
const LearningDashboard = lazy(() => import('./components/learning/LearningDashboard'));
const ListeningModule = lazy(() => import('./components/learning/ListeningModule'));
const ReadingModule = lazy(() => import('./components/learning/ReadingModule'));
const WritingModule = lazy(() => import('./components/learning/WritingModule'));
const SpeakingModule = lazy(() => import('./components/learning/SpeakingModule'));
const VocabularyList = lazy(() => import('./components/vocabulary/VocabularyList'));
const ProgressTracker = lazy(() => import('./components/progress/ProgressTracker'));

// Page loading fallback component
const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <LoadingSpinner size="lg" text="Loading module..." />
  </div>
);

// Route wrapper with error boundary and suspense
const RouteWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary>
    <Suspense fallback={<PageLoader />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

function App() {
  const { state } = useApp();

  // Show loading while checking API key
  if (state.isLoading) {
    return <LoadingSpinner fullScreen text="Loading..." />;
  }

  // Show API key setup if not configured
  if (!state.isApiKeyValid) {
    return (
      <ErrorBoundary>
        <ApiKeySetup />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <MainLayout>
        <Routes>
          <Route
            path="/"
            element={
              <RouteWrapper>
                <LearningDashboard />
              </RouteWrapper>
            }
          />
          <Route
            path="/listening"
            element={
              <RouteWrapper>
                <ListeningModule />
              </RouteWrapper>
            }
          />
          <Route
            path="/reading"
            element={
              <RouteWrapper>
                <ReadingModule />
              </RouteWrapper>
            }
          />
          <Route
            path="/writing"
            element={
              <RouteWrapper>
                <WritingModule />
              </RouteWrapper>
            }
          />
          <Route
            path="/speaking"
            element={
              <RouteWrapper>
                <SpeakingModule />
              </RouteWrapper>
            }
          />
          <Route
            path="/vocabulary"
            element={
              <RouteWrapper>
                <VocabularyList />
              </RouteWrapper>
            }
          />
          <Route
            path="/progress"
            element={
              <RouteWrapper>
                <ProgressTracker />
              </RouteWrapper>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MainLayout>
    </ErrorBoundary>
  );
}

export default App;
