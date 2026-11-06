import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './components/theme-provider';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { FeedbackHost } from './components/feedback/FeedbackHost';
import { PwaManager } from './components/feedback/PwaManager';
import { notifyError, toast } from './lib/feedback';
import { Provider as JotaiProvider } from 'jotai';
import { lazy, Suspense } from 'react';
import type { ReactNode } from 'react';

// Pages load on demand: a student's phone never downloads the teacher screens
const SignupPage = lazy(() => import('./pages/auth/SignupPage').then((m) => ({ default: m.SignupPage })));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));
const PendingApprovalPage = lazy(() => import('./pages/auth/PendingApprovalPage').then((m) => ({ default: m.PendingApprovalPage })));
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard').then((m) => ({ default: m.StudentDashboard })));
const StudentQuizzes = lazy(() => import('./pages/student/StudentQuizzes').then((m) => ({ default: m.StudentQuizzes })));
const StudentProfile = lazy(() => import('./pages/student/StudentProfile').then((m) => ({ default: m.StudentProfile })));
const QuizAttempt = lazy(() => import('./pages/student/QuizAttempt').then((m) => ({ default: m.QuizAttempt })));
const QuizResults = lazy(() => import('./pages/student/QuizResults').then((m) => ({ default: m.QuizResults })));
const StudentTrend = lazy(() => import('./pages/student/StudentTrend').then((m) => ({ default: m.StudentTrend })));
const AnnouncementsPage = lazy(() => import('./pages/student/AnnouncementsPage').then((m) => ({ default: m.AnnouncementsPage })));
const MessagesPage = lazy(() => import('./pages/student/MessagesPage').then((m) => ({ default: m.MessagesPage })));
const MaterialsPage = lazy(() => import('./pages/student/MaterialsPage').then((m) => ({ default: m.MaterialsPage })));
const TeacherDashboard = lazy(() => import('./pages/teacher/TeacherDashboard').then((m) => ({ default: m.TeacherDashboard })));
const QuizList = lazy(() => import('./pages/teacher/QuizList').then((m) => ({ default: m.QuizList })));
const QuestionBank = lazy(() => import('./pages/teacher/QuestionBank').then((m) => ({ default: m.QuestionBank })));
const QuizBuilder = lazy(() => import('./pages/teacher/QuizBuilder').then((m) => ({ default: m.QuizBuilder })));
const QuestionForm = lazy(() => import('./pages/teacher/QuestionForm').then((m) => ({ default: m.QuestionForm })));
const StudentManagement = lazy(() => import('./pages/teacher/StudentManagement').then((m) => ({ default: m.StudentManagement })));
const QuizAnalytics = lazy(() => import('./pages/teacher/QuizAnalytics').then((m) => ({ default: m.QuizAnalytics })));
const SettingsPage = lazy(() => import('./pages/teacher/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const TeamPage = lazy(() => import('./pages/teacher/TeamPage').then((m) => ({ default: m.TeamPage })));
const PaymentsPage = lazy(() => import('./pages/teacher/PaymentsPage').then((m) => ({ default: m.PaymentsPage })));
const StudentPaymentHistory = lazy(() => import('./pages/teacher/StudentPaymentHistory').then((m) => ({ default: m.StudentPaymentHistory })));
const AttendancePage = lazy(() => import('./pages/teacher/AttendancePage').then((m) => ({ default: m.AttendancePage })));
const TeacherMaterialsPage = lazy(() => import('./pages/teacher/MaterialsPage').then((m) => ({ default: m.MaterialsPage })));
const TeacherAnnouncementsPage = lazy(() => import('./pages/teacher/AnnouncementsPage').then((m) => ({ default: m.AnnouncementsPage })));
const TeacherMessagesPage = lazy(() => import('./pages/teacher/MessagesPage').then((m) => ({ default: m.MessagesPage })));

/**
 * Every failed request reports itself (toast, or a blocking dialog for
 * critical errors) unless it opts out with meta.errorToast = false — used where
 * the page already shows the error inline. meta.errorContext names the action
 * ("load quizzes"), meta.successMessage adds a success toast to a mutation.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // A 4xx won't fix itself — fail fast instead of retrying three times
      retry: (count, err) => !(isAxiosError(err) && err.response && err.response.status < 500) && count < 2,
    },
  },
  queryCache: new QueryCache({
    onError: (err, query) => {
      if (query.meta?.errorToast === false) return;
      // A background refresh failing while good data is on screen isn't worth an interruption
      if (query.state.data !== undefined && !(isAxiosError(err) && err.response?.status === 401)) return;
      notifyError(err, query.meta?.errorContext ?? 'load this page’s data');
    },
  }),
  mutationCache: new MutationCache({
    onError: (err, _vars, _ctx, mutation) => {
      if (mutation.meta?.errorToast === false) return;
      notifyError(err, mutation.meta?.errorContext ?? 'save your changes');
    },
    onSuccess: (_data, _vars, _ctx, mutation) => {
      if (mutation.meta?.successMessage) toast.success(mutation.meta.successMessage, mutation.meta.successDetail);
    },
  }),
});

function ProtectedRoute({ children, allowedRoles }: { children: ReactNode; allowedRoles: string[] }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <img src="/logoIcon.png" alt="" className="size-12 animate-pulse rounded-xl" />
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  // Authenticated but no recognized Cognito group at all — a self-signed-up
  // student still awaiting SuperAdmin/TA approval (see post_confirmation.py).
  if (!user?.role) return <Navigate to="/pending-approval" replace />;
  // Recognized role, just the wrong area (e.g. a TA hitting /student/*) —
  // send them to their own home instead of the pending-approval message.
  if (!allowedRoles.includes(user.role)) return <Navigate to={user.role === 'Student' ? '/student' : '/teacher'} replace />;

  return children;
}

function RouteFallback() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background">
      <img src="/logoIcon.png" alt="" className="size-12 animate-pulse rounded-xl" />
    </div>
  );
}

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();
  const home = !user?.role ? '/pending-approval' : user.role === 'Student' ? '/student' : '/teacher';

  return (
    <Suspense fallback={<RouteFallback />}>
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to={home} /> : <LoginPage />} />
      <Route path="/signup" element={isAuthenticated ? <Navigate to={home} /> : <SignupPage />} />
      <Route path="/forgot-password" element={isAuthenticated ? <Navigate to={home} /> : <ForgotPasswordPage />} />
      <Route
        path="/pending-approval"
        element={!isAuthenticated ? <Navigate to="/login" replace /> : user?.role ? <Navigate to={home} replace /> : <PendingApprovalPage />}
      />

      <Route element={<AppLayout />}>
        <Route
          path="/student/*"
          element={
            <ProtectedRoute allowedRoles={['Student']}>
              <Routes>
                <Route path="/" element={<StudentDashboard />} />
                <Route path="/quizzes" element={<StudentQuizzes />} />
                <Route path="/trend" element={<StudentTrend />} />
                <Route path="/profile" element={<StudentProfile />} />
                <Route path="/announcements" element={<AnnouncementsPage />} />
                <Route path="/messages" element={<MessagesPage />} />
                <Route path="/materials" element={<MaterialsPage />} />
                <Route path="/quizzes/:id/attempt" element={<QuizAttempt />} />
                <Route path="/quizzes/:id/results/:attemptId" element={<QuizResults />} />
              </Routes>
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/*"
          element={
            <ProtectedRoute allowedRoles={['TA', 'SuperAdmin']}>
              <Routes>
                <Route path="/" element={<TeacherDashboard />} />
                <Route path="/quizzes" element={<QuizList />} />
                <Route path="/quizzes/new" element={<QuizBuilder />} />
                <Route path="/quizzes/:id/edit" element={<QuizBuilder />} />
                <Route path="/quizzes/:id/analytics" element={<QuizAnalytics />} />
                <Route path="/questions" element={<QuestionBank />} />
                <Route path="/questions/new" element={<QuestionForm />} />
                <Route path="/questions/:id/edit" element={<QuestionForm />} />
                <Route path="/analytics" element={<QuizAnalytics />} />
                <Route path="/students" element={<StudentManagement />} />
                <Route path="/payments" element={<PaymentsPage />} />
                <Route path="/payments/:studentId" element={<StudentPaymentHistory />} />
                <Route path="/attendance" element={<AttendancePage />} />
                <Route path="/announcements" element={<TeacherAnnouncementsPage role="teacher" />} />
                <Route path="/messages" element={<TeacherMessagesPage role="teacher" />} />
                <Route path="/materials" element={<TeacherMaterialsPage role="teacher" />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/team" element={<TeamPage />} />
              </Routes>
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="lms-theme">
      <JotaiProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <Router>
              <AppRoutes />
              <PwaManager />
            </Router>
            <FeedbackHost />
          </AuthProvider>
        </QueryClientProvider>
      </JotaiProvider>
    </ThemeProvider>
  );
}

export default App;
