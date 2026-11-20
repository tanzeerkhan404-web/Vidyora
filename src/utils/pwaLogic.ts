import type { AIToolTab, PageView } from '../types/vidyora';

export interface ManifestIconEntry {
  src: string;
  sizes: string;
  type: string;
  purpose?: string;
}

export interface WebAppManifestLike {
  id?: string;
  name?: string;
  short_name?: string;
  description?: string;
  start_url?: string;
  scope?: string;
  display?: string;
  orientation?: string;
  theme_color?: string;
  background_color?: string;
  icons?: ManifestIconEntry[];
}

export interface ManifestValidationResult {
  valid: boolean;
  errors: string[];
}

export type InstallPlatform =
  | 'standalone'
  | 'android-chrome'
  | 'android-other'
  | 'ios-safari'
  | 'desktop';

const NEVER_CACHE_HOST_PATTERNS = [
  /firestore\.googleapis\.com$/i,
  /identitytoolkit\.googleapis\.com$/i,
  /securetoken\.googleapis\.com$/i,
  /firebaseinstallations\.googleapis\.com$/i,
  /firebase\.googleapis\.com$/i,
  /\.firebaseapp\.com$/i,
  /generativelanguage\.googleapis\.com$/i,
  /youtube\.com$/i,
  /youtu\.be$/i,
  /googlevideo\.com$/i,
];

const NEVER_CACHE_PATH_PATTERNS = [
  /^\/api(\/|$)/i,
  /^\/__\//i,
  /^\/auth(\/|$)/i,
  /^\/admin(\/|$)/i,
];

export function validateWebAppManifest(
  manifest: WebAppManifestLike
): ManifestValidationResult {
  const errors: string[] = [];

  if (!manifest.id || typeof manifest.id !== 'string') {
    errors.push('Missing manifest "id".');
  }
  if (!manifest.name || manifest.name.trim().length === 0) {
    errors.push('Missing manifest "name".');
  }
  if (!manifest.short_name || manifest.short_name.trim().length === 0) {
    errors.push('Missing manifest "short_name".');
  } else if (manifest.short_name.trim().length > 12) {
    errors.push('Manifest "short_name" exceeds 12 characters.');
  }
  if (manifest.start_url !== '/') {
    errors.push('Manifest "start_url" should be "/".');
  }
  if (manifest.scope !== '/') {
    errors.push('Manifest "scope" should be "/".');
  }
  if (manifest.display !== 'standalone') {
    errors.push('Manifest "display" must be "standalone".');
  }
  if (manifest.orientation !== 'portrait') {
    errors.push('Manifest "orientation" must be "portrait".');
  }
  if (!manifest.theme_color || !/^#[0-9a-fA-F]{6}$/.test(manifest.theme_color)) {
    errors.push('Manifest "theme_color" must be a valid hex color.');
  }
  if (
    !manifest.background_color ||
    !/^#[0-9a-fA-F]{6}$/.test(manifest.background_color)
  ) {
    errors.push('Manifest "background_color" must be a valid hex color.');
  }

  const icons = Array.isArray(manifest.icons) ? manifest.icons : [];
  const has192Any = icons.some(
    (i) =>
      i.sizes === '192x192' &&
      i.type === 'image/png' &&
      (!i.purpose || i.purpose === 'any')
  );
  const has512Any = icons.some(
    (i) =>
      i.sizes === '512x512' &&
      i.type === 'image/png' &&
      (!i.purpose || i.purpose === 'any')
  );
  const hasMaskable = icons.some(
    (i) =>
      (i.sizes === '192x192' || i.sizes === '512x512') &&
      i.type === 'image/png' &&
      i.purpose === 'maskable'
  );
  const hasCombinedAnyMaskable = icons.some(
    (i) => typeof i.purpose === 'string' && i.purpose.includes('any') && i.purpose.includes('maskable')
  );

  if (!has192Any) errors.push('Missing 192x192 PNG icon with purpose "any".');
  if (!has512Any) errors.push('Missing 512x512 PNG icon with purpose "any".');
  if (!hasMaskable) errors.push('Missing dedicated maskable PNG icon.');
  if (hasCombinedAnyMaskable) {
    errors.push('Keep "any" and "maskable" icon purposes separate.');
  }

  return { valid: errors.length === 0, errors };
}

export function shouldNeverCacheUrl(
  rawUrl: string,
  method = 'GET',
  hasAuthHeader = false,
  appOrigin = 'https://vidyora.app'
): boolean {
  if (method.toUpperCase() !== 'GET') return true;
  if (hasAuthHeader) return true;

  let url: URL;
  try {
    url = new URL(rawUrl, appOrigin);
  } catch {
    return true;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return true;

  if (NEVER_CACHE_HOST_PATTERNS.some((p) => p.test(url.hostname))) {
    return true;
  }

  if (
    url.origin === appOrigin &&
    NEVER_CACHE_PATH_PATTERNS.some((p) => p.test(url.pathname))
  ) {
    return true;
  }

  return false;
}

export function detectInstallPlatform(
  userAgent: string,
  isStandalone: boolean
): InstallPlatform {
  if (isStandalone) return 'standalone';
  const ua = userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios-safari';
  if (/android/.test(ua)) {
    if (/chrome/.test(ua) && !/edga|opr|samsungbrowser|firefox/.test(ua)) {
      return 'android-chrome';
    }
    return 'android-other';
  }
  return 'desktop';
}

const VALID_SHORTCUT_VIEWS = new Set<PageView>([
  'home',
  'explore',
  'video-lessons',
  'ai-suite',
  'free-notes',
  'dashboard',
]);

const VALID_SHORTCUT_TOOLS = new Set<AIToolTab>([
  'study-buddy',
  'doubt-solver',
  'notes',
  'quiz',
  'planner',
]);

export function parsePwaShortcutParams(search: string): {
  view?: PageView;
  tool?: AIToolTab;
} {
  const params = new URLSearchParams(search);
  const rawView = params.get('view') as PageView | null;
  const rawTool = params.get('tool') as AIToolTab | null;

  const result: { view?: PageView; tool?: AIToolTab } = {};
  if (rawView && VALID_SHORTCUT_VIEWS.has(rawView)) {
    result.view = rawView;
  }
  if (rawTool && VALID_SHORTCUT_TOOLS.has(rawTool)) {
    result.tool = rawTool;
  }
  return result;
}
