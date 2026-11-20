import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Crown,
  GraduationCap,
  Loader2,
  Plus,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { BUILTIN_THUMBNAILS } from '../data/educationalContent';
import {
  createAdminLectureInDb,
  deleteAdminLectureFromDb,
  saveMemberAccessToDb,
  saveTeacherRecordToDb,
  subscribeAdminLectures,
  subscribeMemberAccessList,
  subscribeTeachersRegistry,
  updateAdminLectureInDb,
} from '../services/lecturesRepository';
import type {
  FirebaseAuthUser,
  LectureCategory,
  LectureItem,
  LectureSourceType,
  MemberAccessRecord,
  MembershipPlanId,
  TeacherRecord,
} from '../types/vidyora';
import {
  LECTURE_CATEGORIES,
  parseYouTubeLectureUrl,
  validateLectureSubmission,
} from '../utils/lectureLogic';

interface AdminLecturesManagerProps {
  authUser: FirebaseAuthUser;
}

export function AdminLecturesManager({ authUser }: AdminLecturesManagerProps) {
  const [subTab, setSubTab] = useState<'lectures' | 'teachers' | 'members'>('lectures');
  const [lectures, setLectures] = useState<LectureItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [members, setMembers] = useState<MemberAccessRecord[]>([]);

  // New Lecture Form
  const [sourceType, setSourceType] = useState<LectureSourceType>('youtube');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<LectureCategory>('Classes 9-10');
  const [className, setClassName] = useState('Class 10');
  const [subject, setSubject] = useState('Mathematics');
  const [chapterNumber, setChapterNumber] = useState(1);
  const [chapterName, setChapterName] = useState('');
  const [teacherName, setTeacherName] = useState('VIDYORA Faculty');
  const [channelName, setChannelName] = useState('');
  const [duration, setDuration] = useState('12:00');
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState(BUILTIN_THUMBNAILS[0].url);
  const [notesSummary, setNotesSummary] = useState('');
  const [featured, setFeatured] = useState(false);

  // Teacher Form
  const [teacherUid, setTeacherUid] = useState('');
  const [teacherDisplayName, setTeacherDisplayName] = useState('');
  const [teacherSpec, setTeacherSpec] = useState('Physics & Mathematics');

  // Member Access Form
  const [memberUid, setMemberUid] = useState('');
  const [memberPlan, setMemberPlan] = useState<MembershipPlanId>('student');
  const [memberStatus, setMemberStatus] = useState<'active' | 'inactive' | 'expired'>('active');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const u1 = subscribeAdminLectures(setLectures);
    const u2 = subscribeTeachersRegistry(setTeachers);
    const u3 = subscribeMemberAccessList(setMembers);
    return () => {
      u1();
      u2();
      u3();
    };
  }, []);

  const handleAddLecture = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const check = validateLectureSubmission({
      title,
      description,
      sourceType,
      category,
      className,
      subject,
      chapterNumber,
      chapterName,
      teacherName,
      videoUrl,
    });
    if (!check.valid) {
      setError(check.error || 'Invalid lecture fields.');
      return;
    }

    let finalThumb = thumbnailUrl;
    if (sourceType === 'youtube') {
      const yt = parseYouTubeLectureUrl(videoUrl);
      if (yt.valid && yt.thumbnailUrl) finalThumb = yt.thumbnailUrl;
    }

    setSaving(true);
    try {
      await createAdminLectureInDb(authUser.uid, {
        title,
        description,
        sourceType,
        category,
        className,
        subject,
        chapterNumber,
        chapterName,
        teacherName,
        channelName,
        duration,
        videoUrl,
        thumbnailUrl: finalThumb,
        notesSummary,
        featured,
        approvalStatus: 'approved',
        published: true,
      });
      setSuccess('Lecture successfully publish ho gaya hai!');
      setTitle('');
      setDescription('');
      setChapterName('');
      setVideoUrl('');
      setNotesSummary('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lecture save nahi ho paya.');
    } finally {
      setSaving(false);
    }
  };

  const handleApproveLecture = async (lec: LectureItem) => {
    setError(null);
    try {
      await updateAdminLectureInDb(lec.id, {
        approvalStatus: 'approved',
        published: true,
        rejectionReason: '',
      });
      setSuccess(`"${lec.title}" approve aur publish ho gaya!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approve failed.');
    }
  };

  const handleRejectLecture = async (lec: LectureItem) => {
    setError(null);
    try {
      await updateAdminLectureInDb(lec.id, {
        approvalStatus: 'rejected',
        published: false,
        rejectionReason: 'Please update video quality or syllabus details and resubmit.',
      });
      setSuccess(`"${lec.title}" reject kar diya gaya.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reject failed.');
    }
  };

  const handleToggleFeatured = async (lec: LectureItem) => {
    await updateAdminLectureInDb(lec.id, { featured: !lec.featured });
  };

  const handleDeleteLecture = async (lec: LectureItem) => {
    await deleteAdminLectureFromDb(lec.id);
    setSuccess(`"${lec.title}" delete kar diya gaya.`);
  };

  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!teacherUid.trim() || teacherDisplayName.trim().length < 2) {
      setError('Valid Teacher UID aur Display Name enter karein.');
      return;
    }
    setSaving(true);
    try {
      await saveTeacherRecordToDb(authUser.uid, {
        uid: teacherUid.trim(),
        displayName: teacherDisplayName.trim(),
        specialization: teacherSpec.trim() || 'General',
        verified: true,
      });
      setSuccess('Verified Teacher successfully save ho gaya!');
      setTeacherUid('');
      setTeacherDisplayName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Teacher save nahi ho paya.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMemberAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!memberUid.trim()) {
      setError('Student Firebase UID enter karein.');
      return;
    }
    setSaving(true);
    try {
      await saveMemberAccessToDb(authUser.uid, {
        userId: memberUid.trim(),
        planId: memberPlan,
        status: memberStatus,
      });
      setSuccess('Member access permissions update ho gayi hain!');
      setMemberUid('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Member access save failed.');
    } finally {
      setSaving(false);
    }
  };

  const pendingCount = lectures.filter((l) => l.approvalStatus === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSubTab('lectures')}
          className={`px-4 py-2.5 min-h-[42px] rounded-xl text-xs sm:text-sm font-bold cursor-pointer ${
            subTab === 'lectures'
              ? 'bg-[#0B1221] text-white'
              : 'bg-white border border-slate-200 text-slate-700'
          }`}
        >
          Lectures &amp; Approvals ({pendingCount} Pending)
        </button>
        <button
          type="button"
          onClick={() => setSubTab('teachers')}
          className={`inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[42px] rounded-xl text-xs sm:text-sm font-bold cursor-pointer ${
            subTab === 'teachers'
              ? 'bg-[#0B1221] text-white'
              : 'bg-white border border-slate-200 text-slate-700'
          }`}
        >
          <GraduationCap className="w-4 h-4" aria-hidden="true" />
          <span>Verified Teachers ({teachers.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setSubTab('members')}
          className={`inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[42px] rounded-xl text-xs sm:text-sm font-bold cursor-pointer ${
            subTab === 'members'
              ? 'bg-[#0B1221] text-white'
              : 'bg-white border border-slate-200 text-slate-700'
          }`}
        >
          <Crown className="w-4 h-4 text-amber-400" aria-hidden="true" />
          <span>Member Access ({members.length})</span>
        </button>
      </div>

      {error && (
        <div role="alert" className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div role="status" className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{success}</span>
        </div>
      )}

      {subTab === 'lectures' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Add YouTube or Original Lecture */}
          <form
            onSubmit={handleAddLecture}
            className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 space-y-3.5"
          >
            <h3 className="font-display text-base font-bold text-[#0B1221]">
              Add YouTube or VIDYORA Original Lecture
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSourceType('youtube')}
                className={`py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                  sourceType === 'youtube'
                    ? 'bg-[#EDE9FE] border-[#6D28D9] text-[#4C1D95]'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                YouTube URL
              </button>
              <button
                type="button"
                onClick={() => setSourceType('original')}
                className={`py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                  sourceType === 'original'
                    ? 'bg-[#EDE9FE] border-[#6D28D9] text-[#4C1D95]'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                VIDYORA Original
              </button>
            </div>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Lecture Title *"
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-xl"
            />

            <div className="grid grid-cols-2 gap-2.5">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as LectureCategory)}
                className="px-3 py-2.5 text-xs border border-slate-300 rounded-xl bg-white"
              >
                {LECTURE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="Class / Exam *"
                className="px-3 py-2.5 text-xs border border-slate-300 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject *"
                className="px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
              <input
                type="number"
                min={1}
                max={60}
                value={chapterNumber}
                onChange={(e) => setChapterNumber(Number(e.target.value))}
                placeholder="Ch #"
                className="px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
              <input
                type="text"
                value={chapterName}
                onChange={(e) => setChapterName(e.target.value)}
                placeholder="Chapter Name *"
                className="px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder="Teacher Name *"
                className="px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
              <input
                type="text"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                placeholder="YouTube Channel (optional)"
                className="px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder={
                  sourceType === 'youtube'
                    ? 'https://www.youtube.com/watch?v=...'
                    : 'https://.../video.mp4'
                }
                className="col-span-2 px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="12:00"
                className="px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
            </div>

            {sourceType === 'original' && (
              <select
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
              >
                {BUILTIN_THUMBNAILS.map((th) => (
                  <option key={th.url} value={th.url}>
                    {th.label}
                  </option>
                ))}
              </select>
            )}

            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Lecture Description *"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
            />

            <textarea
              rows={2}
              value={notesSummary}
              onChange={(e) => setNotesSummary(e.target.value)}
              placeholder="Optional Notes / Key Formulas"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
            />

            <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#0B1221] cursor-pointer">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-4 h-4 accent-[#6D28D9]"
              />
              <span>Mark as Featured / Recommended</span>
            </label>

            <button
              type="submit"
              disabled={saving}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-[#6D28D9] hover:bg-[#7C3AED] text-white text-sm font-bold cursor-pointer"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <Plus className="w-4 h-4" aria-hidden="true" />
              )}
              <span>Publish Protected Lecture</span>
            </button>
          </form>

          {/* Lectures & Teacher Approval Queue */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <h3 className="font-display text-base font-bold text-[#0B1221]">
              Firestore Lectures &amp; Teacher Submissions ({lectures.length})
            </h3>
            {lectures.length === 0 ? (
              <p className="text-xs text-slate-500 p-4 rounded-xl bg-slate-50">
                Abhi Firestore mein koi custom lecture add nahi hua hai (starter protected lectures backend par active hain).
              </p>
            ) : (
              <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
                {lectures.map((lec) => (
                  <div
                    key={lec.id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-[#EDE9FE] text-[#6D28D9] text-[10px] font-bold uppercase">
                          {lec.sourceType}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            lec.approvalStatus === 'approved'
                              ? 'bg-emerald-100 text-emerald-700'
                              : lec.approvalStatus === 'rejected'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {lec.approvalStatus}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {lec.category} • {lec.subject}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-[#0B1221] truncate">
                        {lec.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        By {lec.teacherName} • {lec.className} Ch.{lec.chapterNumber}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {lec.approvalStatus !== 'approved' && (
                        <button
                          type="button"
                          onClick={() => handleApproveLecture(lec)}
                          aria-label={`Approve ${lec.title}`}
                          className="p-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      {lec.approvalStatus === 'pending' && (
                        <button
                          type="button"
                          onClick={() => handleRejectLecture(lec)}
                          aria-label={`Reject ${lec.title}`}
                          className="p-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleToggleFeatured(lec)}
                        aria-label={`Toggle featured for ${lec.title}`}
                        className={`p-2 rounded-lg border cursor-pointer ${
                          lec.featured
                            ? 'bg-amber-50 border-amber-300 text-amber-600'
                            : 'bg-white border-slate-200 text-slate-400'
                        }`}
                      >
                        <Star className={`w-4 h-4 ${lec.featured ? 'fill-amber-500' : ''}`} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteLecture(lec)}
                        aria-label={`Delete ${lec.title}`}
                        className="p-2 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {subTab === 'teachers' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleSaveTeacher}
            className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 space-y-3"
          >
            <h3 className="font-display text-base font-bold text-[#0B1221]">
              Verify Educator Account
            </h3>
            <p className="text-xs text-slate-600">
              Verified teachers apna pending lecture submit kar sakte hain (admin approval mandatory).
            </p>
            <input
              type="text"
              value={teacherUid}
              onChange={(e) => setTeacherUid(e.target.value)}
              placeholder="Teacher Firebase UID *"
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-xl"
            />
            <input
              type="text"
              value={teacherDisplayName}
              onChange={(e) => setTeacherDisplayName(e.target.value)}
              placeholder="Educator Full Name *"
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-xl"
            />
            <input
              type="text"
              value={teacherSpec}
              onChange={(e) => setTeacherSpec(e.target.value)}
              placeholder="Subjects / Specialization"
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-xl"
            />
            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 min-h-[44px] rounded-xl bg-[#6D28D9] text-white text-sm font-bold cursor-pointer"
            >
              Grant Verified Educator Badge
            </button>
          </form>

          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 space-y-2.5">
            <h3 className="font-display text-base font-bold text-[#0B1221]">
              Verified Educators ({teachers.length})
            </h3>
            {teachers.length === 0 ? (
              <p className="text-xs text-slate-500">No verified teachers added yet.</p>
            ) : (
              teachers.map((t) => (
                <div
                  key={t.uid}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                >
                  <div>
                    <p className="text-sm font-bold text-[#0B1221]">{t.displayName}</p>
                    <p className="text-xs text-slate-500">
                      {t.specialization} • UID: <span className="font-mono">{t.uid}</span>
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold">
                    Verified
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {subTab === 'members' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleSaveMemberAccess}
            className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 space-y-3"
          >
            <h3 className="font-display text-base font-bold text-[#0B1221]">
              Manage Verified Member Access
            </h3>
            <p className="text-xs text-slate-600">
              Sirf verified payment confirmation ke baad student UID ko Student ya Pro Learner access assign karein.
            </p>
            <input
              type="text"
              value={memberUid}
              onChange={(e) => setMemberUid(e.target.value)}
              placeholder="Student Firebase UID *"
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-xl"
            />
            <div className="grid grid-cols-2 gap-2.5">
              <select
                value={memberPlan}
                onChange={(e) => setMemberPlan(e.target.value as MembershipPlanId)}
                className="px-3 py-2.5 text-sm border border-slate-300 rounded-xl bg-white"
              >
                <option value="free">Free Plan (₹0)</option>
                <option value="student">Student Plan (₹49)</option>
                <option value="pro">Pro Learner (₹99)</option>
              </select>
              <select
                value={memberStatus}
                onChange={(e) =>
                  setMemberStatus(e.target.value as 'active' | 'inactive' | 'expired')
                }
                className="px-3 py-2.5 text-sm border border-slate-300 rounded-xl bg-white"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 min-h-[44px] rounded-xl bg-[#0B1221] text-white text-sm font-bold cursor-pointer"
            >
              Update Membership Permission
            </button>
          </form>

          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 space-y-2.5">
            <h3 className="font-display text-base font-bold text-[#0B1221]">
              Active Member Records ({members.length})
            </h3>
            {members.length === 0 ? (
              <p className="text-xs text-slate-500">
                No manual membership records configured yet (all users start on Free Plan).
              </p>
            ) : (
              members.map((m) => (
                <div
                  key={m.userId}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                >
                  <p className="text-xs font-mono text-[#0B1221] truncate">{m.userId}</p>
                  <span className="px-2.5 py-1 rounded-lg bg-[#EDE9FE] text-[#6D28D9] text-xs font-bold uppercase">
                    {m.planId} ({m.status})
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
