import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ThemeToggle } from '../theme-toggle';
import { Home, ListTodo, LogOut, Settings, BarChart } from 'lucide-react';
import { Button } from '../ui/button';

export function AppLayout() {
  const { user, signOut } = useAuth();
  
  const isStudent = user?.role === 'Student';
  
  const studentNav = [
    { name: 'Dashboard', path: '/student', icon: Home },
    { name: 'Trend', path: '/student/trend', icon: BarChart },
    { name: 'Profile', path: '/student/profile', icon: Settings },
  ];
  
  const teacherNav = [
    { name: 'Dashboard', path: '/teacher', icon: Home },
    { name: 'Quizzes', path: '/teacher/quizzes', icon: ListTodo },
    { name: 'Questions', path: '/teacher/questions', icon: ListTodo },
    { name: 'Students', path: '/teacher/students', icon: Settings },
  ];

  const navItems = isStudent ? studentNav : teacherNav;

  return (
    <div className="flex h-screen w-full bg-background flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r bg-card h-full">
        <div className="p-4 border-b flex items-center justify-between">
          <span className="font-bold text-lg text-primary">Asela LMS</span>
          <ThemeToggle />
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  isActive ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-muted-foreground'
                }`
              }
              end={item.path === '/student' || item.path === '/teacher'}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t">
          <Button variant="ghost" className="w-full justify-start text-destructive" onClick={signOut}>
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b bg-card">
          <span className="font-bold text-lg text-primary">Asela LMS</span>
          <ThemeToggle />
        </header>
        
        <div className="p-4 md:p-8 max-w-7xl mx-auto h-full">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Tab Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t flex items-center justify-around z-50">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full min-w-[44px] min-h-[44px] transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`
            }
            end={item.path === '/student' || item.path === '/teacher'}
          >
            <item.icon className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-medium">{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
