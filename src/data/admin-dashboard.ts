export const attemptsThisYear = {
  label: 'Attempts this year',
  value: '2,486',
  delta: 12.4,
  vs: 'vs last year',
  spark: [168, 182, 176, 198, 214, 232, 225, 248, 266, 258, 284, 248],
};

export const attemptsThisMonth = {
  label: 'Attempts this month',
  value: '248',
  delta: 18.2,
  vs: 'vs last month',
  spark: [6, 8, 7, 9, 11, 8, 10, 12, 9, 8, 11, 10],
  extraLabel: 'Average daily attempts',
  extraValue: '8.3',
  extraDelta: 1.5,
};

export const miniKpis = [
  {
    label: 'Assigned quizzes',
    value: '42',
    delta: 8.1,
    positiveIsGood: true,
    spark: [28, 34, 30, 38, 32, 40, 36, 41, 35, 42, 38, 42],
  },
  {
    label: 'Completed',
    value: '1,892',
    delta: 6.4,
    positiveIsGood: true,
    spark: [1420, 1550, 1488, 1620, 1576, 1710, 1688, 1802, 1764, 1874, 1840, 1892],
  },
  {
    label: 'Missed / overdue',
    value: '86',
    delta: -4.2,
    positiveIsGood: false,
    spark: [110, 96, 108, 90, 104, 88, 98, 84, 92, 80, 87, 86],
  },
] as const;

export const monthlySeries = [
  { month: 'Jan', thisYear: 186, lastYear: 152, attempts: 186, completions: 164 },
  { month: 'Feb', thisYear: 204, lastYear: 168, attempts: 204, completions: 181 },
  { month: 'Mar', thisYear: 198, lastYear: 174, attempts: 198, completions: 172 },
  { month: 'Apr', thisYear: 236, lastYear: 190, attempts: 236, completions: 214 },
  { month: 'May', thisYear: 258, lastYear: 205, attempts: 258, completions: 232 },
  { month: 'Jun', thisYear: 274, lastYear: 218, attempts: 274, completions: 249 },
  { month: 'Jul', thisYear: 302, lastYear: 236, attempts: 302, completions: 276 },
  { month: 'Aug', thisYear: 248, lastYear: 228, attempts: 248, completions: 221 },
];

export const weakTopics = [
  { topic: 'Bank reconciliation', group: '2027', wrongRate: 62, attempts: 48 },
  { topic: 'Control accounts', group: '2028', wrongRate: 48, attempts: 61 },
  { topic: 'Depreciation methods', group: 'Revision', wrongRate: 41, attempts: 37 },
  { topic: 'Partnership accounts', group: '2027', wrongRate: 33, attempts: 54 },
  { topic: 'Incomplete records', group: '2028', wrongRate: 29, attempts: 42 },
];

export type AttemptStatus = 'Completed' | 'In progress' | 'Missed';

export interface QuizAttemptRow {
  id: string;
  studentId: string;
  student: string;
  quiz: string;
  group: string;
  score: string;
  status: AttemptStatus;
  date: string;
}

export const recentAttempts: QuizAttemptRow[] = [
  { id: 'ATT-1048', studentId: 'student-kasun', student: 'Kasun Perera', quiz: 'Partnership Accounts — Paper 1', group: '2027 · Hatton', score: '86%', status: 'Completed', date: '16 Sep' },
  { id: 'ATT-1047', studentId: 'student-tharushi', student: 'Tharushi Fernando', quiz: 'Depreciation Methods', group: '2027 · Hatton', score: '72%', status: 'Completed', date: '16 Sep' },
  { id: 'ATT-1046', studentId: 'student-nimal', student: 'Nimal Silva', quiz: 'Control Accounts — 2027 Batch', group: 'Revision · Nawalapitiya', score: '—', status: 'In progress', date: '16 Sep' },
  { id: 'ATT-1045', studentId: 'student-sachini', student: 'Sachini Bandara', quiz: 'Final Accounts — Paper 2', group: '2028 · Ginigathhena', score: '—', status: 'Missed', date: '15 Sep' },
  { id: 'ATT-1044', studentId: 'student-akalanka', student: 'Akalanka Dilshan', quiz: 'Partnership Accounts — Paper 1', group: '2027 · Hatton', score: '91%', status: 'Completed', date: '15 Sep' },
  { id: 'ATT-1043', studentId: 'student-ishara', student: 'Ishara Jayasinghe', quiz: 'Bank Reconciliation', group: '2028 · Ginigathhena', score: '64%', status: 'Completed', date: '15 Sep' },
  { id: 'ATT-1042', studentId: 'student-dilani', student: 'Dilani Wijesinghe', quiz: 'Incomplete Records', group: 'Revision · Nawalapitiya', score: '—', status: 'In progress', date: '14 Sep' },
  { id: 'ATT-1041', studentId: 'student-ruwan', student: 'Ruwan Fernando', quiz: 'Control Accounts — 2027 Batch', group: '2027 · Hatton', score: '55%', status: 'Completed', date: '14 Sep' },
  { id: 'ATT-1040', studentId: 'student-malsha', student: 'Malsha Perera', quiz: 'Depreciation Methods', group: '2028 · Ginigathhena', score: '—', status: 'Missed', date: '13 Sep' },
  { id: 'ATT-1039', studentId: 'student-kasun2', student: 'Hasini Silva', quiz: 'Final Accounts — Paper 2', group: '2028 · Ginigathhena', score: '78%', status: 'Completed', date: '13 Sep' },
  { id: 'ATT-1038', studentId: 'student-nuwan', student: 'Nuwan Bandara', quiz: 'Partnership Accounts — Paper 1', group: 'Revision · Nawalapitiya', score: '88%', status: 'Completed', date: '12 Sep' },
  { id: 'ATT-1037', studentId: 'student-pavithra', student: 'Pavithra Senanayake', quiz: 'Bank Reconciliation', group: '2027 · Hatton', score: '69%', status: 'Completed', date: '12 Sep' },
];

export const demoNotifications = [
  { id: 'n1', title: 'Nimal missed Final Accounts — Paper 2', body: '2028 · Ginigathhena', time: '12 min ago' },
  { id: 'n2', title: 'Tharushi submitted Depreciation Methods', body: 'Score 72% · 2027', time: '34 min ago' },
  { id: 'n3', title: 'Revision mock window opens Thursday', body: '24 Sep · all-day sitting', time: '1 hr ago' },
];
