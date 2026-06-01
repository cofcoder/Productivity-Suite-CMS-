/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  auth, 
  db, 
  isFirebaseConfigured, 
  handleFirestoreError, 
  OperationType, 
  seedInitialData
} from './firebase';

export { isFirebaseConfigured };
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  collectionGroup
} from 'firebase/firestore';
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

// Simple function to generate secure, alphanumeric IDs matching standard path validators
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Format date helpers helper
export function toISOString(dateVal: any): string {
  if (!dateVal) return '';
  if (dateVal instanceof Date) return dateVal.toISOString();
  if (dateVal && typeof dateVal.toDate === 'function') return dateVal.toDate().toISOString();
  return String(dateVal);
}

// Convert Firestore Timestamp to Date nicely
export function parseTimestamp(ts: any): Date {
  if (!ts) return new Date();
  if (ts instanceof Timestamp) return ts.toDate();
  if (ts.seconds) return new Date(ts.seconds * 1000);
  if (typeof ts === 'string') return new Date(ts);
  return new Date();
}

// Local mock storage listeners map for live-reactive updates in offline mode
const mockListeners: { [collectionKey: string]: Set<(() => void)> } = {};

function notifyMockListeners(key: string) {
  if (mockListeners[key]) {
    mockListeners[key].forEach(callback => {
      try {
        callback();
      } catch (err) {
        console.error("Error in mock listener callback", err);
      }
    });
  }
}

function registerMockListener(key: string, callback: () => void): () => void {
  if (!mockListeners[key]) {
    mockListeners[key] = new Set();
  }
  mockListeners[key].add(callback);
  return () => {
    mockListeners[key].delete(callback);
  };
}

// Helper to get local data arrays
function getLocalArray<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveLocalArray<T>(key: string, data: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    notifyMockListeners(key);
  } catch (err) {
    console.error("Local save fail:", err);
  }
}

// ==========================================
// 1. AUTHENTICATION SERVICES
// ==========================================

export async function loginWithGoogle(): Promise<{ user: any; error: string | null }> {
  if (isFirebaseConfigured && auth) {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Update public user profile
      const user = result.user;
      if (user) {
        const userRef = doc(db, 'users', user.uid, 'public', 'profile');
        await setDoc(userRef, {
          userId: user.uid,
          email: user.email || '',
          displayName: user.displayName || user.email?.split('@')[0] || 'Team Colleague',
          updatedAt: serverTimestamp()
        });
      }
      return { user: result.user, error: null };
    } catch (err: any) {
      console.error("Firebase Login Error", err);
      return { user: null, error: err.message || "Authentication popup blocked or closed." };
    }
  } else {
    // Offline Mock Authentication
    const localUser = {
      uid: 'offline-developer-shane',
      email: 'Shane.Geach@gmail.com',
      displayName: 'Shane Geach (Active Dev)',
      emailVerified: true
    };
    localStorage.setItem('_mock_auth_user', JSON.stringify(localUser));
    seedInitialData(localUser.uid, localUser.email);
    notifyMockListeners('_mock_auth_user');
    return { user: localUser, error: null };
  }
}

export async function logoutUser(): Promise<void> {
  if (isFirebaseConfigured && auth) {
    await firebaseSignOut(auth);
  } else {
    localStorage.removeItem('_mock_auth_user');
    notifyMockListeners('_mock_auth_user');
  }
}

export function subscribeAuth(callback: (user: any) => void): () => void {
  if (isFirebaseConfigured && auth) {
    return onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        callback({
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || fbUser.email?.split('@')[0],
          emailVerified: fbUser.emailVerified
        });
      } else {
        callback(null);
      }
    });
  } else {
    const check = () => {
      const stored = localStorage.getItem('_mock_auth_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        seedInitialData(parsed.uid, parsed.email);
        callback(parsed);
      } else {
        callback(null);
      }
    };
    check();
    return registerMockListener('_mock_auth_user', check);
  }
}

// ==========================================
// 2. PROJECT / WORKSPACE SERVICES
// ==========================================

