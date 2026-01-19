import React from 'react';
import { Play, X, BookOpen, BarChart3 } from 'lucide-react';
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
    id: 'ted',
    label: 'TED 학습',
    icon: <Play className="w-5 h-5" />,
    path: '/',
    color: '#EF4444', // red (TED brand color)
  },
  {
    id: 'collection',
    label: '나의 모음',
    icon: <BookOpen className="w-5 h-5" />,
    path: '/collection',
    color: '#8B5CF6', // purple
  },
  {
    id: 'progress',
    label: '학습현황',
    icon: <BarChart3 className="w-5 h-5" />,
    path: '/progress',
    color: '#3B82F6', // blue
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
          <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
            <Play className="w-5 h-5 text-white" />
          </div>
          TED 영어학습
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
                    ? 'bg-red-500/20 text-red-400 shadow-sm border border-red-500/30'
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

        {/* 학습 가이드 */}
        <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
          <h4 className="text-sm font-medium text-white mb-2">학습 방법</h4>
          <ol className="text-xs text-slate-400 space-y-1">
            <li>1. 영상 선택</li>
            <li>2. 학습 자료 생성</li>
            <li>3. 5단계 학습 진행</li>
          </ol>
        </div>

        <div className="text-xs text-green-400 flex items-center gap-2 mt-auto pt-6 border-t border-gray-800">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          시스템 온라인
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
