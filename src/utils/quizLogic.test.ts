import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BUILT_IN_PRACTICE_SETS,
  QUIZ_DIFFICULTIES,
  QUIZ_QUESTION_TYPES,
  QUIZ_SCHOOL_CLASSES,
  buildRevisionActivities,
  deduplicateAndVerifyQuizQuestions,
  evaluateFullQuiz,
  evaluateSingleQuestion,
  formatDurationClock,
  formatQuizResultForShare,
  recommendLessonsForQuiz,
  shuffleMatchRightOptions,
  validateQuizCreationInput,
} from './quizLogic';
import { VIDEO_LESSONS } from '../data/educationalContent';
import type { QuizQuestion, QuizUserAnswer } from '../types/vidyora';

test('quiz configuration covers Class 1-12, all 7 question types, and 4 difficulty levels', () => {
  assert.equal(QUIZ_SCHOOL_CLASSES.length, 12);
  assert.equal(QUIZ_SCHOOL_CLASSES[0], 'Class 1');
  assert.equal(QUIZ_SCHOOL_CLASSES[11], 'Class 12');

  const typeIds = QUIZ_QUESTION_TYPES.map((t) => t.id);
  for (const expected of [
    'mcq',
    'true-false',
    'fill-blank',
    'short-answer',
    'numerical',
    'assertion-reason',
    'match-following',
  ]) {
    assert.ok(typeIds.includes(expected as (typeof typeIds)[number]), `Missing ${expected}`);
  }

  assert.deepEqual(
    QUIZ_DIFFICULTIES.map((d) => d.id),
    ['Easy', 'Medium', 'Hard', 'Mixed']
  );
});

test('validateQuizCreationInput rejects empty topic/chapter, bad count, or empty types', () => {
  assert.match(
    validateQuizCreationInput({
      topic: '',
      chapterName: '',
      subject: 'Physics',
      count: 5,
      questionTypes: ['mcq'],
    }) || '',
    /Topic ya Chapter/i
  );

  assert.match(
    validateQuizCreationInput({
      topic: 'Optics',
      subject: 'Physics',
      count: 20,
      questionTypes: ['mcq'],
    }) || '',
    /3 se 15/i
  );

  assert.match(
    validateQuizCreationInput({
      topic: 'Optics',
      subject: 'Physics',
      count: 5,
      questionTypes: [],
    }) || '',
    /question type/i
  );

  assert.equal(
    validateQuizCreationInput({
      topic: 'Optics',
      subject: 'Physics',
      count: 5,
      questionTypes: ['mcq', 'numerical'],
    }),
    null
  );
});

test('deduplicateAndVerifyQuizQuestions removes duplicate stems and normalizes answer keys', () => {
  const raw: QuizQuestion[] = [
    {
      id: 'q1',
      type: 'mcq',
      question: 'What is the SI unit of resistance?',
      options: ['Volt', 'Ohm', 'Ampere', 'Watt'],
      correctIndex: 1,
      explanation: 'Ohm is the SI unit.',
    },
    {
      id: 'q2',
      type: 'mcq',
      question: 'What is the SI unit of resistance? ',
      options: ['Volt', 'Ohm', 'Ampere', 'Watt'],
      correctIndex: 1,
      explanation: 'Duplicate stem.',
    },
    {
      id: 'q3',
      type: 'true-false',
      question: 'Light travels faster than sound.',
      options: [],
      correctIndex: 0,
      explanation: 'True.',
    },
    {
      id: 'q4',
      type: 'match-following',
      question: 'Invalid single pair',
      options: [],
      correctIndex: 0,
      matchPairs: [{ left: 'A', right: 'B' }],
      explanation: 'Too few pairs.',
    },
  ];

  const verified = deduplicateAndVerifyQuizQuestions(raw);
  assert.equal(verified.length, 2);
  assert.equal(verified[0].id, 'q1');
  assert.deepEqual(verified[1].options, ['True', 'False']);
});

