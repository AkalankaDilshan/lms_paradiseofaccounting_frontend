import { Avatar } from '../../components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';

const activeStudents = [
  { id: 'student-akalanka', name: 'Akalanka Dilshan', group: 'Grade 13 · Hatton' },
  { id: 'student-kasun', name: 'Kasun Perera', group: 'Grade 12 · Ginigathhena' },
  { id: 'student-nimal', name: 'Nimal Silva', group: 'Revision · Nawalapitiya' },
  { id: 'student-tharushi', name: 'Tharushi Fernando', group: 'Grade 13 · Hatton' },
  { id: 'student-sachini', name: 'Sachini Bandara', group: 'Grade 12 · Ginigathhena' },
];

const quizAttempts = [
  { id: 'ATT-1048', studentId: 'student-kasun', student: 'Kasun Perera', quiz: 'Partnership Accounts — Paper 1', score: '86%', status: 'Completed' },
  { id: 'ATT-1047', studentId: 'student-tharushi', student: 'Tharushi Fernando', quiz: 'Depreciation Methods — Revision Paper', score: '72%', status: 'Completed' },
  { id: 'ATT-1046', studentId: 'student-nimal', student: 'Nimal Silva', quiz: 'Control Accounts — Grade 13', score: '—', status: 'In progress' },
  { id: 'ATT-1045', studentId: 'student-sachini', student: 'Sachini Bandara', quiz: 'Final Accounts — Paper 2', score: '—', status: 'Missed' },
];

const statusClasses: Record<string, string> = {
  Completed: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  'In progress': 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  Missed: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
};

export function TeacherDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Overview</p>
        <h1 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Monitor your A/L accounting classes and recent quiz activity.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          ['Active Students', '75', '+8 this month'],
          ['Published Quizzes', '12', '3 open this week'],
          ['Average Class Score', '78.4%', '+4.2% from last month'],
        ].map(([label, value, trend]) => (
          <Card key={label}>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground">{label}</p>
              <p className="mt-2 text-3xl font-bold">{value}</p>
              <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">{trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b">
            <CardTitle className="text-lg">Recent quiz attempts</CardTitle>
            <p className="text-sm text-muted-foreground">Latest submissions across Grade 12, Grade 13, and Revision.</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Attempt</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead className="hidden md:table-cell">Quiz</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quizAttempts.map((attempt) => (
                    <TableRow key={attempt.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">{attempt.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar id={attempt.studentId} name={attempt.student} size="sm" />
                          <span className="whitespace-nowrap font-medium">{attempt.student}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden max-w-[240px] truncate md:table-cell">{attempt.quiz}</TableCell>
                      <TableCell className="text-right font-semibold">{attempt.score}</TableCell>
                      <TableCell><span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClasses[attempt.status]}`}>{attempt.status}</span></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-lg">Recently active</CardTitle>
            <p className="text-sm text-muted-foreground">Students active in the last 24 hours.</p>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center pl-2">
              {activeStudents.slice(0, 5).map((student, index) => (
                <Avatar key={student.id} id={student.id} name={student.name} size="lg" className={index === 0 ? '' : '-ml-3'} />
              ))}
              <span className="ml-3 text-sm font-medium text-muted-foreground">+12</span>
            </div>
            <div className="space-y-3">
              {activeStudents.slice(0, 3).map((student) => (
                <div key={student.id} className="flex items-center gap-3">
                  <Avatar id={student.id} name={student.name} size="sm" />
                  <div className="min-w-0"><p className="truncate text-sm font-medium">{student.name}</p><p className="truncate text-xs text-muted-foreground">{student.group}</p></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
