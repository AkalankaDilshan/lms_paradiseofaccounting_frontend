# Frontend Implementation Plan — Accounting with Asela LMS

**Prepared for:** Next code agent
**Context:** Sri Lanka A/L Accounting tuition platform. Teacher: Asela Samanpriya. Max 75 students across Grade 12/13 × 3 towns (Ginigathhena, Hatton, Nawalapitiya) + Revision group. PWA-enabled, dark-first design, Sinhala text support required throughout.

---

## Tech Stack (do not change these)

| Tool | Version | Notes |
|---|---|---|
| React | 19 | |
| Vite | 8 | PWA via `vite-plugin-pwa` |
| TypeScript | 6 | |
| Tailwind CSS | **v4** | No `tailwind.config.js` — config via CSS or `@tailwindcss/vite` plugin only |
| shadcn/ui | latest | Components at `src/components/ui/` |
| kibo-ui | local | Components at `src/components/kibo-ui/` (dropzone, image-zoom, calendar) |
| TanStack Query | v5 | All server state |
| React Router | v7 | |
| Jotai | v3 | Atom-based local state |
| Recharts | v3 | Charts only |
| Motion (Framer) | v13 | Import as `motion/react` |
| axios | v1 | API client at `src/api/client.ts` |
| amazon-cognito-identity-js | v6 | Auth SDK |

**Path alias:** `@/` maps to `src/`
**Mock adapter:** `src/api/mockClient.ts` intercepts all API calls. All new features must add mock responses there.

---

## Part 1 — Critical Fixes (do these before any new features)

These are API contract mismatches between current Frontend and Backend that will break in production.

### Fix 1.1 — QuizAttempt.tsx: question shape mismatch

**File:** `src/pages/student/QuizAttempt.tsx`

Current `Question` interface assumes `{ id, text, options: string[] }`.
Backend actually returns `{ questionId, questionText, options: [{index: number, text: string}][], durationMinutes }`.

**Changes needed:**
```typescript
// Replace current Question interface with:
interface Question {
  questionId: string;
  questionText: string;
  options: { index: number; text: string }[];
}
interface AttemptData {
  attemptId: string;
  quizId: string;
  durationMinutes: number; // use this, not hardcoded 30 min
  questions: Question[];
}
```

In the render: use `q.questionId` as key, `q.questionText` as label, `q.options.map(o => o.text)` for radio values.

Timer: replace `setTimeLeft(30 * 60)` with `setTimeLeft(data.durationMinutes * 60)`.

Answers state: currently `Record<string, string>` (option text). Must change to `Record<string, number>` (option index) to match Backend.

```typescript
// answers: Record<string, number> — key=questionId, value=selectedOptionIndex
onValueChange={(val) => setAnswers(prev => ({ ...prev, [q.questionId]: Number(val) }))}
```

Submit payload must change:
```typescript
// current (wrong):
{ answers: [{questionId, selectedOption: string}] }

// correct:
{ answersGiven: { [questionId]: selectedOptionIndex } }
```

Also add warning at 5 min and 1 min remaining (currently only shows "Less than a minute" — add a 5-minute banner too).

Mock in `mockClient.ts` needs to return the correct shape too.

---

### Fix 1.2 — QuizResults.tsx: response shape mismatch

**File:** `src/pages/student/QuizResults.tsx`

Backend returns `{ attemptId, score, maxScore, percentage, results: [...] }`.
Frontend expects `{ score, maxScore, breakdown: [...] }`.

**Changes:**
```typescript
interface QuestionResult {
  questionId: string;
  questionText: string;           // not "text"
  options: { index: number; text: string }[];
  givenAnswerIndex: number | null; // not "studentAnswer" string
  correctAnswerIndex: number;      // not "correctAnswer" string
  correctAnswerText: string;
  isCorrect: boolean;
  explanation?: string;
}
interface ResultsData {
  attemptId: string;
  score: number;
  maxScore: number;
  percentage: number;
  results: QuestionResult[];       // not "breakdown"
}
```

In render: replace `data.breakdown` with `data.results`. For display, show `item.correctAnswerText` instead of `item.correctAnswer`.

Update mockClient to return `results` array with the correct field names.

---

### Fix 1.3 — StudentDashboard.tsx: quiz list shape mismatch

**File:** `src/pages/student/StudentDashboard.tsx`

