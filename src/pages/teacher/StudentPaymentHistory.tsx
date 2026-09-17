import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { ArrowLeft, Printer, CheckCircle2, X } from 'lucide-react';
import { motion } from 'motion/react';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  paid: { label: 'Paid', color: 'bg-success/15 text-success' },
  pending: { label: 'Pending', color: 'bg-warning/15 text-warning' },
  overdue: { label: 'Overdue', color: 'bg-destructive/15 text-destructive' },
  waived: { label: 'Waived', color: 'bg-white/10 text-muted-foreground' },
};

export function StudentPaymentHistory() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showNoteModal, setShowNoteModal] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['paymentHistory', studentId],
    queryFn: async () => {
      const res = await apiClient.get(`/payments/${studentId}`);
      return res.data;
    },
    enabled: !!studentId,
  });

  const updatePayment = useMutation({
    mutationFn: async ({ month, status, note }: { month: string; status: string; note?: string }) => {
      await apiClient.put(`/payments/${studentId}/${month}`, {
        status,
        paidAt: status === 'paid' ? new Date().toISOString() : null,
        note: note || '',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentHistory', studentId] });
      setShowNoteModal(null);
    },
  });

  const handlePrint = () => window.print();

  if (isLoading) return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />)}
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
      className="max-w-3xl mx-auto space-y-6 pb-16 print:px-8">
      <div className="flex items-center gap-4 print:hidden">
        <Button variant="ghost" size="icon" onClick={() => navigate('/teacher/payments')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">Payments</p>
          <h1 className="text-2xl font-bold">{data?.firstName} {data?.lastName}</h1>
        </div>
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-2" /> Print / PDF
        </Button>
      </div>

      {/* Print header */}
      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold">Payment History — {data?.firstName} {data?.lastName}</h1>
        <p className="text-sm text-gray-600">Prepared by: Asela Samanpriya — Paradise of Accounting</p>
      </div>

      <Card>
        <CardHeader className="border-b border-white/10">
          <CardTitle>Payment History (Last 12 Months)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Paid Date</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right print:hidden">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.history ?? []).map((h: any) => {
                const st = STATUS_CONFIG[h.status] || STATUS_CONFIG.pending;
                return (
                  <TableRow key={h.month}>
                    <TableCell className="font-medium">{h.month}</TableCell>
                    <TableCell>LKR {(h.amount || 2500).toLocaleString()}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.color}`}>
                        {st.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {h.paidAt ? new Date(h.paidAt).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[150px]">
                      <span className="line-clamp-1">{h.note || '—'}</span>
                    </TableCell>
                    <TableCell className="text-right print:hidden">
                      <div className="flex justify-end gap-1">
                        {h.status !== 'paid' && (
                          <Button variant="ghost" size="sm"
                            onClick={() => updatePayment.mutate({ month: h.month, status: 'paid' })}>
                            <CheckCircle2 className="w-3.5 h-3.5 text-success mr-1" /> Mark Paid
                          </Button>
                        )}
                        <Button variant="ghost" size="sm"
                          onClick={() => { setShowNoteModal(h.month); setNoteText(h.note || ''); }}>
                          Note
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Note modal */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 print:hidden">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md">
            <Card>
              <div className="flex items-center justify-between p-5 border-b border-white/10">
                <h3 className="font-semibold">Edit Note — {showNoteModal}</h3>
                <button onClick={() => setShowNoteModal(null)}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>
              <CardContent className="p-5 space-y-4">
                <div className="space-y-2">
                  <Label>Note</Label>
                  <textarea className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-1 focus:ring-primary"
                    value={noteText} onChange={e => setNoteText(e.target.value)} />
                </div>
                <div className="flex gap-3">
                  <Button className="flex-1"
                    onClick={() => updatePayment.mutate({ month: showNoteModal, status: data?.history.find((h: any) => h.month === showNoteModal)?.status || 'pending', note: noteText })}
                    disabled={updatePayment.isPending}>
                    Save
                  </Button>
                  <Button variant="outline" onClick={() => setShowNoteModal(null)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
