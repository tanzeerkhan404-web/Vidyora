import type {
  DoubtSolution,
  DoubtSolverSubject,
  LearningLevel,
  StudyBuddyLevel,
  StudyBuddyMode,
  StudyBuddySession,
  StudyBuddySubject,
} from '../types/vidyora';

export const STUDY_BUDDY_LEVELS: StudyBuddyLevel[] = [
  'Beginner',
  'School level',
  'College level',
  'Competitive exam level',
];

export const STUDY_BUDDY_MODES: Array<{
  id: StudyBuddyMode;
  label: string;
  shortDesc: string;
}> = [
  { id: 'simple', label: 'Explain simply', shortDesc: 'Seedhi aur aasaan Hinglish' },
  { id: 'step-by-step', label: 'Step by step', shortDesc: 'Numbered steps & formulas' },
  { id: 'real-life', label: 'Real-life examples', shortDesc: 'Daily-life relatable examples' },
  { id: 'short-summary', label: 'Short summary', shortDesc: 'Crisp quick revision notes' },
  { id: 'teacher', label: 'Like a teacher', shortDesc: 'Classroom mentor style + check question' },
];

export const STUDY_BUDDY_SUBJECTS: StudyBuddySubject[] = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'English',
  'History',
  'Geography',
  'Computer Science',
  'General Knowledge',
];

export const DOUBT_SOLVER_SUBJECTS: DoubtSolverSubject[] = [
  'Auto Detect',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'English',
  'History',
  'Geography',
  'Computer Science',
];

export const SUBJECT_SUGGESTED_QUESTIONS: Record<StudyBuddySubject, string[]> = {
  Mathematics: [
    'Quadratic equation 2x² - 7x + 3 = 0 ko step-by-step solve karke samjhao',
    'sin θ, cos θ aur tan θ ko bina ratte easily kaise yaad rakhein?',
    'HCF aur LCM mein kya farak hota hai? Ek simple example do',
    'Pythagoras theorem real life mein kahan use hota hai?',
  ],
  Physics: [
    'Newton ke teeno laws of motion ko simple Hinglish aur daily examples se samjhao',
    'Ohm’s Law (V = I × R) aur Resistance ka concept clearly samjhao',
    'Concave aur Convex mirror mein kya difference hai?',
    'Work, Energy aur Power ke beech ka relation samjhao',
  ],
  Chemistry: [
    'Ionic bond aur Covalent bond mein kya difference hai?',
    'Chemical equation ko balance karne ka sabse easy tarika kya hai?',
    'pH scale kya hota hai aur daily life mein iska kya role hai?',
    'Mole concept aur Avogadro number ko simple analogy se samjhao',
  ],
  Biology: [
    'Photosynthesis mein Light Reaction aur Dark Reaction kya hoti hain?',
    'Human heart blood ko kaise pump karta hai? Step-by-step samjhao',
    'DNA aur RNA mein main differences kya hain?',
    'Mitosis aur Meiosis cell division ko simple comparison mein samjhao',
  ],
  English: [
    'Active voice aur Passive voice mein sentence kaise change karte hain?',
    'Present Perfect aur Simple Past tense ke beech ka difference examples ke saath samjhao',
    'Formal letter aur informal letter ka clean format kya hota hai?',
    'Metaphor, Simile aur Personification ko examples se samjhao',
  ],
  History: [
    'Indus Valley Civilization ki sabse important urban planning features kya thi?',
    '1857 ke revolt ke main causes ko short points mein samjhao',
    'Non-Cooperation Movement kyun start aur suspend hua tha?',
    'Industrial Revolution ne world economy ko kaise badal diya?',
  ],
  Geography: [
    'Indian Monsoon kaise aata hai aur retreat kaise karta hai?',
    'Igneous, Sedimentary aur Metamorphic rocks mein kya difference hai?',
    'Latitude aur Longitude se kisi jagah ka time aur climate kaise pata chalta hai?',
    'Greenhouse effect aur global warming ko simple words mein samjhao',
  ],
  'Computer Science': [
    'Array aur Linked List mein kya difference hai aur kab kaunsa use karein?',
    'Recursion kaise kaam karta hai? Factorial example se step-by-step samjhao',
    'Big-O notation (O(1), O(n), O(log n)) ko daily life example se samjhao',
    'HTTP aur HTTPS mein kya farak hai aur encryption kyun zaroori hai?',
  ],
  'General Knowledge': [
    'Indian Constitution ke 6 Fundamental Rights ko simple points mein samjhao',
    'Compound interest aur inflation common student ki savings par kaise effect daalte hain?',
    'ISRO ke Chandrayaan missions ka main scientific goal kya raha hai?',
    'Solar eclipse aur Lunar eclipse kaise bante hain?',
  ],
};

export function mapProfileLevelToBuddyLevel(level: LearningLevel): StudyBuddyLevel {
  switch (level) {
    case 'Class 1-5':
      return 'Beginner';
    case 'Class 6-8':
    case 'Class 9-10':
    case 'Class 11-12':
      return 'School level';
    case 'College':
      return 'College level';
    case 'Competitive Exams':
      return 'Competitive exam level';
    default:
      return 'School level';
  }
}