Backend `GET /quizzes` returns a raw array `Quiz[]`.
Frontend does `res.data.items` which will be `undefined`.

**Fix:** Change the queryFn:
```typescript
queryFn: async () => (await apiClient.get('/quizzes')).data as QuizItem[]
// remove .items
```

Also update the `QuizItem` interface — Backend returns `quizId` not `id`, `maxAttempts` not `maxAttempts` (same), but there is no `attemptsUsed` in the Backend response. The `attemptsUsed` needs a separate call or should be omitted until the attempts endpoint is used.

---

### Fix 1.4 — StudentTrend.tsx: userId vs username

**File:** `src/pages/student/StudentTrend.tsx`

Currently calls `/analytics/students/${user?.username}/trend`.
Backend expects the Cognito `sub` (UUID), not the username.

**Fix:** `AuthContext` needs to expose the Cognito `sub`. In `fetchSession`, extract `payload.sub` and add it to the `User` object:
```typescript
interface User {
  username: string;
  sub: string;       // add this — Cognito UUID
  role: ...;
  email: string;
}
// in fetchSession:
setUser({ username: cognitoUser.getUsername(), sub: payload.sub || '', email: payload.email || '', role });
```

Then in StudentTrend: use `user?.sub` instead of `user?.username`.

---

### Fix 1.5 — LoginPage.tsx: navigation after login

**File:** `src/pages/auth/LoginPage.tsx`

`navigate('/')` after login goes to an undefined route which catches to `/login`.

**Fix:**
```typescript
// in onSuccess callback, after refreshSession():
refreshSession().then(() => {
  // read role from refreshed session
  const cognitoUser = userPool?.getCurrentUser();
  cognitoUser?.getSession((_err: any, session: any) => {
    const groups = session?.getIdToken().decodePayload()['cognito:groups'] || [];
    const role = groups.includes('SuperAdmin') || groups.includes('TA') ? 'teacher' : 'student';
    navigate(role === 'teacher' ? '/teacher' : '/student');
  });
});
```

---

### Fix 1.6 — Mock data in mockClient.ts

Update `mockClient.ts` to return the correct Backend shapes for all endpoints used by the quiz flow (items 1.1–1.3 above). Keep mock data in Sinhala where appropriate.

---

## Part 2 — Missing Core Pages (planned in design.md, not yet built)

### 2.1 — Student Profile Page

**Route:** `/student/profile`
**File:** `src/pages/student/StudentProfile.tsx`
**Nav:** Already in `AppLayout.tsx` sidebar as "Profile" → `/student/profile`

**Features:**
- View own profile: name, email, phone, school, exam year, address
- Edit mutable fields (phone, address) via `PUT /admin/students/{userId}`
- Display current group memberships (read-only for student)
- Change password section (uses Cognito SDK `changePassword`)
- `verificationStatus` badge (auto_approved / pending_review)
- Avatar displayed large with DiceBear seed

**API calls:**
- `GET /admin/students/{userId}` — fetch own profile (needs this endpoint, currently `/admin/students` returns all; we may need to add `GET /admin/students/{userId}` to the Backend, or filter client-side from the full list)
- `PUT /admin/students/{userId}` — update mutable fields

**Mock shape:**
```typescript
// GET /admin/students/:id
{
  userId: "test-user",
  firstName: "Akalanka",
  lastName: "Dilshan",
  email: "akalanka@example.com",
  phone: "+94771234567",
  school: "Hatton National College",
  examYear: 2026,
  address: "123 Main St, Hatton",
  role: "Student",
  status: "active",
  verificationStatus: "auto_approved",
  groups: ["G13-HATTON"]
}
```

---

### 2.2 — Quiz List Page (Teacher)

**Route:** `/teacher/quizzes`
**File:** `src/pages/teacher/QuizList.tsx`
**Nav:** Add "Quizzes" nav item in teacher sidebar

**Features:**
- Table of all quizzes: title, groups, open/close window, status badge (Scheduled / Open / Closed / Archived)
- Actions: Edit, View Analytics, Archive
- "New Quiz" button → `/teacher/quizzes/new`
- Filter by group, status

**API calls:**
- `GET /quizzes` — returns all quizzes for SuperAdmin/TA

**Mock shape:** Array of Quiz objects with `quizId, title, allowedGroups[], openAt, closeAt, durationMinutes, maxAttempts, archived`.

---

### 2.3 — Quiz Builder: wire to API

