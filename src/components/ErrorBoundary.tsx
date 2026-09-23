import { Component, ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: any;
}

// Stale-bundle detection: after a new deploy, a suspended/restored tab may
// request JS chunks that no longer exist. The server (SPA rewrite) returns
// index.html for them, so the browser throws "'text/html' is not a valid
// JavaScript MIME type" (or a ChunkLoadError). Auto-reloading once fetches
// the fresh index.html + bundles and the user never sees the error screen.
const STALE_BUNDLE_KEY = 'errorboundary_stale_reload_at';
const isStaleBundleError = (error?: Error): boolean => {
  if (!error) return false;
  const msg = `${error.message || ''} ${(error as any).stack || ''}`.toLowerCase();
  return (
    msg.includes('mime type') ||
    msg.includes('mimeType') ||
    msg.includes('dynamically imported module') ||
    msg.includes('importing a module script failed') ||
    msg.includes('failed to fetch dynamically') ||
    msg.includes('chunkloaderror') ||
    msg.includes('loading chunk') ||
    msg.includes('error loading dynamically imported')
  );
};

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // eslint-disable-next-line no-console
    console.error("ErrorBoundary caught:", error, errorInfo);

    // Auto-recover from stale-bundle errors (old JS chunk after a redeploy):
    // reload ONCE per session — if it still fails right after, show the UI so
    // the user isn't stuck in a reload loop.
    if (isStaleBundleError(error)) {
      const last = parseInt(localStorage.getItem(STALE_BUNDLE_KEY) || '0', 10);
      const now = Date.now();
      if (now - last > 10000) {
        localStorage.setItem(STALE_BUNDLE_KEY, String(now));
        window.location.reload();
        return;
      }
    }
    
    // Log error details for debugging
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
    
    this.setState({ errorInfo });
    
    // In production, you could send error to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error tracking service
      // errorTrackingService.logError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleRefreshNow = () => {
    // Clear the auto-reload guard so the refresh is always allowed, then
    // reload with a cache-buster so Safari fetches a fresh index.html.
    try {
      localStorage.removeItem(STALE_BUNDLE_KEY);
    } catch {
      /* ignore */
    }
    window.location.href = window.location.pathname + '?_r=' + Date.now();
  };

  render() {
    if (this.state.hasError) {
      // Single friendly recovery screen for ALL errors (stale bundles after a
      // redeploy, or anything else that slips through on a restored tab):
      // one big Refresh button, Home as backup. No scary error card.
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg border-2 border-slate-200 p-6 sm:p-8 text-center">
            <div className="mb-6">
              <span className="text-8xl sm:text-9xl font-extrabold tracking-tight text-blue-600">Enqir</span>
            </div>

            <div className="space-y-3">
              <Button
                onClick={this.handleRefreshNow}
                className="!w-full !h-16 !text-lg !font-black !bg-blue-600 hover:!bg-blue-700 !text-white !rounded-2xl !border-[1.5px] !border-black !shadow-[0_6px_0_0_rgba(0,0,0,0.85)] active:!shadow-[0_1px_0_0_rgba(0,0,0,0.85)] active:!translate-y-[4px] !transition-all !duration-150 !relative !overflow-hidden touch-manipulation select-none"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Refresh Now
                </span>
              </Button>

              <Button
                onClick={this.handleGoHome}
                className="!w-full !h-16 !text-lg !font-black !bg-white hover:!bg-slate-50 !text-slate-900 !rounded-2xl !border-[1.5px] !border-slate-300 !shadow-[0_6px_0_0_rgba(0,0,0,0.85)] active:!shadow-[0_1px_0_0_rgba(0,0,0,0.85)] active:!translate-y-[4px] !transition-all !duration-150 !relative !overflow-hidden touch-manipulation select-none"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Home className="h-5 w-5" />
                  Go to Home
                </span>
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-sm text-slate-500 cursor-pointer hover:text-slate-700">
                  Error Details (Development Only)
                </summary>
                <pre className="mt-2 text-xs bg-slate-100 p-3 rounded overflow-auto max-h-40">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}


