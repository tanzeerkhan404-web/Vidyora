import type {
  DifficultyLevel,
  FreeResource,
  GeneratedNotes,
  LearningCategory,
  LearningLevel,
  QuizQuestion,
  StudentProfile,
  StudyBuddyMessage,
  StudyBuddySession,
  StudyPlanBlock,
  VideoLesson,
} from '../types/vidyora';

export function filterLessons(
  lessons: VideoLesson[],
  category: LearningCategory,
  searchQuery = '',
  difficulty: DifficultyLevel = 'All'
): VideoLesson[] {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  return lessons.filter((lesson) => {
    const matchesCategory = category === 'all' || lesson.category === category;
    if (!matchesCategory) return false;
    const matchesDifficulty =
      difficulty === 'All' || lesson.difficulty === difficulty;
    if (!matchesDifficulty) return false;
    if (!normalizedQuery) return true;
    const haystack = `${lesson.title} ${lesson.subject} ${lesson.className} ${lesson.chapter} ${lesson.chapterName} ${lesson.level} ${lesson.difficulty} ${lesson.summary}`.toLowerCase();
    return haystack.includes(normalizedQuery);
  });
}

export function filterResources(
  resources: FreeResource[],
  category: LearningCategory,
  searchQuery = ''
): FreeResource[] {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  return resources.filter((res) => {
    const matchesCategory = category === 'all' || res.category === category;
    if (!matchesCategory) return false;
    if (!normalizedQuery) return true;
    const haystack = `${res.title} ${res.subject} ${res.level} ${res.format} ${res.summary}`.toLowerCase();
    return haystack.includes(normalizedQuery);
  });
}

export interface QuizScoreSummary {
  correct: number;
  total: number;
  answered: number;
  percentage: number;
  feedback: string;
}

export function calculateQuizScore(
  questions: QuizQuestion[],
  selectedAnswers: Record<string, number>
): QuizScoreSummary {
  const total = questions.length;
  if (total === 0) {
    return {
      correct: 0,
      total: 0,
      answered: 0,
      percentage: 0,
      feedback: 'Quiz mein koi questions nahi mile.',
    };
  }

  let correct = 0;
  let answered = 0;

  for (const q of questions) {
    const chosen = selectedAnswers[q.id];
    if (typeof chosen === 'number') {
      answered += 1;
      if (chosen === q.correctIndex) {
        correct += 1;
      }
    }
  }

  const percentage = Math.round((correct / total) * 100);
  let feedback = 'Achhi koshish! Explanations dhyan se padho aur ek baar phir try karo.';
  if (percentage >= 85) {
    feedback = 'Shabaash! Aapka concept bahut strong hai. Agle chapter ki taraf badho!';
  } else if (percentage >= 60) {
    feedback = 'Badhiya progress! Jo questions galat hue, unke explanation revise kar lo.';
  }

  return { correct, total, answered, percentage, feedback };
}

export function calculatePlanProgress(
  blocks: StudyPlanBlock[],
  completedIds: string[]
): { completed: number; total: number; percentage: number } {
  const total = blocks.length;
  if (total === 0) return { completed: 0, total: 0, percentage: 0 };
  const validIds = new Set(blocks.map((b) => b.id));
  const completed = completedIds.filter((id) => validIds.has(id)).length;
  return {
    completed,
    total,
    percentage: Math.round((completed / total) * 100),
  };
}

export function validateStudyBuddyInput(question: string): string | null {
  const trimmed = question.trim();
  if (trimmed.length < 2) {
    return 'Kripya apna sawal likhein (jaise: "Photosynthesis kaise hota hai?").';
  }
  if (trimmed.length > 1200) {
    return 'Sawal 1200 characters se chhota rakhein.';
  }
  return null;
}

export function validateNotesOrQuizTopic(topic: string): string | null {
  const trimmed = topic.trim();
  if (trimmed.length < 2) {
    return 'Topic ya chapter ka naam enter karein (jaise: "Newton\'s Laws of Motion").';
  }
  if (trimmed.length > 180) {
    return 'Topic naam 180 characters se chhota rakhein.';
  }
  return null;
}

export function validatePlannerInput(
  goal: string,
  dailyHours: number,
  timelineDays: number
): string | null {
  if (goal.trim().length < 3) {
    return 'Apna study goal likhein (jaise: "Class 10 Maths & Science Board Prep").';
  }
  if (!Number.isFinite(dailyHours) || dailyHours < 1 || dailyHours > 10) {
    return 'Daily study hours 1 se 10 ke beech select karein.';
  }
  if (!Number.isFinite(timelineDays) || timelineDays < 3 || timelineDays > 180) {
    return 'Timeline 3 se 180 din ke beech rakhein.';
  }
  return null;
}

