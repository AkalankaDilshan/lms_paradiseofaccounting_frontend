import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { CalendarClock, CheckCircle2, ClipboardList, Search } from 'lucide-react';
import { useStudentQuizzes } from '../../api/queries';
import type { StudentQuiz } from '../../api/queries';
import { EmptyState, PageHeader, Skeleton } from '../../components/common';
import { StudentQuizCard } from '../../components/quiz/StudentQuizCard';
import { Input } from '../../components/ui/input';
import { cn } from '../../lib/utils';

type Tab = 'open' | 'upcoming' | 'past';

const TABS: { id: Tab; label: string }[] = [
  { id: 'open', label: 'Open now' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past', label: 'Past & results' },
];

const EMPTY: Record<Tab, { title: string; description: string; icon: typeof ClipboardList }> = {
  open: { title: 'No quizzes open right now', description: 'New quizzes appear here as soon as they open.', icon: ClipboardList },
  upcoming: { title: 'Nothing scheduled', description: 'Your teacher hasn’t scheduled any upcoming quizzes yet.', icon: CalendarClock },
  past: { title: 'No past quizzes yet', description: 'Quizzes you’ve taken, or that have closed, show up here with your results.', icon: CheckCircle2 },
};

function bucket(q: StudentQuiz): Tab {
  return q.state === 'open' ? 'open' : q.state === 'upcoming' ? 'upcoming' : 'past';
}

export function StudentQuizzes() {
  const { data, isLoading } = useStudentQuizzes();
  const [search, setSearch] = useState('');
  const counts = useMemo(() => {
    const c: Record<Tab, number> = { open: 0, upcoming: 0, past: 0 };
    for (const q of data ?? []) c[bucket(q)] += 1;
    return c;
  }, [data]);
  const [tab, setTab] = useState<Tab | null>(null);
  // Default to the first tab that has something in it
  const active: Tab = tab ?? (counts.open ? 'open' : counts.upcoming ? 'upcoming' : counts.past ? 'past' : 'open');

  const list = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const rows = (data ?? []).filter((q) => bucket(q) === active && q.title.toLowerCase().includes(needle));
    return rows.sort((a, b) =>
      active === 'open'
        ? a.closeAt.localeCompare(b.closeAt)
        : active === 'upcoming'
          ? a.openAt.localeCompare(b.openAt)
          : b.closeAt.localeCompare(a.closeAt),
    );
  }, [data, active, search]);

  const empty = EMPTY[active];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Quizzes" title="My quizzes" description="Everything assigned to your class: open now, coming up, and past results." />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex w-fit rounded-xl border border-border bg-muted/40 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'relative rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                active === t.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {active === t.id && (
                <motion.span
                  layoutId="quiz-tab"
                  className="absolute inset-0 rounded-lg bg-background shadow-sm ring-1 ring-border"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
              <span className="relative inline-flex items-center gap-1.5">
                {t.label}
                <span className="rounded-full bg-muted px-1.5 text-[11px] tabular-nums text-muted-foreground">{counts[t.id]}</span>
              </span>
            </button>
          ))}
        </div>
        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search quizzes" className="h-9 pl-9" />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState icon={empty.icon} title={search ? 'No quizzes match your search' : empty.title} description={search ? undefined : empty.description} />
      ) : (
        <div key={active} className="stagger grid gap-3">
          {list.map((q) => (
            <StudentQuizCard key={q.quizId} quiz={q} />
          ))}
        </div>
      )}
    </div>
  );
}
