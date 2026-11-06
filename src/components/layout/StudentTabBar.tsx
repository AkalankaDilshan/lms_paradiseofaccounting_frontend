import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { BarChart3, ClipboardList, Home, Library, LogOut, Mail, Megaphone, Menu, Moon, Sun, UserRound, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useStudentQuizzes } from '../../api/queries';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../theme-provider';
import { Avatar } from '../ui/avatar';
import { cn } from '../../lib/utils';

const TABS: { name: string; path: string; icon: LucideIcon; end?: boolean }[] = [
  { name: 'Home', path: '/student', icon: Home, end: true },
  { name: 'Quizzes', path: '/student/quizzes', icon: ClipboardList },
  { name: 'Results', path: '/student/trend', icon: BarChart3 },
  { name: 'Materials', path: '/student/materials', icon: Library },
];

const MORE: { name: string; path: string; icon: LucideIcon }[] = [
  { name: 'Announcements', path: '/student/announcements', icon: Megaphone },
  { name: 'Messages', path: '/student/messages', icon: Mail },
  { name: 'My profile', path: '/student/profile', icon: UserRound },
];

/**
 * Phone navigation for students: a bottom tab bar within thumb reach, plus a
 * "More" sheet. Hidden on lg+ (the sidebar takes over) and while sitting a quiz.
 */
export function StudentTabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [moreOpen, setMoreOpen] = useState(false);
  const { data: quizzes } = useStudentQuizzes();
  const waiting = (quizzes ?? []).filter((q) => q.state === 'open' && (q.hasOpenAttempt || q.attemptsUsed < q.maxAttempts)).length;
  const moreActive = MORE.some((m) => location.pathname.startsWith(m.path));
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const name = user?.name || 'Student';

  useEffect(() => setMoreOpen(false), [location.pathname]);

  return (
    <>
      <nav
        aria-label="Main"
        className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/85 backdrop-blur-xl lg:hidden"
      >
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {TABS.map((tab) => (
            <NavLink key={tab.path} to={tab.path} end={tab.end} className="relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium">
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="tabbar-active"
                      className="absolute inset-x-3 top-1.5 bottom-1.5 rounded-2xl bg-primary/12"
                      transition={{ type: 'spring', bounce: 0.25, duration: 0.45 }}
                    />
                  )}
                  <span className="relative">
                    <tab.icon className={cn('size-5 transition-colors', isActive ? 'text-primary' : 'text-muted-foreground')} strokeWidth={isActive ? 2.4 : 2} />
                    {tab.path === '/student/quizzes' && waiting > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white ring-2 ring-background"
                      >
                        {waiting}
                      </motion.span>
                    )}
                  </span>
                  <span className={cn('relative transition-colors', isActive ? 'text-foreground' : 'text-muted-foreground')}>{tab.name}</span>
                </>
              )}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-expanded={moreOpen}
            className="relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium"
          >
            {moreActive && <span className="absolute inset-x-3 top-1.5 bottom-1.5 rounded-2xl bg-primary/12" />}
            <Menu className={cn('relative size-5', moreActive ? 'text-primary' : 'text-muted-foreground')} />
            <span className={cn('relative', moreActive ? 'text-foreground' : 'text-muted-foreground')}>More</span>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {moreOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.button
              type="button"
              aria-label="Close menu"
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-label="More"
              className="safe-bottom absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-border bg-popover shadow-2xl"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.5 }}
              onDragEnd={(_, info) => info.offset.y > 80 && setMoreOpen(false)}
            >
              <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-muted-foreground/30" />
              <div className="flex items-center gap-3 px-5 pb-3 pt-4">
                <Avatar id={user?.sub || 'student'} name={name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{name}</p>
                  <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <button type="button" onClick={() => setMoreOpen(false)} aria-label="Close" className="rounded-full p-2 text-muted-foreground hover:bg-muted">
                  <X className="size-5" />
                </button>
              </div>
              <div className="space-y-1 px-3 pb-4">
                {MORE.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      cn('flex min-h-12 items-center gap-3 rounded-xl px-3 text-[15px] transition-colors', isActive ? 'bg-muted font-medium' : 'hover:bg-muted/60')
                    }
                  >
                    <item.icon className="size-5 text-muted-foreground" />
                    {item.name}
                  </NavLink>
                ))}
                <button
                  type="button"
                  onClick={() => setTheme(isDark ? 'light' : 'dark')}
                  className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-[15px] transition-colors hover:bg-muted/60"
                >
                  {isDark ? <Sun className="size-5 text-muted-foreground" /> : <Moon className="size-5 text-muted-foreground" />}
                  {isDark ? 'Light mode' : 'Dark mode'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    signOut();
                    navigate('/login');
                  }}
                  className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-[15px] text-destructive transition-colors hover:bg-destructive/10"
                >
                  <LogOut className="size-5" />
                  Sign out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
