import '@tanstack/react-query';

interface FeedbackMeta extends Record<string, unknown> {
  /** false = this query/mutation shows its own error; don't toast it */
  errorToast?: boolean;
  /** What was being attempted, e.g. "archive the quiz" → "Couldn't archive the quiz" */
  errorContext?: string;
  /** Mutations only: toast this on success */
  successMessage?: string;
  successDetail?: string;
}

declare module '@tanstack/react-query' {
  interface Register {
    queryMeta: FeedbackMeta;
    mutationMeta: FeedbackMeta;
  }
}