export function subscribeProjects(userId: string, callback: (projects: Project[]) => void): () => void {
  if (isFirebaseConfigured && db) {
    const q = query(
      collection(db, 'projects'),
      where('members', 'array-contains', userId)
    );
    return onSnapshot(q, (snapshot) => {
      const items: Project[] = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() } as Project);
      });
      // Sort projects by createdAt
      items.sort((a, b) => {
        const t1 = parseTimestamp(a.createdAt).getTime();
        const t2 = parseTimestamp(b.createdAt).getTime();
        return t2 - t1; // Descending
      });
      callback(items);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'projects');
    });
  } else {
    const check = () => {
      const projects = getLocalArray<Project>('_local_cms_projects');
      const filtered = projects.filter(p => p.members.includes(userId));
      callback(filtered);
    };
    check();
    return registerMockListener('_local_cms_projects', check);
  }
}

export async function createProject(
  title: string, 
  description: string, 
  userId: string, 
  userEmail: string
): Promise<string> {
  const projectId = generateId();
  const currentTimestamp = isFirebaseConfigured ? serverTimestamp() : new Date().toISOString();
  
  const projectDoc: Project = {
    id: projectId,
    title,
    description,
    ownerId: userId,
    ownerEmail: userEmail,
    members: [userId],
    memberEmails: [userEmail],
    createdAt: currentTimestamp,
    updatedAt: currentTimestamp
  };

  if (isFirebaseConfigured && db) {
    try {
      const projRef = doc(db, 'projects', projectId);
      await setDoc(projRef, projectDoc);
      await logActivity(projectId, userId, userEmail, `created the workspace project "${title}"`);
      return projectId;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `projects/${projectId}`);
      throw err;
    }
  } else {
    const projects = getLocalArray<Project>('_local_cms_projects');
    projects.unshift(projectDoc);
    saveLocalArray('_local_cms_projects', projects);
    await logActivity(projectId, userId, userEmail, `created the workspace project "${title}"`);
    return projectId;
  }
}

export async function shareProject(
  projectId: string, 
  emailToAdd: string, 
  actorId: string, 
  actorEmail: string
): Promise<{ success: boolean; message: string }> {
  const sanitizedEmail = emailToAdd.trim().toLowerCase();
  if (!sanitizedEmail) return { success: false, message: 'Please specify a valid email address.' };

  if (isFirebaseConfigured && db) {
    try {
      const projRef = doc(db, 'projects', projectId);
      const projSnap = await getDoc(projRef);
      if (!projSnap.exists()) return { success: false, message: "Workspace project does not exist." };
      const currentProj = projSnap.data() as Project;

      if (currentProj.memberEmails.includes(sanitizedEmail)) {
        return { success: false, message: "User is already a member of this workspace!" };
      }

      // To find the actual registered UID corresponding to this email, let's query the public user profile collections.
      let targetUid = sanitizedEmail.split('@')[0] + '-uid'; // default fallback mock UID
      try {
        const q = query(
          collectionGroup(db, 'public'),
          where('email', '==', sanitizedEmail),
          limit(1)
        );
        const userProfiles = await getDocs(q);
        if (!userProfiles.empty) {
          const profileDoc = userProfiles.docs[0].data();
          if (profileDoc.userId) {
            targetUid = profileDoc.userId;
          }
        }
      } catch (e) {
        console.warn("Could not query user profile for email mapping:", e);
      }

      const updatedMembers = [...currentProj.members, targetUid];
      const updatedEmails = [...currentProj.memberEmails, sanitizedEmail];

      await updateDoc(projRef, {
        members: updatedMembers,
        memberEmails: updatedEmails,
        updatedAt: serverTimestamp()
      });

      await logActivity(projectId, actorId, actorEmail, `invited "${sanitizedEmail}" to join workspace`);
      return { success: true, message: `Successfully shared workspace with ${sanitizedEmail}!` };
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `projects/${projectId}`);
      return { success: false, message: "Permission Denied. Only the project owner can invite collaborators." };
    }
  } else {
    // Offline mode invite
    const projects = getLocalArray<Project>('_local_cms_projects');
    const idx = projects.findIndex(p => p.id === projectId);
    if (idx === -1) return { success: false, message: "Workspace not found." };
    
    const proj = projects[idx];
    if (proj.memberEmails.includes(sanitizedEmail)) {
      return { success: false, message: "User is already a member!" };
    }

    const testUid = sanitizedEmail.replace(/[^a-zA-Z0-9]/g, '') + '-uid';
    proj.members.push(testUid);
    proj.memberEmails.push(sanitizedEmail);
    proj.updatedAt = new Date().toISOString();
    
    projects[idx] = proj;
    saveLocalArray('_local_cms_projects', projects);
    await logActivity(projectId, actorId, actorEmail, `invited "${sanitizedEmail}" to join workspace`);
    return { success: true, message: `Successfully mock-invited ${sanitizedEmail} to workspace!` };
  }
}

