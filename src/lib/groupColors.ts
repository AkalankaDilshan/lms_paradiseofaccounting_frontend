/**
 * Fixed color assignment per predefined student group, so the same group
 * always renders in the same color everywhere it appears (rosters, quiz
 * cards, announcements, materials). Uses the theme's chart/brand tokens
 * only — never raw Tailwind palette colors — so it stays on-brand and
 * adapts automatically in dark mode.
 *
 * Groups are named "<examYear>-<CENTER>" (e.g. "2027-HATTON"), and a new
 * exam-year batch is added every year (see PREDEFINED_GROUPS in
 * Backend/shared/models.py). Rather than re-editing this map every year,
 * color is keyed off the class center only, so "2027-HATTON" and
 * "2028-HATTON" always render the same color and any future year "just
 * works" without a code change.
 */
const NON_YEARED_COLOR_CLASSES: Record<string, string> = {
  REVISION: "bg-accent/10 text-accent border-accent/20",
  ALL: "bg-muted text-muted-foreground border-border",
};

const CENTER_COLOR_CLASSES: Record<string, string> = {
  GINIGATHHENA: "bg-chart-1/10 text-chart-1 border-chart-1/20",
  HATTON: "bg-chart-2/10 text-chart-2 border-chart-2/20",
  NAWALAPITIYA: "bg-chart-3/10 text-chart-3 border-chart-3/20",
  ONLINE: "bg-chart-4/10 text-chart-4 border-chart-4/20",
};

// Used for any group/center not recognized above (defensive — keeps new/
// custom groups colored instead of falling back to plain gray).
const FALLBACK_COLOR_CLASSES = [
  "bg-chart-1/10 text-chart-1 border-chart-1/20",
  "bg-chart-2/10 text-chart-2 border-chart-2/20",
  "bg-chart-3/10 text-chart-3 border-chart-3/20",
  "bg-chart-4/10 text-chart-4 border-chart-4/20",
  "bg-chart-5/10 text-chart-5 border-chart-5/20",
];

export function groupColorClasses(group: string): string {
  if (group in NON_YEARED_COLOR_CLASSES) return NON_YEARED_COLOR_CLASSES[group];

  // "<examYear>-<CENTER>" — match on the center suffix so color is stable
  // across years without needing a map entry per year.
  const center = group.includes("-") ? group.slice(group.indexOf("-") + 1) : group;
  if (center in CENTER_COLOR_CLASSES) return CENTER_COLOR_CLASSES[center];

  const hash = Array.from(group).reduce((total, ch) => total + ch.charCodeAt(0), 0);
  return FALLBACK_COLOR_CLASSES[hash % FALLBACK_COLOR_CLASSES.length];
}

/** For group-picker toggle buttons — selected state uses the group's own color, matching its badge everywhere else. */
export function groupToggleClasses(group: string, selected: boolean): string {
  if (!selected) return "border border-transparent bg-muted text-muted-foreground hover:bg-muted/70";
  return `border ${groupColorClasses(group)}`;
}