const SUPERSCRIPT_MAP: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
  '+': '⁺',
  '-': '⁻',
  'n': 'ⁿ',
};

const SUBSCRIPT_MAP: Record<string, string> = {
  '0': '₀',
  '1': '₁',
  '2': '₂',
  '3': '₃',
  '4': '₄',
  '5': '₅',
  '6': '₆',
  '7': '₇',
  '8': '₈',
  '9': '₉',
  '+': '₊',
  '-': '₋',
};

function toSuperscript(expr: string): string {
  return expr
    .split('')
    .map((ch) => SUPERSCRIPT_MAP[ch] ?? ch)
    .join('');
}

function toSubscript(expr: string): string {
  return expr
    .split('')
    .map((ch) => SUBSCRIPT_MAP[ch] ?? ch)
    .join('');
}

/**
 * Converts LaTeX-like expressions and ASCII math into clean, readable Unicode equations.
 */
export function formatMathUnicode(raw: string): string {
  let out = raw
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\$([^$\n]{1,140})\$/g, '$1')
    .replace(/\\text\{([^{}]+)\}/g, '$1')
    .replace(/\\mathrm\{([^{}]+)\}/g, '$1')
    .replace(/\\sqrt\{([^{}]+)\}/g, '√($1)');

  // Expand \frac after inner \sqrt / \text braces are resolved (up to 3 nested levels)
  for (let pass = 0; pass < 3 && out.includes('\\frac{'); pass++) {
    out = out.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1)/($2)');
  }

  out = out
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\cdot/g, '·')
    .replace(/\\pm/g, '±')
    .replace(/\\mp/g, '∓')
    .replace(/\\implies/g, '⇒')
    .replace(/\\iff/g, '⇔')
    .replace(/\\rightarrow|\\to/g, '→')
    .replace(/\\leftarrow/g, '←')
    .replace(/\\leq|\\le\b/g, '≤')
    .replace(/\\geq|\\ge\b/g, '≥')
    .replace(/\\neq|\\ne\b/g, '≠')
    .replace(/\\approx/g, '≈')
    .replace(/\\infty/g, '∞')
    .replace(/\\pi\b/g, 'π')
    .replace(/\\theta\b/g, 'θ')
    .replace(/\\alpha\b/g, 'α')
    .replace(/\\beta\b/g, 'β')
    .replace(/\\gamma\b/g, 'γ')
    .replace(/\\Delta\b/g, 'Δ')
    .replace(/\\delta\b/g, 'δ')
    .replace(/\\lambda\b/g, 'λ')
    .replace(/\\rho\b/g, 'ρ')
    .replace(/\\omega\b/g, 'ω')
    .replace(/\\Omega\b/g, 'Ω')
    .replace(/\\mu\b/g, 'μ')
    .replace(/\\sigma\b/g, 'σ')
    .replace(/\\sum\b/g, '∑')
    .replace(/\\int\b/g, '∫')
    .replace(/\\circ\b/g, '°')
    .replace(/\\degree\b/g, '°')
    .replace(/\\quad|\\qquad/g, '  ')
    .replace(/\\left|\\right/g, '');

  // Convert ^{...} and ^2 style exponents into Unicode superscripts where supported
  out = out.replace(/\^\{([0-9+\-n]+)\}/g, (_m, g1: string) => toSuperscript(g1));
  out = out.replace(/\^([0-9n])\b/g, (_m, g1: string) => toSuperscript(g1));

  // Convert _{...} and _1 style subscripts (including chemical formulas like H_2O, C_6H_12O_6)
  out = out.replace(/_\{([0-9+\-]+)\}/g, (_m, g1: string) => toSubscript(g1));
  out = out.replace(
    /([A-Za-z])_([0-9]+)(?![a-z_])/g,
    (_m, base: string, sub: string) => `${base}${toSubscript(sub)}`
  );

  return out.replace(/\s+/g, ' ').trim();
}

export interface MessageBlock {
  type: 'heading' | 'equation' | 'bullet' | 'numbered' | 'paragraph' | 'spacer';
  text: string;
  marker?: string;
}

/**
 * Splits assistant/user text into semantic display blocks including dedicated equation blocks.
 */
export function parseMessageBlocks(content: string): MessageBlock[] {
  const blocks: MessageBlock[] = [];
  const rawLines = content.split('\n');

  for (const rawLine of rawLines) {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      blocks.push({ type: 'spacer', text: '' });
      continue;
    }

    // Standalone display math block: $$ ... $$ or \[ ... \]
    if (
      (trimmed.startsWith('$$') && trimmed.endsWith('$$') && trimmed.length > 4) ||
      (trimmed.startsWith('\\[') && trimmed.endsWith('\\]') && trimmed.length > 4)
    ) {
      const inner = trimmed.slice(2, -2);
      blocks.push({ type: 'equation', text: formatMathUnicode(inner) });
      continue;
    }

    if (/^#{1,4}\s+/.test(trimmed)) {
      blocks.push({
        type: 'heading',
        text: trimmed.replace(/^#{1,4}\s+/, ''),
      });
      continue;
    }

    const numberedMatch = trimmed.match(/^(\d+)[.)]\s+(.*)$/);
    if (numberedMatch) {
      blocks.push({
        type: 'numbered',
        marker: numberedMatch[1],
        text: numberedMatch[2],
      });
      continue;
    }

    if (/^[-*•]\s+/.test(trimmed)) {
      blocks.push({
        type: 'bullet',
        text: trimmed.replace(/^[-*•]\s+/, ''),
      });
      continue;
    }

    blocks.push({ type: 'paragraph', text: trimmed });
  }

  return blocks;
}