// ==========================================
// 3. TASK MANAGEMENT SERVICES
// ==========================================

export function subscribeTasks(projectId: string, callback: (tasks: Task[]) => void): () => void {
  if (isFirebaseConfigured && db) {
    const q = query(
      collection(db, 'projects', projectId, 'tasks'),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const items: Task[] = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, projectId, ...doc.data() } as Task);
      });
      callback(items);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, `projects/${projectId}/tasks`);
    });
  } else {
    const check = () => {
      const tasks = getLocalArray<Task>('_local_cms_tasks');
      const filtered = tasks.filter(t => t.projectId === projectId);
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(filtered);
    };
    check();
    return registerMockListener('_local_cms_tasks', check);
  }
}

export async function addTask(
  projectId: string, 
  title: string, 
  description: string, 
  priority: 'low' | 'medium' | 'high' = 'medium',
  dueDate: string | null = null,
  assignedEmail: string | null = null,
  tags: string[] = [],
  actorId: string,
  actorEmail: string
): Promise<void> {
  const taskId = generateId();
  const currentTimestamp = isFirebaseConfigured ? serverTimestamp() : new Date().toISOString();

  const taskDoc: Task = {
    id: taskId,
    projectId,
    title,
    description,
    status: 'todo',
    priority,
    dueDate,
    assignedTo: assignedEmail ? assignedEmail.split('@')[0] + '-uid' : null,
    assignedEmail: assignedEmail,
    tags,
    createdAt: currentTimestamp,
    updatedAt: currentTimestamp
  };

  if (isFirebaseConfigured && db) {
    try {
      const ref = doc(db, 'projects', projectId, 'tasks', taskId);
      await setDoc(ref, taskDoc);
      await logActivity(projectId, actorId, actorEmail, `created new task "${title}"`);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `projects/${projectId}/tasks/${taskId}`);
    }
  } else {
    const tasks = getLocalArray<Task>('_local_cms_tasks');
    tasks.unshift(taskDoc);
    saveLocalArray('_local_cms_tasks', tasks);
    await logActivity(projectId, actorId, actorEmail, `created new task "${title}"`);
  }
}

export async function updateTask(
  projectId: string,
  taskId: string,
  changes: Partial<Task>,
  actorId: string,
  actorEmail: string
): Promise<void> {
  const currentTimestamp = isFirebaseConfigured ? serverTimestamp() : new Date().toISOString();
  const updatePayload = {
    ...changes,
    updatedAt: currentTimestamp
  };

  if (isFirebaseConfigured && db) {
    try {
      const ref = doc(db, 'projects', projectId, 'tasks', taskId);
      await updateDoc(ref, updatePayload);
      
      const fieldKeys = Object.keys(changes).filter(k => k !== 'updatedAt');
      if (changes.title) {
        await logActivity(projectId, actorId, actorEmail, `updated task title to "${changes.title}"`);
      } else if (changes.status) {
        await logActivity(projectId, actorId, actorEmail, `moved task to status "${changes.status}"`);
      } else if (fieldKeys.length > 0) {
        await logActivity(projectId, actorId, actorEmail, `modified task properties (${fieldKeys.join(', ')})`);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `projects/${projectId}/tasks/${taskId}`);
    }
  } else {
    const tasks = getLocalArray<Task>('_local_cms_tasks');
    const idx = tasks.findIndex(t => t.id === taskId);
    if (idx !== -1) {
      const updated = { ...tasks[idx], ...changes, updatedAt: currentTimestamp } as Task;
      tasks[idx] = updated;
      saveLocalArray('_local_cms_tasks', tasks);

      if (changes.title) {
        await logActivity(projectId, actorId, actorEmail, `updated task title to "${changes.title}"`);
      } else if (changes.status) {
        await logActivity(projectId, actorId, actorEmail, `moved task to status "${changes.status}"`);
      }
    }
  }
}

