/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  CheckCircle, 
  Trash2, 
  Plus, 
  Filter, 
  Calendar, 
  User, 
  Tag, 
  X, 
  ChevronRight, 
  SlidersHorizontal,
  Bookmark
} from 'lucide-react';
import { Task, TaskStatus, TaskPriority, Project } from '../types';
import { addTask, updateTask, deleteTaskItem } from '../dataService';
import UserAvatar from './UserAvatar';

interface KanbanBoardProps {
  currentUser: any;
  project: Project;
  tasks: Task[];
}

export default function KanbanBoard({
  currentUser,
  project,
  tasks
}: KanbanBoardProps) {
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  
  // Create Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPriority, setFormPriority] = useState<TaskPriority>('medium');
  const [formDueDate, setFormDueDate] = useState('');
  const [formAssignEmail, setFormAssignEmail] = useState('');
  const [formTagString, setFormTagString] = useState('');
  
  // Edit/Detail Modal State
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailTitle, setDetailTitle] = useState('');
  const [detailDesc, setDetailDesc] = useState('');
  const [detailPriority, setDetailPriority] = useState<TaskPriority>('medium');
  const [detailStatus, setDetailStatus] = useState<TaskStatus>('todo');
  const [detailDueDate, setDetailDueDate] = useState('');
  const [detailAssignEmail, setDetailAssignEmail] = useState('');
  const [detailTagString, setDetailTagString] = useState('');

  // Filtering
  const filteredTasks = tasks.filter(t => {
    const matchesPriority = filterPriority === 'all' || t.priority === filterPriority;
    const matchesAssignee = filterAssignee === 'all' || (t.assignedEmail && t.assignedEmail.toLowerCase() === filterAssignee.toLowerCase());
    return matchesPriority && matchesAssignee;
  });

  const columns: { label: string; status: TaskStatus; bg: string; text: string }[] = [
    { label: 'Backlog Todo', status: 'todo', bg: 'bg-stone-100', text: 'text-neutral-850' },
    { label: 'In Progress', status: 'in_progress', bg: 'bg-sky-100', text: 'text-neutral-850' },
    { label: 'Evaluating / Review', status: 'review', bg: 'bg-amber-105', text: 'text-neutral-850' },
    { label: 'Completed', status: 'completed', bg: 'bg-emerald-100', text: 'text-neutral-850' }
  ];

  // Submit new task
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !currentUser) return;

    try {
      const tags = formTagString.trim() 
        ? formTagString.split(',').map(tag => tag.trim().toLowerCase()).filter(t => t.length > 0)
        : [];
      
      await addTask(
        project.id,
        formTitle.trim(),
        formDesc.trim(),
        formPriority,
        formDueDate || null,
        formAssignEmail.trim() || null,
        tags,
        currentUser.uid,
        currentUser.email
      );

      // Reset
      setFormTitle('');
      setFormDesc('');
      setFormPriority('medium');
      setFormDueDate('');
      setFormAssignEmail('');
      setFormTagString('');
      setShowAddModal(false);
    } catch (e) {
      console.error(e);
    }
  };

  // Open Edit Modal
  const openEditModal = (task: Task) => {
    setSelectedTask(task);
    setDetailTitle(task.title);
    setDetailDesc(task.description);
    setDetailPriority(task.priority);
    setDetailStatus(task.status);
    setDetailDueDate(task.dueDate || '');
    setDetailAssignEmail(task.assignedEmail || '');
    setDetailTagString(task.tags ? task.tags.join(', ') : '');
  };

  // Save changes
  const handleSaveDetails = async () => {
    if (!selectedTask || !currentUser) return;
    try {
      const tags = detailTagString.trim()
        ? detailTagString.split(',').map(tag => tag.trim().toLowerCase()).filter(t => t.length > 0)
        : [];

      await updateTask(
        project.id,
        selectedTask.id,
        {
          title: detailTitle.trim(),
          description: detailDesc.trim(),
          status: detailStatus,
          priority: detailPriority,
          dueDate: detailDueDate || null,
          assignedEmail: detailAssignEmail.trim() || null,
          assignedTo: detailAssignEmail.trim() ? detailAssignEmail.split('@')[0] + '-uid' : null,
          tags
        },
        currentUser.uid,
        currentUser.email
      );
      setSelectedTask(null);
    } catch (e) {
      console.error(e);
    }
  };

  // Quick move status inside cards
  const handleQuickMove = async (task: Task, currentStatus: TaskStatus) => {
    if (!currentUser) return;
    let nextStatus: TaskStatus = 'todo';
    if (currentStatus === 'todo') nextStatus = 'in_progress';
    else if (currentStatus === 'in_progress') nextStatus = 'review';
    else if (currentStatus === 'review') nextStatus = 'completed';
    else if (currentStatus === 'completed') nextStatus = 'todo';

    try {
      await updateTask(
        project.id,
        task.id,
        { status: nextStatus },
        currentUser.uid,
        currentUser.email
      );
    } catch (e) {
      console.error("Move error:", e);
    }
  };

  // Delete task
  const handleDeleteTask = async (task: Task) => {
    if (!currentUser) return;
    if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
      try {
        await deleteTaskItem(
          project.id,
          task.id,
          task.title,
          currentUser.uid,
          currentUser.email
        );
        setSelectedTask(null);
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div id="kanban_board_wrapper" className="space-y-6">
      
      {/* 1. Header and quick actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-black uppercase text-slate-900 tracking-tight">
            Sprint Task Board
          </h2>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">
            Real-time pipeline tracking. Move items along the board as they compile updates.
          </p>
        </div>

        <button
          id="add_task_trigger_btn"
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-black border-2 border-black px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-[3px_3px_0px_0px_#000] hover:shadow-[4.5px_4.5px_0px_0px_#000] hover:-translate-y-0.5 active:translate-y-0.5 transition cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5 stroke-[2.5]" />
          Add Task
        </button>
      </div>

      {/* 2. Interactive Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-[#f8f7f2] p-3.5 border-2 border-black shadow-[2px_2px_0px_0px_#000]">
        <span className="text-[10px] font-black text-neutral-800 uppercase tracking-widest flex items-center gap-1">
          <SlidersHorizontal className="h-3.5 w-3.5 stroke-[2.5]" />
          Filters
        </span>
        
        {/* Priority Filter */}
        <select
          id="filter_priority_select"
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="rounded-xl border-2 border-black bg-white px-3 py-1.5 text-xs font-bold text-neutral-800 focus:outline-none focus:bg-yellow-50 cursor-pointer"
        >
          <option value="all">Priority: All Levels</option>
          <option value="high">High Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="low">Low Priority</option>
        </select>

        {/* Teammate Filter */}
        <select
          id="filter_assignee_select"
          value={filterAssignee}
          onChange={(e) => setFilterAssignee(e.target.value)}
          className="rounded-xl border-2 border-black bg-white px-3 py-1.5 text-xs font-bold text-neutral-800 focus:outline-none focus:bg-yellow-50 cursor-pointer"
        >
          <option value="all">Assignee: All Team</option>
          {project.memberEmails.map((email, idx) => (
            <option key={idx} value={email}>{email}</option>
          ))}
        </select>
      </div>

      {/* 3. Drag/Drop Visual Grid */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4 select-none">
        {columns.map((col, colIdx) => (
          <div key={colIdx} className="flex flex-col h-[650px] space-y-4">
            
            {/* Column Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-black uppercase tracking-wider rounded-lg px-2.5 py-1.5 border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000] ${col.bg} ${col.text}`}>
                  {col.label}
                </span>
                <span className="text-xs font-black bg-neutral-900 text-white rounded px-2 py-0.5 border border-black">
                  {filteredTasks.filter(t => t.status === col.status).length}
                </span>
              </div>
            </div>

            {/* Column Body list */}
            <div className="flex-1 overflow-y-auto space-y-4 rounded-2xl bg-white p-3.5 border-2 border-black shadow-[3px_3px_0px_0px_rgba(26,26,26,0.15)]">
              {filteredTasks
                .filter(tk => tk.status === col.status)
                .map((task) => (
                  <div
                    key={task.id}
                    onClick={() => openEditModal(task)}
                    className="group relative cursor-pointer flex flex-col justify-between rounded-xl bg-white p-4 border-2 border-black shadow-[2px_2px_0px_0px_#1a1a1a] hover:shadow-[4px_4px_0px_0px_#1a1a1a] hover:-translate-y-0.5 transition duration-200"
                  >
                    
                    {/* Header: Title */}
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-1.5">
                        <h4 className="font-extrabold text-xs uppercase tracking-wide text-neutral-900 group-hover:text-amber-700 transition leading-relaxed line-clamp-2">
                          {task.title}
                        </h4>
                        
                        {/* Status Check Quick Access */}
                        <button
                          title="Click to advance stage status"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickMove(task, task.status);
                          }}
                          className="flex-shrink-0 h-5 w-5 bg-yellow-300 rounded-lg border-2 border-black flex items-center justify-center text-black hover:-translate-y-0.5 shadow-[1.5px_1.5px_0px_0px_#000] transition active:translate-y-0 cursor-pointer"
                        >
                          <ChevronRight className="h-3 w-3 stroke-[2.5]" />
                        </button>
                      </div>
                      <p className="text-[10px] text-zinc-500 font-medium line-clamp-2 leading-normal">
                        {task.description || 'No instruction notes provided.'}
                      </p>
                    </div>

                    {/* Metadata summary */}
                    <div className="mt-4 pt-3 border-t-2 border-dashed border-neutral-100 flex flex-wrap items-center justify-between gap-2.5 text-[9px] text-slate-400">
                      
                      {/* Priority */}
                      <span className={`font-black uppercase tracking-wide text-[8px] px-2 py-0.5 rounded border-2 border-black shadow-[1px_1px_0px_0px_#000] ${
                        task.priority === 'high' 
                          ? 'bg-red-300 text-black' 
                          : task.priority === 'medium' 
                            ? 'bg-amber-300 text-black' 
                            : 'bg-emerald-300 text-black'
                      }`}>
                        {task.priority}
                      </span>

                      {/* Due date status */}
                      {task.dueDate && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-neutral-600">
                          <Calendar className="h-3.5 w-3.5 text-neutral-600" />
                          <span>{task.dueDate}</span>
                        </div>
                      )}

                      {/* Task assignee initials */}
                      {task.assignedEmail ? (
                        task.assignedEmail === currentUser?.email ? (
                          <UserAvatar 
                            avatar={currentUser?.avatar} 
                            displayName={currentUser?.displayName} 
                            className="h-5.5 w-5.5 rounded-lg border-2 shadow-[1px_1px_0px_0px_#000] ml-auto"
                            iconSizeClass="text-[0.6rem]"
                          />
                        ) : (
                          <div 
                            title={`Assigned to ${task.assignedEmail}`}
                            className="flex h-5.5 w-5.5 items-center justify-center rounded-lg bg-orange-300 border-2 border-black text-black font-black uppercase text-[9px] shadow-[1px_1px_0px_0px_#000] ml-auto"
                          >
                            {task.assignedEmail.charAt(0)}
                          </div>
                        )
                      ) : (
                        <div title="Unassigned Task" className="flex h-5.5 w-5.5 items-center justify-center rounded-lg bg-white border-2 border-black text-neutral-600 ml-auto">
                          <User className="h-3 w-3" />
                        </div>
                      )}

                    </div>

                    {/* Task Tags */}
                    {task.tags && task.tags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 mt-2.5">
                        {task.tags.slice(0, 3).map((tag, tIdx) => (
                          <span key={tIdx} className="bg-amber-50 text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded border border-black/30 text-black">#{tag}</span>
                        ))}
                      </div>
                    )}

                  </div>
                ))}

              {filteredTasks.filter(tk => tk.status === col.status).length === 0 && (
                <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-neutral-300 bg-neutral-50/50 rounded-2xl p-4 text-center">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Empty Lane</p>
                </div>
              )}
            </div>

          </div>
        ))}
      </div>

      {/* ==========================================
          ADD TASK MODAL / DIALOG DOCK
          ========================================== */}
      {showAddModal && (
        <div id="add_task_modal_backdrop" className="relative z-50 animate-fade-in">
          <div className="fixed inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <div id="add_task_modal" className="relative w-full max-w-lg overflow-hidden rounded-3xl border-2 border-black bg-white p-6 shadow-[6px_6px_0px_0px_#1a1a1a] transition-all">
              
              <div className="flex items-center justify-between pb-4 border-b-2 border-black">
                <h3 className="font-display text-base font-black uppercase tracking-tight text-slate-900">
                  Sprint Workspace Task Creation
                </h3>
                <button onClick={() => setShowAddModal(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-neutral-150 border-2 border-transparent hover:border-black transition">
                  <X className="h-5 w-5 text-black" />
                </button>
              </div>

              <form onSubmit={handleAddTask} className="mt-4 space-y-4">
                
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Task Title <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Enter short action objective"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full rounded-xl border-2 border-black bg-white px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Detailed Description</label>
                  <textarea
                    placeholder="Provide detailed instructions or checklist parameters..."
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    className="w-full rounded-xl border-2 border-black bg-white px-3 py-2 text-xs font-medium min-h-[80px] focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    rows={3}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Work Priority</label>
                    <select
                      value={formPriority}
                      onChange={(e) => setFormPriority(e.target.value as TaskPriority)}
                      className="w-full rounded-xl border-2 border-black bg-white px-3 py-2 text-xs font-bold focus:outline-none cursor-pointer"
                    >
                      <option value="low">🟡 Low Priority</option>
                      <option value="medium">🟠 Medium Priority</option>
                      <option value="high">🔴 High Priority</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Target Due Date</label>
                    <input
                      type="date"
                      value={formDueDate}
                      onChange={(e) => setFormDueDate(e.target.value)}
                      className="w-full rounded-xl border-2 border-black bg-white px-3 py-2 text-xs font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Assign Teammate</label>
                    <select
                      value={formAssignEmail}
                      onChange={(e) => setFormAssignEmail(e.target.value)}
                      className="w-full rounded-xl border-2 border-black bg-white px-3 py-2 text-xs font-bold focus:outline-none cursor-pointer"
                    >
                      <option value="">Unassigned (Open list)</option>
                      {project.memberEmails.map((email, idx) => (
                        <option key={idx} value={email}>{email}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Labels / Tags</label>
                    <input
                      type="text"
                      placeholder="comma values, e.g. bug, sprintQ3, api"
                      value={formTagString}
                      onChange={(e) => setFormTagString(e.target.value)}
                      className="w-full rounded-xl border-2 border-black bg-white px-3 py-2 text-xs font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t-2 border-dashed border-black flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="rounded-xl px-4 py-2.5 text-xs font-extrabold uppercase text-neutral-500 hover:bg-neutral-100"
                  >
                    Cancel Action
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-black border-2 border-black px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-[2px_2px_0px_0px_#000] hover:bg-neutral-850 hover:-translate-y-0.5 active:translate-y-0.5 transition cursor-pointer"
                  >
                    Create Task
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          EDIT / DETAILS WORKSPACE MODULE
          ========================================== */}
      {selectedTask && (
        <div id="edit_task_modal_backdrop" className="relative z-50 animate-fade-in">
          <div className="fixed inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setSelectedTask(null)} />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <div id="edit_task_modal" className="relative w-full max-w-lg overflow-hidden rounded-3xl border-2 border-black bg-white p-6 shadow-[6px_6px_0px_0px_#1a1a1a] transition-all">
              
              <div className="flex items-center justify-between pb-4 border-b-2 border-black">
                <div className="flex items-center gap-2">
                  <Bookmark className="h-4.5 w-4.5 text-black stroke-[2.5]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-neutral-850">Task Document Inspector</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => handleDeleteTask(selectedTask)}
                    title="Delete item"
                    className="rounded-lg p-1.5 text-black hover:bg-red-300 border-2 border-transparent hover:border-black transition cursor-pointer"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                  <button onClick={() => setSelectedTask(null)} className="rounded-lg p-1.5 text-black hover:bg-neutral-150 border-2 border-transparent hover:border-black transition cursor-pointer">
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-4">
                
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={detailTitle}
                    onChange={(e) => setDetailTitle(e.target.value)}
                    className="w-full rounded-xl border-2 border-black bg-white px-3 py-2 text-xs font-black text-slate-950 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Description</label>
                  <textarea
                    value={detailDesc}
                    onChange={(e) => setDetailDesc(e.target.value)}
                    className="w-full rounded-xl border-2 border-black bg-white px-3 py-2 text-xs font-medium min-h-[90px] focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    rows={4}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Current Status State</label>
                    <select
                      value={detailStatus}
                      onChange={(e) => setDetailStatus(e.target.value as TaskStatus)}
                      className="w-full rounded-xl border-2 border-black bg-white px-3 py-2 text-xs font-bold focus:outline-none cursor-pointer"
                    >
                      <option value="todo">Backlog Task (Todo)</option>
                      <option value="in_progress">Active Production (In progress)</option>
                      <option value="review">Evaluating Code (Review)</option>
                      <option value="completed">Complete & Archived (Completed)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Work Priority</label>
                    <select
                      value={detailPriority}
                      onChange={(e) => setDetailPriority(e.target.value as TaskPriority)}
                      className="w-full rounded-xl border-2 border-black bg-white px-3 py-2 text-xs font-bold focus:outline-none cursor-pointer"
                    >
                      <option value="low">🟡 Low Priority</option>
                      <option value="medium">🟠 Medium Priority</option>
                      <option value="high">🔴 High Priority</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Assigned Developer</label>
                    <select
                      value={detailAssignEmail}
                      onChange={(e) => setDetailAssignEmail(e.target.value)}
                      className="w-full rounded-xl border-2 border-black bg-white px-3 py-2 text-xs font-bold focus:outline-none cursor-pointer"
                    >
                      <option value="">Unassigned (Available pool)</option>
                      {project.memberEmails.map((email, idx) => (
                        <option key={idx} value={email}>{email}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Target Due Date</label>
                    <input
                      type="date"
                      value={detailDueDate}
                      onChange={(e) => setDetailDueDate(e.target.value)}
                      className="w-full rounded-xl border-2 border-black bg-white px-3 py-2 text-xs font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Tags (Comma-Separated)</label>
                  <input
                    type="text"
                    value={detailTagString}
                    onChange={(e) => setDetailTagString(e.target.value)}
                    className="w-full rounded-xl border-2 border-black bg-white px-3 py-2 text-xs font-bold focus:outline-none"
                  />
                </div>

                <div className="pt-4 border-t-2 border-dashed border-black flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedTask(null)}
                    className="rounded-xl px-4 py-2.5 text-xs font-extrabold uppercase text-neutral-500 hover:bg-neutral-100"
                  >
                    Close Sheet
                  </button>
                  <button
                    onClick={handleSaveDetails}
                    className="rounded-xl bg-black border-2 border-black px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-[2px_2px_0px_0px_#000] hover:bg-neutral-850 hover:-translate-y-0.5 active:translate-y-0.5 transition cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