/**
 * Strips markdown & converts mathematical symbols into clean spoken text for Web Speech API.
 */
export function prepareTextForSpeech(content: string): string {
  return formatMathUnicode(content)
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .replace(/\$\$/g, '')
    .replace(/\$/g, '')
    .replace(/^#{1,4}\s+/gm, '')
    .replace(/^[-*•]\s+/gm, '')
    .replace(/×/g, ' multiplied by ')
    .replace(/÷/g, ' divided by ')
    .replace(/⇒/g, ' implies ')
    .replace(/→/g, ' gives ')
    .replace(/≤/g, ' less than or equal to ')
    .replace(/≥/g, ' greater than or equal to ')
    .replace(/≠/g, ' not equal to ')
    .replace(/±/g, ' plus or minus ')
    .replace(/√/g, ' square root of ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Redacts obvious PII (emails, phone numbers, 12-digit ID numbers) before saving chat logs.
 * Preserves academic equations, years (e.g. 1947, 2026), and numeric answers.
 */
export function sanitizeChatTextForStorage(text: string): string {
  return text
    // Email addresses
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email-removed]')
    // 12-digit ID numbers (e.g., Aadhaar-like 4-4-4 or 12 digits)
    .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[id-removed]')
    // Phone numbers (+91 / 10-digit mobile numbers)
    .replace(/(?:\+91[\s-]?)?\b[6-9]\d{9}\b/g, '[phone-removed]');
}

export const DOUBT_MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4 MB
export const DOUBT_ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export function validateDoubtImageFile(
  file: { type: string; size: number },
  maxBytes = DOUBT_MAX_IMAGE_BYTES
): string | null {
  if (!DOUBT_ALLOWED_MIME_TYPES.includes(file.type)) {
    return 'Unsupported file format! Kripya sirf PNG, JPG ya WebP image upload karein.';
  }
  if (file.size <= 0) {
    return 'Image file empty lag rahi hai. Koi valid photo choose karein.';
  }
  if (file.size > maxBytes) {
    const mb = (maxBytes / (1024 * 1024)).toFixed(0);
    return `Image size bahut badi hai (max ${mb} MB allowed). Kripya chhoti ya cropped photo upload karein.`;
  }
  return null;
}

export function formatDoubtSolutionForCopy(solution: DoubtSolution): string {
  const lines: string[] = [
    `VIDYORA AI Doubt Solver — ${solution.detectedSubject} (${solution.subjectTopic})`,
    '============================================================',
    '',
    `Question Understood:`,
    solution.extractedQuestion,
    '',
  ];

  if (solution.givenInformation.length > 0) {
    lines.push('Given Information:');
    solution.givenInformation.forEach((g) => lines.push(`- ${g}`));
    lines.push('');
  }

  if (solution.requiredAnswer) {
    lines.push(`Required Answer: ${solution.requiredAnswer}`);
    lines.push('');
  }

  if (solution.relevantFormulas.length > 0) {
    lines.push('Relevant Formula / Concept:');
    solution.relevantFormulas.forEach((f) => lines.push(`- ${formatMathUnicode(f)}`));
    lines.push('');
  } else if (solution.conceptUsed) {
    lines.push(`Relevant Formula / Concept: ${formatMathUnicode(solution.conceptUsed)}`);
    lines.push('');
  }

  lines.push('Step-by-Step Solution:');
  solution.steps.forEach((s) => {
    lines.push(`Step ${s.stepNumber} — ${s.title}`);
    lines.push(formatMathUnicode(s.explanation));
    lines.push('');
  });

  lines.push(`Final Answer: ${formatMathUnicode(solution.finalAnswer)}`);
  if (solution.finalAnswerExplanation) {
    lines.push(solution.finalAnswerExplanation);
  }
  lines.push('');
  lines.push(`Important Learning Point: ${solution.importantLearningPoint || solution.practiceTip}`);

  if (solution.similarPracticeQuestion?.question) {
    lines.push('');
    lines.push(`Similar Practice Question: ${solution.similarPracticeQuestion.question}`);
  }

  lines.push('');
  lines.push('Disclaimer: AI-assisted solution — verify important exam answers with your textbook or teacher.');
  return lines.join('\n');
}

export function deleteStudySessionById(
  sessions: StudyBuddySession[],
  sessionId: string
): StudyBuddySession[] {
  return sessions.filter((s) => s.id !== sessionId);
}
