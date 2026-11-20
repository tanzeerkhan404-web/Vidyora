import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPublicCharitySummary,
  calculateFinancialSummary,
  hasDuplicateTransactionReference,
  validateDonationInput,
  validateExpenseInput,
  validateRevenueInput,
  type CharityDonationRecord,
  type OperatingExpenseRecord,
  type RevenueRecord,
} from './charityAccountingLogic';

test('excludes failed and unpaid/pending transactions from received revenue', () => {
  const revenues: RevenueRecord[] = [
    {
      id: 'r1',
      period: '2026-11',
      source: 'membership',
      description: 'Student Plan',
      amountInr: 49,
      refundedAmountInr: 0,
      status: 'received',
      transactionDate: '2026-11-01',
      referenceId: 'TXN-001',
      recordedBy: 'admin1',
    },
    {
      id: 'r2',
      period: '2026-11',
      source: 'membership',
      description: 'Failed Checkout',
      amountInr: 99,
      refundedAmountInr: 0,
      status: 'failed',
      transactionDate: '2026-11-02',
      referenceId: 'TXN-002',
      recordedBy: 'admin1',
    },
    {
      id: 'r3',
      period: '2026-11',
      source: 'membership',
      description: 'Pending Invoice',
      amountInr: 99,
      refundedAmountInr: 0,
      status: 'pending',
      transactionDate: '2026-11-03',
      referenceId: 'TXN-003',
      recordedBy: 'admin1',
    },
  ];

  const summary = calculateFinancialSummary(revenues, [], [], '2026-11');
  assert.equal(summary.grossReceivedInr, 49);
  assert.equal(summary.excludedUnpaidOrFailedCount, 2);
  assert.equal(summary.netProceedsInr, 49);
  assert.equal(summary.charityAllocationInr, 49);
  assert.equal(summary.donationStatus, 'pending_donation');
});

test('deducts refunds and legitimate operating expenses without double counting', () => {
  const revenues: RevenueRecord[] = [
    {
      id: 'r1',
      period: '2026-11',
      source: 'membership',
      description: 'Pro Learner Batch',
      amountInr: 1000,
      refundedAmountInr: 99,
      status: 'received',
      transactionDate: '2026-11-05',
      referenceId: 'TXN-100',
      recordedBy: 'admin1',
    },
    {
      id: 'r2',
      period: '2026-11',
      source: 'membership',
      description: 'Full Refund Order',
      amountInr: 49,
      refundedAmountInr: 49,
      status: 'refunded',
      transactionDate: '2026-11-06',
      referenceId: 'TXN-101',
      recordedBy: 'admin1',
    },
  ];
  const expenses: OperatingExpenseRecord[] = [
    {
      id: 'e1',
      period: '2026-11',
      category: 'hosting',
      vendor: 'Cloud Hosting',
      description: 'Server hosting',
      amountInr: 300,
      expenseDate: '2026-11-07',
      recordedBy: 'admin1',
    },
    // Duplicate ID passed accidentally should NOT be double-deducted
    {
      id: 'e1',
      period: '2026-11',
      category: 'hosting',
      vendor: 'Cloud Hosting',
      description: 'Server hosting',
      amountInr: 300,
      expenseDate: '2026-11-07',
      recordedBy: 'admin1',
    },
    {
      id: 'e2',
      period: '2026-11',
      category: 'ai_services',
      vendor: 'Gemini API',
      description: 'AI usage',
      amountInr: 150,
      expenseDate: '2026-11-08',
      recordedBy: 'admin1',
    },
  ];

  const summary = calculateFinancialSummary(revenues, expenses, [], '2026-11');
  assert.equal(summary.grossReceivedInr, 1049);
  assert.equal(summary.refundsInr, 148);
  assert.equal(summary.eligibleRevenueInr, 901);
  assert.equal(summary.operatingExpensesInr, 450);
  assert.equal(summary.netProceedsInr, 451);
  assert.equal(summary.charityAllocationInr, 451);
  assert.equal(summary.pendingDonationInr, 451);
});