**File:** `src/pages/teacher/QuizBuilder.tsx`

Current page is a static form with no submit logic. Wire it:

- On mount, call `GET /questions` to populate the question browser panel
- Question browser: searchable list, check to add to quiz, drag-reorder using HTML5 drag or a simple up/down button (avoid heavy DnD library)
- Group selector: render all 7 predefined groups as checkboxes: `G12-GINIGATHHENA`, `G12-HATTON`, `G12-NAWALAPITIYA`, `G13-GINIGATHHENA`, `G13-HATTON`, `G13-NAWALAPITIYA`, `REVISION`
- `datetime-local` inputs for openAt/closeAt
- On submit: `POST /quizzes` with correct payload
- Edit mode (`/teacher/quizzes/:id/edit`): pre-fill from `GET /quizzes` data + `PUT /quizzes/:id` on save

---

### 2.4 — Question Form Page (Teacher)

**Routes:** `/teacher/questions/new`, `/teacher/questions/:id/edit`
**File:** `src/pages/teacher/QuestionForm.tsx`

Wire the "Add Question" button in QuestionBank to this page.

**Fields:**
- Question text (large textarea, support Sinhala)
- Question type selector: MCQ / Structured / Essay (MCQ default)
- 2–5 option inputs (dynamic add/remove), with radio to mark correct option
- Explanation textarea (optional)
- Tags input (comma-separated, rendered as removable chips)
- Image upload: use kibo-ui `Dropzone`, call `GET /questions/image-upload-url?questionId=...&filename=...&contentType=...`, then PUT to the presigned URL, store returned `imageKey` in form state. Show preview using kibo-ui `ImageZoom`.
- On submit: `POST /questions` or `PUT /questions/:id`

---

### 2.5 — Question Bank: wire to API

**File:** `src/pages/teacher/QuestionBank.tsx`

Replace hardcoded array with:
- `GET /questions` via TanStack Query
- Search/filter by tag (use `?tag=` query param)
- Archive button calls `DELETE /questions/:id` then invalidates query
- Edit icon navigates to `/teacher/questions/:id/edit`

---

### 2.6 — Student Management: wire to API

**File:** `src/pages/teacher/StudentManagement.tsx`

Replace hardcoded array with:
- `GET /admin/students` — paginate client-side (no server pagination at 75 students)
- Search bar filtering client-side by name/email/school
- "Add Student" button → modal with same fields as signup form → `POST /admin/students`
- "Import CSV" button → file picker using existing kibo-ui Dropzone → `POST /admin/students/csv` → show per-row result summary in a result modal
- Suspend button → `DELETE /admin/students/:id`
- Group assignment: click a student → side panel showing current groups with add/remove via `POST|DELETE /admin/students/:id/groups`
- Status badge: active (green) / suspended (red)

---

## Part 3 — New Features

### 3.1 — Announcements / Notice Board

**Priority:** HIGH — critical for tuition communication

**Routes:**
- `/student/announcements` — student view (read-only)
- `/teacher/announcements` — teacher view (CRUD)

**Files:**
- `src/pages/student/AnnouncementsPage.tsx`
- `src/pages/teacher/AnnouncementsPage.tsx`
- `src/components/AnnouncementCard.tsx`

**Nav:** Add "Announcements" (with unread badge) to both student and teacher sidebars.

**Also:** Add a top-3 pinned announcements section to `StudentDashboard.tsx` and `TeacherDashboard.tsx`.

**UI — Student view:**
- Feed of announcement cards, newest first
- Card shows: title, body text, posted date, group tag (e.g. "G13-HATTON" or "All Groups"), pinned badge
- Unread dot on unread items (track read state in localStorage keyed by announcement ID)
- Sinhala text support on body

**UI — Teacher view:**
- Same feed + "New Announcement" button
- Create/edit modal:
  - Title input
  - Body textarea (multiline, supports Sinhala)
  - Target groups: "All Groups" or multi-select checkboxes of the 7 groups
  - Pin toggle (pinned announcements sort to top)
  - Publish / Save draft toggle
- Delete button per announcement

**API contract (new Backend Lambda needed — or extend auth_admin):**
```
GET    /announcements          — all published; ?groupId= to filter
POST   /announcements          — create (SuperAdmin, TA)
PUT    /announcements/:id      — update (SuperAdmin, TA)
DELETE /announcements/:id      — soft-delete (SuperAdmin, TA)
```

