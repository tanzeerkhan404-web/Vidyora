import { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Heart,
  History,
  Play,
  Search,
} from 'lucide-react';
import { filterLessons } from '../utils/eduLogic';
import type {
  DifficultyLevel,
  LearningCategory,
  VideoLesson,
} from '../types/vidyora';

interface VideoLessonsSectionProps {
  lessons: VideoLesson[];
  selectedCategory: LearningCategory;
  onCategoryChange: (cat: LearningCategory) => void;
  watchedLessonIds: string[];
  favouriteLessonIds: string[];
  recentLessonIds: string[];
  onWatchLesson: (lesson: VideoLesson) => void;
  onToggleFavourite: (lessonId: string) => void;
  onOpenExploreHub?: () => void;
  isStandalonePage?: boolean;
}

const FILTER_TABS: Array<{ id: LearningCategory; label: string }> = [
  { id: 'all', label: 'All Lessons' },
  { id: 'school', label: 'School Classes' },
  { id: 'college', label: 'College Learning' },
  { id: 'competitive', label: 'Competitive Exams' },
  { id: 'gk', label: 'General Knowledge' },
];

const DIFFICULTY_OPTIONS: DifficultyLevel[] = [
  'All',
  'Beginner',
  'Intermediate',
  'Advanced',
];

type StudentShelf = 'all' | 'recent' | 'favourites' | 'completed';

