import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { ArrowLeft, CheckCircle2, CircleDashed, Lock, XCircle } from 'lucide-react';
import { apiClient } from '../../api/client';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { AnimatedNumber, EmptyState, Skeleton } from '../../components/common';
import { Leaderboard } from '../../components/Leaderboard';
import { cn } from '../../lib/utils';

interface QuestionResult {
  questionId: string;
  questionText: string;
  imageKey?: string | null;
  options: { index: number; text: string }[];
  givenAnswerIndex: number | null;
  /** null while answers are withheld (quiz set to release after close) */
  correctAnswerIndex: number | null;
  correctAnswerText: string | null;
  isCorrect: boolean | null;
  explanation?: string | null;
}

interface ResultsData {
  attemptId: string;
  quizTitle?: string;
  score: number;
  maxScore: number;
  percentage: number;
  submittedAt?: string;
  answersReleased?: boolean;
  answersReleaseAt?: string | null;
  results: QuestionResult[];
}

type Filter = 'all' | 'wrong' | 'correct';

const RING = 2 * Math.PI * 52;

export function QuizResults() {
  const { id: quizId, attemptId } = useParams<{ id: string; attemptId: string }>();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>('all');

  const { data, isLoading, error } = useQuery({
    queryKey: ['results', quizId, attemptId],
    meta: { errorToast: false },
    queryFn: async () => (await apiClient.get(`/quizzes/${quizId}/attempts/${attemptId}/results`)).data as ResultsData,
  });

  if (isLoading)
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-56" />
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-36" />
        ))}
      </div>
    );
  if (error || !data)
    return <EmptyState icon={XCircle} title="Couldn’t load these results" description="They may not be available yet. Please try again shortly." action={<Button variant="outline" onClick={() => navigate('/student/quizzes')}>Back to quizzes</Button>} />;

  const released = data.answersReleased !== false;
  const percentage = data.percentage ?? Math.round((data.score / data.maxScore) * 100);
  const tone = percentage >= 75 ? 'text-success' : percentage >= 50 ? 'text-warning' : 'text-destructive';
  const wrongCount = data.results.filter((r) => r.isCorrect === false).length;
  const shown = data.results.filter((r) => !released || filter === 'all' || (filter === 'wrong' ? !r.isCorrect : r.isCorrect));

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-20">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/student/quizzes')} aria-label="Back to quizzes">
          <ArrowLeft />
        </Button>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">Results</p>
          <h1 className="truncate font-sinhala text-xl font-semibold tracking-tight">{data.quizTitle || 'Quiz results'}</h1>
        </div>
      </div>

      {/* Score */}
      <Card className="relative overflow-hidden py-0">
        <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-primary/15 blur-3xl" />
        <CardContent className="relative flex flex-col items-center gap-6 p-6 sm:flex-row sm:p-8">
          <div className="relative size-36 shrink-0">
            <svg viewBox="0 0 120 120" className="size-36 -rotate-90">
              <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
              <motion.circle
                cx="60"
                cy="60"
                r="52"
                fill="none"
                stroke="currentColor"
                strokeWidth="10"
                strokeLinecap="round"
                className={tone}
                strokeDasharray={RING}
                initial={{ strokeDashoffset: RING }}
                animate={{ strokeDashoffset: RING * (1 - percentage / 100) }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <AnimatedNumber value={percentage} decimals={percentage % 1 ? 1 : 0} suffix="%" className={cn('text-3xl font-semibold', tone)} />
              <span className="text-xs text-muted-foreground tabular-nums">
                {data.score} / {data.maxScore}
              </span>
            </div>
          </div>
          <div className="space-y-2 text-center sm:text-left">
            <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-2xl font-semibold tracking-tight">
              {percentage >= 80 ? 'Excellent work! 🎉' : percentage >= 60 ? 'Good effort!' : percentage >= 40 ? 'Keep practising.' : 'Let’s review and try again.'}
            </motion.p>
            <p className="text-sm text-muted-foreground">
              {released
                ? `${data.score} correct, ${wrongCount} to review.`
                : 'Your score is final. Correct answers are hidden until the quiz closes for everyone.'}
            </p>
            {data.submittedAt && <p className="text-xs text-muted-foreground">Submitted {format(new Date(data.submittedAt), 'd MMM yyyy, h:mm a')}</p>}
          </div>
        </CardContent>
      </Card>

      {!released && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3 rounded-xl border border-info/30 bg-info/5 p-4 text-sm">
          <Lock className="mt-0.5 size-4 shrink-0 text-info" />
          <p>
            Answers and explanations unlock
            {data.answersReleaseAt ? <> on <span className="font-medium">{format(new Date(data.answersReleaseAt), 'd MMM yyyy, h:mm a')}</span></> : ' after the quiz closes'}
            . Come back then to review what you got wrong.
          </p>
        </motion.div>
      )}

      {/* Breakdown */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">Question breakdown</h2>
          {released && (
            <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5 text-xs">
              {(['all', 'wrong', 'correct'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={cn('rounded-md px-2.5 py-1 font-medium capitalize text-muted-foreground transition-colors', filter === f && 'bg-background text-foreground shadow-sm')}
                >
                  {f === 'wrong' ? `To review (${wrongCount})` : f}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="stagger space-y-4">
          {shown.map((item) => {
            const position = data.results.indexOf(item) + 1;
            const given = item.givenAnswerIndex !== null ? item.options?.find((o) => o.index === item.givenAnswerIndex)?.text : null;
            const state = item.isCorrect === null ? 'hidden' : item.isCorrect ? 'correct' : 'wrong';
            return (
              <Card
                key={item.questionId}
                className={cn('gap-0 border-l-2 py-0', state === 'correct' ? 'border-l-success' : state === 'wrong' ? 'border-l-destructive' : 'border-l-border')}
              >
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <p className="font-sinhala text-base leading-relaxed">
                      <span className="mr-2 text-muted-foreground tabular-nums">{position}.</span>
                      {item.questionText}
                    </p>
                    {state === 'correct' && <CheckCircle2 className="size-5 shrink-0 text-success" />}
                    {state === 'wrong' && <XCircle className="size-5 shrink-0 text-destructive" />}
                    {state === 'hidden' && <CircleDashed className="size-5 shrink-0 text-muted-foreground" />}
                  </div>
                  {item.imageKey && <img src={item.imageKey} alt="" loading="lazy" className="max-h-80 w-full rounded-lg border border-border object-contain" />}

                  <div className="space-y-1.5">
                    {item.options.map((o) => {
                      const isGiven = o.index === item.givenAnswerIndex;
                      const isRight = item.correctAnswerIndex !== null && o.index === item.correctAnswerIndex;
                      return (
                        <div
                          key={o.index}
                          className={cn(
                            'flex items-center gap-3 rounded-lg border px-3 py-2 font-sinhala text-sm',
                            isRight && 'border-success/40 bg-success/10',
                            isGiven && !isRight && state === 'wrong' && 'border-destructive/40 bg-destructive/10',
                            isGiven && state === 'hidden' && 'border-primary/40 bg-primary/10',
                            !isRight && !isGiven && 'border-border text-muted-foreground',
                          )}
                        >
                          <span className="flex-1">{o.text}</span>
                          {isGiven && <span className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Your answer</span>}
                          {isRight && <CheckCircle2 className="size-4 shrink-0 text-success" />}
                        </div>
                      );
                    })}
                    {given === null && <p className="text-xs text-muted-foreground">You didn’t answer this question.</p>}
                  </div>

                  {item.explanation && (
                    <div className="rounded-lg border border-primary/15 bg-primary/5 p-4">
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-primary">Explanation</p>
                      <p className="font-sinhala text-[15px] leading-relaxed text-foreground/90">{item.explanation}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {shown.length === 0 && <EmptyState icon={CheckCircle2} title={filter === 'wrong' ? 'Nothing to review. Perfect score!' : 'No questions to show.'} />}
        </div>
      </div>

      {quizId && <Leaderboard quizId={quizId} />}
    </div>
  );
}
