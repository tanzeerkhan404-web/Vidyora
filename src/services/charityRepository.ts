import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreError';
import type {
  CharityDonationRecord,
  CharityPublicSummary,
  ExpenseCategory,
  OperatingExpenseRecord,
  RevenueRecord,
  RevenueSource,
  RevenueStatus,
} from '../utils/charityAccountingLogic';

const REVENUES_COLLECTION = 'financial_revenues';
const EXPENSES_COLLECTION = 'financial_expenses';
const DONATIONS_COLLECTION = 'charity_donations';
const PUBLIC_SUMMARY_COLLECTION = 'charity_public_summaries';
const AUDIT_LOGS_COLLECTION = 'admin_audit_logs';

async function recordFinanceAuditLog(
  adminUid: string,
  adminLabel: string,
  action: string,
  targetId: string,
  summary: string
): Promise<void> {
  try {
    await addDoc(collection(db, AUDIT_LOGS_COLLECTION), {
      adminUid,
      adminLabel: adminLabel.slice(0, 80),
      action: action.slice(0, 60),
      targetType: 'finance',
      targetId: targetId.slice(0, 128),
      summary: summary.slice(0, 300),
      createdAt: serverTimestamp(),
    });
  } catch {
    // Do not block the primary write if secondary audit write fails
  }
}

export function subscribePublicCharitySummary(
  onData: (summary: CharityPublicSummary | null) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const ref = doc(db, PUBLIC_SUMMARY_COLLECTION, 'latest');
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        onData(null);
        return;
      }
      const d = snap.data();
      try {
        const parsed = JSON.parse(String(d.payloadJson || '{}')) as CharityPublicSummary;
        onData({
          ...parsed,
          publishedAt: d.publishedAt?.toDate?.()?.toISOString?.() || parsed.publishedAt,
        });
      } catch {
        onData(null);
      }
    },
    (error) => {
      if (onError) onError(error);
    }
  );
}

export function subscribeAdminRevenues(
  onData: (records: RevenueRecord[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, REVENUES_COLLECTION), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const list: RevenueRecord[] = snap.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          period: String(d.period || ''),
          source: (d.source as RevenueSource) || 'membership',
          description: String(d.description || ''),
          amountInr: Number(d.amountInr) || 0,
          refundedAmountInr: Number(d.refundedAmountInr) || 0,
          status: (d.status as RevenueStatus) || 'received',
          transactionDate: String(d.transactionDate || ''),
          referenceId: String(d.referenceId || ''),
          recordedBy: String(d.recordedBy || ''),
          createdAt: d.createdAt?.toDate?.()?.toISOString?.(),
        };
      });
      onData(list);
    },
    (error) => {
      if (onError) onError(error);
    }
  );
}

export function subscribeAdminExpenses(
  onData: (records: OperatingExpenseRecord[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, EXPENSES_COLLECTION), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const list: OperatingExpenseRecord[] = snap.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          period: String(d.period || ''),
          category: (d.category as ExpenseCategory) || 'other',
          vendor: String(d.vendor || ''),
          description: String(d.description || ''),
          amountInr: Number(d.amountInr) || 0,
          expenseDate: String(d.expenseDate || ''),
          invoiceRef: d.invoiceRef ? String(d.invoiceRef) : undefined,
          recordedBy: String(d.recordedBy || ''),
          createdAt: d.createdAt?.toDate?.()?.toISOString?.(),
        };
      });
      onData(list);
    },
    (error) => {
      if (onError) onError(error);
    }
  );
}

export function subscribeAdminDonations(
  onData: (records: CharityDonationRecord[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, DONATIONS_COLLECTION), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const list: CharityDonationRecord[] = snap.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          period: String(d.period || ''),
          charityOrganisation: String(d.charityOrganisation || ''),
          amountInr: Number(d.amountInr) || 0,
          donationDate: String(d.donationDate || ''),
          paymentReference: String(d.paymentReference || ''),
          receiptNote: d.receiptNote ? String(d.receiptNote) : undefined,
          status:
            (d.status as CharityDonationRecord['status']) || 'pending_partner',
          recordedBy: String(d.recordedBy || ''),
          createdAt: d.createdAt?.toDate?.()?.toISOString?.(),
        };
      });
      onData(list);
    },
    (error) => {
      if (onError) onError(error);
    }
  );
}

export async function addRevenueRecordInDb(
  input: Omit<RevenueRecord, 'id' | 'createdAt' | 'recordedBy'>,
  adminUid: string,
  adminLabel: string
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, REVENUES_COLLECTION), {
      period: input.period.trim(),
      source: input.source,
      description: input.description.trim().slice(0, 200),
      amountInr: Number(input.amountInr),
      refundedAmountInr: Number(input.refundedAmountInr) || 0,
      status: input.status,
      transactionDate: input.transactionDate.trim(),
      referenceId: input.referenceId.trim().slice(0, 80),
      recordedBy: adminUid,
      createdAt: serverTimestamp(),
    });
    await recordFinanceAuditLog(
      adminUid,
      adminLabel,
      'create_revenue',
      docRef.id,
      `Recorded ${input.status} revenue ₹${input.amountInr} (${input.period}) ref ${input.referenceId}`
    );
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, REVENUES_COLLECTION);
  }
}

