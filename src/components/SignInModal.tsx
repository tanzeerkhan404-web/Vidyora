import { useState } from 'react';
import {
  BookCheck,
  Heart,
  Loader2,
  LogOut,
  ShieldCheck,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react';
import { LEARNING_LEVELS } from '../data/educationalContent';
import type {
  FirebaseAuthUser,
  LearningLevel,
  StudentProfile,
} from '../types/vidyora';

interface SignInModalProps {
  student: StudentProfile | null;
  authUser: FirebaseAuthUser | null;
  onGoogleSignIn: () => Promise<void>;
  onGoogleSignOut: () => Promise<void>;
  onOpenAdminCMS: () => void;
  onSaveProfile: (displayName: string, level: LearningLevel) => void;
  onSignOut: () => void;
  onClose: () => void;
}

export function SignInModal({
  student,
  authUser,
  onGoogleSignIn,
  onGoogleSignOut,
  onOpenAdminCMS,
  onSaveProfile,
  onSignOut,
  onClose,
}: SignInModalProps) {
  const [name, setName] = useState(
    student?.displayName ?? authUser?.displayName ?? ''
  );
  const [level, setLevel] = useState<LearningLevel>(
    student?.level ?? 'Class 9-10'
  );
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleClick = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await onGoogleSignIn();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Google Sign-In complete nahi ho paya. Dobara try karein.'
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = name.trim();
    if (cleaned.length < 2) {
      setError('Apna first name ya nickname enter karein (kam se kam 2 letters).');
      return;
    }
    if (cleaned.length > 32) {
      setError('Naam 32 characters se chhota rakhein.');
      return;
    }
    setError('');
    onSaveProfile(cleaned, level);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="signin-modal-title"
      className="fixed inset-0 z-50 bg-[#070C18]/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full shadow-2xl overflow-hidden my-auto">
        <div className="px-6 py-4 bg-[#0B1221] text-white flex items-center justify-between">
          <div>
            <p className="text-xs text-blue-200">VIDYORA Account & Cloud Sync</p>
            <h2 id="signin-modal-title" className="font-display text-lg font-bold">
              {authUser
                ? `Namaste, ${authUser.displayName}`
                : student
                ? `Namaste, ${student.displayName}`
                : 'Sign In to VIDYORA'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sign in dialog"
            className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Firebase Google Auth Section */}
          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-slate-200 space-y-3">
            {authUser ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#0B1221] truncate">
                      {authUser.displayName}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{authUser.email}</p>
                  </div>
                  {authUser.isAdmin && (
                    <span className="px-2.5 py-1 text-[11px] font-bold bg-[#EDE9FE] text-[#6D28D9] rounded-md shrink-0">
                      Admin
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {authUser.isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenAdminCMS();
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 min-h-[42px] text-xs font-semibold text-white bg-[#6D28D9] hover:bg-[#7C3AED] rounded-xl cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Open Admin Studio</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={async () => {
                      await onGoogleSignOut();
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 min-h-[42px] text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Sign Out Google</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold text-[#0B1221]">
                  Cloud Progress Sync & Administrator Access
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Google se sign in karke apne completed chapters aur favourites cloud mein sync karein (authorized admins yahan se Admin Studio access kar sakte hain).
                </p>
                <button
                  type="button"
                  disabled={googleLoading}
                  onClick={handleGoogleClick}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-semibold text-white bg-[#0B1221] hover:bg-[#1E2E4D] disabled:bg-slate-400 rounded-xl transition-colors cursor-pointer"
                >
                  {googleLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <span>Continue with Google</span>
                  )}
                </button>
              </>
            )}
          </div>

          {student && (
            <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-xl bg-[#EFF6FF]/70 border border-blue-200/80">
              <div>
                <div className="flex items-center gap-1 text-[11px] text-slate-600">
                  <BookCheck className="w-3.5 h-3.5 text-[#6D28D9]" aria-hidden="true" />
                  <span>Done</span>
                </div>
                <p className="mt-1 font-display text-lg font-bold text-[#0B1221] tabular-nums">
                  {student.watchedLessonIds.length}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-1 text-[11px] text-slate-600">
                  <Heart className="w-3.5 h-3.5 text-rose-500" aria-hidden="true" />
                  <span>Saved</span>
                </div>
                <p className="mt-1 font-display text-lg font-bold text-[#0B1221] tabular-nums">
                  {student.favouriteLessonIds.length}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-1 text-[11px] text-slate-600">
                  <Trophy className="w-3.5 h-3.5 text-[#2563EB]" aria-hidden="true" />
                  <span>Quizzes</span>
                </div>
                <p className="mt-1 font-display text-lg font-bold text-[#0B1221] tabular-nums">
                  {student.quizHistory.length}
                </p>
              </div>
            </div>
          )}

          {/* Local Student Preferences Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="student-name-input"
                className="block text-xs font-semibold text-[#0B1221]"
              >
                Student First Name ya Nickname
              </label>
              <input
                id="student-name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jaise: Aarav, Diya, Kabir"
                className="mt-1.5 w-full px-3.5 py-2.5 min-h-[44px] text-sm border border-slate-300 rounded-xl text-[#0B1221] focus:outline-none focus:border-[#6D28D9]"
              />
            </div>

            <div>
              <label
                htmlFor="student-level-select"
                className="block text-xs font-semibold text-[#0B1221]"
              >
                Default Learning Level
              </label>
              <select
                id="student-level-select"
                value={level}
                onChange={(e) => setLevel(e.target.value as LearningLevel)}
                className="mt-1.5 w-full px-3.5 py-2.5 min-h-[44px] text-sm border border-slate-300 rounded-xl bg-white text-[#0B1221]"
              >
                {LEARNING_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <p role="alert" className="text-xs font-medium text-red-600">
                {error}
              </p>
            )}

            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-slate-200 flex gap-2 text-[11px] text-slate-600 leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                Bina Google login ke bhi aap apna nickname set karke locally lessons aur progress save kar sakte hain.
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              {student ? (
                <button
                  type="button"
                  onClick={() => {
                    onSignOut();
                    onClose();
                  }}
                  className="px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 rounded-xl cursor-pointer"
                >
                  Clear Local Profile
                </button>
              ) : (
                <span />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2.5 text-sm font-semibold text-slate-600 hover:text-[#0B1221] cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 min-h-[44px] text-sm font-semibold text-white bg-[#6D28D9] hover:bg-[#7C3AED] rounded-xl cursor-pointer"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
