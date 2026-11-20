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
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type {
  LectureItem,
  MemberAccessRecord,
  MembershipPlanId,
  TeacherRecord,
} from '../types/vidyora';

const LECTURES_COL = 'lectures';
const TEACHERS_COL = 'teachers';
const MEMBERSHIPS_COL = 'member_memberships';

export interface ProtectedLecturesResponse {
  authorized: boolean;
  reason?: 'UNAUTHENTICATED' | 'MEMBERSHIP_REQUIRED' | 'ERROR';
  message?: string;
  planId: MembershipPlanId;
  lectures: LectureItem[];
}

export async function fetchProtectedLecturesFromBackend(): Promise<ProtectedLecturesResponse> {
  const user = auth.currentUser;
  if (!user) {
    return {
      authorized: false,
      reason: 'UNAUTHENTICATED',
      message: 'Members-only Lectures dekhne ke liye pehle apna VIDYORA account sign in karein.',
      planId: 'free',
      lectures: [],
    };
  }

  try {
    const idToken = await user.getIdToken();
    const res = await fetch('/api/lectures/catalog', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
      cache: 'no-store',
    });

    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      return {
        authorized: false,
        reason: 'UNAUTHENTICATED',
        message: data.error || 'Authentication required.',
        planId: 'free',
        lectures: [],
      };
    }
    if (res.status === 403) {
      return {
        authorized: false,
        reason: 'MEMBERSHIP_REQUIRED',
        message:
          data.error ||
          'Lectures section sirf active Student (₹49/mo) ya Pro Learner (₹99/mo) members ke liye available hai.',
        planId: (data.planId as MembershipPlanId) || 'free',
        lectures: [],
      };
    }
    if (!res.ok) {
      return {
        authorized: false,
        reason: 'ERROR',
        message: data.error || 'Lectures load karne mein temporary problem aayi.',
        planId: 'free',
        lectures: [],
      };
    }

    return {
      authorized: true,
      planId: (data.planId as MembershipPlanId) || 'student',
      lectures: Array.isArray(data.lectures) ? (data.lectures as LectureItem[]) : [],
    };
  } catch {
    return {
      authorized: false,
      reason: 'ERROR',
      message: 'Internet connection check karein — protected lectures ke liye online access zaroori hai.',
      planId: 'free',
      lectures: [],
    };
  }
}

export async function checkUserMembershipAndTeacherStatus(
  uid: string
): Promise<{
  isVerifiedTeacher: boolean;
  activeMembershipPlan: MembershipPlanId;
  hasActivePaidMembership: boolean;
}> {
  let isVerifiedTeacher = false;
  let activeMembershipPlan: MembershipPlanId = 'free';
  let hasActivePaidMembership = false;

  try {
    const teacherSnap = await getDoc(doc(db, TEACHERS_COL, uid));
    if (teacherSnap.exists() && teacherSnap.data()?.verified === true) {
      isVerifiedTeacher = true;
    }
  } catch {
    // Non-teacher or unverified
  }

  try {
    const memSnap = await getDoc(doc(db, MEMBERSHIPS_COL, uid));
    if (memSnap.exists()) {
      const data = memSnap.data();
      const planId = data?.planId as MembershipPlanId;
      const status = data?.status;
      if (status === 'active' && (planId === 'student' || planId === 'pro')) {
        activeMembershipPlan = planId;
        hasActivePaidMembership = true;
      }
    }
  } catch {
    // Default free plan
  }

  return { isVerifiedTeacher, activeMembershipPlan, hasActivePaidMembership };
}

