export type LearningCategory =
  | 'all'
  | 'school'
  | 'college'
  | 'competitive'
  | 'gk';

export type LearningLevel =
  | 'Class 1-5'
  | 'Class 6-8'
  | 'Class 9-10'
  | 'Class 11-12'
  | 'College'
  | 'Competitive Exams';

export type StudyBuddyLevel =
  | 'Beginner'
  | 'School level'
  | 'College level'
  | 'Competitive exam level';

export type StudyBuddyMode =
  | 'simple'
  | 'step-by-step'
  | 'real-life'
  | 'short-summary'
  | 'teacher';

export type StudyBuddySubject =
  | 'Mathematics'
  | 'Physics'
  | 'Chemistry'
  | 'Biology'
  | 'English'
  | 'History'
  | 'Geography'
  | 'Computer Science'
  | 'General Knowledge';

export type DoubtSolverSubject =
  | 'Auto Detect'
  | 'Mathematics'
  | 'Physics'
  | 'Chemistry'
  | 'Biology'
  | 'English'
  | 'History'
  | 'Geography'
  | 'Computer Science';

export type DoubtSolveStyle = 'standard' | 'simpler' | 'alternative-method';

export type DifficultyLevel = 'All' | 'Beginner' | 'Intermediate' | 'Advanced';

export type PageView =
  | 'home'
  | 'explore'
  | 'ai-suite'
  | 'video-lessons'
  | 'lectures'
  | 'lesson-detail'
  | 'free-notes'
  | 'dashboard'
  | 'plans'
  | 'packages'
  | 'community'
  | 'innovations'
  | 'ecosystem'
  | 'charity'
  | 'admin-cms';

export type AIToolTab =
  | 'study-buddy'
  | 'doubt-solver'
  | 'notes'
  | 'quiz'
  | 'planner';

export interface LessonStep {
  title: string;
  caption: string;
  formula?: string;
  visualType: 'vector' | 'cell' | 'parabola' | 'tree' | 'orbit' | 'constitution';
  highlightValue: string;
}

export interface RealLifeExample {
  title: string;
  explanation: string;
}

export type QuizTrack = 'school' | 'college' | 'competitive';

export type QuizDifficulty = 'Easy' | 'Medium' | 'Hard' | 'Mixed';

export type QuizQuestionType =
  | 'mcq'
  | 'true-false'
  | 'fill-blank'
  | 'short-answer'
  | 'numerical'
  | 'assertion-reason'
  | 'match-following';

export interface QuizMatchPair {
  left: string;
  right: string;
}

export interface QuizQuestion {
  id: string;
  type?: QuizQuestionType;
  difficulty?: Exclude<QuizDifficulty, 'Mixed'>;
  subtopic?: string;
  question: string;
  assertion?: string;
  reason?: string;
  options: string[];
  correctIndex: number;
  correctAnswerText?: string;
  acceptedAnswers?: string[];
  unit?: string;
  tolerance?: number;
  matchPairs?: QuizMatchPair[];
  explanation: string;
}

export interface VideoLesson {
  id: string;
  title: string;
  subject: string;
  className: string;
  chapterNumber: number;
  chapterName: string;
  chapter: string;
  category: Exclude<LearningCategory, 'all'>;
  level: string;
  difficulty: Exclude<DifficultyLevel, 'All'>;
  duration: string;
  durationMinutes: number;
  animationMode: '2D Animation' | '3D Animation' | 'Digital Whiteboard' | 'Storytelling' | 'Video Lecture';
  thumbnail: string;
  videoUrl?: string;
  notesContent?: string;
  summary: string;
  keyTakeaways: string[];
  realLifeExamples: RealLifeExample[];
  practiceQuestions?: QuizQuestion[];
  steps: LessonStep[];
  published: boolean;
  isDemo: boolean;
  source: 'demo' | 'firestore';
  createdBy?: string;
}

export interface CurriculumChapter {
  id: string;
  category: Exclude<LearningCategory, 'all'>;
  className: string;
  subject: string;
  chapterNumber: number;
  chapterName: string;
  description: string;
}

export interface CurriculumSubject {
  name: string;
  shortDesc: string;
}

export interface CurriculumClass {
  id: string;
  category: Exclude<LearningCategory, 'all'>;
  name: string;
  groupLabel: string;
  subtitle: string;
  subjects: CurriculumSubject[];
}

export interface FreeResource {
  id: string;
  title: string;
  subject: string;
  category: Exclude<LearningCategory, 'all'>;
  level: string;
  format: string;
  pages: number;
  summary: string;
  definitions: Array<{ term: string; meaning: string }>;
  importantPoints: string[];
  formulas: string[];
}

export interface AIStatusResponse {
  configured: boolean;
  model: string;
  rateLimit: {
    maxRequests: number;
    windowMinutes: number;
    remaining: number;
    dailyLimit: number;
    dailyRemaining: number;
  };
  disclaimer: string;
}

export interface StudyBuddyMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  level?: LearningLevel;
  buddyLevel?: StudyBuddyLevel;
  subject?: StudyBuddySubject;
  mode?: StudyBuddyMode;
}

