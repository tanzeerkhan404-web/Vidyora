import { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  GraduationCap,
  Heart,
  History,
  Layers,
  Play,
  Search,
  Sparkles,
} from 'lucide-react';
import {
  CURRICULUM_CHAPTERS,
  getChaptersForClassAndSubject,
  getClassesForCategory,
  getSubjectsForClass,
} from '../data/curriculumCatalog';
import { EXPLORE_TRACKS } from '../data/educationalContent';
import type { LearningCategory, VideoLesson } from '../types/vidyora';
import { buildChapterSummaries } from '../utils/videoLogic';

interface ExploreVideoHubProps {
  lessons: VideoLesson[];
  initialCategory?: Exclude<LearningCategory, 'all'>;
  watchedLessonIds: string[];
  favouriteLessonIds: string[];
  recentLessonIds: string[];
  isAdmin: boolean;
  onOpenLesson: (lesson: VideoLesson) => void;
  onToggleFavourite: (lessonId: string) => void;
  onOpenAdminCMS: () => void;
}

export function ExploreVideoHub({
  lessons,
  initialCategory,
  watchedLessonIds,
  favouriteLessonIds,
  recentLessonIds,
  isAdmin,
  onOpenLesson,
  onToggleFavourite,
  onOpenAdminCMS,
}: ExploreVideoHubProps) {
  const [selectedCategory, setSelectedCategory] = useState<Exclude<LearningCategory, 'all'> | null>(
    initialCategory ?? null
  );
  const [selectedClassName, setSelectedClassName] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedChapterNumber, setSelectedChapterNumber] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const publishedLessons = useMemo(
    () => lessons.filter((l) => l.published),
    [lessons]
  );

  // Quick student progress stats
  const recentLessons = useMemo(
    () =>
      recentLessonIds
        .map((id) => publishedLessons.find((l) => l.id === id))
        .filter((l): l is VideoLesson => Boolean(l))
        .slice(0, 4),
    [recentLessonIds, publishedLessons]
  );

  const favouriteLessons = useMemo(
    () => publishedLessons.filter((l) => favouriteLessonIds.includes(l.id)),
    [favouriteLessonIds, publishedLessons]
  );

  const completedChaptersCount = useMemo(() => {
    const completedSet = new Set(watchedLessonIds);
    let count = 0;
    for (const ch of CURRICULUM_CHAPTERS) {
      const chLessons = publishedLessons.filter(
        (l) =>
          l.className === ch.className &&
          l.subject === ch.subject &&
          l.chapterNumber === ch.chapterNumber
      );
      if (chLessons.length > 0 && chLessons.every((l) => completedSet.has(l.id))) {
        count += 1;
      }
    }
    return count;
  }, [publishedLessons, watchedLessonIds]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return publishedLessons.filter((l) =>
      `${l.title} ${l.className} ${l.subject} ${l.chapterName} ${l.summary} ${l.difficulty}`
        .toLowerCase()
        .includes(q)
    );
  }, [publishedLessons, searchQuery]);

  const classesInCategory = selectedCategory
    ? getClassesForCategory(selectedCategory)
    : [];

  const subjectsInClass = selectedClassName
    ? getSubjectsForClass(selectedClassName)
    : [];

  const chapterSummaries = useMemo(() => {
    if (!selectedClassName || !selectedSubject) return [];
    const baseChapters = getChaptersForClassAndSubject(
      selectedClassName,
      selectedSubject
    );
    const relevantLessons = publishedLessons.filter(
      (l) => l.className === selectedClassName && l.subject === selectedSubject
    );

    // If no predefined chapters exist yet for this class/subject, derive from published lessons
    if (baseChapters.length === 0 && relevantLessons.length > 0) {
      const seen = new Map<number, VideoLesson>();
      for (const l of relevantLessons) {
        if (!seen.has(l.chapterNumber)) seen.set(l.chapterNumber, l);
      }
      const derived = Array.from(seen.values()).map((l) => ({
        id: `derived-${l.className}-${l.subject}-${l.chapterNumber}`,
        category: l.category,
        className: l.className,
        subject: l.subject,
        chapterNumber: l.chapterNumber,
        chapterName: l.chapterName,
        description: l.summary,
      }));
      return buildChapterSummaries(derived, relevantLessons, watchedLessonIds);
    }

    return buildChapterSummaries(baseChapters, relevantLessons, watchedLessonIds);
  }, [selectedClassName, selectedSubject, publishedLessons, watchedLessonIds]);

  const activeChapterSummary =
    selectedChapterNumber !== null
      ? chapterSummaries.find(
          (c) => c.chapter.chapterNumber === selectedChapterNumber
        ) ?? null
      : null;

  const scrollStepIntoView = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCategory = (cat: Exclude<LearningCategory, 'all'>) => {
    setSelectedCategory(cat);
    setSelectedClassName(null);
    setSelectedSubject(null);
    setSelectedChapterNumber(null);
    scrollStepIntoView();
  };

  const handleSelectClass = (className: string) => {
    setSelectedClassName(className);
    setSelectedSubject(null);
    setSelectedChapterNumber(null);
    scrollStepIntoView();
  };

  const handleSelectSubject = (subjectName: string) => {
    setSelectedSubject(subjectName);
    setSelectedChapterNumber(null);
    scrollStepIntoView();
  };

  const categoryTitle = selectedCategory
    ? EXPLORE_TRACKS.find((t) => t.id === selectedCategory)?.title ?? selectedCategory
    : null;

  return (
    <section className="bg-[#F8FAFC] min-h-[82vh] pb-16">
      {/* Top Deep Navy Header & Global Search */}
      <div className="bg-[#0B1221] text-white border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-xs sm:text-sm font-semibold text-purple-300">
                VIDYORA Structured Video Learning System
              </p>
              <h1 className="mt-2 font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white [text-wrap:balance]">
                Class, Subject aur Chapter choose karke step-by-step padho.
              </h1>
              <p className="mt-2.5 text-sm sm:text-base text-slate-300 leading-relaxed">
                Class 1 se 12, College, Competitive Exams aur General Knowledge — zero confusion ke saath apne syllabus ke video lessons, notes aur practice questions explore karo.
              </p>
            </div>

            <div className="w-full lg:w-96 space-y-2.5">
              <label htmlFor="explore-global-search" className="sr-only">
                Search lessons by class, subject, or chapter
              </label>
              <div className="relative">
                <Search
                  className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="explore-global-search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Class 10 Maths, DNA, Motion, Atomic..."
                  className="w-full pl-10 pr-4 py-3 min-h-[46px] text-sm bg-white text-[#0B1221] placeholder:text-slate-400 rounded-xl border border-transparent focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
                />
              </div>
              {isAdmin && (
                <button
                  type="button"
                  onClick={onOpenAdminCMS}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] text-xs sm:text-sm font-semibold text-purple-200 bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" aria-hidden="true" />
                  <span>Open Admin Video Studio</span>
                </button>
              )}
            </div>
          </div>

          {/* Student Progress Strip */}
          <div className="mt-7 pt-6 border-t border-white/10 grid grid-cols-3 gap-3 sm:gap-6">
            <div className="rounded-xl bg-white/[0.06] border border-white/10 p-3.5 sm:p-4">
              <p className="text-[11px] sm:text-xs text-blue-200">Completed Lessons</p>
              <p className="mt-1 font-display text-xl sm:text-2xl font-bold text-white tabular-nums">
                {watchedLessonIds.length}
              </p>
            </div>
            <div className="rounded-xl bg-white/[0.06] border border-white/10 p-3.5 sm:p-4">
              <p className="text-[11px] sm:text-xs text-blue-200">Completed Chapters</p>
              <p className="mt-1 font-display text-xl sm:text-2xl font-bold text-white tabular-nums">
                {completedChaptersCount}
              </p>
            </div>
            <div className="rounded-xl bg-white/[0.06] border border-white/10 p-3.5 sm:p-4">
              <p className="text-[11px] sm:text-xs text-blue-200">Saved Favourites</p>
              <p className="mt-1 font-display text-xl sm:text-2xl font-bold text-white tabular-nums">
                {favouriteLessons.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Live Search Results Mode */}
        {searchQuery.trim().length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-xl font-bold text-[#0B1221]">
                Search Results ({searchResults.length})
              </h2>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-sm font-semibold text-[#6D28D9] hover:underline cursor-pointer"
              >
                Clear Search
              </button>
            </div>

            {searchResults.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                <p className="font-display text-base font-bold text-[#0B1221]">
                  "{searchQuery}" ke liye koi video lesson nahi mila
                </p>
                <p className="mt-1.5 text-sm text-slate-600">
                  Class 10 Mathematics, Science, Class 11 Physics, Chemistry ya Class 12 Biology try karein.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {searchResults.map((lesson) => {
                  const isFav = favouriteLessonIds.includes(lesson.id);
                  const isDone = watchedLessonIds.includes(lesson.id);
                  return (
                    <article
                      key={lesson.id}
                      className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-md transition-all"
                    >
                      <div className="p-5 space-y-2.5">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-semibold text-[#6D28D9]">
                            {lesson.className} · {lesson.subject}
                          </span>
                          <span className="font-mono text-slate-500 tabular-nums">
                            {lesson.duration}
                          </span>
                        </div>
                        <h3 className="font-display text-base font-bold text-[#0B1221] leading-snug">
                          {lesson.title}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {lesson.chapter} · {lesson.isDemo ? 'Demo Sample' : 'Published Video'}
                        </p>
                        <p className="text-sm text-slate-600 line-clamp-2">{lesson.summary}</p>
                      </div>
                      <div className="px-5 pb-5 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenLesson(lesson)}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-semibold text-white bg-[#0B1221] hover:bg-[#6D28D9] rounded-xl transition-colors cursor-pointer"
                        >
                          <Play className="w-4 h-4 fill-current" aria-hidden="true" />
                          <span>{isDone ? 'Watch Again' : 'Watch Lesson'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleFavourite(lesson.id)}
                          aria-label={isFav ? 'Remove from favourites' : 'Save to favourites'}
                          className={`w-11 h-11 rounded-xl border flex items-center justify-center cursor-pointer ${
                            isFav
                              ? 'bg-rose-50 border-rose-200 text-rose-600'
                              : 'bg-white border-slate-200 text-slate-500 hover:text-rose-600'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Resume Recently Watched Strip (if any) */}
            {recentLessons.length > 0 && !selectedCategory && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
                <div className="flex items-center gap-2 text-[#0B1221]">
                  <History className="w-4 h-4 text-[#6D28D9]" aria-hidden="true" />
                  <h2 className="font-display text-lg font-bold">
                    Resume Recently Watched
                  </h2>
                </div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {recentLessons.map((lesson) => (
                    <button
                      key={lesson.id}
                      type="button"
                      onClick={() => onOpenLesson(lesson)}
                      className="text-left p-3.5 rounded-xl bg-[#F8FAFC] hover:bg-[#EFF6FF] border border-slate-200 hover:border-[#6D28D9]/40 transition-colors cursor-pointer"
                    >
                      <p className="text-[11px] font-semibold text-[#6D28D9] truncate">
                        {lesson.className} · {lesson.subject}
                      </p>
                      <p className="mt-1 font-display text-sm font-bold text-[#0B1221] line-clamp-2">
                        {lesson.title}
                      </p>
                      <p className="mt-2 text-xs text-slate-500 inline-flex items-center gap-1">
                        <Play className="w-3 h-3 fill-current text-[#6D28D9]" aria-hidden="true" />
                        <span>Resume · {lesson.duration}</span>
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Interactive Breadcrumb Navigation */}
            <nav
              aria-label="Curriculum breadcrumb"
              className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm bg-white px-4 py-3 rounded-xl border border-slate-200"
            >
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory(null);
                  setSelectedClassName(null);
                  setSelectedSubject(null);
                  setSelectedChapterNumber(null);
                }}
                className={`font-semibold cursor-pointer px-2 py-1 rounded-md ${
                  !selectedCategory
                    ? 'text-[#6D28D9] bg-[#EFF6FF]'
                    : 'text-slate-600 hover:text-[#0B1221]'
                }`}
              >
                Explore Categories
              </button>

              {selectedCategory && (
                <>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedClassName(null);
                      setSelectedSubject(null);
                      setSelectedChapterNumber(null);
                    }}
                    className={`font-semibold cursor-pointer px-2 py-1 rounded-md ${
                      !selectedClassName
                        ? 'text-[#6D28D9] bg-[#EFF6FF]'
                        : 'text-slate-600 hover:text-[#0B1221]'
                    }`}
                  >
                    {categoryTitle}
                  </button>
                </>
              )}

              {selectedClassName && (
                <>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSubject(null);
                      setSelectedChapterNumber(null);
                    }}
                    className={`font-semibold cursor-pointer px-2 py-1 rounded-md ${
                      !selectedSubject
                        ? 'text-[#6D28D9] bg-[#EFF6FF]'
                        : 'text-slate-600 hover:text-[#0B1221]'
                    }`}
                  >
                    {selectedClassName}
                  </button>
                </>
              )}

              {selectedSubject && (
                <>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                  <button
                    type="button"
                    onClick={() => setSelectedChapterNumber(null)}
                    className={`font-semibold cursor-pointer px-2 py-1 rounded-md ${
                      selectedChapterNumber === null
                        ? 'text-[#6D28D9] bg-[#EFF6FF]'
                        : 'text-slate-600 hover:text-[#0B1221]'
                    }`}
                  >
                    {selectedSubject}
                  </button>
                </>
              )}

              {activeChapterSummary && (
                <>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                  <span className="font-semibold text-[#6D28D9] bg-[#EFF6FF] px-2 py-1 rounded-md">
                    Ch. {activeChapterSummary.chapter.chapterNumber}:{' '}
                    {activeChapterSummary.chapter.chapterName}
                  </span>
                </>
              )}
            </nav>

            {/* STEP 1: Learning Categories */}
            {!selectedCategory && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-[#6D28D9]">Step 1 of 4</p>
                  <h2 className="font-display text-2xl font-bold text-[#0B1221]">
                    Apni Learning Category Chuno
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {EXPLORE_TRACKS.map((track) => {
                    const count = publishedLessons.filter(
                      (l) => l.category === track.id
                    ).length;
                    return (
                      <button
                        key={track.id}
                        type="button"
                        onClick={() => handleSelectCategory(track.id)}
                        className="group text-left bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between min-h-[210px] hover:-translate-y-0.5 hover:border-[#6D28D9]/50 hover:shadow-md transition-all cursor-pointer"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#6D28D9]">
                              {track.audience}
                            </span>
                            <ArrowRight
                              className="w-4 h-4 text-slate-400 group-hover:text-[#6D28D9] group-hover:translate-x-0.5 transition-all"
                              aria-hidden="true"
                            />
                          </div>
                          <h3 className="mt-2 font-display text-xl font-bold text-[#0B1221]">
                            {track.title}
                          </h3>
                          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                            {track.subtitle}
                          </p>
                        </div>
                        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-slate-500">{track.lessonCount}</span>
                          <span className="font-mono font-semibold text-[#2563EB] tabular-nums">
                            {count} lessons
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 2: Class 1 to 12 (or Track) Selection */}
            {selectedCategory && !selectedClassName && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-[#6D28D9]">Step 2 of 4</p>
                  <h2 className="font-display text-2xl font-bold text-[#0B1221]">
                    {selectedCategory === 'school'
                      ? 'Apni Class Select Karo (Class 1 – Class 12)'
                      : `${categoryTitle} Track Select Karo`}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Class 10 Maths/Science, Class 11 Physics/Chemistry aur Class 12 Biology mein demonstration sample lessons ready hain.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {classesInCategory.map((cls) => {
                    const classLessonCount = publishedLessons.filter(
                      (l) => l.className === cls.name
                    ).length;
                    return (
                      <button
                        key={cls.id}
                        type="button"
                        onClick={() => handleSelectClass(cls.name)}
                        className="group text-left bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between min-h-[150px] hover:-translate-y-0.5 hover:border-[#6D28D9]/60 hover:shadow-md transition-all cursor-pointer"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-semibold text-[#6D28D9]">
                              {cls.groupLabel}
                            </span>
                            <GraduationCap
                              className="w-4 h-4 text-slate-400 group-hover:text-[#6D28D9]"
                              aria-hidden="true"
                            />
                          </div>
                          <h3 className="mt-1.5 font-display text-lg sm:text-xl font-bold text-[#0B1221]">
                            {cls.name}
                          </h3>
                          <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                            {cls.subtitle}
                          </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-slate-500">
                            {cls.subjects.length} subjects
                          </span>
                          <span
                            className={`font-mono font-semibold tabular-nums ${
                              classLessonCount > 0 ? 'text-[#2563EB]' : 'text-slate-400'
                            }`}
                          >
                            {classLessonCount > 0
                              ? `${classLessonCount} lessons`
                              : 'Browse'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 3: Subject Selection */}
            {selectedCategory && selectedClassName && !selectedSubject && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-[#6D28D9]">Step 3 of 4</p>
                  <h2 className="font-display text-2xl font-bold text-[#0B1221]">
                    {selectedClassName} — Subject Select Karo
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {subjectsInClass.map((subj) => {
                    const subjLessons = publishedLessons.filter(
                      (l) =>
                        l.className === selectedClassName &&
                        l.subject === subj.name
                    );
                    const chCount = getChaptersForClassAndSubject(
                      selectedClassName,
                      subj.name
                    ).length;

                    return (
                      <button
                        key={subj.name}
                        type="button"
                        onClick={() => handleSelectSubject(subj.name)}
                        className="group text-left bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between min-h-[155px] hover:-translate-y-0.5 hover:border-[#6D28D9]/60 hover:shadow-md transition-all cursor-pointer"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <BookOpen
                              className="w-5 h-5 text-[#6D28D9]"
                              aria-hidden="true"
                            />
                            <ArrowRight
                              className="w-4 h-4 text-slate-400 group-hover:text-[#6D28D9] group-hover:translate-x-0.5 transition-all"
                              aria-hidden="true"
                            />
                          </div>
                          <h3 className="mt-3 font-display text-lg font-bold text-[#0B1221]">
                            {subj.name}
                          </h3>
                          <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                            {subj.shortDesc}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-slate-500 tabular-nums">
                            {chCount > 0 ? `${chCount} chapters` : 'Curriculum ready'}
                          </span>
                          <span
                            className={`font-mono font-semibold tabular-nums ${
                              subjLessons.length > 0 ? 'text-[#2563EB]' : 'text-slate-400'
                            }`}
                          >
                            {subjLessons.length > 0
                              ? `${subjLessons.length} video lesson${subjLessons.length > 1 ? 's' : ''}`
                              : 'Coming soon'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 4: Chapter Selection */}
            {selectedCategory &&
              selectedClassName &&
              selectedSubject &&
              !activeChapterSummary && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-[#6D28D9]">Step 4 of 4</p>
                      <h2 className="font-display text-2xl font-bold text-[#0B1221]">
                        {selectedClassName} · {selectedSubject} — Chapters
                      </h2>
                    </div>
                  </div>

                  {chapterSummaries.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 text-center space-y-3">
                      <Layers className="w-8 h-8 text-slate-400 mx-auto" aria-hidden="true" />
                      <h3 className="font-display text-lg font-bold text-[#0B1221]">
                        {selectedClassName} {selectedSubject} ke chapters abhi upload ho rahe hain
                      </h3>
                      <p className="text-sm text-slate-600 max-w-lg mx-auto">
                        Demonstration sample chapters abhi Class 10 Mathematics, Class 10 Science, Class 11 Physics, Class 11 Chemistry aur Class 12 Biology mein available hain. Authorized admins Admin Studio se naye video lessons publish kar sakte hain.
                      </p>
                      <div className="pt-2 flex flex-wrap justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedSubject(null)}
                          className="px-4 py-2.5 min-h-[44px] text-sm font-semibold text-[#0B1221] bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                        >
                          Choose Another Subject
                        </button>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={onOpenAdminCMS}
                            className="px-4 py-2.5 min-h-[44px] text-sm font-semibold text-white bg-[#6D28D9] hover:bg-[#7C3AED] rounded-xl cursor-pointer"
                          >
                            Add Video Lesson (Admin)
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {chapterSummaries.map((item) => {
                        const progressPct =
                          item.lessonCount > 0
                            ? Math.round((item.completedCount / item.lessonCount) * 100)
                            : 0;

                        return (
                          <div
                            key={item.chapter.id}
                            className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 hover:border-[#6D28D9]/50 hover:shadow-sm transition-all"
                          >
                            <div className="space-y-2 max-w-2xl">
                              <div className="flex flex-wrap items-center gap-2.5 text-xs">
                                <span className="font-mono font-bold text-[#6D28D9] bg-[#EFF6FF] px-2.5 py-1 rounded-lg tabular-nums">
                                  Chapter {item.chapter.chapterNumber}
                                </span>
                                <span className="font-mono text-slate-500 tabular-nums">
                                  {item.lessonCount} lesson{item.lessonCount === 1 ? '' : 's'}
                                </span>
                                <span aria-hidden="true" className="text-slate-300">
                                  ·
                                </span>
                                {item.status === 'completed' ? (
                                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                                    Completed
                                  </span>
                                ) : item.status === 'in-progress' ? (
                                  <span className="font-semibold text-[#2563EB] tabular-nums">
                                    In Progress ({item.completedCount}/{item.lessonCount})
                                  </span>
                                ) : (
                                  <span className="text-slate-500">Not Started</span>
                                )}
                              </div>

                              <h3 className="font-display text-lg sm:text-xl font-bold text-[#0B1221]">
                                {item.chapter.chapterName}
                              </h3>
                              <p className="text-sm text-slate-600 leading-relaxed">
                                {item.chapter.description}
                              </p>

                              {item.lessonCount > 0 && (
                                <div className="pt-1 max-w-xs">
                                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-[#6D28D9] rounded-full transition-all"
                                      style={{ width: `${progressPct}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="shrink-0">
                              <button
                                type="button"
                                disabled={item.lessonCount === 0}
                                aria-label={
                                  item.lessonCount > 0
                                    ? `Open Chapter ${item.chapter.chapterNumber}: ${item.chapter.chapterName} lessons`
                                    : `No lessons yet in Chapter ${item.chapter.chapterNumber}: ${item.chapter.chapterName}`
                                }
                                onClick={() => {
                                  setSelectedChapterNumber(item.chapter.chapterNumber);
                                  scrollStepIntoView();
                                }}
                                className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[44px] text-sm font-semibold text-white bg-[#0B1221] hover:bg-[#6D28D9] disabled:bg-slate-200 disabled:text-slate-500 rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed"
                              >
                                <Play className="w-4 h-4 fill-current" aria-hidden="true" />
                                <span>
                                  {item.lessonCount > 0
                                    ? 'Open Chapter Lessons'
                                    : 'No Lessons Yet'}
                                </span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

            {/* CHAPTER LESSONS VIEW */}
            {activeChapterSummary && (
              <div className="space-y-5">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-[#6D28D9]">
                      {activeChapterSummary.chapter.className} ·{' '}
                      {activeChapterSummary.chapter.subject} · Chapter{' '}
                      {activeChapterSummary.chapter.chapterNumber}
                    </p>
                    <h2 className="mt-1 font-display text-2xl font-bold text-[#0B1221]">
                      {activeChapterSummary.chapter.chapterName}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {activeChapterSummary.chapter.description}
                    </p>
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    <p className="text-xs text-slate-500">Chapter Completion</p>
                    <p className="font-display text-xl font-bold text-[#6D28D9] tabular-nums">
                      {activeChapterSummary.completedCount} / {activeChapterSummary.lessonCount}{' '}
                      Completed
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeChapterSummary.lessons.map((lesson) => {
                    const isDone = watchedLessonIds.includes(lesson.id);
                    const isFav = favouriteLessonIds.includes(lesson.id);
                    return (
                      <article
                        key={lesson.id}
                        className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between hover:-translate-y-0.5 hover:shadow-md transition-all"
                      >
                        <div>
                          <button
                            type="button"
                            onClick={() => onOpenLesson(lesson)}
                            className="relative block w-full aspect-[16/10] bg-[#0B1221] overflow-hidden text-left cursor-pointer"
                          >
                            <img
                              src={lesson.thumbnail}
                              alt={lesson.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0B1221]/90 via-transparent to-transparent" />
                            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
                              <span className="font-medium">
                                {lesson.isDemo ? 'Demo Sample' : 'Video Lecture'} ·{' '}
                                {lesson.difficulty}
                              </span>
                              <span className="inline-flex items-center gap-1 font-mono bg-[#0B1221]/80 px-2 py-0.5 rounded tabular-nums">
                                <Clock className="w-3 h-3" aria-hidden="true" />
                                {lesson.duration}
                              </span>
                            </div>
                          </button>

                          <div className="p-5">
                            <div className="flex items-center justify-between gap-2 text-xs">
                              <span className="font-semibold text-[#6D28D9]">
                                {lesson.subject} · {lesson.className}
                              </span>
                              {isDone && (
                                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                                  Done
                                </span>
                              )}
                            </div>
                            <h3 className="mt-2 font-display text-lg font-bold text-[#0B1221] leading-snug">
                              {lesson.title}
                            </h3>
                            <p className="mt-2 text-sm text-slate-600 line-clamp-2">
                              {lesson.summary}
                            </p>
                          </div>
                        </div>

                        <div className="px-5 pb-5 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onOpenLesson(lesson)}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-semibold text-white bg-[#0B1221] hover:bg-[#6D28D9] rounded-xl transition-colors cursor-pointer"
                          >
                            <Play className="w-4 h-4 fill-current" aria-hidden="true" />
                            <span>{isDone ? 'Watch Again' : 'Watch Now'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onToggleFavourite(lesson.id)}
                            aria-label={isFav ? 'Remove from favourites' : 'Save to favourites'}
                            className={`w-11 h-11 rounded-xl border flex items-center justify-center cursor-pointer ${
                              isFav
                                ? 'bg-rose-50 border-rose-200 text-rose-600'
                                : 'bg-white border-slate-200 text-slate-500 hover:text-rose-600'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
