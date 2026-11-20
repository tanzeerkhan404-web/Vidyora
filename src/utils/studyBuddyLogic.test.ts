import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DOUBT_MAX_IMAGE_BYTES,
  DOUBT_SOLVER_SUBJECTS,
  STUDY_BUDDY_LEVELS,
  STUDY_BUDDY_MODES,
  STUDY_BUDDY_SUBJECTS,
  SUBJECT_SUGGESTED_QUESTIONS,
  deleteStudySessionById,
  formatDoubtSolutionForCopy,
  formatMathUnicode,
  mapProfileLevelToBuddyLevel,
  parseMessageBlocks,
  prepareTextForSpeech,
  sanitizeChatTextForStorage,
  validateDoubtImageFile,
} from './studyBuddyLogic';
import type { DoubtSolution, StudyBuddySession } from '../types/vidyora';

test('STUDY_BUDDY_LEVELS, MODES, SUBJECTS, and DOUBT_SOLVER_SUBJECTS cover all required options', () => {
  assert.deepEqual(STUDY_BUDDY_LEVELS, [
    'Beginner',
    'School level',
    'College level',
    'Competitive exam level',
  ]);

  assert.equal(STUDY_BUDDY_MODES.length, 5);
  assert.deepEqual(
    STUDY_BUDDY_MODES.map((m) => m.id),
    ['simple', 'step-by-step', 'real-life', 'short-summary', 'teacher']
  );

  assert.equal(STUDY_BUDDY_SUBJECTS.length, 9);
  for (const subj of STUDY_BUDDY_SUBJECTS) {
    assert.ok(
      SUBJECT_SUGGESTED_QUESTIONS[subj]?.length >= 4,
      `Expected >= 4 suggested questions for ${subj}`
    );
  }

  assert.equal(DOUBT_SOLVER_SUBJECTS.length, 9);
  assert.equal(DOUBT_SOLVER_SUBJECTS[0], 'Auto Detect');
});

test('mapProfileLevelToBuddyLevel maps all LearningLevels accurately', () => {
  assert.equal(mapProfileLevelToBuddyLevel('Class 1-5'), 'Beginner');
  assert.equal(mapProfileLevelToBuddyLevel('Class 6-8'), 'School level');
  assert.equal(mapProfileLevelToBuddyLevel('Class 9-10'), 'School level');
  assert.equal(mapProfileLevelToBuddyLevel('Class 11-12'), 'School level');
  assert.equal(mapProfileLevelToBuddyLevel('College'), 'College level');
  assert.equal(
    mapProfileLevelToBuddyLevel('Competitive Exams'),
    'Competitive exam level'
  );
});

test('formatMathUnicode converts LaTeX expressions, superscripts, and subscripts cleanly', () => {
  assert.equal(
    formatMathUnicode('\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}'),
    '(-b ± √(b² - 4ac))/(2a)'
  );
  assert.equal(formatMathUnicode('H_2O + CO_2 \\rightarrow H_2CO_3'), 'H₂O + CO₂ → H₂CO₃');
  assert.equal(formatMathUnicode('F = m \\times a, \\theta = 90\\circ'), 'F = m × a, θ = 90°');
});

test('parseMessageBlocks separates headings, equations, numbered steps, bullets, and paragraphs', () => {
  const sample = [
    '### Quadratic Formula',
    '$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$',
    '1. Identify a, b, c.',
    '- Keep signs carefully.',
    '',
    'Final explanation line.',
  ].join('\n');

  const blocks = parseMessageBlocks(sample);
  assert.equal(blocks[0].type, 'heading');
  assert.equal(blocks[0].text, 'Quadratic Formula');
  assert.equal(blocks[1].type, 'equation');
  assert.equal(blocks[1].text, 'x = (-b ± √(b² - 4ac))/(2a)');
  assert.equal(blocks[2].type, 'numbered');
  assert.equal(blocks[2].marker, '1');
  assert.equal(blocks[3].type, 'bullet');
  assert.equal(blocks[4].type, 'spacer');
  assert.equal(blocks[5].type, 'paragraph');
});

test('prepareTextForSpeech strips markdown and expands math operators cleanly', () => {
  const spoken = prepareTextForSpeech('**Step 1:** `F = m \\times a` ⇒ force badhega.');
  assert.ok(!spoken.includes('**'));
  assert.ok(!spoken.includes('`'));
  assert.ok(spoken.includes('multiplied by'));
  assert.ok(spoken.includes('implies'));
});

