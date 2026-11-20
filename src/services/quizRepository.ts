import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import type {
  GeneratedQuiz,
  PublishedQuizRecord,
  QuizAttemptRecord,
  QuizDifficulty,
  QuizTrack,
} from '../types/vidyora';
import { sanitizeQuizForStorage } from '../utils/quizLogic';
import { sanitizeChatTextForStorage } from '../utils/studyBuddyLogic';

const QUIZ_ATTEMPTS_PATH = 'quiz_attempts';
const PUBLISHED_QUIZZES_PATH = 'published_quizzes';

function mapDocToQuizAttempt(
  id: string,
  data: Record<string, unknown>
): (QuizAttemptRecord & { sortMs: number }) | null {
  try {
    const rawJson = typeof data.payloadJson === 'string' ? data.payloadJson : '';
    const parsed = rawJson ? (JSON.parse(rawJson) as Partial<QuizAttemptRecord>) : {};
    const ts = data.createdAt as { toMillis?: () => number; toDate?: () => Date } | undefined;
    const sortMs = typeof ts?.toMillis === 'function' ? ts.toMillis() : Date.now();
    const completedLabel =
      typeof ts?.toDate === 'function'
        ? ts.toDate().toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        : parsed.completedAt || 'Saved';

    return {
      id,
      title: typeof data.title === 'string' ? data.title : parsed.title,
      topic: typeof data.topic === 'string' ? data.topic : parsed.topic || 'Practice Quiz',
      subject: typeof data.subject === 'string' ? data.subject : parsed.subject,
      level: typeof data.level === 'string' ? data.level : parsed.level,
      difficulty: (data.difficulty as QuizDifficulty) || parsed.difficulty || 'Mixed',
      score: typeof data.score === 'number' ? data.score : parsed.score || 0,
      correct: typeof parsed.correct === 'number' ? parsed.correct : Number(data.score || 0),
      incorrect: typeof parsed.incorrect === 'number' ? parsed.incorrect : 0,
      unanswered: typeof parsed.unanswered === 'number' ? parsed.unanswered : 0,
      total: typeof data.total === 'number' ? data.total : parsed.total || 1,
      percentage: typeof data.percentage === 'number' ? data.percentage : parsed.percentage || 0,
      timeTakenSeconds:
        typeof data.timeTakenSeconds === 'number'
          ? data.timeTakenSeconds
          : parsed.timeTakenSeconds || 0,
      weakTopics: Array.isArray(parsed.weakTopics) ? parsed.weakTopics : [],
      completedAt: completedLabel,
      quizSnapshot: parsed.quizSnapshot,
      source: 'cloud',
      sortMs,
    };
  } catch {
    return null;
  }
}

export function subscribeUserQuizAttempts(
  uid: string,
  onData: (attempts: QuizAttemptRecord[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, QUIZ_ATTEMPTS_PATH), where('userId', '==', uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const records = snapshot.docs
        .map((d) => mapDocToQuizAttempt(d.id, d.data() as Record<string, unknown>))
        .filter((item): item is QuizAttemptRecord & { sortMs: number } => item !== null)
        .sort((a, b) => b.sortMs - a.sortMs)
        .map(({ sortMs: _ignore, ...rec }) => rec);
      onData(records);
    },
    (error) => {
      if (onError) {
        onError(error);
      } else {
        handleFirestoreError(error, OperationType.LIST, QUIZ_ATTEMPTS_PATH);
      }
    }
  );
}

