import { jsPDF } from 'jspdf';
import type { GeneratedNotes, NoteDesignStyle } from '../types/vidyora';
import { formatMathUnicode } from './studyBuddyLogic';

/**
 * Replaces symbols unsupported by jsPDF's built-in Helvetica font with crisp ASCII equivalents
 * so exported PDFs never render garbled glyph boxes.
 */
function pdfSafeText(raw: string): string {
  return formatMathUnicode(raw)
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/¹/g, '^1')
    .replace(/⁰/g, '^0')
    .replace(/⁴/g, '^4')
    .replace(/⁵/g, '^5')
    .replace(/⁶/g, '^6')
    .replace(/⁷/g, '^7')
    .replace(/⁸/g, '^8')
    .replace(/⁹/g, '^9')
    .replace(/₀/g, '0')
    .replace(/₁/g, '1')
    .replace(/₂/g, '2')
    .replace(/₃/g, '3')
    .replace(/₄/g, '4')
    .replace(/₅/g, '5')
    .replace(/₆/g, '6')
    .replace(/₇/g, '7')
    .replace(/₈/g, '8')
    .replace(/₉/g, '9')
    .replace(/×/g, 'x')
    .replace(/÷/g, '/')
    .replace(/±/g, '+/-')
    .replace(/√/g, 'sqrt')
    .replace(/⇒|→/g, '->')
    .replace(/←/g, '<-')
    .replace(/≤/g, '<=')
    .replace(/≥/g, '>=')
    .replace(/≠/g, '!=')
    .replace(/≈/g, '~=')
    .replace(/π/g, 'pi')
    .replace(/θ/g, 'theta')
    .replace(/α/g, 'alpha')
    .replace(/β/g, 'beta')
    .replace(/γ/g, 'gamma')
    .replace(/Δ/g, 'Delta')
    .replace(/Ω/g, 'Ohm')
    .replace(/μ/g, 'mu')
    .replace(/°/g, ' deg')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[—–]/g, '-')
    .replace(/•/g, '-')
    .replace(/[^\x20-\x7E\n]/g, ' ');
}

const STYLE_PALETTE: Record<
  NoteDesignStyle,
  {
    headerBg: [number, number, number];
    accent: [number, number, number];
    boxBg: [number, number, number];
    pageBg?: [number, number, number];
  }
> = {
  handwritten: {
    headerBg: [30, 58, 138],
    accent: [109, 40, 217],
    boxBg: [255, 251, 235],
    pageBg: [255, 253, 247],
  },
  professional: {
    headerBg: [11, 18, 33],
    accent: [109, 40, 217],
    boxBg: [239, 246, 255],
  },
  infographic: {
    headerBg: [76, 29, 149],
    accent: [37, 99, 235],
    boxBg: [245, 243, 255],
  },
  minimal: {
    headerBg: [15, 23, 42],
    accent: [15, 23, 42],
    boxBg: [248, 250, 252],
  },
};

