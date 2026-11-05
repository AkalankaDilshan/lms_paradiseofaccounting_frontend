import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { Trophy } from 'lucide-react';
import { apiClient } from '../api/client';
import { Avatar } from './ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './common';
import { cn } from '../lib/utils';

interface LeaderboardEntry {
  rank: number;
  studentId?: string;
  firstName: string;
  score: number;
  maxScore?: number;
  percentage?: number;
}

const MEDALS = ['🥇', '🥈', '🥉'];
const RANK_TINT = ['bg-accent/10', 'bg-muted', 'bg-orange-500/5'];

export function Leaderboard({ quizId, title, compact = false, className }: { quizId: string; title?: string; compact?: boolean; className?: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['leaderboard', quizId],
    meta: { errorToast: false },
    queryFn: async () => (await apiClient.get(`/analytics/quizzes/${quizId}/leaderboard`)).data.leaderboard as LeaderboardEntry[],
  });

  if (error) return null;

  return (
    <Card className={cn('gap-0 py-0', className)}>
      <CardHeader className="border-b border-border py-4">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="size-4 text-accent" /> Top performers
        </CardTitle>
        {title && <p className="truncate font-sinhala text-xs text-muted-foreground">{title}</p>}
      </CardHeader>
      <CardContent className="px-0">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">No attempts recorded yet.</p>
        ) : (
          <ol className="divide-y divide-border">
            {data.map((entry, i) => {
              const pct = entry.percentage ?? (entry.maxScore ? Math.round((entry.score / entry.maxScore) * 100) : null);
              return (
                <motion.li
                  key={entry.rank}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className={cn('flex items-center gap-3 px-4', compact ? 'py-2.5' : 'py-3', entry.rank <= 3 && RANK_TINT[entry.rank - 1])}
                >
                  <span className="w-6 text-center text-sm font-medium tabular-nums">{entry.rank <= 3 ? MEDALS[entry.rank - 1] : entry.rank}</span>
                  <Avatar id={entry.studentId || `lb-${entry.firstName}`} name={entry.firstName} size="sm" />
                  <span className={cn('min-w-0 flex-1 truncate text-sm', entry.rank <= 3 && 'font-medium')}>{entry.firstName}</span>
                  <span className="text-right text-sm font-semibold tabular-nums">
                    {entry.maxScore ? `${entry.score}/${entry.maxScore}` : entry.score}
                    {pct !== null && <span className="ml-1.5 text-xs font-normal text-muted-foreground">{pct}%</span>}
                  </span>
                </motion.li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
