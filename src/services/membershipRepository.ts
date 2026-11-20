import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import {
  DEFAULT_LEARNING_PACKAGES,
  DEFAULT_MEMBERSHIP_PLANS,
} from '../data/membershipCatalog';
import { db } from '../lib/firebase';
import type {
  LearningPackage,
  MembershipPlan,
  MembershipPlanId,
} from '../types/vidyora';

const PLANS_COLLECTION = 'membership_plans';
const PACKAGES_COLLECTION = 'learning_packages';

const PLAN_ORDER: Record<MembershipPlanId, number> = {
  free: 0,
  student: 1,
  pro: 2,
};

export function mergeMembershipPlans(overrides: MembershipPlan[]): MembershipPlan[] {
  const byId = new Map<MembershipPlanId, MembershipPlan>();
  for (const def of DEFAULT_MEMBERSHIP_PLANS) {
    byId.set(def.id, def);
  }
  for (const item of overrides) {
    byId.set(item.id, item);
  }
  return Array.from(byId.values()).sort(
    (a, b) => (PLAN_ORDER[a.id] ?? 99) - (PLAN_ORDER[b.id] ?? 99)
  );
}

export function mergeLearningPackages(overrides: LearningPackage[]): LearningPackage[] {
  const byId = new Map<string, LearningPackage>();
  for (const def of DEFAULT_LEARNING_PACKAGES) {
    byId.set(def.id, def);
  }
  for (const item of overrides) {
    byId.set(item.id, item);
  }
  return Array.from(byId.values());
}

export function subscribeMembershipPlans(
  onData: (plans: MembershipPlan[]) => void,
  onError?: (err: Error) => void
): () => void {
  const colRef = collection(db, PLANS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const parsed: MembershipPlan[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        try {
          if (typeof data.payloadJson === 'string') {
            const plan = JSON.parse(data.payloadJson) as MembershipPlan;
            if (plan && (plan.id === 'free' || plan.id === 'student' || plan.id === 'pro')) {
              parsed.push(plan);
            }
          }
        } catch {
          // Skip malformed record safely
        }
      });
      onData(mergeMembershipPlans(parsed));
    },
    (err) => {
      onData(DEFAULT_MEMBERSHIP_PLANS);
      onError?.(err);
    }
  );
}

export function subscribeLearningPackages(
  onData: (packages: LearningPackage[]) => void,
  onError?: (err: Error) => void
): () => void {
  const colRef = collection(db, PACKAGES_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const parsed: LearningPackage[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        try {
          if (typeof data.payloadJson === 'string') {
            const pkg = JSON.parse(data.payloadJson) as LearningPackage;
            if (pkg && typeof pkg.id === 'string' && typeof pkg.name === 'string') {
              parsed.push(pkg);
            }
          }
        } catch {
          // Skip malformed record safely
        }
      });
      onData(mergeLearningPackages(parsed));
    },
    (err) => {
      onData(DEFAULT_LEARNING_PACKAGES);
      onError?.(err);
    }
  );
}

export async function saveMembershipPlanToDb(
  plan: MembershipPlan,
  adminUid: string
): Promise<void> {
  const ref = doc(db, PLANS_COLLECTION, plan.id);
  await setDoc(ref, {
    planId: plan.id,
    name: plan.name.trim().slice(0, 60),
    priceInr: plan.id === 'free' ? 0 : Math.max(0, Math.round(plan.priceInr)),
    aiDailyLimit: Math.max(5, Math.min(1000, Math.round(plan.aiDailyLimit))),
    offerActive: Boolean(plan.offer.active),
    active: Boolean(plan.active),
    payloadJson: JSON.stringify(plan),
    updatedBy: adminUid,
    updatedAt: serverTimestamp(),
  });
}

export async function saveLearningPackageToDb(
  pkg: LearningPackage,
  adminUid: string
): Promise<void> {
  const safeId = pkg.id
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 64);
  const normalized: LearningPackage = {
    ...pkg,
    id: safeId || `pkg-${Date.now()}`,
  };
  const ref = doc(db, PACKAGES_COLLECTION, normalized.id);
  await setDoc(ref, {
    packageId: normalized.id,
    name: normalized.name.trim().slice(0, 80),
    categoryLink: normalized.categoryLink,
    active: Boolean(normalized.active),
    payloadJson: JSON.stringify(normalized),
    updatedBy: adminUid,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteLearningPackageFromDb(packageId: string): Promise<void> {
  const ref = doc(db, PACKAGES_COLLECTION, packageId);
  await deleteDoc(ref);
}
