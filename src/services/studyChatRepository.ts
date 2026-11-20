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
  StudyBuddyLevel,
  StudyBuddyMessage,
  StudyBuddyMode,
  StudyBuddySession,
  StudyBuddySubject,
} from '../types/vidyora';
import { sanitizeChatTextForStorage } from '../utils/studyBuddyLogic';

const STUDY_CHATS_PATH = 'study_chats';

function mapDocToStudySession(
  id: string,
  data: Record<string, unknown>
): StudyBuddySession & { sortMs: number } {
  const rawMessages = Array.isArray(data.messages) ? data.messages : [];
  const messages: StudyBuddyMessage[] = rawMessages
    .filter((m): m is Record<string, unknown> => typeof m === 'object' && m !== null)
    .slice(0, 40)
    .map((m, idx) => ({
      id: typeof m.id === 'string' ? m.id : `m-${idx}`,
      role: m.role === 'user' ? 'user' : 'assistant',
      content: typeof m.content === 'string' ? m.content : '',
      timestamp: typeof m.timestamp === 'string' ? m.timestamp : '',
      buddyLevel: typeof m.buddyLevel === 'string' ? (m.buddyLevel as StudyBuddyLevel) : undefined,
      subject: typeof m.subject === 'string' ? (m.subject as StudyBuddySubject) : undefined,
      mode: typeof m.mode === 'string' ? (m.mode as StudyBuddyMode) : undefined,
    }));

  const ts = data.updatedAt as { toMillis?: () => number; toDate?: () => Date } | undefined;
  const sortMs = typeof ts?.toMillis === 'function' ? ts.toMillis() : Date.now();
  const updatedAtLabel =
    typeof ts?.toDate === 'function'
      ? ts.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'Saved';

  const buddyLevel = (data.level as StudyBuddyLevel) || 'School level';

  return {
    id,
    title: typeof data.title === 'string' ? data.title : 'Study Chat',
    level: 'Class 9-10',
    buddyLevel,
    subject: (data.subject as StudyBuddySubject) || 'Mathematics',
    mode: (data.mode as StudyBuddyMode) || 'step-by-step',
    updatedAt: updatedAtLabel,
    messages,
    source: 'cloud',
    sortMs,
  };
}

/**
 * Subscribes strictly to the signed-in verified user's own study chats (enforced by Firestore allow list rule).
 */
export function subscribeUserStudyChats(
  uid: string,
  onData: (sessions: StudyBuddySession[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, STUDY_CHATS_PATH),
    where('userId', '==', uid)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const sessions = snapshot.docs
        .map((d) => mapDocToStudySession(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => b.sortMs - a.sortMs)
        .map(({ sortMs: _ignore, ...session }) => session);
      onData(sessions);
    },
    (error) => {
      if (onError) {
        onError(error);
      } else {
        handleFirestoreError(error, OperationType.LIST, STUDY_CHATS_PATH);
      }
    }
  );
}

/**
 * Saves or updates a sanitized AI Study Buddy session in Firestore strictly adhering to firebase-blueprint.json bounds.
 */
export async function saveStudyChatToDb(
  uid: string,
  session: {
    id: string;
    title: string;
    subject: StudyBuddySubject;
    buddyLevel: StudyBuddyLevel;
    mode: StudyBuddyMode;
    messages: StudyBuddyMessage[];
  },
  existsInCloud: boolean
): Promise<void> {
  const safeDocId = session.id.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 100) || `chat-${Date.now()}`;
  const docPath = `${STUDY_CHATS_PATH}/${safeDocId}`;

  const sanitizedTitle =
    sanitizeChatTextForStorage(session.title).trim().slice(0, 120) || 'Study Chat';

  const sanitizedMessages = session.messages.slice(-40).map((m) => ({
    id: String(m.id || `m-${Date.now()}`).slice(0, 64),
    role: m.role === 'user' ? 'user' : 'assistant',
    content: sanitizeChatTextForStorage(m.content).slice(0, 3000),
    timestamp: String(m.timestamp || '').slice(0, 24),
  }));

  try {
    if (existsInCloud) {
      await updateDoc(doc(db, STUDY_CHATS_PATH, safeDocId), {
        title: sanitizedTitle,
        subject: session.subject,
        level: session.buddyLevel,
        mode: session.mode,
        messages: sanitizedMessages,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(doc(db, STUDY_CHATS_PATH, safeDocId), {
        userId: uid,
        title: sanitizedTitle,
        subject: session.subject,
        level: session.buddyLevel,
        mode: session.mode,
        messages: sanitizedMessages,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(
      error,
      existsInCloud ? OperationType.UPDATE : OperationType.CREATE,
      docPath
    );
  }
}

export async function deleteStudyChatFromDb(chatId: string): Promise<void> {
  const docPath = `${STUDY_CHATS_PATH}/${chatId}`;
  try {
    await deleteDoc(doc(db, STUDY_CHATS_PATH, chatId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

export async function clearAllUserStudyChatsInDb(chatIds: string[]): Promise<void> {
  await Promise.all(chatIds.map((id) => deleteStudyChatFromDb(id)));
}
