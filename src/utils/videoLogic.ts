import type {
  CurriculumChapter,
  DifficultyLevel,
  LearningCategory,
  VideoLesson,
} from '../types/vidyora';

export interface ParsedVideoSource {
  type: 'youtube' | 'direct-video' | 'invalid';
  embedUrl?: string;
  videoId?: string;
  error?: string;
}

const YOUTUBE_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

/**
 * Parses a legitimate HTTPS YouTube or direct HTML5 video URL into a safe embeddable player URL.
 * Uses youtube-nocookie.com for student privacy and rejects non-HTTPS or unsafe schemes.
 */
export function parseEmbeddableVideo(rawUrl: string): ParsedVideoSource {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return { type: 'invalid', error: 'Video URL khali hai.' };
  }
  if (trimmed.length > 500) {
    return { type: 'invalid', error: 'Video URL 500 characters se chhota hona chahiye.' };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { type: 'invalid', error: 'Valid HTTPS video URL enter karein (jaise YouTube ya MP4 link).' };
  }

  if (parsed.protocol !== 'https:') {
    return { type: 'invalid', error: 'Sirf secure HTTPS video links allowed hain.' };
  }

  const host = parsed.hostname.replace(/^www\./, '').toLowerCase();

  // Handle YouTube watch, embed, shorts, and youtu.be links
  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
    let videoId = parsed.searchParams.get('v') || '';
    if (!videoId && parsed.pathname.startsWith('/embed/')) {
      videoId = parsed.pathname.split('/')[2] || '';
    } else if (!videoId && parsed.pathname.startsWith('/shorts/')) {
      videoId = parsed.pathname.split('/')[2] || '';
    }
    if (YOUTUBE_ID_REGEX.test(videoId)) {
      return {
        type: 'youtube',
        videoId,
        embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`,
      };
    }
    return { type: 'invalid', error: 'Valid YouTube video URL daalein (11-character video ID nahi mila).' };
  }

  if (host === 'youtu.be') {
    const videoId = parsed.pathname.replace(/^\//, '').split('/')[0] || '';
    if (YOUTUBE_ID_REGEX.test(videoId)) {
      return {
        type: 'youtube',
        videoId,
        embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`,
      };
    }
    return { type: 'invalid', error: 'Valid youtu.be short link daalein.' };
  }

  // Handle direct HTTPS video streams (.mp4, .webm, .ogg)
  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(parsed.pathname)) {
    return {
      type: 'direct-video',
      embedUrl: parsed.toString(),
    };
  }

  return {
    type: 'invalid',
    error: 'Supported video URLs: YouTube (youtube.com / youtu.be) ya direct HTTPS .mp4/.webm video link.',
  };
}

export interface ChapterSummary {
  chapter: CurriculumChapter;
  lessons: VideoLesson[];
  lessonCount: number;
  completedCount: number;
  status: 'not-started' | 'in-progress' | 'completed';
}

export function buildChapterSummaries(
  chapters: CurriculumChapter[],
  allLessons: VideoLesson[],
  completedLessonIds: string[]
): ChapterSummary[] {
  const completedSet = new Set(completedLessonIds);

  // Also discover any custom chapters added by Admin via Firestore for the same class + subject
  const mergedChapters = [...chapters];
  const existingKeys = new Set(
    chapters.map((c) => `${c.className}::${c.subject}::${c.chapterNumber}`)
  );

  for (const lesson of allLessons) {
    if (!lesson.published) continue;
    const key = `${lesson.className}::${lesson.subject}::${lesson.chapterNumber}`;
    if (
      chapters.length > 0 &&
      lesson.className === chapters[0].className &&
      lesson.subject === chapters[0].subject &&
      !existingKeys.has(key)
    ) {
      existingKeys.add(key);
      mergedChapters.push({
        id: `custom-${lesson.className}-${lesson.subject}-ch-${lesson.chapterNumber}`,
        category: lesson.category,
        className: lesson.className,
        subject: lesson.subject,
        chapterNumber: lesson.chapterNumber,
        chapterName: lesson.chapterName,
        description: lesson.summary,
      });
    }
  }

  return mergedChapters
    .sort((a, b) => a.chapterNumber - b.chapterNumber)
    .map((chapter) => {
      const chapterLessons = allLessons.filter(
        (l) =>
          l.published &&
          l.className === chapter.className &&
          l.subject === chapter.subject &&
          l.chapterNumber === chapter.chapterNumber
      );
      const completedCount = chapterLessons.filter((l) =>
        completedSet.has(l.id)
      ).length;
      const lessonCount = chapterLessons.length;
      let status: ChapterSummary['status'] = 'not-started';
      if (lessonCount > 0 && completedCount === lessonCount) {
        status = 'completed';
      } else if (completedCount > 0) {
        status = 'in-progress';
      }
      return {
        chapter,
        lessons: chapterLessons,
        lessonCount,
        completedCount,
        status,
      };
    });
}

