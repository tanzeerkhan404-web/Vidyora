import {
  ArrowRight,
  BrainCircuit,
  CalendarClock,
  Camera,
  ClipboardCheck,
  FileText,
  Info,
  ShieldAlert,
} from 'lucide-react';
import type {
  AIStatusResponse,
  AIToolTab,
  FirebaseAuthUser,
  LearningLevel,
  QuizAttemptRecord,
  StudyBuddySubject,
} from '../types/vidyora';
import { AIStudyBuddyPanel } from './ai/AIStudyBuddyPanel';
import { AIDoubtSolverPanel } from './ai/AIDoubtSolverPanel';
import { AINotesGeneratorPanel } from './ai/AINotesGeneratorPanel';
import { AIQuizGeneratorPanel } from './ai/AIQuizGeneratorPanel';
import { AIStudyPlannerPanel } from './ai/AIStudyPlannerPanel';

const AI_TOOL_CARDS: Array<{
  id: AIToolTab;
  title: string;
  shortLabel: string;
  description: string;
  actionLabel: string;
  icon: typeof BrainCircuit;
}> = [
  {
    id: 'study-buddy',
    title: 'AI Study Buddy',
    shortLabel: 'Study Buddy',
    description:
      'Sawal pucho, apna class level choose karo aur simple Hinglish mein step-by-step jawab aur real-life examples pao.',
    actionLabel: 'Open Study Buddy',
    icon: BrainCircuit,
  },
  {
    id: 'doubt-solver',
    title: 'AI Doubt Solver',
    shortLabel: 'Doubt Solver',
    description:
      'Textbook ya notebook question ki image upload karo aur har calculation step clearly samjho.',
    actionLabel: 'Upload Question',
    icon: Camera,
  },
  {
    id: 'notes',
    title: 'AI Notes Generator',
    shortLabel: 'Notes Generator',
    description:
      'Kisi bhi chapter ke structured notes — headings, definitions, examples, important points aur revision summary.',
    actionLabel: 'Create Notes',
    icon: FileText,
  },
  {
    id: 'quiz',
    title: 'AI Quiz Generator',
    shortLabel: 'Quiz Generator',
    description:
      'Instant MCQs practice test banao, answers submit karo aur explanations ke saath score dekho.',
    actionLabel: 'Take Practice Quiz',
    icon: ClipboardCheck,
  },
  {
    id: 'planner',
    title: 'AI Study Planner',
    shortLabel: 'Study Planner',
    description:
      'Apna exam ya subject goal set karo aur realistic daily study timetable + milestones pao.',
    actionLabel: 'Build Study Plan',
    icon: CalendarClock,
  },
];

interface AIToolsHomepagePreviewProps {
  aiStatus: AIStatusResponse | null;
  onOpenTool: (tool: AIToolTab) => void;
}

