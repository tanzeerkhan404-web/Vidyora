import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  BookCheck,
  BookOpen,
  CheckCircle2,
  Clock,
  Crown,
  ExternalLink,
  FileText,
  GraduationCap,
  Heart,
  Loader2,
  Lock,
  Play,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  Video,
  Youtube,
} from 'lucide-react';
import { BUILTIN_THUMBNAILS } from '../data/educationalContent';
import {
  fetchProtectedLecturesFromBackend,
  submitTeacherLectureToDb,
  subscribeTeacherOwnLectures,
  type ProtectedLecturesResponse,
} from '../services/lecturesRepository';
import type {
  FirebaseAuthUser,
  LectureCategory,
  LectureItem,
  LectureSourceType,
} from '../types/vidyora';
import {
  LECTURE_CATEGORIES,
  LECTURE_SOURCE_LABELS,
  filterLectures,
  getRecommendedLectures,
  parseYouTubeLectureUrl,
  validateLectureSubmission,
} from '../utils/lectureLogic';

interface LecturesHubPageProps {
  authUser: FirebaseAuthUser | null;
  authLoading: boolean;
  watchedLectureIds: string[];
  favouriteLectureIds: string[];
  recentLectureIds: string[];
  onToggleWatched: (lectureId: string) => void;
  onToggleFavourite: (lectureId: string) => void;
  onRecordRecent: (lectureId: string) => void;
  onOpenSignIn: () => void;
  onOpenPlans: () => void;
  onOpenAdminCMS: () => void;
}