export function recordRecentLesson(
  recentIds: string[],
  lessonId: string,
  maxItems = 12
): string[] {
  const withoutCurrent = recentIds.filter((id) => id !== lessonId);
  return [lessonId, ...withoutCurrent].slice(0, maxItems);
}

export function toggleFavouriteLesson(
  favouriteIds: string[],
  lessonId: string,
  maxItems = 200
): string[] {
  if (favouriteIds.includes(lessonId)) {
    return favouriteIds.filter((id) => id !== lessonId);
  }
  return [lessonId, ...favouriteIds].slice(0, maxItems);
}

export function mergeCatalogLessons(
  demoLessons: VideoLesson[],
  firestoreLessons: VideoLesson[]
): VideoLesson[] {
  const seen = new Set<string>();
  const merged: VideoLesson[] = [];

  // Firestore published lessons take priority first
  for (const dbLesson of firestoreLessons) {
    if (!seen.has(dbLesson.id)) {
      seen.add(dbLesson.id);
      merged.push(dbLesson);
    }
  }
  for (const demo of demoLessons) {
    if (!seen.has(demo.id)) {
      seen.add(demo.id);
      merged.push(demo);
    }
  }
  return merged;
}

export interface AdminVideoFormInput {
  title: string;
  description: string;
  category: Exclude<LearningCategory, 'all'>;
  className: string;
  subject: string;
  chapterNumber: number;
  chapterName: string;
  duration: string;
  difficulty: Exclude<DifficultyLevel, 'All'>;
  videoUrl: string;
  thumbnailUrl: string;
  notesContent?: string;
}

/**
 * Validates outgoing admin lesson mutations synchronously against firebase-blueprint.json bounds.
 */
export function validateAdminVideoInput(input: AdminVideoFormInput): string | null {
  const title = input.title.trim();
  if (title.length < 3 || title.length > 160) {
    return 'Video title 3 se 160 characters ke beech hona chahiye.';
  }
  const description = input.description.trim();
  if (description.length < 10 || description.length > 1500) {
    return 'Video description kam se kam 10 aur maximum 1500 characters ka hona chahiye.';
  }
  if (!input.className.trim() || input.className.trim().length > 60) {
    return 'Valid Class ya Track select karein.';
  }
  if (!input.subject.trim() || input.subject.trim().length > 80) {
    return 'Valid Subject select karein.';
  }
  if (!Number.isFinite(input.chapterNumber) || input.chapterNumber < 1 || input.chapterNumber > 50) {
    return 'Chapter number 1 se 50 ke beech hona chahiye.';
  }
  if (input.chapterName.trim().length < 2 || input.chapterName.trim().length > 120) {
    return 'Chapter name 2 se 120 characters ka hona chahiye.';
  }
  if (input.duration.trim().length < 3 || input.duration.trim().length > 20) {
    return 'Duration format sahi enter karein (jaise 12:30).';
  }
  const parsedVideo = parseEmbeddableVideo(input.videoUrl);
  if (parsedVideo.type === 'invalid') {
    return parsedVideo.error || 'Valid HTTPS YouTube ya MP4 video URL enter karein.';
  }
  if (!input.thumbnailUrl.trim() || input.thumbnailUrl.trim().length > 350000) {
    return 'Valid thumbnail URL ya compressed thumbnail image select karein (max 350 KB).';
  }
  if (input.notesContent && input.notesContent.length > 8000) {
    return 'Study notes 8000 characters se chhote rakhein.';
  }
  return null;
}

export function generateSafeLessonDocId(className: string, subject: string, title: string): string {
  const slug = `${className}-${subject}-${title}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${slug || 'lesson'}-${suffix}`;
}
