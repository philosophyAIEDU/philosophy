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
    <header className="relative z-50 h-20 bg-white/80 dark:bg-primary-900/80 backdrop-blur-md border-b border-primary-200 dark:border-primary-800 transition-colors duration-300">
      <div className="flex items-center justify-between h-full px-6 max-w-7xl mx-auto">
        {/* Left section - Logo and mobile menu */}
        <div className="flex items-center gap-6">
          {/* Mobile menu button */}
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 -ml-2 rounded-full hover:bg-primary-100 dark:hover:bg-primary-800 transition-colors text-primary-600 dark:text-primary-300"
            aria-label="사이드바 토글"
          >
            <svg
              className="w-6 h-6"
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
          <div className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-gold rounded-xl shadow-lg flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300">
              <span className="text-primary-950 font-serif font-bold text-2xl">A</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-serif font-bold text-primary-900 dark:text-primary-50 leading-none">
                Amobe English
              </h1>
              <span className="text-xs text-accent-goldDark dark:text-accent-gold tracking-widest uppercase font-medium mt-1">
                프리미엄 학습
              </span>
            </div>
          </div>
        </div>

        {/* Right section - Status and controls */}
        <div className="flex items-center gap-4">
          {/* API Key Status */}
          <div className={`
            flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-sm transition-colors duration-300
            ${isApiKeyValid
              ? 'bg-green-50/50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
              : 'bg-red-50/50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'}
          `}>
            <Key className="w-4 h-4" />
            <span className="hidden sm:inline text-xs font-semibold uppercase tracking-wider">
              {isApiKeyValid ? '연결됨' : '키 없음'}
            </span>
            {isApiKeyValid ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
          </div>

          <div className="h-8 w-px bg-primary-200 dark:bg-primary-700 mx-2" />

          {/* Dark Mode Toggle */}
          <button
            onClick={handleDarkModeToggle}
            className="p-2.5 rounded-full hover:bg-primary-100 dark:hover:bg-primary-800 text-primary-600 dark:text-primary-400 transition-all duration-300 hover:scale-105 active:scale-95"
            aria-label={darkMode ? '라이트 모드로 전환' : '다크 모드로 전환'}
          >
            {darkMode ? (
              <Sun className="w-5 h-5 text-accent-gold" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {/* Settings Button */}
          <button
            onClick={onSettingsClick}
            className="p-2.5 rounded-full hover:bg-primary-100 dark:hover:bg-primary-800 text-primary-600 dark:text-primary-400 transition-all duration-300 hover:scale-105 active:scale-95"
            aria-label="설정"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