**DynamoDB design (for Backend agent reference):**
```
PK: TENANT#asela
SK: ANNOUNCE#<announcementId>
announcementId: uuid
title: string
body: string
targetGroups: string[]  — ["ALL"] or specific group IDs
isPinned: boolean
status: "published" | "draft"
createdBy: userId
createdAt: ISO-8601
updatedAt: ISO-8601
```

**Mock responses to add to mockClient.ts:**
```typescript
mock.onGet('/announcements').reply(200, {
  items: [
    {
      announcementId: 'ann-1',
      title: 'Grade 13 — October Paper Schedule',
      body: 'ඔක්තෝබර් මාසයේ ප්‍රශ්නාවලිය දිනය නිවේදනය කෙරේ. Grade 13 Hatton group September 28 ට සූදානම් වන්න.',
      targetGroups: ['G13-HATTON', 'G13-NAWALAPITIYA', 'G13-GINIGATHHENA'],
      isPinned: true,
      status: 'published',
      createdAt: '2026-09-14T08:00:00Z',
    },
    {
      announcementId: 'ann-2',
      title: 'Platform Update — New Study Materials Added',
      body: 'නව අධ්‍යයන ද්‍රව්‍ය resource library හි ලබා ගත හැකිය.',
      targetGroups: ['ALL'],
      isPinned: false,
      status: 'published',
      createdAt: '2026-09-12T10:00:00Z',
    },
  ]
});
mock.onPost('/announcements').reply(201, { announcementId: 'ann-new', success: true });
mock.onPut(/\/announcements\/[^/]+/).reply(200, { updated: true });
mock.onDelete(/\/announcements\/[^/]+/).reply(200, { deleted: true });
```

---

### 3.2 — Payment Records Management

**Priority:** HIGH — standard feature for Sri Lankan tuition

**Routes:**
- `/teacher/payments` — full payment management view
- `/teacher/payments/:studentId` — individual student payment history

**Files:**
- `src/pages/teacher/PaymentsPage.tsx`
- `src/pages/teacher/StudentPaymentHistory.tsx`
- `src/components/PaymentStatusBadge.tsx`

**Nav:** Add "Payments" to teacher sidebar (with overdue count badge in red if any students are overdue).

**UI — Main payments page:**
- Summary stats row: Total collected this month / Pending / Overdue count
- Table of students with columns: Name, Group, This Month status, Last 3 months (mini dots), Action
- Filter by: group, payment status (all / paid / pending / overdue)
- Bulk mark-paid: select multiple students → "Mark as Paid" for current month
- Export CSV button (client-side, using array → CSV conversion — no API needed)
- Search by name

**Payment status visual:**
- Green dot = paid
- Amber dot = pending (due but not yet paid)
- Red dot = overdue (past due date)
- 3-month history dots per row (like GitHub contribution graph)

**UI — Individual student payment history:**
- Month-by-month table going back 12 months
- Each row: Month, Amount, Status, Paid Date, Notes, Action (Mark Paid / Edit)
- Add payment note modal
- Print/PDF button (use `window.print()` with a print-only CSS class)

**API contract (new Backend Lambda needed):**
```
GET    /payments                       — all students' payment status (SuperAdmin, TA)
GET    /payments/:studentId            — one student's payment history (SuperAdmin, TA)
PUT    /payments/:studentId/:monthKey  — mark paid / update status (SuperAdmin, TA)
                                         monthKey format: "2026-09"
```

**DynamoDB design:**
```
PK: TENANT#asela#USER#<userId>
SK: PAYMENT#2026-09
month: "2026-09"
amount: number (e.g. 2500 — LKR)
status: "paid" | "pending" | "overdue" | "waived"
paidAt: ISO-8601 | null
note: string (optional)
recordedBy: userId
```

**Monthly fee amount:** store on Tenant Config item as `monthlyFeeAmount: number` (LKR). Teacher configures once.

