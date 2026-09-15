import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Trophy } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  firstName: string;
  score: number;
}

export function Leaderboard({ quizId }: { quizId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['leaderboard', quizId],
    queryFn: async () => {
      const res = await apiClient.get(`/analytics/quizzes/${quizId}/leaderboard`);
      return res.data.leaderboard as LeaderboardEntry[];
    }
  });

  if (isLoading) return <div className="p-4 text-center text-sm text-muted-foreground">Loading leaderboard...</div>;
  if (error || !data) return null;

  return (
    <Card className="mt-8 border-primary/20 overflow-hidden">
      <CardHeader className="bg-primary/5 pb-4 border-b border-primary/10">
        <CardTitle className="flex items-center text-lg text-primary">
          <Trophy className="w-5 h-5 mr-2 text-accent" />
          Top Performers
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-16 text-center">Rank</TableHead>
              <TableHead>Student</TableHead>
              <TableHead className="text-right pr-6">Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((entry) => (
              <TableRow key={entry.rank} className={
                entry.rank === 1 ? 'bg-amber-500/10 dark:bg-amber-500/5' :
                entry.rank === 2 ? 'bg-slate-300/20 dark:bg-slate-300/5' :
                entry.rank === 3 ? 'bg-orange-700/10 dark:bg-orange-700/5' : ''
              }>
                <TableCell className="text-center font-medium">
                  {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank}
                </TableCell>
                <TableCell className={entry.rank <= 3 ? 'font-semibold' : ''}>
                  {entry.firstName}
                </TableCell>
                <TableCell className="text-right pr-6 font-bold">
                  {entry.score}
                </TableCell>
              </TableRow>
            ))}
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                  No attempts recorded yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
