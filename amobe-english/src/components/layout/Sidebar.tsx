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
    label: '대시보드',
    icon: <Home className="w-5 h-5" />,
    path: '/',
    color: '#6B7280', // gray
  },
  {
    id: 'listening',
    label: '듣기',
    icon: <Headphones className="w-5 h-5" />,
    path: '/listening',
    color: '#3B82F6', // blue
  },
  {
    id: 'reading',
    label: '읽기',
    icon: <Book className="w-5 h-5" />,
    path: '/reading',
    color: '#10B981', // green
  },
  {
    id: 'writing',
    label: '쓰기',
    icon: <PenTool className="w-5 h-5" />,
    path: '/writing',
    color: '#F59E0B', // amber
  },
  {
    id: 'speaking',
    label: '말하기',
    icon: <Mic className="w-5 h-5" />,
    path: '/speaking',
    color: '#EF4444', // red
  },
  {
    id: 'vocabulary',
    label: '단어장',
    icon: <BookOpen className="w-5 h-5" />,
    path: '/vocabulary',
    color: '#8B5CF6', // purple
  },
  {
    id: 'progress',
    label: '학습 현황',
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
  useApp();

  const handleNavClick = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    }
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const isActive = (path: string) => {
    if (path === '/') return currentPath === '/';
    return currentPath.startsWith(path);
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 lg:top-auto lg:relative z-40 h-full lg:h-auto w-64
          bg-navy-card border-r border-gray-700
          transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1)
          lg:translate-x-0 flex flex-col p-6
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="lg:hidden absolute top-6 right-4">
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex items-center gap-3 mb-10 text-xl font-serif font-bold text-white">
          <div className="w-8 h-8 bg-accent-blue rounded-lg"></div>
          Amobe
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.path)}
                className={`
                    w-full flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all
                    ${active
                    ? 'bg-gray-700/50 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }
                  `}
              >
                <span className="flex-shrink-0">
                  {item.icon}
                </span>
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="text-xs text-green-400 flex items-center gap-2 mt-auto pt-6 border-t border-gray-800">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          시스템 온라인
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
