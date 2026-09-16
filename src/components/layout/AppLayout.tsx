import { useEffect, useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ThemeToggle } from '../theme-toggle';
import { Avatar } from '../ui/avatar';
import { BarChart3, Bell, BookOpen, ClipboardList, Home, Languages, LogOut, Mail, Menu, PanelLeftClose, PanelLeftOpen, Search, Settings, ShoppingCart, Users, X } from 'lucide-react';
import { Button } from '../ui/button';

export function AppLayout() {
  const { user, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isStudent = user?.role === 'Student';
  const navItems = isStudent ? [
    { name: 'Dashboard', path: '/student', icon: Home },
    { name: 'Performance', path: '/student/trend', icon: BarChart3 },
    { name: 'Profile', path: '/student/profile', icon: Settings },
  ] : [
    { name: 'Overview', path: '/teacher', icon: Home },
    { name: 'Quiz builder', path: '/teacher/quizzes/new', icon: ClipboardList },
    { name: 'Question bank', path: '/teacher/questions', icon: BookOpen },
    { name: 'Students', path: '/teacher/students', icon: Users },
  ];
  const displayName = user?.username || (isStudent ? 'Student' : 'Teacher');
  const closeMobile = () => setMobileOpen(false);

  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setMobileOpen(false); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen]);

  const nav = <>
    <div className="flex items-center justify-between border-b border-border px-5 py-5">
      <div className="flex items-center gap-3 overflow-hidden"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-lg font-black text-primary-foreground">A</div>{!collapsed && <div><p className="font-bold tracking-tight">Asela LMS</p><p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Accounting studio</p></div>}</div>
      <button className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted lg:hidden" onClick={closeMobile} aria-label="Close menu"><X className="h-5 w-5" /></button>
    </div>
    <div className="px-3 py-6"><p className={`mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ${collapsed ? 'text-center' : ''}`}>{collapsed ? '•' : 'Workspace'}</p><nav className="space-y-1">{navItems.map((item) => <NavLink key={item.path} to={item.path} onClick={closeMobile} end={item.path === '/student' || item.path === '/teacher'} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${isActive ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-muted hover:text-foreground'} ${collapsed ? 'justify-center' : ''}`}><item.icon className="h-[18px] w-[18px] shrink-0" />{!collapsed && <span>{item.name}</span>}</NavLink>)}</nav></div>
    <div className="mt-auto border-t border-border p-3"><div className={`mb-3 flex items-center gap-3 rounded-xl bg-muted/60 p-3 ${collapsed ? 'justify-center' : ''}`}><Avatar id={user?.username || 'guest'} name={displayName} size="sm" />{!collapsed && <div className="min-w-0"><p className="truncate text-sm font-medium">{displayName}</p><p className="text-xs text-muted-foreground">{user?.role || 'Guest'}</p></div>}</div><Button variant="ghost" className={`w-full text-muted-foreground hover:bg-rose-500/10 hover:text-rose-400 ${collapsed ? 'justify-center px-0' : 'justify-start'}`} onClick={signOut}><LogOut className="mr-3 h-4 w-4" />{!collapsed && 'Sign out'}</Button></div>
  </>;

  return <div className="min-h-screen bg-background text-foreground md:flex"><aside className={`hidden border-r border-border bg-card transition-all lg:flex lg:min-h-screen lg:flex-col ${collapsed ? 'lg:w-[84px]' : 'lg:w-64'}`}>{nav}</aside>{mobileOpen && <div className="fixed inset-0 z-50 lg:hidden"><button className="absolute inset-0 bg-black/70" onClick={closeMobile} aria-label="Close navigation" /><aside className="relative flex h-full w-72 flex-col border-r border-border bg-card">{nav}</aside></div>}<main className="min-w-0 flex-1"><header className="sticky top-0 z-30 flex h-[58px] items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur-md md:px-6"><button className="rounded-lg p-2 text-muted-foreground hover:bg-muted lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation" aria-expanded={mobileOpen}><Menu className="h-5 w-5" /></button><button className="hidden rounded-md border border-border bg-card p-2 text-muted-foreground shadow-sm hover:bg-muted lg:block" onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar" aria-expanded={!collapsed}>{collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}</button><div className="relative hidden w-full max-w-[300px] md:block"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input aria-label="Search" placeholder="Search..." className="h-9 w-full rounded-md border border-border bg-card pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary" /></div><div className="ml-auto flex items-center gap-1"><span className="hidden text-sm text-muted-foreground lg:block">{isStudent ? 'Student workspace' : 'Teacher workspace'}</span><div className="mx-1 hidden h-5 w-px bg-border sm:block" /><IconButton label="Change language"><Languages className="h-4 w-4" /></IconButton><IconButton label="Cart"><ShoppingCart className="h-4 w-4" /><span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-1 text-[9px] text-primary-foreground">2</span></IconButton><IconButton label="Notifications"><Bell className="h-4 w-4" /><span className="absolute right-0 top-0 h-1.5 w-1.5 rounded-full bg-rose-500" /></IconButton><IconButton label="Messages"><Mail className="h-4 w-4" /></IconButton><ThemeToggle /><div className="ml-1 hidden h-7 w-px bg-border sm:block" /><button className="ml-1 flex items-center gap-2 rounded-md p-1.5 hover:bg-muted" aria-label="Open profile menu"><Avatar id={user?.username || 'guest'} name={displayName} size="sm" /><span className="hidden max-w-24 truncate text-sm font-medium xl:block">{displayName}</span></button></div></header><div className="mx-auto max-w-[1440px] p-4 md:p-8"><Outlet /></div></main></div>;
}

function IconButton({ label, children }: { label: string; children: React.ReactNode }) { return <button className="relative rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={label}>{children}</button>; }
