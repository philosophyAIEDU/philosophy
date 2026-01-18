import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Headphones,
  BookOpen,
  PenTool,
  Mic,
  Calendar,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

// Helper Components
const FocusItem = ({ label, time, checked }: { label: string; time: string; checked: boolean }) => (
  <li className="flex items-center justify-between group cursor-pointer">
    <div className="flex items-center gap-3">
      <div className={`w-5 h-5 border-2 rounded border-gray-600 flex items-center justify-center ${checked ? 'bg-accent-blue border-accent-blue' : ''}`}>
        {checked && <div className="w-2 h-2 bg-white rounded-full"></div>}
      </div>
      <span className={checked ? 'text-gray-500 line-through' : 'text-gray-300'}>{label}</span>
    </div>
    <span className="text-xs text-gray-500">{time}</span>
  </li>
);

const LearningCard = ({
  title, icon, color, desc, progress, onClick
}: {
  title: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'yellow' | 'red';
  desc: string;
  progress: number;
  onClick: () => void;
}) => {
  const colors = {
    blue: 'border-accent-blue',
    green: 'border-accent-green',
    yellow: 'border-accent-yellow',
    red: 'border-accent-red'
  };

  const bgColors = {
    blue: 'bg-accent-blue',
    green: 'bg-accent-green',
    yellow: 'bg-accent-yellow',
    red: 'bg-accent-red'
  }

  return (
    <div
      onClick={onClick}
      className={`bg-navy-card p-6 rounded-2xl border-l-4 ${colors[color]} shadow-md hover:scale-[1.02] transition-transform cursor-pointer group`}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-serif font-bold text-white group-hover:text-accent-gold transition-colors">{title}</h3>
        <div className="text-gray-500 group-hover:text-white transition-colors">{icon}</div>
      </div>
      <div className="w-full bg-gray-700 h-1.5 rounded-full mb-3">
        <div className={`h-full rounded-full ${bgColors[color]}`} style={{ width: `${progress}%` }}></div>
      </div>
      <p className="text-sm text-gray-400">{desc}</p>
    </div>
  );
};

const LearningDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useApp();
  const { userProfile, progress } = state;

  // Mock progress calculation for display if real data is missing
  const dailyGoal = userProfile?.preferences?.dailyGoalMinutes || 30;
  const todayMinutes = 15;

  // Calculate stroke dasharray for the circular progress (circumference is ~364)
  const circleCircumference = 364;
  const progressRatio = Math.min(todayMinutes / dailyGoal, 1);
  const strokeDashoffset = circleCircumference - (circleCircumference * progressRatio);

  return (
    <div className="p-4 lg:p-10 animate-fade-in text-white font-sans">
      <h1 className="text-3xl md:text-4xl font-serif font-semibold mb-8">Welcome Back, {userProfile?.name || 'Student'}.</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Streak & Daily Goal */}
        <section className="col-span-1 lg:col-span-8 bg-navy-card rounded-2xl p-8 flex flex-col md:flex-row justify-between items-center shadow-lg border border-gray-700">
          <div className="mb-6 md:mb-0">
            <p className="text-gray-400 uppercase tracking-widest text-sm mb-2">Streak Counter</p>
            <h2 className="text-3xl font-serif">You are on a <span className="text-accent-yellow">{progress.streakDays} day streak</span></h2>
          </div>
          {/* Circular Progress */}
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              {/* Background Circle */}
              <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-gray-700" />
              {/* Progress Circle */}
              <circle
                cx="64" cy="64" r="58"
                stroke="currentColor" strokeWidth="10"
                fill="transparent"
                strokeDasharray={circleCircumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="text-accent-yellow transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute text-center">
              <p className="text-xs text-gray-400 uppercase">Daily Goal</p>
              <p className="text-lg font-bold">
                {todayMinutes} <span className="text-gray-500">/ {dailyGoal}m</span>
              </p>
            </div>
          </div>
        </section>

        {/* Today's Focus */}
        <section className="col-span-1 lg:col-span-4 bg-navy-card rounded-2xl p-6 shadow-lg border border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-serif font-bold">Today's Focus</h3>
            <Calendar size={18} className="text-gray-400" />
          </div>
          <ul className="space-y-4">
            <FocusItem label="Morning News Listening" time="10m" checked={true} />
            <FocusItem label="Vocabulary Review" time="5m" checked={false} />
            <FocusItem label="Daily Journal" time="15m" checked={false} />
          </ul>
        </section>

        {/* Learning Cards Grid */}
        <div className="col-span-1 lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <LearningCard
            title="Listening"
            icon={<Headphones />}
            color="blue"
            desc="Master English comprehension"
            progress={40}
            onClick={() => navigate('/listening')}
          />
          <LearningCard
            title="Reading"
            icon={<BookOpen />}
            color="green"
            desc="Expand vocabulary & context"
            progress={65}
            onClick={() => navigate('/reading')}
          />
          <LearningCard
            title="Writing"
            icon={<PenTool />}
            color="yellow"
            desc="Perfect your composition"
            progress={30}
            onClick={() => navigate('/writing')}
          />
          <LearningCard
            title="Speaking"
            icon={<Mic />}
            color="red"
            desc="Fluency through conversation"
            progress={55}
            onClick={() => navigate('/speaking')}
          />
        </div>

        {/* Weekly Growth Chart Placeholder */}
        <section className="col-span-1 lg:col-span-4 bg-navy-card rounded-2xl p-6 shadow-lg border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-serif font-bold">Weekly Growth</h3>
            <span className="text-green-400 font-bold">+12%</span>
          </div>
          <div className="h-40 flex items-end gap-2 px-2">
            {[30, 45, 35, 60, 50, 80, 70].map((h, i) => (
              <div
                key={i}
                style={{ height: `${h}%` }}
                className="flex-1 bg-accent-blue/20 rounded-t-sm border-t-2 border-accent-blue hover:bg-accent-blue/40 transition-colors"
              ></div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default LearningDashboard;
