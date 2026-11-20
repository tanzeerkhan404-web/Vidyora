import type {
  AIStatusResponse,
  DoubtSolution,
  DoubtSolverSubject,
  DoubtSolveStyle,
  GeneratedNotes,
  GeneratedQuiz,
  GeneratedStudyPlan,
  LearningLevel,
  NoteRegeneratableSection,
  NoteType,
  QuizDifficulty,
  QuizQuestionType,
  QuizTrack,
  StudyBuddyLevel,
  StudyBuddyMode,
  StudyBuddySubject,
} from '../types/vidyora';

export class APIRequestError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code = 'API_ERROR') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function postJSON<T>(url: string, body: Record<string, unknown>): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 45_000);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new APIRequestError(
        data.error || 'Server se response nahi mila. Thodi der baad try karein.',
        res.status,
        data.code || 'HTTP_ERROR'
      );
    }
    return data as T;
  } catch (err) {
    if (err instanceof APIRequestError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new APIRequestError(
        'Request timeout ho gayi. Kripya internet check karein aur thodi der baad dobara try karein.',
        504,
        'CLIENT_TIMEOUT'
      );
    }
    throw err;
  } finally {
    window.clearTimeout(timer);
  }
}

export async function fetchAIStatus(): Promise<AIStatusResponse> {
  const res = await fetch('/api/ai/status');
  if (!res.ok) {
    return {
      configured: false,
      model: 'gemini-4-hydrogen',
      rateLimit: {
        maxRequests: 15,
        windowMinutes: 15,
        remaining: 0,
        dailyLimit: 40,
        dailyRemaining: 0,
      },
      disclaimer:
        'AI answers sirf learning aur revision ke liye hain — important exams ke liye textbook ya teacher se zaroor verify karein.',
    };
  }
  return (await res.json()) as AIStatusResponse;
}

export function requestStudyBuddy(payload: {
  question: string;
  level: StudyBuddyLevel | LearningLevel;
  mode: StudyBuddyMode;
  subject: StudyBuddySubject;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
}) {
  return postJSON<{
    answer: string;
    remaining: number;
    dailyRemaining: number;
    dailyLimit: number;
    disclaimer: string;
  }>('/api/ai/study-buddy', payload);
}

export function requestDoubtSolver(payload: {
  imageBase64: string;
  mimeType: string;
  note?: string;
  level: LearningLevel | StudyBuddyLevel;
  subject: DoubtSolverSubject;
  solveStyle?: DoubtSolveStyle;
}) {
  return postJSON<{
    solution: DoubtSolution;
    remaining: number;
    dailyRemaining: number;
    dailyLimit: number;
    disclaimer: string;
  }>('/api/ai/doubt-solver', payload);
}

export function requestNotesGenerator(payload: {
  topic?: string;
  chapterName?: string;
  className?: string;
  subject?: string;
  level?: LearningLevel;
  noteType: NoteType;
  pastedText?: string;
  attachment?: {
    base64: string;
    mimeType: 'application/pdf' | 'image/png' | 'image/jpeg' | 'image/webp';
    fileName?: string;
  };
}) {
  return postJSON<{
    notes: GeneratedNotes;
    remaining: number;
    dailyRemaining: number;
    dailyLimit: number;
    disclaimer: string;
  }>('/api/ai/notes', payload);
}

export function requestRegenerateNoteSection(payload: {
  sectionKey: NoteRegeneratableSection;
  title: string;
  className: string;
  subject: string;
  noteType: string;
  contextSummary: string;
  instruction?: string;
}) {
  return postJSON<{
    patch: Partial<GeneratedNotes>;
    remaining: number;
    dailyRemaining: number;
    dailyLimit: number;
    disclaimer: string;
  }>('/api/ai/notes/regenerate-section', payload);
}

export function requestQuizGenerator(payload: {
  topic: string;
  chapterName?: string;
  subject?: string;
  track?: QuizTrack;
  level: string;
  count: number;
  difficulty?: QuizDifficulty;
  questionTypes?: QuizQuestionType[];
  timerMinutes?: number;
}) {
  return postJSON<{
    quiz: GeneratedQuiz;
    remaining: number;
    dailyRemaining: number;
    dailyLimit: number;
    disclaimer: string;
  }>('/api/ai/quiz', payload);
}

export function requestStudyPlanner(payload: {
  goal: string;
  level: LearningLevel;
  timelineDays: number;
  dailyHours: number;
  focusSubjects?: string;
}) {
  return postJSON<{
    plan: GeneratedStudyPlan;
    remaining: number;
    dailyRemaining: number;
    disclaimer: string;
  }>('/api/ai/study-planner', payload);
}

export function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
