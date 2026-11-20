import { useCallback, useEffect, useState } from 'react';

export type TextScaleMode = 'normal' | 'large' | 'xlarge';

export interface AccessibilityPrefs {
  textScale: TextScaleMode;
  highContrast: boolean;
  lowBandwidth: boolean;
}

const STORAGE_KEY = 'vidyora_a11y_prefs_v1';

const DEFAULT_PREFS: AccessibilityPrefs = {
  textScale: 'normal',
  highContrast: false,
  lowBandwidth: false,
};

function loadPrefs(): AccessibilityPrefs {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<AccessibilityPrefs>;
    return {
      textScale:
        parsed.textScale === 'large' || parsed.textScale === 'xlarge'
          ? parsed.textScale
          : 'normal',
      highContrast: Boolean(parsed.highContrast),
      lowBandwidth: Boolean(parsed.lowBandwidth),
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function useAccessibilityPrefs() {
  const [prefs, setPrefs] = useState<AccessibilityPrefs>(() => loadPrefs());

  useEffect(() => {
    const root = document.documentElement;
    root.style.fontSize =
      prefs.textScale === 'xlarge'
        ? '19px'
        : prefs.textScale === 'large'
        ? '17.5px'
        : '16px';
    root.classList.toggle('vidyora-high-contrast', prefs.highContrast);
    root.classList.toggle('vidyora-low-bandwidth', prefs.lowBandwidth);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // Ignore storage errors
    }
  }, [prefs]);

  const updatePrefs = useCallback((patch: Partial<AccessibilityPrefs>) => {
    setPrefs((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetPrefs = useCallback(() => {
    setPrefs(DEFAULT_PREFS);
  }, []);

  return { prefs, updatePrefs, resetPrefs };
}
