import test from 'node:test';
import assert from 'node:assert/strict';
import {
  NOTES_MAX_IMAGE_BYTES,
  NOTES_MAX_PASTED_TEXT_CHARS,
  NOTES_MAX_PDF_BYTES,
  NOTE_CLASSES,
  NOTE_DESIGN_STYLES,
  NOTE_SUBJECTS,
  NOTE_TYPES,
  deleteSavedNoteById,
  formatRichNotesAsMarkdown,
  mapLearningLevelToDefaultClass,
  sanitizeNotesForStorage,
  upsertSavedNote,
  validateNotesAttachmentFile,
  validateNotesGenerationInput,
} from './notesLogic';
import type { GeneratedNotes, SavedNoteRecord } from '../types/vidyora';

test('NOTE_TYPES, NOTE_DESIGN_STYLES, NOTE_CLASSES, and NOTE_SUBJECTS include all required options', () => {
  assert.equal(NOTE_TYPES.length, 8);
  assert.deepEqual(
    NOTE_TYPES.map((n) => n.id),
    [
      'Detailed Notes',
      'Short Notes',
      'Quick Revision',
      'Formula Sheets',
      'Important Definitions',
      'Mind Maps',
      'One-page Infographics',
      'Question and Answer Notes',
    ]
  );

  assert.equal(NOTE_DESIGN_STYLES.length, 4);
  assert.deepEqual(
    NOTE_DESIGN_STYLES.map((s) => s.id),
    ['handwritten', 'professional', 'infographic', 'minimal']
  );

  assert.ok(NOTE_CLASSES.includes('Class 1'));
  assert.ok(NOTE_CLASSES.includes('Class 12'));
  assert.ok(NOTE_SUBJECTS.includes('Mathematics'));
  assert.ok(NOTE_SUBJECTS.includes('Physics'));
  assert.ok(NOTE_SUBJECTS.includes('Computer Science'));
});

test('mapLearningLevelToDefaultClass maps levels cleanly', () => {
  assert.equal(mapLearningLevelToDefaultClass('Class 1-5'), 'Class 5');
  assert.equal(mapLearningLevelToDefaultClass('Class 9-10'), 'Class 10');
  assert.equal(mapLearningLevelToDefaultClass('College'), 'College / Undergraduate');
});

test('validateNotesAttachmentFile validates PDF and image files with strict size and type bounds', () => {
  assert.equal(
    validateNotesAttachmentFile({ type: 'application/pdf', size: 1024 * 500, name: 'ch1.pdf' }, 'pdf'),
    null
  );
  assert.equal(
    validateNotesAttachmentFile({ type: 'image/png', size: 1024 * 500, name: 'page.png' }, 'image'),
    null
  );

  assert.match(
    validateNotesAttachmentFile({ type: 'text/plain', size: 100, name: 'bad.txt' }) || '',
    /Unsupported file format/i
  );
  assert.match(
    validateNotesAttachmentFile({ type: 'image/png', size: 200 }, 'pdf') || '',
    /PDF/i
  );
  assert.match(
    validateNotesAttachmentFile({ type: 'application/pdf', size: NOTES_MAX_PDF_BYTES + 1 }, 'pdf') || '',
    /6 MB/i
  );
  assert.match(
    validateNotesAttachmentFile({ type: 'image/jpeg', size: NOTES_MAX_IMAGE_BYTES + 1 }, 'image') || '',
    /4 MB/i
  );
  assert.match(
    validateNotesAttachmentFile({ type: 'application/pdf', size: 0 }, 'pdf') || '',
    /empty/i
  );
});

test('validateNotesGenerationInput allows topic, chapter, pasted text, or attachment, and rejects empty input', () => {
  assert.ok(
    validateNotesGenerationInput({
      topic: '',
      chapterName: '',
      pastedText: '',
      hasAttachment: false,
    })
  );
  assert.equal(
    validateNotesGenerationInput({
      topic: 'Ohm Law',
      chapterName: '',
      pastedText: '',
      hasAttachment: false,
    }),
    null
  );
  assert.equal(
    validateNotesGenerationInput({
      topic: '',
      chapterName: '',
      pastedText: '',
      hasAttachment: true,
    }),
    null
  );
  assert.equal(
    validateNotesGenerationInput({
      topic: '',
      chapterName: '',
      pastedText: 'Force equals mass multiplied by acceleration in Newtonian mechanics.',
      hasAttachment: false,
    }),
    null
  );
  assert.ok(
    validateNotesGenerationInput({
      topic: 'Valid',
      chapterName: '',
      pastedText: 'a'.repeat(NOTES_MAX_PASTED_TEXT_CHARS + 5),
      hasAttachment: false,
    })
  );
});

