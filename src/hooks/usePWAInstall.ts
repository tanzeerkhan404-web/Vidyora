import { useCallback, useEffect, useState } from 'react';
import { detectInstallPlatform, type InstallPlatform } from '../utils/pwaLogic';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export type InstallOutcome = 'idle' | 'accepted' | 'dismissed' | 'unavailable';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<InstallPlatform>('desktop');
  const [installOutcome, setInstallOutcome] = useState<InstallOutcome>('idle');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const standaloneQuery = window.matchMedia('(display-mode: standalone)');
    const checkStandalone = () => {
      const standalone =
        standaloneQuery.matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsInstalled(standalone);
      setPlatform(detectInstallPlatform(window.navigator.userAgent, standalone));
    };

    checkStandalone();

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setInstallOutcome('idle');
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setInstallOutcome('accepted');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    standaloneQuery.addEventListener('change', checkStandalone);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      standaloneQuery.removeEventListener('change', checkStandalone);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<InstallOutcome> => {
    if (!deferredPrompt) {
      setInstallOutcome('unavailable');
      return 'unavailable';
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setInstallOutcome('accepted');
        return 'accepted';
      }
      setInstallOutcome('dismissed');
      return 'dismissed';
    } catch {
      setInstallOutcome('unavailable');
      return 'unavailable';
    }
  }, [deferredPrompt]);

  const resetInstallOutcome = useCallback(() => {
    setInstallOutcome('idle');
  }, []);

  return {
    isInstallable: Boolean(deferredPrompt),
    isInstalled,
    isStandalone: isInstalled,
    platform,
    installOutcome,
    promptInstall,
    resetInstallOutcome,
  };
}
