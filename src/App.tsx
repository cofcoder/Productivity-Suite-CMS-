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
  isFirebaseConfigured
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

    </div>
  );
}
