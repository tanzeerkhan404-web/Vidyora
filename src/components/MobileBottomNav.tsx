import { useState } from 'react';
import {
  BookOpen,
  Bot,
  CalendarClock,
  Camera,
  Compass,
  FileText,
  Home,
  LayoutDashboard,
  LayoutGrid,
  ListChecks,
  PlaySquare,
  ShieldCheck,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import type {
  AIToolTab,
  FirebaseAuthUser,
  PageView,
  StudentProfile,
} from '../types/vidyora';

interface MobileBottomNavProps {
  activeView: PageView;
  activeAITool: AIToolTab;
  student: StudentProfile | null;
  authUser: FirebaseAuthUser | null;
  onNavigate: (view: PageView, sectionId?: string) => void;
  onOpenAITool: (tool: AIToolTab) => void;
  onOpenSignIn: () => void;
}

export function MobileBottomNav({
  activeView,
  activeAITool,
  student,
  authUser,
  onNavigate,
  onOpenAITool,
  onOpenSignIn,
}: MobileBottomNavProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const navigateAndClose = (view: PageView, sectionId?: string) => {
    setSheetOpen(false);
    onNavigate(view, sectionId);
  };

  const openAIAndClose = (tool: AIToolTab) => {
    setSheetOpen(false);
    onOpenAITool(tool);
  };

  const tabs: Array<{
    id: string;
    label: string;
    icon: typeof Home;
    active: boolean;
    onClick: () => void;
  }> = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      active: activeView === 'home' && !sheetOpen,
      onClick: () => navigateAndClose('home', 'top'),
    },
    {
      id: 'explore',
      label: 'Explore',
      icon: Compass,
      active:
        (activeView === 'explore' ||
          activeView === 'video-lessons' ||
          activeView === 'lesson-detail') &&
        !sheetOpen,
      onClick: () => navigateAndClose('explore'),
    },
    {
      id: 'ai-tutor',
      label: 'AI Tutor',
      icon: Sparkles,
      active: activeView === 'ai-suite' && !sheetOpen,
      onClick: () => openAIAndClose(activeAITool),
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      active: activeView === 'dashboard' && !sheetOpen,
      onClick: () => navigateAndClose('dashboard'),
    },
    {
      id: 'menu',
      label: 'All Apps',
      icon: LayoutGrid,
      active: sheetOpen,
      onClick: () => setSheetOpen((prev) => !prev),
    },
  ];

  const profileLabel = authUser
    ? authUser.displayName
    : student
    ? student.displayName
    : 'Sign In / Profile';

  return (
    <>
      {/* Slide-up Full App Navigation Sheet for Android PWA */}
      {sheetOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="VIDYORA App Navigation Menu"
          className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-[#070C18]/65 backdrop-blur-xs"
          onClick={() => setSheetOpen(false)}
        >
          <div
            className="bg-white rounded-t-3xl border-t border-slate-200 shadow-2xl max-h-[85vh] overflow-y-auto px-4 pt-3 pb-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto mb-3" />

            <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <p className="text-[11px] font-semibold text-[#6D28D9] uppercase tracking-wider">
                  VIDYORA Mobile App
                </p>
                <h2 className="font-display text-base font-bold text-[#0B1221]">
                  Quick App Navigation
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                aria-label="Close app menu"
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Install VIDYORA CTA (auto-hides if already standalone installed) */}
              <PWAInstallButton
                variant="menu"
                onAfterAction={() => setSheetOpen(false)}
              />

              {/* Learning Sections */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 px-1">
                  Learning &amp; Library
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => navigateAndClose('home', 'top')}
                    className="flex items-center gap-2.5 px-3.5 py-3 min-h-[48px] rounded-xl bg-slate-50 hover:bg-[#EFF6FF] border border-slate-200/80 text-left text-xs font-semibold text-[#0B1221] cursor-pointer"
                  >
                    <Home className="w-4 h-4 text-[#2563EB] shrink-0" aria-hidden="true" />
                    <span>Home</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateAndClose('explore')}
                    className="flex items-center gap-2.5 px-3.5 py-3 min-h-[48px] rounded-xl bg-slate-50 hover:bg-[#EFF6FF] border border-slate-200/80 text-left text-xs font-semibold text-[#0B1221] cursor-pointer"
                  >
                    <Compass className="w-4 h-4 text-[#6D28D9] shrink-0" aria-hidden="true" />
                    <span>Explore Classes</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateAndClose('video-lessons')}
                    className="flex items-center gap-2.5 px-3.5 py-3 min-h-[48px] rounded-xl bg-slate-50 hover:bg-[#EFF6FF] border border-slate-200/80 text-left text-xs font-semibold text-[#0B1221] cursor-pointer"
                  >
                    <PlaySquare className="w-4 h-4 text-[#2563EB] shrink-0" aria-hidden="true" />
                    <span>Video Lessons</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateAndClose('free-notes')}
                    className="flex items-center gap-2.5 px-3.5 py-3 min-h-[48px] rounded-xl bg-slate-50 hover:bg-[#EFF6FF] border border-slate-200/80 text-left text-xs font-semibold text-[#0B1221] cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4 text-[#6D28D9] shrink-0" aria-hidden="true" />
                    <span>Free Notes</span>
                  </button>
                </div>
              </div>

              {/* AI Study Suite */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 px-1">
                  AI Study Tools (Internet Required)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => openAIAndClose('study-buddy')}
                    className="flex items-center gap-2.5 px-3.5 py-3 min-h-[48px] rounded-xl bg-[#EDE9FE]/55 hover:bg-[#EDE9FE] border border-purple-200/80 text-left text-xs font-semibold text-[#0B1221] cursor-pointer"
                  >
                    <Bot className="w-4 h-4 text-[#6D28D9] shrink-0" aria-hidden="true" />
                    <span>AI Study Buddy</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openAIAndClose('doubt-solver')}
                    className="flex items-center gap-2.5 px-3.5 py-3 min-h-[48px] rounded-xl bg-[#EDE9FE]/55 hover:bg-[#EDE9FE] border border-purple-200/80 text-left text-xs font-semibold text-[#0B1221] cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-[#6D28D9] shrink-0" aria-hidden="true" />
                    <span>AI Doubt Solver</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openAIAndClose('notes')}
                    className="flex items-center gap-2.5 px-3.5 py-3 min-h-[48px] rounded-xl bg-[#EDE9FE]/55 hover:bg-[#EDE9FE] border border-purple-200/80 text-left text-xs font-semibold text-[#0B1221] cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-[#6D28D9] shrink-0" aria-hidden="true" />
                    <span>AI Notes</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openAIAndClose('quiz')}
                    className="flex items-center gap-2.5 px-3.5 py-3 min-h-[48px] rounded-xl bg-[#EDE9FE]/55 hover:bg-[#EDE9FE] border border-purple-200/80 text-left text-xs font-semibold text-[#0B1221] cursor-pointer"
                  >
                    <ListChecks className="w-4 h-4 text-[#6D28D9] shrink-0" aria-hidden="true" />
                    <span>AI Quizzes</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openAIAndClose('planner')}
                    className="col-span-2 flex items-center gap-2.5 px-3.5 py-3 min-h-[48px] rounded-xl bg-[#EFF6FF] hover:bg-blue-100/70 border border-blue-200/80 text-left text-xs font-semibold text-[#0B1221] cursor-pointer"
                  >
                    <CalendarClock className="w-4 h-4 text-[#2563EB] shrink-0" aria-hidden="true" />
                    <span>AI Study Planner</span>
                  </button>
                </div>
              </div>

              {/* Student Account */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 px-1">
                  My Account
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => navigateAndClose('dashboard')}
                    className="flex items-center gap-2.5 px-3.5 py-3 min-h-[48px] rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left text-xs font-semibold text-[#0B1221] cursor-pointer"
                  >
                    <LayoutDashboard className="w-4 h-4 text-[#0B1221] shrink-0" aria-hidden="true" />
                    <span>Student Dashboard</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSheetOpen(false);
                      onOpenSignIn();
                    }}
                    className="flex items-center gap-2.5 px-3.5 py-3 min-h-[48px] rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left text-xs font-semibold text-[#0B1221] cursor-pointer"
                  >
                    <User className="w-4 h-4 text-[#6D28D9] shrink-0" aria-hidden="true" />
                    <span className="truncate">{profileLabel}</span>
                  </button>
                  {authUser?.isAdmin && (
                    <button
                      type="button"
                      onClick={() => navigateAndClose('admin-cms')}
                      className="col-span-2 flex items-center gap-2.5 px-3.5 py-3 min-h-[48px] rounded-xl bg-[#0B1221] text-white text-left text-xs font-semibold cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 text-purple-300 shrink-0" aria-hidden="true" />
                      <span>Admin Studio (Authorized Only)</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Android-friendly Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(11,18,33,0.08)] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="grid grid-cols-5 h-16 max-w-lg mx-auto px-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={tab.onClick}
                aria-current={tab.active ? 'page' : undefined}
                aria-expanded={tab.id === 'menu' ? sheetOpen : undefined}
                className={`relative flex flex-col items-center justify-center gap-1 min-h-[56px] rounded-xl transition-colors cursor-pointer ${
                  tab.active
                    ? 'text-[#6D28D9] font-bold'
                    : 'text-slate-500 hover:text-[#0B1221] font-medium'
                }`}
              >
                {tab.active && (
                  <span
                    aria-hidden="true"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[#6D28D9]"
                  />
                )}
                <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span className="text-[11px] leading-none truncate max-w-full px-0.5">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
