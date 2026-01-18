import React from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Clock,
  Flame,
  BookOpen,
  Headphones,
  FileText,
  Pencil,
  Mic,
  TrendingUp,
  Award,
  Calendar,
  Target,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import Button from '../common/Button';

const MODULE_COLORS = {
  listening: '#60A5FA', // blue-400
  reading: '#34D399',   // emerald-400
  writing: '#FBBF24',   // amber-400
  speaking: '#F87171',  // red-400
};

const MODULE_LABELS = {
  listening: 'Listening',
  reading: 'Reading',
  writing: 'Writing',
  speaking: 'Speaking',
};

const MODULE_ICONS = {
  listening: Headphones,
  reading: FileText,
  writing: Pencil,
  speaking: Mic,
};

const LEVEL_LABELS = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

const ProgressTracker: React.FC = () => {
  const { state } = useApp();
  const { progress, vocabulary } = state;

  const formatMinutes = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const totalSessions = Object.values(progress.moduleStats).reduce(
    (sum, stat) => sum + stat.count,
    0
  );

  const moduleData = Object.entries(progress.moduleStats).map(([key, stat]) => ({
    name: MODULE_LABELS[key as keyof typeof MODULE_LABELS],
    value: stat.minutes,
    count: stat.count,
    color: MODULE_COLORS[key as keyof typeof MODULE_COLORS],
  }));

  const weeklyData = progress.weeklyData.length > 0
    ? progress.weeklyData
    : [
      { day: '월', minutes: 0 },
      { day: '화', minutes: 0 },
      { day: '수', minutes: 0 },
      { day: '목', minutes: 0 },
      { day: '금', minutes: 0 },
      { day: '토', minutes: 0 },
      { day: '일', minutes: 0 },
    ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-navy-card p-3 rounded-lg shadow-xl border border-gray-700">
          <p className="font-medium text-white">{label}</p>
          <p className="text-accent-blue font-bold">
            {payload[0].value} min
          </p>
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-navy-card p-3 rounded-lg shadow-xl border border-gray-700">
          <p className="font-medium text-white mb-1">
            {payload[0].name}
          </p>
          <p style={{ color: payload[0].payload.color }} className="font-bold">
            {payload[0].value} min ({payload[0].payload.count} sessions)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-fade-in p-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-serif font-bold text-white mb-1">
            Learning Progress
          </h2>
          <p className="text-gray-400">
            Track your English learning journey
          </p>
        </div>
        <Button
          className="border-gray-600 text-gray-300 hover:text-white hover:bg-gray-800"
          variant="outline"
          size="sm"
        >
          <Calendar size={16} className="mr-1" />
          This Week
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Study Time */}
        <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 border border-blue-700/50 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600/20 rounded-xl border border-blue-500/30">
              <Clock className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-blue-200 font-medium">
                Total Time
              </p>
              <p className="text-2xl font-bold text-white mt-1">
                {formatMinutes(progress.totalMinutes)}
              </p>
            </div>
          </div>
        </div>

        {/* Streak Days */}
        <div className="bg-gradient-to-br from-orange-900/40 to-orange-800/20 border border-orange-700/50 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-600/20 rounded-xl border border-orange-500/30">
              <Flame className="w-8 h-8 text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-orange-200 font-medium">
                Streak
              </p>
              <p className="text-2xl font-bold text-white mt-1">
                {progress.streakDays} days
              </p>
            </div>
          </div>
        </div>

        {/* Completed Sessions */}
        <div className="bg-gradient-to-br from-green-900/40 to-green-800/20 border border-green-700/50 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-600/20 rounded-xl border border-green-500/30">
              <BookOpen className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-green-200 font-medium">
                Sessions
              </p>
              <p className="text-2xl font-bold text-white mt-1">
                {totalSessions}
              </p>
            </div>
          </div>
        </div>

        {/* Vocabulary Count */}
        <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 border border-purple-700/50 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-600/20 rounded-xl border border-purple-500/30">
              <Award className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-purple-200 font-medium">
                Words
              </p>
              <p className="text-2xl font-bold text-white mt-1">
                {vocabulary.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Current Level Progress */}
      <div className="bg-navy-card border border-gray-700 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-900/30 rounded-xl border border-indigo-500/30">
              <TrendingUp className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Current Level
              </h3>
              <p className="text-sm text-gray-400">
                Progress to next level
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block px-4 py-1.5 bg-indigo-900/30 text-indigo-300 border border-indigo-500/30 rounded-full text-sm font-bold uppercase tracking-wide">
              {LEVEL_LABELS[progress.currentLevel]}
            </span>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400 font-medium">Progress</span>
            <span className="font-bold text-indigo-300">
              {progress.levelProgress}%
            </span>
          </div>
          <div className="h-4 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
            <div
              className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]"
              style={{ width: `${progress.levelProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 text-right font-medium">
            {100 - progress.levelProgress}% to {progress.currentLevel === 'beginner'
              ? 'Intermediate'
              : progress.currentLevel === 'intermediate'
                ? 'Advanced'
                : 'Master'}
          </p>
        </div>
      </div>

      {/* Module Stats */}
      <div className="bg-navy-card border border-gray-700 rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-gray-800 rounded-xl border border-gray-700">
            <Target className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-xl font-serif font-bold text-white">
            Module Breakdown
          </h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(progress.moduleStats).map(([key, stat]) => {
            const Icon = MODULE_ICONS[key as keyof typeof MODULE_ICONS];
            const color = MODULE_COLORS[key as keyof typeof MODULE_COLORS];
            const label = MODULE_LABELS[key as keyof typeof MODULE_LABELS];
            return (
              <div
                key={key}
                className="p-5 rounded-2xl border border-gray-700 bg-gray-800/30 hover:bg-gray-800/50 hover:border-gray-600 transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="p-2.5 rounded-xl border border-opacity-20 shadow-inner"
                    style={{ backgroundColor: `${color}15`, borderColor: color }}
                  >
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <span className="font-bold text-gray-200">
                    {label}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold" style={{ color }}>
                    {stat.count}
                    <span className="text-sm font-medium text-gray-500 ml-1">
                      times
                    </span>
                  </p>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-widest">
                    {formatMinutes(stat.minutes)} total
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Weekly Bar Chart */}
        <div className="bg-navy-card border border-gray-700 rounded-2xl p-6">
          <h3 className="text-xl font-serif font-bold text-white mb-6">
            Weekly Activity
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <XAxis
                  dataKey="day"
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  axisLine={{ stroke: '#374151' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  axisLine={{ stroke: '#374151' }}
                  tickLine={false}
                  tickFormatter={(value) => `${value}m`}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                />
                <Bar
                  dataKey="minutes"
                  fill="#60A5FA"
                  radius={[4, 4, 0, 0]}
                  barSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Module Distribution Pie Chart */}
        <div className="bg-navy-card border border-gray-700 rounded-2xl p-6">
          <h3 className="text-xl font-serif font-bold text-white mb-6">
            Time Distribution
          </h3>
          <div className="h-72 flex flex-col sm:flex-row items-center">
            <div className="w-full sm:w-1/2 h-48 sm:h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={moduleData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {moduleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full sm:w-1/2 space-y-3 mt-4 sm:mt-0 pl-0 sm:pl-4">
              {moduleData.map((item) => (
                <div key={item.name} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800/50 transition-colors">
                  <div
                    className="w-3 h-3 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]"
                    style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}60` }}
                  />
                  <span className="text-sm text-gray-300 flex-1 font-medium">
                    {item.name}
                  </span>
                  <span className="text-sm font-bold text-white">
                    {item.value}m
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Achievements / Goals Section */}
      <div className="bg-gradient-to-r from-amber-900/20 to-yellow-900/20 border border-amber-700/30 rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-amber-900/30 rounded-xl border border-amber-500/30">
            <Award className="w-6 h-6 text-amber-400" />
          </div>
          <h3 className="text-xl font-serif font-bold text-amber-100">
            Weekly Goals
          </h3>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="bg-navy-card/80 border border-gray-700 rounded-xl p-4">
            <p className="text-sm text-gray-400 mb-2 font-medium">
              Study Time
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-white">
                {Math.round(
                  weeklyData.reduce((sum, d) => sum + d.minutes, 0)
                )}
              </span>
              <span className="text-sm text-gray-500">
                / 150m
              </span>
            </div>
          </div>
          <div className="bg-navy-card/80 border border-gray-700 rounded-xl p-4">
            <p className="text-sm text-gray-400 mb-2 font-medium">
              Study Days
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-white">
                {weeklyData.filter((d) => d.minutes > 0).length}
              </span>
              <span className="text-sm text-gray-500">
                / 5 days
              </span>
            </div>
          </div>
          <div className="bg-navy-card/80 border border-gray-700 rounded-xl p-4">
            <p className="text-sm text-gray-400 mb-2 font-medium">
              New Words
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-white">
                {vocabulary.filter((v) => v.reviewCount === 0).length}
              </span>
              <span className="text-sm text-gray-500">
                / 20
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressTracker;
