import { useCallback, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { ExploreSection } from './components/ExploreSection';
import { ExploreVideoHub } from './components/ExploreVideoHub';
import { VideoLessonsSection } from './components/VideoLessonsSection';
import { LessonDetailPage } from './components/LessonDetailPage';
import { AnimationShowcaseSection } from './components/AnimationShowcaseSection';
import {
  AIToolsHomepagePreview,
  AIToolsWorkspace,
} from './components/AIToolsSection';
import { FreeResourcesSection } from './components/FreeResourcesSection';
import { AdminVideoManager } from './components/AdminVideoManager';
import { Footer } from './components/Footer';
import { SignInModal } from './components/SignInModal';
import { FREE_RESOURCES, VIDEO_LESSONS } from './data/educationalContent';
import { auth, googleProvider } from './lib/firebase';
import {
  checkIsAdminInDb,
  loadStudentProgressFromDb,
  saveStudentProgressToDb,
  subscribePublishedVideoLessons,
} from './services/videoRepository';
import { fetchAIStatus } from './utils/aiClient';
import { toggleWatchedLesson } from './utils/eduLogic';
import {
  mergeCatalogLessons,
  recordRecentLesson,
  toggleFavouriteLesson,
} from './utils/videoLogic';
import type {
  AIStatusResponse,
  AIToolTab,
  FirebaseAuthUser,
  LearningCategory,
  LearningLevel,
  PageView,
  QuizAttemptRecord,
  StudentProfile,
  StudyBuddySubject,
  VideoLesson,
} from './types/vidyora';

const STORAGE_KEY = 'vidyora_student_v1';
const GUEST_PROGRESS_KEY = 'vidyora_guest_progress_v1';

interface GuestProgressState {
  watchedLessonIds: string[];
  favouriteLessonIds: string[];
  recentLessonIds: string[];
}

function loadStudentProfile(): StudentProfile | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StudentProfile>;
    if (!parsed || typeof parsed.displayName !== 'string') return null;
    return {
      displayName: parsed.displayName,
      level: parsed.level || 'Class 9-10',
      watchedLessonIds: Array.isArray(parsed.watchedLessonIds)
        ? parsed.watchedLessonIds
        : [],
      favouriteLessonIds: Array.isArray(parsed.favouriteLessonIds)
        ? parsed.favouriteLessonIds
        : [],
      recentLessonIds: Array.isArray(parsed.recentLessonIds)
        ? parsed.recentLessonIds
        : [],
      quizHistory: Array.isArray(parsed.quizHistory) ? parsed.quizHistory : [],
      completedPlanBlockIds: Array.isArray(parsed.completedPlanBlockIds)
        ? parsed.completedPlanBlockIds
        : [],
    };
  } catch {
    return null;
  }
}

function loadGuestProgress(): GuestProgressState {
  try {
    const raw = window.localStorage.getItem(GUEST_PROGRESS_KEY);
    if (!raw) {
      return { watchedLessonIds: [], favouriteLessonIds: [], recentLessonIds: [] };
    }
    const parsed = JSON.parse(raw) as Partial<GuestProgressState>;
    return {
      watchedLessonIds: Array.isArray(parsed.watchedLessonIds)
        ? parsed.watchedLessonIds
        : [],
      favouriteLessonIds: Array.isArray(parsed.favouriteLessonIds)
        ? parsed.favouriteLessonIds
        : [],
      recentLessonIds: Array.isArray(parsed.recentLessonIds)
        ? parsed.recentLessonIds
        : [],
    };
  } catch {
    return { watchedLessonIds: [], favouriteLessonIds: [], recentLessonIds: [] };
  }
}