export function AIToolsHomepagePreview({
  aiStatus,
  onOpenTool,
}: AIToolsHomepagePreviewProps) {
  return (
    <section
      id="ai-tools"
      className="py-16 lg:py-20 bg-gradient-to-b from-[#0B1221] to-[#131E35] text-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-purple-300">
              AI-Powered Learning Suite
            </p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-white [text-wrap:balance]">
              24×7 AI Tutor jo aapki speed par padhata hai.
            </h2>
            <p className="mt-3 text-base text-slate-300 leading-relaxed">
              Chahe raat ko doubt solve karna ho, notes banane hon ya quiz practice karni ho — har AI tool secure backend aur student safety rules ke saath kaam karta hai.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onOpenTool('study-buddy')}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[46px] text-sm font-semibold text-white bg-[#6D28D9] hover:bg-[#7C3AED] rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer w-fit"
          >
            <span>Open AI Workspace</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {AI_TOOL_CARDS.map((card, index) => {
            const Icon = card.icon;
            const spanClass = index === 0 ? 'lg:col-span-2 bg-[#16223D]' : 'bg-[#111B31]';
            return (
              <div
                key={card.id}
                className={`p-6 rounded-2xl border border-white/12 flex flex-col justify-between hover:border-purple-400/50 hover:-translate-y-0.5 transition-all duration-150 ${spanClass}`}
              >
                <div>
                  <div className="w-11 h-11 rounded-xl bg-[#6D28D9]/25 border border-purple-400/30 text-purple-200 flex items-center justify-center">
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 font-display text-xl font-bold text-white">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                    {card.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => onOpenTool(card.id)}
                    className="inline-flex items-center gap-2 min-h-[40px] text-sm font-semibold text-blue-200 hover:text-white transition-colors cursor-pointer"
                  >
                    <span>{card.actionLabel}</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Responsible AI notice */}
        <p className="mt-8 text-xs text-slate-400 leading-relaxed max-w-3xl">
          {aiStatus?.disclaimer ||
            'AI answers sirf learning aur revision support ke liye hain — 100% accuracy ki guarantee nahi hai. Important exams ke liye apni textbook ya teacher se zaroor verify karein.'}
        </p>
      </div>
    </section>
  );
}

interface AIToolsWorkspaceProps {
  activeTool: AIToolTab;
  onSelectTool: (tool: AIToolTab) => void;
  aiStatus: AIStatusResponse | null;
  defaultLevel: LearningLevel;
  authUser: FirebaseAuthUser | null;
  onOpenSignIn: () => void;
  prefillPrompt?: string;
  prefillSubject?: StudyBuddySubject;
  onConsumePrefill?: () => void;
  prefillQuizTopic?: string;
  onConsumePrefillQuizTopic?: () => void;
  onAskFollowUpInBuddy: (prompt: string, subject?: StudyBuddySubject) => void;
  onGeneratePracticeQuiz: (topic: string) => void;
  onRemainingUpdate: (remaining: number, dailyRemaining?: number) => void;
  onSaveQuizAttempt: (record: QuizAttemptRecord) => void;
}

export function AIToolsWorkspace({
  activeTool,
  onSelectTool,
  aiStatus,
  defaultLevel,
  authUser,
  onOpenSignIn,
  prefillPrompt,
  prefillSubject,
  onConsumePrefill,
  prefillQuizTopic,
  onConsumePrefillQuizTopic,
  onAskFollowUpInBuddy,
  onGeneratePracticeQuiz,
  onRemainingUpdate,
  onSaveQuizAttempt,
}: AIToolsWorkspaceProps) {
  const isConfigured = aiStatus?.configured ?? false;
  const lowQuota =
    aiStatus &&
    isConfigured &&
    (aiStatus.rateLimit.dailyRemaining <= 10 || aiStatus.rateLimit.remaining <= 4);

  return (
    <section className="py-8 sm:py-10 lg:py-14 bg-[#F8FAFC] min-h-[75vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#6D28D9]">
              VIDYORA AI Learning Suite
            </p>
            <h1 className="mt-1 font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#0B1221]">
              AI Study Buddy & Smart Tools
            </h1>
            <p className="mt-1.5 text-sm text-slate-600">
              Free student AI access with fair daily usage limits ({aiStatus?.rateLimit.dailyLimit ?? 40} requests/day) aur secure backend processing.
            </p>
          </div>

          {aiStatus && isConfigured && (
            <div
              className={`text-xs px-3.5 py-2 rounded-xl font-semibold tabular-nums border w-fit ${
                lowQuota
                  ? 'text-amber-900 bg-amber-50 border-amber-200'
                  : 'text-[#1E3A8A] bg-[#EFF6FF] border-blue-200/80'
              }`}
            >
              Free Daily AI Usage: {aiStatus.rateLimit.dailyRemaining} /{' '}
              {aiStatus.rateLimit.dailyLimit} left today
            </div>
          )}
        </div>

        {/* Graceful Disabled Banner when API is not configured */}
        {aiStatus && !aiStatus.configured && (
          <div
            role="status"
            className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-3"
          >
            <ShieldAlert
              className="w-5 h-5 text-amber-700 shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div className="text-sm leading-relaxed">
              <p className="font-semibold">
                AI features abhi gracefully disabled hain (Secure Backend Setup Pending)
              </p>
              <p className="mt-1 text-xs sm:text-sm text-amber-900">
                Student security ke liye AI keys sirf backend server par configured hoti hain. Secure API configuration complete hote hi sabhi 5 AI tools automatically activate ho jayenge. Tab tak aap Video Lessons, Interactive Animations aur Free Notes use kar sakte hain.
              </p>
            </div>
          </div>
        )}

        {/* Tool Switcher Tabs */}
        <div
          role="tablist"
          aria-label="VIDYORA AI Tools"
          className="flex items-center gap-1.5 p-1.5 bg-slate-200/75 rounded-xl overflow-x-auto max-w-full"
        >
          {AI_TOOL_CARDS.map((tool) => {
            const Icon = tool.icon;
            const active = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => onSelectTool(tool.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 min-h-[42px] text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-white text-[#0B1221] shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-[#0B1221]'
                }`}
              >
                <Icon className="w-4 h-4 text-[#6D28D9]" aria-hidden="true" />
                <span>{tool.shortLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Active Tool Panel */}
        <div>
          {activeTool === 'study-buddy' && (
            <AIStudyBuddyPanel
              aiStatus={aiStatus}
              defaultLevel={defaultLevel}
              authUser={authUser}
              onOpenSignIn={onOpenSignIn}
              prefillPrompt={prefillPrompt}
              prefillSubject={prefillSubject}
              onConsumePrefill={onConsumePrefill}
              onRemainingUpdate={onRemainingUpdate}
            />
          )}
          {activeTool === 'doubt-solver' && (
            <AIDoubtSolverPanel
              aiStatus={aiStatus}
              defaultLevel={defaultLevel}
              onRemainingUpdate={onRemainingUpdate}
              onAskFollowUpInBuddy={onAskFollowUpInBuddy}
              onGeneratePracticeQuiz={onGeneratePracticeQuiz}
            />
          )}
          {activeTool === 'notes' && (
            <AINotesGeneratorPanel
              aiStatus={aiStatus}
              defaultLevel={defaultLevel}
              authUser={authUser}
              onOpenSignIn={onOpenSignIn}
              onRemainingUpdate={onRemainingUpdate}
            />
          )}
          {activeTool === 'quiz' && (
            <AIQuizGeneratorPanel
              aiStatus={aiStatus}
              defaultLevel={defaultLevel}
              prefillTopic={prefillQuizTopic}
              onConsumePrefillTopic={onConsumePrefillQuizTopic}
              onRemainingUpdate={onRemainingUpdate}
              onSaveQuizAttempt={onSaveQuizAttempt}
            />
          )}
          {activeTool === 'planner' && (
            <AIStudyPlannerPanel
              aiStatus={aiStatus}
              defaultLevel={defaultLevel}
              onRemainingUpdate={onRemainingUpdate}
            />
          )}
        </div>

        {/* Always-Visible Educational Disclaimer */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed">
          <Info className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            {aiStatus?.disclaimer ||
              'AI answers sirf learning aur revision support ke liye hain — 100% accuracy ki guarantee nahi hai. Important exams ke liye apni textbook ya teacher se zaroor verify karein.'}
          </span>
        </div>
      </div>
    </section>
  );
}