**Mock responses:**
```typescript
mock.onGet('/payments').reply(200, {
  items: [
    { userId: 'u1', firstName: 'Kasun', lastName: 'Perera', group: 'G12-HATTON',
      currentMonth: { status: 'paid', paidAt: '2026-09-05T10:00:00Z' },
      history: [
        { month: '2026-09', status: 'paid' },
        { month: '2026-08', status: 'paid' },
        { month: '2026-07', status: 'overdue' },
      ]
    },
    { userId: 'u2', firstName: 'Nimal', lastName: 'Silva', group: 'G13-NAWALAPITIYA',
      currentMonth: { status: 'pending', paidAt: null },
      history: [
        { month: '2026-09', status: 'pending' },
        { month: '2026-08', status: 'paid' },
        { month: '2026-07', status: 'paid' },
      ]
    },
  ]
});
mock.onPut(/\/payments\/[^/]+\/[^/]+/).reply(200, { updated: true });
```

---

### 3.3 — Study Materials / Resource Library

**Priority:** HIGH — teacher needs to share notes, model answers, past papers

**Routes:**
- `/student/materials` — student browse & download
- `/teacher/materials` — teacher upload & manage

**Files:**
- `src/pages/student/MaterialsPage.tsx`
- `src/pages/teacher/MaterialsPage.tsx`
- `src/components/MaterialCard.tsx`

**Nav:** Add "Materials" to both student and teacher sidebars.

**UI — Student view:**
- Grid of material cards
- Card shows: title, subject/topic tag, file type icon (PDF/Image/Doc), file size, uploaded date, download button
- Filter by: group-targeted ("For your grade"), topic tag, file type
- Search by title

**UI — Teacher view:**
- Same grid + "Upload Material" button
- Upload modal:
  - Title input
  - Description textarea
  - Topic/tag input
  - Target groups (multi-select, same 7 groups + "All")
  - File picker using kibo-ui `Dropzone` (accept PDF, images, doc — max 20MB)
  - Upload: call `GET /materials/upload-url` (presigned S3 PUT), then PUT file directly
- Edit / Delete actions per material card

**API contract (new Lambda or extend question_bank):**
```
GET    /materials              — list materials (filtered by student's groups)
POST   /materials              — create metadata record (SuperAdmin, TA)
GET    /materials/upload-url   — presigned S3 PUT URL (SuperAdmin, TA)
DELETE /materials/:materialId  — archive (SuperAdmin, TA)
```

**DynamoDB design:**
```
PK: TENANT#asela
SK: MATERIAL#<materialId>
materialId: uuid
title: string
description: string
targetGroups: string[]
fileKey: string     — CloudFront or S3 URL
fileType: string    — "pdf" | "image" | "doc"
fileSizeBytes: number
tags: string[]
archived: boolean
createdBy: userId
createdAt: ISO-8601
```

**Infrastructure note for Backend/Infra agent:** Materials can go in the existing `lms-question-images` S3 bucket under a `materials/` prefix, or a new `lms-materials` bucket. The question-images CloudFront distribution already exists; materials could use the same distribution with an additional origin path if public, or a separate presigned-URL flow if private (recommended for model answers).

**Mock responses:**
```typescript
mock.onGet('/materials').reply(200, {
  items: [
    { materialId: 'm1', title: 'Chapter 5 — Partnership Accounts Notes',
      description: 'සම්පූර්ණ සටහන් (Comprehensive notes in Sinhala)',
      targetGroups: ['G13-HATTON', 'G13-GINIGATHHENA'],
      fileKey: 'https://example.com/materials/partnership-notes.pdf',
      fileType: 'pdf', fileSizeBytes: 2048000, tags: ['Partnership', 'Grade 13'],
      createdAt: '2026-09-10T08:00:00Z' },
    { materialId: 'm2', title: '2025 A/L Model Paper — Accounting',
      description: 'Official model paper with marking scheme',
      targetGroups: ['ALL'],
      fileKey: 'https://example.com/materials/2025-model-paper.pdf',
      fileType: 'pdf', fileSizeBytes: 1536000, tags: ['Model Paper', 'Exam Prep'],
      createdAt: '2026-09-01T08:00:00Z' },
  ]
});
mock.onGet('/materials/upload-url').reply(200, {
  uploadUrl: 'https://mock-s3-presigned-url.example.com/put',
  fileKey: 'https://cdn.example.com/materials/new-file.pdf',
});
```

---

### 3.4 — Teacher To-Do List

**Priority:** MEDIUM — personal productivity for the teacher

**Route:** No dedicated route — embed as a panel on `TeacherDashboard` and as a collapsible widget accessible from the sidebar.

**File:** `src/components/TodoWidget.tsx`

**Implementation:** **Frontend-only, no Backend.** Use Jotai atoms + `localStorage` persistence.

