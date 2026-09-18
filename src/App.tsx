import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './components/theme-provider';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { PendingApprovalPage } from './pages/auth/PendingApprovalPage';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentProfile } from './pages/student/StudentProfile';
import { QuizAttempt } from './pages/student/QuizAttempt';
import { QuizResults } from './pages/student/QuizResults';
import { StudentTrend } from './pages/student/StudentTrend';
import { AnnouncementsPage } from './pages/student/AnnouncementsPage';
import { MessagesPage } from './pages/student/MessagesPage';
import { MaterialsPage } from './pages/student/MaterialsPage';
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { QuizList } from './pages/teacher/QuizList';
import { QuestionBank } from './pages/teacher/QuestionBank';
import { QuizBuilder } from './pages/teacher/QuizBuilder';
import { QuestionForm } from './pages/teacher/QuestionForm';
import { StudentManagement } from './pages/teacher/StudentManagement';
import { QuizAnalytics } from './pages/teacher/QuizAnalytics';
import { SettingsPage } from './pages/teacher/SettingsPage';
import { PaymentsPage } from './pages/teacher/PaymentsPage';
import { StudentPaymentHistory } from './pages/teacher/StudentPaymentHistory';
import { AttendancePage } from './pages/teacher/AttendancePage';
import { MaterialsPage as TeacherMaterialsPage } from './pages/teacher/MaterialsPage';
import { AnnouncementsPage as TeacherAnnouncementsPage } from './pages/teacher/AnnouncementsPage';
import { MessagesPage as TeacherMessagesPage } from './pages/teacher/MessagesPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as JotaiProvider } from 'jotai';
import type { ReactNode } from 'react';

const queryClient = new QueryClient();

function ProtectedRoute({ children, allowedRoles }: { children: ReactNode; allowedRoles: string[] }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
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

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();
  const home = !user?.role ? '/pending-approval' : user.role === 'Student' ? '/student' : '/teacher';

  return (
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
              </Routes>
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="lms-theme">
      <JotaiProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <Router>
              <AppRoutes />
            </Router>
          </AuthProvider>
        </QueryClientProvider>
      </JotaiProvider>
    </ThemeProvider>
  );
}

export default App;
