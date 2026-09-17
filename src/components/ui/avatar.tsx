import { useState } from 'react';
import { cn } from '../../lib/utils';

// Uses the theme's brand + chart tokens (not hardcoded Tailwind palette colors)
// so avatar colors stay on-brand and adapt automatically in dark mode.
const fallbackColors = [
  'bg-primary', 'bg-accent',
  'bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5',
];

type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps {
  id: string;
  name: string;
  src?: string | null;
  size?: AvatarSize;
  className?: string;
  seedAvatar?: boolean;
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'h-8 w-8 text-[11px]',
  md: 'h-10 w-10 text-xs',
  lg: 'h-11 w-11 text-sm',
};

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || '?';
}

function avatarColor(id: string) {
  const hash = Array.from(id).reduce((total, character) => total + character.charCodeAt(0), 0);
  return fallbackColors[hash % fallbackColors.length];
}

/**
 * Uses a stable user id for demo avatars. Real profile photos take precedence;
 * failed/missing images fall back to branded initials without layout shift.
 */
export function Avatar({ id, name, src, size = 'md', className, seedAvatar = true }: AvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const generatedSrc = `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(id)}`;
  const imageSrc = src || (seedAvatar ? generatedSrc : undefined);

  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-background font-semibold text-primary-foreground',
        sizeClasses[size],
        !imageSrc || imageFailed ? avatarColor(id) : 'bg-muted',
        className,
      )}
      aria-label={name}
      role="img"
    >
      {imageSrc && !imageFailed ? (
        <img
          src={imageSrc}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      ) : (
        initials(name)
      )}
    </span>
  );
}
