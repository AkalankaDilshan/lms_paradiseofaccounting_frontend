import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './components/theme-provider';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { QuizAttempt } from './pages/student/QuizAttempt';
import { QuizResults } from './pages/student/QuizResults';
import { StudentTrend } from './pages/student/StudentTrend';
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { QuestionBank } from './pages/teacher/QuestionBank';
import { QuizBuilder } from './pages/teacher/QuizBuilder';
import { StudentManagement } from './pages/teacher/StudentManagement';
import { QuizAnalytics } from './pages/teacher/QuizAnalytics';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const queryClient = new QueryClient();

function ProtectedRoute({ children, allowedRoles }: { children: ReactNode, allowedRoles: string[] }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role && !allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" replace />;

  return children;
}

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();
  
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to={user?.role === 'Student' ? "/student" : "/teacher"} /> : <LoginPage />} />
      <Route path="/signup" element={isAuthenticated ? <Navigate to={user?.role === 'Student' ? "/student" : "/teacher"} /> : <SignupPage />} />
      <Route path="/forgot-password" element={isAuthenticated ? <Navigate to={user?.role === 'Student' ? "/student" : "/teacher"} /> : <ForgotPasswordPage />} />
      
      {/* Protected Routes wrapped in Layout */}
      <Route element={<AppLayout />}>
        <Route path="/student/*" element={
          <ProtectedRoute allowedRoles={['Student']}>
            <Routes>
              <Route path="/" element={<StudentDashboard />} />
              <Route path="/trend" element={<StudentTrend />} />
              <Route path="/quizzes/:id/attempt" element={<QuizAttempt />} />
              <Route path="/quizzes/:id/results/:attemptId" element={<QuizResults />} />
            </Routes>
          </ProtectedRoute>
        } />
        <Route path="/teacher/*" element={
          <ProtectedRoute allowedRoles={['TA', 'SuperAdmin']}>
            <Routes>
              <Route path="/" element={<TeacherDashboard />} />
              <Route path="/questions" element={<QuestionBank />} />
              <Route path="/questions/new" element={<QuestionBank />} />
              <Route path="/quizzes" element={<TeacherDashboard />} />
              <Route path="/quizzes/new" element={<QuizBuilder />} />
              <Route path="/quizzes/:id/analytics" element={<QuizAnalytics />} />
              <Route path="/students" element={<StudentManagement />} />
            </Routes>
          </ProtectedRoute>
        } />
      </Route>
      
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="lms-theme">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <AppRoutes />
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
