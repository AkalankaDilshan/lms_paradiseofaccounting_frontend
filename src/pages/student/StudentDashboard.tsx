import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  ArrowUpRight,
  Award,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Download,
  File,
  FileImage,
  FileText,
  Flame,
  Pin,
  Target,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { percent, useAnnouncements, useMaterials, useStudentQuizzes, useTrend } from '../../api/queries';
import { openMaterial } from '../../lib/materials';
import { notifyError } from '../../lib/feedback';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { EmptyState, PageSkeleton, StatCard } from '../../components/common';
import { Sparkline } from '../../components/dashboard/sparkline';
import { GroupBadge } from '../../components/GroupBadge';
import { Leaderboard } from '../../components/Leaderboard';
import { StudentQuizCard } from '../../components/quiz/StudentQuizCard';
import { InstallAppCard } from '../../components/InstallAppCard';
import { cn } from '../../lib/utils';

const FILE_ICONS: Record<string, typeof FileText> = { pdf: FileText, image: FileImage, doc: File };

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
}

function scoreTone(pct: number) {
  return pct >= 75 ? 'text-success' : pct >= 50 ? 'text-warning' : 'text-destructive';
}

export function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: quizzes, isLoading: loadingQuizzes } = useStudentQuizzes();
  const { data: trend, isLoading: loadingTrend } = useTrend(user?.sub);
  const { data: announcements } = useAnnouncements();
  const { data: materials } = useMaterials();
  const { data: profile } = useQuery({
    queryKey: ['studentProfile', user?.sub],
    meta: { errorToast: false },
    queryFn: async () =>
      (await apiClient.get(`/admin/students/${user?.sub}`)).data as { firstName?: string; examYear?: number; center?: string; groups?: string[] },
    enabled: !!user?.sub,
  });

  const stats = useMemo(() => {
    const attempts = trend ?? [];
    const pcts = attempts.map((a) => a.percentage ?? percent(a.score, a.maxScore));
    const totalScore = attempts.reduce((s, a) => s + a.score, 0);
    const totalMax = attempts.reduce((s, a) => s + a.maxScore, 0);
    const recent = pcts.slice(-3);
    const earlier = pcts.slice(-6, -3);
    const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
    const recentAvg = avg(recent);
    const earlierAvg = avg(earlier);
    const assigned = (quizzes ?? []).filter((q) => q.state !== 'upcoming').length;
    const completed = new Set(attempts.map((a) => a.quizId)).size;
    return {
      average: totalMax ? percent(totalScore, totalMax) : null,
      best: pcts.length ? Math.max(...pcts) : null,
      completed,
      assigned,
      momentum: recentAvg !== null && earlierAvg !== null ? Math.round((recentAvg - earlierAvg) * 10) / 10 : null,
      spark: pcts.slice(-10),
    };
  }, [trend, quizzes]);

  if (loadingQuizzes && loadingTrend) return <PageSkeleton />;

  const actionable = (quizzes ?? [])
    .filter((q) => q.state === 'open' && (q.hasOpenAttempt || q.attemptsUsed < q.maxAttempts))
    .sort((a, b) => a.closeAt.localeCompare(b.closeAt));
  const upcoming = (quizzes ?? []).filter((q) => q.state === 'upcoming').sort((a, b) => a.openAt.localeCompare(b.openAt));
  const pinned = (announcements ?? []).filter((a) => a.isPinned && a.status !== 'draft').slice(0, 2);
  const recentMaterials = [...(materials ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3);
  const recentAttempts = [...(trend ?? [])].reverse().slice(0, 5);
  const leaderboardQuiz = recentAttempts[0]?.quizId;
  const firstName = profile?.firstName || user?.name?.split(' ')[0] || 'there';

  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, scale: 0.985 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 sm:p-6 md:p-8"
      >
        <div className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-primary/20 blur-3xl animate-float" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 size-56 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-4 md:flex-row md:items-end md:gap-6">
          <div>
            <p className="text-xs text-muted-foreground sm:text-sm">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
              {greeting()}, {firstName}.
            </h1>
            <p className="mt-2 max-w-lg text-sm text-muted-foreground">
              {actionable.length > 0
                ? `You have ${actionable.length} quiz${actionable.length === 1 ? '' : 'zes'} waiting. Let's keep the momentum going.`
                : stats.momentum !== null && stats.momentum > 0
                  ? `Your last three quizzes are ${stats.momentum}% above the three before. Nice work!`
                  : 'You’re all caught up. Review your materials while you wait for the next quiz.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {profile?.examYear ? (
              <span className="rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-medium backdrop-blur">
                A/L {profile.examYear}
              </span>
            ) : null}
            {(profile?.groups ?? []).map((g) => (
              <GroupBadge key={g} group={g} />
            ))}
          </div>
        </div>
      </motion.section>

      <InstallAppCard />

      {/* Up next — the first thing a student needs on their phone */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Up next</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/student/quizzes')}>
            All quizzes <ArrowUpRight />
          </Button>
        </div>
        {actionable.length === 0 ? (
          <Card className="py-0">
            <EmptyState
              icon={ClipboardList}
              className="py-8"
              title="No quizzes waiting for you"
              description={upcoming[0] ? `Next: “${upcoming[0].title}” opens ${formatDistanceToNow(new Date(upcoming[0].openAt), { addSuffix: true })}.` : 'New quizzes will appear here when they open.'}
            />
          </Card>
        ) : (
          <div className="stagger grid gap-3">
            {actionable.slice(0, 3).map((q) => (
              <StudentQuizCard key={q.quizId} quiz={q} />
            ))}
          </div>
        )}
      </div>

      {pinned.length > 0 && (
        <section className="stagger grid gap-3 sm:grid-cols-2">
          {pinned.map((a) => (
            <Card key={a.announcementId} className="interactive cursor-pointer border-l-2 border-l-accent py-0" onClick={() => navigate('/student/announcements')}>
              <CardContent className="flex items-start gap-3 p-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <Pin className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{a.title}</p>
                  <p className="mt-0.5 line-clamp-2 font-sinhala text-xs text-muted-foreground">{a.body}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      {/* KPIs */}
      <section className="stagger grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          label="Average score"
          icon={Target}
          value={stats.average}
          decimals={1}
          suffix="%"
          tone="primary"
          progress={stats.average}
          hint={stats.average === null ? 'Take a quiz to see it' : 'All your attempts'}
        />
        <StatCard
          label="Quizzes completed"
          icon={CheckCircle2}
          value={stats.completed}
          tone="success"
          progress={stats.assigned ? (stats.completed / stats.assigned) * 100 : null}
          hint={`of ${stats.assigned} assigned`}
        />
        <StatCard label="Best score" icon={Award} value={stats.best} decimals={1} suffix="%" tone="accent" hint="Personal best" />
        <Card className="py-4">
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Momentum</p>
              <span className="flex size-8 items-center justify-center rounded-lg bg-warning/10 text-warning">
                <Flame className="size-4" />
              </span>
            </div>
            <p className={cn('text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl', stats.momentum === null ? 'text-muted-foreground' : stats.momentum >= 0 ? 'text-success' : 'text-destructive')}>
              {stats.momentum === null ? '—' : `${stats.momentum > 0 ? '+' : ''}${stats.momentum}%`}
            </p>
            {stats.spark.length > 1 ? (
              <Sparkline data={stats.spark} color="hsl(var(--primary))" className="h-8" />
            ) : (
              <p className="text-xs text-muted-foreground">Last 3 vs previous 3</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          {/* Recent attempts */}
          <Card className="gap-0 py-0">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border py-4">
              <div>
                <CardTitle>Recent results</CardTitle>
                <p className="mt-0.5 text-sm text-muted-foreground">Your latest submitted quizzes.</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/student/trend')}>
                Performance <ArrowUpRight />
              </Button>
            </CardHeader>
            <CardContent className="px-0">
              {recentAttempts.length === 0 ? (
                <EmptyState icon={Target} title="No results yet" description="Your scores will appear here after your first quiz." />
              ) : (
                <div className="stagger divide-y divide-border">
                  {recentAttempts.map((a, i) => {
                    const pct = a.percentage ?? percent(a.score, a.maxScore);
                    return (
                      <button
                        key={a.attemptId ?? i}
                        type="button"
                        disabled={!a.attemptId}
                        onClick={() => a.attemptId && navigate(`/student/quizzes/${a.quizId}/results/${a.attemptId}`)}
                        className="flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-muted/40 disabled:cursor-default"
                      >
                        <div className="relative size-10 shrink-0">
                          <svg viewBox="0 0 36 36" className="size-10 -rotate-90">
                            <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
                            <motion.circle
                              cx="18"
                              cy="18"
                              r="15"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="4"
                              strokeLinecap="round"
                              className={scoreTone(pct)}
                              strokeDasharray={2 * Math.PI * 15}
                              initial={{ strokeDashoffset: 2 * Math.PI * 15 }}
                              animate={{ strokeDashoffset: 2 * Math.PI * 15 * (1 - pct / 100) }}
                              transition={{ duration: 0.9, delay: 0.1 * i, ease: [0.22, 1, 0.36, 1] }}
                            />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-sinhala text-sm font-medium">{a.quizTitle || 'Quiz'}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(a.submittedAt), 'd MMM yyyy, h:mm a')}</p>
                        </div>
                        <div className="text-right">
                          <p className={cn('font-semibold tabular-nums', scoreTone(pct))}>{pct}%</p>
                          <p className="text-xs text-muted-foreground tabular-nums">
                            {a.score}/{a.maxScore}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {upcoming.length > 0 && (
            <Card className="gap-0 py-0">
              <CardHeader className="border-b border-border py-4">
                <CardTitle className="flex items-center gap-2">
                  <CalendarClock className="size-4 text-info" /> Coming up
                </CardTitle>
              </CardHeader>
              <CardContent className="stagger divide-y divide-border px-0">
                {upcoming.slice(0, 4).map((q) => (
                  <div key={q.quizId} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex size-10 shrink-0 flex-col items-center justify-center rounded-lg bg-info/10 text-info">
                      <span className="text-[10px] font-medium uppercase leading-none">{format(new Date(q.openAt), 'MMM')}</span>
                      <span className="text-sm font-semibold leading-tight">{format(new Date(q.openAt), 'd')}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-sinhala text-sm font-medium">{q.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(q.openAt), 'h:mm a')} · {q.durationMinutes} min
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {leaderboardQuiz && <Leaderboard quizId={leaderboardQuiz} title={recentAttempts[0]?.quizTitle} compact />}

          <Card className="gap-0 py-0">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border py-4">
              <CardTitle>Latest materials</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/student/materials')}>
                View all
              </Button>
            </CardHeader>
            <CardContent className="px-0">
              {recentMaterials.length === 0 ? (
                <EmptyState icon={FileText} title="No materials yet" className="py-8" />
              ) : (
                <div className="stagger divide-y divide-border">
                  {recentMaterials.map((m) => {
                    const Icon = FILE_ICONS[m.fileType] || File;
                    return (
                      <button
                        key={m.materialId}
                        type="button"
                        onClick={() => openMaterial(m.materialId).catch((err) => notifyError(err, 'open the material'))}
                        className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40"
                      >
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Icon className="size-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 text-sm font-medium">{m.title}</p>
                          <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}</p>
                        </div>
                        <Download className="size-4 text-muted-foreground transition-transform group-hover:translate-y-0.5 group-hover:text-foreground" />
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
