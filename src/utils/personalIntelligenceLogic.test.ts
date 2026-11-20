import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeLearningImpactMetrics,
  DEFAULT_PERSONAL_PREFS,
  generatePersonalRecommendations,
} from './personalIntelligenceLogic';
import { FREE_RESOURCES, VIDEO_LESSONS } from '../data/educationalContent';

test('returns empty recommendations when student disables personal intelligence', () => {
  const recs = generatePersonalRecommendations({
    lessons: VIDEO_LESSONS,
    resources: FREE_RESOURCES,
    watchedLessonIds: [],
    favouriteLessonIds: [],
    quizHistory: [],
    selectedPackageId: 'school',
    prefs: { ...DEFAULT_PERSONAL_PREFS, enabled: false },
  });
  assert.equal(recs.length, 0);
});

test('prioritises weak quiz topics and excludes already-watched lessons', () => {
  const firstLesson = VIDEO_LESSONS[0];
  const recs = generatePersonalRecommendations({
    lessons: VIDEO_LESSONS,
    resources: FREE_RESOURCES,
    watchedLessonIds: [firstLesson.id],
    favouriteLessonIds: [],
    quizHistory: [
      {
        id: 'q1',
        topic: 'Optics',
        score: 2,
        total: 5,
        percentage: 40,
        weakTopics: ['Ray Diagrams'],
        completedAt: '2026-11-18T10:00:00Z',
      },
    ],
    selectedPackageId: 'school',
    prefs: { ...DEFAULT_PERSONAL_PREFS, focusSubjects: ['Mathematics'] },
  });

  assert.ok(recs.some((r) => r.kind === 'revise-topic' && r.title.includes('Ray Diagrams')));
  assert.ok(!recs.some((r) => r.targetLessonId === firstLesson.id));
  assert.ok(recs.some((r) => r.kind === 'practice-quiz'));
});

test('computes real practice improvement delta and mastered topics accurately', () => {
  const metrics = computeLearningImpactMetrics({
    watchedLessonIds: ['l1', 'l2', 'l1'],
    quizHistory: [
      {
        id: 'q2',
        topic: 'Algebra',
        score: 9,
        total: 10,
        percentage: 90,
        completedAt: '2026-11-19T10:00:00Z',
      },
      {
        id: 'q1',
        topic: 'Algebra',
        score: 5,
        total: 10,
        percentage: 50,
        completedAt: '2026-11-15T10:00:00Z',
      },
    ],
  });

  assert.equal(metrics.lessonsCompleted, 2);
  assert.equal(metrics.quizzesCompleted, 2);
  assert.equal(metrics.practiceImprovementDelta, 40);
  assert.deepEqual(metrics.topicsMastered, ['Algebra']);
  assert.equal(metrics.weakTopicsToRevise.length, 0);
  assert.equal(metrics.revisionConsistencyDays, 2);
});
