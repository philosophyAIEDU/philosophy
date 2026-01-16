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
import Card from '../common/Card';

const MODULE_COLORS = {
  listening: '#3B82F6',
  reading: '#10B981',
  writing: '#F59E0B',
  speaking: '#EF4444',
};

const MODULE_LABELS = {
  listening: '듣기',
  reading: '읽기',
  writing: '쓰기',
  speaking: '말하기',
};

const MODULE_ICONS = {
  listening: Headphones,
  reading: FileText,
  writing: Pencil,
  speaking: Mic,
};

const LEVEL_LABELS = {
  beginner: '초급',
  intermediate: '중급',
  advanced: '고급',
};

const ProgressTracker: React.FC = () => {
  const { state } = useApp();
  const { progress, vocabulary } = state;

  const formatMinutes = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}시간 ${mins}분`;
    }
    return `${mins}분`;
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
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-medium text-gray-900 dark:text-white">{label}</p>
          <p className="text-blue-600 dark:text-blue-400">
            {payload[0].value}분
          </p>
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-medium text-gray-900 dark:text-white">
            {payload[0].name}
          </p>
          <p style={{ color: payload[0].payload.color }}>
            {payload[0].value}분 ({payload[0].payload.count}회)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            학습 현황
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            나의 영어 학습 진행 상황을 확인하세요
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Calendar size={16} className="mr-1" />
          이번 주
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Study Time */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500 rounded-xl">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                총 학습 시간
              </p>
              <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
                {formatMinutes(progress.totalMinutes)}
              </p>
            </div>
          </div>
        </Card>

        {/* Streak Days */}
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-500 rounded-xl">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-orange-700 dark:text-orange-300">
                연속 학습
              </p>
              <p className="text-xl font-bold text-orange-900 dark:text-orange-100">
                {progress.streakDays}일
              </p>
            </div>
          </div>
        </Card>

        {/* Completed Sessions */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500 rounded-xl">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-green-700 dark:text-green-300">
                완료 세션
              </p>
              <p className="text-xl font-bold text-green-900 dark:text-green-100">
                {totalSessions}회
              </p>
            </div>
          </div>
        </Card>

        {/* Vocabulary Count */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500 rounded-xl">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                저장 단어
              </p>
              <p className="text-xl font-bold text-purple-900 dark:text-purple-100">
                {vocabulary.length}개
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Current Level Progress */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                현재 레벨
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                다음 레벨까지의 진행률
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium">
              {LEVEL_LABELS[progress.currentLevel]}
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">진행률</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {progress.levelProgress}%
            </span>
          </div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${progress.levelProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
            {progress.currentLevel === 'beginner'
              ? '중급'
              : progress.currentLevel === 'intermediate'
              ? '고급'
              : '마스터'}
            까지 {100 - progress.levelProgress}% 남음
          </p>
        </div>
      </Card>

      {/* Module Stats */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <Target className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            모듈별 학습 현황
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
                className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {label}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold" style={{ color }}>
                    {stat.count}
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">
                      회
                    </span>
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatMinutes(stat.minutes)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Weekly Bar Chart */}
        <Card>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            주간 학습 시간
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <XAxis
                  dataKey="day"
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  axisLine={{ stroke: '#E5E7EB' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  axisLine={{ stroke: '#E5E7EB' }}
                  tickLine={false}
                  tickFormatter={(value) => `${value}분`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="minutes"
                  fill="#3B82F6"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Module Distribution Pie Chart */}
        <Card>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            모듈별 분포
          </h3>
          <div className="h-64 flex items-center">
            <div className="w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={moduleData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {moduleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-2">
              {moduleData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400 flex-1">
                    {item.name}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.value}분
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Achievements / Goals Section */}
      <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-amber-200 dark:border-amber-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
            <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="font-semibold text-amber-900 dark:text-amber-100">
            이번 주 목표
          </h3>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              학습 시간
            </p>
            <div className="flex items-end gap-1">
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {Math.round(
                  weeklyData.reduce((sum, d) => sum + d.minutes, 0)
                )}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                / 150분
              </span>
            </div>
          </div>
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              학습 일수
            </p>
            <div className="flex items-end gap-1">
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {weeklyData.filter((d) => d.minutes > 0).length}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                / 5일
              </span>
            </div>
          </div>
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              새 단어
            </p>
            <div className="flex items-end gap-1">
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {vocabulary.filter((v) => v.reviewCount === 0).length}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                / 20개
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProgressTracker;
