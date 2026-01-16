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
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64
          bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Mobile close button */}
        <div className="lg:hidden flex justify-end p-2">
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-3 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleNavClick(item.path)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-lg
                      transition-all duration-200 group
                      ${
                        active
                          ? 'bg-gray-100 dark:bg-gray-800 shadow-sm'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      }
                    `}
                    style={{
                      color: active ? item.color : undefined,
                    }}
                  >
                    <span
                      className={`
                        flex-shrink-0 transition-colors duration-200
                        ${
                          active
                            ? ''
                            : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                        }
                      `}
                      style={{
                        color: active ? item.color : undefined,
                      }}
                    >
                      {item.icon}
                    </span>
                    <span
                      className={`
                        font-medium text-sm transition-colors duration-200
                        ${
                          active
                            ? ''
                            : 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white'
                        }
                      `}
                      style={{
                        color: active ? item.color : undefined,
                      }}
                    >
                      {item.label}
                    </span>
                    {/* Active indicator */}
                    {active && (
                      <span
                        className="ml-auto w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom section - version info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Amobe English v1.0.0
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
