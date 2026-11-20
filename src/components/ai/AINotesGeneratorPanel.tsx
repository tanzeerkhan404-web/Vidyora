import { type ChangeEvent, type DragEvent, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  BookMarked,
  BookOpen,
  Bookmark,
  Check,
  Cloud,
  Copy,
  Download,
  Edit3,
  FileImage,
  FileText,
  FileUp,
  Layers,
  Lightbulb,
  Loader2,
  Palette,
  Plus,
  Printer,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type {
  AIStatusResponse,
  FirebaseAuthUser,
  GeneratedNotes,
  LearningLevel,
  NoteDesignStyle,
  NoteRegeneratableSection,
  NoteType,
  SavedNoteRecord,
} from '../../types/vidyora';
import {
  APIRequestError,
  downloadTextFile,
  requestNotesGenerator,
  requestRegenerateNoteSection,
} from '../../utils/aiClient';
import {
  NOTES_MAX_PASTED_TEXT_CHARS,
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
} from '../../utils/notesLogic';
import { createSampleStudyPdf, exportNotesToPdf } from '../../utils/notesPdfExport';
import { formatMathUnicode } from '../../utils/studyBuddyLogic';
import {
  deleteSavedNoteFromDb,
  saveNoteToDb,
  subscribeUserSavedNotes,
} from '../../services/savedNotesRepository';
import { NoteDiagramView, NoteMindMapView } from './NoteDiagramAndMindMap';

const LOCAL_SAVED_NOTES_KEY = 'vidyora_saved_notes_v1';

type InputSourceMode = 'topic' | 'pdf' | 'image' | 'paste';

const QUICK_TOPICS: Array<{ topic: string; chapter: string; subject: string }> = [
  { topic: 'Ohm’s Law & Electric Circuits', chapter: 'Chapter 12: Electricity', subject: 'Physics' },
  { topic: 'Photosynthesis & Light Reactions', chapter: 'Life Processes', subject: 'Biology' },
  { topic: 'Quadratic Equations & Discriminant', chapter: 'Chapter 4: Quadratic Equations', subject: 'Mathematics' },
  { topic: 'Acids, Bases & pH Scale', chapter: 'Chapter 2: Acids, Bases and Salts', subject: 'Chemistry' },
];

const SAMPLE_PASTED_TEXT = `Newton's Laws of Motion:
1. First Law (Law of Inertia): An object remains at rest or in uniform motion in a straight line unless acted upon by an external unbalanced force. Inertia depends directly on mass.
2. Second Law: The rate of change of linear momentum of a body is directly proportional to the applied unbalanced force and takes place in the direction of force. Mathematically, F = m * a (SI unit: Newton, 1 N = 1 kg m/s^2).
3. Third Law: To every action, there is an equal and opposite reaction. Action and reaction act on two different bodies simultaneously.
Law of Conservation of Momentum: In an isolated system with no external force, total momentum before collision equals total momentum after collision (m1u1 + m2u2 = m1v1 + m2v2).`;

function loadLocalSavedNotes(): SavedNoteRecord[] {
  try {
    const raw = window.localStorage.getItem(LOCAL_SAVED_NOTES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedNoteRecord[]) : [];
  } catch {
    return [];
  }
}

function persistLocalSavedNotes(records: SavedNoteRecord[]) {
  try {
    window.localStorage.setItem(LOCAL_SAVED_NOTES_KEY, JSON.stringify(records.slice(0, 25)));
  } catch {
    // Ignore storage quota errors in restricted browsing modes
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function createSampleStudyMaterialImage(): {
  dataUrl: string;
  base64: string;
  mimeType: 'image/png';
  fileName: string;
  sizeBytes: number;
} {
  const canvas = document.createElement('canvas');
  canvas.width = 960;
  canvas.height = 560;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#0B1221';
    ctx.fillRect(0, 0, canvas.width, 72);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('Photosynthesis — Classroom Study Page', 36, 46);

    ctx.fillStyle = '#1E3A8A';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('Overall Balanced Equation:', 40, 128);

    ctx.fillStyle = '#6D28D9';
    ctx.font = 'bold 26px monospace';
    ctx.fillText('6CO2 + 6H2O + Sunlight  -->  C6H12O6 + 6O2', 40, 174);

    ctx.fillStyle = '#0F172A';
    ctx.font = '22px sans-serif';
    ctx.fillText('• Occurs inside Chloroplasts containing Chlorophyll pigment.', 40, 240);
    ctx.fillText('• Step 1 — Light-dependent Reaction (Thylakoid): splits H2O,', 40, 290);
    ctx.fillText('  releases O2, produces ATP and NADPH.', 58, 326);
    ctx.fillText('• Step 2 — Calvin Cycle / Dark Reaction (Stroma): uses ATP &', 40, 382);
    ctx.fillText('  NADPH to fix CO2 into Glucose (C6H12O6).', 58, 418);
    ctx.fillText('• Limiting factors: Light intensity, CO2 concentration, Temperature.', 40, 480);
  }
  const dataUrl = canvas.toDataURL('image/png');
  const base64 = dataUrl.split(',')[1] || '';
  return {
    dataUrl,
    base64,
    mimeType: 'image/png',
    fileName: 'sample-photosynthesis-page.png',
    sizeBytes: Math.round((base64.length * 3) / 4),
  };
}

interface AINotesGeneratorPanelProps {
  aiStatus: AIStatusResponse | null;
  defaultLevel: LearningLevel;
  authUser: FirebaseAuthUser | null;
  onOpenSignIn: () => void;
  onRemainingUpdate: (remaining: number, dailyRemaining?: number) => void;
}

export function AINotesGeneratorPanel({
  aiStatus,
  defaultLevel,
  authUser,
  onOpenSignIn,
  onRemainingUpdate,
}: AINotesGeneratorPanelProps) {
  const isCloudSignedIn = Boolean(authUser?.emailVerified);
  const isConfigured = aiStatus?.configured ?? false;

  // Input State
  const [inputMode, setInputMode] = useState<InputSourceMode>('topic');
  const [topic, setTopic] = useState('');
  const [chapterName, setChapterName] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>(() =>
    mapLearningLevelToDefaultClass(defaultLevel)
  );
  const [selectedSubject, setSelectedSubject] = useState<string>('Physics');
  const [noteType, setNoteType] = useState<NoteType>('Detailed Notes');
  const [designStyle, setDesignStyle] = useState<NoteDesignStyle>('professional');
  const [pastedText, setPastedText] = useState('');

  // Attachment State (PDF or Study Image — transient only, never stored permanently)
  const [attachment, setAttachment] = useState<{
    base64: string;
    mimeType: 'application/pdf' | 'image/png' | 'image/jpeg' | 'image/webp';
    fileName: string;
    sizeBytes: number;
    previewUrl?: string;
  } | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Generation, Editing, Saving & Export State
  const [loading, setLoading] = useState(false);
  const [regeneratingSection, setRegeneratingSection] =
    useState<NoteRegeneratableSection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<GeneratedNotes | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [pdfExportNotice, setPdfExportNotice] = useState<string | null>(null);
  const [savedDrawerOpen, setSavedDrawerOpen] = useState(false);

  // Saved Notes History (Cloud + Local)
  const [localSavedNotes, setLocalSavedNotes] = useState<SavedNoteRecord[]>(() =>
    loadLocalSavedNotes()
  );
  const [cloudSavedNotes, setCloudSavedNotes] = useState<SavedNoteRecord[]>([]);
  const savedNotes = isCloudSignedIn ? cloudSavedNotes : localSavedNotes;

  const pdfInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setSelectedClass(mapLearningLevelToDefaultClass(defaultLevel));
  }, [defaultLevel]);

  // Subscribe to private Firestore saved notes when signed in
  useEffect(() => {
    if (!authUser?.emailVerified) {
      setCloudSavedNotes([]);
      return;
    }
    const unsub = subscribeUserSavedNotes(
      authUser.uid,
      (records) => setCloudSavedNotes(records),
      () => {
        // Keep UI usable cleanly if offline
      }
    );
    return () => unsub();
  }, [authUser?.uid, authUser?.emailVerified]);

  const handleAttachmentFile = (file: File, expectedKind?: 'pdf' | 'image') => {
    setError(null);
    const validationError = validateNotesAttachmentFile(
      { type: file.type, size: file.size, name: file.name },
      expectedKind
    );
    if (validationError) {
      setError(validationError);
      return;
    }

    const effectiveMime: 'application/pdf' | 'image/png' | 'image/jpeg' | 'image/webp' =
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
        ? 'application/pdf'
        : (file.type as 'image/png' | 'image/jpeg' | 'image/webp');

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      const base64 = dataUrl.split(',')[1] || '';
      if (!base64) {
        setError('File read nahi ho payi. Kripya koi doosri file choose karein.');
        return;
      }
      setAttachment({
        base64,
        mimeType: effectiveMime,
        fileName: file.name,
        sizeBytes: file.size,
        previewUrl: effectiveMime.startsWith('image/') ? dataUrl : undefined,
      });
    };
    reader.onerror = () => {
      setError('File upload read karte waqt error aaya. Dobara try karein.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (
    e: ChangeEvent<HTMLInputElement>,
    kind: 'pdf' | 'image'
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      handleAttachmentFile(file, kind);
    }
    e.target.value = '';
  };

  const handleDropFile = (e: DragEvent<HTMLDivElement>, kind: 'pdf' | 'image') => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleAttachmentFile(file, kind);
    }
  };

  const handleLoadSamplePdf = () => {
    setError(null);
    const sample = createSampleStudyPdf();
    setAttachment({
      base64: sample.base64,
      mimeType: 'application/pdf',
      fileName: sample.fileName,
      sizeBytes: sample.sizeBytes,
    });
    setTopic('Ohm’s Law & Resistance');
    setChapterName('Chapter 12: Electricity');
    setSelectedClass('Class 10');
    setSelectedSubject('Physics');
  };

  const handleLoadSampleImage = () => {
    setError(null);
    const sample = createSampleStudyMaterialImage();
    setAttachment({
      base64: sample.base64,
      mimeType: sample.mimeType,
      fileName: sample.fileName,
      sizeBytes: sample.sizeBytes,
      previewUrl: sample.dataUrl,
    });
    setTopic('Photosynthesis');
    setChapterName('Chapter 6: Life Processes');
    setSelectedClass('Class 10');
    setSelectedSubject('Biology');
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);

    const validationError = validateNotesGenerationInput({
      topic,
      chapterName,
      pastedText,
      hasAttachment: Boolean(attachment),
    });
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!isConfigured) {
      setError(
        'AI Notes Generator abhi active nahi hai kyunki server API setup pending hai. Fake notes show nahi kiye jayenge.'
      );
      return;
    }

    setLoading(true);
    setIsEditing(false);
    setSavedNotice(null);
    setPdfExportNotice(null);

    try {
      const res = await requestNotesGenerator({
        topic: topic.trim() || undefined,
        chapterName: chapterName.trim() || undefined,
        className: selectedClass,
        subject: selectedSubject,
        level: defaultLevel,
        noteType,
        pastedText: pastedText.trim() || undefined,
        attachment: attachment
          ? {
              base64: attachment.base64,
              mimeType: attachment.mimeType,
              fileName: attachment.fileName,
            }
          : undefined,
      });

      setNotes(res.notes);
      setActiveNoteId(`note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
      onRemainingUpdate(res.remaining, res.dailyRemaining);
    } catch (err) {
      setError(
        err instanceof APIRequestError
          ? err.message
          : 'Network error: Notes generate nahi ho paye. Internet check karke dobara try karein.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateSection = async (sectionKey: NoteRegeneratableSection) => {
    if (!notes || regeneratingSection || loading) return;
    if (!isConfigured) {
      setError('AI backend abhi configured nahi hai.');
      return;
    }

    setError(null);
    setRegeneratingSection(sectionKey);

    try {
      const contextSummary = [
        `Overview: ${notes.overview}`,
        `Headings: ${notes.sections.map((s) => s.heading).join(', ')}`,
        notes.sourceSummary ? `Source: ${notes.sourceSummary}` : '',
      ]
        .filter(Boolean)
        .join('\n');

      const res = await requestRegenerateNoteSection({
        sectionKey,
        title: notes.title,
        className: notes.className || selectedClass,
        subject: notes.subject || selectedSubject,
        noteType: notes.noteType || noteType,
        contextSummary,
      });

      setNotes((prev) => (prev ? { ...prev, ...res.patch } : prev));
      onRemainingUpdate(res.remaining, res.dailyRemaining);
    } catch (err) {
      setError(
        err instanceof APIRequestError
          ? err.message
          : 'Section regenerate nahi ho paya. Dobara try karein.'
      );
    } finally {
      setRegeneratingSection(null);
    }
  };

  const handleCopyNotes = async () => {
    if (!notes) return;
    try {
      await navigator.clipboard.writeText(formatRichNotesAsMarkdown(notes));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Clipboard copy nahi ho paya. Text manually copy karein.');
    }
  };

  const handleSaveNotes = async () => {
    if (!notes) return;
    setError(null);
    const noteId =
      activeNoteId || `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setActiveNoteId(noteId);

    const sanitized = sanitizeNotesForStorage(notes);
    const record: SavedNoteRecord = {
      id: noteId,
      title: sanitized.title || 'Untitled Study Notes',
      className: sanitized.className || selectedClass,
      subject: sanitized.subject || selectedSubject,
      chapterName: sanitized.chapterName || chapterName || undefined,
      noteType: sanitized.noteType || noteType,
      designStyle,
      updatedAt: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }),
      notes: sanitized,
      source: isCloudSignedIn ? 'cloud' : 'local',
    };

    if (isCloudSignedIn && authUser) {
      const existsInCloud = cloudSavedNotes.some((n) => n.id === noteId);
      try {
        await saveNoteToDb(authUser.uid, record, existsInCloud);
        setSavedNotice('Cloud mein save ho gaya');
      } catch {
        setError('Cloud save fail hua — local browser mein backup save kar diya gaya hai.');
        setLocalSavedNotes((prev) => {
          const next = upsertSavedNote(prev, { ...record, source: 'local' });
          persistLocalSavedNotes(next);
          return next;
        });
      }
    } else {
      setLocalSavedNotes((prev) => {
        const next = upsertSavedNote(prev, record);
        persistLocalSavedNotes(next);
        return next;
      });
      setSavedNotice('Saved to My Notes');
    }

    window.setTimeout(() => setSavedNotice(null), 2600);
  };

  const handleLoadSavedNote = (record: SavedNoteRecord) => {
    setNotes(record.notes);
    setActiveNoteId(record.id);
    setSelectedClass(record.className);
    setSelectedSubject(record.subject);
    setChapterName(record.chapterName || '');
    setNoteType(record.noteType);
    setDesignStyle(record.designStyle);
    setIsEditing(false);
    setError(null);
    setSavedDrawerOpen(false);
  };

  const handleDeleteSavedNote = async (noteId: string) => {
    if (isCloudSignedIn) {
      try {
        await deleteSavedNoteFromDb(noteId);
      } catch {
        setError('Saved note delete nahi ho paya.');
      }
    } else {
      setLocalSavedNotes((prev) => {
        const next = deleteSavedNoteById(prev, noteId);
        persistLocalSavedNotes(next);
        return next;
      });
    }
    if (activeNoteId === noteId) {
      setActiveNoteId(null);
    }
  };

  const handleExportPdf = () => {
    if (!notes) return;
    try {
      const filename = exportNotesToPdf(notes, designStyle);
      setPdfExportNotice(`Exported ${filename}`);
      window.setTimeout(() => setPdfExportNotice(null), 3000);
    } catch {
      setError('PDF export mein issue aaya. Aap Print Notes ya Download .md use kar sakte hain.');
    }
  };

  const handlePrintNotes = () => {
    if (!notes) return;
    window.print();
  };

  // Visual theme tokens for the 4 design styles
  const isHandwritten = designStyle === 'handwritten';
  const isInfographic = designStyle === 'infographic';
  const isMinimal = designStyle === 'minimal';

  const sheetContainerClass = isHandwritten
    ? 'notebook-paper-bg border-2 border-[#1E3A8A]/25 rounded-2xl shadow-sm pl-12 sm:pl-16 pr-5 sm:pr-8 py-6 sm:py-8 text-[#1E293B]'
    : isMinimal
      ? 'bg-white border-2 border-slate-900 rounded-xl p-5 sm:p-8 text-slate-900'
      : isInfographic
        ? 'bg-gradient-to-b from-[#FAF8FF] via-white to-[#F0F7FF] border border-purple-200/90 rounded-2xl shadow-sm overflow-hidden'
        : 'bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden';

  const sectionCardClass = isHandwritten
    ? 'p-4 rounded-xl bg-white/75 border border-dashed border-[#1E3A8A]/30'
    : isMinimal
      ? 'p-4 rounded-lg bg-white border border-slate-300'
      : isInfographic
        ? 'p-5 rounded-2xl bg-white border-2 border-purple-200/80 shadow-2xs'
        : 'p-5 rounded-xl bg-[#F8FAFC] border border-slate-200';

  const sectionHeadingClass = isHandwritten
    ? 'font-handwriting text-2xl sm:text-3xl font-bold text-[#1E3A8A]'
    : isMinimal
      ? 'font-display text-base font-bold text-slate-900 uppercase tracking-wide'
      : isInfographic
        ? 'font-display text-lg font-bold text-[#4C1D95]'
        : 'font-display text-lg font-bold text-[#0B1221]';

  const renderRegenBtn = (sectionKey: NoteRegeneratableSection, label = 'Regenerate') => (
    <button
      type="button"
      disabled={Boolean(regeneratingSection) || loading || !isConfigured}
      onClick={() => void handleRegenerateSection(sectionKey)}
      title={`Regenerate ${sectionKey}`}
      className="no-print inline-flex items-center gap-1 px-2.5 py-1 min-h-[30px] text-[11px] font-semibold text-slate-600 hover:text-[#6D28D9] bg-white/90 hover:bg-[#F5F3FF] border border-slate-200 rounded-lg transition-colors disabled:opacity-50 cursor-pointer shrink-0"
    >
      <RefreshCw
        className={`w-3 h-3 ${regeneratingSection === sectionKey ? 'animate-spin text-[#6D28D9]' : ''}`}
        aria-hidden="true"
      />
      <span>{regeneratingSection === sectionKey ? 'Updating...' : label}</span>
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Hidden File Inputs */}
      <input
        ref={pdfInputRef}
        type="file"
        accept="application/pdf,.pdf"
        onChange={(e) => handleFileInputChange(e, 'pdf')}
        className="hidden"
        aria-label="Upload PDF study document"
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(e) => handleFileInputChange(e, 'image')}
        className="hidden"
        aria-label="Upload study material image"
      />

      {/* Top Studio Controls Panel */}
      <div className="no-print bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        {/* Deep Navy + Purple Studio Header */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-[#0B1221] via-[#131F3A] to-[#1D1B4B] text-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#6D28D9] text-white flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-base sm:text-lg font-bold text-white">
                VIDYORA AI Notes Generator
              </h2>
              <p className="text-xs text-blue-200/90 truncate">
                Topic, Chapter, PDF, Study Photo ya Pasted Text se 8 note formats & 4 visual styles banao
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSavedDrawerOpen((o) => !o)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] text-xs font-semibold text-white bg-white/12 hover:bg-white/20 border border-white/15 rounded-xl transition-colors cursor-pointer"
            >
              <Bookmark className="w-3.5 h-3.5 text-purple-200" aria-hidden="true" />
              <span>Saved Notes ({savedNotes.length})</span>
            </button>
          </div>
        </div>

        {/* Saved Notes Quick Bar (Expandable) */}
        {savedDrawerOpen && (
          <div className="px-5 sm:px-6 py-4 bg-[#F8FAFC] border-b border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BookMarked className="w-4 h-4 text-[#6D28D9]" aria-hidden="true" />
                <h3 className="font-display text-sm font-bold text-[#0B1221]">
                  My Saved Study Notes
                </h3>
                {isCloudSignedIn ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    <Cloud className="w-3 h-3" aria-hidden="true" />
                    Cloud Synced
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={onOpenSignIn}
                    className="text-[11px] font-semibold text-[#6D28D9] hover:text-[#5B21B6] cursor-pointer"
                  >
                    Sign in to sync across devices
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSavedDrawerOpen(false)}
                aria-label="Close saved notes"
                className="p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {savedNotes.length === 0 ? (
              <p className="text-xs text-slate-600 py-2">
                Abhi koi note save nahi hua hai. Notes generate karne ke baad <strong>Save Notes</strong> dabayein!
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto">
                {savedNotes.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3 rounded-xl bg-white border border-slate-200 hover:border-[#6D28D9]/50 flex items-start justify-between gap-2"
                  >
                    <button
                      type="button"
                      onClick={() => handleLoadSavedNote(rec)}
                      className="text-left flex-1 min-w-0 cursor-pointer"
                    >
                      <p className="text-xs font-bold text-[#0B1221] truncate">
                        {rec.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500 truncate">
                        {rec.className} · {rec.subject} · {rec.noteType}
                      </p>
                      <p className="mt-0.5 text-[10px] text-slate-400">
                        Saved {rec.updatedAt}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteSavedNote(rec.id)}
                      aria-label={`Delete saved note ${rec.title}`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleGenerate} className="p-5 sm:p-6 space-y-5">
          {/* Step 1: Input Source Tabs */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                1. Study Input Source
              </span>
              {attachment && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Attached: {attachment.fileName}</span>
                </span>
              )}
            </div>

            <div
              role="tablist"
              aria-label="Notes input source"
              className="grid grid-cols-2 sm:grid-cols-4 gap-2"
            >
              {[
                { id: 'topic' as const, label: 'Topic & Chapter', icon: BookOpen },
                { id: 'pdf' as const, label: 'Upload PDF', icon: FileUp },
                { id: 'image' as const, label: 'Study Image', icon: FileImage },
                { id: 'paste' as const, label: 'Paste Text', icon: Edit3 },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = inputMode === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setInputMode(tab.id)}
                    className={`inline-flex items-center justify-center gap-2 px-3 py-2.5 min-h-[42px] text-xs sm:text-sm font-semibold rounded-xl border transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#0B1221] text-white border-[#0B1221]'
                        : 'bg-[#F8FAFC] text-slate-700 border-slate-200 hover:border-[#6D28D9]/50'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Common Class, Subject, Topic & Chapter Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              <div>
                <label
                  htmlFor="notes-class-select"
                  className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1"
                >
                  Class / Track
                </label>
                <select
                  id="notes-class-select"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-3 py-2.5 min-h-[42px] text-sm font-semibold text-[#0B1221] bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/30 focus:border-[#6D28D9]"
                >
                  {NOTE_CLASSES.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="notes-subject-select"
                  className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1"
                >
                  Subject
                </label>
                <select
                  id="notes-subject-select"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-3 py-2.5 min-h-[42px] text-sm font-semibold text-[#0B1221] bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/30 focus:border-[#6D28D9]"
                >
                  {NOTE_SUBJECTS.map((subj) => (
                    <option key={subj} value={subj}>
                      {subj}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="notes-topic-input"
                  className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1"
                >
                  Topic
                </label>
                <input
                  id="notes-topic-input"
                  type="text"
                  maxLength={180}
                  value={topic}
                  onChange={(e) => {
                    setTopic(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="e.g. Ohm's Law, Cell Division"
                  className="w-full px-3.5 py-2.5 min-h-[42px] text-sm text-[#0B1221] bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/30 focus:border-[#6D28D9]"
                />
              </div>

              <div>
                <label
                  htmlFor="notes-chapter-input"
                  className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1"
                >
                  Chapter Name (Optional)
                </label>
                <input
                  id="notes-chapter-input"
                  type="text"
                  maxLength={140}
                  value={chapterName}
                  onChange={(e) => setChapterName(e.target.value)}
                  placeholder="e.g. Chapter 12: Electricity"
                  className="w-full px-3.5 py-2.5 min-h-[42px] text-sm text-[#0B1221] bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/30 focus:border-[#6D28D9]"
                />
              </div>
            </div>

            {/* Mode-Specific Source Panel */}
            {inputMode === 'topic' && (
              <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs">
                <span className="text-slate-500 font-medium">Quick examples:</span>
                {QUICK_TOPICS.map((item) => (
                  <button
                    key={item.topic}
                    type="button"
                    onClick={() => {
                      setTopic(item.topic);
                      setChapterName(item.chapter);
                      setSelectedSubject(item.subject);
                      setError(null);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-[#F8FAFC] hover:bg-[#F5F3FF] border border-slate-200 hover:border-[#6D28D9]/50 text-slate-700 font-medium transition-colors cursor-pointer"
                  >
                    {item.topic}
                  </button>
                ))}
              </div>
            )}

            {inputMode === 'pdf' && (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => handleDropFile(e, 'pdf')}
                className={`p-5 rounded-2xl border-2 border-dashed transition-colors ${
                  dragActive
                    ? 'border-[#6D28D9] bg-[#F5F3FF]'
                    : 'border-slate-300 bg-[#F8FAFC]'
                }`}
              >
                {attachment?.mimeType === 'application/pdf' ? (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#0B1221] truncate">
                          {attachment.fileName}
                        </p>
                        <p className="text-xs text-slate-600">
                          PDF Document · {formatBytes(attachment.sizeBytes)} · Primary source for notes
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => pdfInputRef.current?.click()}
                        className="px-3 py-1.5 min-h-[34px] text-xs font-semibold text-[#0B1221] bg-white border border-slate-200 hover:bg-slate-100 rounded-lg cursor-pointer"
                      >
                        Replace PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => setAttachment(null)}
                        className="px-3 py-1.5 min-h-[34px] text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-2.5">
                    <div className="w-11 h-11 rounded-xl bg-[#EFF6FF] border border-blue-200 text-[#2563EB] flex items-center justify-center mx-auto">
                      <FileUp className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#0B1221]">
                        PDF Document Upload Karein (Chapter PDF, Slides ya Notes)
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Max 6 MB · Gemini PDF ko primary source maan kar structured notes banayega
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => pdfInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] text-xs sm:text-sm font-semibold text-white bg-[#0B1221] hover:bg-[#1E293B] rounded-xl cursor-pointer"
                      >
                        <Upload className="w-4 h-4" aria-hidden="true" />
                        <span>Choose PDF File</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleLoadSamplePdf}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] text-xs font-semibold text-[#6D28D9] bg-white hover:bg-[#F5F3FF] border border-purple-200 rounded-xl cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Load Sample Study PDF</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {inputMode === 'image' && (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => handleDropFile(e, 'image')}
                className={`p-5 rounded-2xl border-2 border-dashed transition-colors ${
                  dragActive
                    ? 'border-[#6D28D9] bg-[#F5F3FF]'
                    : 'border-slate-300 bg-[#F8FAFC]'
                }`}
              >
                {attachment?.mimeType.startsWith('image/') && attachment.previewUrl ? (
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <img
                      src={attachment.previewUrl}
                      alt="Uploaded study material preview"
                      className="max-h-36 w-auto rounded-xl border border-slate-200 bg-white object-contain"
                    />
                    <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left">
                      <p className="text-sm font-bold text-[#0B1221] truncate">
                        {attachment.fileName}
                      </p>
                      <p className="text-xs text-slate-600">
                        Study Material Image · {formatBytes(attachment.sizeBytes)} · Primary source
                      </p>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <button
                          type="button"
                          onClick={() => imageInputRef.current?.click()}
                          className="px-3 py-1.5 min-h-[34px] text-xs font-semibold text-[#0B1221] bg-white border border-slate-200 hover:bg-slate-100 rounded-lg cursor-pointer"
                        >
                          Replace Image
                        </button>
                        <button
                          type="button"
                          onClick={() => setAttachment(null)}
                          className="px-3 py-1.5 min-h-[34px] text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-2.5">
                    <div className="w-11 h-11 rounded-xl bg-[#F5F3FF] border border-purple-200 text-[#6D28D9] flex items-center justify-center mx-auto">
                      <FileImage className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#0B1221]">
                        Textbook Page, Whiteboard ya Handwritten Notes ki Photo Upload Karein
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        PNG, JPG, WebP · Max 4 MB · Uploaded photo permanently store nahi hoti
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] text-xs sm:text-sm font-semibold text-white bg-[#0B1221] hover:bg-[#1E293B] rounded-xl cursor-pointer"
                      >
                        <Upload className="w-4 h-4" aria-hidden="true" />
                        <span>Choose Study Image</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleLoadSampleImage}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] text-xs font-semibold text-[#6D28D9] bg-white hover:bg-[#F5F3FF] border border-purple-200 rounded-xl cursor-pointer"
                      >
                        <FileImage className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Load Sample Study Image</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {inputMode === 'paste' && (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label
                    htmlFor="notes-pasted-text"
                    className="text-xs font-semibold text-slate-700"
                  >
                    Apna Chapter Paragraph, Lecture Transcript ya Summary Paste Karein
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setPastedText(SAMPLE_PASTED_TEXT);
                        setTopic('Newton’s Laws of Motion');
                        setChapterName('Chapter 9: Force and Laws of Motion');
                        setSelectedClass('Class 9');
                        setSelectedSubject('Physics');
                        setError(null);
                      }}
                      className="text-xs font-semibold text-[#6D28D9] hover:text-[#5B21B6] cursor-pointer"
                    >
                      Paste Sample Paragraph
                    </button>
                    {pastedText.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setPastedText('')}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
                      >
                        Clear Text
                      </button>
                    )}
                    <span className="text-[11px] text-slate-500 tabular-nums">
                      {pastedText.length.toLocaleString()} / {NOTES_MAX_PASTED_TEXT_CHARS.toLocaleString()}
                    </span>
                  </div>
                </div>
                <textarea
                  id="notes-pasted-text"
                  rows={5}
                  maxLength={NOTES_MAX_PASTED_TEXT_CHARS}
                  value={pastedText}
                  onChange={(e) => {
                    setPastedText(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Yahan apna study text paste karein... AI isi ko primary source maan kar structured notes tayar karega."
                  className="w-full px-4 py-3 text-sm text-[#0B1221] bg-[#F8FAFC] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/30 focus:border-[#6D28D9] focus:bg-white"
                />
              </div>
            )}
          </div>

          {/* Step 2: 8 Note Types */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#6D28D9]" aria-hidden="true" />
              2. Note Format (8 Types)
            </span>
            <div
              role="radiogroup"
              aria-label="Select note type"
              className="grid grid-cols-2 sm:grid-cols-4 gap-2"
            >
              {NOTE_TYPES.map((nt) => {
                const active = noteType === nt.id;
                return (
                  <button
                    key={nt.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setNoteType(nt.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      active
                        ? 'bg-[#F5F3FF] border-[#6D28D9] ring-1 ring-[#6D28D9]/30'
                        : 'bg-white border-slate-200 hover:border-[#6D28D9]/40'
                    }`}
                  >
                    <p
                      className={`text-xs font-bold leading-snug ${
                        active ? 'text-[#6D28D9]' : 'text-[#0B1221]'
                      }`}
                    >
                      {nt.label}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500 leading-tight">
                      {nt.shortDesc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: 4 Visual Design Styles */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-[#2563EB]" aria-hidden="true" />
              3. Note Design Style (Switchable Anytime)
            </span>
            <div
              role="radiogroup"
              aria-label="Select note design style"
              className="grid grid-cols-2 lg:grid-cols-4 gap-2"
            >
              {NOTE_DESIGN_STYLES.map((st) => {
                const active = designStyle === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setDesignStyle(st.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      active
                        ? 'bg-[#0B1221] text-white border-[#0B1221]'
                        : 'bg-white text-[#0B1221] border-slate-200 hover:border-[#6D28D9]/50'
                    }`}
                  >
                    <p className="text-xs font-bold">{st.label}</p>
                    <p
                      className={`mt-0.5 text-[11px] leading-tight ${
                        active ? 'text-blue-200' : 'text-slate-500'
                      }`}
                    >
                      {st.shortDesc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm flex items-start gap-2.5"
            >
              <AlertCircle
                className="w-4 h-4 text-rose-600 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <span className="flex-1 leading-relaxed">{error}</span>
            </div>
          )}

          {/* Submit Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-start gap-2 text-xs text-slate-600">
              <ShieldCheck
                className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <span>
                Uploaded PDF/images primary source ke roop mein analyze hoti hain — fake page numbers kabhi nahi bante.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[48px] text-sm font-bold text-white bg-[#6D28D9] hover:bg-[#5B21B6] disabled:bg-slate-300 rounded-xl transition-colors cursor-pointer shrink-0 shadow-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Generating Smart Notes...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" aria-hidden="true" />
                  <span>Generate {noteType}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-2xl border border-purple-200 p-10 text-center space-y-3 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-[#F5F3FF] border border-purple-200 text-[#6D28D9] flex items-center justify-center mx-auto">
            <Loader2 className="w-7 h-7 animate-spin" aria-hidden="true" />
          </div>
          <h3 className="font-display text-lg font-bold text-[#0B1221]">
            {attachment
              ? `${attachment.fileName} padh kar ${noteType} bana raha hoon...`
              : `${topic || chapterName || 'Study material'} ke liye ${noteType} tayar ho rahe hain...`}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
            Accurate formulas, headings, definitions, examples, tables, diagrams aur common mistakes neatly structure kiye ja rahe hain.
          </p>
        </div>
      )}

      {/* Empty Preview State */}
      {!notes && !loading && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-[#EFF6FF] border border-blue-200 text-[#2563EB] flex items-center justify-center mx-auto">
            <BookOpen className="w-7 h-7" aria-hidden="true" />
          </div>
          <div className="max-w-lg mx-auto space-y-1.5">
            <h3 className="font-display text-lg sm:text-xl font-bold text-[#0B1221]">
              Beautiful Exam-Ready Note Preview Yahan Dikhega
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Upar se koi bhi topic, PDF, study photo ya text choose karein — phir generated notes ko live edit karein, styles badlein, save karein ya PDF export karein.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-2xl mx-auto text-left">
            {[
              'Headings & Definitions',
              'Accurate Math Formulas',
              'Tables & Visual Diagrams',
              'Mind Maps & Q&A Notes',
              'Common Exam Mistakes',
              'Inline Live Editing',
              'Section Regeneration',
              'Print & Real PDF Export',
            ].map((feat) => (
              <div
                key={feat}
                className="px-3 py-2 rounded-xl bg-[#F8FAFC] border border-slate-200 text-xs font-medium text-slate-700 flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5 text-[#6D28D9] shrink-0" aria-hidden="true" />
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generated Note Preview + Full Editing & Export Toolbar */}
      {notes && !loading && (
        <div className="space-y-4">
          {/* Action Toolbar */}
          <div className="no-print bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditing((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                  isEditing
                    ? 'bg-[#6D28D9] text-white border-[#6D28D9]'
                    : 'bg-[#F8FAFC] text-[#0B1221] border-slate-200 hover:border-[#6D28D9]/50'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{isEditing ? 'Done Editing' : 'Edit Notes'}</span>
              </button>

              <button
                type="button"
                onClick={() => void handleCopyNotes()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                    <span className="text-emerald-700">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Copy Notes</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => void handleSaveNotes()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{savedNotice || 'Save Notes'}</span>
              </button>

              <button
                type="button"
                onClick={handlePrintNotes}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Print</span>
              </button>

              <button
                type="button"
                onClick={handleExportPdf}
                className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[38px] text-xs font-bold text-white bg-[#0B1221] hover:bg-[#1E293B] rounded-xl transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{pdfExportNotice || 'Export PDF'}</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  downloadTextFile(
                    `${notes.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-vidyora-notes.md`,
                    formatRichNotesAsMarkdown(notes)
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[38px] text-xs font-semibold text-slate-600 hover:text-[#0B1221] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                <span>.md</span>
              </button>
            </div>

            {/* Live Design Style Switcher */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {NOTE_DESIGN_STYLES.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setDesignStyle(st.id)}
                  className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-lg border transition-colors cursor-pointer ${
                    designStyle === st.id
                      ? 'bg-[#6D28D9] text-white border-[#6D28D9]'
                      : 'bg-white text-slate-600 border-slate-200 hover:text-[#0B1221]'
                  }`}
                >
                  {st.label.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Printable & Styled Note Sheet */}
          <article id="vidyora-printable-note" className={sheetContainerClass}>
            {/* Note Sheet Header */}
            <div
              className={
                isHandwritten
                  ? 'pb-5 border-b-2 border-dashed border-[#1E3A8A]/30 space-y-2'
                  : isMinimal
                    ? 'pb-4 border-b-2 border-slate-900 space-y-2'
                    : isInfographic
                      ? 'px-6 py-6 bg-gradient-to-r from-[#0B1221] via-[#3B0764] to-[#1D4ED8] text-white space-y-2'
                      : 'px-6 py-6 bg-[#0B1221] text-white space-y-2'
              }
            >
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span
                  className={
                    isHandwritten
                      ? 'px-2.5 py-0.5 rounded bg-[#FEF08A] text-[#1E3A8A]'
                      : isMinimal
                        ? 'px-2 py-0.5 border border-slate-900 text-slate-900'
                        : 'px-2.5 py-0.5 rounded-md bg-white/15 text-purple-200'
                  }
                >
                  {notes.className || notes.level}
                </span>
                {notes.subject && (
                  <span
                    className={
                      isHandwritten
                        ? 'text-[#6D28D9]'
                        : isMinimal
                          ? 'text-slate-700'
                          : 'text-blue-200'
                    }
                  >
                    · {notes.subject}
                  </span>
                )}
                {notes.chapterName && (
                  <span
                    className={
                      isHandwritten
                        ? 'text-slate-700'
                        : isMinimal
                          ? 'text-slate-700'
                          : 'text-slate-300'
                    }
                  >
                    · {notes.chapterName}
                  </span>
                )}
                <span
                  className={`ml-auto px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                    isHandwritten
                      ? 'bg-[#EFF6FF] text-[#1E3A8A]'
                      : isMinimal
                        ? 'bg-slate-100 text-slate-900'
                        : 'bg-[#6D28D9] text-white'
                  }`}
                >
                  {notes.noteType || noteType}
                </span>
              </div>

              {isEditing ? (
                <input
                  type="text"
                  aria-label="Edit note title"
                  value={notes.title}
                  onChange={(e) => setNotes({ ...notes, title: e.target.value })}
                  className="w-full px-3 py-2 text-xl sm:text-2xl font-bold rounded-xl bg-white text-[#0B1221] border border-purple-300 focus:outline-none"
                />
              ) : (
                <h2
                  className={
                    isHandwritten
                      ? 'font-handwriting text-3xl sm:text-4xl font-bold text-[#1E3A8A] leading-tight'
                      : isMinimal
                        ? 'font-display text-2xl sm:text-3xl font-bold text-slate-900'
                        : 'font-display text-2xl sm:text-3xl font-bold text-white'
                  }
                >
                  {formatMathUnicode(notes.title)}
                </h2>
              )}
            </div>

            {/* Sheet Body */}
            <div
              className={
                isHandwritten || isMinimal
                  ? 'pt-5 space-y-6'
                  : 'p-5 sm:p-7 space-y-6'
              }
            >
              {/* Primary Source Attribution & Uncertainty Flags */}
              {notes.sourceUsed && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2.5">
                  <ShieldCheck
                    className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-bold">
                      Primary Source Grounded Notes
                    </p>
                    <p className="mt-0.5 leading-relaxed">
                      {notes.sourceSummary ||
                        'Yeh notes aapke uploaded study material ko primary source maan kar banaye gaye hain. Extra AI explanations ko alag se mark kiya gaya hai.'}
                    </p>
                  </div>
                </div>
              )}

              {notes.uncertaintyFlags && notes.uncertaintyFlags.length > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start gap-2.5">
                  <AlertTriangle
                    className="w-4 h-4 text-amber-700 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div className="space-y-1">
                    <p className="font-bold">Verification & Missing Info Notes</p>
                    <ul className="space-y-0.5">
                      {notes.uncertaintyFlags.map((flag, idx) => (
                        <li key={idx}>• {flag}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* 1. Overview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className={sectionHeadingClass}>Overview</h3>
                  {renderRegenBtn('overview')}
                </div>
                {isEditing ? (
                  <textarea
                    rows={3}
                    aria-label="Edit overview"
                    value={notes.overview}
                    onChange={(e) => setNotes({ ...notes, overview: e.target.value })}
                    className="w-full p-3 text-sm bg-white border border-purple-300 rounded-xl text-[#0B1221]"
                  />
                ) : (
                  <p className="text-sm sm:text-[15px] leading-relaxed text-slate-700">
                    {formatMathUnicode(notes.overview)}
                  </p>
                )}
              </div>

              {/* 2. Core Concept Sections */}
              {notes.sections.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={sectionHeadingClass}>Key Concepts & Headings</h3>
                    <div className="flex items-center gap-2">
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() =>
                            setNotes({
                              ...notes,
                              sections: [
                                ...notes.sections,
                                { heading: 'New Concept Heading', points: ['New key point'] },
                              ],
                            })
                          }
                          className="no-print inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#6D28D9] bg-[#F5F3FF] border border-purple-200 rounded-lg cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Add Section</span>
                        </button>
                      )}
                      {renderRegenBtn('sections')}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {notes.sections.map((sec, sIdx) => (
                      <div key={sIdx} className={sectionCardClass}>
                        <div className="flex items-start justify-between gap-2">
                          {isEditing ? (
                            <input
                              type="text"
                              value={sec.heading}
                              onChange={(e) => {
                                const next = notes.sections.map((item, idx) =>
                                  idx === sIdx ? { ...item, heading: e.target.value } : item
                                );
                                setNotes({ ...notes, sections: next });
                              }}
                              className="flex-1 px-2.5 py-1.5 text-sm font-bold bg-white border border-purple-300 rounded-lg text-[#0B1221]"
                            />
                          ) : (
                            <h4
                              className={
                                isHandwritten
                                  ? 'font-handwriting text-2xl font-bold text-[#1E3A8A]'
                                  : 'font-display text-base font-bold text-[#0B1221]'
                              }
                            >
                              {formatMathUnicode(sec.heading)}
                            </h4>
                          )}

                          {sec.sourceTag && (
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-md shrink-0 ${
                                sec.sourceTag === 'From Source'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-purple-100 text-purple-800'
                              }`}
                            >
                              {sec.sourceTag}
                            </span>
                          )}
                        </div>

                        <ul className="mt-3 space-y-2 text-sm text-slate-700">
                          {sec.points.map((pt, pIdx) => (
                            <li key={pIdx} className="flex items-start gap-2 leading-relaxed">
                              <span
                                className={`font-bold shrink-0 ${
                                  isMinimal ? 'text-slate-900' : 'text-[#6D28D9]'
                                }`}
                                aria-hidden="true"
                              >
                                •
                              </span>
                              {isEditing ? (
                                <div className="flex-1 flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    value={pt}
                                    onChange={(e) => {
                                      const next = notes.sections.map((item, idx) =>
                                        idx === sIdx
                                          ? {
                                              ...item,
                                              points: item.points.map((p, j) =>
                                                j === pIdx ? e.target.value : p
                                              ),
                                            }
                                          : item
                                      );
                                      setNotes({ ...notes, sections: next });
                                    }}
                                    className="flex-1 px-2.5 py-1 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-[#0B1221]"
                                  />
                                  <button
                                    type="button"
                                    aria-label="Remove bullet point"
                                    onClick={() => {
                                      const next = notes.sections.map((item, idx) =>
                                        idx === sIdx
                                          ? {
                                              ...item,
                                              points: item.points.filter((_, j) => j !== pIdx),
                                            }
                                          : item
                                      );
                                      setNotes({ ...notes, sections: next });
                                    }}
                                    className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                                  >
                                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                                  </button>
                                </div>
                              ) : (
                                <span>{formatMathUnicode(pt)}</span>
                              )}
                            </li>
                          ))}
                        </ul>

                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => {
                              const next = notes.sections.map((item, idx) =>
                                idx === sIdx
                                  ? { ...item, points: [...item.points, 'New study point'] }
                                  : item
                              );
                              setNotes({ ...notes, sections: next });
                            }}
                            className="mt-2.5 text-xs font-semibold text-[#6D28D9] hover:text-[#5B21B6] cursor-pointer"
                          >
                            + Add Bullet Point
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Key Formulas */}
              {notes.formulas && notes.formulas.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={sectionHeadingClass}>Key Formulas & Equations</h3>
                    {renderRegenBtn('formulas')}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {notes.formulas.map((f, idx) => (
                      <div
                        key={idx}
                        className={
                          isHandwritten
                            ? 'p-4 rounded-xl bg-[#FEF9C3]/75 border border-dashed border-[#1E3A8A]/40'
                            : isMinimal
                              ? 'p-4 rounded-lg bg-white border border-slate-900'
                              : 'p-4 rounded-xl bg-[#F5F3FF] border border-purple-200'
                        }
                      >
                        {isEditing ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={f.name}
                              onChange={(e) => {
                                const next = (notes.formulas || []).map((item, i) =>
                                  i === idx ? { ...item, name: e.target.value } : item
                                );
                                setNotes({ ...notes, formulas: next });
                              }}
                              className="w-full px-2.5 py-1 text-xs font-bold bg-white border border-slate-300 rounded-lg"
                            />
                            <input
                              type="text"
                              value={f.expression}
                              onChange={(e) => {
                                const next = (notes.formulas || []).map((item, i) =>
                                  i === idx ? { ...item, expression: e.target.value } : item
                                );
                                setNotes({ ...notes, formulas: next });
                              }}
                              className="w-full px-2.5 py-1.5 font-mono text-sm font-bold bg-white border border-purple-300 rounded-lg"
                            />
                            <input
                              type="text"
                              value={f.variables}
                              onChange={(e) => {
                                const next = (notes.formulas || []).map((item, i) =>
                                  i === idx ? { ...item, variables: e.target.value } : item
                                );
                                setNotes({ ...notes, formulas: next });
                              }}
                              className="w-full px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg"
                            />
                          </div>
                        ) : (
                          <>
                            <p className="text-xs font-bold uppercase tracking-wider text-[#6D28D9]">
                              {formatMathUnicode(f.name)}
                            </p>
                            <div className="mt-1.5 px-3 py-2 rounded-lg bg-white border border-purple-200/80 font-mono text-sm sm:text-base font-bold text-[#0B1221] overflow-x-auto">
                              {formatMathUnicode(f.expression)}
                            </div>
                            {f.variables && (
                              <p className="mt-2 text-xs text-slate-700">
                                <strong>Variables:</strong> {formatMathUnicode(f.variables)}
                              </p>
                            )}
                            {f.usage && (
                              <p className="mt-1 text-xs text-slate-600">
                                <strong>Use:</strong> {formatMathUnicode(f.usage)}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Visual Diagram */}
              {notes.diagram && notes.diagram.nodes.length >= 2 && (
                <div className={`${sectionCardClass} space-y-3`}>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={sectionHeadingClass}>Visual Concept Diagram</h3>
                    {renderRegenBtn('diagram')}
                  </div>
                  <NoteDiagramView diagram={notes.diagram} designStyle={designStyle} />
                </div>
              )}

              {/* 5. Visual Mind Map */}
              {notes.mindMap && notes.mindMap.branches.length > 0 && (
                <div className={`${sectionCardClass} space-y-3`}>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={sectionHeadingClass}>Concept Mind Map</h3>
                    {renderRegenBtn('mindMap')}
                  </div>
                  <NoteMindMapView mindMap={notes.mindMap} designStyle={designStyle} />
                </div>
              )}

              {/* 6. Definitions */}
              {notes.definitions.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={sectionHeadingClass}>Important Definitions</h3>
                    {renderRegenBtn('definitions')}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {notes.definitions.map((def, idx) => (
                      <div
                        key={idx}
                        className={
                          isHandwritten
                            ? 'p-4 rounded-xl bg-white/80 border border-dashed border-[#2563EB]/40'
                            : isMinimal
                              ? 'p-3.5 rounded-lg bg-white border border-slate-300'
                              : 'p-4 rounded-xl bg-[#EFF6FF] border border-blue-200/80'
                        }
                      >
                        {isEditing ? (
                          <div className="space-y-1.5">
                            <input
                              type="text"
                              value={def.term}
                              onChange={(e) => {
                                const next = notes.definitions.map((d, i) =>
                                  i === idx ? { ...d, term: e.target.value } : d
                                );
                                setNotes({ ...notes, definitions: next });
                              }}
                              className="w-full px-2.5 py-1 text-sm font-bold bg-white border border-slate-300 rounded-lg"
                            />
                            <textarea
                              rows={2}
                              value={def.definition}
                              onChange={(e) => {
                                const next = notes.definitions.map((d, i) =>
                                  i === idx ? { ...d, definition: e.target.value } : d
                                );
                                setNotes({ ...notes, definitions: next });
                              }}
                              className="w-full px-2.5 py-1 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg"
                            />
                          </div>
                        ) : (
                          <>
                            <p className="text-sm font-bold text-[#0B1221]">
                              {formatMathUnicode(def.term)}
                            </p>
                            <p className="mt-1 text-xs sm:text-sm text-slate-700 leading-relaxed">
                              {formatMathUnicode(def.definition)}
                            </p>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 7. Comparison & Reference Tables */}
              {notes.tables && notes.tables.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={sectionHeadingClass}>Quick Comparison Tables</h3>
                    {renderRegenBtn('tables')}
                  </div>
                  <div className="space-y-4">
                    {notes.tables.map((tbl, tIdx) => (
                      <div
                        key={tIdx}
                        className="rounded-xl border border-slate-200 overflow-hidden bg-white"
                      >
                        <div
                          className={`px-4 py-2.5 text-xs sm:text-sm font-bold ${
                            isMinimal
                              ? 'bg-slate-100 text-slate-900 border-b border-slate-300'
                              : 'bg-[#0B1221] text-white'
                          }`}
                        >
                          {formatMathUnicode(tbl.title)}
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs sm:text-sm">
                            <thead>
                              <tr className="bg-[#F8FAFC] border-b border-slate-200">
                                {tbl.headers.map((h, hIdx) => (
                                  <th
                                    key={hIdx}
                                    className="px-4 py-2.5 font-bold text-[#0B1221] whitespace-nowrap"
                                  >
                                    {formatMathUnicode(h)}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {tbl.rows.map((row, rIdx) => (
                                <tr key={rIdx} className="hover:bg-slate-50/70">
                                  {row.map((cell, cIdx) => (
                                    <td
                                      key={cIdx}
                                      className="px-4 py-2.5 text-slate-700 leading-snug"
                                    >
                                      {formatMathUnicode(cell)}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 8. Examples */}
              {notes.examples.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={sectionHeadingClass}>Examples</h3>
                    {renderRegenBtn('examples')}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {notes.examples.map((ex, idx) => (
                      <div key={idx} className={sectionCardClass}>
                        <p className="text-sm font-bold text-[#6D28D9]">
                          {formatMathUnicode(ex.title)}
                        </p>
                        <p className="mt-1 text-xs sm:text-sm text-slate-700 leading-relaxed">
                          {formatMathUnicode(ex.explanation)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 9. Exam Question & Answer Notes */}
              {notes.qaPairs && notes.qaPairs.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={sectionHeadingClass}>Question & Answer Notes</h3>
                    {renderRegenBtn('qaPairs')}
                  </div>
                  <div className="space-y-2.5">
                    {notes.qaPairs.map((qa, idx) => (
                      <div key={idx} className={sectionCardClass}>
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-bold text-[#0B1221]">
                            Q{idx + 1}. {formatMathUnicode(qa.question)}
                          </p>
                          {qa.marksHint && (
                            <span className="px-2 py-0.5 text-[11px] font-bold bg-[#EFF6FF] text-[#1E3A8A] border border-blue-200 rounded-md shrink-0">
                              {qa.marksHint}
                            </span>
                          )}
                        </div>
                        <p className="mt-1.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
                          <strong className="text-[#6D28D9]">Ans:</strong>{' '}
                          {formatMathUnicode(qa.answer)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 10. Common Mistakes to Avoid */}
              {notes.commonMistakes && notes.commonMistakes.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={sectionHeadingClass}>Common Mistakes to Avoid</h3>
                    {renderRegenBtn('commonMistakes')}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {notes.commonMistakes.map((cm, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 space-y-1.5"
                      >
                        <p className="text-xs sm:text-sm font-bold text-rose-900">
                          ✕ Mistake: {formatMathUnicode(cm.mistake)}
                        </p>
                        <p className="text-xs sm:text-sm text-emerald-900 font-medium">
                          ✓ Correct: {formatMathUnicode(cm.correction)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 11. Additional AI Explanations (Distinct from Uploaded Source) */}
              {notes.additionalExplanations && notes.additionalExplanations.length > 0 && (
                <div className="p-4 sm:p-5 rounded-xl bg-[#F5F3FF]/80 border border-purple-200 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-[#6D28D9] shrink-0" aria-hidden="true" />
                    <h3 className="font-display text-sm sm:text-base font-bold text-[#4C1D95]">
                      Additional AI Explanations (Beyond Uploaded Source)
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {notes.additionalExplanations.map((extra, idx) => (
                      <div key={idx} className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                        <strong className="text-[#0B1221]">
                          {formatMathUnicode(extra.title)}:
                        </strong>{' '}
                        {formatMathUnicode(extra.explanation)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 12. Important Exam Points + Revision Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {notes.importantPoints.length > 0 && (
                  <div className={`lg:col-span-6 ${sectionCardClass}`}>
                    <h3 className={sectionHeadingClass}>Important Exam Points</h3>
                    <ul className="mt-3 space-y-2 text-xs sm:text-sm text-slate-700">
                      {notes.importantPoints.map((pt, idx) => (
                        <li key={idx} className="flex gap-2 leading-relaxed">
                          <span className="text-[#2563EB] font-bold" aria-hidden="true">
                            •
                          </span>
                          <span>{formatMathUnicode(pt)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div
                  className={`${
                    notes.importantPoints.length > 0 ? 'lg:col-span-6' : 'lg:col-span-12'
                  } p-5 rounded-xl space-y-2.5 ${
                    isMinimal
                      ? 'bg-slate-100 border-2 border-slate-900 text-slate-900'
                      : isHandwritten
                        ? 'bg-[#FEF08A]/70 border-2 border-dashed border-[#1E3A8A]/40 text-[#1E293B]'
                        : 'bg-[#0B1221] text-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3
                      className={
                        isHandwritten
                          ? 'font-handwriting text-2xl font-bold text-[#1E3A8A]'
                          : isMinimal
                            ? 'font-display text-base font-bold text-slate-900 uppercase'
                            : 'font-display text-base font-bold text-blue-200'
                      }
                    >
                      Quick Revision Summary
                    </h3>
                    {renderRegenBtn('revisionSummary')}
                  </div>
                  {isEditing ? (
                    <textarea
                      rows={4}
                      aria-label="Edit revision summary"
                      value={notes.revisionSummary}
                      onChange={(e) =>
                        setNotes({ ...notes, revisionSummary: e.target.value })
                      }
                      className="w-full p-3 text-sm bg-white border border-purple-300 rounded-xl text-[#0B1221]"
                    />
                  ) : (
                    <p
                      className={`text-xs sm:text-sm leading-relaxed ${
                        isMinimal || isHandwritten ? 'text-slate-800' : 'text-slate-200'
                      }`}
                    >
                      {formatMathUnicode(notes.revisionSummary)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </article>
        </div>
      )}
    </div>
  );
}