```typescript
// src/atoms/todoAtoms.ts
import { atomWithStorage } from 'jotai/utils';

interface Todo {
  id: string;
  text: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  createdAt: string;
  dueDate?: string;  // ISO date only, no time
}

export const todosAtom = atomWithStorage<Todo[]>('teacher-todos', []);
```

**UI:**
- Compact list in TeacherDashboard sidebar column (replace the "Flagged questions" card or add below it)
- Each item: checkbox, text, priority color dot (red/amber/green), optional due date
- Add item: inline input at bottom of list with priority selector
- "View all" link → modal with full list and filter by priority/completion
- Completed items move to a "Done" section with strikethrough
- Auto-sorts: incomplete high priority first, then medium, then low
- Hover shows delete button

**Jotai atom persistence pattern:**
```typescript
import { atomWithStorage } from 'jotai/utils';
// atomWithStorage auto-syncs to localStorage — no manual save needed
```

---

### 3.5 — Class Attendance Tracker

**Priority:** MEDIUM — Sri Lankan tuition teachers track physical attendance

**Routes:**
- `/teacher/attendance` — mark attendance for a class session
- `/teacher/attendance/reports` — attendance report by student or date

**Files:**
- `src/pages/teacher/AttendancePage.tsx`
- `src/pages/teacher/AttendanceReports.tsx`

**Nav:** Add "Attendance" to teacher sidebar.

**UI — Mark attendance page:**
- Date picker (default today) + group selector
- Student list for selected group with Present / Absent / Late toggle buttons (tri-state)
- Quick actions: "Mark all present", "Mark all absent"
- Save button → `POST /attendance`
- Shows previously saved attendance for that date/group if exists

**UI — Attendance reports:**
- Table: student name vs. date columns, colored cells (green=present, red=absent, amber=late, grey=no session)
- Date range filter
- Per-student summary: attendance percentage
- Export CSV client-side

**API contract:**
```
GET    /attendance?groupId=...&date=...         — get attendance for a session
POST   /attendance                              — record a session (SuperAdmin, TA)
GET    /attendance/reports?studentId=...        — student attendance summary
GET    /attendance/reports?groupId=...          — group attendance summary
```

**DynamoDB design:**
```
PK: TENANT#asela#GROUP#<groupId>
SK: ATTENDANCE#<date>   (date format: YYYY-MM-DD)
date: string
groupId: string
records: { [userId]: "present" | "absent" | "late" }
recordedBy: userId
recordedAt: ISO-8601
```

**Mock responses:**
```typescript
mock.onGet(/\/attendance/).reply(200, {
  date: '2026-09-16',
  groupId: 'G13-HATTON',
  records: {
    'u1': 'present',
    'u2': 'absent',
    'u3': 'present',
  }
});
mock.onPost('/attendance').reply(201, { saved: true });
```

---

### 3.6 — Broadcast Messages / Inbox

**Priority:** MEDIUM — targeted class communication

**Routes:**
- `/student/inbox` — student message inbox
- `/teacher/messages` — compose and sent history

**Files:**
- `src/pages/student/InboxPage.tsx`
- `src/pages/teacher/MessagesPage.tsx`
- `src/components/MessageThread.tsx`

**Nav:** Add "Messages" to student sidebar (with unread count badge). Add "Messages" to teacher sidebar.

**UI — Student inbox:**
- List of received messages (from teacher only)
- Each item: sender avatar, subject, preview, date, unread dot
- Click → open full message (mark as read via localStorage)
- No student-to-teacher reply needed (Phase 1 of this feature is one-way broadcast)

**UI — Teacher compose:**
- "New Message" button → compose modal
- To: select recipients by group, or "All students", or specific student(s)
- Subject + body (supports Sinhala)
- Send → `POST /messages`
- Sent messages tab with history

**API contract:**
```
GET    /messages              — student: own inbox; teacher: sent messages
POST   /messages              — compose + send (SuperAdmin, TA)
```

**DynamoDB design:**
```
PK: TENANT#asela#USER#<recipientUserId>
SK: MESSAGE#<messageId>
messageId: uuid
subject: string
body: string
fromUserId: userId
sentAt: ISO-8601
```

**Note:** For broadcast (sent to a group), the Lambda fans out one item per student. Alternative: store once with `targetGroups` and query by group — decide based on read-vs-write volume. Fan-out is simpler at 75 students.