export async function saveQuizAttemptToDb(
  uid: string,
  record: QuizAttemptRecord
): Promise<void> {
  const safeId =
    record.id.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 100) || `attempt-${Date.now()}`;
  const docPath = `${QUIZ_ATTEMPTS_PATH}/${safeId}`;

  const cleanSnapshot = record.quizSnapshot
    ? sanitizeQuizForStorage(record.quizSnapshot)
    : undefined;

  let payloadJson = JSON.stringify({
    correct: record.correct ?? record.score,
    incorrect: record.incorrect ?? 0,
    unanswered: record.unanswered ?? 0,
    weakTopics: (record.weakTopics || []).slice(0, 12),
    completedAt: record.completedAt,
    quizSnapshot: cleanSnapshot,
  });

  if (payloadJson.length > 58000) {
    payloadJson = JSON.stringify({
      correct: record.correct ?? record.score,
      incorrect: record.incorrect ?? 0,
      unanswered: record.unanswered ?? 0,
      weakTopics: (record.weakTopics || []).slice(0, 8),
      completedAt: record.completedAt,
    });
  }

  const safeTitle =
    sanitizeChatTextForStorage(record.title || record.topic).trim().slice(0, 160) ||
    'Practice Quiz';
  const safeTopic =
    sanitizeChatTextForStorage(record.topic).trim().slice(0, 160) || 'Practice Quiz';
  const safeSubject = (record.subject || 'General Studies').trim().slice(0, 80);
  const safeLevel = (record.level || 'Class 10').trim().slice(0, 60);
  const safeDifficulty: QuizDifficulty =
    record.difficulty && ['Easy', 'Medium', 'Hard', 'Mixed'].includes(record.difficulty)
      ? record.difficulty
      : 'Mixed';

  try {
    await setDoc(doc(db, QUIZ_ATTEMPTS_PATH, safeId), {
      userId: uid,
      title: safeTitle,
      topic: safeTopic,
      subject: safeSubject,
      level: safeLevel,
      difficulty: safeDifficulty,
      score: Math.max(0, Math.min(50, Number(record.score) || 0)),
      total: Math.max(1, Math.min(50, Number(record.total) || 1)),
      percentage: Math.max(0, Math.min(100, Number(record.percentage) || 0)),
      timeTakenSeconds: Math.max(0, Math.min(86400, Number(record.timeTakenSeconds) || 0)),
      payloadJson,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, docPath);
  }
}

