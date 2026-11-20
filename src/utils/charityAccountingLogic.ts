export type RevenueStatus = 'received' | 'pending' | 'failed' | 'refunded';

export type RevenueSource = 'membership' | 'institutional' | 'other';

export type ExpenseCategory =
  | 'hosting'
  | 'database'
  | 'payment_fees'
  | 'ai_services'
  | 'software_services'
  | 'other';

export interface RevenueRecord {
  id: string;
  period: string; // YYYY-MM format e.g. '2026-11'
  source: RevenueSource;
  description: string;
  amountInr: number;
  refundedAmountInr: number;
  status: RevenueStatus;
  transactionDate: string; // YYYY-MM-DD
  referenceId: string;
  recordedBy: string;
  createdAt?: string;
}

export interface OperatingExpenseRecord {
  id: string;
  period: string; // YYYY-MM
  category: ExpenseCategory;
  vendor: string;
  description: string;
  amountInr: number;
  expenseDate: string; // YYYY-MM-DD
  invoiceRef?: string;
  recordedBy: string;
  createdAt?: string;
}

export interface CharityDonationRecord {
  id: string;
  period: string; // YYYY-MM
  charityOrganisation: string;
  amountInr: number;
  donationDate: string; // YYYY-MM-DD
  paymentReference: string;
  receiptNote?: string;
  status: 'pending_partner' | 'scheduled' | 'donated';
  recordedBy: string;
  createdAt?: string;
}

export interface FinancialPeriodSummary {
  period: string;
  currency: 'INR';
  grossReceivedInr: number;
  refundsInr: number;
  eligibleRevenueInr: number;
  operatingExpensesInr: number;
  netProceedsInr: number;
  charityAllocationInr: number;
  donatedInr: number;
  pendingDonationInr: number;
  donationStatus:
    | 'no_net_proceeds'
    | 'pending_donation'
    | 'partially_donated'
    | 'donated';
  excludedUnpaidOrFailedCount: number;
  expenseBreakdown: Record<ExpenseCategory, number>;
}

export interface CharityPublicSummary {
  period: string;
  currency: 'INR';
  grossReceivedInr: number;
  refundsInr: number;
  operatingExpensesInr: number;
  netProceedsInr: number;
  charityAllocationInr: number;
  donatedInr: number;
  pendingDonationInr: number;
  donationStatus: FinancialPeriodSummary['donationStatus'];
  charityPartnerName: string;
  lastDonationDate: string;
  lastDonationRef: string;
  publishedBy: string;
  publishedAt?: string;
}

