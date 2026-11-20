import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePlanProgress,
  calculateQuizScore,
  deriveSessionTitle,
  filterLessons,
  filterResources,
  formatNotesAsMarkdown,
  formatResourceAsText,
  parseInlineSegments,
  toggleWatchedLesson,
  upsertStudySession,
  validateNotesOrQuizTopic,
  validatePlannerInput,
  validateStudyBuddyInput,
} from './eduLogic';
import {
  buildChapterSummaries,
  mergeCatalogLessons,
  parseEmbeddableVideo,
  recordRecentLesson,
  toggleFavouriteLesson,
  validateAdminVideoInput,
} from './videoLogic';
import { FREE_RESOURCES, VIDEO_LESSONS } from '../data/educationalContent';
import {
  getChaptersForClassAndSubject,
  getClassesForCategory,
  getSubjectsForClass,
} from '../data/curriculumCatalog';
import { SlidingWindowRateLimiter } from '../../server/rateLimit';
import type { QuizQuestion, StudentProfile, StudyPlanBlock } from '../types/vidyora';

test('filterLessons filters by category, difficulty, and search query accurately', () => {
  const all = filterLessons(VIDEO_LESSONS, 'all');
  assert.equal(all.length, VIDEO_LESSONS.length);

  const school = filterLessons(VIDEO_LESSONS, 'school');
  assert.ok(school.length >= 10);
  assert.ok(school.every((l) => l.category === 'school'));

  const beginner = filterLessons(VIDEO_LESSONS, 'all', '', 'Beginner');
  assert.ok(beginner.length >= 3);
  assert.ok(beginner.every((l) => l.difficulty === 'Beginner'));

  const search = filterLessons(VIDEO_LESSONS, 'all', 'photosynthesis');
  assert.equal(search.length, 1);
  assert.equal(search[0].id, 'biology-photosynthesis');

  const classSearch = filterLessons(VIDEO_LESSONS, 'all', 'Class 12');
  assert.ok(classSearch.some((l) => l.subject === 'Biology'));
});

test('curriculum catalog provides Class 1 to Class 12, subjects, and sample chapters', () => {
  const schoolClasses = getClassesForCategory('school');
  assert.equal(schoolClasses.length, 12);
  assert.equal(schoolClasses[0].name, 'Class 1');
  assert.equal(schoolClasses[11].name, 'Class 12');

  const class10Subjects = getSubjectsForClass('Class 10');
  assert.ok(class10Subjects.some((s) => s.name === 'Mathematics'));
  assert.ok(class10Subjects.some((s) => s.name === 'Science'));

  const class10MathChapters = getChaptersForClassAndSubject('Class 10', 'Mathematics');
  assert.ok(class10MathChapters.length >= 2);
});

test('parseEmbeddableVideo validates YouTube and direct HTTPS video links securely', () => {
  const ytWatch = parseEmbeddableVideo('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  assert.equal(ytWatch.type, 'youtube');
  assert.equal(ytWatch.videoId, 'dQw4w9WgXcQ');
  assert.match(ytWatch.embedUrl || '', /^https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ/);

  const ytShort = parseEmbeddableVideo('https://youtu.be/dQw4w9WgXcQ?t=42');
  assert.equal(ytShort.type, 'youtube');
  assert.equal(ytShort.videoId, 'dQw4w9WgXcQ');

  const ytEmbed = parseEmbeddableVideo('https://www.youtube.com/embed/dQw4w9WgXcQ');
  assert.equal(ytEmbed.type, 'youtube');

  const directMp4 = parseEmbeddableVideo('https://cdn.example.edu/lessons/algebra.mp4');
  assert.equal(directMp4.type, 'direct-video');

  const unsafeJs = parseEmbeddableVideo('javascript:alert(1)');
  assert.equal(unsafeJs.type, 'invalid');

  const nonHttps = parseEmbeddableVideo('http://www.youtube.com/watch?v=dQw4w9WgXcQ');
  assert.equal(nonHttps.type, 'invalid');

  const badHost = parseEmbeddableVideo('https://example.com/not-a-video');
  assert.equal(badHost.type, 'invalid');
});

test('buildChapterSummaries computes lesson counts and completion states accurately', () => {
  const chapters = getChaptersForClassAndSubject('Class 10', 'Mathematics');
  const initial = buildChapterSummaries(chapters, VIDEO_LESSONS, []);
  const quadChapter = initial.find((c) => c.chapter.chapterNumber === 4);
  assert.ok(quadChapter);
  assert.ok(quadChapter.lessonCount >= 1);
  assert.equal(quadChapter.status, 'not-started');

  const completedIds = quadChapter.lessons.map((l) => l.id);
  const completed = buildChapterSummaries(chapters, VIDEO_LESSONS, completedIds);
  const quadCompleted = completed.find((c) => c.chapter.chapterNumber === 4);
  assert.equal(quadCompleted?.status, 'completed');
  assert.equal(quadCompleted?.completedCount, quadCompleted?.lessonCount);
});

test('recordRecentLesson, toggleFavouriteLesson, and mergeCatalogLessons work immutably', () => {
  const r1 = recordRecentLesson(['a', 'b', 'c'], 'b');
  assert.deepEqual(r1, ['b', 'a', 'c']);
  const r2 = recordRecentLesson(r1, 'd', 3);
  assert.deepEqual(r2, ['d', 'b', 'a']);

  const f1 = toggleFavouriteLesson([], 'lesson-1');
  assert.deepEqual(f1, ['lesson-1']);
  const f2 = toggleFavouriteLesson(f1, 'lesson-1');
  assert.deepEqual(f2, []);

  const demoCopy = VIDEO_LESSONS[0];
  const dbOverride = { ...demoCopy, title: 'Updated DB Lecture', source: 'firestore' as const };
  const merged = mergeCatalogLessons([demoCopy], [dbOverride]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].title, 'Updated DB Lecture');
});

