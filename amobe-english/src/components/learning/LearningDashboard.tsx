import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Headphones,
  BookOpen,
  PenTool,
  Mic,
  Clock,
  Calendar,
  TrendingUp,
  Award,
  Flag,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import LoadingSpinner from '../common/LoadingSpinner';
import { ModuleType } from '../../types/learning';

interface ModuleCardData {
  type: ModuleType;
  title: string;
  description: string;
  icon: React.ReactNode;
  bgColor: string;
  hoverColor: string;
  iconBgColor: string;
  minutes: number;
  count: number;
}



const LearningDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useApp();
  const { userProfile, progress, isLoading } = state;

  if (isLoading) {
    return <LoadingSpinner size="lg" text="Preparing your dashboard..." fullScreen />;
  }

  const dailyGoal = userProfile?.preferences?.dailyGoalMinutes || 30;
  const todayMinutes = 15;
  const progressPercent = Math.min((todayMinutes / dailyGoal) * 100, 100);

  const moduleCards: ModuleCardData[] = [
    {
      type: 'listening',
      title: 'Listening',
      description: 'Master English comprehension',
      icon: <Headphones className="w-8 h-8" />,
      bgColor: 'bg-primary-900/50',
      hoverColor: 'hover:bg-primary-800/80',
      iconBgColor: 'bg-blue-500/10 text-blue-400',
      minutes: progress.moduleStats.listening.minutes,
      count: progress.moduleStats.listening.count,
    },
    {
      type: 'reading',
      title: 'Reading',
      description: 'Expand vocabulary & context',
      icon: <BookOpen className="w-8 h-8" />,
      bgColor: 'bg-primary-900/50',
      hoverColor: 'hover:bg-primary-800/80',
      iconBgColor: 'bg-green-500/10 text-green-400',
      minutes: progress.moduleStats.reading.minutes,
      count: progress.moduleStats.reading.count,
    },
    {
      type: 'writing',
      title: 'Writing',
      description: 'Perfect your composition',
      icon: <PenTool className="w-8 h-8" />,
      bgColor: 'bg-primary-900/50',
      hoverColor: 'hover:bg-primary-800/80',
      iconBgColor: 'bg-amber-500/10 text-amber-400',
      minutes: progress.moduleStats.writing.minutes,
      count: progress.moduleStats.writing.count,
    },
    {
      type: 'speaking',
      title: 'Speaking',
      description: 'Fluency through conversation',
      icon: <Mic className="w-8 h-8" />,
      bgColor: 'bg-primary-900/50',
      hoverColor: 'hover:bg-primary-800/80',
      iconBgColor: 'bg-red-500/10 text-red-400',
      minutes: progress.moduleStats.speaking.minutes,
      count: progress.moduleStats.speaking.count,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Welcome Section */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-luxury p-8 md:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <Award className="w-64 h-64 text-accent-gold" />
        </div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="text-accent-gold font-medium tracking-widest uppercase text-sm mb-2">
                Welcome Back
              </p>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">
                {userProfile?.name || 'Student'}
              </h1>
              <p className="text-primary-300 text-lg max-w-xl font-light">
                Continuity is the key to mastery. You are on a <span className="text-white font-medium">{progress.streakDays} day streak</span>.
              </p>
            </div>

            <div className="flex gap-4">
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 min-w-[140px]">
                <p className="text-primary-400 text-xs uppercase tracking-wider mb-1">Daily Goal</p>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold text-white">{todayMinutes}</span>
                  <span className="text-primary-400 mb-1">/ {dailyGoal}m</span>
                </div>
                <div className="mt-3 h-1.5 bg-primary-800 rounded-full overflow-hidden">
                  <div className="h-full bg-accent-gold rounded-full" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Modules - Spans 8 cols */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {moduleCards.map((card) => (
            <button
              key={card.type}
              onClick={() => navigate(`/${card.type}`)}
              className={`
                group relative overflow-hidden rounded-2xl p-6 transition-all duration-300
                bg-white/80 dark:bg-primary-900/40 border border-primary-200 dark:border-primary-800
                hover:border-accent-gold/50 hover:shadow-lg hover:shadow-accent-gold/5
              `}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-primary-50 dark:to-primary-800/20 opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative z-10 flex items-start justify-between mb-8">
                <div className={`p-3 rounded-2xl ${card.iconBgColor} group-hover:scale-110 transition-transform duration-300`}>
                  {card.icon}
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/80 text-xs font-medium text-primary-600 dark:text-primary-400">
                  <Clock className="w-3 h-3" />
                  {card.minutes}m
                </div>
              </div>

              <div className="relative z-10 text-left">
                <h3 className="text-xl font-bold text-primary-900 dark:text-primary-50 mb-1 font-serif group-hover:text-accent-gold transition-colors">
                  {card.title}
                </h3>
                <p className="text-sm text-primary-500 dark:text-primary-400">
                  {card.description}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Sidebar Widgets - Spans 4 cols */}
        <div className="lg:col-span-4 space-y-6">

          {/* Today's Plan */}
          <div className="luxury-card rounded-2xl p-6 bg-white/80 dark:bg-primary-900/40 border border-primary-200 dark:border-primary-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-primary-900 dark:text-primary-50 font-serif">Today's Focus</h3>
              <Calendar className="w-5 h-5 text-accent-gold" />
            </div>

            <div className="space-y-3">
              {[
                { task: 'Morning News Listening', time: '10m', done: true },
                { task: 'Vocabulary Review', time: '5m', done: false },
                { task: 'Daily Journal', time: '15m', done: false },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-800/50 transition-colors group cursor-pointer">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${item.done ? 'bg-accent-gold border-accent-gold' : 'border-primary-300 dark:border-primary-600'}`}>
                    {item.done && <Flag className="w-3 h-3 text-primary-900" />}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${item.done ? 'text-primary-400 line-through' : 'text-primary-900 dark:text-primary-100'}`}>
                      {item.task}
                    </p>
                  </div>
                  <span className="text-xs text-primary-400 font-mono">{item.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats/Graph Placeholder */}
          <div className="luxury-card rounded-2xl p-6 bg-gradient-to-br from-primary-900 to-primary-950 border border-primary-800 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-accent-gold" />
                <span className="font-medium">Weekly Growth</span>
              </div>
              <span className="text-accent-gold font-bold">+12%</span>
            </div>
            <div className="h-32 flex items-end justify-between gap-2">
              {[40, 70, 50, 90, 60, 80, 75].map((h, i) => (
                <div key={i} className="w-full bg-primary-800 rounded-t-sm relative group">
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-accent-gold/80 rounded-t-sm transition-all duration-500 group-hover:bg-accent-gold"
                    style={{ height: `${h}%` }}
                  />
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LearningDashboard;
