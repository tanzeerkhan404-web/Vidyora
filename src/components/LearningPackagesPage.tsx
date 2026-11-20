import { useState } from 'react';
import {
  ArrowRight,
  Award,
  BookOpen,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  Layers,
  School,
  Sparkles,
} from 'lucide-react';
import type {
  AIToolTab,
  LearningCategory,
  LearningPackage,
  LearningPackageId,
  MembershipPlan,
} from '../types/vidyora';

interface LearningPackagesPageProps {
  packages: LearningPackage[];
  selectedPackageId: LearningPackageId;
  activePlan?: MembershipPlan;
  onSelectPackage: (packageId: LearningPackageId) => void;
  onOpenExploreCategory: (category: Exclude<LearningCategory, 'all'>) => void;
  onOpenAITool: (tool: AIToolTab) => void;
  onStartExamQuiz: (topic: string) => void;
  onOpenPlans: () => void;
}

const PACKAGE_ICONS: Record<string, typeof School> = {
  school: School,
  college: GraduationCap,
  competitive: Award,
};

export function LearningPackagesPage({
  packages,
  selectedPackageId,
  activePlan,
  onSelectPackage,
  onOpenExploreCategory,
  onOpenAITool,
  onStartExamQuiz,
  onOpenPlans,
}: LearningPackagesPageProps) {
  const activePackages = packages.filter((p) => p.active);
  const currentPackage =
    activePackages.find((p) => p.id === selectedPackageId) || activePackages[0];

  const [previewPackageId, setPreviewPackageId] = useState<string>(
    currentPackage?.id || 'school'
  );
  const [selectedExamIndex, setSelectedExamIndex] = useState(0);

  const inspectedPackage =
    activePackages.find((p) => p.id === previewPackageId) || currentPackage;

  const examGroups = inspectedPackage?.examGroups ?? [];
  const activeExamGroup = examGroups[selectedExamIndex] || examGroups[0];

  return (
    <section className="py-10 sm:py-14 bg-[#F8FAFC] min-h-[75vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="rounded-3xl bg-gradient-to-br from-[#0B1221] via-[#131E35] to-[#1E3A8A] text-white p-6 sm:p-8 shadow-xl border border-white/10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-2xl space-y-2.5">
              <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-200 bg-white/10 px-3 py-1 rounded-full border border-white/15">
                <Layers className="w-3.5 h-3.5" aria-hidden="true" />
                <span>VIDYORA Learning Packages</span>
              </p>
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight [text-wrap:balance]">
                Apna Learning Package Choose Karein — School, College ya Exams.
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Aap kabhi bhi apna selected learning package change kar sakte hain. Har package mein structured subjects, chapter-wise lessons, notes aur practice quizzes included hain.
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 border border-white/15 p-4 sm:p-5 lg:w-80 shrink-0 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-200">
                Your Active Learning Package
              </p>
              <p
                data-testid="selected-package-name"
                className="font-display text-xl font-extrabold text-white"
              >
                {currentPackage?.name || 'School Package'}
              </p>
              <p className="text-xs text-slate-300">
                Active Plan:{' '}
                <strong className="text-white">
                  {activePlan?.name || 'Free Plan'} (₹{activePlan?.priceInr ?? 0})
                </strong>
              </p>
              <button
                type="button"
                onClick={onOpenPlans}
                className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-purple-200 hover:text-white cursor-pointer"
              >
                <span>Compare Membership Plans</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* Selectable Package Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {activePackages.map((pkg) => {
            const Icon = PACKAGE_ICONS[pkg.id] || Layers;
            const isSelected = pkg.id === selectedPackageId;
            const isInspected = pkg.id === inspectedPackage?.id;

            return (
              <div
                key={pkg.id}
                data-testid={`package-card-${pkg.id}`}
                className={`rounded-2xl p-5 sm:p-6 flex flex-col justify-between transition-all border-2 ${
                  isSelected
                    ? 'bg-white border-[#6D28D9] shadow-lg'
                    : isInspected
                    ? 'bg-white border-[#2563EB]/60 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-[#6D28D9] text-white'
                          : 'bg-[#EDE9FE] text-[#6D28D9]'
                      }`}
                    >
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </span>

                    {isSelected && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                        Selected
                      </span>
                    )}
                  </div>

                  <div>
                    <h2 className="font-display text-xl font-bold text-[#0B1221]">
                      {pkg.name}
                    </h2>
                    <p className="text-xs font-semibold text-[#6D28D9] mt-0.5">
                      {pkg.targetAudience}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-2">
                      {pkg.tagline}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {pkg.subjects.slice(0, 4).map((subj) => (
                      <span
                        key={subj}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-medium"
                      >
                        {subj}
                      </span>
                    ))}
                    {pkg.subjects.length > 4 && (
                      <span className="px-2.5 py-1 rounded-lg bg-[#EFF6FF] text-[#2563EB] text-[11px] font-semibold">
                        +{pkg.subjects.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectPackage(pkg.id);
                      setPreviewPackageId(pkg.id);
                      setSelectedExamIndex(0);
                    }}
                    className={`flex-1 px-3.5 py-2.5 min-h-[44px] rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-[#0B1221] text-white hover:bg-[#1E2E4D]'
                    }`}
                  >
                    {isSelected ? 'Active Package' : `Select ${pkg.shortLabel}`}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewPackageId(pkg.id);
                      setSelectedExamIndex(0);
                    }}
                    className="px-3.5 py-2.5 min-h-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-[#0B1221] cursor-pointer"
                  >
                    Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Package Curriculum & Action Panel */}
        {inspectedPackage && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-[#6D28D9]">
                  Package Curriculum &amp; Tools
                </p>
                <h2 className="font-display text-2xl font-extrabold text-[#0B1221]">
                  {inspectedPackage.name}
                </h2>
                <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
                  {inspectedPackage.description}
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onOpenExploreCategory(inspectedPackage.categoryLink)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-[#6D28D9] hover:bg-[#7C3AED] text-white text-xs sm:text-sm font-semibold cursor-pointer"
                >
                  <BookOpen className="w-4 h-4" aria-hidden="true" />
                  <span>Open {inspectedPackage.shortLabel} Lessons</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAITool('notes')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-[#EFF6FF] hover:bg-blue-100 text-[#1E3A8A] border border-blue-200 text-xs sm:text-sm font-semibold cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" aria-hidden="true" />
                  <span>AI Revision Notes</span>
                </button>
              </div>
            </div>

            {/* Subjects + Included Resources */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-2xl bg-[#F8FAFC] border border-slate-200/80 p-5 space-y-3">
                <h3 className="font-display text-base font-bold text-[#0B1221]">
                  Covered Subjects &amp; Modules
                </h3>
                <div className="flex flex-wrap gap-2">
                  {inspectedPackage.subjects.map((subject) => (
                    <span
                      key={subject}
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-[#0B1221]"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
                <div className="pt-2 space-y-1.5">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Featured Learning Modules
                  </p>
                  <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700">
                    {inspectedPackage.featuredModules.map((mod) => (
                      <li key={mod} className="flex items-start gap-2">
                        <CheckCircle2
                          className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <span>{mod}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="rounded-2xl bg-[#F8FAFC] border border-slate-200/80 p-5 space-y-3">
                <h3 className="font-display text-base font-bold text-[#0B1221]">
                  What You Get Inside This Package
                </h3>
                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700">
                  {inspectedPackage.includedResources.map((res) => (
                    <li key={res} className="flex items-start gap-2">
                      <CheckCircle2
                        className="w-4 h-4 text-[#6D28D9] shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <span>{res}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenAITool('study-buddy')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 min-h-[42px] rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-[#0B1221] cursor-pointer"
                  >
                    <Bot className="w-4 h-4 text-[#6D28D9]" aria-hidden="true" />
                    <span>Concept &amp; Assignment Help</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onStartExamQuiz(`${inspectedPackage.name} Practice Test`)
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 min-h-[42px] rounded-xl bg-[#0B1221] hover:bg-[#1E2E4D] text-white text-xs font-semibold cursor-pointer"
                  >
                    <ClipboardCheck className="w-4 h-4" aria-hidden="true" />
                    <span>Start Practice Quiz</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Competitive Exam-Wise Tracks (JEE, NEET, UPSC, SSC, Banking) */}
            {examGroups.length > 0 && (
              <div className="rounded-2xl bg-gradient-to-br from-[#0B1221] to-[#1E1B4B] text-white p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-purple-200">
                      Exam-Wise Preparation Tracks
                    </p>
                    <h3 className="font-display text-lg font-bold">
                      JEE, NEET, UPSC, SSC &amp; Banking Modules
                    </h3>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2" role="tablist" aria-label="Competitive Exams">
                  {examGroups.map((exam, idx) => (
                    <button
                      key={exam.name}
                      type="button"
                      role="tab"
                      aria-selected={idx === selectedExamIndex}
                      onClick={() => setSelectedExamIndex(idx)}
                      className={`px-3.5 py-2 min-h-[40px] rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        idx === selectedExamIndex
                          ? 'bg-[#6D28D9] text-white shadow-sm'
                          : 'bg-white/10 text-slate-200 hover:bg-white/20'
                      }`}
                    >
                      {exam.name}
                    </button>
                  ))}
                </div>

                {activeExamGroup && (
                  <div className="rounded-2xl bg-white/8 border border-white/12 p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-2.5">
                      <h4 className="font-display text-base font-bold text-white">
                        {activeExamGroup.name} — Subjects &amp; Practice Focus
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {activeExamGroup.subjects.map((sub) => (
                          <span
                            key={sub}
                            className="px-2.5 py-1 rounded-lg bg-white/12 text-blue-100 text-xs font-medium"
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                      <ul className="space-y-1 text-xs text-slate-300">
                        {activeExamGroup.highlights.map((h) => (
                          <li key={h}>• {h}</li>
                        ))}
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onStartExamQuiz(`${activeExamGroup.name} Mock Test`)
                      }
                      className="inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[46px] rounded-xl bg-white text-[#0B1221] hover:bg-blue-50 text-xs sm:text-sm font-bold shrink-0 cursor-pointer"
                    >
                      <ClipboardCheck className="w-4 h-4 text-[#6D28D9]" aria-hidden="true" />
                      <span>Launch {activeExamGroup.name.split(' ')[0]} Mock Quiz</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
