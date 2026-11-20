import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SlidingWindowRateLimiter } from './server/rateLimit.ts';
import { PROTECTED_STARTER_LECTURES } from './src/utils/lectureLogic.ts';
import {
  AI_DISCLAIMER,
  AIServiceError,
  VIDYORA_AI_MODEL,
  askStudyBuddy,
  generateQuiz,
  generateStructuredNotes,
  generateStudyPlan,
  isGeminiConfigured,
  regenerateNoteSection,
  solveDoubtFromImage,
  type NoteRegeneratableSectionParam,
  type NoteTypeParam,
  type QuizDifficultyParam,
  type QuizQuestionTypeParam,
  type QuizTrackParam,
  type StudyBuddyModeParam,
} from './server/geminiService.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const RATE_LIMIT_MAX = 15;
const RATE_LIMIT_WINDOW_MINUTES = 15;
const DAILY_LIMIT_MAX = 40;
const MAX_DOUBT_IMAGE_BASE64_LEN = 5_600_000; // ~4MB binary encoded as base64
const MAX_NOTES_PDF_BASE64_LEN = 8_400_000; // ~6MB PDF encoded as base64

const ALLOWED_NOTE_TYPES = new Set<NoteTypeParam>([
  'Detailed Notes',
  'Short Notes',
  'Quick Revision',
  'Formula Sheets',
  'Important Definitions',
  'Mind Maps',
  'One-page Infographics',
  'Question and Answer Notes',
]);

const ALLOWED_REGENERATE_SECTIONS = new Set<NoteRegeneratableSectionParam>([
  'overview',
  'sections',
  'definitions',
  'formulas',
  'examples',
  'tables',
  'diagram',
  'mindMap',
  'qaPairs',
  'commonMistakes',
  'revisionSummary',
]);

const ALLOWED_STUDY_MODES = new Set<StudyBuddyModeParam>([
  'simple',
  'step-by-step',
  'real-life',
  'short-summary',
  'teacher',
]);

const ALLOWED_STUDY_SUBJECTS = new Set([
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'English',
  'History',
  'Geography',
  'Computer Science',
  'General Knowledge',
]);

const ALLOWED_DOUBT_SUBJECTS = new Set([
  'Auto Detect',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'English',
  'History',
  'Geography',
  'Computer Science',
]);

const rateLimiter = new SlidingWindowRateLimiter(
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_MINUTES,
  DAILY_LIMIT_MAX
);

function getClientKey(req: express.Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim().length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || 'local-student';
}