test('never creates a positive charity allocation when net proceeds are zero or negative', () => {
  const revenues: RevenueRecord[] = [
    {
      id: 'r1',
      period: '2026-11',
      source: 'membership',
      description: 'Small revenue',
      amountInr: 100,
      refundedAmountInr: 0,
      status: 'received',
      transactionDate: '2026-11-01',
      referenceId: 'TXN-201',
      recordedBy: 'admin1',
    },
  ];
  const expenses: OperatingExpenseRecord[] = [
    {
      id: 'e1',
      period: '2026-11',
      category: 'database',
      vendor: 'Firestore',
      description: 'Database tier',
      amountInr: 350,
      expenseDate: '2026-11-02',
      recordedBy: 'admin1',
    },
  ];

  const summary = calculateFinancialSummary(revenues, expenses, [], '2026-11');
  assert.equal(summary.netProceedsInr, -250);
  assert.equal(summary.charityAllocationInr, 0);
  assert.equal(summary.pendingDonationInr, 0);
  assert.equal(summary.donationStatus, 'no_net_proceeds');
});

test('tracks completed donations and prevents over-donation or missing reference', () => {
  const donations: CharityDonationRecord[] = [
    {
      id: 'd1',
      period: '2026-11',
      charityOrganisation: 'Verified Education Trust',
      amountInr: 200,
      donationDate: '2026-11-20',
      paymentReference: 'UTR-998877',
      status: 'donated',
      recordedBy: 'admin1',
    },
  ];
  const revenues: RevenueRecord[] = [
    {
      id: 'r1',
      period: '2026-11',
      source: 'membership',
      description: 'Subscriptions',
      amountInr: 500,
      refundedAmountInr: 0,
      status: 'received',
      transactionDate: '2026-11-10',
      referenceId: 'TXN-300',
      recordedBy: 'admin1',
    },
  ];

  const summary = calculateFinancialSummary(revenues, [], donations, '2026-11');
  assert.equal(summary.donatedInr, 200);
  assert.equal(summary.pendingDonationInr, 300);
  assert.equal(summary.donationStatus, 'partially_donated');

  assert.ok(
    validateDonationInput(
      {
        period: '2026-11',
        charityOrganisation: 'Trust',
        amountInr: 400,
        donationDate: '2026-11-21',
        paymentReference: 'UTR-111',
        status: 'donated',
      },
      summary.pendingDonationInr
    ) !== null
  );

  const pub = buildPublicCharitySummary(summary, donations, 'admin1');
  assert.equal(pub.charityPartnerName, 'Verified Education Trust');
  assert.equal(pub.lastDonationRef, 'UTR-998877');
});

test('detects duplicate transaction references and validates forms', () => {
  const existing: RevenueRecord[] = [
    {
      id: 'r1',
      period: '2026-11',
      source: 'membership',
      description: 'Order 1',
      amountInr: 49,
      refundedAmountInr: 0,
      status: 'received',
      transactionDate: '2026-11-10',
      referenceId: 'PAY_ABC123',
      recordedBy: 'admin1',
    },
  ];
  assert.equal(hasDuplicateTransactionReference(existing, 'pay_abc123'), true);
  assert.equal(hasDuplicateTransactionReference(existing, 'PAY_NEW999'), false);
  assert.ok(
    validateRevenueInput({
      period: 'invalid',
      description: 'Test',
      amountInr: 49,
      refundedAmountInr: 0,
      status: 'received',
      transactionDate: '2026-11-10',
      referenceId: 'REF1',
    }) !== null
  );
  assert.ok(
    validateExpenseInput({
      period: '2026-11',
      vendor: 'GCP',
      description: 'Hosting',
      amountInr: -5,
      expenseDate: '2026-11-10',
    }) !== null
  );
});
