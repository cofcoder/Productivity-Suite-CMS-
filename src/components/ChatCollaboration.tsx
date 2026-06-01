/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  MessageSquare, 
  History, 
  User,
  CheckCircle, 
  AlertCircle,
  Clock,
  Laptop
} from 'lucide-react';
import { ChatMessage, ProjectActivity, Project } from '../types';
import { sendChatMessage } from '../dataService';

interface ChatCollaborationProps {
  currentUser: any;
  project: Project;
  chats: ChatMessage[];
  activities: ProjectActivity[];
}

export default function ChatCollaboration({
  currentUser,
  project,
  chats,
  activities
}: ChatCollaborationProps) {
  
  const [typedMessage, setTypedMessage] = useState('');
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of chat on new message bubbles loaded
  useEffect(() => {
    if (chatScrollContainerRef.current) {
      chatScrollContainerRef.current.scrollTop = chatScrollContainerRef.current.scrollHeight;
    }
  }, [chats]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim() || !currentUser) return;

    try {
      await sendChatMessage(
        project.id,
        currentUser.uid,
        currentUser.email,
        typedMessage.trim()
      );
      setTypedMessage('');
    } catch (err) {
      console.error(err);
    }
  };

  const getActorLetter = (email: string) => {
    return email ? email.charAt(0).toUpperCase() : 'U';
  };

  const formatActivityTime = (activityTime: any): string => {
    try {
      const date = activityTime && typeof activityTime.toDate === 'function'
        ? activityTime.toDate()
        : new Date(activityTime);
      
      const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
      if (seconds < 60) return 'Just now';
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return 'Some time ago';
    }
  };

  return (
    <div id="collab_discussion_feed" className="grid gap-6 lg:grid-cols-3">
      
      {/* LEFT & CENTER: Real-time Discussion Chat bubbles */}
      <div className="lg:col-span-2 bento-card bg-white flex flex-col h-[520px] overflow-hidden">
        
        {/* Chat Title bar */}
        <div className="bg-[#f8f7f2] px-5 py-4 border-b-2 border-black flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4.5 w-4.5 text-black stroke-[2.5]" />
            <h3 className="font-display text-sm font-black uppercase text-slate-800">
              Project Live Discussion
            </h3>
          </div>
          <span className="text-[10px] bg-yellow-300 text-black border border-black font-black uppercase tracking-wide px-2.5 py-0.5 rounded shadow-[1px_1px_0px_0px_#000]">
            Channel Sync Active
          </span>
        </div>

        {/* Scrollable bubble lists */}
        <div 
          ref={chatScrollContainerRef}
          className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-white to-[#f8f7f2]/10"
        >
          {chats.map((chat) => {
            const isMe = chat.senderId === (currentUser?.uid || 'offline-developer-shane');
            const initials = getActorLetter(chat.senderEmail);

            return (
              <div 
                key={chat.id} 
                className={`flex gap-3 max-w-lg ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* User initials circle */}
                <div className={`h-8 w-8 rounded-xl flex items-center justify-center font-black text-xs uppercase border-2 border-black flex-shrink-0 ${
                  isMe ? 'bg-black text-white' : 'bg-emerald-300 text-black shadow-[1.5px_1.5px_0px_0px_#000]'
                }`}>
                  {initials}
                </div>

                {/* Bubble details */}
                <div className="space-y-1 text-left">
                  <div className={`flex items-center gap-2 text-[10px] text-slate-400 font-bold ${isMe ? 'justify-end' : ''}`}>
                    <span className="font-black text-slate-700">{chat.senderEmail?.split('@')[0]}</span>
                    <span>{formatActivityTime(chat.createdAt)}</span>
                  </div>

                  <div className={`rounded-2xl p-3 text-xs leading-relaxed border-2 border-black font-bold text-neutral-950 ${
                    isMe 
                      ? 'bg-amber-300 rounded-tr-none shadow-[2px_2px_0px_0px_#000]' 
                      : 'bg-white rounded-tl-none shadow-[2px_2px_0px_0px_#000]'
                  }`}>
                    {chat.message}
                  </div>
                </div>
              </div>
            );
          })}

          {chats.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center text-slate-400 space-y-3">
              <MessageSquare className="h-8 w-8 text-slate-300 stroke-[1.5]" />
              <p className="text-xs font-black uppercase tracking-wide text-neutral-500">No messages sent in this workspace thread.</p>
              <p className="text-[10px] font-bold text-slate-400 max-w-xs leading-normal">
                Live chats help team members coordinate instant actions. Type a note below to start the thread!
              </p>
            </div>
          )}
        </div>

        {/* Chat sender input form */}
        <form onSubmit={handleSendMessage} className="p-4 border-t-2 border-black bg-white">
          <div className="flex gap-2">
            <input
              type="text"
              required
              placeholder="Send live collaboration update..."
              value={typedMessage}
              onChange={(e) => setTypedMessage(e.target.value)}
              className="w-full rounded-2xl border-2 border-black bg-white px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-[#f8f7f2] focus:outline-none"
            />
            <button
              type="submit"
              className="flex items-center justify-center h-10 w-10 rounded-2xl bg-black text-white hover:bg-neutral-850 border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:shadow-[3px_3px_0px_0px_#000] hover:-translate-y-0.5 active:translate-y-0.5 transition cursor-pointer flex-shrink-0"
            >
              <Send className="h-4.5 w-4.5 stroke-[2.5]" />
            </button>
          </div>
        </form>

      </div>

      {/* RIGHT SIDE: Real-time Workspace Activity Streams Logger */}
      <div className="bento-card bg-white flex flex-col h-[520px] overflow-hidden">
        
        {/* Logger Title bar */}
        <div className="bg-[#f8f7f2] px-5 py-4 border-b-2 border-black flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-4.5 w-4.5 text-black stroke-[2.5]" />
            <h3 className="font-display text-sm font-black uppercase text-slate-800">
              Workspace Activity Log
            </h3>
          </div>
          <Clock className="h-4 w-4 text-black animate-spin" style={{ animationDuration: '6s' }} />
        </div>

        {/* Audit list log */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/20 max-h-[460px]">
          {activities.map((act) => (
            <div key={act.id} className="flex gap-3 pb-3 border-b-2 border-dashed border-neutral-100 last:border-0 text-left">
              <div className="flex h-7 w-7 items-center justify-center rounded border-2 border-black bg-yellow-200 text-black flex-shrink-0 font-extrabold text-[10px] uppercase shadow-[1.5px_1.5px_0px_0px_#000]">
                {getActorLetter(act.actorEmail)}
              </div>
              <div className="space-y-1.5 leading-tight truncate">
                <p className="text-[11px] text-neutral-800 font-medium whitespace-normal">
                  <strong className="text-black font-extrabold uppercase text-[10px] tracking-wide">{act.actorEmail?.split('@')[0]}</strong> {act.action}
                </p>
                <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatActivityTime(act.createdAt)}
                </span>
              </div>
            </div>
          ))}

          {activities.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center text-slate-400 space-y-1">
              <Laptop className="h-7 w-7 text-slate-300" />
              <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">No activities logged yet.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
