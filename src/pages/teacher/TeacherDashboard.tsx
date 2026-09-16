import { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChevronLeft, ChevronRight, TrendingDown, TrendingUp, CreditCard, Megaphone, Send } from 'lucide-react';
import { Avatar } from '../../components/ui/avatar';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Checkbox } from '../../components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Sparkline } from '../../components/dashboard/sparkline';
import { TodoWidget } from '../../components/TodoWidget';
import { useNavigate } from 'react-router-dom';
import {
  attemptsThisYear,
  miniKpis,
  monthlySeries,
  recentAttempts,
} from '../../data/admin-dashboard';
import { cn } from '../../lib/utils';
import { apiClient } from '../../api/client';

const PAGE_SIZE = 5;
const upColor = 'hsl(142 70% 45%)';
const downColor = 'hsl(346 77% 55%)';

const statusClasses = {
  Completed: 'bg-emerald-500/12 text-emerald-400',
  'In progress': 'bg-amber-500/12 text-amber-400',
  Missed: 'bg-rose-500/12 text-rose-400',
} as const;

const tooltipStyle = {
  background: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 8,
  fontSize: 12,
  color: 'hsl(var(--foreground))',
};

function formatDelta(delta: number) {
  const prefix = delta > 0 ? '+' : '';
  return `${prefix}${delta.toFixed(1)}%`;
}

function Trend({ delta, good }: { delta: number; good: boolean }) {
  const Icon = delta >= 0 ? TrendingUp : TrendingDown;
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium', good ? 'text-emerald-400' : 'text-rose-400')}>
      <Icon className="size-3.5" />
      {formatDelta(delta)}
    </span>
  );
}

