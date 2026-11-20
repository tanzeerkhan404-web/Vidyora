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
  GeneratedNotes,
  NoteDesignStyle,
  NoteType,
  SavedNoteRecord,
} from '../types/vidyora';
import { sanitizeNotesForStorage } from '../utils/notesLogic';
import { sanitizeChatTextForStorage } from '../utils/studyBuddyLogic';

const SAVED_NOTES_PATH = 'saved_notes';

function mapDocToSavedNote(
  id: string,
  data: Record<string, unknown>
): (SavedNoteRecord & { sortMs: number }) | null {
  try {
    const rawJson = typeof data.payloadJson === 'string' ? data.payloadJson : '';
    if (!rawJson) return null;
    const parsedNotes = JSON.parse(rawJson) as GeneratedNotes;
    if (!parsedNotes || typeof parsedNotes.title !== 'string') return null;

    const ts = data.updatedAt as { toMillis?: () => number; toDate?: () => Date } | undefined;
    const sortMs = typeof ts?.toMillis === 'function' ? ts.toMillis() : Date.now();
    const updatedAtLabel =
      typeof ts?.toDate === 'function'
        ? ts.toDate().toLocaleDateString([], { month: 'short', day: 'numeric' })
        : 'Saved';

    return {
      id,
      title: typeof data.title === 'string' ? data.title : parsedNotes.title,
      className: typeof data.className === 'string' ? data.className : 'Class 9-10',
      subject: typeof data.subject === 'string' ? data.subject : 'General',
      chapterName: typeof data.chapterName === 'string' ? data.chapterName : undefined,
      noteType: (data.noteType as NoteType) || 'Detailed Notes',
      designStyle: (data.designStyle as NoteDesignStyle) || 'professional',
      updatedAt: updatedAtLabel,
      notes: parsedNotes,
      source: 'cloud',
      sortMs,
    };
  } catch {
    return null;
  }
}

export function subscribeUserSavedNotes(
  uid: string,
  onData: (notes: SavedNoteRecord[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, SAVED_NOTES_PATH), where('userId', '==', uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const records = snapshot.docs
        .map((d) => mapDocToSavedNote(d.id, d.data() as Record<string, unknown>))
        .filter((item): item is SavedNoteRecord & { sortMs: number } => item !== null)
        .sort((a, b) => b.sortMs - a.sortMs)
        .map(({ sortMs: _ignore, ...rec }) => rec);
      onData(records);
    },
    (error) => {
      if (onError) {
        onError(error);
      } else {
        handleFirestoreError(error, OperationType.LIST, SAVED_NOTES_PATH);
      }
    }
  );
}

export async function saveNoteToDb(
  uid: string,
  record: {
    id: string;
    title: string;
    className: string;
    subject: string;
    chapterName?: string;
    noteType: NoteType;
    designStyle: NoteDesignStyle;
    notes: GeneratedNotes;
  },
  existsInCloud: boolean
): Promise<void> {
  const safeId =
    record.id.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 100) || `note-${Date.now()}`;
  const docPath = `${SAVED_NOTES_PATH}/${safeId}`;

  const cleanNotes = sanitizeNotesForStorage(record.notes);
  let payloadJson = JSON.stringify(cleanNotes);
  if (payloadJson.length > 78000) {
    // Trim overly long sections gracefully to stay within Firestore rule bounds
    const trimmedNotes: GeneratedNotes = {
      ...cleanNotes,
      sections: cleanNotes.sections.slice(0, 8),
      examples: cleanNotes.examples.slice(0, 6),
    };
    payloadJson = JSON.stringify(trimmedNotes).slice(0, 78000);
  }

  const safeTitle =
    sanitizeChatTextForStorage(record.title).trim().slice(0, 160) || 'Study Notes';
  const safeClass = record.className.trim().slice(0, 60) || 'Class 10';
  const safeSubject = record.subject.trim().slice(0, 80) || 'General';
  const safeChapter = (record.chapterName || '').trim().slice(0, 140);

  const sharedFields: Record<string, unknown> = {
    title: safeTitle,
    className: safeClass,
    subject: safeSubject,
    noteType: record.noteType,
    designStyle: record.designStyle,
    payloadJson,
    updatedAt: serverTimestamp(),
  };
  if (safeChapter) {
    sharedFields.chapterName = safeChapter;
  }

  try {
    if (existsInCloud) {
      await updateDoc(doc(db, SAVED_NOTES_PATH, safeId), sharedFields);
    } else {
      await setDoc(doc(db, SAVED_NOTES_PATH, safeId), {
        userId: uid,
        ...sharedFields,
        createdAt: serverTimestamp(),
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

export async function deleteSavedNoteFromDb(noteId: string): Promise<void> {
  const docPath = `${SAVED_NOTES_PATH}/${noteId}`;
  try {
    await deleteDoc(doc(db, SAVED_NOTES_PATH, noteId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}
