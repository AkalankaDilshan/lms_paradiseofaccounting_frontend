import { useEffect, useMemo, useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  BookOpen,
  ChevronRight,
  ClipboardList,
  Home,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import type { DemoRole } from '../../contexts/AuthContext';
import { ThemeToggle } from '../theme-toggle';
import { Avatar } from '../ui/avatar';
import { Button, buttonVariants } from '../ui/button';
import { Input } from '../ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { DateRangePicker } from './date-range-picker';
import { demoNotifications } from '../../data/admin-dashboard';
import { cn } from '../../lib/utils';

const teacherNav = [
  {
    label: 'Home',
    items: [{ name: 'Overview', path: '/teacher', icon: Home }],
  },
  {
    label: 'Learning',
    items: [
      { name: 'Quiz builder', path: '/teacher/quizzes/new', icon: ClipboardList },
      { name: 'Question bank', path: '/teacher/questions', icon: BookOpen },
      { name: 'Students', path: '/teacher/students', icon: Users },
      { name: 'Analytics', path: '/teacher/analytics', icon: BarChart3 },
    ],
  },
];

const studentNav = [
  {
    label: 'Home',
    items: [
      { name: 'Dashboard', path: '/student', icon: Home },
      { name: 'Performance', path: '/student/trend', icon: BarChart3 },
    ],
  },
];

const crumbs: Record<string, string> = {
  '/teacher': 'Overview',
  '/teacher/quizzes/new': 'Quiz builder',
  '/teacher/questions': 'Question bank',
  '/teacher/students': 'Students',
  '/teacher/analytics': 'Analytics',
  '/teacher/settings': 'Settings',
  '/student': 'Overview',
  '/student/trend': 'Performance',
  '/student/profile': 'Settings',
};

export function AppLayout() {
  const { user, signOut, switchRole, isDemo } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState('');
  const isStudent = user?.role === 'Student';
  const groups = isStudent ? studentNav : teacherNav;
  const displayName = user?.username || (isStudent ? 'Student' : 'Teacher');
  const settingsPath = isStudent ? '/student/profile' : '/teacher/settings';
  const closeMobile = () => setMobileOpen(false);

  const filteredGroups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return groups;
    return groups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => item.name.toLowerCase().includes(needle)),
      }))
      .filter((group) => group.items.length > 0);
  }, [groups, query]);

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

  const crumb = Object.keys(crumbs)
    .sort((a, b) => b.length - a.length)
    .find((path) => location.pathname === path || location.pathname.startsWith(`${path}/`));
  const pageName = (crumb && crumbs[crumb]) || (isStudent ? 'Dashboard' : 'Overview');

  const nav = (
    <>
      <div className={cn('flex items-center gap-3 px-4 py-5', collapsed && 'justify-center px-2')}>
        <img src="/logoIcon.png" alt="Asela LMS" className="size-9 rounded-lg object-cover" />
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
              placeholder="Search"
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
                'mb-1 px-2 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground',
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
                  onClick={closeMobile}
                  end={item.path === '/student' || item.path === '/teacher'}
                  title={item.name}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                      isActive && 'bg-muted text-foreground',
                      collapsed && 'justify-center px-0',
                    )
                  }
                >
                  <item.icon className="size-4 shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </NavLink>
              ))}
            </nav>
          </div>
        ))}
      </div>

      <div className="mt-auto space-y-1 border-t border-border p-3">
        <NavLink
          to={settingsPath}
          onClick={closeMobile}
          title="Settings"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
              isActive && 'bg-muted text-foreground',
              collapsed && 'justify-center px-0',
            )
          }
        >
          <Settings className="size-4 shrink-0" />
          {!collapsed && <span>Settings</span>}
        </NavLink>
        <div className={cn('flex items-center gap-2.5 rounded-lg px-2 py-2', collapsed && 'justify-center')}>
          <Avatar id={user?.username || 'guest'} name={displayName} size="sm" />
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
            'h-8 w-full text-muted-foreground hover:bg-rose-500/10 hover:text-rose-400',
            collapsed ? 'justify-center px-0' : 'justify-start',
          )}
          onClick={() => {
            signOut();
            navigate('/login');
          }}
        >
          <LogOut className="size-4" />
          {!collapsed && 'Sign out'}
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-svh bg-background text-foreground lg:flex">
      <aside
        className={cn(
          'hidden border-r border-border bg-background pb-16 transition-[width] lg:flex lg:min-h-svh lg:flex-col',
          collapsed ? 'lg:w-[72px]' : 'lg:w-64',
        )}
      >
        {nav}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-black/70" onClick={closeMobile} aria-label="Close navigation" type="button" />
          <aside className="relative flex h-full w-72 flex-col border-r border-border bg-background pb-16">{nav}</aside>
        </div>
      )}

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 overflow-x-auto border-b border-border bg-background/90 px-3 backdrop-blur-md md:overflow-visible md:px-5">
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
            <span>Dashboards</span>
            <ChevronRight className="size-3.5 shrink-0" />
            <span className="truncate font-medium text-foreground">{pageName}</span>
          </nav>

          <div className="ml-auto flex min-w-0 items-center gap-1.5">
            <DateRangePicker />
            <ThemeToggle />
            <Popover>
              <PopoverTrigger className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'relative')}>
                <Bell className="size-4" />
                <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-rose-500" />
                <span className="sr-only">Notifications</span>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="border-b border-border px-3 py-2.5 text-sm font-medium">Notifications</div>
                <div className="divide-y divide-border">
                  {demoNotifications.map((item) => (
                    <div key={item.id} className="px-3 py-2.5">
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {item.body} · {item.time}
                      </p>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger className={cn(buttonVariants({ variant: 'ghost' }), 'h-8 gap-2 px-1.5')}>
                <Avatar id={user?.username || 'guest'} name={displayName} size="sm" />
                <span className="hidden max-w-28 truncate text-sm font-medium xl:block">{displayName}</span>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56 p-1.5">
                <div className="px-2 py-1.5">
                  <p className="truncate text-sm font-medium">{displayName}</p>
                  <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                </div>
                {isDemo && (
                  <div className="grid grid-cols-2 gap-1 p-1">
                    <Button
                      variant={isStudent ? 'secondary' : 'ghost'}
                      className="h-7"
                      onClick={() => handleRoleSwitch('Student')}
                    >
                      Student
                    </Button>
                    <Button
                      variant={!isStudent ? 'secondary' : 'ghost'}
                      className="h-7"
                      onClick={() => handleRoleSwitch('TA')}
                    >
                      Teacher
                    </Button>
                  </div>
                )}
                <Button
                  variant="ghost"
                  className="h-8 w-full justify-start text-rose-400 hover:text-rose-400"
                  onClick={() => {
                    signOut();
                    navigate('/login');
                  }}
                >
                  <LogOut className="size-4" />
                  Sign out
                </Button>
              </PopoverContent>
            </Popover>
          </div>
        </header>
        <div className="mx-auto w-full max-w-[1440px] flex-1 p-4 md:p-6">{<Outlet />}</div>
      </main>
    </div>
  );
}
