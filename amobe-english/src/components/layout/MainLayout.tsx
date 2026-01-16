import React, { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { useApp } from '../../contexts/AppContext';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { state } = useApp();
  const { darkMode } = state;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleToggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const handleCloseSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  const handleNavigate = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-950 ${darkMode ? 'dark' : ''}`}>
      {/* Header */}
      <Header
        onToggleSidebar={handleToggleSidebar}
      />

      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
        currentPath={location.pathname}
        onNavigate={handleNavigate}
      />

      {/* Main content area */}
      <main
        className="
          pt-16 lg:pl-64
          min-h-screen
          transition-all duration-300
        "
      >
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Content wrapper with max width for readability */}
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile bottom safe area */}
      <div className="h-safe-area-inset-bottom lg:hidden" />
    </div>
  );
};

export default MainLayout;
