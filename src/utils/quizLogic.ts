import type {
  GeneratedQuiz,
  LearningLevel,
  PracticeSetRecord,
  QuestionEvaluation,
  QuizAttemptRecord,
  QuizDifficulty,
  QuizEvaluationResult,
  QuizMatchPair,
  QuizQuestion,
  QuizQuestionType,
  QuizRevisionActivity,
  QuizTrack,
  QuizUserAnswer,
  VideoLesson,
  WeakTopicInsight,
} from '../types/vidyora';
import { sanitizeChatTextForStorage } from './studyBuddyLogic';

export const QUIZ_SCHOOL_CLASSES: string[] = Array.from(
  { length: 12 },
  (_, idx) => `Class ${idx + 1}`
);

export const QUIZ_COLLEGE_LEVELS: string[] = [
  'B.Tech / Engineering',
  'B.Sc / Pure Sciences',
  'B.Com / Commerce & Finance',
  'BA / Humanities',
  'BCA / Computer Applications',
  'MBA / Management',
];

export const QUIZ_COMPETITIVE_EXAMS: string[] = [
  'JEE Main & Advanced',
  'NEET UG (Medical)',
  'UPSC Civil Services',
  'SSC CGL / CHSL',
  'CUET UG',
  'GATE / Technical',
  'Banking (IBPS / SBI)',
  'Olympiads & NTSE',
];

export const QUIZ_SUBJECTS_BY_TRACK: Record<QuizTrack, string[]> = {
  school: [
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Science (General)',
    'English',
    'History',
    'Geography',
    'Civics & Political Science',
    'Economics',
    'Computer Science',
    'General Knowledge',
  ],
  college: [
    'Computer Science & DSA',
    'Engineering Mathematics',
    'Physics',
    'Chemistry',
    'Biotechnology & Biology',
    'Economics & Accounting',
    'Business Management',
    'English & Communication',
    'History & Political Theory',
  ],
  competitive: [
    'Physics',
    'Chemistry',
    'Biology',
    'Mathematics & Quantitative Aptitude',
    'Logical Reasoning',
    'Indian Polity & Governance',
    'History & Culture',
    'Geography & Environment',
    'Economy & Current Affairs',
    'English Comprehension',
    'Computer Awareness',
    'General Knowledge',
  ],
};

export const QUIZ_QUESTION_TYPES: Array<{
  id: QuizQuestionType;
  label: string;
  shortLabel: string;
  description: string;
}> = [
  {
    id: 'mcq',
    label: 'Multiple Choice (MCQ)',
    shortLabel: 'MCQ',
    description: '4 clear options with 1 verified correct answer',
  },
  {
    id: 'true-false',
    label: 'True or False',
    shortLabel: 'True / False',
    description: 'Fast conceptual accuracy statements',
  },
  {
    id: 'fill-blank',
    label: 'Fill in the Blanks',
    shortLabel: 'Fill Blank',
    description: 'Recall exact terms, laws, or missing values',
  },
  {
    id: 'short-answer',
    label: 'Short Answer',
    shortLabel: 'Short Answer',
    description: '1–2 line conceptual answer checked by key terms',
  },
  {
    id: 'numerical',
    label: 'Numerical',
    shortLabel: 'Numerical',
    description: 'Formula-based calculation with tolerance check',
  },
  {
    id: 'assertion-reason',
    label: 'Assertion & Reasoning',
    shortLabel: 'Assertion-Reason',
    description: 'Board / JEE / NEET style logic evaluation',
  },
  {
    id: 'match-following',
    label: 'Match the Following',
    shortLabel: 'Match Pairs',
    description: 'Connect concepts, formulas, or pairs accurately',
  },
];

export const QUIZ_DIFFICULTIES: Array<{
  id: QuizDifficulty;
  label: string;
  description: string;
}> = [
  { id: 'Easy', label: 'Easy', description: 'Foundations & recall' },
  { id: 'Medium', label: 'Medium', description: 'Board & conceptual' },
  { id: 'Hard', label: 'Hard', description: 'Application & tricky' },
  { id: 'Mixed', label: 'Mixed', description: 'Balanced exam blend' },
];

export const QUIZ_QUESTION_COUNTS: number[] = [3, 5, 8, 10, 15];

export const QUIZ_TIMER_OPTIONS: Array<{ minutes: number; label: string }> = [
  { minutes: 0, label: 'No Timer (Untimed)' },
  { minutes: 5, label: '5 Minutes' },
  { minutes: 10, label: '10 Minutes' },
  { minutes: 15, label: '15 Minutes' },
  { minutes: 20, label: '20 Minutes' },
  { minutes: 30, label: '30 Minutes' },
];

