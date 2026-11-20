import { useMemo, useState } from 'react';
import { BookOpen, FileText, Play, Search, Sparkles, X } from 'lucide-react';
import type { FreeResource, PageView, VideoLesson } from '../types/vidyora';

interface UniversalSearchModalProps {
  lessons: VideoLesson[];
  resources: FreeResource[];
  onOpenLesson: (lesson: VideoLesson) => void;
  onNavigate: (view: PageView) => void;
  onClose: () => void;
}

export function UniversalSearchModal({
  lessons,
  resources,
  onOpenLesson,
  onNavigate,
  onClose,
}: UniversalSearchModalProps) {
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();

  const matchingLessons = useMemo(() => {
    if (!q) return lessons.slice(0, 4);
    return lessons
      .filter((l) =>
        `${l.title} ${l.subject} ${l.className} ${l.chapterName} ${l.summary}`
          .toLowerCase()
          .includes(q)
      )
      .slice(0, 6);
  }, [lessons, q]);

  const matchingResources = useMemo(() => {
    if (!q) return resources.slice(0, 3);
    return resources
      .filter((r) =>
        `${r.title} ${r.subject} ${r.level} ${r.summary}`.toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [resources, q]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Universal VIDYORA Search"
      className="fixed inset-0 z-50 bg-[#070C18]/75 backdrop-blur-sm flex items-start justify-center p-4 pt-12 sm:pt-20 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-200 flex items-center gap-3">
          <Search className="w-5 h-5 text-[#6D28D9] shrink-0" aria-hidden="true" />
          <input
            type="search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search video lessons, subjects, chapters, free notes..."
            className="flex-1 text-sm sm:text-base text-[#0B1221] placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close universal search"
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Video Lessons */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 text-[#6D28D9]" aria-hidden="true" />
              <span>Video Lessons ({matchingLessons.length})</span>
            </p>
            {matchingLessons.length === 0 ? (
              <p className="text-xs text-slate-500 px-2">No matching lessons found.</p>
            ) : (
              <div className="space-y-1.5">
                {matchingLessons.map((lesson) => (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => {
                      onOpenLesson(lesson);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-[#EFF6FF] text-left transition-colors cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#0B1221] truncate">
                        {lesson.title}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {lesson.className} • {lesson.subject} • {lesson.chapterName}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-[#6D28D9] shrink-0">
                      {lesson.duration}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Free Notes */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#2563EB]" aria-hidden="true" />
              <span>Study Notes &amp; Formula Sheets ({matchingResources.length})</span>
            </p>
            {matchingResources.length === 0 ? (
              <p className="text-xs text-slate-500 px-2">No matching notes found.</p>
            ) : (
              <div className="space-y-1.5">
                {matchingResources.map((res) => (
                  <button
                    key={res.id}
                    type="button"
                    onClick={() => {
                      onNavigate('free-notes');
                      onClose();
                    }}
                    className="w-full flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-[#EDE9FE]/50 text-left transition-colors cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#0B1221] truncate">
                        {res.title}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {res.subject} • {res.level} • {res.format}
                      </p>
                    </div>
                    <BookOpen className="w-4 h-4 text-[#2563EB] shrink-0" aria-hidden="true" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Jump Shortcuts */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                onNavigate('lectures');
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-[#0B1221] cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#6D28D9]" aria-hidden="true" />
              <span>Open Members Lectures</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onNavigate('plans');
                onClose();
              }}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-[#0B1221] cursor-pointer"
            >
              Membership Plans
            </button>
            <button
              type="button"
              onClick={() => {
                onNavigate('packages');
                onClose();
              }}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-[#0B1221] cursor-pointer"
            >
              Learning Packages
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