export async function deleteRevenueRecordInDb(
  id: string,
  adminUid: string,
  adminLabel: string
): Promise<void> {
  try {
    await deleteDoc(doc(db, REVENUES_COLLECTION, id));
    await recordFinanceAuditLog(
      adminUid,
      adminLabel,
      'delete_revenue',
      id,
      `Deleted revenue record ${id}`
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${REVENUES_COLLECTION}/${id}`);
  }
}

export async function addExpenseRecordInDb(
  input: Omit<OperatingExpenseRecord, 'id' | 'createdAt' | 'recordedBy'>,
  adminUid: string,
  adminLabel: string
): Promise<string> {
  try {
    const payload: Record<string, unknown> = {
      period: input.period.trim(),
      category: input.category,
      vendor: input.vendor.trim().slice(0, 100),
      description: input.description.trim().slice(0, 240),
      amountInr: Number(input.amountInr),
      expenseDate: input.expenseDate.trim(),
      recordedBy: adminUid,
      createdAt: serverTimestamp(),
    };
    if (input.invoiceRef?.trim()) {
      payload.invoiceRef = input.invoiceRef.trim().slice(0, 80);
    }
    const docRef = await addDoc(collection(db, EXPENSES_COLLECTION), payload);
    await recordFinanceAuditLog(
      adminUid,
      adminLabel,
      'create_expense',
      docRef.id,
      `Recorded operating expense ₹${input.amountInr} (${input.category}, ${input.vendor})`
    );
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, EXPENSES_COLLECTION);
  }
}

export async function deleteExpenseRecordInDb(
  id: string,
  adminUid: string,
  adminLabel: string
): Promise<void> {
  try {
    await deleteDoc(doc(db, EXPENSES_COLLECTION, id));
    await recordFinanceAuditLog(
      adminUid,
      adminLabel,
      'delete_expense',
      id,
      `Deleted operating expense ${id}`
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${EXPENSES_COLLECTION}/${id}`);
  }
}

export async function addDonationRecordInDb(
  input: Omit<CharityDonationRecord, 'id' | 'createdAt' | 'recordedBy'>,
  adminUid: string,
  adminLabel: string
): Promise<string> {
  try {
    const payload: Record<string, unknown> = {
      period: input.period.trim(),
      charityOrganisation: input.charityOrganisation.trim().slice(0, 140),
      amountInr: Number(input.amountInr),
      donationDate: input.donationDate.trim(),
      paymentReference: input.paymentReference.trim().slice(0, 100),
      status: input.status,
      recordedBy: adminUid,
      createdAt: serverTimestamp(),
    };
    if (input.receiptNote?.trim()) {
      payload.receiptNote = input.receiptNote.trim().slice(0, 300);
    }
    const docRef = await addDoc(collection(db, DONATIONS_COLLECTION), payload);
    await recordFinanceAuditLog(
      adminUid,
      adminLabel,
      'record_donation',
      docRef.id,
      `Recorded ${input.status} charity entry ₹${input.amountInr} to ${input.charityOrganisation}`
    );
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, DONATIONS_COLLECTION);
  }
}

export async function publishPublicCharitySummaryInDb(
  summary: CharityPublicSummary,
  adminUid: string,
  adminLabel: string
): Promise<void> {
  try {
    await setDoc(doc(db, PUBLIC_SUMMARY_COLLECTION, 'latest'), {
      period: summary.period,
      donationStatus: summary.donationStatus,
      payloadJson: JSON.stringify(summary),
      publishedBy: adminUid,
      publishedAt: serverTimestamp(),
    });
    await recordFinanceAuditLog(
      adminUid,
      adminLabel,
      'publish_public_summary',
      'latest',
      `Published approved charity transparency summary for period ${summary.period} (Net Proceeds ₹${summary.netProceedsInr})`
    );
  } catch (err) {
    handleFirestoreError(
      err,
      OperationType.WRITE,
      `${PUBLIC_SUMMARY_COLLECTION}/latest`
    );
  }
}

export function subscribeAdminAuditLogs(
  onData: (
    logs: Array<{
      id: string;
      adminLabel: string;
      action: string;
      targetType: string;
      targetId: string;
      summary: string;
      createdAt?: string;
    }>
  ) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, AUDIT_LOGS_COLLECTION), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      onData(
        snap.docs.slice(0, 50).map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            adminLabel: String(d.adminLabel || 'Admin'),
            action: String(d.action || ''),
            targetType: String(d.targetType || ''),
            targetId: String(d.targetId || ''),
            summary: String(d.summary || ''),
            createdAt: d.createdAt?.toDate?.()?.toISOString?.(),
          };
        })
      );
    },
    (error) => {
      if (onError) onError(error);
    }
  );
}