export function TeacherDashboard() {
  const navigate = useNavigate();
  const [yearView, setYearView] = useState<'this' | 'last'>('this');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  
  // Quick Post state
  const [postTitle, setPostTitle] = useState('');
  const [postBody, setPostBody] = useState('');
  const [posting, setPosting] = useState(false);

  const pageCount = Math.ceil(recentAttempts.length / PAGE_SIZE);
  const visible = recentAttempts.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const allVisibleSelected = visible.every((row) => selected.includes(row.id));

  const areaData = useMemo(
    () => monthlySeries.map((item) => ({ month: item.month, value: yearView === 'this' ? item.thisYear : item.lastYear })),
    [yearView],
  );

  const toggleAll = (checked: boolean) => {
    const ids = visible.map((row) => row.id);
    setSelected((current) => (checked ? Array.from(new Set([...current, ...ids])) : current.filter((id) => !ids.includes(id))));
  };

  const toggleRow = (id: string, checked: boolean) => {
    setSelected((current) => (checked ? [...current, id] : current.filter((item) => item !== id)));
  };

  const handleQuickPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle || !postBody) return;
    setPosting(true);
    try {
      await apiClient.post('/announcements', {
        title: postTitle,
        body: postBody,
        targetGroups: ['ALL'],
        isPinned: false,
        status: 'published'
      });
      setPostTitle('');
      setPostBody('');
      alert('Announcement posted successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to post announcement.');
    } finally {
      setPosting(false);
    }
  };

  // Mock payment data
  const totalStudents = 75;
  const paidCount = 48;
  const collectionRate = (paidCount / totalStudents) * 100;
  const paymentColor = collectionRate < 50 ? 'text-rose-500' : collectionRate < 80 ? 'text-amber-500' : 'text-emerald-500';

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.7fr)]">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card className="py-4">
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{attemptsThisYear.label}</p>
              <div className="flex items-end justify-between gap-3">
                <p className="text-3xl font-semibold tracking-tight tabular-nums">{attemptsThisYear.value}</p>
                <Trend delta={attemptsThisYear.delta} good={attemptsThisYear.delta >= 0} />
              </div>
              <p className="text-xs text-muted-foreground">{attemptsThisYear.vs}</p>
              <Sparkline data={attemptsThisYear.spark} color={upColor} />
            </CardContent>
          </Card>
          
          {/* Payment Overview Widget */}
          <Card className="py-4 border-l-4 border-l-primary cursor-pointer hover:bg-muted/10 transition-colors" onClick={() => navigate('/teacher/payments')}>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Pending Payments</p>
                <CreditCard className="w-4 h-4 text-primary" />
              </div>
              <div className="flex items-end justify-between gap-3">
                <p className="text-3xl font-semibold tracking-tight tabular-nums">{totalStudents - paidCount}</p>
                <span className={cn('inline-flex items-center gap-1 text-xs font-medium', paymentColor)}>
                  {collectionRate.toFixed(1)}% Collected
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className={cn("h-full rounded-full transition-all", 
                  collectionRate < 50 ? 'bg-rose-500' : collectionRate < 80 ? 'bg-amber-500' : 'bg-emerald-500'
                )} style={{ width: `${collectionRate}%` }} />
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground">This month's collection</p>
                <p className="text-sm font-semibold tabular-nums">{paidCount}/{totalStudents} Paid</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1">
          {miniKpis.slice(0, 2).map((kpi) => {
            const good = kpi.positiveIsGood ? kpi.delta >= 0 : kpi.delta <= 0;
            return (
              <Card key={kpi.label} className="py-3">
                <CardContent className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">{kpi.label}</p>
                    <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{kpi.value}</p>
                    <div className="mt-1">
                      <Trend delta={kpi.delta} good={good} />
                    </div>
                  </div>
                  <Sparkline data={kpi.spark} color={good ? upColor : downColor} className="h-12 w-24 shrink-0 sm:w-28" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="py-4">
          <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-2">
            <div>
              <CardTitle>Attempts overview</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Quiz attempts across the academic year.</p>
            </div>
            <Segmented value={yearView} onChange={setYearView} />
          </CardHeader>
          <CardContent className="h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="attemptsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={upColor} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={upColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="value" name="Attempts" stroke={upColor} strokeWidth={2} fill="url(#attemptsFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Quick Post & Mini KPIs */}
        <div className="flex flex-col gap-4">
          <Card className="flex-1">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Quick Announcement</CardTitle>
              </div>
              <CardDescription>Broadcast a message to all students.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleQuickPost} className="space-y-3">
                <Input 
                  placeholder="Subject" 
                  value={postTitle} 
                  onChange={e => setPostTitle(e.target.value)} 
                  required 
                />
                <Textarea 
                  placeholder="Message body (Supports Sinhala)..." 
                  className="resize-none font-sinhala h-24"
                  value={postBody}
                  onChange={e => setPostBody(e.target.value)}
                  required
                />
                <div className="flex justify-end">
                  <Button type="submit" size="sm" disabled={posting || !postTitle || !postBody}>
                    <Send className="w-3.5 h-3.5 mr-2" />
                    {posting ? 'Posting...' : 'Post to All Groups'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.3fr)]">
        <div className="h-full">
          <TodoWidget />
        </div>

        <Card className="gap-0 py-0">
          <CardHeader className="border-b border-border py-4">
            <CardTitle>Recent quiz attempts</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Latest submissions across your learning groups.</p>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 pl-4">
                    <Checkbox checked={allVisibleSelected} onCheckedChange={(value) => toggleAll(value === true)} aria-label="Select page" />
                  </TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead className="hidden md:table-cell">Quiz</TableHead>
                  <TableHead className="hidden lg:table-cell">Group</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell pr-4">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((attempt) => (
                  <TableRow key={attempt.id} data-state={selected.includes(attempt.id) ? 'selected' : undefined}>
                    <TableCell className="pl-4">
                      <Checkbox
                        checked={selected.includes(attempt.id)}
                        onCheckedChange={(value) => toggleRow(attempt.id, value === true)}
                        aria-label={`Select ${attempt.student}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar id={attempt.studentId} name={attempt.student} size="sm" />
                        <span className="font-medium">{attempt.student}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden max-w-[220px] truncate md:table-cell">{attempt.quiz}</TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">{attempt.group}</TableCell>
                    <TableCell className="font-medium tabular-nums">{attempt.score}</TableCell>
                    <TableCell>
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', statusClasses[attempt.status])}>
                        {attempt.status}
                      </span>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell pr-4">{attempt.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
              <p className="text-xs text-muted-foreground">
                {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, recentAttempts.length)} of {recentAttempts.length}
              </p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon-sm" disabled={page === 0} onClick={() => setPage((value) => value - 1)} aria-label="Previous page">
                  <ChevronLeft />
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  disabled={page >= pageCount - 1}
                  onClick={() => setPage((value) => value + 1)}
                  aria-label="Next page"
                >
                  <ChevronRight />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Segmented({ value, onChange }: { value: 'this' | 'last'; onChange: (value: 'this' | 'last') => void }) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5 text-xs">
      <button
        type="button"
        className={cn('rounded-md px-2.5 py-1 font-medium text-muted-foreground', value === 'this' && 'bg-background text-foreground shadow-sm')}
        onClick={() => onChange('this')}
      >
        This Year
      </button>
      <button
        type="button"
        className={cn('rounded-md px-2.5 py-1 font-medium text-muted-foreground', value === 'last' && 'bg-background text-foreground shadow-sm')}
        onClick={() => onChange('last')}
      >
        Last Year
      </button>
    </div>
  );
}
