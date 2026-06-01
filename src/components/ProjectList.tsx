/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Users, 
  FolderPlus, 
  UserPlus, 
  Trash2, 
  Crown, 
  CheckCircle,
  Hash,
  Activity
} from 'lucide-react';
import { Project } from '../types';
import { shareProject, createProject } from '../dataService';

interface ProjectListProps {
  currentUser: any;
  projects: Project[];
  selectedProject: Project | null;
  onSelectProject: (proj: Project) => void;
  onRefresh: () => void;
}

export default function ProjectList({
  currentUser,
  projects,
  selectedProject,
  onSelectProject,
  onRefresh
}: ProjectListProps) {
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [shareEmail, setShareEmail] = useState('');
  const [shareStatus, setShareStatus] = useState<{ success: boolean; msg: string } | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle Project Creation
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !currentUser) return;
    setIsSubmitting(true);
    try {
      const pid = await createProject(
        newTitle.trim(),
        newDesc.trim(),
        currentUser.uid,
        currentUser.email
      );
      setNewTitle('');
      setNewDesc('');
      setShowAddForm(false);
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Project Share
  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareEmail.trim() || !selectedProject || !currentUser) return;
    try {
      const res = await shareProject(
        selectedProject.id,
        shareEmail.trim(),
        currentUser.uid,
        currentUser.email
      );
      setShareStatus({ success: res.success, msg: res.message });
      setShareEmail('');
      setTimeout(() => setShareStatus(null), 5000); // clear
      onRefresh();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div id="workspace_mgmt_panel" className="space-y-6">
      
      {/* 1. Projects Listing */}
      <div className="bento-card bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-base font-black uppercase text-slate-800 flex items-center gap-2">
            <Hash className="h-4.5 w-4.5 text-black stroke-[2.5]" />
            Active Boards
          </h3>
          <button
            id="toggle_add_workspace_btn"
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex h-8 w-8 items-center justify-center rounded-xl border-2 border-black bg-white text-black hover:bg-neutral-50 shadow-[2px_2px_0px_0px_#1a1a1a] transition hover:-translate-y-0.5 active:translate-y-0.5"
          >
            <FolderPlus className="h-4 w-4" />
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleCreate} id="new_project_form" className="mb-4 space-y-3.5 rounded-xl bg-amber-50 p-4 border-2 border-black shadow-[2px_2px_0px_0px_#1a1a1a]">
            <div>
              <label className="block text-[10px] font-extrabold uppercase text-neutral-500">Workspace Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Q3 Launch Readiness"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="mt-1 w-full rounded-xl border-2 border-black bg-white px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-neutral-400"
              />
            </div>
            <div>
              <label className="block text-[10px] font-extrabold uppercase text-neutral-500">Short Description</label>
              <textarea
                placeholder="Core objectives & deliverables"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="mt-1 w-full rounded-xl border-2 border-black bg-white px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-neutral-400"
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2 text-xs pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="rounded-lg px-3 py-1 text-slate-500 hover:bg-slate-200 transition font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bento-btn py-1 px-3 text-[10px]"
              >
                {isSubmitting ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        )}

        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelectProject(p)}
              className={`flex w-full flex-col gap-1 rounded-xl p-3 text-left border-2 transition ${
                selectedProject?.id === p.id
                  ? 'bg-black text-white border-black shadow-[3px_3px_0px_0px_#1a1a1a]'
                  : 'text-neutral-700 bg-white border-black/30 hover:shadow-[3px_3px_0px_0px_#1a1a1a] hover:border-black'
              }`}
            >
              <span className="text-xs font-black uppercase tracking-wide truncate mb-0.5">
                {p.title}
              </span>
              <span className={`text-[10px] line-clamp-1 font-medium ${selectedProject?.id === p.id ? 'text-slate-300' : 'text-slate-400'}`}>
                {p.description || 'No description provided.'}
              </span>
            </button>
          ))}
          {projects.length === 0 && (
            <div className="text-center py-6">
              <p className="text-xs italic text-slate-400">No boards configured yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* 2. Team Collaboration / Workspace Sharing Controls */}
      {selectedProject && (
        <div id="collaborator_sharing_card" className="bento-card p-5 space-y-4 bg-white">
          <div>
            <h3 className="font-display text-base font-black uppercase text-slate-800 flex items-center gap-2">
              <Users className="h-4.5 w-4.5 text-black stroke-[2.5]" />
              Workspace Team
            </h3>
            <p className="text-[10px] font-medium text-slate-400 mt-1">
              Currently compiling updates across {selectedProject.members.length} member accounts.
            </p>
          </div>

          {/* Members List */}
          <div className="space-y-2">
            <div className="max-h-28 overflow-y-auto space-y-2.5 pr-1">
              {/* Owner */}
              <div className="flex items-center justify-between rounded-xl bg-violet-50 p-2.5 border-2 border-black shadow-[2px_2px_0px_0px_#1a1a1a]">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-black text-black font-extrabold text-xs uppercase shadow-[1px_1px_0px_0px_#1a1a1a]">
                    {selectedProject.ownerEmail?.charAt(0) || 'O'}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-extrabold text-slate-900 leading-none truncate max-w-[120px]">
                      {selectedProject.ownerEmail?.split('@')[0]}
                    </span>
                    <span className="font-mono text-[9px] text-zinc-500 truncate max-w-[120px]">
                      {selectedProject.ownerEmail}
                    </span>
                  </div>
                </div>
                <span className="flex items-center gap-0.5 rounded-full bg-yellow-300 border border-black px-2 py-0.5 text-[8px] font-black text-black">
                  <Crown className="h-2.5 w-2.5 stroke-[2]" />
                  Owner
                </span>
              </div>

              {/* Members */}
              {selectedProject.memberEmails
                .filter(email => email !== selectedProject.ownerEmail)
                .map((email, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl bg-neutral-50 p-2.5 border-2 border-black shadow-[2px_2px_0px_0px_#1a1a1a]">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-black text-black font-extrabold text-xs uppercase shadow-[1px_1px_0px_0px_#1a1a1a]">
                        {email.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-extrabold text-slate-900 leading-none truncate max-w-[120px]">
                          {email.split('@')[0]}
                        </span>
                        <span className="font-mono text-[9px] text-zinc-500 truncate max-w-[120px]">
                          {email}
                        </span>
                      </div>
                    </div>
                    <span className="rounded-full bg-white border border-black px-2 py-0.5 text-[8px] font-black text-black">
                      Member
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <form onSubmit={handleShare} className="space-y-2 pt-3 border-t-2 border-dashed border-black">
            <label className="block text-[10px] font-extrabold uppercase text-neutral-500">Invite Collaborator</label>
            <div className="flex gap-2">
              <input
                type="email"
                required
                placeholder="teammate@company.com"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                className="w-full rounded-xl border-2 border-black bg-white px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <button
                type="submit"
                className="flex items-center justify-center h-9.5 w-9.5 flex-none rounded-xl bg-yellow-300 border-2 border-black text-black hover:bg-yellow-400 shadow-[2px_2px_0px_0px_#1a1a1a] cursor-pointer hover:-translate-y-0.5"
              >
                <UserPlus className="h-4.5 w-4.5" />
              </button>
            </div>

            {shareStatus && (
              <p className={`text-[10px] font-bold mt-2 flex items-center gap-1 leading-normal ${shareStatus.success ? 'text-emerald-700 bg-emerald-50 px-2 py-1 border border-emerald-200 rounded' : 'text-red-500 bg-red-50 px-2 py-1 border border-red-200 rounded'}`}>
                {shareStatus.success && <CheckCircle className="h-3.5 w-3.5 flex-none" />}
                {shareStatus.msg}
              </p>
            )}
          </form>
        </div>
      )}

    </div>
  );
}
