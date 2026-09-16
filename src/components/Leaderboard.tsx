import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Avatar } from './ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Trophy } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  studentId?: string;
  firstName: string;
  score: number;
}

export function Leaderboard({ quizId }: { quizId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['leaderboard', quizId],
    queryFn: async () => {
      const res = await apiClient.get(`/analytics/quizzes/${quizId}/leaderboard`);
      return res.data.leaderboard as LeaderboardEntry[];
    },
  });

  if (isLoading) return <div className="p-4 text-center text-sm text-muted-foreground">Loading leaderboard...</div>;
  if (error || !data) return null;

  return (
    <Card className="mt-8 overflow-hidden border-primary/20">
      <CardHeader className="border-b border-primary/10 bg-primary/5 pb-4">
        <CardTitle className="flex items-center text-lg text-primary"><Trophy className="mr-2 h-5 w-5 text-accent" />Top Performers</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent"><TableHead className="w-16 text-center">Rank</TableHead><TableHead>Student</TableHead><TableHead className="pr-6 text-right">Score</TableHead></TableRow></TableHeader>
          <TableBody>
            {data.map((entry) => {
              const studentId = entry.studentId || `leaderboard-${entry.firstName.toLowerCase().replace(/\s+/g, '-')}`;
              return (
                <TableRow key={entry.rank} className={entry.rank === 1 ? 'bg-amber-500/10 dark:bg-amber-500/5' : entry.rank === 2 ? 'bg-slate-300/20 dark:bg-slate-300/5' : entry.rank === 3 ? 'bg-orange-700/10 dark:bg-orange-700/5' : ''}>
                  <TableCell className="text-center font-medium">{entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}</TableCell>
                  <TableCell className={entry.rank <= 3 ? 'font-semibold' : ''}><div className="flex items-center gap-3"><Avatar id={studentId} name={entry.firstName} size="sm" /><span>{entry.firstName}</span></div></TableCell>
                  <TableCell className="pr-6 text-right font-bold">{entry.score}</TableCell>
                </TableRow>
              );
            })}
            {data.length === 0 && <TableRow><TableCell colSpan={3} className="py-4 text-center text-muted-foreground">No attempts recorded yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
