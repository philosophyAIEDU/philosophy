import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Headphones,
  BookOpen,
  PenTool,
  Mic,
  Clock,
  Target,
  ChevronRight,
  Flame,
  Calendar,
  TrendingUp,
  BarChart3,
  Award,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import Card from '../common/Card';
import LoadingSpinner from '../common/LoadingSpinner';
import { ModuleType, UserLevel } from '../../types/learning';

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

const levelLabels: Record<UserLevel, { ko: string; en: string; color: string }> = {
  beginner: { ko: '초급', en: 'Beginner', color: 'bg-green-100 text-green-800' },
  intermediate: { ko: '중급', en: 'Intermediate', color: 'bg-yellow-100 text-yellow-800' },
  advanced: { ko: '고급', en: 'Advanced', color: 'bg-purple-100 text-purple-800' },
};

const LearningDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useApp();
  const { userProfile, progress, isLoading } = state;

  if (isLoading) {
    return <LoadingSpinner size="lg" text="로딩 중..." fullScreen />;
  }

  const currentLevel = userProfile?.level || 'beginner';
  const levelInfo = levelLabels[currentLevel];

  const moduleCards: ModuleCardData[] = [
    {
      type: 'listening',
      title: '듣기',
      description: '영어 듣기 능력 향상',
      icon: <Headphones className="w-6 h-6" />,
      bgColor: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      iconBgColor: 'bg-blue-100',
      minutes: progress.moduleStats.listening.minutes,
      count: progress.moduleStats.listening.count,
    },
    {
      type: 'reading',
      title: '읽기',
      description: '독해력과 어휘력 향상',
      icon: <BookOpen className="w-6 h-6" />,
      bgColor: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
      iconBgColor: 'bg-green-100',
      minutes: progress.moduleStats.reading.minutes,
      count: progress.moduleStats.reading.count,
    },
    {
      type: 'writing',
      title: '쓰기',
      description: 'AI 첨삭으로 작문 실력 향상',
      icon: <PenTool className="w-6 h-6" />,
      bgColor: 'bg-orange-500',
      hoverColor: 'hover:bg-orange-600',
      iconBgColor: 'bg-orange-100',
      minutes: progress.moduleStats.writing.minutes,
      count: progress.moduleStats.writing.count,
    },
    {
      type: 'speaking',
      title: '말하기',
      description: 'AI 대화로 회화 연습',
      icon: <Mic className="w-6 h-6" />,
      bgColor: 'bg-red-500',
      hoverColor: 'hover:bg-red-600',
      iconBgColor: 'bg-red-100',
      minutes: progress.moduleStats.speaking.minutes,
      count: progress.moduleStats.speaking.count,
    },
  ];

  const todayPlan = [
    { module: 'listening' as ModuleType, task: '뉴스 청취 (5분)', icon: <Headphones className="w-4 h-4" /> },
    { module: 'reading' as ModuleType, task: '기사 읽기 (10분)', icon: <BookOpen className="w-4 h-4" /> },
    { module: 'writing' as ModuleType, task: '일기 작성 (10분)', icon: <PenTool className="w-4 h-4" /> },
    { module: 'speaking' as ModuleType, task: '자유 대화 (5분)', icon: <Mic className="w-4 h-4" /> },
  ];

  const recentHistory = [
    { date: '오늘', module: '듣기', activity: 'TED 강연 청취', duration: '15분' },
    { date: '어제', module: '쓰기', activity: '이메일 작성 연습', duration: '20분' },
    { date: '2일 전', module: '말하기', activity: '카페 주문 시뮬레이션', duration: '10분' },
    { date: '3일 전', module: '읽기', activity: '뉴스 기사 독해', duration: '25분' },
  ];

  const dailyGoal = userProfile?.preferences?.dailyGoalMinutes || 30;
  const todayMinutes = 15; // This would come from actual tracking
  const progressPercent = Math.min((todayMinutes / dailyGoal) * 100, 100);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {userProfile?.name ? `${userProfile.name}님, 안녕하세요!` : '안녕하세요!'}
            </h1>
            <p className="text-gray-600 mt-1">오늘도 영어 학습을 시작해볼까요?</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${levelInfo.color}`}>
              {levelInfo.ko} ({levelInfo.en})
            </span>
            <div className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-800 rounded-full">
              <Flame className="w-4 h-4" />
              <span className="font-medium">{progress.streakDays}일 연속</span>
            </div>
          </div>
        </div>

        {/* Progress Summary */}
        <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <Target className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">오늘의 학습 목표</h3>
                  <p className="text-white/80">{todayMinutes}분 / {dailyGoal}분 완료</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold">{progress.totalMinutes}</p>
                  <p className="text-sm text-white/80">총 학습 시간(분)</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{Math.round(progress.levelProgress)}%</p>
                  <p className="text-sm text-white/80">레벨 진행도</p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Today's Learning Plan */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-semibold text-gray-900">오늘의 학습 계획</h2>
              </div>
              <span className="text-sm text-gray-500">{new Date().toLocaleDateString('ko-KR')}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {todayPlan.map((item, index) => (
                <button
                  key={index}
                  onClick={() => navigate(`/${item.module}`)}
                  className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left"
                >
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                    {item.icon}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{item.task}</span>
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Module Cards */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">학습 모듈</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {moduleCards.map((card) => (
              <button
                key={card.type}
                onClick={() => navigate(`/${card.type}`)}
                className={`${card.bgColor} ${card.hoverColor} text-white rounded-2xl p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 text-left`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 ${card.iconBgColor} rounded-xl`}>
                    <div className="text-gray-700">{card.icon}</div>
                  </div>
                  <ChevronRight className="w-5 h-5 opacity-70" />
                </div>
                <h3 className="text-xl font-bold mb-1">{card.title}</h3>
                <p className="text-sm opacity-90 mb-4">{card.description}</p>
                <div className="flex items-center gap-4 text-sm opacity-80">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{card.minutes}분</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BarChart3 className="w-4 h-4" />
                    <span>{card.count}회</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Section: Recent History & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Learning History */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-lg font-semibold text-gray-900">최근 학습 기록</h2>
                </div>
                <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                  전체 보기
                </button>
              </div>
              <div className="space-y-3">
                {recentHistory.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-xs font-medium">
                        {item.module}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{item.activity}</p>
                        <p className="text-sm text-gray-500">{item.date}</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-600">{item.duration}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Weekly Stats */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-lg font-semibold text-gray-900">주간 통계</h2>
                </div>
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <TrendingUp className="w-4 h-4" />
                  <span>+12% 지난주 대비</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-4 bg-blue-50 rounded-xl">
                  <div className="flex items-center gap-2 text-blue-600 mb-2">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">총 학습 시간</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{progress.totalMinutes}분</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-xl">
                  <div className="flex items-center gap-2 text-orange-600 mb-2">
                    <Flame className="w-4 h-4" />
                    <span className="text-sm font-medium">연속 학습</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{progress.streakDays}일</p>
                </div>
              </div>
              <div className="flex items-end justify-between h-32 gap-2">
                {progress.weeklyData.length > 0 ? (
                  progress.weeklyData.map((data, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-indigo-200 rounded-t-md transition-all"
                        style={{ height: `${Math.max((data.minutes / 60) * 100, 10)}%` }}
                      />
                      <span className="text-xs text-gray-500 mt-2">{data.day}</span>
                    </div>
                  ))
                ) : (
                  ['월', '화', '수', '목', '금', '토', '일'].map((day, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-indigo-200 rounded-t-md"
                        style={{ height: `${Math.random() * 80 + 10}%` }}
                      />
                      <span className="text-xs text-gray-500 mt-2">{day}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Achievement Section */}
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-900">최근 달성 업적</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-full">
                <span className="text-yellow-500">&#127942;</span>
                <span className="text-sm font-medium text-yellow-800">첫 듣기 완료</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
                <span className="text-green-500">&#128218;</span>
                <span className="text-sm font-medium text-green-800">10개 단어 학습</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-full">
                <span className="text-purple-500">&#128293;</span>
                <span className="text-sm font-medium text-purple-800">3일 연속 학습</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full">
                <span className="text-blue-500">&#128221;</span>
                <span className="text-sm font-medium text-blue-800">첫 작문 제출</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LearningDashboard;
