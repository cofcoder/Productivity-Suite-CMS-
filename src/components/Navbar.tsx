/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Cloud, 
  Database, 
  LogOut, 
  ChevronDown, 
  User, 
  HelpCircle, 
  ShieldAlert, 
  FolderLock,
  Compass
} from 'lucide-react';
import { Project } from '../types';
import { logoutUser, isFirebaseConfigured } from '../dataService';

interface NavbarProps {
  currentUser: any;
  projects: Project[];
  selectedProject: Project | null;
  onSelectProject: (proj: Project) => void;
  onCreateProjectClick: () => void;
  onGoogleSignIn: () => void;
}

export default function Navbar({
  currentUser,
  projects,
  selectedProject,
  onSelectProject,
  onCreateProjectClick,
  onGoogleSignIn
}: NavbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [syncModalOpen, setSyncModalOpen] = useState(false);

  return (
    <header id="nav_header" className="sticky top-0 z-40 w-full border-b-2 border-black bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Left Side: Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-300 text-black border-2 border-black shadow-[2px_2px_0px_0px_#1a1a1a] transition-transform hover:scale-105">
            <Compass className="h-5 w-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="font-display text-lg font-black uppercase tracking-tight text-slate-900">
              Productivity CMS
            </span>
            <span className="hidden sm:inline-block ml-2 rounded-lg bg-black border-2 border-black px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
              Suite
            </span>
          </div>
        </div>

        {/* Center: Interactive Project Workspace Selector (Only if signed in) */}
        {currentUser && (
          <div className="relative">
            <button
              id="workspace_selector_btn"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 rounded-xl border-2 border-black bg-white px-3.5 py-1.5 text-xs font-black uppercase tracking-wide text-black shadow-[2px_2px_0px_0px_#1a1a1a] transition hover:bg-neutral-50 hover:shadow-[3px_3px_0px_0px_#1a1a1a] hover:-translate-y-0.5"
            >
              <span className="max-w-[120px] truncate sm:max-w-[200px]">
                {selectedProject ? selectedProject.title : 'No active workspace'}
              </span>
              <ChevronDown className={`h-4 w-4 text-black transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setDropdownOpen(false)} 
                />
                <div id="workspace_dropdown" className="absolute left-1/2 mt-2 w-64 -translate-x-1/2 rounded-2xl border-2 border-black bg-white p-2 shadow-[4px_4px_0px_0px_#1a1a1a] z-40">
                  <div className="px-3 py-1.5 text-[9px] font-black text-neutral-400 uppercase tracking-widest">
                    Workspaces
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-1">
                    {projects.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          onSelectProject(p);
                          setDropdownOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-extrabold border-2 transition ${
                          selectedProject?.id === p.id 
                            ? 'bg-black text-white border-black shadow-[2px_2px_0px_0px_#000]' 
                            : 'text-slate-600 bg-white border-transparent hover:border-black hover:bg-slate-50'
                        }`}
                      >
                        <span className="truncate">{p.title}</span>
                        {selectedProject?.id === p.id && (
                          <span className="h-2 w-2 rounded-full bg-yellow-300" />
                        )}
                      </button>
                    ))}
                    {projects.length === 0 && (
                      <div className="px-3 py-2 text-xs italic text-slate-400">
                        No projects created yet.
                      </div>
                    )}
                  </div>

                  <div className="my-2 border-t-2 border-black" />
                  
                  <button
                    onClick={() => {
                      onCreateProjectClick();
                      setDropdownOpen(false);
                    }}
                    className="flex w-full items-center justify-center gap-1 rounded-xl px-3 py-2 text-xs font-black uppercase text-indigo-600 hover:bg-indigo-50 border-2 border-transparent hover:border-black hover:shadow-[2px_2px_0px_0px_rgba(79,70,229,1)] transition"
                  >
                    + Create Workspace
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Right Side: Synchronization Banner, Profile and Session Sync */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          
          {/* Sync Status Badge */}
          {currentUser && (
            <button
              id="sync_indicator"
              onClick={() => setSyncModalOpen(true)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide border-2 border-black shadow-[2px_2px_0px_0px_#1a1a1a] hover:-translate-y-0.5 active:translate-y-0.5 cursor-pointer transition-all ${
                isFirebaseConfigured
                  ? 'bg-emerald-300 text-black'
                  : 'bg-amber-300 text-black'
              }`}
            >
              <div className={`h-2.5 w-2.5 rounded-full border border-black ${isFirebaseConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="hidden md:inline">
                {isFirebaseConfigured ? 'Secure Sync' : 'Sandbox State'}
              </span>
              <span className="inline md:hidden">
                {isFirebaseConfigured ? 'Cloud' : 'Local'}
              </span>
            </button>
          )}

          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="hidden flex-col items-end md:flex">
                <span className="text-xs font-black uppercase text-slate-900 truncate max-w-[140px]">
                  {currentUser.displayName}
                </span>
                <span className="font-mono text-[9px] font-semibold text-neutral-600 truncate max-w-[140px]">
                  {currentUser.email}
                </span>
              </div>
              <button
                id="sign_out_btn"
                onClick={logoutUser}
                title="Sign Out"
                className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-black bg-white text-black hover:bg-red-400 hover:shadow-[2px_2px_0px_0px_#1a1a1a] transition hover:-translate-y-0.5 active:translate-y-0.5 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              id="sign_in_btn"
              onClick={onGoogleSignIn}
              className="flex items-center gap-2 rounded-xl bg-black border-2 border-black px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-white shadow-[2px_2px_0px_0px_#1a1a1a] hover:bg-neutral-850 hover:shadow-[3px_3px_0px_0px_#1a1a1a] transition hover:-translate-y-0.5 active:translate-y-0.5 cursor-pointer"
            >
              <User className="h-4 w-4" />
              Get Started
            </button>
          )}
        </div>
      </div>

      {/* Sync Status Info Modal */}
      {syncModalOpen && (
        <div id="sync_modal" className="relative z-50">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setSyncModalOpen(false)} />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <div className="relative w-full max-w-md transform overflow-hidden rounded-3xl border-2 border-black bg-white p-6 text-left align-middle shadow-[6px_6px_0px_0px_#1a1a1a] transition-all animate-fade-in">
              
              <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-black ${isFirebaseConfigured ? 'bg-emerald-300' : 'bg-amber-300'}`}>
                  {isFirebaseConfigured ? <Cloud className="h-6 w-6 text-black" /> : <ShieldAlert className="h-6 w-6 text-black" />}
                </div>
                <div>
                  <h3 className="font-display text-lg font-black uppercase tracking-tight text-slate-900">
                    {isFirebaseConfigured ? "Firebase Sync Active" : "Local Sandbox State"}
                  </h3>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Device-to-device persistence status</p>
                </div>
              </div>

              <div className="mt-4 text-xs text-slate-600 space-y-3 leading-relaxed">
                {isFirebaseConfigured ? (
                  <p>
                    Your workspace is fully connected with live **Firebase Firestore**. 
                    All tasks, visual schedule blocks, goals, and team chat bubbles are synced across 
                    devices in real-time. Feel free to open this application in multiple tabs 
                    or share it with your team!
                  </p>
                ) : (
                  <>
                    <p>
                      The application is running in **Local Fallback Mode**. All data is saved inside 
                      your browser's local safety store. Real-time collaborations and remote multi-device 
                      syncing are offline.
                    </p>
                    <div className="rounded-2xl bg-amber-50 p-4 border-2 border-black text-black space-y-2 shadow-[2px_2px_0px_0px_#1a1a1a]">
                      <p className="font-extrabold uppercase tracking-widest text-[10px] flex items-center gap-1.5">
                        <FolderLock className="h-4 w-4 text-amber-700" /> Connect database:
                      </p>
                      <ol className="list-decimal list-inside space-y-1.5 pl-1 font-medium">
                        <li>Locate the <strong>Actions / Terminal Panel</strong> in the AI Studio platform workspace.</li>
                        <li>Trigger the setup via the <strong>"Set up Firebase"</strong> button.</li>
                        <li>The system will write your configuration in <code>firebase-applet-config.json</code>, which automatically activates instant cloud sync!</li>
                      </ol>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSyncModalOpen(false)}
                  className="rounded-xl bg-black border-2 border-black px-4 py-2 text-xs font-black uppercase text-white hover:bg-neutral-800 hover:shadow-[2px_2px_0px_0px_#000] hover:-translate-y-0.5 active:translate-y-0.5 transition cursor-pointer"
                >
                  Understood
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </header>
  );
}
