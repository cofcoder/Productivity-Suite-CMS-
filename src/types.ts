/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// User authentication roles & profile types
export interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  updatedAt: any; // Firestore Timestamp
}

export interface UserPrivateProfile {
  userId: string;
  email: string;
  preferences: string; // Serialized configuration string
  createdAt: any; // Firestore Timestamp
}

export interface Project {
  id: string;
  title: string;
  description: string;
  ownerId: string;
  ownerEmail: string;
  members: string[]; // User IDs
  memberEmails: string[]; // User Emails
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null; // ISO string or simple date string
  assignedTo: string | null;
  assignedEmail: string | null;
  tags: string[];
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

export interface TimeBlock {
  id: string;
  projectId: string;
  title: string;
  description: string;
  startTime: string; // ISO string representing block interval
  endTime: string; // ISO string representing block interval
  taskId: string | null; // Link block to a specific task
  color: string; // Tailwind color class modifier (e.g. 'indigo')
  userId: string; // Owner of this schedule slot
  createdAt: any;
  updatedAt: any;
}

export type GoalStatus = 'not_started' | 'in_progress' | 'completed';

export interface Goal {
  id: string;
  projectId: string;
  title: string;
  description: string;
  targetDate: string; // Target target date
  progress: number; // 0 to 100 percentage meter
  status: GoalStatus;
  createdAt: any;
  updatedAt: any;
}

export interface ChatMessage {
  id: string;
  projectId: string;
  senderId: string;
  senderEmail: string;
  message: string;
  createdAt: any; // Timestamp
}

export interface ProjectActivity {
  id: string;
  projectId: string;
  actorId: string;
  actorEmail: string;
  action: string;
  createdAt: any; // Timestamp
}

export interface ActiveUserPresence {
  userId: string;
  email: string;
  displayName: string;
  activeProjectId: string | null;
  lastActive: number; // local/server epoch timestamp
}
