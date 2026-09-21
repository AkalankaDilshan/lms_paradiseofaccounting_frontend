import { Flag } from 'lucide-react';
import { cn } from 'cn';

interface QuestionNavigatorGridProps {
  questionIds: string[];
  currentIndex: number;
  answers: Record<string, number>;
  flagged: Set<string>;
  onJump: (index: number) => void;
}

export function QuestionNavigatorGrid({
  questionIds,
  currentIndex,
  answers,
  flagged,
  onJump,
}: QuestionNavigatorGridProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
        {questionIds.map((qid, i) => {
          const isAnswered = answers[qid] !== undefined;
          const isFlagged = flagged.has(qid);
          const isCurrent = i === currentIndex;
          return (
            <button
              key={qid}
              type="button"
              onClick={() => onJump(i)}
              aria-current={isCurrent}
              aria-label={`Question ${i + 1}${isAnswered ? ', answered' : ', not answered'}${isFlagged ? ', flagged for review' : ''}`}
              className={cn(
                'relative flex h-10 w-10 items-center justify-center rounded-lg text-sm font-semibold transition-colors',
                isAnswered
                  ? 'bg-primary text-primary-foreground hover:bg-primary/80'
                  : 'bg-muted text-muted-foreground ring-1 ring-border hover:bg-muted/70',
                isCurrent && 'ring-2 ring-offset-2 ring-offset-background ring-foreground'
              )}
            >
              {i + 1}
              {isFlagged && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-warning text-warning-foreground ring-2 ring-background">
                  <Flag className="h-2.5 w-2.5 fill-current" strokeWidth={0} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded-[4px] bg-primary" />
          Answered
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded-[4px] bg-muted ring-1 ring-border" />
          Not answered
        </span>
        <span className="flex items-center gap-1.5">
          <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-warning text-warning-foreground">
            <Flag className="h-2 w-2 fill-current" strokeWidth={0} />
          </span>
          Flagged
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded-[4px] ring-2 ring-foreground" />
          Current
        </span>
      </div>
    </div>
  );
}
