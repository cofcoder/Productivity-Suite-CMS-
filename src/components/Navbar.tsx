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
  Sun, 
  Moon, 
  Bell, 
  CheckCircle,
  Menu as MenuIcon,
  X as CloseIcon
} from 'lucide-react';
import { Project } from '../types';
import { logoutUser, isFirebaseConfigured } from '../dataService';
import StratumLogo from './StratumLogo';

interface NavbarProps {
  currentUser: any;
  projects: Project[];
  selectedProject: Project | null;
  onSelectProject: (proj: Project) => void;
  onCreateProjectClick: () => void;
  onGoogleSignIn: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  nearingDeadlines?: { task: any; label: string; hoursLeft: number }[];
  onCompleteTask?: (taskId: string) => void;
  onNavigateToTab?: (tabId: string) => void;
}

export default function Navbar({
  currentUser,
  projects,
  selectedProject,
  onSelectProject,
  onCreateProjectClick,
  onGoogleSignIn,
  theme = 'light',
  onToggleTheme,
  nearingDeadlines = [],
  onCompleteTask,
  onNavigateToTab
}: NavbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header id="nav_header" className="sticky top-0 z-40 w-full border-b-2 border-black bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
        
        {/* Left Side: Logo and Brand */}
        <div className="flex items-center gap-2 sm:gap-3">
          <StratumLogo className="h-8 w-8 sm:h-10 sm:w-10 hover:scale-105 transition-transform duration-200" />
          <div className="flex items-center">
            <span className="font-display text-sm sm:text-base md:text-lg font-black uppercase tracking-tight text-slate-900 truncate max-w-[130px] sm:max-w-none">
              Stratum
            </span>
            <span className="hidden lg:inline-block ml-2 rounded-lg bg-black border-2 border-black px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
              Suite
            </span>
          </div>
        </div>

        {/* Center: Interactive Project Workspace Selector (Only if signed in) - Hidden on mobile, shown on md+ */}
        {currentUser && (
          <div className="hidden md:block relative">
            <button
              id="workspace_selector_btn"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 rounded-xl border-2 border-black bg-white px-3.5 py-1.5 text-xs font-black uppercase tracking-wide text-black shadow-[2px_2px_0px_0px_#1a1a1a] transition hover:bg-neutral-50 hover:shadow-[3px_3px_0px_0px_#1a1a1a] hover:-translate-y-0.5 cursor-pointer"
            >
              <span className="max-w-[125px] truncate lg:max-w-[200px]">
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
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-extrabold border-2 transition cursor-pointer ${
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
                    className="flex w-full items-center justify-center gap-1 rounded-xl px-3 py-2 text-xs font-black uppercase text-indigo-600 hover:bg-indigo-50 border-2 border-transparent hover:border-black hover:shadow-[2px_2px_0px_0px_rgba(79,70,229,1)] transition cursor-pointer"
                  >
                    + Create Workspace
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Right Side: Theme, Bell Icons and Sync / Profile action indicators */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          
          {/* Global Theme Toggle Button */}
          <button
            id="theme_toggle_btn"
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Switch to Warm Cream Mode' : 'Switch to High Contrast Dark Mode'}
            className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-black bg-white text-black hover:bg-yellow-300 hover:shadow-[1.5px_1.5px_0px_0px_#1a1a1a] transition hover:translate-x-0.5 active:translate-y-0.5 cursor-pointer shadow-[1.5px_1.5px_0px_0px_#1a1a1a]"
          >
            {theme === 'dark' ? (
              <Sun className="h-4.5 w-4.5 stroke-[2.5] text-amber-500 fill-amber-500" />
            ) : (
              <Moon className="h-4.5 w-4.5 stroke-[2.5]" />
            )}
          </button>

          {/* Task Deadlines Notification Bell Dropdown */}
          {currentUser && (
            <div className="relative">
              <button
                id="deadline_notifications_bell"
                onClick={() => setBellOpen(!bellOpen)}
                title="Task Deadline Reminders"
                className={`relative flex h-9 w-9 items-center justify-center rounded-xl border-2 border-black bg-white text-black hover:bg-neutral-50 hover:shadow-[1.5px_1.5px_0px_0px_#1a1a1a] transition hover:scale-105 cursor-pointer shadow-[1.5px_1.5px_0px_0px_#1a1a1a] ${
                  nearingDeadlines.length > 0 ? 'bg-amber-100' : ''
                }`}
              >
                <Bell className={`h-4.5 w-4.5 stroke-[2.5] ${nearingDeadlines.length > 0 ? 'animate-bounce text-amber-600' : ''}`} />
                {nearingDeadlines.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full border border-black bg-red-500 text-[9px] font-black text-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                    {nearingDeadlines.length}
                  </span>
                )}
              </button>

              {bellOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-30" 
                    onClick={() => setBellOpen(false)} 
                  />
                  <div 
                    id="notifications_dropdown" 
                    className="absolute right-0 mt-2 w-72 rounded-2xl border-2 border-black bg-white p-3.5 shadow-[4px_4px_0px_0px_#1a1a1a] z-40 text-black max-w-sm"
                  >
                    <div className="px-1 pb-2 border-b-2 border-black flex justify-between items-center text-left">
                      <div>
                        <span className="block font-display text-xs font-black uppercase tracking-tight">Deadlines Alert</span>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">Items due in the next 48 hours</p>
                      </div>
                      <span className="rounded-lg bg-red-100 border border-red-300 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-red-700">
                        {nearingDeadlines.length} Priority
                      </span>
                    </div>

                    <div className="mt-3.5 max-h-60 overflow-y-auto space-y-2.5">
                      {nearingDeadlines.map((item) => (
                        <div key={item.task.id} className="group border border-black rounded-xl p-2.5 bg-neutral-50 hover:bg-[#fafaf8] transition text-left">
                          <div className="flex items-start justify-between gap-1.5">
                            <span className="font-extrabold text-xs text-neutral-900 line-clamp-2 leading-snug">
                              {item.task.title}
                            </span>
                            <span className="text-[9px] text-red-700 bg-red-100 border border-red-350 px-1 py-0.5 rounded leading-none flex-shrink-0 font-black uppercase">
                              {item.label}
                            </span>
                          </div>
                          <div className="mt-2.5 flex justify-between items-center text-[10px]">
                            {onNavigateToTab && (
                              <button
                                onClick={() => {
                                  onNavigateToTab('tasks');
                                  setBellOpen(false);
                                }}
                                className="font-extrabold text-indigo-700 hover:underline cursor-pointer"
                              >
                                View Card →
                              </button>
                            )}
                            {onCompleteTask && (
                              <button
                                onClick={() => onCompleteTask(item.task.id)}
                                className="flex items-center gap-1 rounded bg-black text-white px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border border-black hover:scale-105 transition-all cursor-pointer"
                              >
                                <CheckCircle className="h-3 w-3 stroke-[2.5]" />
                                Done
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {nearingDeadlines.length === 0 && (
                        <div className="py-6 text-center space-y-1.5">
                          <p className="text-sm">🎯</p>
                          <p className="text-xs font-bold text-neutral-500 uppercase tracking-wide">All Clear</p>
                          <p className="text-[10px] text-neutral-400 max-w-[180px] mx-auto px-1.5">No tasks are nearing a deadline or overdue. Stellar execution!</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Desktop Only elements (md+) */}
          <div className="hidden md:flex items-center gap-2.5 sm:gap-3">
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
                <span>
                  {isFirebaseConfigured ? 'Secure Sync' : 'Sandbox State'}
                </span>
              </button>
            )}

            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-black uppercase text-slate-900 truncate max-w-[130px] lg:max-w-[170px]">
                    {currentUser.displayName}
                  </span>
                  <span className="font-mono text-[9px] font-semibold text-neutral-600 truncate max-w-[130px] lg:max-w-[170px]">
                    {currentUser.email}
                  </span>
                </div>
                <button
                  id="sign_out_btn"
                  onClick={logoutUser}
                  title="Sign Out"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-black bg-white text-black hover:bg-red-400 hover:shadow-[1.5px_1.5px_0px_0px_#1a1a1a] transition hover:-translate-y-0.5 active:translate-y-0.5 cursor-pointer"
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

          {/* Mobile Only collapse trigger menu button */}
          <button
            id="mobile_menu_toggle_btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex md:hidden h-9 w-9 items-center justify-center rounded-xl border-2 border-black bg-white text-black hover:bg-neutral-100 font-extrabold cursor-pointer shadow-[1.5px_1.5px_0px_0px_#1a1a1a] transition-all"
          >
            {mobileMenuOpen ? (
              <CloseIcon className="h-4.5 w-4.5 stroke-[2.5]" />
            ) : (
              <MenuIcon className="h-4.5 w-4.5 stroke-[2.5]" />
            )}
          </button>

        </div>
      </div>

      {/* Expanded Mobile Menu section */}
      {mobileMenuOpen && (
        <div 
          id="mobile_collapsible_menu" 
          className="md:hidden border-t-2 border-black bg-white p-4 space-y-4 shadow-[0px_4px_0px_0px_rgba(0,0,0,1)] text-black animate-fade-in text-left"
        >
          {currentUser ? (
            <div className="space-y-4">
              
              {/* Workspace Selection Area */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest pl-1">
                  Workspace Workspace selector:
                </span>
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex w-full items-center justify-between rounded-xl border-2 border-black bg-white px-3.5 py-2 text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] cursor-pointer"
                  >
                    <span className="truncate">
                      {selectedProject ? selectedProject.title : 'Select active workspace'}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-black transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute left-0 right-0 mt-2 rounded-2xl border-2 border-black bg-white p-2 shadow-[4px_4px_0px_0px_#1a1a1a] z-50">
                      <div className="px-3 py-1 text-[9px] font-black text-neutral-450 uppercase tracking-wide">
                        My Workspaces
                      </div>
                      <div className="max-h-40 overflow-y-auto space-y-1 mt-1">
                        {projects.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => {
                              onSelectProject(p);
                              setDropdownOpen(false);
                            }}
                            className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-extrabold border-2 cursor-pointer ${
                              selectedProject?.id === p.id 
                                ? 'bg-black text-white border-black' 
                                : 'text-slate-650 bg-white border-transparent hover:border-black hover:bg-slate-50'
                            }`}
                          >
                            <span className="truncate">{p.title}</span>
                          </button>
                        ))}
                      </div>
                      <div className="my-1.5 border-t border-black" />
                      <button
                        onClick={() => {
                          onCreateProjectClick();
                          setDropdownOpen(false);
                          setMobileMenuOpen(false);
                        }}
                        className="w-full text-center py-2 text-xs font-black uppercase text-indigo-700 cursor-pointer"
                      >
                        + Create Workspace
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Sync controls */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest pl-1">
                  Database Sync Status
                </span>
                <button
                  onClick={() => {
                    setSyncModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wide border-2 border-black shadow-[2px_2px_0px_0px_#000] cursor-pointer ${
                    isFirebaseConfigured ? 'bg-emerald-300 text-black' : 'bg-amber-300 text-black'
                  }`}
                >
                  <div className={`h-2 w-2 rounded-full border border-black ${isFirebaseConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  <span>{isFirebaseConfigured ? 'Cloud Live' : 'Offline Local'}</span>
                </button>
              </div>

              {/* Profile Details & Logout */}
              <div className="pt-3 border-t-2 border-black flex items-center justify-between">
                <div className="flex flex-col text-left max-w-[160px]">
                  <span className="text-xs font-black uppercase text-slate-900 truncate">
                    {currentUser.displayName}
                  </span>
                  <span className="font-mono text-[9px] font-semibold text-neutral-600 truncate">
                    {currentUser.email}
                  </span>
                </div>
                <button
                  onClick={async () => {
                    setMobileMenuOpen(false);
                    await logoutUser();
                  }}
                  className="flex items-center gap-1.5 rounded-xl border-2 border-black bg-red-100 px-3.5 py-1.5 text-xs font-bold uppercase text-red-700 shadow-[1.5px_1.5px_0px_0px_#000] hover:bg-red-200 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>

            </div>
          ) : (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onGoogleSignIn();
              }}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-black border-2 border-black px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-[2px_2px_0px_0px_#000] hover:bg-neutral-800 cursor-pointer"
            >
              <User className="h-4 w-4" />
              Get Started
            </button>
          )}
        </div>
      )}

      {/* Sync Status Info Modal */}
      {syncModalOpen && (
        <div id="sync_modal" className="relative z-50">
          <div className="fixed inset-0 bg-black/45 backdrop-blur-sm transition-opacity" onClick={() => setSyncModalOpen(false)} />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <div className="relative w-full max-w-md transform overflow-hidden rounded-3xl border-2 border-black bg-white p-6 text-left align-middle shadow-[6px_6px_0px_0px_#1a1a1a] transition-all animate-fade-in text-black">
              
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

              <div className="mt-4 text-xs text-slate-650 space-y-3 leading-relaxed">
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
