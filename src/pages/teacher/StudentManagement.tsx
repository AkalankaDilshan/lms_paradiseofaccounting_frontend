import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { apiClient } from '../../api/client';
import { Avatar } from '../../components/ui/avatar';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Upload, UserPlus, Search, Users, X, Plus, Download, RotateCcw, Ban, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { Badge } from '../../components/ui/badge';
import { GroupBadge } from '../../components/GroupBadge';
import { EmptyState, PageHeader, Skeleton } from '../../components/common';
import { useAuth } from '../../contexts/AuthContext';
import { downloadCsv } from '../../lib/csv';
import { cn } from '../../lib/utils';
import { confirm, notifyError, showAlert } from '../../lib/feedback';

const GROUPS = [
  '2028-GINIGATHHENA', '2028-HATTON', '2028-NAWALAPITIYA', '2028-ONLINE',
  '2027-GINIGATHHENA', '2027-HATTON', '2027-NAWALAPITIYA', '2027-ONLINE', 'REVISION',
];

// Keep in sync with EXAM_YEARS / CLASS_CENTERS in Backend/shared/models.py.
const EXAM_YEARS = ['2027', '2028'];
const CLASS_CENTERS = [
  { value: 'GINIGATHHENA', label: 'Ginigathhena' },
  { value: 'HATTON', label: 'Hatton' },
  { value: 'NAWALAPITIYA', label: 'Nawalapitiya' },
  { value: 'ONLINE', label: 'Online (Islandwide)' },
];

interface Student {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  school: string;
  examYear: number;
  center: string;
  address: string;
  role: string;
  status: string;
  verificationStatus: string;
  groups: string[];
}

interface CsvImportResult {
  total: number;
  created: number;
  failed: number;
  results: { row: number; email: string; status: 'created' | 'failed'; reason?: string }[];
}

const CSV_BATCH_ROWS = 25;

