import React from 'react';
import {
  Home,
  Headphones,
  Book,
  PenTool,
  Mic,
  BookOpen,
  BarChart2,
  X,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  color: string;
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <Home className="w-5 h-5" />,
    path: '/',
    color: '#6B7280', // gray
  },
  {
    id: 'listening',
    label: 'Listening',
    icon: <Headphones className="w-5 h-5" />,
    path: '/listening',
    color: '#3B82F6', // blue
  },
  {
    id: 'reading',
    label: 'Reading',
    icon: <Book className="w-5 h-5" />,
    path: '/reading',
    color: '#10B981', // green
  },
  {
    id: 'writing',
    label: 'Writing',
    icon: <PenTool className="w-5 h-5" />,
    path: '/writing',
    color: '#F59E0B', // amber
  },
  {
    id: 'speaking',
    label: 'Speaking',
    icon: <Mic className="w-5 h-5" />,
    path: '/speaking',
    color: '#EF4444', // red
  },
  {
    id: 'vocabulary',
    label: 'Vocabulary',
    icon: <BookOpen className="w-5 h-5" />,
    path: '/vocabulary',
    color: '#8B5CF6', // purple
  },
  {
    id: 'progress',
    label: 'Progress',
    icon: <BarChart2 className="w-5 h-5" />,
    path: '/progress',
    color: '#EC4899', // pink
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  currentPath = '/',
  onNavigate,
}) => {
  useApp(); // Access app context for future features

  const handleNavClick = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    }
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return currentPath === '/';
    }
    return currentPath.startsWith(path);
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-primary-950/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 lg:top-auto lg:relative z-40 h-full lg:h-auto w-72
          bg-white/50 dark:bg-primary-900/50 backdrop-blur-xl border-r border-primary-200 dark:border-primary-800
          transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1)
          lg:translate-x-0 pt-20 lg:pt-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Mobile close button */}
        <div className="lg:hidden absolute top-6 right-4">
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-primary-100 dark:hover:bg-primary-800 transition-colors text-primary-500"
            aria-label="Close sidebar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-4 py-8">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleNavClick(item.path)}
                    className={`
                      w-full flex items-center gap-4 px-6 py-4 rounded-xl
                      transition-all duration-300 group relative overflow-hidden
                      ${active
                        ? 'bg-gradient-to-r from-primary-900 to-primary-800 dark:from-primary-100 dark:to-primary-200 text-white dark:text-primary-900 shadow-lg shadow-primary-900/10'
                        : 'hover:bg-primary-100 dark:hover:bg-primary-800/50 text-primary-600 dark:text-primary-400'
                      }
                    `}
                  >
                    <span
                      className={`
                        flex-shrink-0 transition-colors duration-300
                        ${active
                          ? 'text-accent-gold'
                          : 'text-primary-400 dark:text-primary-500 group-hover:text-primary-600 dark:group-hover:text-primary-300'
                        }
                      `}
                    >
                      {item.icon}
                    </span>
                    <span className="font-medium text-base tracking-wide relative z-10">
                      {item.label}
                    </span>

                    {/* Active Indicator Line */}
                    {active && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent-gold/80" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom section - version info */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-primary-200 dark:border-primary-800">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-semibold text-primary-400 uppercase tracking-widest">System Online</span>
          </div>
          <p className="text-xs text-primary-400 dark:text-primary-500 text-center font-serif italic">
            Amobe English v1.0.0
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