export interface StudyBuddySession {
  id: string;
  title: string;
  level: LearningLevel;
  buddyLevel?: StudyBuddyLevel;
  subject?: StudyBuddySubject;
  mode?: StudyBuddyMode;
  updatedAt: string;
  messages: StudyBuddyMessage[];
  source?: 'local' | 'cloud';
}

export interface SimilarPracticeQuestion {
  question: string;
  hint: string;
  answer: string;
}

export interface DoubtSolution {
  readable: boolean;
  unreadableReason?: string;
  detectedSubject: string;
  subjectTopic: string;
  extractedQuestion: string;
  givenInformation: string[];
  requiredAnswer: string;
  relevantFormulas: string[];
  conceptUsed: string;
  diagramObservations?: string;
  steps: Array<{ stepNumber: number; title: string; explanation: string }>;
  finalAnswer: string;
  finalAnswerExplanation?: string;
  importantLearningPoint: string;
  practiceTip: string;
  similarPracticeQuestion?: SimilarPracticeQuestion;
}

export type NoteType =
  | 'Detailed Notes'
  | 'Short Notes'
  | 'Quick Revision'
  | 'Formula Sheets'
  | 'Important Definitions'
  | 'Mind Maps'
  | 'One-page Infographics'
  | 'Question and Answer Notes';

export type NoteDesignStyle =
  | 'handwritten'
  | 'professional'
  | 'infographic'
  | 'minimal';

export type NoteRegeneratableSection =
  | 'overview'
  | 'sections'
  | 'definitions'
  | 'formulas'
  | 'examples'
  | 'tables'
  | 'diagram'
  | 'mindMap'
  | 'qaPairs'
  | 'commonMistakes'
  | 'revisionSummary';

export interface NoteFormulaItem {
  name: string;
  expression: string;
  variables: string;
  usage?: string;
}

export interface NoteTableItem {
  title: string;
  headers: string[];
  rows: string[][];
}

export interface NoteDiagramSpec {
  title: string;
  diagramType: 'flowchart' | 'cycle' | 'hierarchy' | 'comparison';
  nodes: Array<{ id: string; label: string; detail?: string }>;
  caption: string;
}

export interface NoteMindMapSpec {
  centralTopic: string;
  branches: Array<{ title: string; subtopics: string[] }>;
}

export interface NoteQAPair {
  question: string;
  answer: string;
  marksHint?: string;
}

export interface NoteMistakeItem {
  mistake: string;
  correction: string;
}

export interface GeneratedNotes {
  title: string;
  level: string;
  className?: string;
  subject?: string;
  chapterName?: string;
  noteType?: NoteType;
  sourceUsed?: boolean;
  sourceSummary?: string;
  uncertaintyFlags?: string[];
  overview: string;
  sections: Array<{
    heading: string;
    points: string[];
    sourceTag?: 'From Source' | 'Additional Explanation';
  }>;
  definitions: Array<{ term: string; definition: string }>;
  formulas?: NoteFormulaItem[];
  examples: Array<{ title: string; explanation: string }>;
  tables?: NoteTableItem[];
  diagram?: NoteDiagramSpec;
  mindMap?: NoteMindMapSpec;
  qaPairs?: NoteQAPair[];
  commonMistakes?: NoteMistakeItem[];
  additionalExplanations?: Array<{ title: string; explanation: string }>;
  importantPoints: string[];
  revisionSummary: string;
}

export interface SavedNoteRecord {
  id: string;
  title: string;
  className: string;
  subject: string;
  chapterName?: string;
  noteType: NoteType;
  designStyle: NoteDesignStyle;
  updatedAt: string;
  notes: GeneratedNotes;
  source?: 'local' | 'cloud';
}

export interface GeneratedQuiz {
  id?: string;
  title?: string;
  topic: string;
  chapterName?: string;
  subject?: string;
  track?: QuizTrack;
  level: string;
  difficulty?: QuizDifficulty;
  questionTypes?: QuizQuestionType[];
  timerMinutes?: number;
  questions: QuizQuestion[];
  source?: 'ai' | 'practice-set' | 'published';
  published?: boolean;
}

export type QuizUserAnswer =
  | { kind: 'choice'; selectedIndex: number }
  | { kind: 'text'; value: string }
  | { kind: 'match'; mapping: Record<number, string> };

export interface QuestionEvaluation {
  questionId: string;
  type: QuizQuestionType;
  subtopic: string;
  status: 'correct' | 'incorrect' | 'unanswered';
  userAnswerDisplay: string;
  correctAnswerDisplay: string;
  explanation: string;
}

export interface WeakTopicInsight {
  subtopic: string;
  missedCount: number;
  totalCount: number;
  accuracyPercent: number;
}

export interface QuizRevisionActivity {
  id: string;
  title: string;
  description: string;
  actionType: 'notes' | 'study-buddy' | 'retake-weak' | 'explore';
  targetTopic: string;
}

