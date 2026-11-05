import { isAxiosError } from 'axios';

export type Severity = 'success' | 'info' | 'warning' | 'error' | 'critical';

export interface DescribedError {
  severity: Severity;
  title: string;
  message: string;
  status?: number;
  /** The session is gone — the only fix is signing in again */
  sessionExpired?: boolean;
}

/** The backend's own `{ "error": "..." }` text, if the response carried one. */
export function serverMessage(err: unknown): string | undefined {
  if (!isAxiosError(err)) return undefined;
  const data = err.response?.data as { error?: unknown; message?: unknown } | undefined;
  const text = data?.error ?? data?.message;
  return typeof text === 'string' && text.trim() ? text : undefined;
}

/**
 * Turn any thrown value into something a person can act on: a severity (which
 * decides toast vs. dialog and its colour), a short title and a message.
 * Prefers the backend's own message — those are written for users.
 */
export function describeError(err: unknown, fallbackTitle = 'Something went wrong'): DescribedError {
  if (isAxiosError(err)) {
    const status = err.response?.status;
    const msg = serverMessage(err);

    if (!err.response) {
      return {
        severity: 'warning',
        title: navigator.onLine ? 'Can’t reach the server' : 'You’re offline',
        message: navigator.onLine
          ? 'The request didn’t get through. Check your connection and try again.'
          : 'Reconnect to the internet and try again. Nothing was saved.',
      };
    }
    if (status === 401) {
      return {
        severity: 'critical',
        title: 'Your session has expired',
        message: 'For your security you’ve been signed out. Please sign in again to continue.',
        status,
        sessionExpired: true,
      };
    }
    if (status === 403) {
      const suspended = msg?.toLowerCase().includes('suspended');
      return {
        severity: suspended ? 'critical' : 'error',
        title: suspended ? 'Account suspended' : 'Not allowed',
        message: msg ?? 'You don’t have permission to do that.',
        status,
      };
    }
    if (status === 404) return { severity: 'warning', title: 'Not found', message: msg ?? 'It may have been removed or archived.', status };
    if (status === 409) return { severity: 'warning', title: 'Already exists or changed', message: msg ?? 'This conflicts with existing data. Refresh and try again.', status };
    if (status === 429) return { severity: 'warning', title: 'Too many requests', message: msg ?? 'Please wait a moment and try again.', status };
    if (status && status >= 400 && status < 500) return { severity: 'warning', title: 'Please check the details', message: msg ?? 'Some of the information wasn’t accepted.', status };
    if (status && status >= 500) {
      return {
        severity: 'critical',
        title: 'Server error',
        message: msg ?? 'The server ran into a problem and couldn’t finish. Your change may not have been saved — please try again in a moment.',
        status,
      };
    }
  }
  return {
    severity: 'error',
    title: fallbackTitle,
    message: err instanceof Error && err.message ? err.message : 'An unexpected error occurred. Please try again.',
  };
}
