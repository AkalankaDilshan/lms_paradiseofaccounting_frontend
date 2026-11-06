import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
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
  imageKey?: string | null;
  options: { index: number; text: string }[];
}

interface AttemptData {
  attemptId: string;
  quizId: string;
  durationMinutes: number;
  // Server deadline (start + duration, capped at the quiz's closeAt); submits
  // more than a couple of minutes after it are rejected as expired
  expiresAt?: string;
  questions: Question[];
  // Server-side autosave from this or another device (POST /attempts resumes the open attempt)
  savedAnswers?: Record<string, number>;
}

// Progress is kept in two places. The server holds the attempt itself (POST
// /attempts returns the open attempt instead of starting a new one) plus
// autosaved draft answers (PUT /attempts/:id/answers), so a student can carry
// on from another phone or after clearing the browser. localStorage keeps this
// device's newest answers, flags and position, and lets a reload work offline.
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
  const queryClient = useQueryClient();
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
    meta: { errorToast: false },
    queryFn: async () => {
      const persisted = readPersistedAttempt(quizId);

      let server: AttemptData;
      try {
        server = (await apiClient.post(`/quizzes/${quizId}/attempts`)).data as AttemptData;
      } catch (err) {
        // Offline (no response at all): carry on from this device's copy
        if (persisted && isAxiosError(err) && !err.response) return persisted;
        throw err;
      }

      // Same attempt on this device: its answers are the newest; otherwise
      // (another device, cleared storage) start from the server's autosave
      const sameAttempt = persisted?.attemptId === server.attemptId;
      const fresh: PersistedAttempt = {
        ...server,
        answers: sameAttempt
          ? { ...(server.savedAnswers ?? {}), ...persisted!.answers }
          : (server.savedAnswers ?? {}),
        flaggedIds: sameAttempt ? persisted!.flaggedIds : [],
        currentIndex: sameAttempt ? persisted!.currentIndex : 0,
        startedAtMs: sameAttempt ? persisted!.startedAtMs : Date.now(),
      };
      writePersistedAttempt(quizId, fresh);
      return fresh;
    },
    refetchOnWindowFocus: false,
    // 4xx (closed, max attempts, suspended) won't change on retry
    retry: (count, err) => !(isAxiosError(err) && err.response && err.response.status < 500) && count < 2,
  });

  // Hydrate local state from the resumed/started attempt exactly once per attemptId
  useEffect(() => {
    if (!data || hydratedAttemptId.current === data.attemptId) return;
    hydratedAttemptId.current = data.attemptId;
    setAnswers(data.answers);
    setFlagged(new Set(data.flaggedIds));
    setCurrentIndex(data.currentIndex);
    const remaining = data.expiresAt
      ? Math.max(0, Math.floor((Date.parse(data.expiresAt) - Date.now()) / 1000))
      : Math.max(0, data.durationMinutes * 60 - Math.floor((Date.now() - data.startedAtMs) / 1000));
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

  // Server autosave — debounced, best-effort. If it fails (offline) the answers
  // are still in localStorage and travel with the next save or the final submit.
  const lastSavedAnswers = useRef('');
  useEffect(() => {
    if (!data || hydratedAttemptId.current !== data.attemptId) return;
    const snapshot = JSON.stringify(answers);
    if (snapshot === lastSavedAnswers.current) return;
    const timer = setTimeout(() => {
      apiClient.put(`/quizzes/${quizId}/attempts/${data.attemptId}/answers`, { answersGiven: answers })
        .then(() => { lastSavedAnswers.current = snapshot; })
        .catch(() => {});
    }, 1500);
    return () => clearTimeout(timer);
  }, [answers, data, quizId]);

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
    meta: { errorToast: false },
    mutationFn: async () => {
      const payload = {
        answersGiven: answers,
      };
      await apiClient.put(`/quizzes/${quizId}/attempts/${data?.attemptId}`, payload);
    },
    onSuccess: () => {
      clearPersistedAttempt(quizId);
      queryClient.invalidateQueries({ queryKey: ['studentQuizzes'] });
      queryClient.invalidateQueries({ queryKey: ['trend'] });
      navigate(`/student/quizzes/${quizId}/results/${data?.attemptId}`);
    },
    // 409 = the server has closed this attempt (expired or already submitted);
    // other failures (offline) keep the saved progress so the student can retry
    onError: (err) => {
      if (isAxiosError(err) && err.response?.status === 409) clearPersistedAttempt(quizId);
    },
  });
  const submitClosed = isAxiosError(submitAttempt.error) && submitAttempt.error.response?.status === 409;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (isLoading) return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="skeleton h-36" />
      ))}
    </div>
  );
  if (error || !data) {
    const reason = isAxiosError(error) && error.response?.data?.error;
    return (
      <div className="mx-auto max-w-md space-y-4 p-8 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertCircle className="size-5" />
        </div>
        <p className="font-medium">{reason || "This quiz couldn't be started."}</p>
        <p className="text-sm text-muted-foreground">If you think this is a mistake, contact the class office.</p>
        <Button variant="outline" onClick={() => navigate('/student/quizzes')}>Back to my quizzes</Button>
      </div>
    );
  }
  if (submitClosed) {
    const message = isAxiosError(submitAttempt.error) && submitAttempt.error.response?.data?.error;
    return (
      <div className="max-w-md mx-auto p-8 text-center space-y-4">
        <AlertCircle className="w-10 h-10 mx-auto text-destructive" />
        <p className="font-medium text-destructive">{message || 'This attempt can no longer be submitted.'}</p>
        <Button variant="outline" onClick={() => navigate('/student')}>Back to dashboard</Button>
      </div>
    );
  }
  const submitFailedBanner = submitAttempt.isError && (
    <p className="text-destructive text-sm font-medium flex items-center">
      <AlertCircle className="w-4 h-4 mr-1" /> Couldn't submit — check your connection and press Submit again. Your answers are saved on this device.
    </p>
  );

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
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-20 -mx-4 bg-background/95 px-4 backdrop-blur md:-mx-6 md:px-6 pt-3 pb-3 border-b space-y-1">
          <div className="flex items-center justify-between">
            <h1 className="text-base font-semibold sm:text-xl">Review your attempt</h1>
            <div role="timer" aria-live="off" className={`flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-base font-bold sm:text-lg
              ${isDanger ? 'bg-destructive/10 text-destructive animate-pulse' :
                isWarning ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary'}`}>
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              {timeLeft !== null ? formatTime(timeLeft) : '--:--'}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {answeredCount} of {totalQuestions} answered · tap a row to jump back and change it
          </p>
          {submitFailedBanner}
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

        <div className="sticky bottom-0 z-20 -mx-4 flex items-center justify-between gap-3 border-t border-border bg-background/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur md:-mx-6 md:px-6">
          <Button variant="outline" size="lg" className="h-11" onClick={() => setPhase('attempt')}>
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
          <Button
            className="h-11 flex-1 sm:flex-none"
            size="lg"
            onClick={() => submitAttempt.mutate()}
            disabled={submitAttempt.isPending}
          >
            {submitAttempt.isPending ? 'Submitting…' : 'Submit and finish'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Sticky Header with Timer + Navigator */}
      <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-20 -mx-4 bg-background/95 px-4 backdrop-blur md:-mx-6 md:px-6 pt-3 pb-3 border-b space-y-2.5">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-semibold line-clamp-1 sm:text-xl">Quiz in progress</h1>
          <div role="timer" aria-live="off" className={`flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-base font-bold sm:text-lg
            ${isDanger ? 'bg-destructive/10 text-destructive animate-pulse' :
              isWarning ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary'}`}>
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
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
        {submitFailedBanner}

        <div className="h-1 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-primary"
            animate={{ width: `${totalQuestions ? (answeredCount / totalQuestions) * 100 : 0}%` }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground sm:text-sm">
            Question <span className="font-medium text-foreground">{safeIndex + 1}</span> of {totalQuestions}
            <span className="mx-1.5 text-border">·</span>
            {answeredCount} answered
          </p>
          <div className="flex items-center gap-2">
            <Sheet open={navigatorOpen} onOpenChange={setNavigatorOpen}>
              <SheetTrigger render={<Button variant="outline" size="sm" />}>
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Questions</span>
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
              Finish
            </Button>
          </div>
        </div>
      </div>

      {/* Current Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={question.questionId}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.18 }}
          // Swipe left/right to move between questions on a phone
          drag="x"
          dragDirectionLock
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.18}
          onDragEnd={(_, info) => {
            const swipe = Math.abs(info.offset.x) > 90 || Math.abs(info.velocity.x) > 500;
            if (!swipe) return;
            if (info.offset.x < 0 && !isLastQuestion) goTo(safeIndex + 1);
            if (info.offset.x > 0 && safeIndex > 0) goTo(safeIndex - 1);
          }}
          className="touch-pan-y"
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
              {question.imageKey && (
                <img src={question.imageKey} alt="" loading="lazy"
                  className="mb-4 max-h-80 w-full rounded-md border border-border object-contain" />
              )}
              <RadioGroup
                value={answers[question.questionId] !== undefined ? String(answers[question.questionId]) : ''}
                onValueChange={(val: string) => setAnswers(prev => ({ ...prev, [question.questionId]: Number(val) }))}
                className="space-y-3"
              >
                {question.options.map((opt) => (
                  <div key={opt.index} className={cn(
                      'flex min-h-12 items-start space-x-3 space-y-0 rounded-xl border p-3.5 transition-all cursor-pointer active:scale-[0.99]',
                      answers[question.questionId] === opt.index
                        ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                        : 'hover:bg-muted/50',
                    )}
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

      {/* Free navigation — pinned to the bottom of the screen, within thumb reach */}
      <div className="sticky bottom-0 z-20 -mx-4 flex items-center justify-between gap-3 border-t border-border bg-background/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur md:-mx-6 md:px-6">
        <Button variant="outline" size="lg" className="h-11 flex-1 sm:flex-none" onClick={() => goTo(safeIndex - 1)} disabled={safeIndex === 0}>
          <ChevronLeft className="w-4 h-4" /> Previous
        </Button>
        {isLastQuestion ? (
          <Button size="lg" className="h-11 flex-1 sm:flex-none" onClick={() => setPhase('review')}>
            Review & finish
          </Button>
        ) : (
          <Button size="lg" className="h-11 flex-1 sm:flex-none" onClick={() => goTo(safeIndex + 1)}>
            Next <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