test('formatRichNotesAsMarkdown includes formulas, tables, mind maps, Q&A, common mistakes, and source tags', () => {
  const sample: GeneratedNotes = {
    title: 'Electricity & Ohm Law',
    level: 'Class 10',
    className: 'Class 10',
    subject: 'Physics',
    chapterName: 'Chapter 12: Electricity',
    noteType: 'Detailed Notes',
    sourceUsed: true,
    sourceSummary: 'Uploaded PDF sample-ohms-law.pdf',
    uncertaintyFlags: ['Specific temperature value was not stated in source.'],
    overview: 'Electric current aur potential difference ke beech ka relation.',
    sections: [
      {
        heading: 'Ohm Law',
        sourceTag: 'From Source',
        points: ['V = I \\times R at constant temperature.'],
      },
    ],
    definitions: [{ term: 'Resistance', definition: 'Opposition to current flow.' }],
    formulas: [{ name: 'Ohm Law', expression: 'V = I \\times R', variables: 'V=Voltage, I=Current, R=Resistance' }],
    examples: [{ title: 'LED Circuit', explanation: 'Resistor limits current to protect LED.' }],
    tables: [{ title: 'Series vs Parallel', headers: ['Property', 'Series', 'Parallel'], rows: [['Current', 'Same', 'Splits']] }],
    mindMap: { centralTopic: 'Electricity', branches: [{ title: 'Laws', subtopics: ['Ohm Law', 'Joule Heating'] }] },
    qaPairs: [{ question: 'State Ohm Law.', answer: 'V is proportional to I at constant T.', marksHint: '2 Marks' }],
    commonMistakes: [{ mistake: 'Mixing series and parallel formula', correction: 'Parallel uses reciprocals 1/R.' }],
    additionalExplanations: [{ title: 'Water Pipe Analogy', explanation: 'Voltage is like water pressure.' }],
    importantPoints: ['SI unit of resistance is Ohm.'],
    revisionSummary: 'Remember V = IR and R_s = R1 + R2.',
  };

  const md = formatRichNotesAsMarkdown(sample);
  assert.ok(md.includes('Primary Source Used:'));
  assert.ok(md.includes('[From Source]'));
  assert.ok(md.includes('V = I × R'));
  assert.ok(md.includes('## Table: Series vs Parallel'));
  assert.ok(md.includes('## Mind Map: Electricity'));
  assert.ok(md.includes('## Exam Question & Answer Notes'));
  assert.ok(md.includes('## Common Mistakes to Avoid'));
  assert.ok(md.includes('## Additional AI Explanations'));
  assert.ok(md.includes('Verification & Missing Info Flags'));
});

test('sanitizeNotesForStorage strips emails and phone numbers while keeping formulas', () => {
  const dirty: GeneratedNotes = {
    title: 'Notes for student@example.com',
    level: 'Class 10',
    overview: 'Call +91 9876543210 for doubts. Formula: x^2 + y^2 = r^2',
    sections: [{ heading: 'Basics', points: ['Email me at a@b.com'] }],
    definitions: [],
    examples: [],
    importantPoints: ['2026 Board Exam'],
    revisionSummary: 'Done.',
  };

  const clean = sanitizeNotesForStorage(dirty);
  assert.ok(clean.title.includes('[email-removed]'));
  assert.ok(clean.overview.includes('[phone-removed]'));
  assert.ok(clean.overview.includes('x^2 + y^2 = r^2'));
  assert.ok(clean.importantPoints[0].includes('2026'));
});

test('upsertSavedNote and deleteSavedNoteById manage saved note history immutably', () => {
  const baseNotes: GeneratedNotes = {
    title: 'N1',
    level: 'Class 10',
    overview: 'O',
    sections: [],
    definitions: [],
    examples: [],
    importantPoints: [],
    revisionSummary: 'R',
  };
  const r1: SavedNoteRecord = {
    id: 'n1',
    title: 'N1',
    className: 'Class 10',
    subject: 'Physics',
    noteType: 'Detailed Notes',
    designStyle: 'professional',
    updatedAt: 'Today',
    notes: baseNotes,
  };
  const r2: SavedNoteRecord = { ...r1, id: 'n2', title: 'N2' };

  let list = upsertSavedNote([], r1);
  list = upsertSavedNote(list, r2);
  assert.equal(list.length, 2);
  assert.equal(list[0].id, 'n2');

  const afterDel = deleteSavedNoteById(list, 'n2');
  assert.equal(afterDel.length, 1);
  assert.equal(afterDel[0].id, 'n1');
});
