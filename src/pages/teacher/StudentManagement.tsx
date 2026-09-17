import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { Avatar } from '../../components/ui/avatar';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Upload, UserPlus, Search, Trash2, Users, X, Plus } from 'lucide-react';
import { motion } from 'motion/react';

const GROUPS = [
  'G12-GINIGATHHENA', 'G12-HATTON', 'G12-NAWALAPITIYA',
  'G13-GINIGATHHENA', 'G13-HATTON', 'G13-NAWALAPITIYA', 'REVISION',
];

interface Student {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  school: string;
  examYear: number;
  address: string;
  role: string;
  status: string;
  verificationStatus: string;
  groups: string[];
}

export function StudentManagement() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGroupPanel, setShowGroupPanel] = useState<Student | null>(null);
  const [csvResult, setCsvResult] = useState<any>(null);
  const csvRef = useRef<HTMLInputElement>(null);

  // Add student form state
  const [addForm, setAddForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    school: '', examYear: '', address: '', password: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/students');
      return res.data.items as Student[];
    },
  });

  const addStudent = useMutation({
    mutationFn: async () => {
      await apiClient.post('/admin/students', {
        ...addForm,
        examYear: Number(addForm.examYear),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setShowAddModal(false);
      setAddForm({ firstName: '', lastName: '', email: '', phone: '', school: '', examYear: '', address: '', password: '' });
    },
  });

  const suspendStudent = useMutation({
    mutationFn: async (userId: string) => {
      await apiClient.delete(`/admin/students/${userId}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['students'] }),
  });

  const addGroupMutation = useMutation({
    mutationFn: async ({ userId, group }: { userId: string; group: string }) => {
      await apiClient.post(`/admin/students/${userId}/groups`, { group });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['students'] }),
  });

  const removeGroupMutation = useMutation({
    mutationFn: async ({ userId, group }: { userId: string; group: string }) => {
      await apiClient.delete(`/admin/students/${userId}/groups/${group}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['students'] }),
  });

  const importCsv = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiClient.post('/admin/students/csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: (data) => {
      setCsvResult(data);
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });

  const filtered = (data ?? []).filter(s =>
    `${s.firstName} ${s.lastName} ${s.email} ${s.school}`.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />
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
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-medium text-primary">Admin</p>
          <h1 className="text-3xl font-bold tracking-tight">Student Management</h1>
          <p className="mt-1 text-muted-foreground">
            {(data ?? []).length} students enrolled. Manage enrollments, CSV imports, and groups.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" onClick={() => csvRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" /> Import CSV
          </Button>
          <input ref={csvRef} type="file" accept=".csv" className="hidden"
            onChange={e => e.target.files?.[0] && importCsv.mutate(e.target.files[0])} />
          <Button onClick={() => setShowAddModal(true)}>
            <UserPlus className="mr-2 h-4 w-4" /> Add Student
          </Button>
        </div>
      </div>

      {/* CSV result */}
      {csvResult && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start justify-between gap-4">
          <div>
            <p className="font-medium text-sm">CSV Import Complete</p>
            <p className="text-sm text-muted-foreground mt-1">
              Imported {csvResult.imported}/{csvResult.total} students.
              {csvResult.failed > 0 && <span className="text-warning ml-1">{csvResult.failed} failed.</span>}
            </p>
          </div>
          <button onClick={() => setCsvResult(null)} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search by name, email, school..."
          value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10" />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <Users className="mx-auto mb-3 h-8 w-8 opacity-30" />
              <p className="text-sm">No students found.</p>
            </div>
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
              <TableBody>
                {filtered.map((student) => (
                  <TableRow key={student.userId}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar id={student.userId} name={`${student.firstName} ${student.lastName}`} size="sm" />
                        <div>
                          <p className="font-medium text-sm">{student.firstName} {student.lastName}</p>
                          <p className="text-xs text-muted-foreground">{student.school}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{student.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {student.groups.map(g => (
                          <span key={g} className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs">
                            {g}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium
                        ${student.status === 'active' ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'}`}>
                        {student.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm"
                          onClick={() => setShowGroupPanel(student)}>
                          <Users className="w-4 h-4 mr-1" /> Groups
                        </Button>
                        <Button variant="ghost" size="icon"
                          onClick={() => suspendStudent.mutate(student.userId)}
                          disabled={suspendStudent.isPending}
                          title="Suspend student">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
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
              <CardHeader className="border-b border-white/10 flex flex-row items-center justify-between">
                <CardTitle>Add New Student</CardTitle>
                <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground">
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
                  { id: 'password', label: 'Temporary Password', type: 'password' },
                  { id: 'phone', label: 'Phone' },
                  { id: 'school', label: 'School' },
                  { id: 'examYear', label: 'A/L Exam Year', type: 'number' },
                  { id: 'address', label: 'Address (Optional)' },
                ].map(f => (
                  <div key={f.id} className="space-y-2">
                    <Label htmlFor={f.id}>{f.label}</Label>
                    <Input id={f.id} type={f.type || 'text'} value={(addForm as any)[f.id]}
                      onChange={e => setAddForm(prev => ({ ...prev, [f.id]: e.target.value }))}
                      className="h-10" />
                  </div>
                ))}
                <div className="flex gap-3 pt-2">
                  <Button onClick={() => addStudent.mutate()} disabled={addStudent.isPending} className="flex-1">
                    {addStudent.isPending ? 'Adding...' : 'Add Student'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
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
                  <div key={g} className="flex items-center justify-between p-3 rounded-lg border border-white/10">
                    <span className="text-sm">{g}</span>
                    {inGroup ? (
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"
                        onClick={() => removeGroupMutation.mutate({ userId: showGroupPanel.userId, group: g })}>
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
