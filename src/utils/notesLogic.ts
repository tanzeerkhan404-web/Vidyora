import type {
  GeneratedNotes,
  LearningLevel,
  NoteDesignStyle,
  NoteType,
  SavedNoteRecord,
} from '../types/vidyora';
import {
  formatMathUnicode,
  sanitizeChatTextForStorage,
} from './studyBuddyLogic';

export const NOTE_TYPES: Array<{
  id: NoteType;
  label: string;
  shortDesc: string;
}> = [
  { id: 'Detailed Notes', label: 'Detailed Notes', shortDesc: 'Complete chapter coverage' },
  { id: 'Short Notes', label: 'Short Notes', shortDesc: 'Concise crisp points' },
  { id: 'Quick Revision', label: 'Quick Revision', shortDesc: 'Last-minute exam review' },
  { id: 'Formula Sheets', label: 'Formula Sheets', shortDesc: 'Equations & variables' },
  { id: 'Important Definitions', label: 'Important Definitions', shortDesc: 'Key terms & meanings' },
  { id: 'Mind Maps', label: 'Mind Maps', shortDesc: 'Visual branch hierarchy' },
  { id: 'One-page Infographics', label: 'One-page Infographics', shortDesc: 'Visual high-impact sheet' },
  { id: 'Question and Answer Notes', label: 'Q&A Notes', shortDesc: 'Exam questions & answers' },
];

export const NOTE_DESIGN_STYLES: Array<{
  id: NoteDesignStyle;
  label: string;
  shortDesc: string;
}> = [
  {
    id: 'handwritten',
    label: 'Handwritten Notebook',
    shortDesc: 'Ruled paper & neat ink styling',
  },
  {
    id: 'professional',
    label: 'Professional Digital',
    shortDesc: 'Deep navy & purple editorial layout',
  },
  {
    id: 'infographic',
    label: 'Colorful Infographic',
    shortDesc: 'Color-coded visual study blocks',
  },
  {
    id: 'minimal',
    label: 'Minimal Exam Revision',
    shortDesc: 'High-density monochrome print-friendly',
  },
];

export const NOTE_CLASSES: string[] = [
  'Class 1',
  'Class 2',
  'Class 3',
  'Class 4',
  'Class 5',
  'Class 6',
  'Class 7',
  'Class 8',
  'Class 9',
  'Class 10',
  'Class 11',
  'Class 12',
  'College / Undergraduate',
  'Competitive Exams (JEE / NEET / UPSC / SSC)',
];

export const NOTE_SUBJECTS: string[] = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Science',
  'English',
  'History',
  'Geography',
  'Civics & Polity',
  'Economics',
  'Computer Science',
  'General Knowledge',
];

export const NOTES_MAX_PDF_BYTES = 6 * 1024 * 1024; // 6 MB
export const NOTES_MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4 MB
export const NOTES_MAX_PASTED_TEXT_CHARS = 15_000;

export const NOTES_ALLOWED_PDF_MIME = 'application/pdf';
export const NOTES_ALLOWED_IMAGE_MIMES = ['image/png', 'image/jpeg', 'image/webp'];

export function mapLearningLevelToDefaultClass(level: LearningLevel): string {
  switch (level) {
    case 'Class 1-5':
      return 'Class 5';
    case 'Class 6-8':
      return 'Class 8';
    case 'Class 9-10':
      return 'Class 10';
    case 'Class 11-12':
      return 'Class 12';
    case 'College':
      return 'College / Undergraduate';
    case 'Competitive Exams':
      return 'Competitive Exams (JEE / NEET / UPSC / SSC)';
    default:
      return 'Class 10';
  }
}

export function validateNotesAttachmentFile(
  file: { type: string; size: number; name?: string },
  expectedKind?: 'pdf' | 'image'
): string | null {
  const isPdf =
    file.type === NOTES_ALLOWED_PDF_MIME ||
    (file.type === '' && Boolean(file.name?.toLowerCase().endsWith('.pdf')));
  const isImage = NOTES_ALLOWED_IMAGE_MIMES.includes(file.type);

  if (expectedKind === 'pdf' && !isPdf) {
    return 'Sirf PDF document (.pdf) upload karein.';
  }
  if (expectedKind === 'image' && !isImage) {
    return 'Sirf PNG, JPG ya WebP image upload karein.';
  }
  if (!isPdf && !isImage) {
    return 'Unsupported file format! Sirf PDF document ya PNG/JPG/WebP study material image upload karein.';
  }
  if (file.size <= 0) {
    return 'Selected file empty lag rahi hai. Kripya valid study file choose karein.';
  }
  if (isPdf && file.size > NOTES_MAX_PDF_BYTES) {
    return 'PDF size 6 MB se zyada hai. Kripya chhota chapter PDF ya selected pages upload karein.';
  }
  if (isImage && file.size > NOTES_MAX_IMAGE_BYTES) {
    return 'Image size 4 MB se zyada hai. Kripya compressed ya cropped photo upload karein.';
  }
  return null;
}

