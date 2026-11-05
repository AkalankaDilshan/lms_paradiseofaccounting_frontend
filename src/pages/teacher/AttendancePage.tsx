import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { CalendarDays, Check, Download, FileBarChart, Save, UserCheck, Users, UserX, X } from 'lucide-react';
import { apiClient } from '../../api/client';
import { useStudents } from '../../api/queries';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Avatar } from '../../components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { EmptyState, PageHeader, Skeleton, StatCard } from '../../components/common';
import { downloadCsv } from '../../lib/csv';
import { cn } from '../../lib/utils';

const GROUPS = [
  '2028-GINIGATHHENA', '2028-HATTON', '2028-NAWALAPITIYA', '2028-ONLINE',
  '2027-GINIGATHHENA', '2027-HATTON', '2027-NAWALAPITIYA', '2027-ONLINE', 'REVISION',
];

type Mark = 'present' | 'absent';

interface MonthlyReport {
  groupId: string;
  month: string;
  dates: string[];
  students: { userId: string; firstName: string; lastName: string; present: number; absent: number; percentage: number | null; days: Record<string, string> }[];
}

const selectClass =
  'h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30';

export function AttendancePage() {
  const [tab, setTab] = useState<'take' | 'report'>('take');
  const [group, setGroup] = useState(GROUPS[0]);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Students" title="Attendance" description="Mark each class, then review monthly attendance per group." />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="inline-flex w-fit rounded-xl border border-border bg-muted/40 p-1">
          {([
            { id: 'take', label: 'Take attendance', icon: CalendarDays },
            { id: 'report', label: 'Monthly report', icon: FileBarChart },
          ] as const).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn('relative rounded-lg px-3 py-1.5 text-sm font-medium transition-colors', tab === t.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}
            >
              {tab === t.id && (
                <motion.span layoutId="attendance-tab" className="absolute inset-0 rounded-lg bg-background shadow-sm ring-1 ring-border" transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }} />
              )}
              <span className="relative inline-flex items-center gap-1.5">
                <t.icon className="size-3.5" /> {t.label}
              </span>
            </button>
          ))}
        </div>
        <div className="w-full space-y-1.5 sm:w-56">
          <Label htmlFor="att-group">Group</Label>
          <select id="att-group" value={group} onChange={(e) => setGroup(e.target.value)} className={selectClass}>
            {GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
      </div>

      {tab === 'take' ? <TakeAttendance group={group} /> : <AttendanceReport group={group} />}
    </div>
  );
}

