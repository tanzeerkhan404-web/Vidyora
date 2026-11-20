import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Download,
  Heart,
  HelpCircle,
  Info,
  Lightbulb,
  MessageSquare,
  Pause,
  Play,
  Video,
} from 'lucide-react';
import type { VideoLesson } from '../types/vidyora';
import { downloadTextFile } from '../utils/aiClient';
import { calculateQuizScore } from '../utils/eduLogic';
import { parseEmbeddableVideo } from '../utils/videoLogic';

interface LessonDetailPageProps {
  lesson: VideoLesson;
  chapterLessons: VideoLesson[];
  relatedLessons: VideoLesson[];
  watchedLessonIds: string[];
  isWatched: boolean;
  isFavourite: boolean;
  onToggleWatched: (lessonId: string) => void;
  onToggleFavourite: (lessonId: string) => void;
  onBack: () => void;
  onSelectLesson: (lesson: VideoLesson) => void;
  onAskAIBuddy: (prompt: string) => void;
  onStartChapterQuiz: (topic: string) => void;
}

export function LessonDetailPage({
  lesson,
  chapterLessons,
  relatedLessons,
  watchedLessonIds,
  isWatched,
  isFavourite,
  onToggleWatched,
  onToggleFavourite,
  onBack,
  onSelectLesson,
  onAskAIBuddy,
  onStartChapterQuiz,
}: LessonDetailPageProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const parsedVideo = lesson.videoUrl ? parseEmbeddableVideo(lesson.videoUrl) : null;
  const hasRealVideo =
    parsedVideo !== null &&
    (parsedVideo.type === 'youtube' || parsedVideo.type === 'direct-video');

  useEffect(() => {
    setStepIndex(0);
    setIsPlaying(false);
    setSelectedAnswers({});
    setQuizSubmitted(false);
  }, [lesson.id]);

  const currentStep = lesson.steps[stepIndex] ?? lesson.steps[0];
  const totalSteps = lesson.steps.length;

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setStepIndex((prev) => {
        if (prev + 1 < totalSteps) return prev + 1;
        setIsPlaying(false);
        return prev;
      });
    }, 5500);
    return () => window.clearInterval(timer);
  }, [isPlaying, totalSteps]);

  const currentChapterIdx = chapterLessons.findIndex((l) => l.id === lesson.id);
  const prevChapterLesson =
    currentChapterIdx > 0 ? chapterLessons[currentChapterIdx - 1] : null;
  const nextChapterLesson =
    currentChapterIdx >= 0 && currentChapterIdx + 1 < chapterLessons.length
      ? chapterLessons[currentChapterIdx + 1]
      : null;

  const practiceQuestions = lesson.practiceQuestions ?? [];
  const practiceScore =
    quizSubmitted && practiceQuestions.length > 0
      ? calculateQuizScore(practiceQuestions, selectedAnswers)
      : null;

  const handleDownloadNotes = () => {
    const content = [
      `VIDYORA LESSON NOTES${lesson.isDemo ? ' (DEMONSTRATION SAMPLE)' : ''}`,
      `${lesson.title}`,
      `${lesson.className} | ${lesson.subject} | ${lesson.chapter} | Difficulty: ${lesson.difficulty}`,
      '==============================================================',
      '',
      'OVERVIEW:',
      lesson.summary,
      '',
      ...(lesson.notesContent
        ? ['STUDY NOTES:', lesson.notesContent, '']
        : []),
      'STEP-BY-STEP EXPLANATION:',
      ...lesson.steps.map(
        (s) => `${s.title}\n${s.caption}${s.formula ? `\nFormula: ${s.formula}` : ''}\n`
      ),
      'REAL-LIFE EDUCATIONAL EXAMPLES:',
      ...lesson.realLifeExamples.map((ex) => `- ${ex.title}: ${ex.explanation}`),
      '',
      'KEY TAKEAWAYS:',
      ...lesson.keyTakeaways.map((k) => `- ${k}`),
    ].join('\n');
    downloadTextFile(`${lesson.id}-notes.txt`, content);
  };

  return (
    <article className="bg-[#F8FAFC] min-h-[82vh] pb-16">
      {/* Top Deep Navy Header */}
      <div className="bg-[#0B1221] text-white border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-200 hover:text-white transition-colors min-h-[40px] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Back to Explore & Video Lessons</span>
          </button>

          <div className="mt-4 flex flex-col lg:flex-row lg:items-end justify-between gap-5">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-blue-200">
                <span className="font-semibold text-purple-300">{lesson.className}</span>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-white">{lesson.subject}</span>
                <span aria-hidden="true">·</span>
                <span>{lesson.chapter}</span>
                <span aria-hidden="true">·</span>
                <span>{lesson.difficulty}</span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                  <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                  {lesson.duration}
                </span>
              </div>
              <h1 className="mt-2 font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-white [text-wrap:balance]">
                {lesson.title}
              </h1>
              <p className="mt-2.5 text-sm sm:text-base text-slate-300 leading-relaxed">
                {lesson.summary}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => onToggleFavourite(lesson.id)}
                className={`inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] rounded-xl text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  isFavourite
                    ? 'bg-rose-600 text-white hover:bg-rose-700'
                    : 'bg-white/10 text-white hover:bg-white/20 border border-white/15'
                }`}
              >
                <Heart
                  className={`w-4 h-4 ${isFavourite ? 'fill-current' : ''}`}
                  aria-hidden="true"
                />
                <span>{isFavourite ? 'Saved' : 'Save Favourite'}</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleWatched(lesson.id)}
                className={`inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[44px] rounded-xl text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  isWatched
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-[#6D28D9] text-white hover:bg-[#7C3AED]'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                <span>{isWatched ? 'Completed' : 'Mark as Completed'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6">
        {/* Clear Demonstration Content Notice when lesson.isDemo === true */}
        {lesson.isDemo && (
          <div className="rounded-xl bg-[#EFF6FF] border border-blue-200/90 px-4 py-3 flex items-start gap-3 text-xs sm:text-sm text-slate-700">
            <Info className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" aria-hidden="true" />
            <p>
              <strong className="text-[#0B1221]">Demonstration Sample Lesson:</strong> Yeh VIDYORA ka interactive visual concept preview hai jo curriculum flow dikhane ke liye banaya gaya hai. Authorized administrator Admin Studio se verified YouTube ya original video lectures publish kar sakte hain.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Video Player, Explanation, Practice Questions & Examples (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* VIDEO PLAYER SURFACE */}
            {hasRealVideo && parsedVideo ? (
              <div className="rounded-2xl overflow-hidden bg-[#0B1221] border border-slate-200 shadow-sm">
                <div className="relative aspect-video bg-black">
                  {parsedVideo.type === 'youtube' ? (
                    <iframe
                      src={parsedVideo.embedUrl}
                      title={lesson.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      referrerPolicy="strict-origin-when-cross-origin"
                      className="w-full h-full border-0"
                    />
                  ) : (
                    <video
                      src={parsedVideo.embedUrl}
                      controls
                      poster={lesson.thumbnail}
                      className="w-full h-full bg-black"
                    >
                      Your browser does not support embedded HTML5 video playback.
                    </video>
                  )}
                </div>
                <div className="px-5 py-4 bg-[#0B1221] text-white flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-blue-200">
                    <Video className="w-4 h-4 text-purple-300" aria-hidden="true" />
                    <span>
                      {parsedVideo.type === 'youtube'
                        ? 'Embedded YouTube Video Lecture'
                        : 'Direct HTTPS Video Lecture'}{' '}
                      · {lesson.duration}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadNotes}
                    className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] rounded-xl bg-white/10 hover:bg-white/20 text-xs sm:text-sm font-semibold cursor-pointer"
                  >
                    <Download className="w-4 h-4" aria-hidden="true" />
                    <span>Download Notes</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Interactive Step-by-Step Visual Concept Player for Demonstration Lessons */
              <div className="rounded-2xl overflow-hidden bg-[#0F172A] border border-slate-200 shadow-sm">
                <div className="relative aspect-[16/10] sm:aspect-[16/9] bg-[#070C18]">
                  <img
                    src={lesson.thumbnail}
                    alt={`${lesson.subject} visual preview for ${lesson.title}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover opacity-45"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#070C18] via-[#070C18]/65 to-[#070C18]/20 p-5 sm:p-8 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs font-mono text-blue-200 tabular-nums">
                      <span>
                        {lesson.animationMode} · Step {stepIndex + 1} / {totalSteps}
                      </span>
                      <span>{lesson.duration}</span>
                    </div>

                    <div className="space-y-3 max-w-2xl">
                      <p className="font-mono text-xs sm:text-sm text-purple-200">
                        {currentStep.highlightValue}
                      </p>
                      <h2 className="font-display text-xl sm:text-3xl font-bold text-white leading-tight">
                        {currentStep.title}
                      </h2>
                      {currentStep.formula && (
                        <div className="inline-block px-4 py-2 rounded-xl bg-[#6D28D9]/35 border border-purple-400/50 font-mono text-xs sm:text-sm text-white">
                          {currentStep.formula}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Player Controls */}
                <div className="p-4 sm:p-5 bg-[#0B1221] text-white space-y-4">
                  <div className="flex items-center gap-2" aria-label="Chapter step timeline">
                    {lesson.steps.map((step, idx) => (
                      <button
                        key={step.title}
                        type="button"
                        aria-label={`Jump to ${step.title}`}
                        onClick={() => {
                          setIsPlaying(false);
                          setStepIndex(idx);
                        }}
                        className={`h-2.5 flex-1 rounded-full transition-colors cursor-pointer ${
                          idx === stepIndex
                            ? 'bg-[#8B5CF6]'
                            : idx < stepIndex
                            ? 'bg-blue-400'
                            : 'bg-white/20 hover:bg-white/35'
                        }`}
                      />
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsPlaying(false);
                          setStepIndex((prev) => (prev - 1 + totalSteps) % totalSteps);
                        }}
                        aria-label="Previous step"
                        className="w-11 h-11 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsPlaying((prev) => !prev)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl bg-[#6D28D9] hover:bg-[#7C3AED] text-sm font-semibold cursor-pointer"
                      >
                        {isPlaying ? (
                          <>
                            <Pause className="w-4 h-4" aria-hidden="true" />
                            <span>Pause Preview</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 fill-current" aria-hidden="true" />
                            <span>Auto-Play Steps</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsPlaying(false);
                          setStepIndex((prev) => (prev + 1) % totalSteps);
                        }}
                        aria-label="Next step"
                        className="w-11 h-11 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleDownloadNotes}
                      className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-white/10 hover:bg-white/20 text-xs sm:text-sm font-semibold cursor-pointer"
                    >
                      <Download className="w-4 h-4" aria-hidden="true" />
                      <span>Download Notes</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Chapter Previous / Next Navigation Bar */}
            {(prevChapterLesson || nextChapterLesson) && (
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl border border-slate-200 p-4">
                {prevChapterLesson ? (
                  <button
                    type="button"
                    onClick={() => onSelectLesson(prevChapterLesson)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-semibold text-[#0B1221] bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                    <span className="truncate max-w-[200px]">Prev: {prevChapterLesson.title}</span>
                  </button>
                ) : (
                  <span />
                )}
                {nextChapterLesson && (
                  <button
                    type="button"
                    onClick={() => onSelectLesson(nextChapterLesson)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-semibold text-white bg-[#0B1221] hover:bg-[#6D28D9] rounded-xl cursor-pointer"
                  >
                    <span className="truncate max-w-[200px]">Next: {nextChapterLesson.title}</span>
                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            )}

            {/* Lesson Hinglish Concept Explanation */}
            <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
              <p className="text-xs font-semibold text-[#6D28D9]">
                Simple Hinglish Concept Guide {!hasRealVideo ? `· Step ${stepIndex + 1}` : ''}
              </p>
              <h3 className="font-display text-xl font-bold text-[#0B1221]">
                {hasRealVideo ? lesson.title : currentStep.title}
              </h3>
              <p className="text-base text-slate-700 leading-relaxed whitespace-pre-line">
                {hasRealVideo ? lesson.notesContent || lesson.summary : currentStep.caption}
              </p>
            </section>

            {/* Built-in Interactive Practice Questions */}
            {practiceQuestions.length > 0 && (
              <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-[#6D28D9]">
                    <HelpCircle className="w-5 h-5" aria-hidden="true" />
                    <h3 className="font-display text-xl font-bold text-[#0B1221]">
                      Chapter Practice Questions ({practiceQuestions.length})
                    </h3>
                  </div>
                  {practiceScore && (
                    <span className="font-mono text-sm font-bold text-[#6D28D9] tabular-nums">
                      Score: {practiceScore.correct}/{practiceScore.total} ({practiceScore.percentage}%)
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  {practiceQuestions.map((q, qIdx) => {
                    const chosen = selectedAnswers[q.id];
                    return (
                      <div
                        key={q.id}
                        className="p-4 sm:p-5 rounded-xl bg-[#F8FAFC] border border-slate-200 space-y-3"
                      >
                        <p className="font-semibold text-sm sm:text-base text-[#0B1221]">
                          Q{qIdx + 1}. {q.question}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {q.options.map((opt, optIdx) => {
                            const isSelected = chosen === optIdx;
                            const isCorrect = optIdx === q.correctIndex;
                            let btnStyle =
                              'bg-white border-slate-200 text-slate-700 hover:border-[#6D28D9]/50';
                            if (quizSubmitted) {
                              if (isCorrect) {
                                btnStyle =
                                  'bg-emerald-50 border-emerald-500 text-emerald-900 font-semibold';
                              } else if (isSelected && !isCorrect) {
                                btnStyle = 'bg-red-50 border-red-400 text-red-900';
                              }
                            } else if (isSelected) {
                              btnStyle =
                                'bg-[#EFF6FF] border-[#6D28D9] text-[#0B1221] font-semibold';
                            }

                            return (
                              <button
                                key={`${q.id}-${optIdx}`}
                                type="button"
                                disabled={quizSubmitted}
                                onClick={() =>
                                  setSelectedAnswers((prev) => ({
                                    ...prev,
                                    [q.id]: optIdx,
                                  }))
                                }
                                className={`text-left px-3.5 py-2.5 min-h-[44px] text-sm rounded-xl border transition-colors cursor-pointer disabled:cursor-default ${btnStyle}`}
                              >
                                {String.fromCharCode(65 + optIdx)}. {opt}
                              </button>
                            );
                          })}
                        </div>
                        {quizSubmitted && (
                          <p className="text-xs sm:text-sm text-slate-700 bg-white p-3 rounded-lg border border-slate-200 leading-relaxed">
                            <strong className="text-[#6D28D9]">Explanation:</strong> {q.explanation}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {!quizSubmitted ? (
                    <button
                      type="button"
                      onClick={() => setQuizSubmitted(true)}
                      disabled={Object.keys(selectedAnswers).length === 0}
                      className="px-5 py-2.5 min-h-[44px] text-sm font-semibold text-white bg-[#6D28D9] hover:bg-[#7C3AED] disabled:bg-slate-300 disabled:text-slate-600 rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed"
                    >
                      Check Answers
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAnswers({});
                          setQuizSubmitted(false);
                        }}
                        className="px-4 py-2.5 min-h-[44px] text-sm font-semibold text-[#0B1221] bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                      >
                        Retry Practice Questions
                      </button>
                      {practiceScore && (
                        <p className="text-sm font-medium text-slate-700">
                          {practiceScore.feedback}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </section>
            )}

            {/* Real-Life Educational Examples */}
            {lesson.realLifeExamples.length > 0 && (
              <section className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex items-center gap-2 text-[#6D28D9]">
                  <Lightbulb className="w-5 h-5" aria-hidden="true" />
                  <h3 className="font-display text-xl font-bold text-[#0B1221]">
                    Real-Life Educational Examples
                  </h3>
                </div>
                <p className="mt-1.5 text-sm text-slate-600">
                  Daily life mein yeh concept kahan use hota hai — dekho aur yaad rakho:
                </p>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {lesson.realLifeExamples.map((ex) => (
                    <div
                      key={ex.title}
                      className="p-4 rounded-xl bg-[#EFF6FF]/75 border border-blue-200/80"
                    >
                      <h4 className="font-display text-base font-bold text-[#0B1221]">
                        {ex.title}
                      </h4>
                      <p className="mt-1.5 text-sm text-slate-700 leading-relaxed">
                        {ex.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Sidebar: Chapter Playlist, Steps, Takeaways & AI Actions (4 cols) */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Chapter Playlist Navigation */}
            {chapterLessons.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                <h3 className="font-display text-base font-bold text-[#0B1221]">
                  Chapter Navigation ({chapterLessons.length})
                </h3>
                <div className="space-y-2">
                  {chapterLessons.map((chLesson, idx) => {
                    const isCurrent = chLesson.id === lesson.id;
                    const done = watchedLessonIds.includes(chLesson.id);
                    return (
                      <button
                        key={chLesson.id}
                        type="button"
                        onClick={() => onSelectLesson(chLesson)}
                        className={`w-full text-left p-3 rounded-xl border transition-colors min-h-[48px] flex items-start justify-between gap-2 cursor-pointer ${
                          isCurrent
                            ? 'bg-[#EFF6FF] border-[#6D28D9] text-[#0B1221]'
                            : 'bg-[#F8FAFC] border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-[11px] font-mono text-[#6D28D9] tabular-nums">
                            Lesson {idx + 1} · {chLesson.duration}
                          </p>
                          <p className="mt-0.5 text-sm font-semibold truncate">
                            {chLesson.title}
                          </p>
                        </div>
                        {done && (
                          <CheckCircle2
                            className="w-4 h-4 text-emerald-600 shrink-0 mt-1"
                            aria-label="Completed"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Lesson Steps (when using interactive concept player) */}
            {!hasRealVideo && lesson.steps.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                <h3 className="font-display text-base font-bold text-[#0B1221]">
                  Lesson Steps ({totalSteps})
                </h3>
                <div className="space-y-2">
                  {lesson.steps.map((step, idx) => {
                    const active = idx === stepIndex;
                    return (
                      <button
                        key={step.title}
                        type="button"
                        onClick={() => {
                          setIsPlaying(false);
                          setStepIndex(idx);
                        }}
                        className={`w-full text-left p-3.5 rounded-xl border transition-colors min-h-[48px] cursor-pointer ${
                          active
                            ? 'bg-[#EFF6FF] border-[#6D28D9] text-[#0B1221]'
                            : 'bg-[#F8FAFC] border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <p className="text-xs font-semibold text-[#6D28D9]">
                          Step {idx + 1}
                        </p>
                        <p className="mt-0.5 text-sm font-semibold">{step.title}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Key Takeaways + Downloadable Notes */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#6D28D9]" aria-hidden="true" />
                <h3 className="font-display text-base font-bold text-[#0B1221]">
                  Exam Key Takeaways
                </h3>
              </div>
              <ul className="space-y-2.5 text-sm text-slate-700">
                {lesson.keyTakeaways.map((point) => (
                  <li key={point} className="flex gap-2 leading-relaxed">
                    <span className="text-[#6D28D9] font-bold" aria-hidden="true">
                      •
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={handleDownloadNotes}
                className="mt-2 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-semibold text-[#0B1221] bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                <span>Download Chapter Notes</span>
              </button>
            </div>

            {/* Instant AI Study Actions */}
            <div className="bg-[#0B1221] text-white rounded-2xl p-5 space-y-3">
              <h3 className="font-display text-base font-bold">
                Practice & Doubts with AI
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Koi step clear nahi hua? Seedha AI Study Buddy se pucho ya is chapter ka extra AI MCQ test do.
              </p>
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    onAskAIBuddy(
                      `Mujhe "${lesson.title}" (${lesson.subject}, ${lesson.className}) aur real-life examples ke saath step-by-step samjhao.`
                    )
                  }
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] text-sm font-semibold text-white bg-[#6D28D9] hover:bg-[#7C3AED] rounded-xl transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" aria-hidden="true" />
                  <span>Ask AI Study Buddy</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onStartChapterQuiz(`${lesson.className} ${lesson.subject}: ${lesson.title}`)
                  }
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] text-sm font-semibold text-white bg-white/12 hover:bg-white/20 border border-white/15 rounded-xl transition-colors cursor-pointer"
                >
                  <ClipboardCheck className="w-4 h-4" aria-hidden="true" />
                  <span>Generate Extra AI Quiz</span>
                </button>
              </div>
            </div>
          </aside>
        </div>

        {/* Related Lessons */}
        {relatedLessons.length > 0 && (
          <section className="mt-12 pt-10 border-t border-slate-200">
            <h3 className="font-display text-2xl font-bold text-[#0B1221]">
              Related Video Lessons
            </h3>
            <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-5">
              {relatedLessons.map((rel) => (
                <button
                  key={rel.id}
                  type="button"
                  onClick={() => onSelectLesson(rel)}
                  className="text-left bg-white rounded-2xl border border-slate-200 p-5 hover:-translate-y-0.5 hover:border-[#6D28D9]/50 hover:shadow-md transition-all cursor-pointer"
                >
                  <p className="text-xs text-slate-500">
                    <span className="font-semibold text-[#6D28D9]">{rel.subject}</span> ·{' '}
                    {rel.className} · {rel.difficulty}
                  </p>
                  <p className="mt-2 font-display text-base font-bold text-[#0B1221] leading-snug">
                    {rel.title}
                  </p>
                  <p className="mt-2 text-xs text-slate-500 font-mono tabular-nums">
                    {rel.chapter} · {rel.duration}
                  </p>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
