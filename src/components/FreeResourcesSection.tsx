import { useState } from 'react';
import { BookOpen, Download, Eye, Search, X } from 'lucide-react';
import { filterResources, formatResourceAsText } from '../utils/eduLogic';
import { downloadTextFile } from '../utils/aiClient';
import type { FreeResource, LearningCategory } from '../types/vidyora';

interface FreeResourcesSectionProps {
  resources: FreeResource[];
  initialCategory?: LearningCategory;
  isStandalonePage?: boolean;
}

const RESOURCE_TABS: Array<{ id: LearningCategory; label: string }> = [
  { id: 'all', label: 'All Resources' },
  { id: 'school', label: 'School Classes' },
  { id: 'college', label: 'College' },
  { id: 'competitive', label: 'Competitive Exams' },
  { id: 'gk', label: 'General Knowledge' },
];

export function FreeResourcesSection({
  resources,
  initialCategory = 'all',
  isStandalonePage = false,
}: FreeResourcesSectionProps) {
  const [category, setCategory] = useState<LearningCategory>(initialCategory);
  const [search, setSearch] = useState('');
  const [previewResource, setPreviewResource] = useState<FreeResource | null>(null);

  const filtered = filterResources(resources, category, search);

  const handleDownload = (res: FreeResource) => {
    downloadTextFile(`${res.id}.txt`, formatResourceAsText(res));
  };

  return (
    <section
      id="free-notes"
      className={`${isStandalonePage ? 'py-10 lg:py-14' : 'py-16 lg:py-20'} bg-[#F8FAFC]`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-[#6D28D9]">
              Free Resources & Revision Notes
            </p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#0B1221] [text-wrap:balance]">
              Exam-ready notes aur formula sheets bilkul free download karo.
            </h2>
            <p className="mt-2.5 text-base text-slate-600">
              Quick revision capsules, accurate definitions aur board/exam checklists — bina kisi paywall ke.
            </p>
          </div>

          <div className="w-full lg:w-72">
            <label htmlFor="resource-search" className="sr-only">
              Search free notes
            </label>
            <div className="relative">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="resource-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Notes ya formula sheet search karein..."
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl text-[#0B1221] placeholder:text-slate-400 focus:outline-none focus:border-[#6D28D9] focus:ring-2 focus:ring-[#6D28D9]/15"
              />
            </div>
          </div>
        </div>

        <div
          role="tablist"
          aria-label="Filter free resources"
          className="mt-7 flex items-center gap-1.5 p-1.5 bg-slate-200/70 rounded-xl overflow-x-auto max-w-full w-fit"
        >
          {RESOURCE_TABS.map((tab) => {
            const active = category === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => setCategory(tab.id)}
                className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
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

        {filtered.length === 0 ? (
          <div className="mt-10 bg-white border border-slate-200 rounded-2xl p-10 text-center">
            <p className="font-display text-lg font-bold text-[#0B1221]">
              Koi matching resource nahi mila
            </p>
            <button
              type="button"
              onClick={() => {
                setCategory('all');
                setSearch('');
              }}
              className="mt-4 px-4 py-2 text-sm font-semibold text-white bg-[#0B1221] rounded-lg cursor-pointer"
            >
              Show All Free Notes
            </button>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((res) => (
              <article
                key={res.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-6 flex flex-col justify-between hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md transition-all duration-150"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-[#6D28D9]">{res.subject}</span>
                    <span className="font-mono tabular-nums">
                      {res.format} · {res.pages} pages
                    </span>
                  </div>

                  <h3 className="mt-2.5 font-display text-lg font-bold text-[#0B1221] leading-snug">
                    {res.title}
                  </h3>

                  <p className="mt-1 text-xs font-medium text-slate-500">{res.level}</p>

                  <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                    {res.summary}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPreviewResource(res)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 min-h-[44px] text-sm font-semibold text-[#0B1221] bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <Eye className="w-4 h-4" aria-hidden="true" />
                    <span>Read Notes</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload(res)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 min-h-[44px] text-sm font-semibold text-white bg-[#0B1221] hover:bg-[#6D28D9] rounded-xl transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <Download className="w-4 h-4" aria-hidden="true" />
                    <span>Download</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Resource Preview Modal */}
      {previewResource && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="resource-preview-title"
          className="fixed inset-0 z-50 bg-[#070C18]/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full shadow-2xl overflow-hidden my-auto">
            <div className="px-6 py-4 bg-[#0B1221] text-white flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-blue-200">
                  {previewResource.subject} · {previewResource.level} · {previewResource.format}
                </p>
                <h3
                  id="resource-preview-title"
                  className="font-display text-lg font-bold"
                >
                  {previewResource.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewResource(null)}
                aria-label="Close resource preview"
                className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
              <p className="text-sm text-slate-700 leading-relaxed">
                {previewResource.summary}
              </p>

              <div>
                <h4 className="font-display text-base font-bold text-[#0B1221] flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#6D28D9]" aria-hidden="true" />
                  <span>Key Definitions</span>
                </h4>
                <dl className="mt-3 space-y-3">
                  {previewResource.definitions.map((def) => (
                    <div key={def.term} className="p-3.5 rounded-xl bg-[#F8FAFC] border border-slate-200/80">
                      <dt className="text-sm font-bold text-[#0B1221]">{def.term}</dt>
                      <dd className="mt-1 text-sm text-slate-600 leading-relaxed">
                        {def.meaning}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div>
                <h4 className="font-display text-base font-bold text-[#0B1221]">
                  Important Formulas & Facts
                </h4>
                <ul className="mt-2.5 space-y-2">
                  {previewResource.formulas.map((f) => (
                    <li
                      key={f}
                      className="px-3.5 py-2.5 rounded-xl bg-[#EFF6FF] font-mono text-xs sm:text-sm text-[#0B1221]"
                    >
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-display text-base font-bold text-[#0B1221]">
                  Exam & Revision Tips
                </h4>
                <ul className="mt-2.5 space-y-2 text-sm text-slate-700">
                  {previewResource.importantPoints.map((pt) => (
                    <li key={pt} className="flex gap-2 leading-relaxed">
                      <span className="text-[#6D28D9] font-bold" aria-hidden="true">
                        •
                      </span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPreviewResource(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-[#0B1221] cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleDownload(previewResource)}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#6D28D9] hover:bg-[#7C3AED] rounded-xl cursor-pointer"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                <span>Download Study Sheet</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
