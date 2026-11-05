import { useMemo, useState } from 'react';
import type React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { format, formatDistanceToNow } from 'date-fns';
import { Area, Bar, CartesianGrid, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  Activity,
  ArrowUpRight,
  ClipboardList,
  Megaphone,
  PenSquare,
  Send,
  Target,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { usePayments, useOverview, useTeacherQuizzes } from '../../api/queries';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../../components/ui/avatar';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { EmptyState, LiveDot, PageHeader, PageSkeleton, StatCard } from '../../components/common';
import { TodoWidget } from '../../components/TodoWidget';
import { cn } from '../../lib/utils';

const tooltipStyle = {
  background: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 10,
  fontSize: 12,
  color: 'hsl(var(--foreground))',
};

function scoreTone(pct: number) {
  return pct >= 75 ? 'text-success' : pct >= 50 ? 'text-warning' : 'text-destructive';
}

export function TeacherDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: overview, isLoading } = useOverview();
  const { data: payments } = usePayments();
  // Teachers get the full quiz list from the same endpoint
  const { data: quizzes } = useTeacherQuizzes();

  const [postTitle, setPostTitle] = useState('');
  const [postBody, setPostBody] = useState('');
  const [posting, setPosting] = useState(false);
  const [postResult, setPostResult] = useState<'ok' | 'error' | null>(null);

  const payment = useMemo(() => {
    const rows = payments ?? [];
    const paid = rows.filter((r) => r.currentMonth?.status === 'paid' || r.currentMonth?.status === 'waived').length;
    const overdue = rows.filter((r) => r.currentMonth?.status === 'overdue').length;
    return { total: rows.length, paid, overdue, rate: rows.length ? (paid / rows.length) * 100 : null };
  }, [payments]);

  const chartData = useMemo(
    () =>
      (overview?.monthly ?? []).map((m) => ({
        month: format(new Date(`${m.month}-01T00:00:00`), 'MMM'),
        attempts: m.attempts,
        average: m.averagePercentage,
      })),
    [overview],
  );

  const now = new Date().toISOString();
  const liveQuizzes = (quizzes ?? []).filter((q) => q.openAt <= now && now <= q.closeAt).sort((a, b) => a.closeAt.localeCompare(b.closeAt));
  const nextQuizzes = (quizzes ?? []).filter((q) => q.openAt > now).sort((a, b) => a.openAt.localeCompare(b.openAt));

  const handleQuickPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle || !postBody) return;
    setPosting(true);
    setPostResult(null);
    try {
      await apiClient.post('/announcements', { title: postTitle, body: postBody, targetGroups: ['ALL'], isPinned: false, status: 'published' });
      setPostTitle('');
      setPostBody('');
      setPostResult('ok');
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    } catch {
      setPostResult('error');
    } finally {
      setPosting(false);
    }
  };

  if (isLoading) return <PageSkeleton />;

  const firstName = user?.name?.split(' ')[0];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={format(new Date(), 'EEEE, d MMMM')}
        title={firstName ? `Welcome back, ${firstName}` : 'Overview'}
        description="How the class is doing, at a glance."
        actions={
          <>
            <Button variant="outline" onClick={() => navigate('/teacher/students')}>
              <Users /> Students
            </Button>
            <Button onClick={() => navigate('/teacher/quizzes/new')}>
              <PenSquare /> New quiz
            </Button>
          </>
        }
      />

      {/* KPIs */}
      <section className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active students"
          icon={Users}
          value={overview?.students.active}
          tone="primary"
          onClick={() => navigate('/teacher/students')}
          hint={
            overview && overview.students.pending > 0 ? (
              <span className="inline-flex items-center gap-1 text-warning">
                <UserPlus className="size-3.5" /> {overview.students.pending} awaiting approval
              </span>
            ) : (
              `${overview?.students.total ?? 0} enrolled in total`
            )
          }
        />
        <StatCard
          label="Class average (30 days)"
          icon={Target}
          value={overview?.attempts.last30Days ? overview.attempts.averagePercentageLast30Days : null}
          decimals={1}
          suffix="%"
          tone="success"
          progress={overview?.attempts.last30Days ? overview.attempts.averagePercentageLast30Days : null}
          hint={`All-time ${overview?.attempts.averagePercentage ?? 0}%`}
        />
        <StatCard
          label="Attempts (30 days)"
          icon={Activity}
          value={overview?.attempts.last30Days}
          tone="info"
          hint={`by ${overview?.attempts.studentsActiveLast30Days ?? 0} students`}
        />
        <StatCard
          label="Fees collected this month"
          icon={Wallet}
          value={payment.rate}
          decimals={0}
          suffix="%"
          tone={payment.rate === null ? 'primary' : payment.rate < 50 ? 'destructive' : payment.rate < 80 ? 'warning' : 'success'}
          progress={payment.rate}
          onClick={() => navigate('/teacher/payments')}
          hint={`${payment.paid}/${payment.total} paid${payment.overdue ? ` · ${payment.overdue} overdue` : ''}`}
        />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Quiz activity</CardTitle>
            <CardDescription>Submitted attempts (bars) and class average % (line), last 12 months.</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {overview && overview.attempts.total === 0 ? (
              <EmptyState icon={Activity} title="No attempts yet" description="Activity appears once students submit quizzes." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="avgFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis yAxisId="count" allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis yAxisId="pct" orientation="right" domain={[0, 100]} hide />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'hsl(var(--muted) / 0.5)' }} />
                  <Bar yAxisId="count" dataKey="attempts" name="Attempts" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} maxBarSize={28} animationDuration={800} />
                  <Area
                    yAxisId="pct"
                    type="monotone"
                    dataKey="average"
                    name="Average %"
                    stroke="hsl(var(--success))"
                    strokeWidth={2}
                    fill="url(#avgFill)"
                    connectNulls
                    animationDuration={1000}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="gap-0 py-0">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border py-4">
            <CardTitle>Quizzes</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/teacher/quizzes')}>
              Manage <ArrowUpRight />
            </Button>
          </CardHeader>
          <CardContent className="px-0">
            {liveQuizzes.length === 0 && nextQuizzes.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="Nothing open or scheduled"
                action={
                  <Button size="sm" onClick={() => navigate('/teacher/quizzes/new')}>
                    <PenSquare /> Create a quiz
                  </Button>
                }
              />
            ) : (
              <div className="stagger divide-y divide-border">
                {[...liveQuizzes.slice(0, 4), ...nextQuizzes.slice(0, Math.max(0, 5 - liveQuizzes.length))].map((q) => {
                  const live = q.openAt <= now;
                  return (
                    <button
                      key={q.quizId}
                      type="button"
                      onClick={() => navigate(`/teacher/quizzes/${q.quizId}/analytics`)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40"
                    >
                      <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', live ? 'bg-success/10 text-success' : 'bg-info/10 text-info')}>
                        {live ? <LiveDot /> : <ClipboardList className="size-4" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-sinhala text-sm font-medium">{q.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {live
                            ? `Open · closes ${formatDistanceToNow(new Date(q.closeAt), { addSuffix: true })}`
                            : `Opens ${format(new Date(q.openAt), 'd MMM, h:mm a')}`}
                        </p>
                      </div>
                      <ArrowUpRight className="size-4 text-muted-foreground" />
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Card className="gap-0 py-0">
          <CardHeader className="border-b border-border py-4">
            <CardTitle>Latest submissions</CardTitle>
            <CardDescription>The most recent quiz attempts across all groups.</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            {!overview || overview.recentAttempts.length === 0 ? (
              <EmptyState icon={Activity} title="No submissions yet" />
            ) : (
              <div className="stagger divide-y divide-border">
                {overview.recentAttempts.slice(0, 8).map((a) => (
                  <div key={a.attemptId} className="flex items-center gap-3 px-4 py-3">
                    <Avatar id={a.userId} name={a.studentName} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{a.studentName}</p>
                      <p className="truncate font-sinhala text-xs text-muted-foreground">{a.quizTitle}</p>
                    </div>
                    <div className="hidden w-24 sm:block">
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <motion.div
                          className={cn('h-full rounded-full', a.percentage >= 75 ? 'bg-success' : a.percentage >= 50 ? 'bg-warning' : 'bg-destructive')}
                          initial={{ width: 0 }}
                          animate={{ width: `${a.percentage}%` }}
                          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        />
                      </div>
                    </div>
                    <div className="w-20 text-right">
                      <p className={cn('text-sm font-semibold tabular-nums', scoreTone(a.percentage))}>{a.percentage}%</p>
                      <p className="text-[11px] text-muted-foreground">{formatDistanceToNow(new Date(a.submittedAt), { addSuffix: true })}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="size-4 text-primary" /> Quick announcement
              </CardTitle>
              <CardDescription>Posts to every group straight away.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleQuickPost} className="space-y-3">
                <Input placeholder="Subject" value={postTitle} onChange={(e) => setPostTitle(e.target.value)} required />
                <Textarea
                  placeholder="Message (Sinhala supported)…"
                  className="h-24 resize-none font-sinhala"
                  value={postBody}
                  onChange={(e) => setPostBody(e.target.value)}
                  required
                />
                <div className="flex items-center justify-between gap-3">
                  <p className={cn('text-xs', postResult === 'error' ? 'text-destructive' : 'text-success')}>
                    {postResult === 'ok' && 'Posted ✓'}
                    {postResult === 'error' && 'Couldn’t post. Please try again.'}
                  </p>
                  <Button type="submit" disabled={posting || !postTitle || !postBody}>
                    <Send /> {posting ? 'Posting…' : 'Post to all'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          <TodoWidget />
        </div>
      </section>
    </div>
  );
}
