import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import {
  BOOTSTRAP_ADMIN_EMAIL,
  db,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import type {
  DifficultyLevel,
  LearningCategory,
  LearningLevel,
  QuizQuestion,
  VideoLesson,
} from '../types/vidyora';
import {
  generateSafeLessonDocId,
  validateAdminVideoInput,
  type AdminVideoFormInput,
} from '../utils/videoLogic';

const VIDEO_LESSONS_PATH = 'video_lessons';
const STUDENT_PROGRESS_PATH = 'student_progress';
const ADMINS_PATH = 'admins';

export interface FirestoreLessonPayload extends AdminVideoFormInput {
  practiceQuestions?: QuizQuestion[];
  published: boolean;
  isDemo: boolean;
}

function mapFirestoreDocToVideoLesson(
  id: string,
  data: Record<string, unknown>
): VideoLesson {
  const chapterNumber = Number(data.chapterNumber) || 1;
  const chapterName = String(data.chapterName || 'Chapter Overview');
  const className = String(data.className || 'Class 10');
  const duration = String(data.duration || '10:00');
  const minutesMatch = duration.match(/^(\d+)/);
  const durationMinutes = minutesMatch ? Number(minutesMatch[1]) : 10;
  const summary = String(data.description || '');
  const notesContent = typeof data.notesContent === 'string' ? data.notesContent : '';
  const practiceQuestions = Array.isArray(data.practiceQuestions)
    ? (data.practiceQuestions as QuizQuestion[]).slice(0, 10)
    : [];

  return {
    id,
    title: String(data.title || 'Untitled Video Lesson'),
    subject: String(data.subject || 'General'),
    className,
    chapterNumber,
    chapterName,
    chapter: `Chapter ${chapterNumber} · ${chapterName}`,
    category: (data.category as Exclude<LearningCategory, 'all'>) || 'school',
    level: className,
    difficulty: (data.difficulty as Exclude<DifficultyLevel, 'All'>) || 'Intermediate',
    duration,
    durationMinutes,
    animationMode: 'Video Lecture',
    thumbnail: String(
      data.thumbnailUrl || '/src/assets/images/thumb_physics_motion_1795140262578.jpg'
    ),
    videoUrl: typeof data.videoUrl === 'string' ? data.videoUrl : undefined,
    notesContent: notesContent || undefined,
    summary,
    keyTakeaways: notesContent
      ? notesContent
          .split('\n')
          .map((line) => line.replace(/^[-•*]\s*/, '').trim())
          .filter(Boolean)
          .slice(0, 5)
      : [
          `${className} ${String(data.subject || '')} — Chapter ${chapterNumber}: ${chapterName}`,
          'Video lecture dekho aur saath mein notes revise karo.',
          'Neeche diye gaye practice questions solve karke apni understanding check karo.',
        ],
    realLifeExamples: [
      {
        title: `${chapterName} in Practice`,
        explanation: summary,
      },
    ],
    practiceQuestions,
    steps: [
      {
        title: `1. ${String(data.title || 'Core Concept')}`,
        caption: summary,
        visualType: 'vector',
        highlightValue: `${className} · Chapter ${chapterNumber}`,
      },
    ],
    published: Boolean(data.published),
    isDemo: Boolean(data.isDemo),
    source: 'firestore',
    createdBy: typeof data.createdBy === 'string' ? data.createdBy : undefined,
  };
}

/**
 * Subscribes to published video lessons only (enforced by Firestore allow list rule).
 */
export function subscribePublishedVideoLessons(
  onData: (lessons: VideoLesson[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, VIDEO_LESSONS_PATH),
    where('published', '==', true)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const lessons = snapshot.docs.map((d) =>
        mapFirestoreDocToVideoLesson(d.id, d.data() as Record<string, unknown>)
      );
      onData(lessons);
    },
    (error) => {
      if (onError) {
        onError(error);
      } else {
        handleFirestoreError(error, OperationType.LIST, VIDEO_LESSONS_PATH);
      }
    }
  );
}

/**
 * Admin-only subscription for both published and unpublished draft lessons.
 */
export function subscribeAdminVideoLessons(
  onData: (lessons: VideoLesson[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, VIDEO_LESSONS_PATH),
    (snapshot) => {
      const lessons = snapshot.docs.map((d) =>
        mapFirestoreDocToVideoLesson(d.id, d.data() as Record<string, unknown>)
      );
      onData(lessons);
    },
    (error) => {
      if (onError) {
        onError(error);
      } else {
        handleFirestoreError(error, OperationType.LIST, VIDEO_LESSONS_PATH);
      }
    }
  );
}

