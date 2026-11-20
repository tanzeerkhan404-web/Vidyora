export interface SWRegistrationCallbacks {
  onUpdateReady?: (applyUpdate: () => void) => void;
  onRegistered?: (registration: ServiceWorkerRegistration) => void;
}

export function registerVidyoraServiceWorker(
  callbacks?: SWRegistrationCallbacks
): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  const register = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      });

      callbacks?.onRegistered?.(registration);

      // Check for updated service worker when user returns to the app
      registration.addEventListener('updatefound', () => {
        const installing = registration.installing;
        if (!installing) return;

        installing.addEventListener('statechange', () => {
          if (
            installing.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            callbacks?.onUpdateReady?.(() => {
              installing.postMessage({ type: 'SKIP_WAITING' });
              window.location.reload();
            });
          }
        });
      });
    } catch {
      // Service worker registration may be blocked in restricted/insecure contexts;
      // keep all existing web functionality working without crashing.
    }
  };

  if (document.readyState === 'complete') {
    void register();
  } else {
    window.addEventListener('load', () => {
      void register();
    }, { once: true });
  }
}
