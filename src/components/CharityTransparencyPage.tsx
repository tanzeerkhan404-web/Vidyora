import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  FileCheck2,
  HeartHandshake,
  Info,
  Scale,
  ShieldCheck,
} from 'lucide-react';
import { subscribePublicCharitySummary } from '../services/charityRepository';
import {
  formatInr,
  type CharityPublicSummary,
} from '../utils/charityAccountingLogic';

interface CharityTransparencyPageProps {
  onOpenPlans: () => void;
  onOpenAdmin?: () => void;
  isAdmin?: boolean;
}

const DEFAULT_PENDING_SUMMARY: CharityPublicSummary = {
  period: 'Current Launch Period',
  currency: 'INR',
  grossReceivedInr: 0,
  refundsInr: 0,
  operatingExpensesInr: 0,
  netProceedsInr: 0,
  charityAllocationInr: 0,
  donatedInr: 0,
  pendingDonationInr: 0,
  donationStatus: 'no_net_proceeds',
  charityPartnerName: 'To be selected (Official charity partner pending)',
  lastDonationDate: 'Pending partner selection',
  lastDonationRef: 'No donation disbursed yet',
  publishedBy: 'system',
};

export function CharityTransparencyPage({
  onOpenPlans,
  onOpenAdmin,
  isAdmin,
}: CharityTransparencyPageProps) {
  const [summary, setSummary] = useState<CharityPublicSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribePublicCharitySummary(
      (data) => {
        setSummary(data);
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const display = summary || DEFAULT_PENDING_SUMMARY;

  const statusMeta: Record<
    CharityPublicSummary['donationStatus'],
    { label: string; badgeClass: string; note: string }
  > = {
    no_net_proceeds: {
      label: '₹0 Net Proceeds — No Donation Due Yet',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      note: 'No positive net proceeds are recorded yet for this period. VIDYORA never invents donations or reports a positive donation when net proceeds are zero or negative.',
    },
    pending_donation: {
      label: 'Pending Donation (Allocation Reserved)',
      badgeClass: 'bg-amber-50 text-amber-900 border-amber-200',
      note: '100% of net proceeds for this period are reserved for charity and marked as Pending Donation until an officially verified charity partner receives the disbursement.',
    },
    partially_donated: {
      label: 'Partially Donated — Remainder Pending',
      badgeClass: 'bg-blue-50 text-blue-900 border-blue-200',
      note: 'Part of the net proceeds allocation has been donated with a recorded reference, and the remaining balance stays reserved as Pending Donation.',
    },
    donated: {
      label: 'Donated (Verified Reference Recorded)',
      badgeClass: 'bg-emerald-50 text-emerald-900 border-emerald-200',
      note: '100% of net proceeds for this reporting period have been recorded as donated with payment reference verification.',
    },
  };

  const currentStatus = statusMeta[display.donationStatus];

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Hero Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-[#0B1221] via-[#131E35] to-[#2E1065] text-white p-6 sm:p-10 border border-white/10 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-3xl space-y-3">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-purple-200">
              <HeartHandshake className="w-3.5 h-3.5" aria-hidden="true" />
              <span>VIDYORA Education Impact Programme</span>
            </span>
            <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight">
              100% of Net Proceeds Committed to Charity
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              VIDYORA is built to make quality learning affordable and accessible. After deducting verified refunds and legitimate platform operating expenses (hosting, database, payment processing fees, AI &amp; software services), <strong>100% of net proceeds</strong> are allocated to charitable impact.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onOpenPlans}
              className="px-4 py-2.5 min-h-[44px] rounded-xl bg-white text-[#0B1221] hover:bg-blue-50 text-sm font-semibold cursor-pointer"
            >
              View Membership Plans
            </button>
            {isAdmin && onOpenAdmin && (
              <button
                type="button"
                onClick={onOpenAdmin}
                className="px-4 py-2.5 min-h-[44px] rounded-xl bg-[#6D28D9] hover:bg-[#7C3AED] text-white text-sm font-semibold cursor-pointer"
              >
                Open Admin Finance Ledger
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Formula Strip */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
            <Scale className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="space-y-1.5">
            <h2 className="font-display text-base font-bold text-[#0B1221]">
              Transparent Accounting Formula
            </h2>
            <p className="text-sm font-mono text-[#6D28D9] bg-[#F5F3FF] px-3 py-2 rounded-xl border border-purple-200/70">
              Net Proceeds = Received Eligible Revenue − Refunds − Legitimate Operating Expenses
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Charity Allocation = 100% of Net Proceeds (if positive; ₹0 when net proceeds are zero or negative). Unpaid or failed payment attempts are never counted as revenue, and internal accounting ledgers stay private while approved public summaries are published here.
            </p>
          </div>
        </div>
      </div>

      {/* Public Summary Cards */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold text-[#0B1221]">
              Approved Public Financial Summary
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Reporting Period: <strong className="text-[#0B1221]">{display.period}</strong>
              {display.publishedAt
                ? ` • Published ${new Date(display.publishedAt).toLocaleDateString('en-IN')}`
                : ' • Awaiting first published accounting period'}
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${currentStatus.badgeClass}`}
          >
            {display.donationStatus === 'donated' ? (
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Clock className="w-4 h-4" aria-hidden="true" />
            )}
            <span>{currentStatus.label}</span>
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500 bg-white rounded-2xl border border-slate-200">
            Loading approved transparency report...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Revenue Received
              </p>
              <p className="mt-2 font-display text-2xl font-extrabold text-[#0B1221] tabular-nums">
                {formatInr(display.grossReceivedInr)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Verified received payments only (excludes unpaid/failed)
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Refunds Deducted
              </p>
              <p className="mt-2 font-display text-2xl font-extrabold text-[#0B1221] tabular-nums">
                {formatInr(display.refundsInr)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Full or partial student membership refunds
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Legitimate Operating Expenses
              </p>
              <p className="mt-2 font-display text-2xl font-extrabold text-[#0B1221] tabular-nums">
                {formatInr(display.operatingExpensesInr)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Hosting, database, payment fees, AI &amp; software services
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-purple-200 p-5 bg-gradient-to-b from-white to-[#F5F3FF]/50">
              <p className="text-xs font-semibold text-[#6D28D9] uppercase tracking-wider">
                Net Proceeds
              </p>
              <p className="mt-2 font-display text-2xl font-extrabold text-[#0B1221] tabular-nums">
                {formatInr(display.netProceedsInr)}
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Eligible Revenue minus Operating Expenses
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-blue-200 p-5 bg-gradient-to-b from-white to-[#EFF6FF]/60">
              <p className="text-xs font-semibold text-[#2563EB] uppercase tracking-wider">
                100% Charity Allocation
              </p>
              <p className="mt-2 font-display text-2xl font-extrabold text-[#0B1221] tabular-nums">
                {formatInr(display.charityAllocationInr)}
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Donated: {formatInr(display.donatedInr)} • Pending: {formatInr(display.pendingDonationInr)}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Charity Partner &amp; Reference
              </p>
              <p className="mt-2 font-display text-base font-bold text-[#0B1221]">
                {display.charityPartnerName}
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Date: {display.lastDonationDate}
              </p>
              <p className="text-xs text-slate-500 truncate">
                Ref: {display.lastDonationRef}
              </p>
            </div>
          </div>
        )}

        {/* Honest Status & Governance Note */}
        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 space-y-2.5 text-xs text-slate-700 leading-relaxed">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" aria-hidden="true" />
            <p>{currentStatus.note}</p>
          </div>
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#6D28D9] shrink-0 mt-0.5" aria-hidden="true" />
            <p>
              <strong>No Automated Transfers or Fabricated Claims:</strong> VIDYORA does not execute automated charity bank transfers, never invents charity names, and records audit-logged entries only after authorised administrator review and official receipt verification.
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <FileCheck2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
            <p>
              <strong>Partner Selection:</strong> The official charitable organisation and partnership will be announced here once formally selected and verified.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
