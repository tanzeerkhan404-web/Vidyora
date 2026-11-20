import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  HeartHandshake,
  Plus,
  Send,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import {
  addDonationRecordInDb,
  addExpenseRecordInDb,
  addRevenueRecordInDb,
  deleteExpenseRecordInDb,
  deleteRevenueRecordInDb,
  publishPublicCharitySummaryInDb,
  subscribeAdminAuditLogs,
  subscribeAdminDonations,
  subscribeAdminExpenses,
  subscribeAdminRevenues,
} from '../services/charityRepository';
import {
  buildPublicCharitySummary,
  calculateFinancialSummary,
  formatInr,
  hasDuplicateTransactionReference,
  validateDonationInput,
  validateExpenseInput,
  validateRevenueInput,
  type CharityDonationRecord,
  type ExpenseCategory,
  type OperatingExpenseRecord,
  type RevenueRecord,
  type RevenueSource,
  type RevenueStatus,
} from '../utils/charityAccountingLogic';
import type { FirebaseAuthUser } from '../types/vidyora';

interface AdminCharityAccountingProps {
  authUser: FirebaseAuthUser;
}

const DEFAULT_PERIOD = new Date().toISOString().slice(0, 7); // YYYY-MM
const DEFAULT_DATE = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

export function AdminCharityAccounting({ authUser }: AdminCharityAccountingProps) {
  const [revenues, setRevenues] = useState<RevenueRecord[]>([]);
  const [expenses, setExpenses] = useState<OperatingExpenseRecord[]>([]);
  const [donations, setDonations] = useState<CharityDonationRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<
    Array<{
      id: string;
      adminLabel: string;
      action: string;
      targetType: string;
      targetId: string;
      summary: string;
      createdAt?: string;
    }>
  >([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>(DEFAULT_PERIOD);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Revenue form
  const [revSource, setRevSource] = useState<RevenueSource>('membership');
  const [revDesc, setRevDesc] = useState('');
  const [revAmount, setRevAmount] = useState('');
  const [revRefund, setRevRefund] = useState('0');
  const [revStatus, setRevStatus] = useState<RevenueStatus>('received');
  const [revDate, setRevDate] = useState(DEFAULT_DATE);
  const [revRef, setRevRef] = useState('');

  // Expense form
  const [expCategory, setExpCategory] = useState<ExpenseCategory>('hosting');
  const [expVendor, setExpVendor] = useState('');
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expDate, setExpDate] = useState(DEFAULT_DATE);
  const [expInvoice, setExpInvoice] = useState('');

  // Donation form
  const [donOrg, setDonOrg] = useState('');
  const [donAmount, setDonAmount] = useState('');
  const [donDate, setDonDate] = useState(DEFAULT_DATE);
  const [donRef, setDonRef] = useState('');
  const [donReceipt, setDonReceipt] = useState('');
  const [donStatus, setDonStatus] = useState<CharityDonationRecord['status']>('donated');

  useEffect(() => {
    const u1 = subscribeAdminRevenues(setRevenues);
    const u2 = subscribeAdminExpenses(setExpenses);
    const u3 = subscribeAdminDonations(setDonations);
    const u4 = subscribeAdminAuditLogs(setAuditLogs);
    return () => {
      u1();
      u2();
      u3();
      u4();
    };
  }, []);

  const summary = useMemo(
    () => calculateFinancialSummary(revenues, expenses, donations, selectedPeriod),
    [revenues, expenses, donations, selectedPeriod]
  );

  const periodOptions = useMemo(() => {
    const set = new Set<string>([DEFAULT_PERIOD]);
    revenues.forEach((r) => r.period && set.add(r.period));
    expenses.forEach((e) => e.period && set.add(e.period));
    donations.forEach((d) => d.period && set.add(d.period));
    return ['all', ...Array.from(set).sort().reverse()];
  }, [revenues, expenses, donations]);

  const adminLabel = authUser.email || authUser.displayName;

  const handleAddRevenue = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const periodToUse = selectedPeriod === 'all' ? revDate.slice(0, 7) : selectedPeriod;
    const payload = {
      period: periodToUse,
      source: revSource,
      description: revDesc,
      amountInr: Number(revAmount),
      refundedAmountInr: Number(revRefund) || 0,
      status: revStatus,
      transactionDate: revDate,
      referenceId: revRef,
    };

    const err = validateRevenueInput(payload);
    if (err) {
      setMessage({ type: 'error', text: err });
      return;
    }
    if (hasDuplicateTransactionReference(revenues, payload.referenceId)) {
      setMessage({
        type: 'error',
        text: `Duplicate transaction reference "${payload.referenceId}" detected. Blocked to prevent double-counting revenue.`,
      });
      return;
    }

    setBusy(true);
    try {
      await addRevenueRecordInDb(payload, authUser.uid, adminLabel);
      setRevDesc('');
      setRevAmount('');
      setRevRefund('0');
      setRevRef('');
      setMessage({ type: 'success', text: 'Revenue record saved and audit-logged.' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save revenue record.',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const periodToUse = selectedPeriod === 'all' ? expDate.slice(0, 7) : selectedPeriod;
    const payload = {
      period: periodToUse,
      category: expCategory,
      vendor: expVendor,
      description: expDesc,
      amountInr: Number(expAmount),
      expenseDate: expDate,
      invoiceRef: expInvoice || undefined,
    };

    const err = validateExpenseInput(payload);
    if (err) {
      setMessage({ type: 'error', text: err });
      return;
    }

    setBusy(true);
    try {
      await addExpenseRecordInDb(payload, authUser.uid, adminLabel);
      setExpVendor('');
      setExpDesc('');
      setExpAmount('');
      setExpInvoice('');
      setMessage({ type: 'success', text: 'Operating expense saved and audit-logged.' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save expense record.',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleRecordDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const periodToUse = selectedPeriod === 'all' ? donDate.slice(0, 7) : selectedPeriod;
    const payload = {
      period: periodToUse,
      charityOrganisation: donOrg,
      amountInr: Number(donAmount),
      donationDate: donDate,
      paymentReference: donRef,
      receiptNote: donReceipt || undefined,
      status: donStatus,
    };

    const err = validateDonationInput(payload, summary.pendingDonationInr);
    if (err) {
      setMessage({ type: 'error', text: err });
      return;
    }

    setBusy(true);
    try {
      await addDonationRecordInDb(payload, authUser.uid, adminLabel);
      setDonOrg('');
      setDonAmount('');
      setDonRef('');
      setDonReceipt('');
      setMessage({
        type: 'success',
        text: 'Authorised charity donation record saved and audit-logged.',
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save donation record.',
      });
    } finally {
      setBusy(false);
    }
  };

  const handlePublishPublicSummary = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const publicSummary = buildPublicCharitySummary(summary, donations, authUser.uid);
      await publishPublicCharitySummaryInDb(publicSummary, authUser.uid, adminLabel);
      setMessage({
        type: 'success',
        text: `Approved public summary published for period "${summary.period}"! Internal line items remain private.`,
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to publish public summary.',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Accounting Period Selector */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-[#0B1221] flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-[#6D28D9]" aria-hidden="true" />
            <span>VIDYORA Charity Accounting System (Private Admin Ledger)</span>
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Net Proceeds = Received Revenue − Refunds − Legitimate Operating Expenses. 100% of positive Net Proceeds are allocated to charity. No automatic transfers occur.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <label htmlFor="charity-period" className="text-xs font-semibold text-slate-700">
            Period:
          </label>
          <select
            id="charity-period"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 min-h-[40px] rounded-xl border border-slate-300 text-xs font-semibold bg-white text-[#0B1221]"
          >
            {periodOptions.map((p) => (
              <option key={p} value={p}>
                {p === 'all' ? 'All Periods Combined' : p}
              </option>
            ))}
          </select>

          <button
            type="button"
            disabled={busy}
            onClick={handlePublishPublicSummary}
            className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] rounded-xl bg-[#6D28D9] hover:bg-[#7C3AED] text-white text-xs font-semibold cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Publish Approved Public Summary</span>
          </button>
        </div>
      </div>

      {message && (
        <div
          role={message.type === 'error' ? 'alert' : 'status'}
          className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-start gap-2 ${
            message.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          {message.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Live Financial Summary KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-[11px] font-semibold text-slate-500 uppercase">Received Rev</p>
          <p className="mt-1 font-display text-lg font-extrabold text-[#0B1221] tabular-nums">
            {formatInr(summary.grossReceivedInr)}
          </p>
          <p className="text-[11px] text-slate-500">
            {summary.excludedUnpaidOrFailedCount} failed/unpaid excl.
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-[11px] font-semibold text-slate-500 uppercase">Refunds</p>
          <p className="mt-1 font-display text-lg font-extrabold text-amber-700 tabular-nums">
            {formatInr(summary.refundsInr)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-[11px] font-semibold text-slate-500 uppercase">Operating Exp</p>
          <p className="mt-1 font-display text-lg font-extrabold text-rose-700 tabular-nums">
            {formatInr(summary.operatingExpensesInr)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-purple-200 p-4">
          <p className="text-[11px] font-semibold text-[#6D28D9] uppercase">Net Proceeds</p>
          <p className="mt-1 font-display text-lg font-extrabold text-[#0B1221] tabular-nums">
            {formatInr(summary.netProceedsInr)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-blue-200 p-4">
          <p className="text-[11px] font-semibold text-[#2563EB] uppercase">100% Allocation</p>
          <p className="mt-1 font-display text-lg font-extrabold text-[#0B1221] tabular-nums">
            {formatInr(summary.charityAllocationInr)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-emerald-200 p-4">
          <p className="text-[11px] font-semibold text-emerald-700 uppercase">Pending / Donated</p>
          <p className="mt-1 font-display text-sm font-extrabold text-[#0B1221] tabular-nums">
            {formatInr(summary.pendingDonationInr)} / {formatInr(summary.donatedInr)}
          </p>
          <p className="text-[11px] text-slate-500 capitalize">
            {summary.donationStatus.replace(/_/g, ' ')}
          </p>
        </div>
      </div>

      {/* Entry Forms Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 1. Revenue Form */}
        <form
          onSubmit={handleAddRevenue}
          className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3"
        >
          <h3 className="font-display text-sm font-bold text-[#0B1221]">
            1. Record Revenue / Refund
          </h3>
          <select
            value={revSource}
            onChange={(e) => setRevSource(e.target.value as RevenueSource)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
          >
            <option value="membership">Membership Revenue</option>
            <option value="institutional">Institutional / Partner</option>
            <option value="other">Other Eligible Revenue</option>
          </select>
          <input
            type="text"
            required
            value={revDesc}
            onChange={(e) => setRevDesc(e.target.value)}
            placeholder="Description (e.g. Student Plan Batch)"
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={revAmount}
              onChange={(e) => setRevAmount(e.target.value)}
              placeholder="Amount (₹)"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
            />
            <input
              type="number"
              min="0"
              step="0.01"
              value={revRefund}
              onChange={(e) => setRevRefund(e.target.value)}
              placeholder="Refunded (₹)"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={revStatus}
              onChange={(e) => setRevStatus(e.target.value as RevenueStatus)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
            >
              <option value="received">Received</option>
              <option value="pending">Pending (Unpaid)</option>
              <option value="failed">Failed (Excluded)</option>
              <option value="refunded">Fully Refunded</option>
            </select>
            <input
              type="date"
              required
              value={revDate}
              onChange={(e) => setRevDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
            />
          </div>
          <input
            type="text"
            required
            value={revRef}
            onChange={(e) => setRevRef(e.target.value)}
            placeholder="Unique Transaction Ref (prevents duplicates)"
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#0B1221] hover:bg-[#1E2E4D] text-white text-xs font-semibold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Add Revenue Entry</span>
          </button>
        </form>

        {/* 2. Operating Expense Form */}
        <form
          onSubmit={handleAddExpense}
          className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3"
        >
          <h3 className="font-display text-sm font-bold text-[#0B1221]">
            2. Record Operating Expense
          </h3>
          <select
            value={expCategory}
            onChange={(e) => setExpCategory(e.target.value as ExpenseCategory)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
          >
            <option value="hosting">Cloud Hosting</option>
            <option value="database">Database (Firestore)</option>
            <option value="payment_fees">Payment Processing Fees</option>
            <option value="ai_services">AI Services (Gemini API)</option>
            <option value="software_services">Software / Domain Services</option>
            <option value="other">Other Legitimate Expense</option>
          </select>
          <input
            type="text"
            required
            value={expVendor}
            onChange={(e) => setExpVendor(e.target.value)}
            placeholder="Vendor (e.g. Google Cloud, Razorpay)"
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
          />
          <input
            type="text"
            required
            value={expDesc}
            onChange={(e) => setExpDesc(e.target.value)}
            placeholder="Expense description"
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              value={expAmount}
              onChange={(e) => setExpAmount(e.target.value)}
              placeholder="Amount (₹)"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
            />
            <input
              type="date"
              required
              value={expDate}
              onChange={(e) => setExpDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
            />
          </div>
          <input
            type="text"
            value={expInvoice}
            onChange={(e) => setExpInvoice(e.target.value)}
            placeholder="Invoice / Receipt Ref (optional)"
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#0B1221] hover:bg-[#1E2E4D] text-white text-xs font-semibold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Add Operating Expense</span>
          </button>
        </form>

        {/* 3. Authorised Donation Record Form */}
        <form
          onSubmit={handleRecordDonation}
          className="bg-white rounded-2xl border border-purple-200 p-5 space-y-3"
        >
          <h3 className="font-display text-sm font-bold text-[#0B1221]">
            3. Record Authorised Donation
          </h3>
          <p className="text-[11px] text-slate-600">
            Pending Charity Allocation available: <strong>{formatInr(summary.pendingDonationInr)}</strong>. Record only after an officially verified charity partner is selected.
          </p>
          <input
            type="text"
            required
            value={donOrg}
            onChange={(e) => setDonOrg(e.target.value)}
            placeholder="Verified Charity Organisation Name"
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min="1"
              step="0.01"
              required
              value={donAmount}
              onChange={(e) => setDonAmount(e.target.value)}
              placeholder="Amount (₹)"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
            />
            <input
              type="date"
              required
              value={donDate}
              onChange={(e) => setDonDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
            />
          </div>
          <select
            value={donStatus}
            onChange={(e) =>
              setDonStatus(e.target.value as CharityDonationRecord['status'])
            }
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
          >
            <option value="donated">Donated (Receipt Verified)</option>
            <option value="scheduled">Scheduled (Pending Transfer)</option>
            <option value="pending_partner">Pending Partner Selection</option>
          </select>
          <input
            type="text"
            required={donStatus === 'donated'}
            value={donRef}
            onChange={(e) => setDonRef(e.target.value)}
            placeholder="Bank / UTR Payment Reference"
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
          />
          <input
            type="text"
            value={donReceipt}
            onChange={(e) => setDonReceipt(e.target.value)}
            placeholder="Supporting Receipt ID / Note"
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
          />
          <button
            type="submit"
            disabled={busy || summary.pendingDonationInr <= 0}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#6D28D9] hover:bg-[#7C3AED] disabled:bg-slate-300 text-white text-xs font-semibold cursor-pointer"
          >
            <HeartHandshake className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Record Authorised Donation</span>
          </button>
        </form>
      </div>

      {/* Private Ledgers + Financial Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
          <h3 className="font-display text-sm font-bold text-[#0B1221] flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-[#2563EB]" aria-hidden="true" />
            <span>Recorded Revenues ({revenues.length}) &amp; Expenses ({expenses.length})</span>
          </h3>
          {revenues.length === 0 && expenses.length === 0 ? (
            <p className="text-xs text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-200">
              No internal financial records yet. All entries added above are securely restricted to administrators.
            </p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {revenues.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-[#0B1221] truncate">
                      [REV · {r.status}] {r.description} ({r.period})
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {formatInr(r.amountInr)} • Refund: {formatInr(r.refundedAmountInr)} • Ref: {r.referenceId}
                    </p>
                  </div>
                  {confirmDeleteId === `rev-${r.id}` ? (
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteRevenueRecordInDb(r.id, authUser.uid, adminLabel);
                        setConfirmDeleteId(null);
                      }}
                      className="px-2 py-1 rounded bg-red-600 text-white text-[11px] font-semibold cursor-pointer"
                    >
                      Confirm
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(`rev-${r.id}`)}
                      aria-label={`Delete revenue ${r.referenceId}`}
                      className="text-red-600 hover:bg-red-50 p-1.5 rounded cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
              {expenses.map((ex) => (
                <div
                  key={ex.id}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-rose-50/40 border border-rose-200/70 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-[#0B1221] truncate">
                      [EXP · {ex.category}] {ex.vendor} — {ex.description}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      -{formatInr(ex.amountInr)} • {ex.expenseDate}
                    </p>
                  </div>
                  {confirmDeleteId === `exp-${ex.id}` ? (
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteExpenseRecordInDb(ex.id, authUser.uid, adminLabel);
                        setConfirmDeleteId(null);
                      }}
                      className="px-2 py-1 rounded bg-red-600 text-white text-[11px] font-semibold cursor-pointer"
                    >
                      Confirm
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(`exp-${ex.id}`)}
                      aria-label={`Delete expense ${ex.vendor}`}
                      className="text-red-600 hover:bg-red-50 p-1.5 rounded cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Audit Logs */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
          <h3 className="font-display text-sm font-bold text-[#0B1221] flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-[#6D28D9]" aria-hidden="true" />
            <span>Immutable Admin Audit Trail ({auditLogs.length})</span>
          </h3>
          {auditLogs.length === 0 ? (
            <p className="text-xs text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-200">
              Every revenue, expense, donation, and public-summary change is automatically logged here.
            </p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                >
                  <p className="font-semibold text-[#0B1221]">
                    {log.action} · <span className="text-[#6D28D9]">{log.targetType}</span>
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5">{log.summary}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    By {log.adminLabel} {log.createdAt ? `• ${new Date(log.createdAt).toLocaleString('en-IN')}` : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
