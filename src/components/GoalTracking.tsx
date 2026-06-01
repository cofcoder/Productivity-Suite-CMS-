/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Target, 
  Plus, 
  Trash2, 
  X, 
  CheckCircle, 
  Flag,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Goal, Project } from '../types';
import { addGoal, updateGoal, deleteGoal } from '../dataService';

interface GoalTrackingProps {
  currentUser: any;
  project: Project;
  goals: Goal[];
}

export default function GoalTracking({
  currentUser,
  project,
  goals
}: GoalTrackingProps) {
  
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDate, setNewDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle addition
  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !currentUser) return;

    setIsSubmitting(true);
    try {
      const defaultDate = newDate || new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0];
      await addGoal(
        project.id,
        newTitle.trim(),
        newDesc.trim(),
        defaultDate,
        currentUser.uid,
        currentUser.email
      );

      setNewTitle('');
      setNewDesc('');
      setNewDate('');
      setShowForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Adjust progress and auto-calculate status
  const handleProgressChange = async (goal: Goal, newVal: number) => {
    if (!currentUser) return;
    const bounded = Math.min(Math.max(newVal, 0), 100);
    
    let nextStatus = goal.status;
    if (bounded === 100) nextStatus = 'completed';
    else if (bounded > 0) nextStatus = 'in_progress';
    else nextStatus = 'not_started';

    try {
      await updateGoal(
        project.id,
        goal.id,
        {
          progress: bounded,
          status: nextStatus
        },
        currentUser.uid,
        currentUser.email
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Delete goal
  const handleDeleteGoal = async (goal: Goal) => {
    if (!currentUser) return;
    if (confirm(`Do you wish to delete objective goal "${goal.title}"?`)) {
      try {
        await deleteGoal(
          project.id,
          goal.id,
          goal.title,
          currentUser.uid,
          currentUser.email
        );
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div id="goal_tracking_module_wrapper" className="space-y-6">
      
      {/* 1. Header description */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-black uppercase text-neutral-900 tracking-tight flex items-center gap-2">
            Objectives & Key Results (OKRs)
          </h2>
          <p className="text-xs font-semibold text-neutral-400 mt-0.5">
            Establish overall milestones. Slide or adjust indicator sliders to synchronize progress metrics.
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-black border-2 border-black px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-[3px_3px_0px_0px_#000] hover:shadow-[4.5px_4.5px_0px_0px_#000] hover:-translate-y-0.5 active:translate-y-0.5 transition cursor-pointer"
        >
          {showForm ? 'Close Drawer' : 'Establish Goal'}
        </button>
      </div>

      {/* 2. Visual forms for adding goals */}
      {showForm && (
        <div id="new_goal_form_wrapper" className="bento-card bg-white p-5 max-w-xl shadow-[4px_4px_0px_0px_#000]">
          <div className="flex items-center justify-between pb-3 border-b-2 border-dashed border-neutral-100 mb-4">
            <h3 className="font-display text-sm font-black uppercase text-slate-900">Define Workspace Objective</h3>
            <button onClick={() => setShowForm(false)} className="rounded-lg p-1 text-black hover:bg-neutral-150 border border-transparent hover:border-black transition cursor-pointer">
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          <form onSubmit={handleAddGoal} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Target Goal Title <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                placeholder="e.g. Build API Mock Integrations"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full rounded-xl border-2 border-black bg-white px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Scope or Key Results Parameters</label>
              <textarea
                placeholder="List clear measurable sub-results or description parameters..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full rounded-xl border-2 border-black bg-white px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Target Accomplish Date</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full rounded-xl border-2 border-black bg-white px-3 py-2 text-xs font-bold focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 text-[10px] uppercase font-black pt-1">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl px-4 py-2.5 text-neutral-500 hover:bg-neutral-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-black border-2 border-black px-5 py-2.5 text-white shadow-[2px_2px_0px_0px_#000] hover:-translate-y-0.5 active:translate-y-0 transition cursor-pointer"
              >
                {isSubmitting ? 'Establishing...' : 'Establish Goal'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Listed Goals Map visual board */}
      <div className="grid gap-5 md:grid-cols-2">
        {goals.map((g) => {
          // Date string formatting helper
          let targetLabel = 'No deadline';
          if (g.targetDate) {
            try {
              const d = g.targetDate && typeof (g.targetDate as any).toDate === 'function'
                ? (g.targetDate as any).toDate()
                : new Date(g.targetDate);
              targetLabel = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
            } catch {
              targetLabel = String(g.targetDate);
            }
          }

          return (
            <div 
              key={g.id} 
              className="bento-card bg-white p-5 hover:-translate-y-0.5 transition duration-150"
            >
              
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className={`h-3 w-3 rounded-full border border-black ${
                      g.status === 'completed' 
                        ? 'bg-emerald-400' 
                        : g.status === 'in_progress' 
                          ? 'bg-sky-400 animate-pulse' 
                          : 'bg-stone-300'
                    }`} />
                    <h4 className="font-extrabold text-[10px] text-slate-500 uppercase tracking-widest">
                      {g.status.replace('_', ' ')}
                    </h4>
                  </div>
                  <h3 className="font-extrabold text-sm uppercase tracking-wide text-neutral-900 font-display">
                    {g.title}
                  </h3>
                  <p className="text-xs font-semibold text-neutral-400 line-clamp-2">
                    {g.description || 'No focus description objective set.'}
                  </p>
                </div>

                <button
                  onClick={() => handleDeleteGoal(g)}
                  className="rounded-xl bg-white border-2 border-black p-2 text-black hover:bg-red-300 hover:text-black shadow-[2px_2px_0px_0px_#000] hover:shadow-[3px_3px_0px_0px_#000] hover:-translate-y-0.5 active:translate-y-0.5 transition flex-shrink-0 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Progress Slider block */}
              <div className="space-y-2 text-left">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-500 flex items-center gap-1 uppercase text-[10px]">
                    <Flag className="h-3.5 w-3.5 text-black" />
                    Objective Completion
                  </span>
                  <span className="font-mono font-black text-black bg-sky-200 border-2 border-black px-2.5 pb-0.5 pt-1 rounded-lg text-[10px] shadow-[1.5px_1.5px_0px_0px_#000]">
                    {g.progress}%
                  </span>
                </div>

                {/* Styled Track */}
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={g.progress}
                    onChange={(e) => handleProgressChange(g, Number(e.target.value))}
                    className="w-full h-3 rounded-lg border-2 border-black bg-[#f8f7f2] accent-black outline-none cursor-pointer"
                  />
                  
                  {/* Visual Background bar overlay */}
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 left-0.5 h-1.5 rounded-l-lg bg-black pointer-events-none" 
                    style={{ width: `calc(${g.progress}% - 4px)` }}
                  />
                </div>

                {/* Quick increase/completed markers */}
                <div className="flex gap-2.5 pt-1.5">
                  <button 
                    onClick={() => handleProgressChange(g, g.progress - 10)}
                    className="px-2.5 py-1.5 bg-white border-2 border-black rounded-lg text-[10px] font-black text-black hover:bg-neutral-100 transition shadow-[1.5px_1.5px_0px_0px_#000] cursor-pointer"
                  >
                    -10%
                  </button>
                  <button
                    onClick={() => handleProgressChange(g, g.progress + 10)}
                    className="px-2.5 py-1.5 bg-white border-2 border-black rounded-lg text-[10px] font-black text-black hover:bg-neutral-100 transition shadow-[1.5px_1.5px_0px_0px_#000] cursor-pointer"
                  >
                    +10%
                  </button>
                  <button
                    onClick={() => handleProgressChange(g, 100)}
                    className="px-3 py-1.5 bg-emerald-400 border-2 border-black rounded-lg text-[10px] font-black text-black hover:bg-emerald-300 transition flex items-center gap-1 ml-auto shadow-[1.5px_1.5px_0px_0px_#000] cursor-pointer"
                  >
                    <CheckCircle className="h-3 w-3 stroke-[3.5]" /> Complete
                  </button>
                </div>
              </div>

              {/* Target Complete Dates Info */}
              {g.targetDate && (
                <div className="border-t-2 border-dashed border-neutral-100 pt-3.5 flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                  <Calendar className="h-3.5 w-3.5 text-black" />
                  <span>Target Due Date: <strong className="text-black">{targetLabel}</strong></span>
                </div>
              )}

            </div>
          );
        })}

        {goals.length === 0 && (
          <div className="md:col-span-2 bento-card bg-white p-12 text-center flex flex-col items-center justify-center space-y-4">
            <div className="h-12 w-12 rounded-xl bg-yellow-300 border-2 border-black text-black flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
              <Target className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div>
              <p className="font-extrabold uppercase tracking-wide text-neutral-800 text-sm">No OKR Goals configured yet.</p>
              <p className="text-xs font-semibold text-neutral-400 mt-2.5 max-w-sm mx-auto leading-relaxed">
                Milestones are shared objectives that keep your entire team aligned. Click "Establish Goal" to define your first project key result!
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
