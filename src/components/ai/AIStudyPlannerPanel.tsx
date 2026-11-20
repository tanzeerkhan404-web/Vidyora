import { useState } from 'react';
import {
  AlertCircle,
  CalendarClock,
  CheckSquare,
  Loader2,
  Square,
} from 'lucide-react';
import { LEARNING_LEVELS } from '../../data/educationalContent';
import type {
  AIStatusResponse,
  GeneratedStudyPlan,
  LearningLevel,
} from '../../types/vidyora';
import {
  calculatePlanProgress,
  validatePlannerInput,
} from '../../utils/eduLogic';
import { APIRequestError, requestStudyPlanner } from '../../utils/aiClient';

interface AIStudyPlannerPanelProps {
  aiStatus: AIStatusResponse | null;
  defaultLevel: LearningLevel;
  onRemainingUpdate: (remaining: number, dailyRemaining?: number) => void;
}

export function AIStudyPlannerPanel({
  aiStatus,
  defaultLevel,
  onRemainingUpdate,
}: AIStudyPlannerPanelProps) {
  const [goal, setGoal] = useState('');
  const [level, setLevel] = useState<LearningLevel>(defaultLevel);
  const [dailyHours, setDailyHours] = useState(3);
  const [timelineDays, setTimelineDays] = useState(30);
  const [focusSubjects, setFocusSubjects] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<GeneratedStudyPlan | null>(null);
  const [completedIds, setCompletedIds] = useState<string[]>([]);

  const isConfigured = aiStatus?.configured ?? false;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErr = validatePlannerInput(goal, dailyHours, timelineDays);
    if (validationErr) {
      setError(validationErr);
      return;
    }
    if (!isConfigured) {
      setError(
        'AI Study Planner abhi setup mode mein hai — secure server API configuration complete hone par personalized daily plan banega.'
      );
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await requestStudyPlanner({
        goal: goal.trim(),
        level,
        timelineDays,
        dailyHours,
        focusSubjects: focusSubjects.trim(),
      });
      onRemainingUpdate(res.remaining, res.dailyRemaining);
      setPlan(res.plan);
      setCompletedIds([]);
    } catch (err) {
      setError(
        err instanceof APIRequestError
          ? err.message
          : 'Study plan generate karne mein problem aayi. Dobara try karein.'
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleBlock = (id: string) => {
    setCompletedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const progress = plan
    ? calculatePlanProgress(plan.dailyBlocks, completedIds)
    : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="p-5 sm:p-6 border-b border-slate-200 bg-[#F8FAFC]">
        <h3 className="font-display text-xl font-bold text-[#0B1221]">
          AI Study Planner
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          Apna learning goal aur daily study time set karo — hum realistic breaks aur revision ke saath daily timetable banayenge.
        </p>

        <form onSubmit={handleGenerate} className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-3.5">
          <div className="md:col-span-6">
            <label htmlFor="planner-goal" className="block text-xs font-semibold text-slate-700">
              Learning Goal
            </label>
            <input
              id="planner-goal"
              type="text"
              value={goal}
              onChange={(e) => {
                setGoal(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Jaise: Class 10 Maths & Science Board Revision"
              className="mt-1 w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-[#0B1221] focus:outline-none focus:border-[#6D28D9]"
            />
          </div>

          <div className="md:col-span-3">
            <label htmlFor="planner-level" className="block text-xs font-semibold text-slate-700">
              Level
            </label>
            <select
              id="planner-level"
              value={level}
              onChange={(e) => setLevel(e.target.value as LearningLevel)}
              className="mt-1 w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-[#0B1221]"
            >
              {LEARNING_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <label htmlFor="planner-hours" className="block text-xs font-semibold text-slate-700">
              Daily Study Hours ({dailyHours}h)
            </label>
            <input
              id="planner-hours"
              type="range"
              min={1}
              max={8}
              value={dailyHours}
              onChange={(e) => setDailyHours(Number(e.target.value))}
              className="mt-3 w-full accent-[#6D28D9]"
            />
          </div>

          <div className="md:col-span-5">
            <label htmlFor="planner-subjects" className="block text-xs font-semibold text-slate-700">
              Focus Subjects (Optional)
            </label>
            <input
              id="planner-subjects"
              type="text"
              value={focusSubjects}
              onChange={(e) => setFocusSubjects(e.target.value)}
              placeholder="Jaise: Trigonometry, Organic Chemistry, Polity"
              className="mt-1 w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-[#0B1221]"
            />
          </div>

          <div className="md:col-span-3">
            <label htmlFor="planner-days" className="block text-xs font-semibold text-slate-700">
              Target Days
            </label>
            <input
              id="planner-days"
              type="number"
              min={3}
              max={180}
              value={timelineDays}
              onChange={(e) => setTimelineDays(Number(e.target.value))}
              className="mt-1 w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl text-[#0B1221] tabular-nums"
            />
          </div>

          <div className="md:col-span-4 flex items-end">
            <button
              type="submit"
              disabled={loading || !isConfigured}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] text-sm font-semibold text-white bg-[#6D28D9] hover:bg-[#7C3AED] disabled:bg-slate-300 disabled:text-slate-600 rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Building Plan...</span>
                </>
              ) : (
                <span>Generate Daily Plan</span>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div
            role="alert"
            className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-800 flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="p-5 sm:p-6">
        {!plan && !loading && (
          <div className="py-10 text-center space-y-2">
            <CalendarClock className="w-8 h-8 text-slate-400 mx-auto" aria-hidden="true" />
            <p className="font-display text-base font-bold text-[#0B1221]">
              Stress-Free Daily Timetable
            </p>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Goal enter karein aur hum concept videos, active practice, revision aur short breaks ke saath balanced daily routine banayenge.
            </p>
          </div>
        )}

        {loading && (
          <div className="py-12 text-center space-y-3">
            <Loader2 className="w-7 h-7 animate-spin text-[#6D28D9] mx-auto" aria-hidden="true" />
            <p className="text-sm text-slate-600">
              Aapka personalized {dailyHours}-hour daily study schedule ban raha hai...
            </p>
          </div>
        )}

        {plan && !loading && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-[#EFF6FF] border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-[#2563EB] tabular-nums">
                  {plan.timelineDays} Days Goal · {plan.dailyHours} hrs/day
                </p>
                <h4 className="mt-1 font-display text-xl font-bold text-[#0B1221]">
                  {plan.goal}
                </h4>
                <p className="mt-1.5 text-sm text-slate-700 leading-relaxed">
                  {plan.strategySummary}
                </p>
              </div>
              {progress && (
                <div className="shrink-0 text-left sm:text-right">
                  <p className="text-xs text-slate-500">Today's Checklist</p>
                  <p className="font-display text-2xl font-bold text-[#6D28D9] tabular-nums">
                    {progress.completed} / {progress.total} ({progress.percentage}%)
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {plan.dailyBlocks.map((block) => {
                const done = completedIds.includes(block.id);
                return (
                  <button
                    key={block.id}
                    type="button"
                    onClick={() => toggleBlock(block.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-colors flex items-start gap-3.5 cursor-pointer ${
                      done
                        ? 'bg-emerald-50/70 border-emerald-200'
                        : 'bg-[#F8FAFC] border-slate-200 hover:bg-white'
                    }`}
                  >
                    <span className="mt-0.5 text-[#6D28D9] shrink-0">
                      {done ? (
                        <CheckSquare className="w-5 h-5 text-emerald-600" aria-hidden="true" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-400" aria-hidden="true" />
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono font-semibold text-[#0B1221] tabular-nums">
                          {block.timeSlot}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{block.duration}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-[#6D28D9]">{block.subject}</span>
                        <span aria-hidden="true">·</span>
                        <span>{block.activityType}</span>
                      </div>
                      <p
                        className={`mt-1 text-sm font-semibold ${
                          done ? 'line-through text-slate-500' : 'text-[#0B1221]'
                        }`}
                      >
                        {block.task}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">{block.tip}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {plan.weeklyMilestones.length > 0 && (
              <div className="p-5 rounded-xl bg-[#0B1221] text-white">
                <h5 className="font-display text-base font-bold text-blue-200">
                  Weekly Milestones
                </h5>
                <ul className="mt-3 space-y-2 text-sm text-slate-200">
                  {plan.weeklyMilestones.map((m) => (
                    <li key={m} className="flex gap-2">
                      <span className="text-purple-300 font-bold" aria-hidden="true">
                        •
                      </span>
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