export function exportNotesToPdf(
  notes: GeneratedNotes,
  style: NoteDesignStyle = 'professional'
): string {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 42;
  const contentWidth = pageWidth - margin * 2;
  const palette = STYLE_PALETTE[style];

  const paintPageBg = () => {
    if (palette.pageBg) {
      doc.setFillColor(...palette.pageBg);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
    }
  };

  paintPageBg();
  let y = 0;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 48) {
      doc.addPage();
      paintPageBg();
      y = 44;
    }
  };

  // Top Header Banner
  doc.setFillColor(...palette.headerBg);
  doc.rect(0, 0, pageWidth, 92, 'F');

  doc.setTextColor(196, 181, 253);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('VIDYORA - LEARNING BEYOND TEXTBOOKS | AI STUDY NOTES', margin, 26);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  const titleLines = doc.splitTextToSize(pdfSafeText(notes.title), contentWidth);
  doc.text(titleLines.slice(0, 2), margin, 48);

  const meta = [
    notes.className || notes.level,
    notes.subject,
    notes.chapterName,
    notes.noteType,
  ]
    .filter(Boolean)
    .join('  |  ');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(219, 234, 254);
  doc.text(pdfSafeText(meta).slice(0, 110), margin, 78);

  y = 112;

  const writeSectionHeading = (heading: string) => {
    ensureSpace(34);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...palette.accent);
    doc.text(pdfSafeText(heading), margin, y);
    y += 5;
    doc.setDrawColor(...palette.accent);
    doc.setLineWidth(0.7);
    doc.line(margin, y, margin + contentWidth, y);
    y += 14;
  };

  const writeParagraph = (text: string, indent = 0, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    const wrapped = doc.splitTextToSize(pdfSafeText(text), contentWidth - indent);
    ensureSpace(wrapped.length * 14 + 6);
    doc.text(wrapped, margin + indent, y);
    y += wrapped.length * 14 + 4;
  };

  // Source attribution note
  if (notes.sourceUsed && notes.sourceSummary) {
    ensureSpace(36);
    doc.setFillColor(...palette.boxBg);
    doc.roundedRect(margin, y - 10, contentWidth, 28, 4, 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 58, 138);
    doc.text(
      pdfSafeText(`Primary Source: ${notes.sourceSummary}`).slice(0, 95),
      margin + 10,
      y + 7
    );
    y += 28;
  }

  // Overview
  writeSectionHeading('Overview');
  writeParagraph(notes.overview);

  // Core Sections
  for (const sec of notes.sections) {
    const label = sec.sourceTag ? `${sec.heading} [${sec.sourceTag}]` : sec.heading;
    writeSectionHeading(label);
    for (const pt of sec.points) {
      writeParagraph(`- ${pt}`, 8);
    }
    y += 4;
  }

  // Formulas
  if (notes.formulas && notes.formulas.length > 0) {
    writeSectionHeading('Key Formulas & Equations');
    for (const f of notes.formulas) {
      writeParagraph(`${f.name}:  ${f.expression}`, 6, true);
      if (f.variables) writeParagraph(`Variables: ${f.variables}`, 16);
      if (f.usage) writeParagraph(`Use: ${f.usage}`, 16);
    }
    y += 4;
  }

  // Definitions
  if (notes.definitions.length > 0) {
    writeSectionHeading('Important Definitions');
    for (const def of notes.definitions) {
      writeParagraph(`${def.term}: ${def.definition}`, 6);
    }
    y += 4;
  }

  // Examples
  if (notes.examples.length > 0) {
    writeSectionHeading('Examples');
    for (const ex of notes.examples) {
      writeParagraph(`${ex.title}: ${ex.explanation}`, 6);
    }
    y += 4;
  }

  // Tables
  if (notes.tables && notes.tables.length > 0) {
    for (const tbl of notes.tables) {
      writeSectionHeading(`Table: ${tbl.title}`);
      if (tbl.headers.length > 0) {
        writeParagraph(tbl.headers.join('  |  '), 4, true);
        for (const row of tbl.rows) {
          writeParagraph(row.join('  |  '), 4);
        }
      }
      y += 4;
    }
  }

  // Mind Map summary
  if (notes.mindMap && notes.mindMap.branches.length > 0) {
    writeSectionHeading(`Mind Map: ${notes.mindMap.centralTopic}`);
    for (const br of notes.mindMap.branches) {
      writeParagraph(`${br.title}: ${br.subtopics.join(', ')}`, 8);
    }
    y += 4;
  }

  // Q&A Notes
  if (notes.qaPairs && notes.qaPairs.length > 0) {
    writeSectionHeading('Question & Answer Notes');
    notes.qaPairs.forEach((qa, i) => {
      writeParagraph(`Q${i + 1}. ${qa.question}${qa.marksHint ? ` (${qa.marksHint})` : ''}`, 4, true);
      writeParagraph(`Ans: ${qa.answer}`, 12);
    });
    y += 4;
  }

  // Common Mistakes
  if (notes.commonMistakes && notes.commonMistakes.length > 0) {
    writeSectionHeading('Common Mistakes to Avoid');
    for (const cm of notes.commonMistakes) {
      writeParagraph(`Mistake: ${cm.mistake}`, 8, true);
      writeParagraph(`Correct: ${cm.correction}`, 14);
    }
    y += 4;
  }

  // Additional AI Explanations
  if (notes.additionalExplanations && notes.additionalExplanations.length > 0) {
    writeSectionHeading('Additional AI Explanations (Beyond Uploaded Source)');
    for (const extra of notes.additionalExplanations) {
      writeParagraph(`${extra.title}: ${extra.explanation}`, 8);
    }
    y += 4;
  }

  // Uncertainty Flags
  if (notes.uncertaintyFlags && notes.uncertaintyFlags.length > 0) {
    writeSectionHeading('Verification & Missing Info Notes');
    for (const flag of notes.uncertaintyFlags) {
      writeParagraph(`- ${flag}`, 8);
    }
    y += 4;
  }

  // Important Points & Revision Summary
  if (notes.importantPoints.length > 0) {
    writeSectionHeading('Important Exam Points');
    for (const pt of notes.importantPoints) {
      writeParagraph(`- ${pt}`, 8);
    }
  }

  writeSectionHeading('Quick Revision Summary');
  writeParagraph(notes.revisionSummary);

  // Footer on every page
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'VIDYORA AI Notes - Verify critical exam formulas with your textbook or teacher.',
      margin,
      pageHeight - 20
    );
    doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin - 52, pageHeight - 20);
  }

  const slug =
    notes.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50) || 'vidyora-notes';
  const fileName = `${slug}-vidyora-notes.pdf`;
  doc.save(fileName);
  return fileName;
}

/**
 * Generates a real valid single-page sample PDF in-browser (for quick student testing of PDF upload).
 */
export function createSampleStudyPdf(): {
  base64: string;
  fileName: string;
  sizeBytes: number;
} {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Chapter 12: Electricity - Ohm Law & Resistance', 48, 64);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  const body = [
    '1. Electric Current (I): Rate of flow of electric charge through a conductor.',
    '   Formula: I = Q / t   (SI unit: Ampere, A)',
    '',
    '2. Potential Difference (V): Work done in moving a unit positive charge between two points.',
    '   Formula: V = W / Q   (SI unit: Volt, V)',
    '',
    '3. Ohm Law: At constant temperature, the electric current flowing through a metallic',
    '   conductor is directly proportional to the potential difference across its ends.',
    '   Formula: V = I * R   where R is Resistance (SI unit: Ohm).',
    '',
    '4. Factors Affecting Resistance:',
    '   - Directly proportional to length (L)',
    '   - Inversely proportional to cross-sectional area (A)',
    '   - Depends on material resistivity (rho): R = rho * (L / A)',
    '',
    '5. Resistors in Series: R_total = R1 + R2 + R3 (same current flows through each resistor).',
    '6. Resistors in Parallel: 1/R_total = 1/R1 + 1/R2 + 1/R3 (same voltage across each branch).',
  ];
  doc.text(body, 48, 108);

  const dataUri = doc.output('datauristring');
  const base64 = dataUri.split(',')[1] || '';
  return {
    base64,
    fileName: 'sample-ohms-law-chapter.pdf',
    sizeBytes: Math.round((base64.length * 3) / 4),
  };
}