function mapDocToLecture(id: string, data: Record<string, unknown>): LectureItem {
  return {
    id,
    title: String(data.title || ''),
    description: String(data.description || ''),
    sourceType: (data.sourceType as LectureItem['sourceType']) || 'youtube',
    category: (data.category as LectureItem['category']) || 'Classes 9-10',
    className: String(data.className || ''),
    subject: String(data.subject || ''),
    chapterNumber: Number(data.chapterNumber) || 1,
    chapterName: String(data.chapterName || ''),
    teacherName: String(data.teacherName || ''),
    channelName: typeof data.channelName === 'string' ? data.channelName : undefined,
    duration: String(data.duration || '10:00'),
    videoUrl: String(data.videoUrl || ''),
    thumbnailUrl: String(data.thumbnailUrl || '/src/assets/images/hero-learning-world.png'),
    notesSummary: typeof data.notesSummary === 'string' ? data.notesSummary : undefined,
    notesPdfUrl: typeof data.notesPdfUrl === 'string' ? data.notesPdfUrl : undefined,
    featured: Boolean(data.featured),
    approvalStatus: (data.approvalStatus as LectureItem['approvalStatus']) || 'pending',
    rejectionReason:
      typeof data.rejectionReason === 'string' ? data.rejectionReason : undefined,
    published: Boolean(data.published),
    submittedByUid: String(data.submittedByUid || ''),
  };
}

export function subscribeAdminLectures(
  onData: (lectures: LectureItem[]) => void,
  onError?: (err: Error) => void
): () => void {
  return onSnapshot(
    collection(db, LECTURES_COL),
    (snap) => {
      const list = snap.docs.map((d) =>
        mapDocToLecture(d.id, d.data() as Record<string, unknown>)
      );
      onData(list);
    },
    (err) => onError?.(err)
  );
}

export function subscribeTeacherOwnLectures(
  uid: string,
  onData: (lectures: LectureItem[]) => void,
  onError?: (err: Error) => void
): () => void {
  const q = query(collection(db, LECTURES_COL), where('submittedByUid', '==', uid));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) =>
        mapDocToLecture(d.id, d.data() as Record<string, unknown>)
      );
      onData(list);
    },
    (err) => onError?.(err)
  );
}

