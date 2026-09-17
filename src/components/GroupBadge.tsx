import { cn } from '../lib/utils';
import { groupColorClasses } from '../lib/groupColors';

interface GroupBadgeProps {
  group: string;
  className?: string;
}

/** Small colored pill for a student group — same group always gets the same color, see groupColors.ts. */
export function GroupBadge({ group, className }: GroupBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex w-fit shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium',
        groupColorClasses(group),
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {group}
    </span>
  );
}
