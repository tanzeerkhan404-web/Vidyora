import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
const blueprintPath = path.resolve(process.cwd(), 'firebase-blueprint.json');
const rules = fs.readFileSync(rulesPath, 'utf8');
const blueprint = JSON.parse(fs.readFileSync(blueprintPath, 'utf8'));

test('firestore.rules enforces global default-deny and rules_version 2', () => {
  assert.match(rules, /rules_version\s*=\s*'2';/);
  assert.match(rules, /match \/\{document=\*\*\}\s*\{\s*allow read, write: if false;\s*\}/);
});

test('firestore.rules covers every collection declared in firebase-blueprint.json', () => {
  const collections = Object.keys(blueprint.firestore || {});
  assert.ok(collections.length >= 4);
  for (const colPath of collections) {
    const cleanPath = colPath.replace(/^\//, '');
    assert.ok(
      rules.includes(`match /${cleanPath}`),
      `Missing match block for blueprint collection ${colPath}`
    );
  }
});

test('firestore.rules enforces verified email on bootstrap admin and rejects spoofed emails', () => {
  assert.match(rules, /function isVerifiedUser\(\)\s*\{\s*return isSignedIn\(\) && request\.auth\.token\.email_verified == true;\s*\}/);
  assert.match(rules, /function isBootstrapAdmin\(\)\s*\{\s*return isVerifiedUser\(\)/);
});

test('firestore.rules guards against shadow fields, ID poisoning, unsafe URLs, and client timestamps', () => {
  assert.match(rules, /isValidId\(lessonId\)/);
  assert.match(rules, /isValidId\(chatId\)/);
  assert.match(rules, /data\.keys\(\)\.hasOnly\(/);
  assert.match(rules, /data\.videoUrl\.matches\('\^https:\/\/\.\*\$'\)/);
  assert.match(rules, /incoming\(\)\.createdAt == request\.time/);
  assert.match(rules, /incoming\(\)\.updatedAt == request\.time/);
  assert.match(rules, /incoming\(\)\.createdBy == existing\(\)\.createdBy/);
  assert.match(rules, /affectedKeys\(\)\.hasOnly\(/);
});

test('firestore.rules restricts student_progress strictly to owner and bounds arrays', () => {
  assert.match(rules, /allow get: if isValidId\(userId\) && \(isOwner\(userId\) \|\| isAdmin\(\)\);/);
  assert.match(rules, /allow list: if isVerifiedUser\(\)\s*&& \(existing\(\)\.userId == request\.auth\.uid \|\| isBootstrapAdmin\(\)\);/);
  assert.match(rules, /data\.completedLessonIds\.size\(\) <= 500/);
  assert.match(rules, /data\.favouriteLessonIds\.size\(\) <= 200/);
  assert.match(rules, /data\.recentLessonIds\.size\(\) <= 50/);
  assert.match(rules, /affectedKeys\(\)\.hasOnly\(\['accountStatus', 'updatedAt'\]\)/);
});

test('firestore.rules protects /study_chats strictly to verified owner with bounded messages and no PII fields', () => {
  assert.match(rules, /function isValidStudyChat\(data\)/);
  assert.match(rules, /data\.messages\.size\(\) <= 40/);
  assert.match(rules, /match \/study_chats\/\{chatId\}/);
  assert.match(rules, /incoming\(\)\.userId == existing\(\)\.userId/);
  assert.match(rules, /allow delete: if isValidId\(chatId\)\s*&& isVerifiedUser\(\)\s*&& existing\(\)\.userId == request\.auth\.uid;/);
});

test('firestore.rules protects /saved_notes strictly to verified owner with bounded payload and strict note enums', () => {
  assert.match(rules, /function isValidSavedNote\(data\)/);
  assert.match(rules, /data\.payloadJson\.size\(\) <= 80000/);
  assert.match(rules, /match \/saved_notes\/\{noteId\}/);
  assert.match(rules, /isValidId\(noteId\)/);
  assert.match(rules, /'One-page Infographics'/);
  assert.match(rules, /allow delete: if isValidId\(noteId\)\s*&& isVerifiedUser\(\)\s*&& existing\(\)\.userId == request\.auth\.uid;/);
});

test('firestore.rules protects /quiz_attempts strictly to verified owner and prevents post-submission tampering', () => {
  assert.match(rules, /function isValidQuizAttempt\(data\)/);
  assert.match(rules, /match \/quiz_attempts\/\{attemptId\}/);
  assert.match(rules, /isValidId\(attemptId\)/);
  assert.match(rules, /data\.payloadJson\.size\(\) <= 60000/);
  assert.match(rules, /allow update: if false;/);
});

test('firestore.rules restricts /published_quizzes writes strictly to admins and allows public read only when published', () => {
  assert.match(rules, /function isValidPublishedQuiz\(data\)/);
  assert.match(rules, /match \/published_quizzes\/\{quizId\}/);
  assert.match(rules, /isValidId\(quizId\)/);
  assert.match(rules, /allow get: if isValidId\(quizId\)\s*&& \(existing\(\)\.published == true \|\| isAdmin\(\)\);/);
  assert.match(rules, /allow list: if existing\(\)\.published == true \|\| isBootstrapAdmin\(\);/);
});

test('firestore.rules secures /study_resources, /platform_categories, /platform_settings, and immutable /admin_audit_logs', () => {
  assert.match(rules, /function isValidStudyResource\(data\)/);
  assert.match(rules, /match \/study_resources\/\{resourceId\}/);
  assert.match(rules, /function isValidPlatformCategory\(data\)/);
  assert.match(rules, /match \/platform_categories\/\{categoryId\}/);
  assert.match(rules, /function isValidPlatformSettings\(data\)/);
  assert.match(rules, /match \/platform_settings\/\{settingId\}/);
  assert.match(rules, /settingId == 'global'/);
  assert.match(rules, /function isValidAdminAuditLog\(data\)/);
  assert.match(rules, /match \/admin_audit_logs\/\{logId\}/);
  assert.match(rules, /allow update: if false;\s*allow delete: if false;/);
});


