import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Search, Download, DollarSign, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { Badge } from '../../components/ui/badge';
import { GroupBadge } from '../../components/GroupBadge';
import { EmptyState, PageHeader, Skeleton, StatCard } from '../../components/common';
import { downloadCsv } from '../../lib/csv';
import { cn } from '../../lib/utils';

interface PaymentRecord {
  userId: string;
  firstName: string;
  lastName: string;
  groups: string[];
  currentMonth: { status: 'paid' | 'pending' | 'overdue' | 'waived'; paidAt: string | null; amount: number };
  history: { month: string; status: string }[];
}

const STATUS_CONFIG = {
  paid: { label: 'Paid', variant: 'success' as const, icon: CheckCircle2 },
  pending: { label: 'Pending', variant: 'warning' as const, icon: Clock },
  overdue: { label: 'Overdue', variant: 'destructive' as const, icon: AlertCircle },
  waived: { label: 'Waived', variant: 'default' as const, icon: CheckCircle2 },
};

const MONTH_DOT_COLOR: Record<string, string> = {
  paid: 'bg-success',
  pending: 'bg-warning',
  overdue: 'bg-destructive',
  waived: 'bg-muted-foreground/40',
};

export function PaymentsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const res = await apiClient.get('/payments');
      return res.data.items as PaymentRecord[];
    },
  });

  const markPaid = useMutation({
    mutationFn: async (userIds: string[]) => {
      const currentMonth = new Date().toISOString().slice(0, 7);
      await Promise.all(userIds.map(id =>
        apiClient.put(`/payments/${id}/${currentMonth}`, { status: 'paid', paidAt: new Date().toISOString() })
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setSelected(new Set());
    },
  });

  // Exports what's on screen (search + filter applied), with every month
  // of history the roster carries as its own column
  const exportCsv = () => {
    const months = Array.from(new Set(filtered.flatMap(s => s.history.map(h => h.month)))).sort().reverse();
    downloadCsv(
      `payments-${new Date().toISOString().slice(0, 7)}.csv`,
      ['First name', 'Last name', 'Groups', 'This month', 'Amount', 'Paid at', ...months],
      filtered.map(s => [
        s.firstName,
        s.lastName,
        s.groups.join(' '),
        s.currentMonth.status,
        s.currentMonth.amount ?? '',
        s.currentMonth.paidAt ? new Date(s.currentMonth.paidAt).toLocaleDateString() : '',
        ...months.map(m => s.history.find(h => h.month === m)?.status ?? ''),
      ]),
    );
  };

  const filtered = (data ?? []).filter(s => {
    const name = `${s.firstName} ${s.lastName}`.toLowerCase();
    const matchSearch = name.includes(search.toLowerCase());
    const matchFilter = filter === 'all' || s.currentMonth.status === filter;
    return matchSearch && matchFilter;
  });

  const stats = {
    paid: (data ?? []).filter(s => s.currentMonth.status === 'paid').length,
    pending: (data ?? []).filter(s => s.currentMonth.status === 'pending').length,
    overdue: (data ?? []).filter(s => s.currentMonth.status === 'overdue').length,
    total: (data ?? []).length,
  };

  if (isLoading) return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
      {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14" />)}
    </div>
  );
  const rate = stats.total ? (stats.paid / stats.total) * 100 : null;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
      className="space-y-6">
      <PageHeader
        eyebrow="Students"
        title="Payments"
        description={`Monthly tuition fees for ${new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}.`}
        actions={
          <Button variant="outline" onClick={exportCsv} disabled={filtered.length === 0}>
            <Download /> Export CSV
          </Button>
        }
      />

      <div className="stagger grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Paid" icon={CheckCircle2} value={stats.paid} tone="success" onClick={() => setFilter('paid')} />
        <StatCard label="Pending" icon={Clock} value={stats.pending} tone="warning" onClick={() => setFilter('pending')} />
        <StatCard label="Overdue" icon={AlertCircle} value={stats.overdue} tone="destructive" onClick={() => setFilter('overdue')} />
        <StatCard label="Collection rate" icon={DollarSign} value={rate} suffix="%" progress={rate}
          tone={rate === null ? 'primary' : rate >= 80 ? 'success' : rate >= 50 ? 'warning' : 'destructive'} />
      </div>

      {/* Filters + Bulk action */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search students..." value={search}
            onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
        <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5 text-xs">
          {(['all', 'paid', 'pending', 'overdue'] as const).map(f => (
            <button key={f} type="button" onClick={() => setFilter(f)}
              className={cn('rounded-md px-2.5 py-1 font-medium capitalize text-muted-foreground transition-colors',
                filter === f && 'bg-background text-foreground shadow-sm')}>{f}</button>
          ))}
        </div>
        {selected.size > 0 && (
          <Button className="h-9"
            onClick={() => markPaid.mutate(Array.from(selected))}
            disabled={markPaid.isPending}>
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            Mark {selected.size} as Paid
          </Button>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">
                  <input type="checkbox" className="accent-primary"
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={e => setSelected(e.target.checked ? new Set(filtered.map(s => s.userId)) : new Set())} />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>This Month</TableHead>
                <TableHead>Last 3 Months</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="stagger">
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6}><EmptyState icon={DollarSign} title="No students match" className="py-8" /></TableCell></TableRow>
              )}
              {filtered.map((s) => {
                const st = STATUS_CONFIG[s.currentMonth.status] || STATUS_CONFIG.pending;
                return (
                  <TableRow key={s.userId}>
                    <TableCell>
                      <input type="checkbox" className="accent-primary"
                        checked={selected.has(s.userId)}
                        onChange={e => {
                          const next = new Set(selected);
                          e.target.checked ? next.add(s.userId) : next.delete(s.userId);
                          setSelected(next);
                        }} />
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-sm">{s.firstName} {s.lastName}</p>
                    </TableCell>
                    <TableCell><div className="flex flex-wrap gap-1">{s.groups.map(g => <GroupBadge key={g} group={g} />)}</div></TableCell>
                    <TableCell>
                      <Badge variant={st.variant} className="px-2 py-1">{st.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        {s.history.slice(0, 3).map((h, i) => (
                          <span key={i} title={`${h.month}: ${h.status}`}
                            className={`w-3 h-3 rounded-full ${MONTH_DOT_COLOR[h.status] || 'bg-muted'}`} />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm"
                        onClick={() => navigate(`/teacher/payments/${s.userId}`)}>
                        History
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}