export async function deleteTaskItem(
  projectId: string,
  taskId: string,
  title: string,
  actorId: string,
  actorEmail: string
): Promise<void> {
  if (isFirebaseConfigured && db) {
    try {
      const ref = doc(db, 'projects', projectId, 'tasks', taskId);
      await deleteDoc(ref);
      await logActivity(projectId, actorId, actorEmail, `deleted task "${title}"`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `projects/${projectId}/tasks/${taskId}`);
    }
  } else {
    const tasks = getLocalArray<Task>('_local_cms_tasks');
    const filtered = tasks.filter(t => t.id !== taskId);
    saveLocalArray('_local_cms_tasks', filtered);
    await logActivity(projectId, actorId, actorEmail, `deleted task "${title}"`);
  }
}

// ==========================================
// 4. TIME BLOCKING SERVICES
// ==========================================

export function subscribeTimeBlocks(projectId: string, callback: (blocks: TimeBlock[]) => void): () => void {
  if (isFirebaseConfigured && db) {
    const q = query(
      collection(db, 'projects', projectId, 'timeBlocks'),
      orderBy('startTime', 'asc')
    );
    return onSnapshot(q, (snapshot) => {
      const items: TimeBlock[] = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, projectId, ...doc.data() } as TimeBlock);
      });
      callback(items);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, `projects/${projectId}/timeBlocks`);
    });
  } else {
    const check = () => {
      const blocks = getLocalArray<TimeBlock>('_local_cms_blocks');
      const filtered = blocks.filter(b => b.projectId === projectId);
      filtered.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      callback(filtered);
    };
    check();
    return registerMockListener('_local_cms_blocks', check);
  }
}

export async function addTimeBlock(
  projectId: string,
  title: string,
  description: string,
  startTime: string,
  endTime: string,
  taskId: string | null = null,
  color: string = 'indigo',
  userId: string,
  actorEmail: string
): Promise<void> {
  const blockId = generateId();
  const currentTimestamp = isFirebaseConfigured ? serverTimestamp() : new Date().toISOString();

  // Validate start is before end
  if (new Date(startTime).getTime() >= new Date(endTime).getTime()) {
    throw new Error("Invalid times: Start time must occur before end time.");
  }

  const blockDoc: TimeBlock = {
    id: blockId,
    projectId,
    title,
    description,
    startTime: isFirebaseConfigured ? Timestamp.fromDate(new Date(startTime)) as any : startTime,
    endTime: isFirebaseConfigured ? Timestamp.fromDate(new Date(endTime)) as any : endTime,
    taskId,
    color,
    userId,
    createdAt: currentTimestamp,
    updatedAt: currentTimestamp
  };

  if (isFirebaseConfigured && db) {
    try {
      const ref = doc(db, 'projects', projectId, 'timeBlocks', blockId);
      await setDoc(ref, blockDoc);
      await logActivity(projectId, userId, actorEmail, `scheduled time block "${title}"`);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `projects/${projectId}/timeBlocks/${blockId}`);
    }
  } else {
    const blocks = getLocalArray<TimeBlock>('_local_cms_blocks');
    blocks.push(blockDoc);
    saveLocalArray('_local_cms_blocks', blocks);
    await logActivity(projectId, userId, actorEmail, `scheduled time block "${title}"`);
  }
}