export function StudentManagement() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SuperAdmin';
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'suspended'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGroupPanel, setShowGroupPanel] = useState<Student | null>(null);
  const [csvResult, setCsvResult] = useState<CsvImportResult | null>(null);
  const [csvProgress, setCsvProgress] = useState('');
  const csvRef = useRef<HTMLInputElement>(null);

  // Add student form state
  const [addForm, setAddForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    school: '', examYear: EXAM_YEARS[0], center: CLASS_CENTERS[0].value, address: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['students'],
    meta: { errorContext: 'load the student list' },
    queryFn: async () => {
      const res = await apiClient.get('/admin/students');
      return res.data.items as Student[];
    },
  });

  const addStudent = useMutation({
    meta: { errorToast: false, successMessage: 'Student added', successDetail: 'They’ll receive an email with a temporary password.' },
    mutationFn: async () => {
      await apiClient.post('/admin/students', {
        ...addForm,
        examYear: Number(addForm.examYear),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setShowAddModal(false);
      setAddForm({ firstName: '', lastName: '', email: '', phone: '', school: '', examYear: EXAM_YEARS[0], center: CLASS_CENTERS[0].value, address: '' });
    },
    // A taken email gets its own warning dialog with a way to find that person;
    // everything else goes through the standard error feedback
    onError: (err) => {
      if (isAxiosError(err) && err.response?.status === 409) {
        const email = addForm.email.trim();
        showAlert({
          tone: 'warning',
          title: 'This email is already registered',
          message: `${email} already has an account, so a new student can't be created with it. They may have signed up themselves and be waiting for approval, or already be in your student list. Use a different email, or open the existing student.`,
          primary: {
            label: 'Show existing student',
            onClick: () => {
              setShowAddModal(false);
              addStudent.reset();
              setStatusFilter('all');
              setSearch(email);
            },
          },
        });
        return;
      }
      notifyError(err, 'add the student');
    },
  });

  const suspendStudent = useMutation({
    meta: { errorContext: 'suspend the student', successMessage: 'Student suspended' },
    mutationFn: async (userId: string) => {
      await apiClient.delete(`/admin/students/${userId}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['students'] }),
  });

  // Undo a suspension — re-enables the Cognito user (SuperAdmin only)
  const reactivateStudent = useMutation({
    meta: { errorContext: 'reactivate the student', successMessage: 'Student reactivated' },
    mutationFn: async (userId: string) => {
      await apiClient.post(`/admin/students/${userId}/reactivate`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['students'] }),
  });

  // Self-registered students start status="pending" with no Cognito "Student"
  // group (see post_confirmation.py) — approving adds the group and flips
  // them to active so their next session refresh unlocks full access.
  const approveStudent = useMutation({
    meta: { errorContext: 'approve the student', successMessage: 'Student approved', successDetail: 'They get full access the next time they sign in.' },
    mutationFn: async (userId: string) => {
      await apiClient.post(`/admin/students/${userId}/approve`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['students'] }),
  });

  const addGroupMutation = useMutation({
    meta: { errorContext: 'add the group', successMessage: 'Group added' },
    mutationFn: async ({ userId, group }: { userId: string; group: string }) => {
      await apiClient.post(`/admin/students/${userId}/groups`, { groupId: group });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['students'] }),
  });

  const removeGroupMutation = useMutation({
    meta: { errorContext: 'remove the group', successMessage: 'Group removed' },
    mutationFn: async ({ userId, group }: { userId: string; group: string }) => {
      await apiClient.delete(`/admin/students/${userId}/groups/${group}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['students'] }),
  });

  // The API takes raw CSV text, at most CSV_BATCH_ROWS rows per request (each
  // row is two Cognito calls, and a request must finish within 30 s), so
  // larger files go up in batches that repeat the header row.
  const importCsv = useMutation({
    meta: { errorContext: 'import the CSV' },
    mutationFn: async (file: File): Promise<CsvImportResult> => {
      const lines = (await file.text()).replace(/^\uFEFF/, '').split(/\r?\n/);
      const header = lines[0] ?? '';
      const rows = lines.slice(1).filter(l => l.trim());
      const combined: CsvImportResult = { total: 0, created: 0, failed: 0, results: [] };
      for (let start = 0; start < rows.length; start += CSV_BATCH_ROWS) {
        const batch = rows.slice(start, start + CSV_BATCH_ROWS);
        setCsvProgress(`Importing rows ${start + 1}–${start + batch.length} of ${rows.length}...`);
        const res = await apiClient.post('/admin/students/csv', [header, ...batch].join('\n'), {
          headers: { 'Content-Type': 'text/csv' },
        });
        const data = res.data as CsvImportResult;
        combined.total += data.total;
        combined.created += data.created;
        combined.failed += data.failed;
        // Backend numbers rows per batch — make them file-wide
        combined.results.push(...data.results.map(r => ({ ...r, row: r.row + start })));
      }
      return combined;
    },
    onSuccess: (data) => {
      setCsvResult(data);
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
    onSettled: () => setCsvProgress(''),
  });

  const filtered = (data ?? []).filter(s =>
    (statusFilter === 'all' || s.status === statusFilter) &&
    `${s.firstName} ${s.lastName} ${s.email} ${s.school} ${s.center} ${s.groups.join(' ')}`.toLowerCase().includes(search.toLowerCase())
  );
  const counts = {
    all: (data ?? []).length,
    active: (data ?? []).filter(s => s.status === 'active').length,
    pending: (data ?? []).filter(s => s.status === 'pending').length,
    suspended: (data ?? []).filter(s => s.status === 'suspended').length,
  };

  const exportStudents = () =>
    downloadCsv(
      `students-${new Date().toISOString().slice(0, 10)}.csv`,
      ['First name', 'Last name', 'Email', 'Phone', 'School', 'Exam year', 'Center', 'Groups', 'Status'],
      filtered.map(s => [s.firstName, s.lastName, s.email, s.phone, s.school, s.examYear || '', s.center, s.groups.join(' '), s.status]),
    );

  const confirmSuspend = async (student: Student) => {
    if (await confirm({
      title: `Suspend ${student.firstName} ${student.lastName}?`,
      description: 'They’ll be signed out everywhere and can’t start quizzes or download materials until a SuperAdmin reactivates them. Their results are kept.',
      confirmLabel: 'Suspend student',
    })) {
      suspendStudent.mutate(student.userId);
    }
  };

  if (isLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-72" />
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-14" />
      ))}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <PageHeader
        eyebrow="Students"
        title="Student management"
        description={`${counts.all} students enrolled. Approve sign-ups, assign groups, import from CSV.`}
        actions={
          <>
            <Button variant="outline" onClick={exportStudents} disabled={filtered.length === 0}>
              <Download /> Export
            </Button>
            <Button variant="outline" onClick={() => csvRef.current?.click()} disabled={importCsv.isPending}>
              <Upload /> Import CSV
            </Button>
            <input ref={csvRef} type="file" accept=".csv" className="hidden"
              onChange={e => { if (e.target.files?.[0]) importCsv.mutate(e.target.files[0]); e.target.value = ''; }} />
            <Button onClick={() => setShowAddModal(true)}>
              <UserPlus /> Add student
            </Button>
          </>
        }
      />

      {csvProgress && <p className="text-sm text-muted-foreground">{csvProgress}</p>}
      {importCsv.isError && (
        <p className="text-sm font-medium text-destructive">CSV import stopped part-way — students already listed below were created; re-import only the missing rows.</p>
      )}

      {/* CSV result */}
      {csvResult && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start justify-between gap-4">
          <div>
            <p className="font-medium text-sm">CSV Import Complete</p>
            <p className="text-sm text-muted-foreground mt-1">
              Imported {csvResult.created}/{csvResult.total} students.
              {csvResult.failed > 0 && <span className="text-warning ml-1">{csvResult.failed} failed.</span>}
            </p>
            {csvResult.failed > 0 && (
              <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                {csvResult.results.filter(r => r.status === 'failed').map(r => (
                  <li key={r.row}>Row {r.row}{r.email ? ` (${r.email})` : ''}: {r.reason}</li>
                ))}
              </ul>
            )}
          </div>
          <button onClick={() => setCsvResult(null)} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search + status filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search name, email, school, group…"
            value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
        <div className="inline-flex w-fit flex-wrap rounded-lg border border-border bg-muted/40 p-0.5 text-xs">
          {(['all', 'active', 'pending', 'suspended'] as const).map(f => (
            <button key={f} type="button" onClick={() => setStatusFilter(f)}
              className={cn('rounded-md px-2.5 py-1 font-medium capitalize text-muted-foreground transition-colors',
                statusFilter === f && 'bg-background text-foreground shadow-sm')}>
              {f} <span className={cn('ml-1 tabular-nums', f === 'pending' && counts.pending > 0 && 'text-warning')}>{counts[f]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState icon={Users} title="No students found"
              description={search || statusFilter !== 'all' ? 'Try a different search or filter.' : 'Add students one by one, or import a CSV.'} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Groups</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="stagger">
                {filtered.map((student) => (
                  <TableRow key={student.userId} className={cn('transition-colors', student.status === 'suspended' && 'opacity-60')}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar id={student.userId} name={`${student.firstName} ${student.lastName}`} size="sm" />
                        <div>
                          <p className="font-medium text-sm">{student.firstName} {student.lastName}</p>
                          <p className="text-xs text-muted-foreground">
                            {student.school}
                            {student.examYear ? ` · A/L ${student.examYear}` : ''}
                            {student.center ? ` · ${student.center}` : ''}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{student.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {student.groups.map(g => (
                          <GroupBadge key={g} group={g} />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        student.status === 'pending' ? 'warning'
                          : student.status === 'active' ? 'success'
                          : 'destructive'
                      }>
                        {student.status === 'pending' ? 'Pending approval' : student.status === 'active' ? 'Active' : 'Suspended'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {student.status === 'pending' && (
                          <Button variant="ghost" size="sm" className="text-success hover:text-success"
                            onClick={() => approveStudent.mutate(student.userId)}
                            disabled={approveStudent.isPending}>
                            <Check /> Approve
                          </Button>
                        )}
                        <Button variant="ghost" size="sm"
                          onClick={() => setShowGroupPanel(student)}>
                          <Users className="w-4 h-4 mr-1" /> Groups
                        </Button>
                        {isSuperAdmin && student.status === 'suspended' && (
                          <Button variant="ghost" size="sm"
                            onClick={() => reactivateStudent.mutate(student.userId)}
                            disabled={reactivateStudent.isPending}>
                            <RotateCcw /> Reactivate
                          </Button>
                        )}
                        {isSuperAdmin && student.status !== 'suspended' && (
                          <Button variant="ghost" size="icon"
                            onClick={() => confirmSuspend(student)}
                            disabled={suspendStudent.isPending}
                            title="Suspend student" aria-label={`Suspend ${student.firstName}`}>
                            <Ban className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg">
            <Card>
              <CardHeader className="border-b border-border flex flex-row items-center justify-between">
                <CardTitle>Add New Student</CardTitle>
                <button onClick={() => { setShowAddModal(false); addStudent.reset(); }} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </CardHeader>
              <CardContent className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: 'firstName', label: 'First Name' },
                    { id: 'lastName', label: 'Last Name' },
                  ].map(f => (
                    <div key={f.id} className="space-y-2">
                      <Label htmlFor={f.id}>{f.label}</Label>
                      <Input id={f.id} value={(addForm as any)[f.id]}
                        onChange={e => setAddForm(prev => ({ ...prev, [f.id]: e.target.value }))}
                        className="h-10" />
                    </div>
                  ))}
                </div>
                {[
                  { id: 'email', label: 'Email', type: 'email' },
                  { id: 'phone', label: 'Phone' },
                  { id: 'school', label: 'School' },
                ].map(f => (
                  <div key={f.id} className="space-y-2">
                    <Label htmlFor={f.id}>{f.label}</Label>
                    <Input id={f.id} type={f.type || 'text'} value={(addForm as any)[f.id]}
                      onChange={e => setAddForm(prev => ({ ...prev, [f.id]: e.target.value }))}
                      className="h-10" />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="examYear">A/L Exam Year</Label>
                    <select id="examYear" value={addForm.examYear}
                      onChange={e => setAddForm(prev => ({ ...prev, examYear: e.target.value }))}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                      {EXAM_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="center">Class Center</Label>
                    <select id="center" value={addForm.center}
                      onChange={e => setAddForm(prev => ({ ...prev, center: e.target.value }))}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                      {CLASS_CENTERS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address (Optional)</Label>
                  <Input id="address" value={addForm.address}
                    onChange={e => setAddForm(prev => ({ ...prev, address: e.target.value }))}
                    className="h-10" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Cognito emails the student a temporary password; they set their own at first sign-in.
                </p>
                <div className="flex gap-3 pt-2">
                  <Button onClick={() => addStudent.mutate()} disabled={addStudent.isPending} className="flex-1">
                    {addStudent.isPending ? 'Adding...' : 'Add Student'}
                  </Button>
                  <Button variant="outline" onClick={() => { setShowAddModal(false); addStudent.reset(); }}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Group Management Side Panel */}
      {showGroupPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            className="h-full w-80 bg-background border-l border-border p-6 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold">Group Assignment</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {showGroupPanel.firstName} {showGroupPanel.lastName}
                </p>
              </div>
              <button onClick={() => setShowGroupPanel(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {GROUPS.map(g => {
                const inGroup = showGroupPanel.groups.includes(g);
                return (
                  <div key={g} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <GroupBadge group={g} />
                    {inGroup ? (
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"
                        onClick={async () => {
                          const student = showGroupPanel;
                          if (await confirm({ title: `Remove ${student.firstName} from ${g}?`, description: 'They’ll stop seeing quizzes, announcements and materials for this group.', tone: 'warning', confirmLabel: 'Remove from group' }))
                            removeGroupMutation.mutate({ userId: student.userId, group: g });
                        }}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" className="text-success hover:text-success"
                        onClick={() => addGroupMutation.mutate({ userId: showGroupPanel.userId, group: g })}>
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
