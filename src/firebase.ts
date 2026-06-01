/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocFromServer,
  getDoc,
  getDocs,
  setDoc,
  updateDoc as firestoreUpdateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { 
  Project, 
  Task, 
  TimeBlock, 
  Goal, 
  ChatMessage, 
  ProjectActivity, 
  UserProfile,
  ActiveUserPresence
} from './types';

// Detect whether the user has actually connected a valid Firebase instance yet.
export const isFirebaseConfigured = !!(firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey !== "");

let appInstance: any = null;
let dbInstance: any = null;
let authInstance: any = null;

if (isFirebaseConfigured) {
  try {
    appInstance = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    dbInstance = getFirestore(appInstance, firebaseConfig.firestoreDatabaseId);
    authInstance = getAuth();
  } catch (err) {
    console.warn("Failed to initialize Firebase SDK. Entering offline state:", err);
  }
}

export const app = appInstance;
export const db = dbInstance;
export const auth = authInstance;

// Connection test as required by CRITICAL CONSTRAINT in firebase-integration skill
export async function testConnection() {
  if (!isFirebaseConfigured || !db) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. Client appears offline.");
    }
  }
}

if (isFirebaseConfigured) {
  testConnection();
}

// Error Handler conformant to FirestoreErrorInfo specification
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const currentAuth = authInstance;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentAuth?.currentUser?.uid || null,
      email: currentAuth?.currentUser?.email || null,
      emailVerified: currentAuth?.currentUser?.emailVerified || null,
      isAnonymous: currentAuth?.currentUser?.isAnonymous || null,
      tenantId: currentAuth?.currentUser?.tenantId || null,
      providerInfo: currentAuth?.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// ==========================================
// OFFLINE MOCK ENGINE (for preview & sync fallback)
// ==========================================

const _mockProjectsKey = '_local_cms_projects';
const _mockTasksKey = '_local_cms_tasks';
const _mockBlocksKey = '_local_cms_blocks';
const _mockGoalsKey = '_local_cms_goals';
const _mockChatsKey = '_local_cms_chats';
const _mockActivitiesKey = '_local_cms_activities';
const _mockPresenceKey = '_local_cms_presence';

const getLocalStorageItem = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const setLocalStorageItem = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("Local storage error:", e);
  }
};

// Seed initial mockup data if storage is empty
export function seedInitialData(userId: string, email: string) {
  const existingProj = getLocalStorageItem<Project[]>(_mockProjectsKey, []);
  if (existingProj.length === 0) {
    const defaultProj: Project = {
      id: 'welcome-workspace',
      title: '🌟 My First Workspace',
      description: 'The master team base for time blocks, deliverables, chats, and milestone objectives.',
      ownerId: userId,
      ownerEmail: email,
      members: [userId],
      memberEmails: [email],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const defaultTasks: Task[] = [
      {
        id: 'task-1',
        projectId: 'welcome-workspace',
        title: 'Review Strategy Roadmap',
        description: 'Detail high-level vision and assign owners for early Q3 milestones.',
        status: 'in_progress',
        priority: 'high',
        dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        assignedTo: userId,
        assignedEmail: email,
        tags: ['strategy', 'planning'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'task-2',
        projectId: 'welcome-workspace',
        title: 'Set Up Visual Calendar Blocks',
        description: 'Allocate quiet time slots to complete the workspace technical setup.',
        status: 'todo',
        priority: 'medium',
        dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
        assignedTo: userId,
        assignedEmail: email,
        tags: ['calendar', 'timeblock'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'task-3',
        projectId: 'welcome-workspace',
        title: 'Define Project OKRs & Key Outcomes',
        description: 'Complete targets to drive clear delivery metrics across the team.',
        status: 'completed',
        priority: 'low',
        dueDate: new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0],
        assignedTo: userId,
        assignedEmail: email,
        tags: ['okrs'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    const defaultBlocks: TimeBlock[] = [
      {
        id: 'block-1',
        projectId: 'welcome-workspace',
        title: 'Deep Work: Strategy Planning',
        description: 'Focus heavily on refining Q3 plans.',
        startTime: new Date(new Date().setHours(9, 0, 0)).toISOString(),
        endTime: new Date(new Date().setHours(11, 0, 0)).toISOString(),
        taskId: 'task-1',
        color: 'indigo',
        userId: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'block-2',
        projectId: 'welcome-workspace',
        title: 'Weekly Standup Sync',
        description: 'Quick check-in on project blocker lists.',
        startTime: new Date(new Date().setHours(13, 0, 0)).toISOString(),
        endTime: new Date(new Date().setHours(14, 0, 0)).toISOString(),
        taskId: null,
        color: 'emerald',
        userId: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    const defaultGoals: Goal[] = [
      {
        id: 'goal-1',
        projectId: 'welcome-workspace',
        title: 'Q3 Product Planning Phase 1',
        description: 'Establish initial deliverables, complete standard tasks alignment, and define core goals.',
        targetDate: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
        progress: 33,
        status: 'in_progress',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    const defaultChats: ChatMessage[] = [
      {
        id: 'chat-1',
        projectId: 'welcome-workspace',
        senderId: 'system',
        senderEmail: 'assistant@aistudio.com',
        message: 'Welcome to your Collaborative Productivity Suite! Share this workspace with team members or connect Firebase underneath to sync across devices in real time.',
        createdAt: new Date().toISOString()
      }
    ];

    const defaultActivities: ProjectActivity[] = [
      {
        id: 'act-1',
        projectId: 'welcome-workspace',
        actorId: 'system',
        actorEmail: 'assistant@aistudio.com',
        action: 'initialized the welcome workspace board',
        createdAt: new Date().toISOString()
      }
    ];

    setLocalStorageItem(_mockProjectsKey, [defaultProj]);
    setLocalStorageItem(_mockTasksKey, defaultTasks);
    setLocalStorageItem(_mockBlocksKey, defaultBlocks);
    setLocalStorageItem(_mockGoalsKey, defaultGoals);
    setLocalStorageItem(_mockChatsKey, defaultChats);
    setLocalStorageItem(_mockActivitiesKey, defaultActivities);
  }
}
