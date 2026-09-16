import { useEffect, useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ThemeToggle } from '../theme-toggle';
import { Avatar } from '../ui/avatar';
import { BarChart3, BookOpen, ChevronLeft, ClipboardList, Home, LogOut, Menu, Settings, Users, X } from 'lucide-react';
import { Button } from '../ui/button';

export function AppLayout() {
  const { user, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isStudent = user?.role === 'Student';

  const navItems = isStudent
    ? [
        { name: 'Dashboard', path: '/student', icon: Home },
        { name: 'Performance', path: '/student/trend', icon: BarChart3 },
        { name: 'Profile', path: '/student/profile', icon: Settings },
      ]
    : [
        { name: 'Overview', path: '/teacher', icon: Home },
        { name: 'Quiz builder', path: '/teacher/quizzes/new', icon: ClipboardList },
        { name: 'Question bank', path: '/teacher/questions', icon: BookOpen },
        { name: 'Students', path: '/teacher/students', icon: Users },
      ];

  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen]);

  const displayName = user?.username || (isStudent ? 'Student' : 'Teacher');
  const closeMobile = () => setMobileOpen(false);
  const nav = (
    <>
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-lg font-black text-primary-foreground">A</div>
          {!collapsed && <div><p className="font-bold tracking-tight">Asela LMS</p><p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Accounting studio</p></div>}
        </div>
        <button className="hidden rounded-lg p-1.5 text-muted-foreground hover:bg-white/10 hover:text-foreground lg:block" onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar"><ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} /></button>
        <button className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/10 lg:hidden" onClick={closeMobile} aria-label="Close menu"><X className="h-5 w-5" /></button>
      </div>
      <div className="px-3 py-6"><p className={`mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ${collapsed ? 'text-center' : ''}`}>{collapsed ? '•' : 'Workspace'}</p><nav className="space-y-1">
        {navItems.map((item) => <NavLink key={item.path} to={item.path} onClick={closeMobile} end={item.path === '/student' || item.path === '/teacher'} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${isActive ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-white/10 hover:text-foreground'} ${collapsed ? 'justify-center' : ''}`}><item.icon className="h-[18px] w-[18px] shrink-0" />{!collapsed && <span>{item.name}</span>}</NavLink>)}
      </nav></div>
      <div className="mt-auto border-t border-white/10 p-3"><div className={`mb-3 flex items-center gap-3 rounded-xl bg-white/5 p-3 ${collapsed ? 'justify-center' : ''}`}><Avatar id={user?.username || 'guest'} name={displayName} size="sm" seedAvatar={false} />{!collapsed && <div className="min-w-0"><p className="truncate text-sm font-medium">{displayName}</p><p className="text-xs text-muted-foreground">{user?.role || 'Guest'}</p></div>}</div><Button variant="ghost" className={`w-full text-muted-foreground hover:bg-rose-500/10 hover:text-rose-400 ${collapsed ? 'justify-center px-0' : 'justify-start'}`} onClick={signOut}><LogOut className="mr-3 h-4 w-4" />{!collapsed && 'Sign out'}</Button></div>
    </>
  );

  return <div className="min-h-screen bg-[#09090b] text-foreground dark:bg-[#09090b] md:flex"><aside className={`hidden border-r border-white/10 bg-[#101014] transition-all lg:flex lg:min-h-screen lg:flex-col ${collapsed ? 'lg:w-[84px]' : 'lg:w-64'}`}>{nav}</aside>{mobileOpen && <div className="fixed inset-0 z-50 lg:hidden"><button className="absolute inset-0 bg-black/70" onClick={closeMobile} aria-label="Close navigation" /><aside className="relative flex h-full w-72 flex-col border-r border-white/10 bg-[#101014]">{nav}</aside></div>}<main className="min-w-0 flex-1"><header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 bg-[#09090b]/90 px-4 backdrop-blur-md md:px-8"><div className="flex items-center gap-3"><button className="rounded-lg p-2 text-muted-foreground hover:bg-white/10 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation" aria-expanded={mobileOpen}><Menu className="h-5 w-5" /></button><span className="text-sm text-muted-foreground">{isStudent ? 'Student workspace' : 'Teacher workspace'}</span></div><ThemeToggle /></header><div className="mx-auto max-w-[1440px] p-4 md:p-8"><Outlet /></div></main></div>;
}
