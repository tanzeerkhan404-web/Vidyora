import { useEffect, useMemo, useState } from 'react';
import {
  Briefcase,
  CheckCircle2,
  Clock,
  Compass,
  Download,
  ExternalLink,
  Flag,
  FolderKanban,
  GraduationCap,
  Lightbulb,
  Lock,
  Rocket,
  Sparkles,
  WifiOff,
} from 'lucide-react';
import {
  ADMISSION_PROFILES,
  EXAM_ARENA_PAPERS,
  SKILLVERSE_TRACKS,
  type ExamArenaPaper,
} from '../data/ecosystemCatalog';
import type { StudentProfile } from '../types/vidyora';

interface EcosystemHubPageProps {
  student: StudentProfile | null;
  lowBandwidth: boolean;
  onToggleLowBandwidth: () => void;
  onOpenLanguageSelector: () => void;
}

type EcosystemTab =
  | 'exam-arena'
  | 'admissions'
  | 'skillverse'
  | 'portfolio'
  | 'entrepreneur-lab'
  | 'rural-connect';

export function EcosystemHubPage({
  student,
  lowBandwidth,
  onToggleLowBandwidth,
  onOpenLanguageSelector,
}: EcosystemHubPageProps) {
  const [tab, setTab] = useState<EcosystemTab>('exam-arena');

  // --- Module 1: Exam Arena ---
  const [activePaper, setActivePaper] = useState<ExamArenaPaper | null>(null);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [markedReview, setMarkedReview] = useState<string[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [submittedResult, setSubmittedResult] = useState<{
    paperTitle: string;
    score: number;
    total: number;
    percent: number;
    autoSubmitted: boolean;
    topicBreakdown: Array<{ topic: string; correct: number; total: number }>;
  } | null>(null);
  const [examHistory, setExamHistory] = useState<
    Array<{ id: string; title: string; score: number; total: number; percent: number; date: string }>
  >(() => {
    try {
      const raw = window.localStorage.getItem('vidyora_exam_arena_history_v1');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const finishExam = (paper: ExamArenaPaper, currentAnswers: Record<string, number>, autoSubmitted: boolean) => {
    let score = 0;
    const topicMap = new Map<string, { correct: number; total: number }>();
    for (const q of paper.questions) {
      const entry = topicMap.get(q.topic) || { correct: 0, total: 0 };
      entry.total += 1;
      if (currentAnswers[q.id] === q.correctIndex) {
        score += 1;
        entry.correct += 1;
      }
      topicMap.set(q.topic, entry);
    }
    const percent = Math.round((score / paper.questions.length) * 100);
    const topicBreakdown = Array.from(topicMap.entries()).map(([topic, stats]) => ({
      topic,
      ...stats,
    }));
    setSubmittedResult({
      paperTitle: paper.title,
      score,
      total: paper.questions.length,
      percent,
      autoSubmitted,
      topicBreakdown,
    });
    const nextHistory = [
      {
        id: `ex-${Date.now()}`,
        title: paper.title,
        score,
        total: paper.questions.length,
        percent,
        date: new Date().toISOString().slice(0, 10),
      },
      ...examHistory,
    ].slice(0, 15);
    setExamHistory(nextHistory);
    try {
      window.localStorage.setItem('vidyora_exam_arena_history_v1', JSON.stringify(nextHistory));
    } catch {
      // Ignore storage error
    }
    setActivePaper(null);
  };

  useEffect(() => {
    if (!activePaper) return;
    if (secondsLeft <= 0) {
      finishExam(activePaper, answers, true);
      return;
    }
    const timer = window.setInterval(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePaper, secondsLeft]);

  // --- Module 2: Admission Navigator ---
  const [admFilter, setAdmFilter] = useState('');
  const filteredAdmissions = useMemo(() => {
    const q = admFilter.trim().toLowerCase();
    return ADMISSION_PROFILES.filter(
      (a) =>
        !q ||
        a.institutionGroup.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q) ||
        a.entranceExam.toLowerCase().includes(q) ||
        a.courses.some((c) => c.toLowerCase().includes(q))
    );
  }, [admFilter]);

  // --- Module 3: SkillVerse ---
  const [completedSkills, setCompletedSkills] = useState<string[]>(() => {
    try {
      const raw = window.localStorage.getItem('vidyora_skillverse_done_v1');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const toggleSkillDone = (id: string) => {
    setCompletedSkills((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        window.localStorage.setItem('vidyora_skillverse_done_v1', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // --- Module 4: VIDYORA Portfolio (Private by default!) ---
  const [portfolioBio, setPortfolioBio] = useState(
    'Curious learner exploring science, coding, and problem solving.'
  );
  const [portfolioPublicEnabled, setPortfolioPublicEnabled] = useState(false);
  const [portfolioProjects, setPortfolioProjects] = useState<
    Array<{ id: string; title: string; summary: string }>
  >([
    {
      id: 'proj-1',
      title: 'Solar Irrigation Prototype Note',
      summary: 'Designed a low-cost moisture-sensor circuit diagram for small farms.',
    },
  ]);
  const [newProjTitle, setNewProjTitle] = useState('');
  const [newProjSummary, setNewProjSummary] = useState('');

  // --- Module 6 & 9: Innovation Lab & Young Entrepreneur Studio ---
  const [unitCost, setUnitCost] = useState(40);
  const [sellingPrice, setSellingPrice] = useState(75);
  const [fixedCost, setFixedCost] = useState(700);
  const unitMargin = sellingPrice - unitCost;
  const breakEvenUnits = unitMargin > 0 ? Math.ceil(fixedCost / unitMargin) : null;

  const downloadLightweightSheet = () => {
    const text = `VIDYORA RURAL LEARNING CONNECT — LIGHTWEIGHT OFFLINE STUDY SHEET\n\n1. Ohm's Law: V = I * R\n2. Quadratic Formula: x = (-b ± √(b² - 4ac)) / (2a)\n3. Photosynthesis: 6CO₂ + 6H₂O + Light -> C₆H₁₂O₆ + 6O₂\n4. Kinetic Energy: KE = 1/2 m v²\n\nSaved offline for low-bandwidth revision.`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vidyora-lightweight-revision-sheet.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-br from-[#0B1221] via-[#131E35] to-[#2E1065] text-white p-6 sm:p-8 border border-white/10 shadow-xl">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-blue-200">
          <GraduationCap className="w-3.5 h-3.5" aria-hidden="true" />
          <span>VIDYORA India Educational Ecosystem</span>
        </span>
        <h1 className="mt-2.5 font-display text-2xl sm:text-3xl font-extrabold">
          Exam Arena, Admissions, SkillVerse, Portfolio &amp; Rural Connect
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
          Timed mock examinations with auto-submit, verified Indian college admission pathways, 7 practical skill tracks, private-by-default student portfolios, and low-bandwidth study tools.
        </p>
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Ecosystem Modules"
        className="flex items-center gap-1.5 p-1.5 bg-slate-200/75 rounded-xl overflow-x-auto"
      >
        {(
          [
            { id: 'exam-arena', label: 'Exam Arena', icon: Clock },
            { id: 'admissions', label: 'Admission Navigator', icon: Compass },
            { id: 'skillverse', label: 'SkillVerse (7 Tracks)', icon: Sparkles },
            { id: 'portfolio', label: 'Student Portfolio', icon: FolderKanban },
            { id: 'entrepreneur-lab', label: 'Innovation & Business Lab', icon: Rocket },
            { id: 'rural-connect', label: 'Rural Learning Connect', icon: WifiOff },
          ] as const
        ).map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(item.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 min-h-[42px] rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                active
                  ? 'bg-white text-[#0B1221] shadow-xs'
                  : 'text-slate-600 hover:text-[#0B1221]'
              }`}
            >
              <Icon className="w-4 h-4 text-[#6D28D9]" aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* MODULE 1: VIDYORA EXAM ARENA */}
      {tab === 'exam-arena' && (
        <div className="space-y-5">
          {activePaper ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div>
                  <span className="text-[11px] font-bold text-[#6D28D9] uppercase">
                    {activePaper.examTrack} · {activePaper.format}
                  </span>
                  <h2 className="font-display text-lg font-bold text-[#0B1221]">
                    {activePaper.title}
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-mono text-sm font-bold tabular-nums">
                    {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')} left
                  </span>
                  <button
                    type="button"
                    onClick={() => finishExam(activePaper, answers, false)}
                    className="px-4 py-2 rounded-xl bg-[#6D28D9] text-white text-xs font-semibold cursor-pointer"
                  >
                    Submit Test
                  </button>
                </div>
              </div>

              {/* Question Palette */}
              <div className="flex flex-wrap gap-2">
                {activePaper.questions.map((q, idx) => {
                  const isAnswered = answers[q.id] !== undefined;
                  const isMarked = markedReview.includes(q.id);
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setQIndex(idx)}
                      className={`w-9 h-9 rounded-lg text-xs font-bold cursor-pointer border ${
                        idx === qIndex
                          ? 'ring-2 ring-[#0B1221]'
                          : ''
                      } ${
                        isMarked
                          ? 'bg-amber-100 border-amber-400 text-amber-900'
                          : isAnswered
                          ? 'bg-emerald-100 border-emerald-400 text-emerald-900'
                          : 'bg-slate-50 border-slate-300 text-slate-700'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Active Question */}
              {(() => {
                const q = activePaper.questions[qIndex];
                const isMarked = markedReview.includes(q.id);
                return (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-[#2563EB]">
                      Question {qIndex + 1} of {activePaper.questions.length} · Topic: {q.topic}
                    </p>
                    <p className="font-display text-base font-bold text-[#0B1221]">
                      {q.question}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {q.options.map((opt, oIdx) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: oIdx }))}
                          className={`p-3.5 rounded-xl border text-left text-xs font-semibold cursor-pointer ${
                            answers[q.id] === oIdx
                              ? 'bg-[#F5F3FF] border-[#6D28D9] text-[#0B1221]'
                              : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {String.fromCharCode(65 + oIdx)}. {opt}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() =>
                          setMarkedReview((prev) =>
                            isMarked ? prev.filter((id) => id !== q.id) : [...prev, q.id]
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold cursor-pointer"
                      >
                        <Flag className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{isMarked ? 'Unmark Review' : 'Mark for Review'}</span>
                      </button>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={qIndex === 0}
                          onClick={() => setQIndex((i) => Math.max(0, i - 1))}
                          className="px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-semibold disabled:opacity-40 cursor-pointer"
                        >
                          Previous
                        </button>
                        <button
                          type="button"
                          disabled={qIndex === activePaper.questions.length - 1}
                          onClick={() =>
                            setQIndex((i) => Math.min(activePaper.questions.length - 1, i + 1))
                          }
                          className="px-3.5 py-2 rounded-lg bg-[#0B1221] text-white text-xs font-semibold disabled:opacity-40 cursor-pointer"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <>
              {submittedResult && (
                <div className="bg-white rounded-2xl border border-emerald-200 p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-display text-lg font-bold text-[#0B1221]">
                      Exam Report: {submittedResult.paperTitle}
                    </h2>
                    <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 text-sm font-extrabold tabular-nums">
                      Score: {submittedResult.score}/{submittedResult.total} ({submittedResult.percent}%)
                    </span>
                  </div>
                  {submittedResult.autoSubmitted && (
                    <p className="text-xs text-amber-800 font-semibold">
                      Automatically submitted when timer reached 00:00.
                    </p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {submittedResult.topicBreakdown.map((tb) => (
                      <div key={tb.topic} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                        <p className="font-bold text-[#0B1221]">{tb.topic}</p>
                        <p className="text-slate-600">
                          {tb.correct}/{tb.total} correct
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {EXAM_ARENA_PAPERS.map((paper) => (
                  <div
                    key={paper.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between gap-4"
                  >
                    <div>
                      <span className="px-2 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] text-[11px] font-bold">
                        {paper.format} · {paper.examTrack}
                      </span>
                      <h3 className="mt-2 font-display text-base font-bold text-[#0B1221]">
                        {paper.title}
                      </h3>
                      <p className="mt-1 text-xs text-slate-600">
                        {paper.questions.length} authorised questions • {paper.durationMinutes} min timer • Auto-submit enabled
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSubmittedResult(null);
                        setAnswers({});
                        setMarkedReview([]);
                        setQIndex(0);
                        setSecondsLeft(paper.durationMinutes * 60);
                        setActivePaper(paper);
                      }}
                      className="w-full py-2.5 rounded-xl bg-[#0B1221] hover:bg-[#1E2E4D] text-white text-xs font-semibold cursor-pointer"
                    >
                      Start Timed Test
                    </button>
                  </div>
                ))}
              </div>

              {examHistory.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2.5">
                  <h3 className="font-display text-sm font-bold text-[#0B1221]">
                    Previous Exam Arena Attempts ({examHistory.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {examHistory.slice(0, 6).map((h) => (
                      <div key={h.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                        <p className="font-bold text-[#0B1221] truncate">{h.title}</p>
                        <p className="text-slate-600">
                          {h.score}/{h.total} ({h.percent}%) • {h.date}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* MODULE 2: ADMISSION NAVIGATOR */}
      {tab === 'admissions' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <input
              type="search"
              value={admFilter}
              onChange={(e) => setAdmFilter(e.target.value)}
              placeholder="Filter by college, exam (JEE, NEET, CUET), course, or city..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-xs"
            />
            <p className="text-[11px] text-slate-600">
              Always confirm latest eligibility &amp; deadlines on official portals — VIDYORA does not guarantee admission.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAdmissions.map((a) => (
              <div
                key={a.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between gap-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-purple-50 text-[#6D28D9] font-semibold">
                      {a.entranceExam}
                    </span>
                    <span className="text-slate-500">Updated: {a.lastUpdated}</span>
                  </div>
                  <h3 className="font-display text-base font-bold text-[#0B1221]">
                    {a.institutionGroup}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {a.location} • Courses: {a.courses.join(', ')}
                  </p>
                  <p className="text-xs text-slate-700">
                    <strong>Eligibility:</strong> {a.eligibilitySummary}
                  </p>
                  <p className="text-xs text-slate-600">
                    <strong>Process:</strong> {a.processSummary}
                  </p>
                </div>
                <a
                  href={a.officialPortalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#0B1221] text-white text-xs font-semibold"
                >
                  <span>Official Admission Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODULE 3: SKILLVERSE */}
      {tab === 'skillverse' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SKILLVERSE_TRACKS.map((track) => {
            const doneCount = track.levels.filter((l) => completedSkills.includes(l.id)).length;
            return (
              <div
                key={track.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-base font-bold text-[#0B1221]">
                    {track.category}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold">
                    {doneCount}/{track.levels.length} completed
                  </span>
                </div>
                <p className="text-xs text-slate-600">{track.tagline}</p>
                <div className="space-y-2">
                  {track.levels.map((lvl) => {
                    const done = completedSkills.includes(lvl.id);
                    return (
                      <label
                        key={lvl.id}
                        className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs cursor-pointer ${
                          done
                            ? 'bg-emerald-50/70 border-emerald-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={done}
                          onChange={() => toggleSkillDone(lvl.id)}
                          className="mt-0.5 accent-[#6D28D9]"
                        />
                        <div>
                          <p className="font-bold text-[#0B1221]">
                            [{lvl.level}] {lvl.title}
                          </p>
                          <p className="text-slate-600 mt-0.5">
                            Practical Task: {lvl.assignment}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODULE 4: VIDYORA PORTFOLIO */}
      {tab === 'portfolio' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-[#0B1221]">
                My VIDYORA Student Portfolio
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold">
                <Lock className="w-3 h-3" aria-hidden="true" />
                {portfolioPublicEnabled ? 'Shareable Preview On' : 'Private by Default'}
              </span>
            </div>
            <label className="block text-xs font-semibold text-slate-700">
              Student Introduction
              <textarea
                rows={3}
                value={portfolioBio}
                onChange={(e) => setPortfolioBio(e.target.value)}
                className="mt-1 w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-normal"
              />
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={portfolioPublicEnabled}
                onChange={(e) => setPortfolioPublicEnabled(e.target.checked)}
                className="accent-[#6D28D9]"
              />
              <span>Explicitly allow shareable portfolio view (never enabled by default)</span>
            </label>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newProjTitle.trim()) return;
                setPortfolioProjects((prev) => [
                  { id: `p-${Date.now()}`, title: newProjTitle.trim(), summary: newProjSummary.trim() },
                  ...prev,
                ]);
                setNewProjTitle('');
                setNewProjSummary('');
              }}
              className="space-y-2 pt-3 border-t border-slate-200"
            >
              <input
                type="text"
                required
                value={newProjTitle}
                onChange={(e) => setNewProjTitle(e.target.value)}
                placeholder="Add student project title..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
              <input
                type="text"
                value={newProjSummary}
                onChange={(e) => setNewProjSummary(e.target.value)}
                placeholder="What did you build or learn?"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-[#6D28D9] text-white text-xs font-semibold cursor-pointer"
              >
                Add Project to Portfolio
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="font-display text-lg font-bold text-[#0B1221]">
              {student?.displayName || 'VIDYORA Learner'} — Portfolio Summary
            </h3>
            <p className="text-sm text-slate-700">{portfolioBio}</p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-3 py-1 rounded-lg bg-[#EFF6FF] text-[#2563EB] font-semibold">
                SkillVerse Modules Completed: {completedSkills.length}
              </span>
              <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-semibold">
                Exam Arena Tests: {examHistory.length}
              </span>
            </div>
            <div className="space-y-2">
              {portfolioProjects.map((p) => (
                <div key={p.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <p className="font-bold text-[#0B1221]">{p.title}</p>
                  <p className="text-slate-600 mt-0.5">{p.summary}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODULE 6 & 9: INNOVATION LAB & YOUNG ENTREPRENEUR STUDIO */}
      {tab === 'entrepreneur-lab' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-[#6D28D9]" aria-hidden="true" />
              <h2 className="font-display text-base font-bold text-[#0B1221]">
                Young Entrepreneur Studio — Unit Economics Simulator
              </h2>
            </div>
            <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 p-3 rounded-xl">
              Educational Simulation Only: Practice break-even budgeting and simple business math. Real-world business outcomes depend on many factors and carry no financial guarantee.
            </p>
            <div className="grid grid-cols-3 gap-2.5 text-xs">
              <label className="space-y-1">
                <span className="font-semibold text-slate-700">Cost / Unit (₹)</span>
                <input
                  type="number"
                  min="1"
                  value={unitCost}
                  onChange={(e) => setUnitCost(Number(e.target.value))}
                  className="w-full px-2.5 py-2 rounded-lg border border-slate-300"
                />
              </label>
              <label className="space-y-1">
                <span className="font-semibold text-slate-700">Price / Unit (₹)</span>
                <input
                  type="number"
                  min="1"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(Number(e.target.value))}
                  className="w-full px-2.5 py-2 rounded-lg border border-slate-300"
                />
              </label>
              <label className="space-y-1">
                <span className="font-semibold text-slate-700">Fixed Setup (₹)</span>
                <input
                  type="number"
                  min="0"
                  value={fixedCost}
                  onChange={(e) => setFixedCost(Number(e.target.value))}
                  className="w-full px-2.5 py-2 rounded-lg border border-slate-300"
                />
              </label>
            </div>
            <div className="p-4 rounded-xl bg-[#0B1221] text-white space-y-1">
              <p className="text-xs text-blue-200">
                Contribution Margin per Unit: <strong>₹{unitMargin}</strong>
              </p>
              <p className="font-display text-lg font-extrabold">
                {breakEvenUnits !== null
                  ? `Break-Even Point: ${breakEvenUnits} units`
                  : 'Selling price must exceed unit cost to break even!'}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <h2 className="font-display text-base font-bold text-[#0B1221] flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" aria-hidden="true" />
              <span>Student Innovation Lab Challenges</span>
            </h2>
            {[
              {
                title: 'Clean Campus Water Tracker',
                prompt: 'Design a simple classroom checklist + poster system to reduce drinking water waste by 25%.',
              },
              {
                title: 'Accessible Audio Study Buddy for Rural Peers',
                prompt: 'Create a 3-minute spoken summary script explaining a tough Class 10 Science topic in your local language.',
              },
              {
                title: 'Zero-Plastic School Canteen Plan',
                prompt: 'Budget reusable alternatives and estimate monthly savings using the Unit Economics Simulator.',
              },
            ].map((ch) => (
              <div key={ch.title} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <p className="font-bold text-[#0B1221]">{ch.title}</p>
                <p className="text-slate-600 mt-0.5">{ch.prompt}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODULE 7: RURAL LEARNING CONNECT */}
      {tab === 'rural-connect' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
          <div>
            <h2 className="font-display text-lg font-bold text-[#0B1221]">
              Rural Learning Connect — Low-Bandwidth &amp; Offline First
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Built for slow 2G/3G networks and affordable Android phones across rural India.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <p className="text-sm font-bold text-[#0B1221]">Low-Data Mode</p>
              <p className="text-xs text-slate-600">
                Reduces visual media load and prioritises lightweight text lessons &amp; formulas.
              </p>
              <button
                type="button"
                onClick={onToggleLowBandwidth}
                className={`w-full py-2.5 rounded-xl text-xs font-semibold cursor-pointer ${
                  lowBandwidth
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#0B1221] text-white'
                }`}
              >
                {lowBandwidth ? 'Low-Data Mode Active ✓' : 'Enable Low-Data Mode'}
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <p className="text-sm font-bold text-[#0B1221]">Lightweight Revision Sheet</p>
              <p className="text-xs text-slate-600">
                Download a tiny (&lt;2 KB) authorised offline formula &amp; concept sheet readable without internet.
              </p>
              <button
                type="button"
                onClick={downloadLightweightSheet}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#6D28D9] text-white text-xs font-semibold cursor-pointer"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                <span>Download Offline Sheet</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <p className="text-sm font-bold text-[#0B1221]">24-Language Switcher</p>
              <p className="text-xs text-slate-600">
                Switch seamlessly across 14 Indian and 10 international languages including RTL Urdu &amp; Arabic.
              </p>
              <button
                type="button"
                onClick={onOpenLanguageSelector}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white border border-slate-300 text-[#0B1221] text-xs font-semibold cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-[#2563EB]" aria-hidden="true" />
                <span>Choose Regional Language</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
