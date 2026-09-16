import { useMemo, useState } from 'react';
import { format, startOfMonth, startOfYear, subDays } from 'date-fns';
import { CalendarDays } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const presets = [
  { id: '7d', label: 'Last 7 days' },
  { id: 'month', label: 'This month' },
  { id: '30d', label: 'Last 30 days' },
  { id: 'year', label: 'This year' },
] as const;

type PresetId = (typeof presets)[number]['id'];

function rangeFor(id: PresetId, now: Date) {
  if (id === 'month') return { from: startOfMonth(now), to: now };
  if (id === 'year') return { from: startOfYear(now), to: now };
  if (id === '30d') return { from: subDays(now, 29), to: now };
  return { from: subDays(now, 6), to: now };
}

export function DateRangePicker() {
  const now = useMemo(() => new Date(2026, 8, 16), []);
  const [preset, setPreset] = useState<PresetId>('month');
  const [open, setOpen] = useState(false);
  const range = rangeFor(preset, now);
  const label = `${format(range.from, 'dd MMM yyyy')} - ${format(range.to, 'dd MMM yyyy')}`;

  return (
    <Popover open={open} onOpenChange={(next) => setOpen(next)}>
      <PopoverTrigger
        aria-label={label}
        className={cn(
          buttonVariants({ variant: 'outline' }),
          'h-8 min-w-0 justify-start gap-2 px-2.5 font-normal sm:min-w-[230px]',
        )}
      >
        <CalendarDays className="size-4 text-muted-foreground" />
        <span className="hidden truncate sm:inline">{label}</span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-1.5">
        {presets.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            className={cn('h-8 w-full justify-start', preset === item.id && 'bg-muted')}
            onClick={() => {
              setPreset(item.id);
              setOpen(false);
            }}
          >
            {item.label}
          </Button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
