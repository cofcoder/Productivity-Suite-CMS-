/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Clock, 
  Calendar, 
  Tag, 
  Check, 
  X, 
  AlertCircle,
  Briefcase
} from 'lucide-react';
import { TimeBlock, Task, Project } from '../types';
import { addTimeBlock, deleteTimeBlock } from '../dataService';

interface TimeBlockingProps {
  currentUser: any;
  project: Project;
  tasks: Task[];
  timeBlocks: TimeBlock[];
}

export default function TimeBlocking({
  currentUser,
  project,
  tasks,
  timeBlocks
}: TimeBlockingProps) {
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [formHour, setFormHour] = useState<number>(9); // default 9 AM
  const [formDuration, setFormDuration] = useState<number>(1); // default 1 hour
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formTaskId, setFormTaskId] = useState('');
  const [formColor, setFormColor] = useState('indigo');
  const [errorText, setErrorText] = useState<string | null>(null);

  // Scheduled hours from 8:00 AM to 8:00 PM (8 to 20)
  const hours = Array.from({ length: 13 }, (_, i) => i + 8);

  const formatHourLabel = (h: number): string => {
    if (h === 12) return '12:00 PM';
    return h > 12 ? `${h - 12}:00 PM` : `${h}:00 AM`;
  };

  const colors = [
    { name: 'Indigo Blue', value: 'indigo', bg: 'bg-indigo-100 border-2 border-black text-black shadow-[2px_2px_0px_0px_#000]', fill: 'bg-indigo-500' },
    { name: 'Emerald Green', value: 'emerald', bg: 'bg-emerald-100 border-2 border-black text-black shadow-[2px_2px_0px_0px_#000]', fill: 'bg-emerald-500' },
    { name: 'Amber Yellow', value: 'amber', bg: 'bg-amber-100 border-2 border-black text-black shadow-[2px_2px_0px_0px_#000]', fill: 'bg-amber-500' },
    { name: 'Rose Red', value: 'rose', bg: 'bg-rose-100 border-2 border-black text-black shadow-[2px_2px_0px_0px_#000]', fill: 'bg-rose-500' },
    { name: 'Purple Star', value: 'violet', bg: 'bg-violet-100 border-2 border-black text-black shadow-[2px_2px_0px_0px_#000]', fill: 'bg-violet-500' }
  ];

  // Helper to get matching color object
  const getColorClass = (colorKey: string) => {
    return colors.find(c => c.value === colorKey) || colors[0];
  };

  // Convert time string/ts safely
  const parseBlockTimes = (block: TimeBlock) => {
    try {
      const getEpoch = (val: any) => {
        if (!val) return 0;
        if (typeof val.toDate === 'function') return val.toDate().getTime();
        return new Date(val).getTime();
      };
      const start = getEpoch(block.startTime);
      const end = getEpoch(block.endTime);
      
      const sDate = new Date(start);
      const eDate = new Date(end);
      return {
        startHour: sDate.getHours() + sDate.getMinutes() / 60,
        endHour: eDate.getHours() + eDate.getMinutes() / 60,
        label: `${sDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - ${eDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
      };
    } catch {
      return { startHour: 0, endHour: 0, label: 'Error' };
    }
  };

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !currentUser) return;

    setErrorText(null);

    // Compute timestamps for "Today"
    const today = new Date();
    
    const startTimeStamp = new Date(today);
    startTimeStamp.setHours(formHour, 0, 0, 0);

    const endTimeStamp = new Date(today);
    // End hour is start hour + duration
    const endH = Number(formHour) + Number(formDuration);
    endTimeStamp.setHours(endH, 0, 0, 0);

    if (endH > 22) {
      setErrorText("Boundary limit: scheduled appointment blocks cannot extend past 10:00 PM!");
      return;
    }

    try {
      await addTimeBlock(
        project.id,
        formTitle.trim(),
        formDesc.trim(),
        startTimeStamp.toISOString(),
        endTimeStamp.toISOString(),
        formTaskId || null,
        formColor,
        currentUser.uid,
        currentUser.email
      );

      // reset
      setFormTitle('');
      setFormDesc('');
      setFormTaskId('');
      setShowAddForm(false);
    } catch (err: any) {
      setErrorText(err.message || "Failed to create block due to validation constraints.");
    }
  };

  const handleReleaseBlock = async (block: TimeBlock) => {
    if (!currentUser) return;
    if (confirm(`Do you wish to release the scheduled block "${block.title}"?`)) {
      try {
        await deleteTimeBlock(
          project.id,
          block.id,
          block.title,
          currentUser.uid,
          currentUser.email
        );
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Quick select an open slot from grid
  const handleOpenSlot = (hr: number) => {
    setFormHour(hr);
    setFormDuration(1);
    setShowAddForm(true);
  };

  return (
    <div id="timeblocking_module_wrapper" className="space-y-6">
      
      {/* 1. Header with description */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-black uppercase text-neutral-900 tracking-tight flex items-center gap-2">
            Schedule Time Blocks
          </h2>
          <p className="text-xs font-semibold text-neutral-400 mt-0.5">
            Optimize your focus stream. Map hour segments to specific tasks of the active board.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-black border-2 border-black px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-[3px_3px_0px_0px_#000] hover:shadow-[4.5px_4.5px_0px_0px_#000] hover:-translate-y-0.5 active:translate-y-0.5 transition cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5 stroke-[2.5]" />
          Schedule Segment
        </button>
      </div>

      {/* 2. Visual Daily Timetable Calendar Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Left Side: Dynamic Hourly Grid */}
        <div className="lg:col-span-2 bento-card bg-white p-6">
          <div className="flex items-center justify-between border-b-2 border-dashed border-neutral-100 pb-3 mb-4">
            <span className="text-[10px] font-black text-neutral-800 uppercase tracking-widest flex items-center gap-1">
              <Calendar className="h-4 w-4 stroke-[2]" />
              Focus Log: {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
            <span className="text-[10px] font-black bg-yellow-300 text-black border border-black px-2 py-0.5 rounded uppercase tracking-wide">Daily view</span>
          </div>

          <div id="hourly_timelog_schedule" className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {hours.map((hour) => {
              // Find if any timeblocks overlap this hour index
              // We'll filter timeblocks checking if starting hour is exactly this index, or matches.
              // To represent perfectly, let's look at start hour.
              const blocksThisHour = timeBlocks.filter(b => {
                const times = parseBlockTimes(b);
                const hrsRounded = Math.floor(times.startHour);
                return hrsRounded === hour;
              });

              return (
                <div key={hour} className="group flex gap-4 min-h-[50px] items-stretch border-b border-slate-50/60 pb-3">
                  {/* Time label */}
                  <span className="w-16 text-right font-mono text-[11px] font-bold text-slate-400 pt-1.5 flex-shrink-0">
                    {formatHourLabel(hour)}
                  </span>

                  {/* Dynamic content column */}
                  <div className="flex-1 flex flex-col gap-2 relative">
                    {blocksThisHour.map((block) => {
                      const colObj = getColorClass(block.color);
                      const tInfo = parseBlockTimes(block);
                      
                      // Find if this is linked to a task in the workspace
                      const linkedTask = tasks.find(t => t.id === block.taskId);

                      return (
                        <div
                          key={block.id}
                          className={`rounded-2xl p-4 transition max-w-full ${colObj.bg}`}
                        >
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="text-left">
                              <h4 className="font-extrabold text-xs uppercase tracking-wide leading-none">
                                {block.title}
                              </h4>
                              <p className="text-[10px] mt-2 font-medium text-black/75 max-w-md line-clamp-2 leading-normal">
                                {block.description || 'No focus description set.'}
                              </p>
                              <div className="mt-3.5 flex flex-wrap items-center gap-2 text-[8px] font-black uppercase tracking-wider">
                                <span className={`h-2 w-2 rounded-full border border-black ${colObj.fill}`} />
                                <span className="text-[9px] font-mono font-bold bg-white/70 px-1.5 py-0.5 rounded border border-black/25">{tInfo.label}</span>
                                
                                {linkedTask && (
                                  <span className="flex items-center gap-1 bg-white border border-black px-2 py-0.5 rounded text-[8px] font-black uppercase text-black">
                                    <Briefcase className="h-2.5 w-2.5" />
                                    Task Link: {linkedTask.title}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Release focus block */}
                            <button
                              onClick={() => handleReleaseBlock(block)}
                              title="Release scheduled block"
                              className="rounded-lg bg-white border-2 border-black p-1.5 text-black hover:text-red-500 hover:bg-neutral-100 shadow-[1px_1px_0px_0px_#000] hover:shadow-[1.5px_1.5px_0px_0px_#000] hover:-translate-y-0.5 active:translate-y-0 text-slate-800 transition flex-shrink-0 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Default add button shown on hover of empty rows */}
                    {blocksThisHour.length === 0 && (
                      <button
                        onClick={() => handleOpenSlot(hour)}
                        className="opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 border-2 border-dashed border-neutral-300 hover:border-black rounded-xl py-2 w-full text-xs font-black uppercase tracking-wide text-neutral-500 hover:text-black hover:bg-[#f8f7f2] transition cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                        Focus segment for {formatHourLabel(hour)}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Block creator scheduler widget */}
        <div className="bento-card bg-white p-6 h-fit">
          <h3 className="font-display text-base font-black uppercase text-neutral-900 flex items-center gap-1.5 mb-1.5">
            <Clock className="h-4.5 w-4.5 text-black stroke-[2.5]" />
            Quick Schedule Builder
          </h3>
          <p className="text-[11px] text-neutral-400 font-medium mb-4 leading-normal">
            Select segment bounds, assign to specific workspace task milestones, and color-code.
          </p>

          <form onSubmit={handleCreateBlock} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-neutral-400 mb-1">Activity Label <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                placeholder="e.g., Code Review / Architecture Draft"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full rounded-xl border-2 border-black bg-white px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-neutral-400 mb-1">Focus Parameter Notes</label>
              <textarea
                placeholder="Specify criteria, targets, or parameters of the focus burst..."
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                className="w-full rounded-xl border-2 border-black bg-white px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                rows={2}
              />
            </div>

            <div className="grid gap-3.5 grid-cols-2">
              <div>
                <label className="block text-[10px] font-black uppercase text-neutral-400 mb-1">Start Hour</label>
                <select
                  value={formHour}
                  onChange={(e) => setFormHour(Number(e.target.value))}
                  className="w-full rounded-xl border-2 border-black bg-white px-2.5 py-2 text-xs font-bold focus:outline-none cursor-pointer"
                >
                  {hours.map(h => (
                    <option key={h} value={h}>{formatHourLabel(h)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-neutral-400 mb-1">Duration Length</label>
                <select
                  value={formDuration}
                  onChange={(e) => setFormDuration(Number(e.target.value))}
                  className="w-full rounded-xl border-2 border-black bg-white px-2.5 py-2 text-xs font-bold focus:outline-none cursor-pointer"
                >
                  <option value={1}>1 Hour Segment</option>
                  <option value={2}>2 Hours Work block</option>
                  <option value={3}>3 Hours Sprint session</option>
                  <option value={4}>4 Hours Deep study</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-neutral-400 mb-1">Link Task (Optional)</label>
              <select
                value={formTaskId}
                onChange={(e) => setFormTaskId(e.target.value)}
                className="w-full rounded-xl border-2 border-black bg-white px-2.5 py-2 text-xs font-bold focus:outline-none cursor-pointer"
              >
                <option value="">-- No Link (Generic Segment) --</option>
                {tasks.map(t => (
                  <option key={t.id} value={t.id}>{t.title} ({t.status})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-neutral-400 mb-2">Segment Tag theme color</label>
              <div className="flex gap-2 flex-wrap">
                {colors.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setFormColor(c.value)}
                    title={c.name}
                    className={`h-7 w-7 rounded-lg transition-transform ${c.fill} cursor-pointer border-2 border-black flex items-center justify-center ${
                      formColor === c.value ? 'scale-110 ring-2 ring-amber-500 ring-offset-2' : 'hover:scale-105'
                    }`}
                  >
                    {formColor === c.value && <Check className="h-4 w-4 text-white font-black stroke-[3.5]" />}
                  </button>
                ))}
              </div>
            </div>

            {errorText && (
              <p className="text-[11px] font-bold text-red-700 bg-red-100 border-2 border-red-500 p-2.5 rounded-xl flex items-center gap-1.5 leading-normal">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {errorText}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-black border-2 border-black py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-[2px_2px_0px_0px_#000] hover:shadow-[3px_3px_0px_0px_#000] hover:-translate-y-0.5 active:translate-y-0.5 transition cursor-pointer"
            >
              Add Focus Block Segment
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