test('validateAdminVideoInput enforces title, description, and safe video URL rules', () => {
  const validInput = {
    title: 'Class 10 Quadratic Formula Walkthrough',
    description: 'Step by step Hinglish explanation of discriminant and roots.',
    category: 'school' as const,
    className: 'Class 10',
    subject: 'Mathematics',
    chapterNumber: 4,
    chapterName: 'Quadratic Equations',
    duration: '12:00',
    difficulty: 'Intermediate' as const,
    videoUrl: 'https://youtu.be/dQw4w9WgXcQ',
    thumbnailUrl: 'https://example.edu/thumb.jpg',
    notesContent: 'D = b^2 - 4ac',
  };
  assert.equal(validateAdminVideoInput(validInput), null);
  assert.ok(validateAdminVideoInput({ ...validInput, title: 'Hi' }) !== null);
  assert.ok(validateAdminVideoInput({ ...validInput, videoUrl: 'http://insecure.com/a.mp4' }) !== null);
  assert.ok(validateAdminVideoInput({ ...validInput, chapterNumber: 0 }) !== null);
});

test('filterResources filters free notes by category and keyword', () => {
  const comp = filterResources(FREE_RESOURCES, 'competitive');
  assert.ok(comp.length >= 1);
  assert.ok(comp.every((r) => r.category === 'competitive'));

  const polity = filterResources(FREE_RESOURCES, 'all', 'Constitution');
  assert.equal(polity.length, 1);
  assert.equal(polity[0].id, 'res-indian-polity-articles');
});

test('calculateQuizScore computes exact score, percentage, and Hinglish feedback', () => {
  const questions: QuizQuestion[] = [
    { id: 'q1', question: 'Q1', options: ['A', 'B', 'C', 'D'], correctIndex: 1, explanation: 'Exp 1' },
    { id: 'q2', question: 'Q2', options: ['A', 'B', 'C', 'D'], correctIndex: 0, explanation: 'Exp 2' },
    { id: 'q3', question: 'Q3', options: ['A', 'B', 'C', 'D'], correctIndex: 2, explanation: 'Exp 3' },
    { id: 'q4', question: 'Q4', options: ['A', 'B', 'C', 'D'], correctIndex: 3, explanation: 'Exp 4' },
  ];

  const perfect = calculateQuizScore(questions, { q1: 1, q2: 0, q3: 2, q4: 3 });
  assert.equal(perfect.correct, 4);
  assert.equal(perfect.percentage, 100);
  assert.match(perfect.feedback, /Shabaash/);

  const partial = calculateQuizScore(questions, { q1: 1, q2: 2 });
  assert.equal(partial.correct, 1);
  assert.equal(partial.answered, 2);
  assert.equal(partial.percentage, 25);
});

test('calculatePlanProgress ignores unknown ids and calculates completion percentage', () => {
  const blocks: StudyPlanBlock[] = [
    { id: 'b1', timeSlot: '7-8 AM', duration: '1h', subject: 'Maths', activityType: 'Concept Video', task: 'T1', tip: 'Tip' },
    { id: 'b2', timeSlot: '8-9 AM', duration: '1h', subject: 'Physics', activityType: 'Active Practice', task: 'T2', tip: 'Tip' },
  ];
  const progress = calculatePlanProgress(blocks, ['b1', 'unknown-id']);
  assert.equal(progress.completed, 1);
  assert.equal(progress.total, 2);
  assert.equal(progress.percentage, 50);
});

