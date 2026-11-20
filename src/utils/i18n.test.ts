import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterLanguages,
  getLanguageMeta,
  isSupportedLanguage,
  SUPPORTED_LANGUAGES,
  t,
} from './i18n';

test('supports all 14 Indian and 10 International languages (24 total)', () => {
  assert.equal(SUPPORTED_LANGUAGES.length, 24);
  const indian = SUPPORTED_LANGUAGES.filter((l) => l.group === 'indian');
  const intl = SUPPORTED_LANGUAGES.filter((l) => l.group === 'international');
  assert.equal(indian.length, 14);
  assert.equal(intl.length, 10);
});

test('configures RTL direction specifically for Urdu and Arabic', () => {
  assert.equal(getLanguageMeta('ur').dir, 'rtl');
  assert.equal(getLanguageMeta('ar').dir, 'rtl');
  assert.equal(getLanguageMeta('hi').dir, 'ltr');
  assert.equal(getLanguageMeta('kn').dir, 'ltr');
  assert.equal(getLanguageMeta('en').dir, 'ltr');
});

test('every language resolves non-empty core navigation labels', () => {
  for (const lang of SUPPORTED_LANGUAGES) {
    assert.ok(t(lang.code, 'nav.home').length > 0);
    assert.ok(t(lang.code, 'nav.dashboard').length > 0);
    assert.ok(t(lang.code, 'nav.aiBuddy').length > 0);
    assert.equal(isSupportedLanguage(lang.code), true);
  }
});

test('searchable language list matches both English and native script names', () => {
  assert.equal(filterLanguages('ಕನ್ನಡ').length, 1);
  assert.equal(filterLanguages('اردو')[0].code, 'ur');
  assert.equal(filterLanguages('japanese', 'international')[0].code, 'ja');
  assert.equal(filterLanguages('japanese', 'indian').length, 0);
});
