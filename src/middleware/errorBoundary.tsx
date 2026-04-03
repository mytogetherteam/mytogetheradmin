import { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  /** Optional custom fallback UI */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

/**
 * ErrorBoundary — wraps the whole authenticated app (or individual pages).
 *
 * Catches any unhandled React render/lifecycle error and shows a recovery screen
 * instead of a blank white page. Provides:
 *  - "Try Again" → resets the boundary and re-renders children
 *  - "Go to Dashboard" → full hard-reload to "/"
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error);
    console.error('[ErrorBoundary] Component stack:', info.componentStack);
    this.setState({ errorInfo: info.componentStack ?? null });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-6 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-tight">Something went wrong</h2>
            <p className="max-w-md text-sm text-muted-foreground">
              This page crashed unexpectedly. Your data is safe. You can try refreshing
              this section or go back to the dashboard.
            </p>
          </div>

          {/* Show error message in dev only */}
          {import.meta.env.DEV && this.state.error && (
            <div className="w-full max-w-lg rounded-md border border-destructive/30 bg-destructive/5 p-4 text-left">
              <p className="mb-1 text-xs font-semibold text-destructive">Error (dev only)</p>
              <pre className="overflow-auto text-xs text-destructive/80 whitespace-pre-wrap">
                {this.state.error.message}
                {this.state.errorInfo && `\n\nComponent Stack:${this.state.errorInfo}`}
              </pre>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={this.handleReset} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            <Button onClick={this.handleGoHome} className="gap-2">
              <Home className="h-4 w-4" />
              Go to Dashboard
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
