/**
 * App-wide feedback: toasts, a critical-alert dialog and a confirm dialog.
 * A tiny external store so it can be called from anywhere — components,
 * React Query callbacks, axios interceptors — and rendered once by
 * <FeedbackHost /> (src/components/feedback/FeedbackHost.tsx).
 */
import { describeError } from './errors';
import type { Severity } from './errors';

export type Tone = Severity;

export interface Toast {
  id: number;
  tone: Tone;
  title: string;
  message?: string;
  /** ms before auto-dismiss; 0 = stays until closed */
  duration: number;
  action?: { label: string; onClick: () => void };
}

export interface AlertState {
  id: number;
  tone: Tone;
  title: string;
  message: string;
  primary?: { label: string; onClick: () => void };
}

export interface ConfirmOptions {
  title: string;
  description?: string;
  tone?: 'danger' | 'warning' | 'info';
  confirmLabel?: string;
  cancelLabel?: string;
}

export interface ConfirmState extends Required<Omit<ConfirmOptions, 'description'>> {
  id: number;
  description?: string;
  resolve: (ok: boolean) => void;
}

interface FeedbackState {
  toasts: Toast[];
  alert: AlertState | null;
  confirm: ConfirmState | null;
}

let state: FeedbackState = { toasts: [], alert: null, confirm: null };
let nextId = 1;
const listeners = new Set<() => void>();

function set(next: Partial<FeedbackState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

export const feedbackStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get: () => state,
};

const DEFAULT_DURATION: Record<Tone, number> = {
  success: 4000,
  info: 5000,
  warning: 7000,
  error: 8000,
  critical: 0,
};

/** Recently shown toasts, to drop duplicates (e.g. several queries failing at once). */
const recent = new Map<string, number>();

function push(tone: Tone, title: string, message?: string, opts: { duration?: number; action?: Toast['action'] } = {}) {
  const key = `${tone}|${title}|${message ?? ''}`;
  const now = Date.now();
  if ((recent.get(key) ?? 0) > now - 3000) return -1;
  recent.set(key, now);

  const toast: Toast = { id: nextId++, tone, title, message, duration: opts.duration ?? DEFAULT_DURATION[tone], action: opts.action };
  // Newest last; keep the stack short
  set({ toasts: [...state.toasts, toast].slice(-4) });
  return toast.id;
}

export const toast = {
  success: (title: string, message?: string) => push('success', title, message),
  info: (title: string, message?: string) => push('info', title, message),
  warning: (title: string, message?: string) => push('warning', title, message),
  error: (title: string, message?: string, action?: Toast['action']) => push('error', title, message, { action }),
  dismiss: (id: number) => set({ toasts: state.toasts.filter((t) => t.id !== id) }),
};

/** A blocking dialog for problems the user must not miss. */
export function showAlert(alert: Omit<AlertState, 'id'>) {
  set({ alert: { ...alert, id: nextId++ } });
}

export function closeAlert() {
  set({ alert: null });
}

/** Ask before doing something; resolves true when confirmed. */
export function confirm(options: ConfirmOptions): Promise<boolean> {
  // A second confirm while one is open answers the first with "no"
  state.confirm?.resolve(false);
  return new Promise((resolve) => {
    set({
      confirm: {
        id: nextId++,
        title: options.title,
        description: options.description,
        tone: options.tone ?? 'danger',
        confirmLabel: options.confirmLabel ?? 'Confirm',
        cancelLabel: options.cancelLabel ?? 'Cancel',
        resolve: (ok) => {
          set({ confirm: null });
          resolve(ok);
        },
      },
    });
  });
}

let onSessionExpired: () => void = () => window.location.assign('/login');

/** AuthProvider registers how to sign out, so the dialog's button can do it. */
export function setSessionExpiredHandler(handler: () => void) {
  onSessionExpired = handler;
}

/**
 * Report a failure the right way for its severity: a blocking dialog for
 * critical ones (server error, session expired, suspended account), a toast
 * for everything else. `context` names what was being attempted.
 */
export function notifyError(err: unknown, context?: string) {
  const d = describeError(err, context ? `Couldn’t ${context}` : undefined);
  if (d.severity === 'critical') {
    showAlert({
      tone: 'critical',
      title: d.title,
      message: context && !d.sessionExpired ? `While trying to ${context}: ${d.message}` : d.message,
      primary: d.sessionExpired ? { label: 'Sign in again', onClick: () => onSessionExpired() } : undefined,
    });
    return;
  }
  const title = context && d.severity !== 'warning' ? `Couldn’t ${context}` : d.title;
  push(d.severity === 'error' ? 'error' : d.severity, title, d.message);
}
