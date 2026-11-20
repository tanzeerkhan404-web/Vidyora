import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  detectInstallPlatform,
  parsePwaShortcutParams,
  shouldNeverCacheUrl,
  validateWebAppManifest,
  type WebAppManifestLike,
} from './pwaLogic';

const ROOT = path.resolve(process.cwd());

function readPngDimensions(filePath: string): { width: number; height: number } {
  const buf = fs.readFileSync(filePath);
  // PNG 8-byte signature: 89 50 4E 47 0D 0A 1A 0A
  const signature = buf.subarray(0, 8);
  assert.deepEqual(
    Array.from(signature),
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    `${path.basename(filePath)} must have a valid PNG signature`
  );
  // IHDR width and height are 4-byte big-endian unsigned ints at offsets 16 and 20
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  return { width, height };
}

test('manifest.webmanifest is valid JSON and passes all Android PWA installability checks', () => {
  const manifestPath = path.join(ROOT, 'public/manifest.webmanifest');
  assert.equal(fs.existsSync(manifestPath), true, 'public/manifest.webmanifest must exist');

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as WebAppManifestLike;
  const result = validateWebAppManifest(manifest);
  assert.equal(result.valid, true, `Manifest errors: ${result.errors.join('; ')}`);
  assert.equal(manifest.name, 'VIDYORA');
  assert.equal(manifest.short_name, 'VIDYORA');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.orientation, 'portrait');
  assert.equal(manifest.start_url, '/');
  assert.equal(manifest.scope, '/');
});

test('all referenced PNG icons exist and have exact valid dimensions', () => {
  const expectedIcons: Array<{ file: string; width: number; height: number }> = [
    { file: 'public/icon-192.png', width: 192, height: 192 },
    { file: 'public/icon-512.png', width: 512, height: 512 },
    { file: 'public/icon-maskable-192.png', width: 192, height: 192 },
    { file: 'public/icon-maskable-512.png', width: 512, height: 512 },
    { file: 'public/apple-touch-icon.png', width: 180, height: 180 },
    { file: 'public/favicon-32x32.png', width: 32, height: 32 },
  ];

  for (const item of expectedIcons) {
    const fullPath = path.join(ROOT, item.file);
    assert.equal(fs.existsSync(fullPath), true, `${item.file} must exist`);
    const dims = readPngDimensions(fullPath);
    assert.equal(dims.width, item.width, `${item.file} width mismatch`);
    assert.equal(dims.height, item.height, `${item.file} height mismatch`);
  }
});

test('index.html links manifest.webmanifest, theme-color, and apple-touch-icon PNG', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf-8');
  assert.match(html, /<link\s+rel="manifest"\s+href="\/manifest\.webmanifest"/i);
  assert.match(html, /<meta\s+name="theme-color"\s+content="#0B1221"/i);
  assert.match(html, /<link\s+rel="apple-touch-icon"[^>]*href="\/apple-touch-icon\.png"/i);
});

test('offline.html and sw.js exist with cache versioning and sensitive endpoint exclusions', () => {
  const offlineHtml = fs.readFileSync(path.join(ROOT, 'public/offline.html'), 'utf-8');
  assert.match(offlineHtml, /VIDYORA/);
  assert.match(offlineHtml, /AI Study Buddy/i);

  const swSource = fs.readFileSync(path.join(ROOT, 'public/sw.js'), 'utf-8');
  assert.match(swSource, /CACHE_VERSION/);
  assert.match(swSource, /caches\.delete/);
  assert.match(swSource, /\/offline\.html/);
  assert.match(swSource, /firestore\.googleapis\.com/);
  assert.match(swSource, /identitytoolkit\.googleapis\.com/);
  assert.match(swSource, /\/\^\\\/api/);
});

test('shouldNeverCacheUrl blocks AI APIs, Firebase Auth/Firestore, POST requests, and auth headers', () => {
  assert.equal(shouldNeverCacheUrl('/api/ai/study-buddy', 'POST'), true);
  assert.equal(shouldNeverCacheUrl('/api/ai/status', 'GET'), true);
  assert.equal(shouldNeverCacheUrl('/api/ai/notes', 'GET'), true);
  assert.equal(
    shouldNeverCacheUrl('https://firestore.googleapis.com/v1/projects/x/databases/(default)/documents/student_progress/123'),
    true
  );
  assert.equal(
    shouldNeverCacheUrl('https://identitytoolkit.googleapis.com/v1/accounts:lookup'),
    true
  );
  assert.equal(shouldNeverCacheUrl('/index.html', 'GET', true), true);

  // Static app assets remain cacheable
  assert.equal(shouldNeverCacheUrl('/index.html', 'GET', false), false);
  assert.equal(shouldNeverCacheUrl('/icon-192.png', 'GET', false), false);
  assert.equal(shouldNeverCacheUrl('/assets/index-abc123.js', 'GET', false), false);
});

test('detectInstallPlatform identifies standalone, Android Chrome, iOS Safari, and Desktop', () => {
  assert.equal(detectInstallPlatform('Mozilla/5.0 Android Chrome/126.0', true), 'standalone');
  assert.equal(
    detectInstallPlatform(
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/126.0.0.0 Mobile Safari/537.36',
      false
    ),
    'android-chrome'
  );
  assert.equal(
    detectInstallPlatform(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
      false
    ),
    'ios-safari'
  );
  assert.equal(
    detectInstallPlatform(
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36',
      false
    ),
    'desktop'
  );
});

test('parsePwaShortcutParams parses valid manifest shortcut URLs and ignores unknown/admin views', () => {
  assert.deepEqual(parsePwaShortcutParams('?view=explore'), { view: 'explore' });
  assert.deepEqual(parsePwaShortcutParams('?view=ai-suite&tool=doubt-solver'), {
    view: 'ai-suite',
    tool: 'doubt-solver',
  });
  // Never allow shortcut URL to open admin-cms directly
  assert.deepEqual(parsePwaShortcutParams('?view=admin-cms'), {});
});