---

### 3.7 — Student Dashboard Enhancements

These are additions to the existing `StudentDashboard.tsx`:

1. **Pinned Announcements section** — show top 2 pinned announcements fetched from `GET /announcements`. If 0, hide section.

2. **Upcoming class schedule** — small card showing next 3 quiz windows with countdown timers. Uses `GET /quizzes` data already fetched.

3. **Recent materials** — card showing 2 most recent materials from `GET /materials`. Quick download link.

4. **Unread messages badge** — count from `GET /messages` or localStorage unread tracking. Show on Messages nav item.

Remove hardcoded `recentAttempts` array once quiz attempt history endpoint exists. For now, keep but clearly comment as mock.

---

### 3.8 — Teacher Dashboard Enhancements

These are additions to the existing `TeacherDashboard.tsx`:

1. **Payment overview widget** — "Pending payments" count with link to `/teacher/payments`. Show this month's collection rate: "48/75 paid (64%)". Use amber if < 80%, red if < 50%.

2. **Announcement quick-post** — small compose form inline on dashboard (title + body, target all groups) for quick broadcast.

3. **TodoWidget** — replace the "Flagged questions" card with the new TodoWidget (3.4).

4. **Replace all hardcoded data** with real API calls once those endpoints exist. Until then, keep mocks but move them to `mockClient.ts`.

---

### 3.9 — Student Progress Report (PDF)

**Priority:** LOW — nice-to-have for parents

**Route:** No dedicated page — button on `/teacher/students` per-student row and on `/teacher/quizzes/:id/analytics`.

**File:** `src/utils/generateReport.ts`

**Implementation:** Client-side PDF using `@react-pdf/renderer` or plain `window.print()` with a hidden print-styled component. Prefer `window.print()` to avoid a heavy dependency.

**Print template** (`src/components/print/StudentReportPrint.tsx`):
- Student name, school, exam year, group
- Quiz-by-quiz score table (from trend data)
- Average score, class rank
- "Prepared by: Asela Samanpriya — Paradise of Accounting"
- Teacher signature line

Trigger via a "Print Report" button that sets a `isPrinting` Jotai atom, renders the print component, and calls `window.print()`.

---

## Part 4 — Navigation / App Shell Updates

### 4.1 — AppLayout.tsx sidebar nav update

Current student nav items: Dashboard, Performance, Profile
**Update to:**
```
Dashboard       /student
Quizzes         /student  (already shown via dashboard — or add explicit quiz list)
Performance     /student/trend
Materials       /student/materials       ← NEW
Announcements   /student/announcements   ← NEW (with unread badge)
Inbox           /student/inbox           ← NEW (with unread badge)
Profile         /student/profile
```

Current teacher nav items: Overview, Quiz builder, Question bank, Students
**Update to:**
```
Overview         /teacher
Quizzes          /teacher/quizzes         ← NEW (list, builder accessible from here)
Question Bank    /teacher/questions
Students         /teacher/students
Attendance       /teacher/attendance      ← NEW
Materials        /teacher/materials       ← NEW
Announcements    /teacher/announcements   ← NEW
Messages         /teacher/messages        ← NEW
Payments         /teacher/payments        ← NEW (with overdue count badge)
```

Remove non-functional header icons: `ShoppingCart`, `Languages` (keep Bell and Mail for future use, or replace Mail with the inbox route link).

### 4.2 — App.tsx route additions

Add all new routes inside the respective `ProtectedRoute` wrappers.

Student routes to add:
```tsx
<Route path="/materials" element={<MaterialsPage />} />
<Route path="/announcements" element={<AnnouncementsPage />} />
<Route path="/inbox" element={<InboxPage />} />
<Route path="/profile" element={<StudentProfile />} />
```

Teacher routes to add:
```tsx
<Route path="/quizzes" element={<QuizList />} />
<Route path="/quizzes/:id/edit" element={<QuizBuilder />} />
<Route path="/questions/new" element={<QuestionForm />} />
<Route path="/questions/:id/edit" element={<QuestionForm />} />
<Route path="/attendance" element={<AttendancePage />} />
<Route path="/attendance/reports" element={<AttendanceReports />} />
<Route path="/materials" element={<MaterialsPage role="teacher" />} />
<Route path="/announcements" element={<AnnouncementsPage role="teacher" />} />
<Route path="/messages" element={<MessagesPage />} />
<Route path="/payments" element={<PaymentsPage />} />
<Route path="/payments/:studentId" element={<StudentPaymentHistory />} />
```

