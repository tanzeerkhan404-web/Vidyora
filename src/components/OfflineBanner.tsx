import { RefreshCw, WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="vidyora-offline-banner"
      className="fixed bottom-[72px] md:bottom-4 left-3 right-3 md:left-4 md:right-auto md:max-w-md z-40 rounded-2xl bg-[#0B1221] text-white border border-amber-400/40 shadow-2xl px-4 py-3 flex items-start gap-3"
    >
      <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
        <WifiOff className="w-4 h-4" aria-hidden="true" />
      </span>
      <div className="flex-1 min-w-0 text-xs leading-relaxed">
        <p className="font-display font-bold text-amber-200">
          Offline Mode Active
        </p>
        <p className="text-slate-200 mt-0.5">
          Cached pages aur local notes khul sakte hain, par AI tools, live video lessons aur cloud database sync ke liye internet zaroori hai.
        </p>
      </div>
      <button
        type="button"
        onClick={() => window.location.reload()}
        aria-label="Retry internet connection"
        className="inline-flex items-center justify-center gap-1 px-2.5 py-2 min-h-[36px] rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white shrink-0 cursor-pointer"
      >
        <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Retry</span>
      </button>
    </div>
  );
}