function TakeAttendance({ group }: { group: string }) {
  const queryClient = useQueryClient();
  const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [marks, setMarks] = useState<Record<string, Mark>>({});
  const [saved, setSaved] = useState(false);
  const { data: students, isLoading } = useStudents();

  const { data: day } = useQuery({
    queryKey: ['attendance', date, group],
    meta: { errorContext: 'load attendance for this day' },
    queryFn: async () => (await apiClient.get('/attendance', { params: { date, groupId: group } })).data as { records: Record<string, Mark> },
  });
  useEffect(() => {
    setMarks(day?.records ?? {});
    setSaved(false);
  }, [day]);

  const roster = useMemo(
    () => (students ?? []).filter((s) => s.status !== 'suspended' && (s.groups ?? []).includes(group)).sort((a, b) => a.firstName.localeCompare(b.firstName)),
    [students, group],
  );

  const save = useMutation({
    meta: { errorContext: 'save attendance', successMessage: 'Attendance saved' },
    mutationFn: async () => apiClient.post('/attendance', { date, groupId: group, records: marks }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendanceReport'] });
      setSaved(true);
    },
  });

  const setMark = (userId: string, mark: Mark) => {
    setMarks((m) => ({ ...m, [userId]: mark }));
    setSaved(false);
  };
  const markAll = (mark: Mark) => {
    setMarks((m) => ({ ...m, ...Object.fromEntries(roster.map((s) => [s.userId, mark])) }));
    setSaved(false);
  };

  const present = roster.filter((s) => marks[s.userId] === 'present').length;
  const absent = roster.filter((s) => marks[s.userId] === 'absent').length;
  const unmarked = roster.length - present - absent;

  return (
    <div className="space-y-6">
      <div className="stagger grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="py-4">
          <CardContent className="space-y-1.5">
            <Label htmlFor="att-date">Class date</Label>
            <Input id="att-date" type="date" value={date} max={format(new Date(), 'yyyy-MM-dd')} onChange={(e) => setDate(e.target.value)} />
          </CardContent>
        </Card>
        <StatCard label="Present" icon={UserCheck} value={present} tone="success" progress={roster.length ? (present / roster.length) * 100 : null} />
        <StatCard label="Absent" icon={UserX} value={absent} tone="destructive" />
        <StatCard label="Not marked" icon={Users} value={unmarked} tone="warning" hint={`${roster.length} in group`} />
      </div>

      <Card className="gap-0 py-0">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-border py-4">
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="size-4 text-primary" /> {group} · {format(new Date(`${date}T00:00:00`), 'EEE d MMM yyyy')}
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => markAll('present')} disabled={!roster.length}>
              <Check className="text-success" /> All present
            </Button>
            <Button variant="outline" size="sm" onClick={() => markAll('absent')} disabled={!roster.length}>
              <X className="text-destructive" /> All absent
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : roster.length === 0 ? (
            <EmptyState icon={Users} title="No students in this group" description="Assign students to groups from Student management." />
          ) : (
            <div className="stagger divide-y divide-border">
              {roster.map((s) => {
                const mark = marks[s.userId];
                return (
                  <div key={s.userId} className="flex items-center gap-3 px-4 py-2.5">
                    <Avatar id={s.userId} name={`${s.firstName} ${s.lastName}`} size="sm" />
                    <p className="min-w-0 flex-1 truncate text-sm font-medium">
                      {s.firstName} {s.lastName}
                    </p>
                    <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
                      {(['present', 'absent'] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          aria-pressed={mark === m}
                          onClick={() => setMark(s.userId, m)}
                          className={cn(
                            'flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-all',
                            mark === m
                              ? m === 'present'
                                ? 'bg-success text-white shadow-sm'
                                : 'bg-destructive text-white shadow-sm'
                              : 'text-muted-foreground hover:text-foreground',
                          )}
                        >
                          {m === 'present' ? <Check className="size-3.5" /> : <X className="size-3.5" />}
                          <span className="hidden sm:inline">{m}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="sticky bottom-4 z-10 flex items-center gap-3">
        <Button size="lg" className="shadow-lg" onClick={() => save.mutate()} disabled={save.isPending || roster.length === 0}>
          <Save /> {save.isPending ? 'Saving…' : 'Save attendance'}
        </Button>
        {saved && (
          <motion.p initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-1 text-sm text-success">
            <Check className="size-4" /> Saved
          </motion.p>
        )}
      </div>
    </div>
  );
}

function AttendanceReport({ group }: { group: string }) {
  const [month, setMonth] = useState(() => format(new Date(), 'yyyy-MM'));
  const { data, isLoading, isError } = useQuery({
    queryKey: ['attendanceReport', group, month],
    meta: { errorToast: false },
    queryFn: async () => (await apiClient.get('/attendance/report', { params: { groupId: group, month } })).data as MonthlyReport,
  });

  const exportCsv = () => {
    if (!data) return;
    downloadCsv(
      `attendance-${group}-${month}.csv`,
      ['First name', 'Last name', 'Present', 'Absent', 'Attendance %', ...data.dates],
      data.students.map((s) => [s.firstName, s.lastName, s.present, s.absent, s.percentage ?? '', ...data.dates.map((d) => s.days[d] ?? '')]),
    );
  };

  const classAverage = data && data.students.length ? data.students.reduce((sum, s) => sum + (s.percentage ?? 0), 0) / data.students.length : null;
  const lowAttendance = (data?.students ?? []).filter((s) => s.percentage !== null && s.percentage < 75).length;

  return (
    <div className="space-y-6">
      <div className="stagger grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="py-4">
          <CardContent className="space-y-1.5">
            <Label htmlFor="att-month">Month</Label>
            <Input id="att-month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          </CardContent>
        </Card>
        <StatCard label="Classes held" icon={CalendarDays} value={data?.dates.length ?? null} tone="info" />
        <StatCard label="Average attendance" icon={UserCheck} value={classAverage} decimals={0} suffix="%" tone="success" progress={classAverage} />
        <StatCard label="Below 75%" icon={UserX} value={data ? lowAttendance : null} tone="warning" hint="Students who may need a follow-up" />
      </div>

      <Card className="gap-0 py-0">
        <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-border py-4">
          <CardTitle>
            {group} · {format(new Date(`${month}-01T00:00:00`), 'MMMM yyyy')}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={!data || data.students.length === 0}>
            <Download /> Export CSV
          </Button>
        </CardHeader>
        <CardContent className="px-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : isError ? (
            <EmptyState icon={FileBarChart} title="Couldn’t load the report" description="Please try again in a moment." />
          ) : !data || data.students.length === 0 ? (
            <EmptyState icon={FileBarChart} title="No attendance recorded" description="Nothing was marked for this group in this month." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-card pl-4">Student</TableHead>
                    <TableHead className="text-right">Attendance</TableHead>
                    {data.dates.map((d) => (
                      <TableHead key={d} className="text-center text-xs">
                        {format(new Date(`${d}T00:00:00`), 'd')}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.students.map((s) => (
                    <TableRow key={s.userId}>
                      <TableCell className="sticky left-0 bg-card pl-4 font-medium">
                        {s.firstName || s.lastName ? `${s.firstName} ${s.lastName}` : <span className="text-muted-foreground">Former student</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={cn('font-semibold tabular-nums', s.percentage === null ? 'text-muted-foreground' : s.percentage >= 75 ? 'text-success' : s.percentage >= 50 ? 'text-warning' : 'text-destructive')}>
                          {s.percentage === null ? '—' : `${Math.round(s.percentage)}%`}
                        </span>
                        <span className="ml-1.5 text-xs text-muted-foreground tabular-nums">
                          {s.present}/{s.present + s.absent}
                        </span>
                      </TableCell>
                      {data.dates.map((d) => (
                        <TableCell key={d} className="text-center">
                          <span
                            title={`${d}: ${s.days[d] ?? 'not marked'}`}
                            className={cn('inline-block size-2.5 rounded-full', s.days[d] === 'present' ? 'bg-success' : s.days[d] === 'absent' ? 'bg-destructive' : 'bg-muted')}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