export function formatNotesAsMarkdown(notes: GeneratedNotes): string {
  const lines: string[] = [
    `# ${notes.title}`,
    `Level: ${notes.level} | Platform: VIDYORA (Learning Beyond Textbooks)`,
    '',
    '## Overview',
    notes.overview,
    '',
  ];

  for (const sec of notes.sections) {
    lines.push(`## ${sec.heading}`);
    for (const pt of sec.points) {
      lines.push(`- ${pt}`);
    }
    lines.push('');
  }

  if (notes.definitions.length > 0) {
    lines.push('## Key Definitions');
    for (const def of notes.definitions) {
      lines.push(`- **${def.term}**: ${def.definition}`);
    }
    lines.push('');
  }

  if (notes.examples.length > 0) {
    lines.push('## Real-Life Examples');
    for (const ex of notes.examples) {
      lines.push(`- **${ex.title}**: ${ex.explanation}`);
    }
    lines.push('');
  }

  if (notes.importantPoints.length > 0) {
    lines.push('## Important Exam Points');
    for (const pt of notes.importantPoints) {
      lines.push(`- ${pt}`);
    }
    lines.push('');
  }

  lines.push('## Revision Summary');
  lines.push(notes.revisionSummary);
  lines.push('');
  lines.push('---');
  lines.push(
    'Disclaimer: Yeh AI-assisted study notes revision ke liye hain. Important exams ke liye apni textbook ya teacher se verify zaroor karein.'
  );

  return lines.join('\n');
}

export function formatResourceAsText(resource: FreeResource): string {
  const lines: string[] = [
    `VIDYORA FREE STUDY RESOURCE`,
    `Title: ${resource.title}`,
    `Subject: ${resource.subject} | Level: ${resource.level} | Type: ${resource.format}`,
    '============================================================',
    '',
    'SUMMARY:',
    resource.summary,
    '',
    'KEY DEFINITIONS:',
    ...resource.definitions.map((d) => `• ${d.term}: ${d.meaning}`),
    '',
    'KEY FORMULAS & CONCEPTS:',
    ...resource.formulas.map((f) => `• ${f}`),
    '',
    'EXAM & REVISION TIPS:',
    ...resource.importantPoints.map((p) => `• ${p}`),
    '',
    '------------------------------------------------------------',
    'VIDYORA — Learning Beyond Textbooks. Free educational material for self-study.',
  ];
  return lines.join('\n');
}

export function toggleWatchedLesson(
  profile: StudentProfile,
  lessonId: string
): StudentProfile {
  const exists = profile.watchedLessonIds.includes(lessonId);
  return {
    ...profile,
    watchedLessonIds: exists
      ? profile.watchedLessonIds.filter((id) => id !== lessonId)
      : [...profile.watchedLessonIds, lessonId],
  };
}

export interface InlineSegment {
  text: string;
  bold?: boolean;
  code?: boolean;
}

export function cleanMathNotation(raw: string): string {
  return raw
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1)/($2)')
    .replace(/\\text\{([^{}]+)\}/g, '$1')
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\cdot/g, '·')
    .replace(/\\pm/g, '±')
    .replace(/\\implies/g, '⇒')
    .replace(/\\rightarrow|\\to/g, '→')
    .replace(/\\leq/g, '≤')
    .replace(/\\geq/g, '≥')
    .replace(/\\neq/g, '≠')
    .replace(/\\quad|\\qquad/g, '  ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Safely tokenizes **bold**, `inline code`, $$block math$$, and $formula$ into
 * structured segments without using dangerouslySetInnerHTML.
 */
export function parseInlineSegments(line: string): InlineSegment[] {
  const segments: InlineSegment[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\$\$[^$]+\$\$|\$[^$]+\$)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: line.slice(lastIndex, match.index) });
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      segments.push({ text: token.slice(2, -2), bold: true });
    } else if (token.startsWith('$$') && token.endsWith('$$')) {
      segments.push({ text: cleanMathNotation(token.slice(2, -2)), code: true });
    } else if (token.startsWith('$') && token.endsWith('$')) {
      segments.push({ text: cleanMathNotation(token.slice(1, -1)), code: true });
    } else if (token.startsWith('`') && token.endsWith('`')) {
      segments.push({ text: cleanMathNotation(token.slice(1, -1)), code: true });
    } else {
      segments.push({ text: token });
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < line.length) {
    segments.push({ text: line.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ text: line }];
}

export function deriveSessionTitle(messages: StudyBuddyMessage[]): string {
  const firstUser = messages.find((m) => m.role === 'user');
  if (!firstUser) return 'New Study Chat';
  const cleaned = firstUser.content.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= 44) return cleaned;
  return `${cleaned.slice(0, 41)}...`;
}

export function upsertStudySession(
  sessions: StudyBuddySession[],
  sessionId: string,
  level: LearningLevel,
  messages: StudyBuddyMessage[],
  maxSessions = 15
): StudyBuddySession[] {
  if (messages.length === 0) return sessions;

  const updated: StudyBuddySession = {
    id: sessionId,
    title: deriveSessionTitle(messages),
    level,
    updatedAt: new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
    messages,
  };

  const withoutExisting = sessions.filter((s) => s.id !== sessionId);
  return [updated, ...withoutExisting].slice(0, maxSessions);
}

