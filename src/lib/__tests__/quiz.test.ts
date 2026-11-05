import { describe, expect, it } from 'vitest';
import { quizAction } from '../quiz';

const base = { state: 'open' as const, hasOpenAttempt: false, attemptsUsed: 0, maxAttempts: 2, lastAttemptId: null };

describe('quizAction', () => {
  it('offers start on an open quiz with no attempts', () => {
    expect(quizAction(base)).toMatchObject({ kind: 'start', label: 'Start quiz' });
  });

  it('offers try again while attempts remain', () => {
    expect(quizAction({ ...base, attemptsUsed: 1, lastAttemptId: 'a1' })).toMatchObject({ kind: 'start', label: 'Try again' });
  });

  it('prefers resuming an attempt already in progress', () => {
    expect(quizAction({ ...base, attemptsUsed: 2, hasOpenAttempt: true })).toMatchObject({ kind: 'resume' });
  });

  it('shows results once attempts are used up', () => {
    expect(quizAction({ ...base, attemptsUsed: 2, lastAttemptId: 'a2' })).toMatchObject({ kind: 'results' });
  });

  it('shows results for a closed quiz the student took', () => {
    expect(quizAction({ ...base, state: 'closed', attemptsUsed: 1, lastAttemptId: 'a1' })).toMatchObject({ kind: 'results' });
  });

  it('marks a closed quiz with no attempt as missed', () => {
    expect(quizAction({ ...base, state: 'closed' })).toMatchObject({ kind: 'none', label: 'Missed' });
  });

  it('does not allow starting an upcoming quiz', () => {
    expect(quizAction({ ...base, state: 'upcoming' })).toMatchObject({ kind: 'none', label: 'Not open yet' });
  });

  it('never starts a closed quiz even with attempts left', () => {
    expect(quizAction({ ...base, state: 'closed', attemptsUsed: 0 }).kind).not.toBe('start');
  });
});