export function LecturesHubPage({
  authUser,
  authLoading,
  watchedLectureIds,
  favouriteLectureIds,
  recentLectureIds,
  onToggleWatched,
  onToggleFavourite,
  onRecordRecent,
  onOpenSignIn,
  onOpenPlans,
  onOpenAdminCMS,
}: LecturesHubPageProps) {
  const [sectionMode, setSectionMode] = useState<'library' | 'teacher-portal'>('library');
  const [loading, setLoading] = useState(true);
  const [accessState, setAccessState] = useState<ProtectedLecturesResponse | null>(null);
  const [activeLecture, setActiveLecture] = useState<LectureItem | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<LectureCategory | 'All'>('All');
  const [selectedSource, setSelectedSource] = useState<LectureSourceType | 'all'>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [shelf, setShelf] = useState<'all' | 'recent' | 'favourites' | 'completed' | 'featured'>('all');

  // Teacher submission state
  const [teacherSubmissions, setTeacherSubmissions] = useState<LectureItem[]>([]);
  const [tTitle, setTTitle] = useState('');
  const [tDescription, setTDescription] = useState('');
  const [tCategory, setTCategory] = useState<LectureCategory>('Classes 9-10');
  const [tClassName, setTClassName] = useState('Class 10');
  const [tSubject, setTSubject] = useState('Science');
  const [tChapterNum, setTChapterNum] = useState(1);
  const [tChapterName, setTChapterName] = useState('');
  const [tDuration, setTDuration] = useState('12:00');
  const [tVideoUrl, setTVideoUrl] = useState('');
  const [tThumbUrl, setTThumbUrl] = useState(BUILTIN_THUMBNAILS[0].url);
  const [tNotes, setTNotes] = useState('');
  const [tSubmitting, setTSubmitting] = useState(false);
  const [tError, setTError] = useState<string | null>(null);
  const [tSuccess, setTSuccess] = useState<string | null>(null);

  const loadProtectedLectures = useCallback(async () => {
    setLoading(true);
    const res = await fetchProtectedLecturesFromBackend();
    setAccessState(res);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    void loadProtectedLectures();
  }, [authUser?.uid, authUser?.hasActivePaidMembership, authUser?.isAdmin, authLoading, loadProtectedLectures]);

  useEffect(() => {
    if (!authUser || (!authUser.isVerifiedTeacher && !authUser.isAdmin)) {
      setTeacherSubmissions([]);
      return;
    }
    const unsub = subscribeTeacherOwnLectures(authUser.uid, setTeacherSubmissions);
    return () => unsub();
  }, [authUser]);

  const lectures = accessState?.lectures ?? [];

  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    for (const l of lectures) {
      if (l.subject) set.add(l.subject);
    }
    return ['All', ...Array.from(set).sort()];
  }, [lectures]);

  const filteredLectures = useMemo(() => {
    let base = lectures;
    if (shelf === 'recent') {
      const order = new Map(recentLectureIds.map((id, i) => [id, i]));
      base = base
        .filter((l) => order.has(l.id))
        .sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99));
    } else if (shelf === 'favourites') {
      base = base.filter((l) => favouriteLectureIds.includes(l.id));
    } else if (shelf === 'completed') {
      base = base.filter((l) => watchedLectureIds.includes(l.id));
    } else if (shelf === 'featured') {
      base = base.filter((l) => l.featured);
    }

    return filterLectures(base, {
      search: searchQuery,
      category: selectedCategory,
      sourceType: selectedSource,
      subject: selectedSubject,
    });
  }, [
    lectures,
    shelf,
    recentLectureIds,
    favouriteLectureIds,
    watchedLectureIds,
    searchQuery,
    selectedCategory,
    selectedSource,
    selectedSubject,
  ]);

  const openLecture = (lec: LectureItem) => {
    setActiveLecture(lec);
    onRecordRecent(lec.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) return;
    setTError(null);
    setTSuccess(null);

    const check = validateLectureSubmission({
      title: tTitle,
      description: tDescription,
      sourceType: 'teacher',
      category: tCategory,
      className: tClassName,
      subject: tSubject,
      chapterNumber: tChapterNum,
      chapterName: tChapterName,
      teacherName: authUser.displayName,
      videoUrl: tVideoUrl,
    });
    if (!check.valid) {
      setTError(check.error || 'Please check all lecture fields.');
      return;
    }

    setTSubmitting(true);
    try {
      await submitTeacherLectureToDb(authUser.uid, {
        title: tTitle,
        description: tDescription,
        category: tCategory,
        className: tClassName,
        subject: tSubject,
        chapterNumber: tChapterNum,
        chapterName: tChapterName,
        teacherName: authUser.displayName,
        duration: tDuration,
        videoUrl: tVideoUrl,
        thumbnailUrl: tThumbUrl,
        notesSummary: tNotes,
      });
      setTSuccess(
        'Lecture admin approval queue mein submit ho gaya hai! Approve hone ke baad members ko live dikhega.'
      );
      setTTitle('');
      setTDescription('');
      setTChapterName('');
      setTVideoUrl('');
      setTNotes('');
    } catch (err) {
      setTError(
        err instanceof Error
          ? err.message
          : 'Submission save nahi ho paya. Verified teacher status check karein.'
      );
    } finally {
      setTSubmitting(false);
    }
  };

  const recommended = useMemo(
    () => (activeLecture ? getRecommendedLectures(activeLecture, lectures, 3) : []),
    [activeLecture, lectures]
  );

  // Player View for an authorized member watching a selected lecture
  if (activeLecture && accessState?.authorized) {
    const ytParsed =
      activeLecture.sourceType === 'youtube'
        ? parseYouTubeLectureUrl(activeLecture.videoUrl)
        : null;
    const isWatched = watchedLectureIds.includes(activeLecture.id);
    const isFav = favouriteLectureIds.includes(activeLecture.id);

    return (
      <section className="py-8 sm:py-10 bg-[#F8FAFC] min-h-[75vh]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <button
            type="button"
            onClick={() => setActiveLecture(null)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#0B1221] hover:text-[#6D28D9] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Back to VIDYORA Lectures</span>
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-5">
              {/* Responsive Official YouTube Embed or Secure HTML5 Video Player */}
              <div className="rounded-3xl overflow-hidden bg-[#0B1221] shadow-xl border border-slate-800 aspect-video relative">
                {ytParsed?.valid && ytParsed.embedUrl ? (
                  <iframe
                    src={ytParsed.embedUrl}
                    title={activeLecture.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                ) : (
                  <video
                    src={activeLecture.videoUrl}
                    poster={activeLecture.thumbnailUrl}
                    controls
                    controlsList="nodownload"
                    playsInline
                    className="w-full h-full object-contain bg-black"
                  >
                    Your browser does not support HTML5 video playback.
                  </video>
                )}
              </div>

              {/* Lecture Info & Controls */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-[#EDE9FE] text-[#6D28D9] text-xs font-bold">
                    {LECTURE_SOURCE_LABELS[activeLecture.sourceType]}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-[#EFF6FF] text-[#2563EB] text-xs font-semibold">
                    {activeLecture.category}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {activeLecture.className} • {activeLecture.subject} • Ch.{' '}
                    {activeLecture.chapterNumber}: {activeLecture.chapterName}
                  </span>
                </div>

                <h1 className="font-display text-2xl font-extrabold text-[#0B1221]">
                  {activeLecture.title}
                </h1>

                <p className="text-xs sm:text-sm text-slate-600">
                  Educator:{' '}
                  <strong className="text-[#0B1221]">{activeLecture.teacherName}</strong>
                  {activeLecture.channelName ? ` • Channel: ${activeLecture.channelName}` : ''} •{' '}
                  Duration: {activeLecture.duration}
                </p>

                <p className="text-sm text-slate-700 leading-relaxed">
                  {activeLecture.description}
                </p>

                <div className="flex flex-wrap gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => onToggleWatched(activeLecture.id)}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                      isWatched
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-[#0B1221] text-white hover:bg-[#1E2E4D]'
                    }`}
                  >
                    <BookCheck className="w-4 h-4" aria-hidden="true" />
                    <span>{isWatched ? 'Completed ✓' : 'Mark as Completed'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleFavourite(activeLecture.id)}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl text-xs sm:text-sm font-bold border transition-colors cursor-pointer ${
                      isFav
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`}
                      aria-hidden="true"
                    />
                    <span>{isFav ? 'Saved in Favourites' : 'Save to Favourites'}</span>
                  </button>
                </div>

                {/* Related Study Notes */}
                {(activeLecture.notesSummary || activeLecture.notesPdfUrl) && (
                  <div className="mt-4 p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200 space-y-2.5">
                    <h2 className="font-display text-sm font-bold text-[#0B1221] flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-[#6D28D9]" aria-hidden="true" />
                      <span>Related Lecture Notes &amp; Formula Summary</span>
                    </h2>
                    {activeLecture.notesSummary && (
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                        {activeLecture.notesSummary}
                      </p>
                    )}
                    {activeLecture.notesPdfUrl && (
                      <a
                        href={activeLecture.notesPdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563EB] hover:underline"
                      >
                        <span>Open Attached PDF Resource</span>
                        <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Recommended Lectures Sidebar */}
            <aside className="lg:col-span-4 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3.5">
                <h2 className="font-display text-base font-bold text-[#0B1221]">
                  Recommended Next Lectures
                </h2>
                {recommended.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    Aur lectures explore karne ke liye library par wapas jayein.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recommended.map((rec) => (
                      <button
                        key={rec.id}
                        type="button"
                        onClick={() => openLecture(rec)}
                        className="w-full flex gap-3 p-2.5 rounded-xl bg-slate-50 hover:bg-[#EFF6FF] border border-slate-200/80 text-left transition-colors cursor-pointer"
                      >
                        <img
                          src={rec.thumbnailUrl}
                          alt={rec.title}
                          className="w-24 h-16 rounded-lg object-cover shrink-0 bg-slate-200"
                        />
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-[#6D28D9] truncate">
                            {rec.category} • {rec.subject}
                          </p>
                          <p className="text-xs font-bold text-[#0B1221] line-clamp-2 mt-0.5">
                            {rec.title}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {rec.duration}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-10 sm:py-12 bg-[#F8FAFC] min-h-[75vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Header */}
        <div className="rounded-3xl bg-gradient-to-br from-[#0B1221] via-[#131E35] to-[#2E1065] text-white p-6 sm:p-8 shadow-xl border border-white/10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-2 max-w-2xl">
              <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-200 bg-white/10 px-3 py-1 rounded-full border border-white/15">
                <Video className="w-3.5 h-3.5" aria-hidden="true" />
                <span>VIDYORA Members-Only Lectures Library</span>
              </p>
              <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
                Structured Video Lectures — YouTube, VIDYORA Originals &amp; Verified Teachers.
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                Classes 1–12, JEE, NEET, UPSC, College Education, Skills &amp; Languages — backend-verified membership protection ke saath organised chapter-wise lectures.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setSectionMode('library')}
                className={`px-4 py-2.5 min-h-[44px] rounded-xl text-xs sm:text-sm font-bold cursor-pointer ${
                  sectionMode === 'library'
                    ? 'bg-white text-[#0B1221]'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                Lectures Library
              </button>
              <button
                type="button"
                onClick={() => setSectionMode('teacher-portal')}
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-xl text-xs sm:text-sm font-bold cursor-pointer ${
                  sectionMode === 'teacher-portal'
                    ? 'bg-[#6D28D9] text-white'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <GraduationCap className="w-4 h-4" aria-hidden="true" />
                <span>Teacher Submission Portal</span>
              </button>
              {authUser?.isAdmin && (
                <button
                  type="button"
                  onClick={onOpenAdminCMS}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-xl bg-amber-400 text-[#0B1221] text-xs sm:text-sm font-bold cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                  <span>Manage &amp; Approve</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Teacher Submission Portal Mode */}
        {sectionMode === 'teacher-portal' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div>
                <h2 className="font-display text-2xl font-bold text-[#0B1221]">
                  Teacher Lecture Submission Portal
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Verified educators yahan apna video lecture submit kar sakte hain. Har teacher submission publish hone se pehle Administrator review &amp; approval se guzarta hai.
                </p>
              </div>
              {authUser?.isVerifiedTeacher && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold shrink-0 w-fit">
                  <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  <span>Verified Educator</span>
                </span>
              )}
            </div>

            {!authUser ? (
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
                <Lock className="w-7 h-7 text-[#6D28D9] mx-auto" aria-hidden="true" />
                <p className="text-sm font-bold text-[#0B1221]">
                  Teacher Portal access karne ke liye Google account se sign in karein.
                </p>
                <button
                  type="button"
                  onClick={onOpenSignIn}
                  className="px-5 py-2.5 min-h-[44px] rounded-xl bg-[#0B1221] text-white text-sm font-semibold cursor-pointer"
                >
                  Sign In to Continue
                </button>
              </div>
            ) : !authUser.isVerifiedTeacher && !authUser.isAdmin ? (
              <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 space-y-2 text-sm text-amber-950">
                <p className="font-bold flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-700" aria-hidden="true" />
                  <span>Teacher Verification Required</span>
                </p>
                <p className="text-xs sm:text-sm leading-relaxed">
                  Aapka account abhi <strong>Student</strong> role par hai. Sirf admin-verified teachers hi lecture submit kar sakte hain. Administrator verification ke liye apna User ID share karein:{' '}
                  <code className="px-2 py-0.5 rounded bg-white border border-amber-300 font-mono text-xs">
                    {authUser.uid}
                  </code>
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <form onSubmit={handleTeacherSubmit} className="lg:col-span-7 space-y-4">
                  <h3 className="font-display text-base font-bold text-[#0B1221]">
                    Submit New Lecture for Admin Approval
                  </h3>

                  {tError && (
                    <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>{tError}</span>
                    </div>
                  )}
                  {tSuccess && (
                    <div role="status" className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>{tSuccess}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Lecture Title *
                    </label>
                    <input
                      type="text"
                      value={tTitle}
                      onChange={(e) => setTTitle(e.target.value)}
                      placeholder="e.g. Light Reflection & Spherical Mirrors Explained"
                      className="w-full px-3.5 py-2.5 min-h-[44px] text-sm border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Category *
                      </label>
                      <select
                        value={tCategory}
                        onChange={(e) => setTCategory(e.target.value as LectureCategory)}
                        className="w-full px-3 py-2.5 min-h-[44px] text-sm border border-slate-300 rounded-xl bg-white"
                      >
                        {LECTURE_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Class / Level *
                      </label>
                      <input
                        type="text"
                        value={tClassName}
                        onChange={(e) => setTClassName(e.target.value)}
                        placeholder="Class 10 / JEE / B.Tech"
                        className="w-full px-3 py-2.5 min-h-[44px] text-sm border border-slate-300 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Subject *
                      </label>
                      <input
                        type="text"
                        value={tSubject}
                        onChange={(e) => setTSubject(e.target.value)}
                        className="w-full px-3 py-2.5 min-h-[44px] text-sm border border-slate-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Chapter #
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={60}
                        value={tChapterNum}
                        onChange={(e) => setTChapterNum(Number(e.target.value))}
                        className="w-full px-3 py-2.5 min-h-[44px] text-sm border border-slate-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Chapter Name *
                      </label>
                      <input
                        type="text"
                        value={tChapterName}
                        onChange={(e) => setTChapterName(e.target.value)}
                        placeholder="Light Reflection"
                        className="w-full px-3 py-2.5 min-h-[44px] text-sm border border-slate-300 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Authorised Video HTTPS URL *
                      </label>
                      <input
                        type="url"
                        value={tVideoUrl}
                        onChange={(e) => setTVideoUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3 py-2.5 min-h-[44px] text-sm border border-slate-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Duration
                      </label>
                      <input
                        type="text"
                        value={tDuration}
                        onChange={(e) => setTDuration(e.target.value)}
                        placeholder="12:30"
                        className="w-full px-3 py-2.5 min-h-[44px] text-sm border border-slate-300 rounded-xl"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Thumbnail Image URL
                    </label>
                    <select
                      value={tThumbUrl}
                      onChange={(e) => setTThumbUrl(e.target.value)}
                      className="w-full px-3 py-2.5 min-h-[44px] text-sm border border-slate-300 rounded-xl bg-white"
                    >
                      {BUILTIN_THUMBNAILS.map((th) => (
                        <option key={th.url} value={th.url}>
                          {th.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Description *
                    </label>
                    <textarea
                      rows={3}
                      value={tDescription}
                      onChange={(e) => setTDescription(e.target.value)}
                      placeholder="Explain what students will learn in this lecture..."
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Optional Revision Notes Summary
                    </label>
                    <textarea
                      rows={2}
                      value={tNotes}
                      onChange={(e) => setTNotes(e.target.value)}
                      placeholder="Key formulas or takeaways..."
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={tSubmitting}
                    className="inline-flex items-center gap-2 px-5 py-3 min-h-[46px] rounded-xl bg-[#6D28D9] hover:bg-[#7C3AED] disabled:bg-slate-400 text-white text-sm font-bold cursor-pointer"
                  >
                    {tSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Upload className="w-4 h-4" aria-hidden="true" />
                    )}
                    <span>Submit for Admin Approval</span>
                  </button>
                </form>

                {/* Teacher's Own Submissions Status List */}
                <div className="lg:col-span-5 space-y-3">
                  <h3 className="font-display text-base font-bold text-[#0B1221]">
                    My Submissions ({teacherSubmissions.length})
                  </h3>
                  {teacherSubmissions.length === 0 ? (
                    <p className="text-xs text-slate-500 p-4 rounded-xl bg-slate-50 border border-slate-200">
                      Abhi tak koi teacher submission nahi hai. Upar form se apna pehla lecture submit karein.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {teacherSubmissions.map((sub) => (
                        <div
                          key={sub.id}
                          className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-bold text-[#0B1221] truncate">
                              {sub.title}
                            </p>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[11px] font-bold uppercase shrink-0 ${
                                sub.approvalStatus === 'approved'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : sub.approvalStatus === 'rejected'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {sub.approvalStatus}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            {sub.category} • {sub.subject} • Ch. {sub.chapterNumber}
                          </p>
                          {sub.rejectionReason && (
                            <p className="text-xs text-red-600">
                              Note: {sub.rejectionReason}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Members-Only Library Mode */}
        {sectionMode === 'library' && (
          <>
            {loading || authLoading ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-[#6D28D9] mx-auto" aria-hidden="true" />
                <p className="text-sm font-semibold text-slate-600">
                  Backend par membership status verify ho raha hai...
                </p>
              </div>
            ) : !accessState?.authorized ? (
              /* Backend-Enforced Members-Only Upgrade Gate */
              <div
                data-testid="lectures-membership-gate"
                className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden"
              >
                <div className="p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-7 space-y-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EDE9FE] text-[#6D28D9] text-xs font-bold">
                      <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Members-Only Protected Library</span>
                    </span>
                    <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0B1221]">
                      VIDYORA Lectures Unlock Karne Ke Liye Active Membership Zaroori Hai.
                    </h2>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {accessState?.message ||
                        'Yeh section sirf authenticated Student Plan (₹49/month) ya Pro Learner Plan (₹99/month) members ke liye backend-verified access ke saath reserved hai.'}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200">
                        <Youtube className="w-5 h-5 text-red-600 mb-1.5" aria-hidden="true" />
                        <p className="text-xs font-bold text-[#0B1221]">Curated YouTube</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Official YouTube player mein chapter-wise organised lectures
                        </p>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200">
                        <Sparkles className="w-5 h-5 text-[#6D28D9] mb-1.5" aria-hidden="true" />
                        <p className="text-xs font-bold text-[#0B1221]">VIDYORA Originals</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Visual concept breakdowns aur exam-ready notes
                        </p>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200">
                        <GraduationCap className="w-5 h-5 text-[#2563EB] mb-1.5" aria-hidden="true" />
                        <p className="text-xs font-bold text-[#0B1221]">Verified Teachers</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Admin-reviewed educator lectures across 11 categories
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={onOpenPlans}
                        className="inline-flex items-center gap-2 px-5 py-3 min-h-[48px] rounded-xl bg-[#6D28D9] hover:bg-[#7C3AED] text-white text-sm font-bold cursor-pointer"
                      >
                        <Crown className="w-4 h-4" aria-hidden="true" />
                        <span>View Membership Plans (₹49 / ₹99)</span>
                      </button>

                      {!authUser && (
                        <button
                          type="button"
                          onClick={onOpenSignIn}
                          className="inline-flex items-center gap-2 px-5 py-3 min-h-[48px] rounded-xl bg-[#0B1221] hover:bg-[#1E2E4D] text-white text-sm font-bold cursor-pointer"
                        >
                          <span>Sign In with Google</span>
                        </button>
                      )}

                      {accessState?.reason === 'ERROR' && (
                        <button
                          type="button"
                          onClick={() => void loadProtectedLectures()}
                          className="inline-flex items-center gap-1.5 px-4 py-3 min-h-[48px] rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold cursor-pointer"
                        >
                          <RefreshCw className="w-4 h-4" aria-hidden="true" />
                          <span>Retry Check</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Category Preview Card */}
                  <div className="lg:col-span-5 rounded-2xl bg-[#0B1221] text-white p-6 space-y-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-purple-300">
                      11 Protected Learning Categories
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {LECTURE_CATEGORIES.map((cat) => (
                        <span
                          key={cat}
                          className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/10 text-xs text-blue-100 font-medium"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed pt-2 border-t border-white/10">
                      Security verified: Protected video URLs backend par authenticated active members ke liye hi serve kiye jaate hain (HTTP 401/403 enforcement active).
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Authorized Members Lecture Library */
              <div className="space-y-6">
                {/* Search, Source & Subject Filters */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4 shadow-xs">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-5 relative">
                      <Search
                        className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                        aria-hidden="true"
                      />
                      <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search lectures, chapters, teachers..."
                        aria-label="Search members lectures"
                        className="w-full pl-10 pr-3.5 py-2.5 min-h-[44px] text-sm border border-slate-300 rounded-xl"
                      />
                    </div>

                    <div className="md:col-span-4">
                      <select
                        value={selectedSource}
                        onChange={(e) =>
                          setSelectedSource(e.target.value as LectureSourceType | 'all')
                        }
                        aria-label="Filter by lecture source"
                        className="w-full px-3 py-2.5 min-h-[44px] text-sm border border-slate-300 rounded-xl bg-white"
                      >
                        <option value="all">All 3 Sources (YouTube, Original, Teacher)</option>
                        <option value="youtube">YouTube Lectures</option>
                        <option value="original">VIDYORA Original Lectures</option>
                        <option value="teacher">Verified Teacher Lectures</option>
                      </select>
                    </div>

                    <div className="md:col-span-3">
                      <select
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        aria-label="Filter by subject"
                        className="w-full px-3 py-2.5 min-h-[44px] text-sm border border-slate-300 rounded-xl bg-white"
                      >
                        {availableSubjects.map((sub) => (
                          <option key={sub} value={sub}>
                            {sub === 'All' ? 'All Subjects' : sub}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* All 11 Category Filter Chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('All')}
                      className={`px-3 py-1.5 min-h-[36px] rounded-xl text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer ${
                        selectedCategory === 'All'
                          ? 'bg-[#0B1221] text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      All Categories
                    </button>
                    {LECTURE_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 min-h-[36px] rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                          selectedCategory === cat
                            ? 'bg-[#6D28D9] text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Personal Shelf Tabs */}
                  <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
                    {(
                      [
                        ['all', 'All Lectures'],
                        ['featured', 'Featured / Recommended'],
                        ['recent', 'Continue Watching'],
                        ['favourites', 'Saved Favourites'],
                        ['completed', 'Completed'],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setShelf(id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                          shelf === id
                            ? 'bg-[#EFF6FF] text-[#2563EB] border border-blue-200'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lecture Cards Grid */}
                {filteredLectures.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-2">
                    <BookOpen className="w-7 h-7 text-slate-400 mx-auto" aria-hidden="true" />
                    <p className="text-sm font-bold text-[#0B1221]">
                      Is filter ke saath koi lecture nahi mila.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('All');
                        setSelectedSource('all');
                        setSelectedSubject('All');
                        setShelf('all');
                      }}
                      className="text-xs font-bold text-[#6D28D9] hover:underline cursor-pointer"
                    >
                      Reset All Filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredLectures.map((lec) => {
                      const isWatched = watchedLectureIds.includes(lec.id);
                      const isFav = favouriteLectureIds.includes(lec.id);
                      return (
                        <article
                          key={lec.id}
                          className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="relative aspect-video bg-[#0B1221] overflow-hidden">
                              <img
                                src={lec.thumbnailUrl}
                                alt={lec.title}
                                loading="lazy"
                                className="w-full h-full object-cover"
                              />
                              <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-[#0B1221]/85 text-white text-[11px] font-bold">
                                {LECTURE_SOURCE_LABELS[lec.sourceType]}
                              </span>
                              <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/80 text-white text-[11px] font-semibold inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" aria-hidden="true" />
                                {lec.duration}
                              </span>
                            </div>

                            <div className="p-4 space-y-2">
                              <p className="text-[11px] font-bold text-[#6D28D9]">
                                {lec.category} • {lec.subject} • Ch. {lec.chapterNumber}
                              </p>
                              <h3 className="font-display text-base font-bold text-[#0B1221] line-clamp-2">
                                {lec.title}
                              </h3>
                              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                                {lec.description}
                              </p>
                              <p className="text-[11px] text-slate-500 font-medium">
                                By {lec.teacherName}
                                {lec.channelName ? ` (${lec.channelName})` : ''}
                              </p>
                            </div>
                          </div>

                          <div className="px-4 pb-4 pt-2 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openLecture(lec)}
                              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 min-h-[42px] rounded-xl bg-[#0B1221] hover:bg-[#1E2E4D] text-white text-xs font-bold cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>{isWatched ? 'Rewatch' : 'Watch Lecture'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onToggleFavourite(lec.id)}
                              aria-label={isFav ? 'Remove favourite' : 'Save favourite'}
                              className={`w-10 h-10 rounded-xl border flex items-center justify-center cursor-pointer ${
                                isFav
                                  ? 'bg-rose-50 border-rose-200 text-rose-600'
                                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                              }`}
                            >
                              <Heart
                                className={`w-4 h-4 ${isFav ? 'fill-rose-500' : ''}`}
                                aria-hidden="true"
                              />
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