export async function deleteTimeBlock(
  projectId: string,
  blockId: string,
  title: string,
  actorId: string,
  actorEmail: string
): Promise<void> {
  if (isFirebaseConfigured && db) {
    try {
      const ref = doc(db, 'projects', projectId, 'timeBlocks', blockId);
      await deleteDoc(ref);
      await logActivity(projectId, actorId, actorEmail, `released scheduled appointment block "${title}"`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `projects/${projectId}/timeBlocks/${blockId}`);
    }
  } else {
    const blocks = getLocalArray<TimeBlock>('_local_cms_blocks');
    const filtered = blocks.filter(b => b.id !== blockId);
    saveLocalArray('_local_cms_blocks', filtered);
    await logActivity(projectId, actorId, actorEmail, `released scheduled appointment block "${title}"`);
  }
}

// ==========================================
// 5. GOALS / OKR TRACKING SERVICES
// ==========================================

export function subscribeGoals(projectId: string, callback: (goals: Goal[]) => void): () => void {
  if (isFirebaseConfigured && db) {
    const q = query(
      collection(db, 'projects', projectId, 'goals'),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const items: Goal[] = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, projectId, ...doc.data() } as Goal);
      });
      callback(items);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, `projects/${projectId}/goals`);
    });
  } else {
    const check = () => {
      const goals = getLocalArray<Goal>('_local_cms_goals');
      const filtered = goals.filter(g => g.projectId === projectId);
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(filtered);
    };
    check();
    return registerMockListener('_local_cms_goals', check);
  }
}

export async function addGoal(
  projectId: string,
  title: string,
  description: string,
  targetDate: string,
  actorId: string,
  actorEmail: string
): Promise<void> {
  const goalId = generateId();
  const currentTimestamp = isFirebaseConfigured ? serverTimestamp() : new Date().toISOString();

  const goalDoc: Goal = {
    id: goalId,
    projectId,
    title,
    description,
    targetDate: isFirebaseConfigured ? Timestamp.fromDate(new Date(targetDate)) as any : targetDate,
    progress: 0,
    status: 'not_started',
    createdAt: currentTimestamp,
    updatedAt: currentTimestamp
  };

  if (isFirebaseConfigured && db) {
    try {
      const ref = doc(db, 'projects', projectId, 'goals', goalId);
      await setDoc(ref, goalDoc);
      await logActivity(projectId, actorId, actorEmail, `declared objective goal milestone "${title}"`);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `projects/${projectId}/goals/${goalId}`);
    }
  } else {
    const goals = getLocalArray<Goal>('_local_cms_goals');
    goals.unshift(goalDoc);
    saveLocalArray('_local_cms_goals', goals);
    await logActivity(projectId, actorId, actorEmail, `declared objective goal milestone "${title}"`);
  }
}

export async function updateGoal(
  projectId: string,
  goalId: string,
  changes: Partial<Goal>,
  actorId: string,
  actorEmail: string
): Promise<void> {
  const currentTimestamp = isFirebaseConfigured ? serverTimestamp() : new Date().toISOString();
  
  let databasePayload = { ...changes, updatedAt: currentTimestamp } as any;
  if (changes.targetDate) {
    databasePayload.targetDate = isFirebaseConfigured ? Timestamp.fromDate(new Date(changes.targetDate)) : changes.targetDate;
  }

  if (isFirebaseConfigured && db) {
    try {
      const ref = doc(db, 'projects', projectId, 'goals', goalId);
      await updateDoc(ref, databasePayload);
      if (changes.progress !== undefined) {
        await logActivity(projectId, actorId, actorEmail, `advanced goal progress to ${changes.progress}%`);
      } else if (changes.title) {
        await logActivity(projectId, actorId, actorEmail, `adjusted goal title: "${changes.title}"`);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `projects/${projectId}/goals/${goalId}`);
    }
  } else {
    const goals = getLocalArray<Goal>('_local_cms_goals');
    const idx = goals.findIndex(g => g.id === goalId);
    if (idx !== -1) {
      const updated = { ...goals[idx], ...changes, updatedAt: currentTimestamp } as Goal;
      goals[idx] = updated;
      saveLocalArray('_local_cms_goals', goals);
      if (changes.progress !== undefined) {
        await logActivity(projectId, actorId, actorEmail, `advanced goal progress to ${changes.progress}%`);
      }
    }
  }
}

