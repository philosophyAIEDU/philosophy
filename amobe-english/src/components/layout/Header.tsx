import React from 'react';
import { Moon, Sun, Settings, Key, CheckCircle, XCircle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

interface HeaderProps {
  onSettingsClick?: () => void;
  onToggleSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSettingsClick, onToggleSidebar }) => {
  const { state, dispatch } = useApp();
  const { isApiKeyValid, darkMode } = state;

  const handleDarkModeToggle = () => {
    dispatch({ type: 'TOGGLE_DARK_MODE' });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between h-full px-4">
        {/* Left section - Logo and mobile menu */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle sidebar"
          >
            <svg
              className="w-6 h-6 text-gray-600 dark:text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Amobe English
            </h1>
          </div>
        </div>

        {/* Right section - Status and controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* API Key Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800">
            <Key className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            {isApiKeyValid ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="hidden sm:inline text-sm text-green-600 dark:text-green-400 font-medium">
                  Connected
                </span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="hidden sm:inline text-sm text-red-600 dark:text-red-400 font-medium">
                  No API Key
                </span>
              </>
            )}
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={handleDarkModeToggle}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? (
              <Sun className="w-5 h-5 text-yellow-500" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            )}
          </button>

          {/* Settings Button */}
          <button
            onClick={onSettingsClick}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
