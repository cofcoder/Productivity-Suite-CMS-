/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  CheckSquare, 
  Target, 
  Calendar, 
  Clock, 
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Inbox
} from 'lucide-react';
import { Task, TimeBlock, Goal } from '../types';

interface DashboardProps {
  tasks: Task[];
  timeBlocks: TimeBlock[];
  goals: Goal[];
  onTabChange: (tab: string) => void;
}

export default function Dashboard({
  tasks,
  timeBlocks,
  goals,
  onTabChange
}: DashboardProps) {
  
  // Computations
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  const highPriorityLeft = tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length;
  
  // Total scheduled minutes/hours
  let totalScheduledHours = 0;
  timeBlocks.forEach(b => {
    try {
      // startTime/endTime can be strings or Timestamp
      const start = b.startTime && typeof (b.startTime as any).toDate === 'function' 
        ? (b.startTime as any).toDate().getTime()
        : new Date(b.startTime).getTime();
      const end = b.endTime && typeof (b.endTime as any).toDate === 'function'
        ? (b.endTime as any).toDate().getTime()
        : new Date(b.endTime).getTime();
      
      const diffMs = end - start;
      if (diffMs > 0) {
        totalScheduledHours += diffMs / (1000 * 60 * 60);
      }
    } catch (e) {
      // safe
    }
  });

  // Upcoming high priority tasks (max 3)
  const urgentTasks = tasks
    .filter(t => t.status !== 'completed' && t.priority === 'high')
    .slice(0, 3);

  // Goal average progress
  const activeGoals = goals.length;
  const avgGoalProgress = activeGoals > 0 
    ? Math.round(goals.reduce((acc, g) => acc + g.progress, 0) / activeGoals)
    : 0;

  return (
    <div id="project_dashboard_wrapper" className="space-y-6">
      
      {/* 1. Header Greetings & Context */}
      <div>
        <h2 className="font-display text-2xl font-black uppercase tracking-tight text-neutral-950 flex items-center gap-1.5">
          Workspace Insights Overview
        </h2>
        <p className="text-xs font-medium text-neutral-500 mt-1">
          Review overall deliverables, visual schedules, and target key results.
        </p>
      </div>

      {/* 2. Bento Stats Matrix */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* Card 1: Task Progress */}
        <div className="bento-card bg-sky-50 p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Task Completion</span>
            <h4 className="text-2xl font-black text-black leading-tight">
              {completedTasks} <span className="text-sm font-medium text-slate-400">/ {totalTasks}</span>
            </h4>
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-emerald-700">{completionRate}% Done</span>
            </div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border-2 border-black shadow-[2px_2px_0px_0px_#1a1a1a] text-black">
            <CheckSquare className="h-5 w-5" />
          </div>
        </div>

        {/* Card 2: Goal tracking */}
        <div className="bento-card bg-amber-50 p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Goals Velocity</span>
            <h4 className="text-2xl font-black text-black leading-tight">
              {avgGoalProgress}% <span className="text-xs font-bold text-slate-500">Avg</span>
            </h4>
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-indigo-700">{activeGoals} OKRs Listed</span>
            </div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border-2 border-black shadow-[2px_2px_0px_0px_#1a1a1a] text-black">
            <Target className="h-5 w-5 animate-pulse" />
          </div>
        </div>

        {/* Card 3: Time Blocks Scheduled */}
        <div className="bento-card bg-emerald-50 p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Time Blocking</span>
            <h4 className="text-2xl font-black text-black leading-tight">
              {totalScheduledHours.toFixed(1)} <span className="text-xs font-bold text-slate-500">Hrs</span>
            </h4>
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-emerald-800">{timeBlocks.length} Active Slots</span>
            </div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border-2 border-black shadow-[2px_2px_0px_0px_#1a1a1a] text-black">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        {/* Card 4: Urgent Action */}
        <div className="bento-card bg-purple-50 p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">High Priority</span>
            <h4 className="text-2xl font-black text-black leading-tight">
              {highPriorityLeft} <span className="text-xs font-bold text-slate-500">Task{highPriorityLeft !== 1 ? 's' : ''}</span>
            </h4>
            <div className="flex items-center gap-1 text-xs">
              <span className={`font-bold ${highPriorityLeft > 0 ? 'text-purple-950' : 'text-slate-500'}`}>
                {highPriorityLeft > 0 ? 'Urgent sync needed' : 'Roadmap clean!'}
              </span>
            </div>
          </div>
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_#1a1a1a] ${highPriorityLeft > 0 ? 'bg-amber-300 text-black' : 'bg-white text-slate-400'}`}>
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>

      </div>

      {/* 3. Deep-Dive Bento Sections */}
      <div className="grid gap-6 md:grid-cols-2">
        
        {/* Left deep dive: Circular Progress & Velocity Meter */}
        <div className="bento-card bg-white p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black uppercase text-neutral-400 tracking-widest border-b border-neutral-100 pb-2 mb-2">
              Completion Distribution
            </h3>
            <p className="text-xs text-slate-500 mt-1">Percentage of tasks fully locked.</p>
          </div>

          <div className="flex flex-col items-center justify-center py-6">
            <div className="relative flex items-center justify-center">
              <svg className="h-36 w-36 transform -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r="62"
                  className="stroke-neutral-100 fill-none"
                  strokeWidth="11"
                />
                <circle
                  cx="72"
                  cy="72"
                  r="62"
                  className="stroke-black fill-none transition-all duration-500"
                  strokeWidth="11"
                  strokeDasharray={2 * Math.PI * 62}
                  strokeDashoffset={2 * Math.PI * 62 * (1 - completionRate / 100)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-3xl font-display font-black text-slate-900">
                  {completionRate}%
                </span>
                <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                  Complete
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 w-full text-center divide-x border-2 border-black bg-[#f8f7f2] p-3 rounded-xl text-xs shadow-[2px_2px_0px_0px_#000]">
              <div>
                <span className="block text-slate-500 font-extrabold uppercase text-[10px]">In Progress</span>
                <span className="font-extrabold text-slate-800 text-base">{inProgressTasks}</span>
              </div>
              <div>
                <span className="block text-slate-500 font-extrabold uppercase text-[10px]">Backlog Todo</span>
                <span className="font-extrabold text-slate-800 text-base">
                  {tasks.filter(t => t.status === 'todo').length}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onTabChange('tasks')}
            className="flex items-center justify-center gap-1.5 w-full rounded-xl bg-yellow-300 border-2 border-black py-2.5 text-xs font-black uppercase tracking-wider text-black shadow-[2px_2px_0px_0px_#000] hover:shadow-[3.5px_3.5px_0px_0px_#000] hover:-translate-y-0.5 active:translate-y-0.5 transition mt-4 cursor-pointer"
          >
            Launch Team Kanban Board
            <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
          </button>
        </div>

        {/* Right deep dive: Important & Priority Tasks Due Soon */}
        <div className="bento-card bg-white p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black uppercase text-neutral-400 tracking-widest border-b border-neutral-100 pb-2 mb-2">
              🚨 Urgent Action Backlog
            </h3>
            <p className="text-xs text-slate-500 mt-1">High priority tasks awaiting resolution.</p>
          </div>

          <div className="space-y-3.5 flex-1 my-5 overflow-y-auto max-h-56 pr-1">
            {urgentTasks.map((task) => (
              <div 
                key={task.id} 
                className="flex items-center justify-between rounded-xl bg-[#f8f7f2] hover:bg-neutral-50 p-3 border-2 border-black transition shadow-[1.5px_1.5px_0px_0px_#1a1a1a]"
              >
                <div className="space-y-1 truncate pr-2 text-left">
                  <span className="block font-extrabold text-xs uppercase tracking-wide text-slate-900 truncate">
                    {task.title}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-red-700 font-extrabold bg-red-100 border border-red-300 px-1.5 py-0.5 rounded uppercase">
                      High
                    </span>
                    {task.dueDate && (
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
                        <Calendar className="h-3 w-3" />
                        {task.dueDate}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onTabChange('tasks')}
                  className="rounded-lg bg-white p-2 border-2 border-black text-black shadow-[1.5px_1.5px_0px_0px_#000] hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_#000] active:translate-y-0.5 transition cursor-pointer"
                >
                  <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
                </button>
              </div>
            ))}

            {urgentTasks.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full py-10 space-y-2">
                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 border border-neutral-300 text-slate-400">
                  <Inbox className="h-5 w-5" />
                </div>
                <p className="text-xs text-slate-400 italic font-medium">No urgent high-priority tasks in the backlog!</p>
              </div>
            )}
          </div>

          <button
            onClick={() => onTabChange('goals')}
            className="flex items-center justify-center gap-1.5 w-full rounded-xl bg-white border-2 border-black py-2.5 text-xs font-black uppercase tracking-wider text-black shadow-[2px_2px_0px_0px_#000] hover:shadow-[3px_3px_0px_0px_#000] hover:-translate-y-0.5 active:translate-y-0.5 transition mt-2 cursor-pointer"
          >
            Review Milestone OKRs
            <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
          </button>
        </div>

      </div>

    </div>
  );
}
