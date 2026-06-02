/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  User, 
  Database, 
  Cloud, 
  Trash2, 
  ShieldAlert, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  LogOut
} from 'lucide-react';
import { 
  isFirebaseConfigured, 
  deleteUserData, 
  deleteUserAccount,
  logoutUser
} from '../dataService';

interface UserProfileProps {
  currentUser: any;
  onRefreshData?: () => void;
  onNavigateToTab: (tabId: string) => void;
}

export default function UserProfile({ 
  currentUser, 
  onRefreshData,
  onNavigateToTab 
}: UserProfileProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Secure prompt text logic to prevent fat-finger deletions
  const [confirmDeleteDataText, setConfirmDeleteDataText] = useState('');
  const [confirmDeleteAccountText, setConfirmDeleteAccountText] = useState('');

  const [showDataConfirmation, setShowDataConfirmation] = useState(false);
  const [showAccountConfirmation, setShowAccountConfirmation] = useState(false);

  const resetModals = () => {
    setShowDataConfirmation(false);
    setShowAccountConfirmation(false);
    setConfirmDeleteDataText('');
    setConfirmDeleteAccountText('');
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleDeleteData = async () => {
    if (confirmDeleteDataText !== 'DELETE DATA') {
      setErrorMessage("Please type 'DELETE DATA' exactly to authorize.");
      return;
    }

    setLoadingAction('delete_data');
    setErrorMessage(null);
    try {
      await deleteUserData(currentUser.uid, currentUser.email);
      setSuccessMessage("CMS data purged successfully! Resetting workspace dashboard...");
      
      // Clear safety prompts
      setConfirmDeleteDataText('');
      setShowDataConfirmation(false);
      
      // Auto redirect to dashboard after a delay
      setTimeout(() => {
        if (onRefreshData) onRefreshData();
        onNavigateToTab('dashboard');
        setLoadingAction(null);
        setSuccessMessage(null);
      }, 3000);

    } catch (err: any) {
      console.error(err);
      let parsedErr = "Error resetting data.";
      if (err instanceof Error) {
        try {
          const detail = JSON.parse(err.message);
          parsedErr = detail.error || err.message;
        } catch {
          parsedErr = err.message;
        }
      }
      setErrorMessage(parsedErr);
      setLoadingAction(null);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmDeleteAccountText !== 'DELETE ACCOUNT') {
      setErrorMessage("Please type 'DELETE ACCOUNT' exactly to authorize.");
      return;
    }

    setLoadingAction('delete_account');
    setErrorMessage(null);
    try {
      await deleteUserAccount();
      setSuccessMessage("Account deleted successfully! Singing you out...");
      
      // Reset confirmation prompt
      setConfirmDeleteAccountText('');
      setShowAccountConfirmation(false);
      
      setTimeout(async () => {
        await logoutUser();
        window.location.reload();
      }, 3000);

    } catch (err: any) {
      console.error(err);
      let parsedErr = "Error deleting account.";
      if (err instanceof Error) {
        if (err.message.includes('requires-recent-login')) {
          parsedErr = "For security, deleting your account requires a recent sign-in credentials block. Please sign out, sign in again, and retry.";
        } else {
          try {
            const detail = JSON.parse(err.message);
            parsedErr = detail.error || err.message;
          } catch {
            parsedErr = err.message;
          }
        }
      }
      setErrorMessage(parsedErr);
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Profile summary card */}
      <div className="bento-card bg-white p-6 relative overflow-hidden">
        {/* Aesthetic top accent lines */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-yellow-300 via-amber-400 to-red-400" />
        
        <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-yellow-300 text-black border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_#000] flex-shrink-0">
              <User className="h-8 w-8 stroke-[2.5]" />
            </div>
            
            <div className="space-y-1 text-left">
              <h2 className="font-display text-xl font-black uppercase text-neutral-900 tracking-tight leading-none">
                {currentUser?.displayName || 'Active Member'}
              </h2>
              <p className="font-mono text-xs text-neutral-600 font-bold">{currentUser?.email}</p>
              
              <div className="flex items-center gap-1.5 text-[10px] uppercase font-black tracking-wide text-neutral-400 mt-1">
                <span>User UID:</span>
                <span className="font-mono bg-neutral-100 border border-neutral-200 px-1.5 py-0.5 rounded text-neutral-600 truncate max-w-[150px]">
                  {currentUser?.uid}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 w-full sm:w-auto">
            <div className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-black uppercase border-2 border-black shadow-[2.5px_2.5px_0px_0px_#000] w-full sm:w-auto justify-center ${
              isFirebaseConfigured ? 'bg-emerald-300 text-black' : 'bg-amber-300 text-black'
            }`}>
              {isFirebaseConfigured ? <Cloud className="h-4 w-4 animate-bounce" /> : <Database className="h-4 w-4" />}
              <span>{isFirebaseConfigured ? 'Cloud Sync Profile' : 'Local Sandbox Profile'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Success banner notifications */}
      {successMessage && (
        <div className="rounded-2xl border-2 border-black bg-emerald-100 p-4 font-bold text-black text-xs flex items-center gap-3 shadow-[3px_3px_0px_0px_#000] animate-bounce">
          <CheckCircle className="h-5 w-5 text-emerald-700 flex-shrink-0 stroke-[2.5]" />
          <div>{successMessage}</div>
        </div>
      )}

      {/* Error banner notifications */}
      {errorMessage && (
        <div className="rounded-2xl border-2 border-black bg-red-100 p-4 font-bold text-black text-xs flex items-start gap-3 shadow-[3px_3px_0px_0px_#1a1a1a]">
          <AlertTriangle className="h-5 w-5 text-red-700 flex-shrink-0 stroke-[2.5]" />
          <div>
            <p className="font-black uppercase text-[10px] tracking-widest text-red-800">Clearance Refused</p>
            <p className="mt-0.5 font-semibold leading-normal text-red-950">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Main Account details lists */}
      <div className="grid gap-6 md:grid-cols-2">
        
        {/* Core Workspace details overview */}
        <div className="bento-card bg-white p-6 space-y-4">
          <div className="border-b-2 border-black pb-3 text-left">
            <h3 className="font-display text-sm font-black uppercase text-neutral-900 tracking-wide">
              Resource Manifest
            </h3>
            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Workspace data associations</p>
          </div>

          <div className="space-y-3 font-bold text-xs text-neutral-700 text-left">
            <p className="leading-relaxed font-semibold">
              The Workspace Productivity CMS stores your content inside dynamic collections. 
              Here is what your profile maintains access to:
            </p>
            
            <ul className="space-y-2.5 bg-[#f8f7f2] p-4 border-2 border-black rounded-2xl shadow-[2px_2px_0px_0px_#000]">
              <li className="flex items-center gap-2">
                <span className="text-amber-500">📁</span>
                <span><strong>Workspaces:</strong> Projects owned or shared with your account.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500">📋</span>
                <span><strong>Kanban Deliverables:</strong> Allocated team items and checklists.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-pink-500">⏱️</span>
                <span><strong>Time Schedules:</strong> Hour-by-hour calendar schedule block allocations.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-sky-500">💬</span>
                <span><strong>Sync Chats:</strong> Message logs sent within team sync rooms.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Security and Account Deletion panel */}
        <div className="bento-card bg-red-50 p-6 space-y-4 border-red-400">
          <div className="border-b-2 border-black pb-3 flex items-center justify-between text-left">
            <div>
              <h3 className="font-display text-sm font-black uppercase text-red-900 tracking-wide">
                Danger Zone
              </h3>
              <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Destructive Profile Protocols</p>
            </div>
            <ShieldAlert className="h-5 w-5 text-red-700 stroke-[2.5]" />
          </div>

          <div className="space-y-4 text-left">
            <p className="text-xs font-semibold leading-relaxed text-red-950">
              Purging data and deleting accounts are irreversible, final operations. Once executed, 
              associated items are deleted permanently from the databases.
            </p>

            <div className="space-y-3.5 pt-2">
              
              {/* Reset / Delete data Trigger container */}
              <div className="space-y-2 bg-white rounded-2xl border-2 border-black p-4 shadow-[2px_2px_0px_0px_#000]">
                <h4 className="font-black text-xs uppercase tracking-wide text-neutral-900">Erase Workspace Data</h4>
                <p className="text-[10px] font-semibold text-neutral-500 leading-normal">
                  Wipe all projects owned by your uid, delete deliverables, chats, and goals. 
                  Leaves your user account profile login intact.
                </p>
                
                {showDataConfirmation ? (
                  <div className="space-y-3 pt-2">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-red-700">
                      Type <span className="font-black underline">DELETE DATA</span> below to confirm:
                    </label>
                    <input
                      type="text"
                      value={confirmDeleteDataText}
                      onChange={(e) => setConfirmDeleteDataText(e.target.value)}
                      placeholder="Type Here..."
                      className="w-full rounded-xl border-2 border-black px-3 py-2 text-xs font-extrabold text-red-600 bg-red-50 focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleDeleteData}
                        disabled={confirmDeleteDataText !== 'DELETE DATA' || loadingAction !== null}
                        className="flex-1 flex justify-center items-center gap-1 rounded-xl bg-red-600 border-2 border-black hover:bg-red-700 py-2 text-xs font-black uppercase tracking-wide text-white shadow-[2px_2px_0px_0px_#000] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loadingAction === 'delete_data' ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        Authorize Purge
                      </button>
                      <button
                        onClick={resetModals}
                        className="rounded-xl bg-white border-2 border-black hover:bg-neutral-100 px-3 py-2 text-xs font-extrabold uppercase text-neutral-700 shadow-[2px_2px_0px_0px_#000] cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDataConfirmation(true)}
                    className="w-full flex justify-center items-center gap-1.5 rounded-xl bg-amber-200 hover:bg-amber-300 border-2 border-black py-2.5 text-xs font-black uppercase tracking-wide text-black shadow-[2px_2px_0px_0px_#000] hover:shadow-[3px_3px_0px_0px_#000] hover:-translate-y-0.5 active:translate-y-0.5 transition cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4 stroke-[2.5]" />
                    Purge All Workspace Data
                  </button>
                )}
              </div>

              {/* Erase Account trigger container */}
              <div className="space-y-2 bg-white rounded-2xl border-2 border-black p-4 shadow-[2px_2px_0px_0px_#000]">
                <h4 className="font-black text-xs uppercase tracking-wide text-red-950">Wipe Account & Exit</h4>
                <p className="text-[10px] font-semibold text-neutral-500 leading-normal">
                  Complete purge: erases all your workspace data, clears profiles, deletes your auth record, 
                  and signs you out permanently.
                </p>

                {showAccountConfirmation ? (
                  <div className="space-y-3 pt-2">
                    <label className="block text-[10px] font-black uppercase tracking-wider text-red-700">
                      Type <span className="font-black underline">DELETE ACCOUNT</span> below to complete security check:
                    </label>
                    <input
                      type="text"
                      value={confirmDeleteAccountText}
                      onChange={(e) => setConfirmDeleteAccountText(e.target.value)}
                      placeholder="Type Here..."
                      className="w-full rounded-xl border-2 border-black px-3 py-2 text-xs font-extrabold text-red-650 bg-red-50 focus:outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleDeleteAccount}
                        disabled={confirmDeleteAccountText !== 'DELETE ACCOUNT' || loadingAction !== null}
                        className="flex-1 flex justify-center items-center gap-1 rounded-xl bg-red-650 border-2 border-black hover:bg-neutral-900 py-2 text-xs font-black uppercase tracking-wide text-white shadow-[2px_2px_0px_0px_#000] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loadingAction === 'delete_account' ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <LogOut className="h-3.5 w-3.5" />
                        )}
                        Delete Account Permanently
                      </button>
                      <button
                        onClick={resetModals}
                        className="rounded-xl bg-white border-2 border-black hover:bg-neutral-100 px-3 py-2 text-xs font-extrabold uppercase text-neutral-700 shadow-[2px_2px_0px_0px_#000] cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAccountConfirmation(true)}
                    className="w-full flex justify-center items-center gap-1.5 rounded-xl bg-red-500 hover:bg-red-600 border-2 border-black py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-[2px_2px_0px_0px_#000] hover:shadow-[3px_3px_0px_0px_#1a1a1a] hover:-translate-y-0.5 active:translate-y-0.5 transition cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 stroke-[2.5]" />
                    Terminate Profile Account
                  </button>
                )}
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