export async function createVideoLessonInDb(
  input: FirestoreLessonPayload,
  adminUid: string
): Promise<string> {
  const validationErr = validateAdminVideoInput(input);
  if (validationErr) {
    throw new Error(validationErr);
  }

  const docId = generateSafeLessonDocId(input.className, input.subject, input.title);
  const docPath = `${VIDEO_LESSONS_PATH}/${docId}`;

  const payload: Record<string, unknown> = {
    title: input.title.trim().slice(0, 160),
    description: input.description.trim().slice(0, 1500),
    category: input.category,
    className: input.className.trim().slice(0, 60),
    subject: input.subject.trim().slice(0, 80),
    chapterNumber: Math.max(1, Math.min(50, Math.round(input.chapterNumber))),
    chapterName: input.chapterName.trim().slice(0, 120),
    duration: input.duration.trim().slice(0, 20),
    difficulty: input.difficulty,
    videoUrl: input.videoUrl.trim().slice(0, 500),
    thumbnailUrl: input.thumbnailUrl.trim().slice(0, 350000),
    notesContent: (input.notesContent || '').trim().slice(0, 8000),
    practiceQuestions: (input.practiceQuestions || []).slice(0, 10),
    published: Boolean(input.published),
    isDemo: Boolean(input.isDemo),
    createdBy: adminUid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, VIDEO_LESSONS_PATH, docId), payload);
    return docId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, docPath);
  }
}

export async function updateVideoLessonInDb(
  lessonId: string,
  input: FirestoreLessonPayload
): Promise<void> {
  const validationErr = validateAdminVideoInput(input);
  if (validationErr) {
    throw new Error(validationErr);
  }
  const docPath = `${VIDEO_LESSONS_PATH}/${lessonId}`;

  const updates: Record<string, unknown> = {
    title: input.title.trim().slice(0, 160),
    description: input.description.trim().slice(0, 1500),
    category: input.category,
    className: input.className.trim().slice(0, 60),
    subject: input.subject.trim().slice(0, 80),
    chapterNumber: Math.max(1, Math.min(50, Math.round(input.chapterNumber))),
    chapterName: input.chapterName.trim().slice(0, 120),
    duration: input.duration.trim().slice(0, 20),
    difficulty: input.difficulty,
    videoUrl: input.videoUrl.trim().slice(0, 500),
    thumbnailUrl: input.thumbnailUrl.trim().slice(0, 350000),
    notesContent: (input.notesContent || '').trim().slice(0, 8000),
    practiceQuestions: (input.practiceQuestions || []).slice(0, 10),
    published: Boolean(input.published),
    isDemo: Boolean(input.isDemo),
    updatedAt: serverTimestamp(),
  };

  try {
    await updateDoc(doc(db, VIDEO_LESSONS_PATH, lessonId), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

export async function togglePublishVideoLessonInDb(
  lessonId: string,
  published: boolean
): Promise<void> {
  const docPath = `${VIDEO_LESSONS_PATH}/${lessonId}`;
  try {
    await updateDoc(doc(db, VIDEO_LESSONS_PATH, lessonId), {
      published: Boolean(published),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

export async function deleteVideoLessonInDb(lessonId: string): Promise<void> {
  const docPath = `${VIDEO_LESSONS_PATH}/${lessonId}`;
  try {
    await deleteDoc(doc(db, VIDEO_LESSONS_PATH, lessonId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

export async function checkIsAdminInDb(
  uid: string,
  email: string | null,
  emailVerified: boolean
): Promise<boolean> {
  if (!emailVerified) return false;
  if (email && email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase()) {
    return true;
  }
  const docPath = `${ADMINS_PATH}/${uid}`;
  try {
    const snap = await getDoc(doc(db, ADMINS_PATH, uid));
    return snap.exists() && snap.data()?.role === 'admin';
  } catch {
    return false;
  }
}

export interface CloudStudentProgress {
  displayName: string;
  level: LearningLevel;
  completedLessonIds: string[];
  favouriteLessonIds: string[];
  recentLessonIds: string[];
}

export async function loadStudentProgressFromDb(
  uid: string
): Promise<CloudStudentProgress | null> {
  const docPath = `${STUDENT_PROGRESS_PATH}/${uid}`;
  try {
    const snap = await getDoc(doc(db, STUDENT_PROGRESS_PATH, uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      displayName: String(data.displayName || 'Student'),
      level: (data.level as LearningLevel) || 'Class 9-10',
      completedLessonIds: Array.isArray(data.completedLessonIds)
        ? (data.completedLessonIds as string[])
        : [],
      favouriteLessonIds: Array.isArray(data.favouriteLessonIds)
        ? (data.favouriteLessonIds as string[])
        : [],
      recentLessonIds: Array.isArray(data.recentLessonIds)
        ? (data.recentLessonIds as string[])
        : [],
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, docPath);
  }
}

export async function saveStudentProgressToDb(
  uid: string,
  progress: CloudStudentProgress
): Promise<void> {
  const docPath = `${STUDENT_PROGRESS_PATH}/${uid}`;
  const payload = {
    userId: uid,
    displayName: (progress.displayName || 'Student').trim().slice(0, 60) || 'Student',
    level: progress.level,
    completedLessonIds: progress.completedLessonIds.slice(0, 500),
    favouriteLessonIds: progress.favouriteLessonIds.slice(0, 200),
    recentLessonIds: progress.recentLessonIds.slice(0, 50),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, STUDENT_PROGRESS_PATH, uid), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}
