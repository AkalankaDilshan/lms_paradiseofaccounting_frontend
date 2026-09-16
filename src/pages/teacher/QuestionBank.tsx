import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Plus, Search, Edit, Archive, BookOpen } from 'lucide-react';
import { motion } from 'motion/react';

interface Question {
  questionId: string;
  questionText: string;
  options: { index: number; text: string }[];
  tags: string[];
  archived: boolean;
  createdAt: string;
}

export function QuestionBank() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['questions', search],
    queryFn: async () => {
      const params = search ? { tag: search } : undefined;
      const res = await apiClient.get('/questions', { params });
      return res.data.items as Question[];
    },
  });

  const archiveQuestion = useMutation({
    mutationFn: async (questionId: string) => {
      await apiClient.delete(`/questions/${questionId}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['questions'] }),
  });

  const questions = (data ?? []).filter(q =>
    q.questionText.toLowerCase().includes(search.toLowerCase()) ||
    q.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Content Studio</p>
          <h1 className="text-3xl font-bold tracking-tight">Question Bank</h1>
          <p className="text-muted-foreground mt-1">
            {(data ?? []).length} questions available. Manage and create quiz questions.
          </p>
        </div>
        <Button onClick={() => navigate('/teacher/questions/new')}>
          <Plus className="w-4 h-4 mr-2" /> Add Question
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search questions or tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm h-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {questions.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <BookOpen className="mx-auto mb-3 h-8 w-8 opacity-30" />
              <p className="text-sm">No questions found. Add your first question!</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[55%]">Question</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Options</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questions.map((q) => (
                  <TableRow key={q.questionId}>
                    <TableCell className="font-sinhala text-base max-w-xs">
                      <p className="line-clamp-2">{q.questionText}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {q.tags.map(t => (
                          <span key={t} className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">
                            {t}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground text-sm">{q.options.length}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost" size="icon"
                          onClick={() => navigate(`/teacher/questions/${q.questionId}/edit`)}
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          onClick={() => archiveQuestion.mutate(q.questionId)}
                          disabled={archiveQuestion.isPending}
                          title="Archive"
                        >
                          <Archive className="w-4 h-4 text-destructive" />
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
    </motion.div>
  );
}
