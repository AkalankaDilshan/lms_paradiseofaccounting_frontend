import { useEffect, useMemo, useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import {
  BarChart3,
  BookOpen,
  ChevronRight,
  ClipboardList,
  Home,
  LogOut,
  Mail,
  Megaphone,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  PenSquare,
  Search,
  Settings,
  ShieldCheck,
  Users,
  X,
  Library,
  Wallet,
  CalendarCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import type { DemoRole } from '../../contexts/AuthContext';
import { ThemeToggle } from '../theme-toggle';
import { Avatar } from '../ui/avatar';
import { Button, buttonVariants } from '../ui/button';
import { Input } from '../ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { NotificationBell } from './NotificationBell';
import { ErrorBoundary } from '../feedback/ErrorBoundary';
import { cn } from '../../lib/utils';

interface NavItem {
  name: string;
  path: string;
  icon: LucideIcon;
  superAdminOnly?: boolean;
}

const teacherNav: { label: string; items: NavItem[] }[] = [
  {
    label: 'Home',
    items: [{ name: 'Overview', path: '/teacher', icon: Home }],
  },
  {
    label: 'Learning',
    items: [
      { name: 'Quizzes', path: '/teacher/quizzes', icon: ClipboardList },
      { name: 'Quiz builder', path: '/teacher/quizzes/new', icon: PenSquare },
      { name: 'Question bank', path: '/teacher/questions', icon: BookOpen },
      { name: 'Analytics', path: '/teacher/analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Students',
    items: [
      { name: 'Students', path: '/teacher/students', icon: Users },
      { name: 'Attendance', path: '/teacher/attendance', icon: CalendarCheck },
      { name: 'Payments', path: '/teacher/payments', icon: Wallet },
    ],
  },
  {
    label: 'Communication',
    items: [
      { name: 'Announcements', path: '/teacher/announcements', icon: Megaphone },
      { name: 'Messages', path: '/teacher/messages', icon: Mail },
      { name: 'Materials', path: '/teacher/materials', icon: Library },
    ],
  },
  {
    label: 'Admin',
    items: [{ name: 'Teaching team', path: '/teacher/team', icon: ShieldCheck, superAdminOnly: true }],
  },
];

const studentNav: { label: string; items: NavItem[] }[] = [
  {
    label: 'Home',
    items: [
      { name: 'Dashboard', path: '/student', icon: Home },
      { name: 'My quizzes', path: '/student/quizzes', icon: ClipboardList },
      { name: 'Performance', path: '/student/trend', icon: BarChart3 },
    ],
  },
  {
    label: 'Class',
    items: [
      { name: 'Announcements', path: '/student/announcements', icon: Megaphone },
      { name: 'Messages', path: '/student/messages', icon: Mail },
      { name: 'Materials', path: '/student/materials', icon: Library },
    ],
  },
];

const crumbs: Record<string, string> = {
  '/teacher': 'Overview',
  '/teacher/quizzes': 'Quizzes',
  '/teacher/quizzes/new': 'Quiz builder',
  '/teacher/questions': 'Question bank',
  '/teacher/students': 'Students',
  '/teacher/analytics': 'Analytics',
  '/teacher/settings': 'Settings',
  '/teacher/attendance': 'Attendance',
  '/teacher/payments': 'Payments',
  '/teacher/announcements': 'Announcements',
  '/teacher/messages': 'Messages',
  '/teacher/materials': 'Materials',
  '/teacher/team': 'Teaching team',
  '/student': 'Dashboard',
  '/student/quizzes': 'My quizzes',
  '/student/trend': 'Performance',
  '/student/profile': 'My profile',
  '/student/announcements': 'Announcements',
  '/student/messages': 'Messages',
  '/student/materials': 'Study materials',
};

export function AppLayout() {
  const { user, signOut, switchRole, isDemo } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState('');
  const isStudent = user?.role === 'Student';
  const isSuperAdmin = user?.role === 'SuperAdmin';
  const displayName = user?.name || user?.username || (isStudent ? 'Student' : 'Teacher');
  const settingsPath = isStudent ? '/student/profile' : '/teacher/settings';
  const closeMobile = () => setMobileOpen(false);

  const filteredGroups = useMemo(() => {
    const groups = (isStudent ? studentNav : teacherNav)
      .map((group) => ({ ...group, items: group.items.filter((item) => !item.superAdminOnly || isSuperAdmin) }))
      .filter((group) => group.items.length > 0);
    const needle = query.trim().toLowerCase();
    if (!needle) return groups;
    return groups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => item.name.toLowerCase().includes(needle)),
      }))
      .filter((group) => group.items.length > 0);
  }, [isStudent, isSuperAdmin, query]);

  // Close the drawer on navigation and on Escape
  useEffect(() => setMobileOpen(false), [location.pathname]);
  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen]);

  const handleRoleSwitch = (role: DemoRole) => {
    switchRole(role);
    navigate(role === 'Student' ? '/student' : '/teacher');
  };

  const handleSignOut = () => {
    signOut();
    navigate('/login');
  };

  const crumb = Object.keys(crumbs)
    .sort((a, b) => b.length - a.length)
    .find((path) => location.pathname === path || location.pathname.startsWith(`${path}/`));
  const pageName = (crumb && crumbs[crumb]) || (isStudent ? 'Dashboard' : 'Overview');

  const navLinkClass = (isActive: boolean) =>
    cn(
      'relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground',
      !isActive && 'hover:bg-muted/60',
      isActive && 'text-foreground',
      collapsed && 'justify-center px-0',
    );

  const renderNav = (idPrefix: string) => (
    <>
      <div className={cn('flex items-center gap-3 px-4 py-5', collapsed && 'justify-center px-2')}>
        <img src="/logoIcon.png" alt="Asela LMS" className="size-9 rounded-xl object-cover shadow-sm ring-1 ring-border" />
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight">Asela LMS</p>
            <p className="truncate text-[11px] text-muted-foreground">Paradise of Accounting</p>
          </div>
        )}
        <button
          className="ml-auto rounded-md p-1.5 text-muted-foreground hover:bg-muted lg:hidden"
          onClick={closeMobile}
          aria-label="Close menu"
          type="button"
        >
          <X className="size-4" />
        </button>
      </div>

      {!collapsed && (
        <div className="px-3 pb-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Jump to…"
              aria-label="Search navigation"
              className="h-8 bg-muted/40 pl-8"
            />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {filteredGroups.map((group) => (
          <div key={group.label} className="mb-4">
            <p
              className={cn(
                'mb-1 px-2 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground/80',
                collapsed && 'text-center',
              )}
            >
              {collapsed ? '•' : group.label}
            </p>
            <nav className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/student' || item.path === '/teacher' || item.path === '/teacher/quizzes'}
                  title={item.name}
                  className={({ isActive }) => navLinkClass(isActive)}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.span
                          layoutId={`${idPrefix}-nav-active`}
                          className="absolute inset-0 rounded-lg bg-muted ring-1 ring-border/60"
                          transition={{ type: 'spring', bounce: 0.18, duration: 0.45 }}
                        />
                      )}
                      {isActive && !collapsed && (
                        <motion.span
                          layoutId={`${idPrefix}-nav-bar`}
                          className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary"
                          transition={{ type: 'spring', bounce: 0.18, duration: 0.45 }}
                        />
                      )}
                      <item.icon className={cn('relative size-4 shrink-0', isActive && 'text-primary')} />
                      {!collapsed && <span className="relative">{item.name}</span>}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
        ))}
        {filteredGroups.length === 0 && <p className="px-2 text-xs text-muted-foreground">No matches.</p>}
      </div>

      <div className="mt-auto space-y-1 border-t border-border p-3">
        <NavLink to={settingsPath} title="Settings" className={({ isActive }) => cn(navLinkClass(isActive), isActive && 'bg-muted')}>
          <Settings className="size-4 shrink-0" />
          {!collapsed && <span>{isStudent ? 'My profile' : 'Settings'}</span>}
        </NavLink>
        <div className={cn('flex items-center gap-2.5 rounded-lg px-2 py-2', collapsed && 'justify-center')}>
          <Avatar id={user?.sub || 'guest'} name={displayName} size="sm" />
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{displayName}</p>
              <p className="truncate text-[11px] text-muted-foreground">{user?.role || 'Guest'}</p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          className={cn(
            'h-8 w-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive',
            collapsed ? 'justify-center px-0' : 'justify-start',
          )}
          onClick={handleSignOut}
        >
          <LogOut className="size-4" />
          {!collapsed && 'Sign out'}
        </Button>
      </div>
    </>
  );

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-svh text-foreground lg:flex">
        <aside
          className={cn(
            'sticky top-0 hidden h-svh border-r border-border bg-background/70 backdrop-blur-xl transition-[width] duration-300 lg:flex lg:flex-col',
            collapsed ? 'lg:w-[72px]' : 'lg:w-64',
          )}
        >
          {renderNav('desktop')}
        </aside>

        <AnimatePresence>
          {mobileOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <motion.button
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={closeMobile}
                aria-label="Close navigation"
                type="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
              <motion.aside
                className="relative flex h-full w-72 flex-col border-r border-border bg-background shadow-2xl"
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
              >
                {renderNav('mobile')}
              </motion.aside>
            </div>
          )}
        </AnimatePresence>

        <main className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/75 px-3 backdrop-blur-xl md:px-5">
            <button
              className="rounded-md p-2 text-muted-foreground hover:bg-muted lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
              aria-expanded={mobileOpen}
              type="button"
            >
              <Menu className="size-4" />
            </button>
            <button
              className="hidden rounded-md p-2 text-muted-foreground hover:bg-muted lg:inline-flex"
              onClick={() => setCollapsed((value) => !value)}
              aria-label="Toggle sidebar"
              aria-expanded={!collapsed}
              type="button"
            >
              {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
            </button>

            <nav className="hidden min-w-0 items-center gap-1 text-sm text-muted-foreground sm:flex">
              <span>{isStudent ? 'Student' : 'Teacher'}</span>
              <ChevronRight className="size-3.5 shrink-0" />
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={pageName}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="truncate font-medium text-foreground"
                >
                  {pageName}
                </motion.span>
              </AnimatePresence>
            </nav>

            <div className="ml-auto flex min-w-0 items-center gap-1.5">
              <ThemeToggle />
              <NotificationBell />
              <Popover>
                <PopoverTrigger className={cn(buttonVariants({ variant: 'ghost' }), 'h-8 gap-2 px-1.5')}>
                  <Avatar id={user?.sub || 'guest'} name={displayName} size="sm" />
                  <span className="hidden max-w-28 truncate text-sm font-medium xl:block">{displayName}</span>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-56 p-1.5">
                  <div className="px-2 py-1.5">
                    <p className="truncate text-sm font-medium">{displayName}</p>
                    <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  {isDemo && (
                    <div className="grid grid-cols-2 gap-1 p-1">
                      <Button variant={isStudent ? 'secondary' : 'ghost'} className="h-7" onClick={() => handleRoleSwitch('Student')}>
                        Student
                      </Button>
                      <Button variant={!isStudent ? 'secondary' : 'ghost'} className="h-7" onClick={() => handleRoleSwitch('TA')}>
                        Teacher
                      </Button>
                    </div>
                  )}
                  <Button variant="ghost" className="h-8 w-full justify-start" onClick={() => navigate(settingsPath)}>
                    <Settings className="size-4" />
                    {isStudent ? 'My profile' : 'Settings'}
                  </Button>
                  <Button variant="ghost" className="h-8 w-full justify-start text-destructive hover:text-destructive" onClick={handleSignOut}>
                    <LogOut className="size-4" />
                    Sign out
                  </Button>
                </PopoverContent>
              </Popover>
            </div>
          </header>
          {/* Keyed on the path so each page fades in; no exit animation, since
              <Outlet /> would already render the next page while exiting */}
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto w-full max-w-[1440px] flex-1 p-4 md:p-6"
          >
            <ErrorBoundary resetKey={location.pathname}>
              <Outlet />
            </ErrorBoundary>
          </motion.div>
        </main>
      </div>
    </MotionConfig>
  );
}
