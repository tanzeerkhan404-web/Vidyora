import type {
  LearningPackage,
  MembershipPlan,
  PaymentConfirmationProof,
} from '../types/vidyora';

export interface EffectivePriceResult {
  originalPriceInr: number;
  finalPriceInr: number;
  hasActiveOffer: boolean;
  discountPercent: number;
  savingsInr: number;
}

export interface ValidationOutcome {
  valid: boolean;
  error?: string;
}

export interface ComparisonRow {
  label: string;
  free: string;
  student: string;
  pro: string;
}

export function calculateEffectivePrice(
  plan: Pick<MembershipPlan, 'priceInr' | 'offer'>
): EffectivePriceResult {
  const original = Math.max(0, Math.round(plan.priceInr));
  const rawDiscount = plan.offer?.active ? Number(plan.offer.discountPercent) : 0;
  const discountPercent =
    Number.isFinite(rawDiscount) && rawDiscount > 0
      ? Math.min(90, Math.round(rawDiscount))
      : 0;

  if (original === 0 || discountPercent === 0) {
    return {
      originalPriceInr: original,
      finalPriceInr: original,
      hasActiveOffer: false,
      discountPercent: 0,
      savingsInr: 0,
    };
  }

  const finalPriceInr = Math.max(0, Math.round(original * (1 - discountPercent / 100)));
  return {
    originalPriceInr: original,
    finalPriceInr,
    hasActiveOffer: true,
    discountPercent,
    savingsInr: original - finalPriceInr,
  };
}

/**
 * Payment Preparation Security Guard:
 * Paid plans can NEVER be activated without backend-verified payment confirmation
 * while payment gateways are inactive.
 */
export function canActivatePaidPlan(
  planId: MembershipPlan['id'],
  confirmation?: PaymentConfirmationProof | null
): boolean {
  if (planId === 'free') {
    return true;
  }
  if (!confirmation) {
    return false;
  }
  return (
    confirmation.gatewayActive === true &&
    confirmation.verifiedByServer === true &&
    confirmation.planId === planId &&
    typeof confirmation.receiptId === 'string' &&
    confirmation.receiptId.trim().length >= 8
  );
}

export function validateAdminPlanEdit(plan: MembershipPlan): ValidationOutcome {
  if (!plan.name || plan.name.trim().length < 2 || plan.name.trim().length > 60) {
    return { valid: false, error: 'Plan name 2 se 60 characters ke beech hona chahiye.' };
  }
  if (!Number.isFinite(plan.priceInr) || plan.priceInr < 0 || plan.priceInr > 9999) {
    return { valid: false, error: 'Price ₹0 se ₹9999 ke beech valid number hona chahiye.' };
  }
  if (plan.id === 'free' && plan.priceInr !== 0) {
    return { valid: false, error: 'Free Plan ka price hamesha ₹0 rehna chahiye.' };
  }
  if (!Number.isFinite(plan.aiDailyLimit) || plan.aiDailyLimit < 5 || plan.aiDailyLimit > 1000) {
    return { valid: false, error: 'AI daily limit 5 se 1000 requests/day ke beech set karein.' };
  }
  if (!Array.isArray(plan.features) || plan.features.filter((f) => f.trim()).length === 0) {
    return { valid: false, error: 'Kam se kam 1 plan feature add karein.' };
  }
  if (!Array.isArray(plan.benefits) || plan.benefits.filter((b) => b.trim()).length === 0) {
    return { valid: false, error: 'Kam se kam 1 membership benefit add karein.' };
  }
  if (plan.offer.active) {
    if (
      !Number.isFinite(plan.offer.discountPercent) ||
      plan.offer.discountPercent < 1 ||
      plan.offer.discountPercent > 90
    ) {
      return { valid: false, error: 'Active offer discount 1% se 90% ke beech hona chahiye.' };
    }
    if (!plan.offer.label || plan.offer.label.trim().length < 2) {
      return { valid: false, error: 'Active offer ke liye short offer label enter karein.' };
    }
  }
  return { valid: true };
}

export function validateAdminPackageEdit(pkg: LearningPackage): ValidationOutcome {
  if (!pkg.name || pkg.name.trim().length < 3 || pkg.name.trim().length > 80) {
    return { valid: false, error: 'Package name 3 se 80 characters ke beech hona chahiye.' };
  }
  if (!pkg.description || pkg.description.trim().length < 15) {
    return { valid: false, error: 'Package description kam se kam 15 characters ki honi chahiye.' };
  }
  if (!Array.isArray(pkg.subjects) || pkg.subjects.filter((s) => s.trim()).length === 0) {
    return { valid: false, error: 'Kam se kam 1 subject add karein.' };
  }
  if (
    !Array.isArray(pkg.includedResources) ||
    pkg.includedResources.filter((r) => r.trim()).length === 0
  ) {
    return { valid: false, error: 'Kam se kam 1 included learning resource add karein.' };
  }
  return { valid: true };
}

export function buildPlanComparisonRows(plans: MembershipPlan[]): ComparisonRow[] {
  const free = plans.find((p) => p.id === 'free');
  const student = plans.find((p) => p.id === 'student');
  const pro = plans.find((p) => p.id === 'pro');

  const formatPrice = (p?: MembershipPlan) => {
    if (!p) return '—';
    const eff = calculateEffectivePrice(p);
    if (eff.finalPriceInr === 0) return '₹0 (Forever)';
    return `₹${eff.finalPriceInr}/month`;
  };

  return [
    {
      label: 'Monthly Price',
      free: formatPrice(free),
      student: formatPrice(student),
      pro: formatPrice(pro),
    },
    {
      label: 'Daily AI Usage Limit',
      free: `${free?.aiDailyLimit ?? 40} requests / day`,
      student: `${student?.aiDailyLimit ?? 120} requests / day`,
      pro: `${pro?.aiDailyLimit ?? 250} requests / day`,
    },
    {
      label: 'Video Lessons & Visual Animations',
      free: 'Sample & Core Lessons',
      student: 'Full School & College Tracks',
      pro: 'All Tracks + Exam Drills',
    },
    {
      label: 'AI Study Buddy & Doubt Solver',
      free: 'Included (Daily Quota)',
      student: 'Expanded Quota + Priority',
      pro: 'Maximum Quota + Deep Steps',
    },
    {
      label: 'AI Notes, Formula Sheets & Mind Maps',
      free: 'Included + PDF Export',
      student: 'Board & Semester Revision Packs',
      pro: 'Unlimited Revision & Cloud Archive',
    },
    {
      label: 'Quizzes & Competitive Mock Tests',
      free: 'Chapter Practice Quizzes',
      student: 'Weak-Topic Revision Drills',
      pro: 'JEE, NEET, UPSC, SSC & Banking Mocks',
    },
    {
      label: 'Android PWA & Offline App Shell',
      free: 'Included',
      student: 'Included',
      pro: 'Included',
    },
    {
      label: 'Activation Requirement',
      free: 'Instant & Free',
      student: 'Verified Payment (Coming Soon)',
      pro: 'Verified Payment (Coming Soon)',
    },
  ];
}