export function validateNotesGenerationInput(params: {
  topic: string;
  chapterName: string;
  pastedText: string;
  hasAttachment: boolean;
}): string | null {
  const topicLen = params.topic.trim().length;
  const chapterLen = params.chapterName.trim().length;
  const pastedLen = params.pastedText.trim().length;

  if (topicLen < 2 && chapterLen < 2 && pastedLen < 20 && !params.hasAttachment) {
    return 'Kripya koi topic/chapter likhein, apna study text paste karein, ya PDF/image upload karein.';
  }
  if (topicLen > 180) {
    return 'Topic ka naam 180 characters se chhota rakhein.';
  }
  if (chapterLen > 140) {
    return 'Chapter ka naam 140 characters se chhota rakhein.';
  }
  if (pastedLen > NOTES_MAX_PASTED_TEXT_CHARS) {
    return `Pasted text max ${NOTES_MAX_PASTED_TEXT_CHARS.toLocaleString()} characters tak hi rakhein.`;
  }
  return null;
}

export function formatRichNotesAsMarkdown(notes: GeneratedNotes): string {
  const lines: string[] = [
    `# ${formatMathUnicode(notes.title)}`,
    `${[notes.className || notes.level, notes.subject, notes.chapterName, notes.noteType]
      .filter(Boolean)
      .join(' | ')}`,
    'Platform: VIDYORA — Learning Beyond Textbooks',
    '',
  ];

  if (notes.sourceUsed && notes.sourceSummary) {
    lines.push(`> Primary Source Used: ${notes.sourceSummary}`);
    lines.push('');
  }

  if (notes.uncertaintyFlags && notes.uncertaintyFlags.length > 0) {
    lines.push('## Verification & Missing Info Flags');
    notes.uncertaintyFlags.forEach((flag) => lines.push(`- [Verify] ${flag}`));
    lines.push('');
  }

  lines.push('## Overview', formatMathUnicode(notes.overview), '');

  if (notes.sections.length > 0) {
    for (const sec of notes.sections) {
      const tag = sec.sourceTag ? ` [${sec.sourceTag}]` : '';
      lines.push(`## ${formatMathUnicode(sec.heading)}${tag}`);
      for (const pt of sec.points) {
        lines.push(`- ${formatMathUnicode(pt)}`);
      }
      lines.push('');
    }
  }

  if (notes.definitions.length > 0) {
    lines.push('## Important Definitions');
    for (const def of notes.definitions) {
      lines.push(`- **${formatMathUnicode(def.term)}**: ${formatMathUnicode(def.definition)}`);
    }
    lines.push('');
  }

  if (notes.formulas && notes.formulas.length > 0) {
    lines.push('## Key Formulas');
    for (const f of notes.formulas) {
      lines.push(`- **${formatMathUnicode(f.name)}**: \`${formatMathUnicode(f.expression)}\``);
      if (f.variables) lines.push(`  - Variables: ${formatMathUnicode(f.variables)}`);
      if (f.usage) lines.push(`  - Usage: ${formatMathUnicode(f.usage)}`);
    }
    lines.push('');
  }

  if (notes.examples.length > 0) {
    lines.push('## Examples');
    for (const ex of notes.examples) {
      lines.push(`- **${formatMathUnicode(ex.title)}**: ${formatMathUnicode(ex.explanation)}`);
    }
    lines.push('');
  }

  if (notes.tables && notes.tables.length > 0) {
    for (const tbl of notes.tables) {
      lines.push(`## Table: ${formatMathUnicode(tbl.title)}`);
      if (tbl.headers.length > 0) {
        lines.push(`| ${tbl.headers.map(formatMathUnicode).join(' | ')} |`);
        lines.push(`| ${tbl.headers.map(() => '---').join(' | ')} |`);
        for (const row of tbl.rows) {
          lines.push(`| ${row.map(formatMathUnicode).join(' | ')} |`);
        }
      }
      lines.push('');
    }
  }

  if (notes.mindMap && notes.mindMap.branches.length > 0) {
    lines.push(`## Mind Map: ${formatMathUnicode(notes.mindMap.centralTopic)}`);
    for (const branch of notes.mindMap.branches) {
      lines.push(`- **${formatMathUnicode(branch.title)}**: ${branch.subtopics.map(formatMathUnicode).join(', ')}`);
    }
    lines.push('');
  }

  if (notes.qaPairs && notes.qaPairs.length > 0) {
    lines.push('## Exam Question & Answer Notes');
    notes.qaPairs.forEach((qa, idx) => {
      lines.push(`**Q${idx + 1}. ${formatMathUnicode(qa.question)}**${qa.marksHint ? ` (${qa.marksHint})` : ''}`);
      lines.push(`Ans: ${formatMathUnicode(qa.answer)}`);
      lines.push('');
    });
  }

  if (notes.commonMistakes && notes.commonMistakes.length > 0) {
    lines.push('## Common Mistakes to Avoid');
    for (const cm of notes.commonMistakes) {
      lines.push(`- Mistake: ${formatMathUnicode(cm.mistake)} -> Correct: ${formatMathUnicode(cm.correction)}`);
    }
    lines.push('');
  }

  if (notes.additionalExplanations && notes.additionalExplanations.length > 0) {
    lines.push('## Additional AI Explanations (Beyond Uploaded Source)');
    for (const extra of notes.additionalExplanations) {
      lines.push(`- **${formatMathUnicode(extra.title)}**: ${formatMathUnicode(extra.explanation)}`);
    }
    lines.push('');
  }

  if (notes.importantPoints.length > 0) {
    lines.push('## Important Exam Points');
    notes.importantPoints.forEach((pt) => lines.push(`- ${formatMathUnicode(pt)}`));
    lines.push('');
  }

  lines.push('## Revision Summary', formatMathUnicode(notes.revisionSummary), '');
  lines.push('---');
  lines.push(
    'Disclaimer: AI-assisted revision notes — verify critical formulas & exam answers with your textbook or teacher.'
  );
  return lines.join('\n');
}