export const ASSERTION_REASON_STANDARD_OPTIONS: string[] = [
  'Both Assertion (A) and Reason (R) are true, and R is the correct explanation of A.',
  'Both Assertion (A) and Reason (R) are true, but R is NOT the correct explanation of A.',
  'Assertion (A) is true, but Reason (R) is false.',
  'Assertion (A) is false, but Reason (R) is true.',
];

export function mapLearningLevelToQuizDefaults(level: LearningLevel): {
  track: QuizTrack;
  levelLabel: string;
} {
  switch (level) {
    case 'Class 1-5':
      return { track: 'school', levelLabel: 'Class 5' };
    case 'Class 6-8':
      return { track: 'school', levelLabel: 'Class 8' };
    case 'Class 9-10':
      return { track: 'school', levelLabel: 'Class 10' };
    case 'Class 11-12':
      return { track: 'school', levelLabel: 'Class 12' };
    case 'College':
      return { track: 'college', levelLabel: 'B.Tech / Engineering' };
    case 'Competitive Exams':
      return { track: 'competitive', levelLabel: 'JEE Main & Advanced' };
    default:
      return { track: 'school', levelLabel: 'Class 10' };
  }
}

export function validateQuizCreationInput(input: {
  topic: string;
  chapterName?: string;
  subject: string;
  count: number;
  questionTypes: QuizQuestionType[];
}): string | null {
  const topicClean = input.topic.trim();
  const chapterClean = (input.chapterName || '').trim();
  if (topicClean.length < 2 && chapterClean.length < 2) {
    return 'Quiz generate karne ke liye kam se kam ek Topic ya Chapter name likhein (min 2 characters).';
  }
  if (!input.subject.trim()) {
    return 'Kripya subject select karein.';
  }
  if (!Number.isFinite(input.count) || input.count < 3 || input.count > 15) {
    return 'Number of questions 3 se 15 ke beech hone chahiye.';
  }
  if (!Array.isArray(input.questionTypes) || input.questionTypes.length === 0) {
    return 'Kam se kam ek question type select karein.';
  }
  return null;
}

export function getQuestionTypeLabel(type?: QuizQuestionType): string {
  const found = QUIZ_QUESTION_TYPES.find((t) => t.id === (type || 'mcq'));
  return found ? found.shortLabel : 'MCQ';
}

