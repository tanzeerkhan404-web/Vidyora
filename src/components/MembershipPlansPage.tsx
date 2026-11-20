import { useState } from 'react';
import {
  ArrowRight,
  Check,
  Crown,
  Info,
  Layers,
  Lock,
  ShieldCheck,
  Sparkles,
  Tag,
  X,
} from 'lucide-react';
import type {
  LearningPackage,
  MembershipPlan,
  MembershipPlanId,
} from '../types/vidyora';
import {
  buildPlanComparisonRows,
  calculateEffectivePrice,
  canActivatePaidPlan,
} from '../utils/membershipLogic';

interface MembershipPlansPageProps {
  plans: MembershipPlan[];
  activePlanId: MembershipPlanId;
  selectedPackage?: LearningPackage;
  onOpenPackages: () => void;
  onOpenDashboard: () => void;
  onStartLearning: () => void;
}

export function MembershipPlansPage({
  plans,
  activePlanId,
  selectedPackage,
  onOpenPackages,
  onOpenDashboard,
  onStartLearning,
}: MembershipPlansPageProps) {
  const [upgradeModalPlan, setUpgradeModalPlan] = useState<MembershipPlan | null>(
    null
  );
  const [interestNotedPlanId, setInterestNotedPlanId] =
    useState<MembershipPlanId | null>(null);

  const visiblePlans = plans.filter((p) => p.active);
  const comparisonRows = buildPlanComparisonRows(visiblePlans);
  const currentPlan =
    visiblePlans.find((p) => p.id === activePlanId) || visiblePlans[0];

  return (
    <section className="py-10 sm:py-14 bg-[#F8FAFC] min-h-[75vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Hero Header */}
        <div className="rounded-3xl bg-gradient-to-br from-[#0B1221] via-[#131E35] to-[#2E1065] text-white p-6 sm:p-9 shadow-xl border border-white/10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-2xl space-y-3">
              <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-200 bg-white/10 px-3 py-1 rounded-full border border-white/15">
                <Crown className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
                <span>VIDYORA Membership Plans</span>
              </p>
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight [text-wrap:balance]">
                Affordable Learning Plans — Har Student Ke Liye.
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Free Plan (₹0) hamesha available rahega. Jab aap zyada daily AI practice, board packs ya competitive mock drills ke liye ready hon, tab Student Plan (₹49/month) ya Pro Learner Plan (₹99/month) compare aur explore kar sakte hain.
              </p>
            </div>

            {/* Active Plan Summary Card */}
            <div className="rounded-2xl bg-white/10 border border-white/15 p-4 sm:p-5 lg:w-80 shrink-0 space-y-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-200">
                Your Current Plan
              </p>
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-display text-xl font-extrabold text-white">
                  {currentPlan?.name || 'Free Plan'}
                </p>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Daily AI Allowance:{' '}
                <strong className="text-white">
                  {currentPlan?.aiDailyLimit ?? 40} requests/day
                </strong>
              </p>
              {selectedPackage && (
                <p className="text-xs text-blue-200">
                  Selected Package:{' '}
                  <strong className="text-white">{selectedPackage.name}</strong>
                </p>
              )}
              <div className="pt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onOpenPackages}
                  className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-xl bg-white/15 hover:bg-white/25 text-xs font-semibold text-white cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Learning Packages</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenDashboard}
                  className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] rounded-xl bg-[#6D28D9] hover:bg-[#7C3AED] text-xs font-semibold text-white cursor-pointer"
                >
                  <span>My Dashboard</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Honest Payment Gateway Status Notice (PART E) */}
        <div
          role="note"
          className="rounded-2xl bg-[#EFF6FF] border border-blue-200 p-4 sm:p-5 flex items-start gap-3 text-xs sm:text-sm text-[#1E3A8A]"
        >
          <ShieldCheck
            className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div className="leading-relaxed">
            <strong className="font-semibold text-[#0B1221]">
              Transparent Billing Notice:
            </strong>{' '}
            Online payment gateways abhi launch-preparation stage mein hain. Koi real card/UPI details collect nahi ki ja rahi hain aur koi automatic charge nahi hoga. Free Plan (₹0) sabhi students ke liye active hai; paid plans sirf verified payment confirmation ke baad hi activate honge.
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {visiblePlans.map((plan) => {
            const isCurrent = plan.id === activePlanId;
            const pricing = calculateEffectivePrice(plan);
            const isHighlighted = Boolean(plan.recommended);

            return (
              <article
                key={plan.id}
                data-testid={`membership-card-${plan.id}`}
                className={`relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all ${
                  isHighlighted
                    ? 'bg-[#0B1221] text-white border-2 border-[#7C3AED] shadow-2xl'
                    : 'bg-white text-[#0B1221] border border-slate-200 shadow-sm hover:shadow-md'
                }`}
              >
                <div className="space-y-5">
                  {/* Top Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${
                        isHighlighted
                          ? 'bg-[#6D28D9] text-white'
                          : 'bg-[#EDE9FE] text-[#6D28D9]'
                      }`}
                    >
                      {plan.badge || (plan.id === 'free' ? 'Free Tier' : 'Membership')}
                    </span>

                    {isCurrent && (
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                          isHighlighted
                            ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        Current Plan
                      </span>
                    )}
                  </div>

                  {/* Active Offer Strip */}
                  {pricing.hasActiveOffer && (
                    <div
                      className={`rounded-xl px-3 py-2 flex items-center gap-2 text-xs font-semibold ${
                        isHighlighted
                          ? 'bg-amber-400/20 text-amber-200 border border-amber-300/30'
                          : 'bg-amber-50 text-amber-900 border border-amber-200'
                      }`}
                    >
                      <Tag className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span>
                        {plan.offer.label}: {pricing.discountPercent}% OFF (Save ₹
                        {pricing.savingsInr})
                      </span>
                    </div>
                  )}

                  {/* Plan Title & Price */}
                  <div>
                    <h2 className="font-display text-2xl font-extrabold">
                      {plan.name}
                    </h2>
                    <p
                      className={`mt-1 text-xs sm:text-sm leading-relaxed ${
                        isHighlighted ? 'text-slate-300' : 'text-slate-600'
                      }`}
                    >
                      {plan.tagline}
                    </p>

                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="font-display text-4xl font-extrabold tabular-nums">
                        ₹{pricing.finalPriceInr}
                      </span>
                      <span
                        className={`text-sm font-medium ${
                          isHighlighted ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        {plan.billingCycle === 'forever' ? '/ forever' : '/ month'}
                      </span>
                      {pricing.hasActiveOffer && (
                        <span
                          className={`text-sm line-through tabular-nums ${
                            isHighlighted ? 'text-slate-400' : 'text-slate-400'
                          }`}
                        >
                          ₹{pricing.originalPriceInr}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Usage Limits */}
                  <div
                    className={`rounded-2xl p-3.5 space-y-1.5 ${
                      isHighlighted
                        ? 'bg-white/8 border border-white/12'
                        : 'bg-[#F8FAFC] border border-slate-200/80'
                    }`}
                  >
                    <p
                      className={`text-[11px] font-bold uppercase tracking-wider ${
                        isHighlighted ? 'text-purple-200' : 'text-[#6D28D9]'
                      }`}
                    >
                      Usage Limits
                    </p>
                    <ul className="space-y-1 text-xs leading-relaxed">
                      {plan.usageLimits.map((limit) => (
                        <li
                          key={limit}
                          className={
                            isHighlighted ? 'text-slate-200' : 'text-slate-700'
                          }
                        >
                          • {limit}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Features */}
                  <div className="space-y-2">
                    <p
                      className={`text-xs font-bold uppercase tracking-wider ${
                        isHighlighted ? 'text-blue-200' : 'text-slate-500'
                      }`}
                    >
                      Included Features
                    </p>
                    <ul className="space-y-2 text-xs sm:text-sm">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <Check
                            className={`w-4 h-4 shrink-0 mt-0.5 ${
                              isHighlighted ? 'text-purple-300' : 'text-[#6D28D9]'
                            }`}
                            aria-hidden="true"
                          />
                          <span
                            className={
                              isHighlighted ? 'text-slate-100' : 'text-slate-700'
                            }
                          >
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Benefits */}
                  <div className="space-y-1.5 pt-2 border-t border-current/10">
                    <p
                      className={`text-xs font-bold uppercase tracking-wider ${
                        isHighlighted ? 'text-blue-200' : 'text-slate-500'
                      }`}
                    >
                      Key Benefits
                    </p>
                    <ul className="space-y-1 text-xs leading-relaxed">
                      {plan.benefits.map((benefit) => (
                        <li
                          key={benefit}
                          className={
                            isHighlighted ? 'text-slate-300' : 'text-slate-600'
                          }
                        >
                          ✓ {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Action CTA */}
                <div className="mt-6 pt-4">
                  {isCurrent ? (
                    <button
                      type="button"
                      onClick={onStartLearning}
                      className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[48px] rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                        isHighlighted
                          ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                          : 'bg-[#0B1221] text-white hover:bg-[#1E2E4D]'
                      }`}
                    >
                      <span>Current Active Plan — Continue Learning</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setUpgradeModalPlan(plan)}
                      className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[48px] rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                        isHighlighted
                          ? 'bg-[#6D28D9] hover:bg-[#7C3AED] text-white'
                          : 'bg-[#EDE9FE] hover:bg-[#DDD6FE] text-[#4C1D95] border border-[#C4B5FD]'
                      }`}
                    >
                      <Sparkles className="w-4 h-4" aria-hidden="true" />
                      <span>Upgrade to {plan.name}</span>
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {/* Side-by-Side Comparison Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-xl font-bold text-[#0B1221]">
                Compare Membership Plans
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Clear side-by-side comparison of limits, learning tracks aur AI support.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenPackages}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#6D28D9] hover:underline cursor-pointer w-fit"
            >
              <span>Explore Learning Packages</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-600">
                  <th className="py-3.5 px-5 font-bold">Feature / Limit</th>
                  <th className="py-3.5 px-5 font-bold text-[#0B1221]">Free Plan</th>
                  <th className="py-3.5 px-5 font-bold text-[#6D28D9]">
                    Student Plan
                  </th>
                  <th className="py-3.5 px-5 font-bold text-[#2563EB]">
                    Pro Learner
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 text-xs sm:text-sm">
                {comparisonRows.map((row) => (
                  <tr key={row.label} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-5 font-semibold text-[#0B1221]">
                      {row.label}
                    </td>
                    <td className="py-3.5 px-5 text-slate-600">{row.free}</td>
                    <td className="py-3.5 px-5 font-medium text-[#0B1221] bg-[#EDE9FE]/25">
                      {row.student}
                    </td>
                    <td className="py-3.5 px-5 text-slate-700">{row.pro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Payment Preparation Upgrade Modal (PART E — Secure, Honest, Zero Fake Billing) */}
      {upgradeModalPlan && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="upgrade-modal-title"
          className="fixed inset-0 z-50 bg-[#070C18]/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white text-[#0B1221] rounded-2xl border border-slate-200 max-w-md w-full shadow-2xl overflow-hidden my-auto">
            <div className="px-5 py-4 bg-[#0B1221] text-white flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] text-purple-200 uppercase tracking-wider font-semibold">
                  Upgrade Preview • Payment Preparation
                </p>
                <h3
                  id="upgrade-modal-title"
                  className="font-display text-lg font-bold"
                >
                  {upgradeModalPlan.name} (₹
                  {calculateEffectivePrice(upgradeModalPlan).finalPriceInr}/month)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setUpgradeModalPlan(null)}
                aria-label="Close upgrade preview"
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-sm">
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-950 leading-relaxed">
                <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="font-bold">
                    Online Payment Gateway Abhi Active Nahi Hai
                  </p>
                  <p className="mt-1">
                    VIDYORA abhi real payment details (UPI, Card, NetBanking) collect nahi karta aur koi automatic billing nahi hoti. Paid membership sirf verified server payment confirmation ke baad hi activate hogi.
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-[#F8FAFC] border border-slate-200 p-4 space-y-2 text-xs">
                <p className="font-bold text-[#0B1221]">
                  Plan Summary ({upgradeModalPlan.name}):
                </p>
                <p className="text-slate-600">
                  • Planned Price:{' '}
                  <strong className="text-[#0B1221]">
                    ₹{calculateEffectivePrice(upgradeModalPlan).finalPriceInr}/month
                  </strong>
                </p>
                <p className="text-slate-600">
                  • Planned Daily AI Quota:{' '}
                  <strong className="text-[#6D28D9]">
                    {upgradeModalPlan.aiDailyLimit} requests/day
                  </strong>
                </p>
                <p className="text-slate-600">
                  • Activation Guard:{' '}
                  <strong className="text-[#0B1221]">
                    {canActivatePaidPlan(upgradeModalPlan.id, null)
                      ? 'Active'
                      : 'Verified Payment Required'}
                  </strong>
                </p>
              </div>

              {interestNotedPlanId === upgradeModalPlan.id ? (
                <div className="p-3.5 rounded-xl bg-[#EFF6FF] border border-blue-200 text-xs text-[#1E3A8A] flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    Aapki preference note kar li gayi hai. Abhi aapka{' '}
                    <strong>Free Plan (₹0)</strong> active rahega — koi payment charge nahi hua hai.
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setInterestNotedPlanId(upgradeModalPlan.id)}
                  className="w-full px-4 py-2.5 min-h-[44px] rounded-xl bg-[#EDE9FE] hover:bg-[#DDD6FE] text-[#4C1D95] text-xs font-bold transition-colors cursor-pointer"
                >
                  Save Upgrade Interest (No Payment / No Charge)
                </button>
              )}
            </div>

            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setUpgradeModalPlan(null)}
                className="px-4 py-2.5 min-h-[44px] rounded-xl bg-[#0B1221] hover:bg-[#1E2E4D] text-white text-xs sm:text-sm font-semibold cursor-pointer"
              >
                Continue on Free Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
