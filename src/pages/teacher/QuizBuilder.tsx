import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { CalendarClock, FileQuestion, Users, ChevronUp, ChevronDown, X, Search } from 'lucide-react';
import { motion } from 'motion/react';

const GROUPS = [
  'G12-GINIGATHHENA', 'G12-HATTON', 'G12-NAWALAPITIYA',
  'G13-GINIGATHHENA', 'G13-HATTON', 'G13-NAWALAPITIYA', 'REVISION',
];

interface Question {
  questionId: string;
  questionText: string;
  options: { index: number; text: string }[];
  tags: string[];
}

export function QuizBuilder() {
  const { id: editId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!editId;

  const [title, setTitle] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [openAt, setOpenAt] = useState('');
  const [closeAt, setCloseAt] = useState('');
  const [allowedGroups, setAllowedGroups] = useState<string[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [questionSearch, setQuestionSearch] = useState('');
  const [error, setError] = useState('');

  // Load all available questions
  const { data: questions = [] } = useQuery({
    queryKey: ['allQuestions'],
    queryFn: async () => {
      const res = await apiClient.get('/questions');
      return res.data.items as Question[];
    },
  });

  // If edit mode, load existing quiz
  const { data: existingQuizzes } = useQuery({
    queryKey: ['teacherQuizzes'],
    queryFn: async () => (await apiClient.get('/quizzes')).data as any[],
    enabled: isEdit,
  });
  useEffect(() => {
    if (isEdit && existingQuizzes) {
      const q = existingQuizzes.find((x: any) => x.quizId === editId);
      if (q) {
        setTitle(q.title);
        setDurationMinutes(q.durationMinutes);
        setMaxAttempts(q.maxAttempts);
        setOpenAt(q.openAt?.slice(0, 16) || '');
        setCloseAt(q.closeAt?.slice(0, 16) || '');
        setAllowedGroups(q.allowedGroups || []);
        setSelectedQuestions(q.questionIds || []);
      }
    }
  }, [isEdit, existingQuizzes, editId]);

  const saveQuiz = useMutation({
    mutationFn: async () => {
      const payload = {
        title,
        durationMinutes: Number(durationMinutes),
        maxAttempts: Number(maxAttempts),
        openAt: new Date(openAt).toISOString(),
        closeAt: new Date(closeAt).toISOString(),
        allowedGroups,
        questionIds: selectedQuestions,
      };
      if (isEdit) {
        await apiClient.put(`/quizzes/${editId}`, payload);
      } else {
        await apiClient.post('/quizzes', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacherQuizzes'] });
      navigate('/teacher/quizzes');
    },
    onError: () => setError('Failed to save quiz. Check all required fields.'),
  });

  const handleSubmit = () => {
    if (!title || !openAt || !closeAt || allowedGroups.length === 0) {
      setError('Please fill title, schedule, and select at least one group.');
      return;
    }
    setError('');
    saveQuiz.mutate();
  };

  const toggleGroup = (g: string) => {
    setAllowedGroups(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  };

  const toggleQuestion = (qId: string) => {
    setSelectedQuestions(prev => prev.includes(qId) ? prev.filter(x => x !== qId) : [...prev, qId]);
  };

  const moveQuestion = (qId: string, direction: 'up' | 'down') => {
    setSelectedQuestions(prev => {
      const idx = prev.indexOf(qId);
      if (idx < 0) return prev;
      const next = [...prev];
      const swapWith = direction === 'up' ? idx - 1 : idx + 1;
      if (swapWith < 0 || swapWith >= next.length) return prev;
      [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
      return next;
    });
  };

  const filteredQuestions = questions.filter(q =>
    q.questionText.toLowerCase().includes(questionSearch.toLowerCase()) ||
    q.tags.some(t => t.toLowerCase().includes(questionSearch.toLowerCase()))
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <div>
        <p className="text-sm font-medium text-primary">Content Studio</p>
        <h1 className="text-3xl font-bold tracking-tight">{isEdit ? 'Edit Quiz' : 'New Quiz'}</h1>
        <p className="mt-1 text-muted-foreground">
          {isEdit ? 'Update quiz details and question selection.' : 'Create an assessment and assign it to the right groups.'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Main form */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b border-white/10">
              <CardTitle>Quiz Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 p-6">
              <div className="space-y-2">
                <Label htmlFor="quiz-title">Quiz Title</Label>
                <Input id="quiz-title" placeholder="e.g. Partnership Accounts — Paper 1"
                  value={title} onChange={e => setTitle(e.target.value)} className="h-11" />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input id="duration" type="number" placeholder="30"
                    value={durationMinutes} onChange={e => setDurationMinutes(Number(e.target.value))} className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxAttempts">Max Attempts</Label>
                  <Input id="maxAttempts" type="number" placeholder="1"
                    value={maxAttempts} onChange={e => setMaxAttempts(Number(e.target.value))} className="h-11" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Schedule</Label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Opens at</p>
                    <Input type="datetime-local" value={openAt} onChange={e => setOpenAt(e.target.value)} className="h-11" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Closes at</p>
                    <Input type="datetime-local" value={closeAt} onChange={e => setCloseAt(e.target.value)} className="h-11" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Students can access this quiz only within this window.</p>
              </div>
            </CardContent>
          </Card>

          {/* Question Browser */}
          <Card>
            <CardHeader className="border-b border-white/10 flex flex-row items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <FileQuestion className="w-4 h-4 text-primary" />
                Question Selection
                <span className="text-xs font-normal text-muted-foreground">
                  ({selectedQuestions.length} selected)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search questions or tags..."
                  value={questionSearch} onChange={e => setQuestionSearch(e.target.value)}
                  className="pl-9 h-10" />
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {filteredQuestions.map(q => (
                  <label key={q.questionId}
                    className="flex items-start gap-3 p-3 rounded-lg border border-white/10 hover:bg-muted/40 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      className="accent-primary mt-0.5 shrink-0"
                      checked={selectedQuestions.includes(q.questionId)}
                      onChange={() => toggleQuestion(q.questionId)}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-sinhala line-clamp-2">{q.questionText}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {q.tags.map(t => (
                          <span key={t} className="text-[10px] px-1.5 py-0.5 bg-white/10 rounded text-muted-foreground">{t}</span>
                        ))}
                      </div>
                    </div>
                  </label>
                ))}
                {filteredQuestions.length === 0 && (
                  <p className="text-sm text-center text-muted-foreground py-4">No questions found.</p>
                )}
              </div>

              {/* Selected order */}
              {selectedQuestions.length > 0 && (
                <div className="border-t border-white/10 pt-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Question Order</p>
                  <div className="space-y-1.5">
                    {selectedQuestions.map((qId, idx) => {
                      const q = questions.find(x => x.questionId === qId);
                      return (
                        <div key={qId} className="flex items-center gap-2 p-2 rounded-md bg-muted/40 text-sm">
                          <span className="text-muted-foreground w-5 text-center shrink-0">{idx + 1}.</span>
                          <span className="flex-1 font-sinhala line-clamp-1">{q?.questionText ?? qId}</span>
                          <div className="flex gap-0.5 shrink-0">
                            <button onClick={() => moveQuestion(qId, 'up')} className="p-0.5 hover:text-primary" title="Move up"><ChevronUp className="w-3.5 h-3.5" /></button>
                            <button onClick={() => moveQuestion(qId, 'down')} className="p-0.5 hover:text-primary" title="Move down"><ChevronDown className="w-3.5 h-3.5" /></button>
                            <button onClick={() => toggleQuestion(qId)} className="p-0.5 hover:text-destructive" title="Remove"><X className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b border-white/10">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-4 h-4" /> Group Assignment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-4">
              {GROUPS.map(g => (
                <label key={g} className="flex items-center gap-3 rounded-lg border border-white/10 p-3 text-sm cursor-pointer hover:bg-muted/40 transition-colors">
                  <input type="checkbox" className="accent-primary shrink-0"
                    checked={allowedGroups.includes(g)}
                    onChange={() => toggleGroup(g)} />
                  {g}
                </label>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-5">
              <div className="flex gap-3">
                <CalendarClock className="h-5 w-5 text-amber-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Scheduling tip</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Open revision windows during the last 48 hours before class to give students flexible practice time.
                  </p>
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button className="w-full" onClick={handleSubmit} disabled={saveQuiz.isPending}>
                {saveQuiz.isPending ? 'Saving...' : isEdit ? 'Update Quiz' : 'Save Quiz'}
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => navigate('/teacher/quizzes')}>
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
