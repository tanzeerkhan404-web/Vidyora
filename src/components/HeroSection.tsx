import { useState } from 'react';
import { ArrowRight, PlayCircle } from 'lucide-react';
import { HERO_ILLUSTRATION } from '../data/educationalContent';

interface HeroSectionProps {
  onStartLearning: () => void;
  onExploreAITutor: () => void;
}

const LEARNING_PILLARS = [
  {
    value: 'Class 1–12',
    label: 'School Boards & NCERT concepts',
  },
  {
    value: 'College & Exams',
    label: 'B.Tech, JEE, NEET, UPSC & SSC',
  },
  {
    value: '4 Visual Modes',
    label: '2D, 3D, Whiteboard & Storytelling',
  },
  {
    value: '5 AI Tools',
    label: 'Buddy, Doubt Solver, Notes, Quiz & Plan',
  },
];

export function HeroSection({
  onStartLearning,
  onExploreAITutor,
}: HeroSectionProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <section
      id="top"
      className="relative overflow-hidden bg-gradient-to-b from-[#070C18] via-[#0B1221] to-[#111C35] text-white"
    >
      {/* Subtle architectural gradient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 right-0 w-[560px] h-[560px] rounded-full bg-[#6D28D9]/18 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 -left-24 w-[420px] h-[420px] rounded-full bg-[#2563EB]/14 blur-3xl"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-14 lg:pt-20 lg:pb-20">
        {/* Balanced 2-Column Hero Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
          {/* Left Copy Column */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <p className="text-sm font-medium text-blue-200/90 tracking-wide mb-4">
              Simple Hinglish · Visual Concepts · Free Study Resources
            </p>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold leading-[1.08] tracking-tight text-white [text-wrap:balance]">
              Learning Beyond Textbooks.
            </h1>

            <p className="mt-5 text-lg sm:text-xl text-slate-200/90 leading-relaxed max-w-xl">
              Difficult concepts ko videos, animations aur AI ke saath easily samjho.
            </p>

            <p className="mt-3 text-sm sm:text-base text-slate-300/85 leading-relaxed max-w-xl">
              School (Class 1–12), College, Competitive Exams aur General Knowledge — sab kuch clear Hinglish aur accurate subject terms mein.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={onStartLearning}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 min-h-[48px] text-sm sm:text-base font-semibold text-white bg-[#6D28D9] hover:bg-[#7C3AED] rounded-xl transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <PlayCircle className="w-5 h-5" aria-hidden="true" />
                <span>Start Learning</span>
              </button>

              <button
                type="button"
                onClick={onExploreAITutor}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 min-h-[48px] text-sm sm:text-base font-semibold text-white bg-white/10 hover:bg-white/16 border border-white/20 rounded-xl transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <span>Explore AI Tutor</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Right Visual Stage */}
          <div className="lg:col-span-6 flex items-stretch">
            <div className="relative w-full rounded-2xl overflow-hidden border border-white/15 bg-[#131E35] shadow-2xl min-h-[260px] sm:min-h-[340px]">
              {!imgError ? (
                <img
                  src={HERO_ILLUSTRATION}
                  alt="VIDYORA visual STEM learning illustration showing light prism refraction, planetary orbits, DNA helix, and parabolic graphs"
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full min-h-[320px] bg-gradient-to-br from-[#131E35] via-[#1E2E4D] to-[#4C1D95] flex flex-col items-center justify-center p-8 text-center">
                  <span className="font-display text-2xl font-bold text-white">
                    VIDYORA Visual Studio
                  </span>
                  <span className="mt-2 text-sm text-blue-100/85">
                    Interactive 2D & 3D Science, Maths aur AI Concept Engine
                  </span>
                </div>
              )}
              <div
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-40 sm:h-32 bg-gradient-to-t from-[#070C18] via-[#070C18]/80 to-transparent"
              />
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-end justify-between gap-1.5 sm:gap-4">
                <div>
                  <p className="text-xs font-medium text-blue-200">
                    Visual Concept First
                  </p>
                  <p className="text-xs sm:text-sm font-semibold text-white leading-snug">
                    Physics · Biology · Mathematics · Computer Science
                  </p>
                </div>
                <span className="font-mono tabular-nums text-[11px] sm:text-xs text-slate-200 shrink-0">
                  100% Free Core Notes
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width 4-Column Pillar Strip below Hero Split */}
        <div className="mt-12 pt-8 border-t border-white/12 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {LEARNING_PILLARS.map((pillar) => (
            <div key={pillar.value} className="space-y-1">
              <p className="font-display text-lg sm:text-xl font-bold text-white tabular-nums">
                {pillar.value}
              </p>
              <p className="text-xs sm:text-sm text-slate-300/85 leading-snug">
                {pillar.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