export function formatDurationClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[`*_~]/g, '')
    .replace(/[^a-z0-9.\-+\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseNumericToken(value: string): number | null {
  const cleaned = value.replace(/,/g, '').trim();
  const match = cleaned.match(/[-+]?\d*\.?\d+(?:e[-+]?\d+)?/i);
  if (!match) return null;
  const num = Number(match[0]);
  return Number.isFinite(num) ? num : null;
}

/**
 * Deterministic shuffle of right-column match options so students don't see a trivial 1-to-1 order.
 */
export function shuffleMatchRightOptions(
  questionId: string,
  pairs: QuizMatchPair[]
): string[] {
  const items = pairs.map((p) => p.right);
  if (items.length <= 1) return items;

  let seed = 0;
  for (let i = 0; i < questionId.length; i++) {
    seed = (seed * 31 + questionId.charCodeAt(i)) % 100000;
  }

  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    const j = seed % (i + 1);
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }

  // Ensure it's not identical to canonical order when >= 2 distinct items exist
  const sameOrder = copy.every((val, idx) => val === items[idx]);
  if (sameOrder && copy.length >= 2) {
    const first = copy.shift()!;
    copy.push(first);
  }
  return copy;
}

/**
 * Deduplicates questions by normalized stem and verifies answer keys for every question type.
 */
export function deduplicateAndVerifyQuizQuestions(
  rawQuestions: QuizQuestion[]
): QuizQuestion[] {
  const seen = new Set<string>();
  const verified: QuizQuestion[] = [];

  for (let i = 0; i < rawQuestions.length; i++) {
    const q = rawQuestions[i];
    if (!q || typeof q.question !== 'string' || q.question.trim().length < 4) continue;

    const dedupeKey = normalizeText(`${q.question} ${q.assertion || ''} ${q.reason || ''}`);
    if (!dedupeKey || seen.has(dedupeKey)) continue;

    const qType: QuizQuestionType = q.type || 'mcq';
    const explanation =
      typeof q.explanation === 'string' && q.explanation.trim().length > 0
        ? q.explanation.trim()
        : 'Is concept ko apni textbook aur formula ke saath revise karein.';

    if (qType === 'true-false') {
      const idx = q.correctIndex === 1 ? 1 : 0;
      verified.push({
        ...q,
        id: q.id || `q-${verified.length + 1}`,
        type: 'true-false',
        options: ['True', 'False'],
        correctIndex: idx,
        correctAnswerText: idx === 0 ? 'True' : 'False',
        explanation,
      });
      seen.add(dedupeKey);
      continue;
    }

    if (qType === 'assertion-reason') {
      const opts =
        Array.isArray(q.options) && q.options.length === 4
          ? q.options.map((o) => String(o).trim())
          : [...ASSERTION_REASON_STANDARD_OPTIONS];
      const safeIdx =
        Number.isInteger(q.correctIndex) && q.correctIndex >= 0 && q.correctIndex < 4
          ? q.correctIndex
          : 0;
      verified.push({
        ...q,
        id: q.id || `q-${verified.length + 1}`,
        type: 'assertion-reason',
        options: opts,
        correctIndex: safeIdx,
        correctAnswerText: opts[safeIdx],
        explanation,
      });
      seen.add(dedupeKey);
      continue;
    }

    if (qType === 'match-following') {
      const pairs = Array.isArray(q.matchPairs)
        ? q.matchPairs
            .filter(
              (p) =>
                p &&
                typeof p.left === 'string' &&
                p.left.trim().length > 0 &&
                typeof p.right === 'string' &&
                p.right.trim().length > 0
            )
            .slice(0, 5)
            .map((p) => ({ left: p.left.trim(), right: p.right.trim() }))
        : [];
      if (pairs.length < 2) continue;
      verified.push({
        ...q,
        id: q.id || `q-${verified.length + 1}`,
        type: 'match-following',
        options: [],
        correctIndex: 0,
        matchPairs: pairs,
        correctAnswerText: pairs.map((p) => `${p.left} → ${p.right}`).join('; '),
        explanation,
      });
      seen.add(dedupeKey);
      continue;
    }

    if (qType === 'fill-blank' || qType === 'short-answer' || qType === 'numerical') {
      const answerText = String(q.correctAnswerText || q.acceptedAnswers?.[0] || '').trim();
      if (!answerText) continue;
      const accepted = Array.isArray(q.acceptedAnswers)
        ? q.acceptedAnswers.map((a) => String(a).trim()).filter(Boolean)
        : [answerText];
      if (!accepted.includes(answerText)) {
        accepted.unshift(answerText);
      }
      verified.push({
        ...q,
        id: q.id || `q-${verified.length + 1}`,
        type: qType,
        options: [],
        correctIndex: 0,
        correctAnswerText: answerText,
        acceptedAnswers: accepted,
        unit: q.unit ? String(q.unit).trim() : undefined,
        tolerance:
          qType === 'numerical'
            ? typeof q.tolerance === 'number' && q.tolerance >= 0
              ? q.tolerance
              : 0.05
            : undefined,
        explanation,
      });
      seen.add(dedupeKey);
      continue;
    }

    // Default: MCQ
    const rawOpts = Array.isArray(q.options)
      ? q.options.map((o) => String(o).trim()).filter(Boolean)
      : [];
    if (rawOpts.length < 2) continue;
    const safeIdx =
      Number.isInteger(q.correctIndex) && q.correctIndex >= 0 && q.correctIndex < rawOpts.length
        ? q.correctIndex
        : 0;
    verified.push({
      ...q,
      id: q.id || `q-${verified.length + 1}`,
      type: 'mcq',
      options: rawOpts.slice(0, 4),
      correctIndex: Math.min(safeIdx, Math.min(rawOpts.length, 4) - 1),
      correctAnswerText: rawOpts[Math.min(safeIdx, Math.min(rawOpts.length, 4) - 1)],
      explanation,
    });
    seen.add(dedupeKey);
  }

  return verified;
}

export function isQuestionAnswered(
  question: QuizQuestion,
  answer: QuizUserAnswer | undefined
): boolean {
  if (!answer) return false;
  const qType: QuizQuestionType = question.type || 'mcq';

  if (qType === 'mcq' || qType === 'true-false' || qType === 'assertion-reason') {
    return answer.kind === 'choice' && Number.isInteger(answer.selectedIndex) && answer.selectedIndex >= 0;
  }

  if (qType === 'fill-blank' || qType === 'short-answer' || qType === 'numerical') {
    return answer.kind === 'text' && answer.value.trim().length > 0;
  }

  if (qType === 'match-following') {
    const pairCount = question.matchPairs?.length ?? 0;
    if (answer.kind !== 'match' || pairCount === 0) return false;
    return Object.values(answer.mapping).filter((v) => v && v.trim().length > 0).length > 0;
  }

  return false;
}

export function evaluateSingleQuestion(
  question: QuizQuestion,
  answer: QuizUserAnswer | undefined
): QuestionEvaluation {
  const qType: QuizQuestionType = question.type || 'mcq';
  const subtopic = question.subtopic?.trim() || 'Core Concept';

  if (qType === 'mcq' || qType === 'true-false' || qType === 'assertion-reason') {
    const correctDisplay =
      question.options[question.correctIndex] || question.correctAnswerText || 'Option A';
    if (!answer || answer.kind !== 'choice' || answer.selectedIndex < 0) {
      return {
        questionId: question.id,
        type: qType,
        subtopic,
        status: 'unanswered',
        userAnswerDisplay: 'Not answered',
        correctAnswerDisplay: correctDisplay,
        explanation: question.explanation,
      };
    }
    const chosenText = question.options[answer.selectedIndex] ?? `Option ${answer.selectedIndex + 1}`;
    const isCorrect = answer.selectedIndex === question.correctIndex;
    return {
      questionId: question.id,
      type: qType,
      subtopic,
      status: isCorrect ? 'correct' : 'incorrect',
      userAnswerDisplay: chosenText,
      correctAnswerDisplay: correctDisplay,
      explanation: question.explanation,
    };
  }

  if (qType === 'numerical') {
    const correctRaw = question.correctAnswerText || question.acceptedAnswers?.[0] || '';
    const unitSuffix = question.unit ? ` ${question.unit}` : '';
    const correctDisplay =
      unitSuffix && !correctRaw.toLowerCase().includes(question.unit!.toLowerCase())
        ? `${correctRaw}${unitSuffix}`
        : correctRaw;

    if (!answer || answer.kind !== 'text' || !answer.value.trim()) {
      return {
        questionId: question.id,
        type: qType,
        subtopic,
        status: 'unanswered',
        userAnswerDisplay: 'Not answered',
        correctAnswerDisplay: correctDisplay,
        explanation: question.explanation,
      };
    }

    const userNum = parseNumericToken(answer.value);
    const expectedNum = parseNumericToken(correctRaw);
    const tol = typeof question.tolerance === 'number' ? question.tolerance : 0.05;

    let isCorrect = false;
    if (userNum !== null && expectedNum !== null) {
      const allowedDiff = Math.max(tol, Math.abs(expectedNum) * 0.01);
      isCorrect = Math.abs(userNum - expectedNum) <= allowedDiff;
    } else {
      const userNorm = normalizeText(answer.value);
      const candidates = [correctRaw, ...(question.acceptedAnswers || [])].map(normalizeText);
      isCorrect = candidates.includes(userNorm);
    }

    return {
      questionId: question.id,
      type: qType,
      subtopic,
      status: isCorrect ? 'correct' : 'incorrect',
      userAnswerDisplay: answer.value.trim(),
      correctAnswerDisplay: correctDisplay,
      explanation: question.explanation,
    };
  }

  if (qType === 'fill-blank') {
    const correctRaw = question.correctAnswerText || question.acceptedAnswers?.[0] || '';
    if (!answer || answer.kind !== 'text' || !answer.value.trim()) {
      return {
        questionId: question.id,
        type: qType,
        subtopic,
        status: 'unanswered',
        userAnswerDisplay: 'Not answered',
        correctAnswerDisplay: correctRaw,
        explanation: question.explanation,
      };
    }
    const userNorm = normalizeText(answer.value);
    const candidates = [correctRaw, ...(question.acceptedAnswers || [])]
      .map(normalizeText)
      .filter(Boolean);
    const isCorrect = candidates.some(
      (cand) => cand === userNorm || (cand.length >= 4 && userNorm.includes(cand))
    );

    return {
      questionId: question.id,
      type: qType,
      subtopic,
      status: isCorrect ? 'correct' : 'incorrect',
      userAnswerDisplay: answer.value.trim(),
      correctAnswerDisplay: correctRaw,
      explanation: question.explanation,
    };
  }

  if (qType === 'short-answer') {
    const correctRaw = question.correctAnswerText || question.acceptedAnswers?.[0] || '';
    if (!answer || answer.kind !== 'text' || !answer.value.trim()) {
      return {
        questionId: question.id,
        type: qType,
        subtopic,
        status: 'unanswered',
        userAnswerDisplay: 'Not answered',
        correctAnswerDisplay: correctRaw,
        explanation: question.explanation,
      };
    }
    const userNorm = normalizeText(answer.value);
    const acceptedList = (question.acceptedAnswers || [])
      .map(normalizeText)
      .filter((k) => k.length >= 2);

    // Check exact/substring match with any accepted phrase OR >= 50% keyword coverage
    let isCorrect = false;
    const correctNorm = normalizeText(correctRaw);
    if (userNorm === correctNorm || (correctNorm.length >= 4 && userNorm.includes(correctNorm))) {
      isCorrect = true;
    } else if (acceptedList.length > 0) {
      const matchedCount = acceptedList.filter((kw) => userNorm.includes(kw)).length;
      const needed = acceptedList.length === 1 ? 1 : Math.ceil(acceptedList.length * 0.5);
      isCorrect = matchedCount >= needed;
    }

    return {
      questionId: question.id,
      type: qType,
      subtopic,
      status: isCorrect ? 'correct' : 'incorrect',
      userAnswerDisplay: answer.value.trim(),
      correctAnswerDisplay: correctRaw,
      explanation: question.explanation,
    };
  }

  // Match the Following
  const pairs = question.matchPairs || [];
  const correctDisplay = pairs.map((p) => `${p.left} → ${p.right}`).join(' | ');
  if (!answer || answer.kind !== 'match' || pairs.length === 0) {
    return {
      questionId: question.id,
      type: 'match-following',
      subtopic,
      status: 'unanswered',
      userAnswerDisplay: 'Not answered',
      correctAnswerDisplay: correctDisplay,
      explanation: question.explanation,
    };
  }

  const chosenEntries = pairs.map((p, idx) => ({
    left: p.left,
    expected: p.right,
    chosen: (answer.mapping[idx] || '').trim(),
  }));

  const anySelected = chosenEntries.some((e) => e.chosen.length > 0);
  if (!anySelected) {
    return {
      questionId: question.id,
      type: 'match-following',
      subtopic,
      status: 'unanswered',
      userAnswerDisplay: 'Not answered',
      correctAnswerDisplay: correctDisplay,
      explanation: question.explanation,
    };
  }

  const allMatched = chosenEntries.every(
    (e) => normalizeText(e.chosen) === normalizeText(e.expected)
  );
  const userDisplay = chosenEntries
    .map((e) => `${e.left} → ${e.chosen || '—'}`)
    .join(' | ');

  return {
    questionId: question.id,
    type: 'match-following',
    subtopic,
    status: allMatched ? 'correct' : 'incorrect',
    userAnswerDisplay: userDisplay,
    correctAnswerDisplay: correctDisplay,
    explanation: question.explanation,
  };
}

export function evaluateFullQuiz(
  questions: QuizQuestion[],
  answers: Record<string, QuizUserAnswer>,
  timeTakenSeconds: number
): QuizEvaluationResult {
  const questionResults = questions.map((q) => evaluateSingleQuestion(q, answers[q.id]));
  const total = questions.length;
  const correct = questionResults.filter((r) => r.status === 'correct').length;
  const incorrect = questionResults.filter((r) => r.status === 'incorrect').length;
  const unanswered = questionResults.filter((r) => r.status === 'unanswered').length;
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

  let feedback = 'Acchi shuruaat! Weak topics par thoda focus karo aur dobara try karo.';
  if (percentage >= 85) {
    feedback = 'Shandaar performance! Aapke concepts bilkul strong aur exam-ready hain.';
  } else if (percentage >= 65) {
    feedback = 'Bahut accha! Bas 1–2 weak subtopics revise karne par full score aa jayega.';
  } else if (percentage >= 40) {
    feedback = 'Good attempt! Incorrect questions ke explanations padho aur weak topics practice karo.';
  }

  // Group accuracy by subtopic to detect weak topics
  const subtopicStats = new Map<string, { total: number; missed: number }>();
  for (const res of questionResults) {
    const key = res.subtopic || 'Core Concept';
    const curr = subtopicStats.get(key) || { total: 0, missed: 0 };
    curr.total += 1;
    if (res.status !== 'correct') {
      curr.missed += 1;
    }
    subtopicStats.set(key, curr);
  }

  const weakTopics: WeakTopicInsight[] = Array.from(subtopicStats.entries())
    .filter(([, stat]) => stat.missed > 0)
    .map(([subtopic, stat]) => ({
      subtopic,
      missedCount: stat.missed,
      totalCount: stat.total,
      accuracyPercent: Math.round(((stat.total - stat.missed) / stat.total) * 100),
    }))
    .sort((a, b) => b.missedCount - a.missedCount || a.accuracyPercent - b.accuracyPercent);

  return {
    total,
    correct,
    incorrect,
    unanswered,
    score: correct,
    percentage,
    timeTakenSeconds: Math.max(0, Math.round(timeTakenSeconds)),
    feedback,
    questionResults,
    weakTopics,
  };
}

/**
 * Recommends the most relevant published VIDYORA VideoLessons based on weak topics, subject & quiz topic.
 */
export function recommendLessonsForQuiz(
  weakTopics: WeakTopicInsight[],
  subject: string | undefined,
  topic: string,
  allLessons: VideoLesson[],
  limit = 3
): VideoLesson[] {
  const published = allLessons.filter((l) => l.published);
  if (published.length === 0) return [];

  const tokens = [
    subject || '',
    topic,
    ...weakTopics.map((w) => w.subtopic),
  ]
    .join(' ')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3);

  const uniqueTokens = Array.from(new Set(tokens));
  const subjectLower = (subject || '').toLowerCase();

  const scored = published.map((lesson) => {
    const haystack = `${lesson.title} ${lesson.subject} ${lesson.chapterName} ${lesson.summary} ${lesson.keyTakeaways.join(' ')}`.toLowerCase();
    let score = 0;
    if (subjectLower && lesson.subject.toLowerCase().includes(subjectLower.split(' ')[0])) {
      score += 5;
    }
    for (const token of uniqueTokens) {
      if (haystack.includes(token)) {
        score += 3;
      }
    }
    return { lesson, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const topMatched = scored.filter((s) => s.score > 0).slice(0, limit).map((s) => s.lesson);
  if (topMatched.length > 0) return topMatched;
  return published.slice(0, limit);
}

/**
 * Builds actionable Hinglish revision activities tailored to quiz performance & weak topics.
 */
export function buildRevisionActivities(
  weakTopics: WeakTopicInsight[],
  subject: string | undefined,
  topic: string,
  percentage: number
): QuizRevisionActivity[] {
  const primaryWeak = weakTopics[0]?.subtopic || topic;
  const activities: QuizRevisionActivity[] = [];

  if (weakTopics.length > 0) {
    activities.push({
      id: 'act-retake-weak',
      title: `Practice Weak Questions (${weakTopics.length} topic${weakTopics.length > 1 ? 's' : ''})`,
      description: `Jo questions galat ya skip huye (especially "${primaryWeak}"), unka focused mini practice set abhi solve karo.`,
      actionType: 'retake-weak',
      targetTopic: primaryWeak,
    });
  }

  activities.push({
    id: 'act-notes',
    title: `Quick Revision Notes banao: ${primaryWeak}`,
    description: `${subject ? `${subject} ke ` : ''}"${primaryWeak}" par Formula Sheet ya Quick Revision Notes generate karke 5 minute mein revise karo.`,
    actionType: 'notes',
    targetTopic: primaryWeak,
  });

  activities.push({
    id: 'act-buddy',
    title: `AI Study Buddy se Step-by-Step samjho`,
    description:
      percentage >= 80
        ? `"${topic}" ke higher-order application doubts aur tricky exam questions AI Study Buddy ke saath discuss karo.`
        : `"${primaryWeak}" ko simple Hinglish aur real-life example ke saath AI Study Buddy se clear karo.`,
    actionType: 'study-buddy',
    targetTopic: `Please explain "${primaryWeak}" (${topic}) in simple Hinglish with step-by-step examples and common exam mistakes to avoid.`,
  });

  return activities;
}

export function formatQuizResultForShare(
  quiz: GeneratedQuiz,
  evaluation: QuizEvaluationResult
): string {
  const title = quiz.title || `${quiz.topic} Practice Quiz`;
  const weakSummary =
    evaluation.weakTopics.length > 0
      ? `Focus Topics: ${evaluation.weakTopics.map((w) => w.subtopic).join(', ')}`
      : 'All topics mastered with 100% accuracy!';

  return [
    `VIDYORA AI Quiz Scorecard`,
    `Quiz: ${title}`,
    `Level: ${quiz.level}${quiz.subject ? ` · ${quiz.subject}` : ''}`,
    `Score: ${evaluation.correct}/${evaluation.total} (${evaluation.percentage}%)`,
    `Correct: ${evaluation.correct} | Incorrect: ${evaluation.incorrect} | Unanswered: ${evaluation.unanswered}`,
    `Time Taken: ${formatDurationClock(evaluation.timeTakenSeconds)}`,
    weakSummary,
    `Learning Beyond Textbooks — VIDYORA`,
  ].join('\n');
}

export function sanitizeQuizForStorage(quiz: GeneratedQuiz): GeneratedQuiz {
  return {
    ...quiz,
    title: quiz.title ? sanitizeChatTextForStorage(quiz.title).slice(0, 160) : undefined,
    topic: sanitizeChatTextForStorage(quiz.topic).slice(0, 160),
    chapterName: quiz.chapterName
      ? sanitizeChatTextForStorage(quiz.chapterName).slice(0, 140)
      : undefined,
    questions: quiz.questions.slice(0, 20).map((q) => ({
      ...q,
      question: sanitizeChatTextForStorage(q.question).slice(0, 600),
      assertion: q.assertion ? sanitizeChatTextForStorage(q.assertion).slice(0, 400) : undefined,
      reason: q.reason ? sanitizeChatTextForStorage(q.reason).slice(0, 400) : undefined,
      explanation: sanitizeChatTextForStorage(q.explanation).slice(0, 700),
    })),
  };
}

export function upsertQuizAttempt(
  list: QuizAttemptRecord[],
  record: QuizAttemptRecord
): QuizAttemptRecord[] {
  const filtered = list.filter((item) => item.id !== record.id);
  return [record, ...filtered].slice(0, 25);
}

export function upsertPracticeSet(
  list: PracticeSetRecord[],
  record: PracticeSetRecord
): PracticeSetRecord[] {
  const filtered = list.filter((item) => item.id !== record.id);
  return [record, ...filtered].slice(0, 20);
}

/**
 * Built-in curated starter Practice Sets (clearly labeled) covering all 7 question types
 * so students can practice immediately and test every interactive question format.
 */
export const BUILT_IN_PRACTICE_SETS: PracticeSetRecord[] = [
  {
    id: 'builtin-ohms-law-7types',
    title: 'Class 10 Physics: Electricity & Ohm’s Law (All 7 Question Types)',
    subject: 'Physics',
    level: 'Class 10',
    difficulty: 'Mixed',
    createdAt: 'Curated Practice Set',
    isBuiltIn: true,
    quiz: {
      id: 'builtin-ohms-law-7types',
      title: 'Electricity & Ohm’s Law — Complete 7-Type Practice Set',
      topic: 'Ohm’s Law & Electric Circuits',
      chapterName: 'Chapter 12: Electricity',
      subject: 'Physics',
      track: 'school',
      level: 'Class 10',
      difficulty: 'Mixed',
      questionTypes: [
        'mcq',
        'true-false',
        'fill-blank',
        'short-answer',
        'numerical',
        'assertion-reason',
        'match-following',
      ],
      timerMinutes: 10,
      source: 'practice-set',
      questions: [
        {
          id: 'bl-q1',
          type: 'mcq',
          difficulty: 'Easy',
          subtopic: 'SI Units & Electrical Quantities',
          question: 'Electric resistance ki SI unit kya hoti hai?',
          options: ['Ampere (A)', 'Volt (V)', 'Ohm (Ω)', 'Watt (W)'],
          correctIndex: 2,
          correctAnswerText: 'Ohm (Ω)',
          explanation:
            'Resistance R = V / I ki SI unit Ohm (Ω) hoti hai. Ampere current ki, Volt potential difference ki aur Watt electric power ki unit hai.',
        },
        {
          id: 'bl-q2',
          type: 'true-false',
          difficulty: 'Easy',
          subtopic: 'Series & Parallel Circuits',
          question:
            'Series combination mein jude sabhi resistors se same electric current flow hota hai.',
          options: ['True', 'False'],
          correctIndex: 0,
          correctAnswerText: 'True',
          explanation:
            'True! Series circuit mein current ke liye sirf ek hi path hota hai, isliye har resistor mein same current (I) flow karta hai, jabki voltage divide hota hai.',
        },
        {
          id: 'bl-q3',
          type: 'fill-blank',
          difficulty: 'Medium',
          subtopic: 'Ohm’s Law Fundamentals',
          question:
            'Constant temperature par metallic conductor ke across potential difference (V) usme flow hone wale electric current (I) ke directly ______ hota hai.',
          options: [],
          correctIndex: 0,
          correctAnswerText: 'proportional',
          acceptedAnswers: ['proportional', 'directly proportional'],
          explanation:
            'Ohm’s Law ke mutabik V ∝ I (at constant temperature), jisse formula V = I × R milta hai.',
        },
        {
          id: 'bl-q4',
          type: 'numerical',
          difficulty: 'Medium',
          subtopic: 'Ohm’s Law Numericals',
          question:
            'Agar ek 5 Ω resistor ke across 15 V ki battery connect ki jaye, toh circuit mein kitna current (in Ampere) flow hoga?',
          options: [],
          correctIndex: 0,
          correctAnswerText: '3',
          acceptedAnswers: ['3', '3 A', '3.0'],
          unit: 'A',
          tolerance: 0.05,
          explanation:
            'Ohm’s Law se I = V / R = 15 V / 5 Ω = 3 A. Hamesha units check karein: Volt / Ohm = Ampere.',
        },
        {
          id: 'bl-q5',
          type: 'short-answer',
          difficulty: 'Medium',
          subtopic: 'Resistivity & Factors Affecting Resistance',
          question:
            'Conductor ka resistance uski length (L) aur cross-sectional area (A) par kaise depend karta hai? (1 line mein batayein)',
          options: [],
          correctIndex: 0,
          correctAnswerText:
            'Resistance length ke directly proportional aur area ke inversely proportional hota hai (R = ρL/A).',
          acceptedAnswers: ['length', 'area', 'proportional', 'inversely'],
          explanation:
            'Formula R = ρ × (L / A) ke according: length badhane par resistance badhta hai (directly proportional) aur thickness/area badhane par resistance kam hota hai (inversely proportional).',
        },
        {
          id: 'bl-q6',
          type: 'assertion-reason',
          difficulty: 'Hard',
          subtopic: 'Parallel Circuit Applications',
          question: 'Niche diye gaye Assertion (A) aur Reason (R) ko dhyan se padhkar sahi option chunein:',
          assertion:
            'Ghar ke electrical appliances (bulb, fan, TV) ko parallel circuit mein connect kiya jata hai.',
          reason:
            'Parallel connection mein har appliance ko same voltage milta hai aur ek kharab hone par baaki band nahi hote.',
          options: [...ASSERTION_REASON_STANDARD_OPTIONS],
          correctIndex: 0,
          correctAnswerText: ASSERTION_REASON_STANDARD_OPTIONS[0],
          explanation:
            'Dono statements bilkul sahi hain aur Reason (R), Assertion (A) ka exact scientific explanation deta hai. Parallel mein har appliance ko full 220 V supply aur independent switch milta hai.',
        },
        {
          id: 'bl-q7',
          type: 'match-following',
          difficulty: 'Medium',
          subtopic: 'Electrical Formulas',
          question: 'Column A ki physical quantity ko Column B ke sahi formula se match karein:',
          options: [],
          correctIndex: 0,
          matchPairs: [
            { left: 'Electric Current (I)', right: 'Q / t' },
            { left: 'Potential Difference (V)', right: 'W / Q' },
            { left: 'Ohm’s Law (V)', right: 'I × R' },
            { left: 'Electric Power (P)', right: 'V × I' },
          ],
          explanation:
            'Electric Current I = Q/t, Potential Difference V = W/Q, Ohm’s Law V = I × R, aur Electric Power P = V × I sabhi electricity numericals ke core formulas hain.',
        },
      ],
    },
  },
  {
    id: 'builtin-quadratics-mix',
    title: 'Class 10 Maths: Quadratic Equations (Mixed Exam Practice)',
    subject: 'Mathematics',
    level: 'Class 10',
    difficulty: 'Medium',
    createdAt: 'Curated Practice Set',
    isBuiltIn: true,
    quiz: {
      id: 'builtin-quadratics-mix',
      title: 'Quadratic Equations — Concept & Numerical Drill',
      topic: 'Quadratic Equations & Discriminant',
      chapterName: 'Chapter 4: Quadratic Equations',
      subject: 'Mathematics',
      track: 'school',
      level: 'Class 10',
      difficulty: 'Medium',
      questionTypes: ['mcq', 'true-false', 'numerical', 'fill-blank'],
      timerMinutes: 5,
      source: 'practice-set',
      questions: [
        {
          id: 'qm-1',
          type: 'mcq',
          difficulty: 'Easy',
          subtopic: 'Discriminant & Nature of Roots',
          question: 'Quadratic equation ax² + bx + c = 0 ke real aur equal roots kab hote hain?',
          options: ['b² - 4ac > 0', 'b² - 4ac = 0', 'b² - 4ac < 0', 'a = 0'],
          correctIndex: 1,
          correctAnswerText: 'b² - 4ac = 0',
          explanation:
            'Jab discriminant D = b² - 4ac = 0 hota hai, tab dono roots equal aur real hote hain: x = -b / (2a).',
        },
        {
          id: 'qm-2',
          type: 'numerical',
          difficulty: 'Medium',
          subtopic: 'Discriminant Calculation',
          question: 'Equation x² - 5x + 6 = 0 ka discriminant (D = b² - 4ac) kitna hoga?',
          options: [],
          correctIndex: 0,
          correctAnswerText: '1',
          acceptedAnswers: ['1'],
          tolerance: 0.01,
          explanation:
            'Yahan a = 1, b = -5, c = 6. Isliye D = (-5)² - 4(1)(6) = 25 - 24 = 1.',
        },
        {
          id: 'qm-3',
          type: 'true-false',
          difficulty: 'Easy',
          subtopic: 'Standard Quadratic Form',
          question: 'Ek quadratic equation mein x² ka coefficient (a) zero ho sakta hai.',
          options: ['True', 'False'],
          correctIndex: 1,
          correctAnswerText: 'False',
          explanation:
            'False! Agar a = 0 ho gaya toh equation bx + c = 0 ban jayegi, jo linear equation hogi, quadratic nahi.',
        },
        {
          id: 'qm-4',
          type: 'fill-blank',
          difficulty: 'Medium',
          subtopic: 'Sum & Product of Roots',
          question: 'Quadratic equation x² - 7x + 12 = 0 ke roots ka sum ______ hota hai.',
          options: [],
          correctIndex: 0,
          correctAnswerText: '7',
          acceptedAnswers: ['7', '+7'],
          explanation:
            'Sum of roots = -b/a = -(-7)/1 = 7. (Roots 3 aur 4 hain, aur 3 + 4 = 7).',
        },
      ],
    },
  },
];
