import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Award, BarChart3, Target, TrendingUp, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { percent, useTrend } from '../../api/queries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { EmptyState, PageHeader, PageSkeleton, StatCard } from '../../components/common';
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

export function StudentTrend() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading, error } = useTrend(user?.sub);

  const rows = useMemo(
    () =>
      (data ?? []).map((item) => ({
        ...item,
        pct: item.percentage ?? percent(item.score, item.maxScore),
        label: format(new Date(item.submittedAt), 'd MMM'),
      })),
    [data],
  );

  if (isLoading) return <PageSkeleton blocks={2} />;
  if (error) return <EmptyState icon={BarChart3} title="Couldn’t load your performance" description="Please refresh the page to try again." />;

  const avg = rows.length ? rows.reduce((s, r) => s + r.pct, 0) / rows.length : null;
  const best = rows.length ? Math.max(...rows.map((r) => r.pct)) : null;
  const last = rows.at(-1)?.pct ?? null;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Performance" title="Your progress" description="Every submitted quiz, as a percentage, over time." />

      <section className="stagger grid gap-4 sm:grid-cols-3">
        <StatCard label="Average" icon={Target} value={avg} decimals={1} suffix="%" tone="primary" progress={avg} />
        <StatCard label="Best score" icon={Award} value={best} decimals={1} suffix="%" tone="accent" />
        <StatCard label="Latest" icon={TrendingUp} value={last} decimals={1} suffix="%" tone={last !== null && avg !== null && last >= avg ? 'success' : 'warning'} hint={last !== null && avg !== null ? (last >= avg ? 'At or above your average' : 'Below your average — keep going') : undefined} />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Score progression</CardTitle>
          <CardDescription>The dashed line is your average.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          {rows.length === 0 ? (
            <EmptyState icon={BarChart3} title="No attempts yet" description="Your chart starts after your first quiz." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
                <defs>
                  <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis unit="%" domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value) => [`${value}%`, 'Score']}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.quizTitle ?? ''}
                />
                {avg !== null && <ReferenceLine y={avg} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" />}
                <Area
                  type="monotone"
                  dataKey="pct"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  fill="url(#trendFill)"
                  dot={{ r: 3, fill: 'hsl(var(--primary))', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: 'hsl(var(--accent))', strokeWidth: 0 }}
                  animationDuration={900}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="gap-0 py-0">
        <CardHeader className="border-b border-border py-4">
          <CardTitle>Attempt history</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          {rows.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">No attempts recorded yet.</p>
          ) : (
            <div className="stagger divide-y divide-border">
              {[...rows].reverse().map((r, i) => (
                <button
                  key={r.attemptId ?? i}
                  type="button"
                  disabled={!r.attemptId}
                  onClick={() => r.attemptId && navigate(`/student/quizzes/${r.quizId}/results/${r.attemptId}`)}
                  className="group flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-muted/40 disabled:cursor-default"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-sinhala text-sm font-medium">{r.quizTitle || 'Quiz'}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(r.submittedAt), 'd MMM yyyy, h:mm a')}</p>
                  </div>
                  <div className="hidden w-32 sm:block">
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className={cn('h-full rounded-full', r.pct >= 75 ? 'bg-success' : r.pct >= 50 ? 'bg-warning' : 'bg-destructive')} style={{ width: `${r.pct}%` }} />
                    </div>
                  </div>
                  <div className="w-20 text-right">
                    <p className={cn('font-semibold tabular-nums', scoreTone(r.pct))}>{r.pct}%</p>
                    <p className="text-xs tabular-nums text-muted-foreground">
                      {r.score}/{r.maxScore}
                    </p>
                  </div>
                  {r.attemptId && <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