export function VideoLessonsSection({
  lessons,
  selectedCategory,
  onCategoryChange,
  watchedLessonIds,
  favouriteLessonIds,
  recentLessonIds,
  onWatchLesson,
  onToggleFavourite,
  onOpenExploreHub,
  isStandalonePage = false,
}: VideoLessonsSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('All');
  const [shelf, setShelf] = useState<StudentShelf>('all');
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const publishedLessons = lessons.filter((l) => l.published);

  const shelfLessons =
    shelf === 'favourites'
      ? publishedLessons.filter((l) => favouriteLessonIds.includes(l.id))
      : shelf === 'completed'
      ? publishedLessons.filter((l) => watchedLessonIds.includes(l.id))
      : shelf === 'recent'
      ? recentLessonIds
          .map((id) => publishedLessons.find((l) => l.id === id))
          .filter((l): l is VideoLesson => Boolean(l))
      : publishedLessons;

  const filtered = filterLessons(
    shelfLessons,
    selectedCategory,
    searchQuery,
    difficulty
  );

  // Show a concise curated grid of 6 on homepage; show full catalog on standalone page or when searching/filtering
  const visibleLessons =
    !isStandalonePage &&
    shelf === 'all' &&
    selectedCategory === 'all' &&
    difficulty === 'All' &&
    !searchQuery.trim()
      ? filtered.slice(0, 6)
      : filtered;

  return (
    <section
      id="video-lessons"
      className={`${isStandalonePage ? 'py-10 lg:py-14' : 'py-16 lg:py-20'} bg-[#F8FAFC]`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-[#6D28D9]">
              {isStandalonePage ? 'Video Lessons Library' : 'Popular Video Lessons'}
            </p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#0B1221] [text-wrap:balance]">
              Dekh kar samjho, sirf ratto mat.
            </h2>
            <p className="mt-2.5 text-base text-slate-600">
              Class 10 Maths/Science, Class 11 Physics/Chemistry, Class 12 Biology aur College tracks — visual concepts, practice questions aur notes ke saath.
            </p>
          </div>

          <div className="w-full lg:w-80 flex flex-col sm:flex-row lg:flex-col gap-2.5">
            <label htmlFor="lesson-search" className="sr-only">
              Search video lessons
            </label>
            <div className="relative flex-1">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="lesson-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Class, subject ya chapter search karein..."
                className="w-full pl-10 pr-4 py-2.5 min-h-[44px] text-sm bg-white border border-slate-200 rounded-xl text-[#0B1221] placeholder:text-slate-400 focus:outline-none focus:border-[#6D28D9] focus:ring-2 focus:ring-[#6D28D9]/15"
              />
            </div>

            {onOpenExploreHub && (
              <button
                type="button"
                onClick={onOpenExploreHub}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px] text-xs sm:text-sm font-semibold text-[#6D28D9] bg-white hover:bg-[#EFF6FF] border border-[#6D28D9]/30 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
              >
                <span>Browse Class 1–12 by Chapter</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* Standalone Student Quick Shelf: All / Recently Watched / Favourites / Completed */}
        {isStandalonePage && (
          <div className="mt-6 flex flex-wrap items-center gap-2">
            {(
              [
                { id: 'all', label: `All Videos (${publishedLessons.length})` },
                { id: 'recent', label: `Recently Watched (${recentLessonIds.length})` },
                { id: 'favourites', label: `Favourites (${favouriteLessonIds.length})` },
                { id: 'completed', label: `Completed (${watchedLessonIds.length})` },
              ] as Array<{ id: StudentShelf; label: string }>
            ).map((tab) => {
              const active = shelf === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setShelf(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 min-h-[42px] text-xs sm:text-sm font-semibold rounded-xl border transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#0B1221] text-white border-[#0B1221]'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-[#6D28D9]/40'
                  }`}
                >
                  {tab.id === 'recent' && <History className="w-3.5 h-3.5" aria-hidden="true" />}
                  {tab.id === 'favourites' && <Heart className="w-3.5 h-3.5" aria-hidden="true" />}
                  {tab.id === 'completed' && (
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Category + Difficulty Filters */}
        <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div
            role="tablist"
            aria-label="Filter video lessons by category"
            className="flex items-center gap-1.5 p-1.5 bg-slate-200/75 rounded-xl overflow-x-auto max-w-full"
          >
            {FILTER_TABS.map((tab) => {
              const active = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  type="button"
                  aria-selected={active}
                  onClick={() => onCategoryChange(tab.id)}
                  className={`px-3.5 py-2 min-h-[40px] text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-white text-[#0B1221] shadow-sm font-semibold'
                      : 'text-slate-600 hover:text-[#0B1221]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <label
              htmlFor="lesson-difficulty-select"
              className="text-xs font-semibold text-slate-600 whitespace-nowrap"
            >
              Difficulty:
            </label>
            <select
              id="lesson-difficulty-select"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
              className="px-3 py-2 min-h-[42px] text-xs sm:text-sm font-medium bg-white border border-slate-200 rounded-xl text-[#0B1221] focus:outline-none focus:border-[#6D28D9]"
            >
              {DIFFICULTY_OPTIONS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl === 'All' ? 'All Levels' : lvl}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Empty State */}
        {visibleLessons.length === 0 ? (
          <div className="mt-10 bg-white border border-slate-200 rounded-2xl p-10 text-center">
            <p className="font-display text-lg font-bold text-[#0B1221]">
              {shelf === 'favourites'
                ? 'Abhi tak koi favourite lesson save nahi kiya hai'
                : shelf === 'recent'
                ? 'Abhi tak koi lesson watch nahi kiya hai'
                : shelf === 'completed'
                ? 'Abhi tak koi lesson complete mark nahi kiya hai'
                : 'Is filter mein koi lesson nahi mila'}
            </p>
            <p className="mt-2 text-sm text-slate-600">
              All Videos view par jaakar Class 10–12 chapters aur video lessons explore karein.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setDifficulty('All');
                setShelf('all');
                onCategoryChange('all');
              }}
              className="mt-5 px-5 py-2.5 min-h-[44px] text-sm font-semibold text-white bg-[#0B1221] hover:bg-[#1E2E4D] rounded-xl cursor-pointer"
            >
              Show All Lessons
            </button>
          </div>
        ) : (
          <>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleLessons.map((lesson) => {
                const isWatched = watchedLessonIds.includes(lesson.id);
                const isFavourite = favouriteLessonIds.includes(lesson.id);
                const imgFailed = failedImages[lesson.id];

                return (
                  <article
                    key={lesson.id}
                    className="group bg-white rounded-2xl border border-slate-200/90 overflow-hidden flex flex-col justify-between hover:border-[#6D28D9]/40 hover:shadow-lg transition-all duration-150 hover:-translate-y-0.5"
                  >
                    <div>
                      {/* Clickable 4:3 Thumbnail opening full Lesson Page */}
                      <button
                        type="button"
                        onClick={() => onWatchLesson(lesson)}
                        aria-label={`Open lesson page for ${lesson.title}`}
                        className="block w-full text-left relative aspect-[4/3] bg-[#0B1221] overflow-hidden cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#6D28D9]"
                      >
                        {!imgFailed ? (
                          <img
                            src={lesson.thumbnail}
                            alt={`${lesson.subject}: ${lesson.title}`}
                            referrerPolicy="no-referrer"
                            onError={() =>
                              setFailedImages((prev) => ({
                                ...prev,
                                [lesson.id]: true,
                              }))
                            }
                            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#0B1221] to-[#3B0764] flex flex-col items-center justify-center p-6 text-center">
                            <span className="font-display text-lg font-bold text-white">
                              {lesson.subject}
                            </span>
                            <span className="mt-1 text-xs text-blue-200">
                              {lesson.chapter}
                            </span>
                          </div>
                        )}
                        <div
                          aria-hidden="true"
                          className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#070C18]/90 via-[#070C18]/40 to-transparent"
                        />
                        <div className="absolute inset-x-0 bottom-0 px-4 py-3 flex items-center justify-between text-xs text-white">
                          <span className="font-medium truncate pr-2">
                            {lesson.isDemo ? 'Demo Sample' : 'Video Lecture'} ·{' '}
                            {lesson.difficulty}
                          </span>
                          <span className="inline-flex items-center gap-1 font-mono tabular-nums shrink-0">
                            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                            {lesson.duration}
                          </span>
                        </div>
                      </button>

                      {/* Clean Unboxed Metadata + Content */}
                      <div className="p-5">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 min-w-0">
                          <span className="font-semibold text-[#6D28D9] shrink-0">
                            {lesson.subject}
                          </span>
                          <span aria-hidden="true" className="shrink-0">
                            ·
                          </span>
                          <span className="truncate">{lesson.chapter}</span>
                          <span aria-hidden="true" className="shrink-0">
                            ·
                          </span>
                          <span className="shrink-0">{lesson.className}</span>
                        </div>

                        <h3 className="mt-2 font-display text-lg font-bold text-[#0B1221] leading-snug">
                          {lesson.title}
                        </h3>

                        <p className="mt-2 text-sm text-slate-600 leading-relaxed line-clamp-3">
                          {lesson.summary}
                        </p>
                      </div>
                    </div>

                    <div className="px-5 pb-5 pt-2 flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => onWatchLesson(lesson)}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] text-sm font-semibold text-white bg-[#0B1221] hover:bg-[#6D28D9] rounded-xl transition-colors duration-150 whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6D28D9]"
                      >
                        <Play className="w-4 h-4 fill-current" aria-hidden="true" />
                        <span>{isWatched ? 'Watch Again' : 'Watch Now'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleFavourite(lesson.id)}
                        aria-label={
                          isFavourite
                            ? `Remove ${lesson.title} from favourites`
                            : `Save ${lesson.title} to favourites`
                        }
                        className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                          isFavourite
                            ? 'bg-rose-50 border-rose-200 text-rose-600'
                            : 'bg-white border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200'
                        }`}
                      >
                        <Heart
                          className={`w-4 h-4 ${isFavourite ? 'fill-current' : ''}`}
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            {!isStandalonePage && filtered.length > visibleLessons.length && onOpenExploreHub && (
              <div className="mt-8 text-center">
                <button
                  type="button"
                  onClick={onOpenExploreHub}
                  className="inline-flex items-center gap-2 px-6 py-3 min-h-[46px] text-sm font-semibold text-white bg-[#6D28D9] hover:bg-[#7C3AED] rounded-xl transition-colors cursor-pointer"
                >
                  <span>Explore All {filtered.length} Lessons by Class & Chapter</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
