import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Edit3,
  Eye,
  EyeOff,
  ImagePlus,
  Loader2,
  Lock,
  Plus,
  ShieldCheck,
  Trash2,
  Video,
} from 'lucide-react';
import {
  getChaptersForClassAndSubject,
  getClassesForCategory,
  getSubjectsForClass,
} from '../data/curriculumCatalog';
import { BUILTIN_THUMBNAILS } from '../data/educationalContent';
import {
  createVideoLessonInDb,
  deleteVideoLessonInDb,
  subscribeAdminVideoLessons,
  togglePublishVideoLessonInDb,
  updateVideoLessonInDb,
} from '../services/videoRepository';
import type {
  DifficultyLevel,
  FirebaseAuthUser,
  LearningCategory,
  QuizQuestion,
  VideoLesson,
} from '../types/vidyora';
import { parseEmbeddableVideo, validateAdminVideoInput } from '../utils/videoLogic';

interface AdminVideoManagerProps {
  authUser: FirebaseAuthUser | null;
  authLoading: boolean;
  onGoogleSignIn: () => Promise<void>;
  onPreviewLesson: (lesson: VideoLesson) => void;
}

const DEFAULT_THUMBNAIL = BUILTIN_THUMBNAILS[0].url;

export function AdminVideoManager({
  authUser,
  authLoading,
  onGoogleSignIn,
  onPreviewLesson,
}: AdminVideoManagerProps) {
  const [dbLessons, setDbLessons] = useState<VideoLesson[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  // Editor form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Exclude<LearningCategory, 'all'>>('school');
  const [className, setClassName] = useState('Class 10');
  const [subject, setSubject] = useState('Mathematics');
  const [chapterNumber, setChapterNumber] = useState(1);
  const [chapterName, setChapterName] = useState('Real Numbers');
  const [duration, setDuration] = useState('12:00');
  const [difficulty, setDifficulty] = useState<Exclude<DifficultyLevel, 'All'>>('Intermediate');
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState(DEFAULT_THUMBNAIL);
  const [notesContent, setNotesContent] = useState('');
  const [published, setPublished] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  // Optional 1-question quick practice MCQ builder
  const [mcqQuestion, setMcqQuestion] = useState('');
  const [mcqOptions, setMcqOptions] = useState(['', '', '', '']);
  const [mcqCorrectIndex, setMcqCorrectIndex] = useState(0);
  const [mcqExplanation, setMcqExplanation] = useState('');
  const [practiceQuestions, setPracticeQuestions] = useState<QuizQuestion[]>([]);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'published' | 'draft'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const isAdmin = Boolean(authUser?.isAdmin);

  useEffect(() => {
    if (!isAdmin) {
      setDbLessons([]);
      return;
    }
    setListLoading(true);
    setListError(null);
    const unsub = subscribeAdminVideoLessons(
      (lessons) => {
        setDbLessons(lessons);
        setListLoading(false);
      },
      (err) => {
        setListError(err.message || 'Firestore se video lessons load nahi ho paye.');
        setListLoading(false);
      }
    );
    return () => unsub();
  }, [isAdmin]);

  const classOptions = useMemo(() => getClassesForCategory(category), [category]);
  const subjectOptions = useMemo(() => getSubjectsForClass(className), [className]);
  const predefinedChapters = useMemo(
    () => getChaptersForClassAndSubject(className, subject),
    [className, subject]
  );

  const parsedPreview = useMemo(
    () => (videoUrl.trim() ? parseEmbeddableVideo(videoUrl) : null),
    [videoUrl]
  );

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setCategory('school');
    setClassName('Class 10');
    setSubject('Mathematics');
    setChapterNumber(1);
    setChapterName('Real Numbers');
    setDuration('12:00');
    setDifficulty('Intermediate');
    setVideoUrl('');
    setThumbnailUrl(DEFAULT_THUMBNAIL);
    setNotesContent('');
    setPublished(true);
    setIsDemo(false);
    setPracticeQuestions([]);
    setFormError(null);
  };

  const handleCategoryChange = (nextCat: Exclude<LearningCategory, 'all'>) => {
    setCategory(nextCat);
    const nextClasses = getClassesForCategory(nextCat);
    const firstClass = nextClasses[0]?.name || 'Class 10';
    setClassName(firstClass);
    const nextSubjs = getSubjectsForClass(firstClass);
    const firstSubj = nextSubjs[0]?.name || 'Mathematics';
    setSubject(firstSubj);
    const chs = getChaptersForClassAndSubject(firstClass, firstSubj);
    if (chs[0]) {
      setChapterNumber(chs[0].chapterNumber);
      setChapterName(chs[0].chapterName);
    }
  };

  const handleClassChange = (nextClass: string) => {
    setClassName(nextClass);
    const nextSubjs = getSubjectsForClass(nextClass);
    const firstSubj = nextSubjs[0]?.name || 'Mathematics';
    setSubject(firstSubj);
    const chs = getChaptersForClassAndSubject(nextClass, firstSubj);
    if (chs[0]) {
      setChapterNumber(chs[0].chapterNumber);
      setChapterName(chs[0].chapterName);
    }
  };

  const handleSubjectChange = (nextSubject: string) => {
    setSubject(nextSubject);
    const chs = getChaptersForClassAndSubject(className, nextSubject);
    if (chs[0]) {
      setChapterNumber(chs[0].chapterNumber);
      setChapterName(chs[0].chapterName);
    }
  };

  // Compresses uploaded thumbnail image to crisp 640x360 JPEG so it fits safely within Firestore limits
  const handleThumbnailUpload = (file: File) => {
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setFormError('Thumbnail ke liye PNG, JPG ya WebP image upload karein.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const targetW = 640;
        const targetH = 360;
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const scale = Math.max(targetW / img.width, targetH / img.height);
        const drawW = img.width * scale;
        const drawH = img.height * scale;
        ctx.drawImage(
          img,
          (targetW - drawW) / 2,
          (targetH - drawH) / 2,
          drawW,
          drawH
        );
        const compressed = canvas.toDataURL('image/jpeg', 0.78);
        if (compressed.length > 340000) {
          setFormError('Compressed thumbnail abhi bhi bada hai — chhoti image choose karein.');
          return;
        }
        setThumbnailUrl(compressed);
        setFormError(null);
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  };

  const handleAddPracticeQuestion = () => {
    if (!mcqQuestion.trim() || mcqOptions.some((o) => !o.trim())) {
      setFormError('Practice question aur chaaron options fill karein.');
      return;
    }
    if (practiceQuestions.length >= 10) {
      setFormError('Ek lesson mein maximum 10 practice questions add kiye ja sakte hain.');
      return;
    }
    const next: QuizQuestion = {
      id: `q-${Date.now()}`,
      question: mcqQuestion.trim(),
      options: mcqOptions.map((o) => o.trim()),
      correctIndex: mcqCorrectIndex,
      explanation: mcqExplanation.trim() || 'Sahi answer option verify karein.',
    };
    setPracticeQuestions((prev) => [...prev, next]);
    setMcqQuestion('');
    setMcqOptions(['', '', '', '']);
    setMcqCorrectIndex(0);
    setMcqExplanation('');
    setFormError(null);
  };

  const handleEditLesson = (lesson: VideoLesson) => {
    setEditingId(lesson.id);
    setTitle(lesson.title);
    setDescription(lesson.summary);
    setCategory(lesson.category);
    setClassName(lesson.className);
    setSubject(lesson.subject);
    setChapterNumber(lesson.chapterNumber);
    setChapterName(lesson.chapterName);
    setDuration(lesson.duration);
    setDifficulty(lesson.difficulty);
    setVideoUrl(lesson.videoUrl || '');
    setThumbnailUrl(lesson.thumbnail || DEFAULT_THUMBNAIL);
    setNotesContent(lesson.notesContent || '');
    setPublished(lesson.published);
    setIsDemo(lesson.isDemo);
    setPracticeQuestions(lesson.practiceQuestions || []);
    setFormError(null);
    setFormSuccess(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser || !isAdmin) return;

    const payload = {
      title,
      description,
      category,
      className,
      subject,
      chapterNumber: Number(chapterNumber),
      chapterName,
      duration,
      difficulty,
      videoUrl,
      thumbnailUrl,
      notesContent,
      practiceQuestions,
      published,
      isDemo,
    };

    const err = validateAdminVideoInput(payload);
    if (err) {
      setFormError(err);
      return;
    }

    setSaving(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      if (editingId) {
        await updateVideoLessonInDb(editingId, payload);
        setFormSuccess('Video lesson successfully update ho gaya!');
      } else {
        await createVideoLessonInDb(payload, authUser.uid);
        setFormSuccess(
          published
            ? 'Naya video lesson database mein save aur publish ho gaya!'
            : 'Video lesson Draft ke roop mein save ho gaya!'
        );
      }
      resetForm();
    } catch (submitErr) {
      setFormError(
        submitErr instanceof Error
          ? submitErr.message
          : 'Lesson save karne mein error aaya.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (lesson: VideoLesson) => {
    setBusyId(lesson.id);
    try {
      await togglePublishVideoLessonInDb(lesson.id, !lesson.published);
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Status update fail hua.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (lessonId: string) => {
    setBusyId(lessonId);
    try {
      await deleteVideoLessonInDb(lessonId);
      setDeletingId(null);
      if (editingId === lessonId) resetForm();
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Lesson delete fail hua.');
    } finally {
      setBusyId(null);
    }
  };

  const filteredDbLessons = dbLessons.filter((l) => {
    if (filterMode === 'published') return l.published;
    if (filterMode === 'draft') return !l.published;
    return true;
  });

  // SECURE ADMIN ACCESS GATE
  if (authLoading) {
    return (
      <section className="min-h-[70vh] flex items-center justify-center bg-[#F8FAFC] p-6">
        <div className="text-center space-y-3">
          <Loader2 className="w-7 h-7 animate-spin text-[#6D28D9] mx-auto" />
          <p className="text-sm text-slate-600">Verifying administrator permissions...</p>
        </div>
      </section>
    );
  }

  if (!authUser || !isAdmin) {
    return (
      <section className="min-h-[75vh] bg-[#F8FAFC] py-14 px-4 sm:px-6">
        <div className="max-w-lg mx-auto bg-white rounded-2xl border border-slate-200 p-7 sm:p-9 text-center shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-[#0B1221] text-purple-300 mx-auto flex items-center justify-center">
            <Lock className="w-6 h-6" aria-hidden="true" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold text-[#0B1221]">
            Secure Administrator Access Required
          </h1>
          <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">
            VIDYORA Video Management Studio sirf authorized administrators ke liye protected hai. Database writes Firestore Security Rules ke through strictly verified admin accounts ko hi allowed hain.
          </p>

          {authUser && !isAdmin && (
            <div
              role="alert"
              className="mt-5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 text-left"
            >
              Signed in as <strong>{authUser.email}</strong> — is account ke paas administrator privileges nahi hain. Authorized admin Google account se sign in karein.
            </div>
          )}

          <button
            type="button"
            onClick={() => void onGoogleSignIn()}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[46px] text-sm font-semibold text-white bg-[#6D28D9] hover:bg-[#7C3AED] rounded-xl transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" aria-hidden="true" />
            <span>Sign In with Google (Admin)</span>
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-[#F8FAFC] min-h-[82vh] pb-16">
      <div className="bg-[#0B1221] text-white border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-purple-300 inline-flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                <span>Verified Administrator · {authUser.email}</span>
              </p>
              <h1 className="mt-1.5 font-display text-2xl sm:text-3xl font-extrabold text-white">
                VIDYORA Video Management Studio
              </h1>
              <p className="mt-1 text-sm text-slate-300">
                Database-backed video lessons add, edit, publish aur unpublish karein — changes instantly students ko reflect honge.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
              <div className="px-3.5 py-2 rounded-xl bg-white/10 border border-white/10">
                Published: {dbLessons.filter((l) => l.published).length}
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-white/10 border border-white/10">
                Drafts: {dbLessons.filter((l) => !l.published).length}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Add / Edit Video Lesson Form (7 cols) */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 space-y-5"
        >
          <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <h2 className="font-display text-xl font-bold text-[#0B1221]">
              {editingId ? 'Edit Video Lesson' : 'Add New Video Lesson'}
            </h2>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs font-semibold text-slate-600 hover:text-[#0B1221] cursor-pointer"
              >
                Cancel Edit
              </button>
            )}
          </div>

          {formError && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-800 flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-900 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{formSuccess}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="admin-video-title" className="block text-xs font-semibold text-slate-700">
                Video Title *
              </label>
              <input
                id="admin-video-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Jaise: Quadratic Equations — Completing the Square Explained"
                className="mt-1.5 w-full px-3.5 py-2.5 min-h-[44px] text-sm border border-slate-300 rounded-xl text-[#0B1221] focus:outline-none focus:border-[#6D28D9]"
              />
            </div>

            <div>
              <label htmlFor="admin-video-desc" className="block text-xs font-semibold text-slate-700">
                Video Description (Hinglish / English) *
              </label>
              <textarea
                id="admin-video-desc"
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Students is lesson mein kya seekhenge, short summary likhein..."
                className="mt-1.5 w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl text-[#0B1221] focus:outline-none focus:border-[#6D28D9]"
              />
            </div>

            {/* Category, Class & Subject */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label htmlFor="admin-category" className="block text-xs font-semibold text-slate-700">
                  Category
                </label>
                <select
                  id="admin-category"
                  value={category}
                  onChange={(e) =>
                    handleCategoryChange(e.target.value as Exclude<LearningCategory, 'all'>)
                  }
                  className="mt-1.5 w-full px-3 py-2.5 min-h-[44px] text-sm bg-white border border-slate-300 rounded-xl text-[#0B1221]"
                >
                  <option value="school">School Classes (1–12)</option>
                  <option value="college">College Learning</option>
                  <option value="competitive">Competitive Exams</option>
                  <option value="gk">General Knowledge</option>
                </select>
              </div>

              <div>
                <label htmlFor="admin-class" className="block text-xs font-semibold text-slate-700">
                  Class / Track
                </label>
                <select
                  id="admin-class"
                  value={className}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className="mt-1.5 w-full px-3 py-2.5 min-h-[44px] text-sm bg-white border border-slate-300 rounded-xl text-[#0B1221]"
                >
                  {classOptions.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="admin-subject" className="block text-xs font-semibold text-slate-700">
                  Subject
                </label>
                <select
                  id="admin-subject"
                  value={subject}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="mt-1.5 w-full px-3 py-2.5 min-h-[44px] text-sm bg-white border border-slate-300 rounded-xl text-[#0B1221]"
                >
                  {subjectOptions.map((s) => (
                    <option key={s.name} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Chapter Selector + Custom Override */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
              {predefinedChapters.length > 0 && (
                <div className="sm:col-span-12">
                  <label htmlFor="admin-chapter-preset" className="block text-xs font-semibold text-slate-700">
                    Quick Pick Existing Chapter (or edit below)
                  </label>
                  <select
                    id="admin-chapter-preset"
                    value={`${chapterNumber}::${chapterName}`}
                    onChange={(e) => {
                      const [numStr, ...rest] = e.target.value.split('::');
                      setChapterNumber(Number(numStr) || 1);
                      setChapterName(rest.join('::'));
                    }}
                    className="mt-1.5 w-full px-3 py-2.5 min-h-[44px] text-sm bg-[#F8FAFC] border border-slate-300 rounded-xl text-[#0B1221]"
                  >
                    {predefinedChapters.map((ch) => (
                      <option
                        key={ch.id}
                        value={`${ch.chapterNumber}::${ch.chapterName}`}
                      >
                        Chapter {ch.chapterNumber}: {ch.chapterName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="sm:col-span-3">
                <label htmlFor="admin-ch-num" className="block text-xs font-semibold text-slate-700">
                  Chapter No.
                </label>
                <input
                  id="admin-ch-num"
                  type="number"
                  min={1}
                  max={50}
                  value={chapterNumber}
                  onChange={(e) => setChapterNumber(Number(e.target.value))}
                  className="mt-1.5 w-full px-3 py-2.5 min-h-[44px] text-sm border border-slate-300 rounded-xl text-[#0B1221] tabular-nums"
                />
              </div>

              <div className="sm:col-span-5">
                <label htmlFor="admin-ch-name" className="block text-xs font-semibold text-slate-700">
                  Chapter Name *
                </label>
                <input
                  id="admin-ch-name"
                  type="text"
                  required
                  value={chapterName}
                  onChange={(e) => setChapterName(e.target.value)}
                  placeholder="Chapter name"
                  className="mt-1.5 w-full px-3 py-2.5 min-h-[44px] text-sm border border-slate-300 rounded-xl text-[#0B1221]"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="admin-duration" className="block text-xs font-semibold text-slate-700">
                  Duration
                </label>
                <input
                  id="admin-duration"
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="12:30"
                  className="mt-1.5 w-full px-3 py-2.5 min-h-[44px] text-sm font-mono border border-slate-300 rounded-xl text-[#0B1221]"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="admin-difficulty" className="block text-xs font-semibold text-slate-700">
                  Difficulty
                </label>
                <select
                  id="admin-difficulty"
                  value={difficulty}
                  onChange={(e) =>
                    setDifficulty(e.target.value as Exclude<DifficultyLevel, 'All'>)
                  }
                  className="mt-1.5 w-full px-2.5 py-2.5 min-h-[44px] text-sm bg-white border border-slate-300 rounded-xl text-[#0B1221]"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>

            {/* Legitimate Video URL + Live Embed Preview */}
            <div>
              <label htmlFor="admin-video-url" className="block text-xs font-semibold text-slate-700">
                Legitimate Video URL (YouTube or Direct HTTPS MP4) *
              </label>
              <input
                id="admin-video-url"
                type="url"
                required
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... ya https://.../lecture.mp4"
                className="mt-1.5 w-full px-3.5 py-2.5 min-h-[44px] text-sm border border-slate-300 rounded-xl text-[#0B1221] focus:outline-none focus:border-[#6D28D9]"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Rights Policy: Sirf apna original educational video ya Creative Commons / permission-verified YouTube link add karein.
              </p>

              {parsedPreview && parsedPreview.type === 'invalid' && (
                <p className="mt-1.5 text-xs text-red-600 font-medium">
                  {parsedPreview.error}
                </p>
              )}

              {parsedPreview && parsedPreview.type !== 'invalid' && (
                <div className="mt-3 rounded-xl overflow-hidden border border-slate-200 bg-black aspect-video max-h-56">
                  {parsedPreview.type === 'youtube' ? (
                    <iframe
                      src={parsedPreview.embedUrl}
                      title="Video URL preview"
                      className="w-full h-full border-0"
                    />
                  ) : (
                    <video
                      src={parsedPreview.embedUrl}
                      controls
                      className="w-full h-full"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Thumbnail URL or Image Upload */}
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-slate-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label htmlFor="admin-thumb-url" className="text-xs font-semibold text-slate-700">
                  Lesson Thumbnail (Upload Image, Paste HTTPS URL, or Pick Cover)
                </label>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0B1221] hover:bg-[#1E2E4D] rounded-lg cursor-pointer">
                  <ImagePlus className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Upload Thumbnail</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleThumbnailUpload(f);
                    }}
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div className="sm:col-span-4">
                  <img
                    src={thumbnailUrl}
                    alt="Thumbnail preview"
                    className="w-full aspect-video object-cover rounded-lg border border-slate-200 bg-slate-900"
                  />
                </div>
                <div className="sm:col-span-8 space-y-2">
                  <input
                    id="admin-thumb-url"
                    type="text"
                    value={thumbnailUrl.startsWith('data:') ? '(Uploaded compressed image)' : thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    placeholder="https://... image URL"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-[#0B1221]"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {BUILTIN_THUMBNAILS.map((item) => (
                      <button
                        key={item.url}
                        type="button"
                        onClick={() => setThumbnailUrl(item.url)}
                        className={`px-2 py-1 text-[11px] rounded-md border cursor-pointer ${
                          thumbnailUrl === item.url
                            ? 'bg-[#EFF6FF] border-[#6D28D9] text-[#6D28D9] font-semibold'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        {item.label.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Downloadable Notes */}
            <div>
              <label htmlFor="admin-notes" className="block text-xs font-semibold text-slate-700">
                Downloadable Lesson Notes (Optional)
              </label>
              <textarea
                id="admin-notes"
                rows={3}
                value={notesContent}
                onChange={(e) => setNotesContent(e.target.value)}
                placeholder="Key definitions, formulas ya exam points likhein — students ise Download Notes button se download kar sakte hain."
                className="mt-1.5 w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl text-[#0B1221]"
              />
            </div>

            {/* Optional Practice Questions Builder */}
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-slate-200 space-y-3">
              <p className="text-xs font-semibold text-[#0B1221]">
                Practice Questions ({practiceQuestions.length}/10)
              </p>
              {practiceQuestions.length > 0 && (
                <ul className="space-y-1.5">
                  {practiceQuestions.map((q, idx) => (
                    <li
                      key={q.id}
                      className="flex items-center justify-between gap-2 text-xs bg-white px-3 py-2 rounded-lg border border-slate-200"
                    >
                      <span className="truncate">
                        Q{idx + 1}. {q.question}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setPracticeQuestions((prev) =>
                            prev.filter((item) => item.id !== q.id)
                          )
                        }
                        className="text-red-600 hover:text-red-700 font-semibold shrink-0 cursor-pointer"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="space-y-2">
                <input
                  type="text"
                  value={mcqQuestion}
                  onChange={(e) => setMcqQuestion(e.target.value)}
                  placeholder="Add MCQ question (optional)..."
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                />
                <div className="grid grid-cols-2 gap-2">
                  {mcqOptions.map((opt, idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={opt}
                      onChange={(e) =>
                        setMcqOptions((prev) =>
                          prev.map((v, i) => (i === idx ? e.target.value : v))
                        )
                      }
                      placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                      className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                    />
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={mcqCorrectIndex}
                    onChange={(e) => setMcqCorrectIndex(Number(e.target.value))}
                    className="px-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                  >
                    <option value={0}>Correct: A</option>
                    <option value={1}>Correct: B</option>
                    <option value={2}>Correct: C</option>
                    <option value={3}>Correct: D</option>
                  </select>
                  <input
                    type="text"
                    value={mcqExplanation}
                    onChange={(e) => setMcqExplanation(e.target.value)}
                    placeholder="Short Hinglish explanation..."
                    className="flex-1 min-w-[160px] px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={handleAddPracticeQuestion}
                    className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-[#6D28D9] bg-white border border-[#6D28D9]/40 hover:bg-[#EFF6FF] rounded-lg cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Add Q</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Publish & Demo Toggles */}
            <div className="flex flex-wrap items-center gap-6 pt-1">
              <label className="inline-flex items-center gap-2 text-sm font-medium text-[#0B1221] cursor-pointer">
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="w-4 h-4 accent-[#6D28D9]"
                />
                <span>Publish immediately (visible to students)</span>
              </label>

              <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDemo}
                  onChange={(e) => setIsDemo(e.target.checked)}
                  className="w-4 h-4 accent-[#6D28D9]"
                />
                <span>Label as Demonstration Sample</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[46px] text-sm font-semibold text-white bg-[#6D28D9] hover:bg-[#7C3AED] disabled:bg-slate-300 rounded-xl transition-colors cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Saving to Firestore...</span>
              </>
            ) : (
              <>
                <Video className="w-4 h-4" aria-hidden="true" />
                <span>{editingId ? 'Update Video Lesson' : 'Save Video Lesson'}</span>
              </>
            )}
          </button>
        </form>

        {/* Right: Database Video Lessons Catalog (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-bold text-[#0B1221]">
              Database Lessons ({dbLessons.length})
            </h2>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
              {(['all', 'published', 'draft'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setFilterMode(m)}
                  className={`px-2.5 py-1 rounded-md capitalize cursor-pointer ${
                    filterMode === m
                      ? 'bg-white text-[#0B1221] font-semibold shadow-sm'
                      : 'text-slate-600'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {listError && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800"
            >
              {listError}
            </div>
          )}

          {listLoading ? (
            <div className="py-10 text-center space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#6D28D9] mx-auto" />
              <p className="text-xs text-slate-500">Loading Firestore lessons...</p>
            </div>
          ) : filteredDbLessons.length === 0 ? (
            <div className="py-10 text-center space-y-2 bg-[#F8FAFC] rounded-xl border border-slate-200 p-5">
              <Video className="w-7 h-7 text-slate-400 mx-auto" aria-hidden="true" />
              <p className="font-display text-sm font-bold text-[#0B1221]">
                Abhi koi custom video lesson saved nahi hai
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                Left form se pehla legitimate YouTube ya HTTPS video lecture add karein — save hote hi wo database mein store aur students ke liye live ho jayega.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDbLessons.map((lesson) => {
                const isBusy = busyId === lesson.id;
                return (
                  <div
                    key={lesson.id}
                    className="p-4 rounded-xl bg-[#F8FAFC] border border-slate-200 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-[#6D28D9] truncate">
                          {lesson.className} · {lesson.subject} · Ch. {lesson.chapterNumber}
                        </p>
                        <h3 className="mt-0.5 font-display text-sm font-bold text-[#0B1221] leading-snug">
                          {lesson.title}
                        </h3>
                      </div>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-md shrink-0 ${
                          lesson.published
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {lesson.published ? 'Published' : 'Draft'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleTogglePublish(lesson)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#0B1221] bg-white border border-slate-200 hover:border-[#6D28D9]/50 rounded-lg cursor-pointer"
                      >
                        {lesson.published ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Unpublish</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Publish</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEditLesson(lesson)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#6D28D9] bg-white border border-slate-200 hover:border-[#6D28D9]/50 rounded-lg cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onPreviewLesson(lesson)}
                        className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg cursor-pointer"
                      >
                        Open
                      </button>

                      {deletingId === lesson.id ? (
                        <div className="inline-flex items-center gap-1.5 ml-auto">
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleDelete(lesson.id)}
                            className="px-2.5 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-lg cursor-pointer"
                          >
                            Confirm Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingId(null)}
                            className="px-2 py-1.5 text-xs text-slate-600 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeletingId(lesson.id)}
                          aria-label={`Delete ${lesson.title}`}
                          className="ml-auto inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
