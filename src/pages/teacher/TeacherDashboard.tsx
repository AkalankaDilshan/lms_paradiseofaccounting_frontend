import { useMemo, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChevronLeft, ChevronRight, TrendingDown, TrendingUp } from 'lucide-react';
import { Avatar } from '../../components/ui/avatar';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Checkbox } from '../../components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Sparkline } from '../../components/dashboard/sparkline';
import {
  attemptsThisMonth,
  attemptsThisYear,
  miniKpis,
  monthlySeries,
  recentAttempts,
  weakTopics,
} from '../../data/admin-dashboard';
import { cn } from '../../lib/utils';

const PAGE_SIZE = 5;
const upColor = 'hsl(142 70% 45%)';
const downColor = 'hsl(346 77% 55%)';
const tealColor = 'hsl(173 58% 40%)';

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
  const [yearView, setYearView] = useState<'this' | 'last'>('this');
  const [compareView, setCompareView] = useState<'this' | 'last'>('this');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);

  const pageCount = Math.ceil(recentAttempts.length / PAGE_SIZE);
  const visible = recentAttempts.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const allVisibleSelected = visible.every((row) => selected.includes(row.id));
  const maxWrong = weakTopics[0]?.wrongRate ?? 1;

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
          <Card className="py-4">
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{attemptsThisMonth.label}</p>
              <div className="flex items-end justify-between gap-3">
                <p className="text-3xl font-semibold tracking-tight tabular-nums">{attemptsThisMonth.value}</p>
                <Trend delta={attemptsThisMonth.delta} good={attemptsThisMonth.delta >= 0} />
              </div>
              <p className="text-xs text-muted-foreground">{attemptsThisMonth.vs}</p>
              <Sparkline data={attemptsThisMonth.spark} color={upColor} className="h-10" />
              <div className="flex items-center justify-between border-t border-border pt-3">
                <div>
                  <p className="text-xs text-muted-foreground">{attemptsThisMonth.extraLabel}</p>
                  <p className="text-sm font-semibold tabular-nums">{attemptsThisMonth.extraValue}</p>
                </div>
                <Trend delta={attemptsThisMonth.extraDelta} good />
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 xl:grid-cols-1">
          {miniKpis.map((kpi) => {
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

        <Card className="py-4">
          <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-2">
            <div>
              <CardTitle>Attempts vs completions</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Started papers against papers submitted.</p>
            </div>
            <Segmented value={compareView} onChange={setCompareView} />
          </CardHeader>
          <CardContent className="h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2}>
                <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="attempts" name="Attempts" fill={compareView === 'this' ? tealColor : 'hsl(var(--muted-foreground))'} radius={[4, 4, 0, 0]} />
                <Bar dataKey="completions" name="Completions" fill={upColor} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.3fr)]">
        <Card className="py-4">
          <CardHeader className="pb-2">
            <CardTitle>Weak topics</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Highest incorrect rates this month.</p>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            {weakTopics.map((topic) => (
              <div key={topic.topic} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{topic.topic}</p>
                    <p className="text-xs text-muted-foreground">
                      {topic.group} · {topic.attempts} attempts
                    </p>
                  </div>
                  <span className="text-sm font-medium text-emerald-400 tabular-nums">{topic.wrongRate}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(topic.wrongRate / maxWrong) * 100}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

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