export default function App() {
  const [activeView, setActiveView] = useState<PageView>('home');
  const [lessonReturnView, setLessonReturnView] = useState<PageView>('explore');
  const [selectedCategory, setSelectedCategory] = useState<LearningCategory>('all');
  const [exploreInitialCategory, setExploreInitialCategory] = useState<
    Exclude<LearningCategory, 'all'> | undefined
  >(undefined);
  const [exploreNavSeed, setExploreNavSeed] = useState(0);

  const [activeAITool, setActiveAITool] = useState<AIToolTab>('study-buddy');
  const [aiPrefillPrompt, setAiPrefillPrompt] = useState<string>('');
  const [aiPrefillSubject, setAiPrefillSubject] = useState<StudyBuddySubject | undefined>(undefined);
  const [quizPrefillTopic, setQuizPrefillTopic] = useState<string>('');
  const [activeLesson, setActiveLesson] = useState<VideoLesson | null>(null);
  const [signInOpen, setSignInOpen] = useState(false);

  const [student, setStudent] = useState<StudentProfile | null>(() => loadStudentProfile());
  const [guestProgress, setGuestProgress] = useState<GuestProgressState>(() =>
    loadGuestProgress()
  );
  const [aiStatus, setAiStatus] = useState<AIStatusResponse | null>(null);

  // Firebase Auth & Firestore Video Catalog State
  const [authUser, setAuthUser] = useState<FirebaseAuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dbPublishedLessons, setDbPublishedLessons] = useState<VideoLesson[]>([]);

  // Fetch AI service status from secure backend
  useEffect(() => {
    let active = true;
    fetchAIStatus()
      .then((status) => {
        if (active) setAiStatus(status);
      })
      .catch(() => {
        if (active) {
          setAiStatus({
            configured: false,
            model: 'gemini-4-hydrogen',
            rateLimit: {
              maxRequests: 15,
              windowMinutes: 15,
              remaining: 0,
              dailyLimit: 40,
              dailyRemaining: 0,
            },
            disclaimer:
              'AI answers sirf learning aur revision ke liye hain — important exams ke liye apni textbook ya teacher se verify karein.',
          });
        }
      });
    return () => {
      active = false;
    };
  }, []);

  // Subscribe to published lessons from Firestore (merged cleanly with demonstration samples)
  useEffect(() => {
    const unsubscribe = subscribePublishedVideoLessons(
      (lessons) => {
        setDbPublishedLessons(lessons);
      },
      () => {
        // Keep built-in demonstration catalog available even if offline
      }
    );
    return () => unsubscribe();
  }, []);

  const persistStudent = useCallback((next: StudentProfile | null) => {
    setStudent(next);
    try {
      if (next) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Ignore storage quota errors in private browsing
    }
  }, []);

  const persistGuestProgress = useCallback((next: GuestProgressState) => {
    setGuestProgress(next);
    try {
      window.localStorage.setItem(GUEST_PROGRESS_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage quota errors in private browsing
    }
  }, []);

  const syncProgressToCloud = useCallback(
    (
      uid: string,
      displayName: string,
      level: LearningLevel,
      watched: string[],
      favourites: string[],
      recent: string[]
    ) => {
      saveStudentProgressToDb(uid, {
        displayName,
        level,
        completedLessonIds: watched,
        favouriteLessonIds: favourites,
        recentLessonIds: recent,
      }).catch(() => {
        // Cloud sync failures should not block local learning interactions
      });
    },
    []
  );

  // Listen to Firebase Auth state & load cloud progress on sign-in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setAuthUser(null);
        setAuthLoading(false);
        return;
      }

      const isAdmin = await checkIsAdminInDb(
        fbUser.uid,
        fbUser.email,
        fbUser.emailVerified
      );
      const nextAuthUser: FirebaseAuthUser = {
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Student',
        photoURL: fbUser.photoURL,
        emailVerified: fbUser.emailVerified,
        isAdmin,
      };
      setAuthUser(nextAuthUser);
      setAuthLoading(false);

      // Load & merge cloud student progress when signed in
      try {
        const cloud = await loadStudentProgressFromDb(fbUser.uid);
        const localProfile = loadStudentProfile();
        const localGuest = loadGuestProgress();

        const mergedWatched = Array.from(
          new Set([
            ...(cloud?.completedLessonIds ?? []),
            ...(localProfile?.watchedLessonIds ?? []),
            ...localGuest.watchedLessonIds,
          ])
        );
        const mergedFavourites = Array.from(
          new Set([
            ...(cloud?.favouriteLessonIds ?? []),
            ...(localProfile?.favouriteLessonIds ?? []),
            ...localGuest.favouriteLessonIds,
          ])
        );
        const mergedRecent = Array.from(
          new Set([
            ...(cloud?.recentLessonIds ?? []),
            ...(localProfile?.recentLessonIds ?? []),
            ...localGuest.recentLessonIds,
          ])
        ).slice(0, 12);

        const mergedProfile: StudentProfile = {
          displayName:
            cloud?.displayName ||
            localProfile?.displayName ||
            nextAuthUser.displayName,
          level: cloud?.level || localProfile?.level || 'Class 9-10',
          watchedLessonIds: mergedWatched,
          favouriteLessonIds: mergedFavourites,
          recentLessonIds: mergedRecent,
          quizHistory: localProfile?.quizHistory ?? [],
          completedPlanBlockIds: localProfile?.completedPlanBlockIds ?? [],
        };

        persistStudent(mergedProfile);
        if (fbUser.emailVerified) {
          syncProgressToCloud(
            fbUser.uid,
            mergedProfile.displayName,
            mergedProfile.level,
            mergedWatched,
            mergedFavourites,
            mergedRecent
          );
        }
      } catch {
        // Fallback smoothly to local profile
      }
    });

    return () => unsubscribe();
  }, [persistStudent, syncProgressToCloud]);

  const allLessons = useMemo(
    () => mergeCatalogLessons(VIDEO_LESSONS, dbPublishedLessons),
    [dbPublishedLessons]
  );

  const watchedLessonIds = student
    ? student.watchedLessonIds
    : guestProgress.watchedLessonIds;
  const favouriteLessonIds = student
    ? student.favouriteLessonIds
    : guestProgress.favouriteLessonIds;
  const recentLessonIds = student
    ? student.recentLessonIds
    : guestProgress.recentLessonIds;
  const defaultLevel: LearningLevel = student?.level ?? 'Class 9-10';

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in popup band ho gaya. Dobara click karke login karein.');
      }
      throw new Error(
        'Google Sign-In complete nahi ho paya. Popup blocker check karein ya dobara try karein.'
      );
    }
  };

  const handleGoogleSignOut = async () => {
    await signOut(auth);
  };

  const handleNavigate = (view: PageView, sectionId?: string) => {
    if (view === 'explore') {
      setExploreInitialCategory(undefined);
      setExploreNavSeed((s) => s + 1);
    }
    setActiveView(view);
    if (view !== 'lesson-detail') {
      setActiveLesson(null);
    }
    if (view === 'home' && sectionId) {
      window.setTimeout(() => {
        if (sectionId === 'top') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
        }
      }, 40);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSelectExploreCategory = (category: Exclude<LearningCategory, 'all'>) => {
    setSelectedCategory(category);
    setExploreInitialCategory(category);
    setExploreNavSeed((s) => s + 1);
    setActiveView('explore');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenLessonPage = (
    lesson: VideoLesson,
    returnView?: PageView
  ) => {
    setLessonReturnView(
      returnView || (activeView === 'lesson-detail' ? lessonReturnView : activeView)
    );
    setActiveLesson(lesson);
    setActiveView('lesson-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Record in recently watched list
    if (student) {
      const nextRecent = recordRecentLesson(student.recentLessonIds, lesson.id);
      const updated = { ...student, recentLessonIds: nextRecent };
      persistStudent(updated);
      if (authUser?.emailVerified) {
        syncProgressToCloud(
          authUser.uid,
          updated.displayName,
          updated.level,
          updated.watchedLessonIds,
          updated.favouriteLessonIds,
          nextRecent
        );
      }
    } else {
      const nextRecent = recordRecentLesson(guestProgress.recentLessonIds, lesson.id);
      persistGuestProgress({ ...guestProgress, recentLessonIds: nextRecent });
    }
  };

  const handleOpenAITool = (tool: AIToolTab) => {
    setActiveAITool(tool);
    setActiveView('ai-suite');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAskAIBuddyFromLesson = (
    prompt: string,
    subject?: StudyBuddySubject
  ) => {
    setAiPrefillPrompt(prompt);
    setAiPrefillSubject(subject);
    setActiveAITool('study-buddy');
    setActiveView('ai-suite');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartQuizFromLesson = (topic: string) => {
    setQuizPrefillTopic(topic);
    setActiveAITool('quiz');
    setActiveView('ai-suite');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleWatched = (lessonId: string) => {
    if (student) {
      const updated = toggleWatchedLesson(student, lessonId);
      persistStudent(updated);
      if (authUser?.emailVerified) {
        syncProgressToCloud(
          authUser.uid,
          updated.displayName,
          updated.level,
          updated.watchedLessonIds,
          updated.favouriteLessonIds,
          updated.recentLessonIds
        );
      }
    } else {
      const nextWatched = guestProgress.watchedLessonIds.includes(lessonId)
        ? guestProgress.watchedLessonIds.filter((id) => id !== lessonId)
        : [...guestProgress.watchedLessonIds, lessonId];
      persistGuestProgress({ ...guestProgress, watchedLessonIds: nextWatched });
    }
  };

  const handleToggleFavourite = (lessonId: string) => {
    if (student) {
      const nextFavourites = toggleFavouriteLesson(student.favouriteLessonIds, lessonId);
      const updated = { ...student, favouriteLessonIds: nextFavourites };
      persistStudent(updated);
      if (authUser?.emailVerified) {
        syncProgressToCloud(
          authUser.uid,
          updated.displayName,
          updated.level,
          updated.watchedLessonIds,
          nextFavourites,
          updated.recentLessonIds
        );
      }
    } else {
      const nextFavourites = toggleFavouriteLesson(
        guestProgress.favouriteLessonIds,
        lessonId
      );
      persistGuestProgress({ ...guestProgress, favouriteLessonIds: nextFavourites });
    }
  };

  const handleSaveProfile = (displayName: string, level: LearningLevel) => {
    const mergedWatched = Array.from(
      new Set([
        ...(student?.watchedLessonIds ?? []),
        ...guestProgress.watchedLessonIds,
      ])
    );
    const mergedFavourites = Array.from(
      new Set([
        ...(student?.favouriteLessonIds ?? []),
        ...guestProgress.favouriteLessonIds,
      ])
    );
    const mergedRecent = Array.from(
      new Set([
        ...(student?.recentLessonIds ?? []),
        ...guestProgress.recentLessonIds,
      ])
    ).slice(0, 12);

    const nextProfile: StudentProfile = {
      displayName,
      level,
      watchedLessonIds: mergedWatched,
      favouriteLessonIds: mergedFavourites,
      recentLessonIds: mergedRecent,
      quizHistory: student?.quizHistory ?? [],
      completedPlanBlockIds: student?.completedPlanBlockIds ?? [],
    };
    persistStudent(nextProfile);

    if (authUser?.emailVerified) {
      syncProgressToCloud(
        authUser.uid,
        nextProfile.displayName,
        nextProfile.level,
        mergedWatched,
        mergedFavourites,
        mergedRecent
      );
    }
  };

  const handleSaveQuizAttempt = (record: QuizAttemptRecord) => {
    if (!student) return;
    persistStudent({
      ...student,
      quizHistory: [record, ...student.quizHistory].slice(0, 20),
    });
  };

  const handleRemainingUpdate = (remaining: number, dailyRemaining?: number) => {
    setAiStatus((prev) =>
      prev
        ? {
            ...prev,
            rateLimit: {
              ...prev.rateLimit,
              remaining,
              dailyRemaining:
                typeof dailyRemaining === 'number'
                  ? dailyRemaining
                  : prev.rateLimit.dailyRemaining,
            },
          }
        : prev
    );
  };

  const chapterLessons = useMemo(() => {
    if (!activeLesson) return [];
    const matching = allLessons.filter(
      (l) =>
        l.published &&
        l.className === activeLesson.className &&
        l.subject === activeLesson.subject &&
        l.chapterNumber === activeLesson.chapterNumber
    );
    if (!matching.some((l) => l.id === activeLesson.id)) {
      return [activeLesson, ...matching];
    }
    return matching;
  }, [activeLesson, allLessons]);

  const relatedLessons = useMemo(() => {
    if (!activeLesson) return [];
    return allLessons
      .filter((l) => l.published && l.id !== activeLesson.id)
      .sort((a, b) => {
        const aScore =
          (a.className === activeLesson.className ? 2 : 0) +
          (a.subject === activeLesson.subject ? 2 : 0) +
          (a.category === activeLesson.category ? 1 : 0);
        const bScore =
          (b.className === activeLesson.className ? 2 : 0) +
          (b.subject === activeLesson.subject ? 2 : 0) +
          (b.category === activeLesson.category ? 1 : 0);
        return bScore - aScore;
      })
      .slice(0, 3);
  }, [activeLesson, allLessons]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0B1221] overflow-x-hidden">
      <Navbar
        activeView={activeView}
        onNavigate={handleNavigate}
        student={student}
        authUser={authUser}
        onOpenSignIn={() => setSignInOpen(true)}
      />

      <main className="flex-1">
        {activeView === 'home' && (
          <>
            <HeroSection
              onStartLearning={() => handleNavigate('explore')}
              onExploreAITutor={() => handleOpenAITool('study-buddy')}
            />
            <ExploreSection
              selectedCategory={selectedCategory}
              onSelectCategory={handleSelectExploreCategory}
            />
            <VideoLessonsSection
              lessons={allLessons}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              watchedLessonIds={watchedLessonIds}
              favouriteLessonIds={favouriteLessonIds}
              recentLessonIds={recentLessonIds}
              onWatchLesson={(lesson) => handleOpenLessonPage(lesson, 'home')}
              onToggleFavourite={handleToggleFavourite}
              onOpenExploreHub={() => handleNavigate('explore')}
            />
            <AnimationShowcaseSection />
            <AIToolsHomepagePreview
              aiStatus={aiStatus}
              onOpenTool={handleOpenAITool}
            />
            <FreeResourcesSection resources={FREE_RESOURCES} />
          </>
        )}

        {activeView === 'explore' && (
          <ExploreVideoHub
            key={`${exploreInitialCategory ?? 'root'}-${exploreNavSeed}`}
            lessons={allLessons}
            initialCategory={exploreInitialCategory}
            watchedLessonIds={watchedLessonIds}
            favouriteLessonIds={favouriteLessonIds}
            recentLessonIds={recentLessonIds}
            isAdmin={Boolean(authUser?.isAdmin)}
            onOpenLesson={(lesson) => handleOpenLessonPage(lesson, 'explore')}
            onToggleFavourite={handleToggleFavourite}
            onOpenAdminCMS={() => handleNavigate('admin-cms')}
          />
        )}

        {activeView === 'video-lessons' && (
          <VideoLessonsSection
            lessons={allLessons}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            watchedLessonIds={watchedLessonIds}
            favouriteLessonIds={favouriteLessonIds}
            recentLessonIds={recentLessonIds}
            onWatchLesson={(lesson) => handleOpenLessonPage(lesson, 'video-lessons')}
            onToggleFavourite={handleToggleFavourite}
            onOpenExploreHub={() => handleNavigate('explore')}
            isStandalonePage
          />
        )}

        {activeView === 'lesson-detail' && activeLesson && (
          <LessonDetailPage
            lesson={activeLesson}
            chapterLessons={chapterLessons}
            relatedLessons={relatedLessons}
            watchedLessonIds={watchedLessonIds}
            isWatched={watchedLessonIds.includes(activeLesson.id)}
            isFavourite={favouriteLessonIds.includes(activeLesson.id)}
            onToggleWatched={handleToggleWatched}
            onToggleFavourite={handleToggleFavourite}
            onBack={() =>
              handleNavigate(
                lessonReturnView === 'lesson-detail' ? 'explore' : lessonReturnView
              )
            }
            onSelectLesson={(lesson) => handleOpenLessonPage(lesson)}
            onAskAIBuddy={handleAskAIBuddyFromLesson}
            onStartChapterQuiz={handleStartQuizFromLesson}
          />
        )}

        {activeView === 'ai-suite' && (
          <AIToolsWorkspace
            activeTool={activeAITool}
            onSelectTool={setActiveAITool}
            aiStatus={aiStatus}
            defaultLevel={defaultLevel}
            authUser={authUser}
            onOpenSignIn={() => setSignInOpen(true)}
            prefillPrompt={aiPrefillPrompt}
            prefillSubject={aiPrefillSubject}
            onConsumePrefill={() => {
              setAiPrefillPrompt('');
              setAiPrefillSubject(undefined);
            }}
            prefillQuizTopic={quizPrefillTopic}
            onConsumePrefillQuizTopic={() => setQuizPrefillTopic('')}
            onAskFollowUpInBuddy={handleAskAIBuddyFromLesson}
            onGeneratePracticeQuiz={handleStartQuizFromLesson}
            onRemainingUpdate={handleRemainingUpdate}
            onSaveQuizAttempt={handleSaveQuizAttempt}
          />
        )}

        {activeView === 'free-notes' && (
          <FreeResourcesSection
            resources={FREE_RESOURCES}
            initialCategory={selectedCategory}
            isStandalonePage
          />
        )}

        {activeView === 'admin-cms' && (
          <AdminVideoManager
            authUser={authUser}
            authLoading={authLoading}
            onGoogleSignIn={handleGoogleSignIn}
            onPreviewLesson={(lesson) => handleOpenLessonPage(lesson, 'admin-cms')}
          />
        )}
      </main>

      <Footer onNavigate={handleNavigate} onOpenAITool={handleOpenAITool} />

      {signInOpen && (
        <SignInModal
          student={student}
          authUser={authUser}
          onGoogleSignIn={handleGoogleSignIn}
          onGoogleSignOut={handleGoogleSignOut}
          onOpenAdminCMS={() => {
            setSignInOpen(false);
            handleNavigate('admin-cms');
          }}
          onSaveProfile={handleSaveProfile}
          onSignOut={() => persistStudent(null)}
          onClose={() => setSignInOpen(false)}
        />
      )}
    </div>
  );
}
