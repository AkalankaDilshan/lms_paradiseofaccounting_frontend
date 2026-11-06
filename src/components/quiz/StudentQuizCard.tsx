import { useNavigate } from 'react-router-dom';
import { formatDistanceToNowStrict, format } from 'date-fns';
import { ArrowRight, CalendarClock, CheckCircle2, Clock3, ListChecks } from 'lucide-react';
import { quizAction, useNow } from '../../lib/quiz';
import type { StudentQuiz } from '../../api/queries';
import { percent } from '../../api/queries';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { LiveDot } from '../common';
import { cn } from '../../lib/utils';

function scoreTone(pct: number) {
  return pct >= 75 ? 'text-success' : pct >= 50 ? 'text-warning' : 'text-destructive';
}

export function StudentQuizCard({ quiz, compact = false }: { quiz: StudentQuiz; compact?: boolean }) {
  const navigate = useNavigate();
  const now = useNow();
  const action = quizAction(quiz);
  const closesSoon = quiz.state === 'open' && new Date(quiz.closeAt).getTime() - now < 24 * 3_600_000;
  const best = quiz.bestScore !== null && quiz.bestMaxScore ? percent(quiz.bestScore, quiz.bestMaxScore) : null;

  const go = () => {
    if (action.kind === 'resume' || action.kind === 'start') navigate(`/student/quizzes/${quiz.quizId}/attempt`);
    else if (action.kind === 'results' && quiz.lastAttemptId) navigate(`/student/quizzes/${quiz.quizId}/results/${quiz.lastAttemptId}`);
  };

  return (
    <Card
      className={cn(
        'interactive relative gap-0 py-0',
        quiz.state === 'open' && action.kind !== 'results' && 'ring-primary/30',
      )}
    >
      {quiz.state === 'open' && action.kind !== 'results' && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      )}
      <CardContent className={cn('flex flex-col gap-4 p-4', !compact && 'sm:flex-row sm:items-center')}>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {quiz.state === 'open' && (
              <Badge variant="success" className="gap-1.5">
                <LiveDot className="size-1.5" /> Open
              </Badge>
            )}
            {quiz.state === 'upcoming' && <Badge variant="info">Upcoming</Badge>}
            {quiz.state === 'closed' && <Badge>Closed</Badge>}
            {quiz.hasOpenAttempt && quiz.state === 'open' && <Badge variant="warning">In progress</Badge>}
            {closesSoon && <Badge variant="destructive">Closes soon</Badge>}
          </div>
          <p className="font-sinhala text-base font-medium leading-snug">{quiz.title}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock3 className="size-3.5" /> {quiz.durationMinutes} min
            </span>
            <span className="inline-flex items-center gap-1">
              <ListChecks className="size-3.5" /> {quiz.questionCount} questions
            </span>
            <span className="inline-flex items-center gap-1">
              <CalendarClock className="size-3.5" />
              {quiz.state === 'upcoming'
                ? `Opens ${formatDistanceToNowStrict(new Date(quiz.openAt), { addSuffix: true })}`
                : quiz.state === 'open'
                  ? `Closes ${formatDistanceToNowStrict(new Date(quiz.closeAt), { addSuffix: true })}`
                  : `Closed ${format(new Date(quiz.closeAt), 'd MMM yyyy')}`}
            </span>
            <span>
              {quiz.attemptsUsed}/{quiz.maxAttempts} attempts
            </span>
          </div>
        </div>
        <div className={cn('flex items-center gap-4', !compact && 'sm:flex-col sm:items-end sm:gap-2')}>
          {best !== null && (
            <div className={cn('flex items-center gap-1.5 text-sm font-semibold tabular-nums', scoreTone(best))}>
              <CheckCircle2 className="size-4" />
              {best}%
              <span className="text-xs font-normal text-muted-foreground">best</span>
            </div>
          )}
          <Button
            className="h-10 flex-1 sm:ml-auto sm:h-8 sm:flex-none"
            variant={action.kind === 'start' || action.kind === 'resume' ? 'default' : 'outline'}
            disabled={action.kind === 'none'}
            onClick={go}
          >
            <action.icon />
            {action.label}
            {(action.kind === 'start' || action.kind === 'resume') && <ArrowRight className="transition-transform group-hover/button:translate-x-0.5" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