export async function deleteGoal(
  projectId: string,
  goalId: string,
  title: string,
  actorId: string,
  actorEmail: string
): Promise<void> {
  if (isFirebaseConfigured && db) {
    try {
      const ref = doc(db, 'projects', projectId, 'goals', goalId);
      await deleteDoc(ref);
      await logActivity(projectId, actorId, actorEmail, `withdrew objective milestone goal "${title}"`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `projects/${projectId}/goals/${goalId}`);
    }
  } else {
    const goals = getLocalArray<Goal>('_local_cms_goals');
    const filtered = goals.filter(g => g.id !== goalId);
    saveLocalArray('_local_cms_goals', filtered);
    await logActivity(projectId, actorId, actorEmail, `withdrew objective milestone goal "${title}"`);
  }
}

// ==========================================
// 6. CHAT & PRESENCE SERVICE
// ==========================================

export function subscribeChats(projectId: string, callback: (chats: ChatMessage[]) => void): () => void {
  if (isFirebaseConfigured && db) {
    const q = query(
      collection(db, 'projects', projectId, 'chats'),
      orderBy('createdAt', 'asc')
    );
    return onSnapshot(q, (snapshot) => {
      const items: ChatMessage[] = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, projectId, ...doc.data() } as ChatMessage);
      });
      callback(items);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, `projects/${projectId}/chats`);
    });
  } else {
    const check = () => {
      const chats = getLocalArray<ChatMessage>('_local_cms_chats');
      const filtered = chats.filter(c => c.projectId === projectId);
      callback(filtered);
    };
    check();
    return registerMockListener('_local_cms_chats', check);
  }
}

export async function sendChatMessage(
  projectId: string,
  senderId: string,
  senderEmail: string,
  message: string
): Promise<void> {
  const chatId = generateId();
  const currentTimestamp = isFirebaseConfigured ? serverTimestamp() : new Date().toISOString();

  const chatDoc: ChatMessage = {
    id: chatId,
    projectId,
    senderId,
    senderEmail,
    message,
    createdAt: currentTimestamp
  };

  if (isFirebaseConfigured && db) {
    try {
      const ref = doc(db, 'projects', projectId, 'chats', chatId);
      await setDoc(ref, chatDoc);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `projects/${projectId}/chats/${chatId}`);
    }
  } else {
    const chats = getLocalArray<ChatMessage>('_local_cms_chats');
    chats.push(chatDoc);
    saveLocalArray('_local_cms_chats', chats);
  }
}

// ==========================================
// 7. ACTIVITY RECORDS logs (Read-Only feed)
// ==========================================

export function subscribeActivities(projectId: string, callback: (activities: ProjectActivity[]) => void): () => void {
  if (isFirebaseConfigured && db) {
    const q = query(
      collection(db, 'projects', projectId, 'activities'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    return onSnapshot(q, (snapshot) => {
      const items: ProjectActivity[] = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, projectId, ...doc.data() } as ProjectActivity);
      });
      callback(items);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, `projects/${projectId}/activities`);
    });
  } else {
    const check = () => {
      const activities = getLocalArray<ProjectActivity>('_local_cms_activities');
      const filtered = activities.filter(a => a.projectId === projectId);
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(filtered.slice(0, 50));
    };
    check();
    return registerMockListener('_local_cms_activities', check);
  }
}

export async function logActivity(
  projectId: string,
  actorId: string,
  actorEmail: string,
  action: string
): Promise<void> {
  const activityId = generateId();
  const currentTimestamp = isFirebaseConfigured ? serverTimestamp() : new Date().toISOString();

  const actDoc: ProjectActivity = {
    id: activityId,
    projectId,
    actorId,
    actorEmail,
    action,
    createdAt: currentTimestamp
  };

  if (isFirebaseConfigured && db) {
    try {
      const ref = doc(db, 'projects', projectId, 'activities', activityId);
      await setDoc(ref, actDoc);
    } catch (err) {
      // Slidely fail silent or capture
      console.warn("Could not write history log:", err);
    }
  } else {
    const activities = getLocalArray<ProjectActivity>('_local_cms_activities');
    activities.unshift(actDoc);
    saveLocalArray('_local_cms_activities', activities);
  }
}
