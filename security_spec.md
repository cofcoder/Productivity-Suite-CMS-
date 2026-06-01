# Security Specification

This document details the security model, strict data invariants, malicious attack payloads ("The Dirty Dozen"), and assertion tests designed to audit our Firebase Firestore security model.

## 1. Data Invariants

1. **Relation Access Authorization**: A user can only read, write, update, or verify records (`tasks`, `timeBlocks`, `goals`, `chats`, `activities`) if they are an auth-verified user AND their UID is explicitly present inside the parent project's `/projects/{projectId}`.members list.
2. **PII Strict Isolation**: General users are forbidden from reading another user's isolated private data under `users/{userId}/private/info`. Only the authenticated owner matching `userId == request.auth.uid` is granted access.
3. **Workspace Invariant**: Project documents cannot be created with random members lists. If the creator specifies `members`, the array must include their own `uid`.
4. **Action-Based Field Locking**: Project owner fields (`ownerId`) and creation timestamps are immutable once defined.
5. **Denial of Wallet Protection**: All IDs (`projectId`, `taskId`, etc.) are bounded below 128 characters and strictly match `^[a-zA-Z0-9_\-]+$`.
6. **Task Status Flow Limits**: Complete field boundaries protect the statuses from bypasses (e.g. status must be one of `todo`, `in_progress`, `review`, or `completed`).
7. **Temporal Constraint Integrity**: Whenever tasks or scheduling blocks are stored, the client must use Firestore server times `request.time` for timestamps to prevent skew exploits.

---

## 2. The "Dirty Dozen" Exploitive Payloads

These payloads are designed by a red-team analyst to bypass validation or elevate privilege. Our target ruleset must cleanly return `PERMISSION_DENIED` for all twelve attempts.

### Attack 1: User Identity Hijacking (Spoofing)
* **Goal**: Write a new task claiming to be authored by a different verified user.
* **Payload**:
  ```json
  {
    "id": "malicious-task-id",
    "projectId": "target-project-id",
    "title": "Malicious task",
    "status": "todo",
    "priority": "low",
    "assignedTo": "victim-user-id",
    "assignedEmail": "victim@gmail.com",
    "createdAt": "2026-06-01T13:00:00Z",
    "updatedAt": "2026-06-01T13:00:00Z"
  }
  ```
  *(Expected: REJECTED because `assignedTo` is set to user B, but request.auth.uid belongs to user A, or parent project membership verification fails)*

