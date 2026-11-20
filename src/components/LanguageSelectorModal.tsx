import { useMemo, useState } from 'react';
import { Check, Globe, Search, X } from 'lucide-react';
import {
  filterLanguages,
  getLanguageMeta,
  type AppLanguage,
} from '../utils/i18n';

interface LanguageSelectorModalProps {
  currentLanguage: AppLanguage;
  onSelectLanguage: (lang: AppLanguage) => void;
  onClose: () => void;
}

export function LanguageSelectorModal({
  currentLanguage,
  onSelectLanguage,
  onClose,
}: LanguageSelectorModalProps) {
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState<'all' | 'indian' | 'international'>('all');

  const filtered = useMemo(() => filterLanguages(search, group), [search, group]);
  const activeMeta = getLanguageMeta(currentLanguage);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lang-selector-title"
      className="fixed inset-0 z-50 bg-[#070C18]/75 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full shadow-2xl overflow-hidden max-h-[88vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 bg-[#0B1221] text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Globe className="w-5 h-5 text-purple-300" aria-hidden="true" />
            <div>
              <h2 id="lang-selector-title" className="font-display text-lg font-bold">
                Choose Learning Language (24 Languages)
              </h2>
              <p className="text-xs text-slate-300">
                Current: {activeMeta.nativeName} ({activeMeta.name}) · {activeMeta.dir.toUpperCase()}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close language selector"
            className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-200 space-y-3 bg-slate-50">
          <div className="relative">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search in English or native script (e.g. हिन्दी, ಕನ್ನಡ, தமிழ், اردو, العربية)..."
              aria-label="Search supported languages"
              className="w-full pl-10 pr-4 py-2.5 min-h-[44px] rounded-xl border border-slate-300 bg-white text-sm text-[#0B1221] focus:outline-none focus:border-[#6D28D9]"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: 'all', label: 'All (24)' },
                { id: 'indian', label: 'Indian Languages (14)' },
                { id: 'international', label: 'International (10)' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setGroup(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  group === tab.id
                    ? 'bg-[#6D28D9] text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2.5 flex-1">
          {filtered.length === 0 ? (
            <p className="sm:col-span-2 text-center py-8 text-sm text-slate-500">
              No matching language found. Try another search term.
            </p>
          ) : (
            filtered.map((lang) => {
              const selected = lang.code === currentLanguage;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    onSelectLanguage(lang.code);
                    onClose();
                  }}
                  className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border text-left transition-colors cursor-pointer ${
                    selected
                      ? 'bg-[#F5F3FF] border-[#6D28D9] ring-1 ring-[#6D28D9]/30'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0">
                    <p
                      dir={lang.dir}
                      className="font-display text-base font-bold text-[#0B1221] truncate"
                    >
                      {lang.nativeName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {lang.name}
                      {lang.dir === 'rtl' ? ' • RTL Layout' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {lang.dir === 'rtl' && (
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-[#2563EB] text-[10px] font-bold">
                        RTL
                      </span>
                    )}
                    {selected && (
                      <span className="w-6 h-6 rounded-full bg-[#6D28D9] text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5" aria-hidden="true" />
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-600">
          Your preference is saved to your profile &amp; browser. Core navigation, AI Study Buddy responses, Voice AI (where browser voices exist), and RTL direction for Urdu &amp; Arabic update automatically.
        </div>
      </div>
    </div>
  );
}
