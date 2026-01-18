import React, { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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



  const handleCloseSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  const handleNavigate = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  return (
    <div className={`min-h-screen bg-primary-950 font-sans text-primary-50 ${darkMode ? 'dark' : ''} selection:bg-accent-gold selection:text-primary-950`}>


      {/* Sidebar - Positioned differently in new layout */}
      <div className="flex h-screen overflow-hidden">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={handleCloseSidebar}
          currentPath={location.pathname}
          onNavigate={handleNavigate}
        />

        {/* Main content area */}
        <main
          className="
            flex-1 overflow-x-hidden overflow-y-auto
            bg-transparent relative z-10
            transition-all duration-300
          "
        >
          {/* Global Background Elements */}
          <div className="fixed inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-luxury opacity-100" />
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-gold/5 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-[100px]" />
          </div>

          <div className="relative p-6 lg:p-10 max-w-[1600px] mx-auto pt-24 lg:pt-10">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom safe area */}
      <div className="h-safe-area-inset-bottom lg:hidden" />
    </div>
  );
};

export default MainLayout;