### Attack 2: Out of Workspace Orphan Task Injection
* **Goal**: Inject a task claiming connection to a project that the user does NOT belong to.
* **Payload**:
  ```json
  {
    "id": "orphan-task-id",
    "projectId": "external-secure-project-id",
    "title": "Injected Task",
    "status": "todo",
    "priority": "medium",
    "createdAt": "2026-06-01T13:06:00Z",
    "updatedAt": "2026-06-01T13:06:00Z"
  }
  ```
  *(Expected: REJECTED because the parent project `external-secure-project-id` lacks the calling user's UID in its `members` list)*

### Attack 3: PII Database Ingestion Spray
* **Goal**: Authenticated User A tries to directly query or pull isolated PII records of User B (`users/user_B/private/info`).
* **Payload**: `GET /users/user_B/private/info`
  *(Expected: REJECTED because `users/user_B/private/info` rules strictly demand `request.auth.uid == userId`)*

### Attack 4: Project Owner Reassignment (Privilege Escalation)
* **Goal**: Update a project of which the user is a normal member, switching `ownerId` to their own UID.
* **Payload**:
  ```json
  {
    "id": "team-project-id",
    "ownerId": "attacker-uid",
    "updatedAt": "2026-06-01T13:06:00Z"
  }
  ```
  *(Expected: REJECTED because `ownerId` is strictly immutable during updates)*

### Attack 5: Ghost Field Injection (The Shadow Update)
* **Goal**: Inject an unrequested property `isApproved: true` or `isAdmin: true` into a project file.
* **Payload**:
  ```json
  {
    "projectId": "valid-project-id",
    "title": "Updated Title",
    "isApprovedDirectly": true,
    "updatedAt": "2026-06-01T13:06:00Z"
  }
  ```
  *(Expected: REJECTED because schema rules reject unexpected key configurations or update `affectedKeys().hasOnly()` check rejects it)*

### Attack 6: Wallet Flooding (DoS Character Payload)
* **Goal**: Write a document with a massive 2MB generated string ID to trigger index-cost denial of wallet.
* **Payload ID**: `"a".repeat(100000)`
  *(Expected: REJECTED because global validation checks `isValidId(docId)` to enforce ID length <= 128)*

### Attack 7: Fake Self-Promotion (Admin Escalation)
* **Goal**: Write an entry directly under `/admins/attacker-uid` to spoof `isAdmin()` check.
* **Payload**: `WRITE /admins/attacker-uid`
  *(Expected: REJECTED because `/admins/{uid}` paths has default deny-all unless executed via cloud console)*

### Attack 8: Bypassing Server Timestamps with Fake Dates
* **Goal**: Inject a back-dated `createdAt` record to claim a slot before actual work started.
* **Payload**:
  ```json
  {
    "id": "task-with-fake-time",
    "projectId": "project-id",
    "title": "Fake time task",
    "status": "todo",
    "priority": "medium",
    "createdAt": "2010-01-01T00:00:00Z",
    "updatedAt": "2010-01-01T00:00:00Z"
  }
  ```
  *(Expected: REJECTED because `createdAt == request.time` is strictly enforced during writes)*

### Attack 9: Status Jumping State Shortcut
* **Goal**: Jump an item straight to "completed" without satisfying progress verification gates, or updating other read-only properties without validation.
* **Payload**: Update `status` and `unauthorizedField` simultaneously.
  *(Expected: REJECTED because update bounds check exact fields)*

### Attack 10: Task List Extraction Spray (Blanket Read Bypass)
* **Goal**: Fetch list queries across all workspaces without filtering by workspace membership.
* **Payload**: `GET /projects/{anyProject}/tasks`
  *(Expected: REJECTED because rule-side list locks require parent projects to be fetched and verified for user participation)*

### Attack 11: Blank Title Resource Waste
* **Goal**: Create empty or malformed tasks containing blanks to clutter databases.
* **Payload**:
  ```json
  {
    "id": "malformed-task",
    "projectId": "project-id",
    "title": "",
    "status": "todo",
    "priority": "medium",
    "createdAt": "request.time",
    "updatedAt": "request.time"
  }
  ```
  *(Expected: REJECTED because validator checks `title.size() >= 1`)*

### Attack 12: Calendar Drift (End Before Start)
* **Goal**: Create scheduling blocks where start time exists AFTER the end time.
* **Payload**:
  ```json
  {
    "id": "drift-id",
    "projectId": "project-id",
    "title": "Reverse block",
    "startTime": "2026-06-01T15:00:00Z",
    "endTime": "2026-06-01T13:00:00Z",
    "userId": "user-uid",
    "createdAt": "request.time",
    "updatedAt": "request.time"
  }
  ```
  *(Expected: REJECTED because calendar validator checks `data.startTime < data.endTime`)*

---

## 3. Security Assertions Test Runner Layout

This outline illustrates a structural suite executing these twelve threat audits in a sandbox workspace.

```typescript
// firestore.rules.test.ts
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

describe('Collaborative Productivity Suite - Fortress Rules Audit', () => {
  let testEnv: any;

  before(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'productivity-fortress-app',
      firestore: {
        rules: require('fs').readFileSync('firestore.rules', 'utf8')
      }
    });
  });

  after(async () => {
    await testEnv.cleanup();
  });

  it('Attack 1: Denys task claims of other users (Identity spoofing)', async () => {
    const maliciousAliceContext = testEnv.authenticatedContext('alice_uid');
    const db = maliciousAliceContext.firestore();
    const docRef = doc(db, 'projects/proj_1/tasks/task_malicious');
    await assertFails(setDoc(docRef, {
      id: 'task_malicious',
      projectId: 'proj_1',
      title: 'Alice Spoof',
      status: 'todo',
      priority: 'low',
      assignedTo: 'bob_uid', // Alice trying to assign her task as bob without being Bob
      createdAt: 'request.time',
      updatedAt: 'request.time'
    }));
  });

  it('Attack 2: Protects orphaned tasks outside workspace boundaries', async () => {
    const intruderCtx = testEnv.authenticatedContext('intruder_uid');
    const db = intruderCtx.firestore();
    const docRef = doc(db, 'projects/secure_project/tasks/target_task');
    await assertFails(setDoc(docRef, {
      id: 'target_task',
      projectId: 'secure_project',
      title: 'Injected Content',
      status: 'todo',
      priority: 'medium',
      createdAt: 'request.time',
      updatedAt: 'request.time'
    }));
  });

  it('Attack 3: Restricts PII from public read access', async () => {
    const observerCtx = testEnv.authenticatedContext('alice_uid');
    const db = observerCtx.firestore();
    const docRef = doc(db, 'users/bob_uid/private/info');
    await assertFails(getDoc(docRef));
  });

  it('Attack 4: Blocks project owner reassignments', async () => {
    const collaboratorCtx = testEnv.authenticatedContext('bob_uid');
    const db = collaboratorCtx.firestore();
    const docRef = doc(db, 'projects/proj_1');
    await assertFails(updateDoc(docRef, {
      ownerId: 'bob_uid' // Cannot modify ownerId after project is initialized
    }));
  });

  it('Attack 5: Rejects ghost field injections', async () => {
    const ownerCtx = testEnv.authenticatedContext('alice_uid');
    const db = ownerCtx.firestore();
    const docRef = doc(db, 'projects/proj_1');
    await assertFails(updateDoc(docRef, {
      isApprovedDirectly: true // Schema violates strict affectedKeys.hasOnly
    }));
  });

  it('Attack 6: Protects against denial of wallet resource exhaustion ID strings', async () => {
    const aliceCtx = testEnv.authenticatedContext('alice_uid');
    const db = aliceCtx.firestore();
    const longId = 'a'.repeat(200);
    const docRef = doc(db, `projects/proj_1/tasks/${longId}`);
    await assertFails(setDoc(docRef, {
      id: longId,
      projectId: 'proj_1',
      title: 'Spam ID',
      status: 'todo',
      priority: 'low',
      createdAt: 'request.time',
      updatedAt: 'request.time'
    }));
  });

  it('Attack 7: Thwarts unauthorized admin group creation self-escalation', async () => {
    const userCtx = testEnv.authenticatedContext('alice_uid');
    const db = userCtx.firestore();
    const docRef = doc(db, 'admins/alice_uid');
    await assertFails(setDoc(docRef, { role: 'admin' }));
  });

  it('Attack 8: Prevents historic back-dating timeline skews', async () => {
    const aliceCtx = testEnv.authenticatedContext('alice_uid');
    const db = aliceCtx.firestore();
    const docRef = doc(db, 'projects/proj_1/tasks/t1_skewed');
    await assertFails(setDoc(docRef, {
      id: 't1_skewed',
      projectId: 'proj_1',
      title: 'Skewed Time',
      status: 'todo',
      priority: 'low',
      createdAt: new Date('2020-01-01'), // Fake past date
      updatedAt: new Date('2020-01-01')
    }));
  });

  it('Attack 9: Prevents updates without isValid helper checks', async () => {
    const aliceCtx = testEnv.authenticatedContext('alice_uid');
    const db = aliceCtx.firestore();
    const docRef = doc(db, 'projects/proj_1/tasks/t1');
    await assertFails(updateDoc(docRef, {
      status: 'super-done' // Malformed enum value state shortcut
    }));
  });

  it('Attack 10: Retaliates on database-wide sweeping list scans', async () => {
    const bobCtx = testEnv.authenticatedContext('bob_uid');
    const db = bobCtx.firestore();
    // Broad list read for tasks Bob doesn't participate in
    const queryRef = db.collectionGroup('tasks');
    await assertFails(queryRef.get());
  });

  it('Attack 11: Rejects creation of blanks to save server slots', async () => {
    const aliceCtx = testEnv.authenticatedContext('alice_uid');
    const db = aliceCtx.firestore();
    const docRef = doc(db, 'projects/proj_1/tasks/blank_item');
    await assertFails(setDoc(docRef, {
      id: 'blank_item',
      projectId: 'proj_1',
      title: '', // Empty values
      status: 'todo',
      priority: 'low',
      createdAt: 'request.time',
      updatedAt: 'request.time'
    }));
  });

  it('Attack 12: Blocks inverted calendar intervals (drift)', async () => {
    const aliceCtx = testEnv.authenticatedContext('alice_uid');
    const db = aliceCtx.firestore();
    const docRef = doc(db, 'projects/proj_1/timeBlocks/back_dated_block');
    await assertFails(setDoc(docRef, {
      id: 'back_dated_block',
      projectId: 'proj_1',
      title: 'Inverted Scheduler',
      startTime: new Date('2026-06-01T15:00:00Z'),
      endTime: new Date('2026-06-01T13:00:00Z'), // Ends before start
      userId: 'alice_uid',
      createdAt: 'request.time',
      updatedAt: 'request.time'
    }));
  });
});
```