test('sanitizeChatTextForStorage redacts emails, phone numbers, and 12-digit IDs while preserving years & math', () => {
  const raw =
    'In 1947, my email was student@example.com, phone +91 9876543210, ID 1234 5678 9012, and 2x^2 = 8.';
  const cleaned = sanitizeChatTextForStorage(raw);
  assert.ok(cleaned.includes('[email-removed]'));
  assert.ok(cleaned.includes('[phone-removed]'));
  assert.ok(cleaned.includes('[id-removed]'));
  assert.ok(cleaned.includes('1947'));
  assert.ok(cleaned.includes('2x^2 = 8'));
});

test('validateDoubtImageFile enforces allowed formats, non-empty size, and 4 MB limit', () => {
  assert.equal(validateDoubtImageFile({ type: 'image/png', size: 1024 }), null);
  assert.equal(validateDoubtImageFile({ type: 'image/jpeg', size: 2_000_000 }), null);
  assert.equal(validateDoubtImageFile({ type: 'image/webp', size: 500_000 }), null);

  assert.match(
    validateDoubtImageFile({ type: 'application/pdf', size: 5000 }) || '',
    /Unsupported file format/i
  );
  assert.match(
    validateDoubtImageFile({ type: 'image/png', size: 0 }) || '',
    /empty/i
  );
  assert.match(
    validateDoubtImageFile({ type: 'image/jpeg', size: DOUBT_MAX_IMAGE_BYTES + 1 }) || '',
    /4 MB/i
  );
});

test('formatDoubtSolutionForCopy includes all structured educational sections', () => {
  const mockSolution: DoubtSolution = {
    readable: true,
    detectedSubject: 'Mathematics',
    subjectTopic: 'Quadratic Equations',
    extractedQuestion: 'Solve 2x^2 - 7x + 3 = 0',
    givenInformation: ['a = 2, b = -7, c = 3'],
    requiredAnswer: 'Find roots x1 and x2',
    relevantFormulas: ['ax^2 + bx + c = 0'],
    conceptUsed: 'Splitting the middle term',
    steps: [
      { stepNumber: 1, title: 'Factorize', explanation: '(2x - 1)(x - 3) = 0' },
    ],
    finalAnswer: 'x = 1/2 or x = 3',
    finalAnswerExplanation: 'Dono values equation ko zero karti hain.',
    importantLearningPoint: 'Always verify roots by substituting back.',
    practiceTip: 'Check sign of middle term.',
    similarPracticeQuestion: {
      question: 'Solve 3x^2 - 10x + 3 = 0',
      hint: 'Split -10x into -9x and -x',
      answer: 'x = 1/3 or x = 3',
    },
  };

  const copied = formatDoubtSolutionForCopy(mockSolution);
  assert.ok(copied.includes('Question Understood:'));
  assert.ok(copied.includes('Given Information:'));
  assert.ok(copied.includes('Required Answer:'));
  assert.ok(copied.includes('Relevant Formula / Concept:'));
  assert.ok(copied.includes('Step 1 — Factorize'));
  assert.ok(copied.includes('Final Answer: x = 1/2 or x = 3'));
  assert.ok(copied.includes('Important Learning Point:'));
  assert.ok(copied.includes('Similar Practice Question:'));
});

test('deleteStudySessionById removes only the matching conversation', () => {
  const list: StudyBuddySession[] = [
    { id: 'c1', title: 'First', level: 'Class 9-10', updatedAt: '10:00', messages: [] },
    { id: 'c2', title: 'Second', level: 'Class 9-10', updatedAt: '10:05', messages: [] },
  ];
  const next = deleteStudySessionById(list, 'c1');
  assert.equal(next.length, 1);
  assert.equal(next[0].id, 'c2');
});

test('formatMathUnicode unwraps markdown backticks, inline $ math, and \\rho cleanly', () => {
  const formatted = formatMathUnicode('Formula: `R = \\rho \\times (L / A)` and $V = I \\times R$.');
  assert.ok(!formatted.includes('`'));
  assert.ok(!formatted.includes('$'));
  assert.ok(formatted.includes('R = ρ × (L / A)'));
  assert.ok(formatted.includes('V = I × R'));
});

