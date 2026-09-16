import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Search, Download, DollarSign, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { motion } from 'motion/react';

interface PaymentRecord {
  userId: string;
  firstName: string;
  lastName: string;
  group: string;
  currentMonth: { status: 'paid' | 'pending' | 'overdue' | 'waived'; paidAt: string | null; amount: number };
  history: { month: string; status: string }[];
}

const STATUS_CONFIG = {
  paid: { label: 'Paid', color: 'bg-emerald-500/15 text-emerald-400', icon: CheckCircle2 },
  pending: { label: 'Pending', color: 'bg-amber-500/15 text-amber-400', icon: Clock },
  overdue: { label: 'Overdue', color: 'bg-rose-500/15 text-rose-400', icon: AlertCircle },
  waived: { label: 'Waived', color: 'bg-white/10 text-muted-foreground', icon: CheckCircle2 },
};

const MONTH_DOT_COLOR: Record<string, string> = {
  paid: 'bg-emerald-500',
  pending: 'bg-amber-500',
  overdue: 'bg-rose-500',
  waived: 'bg-white/30',
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

  const exportCsv = () => {
    if (!data) return;
    const rows = [
      ['Name', 'Group', 'This Month', 'Paid At'],
      ...data.map(s => [
        `${s.firstName} ${s.lastName}`,
        s.group,
        s.currentMonth.status,
        s.currentMonth.paidAt || '',
      ]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'payments.csv'; a.click();
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
      {[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />)}
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
      className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm font-medium text-primary">Admin</p>
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="mt-1 text-muted-foreground">Track monthly tuition fee payments.</p>
        </div>
        <Button variant="outline" onClick={exportCsv} className="shrink-0">
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Paid', value: stats.paid, color: 'text-emerald-400', icon: CheckCircle2 },
          { label: 'Pending', value: stats.pending, color: 'text-amber-400', icon: Clock },
          { label: 'Overdue', value: stats.overdue, color: 'text-rose-400', icon: AlertCircle },
          { label: 'Collection Rate', value: `${stats.total ? Math.round((stats.paid / stats.total) * 100) : 0}%`,
            color: stats.paid / stats.total >= 0.8 ? 'text-emerald-400' : stats.paid / stats.total >= 0.5 ? 'text-amber-400' : 'text-rose-400',
            icon: DollarSign },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`w-5 h-5 shrink-0 ${s.color}`} />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters + Bulk action */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search students..." value={search}
            onChange={e => setSearch(e.target.value)} className="pl-9 h-10" />
        </div>
        <div className="flex gap-2">
          {(['all', 'paid', 'pending', 'overdue'] as const).map(f => (
            <Button key={f} variant={filter === f ? 'secondary' : 'outline'} size="sm"
              onClick={() => setFilter(f)} className="h-10 capitalize">{f}</Button>
          ))}
        </div>
        {selected.size > 0 && (
          <Button size="sm" className="h-10"
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
            <TableBody>
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
                    <TableCell className="text-sm text-muted-foreground">{s.group}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${st.color}`}>
                        {st.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        {s.history.slice(0, 3).map((h, i) => (
                          <span key={i} title={`${h.month}: ${h.status}`}
                            className={`w-3 h-3 rounded-full ${MONTH_DOT_COLOR[h.status] || 'bg-white/20'}`} />
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
