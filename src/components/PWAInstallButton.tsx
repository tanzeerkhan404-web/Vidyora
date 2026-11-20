import { useState } from 'react';
import {
  CheckCircle2,
  Download,
  Info,
  MoreVertical,
  Share,
  Smartphone,
  X,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'navbar' | 'menu' | 'banner';
  onAfterAction?: () => void;
}

export function PWAInstallButton({
  variant = 'navbar',
  onAfterAction,
}: PWAInstallButtonProps) {
  const {
    isInstallable,
    isInstalled,
    platform,
    installOutcome,
    promptInstall,
    resetInstallOutcome,
  } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // Hide install triggers when already running as an installed standalone PWA
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const outcome = await promptInstall();
      if (outcome === 'accepted') {
        onAfterAction?.();
      } else if (outcome === 'unavailable') {
        setShowGuide(true);
      }
      return;
    }
    setShowGuide(true);
  };

  const buttonNode = (() => {
    if (variant === 'menu') {
      return (
        <button
          type="button"
          onClick={handleInstallClick}
          className="w-full flex items-center justify-between gap-3 px-4 py-3.5 min-h-[52px] rounded-2xl bg-gradient-to-r from-[#0B1221] via-[#131E35] to-[#4C1D95] text-white shadow-sm hover:opacity-95 transition-opacity cursor-pointer"
        >
          <span className="flex items-center gap-3 text-left">
            <span className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Download className="w-4 h-4 text-purple-200" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-bold leading-tight">
                Install VIDYORA App
              </span>
              <span className="block text-[11px] text-blue-200 mt-0.5">
                {isInstallable
                  ? 'Android par direct install ready hai'
                  : 'Home screen par app ki tarah add karein'}
              </span>
            </span>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-[#6D28D9] text-[11px] font-bold shrink-0">
            Install
          </span>
        </button>
      );
    }

    if (variant === 'banner') {
      return (
        <button
          type="button"
          onClick={handleInstallClick}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-semibold text-white bg-[#6D28D9] hover:bg-[#7C3AED] rounded-xl transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4" aria-hidden="true" />
          <span>Install VIDYORA</span>
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={handleInstallClick}
        aria-label="Install VIDYORA App"
        className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2 min-h-[42px] text-xs sm:text-sm font-semibold text-[#6D28D9] bg-[#EDE9FE] hover:bg-[#DDD6FE] border border-[#C4B5FD] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6D28D9]"
      >
        <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span className="hidden sm:inline">Install VIDYORA</span>
        <span className="sm:hidden">Install</span>
      </button>
    );
  })();

  return (
    <>
      {buttonNode}

      {/* Honest feedback if user dismissed the native browser prompt */}
      {installOutcome === 'dismissed' && (
        <div
          role="status"
          className="fixed bottom-20 md:bottom-5 right-4 z-50 max-w-xs bg-[#0B1221] text-white px-4 py-3 rounded-2xl shadow-xl border border-white/15 flex items-start gap-2.5 text-xs"
        >
          <Info className="w-4 h-4 text-blue-300 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1 leading-relaxed">
            Install cancel kar diya gaya. Jab bhi chahein, <strong>Install VIDYORA</strong> ya Chrome menu se install kar sakte hain.
          </div>
          <button
            type="button"
            onClick={resetInstallOutcome}
            aria-label="Dismiss install message"
            className="text-slate-400 hover:text-white p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Manual Install Instructions Modal (when native beforeinstallprompt isn't available) */}
      {showGuide && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-guide-title"
          className="fixed inset-0 z-50 bg-[#070C18]/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white text-[#0B1221] rounded-2xl border border-slate-200 max-w-md w-full shadow-2xl overflow-hidden my-auto">
            <div className="px-5 py-4 bg-[#0B1221] text-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-[#6D28D9]/30 border border-purple-400/40 flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4 text-purple-200" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[11px] text-blue-200">Android &amp; Mobile App Guide</p>
                  <h2
                    id="pwa-install-guide-title"
                    className="font-display text-base font-bold"
                  >
                    Install VIDYORA on Your Phone
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Close install instructions"
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-sm text-slate-700">
              {platform === 'ios-safari' ? (
                <div className="p-4 rounded-xl bg-[#EFF6FF] border border-blue-200 space-y-2.5">
                  <p className="font-display font-bold text-[#0B1221] flex items-center gap-2">
                    <Share className="w-4 h-4 text-[#2563EB]" aria-hidden="true" />
                    iPhone / iPad (Safari) Steps
                  </p>
                  <ol className="list-decimal list-inside space-y-1.5 text-xs sm:text-sm leading-relaxed">
                    <li>Safari browser ke niche <strong>Share</strong> icon tap karein.</li>
                    <li>Menu scroll karke <strong>Add to Home Screen</strong> select karein.</li>
                    <li>Top-right par <strong>Add</strong> tap karein — VIDYORA icon home screen par aa jayega.</li>
                  </ol>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#EFF6FF] border border-blue-200 space-y-2.5">
                  <p className="font-display font-bold text-[#0B1221] flex items-center gap-2">
                    <MoreVertical className="w-4 h-4 text-[#6D28D9]" aria-hidden="true" />
                    Android Chrome Steps
                  </p>
                  <ol className="list-decimal list-inside space-y-1.5 text-xs sm:text-sm leading-relaxed">
                    <li>VIDYORA ko <strong>Google Chrome</strong> mein deployed HTTPS link par kholein.</li>
                    <li>Top-right corner mein <strong>3 dots (⋮)</strong> menu tap karein.</li>
                    <li><strong>Add to Home screen</strong> ya <strong>Install app</strong> option choose karein.</li>
                    <li><strong>Install</strong> tap karein — VIDYORA standalone app ki tarah launch hoga.</li>
                  </ol>
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs text-slate-600 leading-relaxed">
                <p className="font-semibold text-[#0B1221] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#6D28D9]" aria-hidden="true" />
                  Native Install Prompt Kab Dikhta Hai?
                </p>
                <p>
                  Browser ka direct install popup tab appear hota hai jab site live HTTPS URL par open ho aur browser ne installation eligibility verify kar li ho. Agar aap preview ya non-Chrome browser mein hain, toh upar diye steps follow karein.
                </p>
              </div>
            </div>

            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="px-4 py-2.5 min-h-[44px] text-sm font-semibold text-white bg-[#0B1221] hover:bg-[#1E2E4D] rounded-xl cursor-pointer"
              >
                Samajh Gaya
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
