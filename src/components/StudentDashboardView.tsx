import {
  BookCheck,
  Bot,
  CalendarClock,
  Camera,
  Clock,
  Compass,
  FileText,
  Heart,
  ListChecks,
  Play,
  Settings,
  Trophy,
  User,
} from 'lucide-react';
import type {
  AIToolTab,
  FirebaseAuthUser,
  PageView,
  StudentProfile,
  VideoLesson,
} from '../types/vidyora';

interface StudentDashboardViewProps {
  student: StudentProfile | null;
  authUser: FirebaseAuthUser | null;
  lessons: VideoLesson[];
  watchedLessonIds: string[];
  favouriteLessonIds: string[];
  recentLessonIds: string[];
  onOpenLesson: (lesson: VideoLesson) => void;
  onNavigate: (view: PageView) => void;
  onOpenAITool: (tool: AIToolTab) => void;
  onOpenSignIn: () => void;
}

export function StudentDashboardView({
  student,
  authUser,
  lessons,
  watchedLessonIds,
  favouriteLessonIds,
  recentLessonIds,
  onOpenLesson,
  onNavigate,
  onOpenAITool,
  onOpenSignIn,
}: StudentDashboardViewProps) {
  const displayName = authUser?.displayName || student?.displayName || 'VIDYORA Learner';
  const level = student?.level || 'Class 9-10';
  const quizHistory = student?.quizHistory ?? [];

  const recentLessons = recentLessonIds
    .map((id) => lessons.find((l) => l.id === id))
    .filter((l): l is VideoLesson => Boolean(l))
    .slice(0, 4);

  const favouriteLessons = favouriteLessonIds
    .map((id) => lessons.find((l) => l.id === id))
    .filter((l): l is VideoLesson => Boolean(l))
    .slice(0, 4);

  const avgQuizScore =
    quizHistory.length > 0
      ? Math.round(
          quizHistory.reduce((acc, q) => acc + q.percentage, 0) / quizHistory.length
        )
      : null;

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      {/* Header / Student Profile Card */}
      <div className="rounded-3xl bg-gradient-to-br from-[#0B1221] via-[#131E35] to-[#2E1065] text-white p-5 sm:p-7 shadow-xl border border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-xl font-display font-extrabold text-purple-200 shrink-0 overflow-hidden">
              {authUser?.photoURL ? (
                <img
                  src={authUser.photoURL}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-6 h-6" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-blue-200 uppercase tracking-wider">
                Student Dashboard
              </p>
              <h1 className="font-display text-xl sm:text-2xl font-extrabold truncate">
                Namaste, {displayName}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5 truncate">
                Level: <strong className="text-white">{level}</strong>
                {authUser?.email ? ` • ${authUser.email}` : ' • Local Profile'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenSignIn}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-white text-[#0B1221] hover:bg-blue-50 text-sm font-semibold transition-colors shrink-0 cursor-pointer"
          >
            <Settings className="w-4 h-4 text-[#6D28D9]" aria-hidden="true" />
            <span>{authUser || student ? 'Profile & Settings' : 'Sign In / Setup Profile'}</span>
          </button>
        </div>

        {/* Real Progress KPIs (zero invented stats) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
          <div className="rounded-2xl bg-white/8 border border-white/10 p-3.5">
            <div className="flex items-center gap-1.5 text-xs text-blue-200">
              <BookCheck className="w-4 h-4 text-purple-300" aria-hidden="true" />
              <span>Completed Lessons</span>
            </div>
            <p className="mt-1.5 font-display text-2xl font-extrabold tabular-nums">
              {watchedLessonIds.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white/8 border border-white/10 p-3.5">
            <div className="flex items-center gap-1.5 text-xs text-blue-200">
              <Heart className="w-4 h-4 text-rose-300" aria-hidden="true" />
              <span>Saved Lessons</span>
            </div>
            <p className="mt-1.5 font-display text-2xl font-extrabold tabular-nums">
              {favouriteLessonIds.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white/8 border border-white/10 p-3.5">
            <div className="flex items-center gap-1.5 text-xs text-blue-200">
              <Trophy className="w-4 h-4 text-amber-300" aria-hidden="true" />
              <span>Quizzes Taken</span>
            </div>
            <p className="mt-1.5 font-display text-2xl font-extrabold tabular-nums">
              {quizHistory.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white/8 border border-white/10 p-3.5">
            <div className="flex items-center gap-1.5 text-xs text-blue-200">
              <Clock className="w-4 h-4 text-sky-300" aria-hidden="true" />
              <span>Avg Quiz Score</span>
            </div>
            <p className="mt-1.5 font-display text-2xl font-extrabold tabular-nums">
              {avgQuizScore !== null ? `${avgQuizScore}%` : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Access AI & Study Tools */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <h2 className="font-display text-base font-bold text-[#0B1221] mb-3.5">
          Quick Study Tools
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          <button
            type="button"
            onClick={() => onOpenAITool('study-buddy')}
            className="flex items-center gap-2.5 px-3.5 py-3 min-h-[48px] rounded-xl bg-[#EDE9FE]/60 hover:bg-[#EDE9FE] text-[#0B1221] text-xs font-semibold transition-colors cursor-pointer"
          >
            <Bot className="w-4 h-4 text-[#6D28D9] shrink-0" aria-hidden="true" />
            <span>AI Study Buddy</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenAITool('doubt-solver')}
            className="flex items-center gap-2.5 px-3.5 py-3 min-h-[48px] rounded-xl bg-[#EDE9FE]/60 hover:bg-[#EDE9FE] text-[#0B1221] text-xs font-semibold transition-colors cursor-pointer"
          >
            <Camera className="w-4 h-4 text-[#6D28D9] shrink-0" aria-hidden="true" />
            <span>Doubt Solver</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenAITool('notes')}
            className="flex items-center gap-2.5 px-3.5 py-3 min-h-[48px] rounded-xl bg-[#EFF6FF] hover:bg-blue-100/70 text-[#0B1221] text-xs font-semibold transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4 text-[#2563EB] shrink-0" aria-hidden="true" />
            <span>AI Notes</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenAITool('quiz')}
            className="flex items-center gap-2.5 px-3.5 py-3 min-h-[48px] rounded-xl bg-[#EFF6FF] hover:bg-blue-100/70 text-[#0B1221] text-xs font-semibold transition-colors cursor-pointer"
          >
            <ListChecks className="w-4 h-4 text-[#2563EB] shrink-0" aria-hidden="true" />
            <span>AI Quizzes</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenAITool('planner')}
            className="col-span-2 sm:col-span-1 flex items-center gap-2.5 px-3.5 py-3 min-h-[48px] rounded-xl bg-slate-100 hover:bg-slate-200/70 text-[#0B1221] text-xs font-semibold transition-colors cursor-pointer"
          >
            <CalendarClock className="w-4 h-4 text-[#0B1221] shrink-0" aria-hidden="true" />
            <span>Study Planner</span>
          </button>
        </div>
      </div>

      {/* Continue Watching & Saved Lessons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-base font-bold text-[#0B1221]">
              Continue Learning
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('explore')}
              className="text-xs font-semibold text-[#6D28D9] hover:underline cursor-pointer"
            >
              Explore All
            </button>
          </div>

          {recentLessons.length === 0 ? (
            <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-5 text-center space-y-2.5">
              <Compass className="w-6 h-6 text-slate-400 mx-auto" aria-hidden="true" />
              <p className="text-xs text-slate-600">
                Abhi tak koi lesson watch nahi kiya gaya hai. Apni class choose karke pehla lesson start karein!
              </p>
              <button
                type="button"
                onClick={() => onNavigate('explore')}
                className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] rounded-xl bg-[#0B1221] text-white text-xs font-semibold cursor-pointer"
              >
                Explore Classes (1–12)
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentLessons.map((lesson) => (
                <button
                  key={lesson.id}
                  type="button"
                  onClick={() => onOpenLesson(lesson)}
                  className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 hover:bg-[#EFF6FF] border border-slate-200/80 text-left transition-colors cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#6D28D9]">
                      {lesson.className} • {lesson.subject}
                    </p>
                    <p className="text-sm font-bold text-[#0B1221] truncate mt-0.5">
                      {lesson.title}
                    </p>
                  </div>
                  <span className="w-9 h-9 rounded-xl bg-[#0B1221] text-white flex items-center justify-center shrink-0">
                    <Play className="w-4 h-4" aria-hidden="true" />
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-base font-bold text-[#0B1221]">
              Saved &amp; Favourite Lessons
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('video-lessons')}
              className="text-xs font-semibold text-[#6D28D9] hover:underline cursor-pointer"
            >
              Browse Videos
            </button>
          </div>

          {favouriteLessons.length === 0 ? (
            <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-5 text-center space-y-2">
              <Heart className="w-6 h-6 text-slate-400 mx-auto" aria-hidden="true" />
              <p className="text-xs text-slate-600">
                Jo lessons important lagein unhe heart icon tap karke save karein — sab yahan dikhenge.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {favouriteLessons.map((lesson) => (
                <button
                  key={lesson.id}
                  type="button"
                  onClick={() => onOpenLesson(lesson)}
                  className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 hover:bg-[#EFF6FF] border border-slate-200/80 text-left transition-colors cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#2563EB]">
                      {lesson.className} • {lesson.subject}
                    </p>
                    <p className="text-sm font-bold text-[#0B1221] truncate mt-0.5">
                      {lesson.title}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 shrink-0">
                    {lesson.duration}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Quiz Attempts */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-base font-bold text-[#0B1221]">
            Recent Quiz History
          </h2>
          <button
            type="button"
            onClick={() => onOpenAITool('quiz')}
            className="text-xs font-semibold text-[#6D28D9] hover:underline cursor-pointer"
          >
            Start New Quiz
          </button>
        </div>

        {quizHistory.length === 0 ? (
          <p className="text-xs text-slate-600 bg-slate-50 rounded-xl p-4 border border-slate-200/80">
            Abhi koi quiz attempt save nahi hua hai. AI Quiz Generator se apna pehla practice test try karein!
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {quizHistory.slice(0, 6).map((attempt) => (
              <div
                key={attempt.id}
                className="rounded-xl border border-slate-200 p-3.5 bg-slate-50/70"
              >
                <p className="text-sm font-bold text-[#0B1221] truncate">
                  {attempt.title || attempt.topic}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Score: <strong className="text-[#6D28D9]">{attempt.score}/{attempt.total}</strong> ({attempt.percentage}%)
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
