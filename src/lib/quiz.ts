import { useEffect, useState } from 'react';
import { Eye, Hourglass, Play, RotateCcw } from 'lucide-react';
import type { StudentQuiz } from '../api/queries';

/** Current time, re-rendered every `intervalMs` — for countdowns. */
export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/** What the student can do with a quiz right now (drives the card's button). */
export function quizAction(quiz: Pick<StudentQuiz, 'state' | 'hasOpenAttempt' | 'attemptsUsed' | 'maxAttempts' | 'lastAttemptId'>) {
  const attemptsLeft = Math.max(0, quiz.maxAttempts - quiz.attemptsUsed);
  if (quiz.state === 'open' && quiz.hasOpenAttempt) return { kind: 'resume' as const, label: 'Resume', icon: RotateCcw };
  if (quiz.state === 'open' && attemptsLeft > 0)
    return { kind: 'start' as const, label: quiz.attemptsUsed > 0 ? 'Try again' : 'Start quiz', icon: Play };
  if (quiz.lastAttemptId) return { kind: 'results' as const, label: 'View results', icon: Eye };
  return { kind: 'none' as const, label: quiz.state === 'upcoming' ? 'Not open yet' : 'Missed', icon: Hourglass };
}
