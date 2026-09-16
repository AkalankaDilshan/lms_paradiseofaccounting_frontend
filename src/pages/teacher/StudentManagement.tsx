import { Avatar } from '../../components/ui/avatar';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Upload, UserPlus } from 'lucide-react';

export function StudentManagement() {
  const students = [
    { id: 'u1', name: 'Kasun Perera', email: 'kasun@test.com', group: 'G12-HATTON', status: 'active' },
    { id: 'u2', name: 'Nimal Silva', email: 'nimal@test.com', group: 'G13-NAWALAPITIYA', status: 'active' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div><h1 className="text-3xl font-bold tracking-tight text-primary">Student Management</h1><p className="mt-1 text-muted-foreground">Manage enrollments, CSV imports, and groups.</p></div>
        <div className="flex gap-2"><Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Import CSV</Button><Button><UserPlus className="mr-2 h-4 w-4" /> Add Student</Button></div>
      </div>
      <Card><CardContent className="p-0"><Table>
        <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Groups</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
        <TableBody>{students.map((student) => <TableRow key={student.id}>
          <TableCell><div className="flex items-center gap-3"><Avatar id={student.id} name={student.name} size="sm" /><span className="font-medium">{student.name}</span></div></TableCell>
          <TableCell>{student.email}</TableCell><TableCell><span className="rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground">{student.group}</span></TableCell>
          <TableCell><span className="rounded-full bg-success/20 px-2 py-1 text-xs font-medium capitalize text-success">{student.status}</span></TableCell>
        </TableRow>)}</TableBody>
      </Table></CardContent></Card>
    </div>
  );
}
