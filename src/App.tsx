/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  Layers, 
  CheckSquare, 
  Calendar, 
  Target, 
  MessageSquare, 
  Users, 
  BookOpen, 
  CloudRain, 
  FolderLock,
  ArrowRight,
  User
} from 'lucide-react';
import { 
  Project, 
  Task, 
  TimeBlock, 
  Goal, 
  ChatMessage, 
  ProjectActivity 
} from './types';
import { 
  subscribeAuth, 
  subscribeProjects,
  subscribeTasks,
  subscribeTimeBlocks,
  subscribeGoals,
  subscribeChats,
  subscribeActivities,
  loginWithGoogle,
  isFirebaseConfigured,
  updateTask
} from './dataService';

import Navbar from './components/Navbar';
import ProjectList from './components/ProjectList';
import Dashboard from './components/Dashboard';
import KanbanBoard from './components/KanbanBoard';
import TimeBlocking from './components/TimeBlocking';
import GoalTracking from './components/GoalTracking';
import ChatCollaboration from './components/ChatCollaboration';
import UserProfile from './components/UserProfile';

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);
  
  // Theme state ('light' | 'dark')
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('cms_theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });

  // Task deadlining reminders setup
  const [dismissedDeadlines, setDismissedDeadlines] = useState<string[]>([]);
  const [showDeadlineToast, setShowDeadlineToast] = useState(true);

  // Projects state
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Nested collections state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [activities, setActivities] = useState<ProjectActivity[]>([]);

  // Navigation tab
  const [activeTab, setActiveTab] = useState('dashboard');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Global theme switcher hook 
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('cms_theme', next);
      return next;
    });
  };

  // Compute tasks nearing deadline
  const nearingDeadlines = React.useMemo(() => {
    if (!tasks || tasks.length === 0) return [];
    const now = new Date();
    return tasks.filter(t => {
      if (t.status === 'completed' || !t.dueDate) return false;
      try {
        const due = new Date(t.dueDate);
        const diffHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
        // Alert on overdue and anything due in the next 48 hours
        return diffHours <= 48;
      } catch (e) {
        return false;
      }
    }).map(t => {
      const due = new Date(t.dueDate!);
      const diffHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
      let label = '';
      if (diffHours < 0) {
        const hoursAgo = Math.round(Math.abs(diffHours));
        if (hoursAgo < 24) {
          label = `Overdue by ${hoursAgo}h`;
        } else {
          label = `Overdue by ${Math.round(hoursAgo / 24)}d`;
        }
      } else if (diffHours < 1) {
        label = 'Due in mins!';
      } else if (diffHours < 24) {
        label = `Due in ${Math.round(diffHours)}h`;
      } else {
        label = `Due in ${Math.round(diffHours / 24)}d`;
      }
      return { task: t, label, hoursLeft: diffHours };
    }).sort((a, b) => a.hoursLeft - b.hoursLeft);
  }, [tasks]);

  const activeNearingDeadlines = React.useMemo(() => {
    return nearingDeadlines.filter(item => !dismissedDeadlines.includes(item.task.id));
  }, [nearingDeadlines, dismissedDeadlines]);

  const handleCompleteTask = async (taskId: string) => {
    if (!selectedProject) return;
    try {
      await updateTask(
        selectedProject.id,
        taskId,
        { status: 'completed' },
        currentUser?.uid || 'offline',
        currentUser?.email || 'offline'
      );
    } catch (e) {
      console.error("Failed to update task status from toast click:", e);
    }
  };

  // 1. Subscribe to User Auth state
  useEffect(() => {
    const unsub = subscribeAuth((user) => {
      setCurrentUser(user);
      setAuthChecking(false);
    });
    return () => unsub();
  }, []);

  // 2. Subscribe to Project/Workspaces list once user is verified
  useEffect(() => {
    if (!currentUser) {
      setProjects([]);
      setSelectedProject(null);
      return;
    }

    const unsub = subscribeProjects(currentUser.uid, (projList) => {
      setProjects(projList);
      
      // If we don't have a selected project, or old selected project is not in list, auto-select first
      if (projList.length > 0) {
        setSelectedProject((prev) => {
          if (prev && projList.some(p => p.id === prev.id)) {
            return projList.find(p => p.id === prev.id) || projList[0];
          }
          return projList[0];
        });
      } else {
        setSelectedProject(null);
      }
    });

    return () => unsub();
  }, [currentUser, refreshTrigger]);

  // 3. Dynamic subscribe to sub-resources of selected project
  useEffect(() => {
    if (!currentUser || !selectedProject?.id) {
      setTasks([]);
      setTimeBlocks([]);
      setGoals([]);
      setChats([]);
      setActivities([]);
      return;
    }

    const projectId = selectedProject.id;

    const unsubTasks = subscribeTasks(projectId, (list) => setTasks(list));
    const unsubBlocks = subscribeTimeBlocks(projectId, (list) => setTimeBlocks(list));
    const unsubGoals = subscribeGoals(projectId, (list) => setGoals(list));
    const unsubChats = subscribeChats(projectId, (list) => setChats(list));
    const unsubActs = subscribeActivities(projectId, (list) => setActivities(list));

    return () => {
      unsubTasks();
      unsubBlocks();
      unsubGoals();
      unsubChats();
      unsubActs();
    };
  }, [currentUser, selectedProject?.id]);

  // Handle SignIn Click
  const handleGoogleSignInClick = async () => {
    try {
      const res = await loginWithGoogle();
      if (res.error) {
        alert(res.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRefreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const menuTabs = [
    { id: 'dashboard', label: 'Suite Dashboard', icon: Layers },
    { id: 'tasks', label: 'Kanban Tasks', icon: CheckSquare },
    { id: 'schedule', label: 'Time Blocking', icon: Calendar },
    { id: 'goals', label: 'Milestone Goals', icon: Target },
    { id: 'chat', label: 'Discussions Chnl', icon: MessageSquare },
    { id: 'profile', label: 'User Profile', icon: User }
  ];

  if (authChecking) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#f8f7f2] space-y-4">
        <div className="h-10 w-10 border-4 border-black border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono font-bold text-black uppercase tracking-widest bg-amber-300 px-3.5 py-2 border-2 border-black shadow-[3px_3px_0px_0px_#1a1a1a]">Loading Workspace Context...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f7f2]">
      
      {/* Dynamic Header */}
      <Navbar 
        currentUser={currentUser}
        projects={projects}
        selectedProject={selectedProject}
        onSelectProject={setSelectedProject}
        onCreateProjectClick={() => setActiveTab('config')}
        onGoogleSignIn={handleGoogleSignInClick}
        theme={theme}
        onToggleTheme={toggleTheme}
        nearingDeadlines={nearingDeadlines}
        onCompleteTask={handleCompleteTask}
        onNavigateToTab={setActiveTab}
      />

      {currentUser ? (
        <div className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid gap-6 lg:grid-cols-4">
            
            {/* Sidebar Columns: Navigation Tabs and Workspace Team Lists */}
            <div className="space-y-6 lg:col-span-1">
              
              {/* Application Menu Panel */}
              <div id="navigation_menu_panel" className="bento-card p-4 space-y-1.5 bg-white">
                <div className="px-3 py-2 text-[10px] font-black text-neutral-800 uppercase tracking-widest border-b-2 border-black mb-3 flex items-center justify-between">
                  <span>Navigation Hub</span>
                  <Compass className="h-4 w-4" />
                </div>
                {menuTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        if (selectedProject || tab.id === 'profile') {
                          setActiveTab(tab.id);
                        } else {
                          setActiveTab('config');
                        }
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-xs font-extrabold transition border-2 ${
                        activeTab === tab.id 
                          ? 'bg-black text-white border-black shadow-[2px_2px_0px_0px_rgba(26,26,26,1)] translate-x-0.5' 
                          : 'text-neutral-700 bg-white border-transparent hover:border-black hover:bg-neutral-50 hover:shadow-[2px_2px_0px_0px_rgba(26,26,26,1)]'
                      }`}
                    >
                      <Icon className="h-4.5 w-4.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Workspace details sidebar */}
              <ProjectList 
                currentUser={currentUser}
                projects={projects}
                selectedProject={selectedProject}
                onSelectProject={setSelectedProject}
                onRefresh={handleRefreshData}
              />

            </div>

            {/* Main Application Interface Viewport */}
            <main className="lg:col-span-3 space-y-6">
              
              {/* If no project is active, redirect them to create workspace form */}
              {!selectedProject && activeTab !== 'config' && activeTab !== 'profile' ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center max-w-lg mx-auto flex flex-col items-center justify-center space-y-4 shadow-sm mt-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                    <Layers className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-slate-800 text-base">Setup Workspace Board</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      No active workspace detected under your user credential. Create a collaborative board to start scheduling timeblocks, listing Kanban tasks, and tracking OKRs.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('config')}
                    className="flex items-center gap-1.5 rounded-xl bg-slate-950 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 shadow"
                  >
                    Launch Setup Board Drawer <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  {activeTab === 'dashboard' && (
                    <Dashboard 
                      tasks={tasks}
                      timeBlocks={timeBlocks}
                      goals={goals}
                      onTabChange={setActiveTab}
                    />
                  )}

                  {activeTab === 'tasks' && (
                    <KanbanBoard 
                      currentUser={currentUser}
                      project={selectedProject!}
                      tasks={tasks}
                    />
                  )}

                  {activeTab === 'schedule' && (
                    <TimeBlocking 
                      currentUser={currentUser}
                      project={selectedProject!}
                      tasks={tasks}
                      timeBlocks={timeBlocks}
                    />
                  )}

                  {activeTab === 'goals' && (
                    <GoalTracking 
                      currentUser={currentUser}
                      project={selectedProject!}
                      goals={goals}
                    />
                  )}

                  {activeTab === 'chat' && (
                    <ChatCollaboration 
                      currentUser={currentUser}
                      project={selectedProject!}
                      chats={chats}
                      activities={activities}
                    />
                  )}

                  {activeTab === 'profile' && (
                    <UserProfile 
                      currentUser={currentUser}
                      onRefreshData={handleRefreshData}
                      onNavigateToTab={setActiveTab}
                    />
                  )}
                  
                  {activeTab === 'config' && (
                    <div className="bento-card space-y-6 max-w-2xl bg-white">
                      <div>
                        <h2 className="font-display text-xl font-bold text-slate-950 uppercase tracking-tight">Add Workspace Board</h2>
                        <p className="text-xs text-slate-500 mt-0.5">Initialize a brand new collaborative sprint board or division workspace.</p>
                      </div>
                      
                      <div className="rounded-2xl bg-indigo-50 p-5 border-2 border-black text-black text-xs flex items-start gap-3 shadow-[2px_2px_0px_0px_#1a1a1a]">
                        <BookOpen className="h-5 w-5 text-indigo-700 flex-shrink-0" />
                        <div>
                          <p className="font-extrabold uppercase tracking-widest text-[10px]">Collaborative Sync Guidance</p>
                          <p className="mt-1 leading-normal font-medium text-neutral-800">
                            All boards you build automatically synchronizes to collaborators you share the workspace board with. Teammates can immediately see task progression, daily focus time blocks, and post chat bubbles inside the workspace discussion channel!
                          </p>
                        </div>
                      </div>

                      <div className="rounded-2xl border-2 border-black p-5 bg-[#f8f7f2] shadow-[2px_2px_0px_0px_#1a1a1a]">
                        <ProjectList 
                          currentUser={currentUser}
                          projects={projects}
                          selectedProject={selectedProject}
                          onSelectProject={setSelectedProject}
                          onRefresh={() => {
                            handleRefreshData();
                            setActiveTab('dashboard'); // Auto redirect back
                          }}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

            </main>

          </div>
        </div>
      ) : (
        /* Login Onboarding view */
        <div className="flex-1 flex items-center justify-center px-4 py-16 sm:px-6 lg:px-8 bg-[#f8f7f2]">
          <div className="max-w-md w-full text-center space-y-8 bento-card p-8 sm:p-10 relative overflow-hidden bg-white">
            
            {/* Ambient visual background highlight */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-violet-400 via-amber-400 to-emerald-400 border-b-2 border-black" />
            
            <div className="space-y-4">
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-2xl bg-indigo-50 border-2 border-black text-black shadow-[2px_2px_0px_0px_#1a1a1a]">
                <Compass className="h-6 w-6 text-black animate-pulse" />
              </div>
              <div className="space-y-2">
                <h1 className="font-display text-2xl font-black uppercase tracking-tight text-neutral-950 leading-none">
                  Collaborative Suite
                </h1>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed">
                  Combine task management, visual hour-by-hour time blocking, OKR milestones tracking, and live team sync.
                </p>
              </div>
            </div>

            {/* Core Features Overview layout */}
            <div className="grid grid-cols-2 gap-3 pb-2 text-left text-[11px] leading-snug text-neutral-700">
              <div className="rounded-2xl bg-amber-50 p-3.5 border-2 border-black shadow-[2px_2px_0px_0px_#1a1a1a]">
                <strong className="block text-neutral-950 font-black mb-1 uppercase tracking-wide text-[10px]">🗺️ Kanban Board</strong>
                Workflow pipeline tracking (Todo, Progress, Completed).
              </div>
              <div className="rounded-2xl bg-emerald-50 p-3.5 border-2 border-black shadow-[2px_2px_0px_0px_#1a1a1a]">
                <strong className="block text-neutral-950 font-black mb-1 uppercase tracking-wide text-[10px]">⏱️ Time Blocks</strong>
                Schedule hourly deep-work segments linked to tasks.
              </div>
              <div className="rounded-2xl bg-sky-50 p-3.5 border-2 border-black shadow-[2px_2px_0px_0px_#1a1a1a]">
                <strong className="block text-neutral-950 font-black mb-1 uppercase tracking-wide text-[10px]">🎯 Goal OKRs</strong>
                Record high-level target milestones and results.
              </div>
              <div className="rounded-2xl bg-violet-50 p-3.5 border-2 border-black shadow-[2px_2px_0px_0px_#1a1a1a]">
                <strong className="block text-neutral-950 font-black mb-1 uppercase tracking-wide text-[10px]">💬 Discussions</strong>
                Discuss, collaborate, and review log historical audits.
              </div>
            </div>

            <div className="pt-2">
              <button
                id="landing_sign_in_btn"
                onClick={handleGoogleSignInClick}
                className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-black hover:bg-neutral-850 py-3.5 text-sm font-black text-white uppercase tracking-wider border-2 border-black shadow-[4px_4px_0px_0px_#1a1a1a] hover:shadow-[5px_5px_0px_0px_#1a1a1a] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0px_0px_#1a1a1a] transition cursor-pointer"
              >
                Sign In to Start Workspace
              </button>
              
              <p className="text-[10px] text-neutral-400 mt-4 leading-normal font-semibold">
                {isFirebaseConfigured 
                  ? "🔒 Live authentication enabled via Google Firebase Auth." 
                  : "🔑 Falling back to instantaneous online sandbox profile session."}
              </p>
            </div>
            
          </div>
        </div>
      )}

      {/* Sliding deadline notification toast */}
      {currentUser && activeNearingDeadlines.length > 0 && showDeadlineToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-amber-100 border-2 border-black rounded-2xl p-4 shadow-[4px_4px_0px_0px_rgba(26,26,26,1)] animate-fade-in text-slate-900 transition-all">
          <div className="flex items-start justify-between">
            <div className="flex gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-amber-400 border border-black flex items-center justify-center flex-shrink-0 shadow-[1px_1px_0px_0px_#000] text-black">
                💡
              </div>
              <div className="text-left">
                <span className="block text-[10px] font-black uppercase tracking-wider text-amber-800 leading-none">Task Deadline Warnings</span>
                <p className="text-xs font-bold mt-1 text-black">
                  You have <span className="underline">{activeNearingDeadlines.length}</span> critical deliverable{activeNearingDeadlines.length === 1 ? '' : 's'} nearing its deadline!
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowDeadlineToast(false)}
              className="text-neutral-500 hover:text-black font-black text-xs px-1.5 py-0.5 rounded border border-transparent hover:border-black transition cursor-pointer"
            >
              ✕
            </button>
          </div>
          
          <div className="mt-3.5 space-y-2 max-h-36 overflow-y-auto">
            {activeNearingDeadlines.slice(0, 3).map((item) => (
              <div key={item.task.id} className="flex items-center justify-between bg-white border border-black rounded-xl px-2.5 py-1.5 text-xs font-bold leading-none shadow-[1px_1px_0px_0px_rgba(0,0,0,0.15)] text-left gap-1.5">
                <div className="truncate flex-1">
                  <span className="block text-[10px] text-zinc-650 truncate">{item.task.title}</span>
                  <span className="text-[10px] text-red-700 bg-red-100 border border-red-200 px-1 py-0.5 rounded leading-none mt-0.5 inline-block font-black uppercase">{item.label}</span>
                </div>
                <button
                  onClick={() => handleCompleteTask(item.task.id)}
                  className="bg-black hover:bg-neutral-800 text-white border border-black px-2 py-1 rounded text-[9px] font-black uppercase tracking-wide leading-none transition-all flex-shrink-0 cursor-pointer text-center hover:scale-105 active:scale-95"
                >
                  Complete
                </button>
              </div>
            ))}
          </div>

          <div className="mt-3.5 flex justify-between items-center text-[10px]">
            <button 
              onClick={() => {
                setActiveTab('tasks');
                setShowDeadlineToast(false);
              }}
              className="font-black uppercase tracking-wider text-indigo-700 hover:underline cursor-pointer"
            >
              Open Kanban Boards →
            </button>
            <button 
              onClick={() => setDismissedDeadlines(prev => [...prev, ...activeNearingDeadlines.map(x => x.task.id)])}
              className="text-neutral-500 hover:text-black font-extrabold uppercase cursor-pointer"
            >
              Mute All Warnings
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