export function sanitizeNotesForStorage(notes: GeneratedNotes): GeneratedNotes {
  const s = sanitizeChatTextForStorage;
  return {
    ...notes,
    title: s(notes.title),
    overview: s(notes.overview),
    sourceSummary: notes.sourceSummary ? s(notes.sourceSummary) : undefined,
    uncertaintyFlags: notes.uncertaintyFlags?.map(s),
    sections: notes.sections.map((sec) => ({
      ...sec,
      heading: s(sec.heading),
      points: sec.points.map(s),
    })),
    definitions: notes.definitions.map((d) => ({
      term: s(d.term),
      definition: s(d.definition),
    })),
    formulas: notes.formulas?.map((f) => ({
      name: s(f.name),
      expression: s(f.expression),
      variables: s(f.variables),
      usage: f.usage ? s(f.usage) : undefined,
    })),
    examples: notes.examples.map((ex) => ({
      title: s(ex.title),
      explanation: s(ex.explanation),
    })),
    tables: notes.tables?.map((t) => ({
      title: s(t.title),
      headers: t.headers.map(s),
      rows: t.rows.map((r) => r.map(s)),
    })),
    qaPairs: notes.qaPairs?.map((qa) => ({
      question: s(qa.question),
      answer: s(qa.answer),
      marksHint: qa.marksHint ? s(qa.marksHint) : undefined,
    })),
    commonMistakes: notes.commonMistakes?.map((cm) => ({
      mistake: s(cm.mistake),
      correction: s(cm.correction),
    })),
    additionalExplanations: notes.additionalExplanations?.map((ex) => ({
      title: s(ex.title),
      explanation: s(ex.explanation),
    })),
    importantPoints: notes.importantPoints.map(s),
    revisionSummary: s(notes.revisionSummary),
  };
}

export function upsertSavedNote(
  list: SavedNoteRecord[],
  record: SavedNoteRecord,
  maxItems = 25
): SavedNoteRecord[] {
  return [record, ...list.filter((n) => n.id !== record.id)].slice(0, maxItems);
}

export function deleteSavedNoteById(
  list: SavedNoteRecord[],
  noteId: string
): SavedNoteRecord[] {
  return list.filter((n) => n.id !== noteId);
}