export interface QuizEvaluationResult {
  total: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  score: number;
  percentage: number;
  timeTakenSeconds: number;
  feedback: string;
  questionResults: QuestionEvaluation[];
  weakTopics: WeakTopicInsight[];
}

export interface StudyPlanBlock {
  id: string;
  timeSlot: string;
  duration: string;
  subject: string;
  activityType: 'Concept Video' | 'Active Practice' | 'Revision' | 'Short Break';
  task: string;
  tip: string;
}

export interface GeneratedStudyPlan {
  goal: string;
  timelineDays: number;
  dailyHours: number;
  strategySummary: string;
  dailyBlocks: StudyPlanBlock[];
  weeklyMilestones: string[];
}

export interface QuizAttemptRecord {
  id: string;
  topic: string;
  title?: string;
  subject?: string;
  level?: string;
  difficulty?: QuizDifficulty;
  score: number;
  correct?: number;
  incorrect?: number;
  unanswered?: number;
  total: number;
  percentage: number;
  timeTakenSeconds?: number;
  weakTopics?: string[];
  completedAt: string;
  quizSnapshot?: GeneratedQuiz;
  source?: 'local' | 'cloud';
}

export interface PracticeSetRecord {
  id: string;
  title: string;
  subject: string;
  level: string;
  difficulty: QuizDifficulty;
  createdAt: string;
  quiz: GeneratedQuiz;
  isBuiltIn?: boolean;
}

export interface PublishedQuizRecord {
  id: string;
  title: string;
  track: QuizTrack;
  level: string;
  subject: string;
  chapterName?: string;
  topic: string;
  difficulty: QuizDifficulty;
  timerMinutes: number;
  published: boolean;
  quiz: GeneratedQuiz;
  createdBy: string;
  updatedAt: string;
}

export type MembershipPlanId = 'free' | 'student' | 'pro';

export type LearningPackageId = string;

export interface MembershipOffer {
  active: boolean;
  label: string;
  discountPercent: number;
  note: string;
}

export interface MembershipPlan {
  id: MembershipPlanId;
  name: string;
  tagline: string;
  priceInr: number;
  billingCycle: 'forever' | 'month';
  badge?: string;
  recommended?: boolean;
  aiDailyLimit: number;
  features: string[];
  benefits: string[];
  usageLimits: string[];
  offer: MembershipOffer;
  active: boolean;
}

export interface LearningPackageExamGroup {
  name: string;
  subjects: string[];
  highlights: string[];
}

export interface LearningPackage {
  id: LearningPackageId;
  name: string;
  shortLabel: string;
  tagline: string;
  description: string;
  targetAudience: string;
  categoryLink: Exclude<LearningCategory, 'all'>;
  subjects: string[];
  includedResources: string[];
  examGroups?: LearningPackageExamGroup[];
  featuredModules: string[];
  active: boolean;
}

export interface PaymentConfirmationProof {
  gatewayActive: boolean;
  verifiedByServer: boolean;
  planId: MembershipPlanId;
  receiptId: string;
}

export interface StudentProfile {
  displayName: string;
  level: LearningLevel;
  watchedLessonIds: string[];
  favouriteLessonIds: string[];
  recentLessonIds: string[];
  quizHistory: QuizAttemptRecord[];
  completedPlanBlockIds: string[];
  membershipPlanId?: MembershipPlanId;
  selectedPackageId?: LearningPackageId;
  language?: string;
}

export type LectureSourceType = 'youtube' | 'original' | 'teacher';

export type LectureApprovalStatus = 'pending' | 'approved' | 'rejected';

export type LectureCategory =
  | 'Classes 1-5'
  | 'Classes 6-8'
  | 'Classes 9-10'
  | 'Classes 11-12'
  | 'JEE'
  | 'NEET'
  | 'UPSC'
  | 'College Education'
  | 'Skill Development'
  | 'Language Learning'
  | 'General Knowledge';

export interface LectureItem {
  id: string;
  title: string;
  description: string;
  sourceType: LectureSourceType;
  category: LectureCategory;
  className: string;
  subject: string;
  chapterNumber: number;
  chapterName: string;
  teacherName: string;
  channelName?: string;
  duration: string;
  videoUrl: string;
  thumbnailUrl: string;
  notesSummary?: string;
  notesPdfUrl?: string;
  featured: boolean;
  approvalStatus: LectureApprovalStatus;
  rejectionReason?: string;
  published: boolean;
  submittedByUid: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeacherRecord {
  uid: string;
  displayName: string;
  specialization: string;
  verified: boolean;
  updatedAt?: string;
}

export interface MemberAccessRecord {
  userId: string;
  planId: MembershipPlanId;
  status: 'active' | 'inactive' | 'expired';
  updatedBy?: string;
  updatedAt?: string;
}

export interface FirebaseAuthUser {
  uid: string;
  displayName: string;
  email: string | null;
  emailVerified: boolean;
  photoURL: string | null;
  isAdmin: boolean;
  isVerifiedTeacher?: boolean;
  activeMembershipPlan?: MembershipPlanId;
  hasActivePaidMembership?: boolean;
}
