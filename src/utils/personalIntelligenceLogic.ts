import type {
  FreeResource,
  LearningPackageId,
  QuizAttemptRecord,
  VideoLesson,
} from '../types/vidyora';

export interface PersonalIntelligencePrefs {
  enabled: boolean;
  focusSubjects: string[];
  preferredDifficulty: 'All' | 'Beginner' | 'Intermediate' | 'Advanced';
  goalNote: string;
}

export interface LearningRecommendation {
  id: string;
  kind: 'next-lesson' | 'revise-topic' | 'practice-quiz' | 'study-note';
  title: string;
  subject: string;
  reason: string;
  targetLessonId?: string;
  targetTopic?: string;
  targetResourceId?: string;
}

export interface LearningImpactMetrics {
  lessonsCompleted: number;
  quizzesCompleted: number;
  topicsMastered: string[];
  weakTopicsToRevise: string[];
  practiceImprovementDelta: number | null; // % change from first half to recent half of quizzes
  revisionConsistencyDays: number;
}

export const DEFAULT_PERSONAL_PREFS: PersonalIntelligencePrefs = {
  enabled: true,
  focusSubjects: [],
  preferredDifficulty: 'All',
  goalNote: '',
};

/**
 * Computes transparent, evidence-based student learning impact metrics.
 * Deliberately excludes screen time so only genuine learning actions count.
 */
export function computeLearningImpactMetrics(input: {
  watchedLessonIds: string[];
  quizHistory: QuizAttemptRecord[];
  studyActivityDates?: string[];
}): LearningImpactMetrics {
  const uniqueLessons = new Set(input.watchedLessonIds);
  const quizzes = input.quizHistory || [];

  const topicScores = new Map<string, number[]>();
  const weakSet = new Set<string>();

  for (const q of quizzes) {
    const label = (q.topic || q.title || q.subject || 'General').trim();
    if (label) {
      const arr = topicScores.get(label) || [];
      arr.push(q.percentage);
      topicScores.set(label, arr);
    }
    if (Array.isArray(q.weakTopics)) {
      for (const wt of q.weakTopics) {
        if (wt.trim()) weakSet.add(wt.trim());
      }
    }
    if (q.percentage < 60 && label) {
      weakSet.add(label);
    }
  }

  const topicsMastered: string[] = [];
  for (const [topic, scores] of topicScores.entries()) {
    const best = Math.max(...scores);
    if (best >= 80) {
      topicsMastered.push(topic);
      weakSet.delete(topic);
    }
  }

  // Improvement delta requires at least 2 quizzes (quizHistory is newest-first)
  let practiceImprovementDelta: number | null = null;
  if (quizzes.length >= 2) {
    const chronological = [...quizzes].reverse();
    const mid = Math.floor(chronological.length / 2);
    const earlier = chronological.slice(0, mid);
    const recent = chronological.slice(mid);
    const avg = (arr: QuizAttemptRecord[]) =>
      arr.reduce((sum, item) => sum + item.percentage, 0) / arr.length;
    practiceImprovementDelta = Math.round(avg(recent) - avg(earlier));
  }

  const dateSet = new Set<string>(
    (input.studyActivityDates || []).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
  );
  for (const q of quizzes) {
    if (q.completedAt && q.completedAt.length >= 10) {
      dateSet.add(q.completedAt.slice(0, 10));
    }
  }

  return {
    lessonsCompleted: uniqueLessons.size,
    quizzesCompleted: quizzes.length,
    topicsMastered,
    weakTopicsToRevise: Array.from(weakSet).slice(0, 6),
    practiceImprovementDelta,
    revisionConsistencyDays: dateSet.size,
  };
}

/**
 * Generates student-controllable, explainable learning recommendations
 * without making unsupported claims about student ability.
 */
