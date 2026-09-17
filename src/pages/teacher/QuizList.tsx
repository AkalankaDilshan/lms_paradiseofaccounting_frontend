import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Plus, Edit2, BarChart3, Archive, ClipboardList, Search, Filter } from 'lucide-react';
import { motion } from 'motion/react';
import { Badge } from '../../components/ui/badge';
import { GroupBadge } from '../../components/GroupBadge';

interface Quiz {
  quizId: string;
  title: string;
  allowedGroups: string[];
  openAt: string;
  closeAt: string;
  durationMinutes: number;
  maxAttempts: number;
  archived: boolean;
}

function quizStatus(quiz: Quiz): { label: string; variant: 'default' | 'primary' | 'destructive' | 'success' } {
  const now = new Date();
  const open = new Date(quiz.openAt);
  const close = new Date(quiz.closeAt);
  if (quiz.archived) return { label: 'Archived', variant: 'default' };
  if (now < open) return { label: 'Scheduled', variant: 'primary' };
  if (now > close) return { label: 'Closed', variant: 'destructive' };
  return { label: 'Open', variant: 'success' };
}

export function QuizList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Open' | 'Scheduled' | 'Closed' | 'Archived'>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['teacherQuizzes'],
    queryFn: async () => (await apiClient.get('/quizzes')).data as Quiz[],
  });

  const archiveQuiz = useMutation({
    mutationFn: async (quizId: string) => {
      await apiClient.put(`/quizzes/${quizId}`, { archived: true });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teacherQuizzes'] }),
  });

  const filtered = (data ?? []).filter(q => {
    const matchSearch = q.title.toLowerCase().includes(search.toLowerCase());
    const status = quizStatus(q).label;
    const matchStatus = statusFilter === 'all' || status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (isLoading) return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Teacher</p>
          <h1 className="text-3xl font-bold tracking-tight">Quizzes</h1>
          <p className="mt-1 text-muted-foreground">Manage, schedule, and analyze your quizzes.</p>
        </div>
        <Button onClick={() => navigate('/teacher/quizzes/new')} className="shrink-0">
          <Plus className="w-4 h-4 mr-2" /> New Quiz
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search quizzes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'Open', 'Scheduled', 'Closed', 'Archived'] as const).map(s => (
            <Button
              key={s}
              variant={statusFilter === s ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(s)}
              className="h-10 capitalize"
            >
              {s === 'all' ? <><Filter className="w-3.5 h-3.5 mr-1" />All</> : s}
            </Button>
          ))}
        </div>
      </div>

      {/* Quiz Table */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <ClipboardList className="mx-auto mb-3 h-8 w-8 opacity-30" />
              <p className="text-sm">No quizzes found.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {filtered.map((quiz) => {
                const status = quizStatus(quiz);
                return (
                  <div key={quiz.quizId} className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="font-medium truncate">{quiz.title}</p>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>Opens: {new Date(quiz.openAt).toLocaleString()}</span>
                        <span>Closes: {new Date(quiz.closeAt).toLocaleString()}</span>
                        <span>{quiz.durationMinutes} min</span>
                        <span>{quiz.maxAttempts} attempt{quiz.maxAttempts !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {quiz.allowedGroups.map(g => (
                          <GroupBadge key={g} group={g} className="text-[10px] px-1.5 py-0.5" />
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/teacher/quizzes/${quiz.quizId}/edit`)}
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/teacher/quizzes/${quiz.quizId}/analytics`)}
                      >
                        <BarChart3 className="w-3.5 h-3.5 mr-1.5" /> Analytics
                      </Button>
                      {!quiz.archived && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-muted-foreground"
                          onClick={() => archiveQuiz.mutate(quiz.quizId)}
                          disabled={archiveQuiz.isPending}
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
