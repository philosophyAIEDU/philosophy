import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from './contexts/AppContext';
import { MainLayout } from './components/layout';
import ApiKeySetup from './components/auth/ApiKeySetup';
import { LoadingSpinner, ErrorBoundary } from './components/common';

// Lazy load components
const TedLearning = lazy(() => import('./components/ted/TedLearning'));
const MyCollection = lazy(() => import('./components/ted/MyCollection'));
const LearningProgress = lazy(() => import('./components/ted/LearningProgress'));

// Page loading fallback component
const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <LoadingSpinner size="lg" text="Loading..." />
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
                <TedLearning />
              </RouteWrapper>
            }
          />
          <Route
            path="/collection"
            element={
              <RouteWrapper>
                <MyCollection />
              </RouteWrapper>
            }
          />
          <Route
            path="/progress"
            element={
              <RouteWrapper>
                <LearningProgress />
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