test('input validators reject empty or out-of-range inputs and accept valid inputs', () => {
  assert.ok(validateStudyBuddyInput('   ') !== null);
  assert.equal(validateStudyBuddyInput('Gravity kya hai?'), null);

  assert.ok(validateNotesOrQuizTopic('a') !== null);
  assert.equal(validateNotesOrQuizTopic('Photosynthesis'), null);

  assert.ok(validatePlannerInput('hi', 3, 30) !== null);
  assert.ok(validatePlannerInput('Class 10 Boards', 15, 30) !== null);
  assert.ok(validatePlannerInput('Class 10 Boards', 4, 1) !== null);
  assert.equal(validatePlannerInput('Class 10 Boards', 4, 30), null);
});

test('formatNotesAsMarkdown and formatResourceAsText produce structured downloadable content', () => {
  const md = formatNotesAsMarkdown({
    title: 'Ohm Law',
    level: 'Class 10',
    overview: 'Current aur voltage ka relation.',
    sections: [{ heading: 'Formula', points: ['V = I * R'] }],
    definitions: [{ term: 'Resistance', definition: 'Current flow ka virodh.' }],
    examples: [{ title: 'Electric Heater', explanation: 'High resistance coil heat banati hai.' }],
    importantPoints: ['SI Unit of Resistance is Ohm.'],
    revisionSummary: 'V = IR constant temperature par valid hai.',
  });
  assert.match(md, /# Ohm Law/);
  assert.match(md, /Disclaimer:/);

  const text = formatResourceAsText(FREE_RESOURCES[0]);
  assert.match(text, /VIDYORA FREE STUDY RESOURCE/);
  assert.match(text, /KEY FORMULAS/);
});

test('parseInlineSegments parses bold, formula, and block LaTeX tokens cleanly', () => {
  const segments = parseInlineSegments('Force **Newton** ka $F = ma$ law hai');
  assert.equal(segments.some((s) => s.bold && s.text === 'Newton'), true);
  assert.equal(segments.some((s) => s.code && s.text === 'F = ma'), true);

  const latexSegments = parseInlineSegments('$$\\frac{1}{2} = \\frac{1 \\times 3}{2 \\times 3} \\implies 1 : 2 = 3 : 6$$');
  assert.equal(latexSegments.length, 1);
  assert.equal(latexSegments[0].code, true);
  assert.equal(latexSegments[0].text, '(1)/(2) = (1 × 3)/(2 × 3) ⇒ 1 : 2 = 3 : 6');
});

test('upsertStudySession manages chat history order and derives clean title', () => {
  const msg = [{ id: '1', role: 'user' as const, content: 'Gravity kya hota hai?', timestamp: '10:00' }];
  assert.equal(deriveSessionTitle(msg), 'Gravity kya hota hai?');

  const first = upsertStudySession([], 's1', 'Class 9-10', msg);
  assert.equal(first.length, 1);
  assert.equal(first[0].id, 's1');

  const second = upsertStudySession(first, 's2', 'Class 11-12', [
    { id: '2', role: 'user', content: 'Electrostatics basics', timestamp: '10:05' },
  ]);
  assert.equal(second.length, 2);
  assert.equal(second[0].id, 's2');
});

test('toggleWatchedLesson adds and removes lesson ids immutably', () => {
  const profile: StudentProfile = {
    displayName: 'Aarav',
    level: 'Class 11-12',
    watchedLessonIds: [],
    favouriteLessonIds: [],
    recentLessonIds: [],
    quizHistory: [],
    completedPlanBlockIds: [],
  };
  const added = toggleWatchedLesson(profile, 'physics-newtons-laws');
  assert.deepEqual(added.watchedLessonIds, ['physics-newtons-laws']);
  const removed = toggleWatchedLesson(added, 'physics-newtons-laws');
  assert.deepEqual(removed.watchedLessonIds, []);
});

test('SlidingWindowRateLimiter enforces burst window and daily usage limits', () => {
  const limiter = new SlidingWindowRateLimiter(3, 10, 5);
  const t0 = 1_000_000;

  assert.equal(limiter.consume('student-1', t0).allowed, true);
  assert.equal(limiter.consume('student-1', t0 + 1000).allowed, true);
  assert.equal(limiter.consume('student-1', t0 + 2000).remaining, 0);

  const burstBlocked = limiter.consume('student-1', t0 + 3000);
  assert.equal(burstBlocked.allowed, false);
  assert.equal(burstBlocked.limitReason, 'burst');

  // After 11 minutes, burst resets but daily count is 3 of 5
  const t1 = t0 + 11 * 60 * 1000;
  assert.equal(limiter.consume('student-1', t1).dailyRemaining, 1);
  assert.equal(limiter.consume('student-1', t1 + 1000).dailyRemaining, 0);

  // 6th request in same day hits daily limit even though burst had room
  const dailyBlocked = limiter.consume('student-1', t1 + 2000);
  assert.equal(dailyBlocked.allowed, false);
  assert.equal(dailyBlocked.limitReason, 'daily');

  // Separate user is unaffected
  assert.equal(limiter.consume('student-2', t1 + 2000).allowed, true);
});
