import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { UserCheck, UserX, Users, Save, CalendarDays } from 'lucide-react';
import { motion } from 'motion/react';

const GROUPS = [
  '2028-GINIGATHHENA', '2028-HATTON', '2028-NAWALAPITIYA', '2028-ONLINE',
  '2027-GINIGATHHENA', '2027-HATTON', '2027-NAWALAPITIYA', '2027-ONLINE',
];

export function AttendancePage() {
  const queryClient = useQueryClient();
  const [selectedGroup, setSelectedGroup] = useState(GROUPS[0]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent'>>({});
  const [saved, setSaved] = useState(false);

  const { data: students } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/students');
      return res.data.items as any[];
    },
  });

  useQuery({
    queryKey: ['attendance', date, selectedGroup],
    queryFn: async () => {
      const res = await apiClient.get('/attendance', { params: { date, groupId: selectedGroup } });
      setAttendance(res.data.records || {});
      setSaved(false);
      return res.data;
    },
  });

  const saveAttendance = useMutation({
    mutationFn: async () => {
      await apiClient.post('/attendance', {
        date,
        groupId: selectedGroup,
        records: attendance,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      setSaved(true);
    },
  });

  const groupStudents = (students ?? []).filter(s => s.groups.includes(selectedGroup));

  const markAll = (status: 'present' | 'absent') => {
    const update: Record<string, 'present' | 'absent'> = {};
    groupStudents.forEach(s => { update[s.userId] = status; });
    setAttendance(prev => ({ ...prev, ...update }));
  };

  const presentCount = Object.values(attendance).filter(v => v === 'present').length;
  const absentCount = Object.values(attendance).filter(v => v === 'absent').length;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
      className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Class Management</p>
        <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
        <p className="mt-1 text-muted-foreground">Record and track class attendance.</p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Date</Label>
          <input type="date" value={date} onChange={e => { setDate(e.target.value); setSaved(false); }}
            className="h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <div className="space-y-2">
          <Label>Group</Label>
          <select value={selectedGroup} onChange={e => { setSelectedGroup(e.target.value); setSaved(false); }}
            className="h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
            {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-success">{presentCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Present</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-destructive">{absentCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Absent</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold">{groupStudents.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Total</p>
        </CardContent></Card>
      </div>

      {/* Attendance List */}
      <Card>
        <CardHeader className="border-b border-white/10 flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarDays className="w-4 h-4" /> {selectedGroup} — {date}
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => markAll('present')}>
              <UserCheck className="w-3.5 h-3.5 mr-1 text-success" /> All Present
            </Button>
            <Button variant="outline" size="sm" onClick={() => markAll('absent')}>
              <UserX className="w-3.5 h-3.5 mr-1 text-destructive" /> All Absent
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {groupStudents.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Users className="mx-auto mb-3 h-8 w-8 opacity-30" />
              <p className="text-sm">No students in this group.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {groupStudents.map(s => {
                const status = attendance[s.userId];
                return (
                  <div key={s.userId}
                    className="flex items-center justify-between gap-4 p-3 rounded-lg border border-white/10 hover:bg-muted/40 transition-colors">
                    <div>
                      <p className="text-sm font-medium">{s.firstName} {s.lastName}</p>
                      <p className="text-xs text-muted-foreground">{s.school}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={status === 'present' ? 'default' : 'outline'}
                        className={`h-8 ${status === 'present' ? 'bg-success hover:bg-success/90 text-white border-0' : ''}`}
                        onClick={() => setAttendance(prev => ({ ...prev, [s.userId]: 'present' }))}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant={status === 'absent' ? 'default' : 'outline'}
                        className={`h-8 ${status === 'absent' ? 'bg-destructive hover:bg-destructive/90 text-white border-0' : ''}`}
                        onClick={() => setAttendance(prev => ({ ...prev, [s.userId]: 'absent' }))}
                      >
                        <UserX className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="flex items-center gap-4">
        <Button className="w-full sm:w-auto" onClick={() => saveAttendance.mutate()}
          disabled={saveAttendance.isPending}>
          <Save className="w-4 h-4 mr-2" />
          {saveAttendance.isPending ? 'Saving...' : 'Save Attendance'}
        </Button>
        {saved && (
          <p className="text-sm text-success flex items-center gap-1">
            <UserCheck className="w-4 h-4" /> Saved successfully!
          </p>
        )}
      </div>
    </motion.div>
  );
}