function roundInr(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

export function isValidAccountingPeriod(period: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(period.trim());
}

export function formatInr(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return `₹${safe.toLocaleString('en-IN', {
    minimumFractionDigits: safe % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function hasDuplicateTransactionReference(
  existing: RevenueRecord[],
  referenceId: string
): boolean {
  const target = referenceId.trim().toLowerCase();
  if (!target) return false;
  return existing.some((r) => r.referenceId.trim().toLowerCase() === target);
}

export function validateRevenueInput(input: {
  period: string;
  description: string;
  amountInr: number;
  refundedAmountInr: number;
  status: RevenueStatus;
  transactionDate: string;
  referenceId: string;
}): string | null {
  if (!isValidAccountingPeriod(input.period)) {
    return 'Accounting period must be in YYYY-MM format (e.g. 2026-11).';
  }
  if (!input.description.trim() || input.description.trim().length < 3) {
    return 'Enter a clear revenue description (at least 3 characters).';
  }
  if (!Number.isFinite(input.amountInr) || input.amountInr < 0) {
    return 'Revenue amount must be a valid non-negative number.';
  }
  if (!Number.isFinite(input.refundedAmountInr) || input.refundedAmountInr < 0) {
    return 'Refund amount must be a valid non-negative number.';
  }
  if (input.refundedAmountInr > input.amountInr) {
    return 'Refund amount cannot exceed transaction amount.';
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.transactionDate.trim())) {
    return 'Transaction date must be in YYYY-MM-DD format.';
  }
  if (!input.referenceId.trim() || input.referenceId.trim().length < 3) {
    return 'Provide a transaction reference ID to prevent duplicate records.';
  }
  return null;
}

export function validateExpenseInput(input: {
  period: string;
  vendor: string;
  description: string;
  amountInr: number;
  expenseDate: string;
}): string | null {
  if (!isValidAccountingPeriod(input.period)) {
    return 'Accounting period must be in YYYY-MM format (e.g. 2026-11).';
  }
  if (!input.vendor.trim() || input.vendor.trim().length < 2) {
    return 'Enter the vendor or service name (e.g. Cloud Hosting, Firestore).';
  }
  if (!input.description.trim() || input.description.trim().length < 3) {
    return 'Enter a description of this legitimate operating expense.';
  }
  if (!Number.isFinite(input.amountInr) || input.amountInr <= 0) {
    return 'Operating expense amount must be greater than zero.';
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.expenseDate.trim())) {
    return 'Expense date must be in YYYY-MM-DD format.';
  }
  return null;
}

export function validateDonationInput(
  input: {
    period: string;
    charityOrganisation: string;
    amountInr: number;
    donationDate: string;
    paymentReference: string;
    status: CharityDonationRecord['status'];
  },
  availablePendingAllocationInr: number
): string | null {
  if (!isValidAccountingPeriod(input.period)) {
    return 'Reporting period must be in YYYY-MM format.';
  }
  if (!input.charityOrganisation.trim() || input.charityOrganisation.trim().length < 3) {
    return 'Enter the officially selected charity organisation name.';
  }
  if (!Number.isFinite(input.amountInr) || input.amountInr <= 0) {
    return 'Donation amount must be greater than ₹0.';
  }
  if (input.amountInr > availablePendingAllocationInr + 0.01) {
    return `Donation amount cannot exceed pending net proceeds allocation (${formatInr(availablePendingAllocationInr)}).`;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.donationDate.trim())) {
    return 'Donation date must be in YYYY-MM-DD format.';
  }
  if (
    input.status === 'donated' &&
    (!input.paymentReference.trim() || input.paymentReference.trim().length < 3)
  ) {
    return 'Payment reference is required before marking a donation as completed.';
  }
  return null;
}

/**
 * Computes VIDYORA Net Proceeds & 100% Charity Allocation for a period (or 'all').
 * Guarantees:
 *  - Unpaid/pending/failed transactions are NEVER counted as received revenue.
 *  - Duplicate record IDs are deduplicated so expenses/revenues are never double-counted.
 *  - Net Proceeds = Received Revenue - Refunds - Legitimate Operating Expenses.
 *  - Charity Allocation = 100% of Net Proceeds if Net Proceeds > 0, else 0.
 */
export function calculateFinancialSummary(
  revenues: RevenueRecord[],
  expenses: OperatingExpenseRecord[],
  donations: CharityDonationRecord[],
  period: string = 'all'
): FinancialPeriodSummary {
  const matchesPeriod = (p: string) => period === 'all' || p === period;

  // Deduplicate by record ID to guarantee zero double-deduction
  const uniqueRevenues = Array.from(
    new Map(
      revenues.filter((r) => matchesPeriod(r.period)).map((r) => [r.id, r])
    ).values()
  );
  const uniqueExpenses = Array.from(
    new Map(
      expenses.filter((e) => matchesPeriod(e.period)).map((e) => [e.id, e])
    ).values()
  );
  const uniqueDonations = Array.from(
    new Map(
      donations.filter((d) => matchesPeriod(d.period)).map((d) => [d.id, d])
    ).values()
  );

  let grossReceivedInr = 0;
  let refundsInr = 0;
  let excludedUnpaidOrFailedCount = 0;

  for (const rev of uniqueRevenues) {
    if (rev.status === 'failed' || rev.status === 'pending') {
      excludedUnpaidOrFailedCount += 1;
      continue;
    }
    const amt = Math.max(0, Number(rev.amountInr) || 0);
    if (rev.status === 'refunded') {
      grossReceivedInr += amt;
      refundsInr += amt;
    } else if (rev.status === 'received') {
      grossReceivedInr += amt;
      const partialRefund = Math.min(amt, Math.max(0, Number(rev.refundedAmountInr) || 0));
      refundsInr += partialRefund;
    }
  }

  const expenseBreakdown: Record<ExpenseCategory, number> = {
    hosting: 0,
    database: 0,
    payment_fees: 0,
    ai_services: 0,
    software_services: 0,
    other: 0,
  };

  let operatingExpensesInr = 0;
  for (const exp of uniqueExpenses) {
    const amt = Math.max(0, Number(exp.amountInr) || 0);
    operatingExpensesInr += amt;
    if (exp.category in expenseBreakdown) {
      expenseBreakdown[exp.category] = roundInr(expenseBreakdown[exp.category] + amt);
    } else {
      expenseBreakdown.other = roundInr(expenseBreakdown.other + amt);
    }
  }

  grossReceivedInr = roundInr(grossReceivedInr);
  refundsInr = roundInr(refundsInr);
  const eligibleRevenueInr = roundInr(grossReceivedInr - refundsInr);
  operatingExpensesInr = roundInr(operatingExpensesInr);
  const netProceedsInr = roundInr(eligibleRevenueInr - operatingExpensesInr);
  const charityAllocationInr = netProceedsInr > 0 ? netProceedsInr : 0;

  const donatedInr = roundInr(
    uniqueDonations
      .filter((d) => d.status === 'donated')
      .reduce((acc, d) => acc + Math.max(0, Number(d.amountInr) || 0), 0)
  );

  const pendingDonationInr = roundInr(Math.max(0, charityAllocationInr - donatedInr));

  let donationStatus: FinancialPeriodSummary['donationStatus'] = 'no_net_proceeds';
  if (charityAllocationInr <= 0) {
    donationStatus = 'no_net_proceeds';
  } else if (donatedInr <= 0) {
    donationStatus = 'pending_donation';
  } else if (pendingDonationInr > 0.01) {
    donationStatus = 'partially_donated';
  } else {
    donationStatus = 'donated';
  }

  return {
    period,
    currency: 'INR',
    grossReceivedInr,
    refundsInr,
    eligibleRevenueInr,
    operatingExpensesInr,
    netProceedsInr,
    charityAllocationInr,
    donatedInr,
    pendingDonationInr,
    donationStatus,
    excludedUnpaidOrFailedCount,
    expenseBreakdown,
  };
}

export function buildPublicCharitySummary(
  summary: FinancialPeriodSummary,
  donations: CharityDonationRecord[],
  publishedBy: string
): CharityPublicSummary {
  const completedDonations = donations
    .filter((d) => d.status === 'donated' && (summary.period === 'all' || d.period === summary.period))
    .sort((a, b) => b.donationDate.localeCompare(a.donationDate));

  const latest = completedDonations[0];

  return {
    period: summary.period,
    currency: 'INR',
    grossReceivedInr: summary.grossReceivedInr,
    refundsInr: summary.refundsInr,
    operatingExpensesInr: summary.operatingExpensesInr,
    netProceedsInr: summary.netProceedsInr,
    charityAllocationInr: summary.charityAllocationInr,
    donatedInr: summary.donatedInr,
    pendingDonationInr: summary.pendingDonationInr,
    donationStatus: summary.donationStatus,
    charityPartnerName: latest?.charityOrganisation || 'To be selected (Pending Charity Partner)',
    lastDonationDate: latest?.donationDate || 'Pending',
    lastDonationRef: latest?.paymentReference || 'Not yet disbursed',
    publishedBy,
  };
}
