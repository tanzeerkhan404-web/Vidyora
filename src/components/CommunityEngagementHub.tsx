import { useEffect, useState } from 'react';
import {
  Award,
  BookMarked,
  CheckCircle2,
  Flag,
  Flame,
  Globe,
  GraduationCap,
  Heart,
  Layers,
  MessageSquare,
  NotebookPen,
  Plus,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react';
import type {
  FirebaseAuthUser,
  StudentProfile,
} from '../types/vidyora';

interface CommunityEngagementHubProps {
  student: StudentProfile | null;
  authUser: FirebaseAuthUser | null;
  watchedCount: number;
  quizCount: number;
}

type CommunityTab =
  | 'forum'
  | 'doubts'
  | 'global-groups'
  | 'peer-mentor'
  | 'assignments'
  | 'study-kit'
  | 'partners';

interface ForumPost {
  id: string;
  author: string;
  role: 'Student' | 'Verified Teacher';
  subject: string;
  title: string;
  body: string;
  likes: number;
  reported: boolean;
  replies: Array<{ id: string; author: string; role: 'Student' | 'Verified Teacher'; text: string }>;
  createdAt: string;
}

interface DoubtThread {
  id: string;
  author: string;
  subject: string;
  question: string;
  resolved: boolean;
  answers: Array<{ id: string; author: string; role: 'Student' | 'Verified Teacher'; text: string; helpful: number }>;
}

interface AssignmentItem {
  id: string;
  title: string;
  subject: string;
  className: string;
  deadline: string;
  instructions: string;
  teacherName: string;
  submissions: Array<{ studentName: string; answer: string; submittedAt: string; feedback?: string }>;
}

interface FlashcardItem {
  id: string;
  subject: string;
  front: string;
  back: string;
}

interface NotebookEntry {
  id: string;
  subject: string;
  title: string;
  content: string;
  updatedAt: string;
}

const STORAGE_PREFIX = 'vidyora_community_v1_';

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

const INITIAL_POSTS: ForumPost[] = [
  {
    id: 'fp-1',
    author: 'Aarav (Class 10)',
    role: 'Student',
    subject: 'Physics',
    title: 'How do you remember sign conventions for spherical mirrors?',
    body: 'I always mix up negative and positive focal lengths for concave vs convex mirrors during numericals.',
    likes: 4,
    reported: false,
    replies: [
      {
        id: 'r1',
        author: 'Prof. Meera Sharma',
        role: 'Verified Teacher',
        text: 'Always place the object on the left of the pole (u is negative). Concave mirror focus lies in front (left → f negative), convex mirror focus lies behind (right → f positive).',
      },
    ],
    createdAt: '2026-11-18',
  },
];

const INITIAL_DOUBTS: DoubtThread[] = [
  {
    id: 'db-1',
    author: 'Riya (Class 12)',
    subject: 'Chemistry',
    question: 'Why does ice float on liquid water even though solids are usually denser than liquids?',
    resolved: true,
    answers: [
      {
        id: 'da-1',
        author: 'Dr. Anand Kulkarni',
        role: 'Verified Teacher',
        text: 'Hydrogen bonding in solid ice creates an open hexagonal cage-like lattice with empty space, making ice ~9% less dense than liquid water at 0°C.',
        helpful: 6,
      },
    ],
  },
];

const INITIAL_ASSIGNMENTS: AssignmentItem[] = [
  {
    id: 'asgn-1',
    title: 'Chapter 1: Ohm’s Law Circuit Practice Sheet',
    subject: 'Physics',
    className: 'Class 10',
    deadline: '2026-12-05',
    instructions: 'Solve 3 numerical problems showing given values, formula V = IR, unit conversion, and final SI units.',
    teacherName: 'VIDYORA Faculty',
    submissions: [],
  },
];

const INITIAL_FLASHCARDS: FlashcardItem[] = [
  {
    id: 'fc-1',
    subject: 'Physics',
    front: "Newton's Second Law Formula",
    back: 'F = dp/dt = m × a (for constant mass). SI unit: Newton (N = kg·m/s²).',
  },
  {
    id: 'fc-2',
    subject: 'Biology',
    front: 'Site of Light & Dark Reactions in Chloroplast',
    back: 'Light reaction: Thylakoid membranes (Grana). Calvin Cycle (Dark reaction): Stroma.',
  },
  {
    id: 'fc-3',
    subject: 'Mathematics',
    front: 'Quadratic Formula for ax² + bx + c = 0',
    back: 'x = (-b ± √(b² − 4ac)) / (2a). Discriminant D = b² − 4ac determines nature of roots.',
  },
];

const GLOBAL_GROUPS = [
  { id: 'gg-1', name: 'India CBSE & State Boards Circle', region: 'India', language: 'English / Hindi', topic: 'Board exam revision & concept clarity' },
  { id: 'gg-2', name: 'Karnataka SSLC & PUC Learners', region: 'Karnataka, India', language: 'Kannada / English', topic: 'Science, Maths & CET preparation' },
  { id: 'gg-3', name: 'Global Youth STEM Explorers', region: 'International', language: 'Multilingual', topic: 'Cross-cultural science experiments & coding challenges' },
  { id: 'gg-4', name: 'South Asia Competitive Exam Peers', region: 'South Asia', language: 'English / Urdu / Hindi', topic: 'JEE, NEET & Olympiad problem solving' },
];

export function CommunityEngagementHub({
  student,
  authUser,
  watchedCount,
  quizCount,
}: CommunityEngagementHubProps) {
  const [tab, setTab] = useState<CommunityTab>('forum');
  const [posts, setPosts] = useState<ForumPost[]>(() => readLocal('posts', INITIAL_POSTS));
  const [doubts, setDoubts] = useState<DoubtThread[]>(() => readLocal('doubts', INITIAL_DOUBTS));
  const [assignments, setAssignments] = useState<AssignmentItem[]>(() =>
    readLocal('assignments', INITIAL_ASSIGNMENTS)
  );
  const [flashcards, setFlashcards] = useState<FlashcardItem[]>(() =>
    readLocal('flashcards', INITIAL_FLASHCARDS)
  );
  const [notebook, setNotebook] = useState<NotebookEntry[]>(() => readLocal('notebook', []));
  const [joinedGroups, setJoinedGroups] = useState<string[]>(() =>
    readLocal('joined_groups', ['gg-1'])
  );
  const [peerRequests, setPeerRequests] = useState<
    Array<{ id: string; author: string; type: 'offer' | 'request'; subject: string; topic: string }>
  >(() =>
    readLocal('peer_exchange', [
      { id: 'pe-1', author: 'Kavya', type: 'offer', subject: 'Mathematics', topic: 'Can explain Trigonometry identities step-by-step (free peer study).' },
    ])
  );
  const [mentorRequests, setMentorRequests] = useState<
    Array<{ id: string; studentName: string; subject: string; goal: string; status: 'moderated_pending' }>
  >(() => readLocal('mentor_requests', []));
  const [partnerApps, setPartnerApps] = useState<
    Array<{ id: string; name: string; orgType: 'Teacher' | 'School/College' | 'NGO'; subjects: string; status: 'pending_admin_verification' }>
  >(() => readLocal('partner_apps', []));

  // Daily Brain Challenge (prevents duplicate daily credit)
  const todayKey = new Date().toISOString().slice(0, 10);
  const [challengeCompletedDates, setChallengeCompletedDates] = useState<string[]>(() =>
    readLocal('daily_challenge_dates', [])
  );
  const [challengeChoice, setChallengeChoice] = useState<number | null>(null);
  const [challengeMsg, setChallengeMsg] = useState<string | null>(null);

  // Form states
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostSubject, setNewPostSubject] = useState('Science');
  const [newPostBody, setNewPostBody] = useState('');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  const [newDoubtSubject, setNewDoubtSubject] = useState('Mathematics');
  const [newDoubtQ, setNewDoubtQ] = useState('');
  const [doubtReplyDrafts, setDoubtReplyDrafts] = useState<Record<string, string>>({});

  const [newAsgnTitle, setNewAsgnTitle] = useState('');
  const [newAsgnSubject, setNewAsgnSubject] = useState('Mathematics');
  const [newAsgnDeadline, setNewAsgnDeadline] = useState('2026-12-15');
  const [newAsgnInstr, setNewAsgnInstr] = useState('');
  const [submissionDrafts, setSubmissionDrafts] = useState<Record<string, string>>({});

  const [flippedCardId, setFlippedCardId] = useState<string | null>(null);
  const [newCardSubject, setNewCardSubject] = useState('Science');
  const [newCardFront, setNewCardFront] = useState('');
  const [newCardBack, setNewCardBack] = useState('');

  const [noteTitle, setNoteTitle] = useState('');
  const [noteSubject, setNoteSubject] = useState('General');
  const [noteContent, setNoteContent] = useState('');

  const [peerType, setPeerType] = useState<'offer' | 'request'>('request');
  const [peerSubject, setPeerSubject] = useState('Physics');
  const [peerTopic, setPeerTopic] = useState('');

  const [mentorSubject, setMentorSubject] = useState('Mathematics');
  const [mentorGoal, setMentorGoal] = useState('');

  const [partnerName, setPartnerName] = useState('');
  const [partnerType, setPartnerType] = useState<'Teacher' | 'School/College' | 'NGO'>('Teacher');
  const [partnerSubjects, setPartnerSubjects] = useState('');

  const currentAuthor = authUser?.displayName || student?.displayName || 'VIDYORA Student';
  const currentRole: 'Student' | 'Verified Teacher' =
    authUser?.isVerifiedTeacher || authUser?.isAdmin ? 'Verified Teacher' : 'Student';

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_PREFIX + 'posts', JSON.stringify(posts));
      window.localStorage.setItem(STORAGE_PREFIX + 'doubts', JSON.stringify(doubts));
      window.localStorage.setItem(STORAGE_PREFIX + 'assignments', JSON.stringify(assignments));
      window.localStorage.setItem(STORAGE_PREFIX + 'flashcards', JSON.stringify(flashcards));
      window.localStorage.setItem(STORAGE_PREFIX + 'notebook', JSON.stringify(notebook));
      window.localStorage.setItem(STORAGE_PREFIX + 'joined_groups', JSON.stringify(joinedGroups));
      window.localStorage.setItem(STORAGE_PREFIX + 'peer_exchange', JSON.stringify(peerRequests));
      window.localStorage.setItem(STORAGE_PREFIX + 'mentor_requests', JSON.stringify(mentorRequests));
      window.localStorage.setItem(STORAGE_PREFIX + 'partner_apps', JSON.stringify(partnerApps));
      window.localStorage.setItem(
        STORAGE_PREFIX + 'daily_challenge_dates',
        JSON.stringify(challengeCompletedDates)
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [
    posts,
    doubts,
    assignments,
    flashcards,
    notebook,
    joinedGroups,
    peerRequests,
    mentorRequests,
    partnerApps,
    challengeCompletedDates,
  ]);

  const completedToday = challengeCompletedDates.includes(todayKey);
  const certificateEligible = watchedCount >= 2 || quizCount >= 1 || challengeCompletedDates.length >= 1;

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-br from-[#0B1221] via-[#131E35] to-[#2E1065] text-white p-6 sm:p-8 border border-white/10 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-purple-200">
              <Users className="w-3.5 h-3.5" aria-hidden="true" />
              <span>VIDYORA Community, Teachers &amp; Global Classroom</span>
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold">
              Learn Together Safely — Students, Teachers &amp; Mentors
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Discuss concepts, clear doubts with verified teachers, join regional &amp; global study circles, complete assignments, revise with offline flashcards, and earn real activity-based recognition.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono shrink-0">
            <div className="px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15">
              <p className="text-slate-300">Streak Days</p>
              <p className="text-lg font-extrabold text-amber-300 flex items-center gap-1">
                <Flame className="w-4 h-4" aria-hidden="true" />
                {challengeCompletedDates.length}
              </p>
            </div>
            <div className="px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15">
              <p className="text-slate-300">Flashcards</p>
              <p className="text-lg font-extrabold text-blue-200">{flashcards.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div
        role="tablist"
        aria-label="Community Hub Sections"
        className="flex items-center gap-1.5 p-1.5 bg-slate-200/75 rounded-xl overflow-x-auto"
      >
        {(
          [
            { id: 'forum', label: 'Discussion Forum', icon: MessageSquare },
            { id: 'doubts', label: 'Doubt Community', icon: Sparkles },
            { id: 'global-groups', label: 'Global Classroom', icon: Globe },
            { id: 'peer-mentor', label: 'Peer & Mentor Connect', icon: UserCheck },
            { id: 'assignments', label: 'Teacher & Assignments', icon: GraduationCap },
            { id: 'study-kit', label: 'Flashcards, Notes & Certs', icon: Layers },
            { id: 'partners', label: 'Educator Partners', icon: ShieldCheck },
          ] as const
        ).map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(item.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 min-h-[42px] rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                active
                  ? 'bg-white text-[#0B1221] shadow-xs'
                  : 'text-slate-600 hover:text-[#0B1221]'
              }`}
            >
              <Icon className="w-4 h-4 text-[#6D28D9]" aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: DISCUSSION FORUM */}
      {tab === 'forum' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newPostTitle.trim() || !newPostBody.trim()) return;
              setPosts((prev) => [
                {
                  id: `fp-${Date.now()}`,
                  author: currentAuthor,
                  role: currentRole,
                  subject: newPostSubject,
                  title: newPostTitle.trim(),
                  body: newPostBody.trim(),
                  likes: 0,
                  reported: false,
                  replies: [],
                  createdAt: todayKey,
                },
                ...prev,
              ]);
              setNewPostTitle('');
              setNewPostBody('');
            }}
            className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 space-y-3"
          >
            <h2 className="font-display text-base font-bold text-[#0B1221]">
              Start an Educational Discussion
            </h2>
            <select
              value={newPostSubject}
              onChange={(e) => setNewPostSubject(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
            >
              <option>Science</option>
              <option>Mathematics</option>
              <option>Physics</option>
              <option>Chemistry</option>
              <option>Biology</option>
              <option>Competitive Exams</option>
              <option>Computer Science</option>
            </select>
            <input
              type="text"
              required
              value={newPostTitle}
              onChange={(e) => setNewPostTitle(e.target.value)}
              placeholder="Discussion title..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
            />
            <textarea
              rows={3}
              required
              value={newPostBody}
              onChange={(e) => setNewPostBody(e.target.value)}
              placeholder="Explain your question or study insight clearly (no personal phone/address)..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
            />
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#6D28D9] hover:bg-[#7C3AED] text-white text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Post to Forum</span>
            </button>
          </form>

          <div className="lg:col-span-8 space-y-4">
            {posts.map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="px-2 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] font-semibold">
                        {post.subject}
                      </span>
                      <span className="font-semibold text-[#0B1221]">{post.author}</span>
                      <span
                        className={`px-2 py-0.5 rounded font-semibold ${
                          post.role === 'Verified Teacher'
                            ? 'bg-emerald-50 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {post.role}
                      </span>
                    </div>
                    <h3 className="mt-1.5 font-display text-base font-bold text-[#0B1221]">
                      {post.title}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setPosts((prev) =>
                        prev.map((p) => (p.id === post.id ? { ...p, reported: true } : p))
                      )
                    }
                    className="text-[11px] text-slate-500 hover:text-red-600 inline-flex items-center gap-1 cursor-pointer"
                    aria-label={`Report post ${post.title}`}
                  >
                    <Flag className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{post.reported ? 'Reported' : 'Report'}</span>
                  </button>
                </div>

                <p className="text-sm text-slate-700 leading-relaxed">{post.body}</p>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      setPosts((prev) =>
                        prev.map((p) => (p.id === post.id ? { ...p, likes: p.likes + 1 } : p))
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-rose-50 border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
                  >
                    <Heart className="w-3.5 h-3.5 text-rose-500" aria-hidden="true" />
                    <span>Helpful ({post.likes})</span>
                  </button>
                  <span className="text-xs text-slate-500">
                    {post.replies.length} replies
                  </span>
                </div>

                {post.replies.length > 0 && (
                  <div className="space-y-2 pl-4 border-l-2 border-purple-200">
                    {post.replies.map((r) => (
                      <div key={r.id} className="p-3 rounded-xl bg-slate-50 text-xs space-y-1">
                        <p className="font-semibold text-[#0B1221]">
                          {r.author}{' '}
                          <span
                            className={`ml-1 px-1.5 py-0.5 rounded text-[10px] ${
                              r.role === 'Verified Teacher'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {r.role}
                          </span>
                        </p>
                        <p className="text-slate-700">{r.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={replyDrafts[post.id] || ''}
                    onChange={(e) =>
                      setReplyDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))
                    }
                    placeholder="Write a helpful educational reply..."
                    className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const txt = (replyDrafts[post.id] || '').trim();
                      if (!txt) return;
                      setPosts((prev) =>
                        prev.map((p) =>
                          p.id === post.id
                            ? {
                                ...p,
                                replies: [
                                  ...p.replies,
                                  {
                                    id: `rep-${Date.now()}`,
                                    author: currentAuthor,
                                    role: currentRole,
                                    text: txt,
                                  },
                                ],
                              }
                            : p
                        )
                      );
                      setReplyDrafts((prev) => ({ ...prev, [post.id]: '' }));
                    }}
                    className="px-3 py-2 rounded-lg bg-[#0B1221] text-white text-xs font-semibold cursor-pointer"
                  >
                    Reply
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: DOUBT COMMUNITY */}
      {tab === 'doubts' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newDoubtQ.trim()) return;
              setDoubts((prev) => [
                {
                  id: `db-${Date.now()}`,
                  author: currentAuthor,
                  subject: newDoubtSubject,
                  question: newDoubtQ.trim(),
                  resolved: false,
                  answers: [],
                },
                ...prev,
              ]);
              setNewDoubtQ('');
            }}
            className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 space-y-3"
          >
            <h2 className="font-display text-base font-bold text-[#0B1221]">
              Ask the Doubt Community
            </h2>
            <p className="text-xs text-slate-600">
              Answers are clearly labelled as <strong>Verified Teacher</strong> or <strong>Student</strong> so you know the source.
            </p>
            <select
              value={newDoubtSubject}
              onChange={(e) => setNewDoubtSubject(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
            >
              <option>Mathematics</option>
              <option>Physics</option>
              <option>Chemistry</option>
              <option>Biology</option>
              <option>Computer Science</option>
            </select>
            <textarea
              rows={3}
              required
              value={newDoubtQ}
              onChange={(e) => setNewDoubtQ(e.target.value)}
              placeholder="Type your conceptual doubt clearly..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#6D28D9] text-white text-xs font-semibold cursor-pointer"
            >
              Post Doubt
            </button>
          </form>

          <div className="lg:col-span-8 space-y-4">
            {doubts.map((d) => (
              <div
                key={d.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-semibold text-[#6D28D9]">
                      {d.subject} • Asked by {d.author}
                    </span>
                    <h3 className="mt-1 font-display text-base font-bold text-[#0B1221]">
                      {d.question}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setDoubts((prev) =>
                        prev.map((item) =>
                          item.id === d.id ? { ...item, resolved: !item.resolved } : item
                        )
                      )
                    }
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                      d.resolved
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {d.resolved ? 'Resolved' : 'Mark Resolved'}
                  </button>
                </div>

                {d.answers.map((ans) => (
                  <div
                    key={ans.id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-[#0B1221]">
                        {ans.author}{' '}
                        <span
                          className={`ml-1.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                            ans.role === 'Verified Teacher'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-50 text-[#2563EB]'
                          }`}
                        >
                          {ans.role}
                        </span>
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          setDoubts((prev) =>
                            prev.map((item) =>
                              item.id === d.id
                                ? {
                                    ...item,
                                    answers: item.answers.map((a) =>
                                      a.id === ans.id ? { ...a, helpful: a.helpful + 1 } : a
                                    ),
                                  }
                                : item
                            )
                          )
                        }
                        className="text-[11px] font-semibold text-[#6D28D9] cursor-pointer"
                      >
                        Helpful ({ans.helpful})
                      </button>
                    </div>
                    <p className="text-slate-700 leading-relaxed">{ans.text}</p>
                  </div>
                ))}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={doubtReplyDrafts[d.id] || ''}
                    onChange={(e) =>
                      setDoubtReplyDrafts((prev) => ({ ...prev, [d.id]: e.target.value }))
                    }
                    placeholder="Add a clear explanation..."
                    className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const txt = (doubtReplyDrafts[d.id] || '').trim();
                      if (!txt) return;
                      setDoubts((prev) =>
                        prev.map((item) =>
                          item.id === d.id
                            ? {
                                ...item,
                                answers: [
                                  ...item.answers,
                                  {
                                    id: `da-${Date.now()}`,
                                    author: currentAuthor,
                                    role: currentRole,
                                    text: txt,
                                    helpful: 0,
                                  },
                                ],
                              }
                            : item
                        )
                      );
                      setDoubtReplyDrafts((prev) => ({ ...prev, [d.id]: '' }));
                    }}
                    className="px-3 py-2 rounded-lg bg-[#0B1221] text-white text-xs font-semibold cursor-pointer"
                  >
                    Answer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: GLOBAL CLASSROOM & STUDY GROUPS */}
      {tab === 'global-groups' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#EFF6FF] border border-blue-200 text-xs text-slate-700 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              <strong>Global Classroom Age-Safety Standard:</strong> All regional and international learning circles are topic-focused and moderated. Never share private phone numbers, home addresses, or external personal chat links.
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {GLOBAL_GROUPS.map((g) => {
              const joined = joinedGroups.includes(g.id);
              return (
                <div
                  key={g.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="px-2 py-0.5 rounded bg-purple-50 text-[#6D28D9] font-semibold">
                        {g.region}
                      </span>
                      <span className="text-slate-500 font-medium">{g.language}</span>
                    </div>
                    <h3 className="mt-2 font-display text-base font-bold text-[#0B1221]">
                      {g.name}
                    </h3>
                    <p className="mt-1 text-xs text-slate-600">{g.topic}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setJoinedGroups((prev) =>
                        joined ? prev.filter((id) => id !== g.id) : [...prev, g.id]
                      )
                    }
                    className={`w-full py-2.5 rounded-xl text-xs font-semibold cursor-pointer ${
                      joined
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-[#0B1221] text-white hover:bg-[#1E2E4D]'
                    }`}
                  >
                    {joined ? 'Joined Learning Circle ✓' : 'Join Circle'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: PEER LEARNING EXCHANGE & MENTOR CONNECT */}
      {tab === 'peer-mentor' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Peer Learning Exchange */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <div>
              <h2 className="font-display text-base font-bold text-[#0B1221]">
                Peer Learning Exchange (Free &amp; Moderated)
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Offer concept explanations or request free peer study help. Paid student-to-student services are strictly prohibited.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!peerTopic.trim()) return;
                setPeerRequests((prev) => [
                  {
                    id: `pe-${Date.now()}`,
                    author: currentAuthor,
                    type: peerType,
                    subject: peerSubject,
                    topic: peerTopic.trim(),
                  },
                  ...prev,
                ]);
                setPeerTopic('');
              }}
              className="space-y-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200"
            >
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={peerType}
                  onChange={(e) => setPeerType(e.target.value as 'offer' | 'request')}
                  className="px-2.5 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                >
                  <option value="request">Request Peer Help</option>
                  <option value="offer">Offer Free Explanation</option>
                </select>
                <input
                  type="text"
                  value={peerSubject}
                  onChange={(e) => setPeerSubject(e.target.value)}
                  placeholder="Subject"
                  className="px-2.5 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                />
              </div>
              <input
                type="text"
                required
                value={peerTopic}
                onChange={(e) => setPeerTopic(e.target.value)}
                placeholder="Topic you need help with or can explain..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
              />
              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-[#6D28D9] text-white text-xs font-semibold cursor-pointer"
              >
                Post to Peer Exchange
              </button>
            </form>

            <div className="space-y-2.5">
              {peerRequests.map((pr) => (
                <div
                  key={pr.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1"
                >
                  <span
                    className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                      pr.type === 'offer'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {pr.type === 'offer' ? 'Offering Explanation' : 'Requesting Help'} · {pr.subject}
                  </span>
                  <p className="font-semibold text-[#0B1221]">{pr.topic}</p>
                  <p className="text-[11px] text-slate-500">By {pr.author}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Mentor Connect */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <div>
              <h2 className="font-display text-base font-bold text-[#0B1221]">
                Mentor Connect (Safeguarded for Minors)
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Request academic guidance from identity-verified educators. Unrestricted private 1-on-1 messaging between adults and minors is disabled by policy.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!mentorGoal.trim()) return;
                setMentorRequests((prev) => [
                  {
                    id: `mr-${Date.now()}`,
                    studentName: currentAuthor,
                    subject: mentorSubject,
                    goal: mentorGoal.trim(),
                    status: 'moderated_pending',
                  },
                  ...prev,
                ]);
                setMentorGoal('');
              }}
              className="space-y-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200"
            >
              <input
                type="text"
                value={mentorSubject}
                onChange={(e) => setMentorSubject(e.target.value)}
                placeholder="Subject / Exam focus (e.g. NEET Biology)"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
              />
              <textarea
                rows={2}
                required
                value={mentorGoal}
                onChange={(e) => setMentorGoal(e.target.value)}
                placeholder="Describe your study challenge for a moderated mentor review..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
              />
              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-[#0B1221] text-white text-xs font-semibold cursor-pointer"
              >
                Submit Moderated Mentoring Request
              </button>
            </form>

            {mentorRequests.length === 0 ? (
              <p className="text-xs text-slate-500">
                No active mentoring requests yet. All requests go through verified mentor matching &amp; admin moderation.
              </p>
            ) : (
              <div className="space-y-2">
                {mentorRequests.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs"
                  >
                    <p className="font-semibold text-[#0B1221]">
                      {m.subject} — {m.goal}
                    </p>
                    <p className="text-[11px] text-amber-900 mt-0.5">
                      Status: Awaiting Verified Mentor &amp; Moderation Approval
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: TEACHER DASHBOARD & ASSIGNMENTS */}
      {tab === 'assignments' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newAsgnTitle.trim() || !newAsgnInstr.trim()) return;
              setAssignments((prev) => [
                {
                  id: `asgn-${Date.now()}`,
                  title: newAsgnTitle.trim(),
                  subject: newAsgnSubject,
                  className: student?.level || 'Class 9-10',
                  deadline: newAsgnDeadline,
                  instructions: newAsgnInstr.trim(),
                  teacherName: currentAuthor,
                  submissions: [],
                },
                ...prev,
              ]);
              setNewAsgnTitle('');
              setNewAsgnInstr('');
            }}
            className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 space-y-3"
          >
            <h2 className="font-display text-base font-bold text-[#0B1221]">
              Teacher Assignment Creator
            </h2>
            <p className="text-xs text-slate-600">
              {currentRole === 'Verified Teacher'
                ? 'Signed in with educator access — create chapter practice assignments below.'
                : 'Preview mode for students; verified teachers publish official class assignments.'}
            </p>
            <input
              type="text"
              required
              value={newAsgnTitle}
              onChange={(e) => setNewAsgnTitle(e.target.value)}
              placeholder="Assignment title"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={newAsgnSubject}
                onChange={(e) => setNewAsgnSubject(e.target.value)}
                placeholder="Subject"
                className="px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
              <input
                type="date"
                value={newAsgnDeadline}
                onChange={(e) => setNewAsgnDeadline(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
            </div>
            <textarea
              rows={3}
              required
              value={newAsgnInstr}
              onChange={(e) => setNewAsgnInstr(e.target.value)}
              placeholder="Instructions & questions..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#6D28D9] text-white text-xs font-semibold cursor-pointer"
            >
              Create Assignment
            </button>
          </form>

          <div className="lg:col-span-8 space-y-4">
            {assignments.map((asgn) => (
              <div
                key={asgn.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-semibold text-[#2563EB]">
                      {asgn.subject} • {asgn.className} • Due: {asgn.deadline}
                    </p>
                    <h3 className="font-display text-base font-bold text-[#0B1221]">
                      {asgn.title}
                    </h3>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                    {asgn.submissions.length} submitted
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{asgn.instructions}</p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={submissionDrafts[asgn.id] || ''}
                    onChange={(e) =>
                      setSubmissionDrafts((prev) => ({ ...prev, [asgn.id]: e.target.value }))
                    }
                    placeholder="Write your assignment response / key steps to submit..."
                    className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const ans = (submissionDrafts[asgn.id] || '').trim();
                      if (!ans) return;
                      setAssignments((prev) =>
                        prev.map((a) =>
                          a.id === asgn.id
                            ? {
                                ...a,
                                submissions: [
                                  ...a.submissions,
                                  {
                                    studentName: currentAuthor,
                                    answer: ans,
                                    submittedAt: todayKey,
                                    feedback: 'Submission received — pending teacher review.',
                                  },
                                ],
                              }
                            : a
                        )
                      );
                      setSubmissionDrafts((prev) => ({ ...prev, [asgn.id]: '' }));
                    }}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-[#0B1221] text-white text-xs font-semibold cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Submit</span>
                  </button>
                </div>

                {asgn.submissions.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {asgn.submissions.map((sub, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs"
                      >
                        <p className="font-semibold text-[#0B1221]">
                          {sub.studentName} ({sub.submittedAt}): {sub.answer}
                        </p>
                        <p className="text-[11px] text-emerald-800">{sub.feedback}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: FLASHCARDS, PRIVATE NOTEBOOK, DAILY CHALLENGE & CERTIFICATES */}
      {tab === 'study-kit' && (
        <div className="space-y-6">
          {/* Daily Brain Challenge (No duplicate credit per day) */}
          <div className="bg-white rounded-2xl border border-purple-200 p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-base font-bold text-[#0B1221] flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-500" aria-hidden="true" />
                <span>Daily Brain Challenge ({todayKey})</span>
              </h2>
              <span className="text-xs font-semibold text-[#6D28D9]">
                {completedToday ? 'Completed Today ✓ (1 credit/day enforced)' : '1 Streak Credit Available'}
              </span>
            </div>
            <p className="text-sm font-medium text-[#0B1221]">
              If the length of a simple pendulum is multiplied by 4, how does its time period T change?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                'Stays the same',
                'Becomes 2 times (doubles)',
                'Becomes 4 times',
                'Becomes half',
              ].map((opt, idx) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setChallengeChoice(idx);
                    if (idx === 1) {
                      if (!completedToday) {
                        setChallengeCompletedDates((prev) => [...prev, todayKey]);
                        setChallengeMsg('Correct! T = 2π√(L/g), so 4L gives √4 = 2T. Daily streak credited!');
                      } else {
                        setChallengeMsg('Correct! You already earned today’s streak credit (duplicate credits blocked).');
                      }
                    } else {
                      setChallengeMsg('Not quite — remember T is proportional to √L. Try again!');
                    }
                  }}
                  className={`p-3 rounded-xl border text-left text-xs font-semibold cursor-pointer ${
                    challengeChoice === idx
                      ? idx === 1
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                        : 'bg-red-50 border-red-300 text-red-900'
                      : 'bg-slate-50 border-slate-200 text-[#0B1221] hover:bg-[#EFF6FF]'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            {challengeMsg && (
              <p className="text-xs font-semibold text-[#6D28D9]">{challengeMsg}</p>
            )}
          </div>

          {/* Flashcards (Offline-ready in browser storage) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <h2 className="font-display text-base font-bold text-[#0B1221] flex items-center gap-2">
              <BookMarked className="w-5 h-5 text-[#2563EB]" aria-hidden="true" />
              <span>Smart Flashcards (Available Offline)</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {flashcards.map((card) => {
                const flipped = flippedCardId === card.id;
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setFlippedCardId(flipped ? null : card.id)}
                    className={`p-4 rounded-2xl border text-left min-h-[130px] flex flex-col justify-between transition-colors cursor-pointer ${
                      flipped
                        ? 'bg-[#0B1221] text-white border-[#6D28D9]'
                        : 'bg-slate-50 hover:bg-[#EFF6FF] text-[#0B1221] border-slate-200'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-500">
                      {card.subject} • {flipped ? 'Answer' : 'Tap to Flip'}
                    </span>
                    <p className="text-sm font-semibold leading-snug">
                      {flipped ? card.back : card.front}
                    </p>
                  </button>
                );
              })}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newCardFront.trim() || !newCardBack.trim()) return;
                setFlashcards((prev) => [
                  {
                    id: `fc-${Date.now()}`,
                    subject: newCardSubject,
                    front: newCardFront.trim(),
                    back: newCardBack.trim(),
                  },
                  ...prev,
                ]);
                setNewCardFront('');
                setNewCardBack('');
              }}
              className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200"
            >
              <input
                type="text"
                value={newCardSubject}
                onChange={(e) => setNewCardSubject(e.target.value)}
                placeholder="Subject"
                className="px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
              <input
                type="text"
                required
                value={newCardFront}
                onChange={(e) => setNewCardFront(e.target.value)}
                placeholder="Question / Term (Front)"
                className="px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
              <input
                type="text"
                required
                value={newCardBack}
                onChange={(e) => setNewCardBack(e.target.value)}
                placeholder="Answer / Formula (Back)"
                className="px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-lg bg-[#6D28D9] text-white text-xs font-semibold cursor-pointer"
              >
                Add Flashcard
              </button>
            </form>
          </div>

          {/* Private Digital Notebook + Honest Activity Certificate */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <h2 className="font-display text-base font-bold text-[#0B1221] flex items-center gap-2">
                <NotebookPen className="w-5 h-5 text-[#6D28D9]" aria-hidden="true" />
                <span>Private Digital Notebook (Stored Locally &amp; Offline)</span>
              </h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!noteTitle.trim() || !noteContent.trim()) return;
                  setNotebook((prev) => [
                    {
                      id: `nb-${Date.now()}`,
                      subject: noteSubject,
                      title: noteTitle.trim(),
                      content: noteContent.trim(),
                      updatedAt: todayKey,
                    },
                    ...prev,
                  ]);
                  setNoteTitle('');
                  setNoteContent('');
                }}
                className="space-y-2"
              >
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    placeholder="Note title"
                    className="px-3 py-2 text-xs rounded-lg border border-slate-300"
                  />
                  <input
                    type="text"
                    value={noteSubject}
                    onChange={(e) => setNoteSubject(e.target.value)}
                    placeholder="Subject"
                    className="px-3 py-2 text-xs rounded-lg border border-slate-300"
                  />
                </div>
                <textarea
                  rows={2}
                  required
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Write private revision notes (never shared publicly)..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#0B1221] text-white text-xs font-semibold cursor-pointer"
                >
                  Save Private Note
                </button>
              </form>

              {notebook.length > 0 && (
                <div className="space-y-2 pt-2">
                  {notebook.map((n) => (
                    <div
                      key={n.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex justify-between gap-2"
                    >
                      <div>
                        <p className="font-bold text-[#0B1221]">
                          {n.title} <span className="text-[#6D28D9]">({n.subject})</span>
                        </p>
                        <p className="text-slate-600 mt-0.5">{n.content}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNotebook((prev) => prev.filter((item) => item.id !== n.id))}
                        aria-label={`Delete note ${n.title}`}
                        className="text-red-500 p-1 cursor-pointer self-start"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <h2 className="font-display text-base font-bold text-[#0B1221] flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" aria-hidden="true" />
                <span>Real-Activity Learning Recognition</span>
              </h2>
              <p className="text-xs text-slate-600">
                Certificates unlock ONLY from genuine completed lessons, quizzes, or daily challenges—never from passive browsing.
              </p>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0B1221] to-[#2E1065] text-white space-y-2">
                <p className="text-[11px] font-semibold text-purple-200 uppercase tracking-wider">
                  VIDYORA Self-Paced Learning Certificate
                </p>
                <p className="font-display text-lg font-extrabold">{currentAuthor}</p>
                <p className="text-xs text-slate-300">
                  Completed Lessons: {watchedCount} • Quizzes: {quizCount} • Daily Challenges: {challengeCompletedDates.length}
                </p>
                <div className="pt-2 flex items-center justify-between text-xs">
                  <span
                    className={`px-2.5 py-1 rounded-lg font-semibold ${
                      certificateEligible
                        ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/40'
                        : 'bg-white/10 text-slate-300'
                    }`}
                  >
                    {certificateEligible
                      ? 'Unlocked — Criteria Met ✓'
                      : 'Complete 2 Lessons or 1 Quiz to Unlock'}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                Disclaimer: VIDYORA completion certificates recognize self-paced study progress on VIDYORA and are not government-accredited degrees or formal university diplomas.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: EDUCATOR PARTNERSHIP NETWORK */}
      {tab === 'partners' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!partnerName.trim() || !partnerSubjects.trim()) return;
              setPartnerApps((prev) => [
                {
                  id: `pa-${Date.now()}`,
                  name: partnerName.trim(),
                  orgType: partnerType,
                  subjects: partnerSubjects.trim(),
                  status: 'pending_admin_verification',
                },
                ...prev,
              ]);
              setPartnerName('');
              setPartnerSubjects('');
            }}
            className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 space-y-3"
          >
            <h2 className="font-display text-base font-bold text-[#0B1221]">
              Apply to VIDYORA Educator Partnership Network
            </h2>
            <p className="text-xs text-slate-600">
              Teachers, schools, colleges, and educational NGOs can apply to contribute verified learning resources. Applications are NEVER auto-verified—every partner requires manual administrator review.
            </p>
            <input
              type="text"
              required
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              placeholder="Educator / Institution Name"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
            />
            <select
              value={partnerType}
              onChange={(e) =>
                setPartnerType(e.target.value as 'Teacher' | 'School/College' | 'NGO')
              }
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
            >
              <option value="Teacher">Independent Educator / Teacher</option>
              <option value="School/College">School / College Institution</option>
              <option value="NGO">Educational Non-Profit / NGO</option>
            </select>
            <input
              type="text"
              required
              value={partnerSubjects}
              onChange={(e) => setPartnerSubjects(e.target.value)}
              placeholder="Subjects & Languages taught"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#6D28D9] text-white text-xs font-semibold cursor-pointer"
            >
              Submit Partnership Application
            </button>
          </form>

          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <h3 className="font-display text-base font-bold text-[#0B1221]">
              Partnership Applications &amp; Verification Status
            </h3>
            {partnerApps.length === 0 ? (
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                No pending partnership applications submitted on this device yet. Verified partner profiles appear publicly only after administrator identity &amp; qualification checks.
              </div>
            ) : (
              <div className="space-y-2.5">
                {partnerApps.map((app) => (
                  <div
                    key={app.id}
                    className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="font-bold text-[#0B1221]">
                        {app.name} ({app.orgType})
                      </p>
                      <p className="text-slate-600">{app.subjects}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-amber-900 font-semibold shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                      Pending Admin Review
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
