import {
  ArrowUpRight,
  BookOpen,
  Compass,
  GraduationCap,
  Target,
} from 'lucide-react';
import { EXPLORE_TRACKS } from '../data/educationalContent';
import type { LearningCategory } from '../types/vidyora';

interface ExploreSectionProps {
  selectedCategory: LearningCategory;
  onSelectCategory: (category: Exclude<LearningCategory, 'all'>) => void;
}

const TRACK_ICONS: Record<Exclude<LearningCategory, 'all'>, typeof BookOpen> = {
  school: BookOpen,
  college: GraduationCap,
  competitive: Target,
  gk: Compass,
};

export function ExploreSection({
  selectedCategory,
  onSelectCategory,
}: ExploreSectionProps) {
  return (
    <section id="explore" className="py-16 lg:py-20 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-[#6D28D9]">
            Explore Learning
          </p>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#0B1221] [text-wrap:balance]">
            Apna learning track chuno aur bina confusion ke padho.
          </h2>
          <p className="mt-3 text-base text-slate-600 leading-relaxed">
            School exams hon ya competitive preparation — kisi bhi category par click karke uske visual lessons aur free notes dekho.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {EXPLORE_TRACKS.map((track) => {
            const Icon = TRACK_ICONS[track.id];
            const isSelected = selectedCategory === track.id;

            return (
              <button
                key={track.id}
                type="button"
                aria-label={`${track.title} (${track.audience})`}
                onClick={() => onSelectCategory(track.id)}
                className={`group text-left p-6 rounded-2xl border transition-all duration-150 hover:-translate-y-0.5 flex flex-col justify-between min-h-[240px] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6D28D9] ${
                  isSelected
                    ? 'bg-[#EFF6FF] border-[#6D28D9] shadow-sm'
                    : 'bg-[#F8FAFC] border-slate-200/90 hover:bg-white hover:border-[#6D28D9]/40 hover:shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-[#6D28D9] text-white'
                          : 'bg-[#0B1221] text-white group-hover:bg-[#6D28D9]'
                      }`}
                    >
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <ArrowUpRight
                      className="w-5 h-5 text-slate-400 group-hover:text-[#6D28D9] transition-colors"
                      aria-hidden="true"
                    />
                  </div>

                  <p className="mt-5 text-xs font-medium text-slate-500">
                    {track.audience}
                  </p>
                  <h3 className="mt-1 font-display text-xl font-bold text-[#0B1221]">
                    {track.title}
                  </h3>
                  <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">
                    {track.subtitle}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200/80 space-y-1">
                  <p className="text-xs text-slate-500">{track.subjects}</p>
                  <p className="text-xs font-semibold text-[#6D28D9] tabular-nums">
                    {track.lessonCount}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
