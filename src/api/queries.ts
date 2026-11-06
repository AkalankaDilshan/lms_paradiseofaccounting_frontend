/**
 * Typed React Query hooks shared across pages. Query keys match the ones the
 * pages already invalidate after mutations ('students', 'payments', …), so
 * every screen reading the same endpoint shares one cache entry.
 */
import { useQuery } from '@tanstack/react-query';
import { apiClient } from './client';

// ── Types ────────────────────────────────────────────────────────────────────

export type QuizState = 'upcoming' | 'open' | 'closed';

/** GET /quizzes as a student: their groups' quizzes with their own attempt summary. */
export interface StudentQuiz {
  quizId: string;
  title: string;
  openAt: string;
  closeAt: string;
  durationMinutes: number;
  maxAttempts: number;
  allowedGroups: string[];
  questionCount: number;
  answersVisibility: 'immediate' | 'afterClose';
  state: QuizState;
  attemptsUsed: number;
  hasOpenAttempt: boolean;
  bestScore: number | null;
  bestMaxScore: number | null;
  lastAttemptId: string | null;
}

export interface Announcement {
  announcementId: string;
  title: string;
  body: string;
  targetGroups: string[];
  isPinned: boolean;
  status?: 'published' | 'draft';
  createdAt: string;
}

export interface Material {
  materialId: string;
  title: string;
  description: string;
  fileKey: string;
  fileType: string;
  createdAt: string;
}

export interface TrendItem {
  attemptId?: string;
  quizId: string;
  quizTitle: string;
  score: number;
  maxScore: number;
  percentage?: number;
  submittedAt: string;
}

export interface StaffUser {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  status: 'active' | 'pending' | 'suspended' | string;
  createdAt?: string;
  suspendedAt?: string;
  groups?: string[];
}

export interface Overview {
  /** When the server computed these numbers (cached up to 5 minutes) */
  cachedAt?: string;
  students: { total: number; active: number; pending: number; suspended: number };
  quizzes: { total: number; open: number; upcoming: number };
  attempts: {
    total: number;
    last30Days: number;
    studentsActiveLast30Days: number;
    averagePercentage: number;
    averagePercentageLast30Days: number;
  };
  monthly: { month: string; attempts: number; averagePercentage: number | null }[];
  recentAttempts: {
    attemptId: string;
    quizId: string;
    quizTitle: string;
    userId: string;
    studentName: string;
    score: number;
    maxScore: number;
    percentage: number;
    submittedAt: string;
  }[];
}

export interface PaymentRow {
  userId: string;
  firstName: string;
  lastName: string;
  groups: string[];
  currentMonth: { status: 'paid' | 'pending' | 'overdue' | 'waived'; paidAt: string | null; amount: number };
  history: { month: string; status: string }[];
}

// ── Hooks ────────────────────────────────────────────────────────────────────

export const percent = (score: number, max: number) => (max ? Math.round((score / max) * 1000) / 10 : 0);

export function useStudentQuizzes(enabled = true) {
  return useQuery({
    queryKey: ['studentQuizzes'],
    meta: { errorContext: 'load your quizzes' },
    queryFn: async () => ((await apiClient.get('/quizzes')).data ?? []) as StudentQuiz[],
    enabled,
  });
}

export function useAnnouncements(enabled = true) {
  return useQuery({
    queryKey: ['announcements'],
    meta: { errorContext: 'load announcements' },
    queryFn: async () => ((await apiClient.get('/announcements')).data.items ?? []) as Announcement[],
    enabled,
  });
}

export function useMaterials(enabled = true) {
  return useQuery({
    queryKey: ['materials'],
    meta: { errorContext: 'load study materials' },
    queryFn: async () => ((await apiClient.get('/materials')).data.items ?? []) as Material[],
    enabled,
  });
}

export function useTrend(userId: string | undefined) {
  return useQuery({
    queryKey: ['trend', userId],
    meta: { errorContext: 'load your results' },
    queryFn: async () => {
      const items = ((await apiClient.get(`/analytics/students/${userId}/trend`)).data.items ?? []) as TrendItem[];
      return [...items].sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
    },
    enabled: !!userId,
  });
}

export function useOverview(enabled = true) {
  return useQuery({
    queryKey: ['overview'],
    meta: { errorContext: 'load the class overview' },
    queryFn: async () => (await apiClient.get('/analytics/overview')).data as Overview,
    enabled,
  });
}

export function useStudents(enabled = true) {
  return useQuery({
    queryKey: ['students'],
    meta: { errorContext: 'load the student list' },
    queryFn: async () => ((await apiClient.get('/admin/students')).data.items ?? []) as StaffUser[],
    enabled,
  });
}

export function usePayments(enabled = true) {
  return useQuery({
    queryKey: ['payments'],
    meta: { errorContext: 'load payments' },
    queryFn: async () => ((await apiClient.get('/payments')).data.items ?? []) as PaymentRow[],
    enabled,
  });
}

export function useTeachingAssistants(enabled = true) {
  return useQuery({
    queryKey: ['tas'],
    meta: { errorContext: 'load the teaching team' },
    queryFn: async () => ((await apiClient.get('/admin/tas')).data.items ?? []) as StaffUser[],
    enabled,
  });
}

/** GET /quizzes as staff: every non-archived quiz (raw quiz items). */
export interface TeacherQuiz {
  quizId: string;
  title: string;
  openAt: string;
  closeAt: string;
  durationMinutes: number;
  maxAttempts: number;
  allowedGroups: string[];
  questionIds: string[];
  answersVisibility?: 'immediate' | 'afterClose';
  archived: boolean;
}

export function useTeacherQuizzes(enabled = true) {
  return useQuery({
    queryKey: ['teacherQuizzes'],
    meta: { errorContext: 'load quizzes' },
    queryFn: async () => ((await apiClient.get('/quizzes')).data ?? []) as TeacherQuiz[],
    enabled,
  });
}
