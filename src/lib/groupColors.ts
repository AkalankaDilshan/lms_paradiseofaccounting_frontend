/**
 * Fixed color assignment per predefined student group, so the same group
 * always renders in the same color everywhere it appears (rosters, quiz
 * cards, announcements, materials). Uses the theme's chart/brand tokens
 * only — never raw Tailwind palette colors — so it stays on-brand and
 * adapts automatically in dark mode.
 */
const GROUP_COLOR_CLASSES: Record<string, string> = {
  "G12-GINIGATHHENA": "bg-chart-1/10 text-chart-1 border-chart-1/20",
  "G12-HATTON": "bg-chart-2/10 text-chart-2 border-chart-2/20",
  "G12-NAWALAPITIYA": "bg-chart-3/10 text-chart-3 border-chart-3/20",
  "G13-GINIGATHHENA": "bg-chart-4/10 text-chart-4 border-chart-4/20",
  "G13-HATTON": "bg-chart-5/10 text-chart-5 border-chart-5/20",
  "G13-NAWALAPITIYA": "bg-primary/10 text-primary border-primary/20",
  REVISION: "bg-accent/10 text-accent border-accent/20",
  ALL: "bg-muted text-muted-foreground border-border",
};

// Used for any group not in the fixed map above (defensive — keeps new/
// custom groups colored instead of falling back to plain gray).
const FALLBACK_COLOR_CLASSES = [
  "bg-chart-1/10 text-chart-1 border-chart-1/20",
  "bg-chart-2/10 text-chart-2 border-chart-2/20",
  "bg-chart-3/10 text-chart-3 border-chart-3/20",
  "bg-chart-4/10 text-chart-4 border-chart-4/20",
  "bg-chart-5/10 text-chart-5 border-chart-5/20",
];

export function groupColorClasses(group: string): string {
  if (group in GROUP_COLOR_CLASSES) return GROUP_COLOR_CLASSES[group];
  const hash = Array.from(group).reduce((total, ch) => total + ch.charCodeAt(0), 0);
  return FALLBACK_COLOR_CLASSES[hash % FALLBACK_COLOR_CLASSES.length];
}

/** For group-picker toggle buttons — selected state uses the group's own color, matching its badge everywhere else. */
export function groupToggleClasses(group: string, selected: boolean): string {
  if (!selected) return "border border-transparent bg-muted text-muted-foreground hover:bg-muted/70";
  return `border ${groupColorClasses(group)}`;
}