export async function deleteQuizAttemptFromDb(attemptId: string): Promise<void> {
  const docPath = `${QUIZ_ATTEMPTS_PATH}/${attemptId}`;
  try {
    await deleteDoc(doc(db, QUIZ_ATTEMPTS_PATH, attemptId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

function mapDocToPublishedQuiz(
  id: string,
  data: Record<string, unknown>
): (PublishedQuizRecord & { sortMs: number }) | null {
  try {
    const rawJson = typeof data.payloadJson === 'string' ? data.payloadJson : '';
    if (!rawJson) return null;
    const parsedQuiz = JSON.parse(rawJson) as GeneratedQuiz;
    if (!parsedQuiz || !Array.isArray(parsedQuiz.questions) || parsedQuiz.questions.length === 0) {
      return null;
    }

    const ts = data.updatedAt as { toMillis?: () => number; toDate?: () => Date } | undefined;
    const sortMs = typeof ts?.toMillis === 'function' ? ts.toMillis() : Date.now();
    const updatedLabel =
      typeof ts?.toDate === 'function'
        ? ts.toDate().toLocaleDateString([], { month: 'short', day: 'numeric' })
        : 'Published';

    const title = typeof data.title === 'string' ? data.title : parsedQuiz.title || parsedQuiz.topic;
    const track = (['school', 'college', 'competitive'].includes(String(data.track))
      ? data.track
      : 'school') as QuizTrack;
    const level = typeof data.level === 'string' ? data.level : parsedQuiz.level || 'Class 10';
    const subject = typeof data.subject === 'string' ? data.subject : parsedQuiz.subject || 'General';
    const chapterName = typeof data.chapterName === 'string' ? data.chapterName : undefined;
    const topic = typeof data.topic === 'string' ? data.topic : parsedQuiz.topic;
    const difficulty = (['Easy', 'Medium', 'Hard', 'Mixed'].includes(String(data.difficulty))
      ? data.difficulty
      : 'Mixed') as QuizDifficulty;
    const timerMinutes = typeof data.timerMinutes === 'number' ? data.timerMinutes : 10;
    const published = Boolean(data.published);

    return {
      id,
      title,
      track,
      level,
      subject,
      chapterName,
      topic,
      difficulty,
      timerMinutes,
      published,
      createdBy: typeof data.createdBy === 'string' ? data.createdBy : '',
      updatedAt: updatedLabel,
      quiz: {
        ...parsedQuiz,
        id,
        title,
        track,
        level,
        subject,
        chapterName,
        topic,
        difficulty,
        timerMinutes,
        published,
        source: 'published',
      },
      sortMs,
    };
  } catch {
    return null;
  }
}

export function subscribePublishedQuizzes(
  onData: (quizzes: PublishedQuizRecord[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, PUBLISHED_QUIZZES_PATH), where('published', '==', true));
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs
        .map((d) => mapDocToPublishedQuiz(d.id, d.data() as Record<string, unknown>))
        .filter((item): item is PublishedQuizRecord & { sortMs: number } => item !== null)
        .sort((a, b) => b.sortMs - a.sortMs)
        .map(({ sortMs: _ignore, ...rec }) => rec);
      onData(list);
    },
    (error) => {
      if (onError) {
        onError(error);
      } else {
        handleFirestoreError(error, OperationType.LIST, PUBLISHED_QUIZZES_PATH);
      }
    }
  );
}

export function subscribeAdminQuizzes(
  onData: (quizzes: PublishedQuizRecord[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, PUBLISHED_QUIZZES_PATH),
    (snapshot) => {
      const list = snapshot.docs
        .map((d) => mapDocToPublishedQuiz(d.id, d.data() as Record<string, unknown>))
        .filter((item): item is PublishedQuizRecord & { sortMs: number } => item !== null)
        .sort((a, b) => b.sortMs - a.sortMs)
        .map(({ sortMs: _ignore, ...rec }) => rec);
      onData(list);
    },
    (error) => {
      if (onError) {
        onError(error);
      } else {
        handleFirestoreError(error, OperationType.LIST, PUBLISHED_QUIZZES_PATH);
      }
    }
  );
}

export async function savePublishedQuizToDb(
  adminUid: string,
  payload: {
    id?: string;
    title: string;
    track: QuizTrack;
    level: string;
    subject: string;
    chapterName?: string;
    topic: string;
    difficulty: QuizDifficulty;
    timerMinutes: number;
    published: boolean;
    quiz: GeneratedQuiz;
  },
  isUpdate: boolean
): Promise<string> {
  const safeId =
    (payload.id || `quiz-${Date.now()}`)
      .replace(/[^a-zA-Z0-9_-]/g, '-')
      .slice(0, 100) || `quiz-${Date.now()}`;
  const docPath = `${PUBLISHED_QUIZZES_PATH}/${safeId}`;

  const cleanQuiz = sanitizeQuizForStorage(payload.quiz);
  const payloadJson = JSON.stringify(cleanQuiz).slice(0, 78000);

  const safeTitle =
    sanitizeChatTextForStorage(payload.title).trim().slice(0, 160) || 'VIDYORA Practice Quiz';
  const safeTopic =
    sanitizeChatTextForStorage(payload.topic).trim().slice(0, 160) || 'Practice Topic';
  const safeLevel = payload.level.trim().slice(0, 60) || 'Class 10';
  const safeSubject = payload.subject.trim().slice(0, 80) || 'General';
  const safeChapter = (payload.chapterName || '').trim().slice(0, 140);

  const sharedFields: Record<string, unknown> = {
    title: safeTitle.length >= 3 ? safeTitle : `${safeTitle} Quiz`,
    track: payload.track,
    level: safeLevel.length >= 2 ? safeLevel : 'Class 10',
    subject: safeSubject.length >= 2 ? safeSubject : 'General',
    topic: safeTopic.length >= 2 ? safeTopic : 'General Topic',
    difficulty: payload.difficulty,
    timerMinutes: Math.max(0, Math.min(120, Math.round(payload.timerMinutes || 0))),
    published: Boolean(payload.published),
    payloadJson,
    updatedAt: serverTimestamp(),
  };
  if (safeChapter) {
    sharedFields.chapterName = safeChapter;
  }

  try {
    if (isUpdate) {
      await updateDoc(doc(db, PUBLISHED_QUIZZES_PATH, safeId), sharedFields);
    } else {
      await setDoc(doc(db, PUBLISHED_QUIZZES_PATH, safeId), {
        ...sharedFields,
        createdBy: adminUid,
        createdAt: serverTimestamp(),
      });
    }
    return safeId;
  } catch (error) {
    handleFirestoreError(
      error,
      isUpdate ? OperationType.UPDATE : OperationType.CREATE,
      docPath
    );
    return safeId;
  }
}

export async function togglePublishQuizInDb(
  quizId: string,
  published: boolean
): Promise<void> {
  const docPath = `${PUBLISHED_QUIZZES_PATH}/${quizId}`;
  try {
    await updateDoc(doc(db, PUBLISHED_QUIZZES_PATH, quizId), {
      published,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

export async function deletePublishedQuizFromDb(quizId: string): Promise<void> {
  const docPath = `${PUBLISHED_QUIZZES_PATH}/${quizId}`;
  try {
    await deleteDoc(doc(db, PUBLISHED_QUIZZES_PATH, quizId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}
