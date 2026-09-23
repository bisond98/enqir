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

// Hand-drawn 2D doodles — same visual language as the OTP sign-in page
// (64-viewBox, thin strokes, ~w-7/w-9 sizes, floating). Each maps to the
// business: buyer demand, seller supply, deal, payment.
const DoodleChat = () => (
  <svg viewBox="0 0 64 64" className="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 18c0-4 3-7 7-7h26c4 0 7 3 7 7v14c0 4-3 7-7 7H29l-10 9v-9h-2c-3 0-5-3-5-7z" />
    <circle cx="25" cy="25" r="2" fill="currentColor" stroke="none" />
    <circle cx="32" cy="25" r="2" fill="currentColor" stroke="none" />
    <circle cx="39" cy="25" r="2" fill="currentColor" stroke="none" />
  </svg>
);

const DoodleMegaphone = () => (
  <svg viewBox="0 0 64 64" className="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 30v8c0 1.5 1 2.5 2.5 2.5H20l4 11c.4 1.3 1.7 2.2 3 1.8 1.4-.4 2.2-1.7 1.8-3L25.5 40.5H32z" />
    <path d="M32 26L20 30v8l12 4c4 1.2 7-1 8-5s-.5-9-4-11z" />
    <path d="M46 20l3-5M50 30l6-1M47 40l4 3" strokeDasharray="2 4" />
  </svg>
);

const DoodleHandshake = () => (
  <svg viewBox="0 0 64 64" className="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 26l10-6 12 4 12-4 10 6" />
    <path d="M16 20v16l10 8c2 1.5 4 1 5.5-.5L42 34c1.5-1.5 1-4-1-5" />
    <path d="M16 36h-6V20" />
    <path d="M48 20v16h-6" />
    <path d="M28 30l4 4M34 28l4 4" />
  </svg>
);

const DoodleRupee = () => (
  <svg viewBox="0 0 64 64" className="w-7 h-7 sm:w-9 sm:h-9" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="32" cy="32" r="19" />
    <path d="M24 22h16M24 28h16M30 22c6 0 9 2 9 6s-3 6-9 6l11 10" />
  </svg>
);

const DoodleEnquiry = () => (
  <svg viewBox="0 0 64 64" className="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 10h20l10 10v34H16z" />
    <path d="M36 10v10h10" />
    <path d="M23 30h16M23 36h16M23 42h9" />
    <path d="M47 51l7-7 4 4-7 7-5 1z" />
  </svg>
);

const DoodleSparkle = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4l2.5 7.5L26 14l-7.5 2.5L16 24l-2.5-7.5L6 14l7.5-2.5z" />
  </svg>
);

const DoodleBolt = () => (
  <svg viewBox="0 0 64 64" className="w-5 h-5 sm:w-7 sm:h-7" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M34 6L16 36h12l-4 22 22-32H34z" />
  </svg>
);

const DoodlePlus = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
    <path d="M16 7v18M7 16h18" />
  </svg>
);

const DoodleRing = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth={2}>
    <circle cx="16" cy="16" r="10" />
  </svg>
);

const DoodleStar = () => (
  <svg viewBox="0 0 32 32" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 3l3 7 7 1-5 5 1.5 7-6.5-3.5L9.5 23 11 16 6 11l7-1z" />
  </svg>
);

const Doodles = () => (
  <div className="pointer-events-none absolute inset-0" aria-hidden="true">
    <div className="absolute top-[8%] right-[6%] rotate-6 text-gray-900/80 doodle-float"><DoodleChat /></div>
    <div className="absolute top-[38%] left-[4%] rotate-[-10deg] text-gray-900/70 doodle-float-slow"><DoodleMegaphone /></div>
    <div className="absolute bottom-[28%] left-[3%] -rotate-6 text-gray-900/70 doodle-float-slow"><DoodleHandshake /></div>
    <div className="absolute top-[36%] right-[5%] rotate-[8deg] text-gray-900/70 doodle-float"><DoodleRupee /></div>
    <div className="absolute bottom-[12%] right-[8%] -rotate-6 text-gray-900/80 doodle-float"><DoodleEnquiry /></div>
    <div className="absolute top-[3%] left-[6%] text-gray-900 rotate-12"><DoodleSparkle className="w-4 h-4" /></div>
    <div className="absolute bottom-[40%] left-[6%] text-gray-900 -rotate-12"><DoodleSparkle className="w-3 h-3" /></div>
    <div className="absolute top-[55%] left-[13%] text-gray-900/50 rotate-45"><DoodleSparkle className="w-2.5 h-2.5" /></div>
    <div className="absolute top-[60%] right-[14%] text-gray-900/50 -rotate-12"><DoodleSparkle className="w-2.5 h-2.5" /></div>
    <div className="absolute bottom-[16%] left-[28%] rotate-12 text-gray-900 doodle-float"><DoodleBolt /></div>
    <div className="absolute top-[30%] left-[10%] text-gray-900 rotate-12"><DoodlePlus className="w-3.5 h-3.5" /></div>
    <div className="absolute bottom-[44%] right-[8%] text-gray-900 -rotate-6"><DoodlePlus className="w-3 h-3" /></div>
    <div className="absolute bottom-[18%] right-[16%] text-gray-900 rotate-12"><DoodleRing className="w-3 h-3" /></div>
    <div className="absolute top-[10%] left-[16%] text-gray-900/45 -rotate-12"><DoodleRing className="w-2.5 h-2.5" /></div>
    <div className="absolute top-[66%] left-[8%] text-gray-900 rotate-45"><DoodleStar /></div>
    <div className="absolute top-[20%] right-[12%] text-gray-900/50 rotate-12"><DoodleStar /></div>
  </div>
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
          {/* Marketplace doodles on the page background, matching the OTP page */}
          <style>{`@keyframes doodleFloat { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-9px) } }
          .doodle-float { animation: doodleFloat 5s ease-in-out infinite; }
          .doodle-float-slow { animation: doodleFloat 7s ease-in-out 1.2s infinite; }`}</style>

          <Doodles />

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
