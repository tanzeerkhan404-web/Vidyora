import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import type { PageView, StudentProfile } from '../types/vidyora';

interface NavbarProps {
  activeView: PageView;
  onNavigate: (view: PageView, sectionId?: string) => void;
  student: StudentProfile | null;
  authUser?: { displayName: string; isAdmin: boolean } | null;
  onOpenSignIn: () => void;
}

const NAV_ITEMS: Array<{ label: string; view: PageView; sectionId?: string }> = [
  { label: 'Home', view: 'home', sectionId: 'top' },
  { label: 'Explore', view: 'explore' },
  { label: 'Video Lessons', view: 'video-lessons' },
  { label: 'AI Study Buddy', view: 'ai-suite' },
  { label: 'Free Notes', view: 'free-notes' },
];

export function Navbar({
  activeView,
  onNavigate,
  student,
  authUser,
  onOpenSignIn,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLinkClick = (view: PageView, sectionId?: string) => {
    setMobileMenuOpen(false);
    onNavigate(view, sectionId);
  };

  const accountLabel = authUser
    ? authUser.displayName.split(' ')[0]
    : student
    ? student.displayName
    : 'Sign In';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            handleLinkClick('home', 'top');
          }}
          className="font-display text-xl font-extrabold tracking-tight text-[#0B1221] whitespace-nowrap shrink-0 flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6D28D9] rounded"
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 28 28"
            fill="none"
            aria-hidden="true"
            className="shrink-0"
          >
            <rect width="28" height="28" rx="7" fill="#0B1221" />
            <path
              d="M7.5 8.5L14 20.5L20.5 8.5"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="14" cy="9.2" r="2.2" fill="#8B5CF6" />
          </svg>
          <span>VIDYORA</span>
        </a>

        {/* Zone 2: 5 clean single-line text navigation links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
        >
          {NAV_ITEMS.map((item) => {
            const isCurrent =
              (item.view === 'home' && activeView === 'home') ||
              (item.view === 'explore' && activeView === 'explore') ||
              (item.view === 'video-lessons' &&
                (activeView === 'video-lessons' || activeView === 'lesson-detail')) ||
              (item.view !== 'home' &&
                item.view !== 'explore' &&
                item.view !== 'video-lessons' &&
                activeView === item.view);
            return (
              <a
                key={item.label}
                href={`#${item.sectionId ?? item.view}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleLinkClick(item.view, item.sectionId);
                }}
                aria-current={isCurrent ? 'page' : undefined}
                className={`py-1 whitespace-nowrap shrink-0 transition-colors duration-150 border-b-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6D28D9] ${
                  isCurrent
                    ? 'text-[#0B1221] border-[#6D28D9] font-semibold'
                    : 'border-transparent hover:text-[#0B1221] hover:border-slate-300'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action (Desktop) + Mobile menu toggle */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenSignIn}
            className="px-4 py-2 min-h-[42px] text-sm font-semibold text-white bg-[#0B1221] hover:bg-[#1E2E4D] rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6D28D9]"
          >
            {accountLabel}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <nav
          aria-label="Mobile Navigation"
          className="md:hidden bg-white border-t border-slate-200 px-4 py-3 space-y-1 shadow-xl"
        >
          {NAV_ITEMS.map((item) => {
            const isCurrent =
              (item.view === 'home' && activeView === 'home') ||
              (item.view === 'explore' && activeView === 'explore') ||
              (item.view === 'video-lessons' &&
                (activeView === 'video-lessons' || activeView === 'lesson-detail')) ||
              (item.view !== 'home' &&
                item.view !== 'explore' &&
                item.view !== 'video-lessons' &&
                activeView === item.view);
            return (
              <a
                key={item.label}
                href={`#${item.sectionId ?? item.view}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleLinkClick(item.view, item.sectionId);
                }}
                className={`flex items-center px-3.5 py-3 rounded-xl text-sm font-medium min-h-[46px] transition-colors ${
                  isCurrent
                    ? 'bg-[#EFF6FF] text-[#0B1221] font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>
      )}
    </header>
  );
}
