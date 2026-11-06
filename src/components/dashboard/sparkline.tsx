import { useId } from 'react';
import { cn } from '@/lib/utils';

/**
 * Tiny trend line in plain SVG. Deliberately not Recharts: the student
 * dashboard shows one of these, and pulling the whole charting library onto
 * a phone for it would cost ~85 KB.
 */
export function Sparkline({
  data,
  className,
  color = 'hsl(142 70% 45%)',
}: {
  data: readonly number[];
  className?: string;
  color?: string;
}) {
  const gradientId = useId().replace(/:/g, '');
  const W = 100;
  const H = 40;
  const PAD = 3;

  if (data.length < 2) return <div className={cn('h-12 w-full', className)} />;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const points = data.map((v, i) => [(i / (data.length - 1)) * W, H - PAD - ((v - min) / span) * (H - PAD * 2)] as const);
  const line = points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
  const area = `${line} L${W},${H} L0,${H} Z`;
  const [lastX, lastY] = points[points.length - 1];

  return (
    <div className={cn('h-12 w-full', className)}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="size-full overflow-visible" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gradientId})`} />
        <path d={line} fill="none" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={lastX} cy={lastY} r={2.5} fill={color} vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}
