import type {
  LectureCategory,
  LectureItem,
  LectureSourceType,
  MembershipPlanId,
} from '../types/vidyora';

export const LECTURE_CATEGORIES: LectureCategory[] = [
  'Classes 1-5',
  'Classes 6-8',
  'Classes 9-10',
  'Classes 11-12',
  'JEE',
  'NEET',
  'UPSC',
  'College Education',
  'Skill Development',
  'Language Learning',
  'General Knowledge',
];

export const LECTURE_SOURCE_LABELS: Record<LectureSourceType, string> = {
  youtube: 'YouTube Lecture',
  original: 'VIDYORA Original',
  teacher: 'Teacher Submitted',
};

export interface ParsedYouTubeLecture {
  valid: boolean;
  videoId?: string;
  embedUrl?: string;
  thumbnailUrl?: string;
  error?: string;
}

/**
 * Validates legitimate YouTube lecture URLs and converts them to the official
 * privacy-enhanced YouTube Embedded Player URL without stripping branding or ads.
 */
export function parseYouTubeLectureUrl(rawUrl: string): ParsedYouTubeLecture {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) {
    return { valid: false, error: 'YouTube lecture URL enter karein.' };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, error: 'Valid HTTPS YouTube URL enter karein.' };
  }

  if (parsed.protocol !== 'https:') {
    return { valid: false, error: 'Sirf secure HTTPS YouTube links allowed hain.' };
  }

  const host = parsed.hostname.toLowerCase();
  let videoId = '';

  if (host === 'youtu.be') {
    videoId = parsed.pathname.replace(/^\/+/, '').split('/')[0] || '';
  } else if (
    host === 'www.youtube.com' ||
    host === 'youtube.com' ||
    host === 'm.youtube.com' ||
    host === 'www.youtube-nocookie.com'
  ) {
    if (parsed.pathname === '/watch') {
      videoId = parsed.searchParams.get('v') || '';
    } else if (parsed.pathname.startsWith('/embed/')) {
      videoId = parsed.pathname.replace('/embed/', '').split('/')[0] || '';
    } else if (parsed.pathname.startsWith('/shorts/')) {
      videoId = parsed.pathname.replace('/shorts/', '').split('/')[0] || '';
    }
  } else {
    return {
      valid: false,
      error: 'URL official youtube.com ya youtu.be domain ka hona chahiye.',
    };
  }

  if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return {
      valid: false,
      error: 'Valid 11-character YouTube Video ID nahi mila.',
    };
  }

  return {
    valid: true,
    videoId,
    embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`,
    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  };
}

export function validateHostedVideoUrl(rawUrl: string): {
  valid: boolean;
  error?: string;
} {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) {
    return { valid: false, error: 'Secure video URL enter karein.' };
  }
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, error: 'Valid HTTPS video URL enter karein.' };
  }
  if (parsed.protocol !== 'https:') {
    return { valid: false, error: 'Video URL HTTPS hona zaroori hai.' };
  }
  return { valid: true };
}

export function validateLectureSubmission(input: {
  title: string;
  description: string;
  sourceType: LectureSourceType;
  category: LectureCategory;
  className: string;
  subject: string;
  chapterNumber: number;
  chapterName: string;
  teacherName: string;
  videoUrl: string;
}): { valid: boolean; error?: string } {
  if (!input.title || input.title.trim().length < 4 || input.title.trim().length > 160) {
    return { valid: false, error: 'Lecture title 4 se 160 characters ka hona chahiye.' };
  }
  if (
    !input.description ||
    input.description.trim().length < 10 ||
    input.description.trim().length > 1500
  ) {
    return {
      valid: false,
      error: 'Lecture description kam se kam 10 characters ki honi chahiye.',
    };
  }
  if (!LECTURE_CATEGORIES.includes(input.category)) {
    return { valid: false, error: 'Valid lecture category select karein.' };
  }
  if (!input.className || input.className.trim().length < 2) {
    return { valid: false, error: 'Class ya level enter karein.' };
  }
  if (!input.subject || input.subject.trim().length < 2) {
    return { valid: false, error: 'Subject ka naam enter karein.' };
  }
  if (
    !Number.isFinite(input.chapterNumber) ||
    input.chapterNumber < 1 ||
    input.chapterNumber > 60
  ) {
    return { valid: false, error: 'Chapter number 1 se 60 ke beech hona chahiye.' };
  }
  if (!input.chapterName || input.chapterName.trim().length < 2) {
    return { valid: false, error: 'Chapter name enter karein.' };
  }
  if (!input.teacherName || input.teacherName.trim().length < 2) {
    return { valid: false, error: 'Teacher ya channel name enter karein.' };
  }

  if (input.sourceType === 'youtube') {
    const yt = parseYouTubeLectureUrl(input.videoUrl);
    if (!yt.valid) return { valid: false, error: yt.error };
  } else {
    const hosted = validateHostedVideoUrl(input.videoUrl);
    if (!hosted.valid) return { valid: false, error: hosted.error };
  }

  return { valid: true };
}

export function isEligibleLectureMember(params: {
  isAuthenticated: boolean;
  isAdmin?: boolean;
  planId?: MembershipPlanId;
  membershipStatus?: 'active' | 'inactive' | 'expired';
}): boolean {
  if (!params.isAuthenticated) return false;
  if (params.isAdmin) return true;
  return (
    params.membershipStatus === 'active' &&
    (params.planId === 'student' || params.planId === 'pro')
  );
}

export function filterLectures(
  lectures: LectureItem[],
  filters: {
    search?: string;
    category?: LectureCategory | 'All';
    sourceType?: LectureSourceType | 'all';
    subject?: string;
    chapter?: string;
  }
): LectureItem[] {
  const q = (filters.search || '').trim().toLowerCase();
  return lectures.filter((lec) => {
    if (filters.category && filters.category !== 'All' && lec.category !== filters.category) {
      return false;
    }
    if (
      filters.sourceType &&
      filters.sourceType !== 'all' &&
      lec.sourceType !== filters.sourceType
    ) {
      return false;
    }
    if (
      filters.subject &&
      filters.subject !== 'All' &&
      lec.subject.toLowerCase() !== filters.subject.toLowerCase()
    ) {
      return false;
    }
    if (
      filters.chapter &&
      filters.chapter !== 'All' &&
      lec.chapterName.toLowerCase() !== filters.chapter.toLowerCase()
    ) {
      return false;
    }
    if (q) {
      const hay =
        `${lec.title} ${lec.description} ${lec.subject} ${lec.className} ${lec.chapterName} ${lec.teacherName} ${lec.channelName || ''} ${lec.category}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function getRecommendedLectures(
  current: LectureItem,
  pool: LectureItem[],
  limit = 4
): LectureItem[] {
  return pool
    .filter((item) => item.id !== current.id && item.published && item.approvalStatus === 'approved')
    .sort((a, b) => {
      const aScore =
        (a.subject === current.subject ? 3 : 0) +
        (a.category === current.category ? 2 : 0) +
        (a.featured ? 1 : 0);
      const bScore =
        (b.subject === current.subject ? 3 : 0) +
        (b.category === current.category ? 2 : 0) +
        (b.featured ? 1 : 0);
      return bScore - aScore;
    })
    .slice(0, limit);
}

/**
 * Curated Starter Members-Only Lecture Library served ONLY by the backend after
 * verified active membership or admin check (merged with Firestore approved lectures).
 */
export const PROTECTED_STARTER_LECTURES: LectureItem[] = [
  {
    id: 'lec-yt-class10-quadratics',
    title: 'Quadratic Equations — Complete Concept & Board Numericals',
    description:
      'Factorization, completing the square aur quadratic formula ko step-by-step visual examples ke saath samjhein. Class 10 board exam ke high-weightage problems covered.',
    sourceType: 'youtube',
    category: 'Classes 9-10',
    className: 'Class 10',
    subject: 'Mathematics',
    chapterNumber: 4,
    chapterName: 'Quadratic Equations',
    teacherName: 'VIDYORA Academic Curated',
    channelName: 'Khan Academy India',
    duration: '14:20',
    videoUrl: 'https://www.youtube.com/watch?v=IlNAJl36-10',
    thumbnailUrl: 'https://i.ytimg.com/vi/IlNAJl36-10/hqdefault.jpg',
    notesSummary:
      'Standard form ax² + bx + c = 0 (a ≠ 0). Discriminant D = b² - 4ac: D > 0 two real distinct roots, D = 0 equal roots, D < 0 no real roots.',
    featured: true,
    approvalStatus: 'approved',
    published: true,
    submittedByUid: 'vidyora-system',
  },
  {
    id: 'lec-yt-jee-kinematics',
    title: 'Kinematics 1D & Graphs — JEE Main Concept Booster',
    description:
      'Position-time, velocity-time aur acceleration-time graphs ko slope aur area method se solve karne ka fast JEE approach.',
    sourceType: 'youtube',
    category: 'JEE',
    className: 'JEE Main & Adv',
    subject: 'Physics',
    chapterNumber: 3,
    chapterName: 'Motion in a Straight Line',
    teacherName: 'Physics Faculty',
    channelName: 'Khan Academy Physics',
    duration: '16:10',
    videoUrl: 'https://www.youtube.com/watch?v=ZM8ECpBuQYE',
    thumbnailUrl: 'https://i.ytimg.com/vi/ZM8ECpBuQYE/hqdefault.jpg',
    notesSummary:
      'v = u + at; s = ut + ½at²; v² = u² + 2as. Area under v-t graph gives displacement; slope of v-t graph gives acceleration.',
    featured: true,
    approvalStatus: 'approved',
    published: true,
    submittedByUid: 'vidyora-system',
  },
  {
    id: 'lec-orig-neet-cell',
    title: 'Cell Cycle & Mitosis — VIDYORA Visual Studio Lecture',
    description:
      'NCERT Class 11 & NEET Biology ke liye Prophase, Metaphase, Anaphase aur Telophase ka crystal-clear visual breakdown aur memory tricks.',
    sourceType: 'original',
    category: 'NEET',
    className: 'NEET UG / Class 11',
    subject: 'Biology',
    chapterNumber: 10,
    chapterName: 'Cell Cycle and Cell Division',
    teacherName: 'Dr. Meera Nair (VIDYORA Original)',
    duration: '12:45',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnailUrl: '/src/assets/images/lesson-biology-cell.png',
    notesSummary:
      'Interphase (G1, S, G2) accounts for >95% of cell cycle. DNA replicates in S phase (2C → 4C) while chromosome number stays 2n.',
    featured: true,
    approvalStatus: 'approved',
    published: true,
    submittedByUid: 'vidyora-system',
  },
  {
    id: 'lec-yt-upsc-polity',
    title: 'Indian Constitution — Fundamental Rights (Articles 12–35)',
    description:
      'UPSC Prelims aur Mains perspective se Part III Fundamental Rights, writs (Article 32) aur landmark Supreme Court doctrines ka clear explanation.',
    sourceType: 'youtube',
    category: 'UPSC',
    className: 'UPSC CSE GS-2',
    subject: 'Indian Polity',
    chapterNumber: 7,
    chapterName: 'Fundamental Rights',
    teacherName: 'Polity Educator',
    channelName: 'Sansad TV / Educational Archive',
    duration: '18:30',
    videoUrl: 'https://www.youtube.com/watch?v=8aGhZQkoFbQ',
    thumbnailUrl: '/src/assets/images/lesson-gk-constitution.png',
    notesSummary:
      '6 Fundamental Rights: Equality (14-18), Freedom (19-22), Against Exploitation (23-24), Freedom of Religion (25-28), Cultural & Educational (29-30), Constitutional Remedies (32).',
    featured: false,
    approvalStatus: 'approved',
    published: true,
    submittedByUid: 'vidyora-system',
  },
  {
    id: 'lec-teacher-college-dsa',
    title: 'Binary Trees & Traversals — Inorder, Preorder, Postorder',
    description:
      'Verified faculty lecture explaining recursion trees, DFS traversals aur coding interview patterns simple Hinglish mein.',
    sourceType: 'teacher',
    category: 'College Education',
    className: 'B.Tech / B.Sc CS',
    subject: 'Computer Science',
    chapterNumber: 5,
    chapterName: 'Trees & Recursion',
    teacherName: 'Prof. Rohit Verma (Verified Teacher)',
    duration: '15:00',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnailUrl: '/src/assets/images/lesson-cs-trees.png',
    notesSummary:
      'Inorder (L-Root-R) gives sorted order for BST. Time complexity of traversal: O(n), Space complexity: O(h) recursion stack.',
    featured: true,
    approvalStatus: 'approved',
    published: true,
    submittedByUid: 'vidyora-teacher-verified',
  },
  {
    id: 'lec-orig-skills-english',
    title: 'Spoken English & Interview Confidence — Everyday Frameworks',
    description:
      'School presentations, college viva aur job interviews ke liye structured speaking tips aur common grammar fixes.',
    sourceType: 'original',
    category: 'Language Learning',
    className: 'All Levels',
    subject: 'English Communication',
    chapterNumber: 1,
    chapterName: 'Structured Speaking Basics',
    teacherName: 'Ananya Sharma (VIDYORA Original)',
    duration: '10:30',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnailUrl: '/src/assets/images/hero-learning-world.png',
    notesSummary:
      'PREP framework: Point → Reason → Example → Point. Slow pacing aur clear pronunciation confidence badhate hain.',
    featured: false,
    approvalStatus: 'approved',
    published: true,
    submittedByUid: 'vidyora-system',
  },
];