export function generatePersonalRecommendations(input: {
  lessons: VideoLesson[];
  resources: FreeResource[];
  watchedLessonIds: string[];
  favouriteLessonIds: string[];
  quizHistory: QuizAttemptRecord[];
  selectedPackageId?: LearningPackageId;
  prefs: PersonalIntelligencePrefs;
}): LearningRecommendation[] {
  if (!input.prefs.enabled) {
    return [];
  }

  const recommendations: LearningRecommendation[] = [];
  const watchedSet = new Set(input.watchedLessonIds);
  const favLessons = input.lessons.filter((l) => input.favouriteLessonIds.includes(l.id));
  const preferredSubjects = new Set<string>([
    ...input.prefs.focusSubjects.map((s) => s.toLowerCase()),
    ...favLessons.map((l) => l.subject.toLowerCase()),
  ]);

  const metrics = computeLearningImpactMetrics({
    watchedLessonIds: input.watchedLessonIds,
    quizHistory: input.quizHistory,
  });

  // 1. Weak topics from real quiz performance -> Revision & Practice recommendation
  for (const weakTopic of metrics.weakTopicsToRevise.slice(0, 2)) {
    recommendations.push({
      id: `revise-${weakTopic.toLowerCase().replace(/\s+/g, '-')}`,
      kind: 'revise-topic',
      title: `Revise: ${weakTopic}`,
      subject: weakTopic,
      reason: 'Suggested because a recent practice quiz showed room to strengthen this topic.',
      targetTopic: weakTopic,
    });
  }

  // 2. Next uncompleted lessons matching selected package / focus subjects / difficulty
  const packageCategoryMap: Record<string, VideoLesson['category']> = {
    school: 'school',
    college: 'college',
    competitive: 'competitive',
  };
  const targetCategory = input.selectedPackageId
    ? packageCategoryMap[input.selectedPackageId]
    : undefined;

  const candidateLessons = input.lessons
    .filter((l) => l.published && !watchedSet.has(l.id))
    .map((lesson) => {
      let score = 0;
      const reasons: string[] = [];

      if (preferredSubjects.has(lesson.subject.toLowerCase())) {
        score += 4;
        reasons.push(`matches your saved/focus subject (${lesson.subject})`);
      }
      if (targetCategory && lesson.category === targetCategory) {
        score += 3;
        reasons.push(`part of your selected ${input.selectedPackageId} learning package`);
      }
      if (
        input.prefs.preferredDifficulty !== 'All' &&
        lesson.difficulty === input.prefs.preferredDifficulty
      ) {
        score += 2;
        reasons.push(`matches your chosen ${lesson.difficulty} difficulty preference`);
      }
      if (
        input.prefs.goalNote.trim() &&
        `${lesson.title} ${lesson.subject} ${lesson.chapterName}`
          .toLowerCase()
          .includes(input.prefs.goalNote.trim().toLowerCase())
      ) {
        score += 5;
        reasons.push(`directly matches your study goal "${input.prefs.goalNote.trim()}"`);
      }

      return {
        lesson,
        score,
        reason:
          reasons.length > 0
            ? `Recommended because it ${reasons.join(' and ')}.`
            : `Suggested next step in ${lesson.className} ${lesson.subject} (Chapter ${lesson.chapterNumber}).`,
      };
    })
    .sort((a, b) => b.score - a.score || a.lesson.chapterNumber - b.lesson.chapterNumber)
    .slice(0, 3);

  for (const item of candidateLessons) {
    recommendations.push({
      id: `lesson-${item.lesson.id}`,
      kind: 'next-lesson',
      title: item.lesson.title,
      subject: `${item.lesson.className} · ${item.lesson.subject}`,
      reason: item.reason,
      targetLessonId: item.lesson.id,
    });
  }

  // 3. Practice activity if student watched lessons but has taken few quizzes
  if (input.watchedLessonIds.length > 0 && input.quizHistory.length < input.watchedLessonIds.length) {
    const latestWatched = input.lessons.find(
      (l) => l.id === input.watchedLessonIds[input.watchedLessonIds.length - 1]
    );
    if (latestWatched) {
      recommendations.push({
        id: `quiz-${latestWatched.id}`,
        kind: 'practice-quiz',
        title: `Practice Quiz: ${latestWatched.chapterName}`,
        subject: latestWatched.subject,
        reason: `You completed "${latestWatched.title}" — a short practice quiz helps confirm understanding.`,
        targetTopic: `${latestWatched.subject} - ${latestWatched.chapterName}`,
      });
    }
  }

  // 4. Related Free Study Resource
  const matchedResource =
    input.resources.find(
      (r) =>
        preferredSubjects.has(r.subject.toLowerCase()) ||
        (targetCategory && r.category === targetCategory)
    ) || input.resources[0];

  if (matchedResource) {
    recommendations.push({
      id: `note-${matchedResource.id}`,
      kind: 'study-note',
      title: matchedResource.title,
      subject: matchedResource.subject,
      reason: `Free structured revision note (${matchedResource.format}) aligned with your learning track.`,
      targetResourceId: matchedResource.id,
    });
  }

  return recommendations.slice(0, 6);
}
