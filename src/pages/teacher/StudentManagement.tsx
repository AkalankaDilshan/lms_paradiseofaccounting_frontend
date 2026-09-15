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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Student Management</h1>
          <p className="text-muted-foreground mt-1">Manage enrollments, CSV imports, and groups.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Upload className="w-4 h-4 mr-2" /> Import CSV</Button>
          <Button><UserPlus className="w-4 h-4 mr-2" /> Add Student</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Groups</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.email}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs">{s.group}</span>
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-success/20 text-success rounded-full text-xs font-medium capitalize">{s.status}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