test('evaluateFullQuiz grades all 7 question types accurately and detects weak topics', () => {
  const sevenTypeQuiz = BUILT_IN_PRACTICE_SETS[0].quiz;
  assert.equal(sevenTypeQuiz.questions.length, 7);

  const answers: Record<string, QuizUserAnswer> = {
    'bl-q1': { kind: 'choice', selectedIndex: 2 }, // MCQ correct (Ohm)
    'bl-q2': { kind: 'choice', selectedIndex: 0 }, // True/False correct (True)
    'bl-q3': { kind: 'text', value: 'Proportional' }, // Fill blank correct
    'bl-q4': { kind: 'text', value: '3 A' }, // Numerical correct with unit
    'bl-q5': {
      kind: 'text',
      value: 'Length ke directly proportional aur area ke inversely proportional hota hai.',
    }, // Short answer correct via keywords
    'bl-q6': { kind: 'choice', selectedIndex: 2 }, // Assertion-Reason INCORRECT (correct is 0)
    // bl-q7 Match the Following left UNANSWERED
  };

  const result = evaluateFullQuiz(sevenTypeQuiz.questions, answers, 145);
  assert.equal(result.total, 7);
  assert.equal(result.correct, 5);
  assert.equal(result.incorrect, 1);
  assert.equal(result.unanswered, 1);
  assert.equal(result.percentage, 71);
  assert.equal(result.timeTakenSeconds, 145);
  assert.equal(result.weakTopics.length, 2);
  assert.ok(result.weakTopics.some((w) => w.subtopic === 'Parallel Circuit Applications'));
  assert.ok(result.weakTopics.some((w) => w.subtopic === 'Electrical Formulas'));
});

test('evaluateSingleQuestion grades Match the Following and numerical tolerance accurately', () => {
  const matchQ = BUILT_IN_PRACTICE_SETS[0].quiz.questions[6];
  const rightOrder = shuffleMatchRightOptions(matchQ.id, matchQ.matchPairs!);
  assert.equal(rightOrder.length, 4);

  const correctMapping: Record<number, string> = {
    0: 'Q / t',
    1: 'W / Q',
    2: 'I × R',
    3: 'V × I',
  };
  assert.equal(
    evaluateSingleQuestion(matchQ, { kind: 'match', mapping: correctMapping }).status,
    'correct'
  );

  const wrongMapping: Record<number, string> = {
    0: 'V × I',
    1: 'W / Q',
    2: 'I × R',
    3: 'Q / t',
  };
  assert.equal(
    evaluateSingleQuestion(matchQ, { kind: 'match', mapping: wrongMapping }).status,
    'incorrect'
  );

  const numQ = BUILT_IN_PRACTICE_SETS[0].quiz.questions[3];
  assert.equal(evaluateSingleQuestion(numQ, { kind: 'text', value: '3.02' }).status, 'correct');
  assert.equal(evaluateSingleQuestion(numQ, { kind: 'text', value: '4.5' }).status, 'incorrect');
});

test('recommendLessonsForQuiz, buildRevisionActivities, and formatQuizResultForShare work end-to-end', () => {
  const quiz = BUILT_IN_PRACTICE_SETS[1].quiz;
  const evalRes = evaluateFullQuiz(
    quiz.questions,
    { 'qm-1': { kind: 'choice', selectedIndex: 0 } },
    95
  );
  const recs = recommendLessonsForQuiz(evalRes.weakTopics, 'Mathematics', quiz.topic, VIDEO_LESSONS);
  assert.ok(recs.length >= 1);
  assert.ok(recs.some((l) => l.subject === 'Mathematics'));

  const activities = buildRevisionActivities(evalRes.weakTopics, 'Mathematics', quiz.topic, evalRes.percentage);
  assert.equal(activities.length, 3);
  assert.equal(activities[0].actionType, 'retake-weak');

  const shareText = formatQuizResultForShare(quiz, evalRes);
  assert.ok(shareText.includes('VIDYORA AI Quiz Scorecard'));
  assert.ok(shareText.includes('Time Taken: 01:35'));
  assert.equal(formatDurationClock(95), '01:35');
});
