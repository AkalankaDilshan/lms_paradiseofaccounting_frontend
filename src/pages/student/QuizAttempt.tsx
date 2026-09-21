import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Label } from '../../components/ui/label';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../../components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { QuestionNavigatorGrid } from '../../components/quiz/QuestionNavigatorGrid';
import { Clock, AlertCircle, AlertTriangle, Flag, ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from 'cn';

interface Question {
  questionId: string;
  questionText: string;
  options: { index: number; text: string }[];
}

interface AttemptData {
  attemptId: string;
  quizId: string;
  durationMinutes: number;
  questions: Question[];
}

// Autosave: persisted client-side per quiz so a dropped connection or accidental
// reload doesn't lose progress or reset the countdown. There is no backend
// partial-save route — PUT /attempts/:id is a one-shot final submit that grades
// and locks the attempt — so resuming means skipping the POST /attempts call
// (which would otherwise mint a brand-new attempt, burn a maxAttempts slot, and
// reshuffle question/option order) and restoring everything from localStorage.
interface PersistedAttempt extends AttemptData {
  answers: Record<string, number>;
  flaggedIds: string[];
  currentIndex: number;
  startedAtMs: number;
}

const storageKey = (quizId: string | undefined) => `lms-quiz-attempt-${quizId}`;

function readPersistedAttempt(quizId: string | undefined): PersistedAttempt | null {
  if (!quizId) return null;
  try {
    const raw = localStorage.getItem(storageKey(quizId));
    if (!raw) return null;
    return JSON.parse(raw) as PersistedAttempt;
  } catch {
    return null;
  }
}

function writePersistedAttempt(quizId: string | undefined, attempt: PersistedAttempt) {
  if (!quizId) return;
  try {
    localStorage.setItem(storageKey(quizId), JSON.stringify(attempt));
  } catch {
    // localStorage unavailable (private browsing, quota) — progress simply won't survive a reload
  }
}

function clearPersistedAttempt(quizId: string | undefined) {
  if (!quizId) return;
  try {
    localStorage.removeItem(storageKey(quizId));
  } catch {
    // ignore
  }
}

export function QuizAttempt() {
  const { id: quizId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // answers: key=questionId, value=selectedOptionIndex
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [navigatorOpen, setNavigatorOpen] = useState(false);
  const [phase, setPhase] = useState<'attempt' | 'review'>('attempt');
  const hydratedAttemptId = useRef<string | null>(null);

  const toggleFlag = (questionId: string) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  // 1. Fetch Attempt (Start Quiz) — resume a persisted in-progress attempt when one exists
  const { data, isLoading, error } = useQuery({
    queryKey: ['attempt', quizId],
    queryFn: async () => {
      const persisted = readPersistedAttempt(quizId);
      if (persisted) return persisted;

      const res = await apiClient.post(`/quizzes/${quizId}/attempts`);
      const fresh: PersistedAttempt = {
        ...(res.data as AttemptData),
        answers: {},
        flaggedIds: [],
        currentIndex: 0,
        startedAtMs: Date.now(),
      };
      writePersistedAttempt(quizId, fresh);
      return fresh;
    },
    refetchOnWindowFocus: false,
  });

  // Hydrate local state from the resumed/started attempt exactly once per attemptId
  useEffect(() => {
    if (!data || hydratedAttemptId.current === data.attemptId) return;
    hydratedAttemptId.current = data.attemptId;
    setAnswers(data.answers);
    setFlagged(new Set(data.flaggedIds));
    setCurrentIndex(data.currentIndex);
    const totalSeconds = data.durationMinutes * 60;
    const elapsed = Math.floor((Date.now() - data.startedAtMs) / 1000);
    const remaining = Math.max(0, totalSeconds - elapsed);
    setTimeLeft(remaining);
    // A resumed attempt whose time already ran out while the student was away
    // skips straight to auto-submit, same as a normal in-session timeout.
    if (remaining === 0) submitAttempt.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // Persist answers/flags/position on every change so a reload resumes exactly here
  useEffect(() => {
    if (!data || hydratedAttemptId.current !== data.attemptId) return;
    writePersistedAttempt(quizId, {
      ...data,
      answers,
      flaggedIds: Array.from(flagged),
      currentIndex,
    });
  }, [answers, flagged, currentIndex, data, quizId]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev && prev <= 1) {
          clearInterval(timer);
          submitAttempt.mutate();
          return 0;
        }
        return prev ? prev - 1 : 0;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Submit Mutation — answers are { [questionId]: selectedOptionIndex }
  const submitAttempt = useMutation({
    mutationFn: async () => {
      const payload = {
        answersGiven: answers,
      };
      await apiClient.put(`/quizzes/${quizId}/attempts/${data?.attemptId}`, payload);
    },
    onSuccess: () => {
      clearPersistedAttempt(quizId);
      navigate(`/student/quizzes/${quizId}/results/${data?.attemptId}`);
    }
  });

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (isLoading) return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-36 rounded-xl bg-white/5 animate-pulse" />
      ))}
    </div>
  );
  if (error || !data) return <div className="p-8 text-center text-destructive">Failed to start quiz. Max attempts reached or quiz closed.</div>;

  // Danger kicks in at whichever is bigger: 10% of total duration, or 2 minutes
  // (capped at the full duration for very short quizzes) — a 5-minute quiz still
  // gets real urgency, not a blink-and-you-miss-it 30-second window.
  const totalSeconds = data.durationMinutes * 60;
  const dangerThreshold = Math.min(totalSeconds, Math.max(Math.round(totalSeconds * 0.1), 120));
  const warningThreshold = Math.min(totalSeconds, dangerThreshold * 2);
  const isWarning = timeLeft !== null && timeLeft <= warningThreshold;
  const isDanger = timeLeft !== null && timeLeft <= dangerThreshold;

  const totalQuestions = data.questions.length;
  const safeIndex = Math.min(currentIndex, totalQuestions - 1);
  const question = data.questions[safeIndex];
  const answeredCount = Object.keys(answers).length;
  const isCurrentFlagged = flagged.has(question.questionId);
  const isLastQuestion = safeIndex === totalQuestions - 1;

  const goTo = (index: number) => setCurrentIndex(Math.max(0, Math.min(index, totalQuestions - 1)));

  if (phase === 'review') {
    return (
      <div className="max-w-2xl mx-auto space-y-5 pb-24">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur pt-4 pb-3 border-b space-y-1">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Review your attempt</h1>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-mono text-lg font-bold
              ${isDanger ? 'bg-destructive/10 text-destructive animate-pulse' :
                isWarning ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary'}`}>
              <Clock className="w-5 h-5" />
              {timeLeft !== null ? formatTime(timeLeft) : '--:--'}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {answeredCount} of {totalQuestions} answered · tap a row to jump back and change it
          </p>
        </div>

        <Card className="py-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Q#</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.questions.map((q, i) => {
                const answered = answers[q.questionId] !== undefined;
                const isFlaggedRow = flagged.has(q.questionId);
                return (
                  <TableRow
                    key={q.questionId}
                    className="cursor-pointer"
                    onClick={() => {
                      goTo(i);
                      setPhase('attempt');
                    }}
                  >
                    <TableCell className="font-medium">{i + 1}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant={answered ? 'primary' : 'outline'}>
                          {answered ? 'Answered' : 'Not answered'}
                        </Badge>
                        {isFlaggedRow && (
                          <Badge variant="warning">
                            <Flag className="w-3 h-3 fill-current" strokeWidth={0} />
                            Flagged
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>

        <div className="flex items-center justify-between gap-3">
          <Button variant="outline" onClick={() => setPhase('attempt')}>
            <ChevronLeft className="w-4 h-4" /> Back to attempt
          </Button>
          <Button
            size="lg"
            onClick={() => submitAttempt.mutate()}
            disabled={submitAttempt.isPending}
          >
            {submitAttempt.isPending ? 'Submitting...' : 'Submit all and finish'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-24">
      {/* Sticky Header with Timer + Navigator */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur pt-4 pb-3 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold line-clamp-1">Quiz in Progress</h1>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-mono text-lg font-bold
            ${isDanger ? 'bg-destructive/10 text-destructive animate-pulse' :
              isWarning ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary'}`}>
            <Clock className="w-5 h-5" />
            {timeLeft !== null ? formatTime(timeLeft) : '--:--'}
          </div>
        </div>
        {isWarning && !isDanger && (
          <p className="text-warning text-sm font-medium flex items-center">
            <AlertTriangle className="w-4 h-4 mr-1" /> {formatTime(timeLeft ?? 0)} remaining — start wrapping up!
          </p>
        )}
        {isDanger && (
          <p className="text-destructive text-sm font-medium flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" /> {formatTime(timeLeft ?? 0)} remaining!
          </p>
        )}

        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            Question <span className="font-medium text-foreground">{safeIndex + 1}</span> of {totalQuestions}
            <span className="mx-1.5 text-border">·</span>
            {answeredCount} answered
          </p>
          <div className="flex items-center gap-2">
            <Sheet open={navigatorOpen} onOpenChange={setNavigatorOpen}>
              <SheetTrigger render={<Button variant="outline" size="sm" />}>
                <LayoutGrid className="w-4 h-4" />
                Questions
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Question navigator</SheetTitle>
                </SheetHeader>
                <SheetBody>
                  <QuestionNavigatorGrid
                    questionIds={data.questions.map((q) => q.questionId)}
                    currentIndex={safeIndex}
                    answers={answers}
                    flagged={flagged}
                    onJump={(i) => {
                      goTo(i);
                      setNavigatorOpen(false);
                    }}
                  />
                </SheetBody>
              </SheetContent>
            </Sheet>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPhase('review')}
            >
              Finish attempt
            </Button>
          </div>
        </div>
      </div>

      {/* Current Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={question.questionId}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.15 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg leading-relaxed font-sinhala pr-6">
                <span className="text-muted-foreground mr-2">{safeIndex + 1}.</span>
                {question.questionText}
              </CardTitle>
              <CardAction>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => toggleFlag(question.questionId)}
                  aria-pressed={isCurrentFlagged}
                  aria-label={isCurrentFlagged ? 'Remove flag from this question' : 'Flag this question for review'}
                  className={cn(isCurrentFlagged && 'text-warning hover:text-warning')}
                >
                  <Flag className={cn('w-4 h-4', isCurrentFlagged && 'fill-warning')} />
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={answers[question.questionId] !== undefined ? String(answers[question.questionId]) : ''}
                onValueChange={(val: string) => setAnswers(prev => ({ ...prev, [question.questionId]: Number(val) }))}
                className="space-y-3"
              >
                {question.options.map((opt) => (
                  <div key={opt.index} className="flex items-start space-x-3 space-y-0 p-3 rounded-md border hover:bg-muted/50 transition-colors cursor-pointer"
                       onClick={() => setAnswers(prev => ({ ...prev, [question.questionId]: opt.index }))}>
                    <RadioGroupItem value={String(opt.index)} id={`${question.questionId}-${opt.index}`} className="mt-1" />
                    <Label htmlFor={`${question.questionId}-${opt.index}`} className="font-normal font-sinhala text-base cursor-pointer flex-1">
                      {opt.text}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Free Navigation */}
      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" onClick={() => goTo(safeIndex - 1)} disabled={safeIndex === 0}>
          <ChevronLeft className="w-4 h-4" /> Previous
        </Button>
        {isLastQuestion ? (
          <Button size="lg" onClick={() => setPhase('review')}>
            Finish attempt
          </Button>
        ) : (
          <Button onClick={() => goTo(safeIndex + 1)}>
            Next <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
