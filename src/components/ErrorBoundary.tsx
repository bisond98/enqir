import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

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

/**
 * Hand-drawn 2D black doodles decorating the error screen. Each doodle maps
 * to the business: Enqir connects buyers (demand) and sellers (supply).
 * Pure inline SVG strokes — no image assets, no bundle bloat (~2KB).
 */
const Doodles = () => (
  <>
    {/* Speech bubble — "I need X" (a buyer enquiry) */}
    <svg className="absolute top-5 left-4 sm:top-10 sm:left-10 w-14 h-14 sm:w-20 sm:h-20 -rotate-12" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 15 Q14 15 14 22 L14 62 Q14 68 20 68 L48 68 L60 82 L60 68 L80 68 Q86 68 86 62 L86 22 Q86 15 80 15 Z" />
      <path d="M28 32 Q50 26 72 32" strokeDasharray="2 8" />
      <path d="M28 46 Q50 40 72 46" strokeDasharray="2 8" />
    </svg>

    {/* Megaphone — sellers shouting their supply */}
    <svg className="absolute bottom-16 right-4 sm:bottom-24 sm:right-12 w-14 h-14 sm:w-20 sm:h-20 rotate-12" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 45 L18 62 Q18 66 23 66 L34 66 L40 84 Q41 88 45 87 Q49 86 48 82 L43 66 L58 70 Z" />
      <path d="M58 38 L34 46 L34 62 L58 72 Q70 76 76 62 Q80 52 76 46 Q70 34 58 38 Z" />
      <path d="M84 30 L90 22" strokeDasharray="1 7" />
      <path d="M88 44 L97 42" strokeDasharray="1 6" />
      <path d="M86 58 L94 63" strokeDasharray="1 6" />
    </svg>

    {/* Handshake — the deal closing */}
    <svg className="absolute top-1/3 -right-2 sm:right-6 w-12 h-12 sm:w-16 sm:h-16 rotate-6 hidden xs:block" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 55 L28 42 L44 50 L58 44 L74 52 L90 45" />
      <path d="M28 42 L38 58 Q44 64 50 58 L44 50" />
      <path d="M50 58 L58 64 Q64 66 66 60 L58 52" />
      <path d="M66 60 L74 66 Q80 66 80 60" />
    </svg>

    {/* Rupee coin — the money that changes hands */}
    <svg className="absolute bottom-6 left-6 sm:bottom-10 sm:left-14 w-12 h-12 sm:w-16 sm:h-16 -rotate-6" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="50" cy="50" r="34" />
      <path d="M40 30 L62 30" />
      <path d="M40 42 L62 42" />
      <path d="M40 30 Q64 34 50 50 Q40 60 32 70" />
      <path d="M36 62 L58 62" />
      <path d="M42 70 L58 70" />
    </svg>

    {/* Sparkles/urgency — demand energy */}
    <svg className="absolute top-8 right-8 sm:top-14 sm:right-20 w-10 h-10 sm:w-14 sm:h-14 rotate-12" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M50 12 L54 38 L80 42 L54 48 L50 74 L46 48 L20 42 L46 38 Z" />
      <path d="M22 66 L25 74 L33 77 L25 80 L22 88 L19 80 L11 77 L19 74 Z" />
    </svg>
  </>
);

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
      // one big Refresh button. No scary error card.
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6">
          {/* Doodles on the page background, outside the card */}
          <div className="fixed inset-0 pointer-events-none text-slate-800" aria-hidden="true">
            <Doodles />
          </div>

          <div className="max-w-3xl w-full bg-white rounded-2xl sm:rounded-3xl shadow-lg border-2 border-slate-200 p-8 sm:p-16 text-center">
            <div className="mb-10 sm:mb-14">
              <span className="text-7xl sm:text-8xl md:text-9xl font-extrabold tracking-tight text-blue-600">Enqir</span>
            </div>

            <Button
              onClick={this.handleRefreshNow}
              className="!w-full sm:!w-auto sm:!min-w-[320px] sm:!mx-auto !h-16 !text-lg !font-black !bg-blue-600 hover:!bg-blue-700 !text-white !rounded-2xl !border-[1.5px] !border-black !shadow-[0_6px_0_0_rgba(0,0,0,0.85)] active:!shadow-[0_1px_0_0_rgba(0,0,0,0.85)] active:!translate-y-[4px] !transition-all !duration-150 !relative !overflow-hidden touch-manipulation select-none !px-8"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Refresh Now
              </span>
            </Button>

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
