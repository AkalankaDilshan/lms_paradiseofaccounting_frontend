import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Bell, ClipboardList, Megaphone, UserPlus, BellOff } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { useAnnouncements, useStudentQuizzes, useStudents } from '../../api/queries';
import { buttonVariants } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '../../lib/utils';

interface Notice {
  id: string;
  icon: LucideIcon;
  title: string;
  body: string;
  at: string;
  to: string;
}

const SEEN_KEY = 'lms-notifications-seen-at';
const WINDOW_DAYS = 14;

function readSeen(): string {
  try {
    return localStorage.getItem(SEEN_KEY) || '';
  } catch {
    return '';
  }
}

/**
 * In-app notifications built from data the app already loads — new
 * announcements and quizzes for students, pending approvals for staff.
 * Unread = newer than the last time the bell was opened (per browser).
 */
export function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isStudent = user?.role === 'Student';
  const [seenAt, setSeenAt] = useState(readSeen);

  const { data: announcements } = useAnnouncements(!!user);
  const { data: quizzes } = useStudentQuizzes(isStudent);
  const { data: students } = useStudents(!!user && !isStudent);

  const notices = useMemo(() => {
    const since = new Date(Date.now() - WINDOW_DAYS * 86_400_000).toISOString();
    const base = isStudent ? '/student' : '/teacher';
    const list: Notice[] = [];

    for (const a of announcements ?? []) {
      if (a.status === 'draft' || a.createdAt < since) continue;
      list.push({ id: `a-${a.announcementId}`, icon: Megaphone, title: a.title, body: a.body, at: a.createdAt, to: `${base}/announcements` });
    }
    if (isStudent) {
      for (const q of quizzes ?? []) {
        if (q.state !== 'open' || q.attemptsUsed > 0) continue;
        list.push({
          id: `q-${q.quizId}`,
          icon: ClipboardList,
          title: `Quiz open: ${q.title}`,
          body: `Closes ${formatDistanceToNow(new Date(q.closeAt), { addSuffix: true })}`,
          at: q.openAt,
          to: '/student/quizzes',
        });
      }
    } else {
      const pending = (students ?? []).filter((s) => s.status === 'pending');
      if (pending.length > 0) {
        const newest = pending.map((s) => s.createdAt || '').sort().at(-1) || new Date(0).toISOString();
        list.push({
          id: 'pending-students',
          icon: UserPlus,
          title: `${pending.length} student${pending.length === 1 ? '' : 's'} awaiting approval`,
          body: 'Review new sign-ups in Students.',
          at: newest,
          to: '/teacher/students',
        });
      }
    }
    return list.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8);
  }, [announcements, quizzes, students, isStudent]);

  const unread = notices.filter((n) => n.at > seenAt).length;

  const markSeen = () => {
    const now = new Date().toISOString();
    setSeenAt(now);
    try {
      localStorage.setItem(SEEN_KEY, now);
    } catch {
      /* private mode — unread state just won't persist */
    }
  };

  return (
    <Popover onOpenChange={(open) => !open && unread > 0 && markSeen()}>
      <PopoverTrigger className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'relative')}>
        <Bell className="size-4" />
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white"
            >
              {unread > 9 ? '9+' : unread}
            </motion.span>
          )}
        </AnimatePresence>
        <span className="sr-only">Notifications{unread ? ` (${unread} new)` : ''}</span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 gap-0 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
          <p className="text-sm font-medium">Notifications</p>
          {unread > 0 && (
            <button type="button" onClick={markSeen} className="text-xs text-primary hover:underline">
              Mark all read
            </button>
          )}
        </div>
        {notices.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-3 py-8 text-center text-muted-foreground">
            <BellOff className="size-5" />
            <p className="text-sm">You're all caught up.</p>
          </div>
        ) : (
          <div className="max-h-96 divide-y divide-border overflow-y-auto">
            {notices.map((n) => {
              const isNew = n.at > seenAt;
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => navigate(n.to)}
                  className="flex w-full gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/60"
                >
                  <span className={cn('mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg', isNew ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
                    <n.icon className="size-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">{n.title}</span>
                      {isNew && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
                    </span>
                    <span className="mt-0.5 line-clamp-1 font-sinhala text-xs text-muted-foreground">{n.body}</span>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground/80">
                      {formatDistanceToNow(new Date(n.at), { addSuffix: true })}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