export async function submitTeacherLectureToDb(
  uid: string,
  input: Omit<
    LectureItem,
    'id' | 'approvalStatus' | 'published' | 'featured' | 'submittedByUid' | 'sourceType'
  >
): Promise<string> {
  const id = `lec_t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const payload: Record<string, unknown> = {
    title: input.title.trim(),
    description: input.description.trim(),
    sourceType: 'teacher',
    category: input.category,
    className: input.className.trim(),
    subject: input.subject.trim(),
    chapterNumber: Math.max(1, Math.min(60, Math.round(input.chapterNumber))),
    chapterName: input.chapterName.trim(),
    teacherName: input.teacherName.trim(),
    duration: input.duration.trim() || '12:00',
    videoUrl: input.videoUrl.trim(),
    thumbnailUrl: input.thumbnailUrl.trim() || '/src/assets/images/hero-learning-world.png',
    featured: false,
    approvalStatus: 'pending',
    published: false,
    submittedByUid: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (input.channelName?.trim()) payload.channelName = input.channelName.trim();
  if (input.notesSummary?.trim()) payload.notesSummary = input.notesSummary.trim();
  if (input.notesPdfUrl?.trim()) payload.notesPdfUrl = input.notesPdfUrl.trim();

  await setDoc(doc(db, LECTURES_COL, id), payload);
  return id;
}

export async function createAdminLectureInDb(
  adminUid: string,
  input: Omit<LectureItem, 'id' | 'submittedByUid'>
): Promise<string> {
  const id = `lec_a_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const payload: Record<string, unknown> = {
    title: input.title.trim(),
    description: input.description.trim(),
    sourceType: input.sourceType,
    category: input.category,
    className: input.className.trim(),
    subject: input.subject.trim(),
    chapterNumber: Math.max(1, Math.min(60, Math.round(input.chapterNumber))),
    chapterName: input.chapterName.trim(),
    teacherName: input.teacherName.trim(),
    duration: input.duration.trim() || '12:00',
    videoUrl: input.videoUrl.trim(),
    thumbnailUrl: input.thumbnailUrl.trim() || '/src/assets/images/hero-learning-world.png',
    featured: Boolean(input.featured),
    approvalStatus: input.approvalStatus,
    published: Boolean(input.published),
    submittedByUid: adminUid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (input.channelName?.trim()) payload.channelName = input.channelName.trim();
  if (input.notesSummary?.trim()) payload.notesSummary = input.notesSummary.trim();
  if (input.notesPdfUrl?.trim()) payload.notesPdfUrl = input.notesPdfUrl.trim();

  await setDoc(doc(db, LECTURES_COL, id), payload);
  return id;
}

export async function updateAdminLectureInDb(
  lectureId: string,
  patch: Partial<LectureItem>
): Promise<void> {
  const ref = doc(db, LECTURES_COL, lectureId);
  const clean: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (patch.title !== undefined) clean.title = patch.title.trim();
  if (patch.description !== undefined) clean.description = patch.description.trim();
  if (patch.category !== undefined) clean.category = patch.category;
  if (patch.className !== undefined) clean.className = patch.className.trim();
  if (patch.subject !== undefined) clean.subject = patch.subject.trim();
  if (patch.chapterNumber !== undefined) clean.chapterNumber = Number(patch.chapterNumber);
  if (patch.chapterName !== undefined) clean.chapterName = patch.chapterName.trim();
  if (patch.teacherName !== undefined) clean.teacherName = patch.teacherName.trim();
  if (patch.duration !== undefined) clean.duration = patch.duration.trim();
  if (patch.videoUrl !== undefined) clean.videoUrl = patch.videoUrl.trim();
  if (patch.thumbnailUrl !== undefined) clean.thumbnailUrl = patch.thumbnailUrl.trim();
  if (patch.featured !== undefined) clean.featured = Boolean(patch.featured);
  if (patch.approvalStatus !== undefined) clean.approvalStatus = patch.approvalStatus;
  if (patch.published !== undefined) clean.published = Boolean(patch.published);
  if (patch.rejectionReason !== undefined) clean.rejectionReason = patch.rejectionReason.trim();
  await updateDoc(ref, clean);
}

export async function deleteAdminLectureFromDb(lectureId: string): Promise<void> {
  await deleteDoc(doc(db, LECTURES_COL, lectureId));
}

export function subscribeTeachersRegistry(
  onData: (teachers: TeacherRecord[]) => void
): () => void {
  return onSnapshot(collection(db, TEACHERS_COL), (snap) => {
    onData(
      snap.docs.map((d) => {
        const data = d.data();
        return {
          uid: String(data.uid || d.id),
          displayName: String(data.displayName || ''),
          specialization: String(data.specialization || ''),
          verified: Boolean(data.verified),
        };
      })
    );
  });
}

export async function saveTeacherRecordToDb(
  adminUid: string,
  teacher: { uid: string; displayName: string; specialization: string; verified: boolean }
): Promise<void> {
  const safeUid = teacher.uid.trim();
  await setDoc(doc(db, TEACHERS_COL, safeUid), {
    uid: safeUid,
    displayName: teacher.displayName.trim(),
    specialization: teacher.specialization.trim(),
    verified: Boolean(teacher.verified),
    updatedBy: adminUid,
    updatedAt: serverTimestamp(),
  });
}

export function subscribeMemberAccessList(
  onData: (records: MemberAccessRecord[]) => void
): () => void {
  return onSnapshot(collection(db, MEMBERSHIPS_COL), (snap) => {
    onData(
      snap.docs.map((d) => {
        const data = d.data();
        return {
          userId: String(data.userId || d.id),
          planId: (data.planId as MembershipPlanId) || 'free',
          status: (data.status as MemberAccessRecord['status']) || 'inactive',
          updatedBy: typeof data.updatedBy === 'string' ? data.updatedBy : undefined,
        };
      })
    );
  });
}

export async function saveMemberAccessToDb(
  adminUid: string,
  record: { userId: string; planId: MembershipPlanId; status: 'active' | 'inactive' | 'expired' }
): Promise<void> {
  const safeUid = record.userId.trim();
  await setDoc(doc(db, MEMBERSHIPS_COL, safeUid), {
    userId: safeUid,
    planId: record.planId,
    status: record.status,
    updatedBy: adminUid,
    updatedAt: serverTimestamp(),
  });
}
