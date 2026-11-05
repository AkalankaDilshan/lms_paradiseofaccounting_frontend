import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { OctagonAlert, RotateCcw, Home } from 'lucide-react';
import { Button } from '../ui/button';

interface State {
  error: Error | null;
}

/**
 * Catches a crash while rendering a page and shows a recovery screen instead
 * of a blank white page. `resetKey` (the route path) clears it on navigation.
 */
export class ErrorBoundary extends Component<{ children: ReactNode; resetKey?: string }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Page crashed:', error, info.componentStack);
  }

  componentDidUpdate(prev: { resetKey?: string }) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <div className="w-full max-w-md overflow-hidden rounded-2xl bg-card text-center shadow-xl ring-1 ring-destructive/30">
          <div className="h-1 bg-destructive" />
          <div className="space-y-4 bg-gradient-to-b from-destructive/10 to-transparent p-8">
            <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
              <OctagonAlert className="size-7" />
            </span>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">This page hit a problem</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Something unexpected went wrong while showing this page. Your saved work is safe. Try reloading, or go back to your dashboard.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button variant="outline" size="lg" onClick={() => window.location.assign('/')}>
                <Home /> Dashboard
              </Button>
              <Button size="lg" onClick={() => window.location.reload()}>
                <RotateCcw /> Reload page
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