function handleRouteError(res: express.Response, err: unknown) {
  if (err instanceof AIServiceError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      disclaimer: AI_DISCLAIMER,
    });
  }
  return res.status(500).json({
    error: 'Unexpected server error aaya hai. Please thodi der baad retry karein.',
    code: 'INTERNAL_ERROR',
    disclaimer: AI_DISCLAIMER,
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '12mb' }));

  // Ensure AI/private API responses are never cached by browsers, proxies, or service workers.
  app.use('/api', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    next();
  });

  // Ensure PWA manifest and service worker always serve with proper MIME/update headers.
  app.use((req, res, next) => {
    if (req.path === '/manifest.webmanifest') {
      res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
    } else if (req.path === '/sw.js') {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Service-Worker-Allowed', '/');
    }
    next();
  });

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'vidyora-web-server',
      aiConfigured: isGeminiConfigured(),
      paymentGatewayConfigured: false,
      paymentGatewayNote: 'Payment gateway not yet connected (Free Plan active; sandbox verification required before paid launch).',
      supportedLanguagesCount: 24,
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/ai/status', (req, res) => {
    const status = rateLimiter.peek(getClientKey(req));
    res.json({
      configured: isGeminiConfigured(),
      model: VIDYORA_AI_MODEL,
      rateLimit: {
        maxRequests: status.limit,
        windowMinutes: status.windowMinutes,
        remaining: status.remaining,
        dailyLimit: status.dailyLimit,
        dailyRemaining: status.dailyRemaining,
      },
      disclaimer: AI_DISCLAIMER,
    });
  });

  function enforceAIGuards(req: express.Request, res: express.Response): boolean {
    if (!isGeminiConfigured()) {
      res.status(503).json({
        error:
          'AI Tutor abhi setup mode mein hai — secure server API configuration complete hone par enable ho jayega.',
        code: 'AI_NOT_CONFIGURED',
        disclaimer: AI_DISCLAIMER,
      });
      return false;
    }

    const limitCheck = rateLimiter.consume(getClientKey(req));
    if (!limitCheck.allowed) {
      const errorMessage =
        limitCheck.limitReason === 'daily'
          ? `Aaj ki daily AI limit (${limitCheck.dailyLimit} requests/day) complete ho gayi hai. Kal dobara fresh quota milega — tab tak Video Lessons aur Free Notes explore karein!`
          : `Short-term AI safety limit (${limitCheck.limit} requests / ${limitCheck.windowMinutes} min) reach ho gayi hai. ${limitCheck.retryAfterSeconds}s baad dobara try karein.`;
      res.status(429).json({
        error: errorMessage,
        code: limitCheck.limitReason === 'daily' ? 'DAILY_LIMIT_REACHED' : 'RATE_LIMITED',
        retryAfterSeconds: limitCheck.retryAfterSeconds,
        disclaimer: AI_DISCLAIMER,
      });
      return false;
    }

    res.setHeader('X-RateLimit-Remaining', String(limitCheck.remaining));
    res.setHeader('X-DailyLimit-Remaining', String(limitCheck.dailyRemaining));
    return true;
  }

  app.post('/api/ai/study-buddy', async (req, res) => {
    if (!enforceAIGuards(req, res)) return;
    try {
      const { question, level, mode, subject, language, history } = req.body ?? {};
      if (typeof question !== 'string' || question.trim().length < 2) {
        return res.status(400).json({
          error: 'Kripya apna sawal likhein (kam se kam 2 characters).',
          code: 'VALIDATION_ERROR',
        });
      }
      if (question.length > 1200) {
        return res.status(400).json({
          error: 'Sawal thoda chhota rakhein (max 1200 characters).',
          code: 'VALIDATION_ERROR',
        });
      }

      const safeMode: StudyBuddyModeParam =
        typeof mode === 'string' && ALLOWED_STUDY_MODES.has(mode as StudyBuddyModeParam)
          ? (mode as StudyBuddyModeParam)
          : 'step-by-step';

      const safeSubject =
        typeof subject === 'string' && ALLOWED_STUDY_SUBJECTS.has(subject)
          ? subject
          : 'General Knowledge';

      const safeLanguage =
        typeof language === 'string' && language.trim().length > 0
          ? language.trim().slice(0, 40)
          : undefined;

      const safeHistory = Array.isArray(history)
        ? history
            .filter(
              (m): m is { role: 'user' | 'assistant'; content: string } =>
                typeof m === 'object' &&
                m !== null &&
                (m.role === 'user' || m.role === 'assistant') &&
                typeof m.content === 'string'
            )
            .slice(-12)
            .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }))
        : [];

      const result = await askStudyBuddy({
        question: question.trim(),
        level: typeof level === 'string' && level.trim() ? level.trim().slice(0, 40) : 'School level',
        mode: safeMode,
        subject: safeSubject,
        language: safeLanguage,
        history: safeHistory,
      });

      const quota = rateLimiter.peek(getClientKey(req));
      return res.json({
        ...result,
        remaining: quota.remaining,
        dailyRemaining: quota.dailyRemaining,
        dailyLimit: quota.dailyLimit,
        disclaimer: AI_DISCLAIMER,
      });
    } catch (err) {
      return handleRouteError(res, err);
    }
  });

  app.post('/api/ai/doubt-solver', async (req, res) => {
    if (!enforceAIGuards(req, res)) return;
    try {
      const { imageBase64, mimeType, note, level, subject, solveStyle } = req.body ?? {};
      const allowedMime = ['image/png', 'image/jpeg', 'image/webp'];
      if (typeof imageBase64 !== 'string' || imageBase64.length < 100) {
        return res.status(400).json({
          error: 'Kripya question ki clear image upload karein.',
          code: 'VALIDATION_ERROR',
        });
      }
      if (imageBase64.length > MAX_DOUBT_IMAGE_BASE64_LEN) {
        return res.status(413).json({
          error: 'Uploaded image 4 MB limit se badi hai. Kripya chhoti ya cropped image upload karein.',
          code: 'IMAGE_TOO_LARGE',
        });
      }
      if (!allowedMime.includes(mimeType)) {
        return res.status(400).json({
          error: 'Unsupported image format! Sirf PNG, JPG ya WebP images supported hain.',
          code: 'VALIDATION_ERROR',
        });
      }

      const safeSubject =
        typeof subject === 'string' && ALLOWED_DOUBT_SUBJECTS.has(subject)
          ? subject
          : 'Auto Detect';

      const safeStyle =
        solveStyle === 'simpler' || solveStyle === 'alternative-method'
          ? solveStyle
          : 'standard';

      const solution = await solveDoubtFromImage({
        imageBase64,
        mimeType,
        note: typeof note === 'string' ? note.slice(0, 500) : '',
        level: typeof level === 'string' && level.trim() ? level.trim().slice(0, 40) : 'School level',
        subject: safeSubject,
        solveStyle: safeStyle,
      });

      const quota = rateLimiter.peek(getClientKey(req));
      return res.json({
        solution,
        remaining: quota.remaining,
        dailyRemaining: quota.dailyRemaining,
        dailyLimit: quota.dailyLimit,
        disclaimer: AI_DISCLAIMER,
      });
    } catch (err) {
      return handleRouteError(res, err);
    }
  });

  app.post('/api/ai/notes', async (req, res) => {
    if (!enforceAIGuards(req, res)) return;
    try {
      const {
        topic,
        chapterName,
        className,
        subject,
        level,
        noteType,
        pastedText,
        attachment,
      } = req.body ?? {};

      const cleanTopic = typeof topic === 'string' ? topic.trim().slice(0, 180) : '';
      const cleanChapter = typeof chapterName === 'string' ? chapterName.trim().slice(0, 140) : '';
      const cleanPasted = typeof pastedText === 'string' ? pastedText.trim().slice(0, 15000) : '';

      let safeAttachment:
        | {
            base64: string;
            mimeType: 'application/pdf' | 'image/png' | 'image/jpeg' | 'image/webp';
            fileName?: string;
          }
        | undefined;

      if (attachment && typeof attachment === 'object') {
        const mime = String(attachment.mimeType || '');
        const b64 = typeof attachment.base64 === 'string' ? attachment.base64 : '';
        const allowedNotesMimes = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];
        if (!allowedNotesMimes.includes(mime)) {
          return res.status(400).json({
            error: 'Unsupported attachment format! Sirf PDF, PNG, JPG ya WebP files supported hain.',
            code: 'VALIDATION_ERROR',
          });
        }
        if (b64.length < 50) {
          return res.status(400).json({
            error: 'Uploaded study file empty ya corrupted lag rahi hai.',
            code: 'VALIDATION_ERROR',
          });
        }
        const maxLen =
          mime === 'application/pdf' ? MAX_NOTES_PDF_BASE64_LEN : MAX_DOUBT_IMAGE_BASE64_LEN;
        if (b64.length > maxLen) {
          return res.status(413).json({
            error:
              mime === 'application/pdf'
                ? 'Uploaded PDF 6 MB limit se bada hai. Kripya chhota chapter PDF upload karein.'
                : 'Uploaded image 4 MB limit se badi hai. Kripya chhoti image upload karein.',
            code: 'FILE_TOO_LARGE',
          });
        }
        safeAttachment = {
          base64: b64,
          mimeType: mime as 'application/pdf' | 'image/png' | 'image/jpeg' | 'image/webp',
          fileName: typeof attachment.fileName === 'string' ? attachment.fileName.slice(0, 120) : undefined,
        };
      }

      if (
        cleanTopic.length < 2 &&
        cleanChapter.length < 2 &&
        cleanPasted.length < 20 &&
        !safeAttachment
      ) {
        return res.status(400).json({
          error:
            'Notes generate karne ke liye topic/chapter likhein, study text paste karein, ya PDF/image upload karein.',
          code: 'VALIDATION_ERROR',
        });
      }

      const safeNoteType: NoteTypeParam =
        typeof noteType === 'string' && ALLOWED_NOTE_TYPES.has(noteType as NoteTypeParam)
          ? (noteType as NoteTypeParam)
          : 'Detailed Notes';

      const notes = await generateStructuredNotes({
        topic: cleanTopic,
        chapterName: cleanChapter,
        className:
          typeof className === 'string' && className.trim()
            ? className.trim().slice(0, 60)
            : typeof level === 'string' && level.trim()
              ? level.trim().slice(0, 60)
              : 'Class 10',
        subject:
          typeof subject === 'string' && subject.trim()
            ? subject.trim().slice(0, 80)
            : 'General Studies',
        level: typeof level === 'string' && level.trim() ? level.trim().slice(0, 60) : 'Class 9-10',
        noteType: safeNoteType,
        pastedText: cleanPasted || undefined,
        attachment: safeAttachment,
      });

      const quota = rateLimiter.peek(getClientKey(req));
      return res.json({
        notes,
        remaining: quota.remaining,
        dailyRemaining: quota.dailyRemaining,
        dailyLimit: quota.dailyLimit,
        disclaimer: AI_DISCLAIMER,
      });
    } catch (err) {
      return handleRouteError(res, err);
    }
  });

  app.post('/api/ai/notes/regenerate-section', async (req, res) => {
    if (!enforceAIGuards(req, res)) return;
    try {
      const { sectionKey, title, className, subject, noteType, contextSummary, instruction } =
        req.body ?? {};
      if (
        typeof sectionKey !== 'string' ||
        !ALLOWED_REGENERATE_SECTIONS.has(sectionKey as NoteRegeneratableSectionParam)
      ) {
        return res.status(400).json({
          error: 'Invalid note section selected for regeneration.',
          code: 'VALIDATION_ERROR',
        });
      }
      if (typeof title !== 'string' || title.trim().length < 2) {
        return res.status(400).json({
          error: 'Note title missing hai.',
          code: 'VALIDATION_ERROR',
        });
      }

      const patch = await regenerateNoteSection({
        sectionKey: sectionKey as NoteRegeneratableSectionParam,
        title: title.trim().slice(0, 160),
        className: typeof className === 'string' ? className.slice(0, 60) : 'Class 10',
        subject: typeof subject === 'string' ? subject.slice(0, 80) : 'General Studies',
        noteType: typeof noteType === 'string' ? noteType.slice(0, 60) : 'Detailed Notes',
        contextSummary: typeof contextSummary === 'string' ? contextSummary.slice(0, 2500) : '',
        instruction: typeof instruction === 'string' ? instruction.slice(0, 300) : undefined,
      });

      const quota = rateLimiter.peek(getClientKey(req));
      return res.json({
        patch,
        remaining: quota.remaining,
        dailyRemaining: quota.dailyRemaining,
        dailyLimit: quota.dailyLimit,
        disclaimer: AI_DISCLAIMER,
      });
    } catch (err) {
      return handleRouteError(res, err);
    }
  });

  app.post('/api/ai/quiz', async (req, res) => {
    if (!enforceAIGuards(req, res)) return;
    try {
      const {
        topic,
        chapterName,
        subject,
        track,
        level,
        count,
        difficulty,
        questionTypes,
        timerMinutes,
      } = req.body ?? {};

      const cleanTopic = typeof topic === 'string' ? topic.trim().slice(0, 180) : '';
      const cleanChapter = typeof chapterName === 'string' ? chapterName.trim().slice(0, 140) : '';

      if (cleanTopic.length < 2 && cleanChapter.length < 2) {
        return res.status(400).json({
          error: 'Quiz ke liye topic ya chapter ka naam enter karein (min 2 characters).',
          code: 'VALIDATION_ERROR',
        });
      }

      const rawCount = Number(count);
      if (count !== undefined && (!Number.isFinite(rawCount) || rawCount < 3 || rawCount > 15)) {
        return res.status(400).json({
          error: 'Number of questions 3 se 15 ke beech hone chahiye.',
          code: 'VALIDATION_ERROR',
        });
      }

      const allowedTracks = new Set<QuizTrackParam>(['school', 'college', 'competitive']);
      const safeTrack: QuizTrackParam =
        typeof track === 'string' && allowedTracks.has(track as QuizTrackParam)
          ? (track as QuizTrackParam)
          : 'school';

      const allowedDiffs = new Set<QuizDifficultyParam>(['Easy', 'Medium', 'Hard', 'Mixed']);
      const safeDifficulty: QuizDifficultyParam =
        typeof difficulty === 'string' && allowedDiffs.has(difficulty as QuizDifficultyParam)
          ? (difficulty as QuizDifficultyParam)
          : 'Mixed';

      const allowedQTypes = new Set<QuizQuestionTypeParam>([
        'mcq',
        'true-false',
        'fill-blank',
        'short-answer',
        'numerical',
        'assertion-reason',
        'match-following',
      ]);

      let safeQuestionTypes: QuizQuestionTypeParam[] = ['mcq'];
      if (Array.isArray(questionTypes)) {
        const filtered = questionTypes.filter(
          (t): t is QuizQuestionTypeParam =>
            typeof t === 'string' && allowedQTypes.has(t as QuizQuestionTypeParam)
        );
        if (questionTypes.length > 0 && filtered.length === 0) {
          return res.status(400).json({
            error: 'Invalid question type selected. Supported types mein se choose karein.',
            code: 'VALIDATION_ERROR',
          });
        }
        if (filtered.length > 0) {
          safeQuestionTypes = Array.from(new Set(filtered));
        }
      }

      const quiz = await generateQuiz({
        topic: cleanTopic || cleanChapter,
        chapterName: cleanChapter || undefined,
        subject:
          typeof subject === 'string' && subject.trim()
            ? subject.trim().slice(0, 80)
            : 'General Studies',
        track: safeTrack,
        level: typeof level === 'string' && level.trim() ? level.trim().slice(0, 60) : 'Class 10',
        count: Number.isFinite(rawCount) ? Math.round(rawCount) : 5,
        difficulty: safeDifficulty,
        questionTypes: safeQuestionTypes,
        timerMinutes:
          typeof timerMinutes === 'number' && Number.isFinite(timerMinutes)
            ? Math.max(0, Math.min(120, Math.round(timerMinutes)))
            : 0,
      });

      const quota = rateLimiter.peek(getClientKey(req));
      return res.json({
        quiz,
        remaining: quota.remaining,
        dailyRemaining: quota.dailyRemaining,
        dailyLimit: quota.dailyLimit,
        disclaimer: AI_DISCLAIMER,
      });
    } catch (err) {
      return handleRouteError(res, err);
    }
  });

  app.post('/api/ai/study-planner', async (req, res) => {
    if (!enforceAIGuards(req, res)) return;
    try {
      const { goal, level, timelineDays, dailyHours, focusSubjects } = req.body ?? {};
      if (typeof goal !== 'string' || goal.trim().length < 3) {
        return res.status(400).json({
          error: 'Apna learning goal clearly likhein (jaise: Class 10 Science Boards).',
          code: 'VALIDATION_ERROR',
        });
      }

      const plan = await generateStudyPlan({
        goal: goal.trim().slice(0, 200),
        level: typeof level === 'string' && level.trim() ? level.trim() : 'Class 9-10',
        timelineDays: Number(timelineDays) || 30,
        dailyHours: Number(dailyHours) || 3,
        focusSubjects: typeof focusSubjects === 'string' ? focusSubjects.slice(0, 200) : '',
      });

      const quota = rateLimiter.peek(getClientKey(req));
      return res.json({
        plan,
        remaining: quota.remaining,
        dailyRemaining: quota.dailyRemaining,
        disclaimer: AI_DISCLAIMER,
      });
    } catch (err) {
      return handleRouteError(res, err);
    }
  });

  // ------------------------------------------------------------------
  // Members-Only Lectures Backend Enforcement (GET /api/lectures/catalog)
  // Verifies Firebase ID token + active paid membership or admin role server-side.
  // ------------------------------------------------------------------
  const BOOTSTRAP_ADMIN_EMAIL = 'touhidkhan955@gmail.com';
  let firebaseAppletConfig: {
    apiKey?: string;
    projectId?: string;
    firestoreDatabaseId?: string;
  } = {};
  try {
    const rawCfg = fs.readFileSync(
      path.resolve(__dirname, 'firebase-applet-config.json'),
      'utf-8'
    );
    firebaseAppletConfig = JSON.parse(rawCfg);
  } catch {
    // Config missing; endpoint fails closed cleanly
  }

  app.get('/api/lectures/catalog', async (req, res) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : '';

    if (!token) {
      return res.status(401).json({
        error: 'Members-only Lectures access karne ke liye sign in zaroori hai.',
        code: 'UNAUTHENTICATED',
      });
    }

    if (!firebaseAppletConfig.apiKey || !firebaseAppletConfig.projectId) {
      return res.status(503).json({
        error: 'Authentication backend configuration unavailable hai.',
        code: 'AUTH_CONFIG_ERROR',
      });
    }

    try {
      // 1. Verify Firebase ID Token via Identity Toolkit accounts:lookup
      const verifyResp = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(firebaseAppletConfig.apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: token }),
        }
      );

      if (!verifyResp.ok) {
        return res.status(401).json({
          error: 'Invalid ya expired session token. Kripya dobara sign in karein.',
          code: 'INVALID_TOKEN',
        });
      }

      const verifyData = (await verifyResp.json()) as {
        users?: Array<{
          localId?: string;
          email?: string;
          emailVerified?: boolean;
        }>;
      };
      const verifiedUser = verifyData.users?.[0];
      if (!verifiedUser?.localId || !verifiedUser.emailVerified) {
        return res.status(401).json({
          error: 'Verified email account se sign in karein.',
          code: 'EMAIL_NOT_VERIFIED',
        });
      }

      const uid = verifiedUser.localId;
      const dbId = firebaseAppletConfig.firestoreDatabaseId || '(default)';
      const baseFirestore = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(firebaseAppletConfig.projectId)}/databases/${encodeURIComponent(dbId)}/documents`;

      // 2. Check Admin or Verified Active Paid Membership directly in Firestore
      let isAdmin =
        verifiedUser.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();
      if (!isAdmin) {
        const adminDocRes = await fetch(
          `${baseFirestore}/admins/${encodeURIComponent(uid)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (adminDocRes.ok) {
          isAdmin = true;
        }
      }

      let activePlanId: 'free' | 'student' | 'pro' = 'free';
      let hasEligibleMembership = isAdmin;

      if (!hasEligibleMembership) {
        const memRes = await fetch(
          `${baseFirestore}/member_memberships/${encodeURIComponent(uid)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (memRes.ok) {
          const memDoc = (await memRes.json()) as {
            fields?: {
              planId?: { stringValue?: string };
              status?: { stringValue?: string };
            };
          };
          const planVal = memDoc.fields?.planId?.stringValue;
          const statusVal = memDoc.fields?.status?.stringValue;
          if (
            statusVal === 'active' &&
            (planVal === 'student' || planVal === 'pro')
          ) {
            activePlanId = planVal;
            hasEligibleMembership = true;
          }
        }
      } else {
        activePlanId = 'pro';
      }

      if (!hasEligibleMembership) {
        return res.status(403).json({
          error:
            'VIDYORA Lectures members-only section hai. Active Student (₹49/month) ya Pro Learner (₹99/month) membership zaroori hai.',
          code: 'MEMBERSHIP_REQUIRED',
          planId: 'free',
        });
      }

      // 3. Load approved & published Firestore lectures (if any) and merge with protected starter lectures
      const mergedMap = new Map(
        PROTECTED_STARTER_LECTURES.map((l) => [l.id, l])
      );

      if (isAdmin) {
        try {
          const lecRes = await fetch(`${baseFirestore}/lectures?pageSize=100`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (lecRes.ok) {
            const lecData = (await lecRes.json()) as {
              documents?: Array<{
                name: string;
                fields?: Record<string, { stringValue?: string; integerValue?: string; booleanValue?: boolean }>;
              }>;
            };
            for (const docItem of lecData.documents || []) {
              const f = docItem.fields || {};
              const published = Boolean(f.published?.booleanValue);
              const approvalStatus = f.approvalStatus?.stringValue || 'pending';
              if (!published || approvalStatus !== 'approved') continue;
              const id = docItem.name.split('/').pop() || '';
              if (!id) continue;
              mergedMap.set(id, {
                id,
                title: f.title?.stringValue || '',
                description: f.description?.stringValue || '',
                sourceType: (f.sourceType?.stringValue as 'youtube' | 'original' | 'teacher') || 'youtube',
                category: (f.category?.stringValue as typeof PROTECTED_STARTER_LECTURES[number]['category']) || 'Classes 9-10',
                className: f.className?.stringValue || '',
                subject: f.subject?.stringValue || '',
                chapterNumber: Number(f.chapterNumber?.integerValue) || 1,
                chapterName: f.chapterName?.stringValue || '',
                teacherName: f.teacherName?.stringValue || '',
                channelName: f.channelName?.stringValue,
                duration: f.duration?.stringValue || '12:00',
                videoUrl: f.videoUrl?.stringValue || '',
                thumbnailUrl: f.thumbnailUrl?.stringValue || '/src/assets/images/hero-learning-world.png',
                notesSummary: f.notesSummary?.stringValue,
                notesPdfUrl: f.notesPdfUrl?.stringValue,
                featured: Boolean(f.featured?.booleanValue),
                approvalStatus: 'approved',
                published: true,
                submittedByUid: f.submittedByUid?.stringValue || '',
              });
            }
          }
        } catch {
          // Keep starter lectures available even if collection is empty
        }
      }

      return res.json({
        authorized: true,
        planId: activePlanId,
        lectures: Array.from(mergedMap.values()),
      });
    } catch {
      return res.status(500).json({
        error: 'Membership verification complete nahi ho payi. Dobara try karein.',
        code: 'VERIFICATION_FAILED',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VIDYORA server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