Also fix the `*` catch-all — add `/` redirect by role before it:
```tsx
<Route path="/" element={<RoleRedirect />} />  // redirects to /student or /teacher
```

---

## Part 5 — Component Library Conventions

For all new components, follow these existing patterns:

**Card structure:**
```tsx
<Card>
  <CardHeader className="border-b border-white/10">
    <CardTitle className="text-lg">Title</CardTitle>
  </CardHeader>
  <CardContent className="p-6">...</CardContent>
</Card>
```

**Status badges:**
```tsx
// Use these color patterns consistently:
// active/paid/present: bg-emerald-500/15 text-emerald-400
// pending/warning:    bg-amber-500/15 text-amber-400
// error/overdue:      bg-rose-500/15 text-rose-400
// info:               bg-primary/15 text-primary
```

**Page header pattern:**
```tsx
<div>
  <p className="text-sm font-medium text-primary">Section label</p>
  <h1 className="text-3xl font-bold tracking-tight">Page Title</h1>
  <p className="mt-1 text-muted-foreground">Subtitle</p>
</div>
```

**Sinhala text:** Add `className="font-sinhala"` to any element displaying Sinhala script. The font stack must include a Sinhala-capable font. Check `index.css` and add `@font-face` for Noto Sans Sinhala if not present.

**Animations:** Use `motion/react` (not `framer-motion`) for enter animations. Keep them subtle — `initial={{ opacity: 0, y: 16 }}` `animate={{ opacity: 1, y: 0 }}` `transition={{ duration: 0.25 }}`.

**Empty states:** Every list/table must handle the empty state:
```tsx
{data.length === 0 && (
  <div className="py-12 text-center text-muted-foreground">
    <Icon className="mx-auto mb-3 h-8 w-8 opacity-30" />
    <p className="text-sm">No items yet.</p>
  </div>
)}
```

**Loading states:** Use skeleton placeholders, not spinners:
```tsx
if (isLoading) return (
  <div className="space-y-4">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
    ))}
  </div>
);
```

---

## Part 6 — Implementation Order

Complete in this order:

1. **Part 1 (Fixes 1.1–1.6)** — fix existing broken API contracts first. These are blockers.
2. **Part 2.1** StudentProfile — adds `/student/profile` which is already in nav
3. **Part 2.2–2.6** — core teacher pages (QuizList, QuizBuilder wired, QuestionForm, QuestionBank wired, StudentManagement wired)
4. **Part 3.1** Announcements — highest-value new feature
5. **Part 3.2** Payments — second highest value for tuition context
6. **Part 4** Nav + routes update (can do alongside the above)
7. **Part 3.3** Study Materials
8. **Part 3.4** Todo Widget
9. **Part 3.5** Attendance
10. **Part 3.6** Messages
11. **Part 3.7–3.8** Dashboard enhancements
12. **Part 3.9** Progress Report PDF

---

## Part 7 — Backend / Infra Work Required for New Features

The following new Lambda endpoints are needed. Pass this list to the Backend agent:

| Feature | New routes needed | Lambda | DynamoDB items |
|---|---|---|---|
| Announcements | `GET/POST/PUT/DELETE /announcements` | New: `announcements` | `TENANT#asela` / `ANNOUNCE#<id>` |
| Payments | `GET/PUT /payments`, `GET /payments/:userId` | New: `payments` | `TENANT#asela#USER#<id>` / `PAYMENT#<month>` |
| Materials | `GET/POST/DELETE /materials`, `GET /materials/upload-url` | Extend `question_bank` or new | `TENANT#asela` / `MATERIAL#<id>` |
| Attendance | `GET/POST /attendance`, `GET /attendance/reports` | New: `attendance` | `TENANT#asela#GROUP#<id>` / `ATTENDANCE#<date>` |
| Messages | `GET/POST /messages` | New: `messages` or extend `auth_admin` | `TENANT#asela#USER#<id>` / `MESSAGE#<id>` |
| Student profile | `GET /admin/students/:userId` | Extend `auth_admin` | Existing `USER#` item |

The todo list (3.4) and progress report PDF (3.9) are frontend-only — no Backend work needed.

New Terraform routes for API Gateway will also be needed for each new Lambda.
